import { z } from "zod";

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters").max(80),
  phone: z.string().trim().regex(/^\+?[0-9\s()-]{7,20}$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email address").max(120),
  message: z.string().trim().min(10, "Message must contain at least 10 characters").max(1000),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
