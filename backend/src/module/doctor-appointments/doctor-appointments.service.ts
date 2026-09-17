import { randomUUID } from "node:crypto";
import { prisma } from "../../config/database.config";
import { parseDisplayDate } from "../admin-appointments/admin-appointments.validation";
import { clinicSlotAvailability } from "../appointments/appointment-slots.service";
import {
  CaseHistoryInput,
  CaseHistoryUpdateInput,
} from "./doctor-appointments.validation";

const formatDate = (date: Date | null) =>
  date ? date.toISOString().slice(0, 10).split("-").reverse().join("-") : null;
const presentCaseHistory = (history: any) => ({
  ...history,
  appointmentDate: formatDate(history.appointmentDate),
  nextAppointmentDate: formatDate(history.nextAppointmentDate),
  createdAt: history.createdAt.toISOString(),
  updatedAt: history.updatedAt.toISOString(),
});

export const listDoctorAppointments = async (doctorDbId: string) =>
  prisma.appointmentRequest
    .findMany({
      where: { assignedDoctorId: doctorDbId },
      orderBy: [{ scheduledDate: "desc" }, { scheduledTime: "asc" }],
      select: {
        referenceId: true,
        childName: true,
        childAge: true,
        parentName: true,
        phone: true,
        status: true,
        scheduledDate: true,
        scheduledTime: true,
        assignmentNote: true,
        patient: { select: { patientId: true } },
        caseHistory: { select: { id: true, isLocked: true } },
      },
    })
    .then((items) =>
      items.map((item) => ({
        ...item,
        patientId: item.patient.patientId,
        patient: undefined,
        scheduledDate: formatDate(item.scheduledDate),
      })),
    );

export const getDoctorAppointment = async (
  doctorDbId: string,
  referenceId: string,
) => {
  const appointment = await prisma.appointmentRequest.findFirst({
    where: { referenceId, assignedDoctorId: doctorDbId },
    include: {
      patient: true,
      caseHistory: true,
      logs: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!appointment) return null;
  return {
    ...appointment,
    patientId: appointment.patient.patientId,
    preferredDate: formatDate(appointment.preferredDate),
    childDateOfBirth: formatDate(appointment.childDateOfBirth),
    scheduledDate: formatDate(appointment.scheduledDate),
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
    patient: {
      ...appointment.patient,
      dateOfBirth: formatDate(appointment.patient.dateOfBirth),
    },
    caseHistory: appointment.caseHistory
      ? presentCaseHistory(appointment.caseHistory)
      : null,
  };
};

export const getPatientHistoryForDoctor = async (
  doctorDbId: string,
  patientId: string,
) => {
  const patient = await prisma.patient.findUnique({ where: { patientId } });
  if (!patient) return { outcome: "NOT_FOUND" as const };
  const assigned = await prisma.appointmentRequest.findFirst({
    where: { patientDbId: patient.id, assignedDoctorId: doctorDbId },
  });
  if (!assigned) return { outcome: "FORBIDDEN" as const };
  const history = await prisma.patientCaseHistory.findMany({
    where: { patientDbId: patient.id },
    orderBy: { appointmentNumber: "asc" },
  });
  return {
    outcome: "FOUND" as const,
    patient: {
      patientId: patient.patientId,
      patientName: patient.patientName,
      dateOfBirth: formatDate(patient.dateOfBirth),
      parentName: patient.parentName,
      primaryPhone: patient.primaryPhone,
    },
    caseHistory: history.map(presentCaseHistory),
  };
};

export const getMySlotAvailability = (doctorDbId: string, date: string) =>
  clinicSlotAvailability(doctorDbId, date);

export const createFollowUpAppointment = async (
  doctorDbId: string,
  sourceReferenceId: string,
  input: { scheduledDate: string; scheduledTime: string },
) => {
  const source = await prisma.appointmentRequest.findFirst({
    where: { referenceId: sourceReferenceId, assignedDoctorId: doctorDbId },
    include: { caseHistory: true },
  });
  if (!source) return { outcome: "NOT_FOUND" as const };
  if (!source.caseHistory) return { outcome: "CASE_HISTORY_REQUIRED" as const };
  const availability = await clinicSlotAvailability(
    doctorDbId,
    input.scheduledDate,
  );
  if (availability.outcome !== "AVAILABLE")
    return { outcome: "INVALID_DATE" as const };
  if (
    !availability.slots.some(
      (slot) => slot.time === input.scheduledTime && slot.available,
    )
  )
    return { outcome: "SLOT_CONFLICT" as const };
  const scheduledDate = parseDisplayDate(input.scheduledDate) as Date;
  const created = await prisma.$transaction(async (transaction) => {
    const appointment = await transaction.appointmentRequest.create({
      data: {
        referenceId: `APT-${randomUUID().slice(0, 8).toUpperCase()}`,
        parentName: source.parentName,
        childName: source.childName,
        childAge: source.childAge,
        childDateOfBirth: source.childDateOfBirth,
        phone: source.phone,
        email: source.email,
        preferredDate: scheduledDate,
        preferredTime: null,
        consent: true,
        status: "ASSIGNED",
        patientDbId: source.patientDbId,
        assignedDoctorId: doctorDbId,
        scheduledDate,
        scheduledTime: input.scheduledTime,
        assignmentNote: `Follow-up scheduled from ${source.referenceId}`,
        assignedAt: new Date(),
      },
    });
    await transaction.appointmentLog.create({
      data: {
        appointmentRequestId: appointment.id,
        patientDbId: source.patientDbId,
        newStatus: "ASSIGNED",
        assignedDoctorId: doctorDbId,
        event: "DOCTOR_ASSIGNED",
        note: `Follow-up scheduled from ${source.referenceId}`,
        performedById: doctorDbId,
        performedByRole: "DOCTOR",
      },
    });
    return appointment;
  });
  return {
    outcome: "CREATED" as const,
    appointment: {
      referenceId: created.referenceId,
      scheduledDate: formatDate(created.scheduledDate),
      scheduledTime: created.scheduledTime,
      status: created.status,
    },
  };
};

export const createCaseHistory = async (
  doctorDbId: string,
  referenceId: string,
  input: CaseHistoryInput,
) => {
  const appointment = await prisma.appointmentRequest.findFirst({
    where: { referenceId, assignedDoctorId: doctorDbId },
    include: { caseHistory: true },
  });
  if (!appointment) return { outcome: "NOT_FOUND" as const };
  if (appointment.status !== "ASSIGNED")
    return { outcome: "INVALID_STATUS" as const };
  if (appointment.caseHistory) return { outcome: "ALREADY_EXISTS" as const };
  const count = await prisma.patientCaseHistory.count({
    where: { patientDbId: appointment.patientDbId },
  });
  const history = await prisma.patientCaseHistory.create({
    data: {
      patientDbId: appointment.patientDbId,
      appointmentRequestId: appointment.id,
      appointmentNumber: count + 1,
      appointmentDate: parseDisplayDate(input.appointmentDate) as Date,
      nextAppointmentDate: input.nextAppointmentDate
        ? parseDisplayDate(input.nextAppointmentDate)
        : undefined,
      attendingDoctorId: doctorDbId,
      createdByDoctorId: doctorDbId,
      updatedByDoctorId: doctorDbId,
      presentingConcern: input.presentingConcern,
      medicalHistory: input.medicalHistory,
      assessment: input.assessment,
      treatmentProvided: input.treatmentProvided,
      therapyGoals: input.therapyGoals,
      progressNotes: input.progressNotes,
      homeProgram: input.homeProgram,
      recommendations: input.recommendations,
      caseHistory: input.caseHistory,
      additionalNotes: input.additionalNotes,
    },
  });
  return { outcome: "CREATED" as const, history: presentCaseHistory(history) };
};

export const updateCaseHistory = async (
  doctorDbId: string,
  caseHistoryId: string,
  input: CaseHistoryUpdateInput,
) => {
  const history = await prisma.patientCaseHistory.findFirst({
    where: { id: caseHistoryId, attendingDoctorId: doctorDbId },
  });
  if (!history) return { outcome: "NOT_FOUND" as const };
  if (history.isLocked) return { outcome: "LOCKED" as const };
  const updated = await prisma.patientCaseHistory.update({
    where: { id: history.id },
    data: {
      ...input,
      nextAppointmentDate: input.nextAppointmentDate
        ? parseDisplayDate(input.nextAppointmentDate)
        : input.nextAppointmentDate === ""
          ? null
          : undefined,
      updatedByDoctorId: doctorDbId,
    },
  });
  return { outcome: "UPDATED" as const, history: presentCaseHistory(updated) };
};
