import { defineCollection, z } from 'astro:content';

const courses = defineCollection({
  type: 'content',
  schema: z.object({
    title:        z.string(),
    description:  z.string(),
    track:        z.string(),
    difficulty:   z.enum(['beginner', 'intermediate', 'advanced', 'draft']),
    modules:      z.number(),
    duration:     z.string(),
    updatedAt:    z.string(),
    status:       z.enum(['added', 'modified', 'attention', 'stable']),
    tags:         z.array(z.string()),
    stars:        z.number().optional(),
    version:      z.string(),
    maintainer:   z.string(),
    repo:         z.string(),
    prerequisites:z.array(z.string()).default([]),
    language:     z.string().default('en'),
  }),
});

export const collections = { courses };
