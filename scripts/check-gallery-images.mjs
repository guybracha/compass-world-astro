#!/usr/bin/env node
/**
 * בדיקת שדות image בתוכן לעומת קבצים ב-public/legacy/gallery
 * שימוש:
 *  node scripts/check-gallery-images.mjs             # דוח בלבד
 *  node scripts/check-gallery-images.mjs --write     # לתקן מיידית (אם מדובר רק בהפרש סיומת)
 *
 * פרמטרים:
 *  --contentDir=src/content/gallery   נתיב לתיקיית התוכן
 *  --publicDir=public                 נתיב לתיקיית public
 *  --gallerySub=legacy/gallery        תת-תיקייה בה מאוחסנות התמונות
 */

import fs from "fs/promises";
import path from "node:path";
import matter from "gray-matter";
import fg from "fast-glob";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    if (a === "--write") return ["write", true];
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const CONTENT_DIR = args.contentDir || "src/content/gallery";
const PUBLIC_DIR  = args.publicDir  || "public";
const GALLERY_SUB = args.gallerySub || "legacy/gallery";
const WRITE = !!args.write;

const IMG_EXTS = ["png","webp","jpg","jpeg","gif","svg"];

const log = {
  ok:    (...m)=>console.log("✅", ...m),
  miss:  (...m)=>console.log("❌", ...m),
  sug:   (...m)=>console.log("🟡", ...m),
  info:  (...m)=>console.log("ℹ️", ...m),
  fix:   (...m)=>console.log("✏️", ...m),
};

/** בדיקה אם קובץ קיים */
async function exists(fp) {
  try { await fs.access(fp); return true; } catch { return false; }
}

/** החזרת ערך image מתוך קובץ תוכן (md/mdx/yaml/json) */
function extractImageField(filePath, raw) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".json") {
    try { return JSON.parse(raw)?.image ?? null; } catch { return null; }
  }
  // md/mdx/yaml: ננסה gray-matter
  try {
    const fm = matter(raw);
    if (fm?.data?.image != null) return fm.data.image;
  } catch (_) {}

  // גיבוי: חיפוש שורה של image: ...
  const m = raw.match(/^\s*image\s*:\s*(.+)$/m);
  if (!m) return null;

  // ננקה מרכאות
  let v = m[1].trim();
  // תמיכה בתחביר image("...") של Astro (frontmatter)
  const m2 = v.match(/image\s*\(\s*["']([^"']+)["']\s*\)/);
  if (m2) return m2[1];

  // הסר מרכאות היקפיות
  v = v.replace(/^['"]|['"]$/g, "");
  return v;
}

/** תיקון השורה image: בקובץ md/mdx/yaml (רק שינוי סיומת/נתיב) */
function replaceImageValue(raw, newVal) {
  // נעדיף להחליף את הערך שקיים אחרי image:
  if (raw.includes("image(")) {
    // החלף בתוך image("...")
    return raw.replace(/image\s*\(\s*["'][^"']+["']\s*\)/, `image("${newVal}")`);
  }
  // החלף אחרי image:
  if (raw.match(/^\s*image\s*:/m)) {
    return raw.replace(/(^\s*image\s*:\s*)(.+)$/m, (_, p1) => `${p1}${JSON.stringify(newVal)}`);
  }
  return raw; // לא מצאנו — נשאיר כמו שהוא
}

/** מציאת קובץ בפועל כאשר חסרה סיומת נכונה */
async function tryResolveByExt(publicRoot, imgPath) {
  // imgPath יכול להתחיל ב'/' — נסיר אותו בשביל יצירת הנתיב המלא
  const rel = imgPath.replace(/^\/+/, "");
  const full = path.join(publicRoot, rel);
  const dir = path.dirname(full);
  const stem = path.basename(full, path.extname(full));

  for (const ext of IMG_EXTS) {
    const tryPath = path.join(dir, `${stem}.${ext}`);
    if (await exists(tryPath)) return {
      abs: tryPath,
      rel: "/" + path.relative(publicRoot, tryPath).replace(/\\/g, "/"),
    };
  }
  return null;
}

/** אם הערך הוא יחסי בלי סלאש מוביל, ננרמל ל-"/" */
function normalizeLeadingSlash(v) {
  if (typeof v !== "string") return v;
  if (/^https?:\/\//i.test(v)) return v; // URL חיצוני
  return v.startsWith("/") ? v : `/${v}`;
}

async function main() {
  const contentFiles = await fg(["**/*.{md,mdx,mdoc,yaml,yml,json}"], { cwd: CONTENT_DIR, absolute: true });

  if (contentFiles.length === 0) {
    log.info(`לא נמצאו קבצי תוכן ב-${CONTENT_DIR}`);
    process.exit(0);
  }

  const publicRoot = path.resolve(PUBLIC_DIR);
  const galleryDir = path.join(publicRoot, GALLERY_SUB);
  if (!await exists(galleryDir)) {
    log.miss(`תיקיית התמונות לא קיימת: ${galleryDir}`);
    process.exit(1);
  }

  let okCount = 0, fixable = 0, missing = 0;

  for (const file of contentFiles) {
    const raw = await fs.readFile(file, "utf8");
    const imgField = extractImageField(file, raw);

    if (!imgField) {
      log.sug(path.relative(process.cwd(), file), "— אין שדה image (מדלג).");
      continue;
    }

    // תמיכה במקרה של אובייקט — לא נטפל (זה יסתדר בזמן build)
    if (typeof imgField !== "string") {
      log.ok(path.relative(process.cwd(), file), "— image הוא אובייקט (תקין).");
      okCount++;
      continue;
    }

    // נרמול השדה
    const normalized = normalizeLeadingSlash(imgField);
    const abs = path.join(publicRoot, normalized.replace(/^\/+/, ""));

    if (await exists(abs)) {
      log.ok(path.relative(process.cwd(), file), "→", normalized);
      okCount++;
      continue;
    }

    // אם לא קיים — ננסה למצוא את אותה הליבה עם סיומת אחרת
    const candidate = await tryResolveByExt(publicRoot, normalized);
    if (candidate) {
      log.sug(path.relative(process.cwd(), file), "חסר:", normalized, " | נמצא קיים:", candidate.rel);

      // לתקן רק אם ההבדל הוא בסיומת/שם מלא באותה ספרייה
      if (WRITE) {
        const updatedRaw = replaceImageValue(raw, candidate.rel);
        if (updatedRaw !== raw) {
          await fs.writeFile(file, updatedRaw, "utf8");
          log.fix("תוקן בקובץ:", path.relative(process.cwd(), file), "→", candidate.rel);
          fixable++;
        } else {
          log.sug("לא הצלחתי לעדכן אוטומטית (frontmatter לא סטנדרטי):", path.relative(process.cwd(), file));
          missing++;
        }
      } else {
        fixable++;
      }
      continue;
    }

    // לא נמצא בכלל
    log.miss(path.relative(process.cwd(), file), "— התמונה לא נמצאה:", normalized);
    missing++;
  }

  console.log("\n— סיכום —");
  console.log(`✅ תקינים: ${okCount}`);
  console.log(`🟡 ברי-תיקון (סיומת/שם): ${fixable}${WRITE ? " (תוקנו)" : ""}`);
  console.log(`❌ חסרים: ${missing}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
