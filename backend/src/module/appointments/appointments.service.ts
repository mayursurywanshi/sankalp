import { randomUUID } from "node:crypto";
import { prisma } from "../../config/database.config";
import { AppointmentRequestInput } from "./appointments.validation";

export const createAppointmentRequest = async (request: AppointmentRequestInput) =>
  prisma.appointmentRequest.create({
    data: {
      ...request,
      preferredDate: new Date(`${request.preferredDate}T00:00:00`),
      referenceId: `APT-${randomUUID().slice(0, 8).toUpperCase()}`,
    },
    select: {
      referenceId: true,
      status: true,
      createdAt: true,
    },
  });
