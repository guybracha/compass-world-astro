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
  type: 'content',
  schema: z.object({
    title: z.string(),
    image: z.string(),
    caption: z.string().optional(),
    tags: z.array(z.string()).default([]),
    sourceUrl: z.string().optional(),
    updated: z.string().optional(),
  }),
});

/** ✅ חדש: Prime Children – גם דף סקירה וגם פרופילים קצרים של חברים בולטים */
const primeChildren = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),            // לדף הסקירה
    name: z.string().optional(),  // לפרופיל של חבר
    role: z.string().optional(),
    image: z.string().optional(),
    summary: z.string().optional(),
    tags: z.array(z.string()).default([]),
    kind: z.enum(['overview','member']).default('member'),
  }),
});

/** ✅ חדש: Villains – הן ארגונים (org) והן דמויות (leader/member) */
const villains = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),                       // שם ארגון/כותרת
    kind: z.enum(['org','leader','member']).default('member'),
    org: z.string().optional(),              // אם זו דמות — לאיזה ארגון שייכת
    leaders: z.array(z.string()).optional(), // אם זה org — שמות מנהיגים
    focus: z.string().optional(),
    image: z.string().optional(),
    summary: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = {
  characters, atlas, ideas, pages, gallery, primeChildren, villains
};
