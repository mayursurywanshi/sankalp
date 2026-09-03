import { z } from "zod";
import { APPOINTMENT_TIME_SLOTS } from "../../constants/appointments.constants";

const displayDate = /^\d{2}-\d{2}-\d{4}$/;
export const parseDisplayDate = (value: string) => {
  const [day, month, year] = value.split("-").map(Number);
  if (day === undefined || month === undefined || year === undefined) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCDate() === day && date.getUTCMonth() === month - 1 && date.getUTCFullYear() === year ? date : null;
};

export const assignmentSchema = z.object({
  doctorId: z.string().regex(/^DOC\d{6}$/, "Enter a valid Doctor ID"),
  scheduledDate: z.string().regex(displayDate, "Use DD-MM-YYYY format").refine(parseDisplayDate, "Enter a valid date"),
  scheduledTime: z.enum(APPOINTMENT_TIME_SLOTS, { error: "Select a valid appointment time" }),
  note: z.string().trim().max(500).optional(),
});

export const appointmentStatusSchema = z.object({
  status: z.enum(["COMPLETED", "CANCELLED"]),
  note: z.string().trim().min(2, "Add a short status note").max(500),
});

export const appointmentListQuerySchema = z.object({
  status: z.enum(["REQUESTED", "ASSIGNED", "COMPLETED", "CANCELLED"]).optional(),
  doctorId: z.string().regex(/^DOC\d{6}$/).optional(),
});
