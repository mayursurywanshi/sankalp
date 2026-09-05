import { z } from "zod";

export const adminSearchQuerySchema = z.object({
  query: z.string().trim().min(2, "Enter at least 2 characters").max(100),
});
