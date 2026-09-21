import { z } from "zod";

export const contactReferenceSchema = z
  .string()
  .regex(/^SC-[A-F0-9]{8}$/, "Enter a valid contact request reference");

export const contactRequestListSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED"]).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const contactAssignmentSchema = z.object({
  doctorId: z.string().regex(/^DOC\d{6}$/, "Enter a valid Doctor ID"),
  note: z.string().trim().max(1000).optional(),
});

export const contactFollowUpSchema = z.object({
  method: z.enum(["CALL", "WHATSAPP", "EMAIL"]),
  note: z.string().trim().max(1000).optional(),
});

export const contactStatusSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED"]),
  note: z.string().trim().max(1000).optional(),
});

export const contactAppointmentSchema = z.object({
  childName: z.string().trim().min(2).max(80),
  childAge: z.string().trim().min(1).max(30),
  childDateOfBirth: z.iso.date("Enter a valid date of birth").optional(),
  preferredDate: z.iso.date("Enter a valid preferred date"),
  consent: z.literal(true, {
    error: "Confirm that the parent consented to appointment contact",
  }),
});

export type ContactRequestListInput = z.infer<typeof contactRequestListSchema>;
export type ContactAssignmentInput = z.infer<typeof contactAssignmentSchema>;
export type ContactFollowUpInput = z.infer<typeof contactFollowUpSchema>;
export type ContactStatusInput = z.infer<typeof contactStatusSchema>;
export type ContactAppointmentInput = z.infer<typeof contactAppointmentSchema>;
