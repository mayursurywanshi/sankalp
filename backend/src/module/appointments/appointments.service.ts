import { randomUUID } from "node:crypto";
import { prisma } from "../../config/database.config";
import { AppointmentRequestInput } from "./appointments.validation";

export const createAppointmentRequest = async (request: AppointmentRequestInput) => {
  const normalizedPatientName = request.childName.trim().toLowerCase().replace(/\s+/g, " ");
  return prisma.$transaction(async (transaction) => {
    const patient = await transaction.patient.upsert({
      where: { normalizedPatientName_primaryPhone: { normalizedPatientName, primaryPhone: request.phone } },
      update: {
        patientName: request.childName,
        parentName: request.parentName,
        email: request.email,
        ...(request.childDateOfBirth ? { dateOfBirth: new Date(`${request.childDateOfBirth}T00:00:00Z`) } : {}),
      },
      create: {
        patientName: request.childName,
        normalizedPatientName,
        parentName: request.parentName,
        primaryPhone: request.phone,
        email: request.email,
        dateOfBirth: request.childDateOfBirth ? new Date(`${request.childDateOfBirth}T00:00:00Z`) : undefined,
      },
    });
    const appointment = await transaction.appointmentRequest.create({
      data: {
        parentName: request.parentName,
        childName: request.childName,
        childAge: request.childAge,
        childDateOfBirth: request.childDateOfBirth ? new Date(`${request.childDateOfBirth}T00:00:00Z`) : undefined,
        phone: request.phone,
        email: request.email,
        preferredDate: new Date(`${request.preferredDate}T00:00:00Z`),
        preferredTime: request.preferredTime,
        consent: request.consent,
        patientDbId: patient.id,
        referenceId: `APT-${randomUUID().slice(0, 8).toUpperCase()}`,
      },
    });
    await transaction.appointmentLog.create({
      data: {
        appointmentRequestId: appointment.id,
        patientDbId: patient.id,
        newStatus: "REQUESTED",
        event: "REQUEST_CREATED",
        performedByRole: "PUBLIC",
      },
    });
    return { referenceId: appointment.referenceId, patientId: patient.patientId, status: appointment.status, createdAt: appointment.createdAt };
  });
};
