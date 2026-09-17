import { createHash, randomBytes, randomUUID } from "node:crypto";
import { prisma } from "../../config/database.config";
import { env } from "../../config/env.config";
import { InvitationListQuery, ResponseListQuery } from "./admin-feedback.validation";

const normalizeWhatsAppPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

const createToken = () => randomBytes(9).toString("base64url");
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const displayExpiry = (date: Date) => new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(date);

const buildWhatsAppMessage = (parentName: string, childName: string, feedbackLink: string, expiresAt: Date) => `Hello ${parentName} 👋

Thank you for choosing Sankalp Physiotherapy and Child Development Clinic for your child ${childName}’s care.

Your experience is important to us and helps us provide better care to every child and family.

Please share your feedback and rating using the secure link below:

${feedbackLink}

This link is valid until ${displayExpiry(expiresAt)} and can be submitted only once.

Your response will remain private and will appear on our website only if you give permission and it is approved by our team.

Warm regards,
Team Sankalp 🌈`;

const invitationSelect = {
  id: true, referenceId: true, recipientPhone: true, status: true, expiresAt: true, sentAt: true, openedAt: true, submittedAt: true, createdAt: true,
  patient: { select: { patientId: true, patientName: true, parentName: true, primaryPhone: true, email: true } },
  appointment: { select: { referenceId: true, scheduledDate: true, scheduledTime: true } },
  createdBy: { select: { fullName: true, loginId: true } },
  response: { select: { id: true, rating: true, moderationStatus: true, consentToPublish: true } },
} as const;

const expireIfNeeded = async <T extends { id: string; status: string; expiresAt: Date }>(invitation: T) => {
  if (!["SUBMITTED", "CANCELLED", "EXPIRED"].includes(invitation.status) && invitation.expiresAt <= new Date()) {
    await prisma.feedbackInvitation.update({ where: { id: invitation.id }, data: { status: "EXPIRED" } });
    return { ...invitation, status: "EXPIRED" };
  }
  return invitation;
};

const shareDetails = (token: string, patient: { parentName: string; patientName: string }, phone: string, expiresAt: Date) => {
  const shortFeedbackLink = `${env.FRONTEND_URL.replace(/\/$/, "")}/f/${token}`;
  const message = buildWhatsAppMessage(patient.parentName, patient.patientName, shortFeedbackLink, expiresAt);
  return { shortFeedbackLink, whatsappMessage: message, whatsappUrl: `https://wa.me/${normalizeWhatsAppPhone(phone)}?text=${encodeURIComponent(message)}` };
};

export const listEligiblePatients = (search?: string) => prisma.patient.findMany({
  where: {
    isActive: true,
    appointments: { some: { status: "COMPLETED" } },
    ...(search ? { OR: [{ patientId: { contains: search, mode: "insensitive" } }, { patientName: { contains: search, mode: "insensitive" } }, { parentName: { contains: search, mode: "insensitive" } }, { primaryPhone: { contains: search } }] } : {}),
  },
  orderBy: { patientName: "asc" }, take: 25,
  select: { patientId: true, patientName: true, parentName: true, primaryPhone: true, email: true, appointments: { where: { status: "COMPLETED" }, orderBy: { updatedAt: "desc" }, take: 5, select: { referenceId: true, scheduledDate: true, scheduledTime: true, feedbackInvitations: { orderBy: { createdAt: "desc" }, take: 1, select: { referenceId: true, status: true, expiresAt: true, response: { select: { id: true, rating: true, moderationStatus: true, submittedAt: true } } } } } } },
});

export const verifyAppointmentFeedback = async (patientId: string, appointmentReferenceId: string) => {
  const appointment = await prisma.appointmentRequest.findFirst({
    where: { referenceId: appointmentReferenceId, patient: { patientId } },
    select: { referenceId: true, patient: { select: { patientId: true } }, feedbackInvitations: { orderBy: { createdAt: "desc" }, take: 1, select: { referenceId: true, status: true, expiresAt: true, submittedAt: true, response: { select: { id: true, rating: true, moderationStatus: true, submittedAt: true } } } } },
  });
  if (!appointment) return null;
  const invitation = appointment.feedbackInvitations[0] ?? null;
  return {
    patientId: appointment.patient.patientId,
    appointmentReferenceId: appointment.referenceId,
    feedbackSubmitted: Boolean(invitation?.response),
    invitationReferenceId: invitation?.referenceId ?? null,
    invitationStatus: invitation?.status ?? null,
    responseId: invitation?.response?.id ?? null,
    rating: invitation?.response?.rating ?? null,
    moderationStatus: invitation?.response?.moderationStatus ?? null,
    submittedAt: invitation?.response?.submittedAt.toISOString() ?? invitation?.submittedAt?.toISOString() ?? null,
  };
};

export const createFeedbackInvitation = async (adminId: string, input: { patientId: string; appointmentReferenceId?: string }) => {
  const patient = await prisma.patient.findUnique({ where: { patientId: input.patientId }, include: { appointments: { where: { status: "COMPLETED", ...(input.appointmentReferenceId ? { referenceId: input.appointmentReferenceId } : {}) }, orderBy: { updatedAt: "desc" }, take: 1 } } });
  if (!patient) return { outcome: "PATIENT_NOT_FOUND" as const };
  const appointment = patient.appointments[0];
  if (!appointment) return { outcome: "NO_COMPLETED_APPOINTMENT" as const };
  const submitted = await prisma.feedbackInvitation.findFirst({ where: { patientDbId: patient.id, appointmentRequestId: appointment.id, response: { isNot: null } }, orderBy: { createdAt: "desc" }, select: { referenceId: true, response: { select: { id: true } } } });
  if (submitted?.response) return { outcome: "FEEDBACK_ALREADY_SUBMITTED" as const, invitationReferenceId: submitted.referenceId, responseId: submitted.response.id };
  const existing = await prisma.feedbackInvitation.findFirst({ where: { patientDbId: patient.id, appointmentRequestId: appointment.id, status: { in: ["CREATED", "SENT", "OPENED"] }, expiresAt: { gt: new Date() } }, select: invitationSelect });
  if (existing) return { outcome: "ACTIVE_EXISTS" as const, invitation: existing };
  const token = createToken();
  const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 14);
  const invitation = await prisma.feedbackInvitation.create({ data: { referenceId: `FDB-${randomUUID().slice(0, 8).toUpperCase()}`, tokenHash: hashToken(token), patientDbId: patient.id, appointmentRequestId: appointment.id, recipientPhone: patient.primaryPhone, expiresAt, createdByAdminId: adminId }, select: invitationSelect });
  return { outcome: "CREATED" as const, invitation, share: shareDetails(token, patient, patient.primaryPhone, expiresAt) };
};

export const listFeedbackInvitations = async (query: InvitationListQuery) => {
  await prisma.feedbackInvitation.updateMany({ where: { expiresAt: { lte: new Date() }, status: { in: ["CREATED", "SENT", "OPENED"] } }, data: { status: "EXPIRED" } });
  const where = query.status ? { status: query.status } : {};
  const [items, total] = await prisma.$transaction([prisma.feedbackInvitation.findMany({ where, select: invitationSelect, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit }), prisma.feedbackInvitation.count({ where })]);
  return { items, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
};

export const getFeedbackInvitation = async (referenceId: string) => {
  const invitation = await prisma.feedbackInvitation.findUnique({ where: { referenceId }, select: invitationSelect });
  return invitation ? expireIfNeeded(invitation) : null;
};

export const resendFeedbackInvitation = async (referenceId: string) => {
  const invitation = await prisma.feedbackInvitation.findUnique({ where: { referenceId }, include: { patient: true } });
  if (!invitation) return { outcome: "NOT_FOUND" as const };
  if (["SUBMITTED", "CANCELLED"].includes(invitation.status)) return { outcome: "UNAVAILABLE" as const };
  const token = createToken(); const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 14);
  const updated = await prisma.feedbackInvitation.update({ where: { id: invitation.id }, data: { tokenHash: hashToken(token), status: "SENT", expiresAt, sentAt: new Date(), openedAt: null }, select: invitationSelect });
  return { outcome: "RESENT" as const, invitation: updated, share: shareDetails(token, invitation.patient, invitation.recipientPhone, expiresAt) };
};

export const cancelFeedbackInvitation = async (referenceId: string) => {
  const invitation = await prisma.feedbackInvitation.findUnique({ where: { referenceId } });
  if (!invitation) return "NOT_FOUND" as const;
  if (invitation.status === "SUBMITTED") return "SUBMITTED" as const;
  await prisma.feedbackInvitation.update({ where: { id: invitation.id }, data: { status: "CANCELLED" } });
  return "CANCELLED" as const;
};

export const listFeedbackResponses = async (query: ResponseListQuery) => {
  const where = query.status ? { moderationStatus: query.status } : {};
  const select = { id: true, rating: true, feedback: true, parentDisplayName: true, consentToPublish: true, moderationStatus: true, submittedAt: true, moderatedAt: true, patient: { select: { patientId: true, patientName: true, parentName: true } }, invitation: { select: { referenceId: true } }, moderatedBy: { select: { fullName: true } } } as const;
  const [items, total] = await prisma.$transaction([prisma.parentFeedbackResponse.findMany({ where, select, orderBy: { submittedAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit }), prisma.parentFeedbackResponse.count({ where })]);
  return { items, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
};

export const getFeedbackResponse = (id: string) => prisma.parentFeedbackResponse.findUnique({ where: { id }, include: { patient: { select: { patientId: true, patientName: true, parentName: true } }, invitation: { select: { referenceId: true } }, moderatedBy: { select: { fullName: true } } } });

export const moderateFeedbackResponse = async (id: string, status: "APPROVED" | "REJECTED", adminId: string) => {
  const response = await prisma.parentFeedbackResponse.findUnique({ where: { id } });
  if (!response) return { outcome: "NOT_FOUND" as const };
  if (status === "APPROVED" && !response.consentToPublish) return { outcome: "CONSENT_REQUIRED" as const };
  const updated = await prisma.parentFeedbackResponse.update({ where: { id }, data: { moderationStatus: status, moderatedByAdminId: adminId, moderatedAt: new Date() } });
  return { outcome: "UPDATED" as const, response: updated };
};
