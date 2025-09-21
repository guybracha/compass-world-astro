import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import slugify from 'slugify';
import JSON5 from 'json5';

const BASE = 'https://guybracha.github.io/compass-world';
const OUT_IMG = 'public/legacy';
const OUT_CONTENT = 'src/content';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const toSlug = (s) => slugify(s, { lower: true, strict: true, locale: 'en' });

async function ensureDirs() {
  await fs.mkdir(path.join(OUT_IMG), { recursive: true });
  await fs.mkdir(path.join(OUT_IMG, 'gallery'), { recursive: true });
  await fs.mkdir(path.join(OUT_CONTENT, 'characters'), { recursive: true });
  await fs.mkdir(path.join(OUT_CONTENT, 'atlas'), { recursive: true });
  await fs.mkdir(path.join(OUT_CONTENT, 'ideas'), { recursive: true });
  await fs.mkdir(path.join(OUT_CONTENT, 'pages'), { recursive: true });
  await fs.mkdir(path.join(OUT_CONTENT, 'gallery'), { recursive: true });
  await fs.mkdir(path.join(OUT_CONTENT, 'primeChildren'), { recursive: true }); // ✅ חדש
  await fs.mkdir(path.join(OUT_CONTENT, 'villains'), { recursive: true });      // ✅ חדש
  await fs.mkdir(path.join(OUT_CONTENT, 'history'), { recursive: true });
  await fs.mkdir(path.join(OUT_IMG, 'history'), { recursive: true });
}

async function fetchHtml(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${url}: ${res.status}`);
  return await res.text();
}

async function downloadImage(absUrl, fileNameHint = '', subdir = '') {
  try {
    const res = await fetch(absUrl);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    const ext = ct.includes('webp') ? '.webp'
              : ct.includes('png')  ? '.png'
              : (ct.includes('jpeg') || ct.includes('jpg')) ? '.jpg'
              : path.extname(new URL(absUrl).pathname) || '.webp';

    const baseName = toSlug(fileNameHint || path.basename(new URL(absUrl).pathname).replace(/\.[a-z]+$/i,''));
    const fileName = `${baseName}${ext}`;
    const dirOnDisk = path.join(OUT_IMG, subdir || '');
    const relDir = subdir ? `/legacy/${subdir}` : `/legacy`;
    await fs.mkdir(dirOnDisk, { recursive: true });

    const outPath = path.join(dirOnDisk, fileName);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(outPath, buf);
    return `${relDir}/${fileName}`;
  } catch {
    return null;
  }
}

function abs(href) {
  if (!href) return null;
  if (href.startsWith('http')) return href;
  return `${BASE}/${href.replace(/^\//,'')}`;
}

/* ---------- GODS & MONSTERS → characters ----------- */
async function migrateCharacters() {
  try {
    const html = await fetchHtml(`${BASE}/files.html`);
    const $ = cheerio.load(html);

    const founding = $('h3:contains("Founding")').next().text().trim()
      || $('p:contains("Founding")').next().text().trim();
    const joined = $('h3:contains("Joined")').next().text().trim()
      || $('p:contains("Joined")').next().text().trim();

    const splitNames = (s) =>
      (s || '')
        .replace(/\sand\s/gi, ', ')
        .split(',')
        .map(x => x.trim())
        .filter(Boolean);

    const foundingNames = splitNames(founding);
    const joinedNames = splitNames(joined);

    const all = [
      ...foundingNames.map(n => ({ name: n, role: 'Founding Member', team: 'Compass Alliance' })),
      ...joinedNames.map(n => ({ name: n, role: 'Member', team: 'Compass Alliance' })),
    ];

    for (const ch of all) {
      const slug = toSlug(ch.name);
      const fm = [
        '---',
        `name: ${JSON.stringify(ch.name)}`,
        `role: ${JSON.stringify(ch.role)}`,
        `team: ${JSON.stringify(ch.team)}`,
        `summary: ""`,
        `tags: []`,
        '---',
        '',
        `${ch.name} biography goes here.`,
        ''
      ].join('\n');
      await fs.writeFile(path.join(OUT_CONTENT, 'characters', `${slug}.mdx`), fm, 'utf8');
    }
    console.log(`characters: wrote ${all.length} files`);
  } catch (e) {
    console.warn('characters migration skipped/failed:', e.message);
  }
}

/* ------------- ATLAS → atlas ---------------- */
async function migrateAtlas() {
  try {
    const html = await fetchHtml(`${BASE}/world.html`);
    const $ = cheerio.load(html);

    const entries = [];
    $('h3').each((_, h3) => {
      const title = $(h3).text().trim();
      let region = '';
      $(h3).prevAll('h2').each((__, h2) => { region = $(h2).text().trim(); return false; });

      let description = '';
      const p = $(h3).next('p');
      if (p.length) description = p.text().trim();

      const prevImg = $(h3).prevAll('img').first().attr('src');
      const nextImg = $(h3).nextAll('img').first().attr('src');
      const imgSrc = prevImg || nextImg || null;

      entries.push({ title, region, description, imgSrc });
    });

    for (const e of entries) {
      let imagePath = null;
      if (e.imgSrc) {
        imagePath = await downloadImage(abs(e.imgSrc), e.title);
        await sleep(80);
      }
      const slug = toSlug(e.title);
      const fm = [
        '---',
        `title: ${JSON.stringify(e.title)}`,
        `region: ${JSON.stringify(e.region)}`,
        `image: ${imagePath ? JSON.stringify(imagePath) : '""'}`,
        `description: ${JSON.stringify(e.description || '')}`,
        '---',
        '',
        e.description || '',
        ''
      ].join('\n');
      await fs.writeFile(path.join(OUT_CONTENT, 'atlas', `${slug}.mdx`), fm, 'utf8');
    }
    console.log(`atlas: wrote ${entries.length} files`);
  } catch (e) {
    console.warn('atlas migration skipped/failed:', e.message);
  }
}

/* ------------- IDEAS → ideas ---------------- */
async function migrateIdeas() {
  try {
    const html = await fetchHtml(`${BASE}/ideas.html`);
    const $ = cheerio.load(html);

    const items = [];
    $('h3, h4').each((_, h) => {
      const title = $(h).text().trim();
      if (!title) return;

      let cur = $(h).next();
      const meta = {};
      let desc = '';

      for (let i = 0; i < 6 && cur.length; i++) {
        const t = cur.text().trim();
        if (!t) { cur = cur.next(); continue; }
        if (/First mention/i.test(t)) meta.firstMention = t.replace(/First mention:\s*/i, '').trim();
        if (/Status/i.test(t)) meta.status = t.replace(/Status:\s*/i, '').trim();
        if (/Danger|Risk/i.test(t)) meta.risk = t.replace(/(Danger|Risk):\s*/i, '').trim();
        if (!/:\s*/.test(t) && t.length > 12 && !desc) desc = t;
        cur = cur.next();
      }
      items.push({ title, ...meta, summary: desc });
    });

    for (const it of items) {
      const slug = toSlug(it.title);
      const fm = [
        '---',
        `title: ${JSON.stringify(it.title)}`,
        `firstMention: ${JSON.stringify(it.firstMention || '')}`,
        `category: ${JSON.stringify(it.category || '')}`,
        `status: ${JSON.stringify(it.status || '')}`,
        `risk: ${JSON.stringify(it.risk || '')}`,
        `summary: ${JSON.stringify(it.summary || '')}`,
        '---',
        '',
        it.summary || '',
        ''
      ].join('\n');
      await fs.writeFile(path.join(OUT_CONTENT, 'ideas', `${slug}.mdx`), fm, 'utf8');
    }
    console.log(`ideas: wrote ${items.length} files`);
  } catch (e) {
    console.warn('ideas migration skipped/failed:', e.message);
  }
}

/* ------------- GALLERY → gallery -------------- */
async function migrateGallery() {
  try {
    const html = await fetchHtml(`${BASE}/gallery.html`);
    const $ = cheerio.load(html);

    const tagSet = new Set(
      $('[data-filter], [data-tag], .filter-btn, .filter button, .filters button')
        .map((_, el) => ($(el).attr('data-filter') || $(el).attr('data-tag') || $(el).text() || ''))
        .get()
        .map(t => t.replace(/[#\s]+/g, ' ').trim())
        .filter(Boolean)
        .map(t => t.toLowerCase())
    );

    const galleryRoots = $('#gallery, .gallery, main, body');
    const imgs = galleryRoots.find('img');

    const entries = [];
    imgs.each((_, img) => {
      const el = $(img);
      const src = el.attr('src') || '';
      if (!src) return;
      if (/logo|icon|sprite/i.test(src)) return;

      const alt = (el.attr('alt') || '').trim();
      const dataGroup = el.attr('data-group') || el.attr('data-tag') || el.attr('data-category') || '';
      const titleGuess = alt || path.basename(src).replace(/\.[a-z]+$/i, '').replace(/[-_]+/g, ' ');
      const captionGuess = alt || '';

      const tags = new Set();
      dataGroup.split(/[,\s/|]+/).forEach(t => t && tags.add(t.toLowerCase()));
      alt.split(/[,\s/|]+/).forEach(w => {
        const ww = w.toLowerCase();
        if (tagSet.has(ww)) tags.add(ww);
      });
      const parts = src.split('/');
      if (parts.length >= 2) tags.add((parts[parts.length - 2] || '').toLowerCase());

      entries.push({
        src,
        title: titleGuess || 'Untitled',
        caption: captionGuess,
        tags: Array.from(tags).filter(Boolean),
      });
    });

    let count = 0;
    for (const e of entries) {
      const absUrl = abs(e.src);
      const saved = await downloadImage(absUrl, e.title, 'gallery');
      if (!saved) continue;

      const slug = toSlug(e.title);
      const fm = [
        '---',
        `title: ${JSON.stringify(e.title)}`,
        `image: ${JSON.stringify(saved)}`,
        `caption: ${JSON.stringify(e.caption)}`,
        `tags: ${JSON.stringify(e.tags)}`,
        `sourceUrl: ${JSON.stringify(absUrl)}`,
        '---',
        '',
        e.caption || '',
        ''
      ].join('\n');

      await fs.writeFile(path.join(OUT_CONTENT, 'gallery', `${slug}.mdx`), fm, 'utf8');
      count++;
      await sleep(60);
    }

    console.log(`gallery: wrote ${count} files`);
  } catch (e) {
    console.warn('gallery migration skipped/failed:', e.message, '(אם אין gallery.html — זה צפוי)');
  }
}


/* ------------- PRIME CHILDREN (overview from primeChildren.html + members from files.html) -------- */
/* ------------- PRIME CHILDREN (overview from HTML + members from assets/scripts/primeChildren.js) -------- */
async function migratePrimeChildren() {
  // A) OVERVIEW מה-HTML (כמו קודם)
  try {
    const html = await fetchHtml(`${BASE}/primeChildren.html`);
    const $ = cheerio.load(html);

    const title =
      $('h1:contains("Prime"), h1:contains("Prime-Children"), h1').first().text().trim() ||
      'Prime-Children';
    const overviewParas = [];
    let cur = $('h1, h2').first().next();
    for (let i = 0; i < 20 && cur.length; i++) {
      const tag = (cur[0].tagName || '').toLowerCase();
      if (/^h[23]$/.test(tag)) break;
      if (tag === 'p' && cur.text().trim()) overviewParas.push(cur.text().trim());
      cur = cur.next();
    }
    const overviewBody = overviewParas.join('\n\n') || 'A generation of gifted beings reshaping the world.';
    const heroImg =
      $('img[alt*="Prime"], img[alt*="Prime-Children"], img').first().attr('src') || null;
    let heroPath = null;
    if (heroImg) heroPath = await downloadImage(abs(heroImg), 'prime-children-hero', 'prime-children');

    const overviewMdx = [
      '---',
      `title: ${JSON.stringify('Prime-Children Overview')}`,
      `kind: "overview"`,
      heroPath ? `image: ${JSON.stringify(heroPath)}` : null,
      '---',
      '',
      overviewBody,
      ''
    ].filter(Boolean).join('\n');

    await fs.writeFile(path.join(OUT_CONTENT, 'primeChildren', `overview.mdx`), overviewMdx, 'utf8');
    console.log('primeChildren: wrote overview');
  } catch (e) {
    console.warn('primeChildren overview skipped/failed:', e.message);
  }

  // B) MEMBERS מתוך הקובץ JS: מפרקים את CATS/SIDE ומחליפים רפרנסים (CATS.X / SIDE.Y) למחרוזות
  try {
    const jsUrl = `${BASE}/assets/scripts/primeChildren.js`;
    const jsText = await fetchHtml(jsUrl);

    // חילוץ האובייקטים CATS ו-SIDE
    const catsMatch = jsText.match(/const\s+CATS\s*=\s*({[\s\S]*?})\s*;/m);
    const sideMatch = jsText.match(/const\s+SIDE\s*=\s*({[\s\S]*?})\s*;/m);
    const catsMap = catsMatch ? JSON5.parse(catsMatch[1]) : {};
    const sideMap = sideMatch ? JSON5.parse(sideMatch[1]) : {};

    // חילוץ המערך characters
    const arrMatch = jsText.match(/const\s+characters\s*=\s*(\[[\s\S]*?\])\s*;/m);
    if (!arrMatch) {
      console.warn('primeChildren: could not locate `const characters = [...]` in primeChildren.js');
      return;
    }
    let arrText = arrMatch[1];

    // החלפת SIDE.HERO / SIDE.VILLAIN וכו' לערכים המפורשים ("Hero"/"Villain")
    arrText = arrText.replace(/SIDE\.([A-Z_]+)/g, (m, key) => JSON.stringify(sideMap[key] ?? key));

    // החלפת CATS.PRIME / CATS.TECH ... לערכים המפורשים ("Prime" וכו')
    arrText = arrText.replace(/CATS\.([A-Z_]+)/g, (m, key) => JSON.stringify(catsMap[key] ?? key));

    // עכשיו במערך נשארים רק ליטרלים (מפתחות לא מצוטטים זה בסדר ל-JSON5)
    let membersArr = JSON5.parse(arrText);
    if (!Array.isArray(membersArr)) {
      console.warn('primeChildren: parsed characters is not an array');
      return;
    }

    let wrote = 0;
    for (const item of membersArr) {
      const name = String(item.name || '').trim();
      if (!name) continue;

      const slug = toSlug(name);
      const summary = item.power ? String(item.power) : '';
      // tags: מחזירים בדיוק כפי שבקובץ + ה-side כמחרוזת
      const tags = []
        .concat(Array.isArray(item.tags) ? item.tags : [])
        .concat(item.side ? [String(item.side)] : []);

      // תמונה (יחסית → אבסולוטי → הורדה)
      let imagePath = null;
      const imgSrc = item.img || item.image || '';
      if (imgSrc) {
        imagePath = await downloadImage(abs(imgSrc), name, 'prime-children');
        await sleep(30);
      }

      const md = [
        '---',
        `title: ${JSON.stringify(name)}`,
        `name: ${JSON.stringify(name)}`,
        `kind: "member"`,
        imagePath ? `image: ${JSON.stringify(imagePath)}` : null,
        `tags: ${JSON.stringify(tags)}`,
        `summary: ${JSON.stringify(summary)}`,
        '---',
        '',
        summary || `${name} profile.`,
        ''
      ].filter(Boolean).join('\n');

      await fs.writeFile(path.join(OUT_CONTENT, 'primeChildren', `${slug}.mdx`), md, 'utf8');
      wrote++;
    }

    console.log(`primeChildren: wrote ${wrote} member files from primeChildren.js`);
  } catch (e) {
    console.warn('primeChildren members from JS skipped/failed:', e.message);
  }
}


/* ------------- VILLAINS (orgs + leaders) → villains ----- */
async function migrateVillains() {
  try {
    const html = await fetchHtml(`${BASE}/files.html`);
    const $ = cheerio.load(html);

    // The Pyramid
    let pyramidLeaders = [];
    $('h2,h3').each((_, el) => {
      const txt = $(el).text().trim();
      if (/The Pyramid/i.test(txt)) {
        // חפש bullet/line שאומר "Leaders: ..."
        let cur = $(el).next();
        for (let i=0; i<8 && cur.length; i++) {
          const t = cur.text().trim();
          if (/Leaders:/i.test(t)) {
            pyramidLeaders = t.replace(/Leaders:\s*/i,'')
              .replace(/\sand\s/gi, ', ')
              .split(',')
              .map(s => s.trim())
              .filter(Boolean);
            break;
          }
          cur = cur.next();
        }
      }
    });

    // כתוב קובץ org ל־Pyramid
    const pyramidOrg = [
      '---',
      `title: "The Pyramid"`,
      `kind: "org"`,
      `leaders: ${JSON.stringify(pyramidLeaders)}`,
      `summary: "A shadowy organization pulling strings across politics, tech, and mystic artifacts."`,
      `tags: ["villain-org"]`,
      '---',
      '',
      'A shadowy organization pulling strings across politics, tech, and mystic artifacts.',
      ''
    ].join('\n');
    await fs.writeFile(path.join(OUT_CONTENT, 'villains', `the-pyramid.mdx`), pyramidOrg, 'utf8');

    // כתוב קבצי מנהיגים
    for (const leader of pyramidLeaders) {
      const slug = toSlug(leader);
      const md = [
        '---',
        `title: ${JSON.stringify(leader)}`,
        `kind: "leader"`,
        `org: "The Pyramid"`,
        `summary: ""`,
        `tags: ["villain","pyramid"]`,
        '---',
        '',
        `${leader} — leader in The Pyramid.`,
        ''
      ].join('\n');
      await fs.writeFile(path.join(OUT_CONTENT, 'villains', `${slug}.mdx`), md, 'utf8');
    }

    // Vasco Corporation (ארגון נייטרלי-מפוקפק)
    // ניקח תקציר מהעמוד (focus + alignment)
    const vascoOrg = [
      '---',
      `title: "Vasco Corporation"`,
      `kind: "org"`,
      `summary: "A secretive megacorp researching multiverse and interdimensional rifts; officially neutral, secretly manipulative."`,
      `tags: ["villain-org","megacorp","vasco"]`,
      '---',
      '',
      'Using immense resources in science, technology and shadow diplomacy, Vasco leads projects aimed at discovering parallel universes and exploiting interdimensional rifts.',
      ''
    ].join('\n');
    await fs.writeFile(path.join(OUT_CONTENT, 'villains', `vasco-corporation.mdx`), vascoOrg, 'utf8');

    console.log(`villains: wrote org + ${pyramidLeaders.length} leaders`);
  } catch (e) {
    console.warn('villains migration skipped/failed:', e.message);
  }
}

/* ------------- HOME + AUTHOR → pages -------- */
async function migratePages() {
  try {
    // HOME
    {
      const html = await fetchHtml(`${BASE}/`);
      const $ = cheerio.load(html);
      const h1 = $('h1,h2').first().text().trim();
      const p = $('p').first().text().trim();
      const heroImg = $('img[alt*="Compass Alliance"], img[alt*="poster"]').first().attr('src') || null;
      let imagePath = null;
      if (heroImg) imagePath = await downloadImage(abs(heroImg), 'home-hero');
      const md = [
        '---',
        `title: ${JSON.stringify(h1 || 'Homepage')}`,
        `summary: ${JSON.stringify(p || '')}`,
        '---',
        '',
        p || '',
        imagePath ? `\n![Hero](${imagePath})\n` : '',
        ''
      ].join('\n');
      await fs.writeFile(path.join(OUT_CONTENT, 'pages', `home.mdx`), md, 'utf8');
    }

    // AUTHOR
    {
      const html = await fetchHtml(`${BASE}/about.html`);
      const $ = cheerio.load(html);
      const title = $('h1,h2').first().text().trim() || 'Author';
      const about = $('p').first().text().trim();
      const authorImg = $('img').eq(1).attr('src') || $('img').first().attr('src');
      let imagePath = null;
      if (authorImg) imagePath = await downloadImage(abs(authorImg), 'author');
      const md = [
        '---',
        `title: ${JSON.stringify(title)}`,
        `summary: ${JSON.stringify(about || '')}`,
        '---',
        '',
        about || '',
        imagePath ? `\n![Author](${imagePath})\n` : '',
        ''
      ].join('\n');
      await fs.writeFile(path.join(OUT_CONTENT, 'pages', `author.mdx`), md, 'utf8');
    }

    console.log('pages: wrote home + author');
  } catch (e) {
    console.warn('pages migration skipped/failed:', e.message);
  }
}

/* ------------- HISTORY → history ---------------- */
async function migrateHistory() {
  // נסיון להביא את הקובץ מהאתר הישן (שנה/הוסף נתיבים אם צריך)
  const candidates = [
    `${BASE}/assets/scripts/historyJson.js`,
    `${BASE}/assets/historyJson.js`,
    `${BASE}/historyJson.js`
  ];

  let txt = null;
  for (const url of candidates) {
    try {
      txt = await fetchHtml(url);
      if (txt) { console.log('history: loaded', url); break; }
    } catch {}
  }

  // אופציה: קריאה מקומית אם שמרת את הקובץ בפרויקט
  if (!txt) {
    try {
      txt = await fs.readFile('legacy/historyJson.js', 'utf8'); // שנה מיקום אם צריך
      console.log('history: loaded local legacy/historyJson.js');
    } catch {}
  }

  if (!txt) { console.warn('history: file not found, skipping'); return; }

  // חילוץ המערך HistoryList מתוך קובץ JS
  let list = [];
  try {
    const fn = new Function(`${txt}; return (typeof HistoryList!=='undefined') ? HistoryList : [];`);
    list = fn();
  } catch (e) {
    // נסיון גיבוי עם רג׳קס
    const m = txt.match(/HistoryList\s*=\s*(\[[\s\S]*?\]);/);
    if (m) {
      try { list = JSON.parse(m[1]); } catch {}
    }
  }

  if (!Array.isArray(list) || !list.length) {
    console.warn('history: no items parsed, skipping');
    return;
  }

  let written = 0;
  for (let i = 0; i < list.length; i++) {
    const it = list[i] || {};
    const year = String(it.year || '').trim();
    const description = String(it.description || '').trim();
    const imgSrc = it.image ? abs(it.image) : null;

    // הורדת תמונה (אם קיימת)
    let imagePath = null;
    if (imgSrc) {
      imagePath = await downloadImage(imgSrc, year || `history-${i+1}`, 'history');
      await sleep(60);
    }

    // שם קובץ עם אינדקס לשמירה על הסדר הכרונולוגי
    const slug = `${String(i + 1).padStart(3, '0')}-${toSlug(year || `entry-${i+1}`)}`;

    const fm = [
      '---',
      `year: ${JSON.stringify(year)}`,
      `description: ${JSON.stringify(description)}`,
      `image: ${imagePath ? JSON.stringify(imagePath) : '""'}`,
      `order: ${i + 1}`,
      '---',
      '',
      description,
      ''
    ].join('\n');

    await fs.writeFile(path.join(OUT_CONTENT, 'history', `${slug}.mdx`), fm, 'utf8');
    written++;
  }

  console.log(`history: wrote ${written} files`);
}


/* ------------- MAIN ---------------- */
(async () => {
  await ensureDirs();
  await migrateCharacters();
  await migrateAtlas();
  await migrateIdeas();
  await migrateGallery();
  await migratePrimeChildren();   // ✅ חדש
  await migrateVillains();        // ✅ חדש
  await migratePages();
  await migrateHistory();
  console.log('✅ Migration done.');
})();
