import { z } from "zod";
import { APPOINTMENT_TIME_SLOTS } from "../../constants/appointments.constants";

export const appointmentRequestSchema = z.object({
  parentName: z.string().trim().min(2, "Parent name must contain at least 2 characters").max(80),
  childName: z.string().trim().min(2, "Child’s name must contain at least 2 characters").max(80),
  childAge: z.string().trim().min(1, "Child’s age is required").max(30),
  childDateOfBirth: z.iso.date("Enter a valid date of birth").optional(),
  phone: z.string().trim().regex(/^(?:\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().trim().email("Enter a valid email address").max(120),
  preferredDate: z.iso.date("Enter a valid preferred date"),
  preferredTime: z.enum(APPOINTMENT_TIME_SLOTS, { error: "Select a valid preferred time" }),
  consent: z.literal(true, { error: "Consent is required to request an appointment" }),
});

export type AppointmentRequestInput = z.infer<typeof appointmentRequestSchema>;
