import { createHash } from "node:crypto";
import { prisma } from "../../config/database.config";
import { SubmitFeedbackInput } from "./feedback.validation";

export const hashFeedbackToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const findInvitation = (token: string) =>
  prisma.feedbackInvitation.findUnique({
    where: { tokenHash: hashFeedbackToken(token) },
    include: {
      patient: { select: { patientName: true, parentName: true } },
      response: true,
    },
  });

export const feedbackInvitationAvailability = (
  invitation: Awaited<ReturnType<typeof findInvitation>>,
) => {
  if (!invitation) return "NOT_FOUND" as const;
  if (invitation.status === "CANCELLED") return "CANCELLED" as const;
  if (invitation.status === "SUBMITTED" || invitation.response)
    return "SUBMITTED" as const;
  if (invitation.expiresAt <= new Date() || invitation.status === "EXPIRED")
    return "EXPIRED" as const;
  return "AVAILABLE" as const;
};

export const openFeedbackInvitation = async (token: string) => {
  const invitation = await findInvitation(token);
  const outcome = feedbackInvitationAvailability(invitation);
  if (!invitation || outcome !== "AVAILABLE") {
    if (invitation && outcome === "EXPIRED" && invitation.status !== "EXPIRED")
      await prisma.feedbackInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
    return { outcome };
  }
  if (!invitation.openedAt)
    await prisma.feedbackInvitation.update({
      where: { id: invitation.id },
      data: { status: "OPENED", openedAt: new Date() },
    });
  return {
    outcome,
    data: {
      parentName: invitation.patient.parentName,
      childName: invitation.patient.patientName,
      expiresAt: invitation.expiresAt.toISOString(),
    },
  };
};

export const submitParentFeedback = async (
  token: string,
  input: SubmitFeedbackInput,
) => {
  const invitation = await findInvitation(token);
  const outcome = feedbackInvitationAvailability(invitation);
  if (!invitation || outcome !== "AVAILABLE") return { outcome };
  const response = await prisma.$transaction(async (transaction) => {
    const created = await transaction.parentFeedbackResponse.create({
      data: {
        feedbackInvitationId: invitation.id,
        patientDbId: invitation.patientDbId,
        ...input,
      },
    });
    await transaction.feedbackInvitation.update({
      where: { id: invitation.id },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
    return created;
  });
  return {
    outcome: "SUBMITTED_NOW" as const,
    data: {
      id: response.id,
      rating: response.rating,
      moderationStatus: response.moderationStatus,
      submittedAt: response.submittedAt.toISOString(),
    },
  };
};

export const listApprovedParentFeedback = () =>
  prisma.parentFeedbackResponse.findMany({
    where: { moderationStatus: "APPROVED", consentToPublish: true },
    orderBy: { submittedAt: "desc" },
    take: 20,
    select: {
      id: true,
      rating: true,
      feedback: true,
      parentDisplayName: true,
      submittedAt: true,
    },
  });
