import { Request, Response } from "express";
import { APPOINTMENT_CONTENT } from "../../constants/appointments.constants";
import { createAppointmentRequest } from "./appointments.service";
import { appointmentRequestSchema } from "./appointments.validation";

export const getAppointmentContent = (_request: Request, response: Response): void => {
  response.status(200).json({ success: true, data: APPOINTMENT_CONTENT });
};

export const submitAppointmentRequest = async (request: Request, response: Response): Promise<void> => {
  const validation = appointmentRequestSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      success: false,
      message: "Please correct the highlighted fields.",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  const appointmentDate = new Date(`${validation.data.preferredDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (appointmentDate < today || appointmentDate.getDay() === 0) {
    response.status(400).json({
      success: false,
      message: "Please select an available appointment date.",
      errors: {
        preferredDate: [appointmentDate.getDay() === 0 ? "The clinic is closed on Sunday" : "Preferred date cannot be in the past"],
      },
    });
    return;
  }

  try {
    const receipt = await createAppointmentRequest(validation.data);
    response.status(201).json({
      success: true,
      message: APPOINTMENT_CONTENT.successMessage,
      data: {
        referenceId: receipt.referenceId,
        patientId: receipt.patientId,
        status: receipt.status,
        receivedAt: receipt.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Unable to save appointment request", error);
    response.status(500).json({
      success: false,
      message: "We could not save your appointment request. Please try again.",
    });
  }
};
