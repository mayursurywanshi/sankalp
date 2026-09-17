import { z } from "zod";

export const eligiblePatientQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
});

export const createFeedbackInvitationSchema = z.object({
  patientId: z.string().regex(/^PAT\d{6}$/, "Enter a valid Patient ID"),
  appointmentReferenceId: z.string().regex(/^APT-[A-F0-9]{8}$/, "Enter a valid appointment reference").optional(),
});

export const feedbackVerificationQuerySchema = z.object({
  patientId: z.string().regex(/^PAT\d{6}$/, "Enter a valid Patient ID"),
  appointmentReferenceId: z.string().regex(/^APT-[A-F0-9]{8}$/, "Enter a valid appointment reference"),
});

export const invitationReferenceSchema = z.string().regex(/^FDB-[A-F0-9]{8}$/, "Enter a valid feedback reference");
export const responseIdSchema = z.string().uuid("Enter a valid feedback response ID");

export const invitationListQuerySchema = z.object({
  status: z.enum(["CREATED", "SENT", "OPENED", "SUBMITTED", "EXPIRED", "CANCELLED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const responseListQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const moderateFeedbackSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export type InvitationListQuery = z.infer<typeof invitationListQuerySchema>;
export type ResponseListQuery = z.infer<typeof responseListQuerySchema>;
