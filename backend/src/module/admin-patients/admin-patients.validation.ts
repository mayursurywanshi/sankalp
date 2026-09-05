import { z } from "zod";
import { parseDisplayDate } from "../admin-appointments/admin-appointments.validation";

const displayDate = z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Use DD-MM-YYYY format").refine(parseDisplayDate, "Enter a valid date");
const optionalEmail = z.union([z.literal(""), z.string().trim().email("Enter a valid email address").max(120)]).optional();

export const patientListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(["ACTIVE", "FOLLOW_UP", "INACTIVE"]).optional(),
  ageGroup: z.enum(["0-2", "2-4", "4-6", "6-8", "8-10", "10-12", "12+"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const createPatientSchema = z.object({
  patientName: z.string().trim().min(2).max(80),
  dateOfBirth: displayDate,
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  parentName: z.string().trim().min(2).max(80),
  primaryPhone: z.string().trim().regex(/^\+?[0-9\s-]{10,20}$/, "Enter a valid phone number"),
  email: optionalEmail,
});

export const updatePatientSchema = createPatientSchema.partial().extend({ isActive: z.boolean().optional() });
export const patientIdSchema = z.string().regex(/^PAT\d{6}$/, "Enter a valid Patient ID");
export type PatientListQuery = z.infer<typeof patientListQuerySchema>;
