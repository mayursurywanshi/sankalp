import { z } from "zod";

export const postIdSchema = z.string().uuid();

export const impactPostBodySchema = z.object({
  postType: z.enum(["SUCCESS_STORY", "PARENT_FEEDBACK"]),
  title: z.string().trim().min(3).max(150),
  story: z.string().trim().min(10).max(5000),
  status: z.enum(["PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
});

export const updateImpactPostBodySchema = impactPostBodySchema.partial();

export const impactPostListQuerySchema = z.object({
  type: z.enum(["SUCCESS_STORY", "PARENT_FEEDBACK"]).optional(),
  status: z.enum(["PUBLISHED", "ARCHIVED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type ImpactPostInput = z.infer<typeof impactPostBodySchema>;
export type UpdateImpactPostInput = z.infer<typeof updateImpactPostBodySchema>;
export type ImpactPostListQuery = z.infer<typeof impactPostListQuerySchema>;
