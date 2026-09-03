import { prisma } from "../../config/database.config";
import { AppointmentRequestStatus } from "../../generated/prisma/enums";
import { parseDisplayDate } from "./admin-appointments.validation";

const formatDate = (date: Date | null) => date ? date.toISOString().slice(0, 10).split("-").reverse().join("-") : null;
const appointmentSelect = {
  referenceId: true, parentName: true, childName: true, childAge: true, childDateOfBirth: true, phone: true, email: true,
  preferredDate: true, preferredTime: true, status: true, scheduledDate: true, scheduledTime: true, assignmentNote: true,
  assignedAt: true, createdAt: true,
  patient: { select: { patientId: true } },
  assignedDoctor: { select: { doctorId: true, firstName: true, lastName: true, designation: true } },
} as const;

const presentAppointment = (item: any) => ({
  ...item,
  patientId: item.patient.patientId,
  patient: undefined,
  preferredDate: formatDate(item.preferredDate),
  childDateOfBirth: formatDate(item.childDateOfBirth),
  scheduledDate: formatDate(item.scheduledDate),
  assignedAt: item.assignedAt?.toISOString() ?? null,
  createdAt: item.createdAt.toISOString(),
});

export const listAdminAppointments = async (status?: AppointmentRequestStatus, doctorId?: string) => {
  const items = await prisma.appointmentRequest.findMany({
    where: { ...(status ? { status } : {}), ...(doctorId ? { assignedDoctor: { doctorId } } : {}) },
    orderBy: { createdAt: "desc" }, select: appointmentSelect,
  });
  return items.map(presentAppointment);
};

export const getAppointmentSummary = async () => {
  const grouped = await prisma.appointmentRequest.groupBy({ by: ["status"], _count: { _all: true } });
  const counts = new Map(grouped.map((row) => [row.status, row._count._all]));
  return {
    all: grouped.reduce((total, row) => total + row._count._all, 0),
    requested: counts.get("REQUESTED") ?? 0,
    assigned: counts.get("ASSIGNED") ?? 0,
    completed: counts.get("COMPLETED") ?? 0,
    cancelled: counts.get("CANCELLED") ?? 0,
  };
};

export const getAdminAppointment = async (referenceId: string) => {
  const appointment = await prisma.appointmentRequest.findUnique({
    where: { referenceId },
    include: {
      patient: true,
      assignedDoctor: { select: { doctorId: true, firstName: true, lastName: true, designation: true } },
      logs: { orderBy: { createdAt: "desc" } },
      caseHistory: true,
    },
  });
  if (!appointment) return null;
  const previousAppointments = await prisma.appointmentRequest.findMany({
    where: { patientDbId: appointment.patientDbId, id: { not: appointment.id } },
    orderBy: { createdAt: "desc" }, select: appointmentSelect,
  });
  return {
    appointment: presentAppointment(appointment),
    patient: { ...appointment.patient, dateOfBirth: formatDate(appointment.patient.dateOfBirth), createdAt: appointment.patient.createdAt.toISOString(), updatedAt: appointment.patient.updatedAt.toISOString() },
    logs: appointment.logs.map((log) => ({ ...log, createdAt: log.createdAt.toISOString() })),
    caseHistory: appointment.caseHistory ? { ...appointment.caseHistory, appointmentDate: formatDate(appointment.caseHistory.appointmentDate), nextAppointmentDate: formatDate(appointment.caseHistory.nextAppointmentDate), createdAt: appointment.caseHistory.createdAt.toISOString(), updatedAt: appointment.caseHistory.updatedAt.toISOString() } : null,
    previousAppointments: previousAppointments.map(presentAppointment),
  };
};

export const assignAppointment = async (referenceId: string, input: { doctorId: string; scheduledDate: string; scheduledTime: string; note?: string }, adminId: string) => {
  const appointment = await prisma.appointmentRequest.findUnique({ where: { referenceId } });
  if (!appointment) return { outcome: "NOT_FOUND" as const };
  if (appointment.status === "COMPLETED" || appointment.status === "CANCELLED") return { outcome: "CLOSED" as const };
  const doctor = await prisma.doctorDetail.findUnique({ where: { doctorId: input.doctorId }, include: { login: true } });
  if (!doctor || !doctor.isActive || doctor.credentialStatus !== "ACTIVE" || !doctor.login?.isActive) return { outcome: "DOCTOR_UNAVAILABLE" as const };
  const scheduledDate = parseDisplayDate(input.scheduledDate) as Date;
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  if (scheduledDate < today || scheduledDate.getUTCDay() === 0) return { outcome: "INVALID_DATE" as const };
  const conflict = await prisma.appointmentRequest.findFirst({ where: { id: { not: appointment.id }, assignedDoctorId: doctor.id, scheduledDate, scheduledTime: input.scheduledTime, status: "ASSIGNED" } });
  if (conflict) return { outcome: "SLOT_CONFLICT" as const };
  const event = appointment.assignedDoctorId ? "DOCTOR_REASSIGNED" : "DOCTOR_ASSIGNED";
  const updated = await prisma.$transaction(async (transaction) => {
    const value = await transaction.appointmentRequest.update({ where: { id: appointment.id }, data: { assignedDoctorId: doctor.id, scheduledDate, scheduledTime: input.scheduledTime, assignmentNote: input.note, assignedAt: new Date(), assignedByAdminId: adminId, status: "ASSIGNED" }, select: appointmentSelect });
    await transaction.appointmentLog.create({ data: { appointmentRequestId: appointment.id, patientDbId: appointment.patientDbId, previousStatus: appointment.status, newStatus: "ASSIGNED", previousDoctorId: appointment.assignedDoctorId, assignedDoctorId: doctor.id, event, note: input.note, performedById: adminId, performedByRole: "ADMIN" } });
    return value;
  });
  return { outcome: "ASSIGNED" as const, appointment: presentAppointment(updated) };
};

export const updateAppointmentStatus = async (referenceId: string, status: "COMPLETED" | "CANCELLED", note: string, adminId: string) => {
  const appointment = await prisma.appointmentRequest.findUnique({ where: { referenceId }, include: { caseHistory: true } });
  if (!appointment) return { outcome: "NOT_FOUND" as const };
  if (appointment.status === "COMPLETED" || appointment.status === "CANCELLED") return { outcome: "CLOSED" as const };
  if (status === "COMPLETED" && (!appointment.assignedDoctorId || !appointment.caseHistory)) return { outcome: "CASE_HISTORY_REQUIRED" as const };
  const event = status === "COMPLETED" ? "APPOINTMENT_COMPLETED" : "APPOINTMENT_CANCELLED";
  const updated = await prisma.$transaction(async (transaction) => {
    const value = await transaction.appointmentRequest.update({ where: { id: appointment.id }, data: { status }, select: appointmentSelect });
    if (status === "COMPLETED" && appointment.caseHistory) await transaction.patientCaseHistory.update({ where: { id: appointment.caseHistory.id }, data: { isLocked: true } });
    await transaction.appointmentLog.create({ data: { appointmentRequestId: appointment.id, patientDbId: appointment.patientDbId, previousStatus: appointment.status, newStatus: status, previousDoctorId: appointment.assignedDoctorId, assignedDoctorId: appointment.assignedDoctorId, event, note, performedById: adminId, performedByRole: "ADMIN" } });
    return value;
  });
  return { outcome: "UPDATED" as const, appointment: presentAppointment(updated) };
};
