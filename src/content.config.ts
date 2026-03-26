import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: '**/[^_]*.md', base: "./src/content/blog" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		author: z.string().default('Linespedia Team'),
		category: z.string().optional(),
		tags: z.array(z.string()).optional(),
	}),
});

const poems = defineCollection({
    loader: async () => {
        const { default: data } = await import('./content/poems.json');
        return data.map((item: any) => ({
            id: item.id,
            ...item
        }));
    },
    schema: z.object({
        id: z.string(),
        slug: z.string(),
        title: z.string(),
        content: z.string(),
        writer: z.string(),
        category: z.array(z.string()),
        meaning: z.string().optional(),
        meta: z.object({
            views: z.number().optional(),
            dates: z.string().nullable().optional(),
            source: z.string().optional()
        }).optional()
    })
});

export const collections = { blog, poems };
