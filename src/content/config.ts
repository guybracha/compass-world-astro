import { defineCollection, z } from 'astro:content';

const characters = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    role: z.string().optional(),         // e.g., "Team Leader"
    powers: z.array(z.string()).default([]),
    team: z.string().optional(),
    image: z.string().optional(),        // /img/characters/xxx.webp
    summary: z.string().max(300),
    updated: z.string().optional(),      // YYYY-MM-DD
  }),
});

const history = defineCollection({
  type: 'content',
  schema: z.object({
    year: z.string(),                    // "750 BC" / "1799"
    slug: z.string(),
    image: z.string().optional(),        // /img/history/xxx.webp
    description: z.string(),
    updated: z.string().optional(),
  }),
});

export const collections = { characters, history };
