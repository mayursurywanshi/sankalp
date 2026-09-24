import { Request, Response } from "express";
import {
  createCaseHistory,
  createFollowUpAppointment,
  getDoctorAppointment,
  getMySlotAvailability,
  getPatientHistoryForDoctor,
  listDoctorAppointments,
  updateCaseHistory,
} from "./doctor-appointments.service";
import {
  caseHistoryIdSchema,
  caseHistorySchema,
  caseHistoryUpdateSchema,
  doctorAvailabilityQuerySchema,
  followUpAppointmentSchema,
} from "./doctor-appointments.validation";

export const getMyAppointments = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  try {
    response.status(200).json({
      success: true,
      data: await listDoctorAppointments(response.locals.doctor.id),
    });
  } catch (error) {
    console.error("Unable to list Doctor appointments", error);
    response
      .status(500)
      .json({ success: false, message: "Unable to load Doctor appointments." });
  }
};
export const getMyAppointment = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const data = await getDoctorAppointment(
      response.locals.doctor.id,
      String(request.params.referenceId ?? ""),
    );
    if (!data) {
      response.status(404).json({
        success: false,
        message: "Assigned appointment was not found.",
      });
      return;
    }
    response.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Unable to load Doctor appointment", error);
    response
      .status(500)
      .json({ success: false, message: "Unable to load appointment." });
  }
};
export const getMyAvailability = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const validation = doctorAvailabilityQuerySchema.safeParse(request.query);
  if (!validation.success) {
    response
      .status(400)
      .json({ success: false, message: "Select a valid clinic date." });
    return;
  }
  try {
    const result = await getMySlotAvailability(
      response.locals.doctor.id,
      validation.data.date,
    );
    if (result.outcome !== "AVAILABLE") {
      response.status(400).json({
        success: false,
        message: "The clinic is closed for the selected date.",
      });
      return;
    }
    response.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Unable to load Doctor slots", error);
    response
      .status(500)
      .json({ success: false, message: "Unable to load available slots." });
  }
};
export const postFollowUp = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const validation = followUpAppointmentSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({
      success: false,
      message: "Select a valid available appointment slot.",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }
  try {
    const result = await createFollowUpAppointment(
      response.locals.doctor.id,
      String(request.params.referenceId ?? ""),
      validation.data,
    );
    const errors = {
      NOT_FOUND: [404, "Assigned appointment was not found."],
      CASE_HISTORY_REQUIRED: [
        409,
        "Save the patient case history before scheduling the next appointment.",
      ],
      INVALID_DATE: [400, "Select a current or future clinic working date."],
      SLOT_CONFLICT: [
        409,
        "This time slot has just been booked. Select another available slot.",
      ],
    } as const;
    if (result.outcome !== "CREATED") {
      const [status, message] = errors[result.outcome];
      response.status(status).json({ success: false, message });
      return;
    }
    response.status(201).json({
      success: true,
      message: "Next appointment scheduled successfully.",
      data: result.appointment,
    });
  } catch (error) {
    console.error("Unable to schedule follow-up", error);
    response.status(500).json({
      success: false,
      message: "Unable to schedule the next appointment.",
    });
  }
};
export const getPatientCaseHistory = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const result = await getPatientHistoryForDoctor(
      response.locals.doctor.id,
      String(request.params.patientId ?? ""),
    );
    if (result.outcome === "NOT_FOUND") {
      response
        .status(404)
        .json({ success: false, message: "Patient was not found." });
      return;
    }
    if (result.outcome === "FORBIDDEN") {
      response.status(403).json({
        success: false,
        message: "This patient is not assigned to you.",
      });
      return;
    }
    response.status(200).json({
      success: true,
      data: { patient: result.patient, caseHistory: result.caseHistory },
    });
  } catch (error) {
    console.error("Unable to load case history", error);
    response.status(500).json({
      success: false,
      message: "Unable to load patient case history.",
    });
  }
};
export const postCaseHistory = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const validation = caseHistorySchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({
      success: false,
      message: "Please correct the case-history fields.",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }
  try {
    const result = await createCaseHistory(
      response.locals.doctor.id,
      String(request.params.referenceId ?? ""),
      validation.data,
    );
    const errors = {
      NOT_FOUND: [404, "Assigned appointment was not found."],
      INVALID_STATUS: [
        409,
        "Case history can only be added to an assigned appointment.",
      ],
      ALREADY_EXISTS: [
        409,
        "Case history already exists for this appointment.",
      ],
    } as const;
    if (result.outcome !== "CREATED") {
      const [status, message] = errors[result.outcome];
      response.status(status).json({ success: false, message });
      return;
    }
    response.status(201).json({
      success: true,
      message: "Patient case history created successfully.",
      data: result.history,
    });
  } catch (error) {
    console.error("Unable to create case history", error);
    response.status(500).json({
      success: false,
      message: "Unable to create patient case history.",
    });
  }
};
export const patchCaseHistory = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const idValidation = caseHistoryIdSchema.safeParse(
    request.params.caseHistoryId,
  );
  if (!idValidation.success) {
    response
      .status(400)
      .json({ success: false, message: "Enter a valid case-history ID." });
    return;
  }
  const validation = caseHistoryUpdateSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({
      success: false,
      message: "Please correct the case-history fields.",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }
  try {
    const result = await updateCaseHistory(
      response.locals.doctor.id,
      idValidation.data,
      validation.data,
    );
    if (result.outcome === "NOT_FOUND") {
      response
        .status(404)
        .json({ success: false, message: "Case history was not found." });
      return;
    }
    if (result.outcome === "LOCKED") {
      response.status(409).json({
        success: false,
        message:
          "Completed appointment history is locked and cannot be edited.",
      });
      return;
    }
    response.status(200).json({
      success: true,
      message: "Patient case history updated successfully.",
      data: result.history,
    });
  } catch (error) {
    console.error("Unable to update case history", error);
    response.status(500).json({
      success: false,
      message: "Unable to update patient case history.",
    });
  }
};
