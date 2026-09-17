import { z } from "zod";

export const feedbackTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{12}$/, "This feedback link is invalid");

export const submitFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().trim().min(10, "Feedback must contain at least 10 characters").max(2000),
  parentDisplayName: z.string().trim().min(2).max(80),
  consentToPublish: z.boolean(),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
