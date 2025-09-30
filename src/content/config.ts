// src/content/config.ts
import { defineCollection, z } from 'astro:content';

/** Shared meta */
const baseMeta = {
  summary: z.string().optional(),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  weight: z.number().default(0),
  cover: z.string().optional(),
  updated: z.string().optional(),
};

/* =============================================================================
   Collections
   ============================================================================= */

const characters = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    role: z.string().optional(),
    team: z.string().optional(),
    image: z.string().optional(),
    ...baseMeta,
  }),
});

const atlas = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    region: z.string().optional(),
    image: z.string().optional(),
    description: z.string().optional(),
    ...baseMeta,
  }),
});

const ideas = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    firstMention: z.string().optional(),
    category: z.string().optional(),
    risk: z.string().optional(),
    image: z.string().optional(),
    ...baseMeta,
  }),
});

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    ...baseMeta,
  }),
});

const gallery = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    caption: z.string().optional(),
    image: z.union([
      z.string(),
      z.object({ src: z.string(), width: z.number(), height: z.number(), format: z.string() })
    ]),
    sourceUrl: z.string().optional(),
    ...baseMeta,
  }),
});

/** ✅ Prime Children – overview + short profiles */
const primeChildren = defineCollection({
  type: 'content',
  schema: z.object({
    // מזהה/כותרת
    title: z.string().optional(),   // שימושי בעיקר ל-overview
    name: z.string().optional(),    // שם תצוגה לדמויות
    alias: z.string().optional(),

    // מדיה/טקסט קצר
    image: z.string().optional(),
    short: z.string().optional(),

    // כוח/צד/טיפוס
    power: z.string().optional(),             // ← נדרש ע"י index.astro
    powers: z.array(z.string()).optional(),   // אם תרצה גם רבים—לא חובה לשימוש בדף
    side: z.string().optional(),              // "גיבור" / "נבל" או ריק
    kind: z.enum(['overview', 'member']).default('member'),

    // קישורים חיצוניים אופציונליים
    links: z.array(z.object({ label: z.string().optional(), href: z.string() })).optional(),

    ...baseMeta, // summary/tags/featured/status/weight/cover/updated
  }),
});

/** ✅ Villains */
const villains = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1, 'Missing title'),
    kind: z.enum(['org', 'leader', 'member']).default('member'),
    org: z.string().optional(),
    leaders: z.array(z.string()).optional(),
    focus: z.string().optional(),
    image: z.string().optional(),
    summary: z.string().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    status: z.enum(['draft', 'published', 'archived']).default('published'),
    weight: z.number().default(0),
    cover: z.string().optional(),
    updated: z.string().optional(),
  }),
});

const history = defineCollection({
  type: 'content',
  schema: z.object({
    year: z.string(),
    description: z.string(),
    image: z.string().optional(),
    order: z.number().optional(),
    ...baseMeta,
  }),
});

const comics = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    number: z.number().int().optional(),
    date: z.string().optional(),
    cover: z.string().optional(),
    pages: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    title_en: z.string().optional(),
    summary_en: z.string().optional(),
    featured: z.boolean().default(false),
    status: z.enum(['draft', 'published', 'archived']).default('published'),
    weight: z.number().default(0),
    updated: z.string().optional(),
  }),
});

export const collections = {
  characters,
  atlas,
  ideas,
  pages,
  gallery,
  /** 👇 מזהה האוסף תואם ל-getCollection('prime-children') */
  'prime-children': primeChildren,
  villains,
  history,
  comics,
};

/* =============================================================================
   Helpers
   ============================================================================= */
export const isPublished = (entry: { data?: { status?: string } }) =>
  (entry?.data?.status ?? 'published') === 'published';

export const byFeaturedFirst = (a: any, b: any) => {
  const fa = !!a?.data?.featured; const fb = !!b?.data?.featured;
  if (fa !== fb) return fa ? -1 : 1;
  const wa = a?.data?.weight ?? 0; const wb = b?.data?.weight ?? 0;
  if (wa !== wb) return wb - wa;
  return String(a?.data?.title || a?.data?.name || '').localeCompare(
    String(b?.data?.title || b?.data?.name || ''), 'he'
  );
};

export type { CollectionEntry } from 'astro:content';
