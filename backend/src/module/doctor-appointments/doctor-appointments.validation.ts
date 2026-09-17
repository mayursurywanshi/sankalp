import { z } from "zod";
import { parseDisplayDate } from "../admin-appointments/admin-appointments.validation";
import { APPOINTMENT_TIME_SLOTS } from "../../constants/appointments.constants";

const dateField = z
  .string()
  .regex(/^\d{2}-\d{2}-\d{4}$/, "Use DD-MM-YYYY format")
  .refine(parseDisplayDate, "Enter a valid date");
const optionalText = z.string().trim().max(5000).optional();

export const caseHistorySchema = z.object({
  appointmentDate: dateField,
  nextAppointmentDate: dateField.optional(),
  presentingConcern: optionalText,
  medicalHistory: optionalText,
  assessment: optionalText,
  treatmentProvided: optionalText,
  therapyGoals: optionalText,
  progressNotes: optionalText,
  homeProgram: optionalText,
  recommendations: optionalText,
  caseHistory: z.string().trim().min(5, "Case history is required").max(10000),
  additionalNotes: optionalText,
});

export const caseHistoryUpdateSchema = caseHistorySchema
  .partial()
  .omit({ appointmentDate: true });
export const caseHistoryIdSchema = z
  .string()
  .uuid("Enter a valid case-history ID");
export const doctorAvailabilityQuerySchema = z.object({ date: dateField });
export const followUpAppointmentSchema = z.object({
  scheduledDate: dateField,
  scheduledTime: z.enum(APPOINTMENT_TIME_SLOTS, {
    error: "Select an available clinic time",
  }),
});
export type CaseHistoryInput = z.infer<typeof caseHistorySchema>;
export type CaseHistoryUpdateInput = z.infer<typeof caseHistoryUpdateSchema>;
