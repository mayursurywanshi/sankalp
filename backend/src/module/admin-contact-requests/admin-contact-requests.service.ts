import { randomUUID } from "node:crypto";
import { prisma } from "../../config/database.config";
import {
  ContactAppointmentInput,
  ContactAssignmentInput,
  ContactFollowUpInput,
  ContactRequestListInput,
  ContactStatusInput,
} from "./admin-contact-requests.validation";

const doctorSelect = {
  doctorId: true,
  firstName: true,
  lastName: true,
  designation: true,
} as const;

const contactSelect = {
  referenceId: true,
  name: true,
  phone: true,
  email: true,
  subject: true,
  message: true,
  status: true,
  followUpMethod: true,
  adminNote: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  assignedDoctor: { select: doctorSelect },
  convertedAppointment: {
    select: {
      referenceId: true,
      status: true,
      patient: { select: { patientId: true } },
    },
  },
} as const;

const presentContact = (item: any) => ({
  ...item,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
  resolvedAt: item.resolvedAt?.toISOString() ?? null,
});

export const listContactRequests = async (input: ContactRequestListInput) => {
  const where = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.search
      ? {
          OR: [
            {
              referenceId: {
                contains: input.search,
                mode: "insensitive" as const,
              },
            },
            { name: { contains: input.search, mode: "insensitive" as const } },
            { phone: { contains: input.search } },
            { email: { contains: input.search, mode: "insensitive" as const } },
            {
              subject: { contains: input.search, mode: "insensitive" as const },
            },
          ],
        }
      : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      select: contactSelect,
    }),
    prisma.contactMessage.count({ where }),
  ]);
  return {
    items: items.map(presentContact),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
};

export const getContactRequestSummary = async () => {
  const grouped = await prisma.contactMessage.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts = new Map(grouped.map((row) => [row.status, row._count._all]));
  return {
    all: grouped.reduce((total, row) => total + row._count._all, 0),
    new: counts.get("NEW") ?? 0,
    inProgress: counts.get("IN_PROGRESS") ?? 0,
    resolved: counts.get("RESOLVED") ?? 0,
  };
};

export const deleteContactRequest = async (referenceId: string) => {
  const contact = await prisma.contactMessage.findUnique({
    where: { referenceId },
    select: { id: true, referenceId: true },
  });
  if (!contact) return null;
  await prisma.contactMessage.delete({ where: { id: contact.id } });
  return { referenceId: contact.referenceId };
};

export const getContactRequest = async (referenceId: string) => {
  const item = await prisma.contactMessage.findUnique({
    where: { referenceId },
    select: {
      ...contactSelect,
      activities: {
        orderBy: { createdAt: "desc" },
        select: {
          event: true,
          previousStatus: true,
          newStatus: true,
          followUpMethod: true,
          note: true,
          createdAt: true,
          assignedDoctor: { select: doctorSelect },
          performedByAdmin: { select: { fullName: true, loginId: true } },
        },
      },
    },
  });
  if (!item) return null;
  return {
    ...presentContact(item),
    activities: item.activities.map((activity) => ({
      ...activity,
      createdAt: activity.createdAt.toISOString(),
    })),
  };
};

export const assignContactRequest = async (
  referenceId: string,
  input: ContactAssignmentInput,
  adminId: string,
) => {
  const [contact, doctor] = await Promise.all([
    prisma.contactMessage.findUnique({ where: { referenceId } }),
    prisma.doctorDetail.findUnique({
      where: { doctorId: input.doctorId },
      select: { id: true, isActive: true },
    }),
  ]);
  if (!contact) return { outcome: "NOT_FOUND" as const };
  if (!doctor?.isActive) return { outcome: "DOCTOR_NOT_FOUND" as const };
  if (contact.status === "RESOLVED") return { outcome: "RESOLVED" as const };
  const event = contact.assignedDoctorId
    ? "DOCTOR_REASSIGNED"
    : "DOCTOR_ASSIGNED";
  const updated = await prisma.$transaction(async (transaction) => {
    const value = await transaction.contactMessage.update({
      where: { id: contact.id },
      data: {
        assignedDoctorId: doctor.id,
        status: "IN_PROGRESS",
        adminNote: input.note ?? contact.adminNote,
      },
      select: contactSelect,
    });
    await transaction.contactRequestActivity.create({
      data: {
        contactMessageId: contact.id,
        event,
        previousStatus: contact.status,
        newStatus: "IN_PROGRESS",
        assignedDoctorId: doctor.id,
        note: input.note,
        performedByAdminId: adminId,
      },
    });
    return value;
  });
  return { outcome: "ASSIGNED" as const, data: presentContact(updated) };
};

export const updateContactFollowUp = async (
  referenceId: string,
  input: ContactFollowUpInput,
  adminId: string,
) => {
  const contact = await prisma.contactMessage.findUnique({
    where: { referenceId },
  });
  if (!contact) return null;
  const nextStatus = contact.status === "NEW" ? "IN_PROGRESS" : contact.status;
  const updated = await prisma.$transaction(async (transaction) => {
    const value = await transaction.contactMessage.update({
      where: { id: contact.id },
      data: {
        followUpMethod: input.method,
        adminNote: input.note ?? contact.adminNote,
        status: nextStatus,
      },
      select: contactSelect,
    });
    await transaction.contactRequestActivity.create({
      data: {
        contactMessageId: contact.id,
        event: "FOLLOW_UP_UPDATED",
        previousStatus: contact.status,
        newStatus: nextStatus,
        assignedDoctorId: contact.assignedDoctorId,
        followUpMethod: input.method,
        note: input.note,
        performedByAdminId: adminId,
      },
    });
    return value;
  });
  return presentContact(updated);
};

export const updateContactStatus = async (
  referenceId: string,
  input: ContactStatusInput,
  adminId: string,
) => {
  const contact = await prisma.contactMessage.findUnique({
    where: { referenceId },
  });
  if (!contact) return null;
  const updated = await prisma.$transaction(async (transaction) => {
    const value = await transaction.contactMessage.update({
      where: { id: contact.id },
      data: {
        status: input.status,
        adminNote: input.note ?? contact.adminNote,
        resolvedAt: input.status === "RESOLVED" ? new Date() : null,
      },
      select: contactSelect,
    });
    await transaction.contactRequestActivity.create({
      data: {
        contactMessageId: contact.id,
        event: "STATUS_CHANGED",
        previousStatus: contact.status,
        newStatus: input.status,
        assignedDoctorId: contact.assignedDoctorId,
        note: input.note,
        performedByAdminId: adminId,
      },
    });
    return value;
  });
  return presentContact(updated);
};

export const convertContactToAppointment = async (
  referenceId: string,
  input: ContactAppointmentInput,
  adminId: string,
) => {
  const contact = await prisma.contactMessage.findUnique({
    where: { referenceId },
  });
  if (!contact) return { outcome: "NOT_FOUND" as const };
  if (contact.convertedAppointmentId)
    return { outcome: "ALREADY_CONVERTED" as const };
  const normalizedPatientName = input.childName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const phone = contact.phone.replace(/\D/g, "").slice(-10);
  const result = await prisma.$transaction(async (transaction) => {
    const candidates = await transaction.patient.findMany({
      where: { normalizedPatientName },
    });
    const existingPatient = candidates.find(
      (item) => item.primaryPhone.replace(/\D/g, "").slice(-10) === phone,
    );
    const patient = existingPatient
      ? await transaction.patient.update({
          where: { id: existingPatient.id },
          data: {
            patientName: input.childName,
            parentName: contact.name,
            primaryPhone: phone,
            email: contact.email,
            ...(input.childDateOfBirth
              ? { dateOfBirth: new Date(`${input.childDateOfBirth}T00:00:00Z`) }
              : {}),
          },
        })
      : await transaction.patient.create({
          data: {
            patientName: input.childName,
            normalizedPatientName,
            parentName: contact.name,
            primaryPhone: phone,
            email: contact.email,
            dateOfBirth: input.childDateOfBirth
              ? new Date(`${input.childDateOfBirth}T00:00:00Z`)
              : undefined,
          },
        });
    const preferredDate = new Date(`${input.preferredDate}T00:00:00Z`);
    const duplicate = await transaction.appointmentRequest.findFirst({
      where: {
        patientDbId: patient.id,
        preferredDate,
        status: { not: "CANCELLED" },
      },
      select: { referenceId: true },
    });
    if (duplicate) return { duplicateReferenceId: duplicate.referenceId };
    const appointment = await transaction.appointmentRequest.create({
      data: {
        referenceId: `APT-${randomUUID().slice(0, 8).toUpperCase()}`,
        parentName: contact.name,
        childName: input.childName,
        childAge: input.childAge,
        childDateOfBirth: input.childDateOfBirth
          ? new Date(`${input.childDateOfBirth}T00:00:00Z`)
          : undefined,
        phone,
        email: contact.email,
        preferredDate,
        preferredTime: null,
        consent: input.consent,
        patientDbId: patient.id,
      },
    });
    await transaction.appointmentLog.create({
      data: {
        appointmentRequestId: appointment.id,
        patientDbId: patient.id,
        newStatus: "REQUESTED",
        event: "REQUEST_CREATED",
        note: `Created from contact request ${contact.referenceId}`,
        performedById: adminId,
        performedByRole: "ADMIN",
      },
    });
    await transaction.contactMessage.update({
      where: { id: contact.id },
      data: {
        convertedAppointmentId: appointment.id,
        status: "IN_PROGRESS",
      },
    });
    await transaction.contactRequestActivity.create({
      data: {
        contactMessageId: contact.id,
        event: "APPOINTMENT_CREATED",
        previousStatus: contact.status,
        newStatus: "IN_PROGRESS",
        assignedDoctorId: contact.assignedDoctorId,
        note: `Appointment ${appointment.referenceId} created`,
        performedByAdminId: adminId,
      },
    });
    return {
      data: {
        contactRequestReferenceId: contact.referenceId,
        appointmentReferenceId: appointment.referenceId,
        patientId: patient.patientId,
        appointmentStatus: appointment.status,
      },
    };
  });
  if ("duplicateReferenceId" in result)
    return {
      outcome: "DUPLICATE_APPOINTMENT" as const,
      referenceId: result.duplicateReferenceId,
    };
  return { outcome: "CREATED" as const, data: result.data };
};
