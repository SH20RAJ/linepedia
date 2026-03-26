import { defineCollection, z } from 'astro:content';

const writers = defineCollection({
  schema: z.object({
    name: z.string(),
    photo: z.string(),
    bio: z.string(),
    stats: z.object({
      poems: z.number(),
    }).optional(),
  }),
});

const categories = defineCollection({
  schema: z.object({
    name: z.string(),
    description: z.string(),
    seoIntro: z.string().optional(),
    icon: z.string().optional(),
  }),
});

const collections = defineCollection({
  schema: z.object({
    name: z.string(),
    description: z.string(),
    seoIntro: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { writers, categories, collections };
