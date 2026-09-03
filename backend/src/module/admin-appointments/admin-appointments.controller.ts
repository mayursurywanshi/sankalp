import { Request, Response } from "express";
import { AppointmentRequestStatus } from "../../generated/prisma/enums";
import { assignAppointment, getAdminAppointment, getAppointmentSummary, listAdminAppointments, updateAppointmentStatus } from "./admin-appointments.service";
import { appointmentListQuerySchema, appointmentStatusSchema, assignmentSchema } from "./admin-appointments.validation";

export const getAppointments = async (request: Request, response: Response): Promise<void> => {
  const query = appointmentListQuerySchema.safeParse(request.query);
  if (!query.success) { response.status(400).json({ success: false, message: "Invalid appointment filters.", errors: query.error.flatten().fieldErrors }); return; }
  try { response.status(200).json({ success: true, data: await listAdminAppointments(query.data.status as AppointmentRequestStatus | undefined, query.data.doctorId) }); }
  catch (error) { console.error("Unable to list appointments", error); response.status(500).json({ success: false, message: "Unable to load appointment requests." }); }
};

export const getSummary = async (_request: Request, response: Response): Promise<void> => {
  try { response.status(200).json({ success: true, data: await getAppointmentSummary() }); }
  catch (error) { console.error("Unable to summarize appointments", error); response.status(500).json({ success: false, message: "Unable to load appointment summary." }); }
};

export const getAppointment = async (request: Request, response: Response): Promise<void> => {
  try { const data = await getAdminAppointment(String(request.params.referenceId ?? "")); if (!data) { response.status(404).json({ success: false, message: "Appointment request was not found." }); return; } response.status(200).json({ success: true, data }); }
  catch (error) { console.error("Unable to load appointment", error); response.status(500).json({ success: false, message: "Unable to load appointment details." }); }
};

export const postAssignment = async (request: Request, response: Response): Promise<void> => {
  const validation = assignmentSchema.safeParse(request.body);
  if (!validation.success) { response.status(400).json({ success: false, message: "Please correct the assignment fields.", errors: validation.error.flatten().fieldErrors }); return; }
  try {
    const result = await assignAppointment(String(request.params.referenceId ?? ""), validation.data, response.locals.admin.id);
    const errors = { NOT_FOUND: [404, "Appointment request was not found."], CLOSED: [409, "Completed or cancelled appointments cannot be assigned."], DOCTOR_UNAVAILABLE: [409, "Select an active Doctor with active login credentials."], INVALID_DATE: [400, "Select a future clinic working date."], SLOT_CONFLICT: [409, "This Doctor already has an appointment in the selected time slot."] } as const;
    if (result.outcome !== "ASSIGNED") { const [status, message] = errors[result.outcome]; response.status(status).json({ success: false, message }); return; }
    response.status(200).json({ success: true, message: "Appointment assigned successfully.", data: result.appointment });
  } catch (error) { console.error("Unable to assign appointment", error); response.status(500).json({ success: false, message: "Unable to assign appointment." }); }
};

export const patchStatus = async (request: Request, response: Response): Promise<void> => {
  const validation = appointmentStatusSchema.safeParse(request.body);
  if (!validation.success) { response.status(400).json({ success: false, message: "Please correct the status fields.", errors: validation.error.flatten().fieldErrors }); return; }
  try {
    const result = await updateAppointmentStatus(String(request.params.referenceId ?? ""), validation.data.status, validation.data.note, response.locals.admin.id);
    const errors = { NOT_FOUND: [404, "Appointment request was not found."], CLOSED: [409, "This appointment is already closed."], CASE_HISTORY_REQUIRED: [409, "The assigned Doctor must create case history before completion."] } as const;
    if (result.outcome !== "UPDATED") { const [status, message] = errors[result.outcome]; response.status(status).json({ success: false, message }); return; }
    response.status(200).json({ success: true, message: `Appointment marked ${validation.data.status.toLowerCase()}.`, data: result.appointment });
  } catch (error) { console.error("Unable to update appointment status", error); response.status(500).json({ success: false, message: "Unable to update appointment status." }); }
};
