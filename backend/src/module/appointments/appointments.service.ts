import { randomUUID } from "node:crypto";
import { prisma } from "../../config/database.config";
import { AppointmentRequestInput } from "./appointments.validation";

export const createAppointmentRequest = async (
  request: AppointmentRequestInput,
) => {
  const normalizedPatientName = request.childName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  return prisma.$transaction(async (transaction) => {
    const phone = request.phone.replace(/\D/g, "").slice(-10);
    const sameNamePatients = await transaction.patient.findMany({
      where: { normalizedPatientName },
    });
    const existingPatient = sameNamePatients.find(
      (item) => item.primaryPhone.replace(/\D/g, "").slice(-10) === phone,
    );
    const patient = existingPatient
      ? await transaction.patient.update({
          where: { id: existingPatient.id },
          data: {
            patientName: request.childName,
            parentName: request.parentName,
            primaryPhone: phone,
            email: request.email,
            ...(request.childDateOfBirth
              ? {
                  dateOfBirth: new Date(
                    `${request.childDateOfBirth}T00:00:00Z`,
                  ),
                }
              : {}),
          },
        })
      : await transaction.patient.create({
          data: {
            patientName: request.childName,
            normalizedPatientName,
            parentName: request.parentName,
            primaryPhone: phone,
            email: request.email,
            dateOfBirth: request.childDateOfBirth
              ? new Date(`${request.childDateOfBirth}T00:00:00Z`)
              : undefined,
          },
        });
    const preferredDate = new Date(`${request.preferredDate}T00:00:00Z`);
    const duplicateAppointment = await transaction.appointmentRequest.findFirst(
      {
        where: {
          patientDbId: patient.id,
          preferredDate,
          status: { not: "CANCELLED" },
        },
        select: { referenceId: true },
      },
    );
    if (duplicateAppointment) {
      return {
        outcome: "DUPLICATE" as const,
        referenceId: duplicateAppointment.referenceId,
      };
    }
    const appointment = await transaction.appointmentRequest.create({
      data: {
        parentName: request.parentName,
        childName: request.childName,
        childAge: request.childAge,
        childDateOfBirth: request.childDateOfBirth
          ? new Date(`${request.childDateOfBirth}T00:00:00Z`)
          : undefined,
        phone,
        email: request.email,
        preferredDate,
        preferredTime: null,
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
    return {
      outcome: "CREATED" as const,
      referenceId: appointment.referenceId,
      patientId: patient.patientId,
      status: appointment.status,
      createdAt: appointment.createdAt,
    };
  });
};
