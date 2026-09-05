import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../config/database.config";
import { parseDisplayDate } from "../admin-appointments/admin-appointments.validation";
import { PatientListQuery } from "./admin-patients.validation";

const displayDate = (value: Date | null) => value ? value.toISOString().slice(0, 10).split("-").reverse().join("-") : null;
const age = (date: Date | null) => { if (!date) return null; const now = new Date(); let years = now.getFullYear() - date.getUTCFullYear(); if (now.getMonth() < date.getUTCMonth() || (now.getMonth() === date.getUTCMonth() && now.getDate() < date.getUTCDate())) years--; return years; };
const ageRange = (value?: PatientListQuery["ageGroup"]): Prisma.DateTimeNullableFilter | undefined => {
  if (!value) return undefined;
  const now = new Date(); const birthday = (years: number) => new Date(Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth(), now.getUTCDate()));
  if (value === "12+") return { lte: birthday(12) };
  const parts = value.split("-").map(Number); const minimum = parts[0] as number; const maximum = parts[1] as number;
  return { lte: birthday(minimum), gt: birthday(maximum) };
};
const patientStatus = (patient: { isActive: boolean; caseHistories: Array<{ nextAppointmentDate: Date | null }> }) => {
  if (!patient.isActive) return "INACTIVE" as const;
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  return patient.caseHistories.some((item) => item.nextAppointmentDate && item.nextAppointmentDate <= today) ? "FOLLOW_UP" as const : "ACTIVE" as const;
};

const listSelect = {
  patientId: true, patientName: true, dateOfBirth: true, gender: true, parentName: true, primaryPhone: true, email: true, isActive: true, createdAt: true,
  appointments: { orderBy: { createdAt: "desc" as const }, take: 1, select: { referenceId: true, status: true, scheduledDate: true, scheduledTime: true, preferredDate: true, preferredTime: true, assignedDoctor: { select: { doctorId: true, firstName: true, lastName: true, designation: true } } } },
  caseHistories: { where: { nextAppointmentDate: { not: null } }, orderBy: { nextAppointmentDate: "desc" as const }, take: 1, select: { nextAppointmentDate: true } },
} as const;

const presentListPatient = (patient: any) => { const latest = patient.appointments[0] ?? null; return {
  patientId: patient.patientId, patientName: patient.patientName, age: age(patient.dateOfBirth), dateOfBirth: displayDate(patient.dateOfBirth), gender: patient.gender,
  parentName: patient.parentName, primaryPhone: patient.primaryPhone, email: patient.email, status: patientStatus(patient), createdAt: patient.createdAt.toISOString(),
  nextAppointment: latest && latest.status === "ASSIGNED" ? { referenceId: latest.referenceId, date: displayDate(latest.scheduledDate), time: latest.scheduledTime } : null,
  latestAppointment: latest ? { referenceId: latest.referenceId, status: latest.status, requestedDate: displayDate(latest.preferredDate), requestedTime: latest.preferredTime } : null,
  therapist: latest?.assignedDoctor ? { doctorId: latest.assignedDoctor.doctorId, name: `Dr. ${latest.assignedDoctor.firstName} ${latest.assignedDoctor.lastName}`, designation: latest.assignedDoctor.designation } : null,
}; };

export const getPatientSummary = async () => {
  const today = new Date(); today.setUTCHours(0, 0, 0, 0); const monthAgo = new Date(today); monthAgo.setUTCDate(monthAgo.getUTCDate() - 30);
  const [total, newPatients, active, inactive, followUpsDue] = await Promise.all([
    prisma.patient.count(), prisma.patient.count({ where: { createdAt: { gte: monthAgo } } }), prisma.patient.count({ where: { isActive: true } }), prisma.patient.count({ where: { isActive: false } }), prisma.patient.count({ where: { isActive: true, caseHistories: { some: { nextAppointmentDate: { lte: today } } } } }),
  ]);
  return { totalPatients: total, newPatients, activePatients: active, followUpsDue, inactivePatients: inactive, dischargedPatients: 0 };
};

export const listPatients = async (query: PatientListQuery) => {
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const where: Prisma.PatientWhereInput = {
    ...(query.search ? { OR: [{ patientId: { contains: query.search, mode: "insensitive" } }, { patientName: { contains: query.search, mode: "insensitive" } }, { parentName: { contains: query.search, mode: "insensitive" } }, { primaryPhone: { contains: query.search } }] } : {}),
    ...(query.ageGroup ? { dateOfBirth: ageRange(query.ageGroup) } : {}),
    ...(query.status === "ACTIVE" ? { isActive: true, NOT: { caseHistories: { some: { nextAppointmentDate: { lte: today } } } } } : {}),
    ...(query.status === "FOLLOW_UP" ? { isActive: true, caseHistories: { some: { nextAppointmentDate: { lte: today } } } } : {}),
    ...(query.status === "INACTIVE" ? { isActive: false } : {}),
  };
  const [total, patients] = await Promise.all([prisma.patient.count({ where }), prisma.patient.findMany({ where, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.pageSize, take: query.pageSize, select: listSelect })]);
  return { items: patients.map(presentListPatient), pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } };
};

export const getPatientDetails = async (patientId: string) => {
  const patient = await prisma.patient.findUnique({ where: { patientId }, include: { appointments: { orderBy: { createdAt: "desc" }, include: { assignedDoctor: { select: { doctorId: true, firstName: true, lastName: true, designation: true } }, caseHistory: true, logs: { orderBy: { createdAt: "desc" } } } }, caseHistories: { orderBy: { appointmentNumber: "desc" }, include: { attendingDoctor: { select: { doctorId: true, firstName: true, lastName: true, designation: true } } } } } });
  if (!patient) return null;
  return { patient: { patientId: patient.patientId, patientName: patient.patientName, age: age(patient.dateOfBirth), dateOfBirth: displayDate(patient.dateOfBirth), gender: patient.gender, parentName: patient.parentName, primaryPhone: patient.primaryPhone, email: patient.email, isActive: patient.isActive, status: patientStatus(patient), createdAt: patient.createdAt.toISOString(), updatedAt: patient.updatedAt.toISOString() }, appointments: patient.appointments.map((item) => ({ ...item, preferredDate: displayDate(item.preferredDate), childDateOfBirth: displayDate(item.childDateOfBirth), scheduledDate: displayDate(item.scheduledDate), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() })), caseHistory: patient.caseHistories.map((item) => ({ ...item, appointmentDate: displayDate(item.appointmentDate), nextAppointmentDate: displayDate(item.nextAppointmentDate), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() })) };
};

export const createPatient = async (input: { patientName: string; dateOfBirth: string; gender?: string; parentName: string; primaryPhone: string; email?: string }) => prisma.patient.create({ data: { patientName: input.patientName, normalizedPatientName: input.patientName.toLowerCase().replace(/\s+/g, " "), dateOfBirth: parseDisplayDate(input.dateOfBirth), gender: input.gender, parentName: input.parentName, primaryPhone: input.primaryPhone, email: input.email || null }, select: listSelect }).then(presentListPatient);
export const updatePatient = async (patientId: string, input: { patientName?: string; dateOfBirth?: string; gender?: string; parentName?: string; primaryPhone?: string; email?: string; isActive?: boolean }) => { const existing = await prisma.patient.findUnique({ where: { patientId } }); if (!existing) return null; return prisma.patient.update({ where: { patientId }, data: { ...input, ...(input.patientName ? { normalizedPatientName: input.patientName.toLowerCase().replace(/\s+/g, " ") } : {}), ...(input.dateOfBirth ? { dateOfBirth: parseDisplayDate(input.dateOfBirth) } : {}), ...(input.email === "" ? { email: null } : {}) }, select: listSelect }).then(presentListPatient); };
