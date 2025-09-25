import { defineCollection, z } from 'astro:content';

const characters = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    role: z.string().optional(),
    team: z.string().optional(),
    image: z.string().optional(),
    summary: z.string().optional(),
    tags: z.array(z.string()).default([]),
    updated: z.string().optional(),
  }),
});

const atlas = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    region: z.string().optional(),
    image: z.string().optional(),
    description: z.string().optional(),
    updated: z.string().optional(),
  }),
});

const ideas = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    firstMention: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(),
    risk: z.string().optional(),
    image: z.string().optional(),
    summary: z.string().optional(),
  }),
});

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
  }),
});

const gallery = defineCollection({
  schema: z.object({
    title: z.string(),
    caption: z.string().optional(),
    image: z.union([z.string(), z.object({ src: z.string(), width: z.number(), height: z.number(), format: z.string() })]),
    tags: z.array(z.string()).optional(),
    sourceUrl: z.string().optional(),
    updated: z.string().optional(),
  }),
});

/** ✅ חדש: Prime Children – גם דף סקירה וגם פרופילים קצרים של חברים בולטים */
const primeChildren = defineCollection({
  type: "content",
  schema: z.object({
    name: z.string().optional(), // <- optional to prevent crashes
    alias: z.string().optional(),
    image: z.string().optional(),
    short: z.string().optional(),
    powers: z.array(z.string()).optional(),
    links: z.array(z.object({ label: z.string().optional(), href: z.string() })).optional(),
  }),
});


/** ✅ חדש: Villains – הן ארגונים (org) והן דמויות (leader/member) */
const villains = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string().min(1, "Missing title"), // כותרת תמיד נדרשת
    kind: z.enum(["org", "leader", "member"]).default("member"),
    org: z.string().optional(),                // אם זו דמות — שייכות לארגון
    leaders: z.array(z.string()).optional(),   // אם זה org — רשימת מנהיגים
    focus: z.string().optional(),              // דגש/תחום פעילות
    image: z.string().optional(),              // תמונה ל־OG ולדף
    summary: z.string().optional(),            // תקציר לתצוגה ברשימות
    tags: z.array(z.string()).default([]),     // תגיות (ברירת מחדל: [])
  }),
});

const history = defineCollection({
  type: 'content',
  schema: z.object({
    year: z.string(),
    description: z.string(),
    image: z.string().optional(),
    order: z.number().optional(),  // נסדר לפי זה
    updated: z.string().optional(),
  }),
});

const comics = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),                 // כותרת בעברית (חובה)
    summary: z.string().optional(),    // תיאור קצר בעברית (אופציונלי)
    number: z.number().int().optional(), // מספר פרק (אופציונלי)
    date: z.string().optional(),       // תאריך ISO (YYYY-MM-DD) או כל מחרוזת תאריך
    cover: z.string().optional(),      // נתיב עטיפה
    pages: z.array(z.string()).default([]), // עמודי הקומיקס (נתיבים)
    tags: z.array(z.string()).default([]),  // תגיות בעברית
    // אופציונלי: שדות לאנגלית אם תרצה בעתיד, לא בשימוש כעת
    title_en: z.string().optional(),
    summary_en: z.string().optional(),
  }),
});

export const collections = {
  characters, atlas, ideas, pages, gallery, primeChildren, villains, history, comics,
};
