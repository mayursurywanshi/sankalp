import { Request, Response } from "express";
import { APPOINTMENT_CONTENT } from "../../constants/appointments.constants";
import { createAppointmentRequest } from "./appointments.service";
import { appointmentRequestSchema } from "./appointments.validation";
import { getConfiguredSlots, getSettings } from "../settings/settings.service";

export const getAppointmentContent = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  const { settings, slots } = await getConfiguredSlots();
  response
    .status(200)
    .json({
      success: true,
      data: {
        ...APPOINTMENT_CONTENT,
        phone: settings.phone,
        email: settings.email,
        clinicHours: {
          weekdays: `${settings.openingTime}–${settings.closingTime}`,
          sunday: "Closed days are unavailable",
        },
        timeSlots: slots,
      },
    });
};

export const submitAppointmentRequest = async (
  request: Request,
  response: Response,
): Promise<void> => {
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

  const settings = await getSettings();
  const maximumDate = new Date(today);
  maximumDate.setDate(
    maximumDate.getDate() + settings.maximumAdvanceBookingDays,
  );
  if (
    appointmentDate < today ||
    appointmentDate > maximumDate ||
    !settings.workingDays.includes(appointmentDate.getDay())
  ) {
    response.status(400).json({
      success: false,
      message: "Please select an available appointment date.",
      errors: {
        preferredDate: [
          appointmentDate < today
            ? "Preferred date cannot be in the past"
            : appointmentDate > maximumDate
              ? `Appointments can be requested up to ${settings.maximumAdvanceBookingDays} days ahead`
              : "The clinic is closed on the selected day",
        ],
      },
    });
    return;
  }

  try {
    const receipt = await createAppointmentRequest(validation.data);
    if (receipt.outcome === "DUPLICATE") {
      response.status(409).json({
        success: false,
        message:
          "An appointment request already exists for this child on the selected date.",
        data: { existingReferenceId: receipt.referenceId },
      });
      return;
    }
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
