import { Request, Response } from "express";
import {
  cancelFeedbackInvitation,
  createFeedbackInvitation,
  getFeedbackInvitation,
  getFeedbackResponse,
  listEligiblePatients,
  listFeedbackInvitations,
  listFeedbackResponses,
  moderateFeedbackResponse,
  resendFeedbackInvitation,
  verifyAppointmentFeedback,
} from "./admin-feedback.service";
import {
  createFeedbackInvitationSchema,
  eligiblePatientQuerySchema,
  feedbackVerificationQuerySchema,
  invitationListQuerySchema,
  invitationReferenceSchema,
  moderateFeedbackSchema,
  responseIdSchema,
  responseListQuerySchema,
} from "./admin-feedback.validation";

export const getEligiblePatients = async (
  request: Request,
  response: Response,
) => {
  const input = eligiblePatientQuerySchema.safeParse(request.query);
  if (!input.success) {
    response
      .status(400)
      .json({ success: false, message: "Invalid patient search." });
    return;
  }
  response.status(200).json({
    success: true,
    data: await listEligiblePatients(input.data.search),
  });
};

export const getFeedbackVerification = async (
  request: Request,
  response: Response,
) => {
  const input = feedbackVerificationQuerySchema.safeParse(request.query);
  if (!input.success) {
    response.status(400).json({
      success: false,
      message: "Enter a valid Patient ID and appointment reference.",
      errors: input.error.flatten().fieldErrors,
    });
    return;
  }
  const data = await verifyAppointmentFeedback(
    input.data.patientId,
    input.data.appointmentReferenceId,
  );
  response.status(data ? 200 : 404).json(
    data
      ? { success: true, data }
      : {
          success: false,
          message: "The appointment was not found for this patient.",
        },
  );
};

export const postInvitation = async (request: Request, response: Response) => {
  const input = createFeedbackInvitationSchema.safeParse(request.body);
  if (!input.success) {
    response.status(400).json({
      success: false,
      message: "Please correct the highlighted fields.",
      errors: input.error.flatten().fieldErrors,
    });
    return;
  }
  try {
    const result = await createFeedbackInvitation(
      response.locals.admin.id,
      input.data,
    );
    if (result.outcome === "PATIENT_NOT_FOUND") {
      response
        .status(404)
        .json({ success: false, message: "Patient was not found." });
      return;
    }
    if (result.outcome === "NO_ASSIGNED_APPOINTMENT") {
      response.status(409).json({
        success: false,
        message:
          "Assign this patient to a Doctor before creating a feedback link.",
      });
      return;
    }
    if (result.outcome === "FEEDBACK_ALREADY_SUBMITTED") {
      response.status(409).json({
        success: false,
        message: "Feedback has already been submitted for this appointment.",
        data: {
          invitationReferenceId: result.invitationReferenceId,
          responseId: result.responseId,
        },
      });
      return;
    }
    if (result.outcome === "ACTIVE_EXISTS") {
      response.status(409).json({
        success: false,
        message: "An active feedback link already exists for this visit.",
        data: result.invitation,
      });
      return;
    }
    response.status(201).json({
      success: true,
      message: "WhatsApp feedback link created successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Unable to create feedback invitation", error);
    response
      .status(500)
      .json({ success: false, message: "Unable to create the feedback link." });
  }
};

export const getInvitations = async (request: Request, response: Response) => {
  const input = invitationListQuerySchema.safeParse(request.query);
  if (!input.success) {
    response
      .status(400)
      .json({ success: false, message: "Invalid invitation filters." });
    return;
  }
  response
    .status(200)
    .json({ success: true, data: await listFeedbackInvitations(input.data) });
};
export const getInvitation = async (request: Request, response: Response) => {
  const ref = invitationReferenceSchema.safeParse(request.params.referenceId);
  if (!ref.success) {
    response
      .status(400)
      .json({ success: false, message: "Enter a valid feedback reference." });
    return;
  }
  const data = await getFeedbackInvitation(ref.data);
  response
    .status(data ? 200 : 404)
    .json(
      data
        ? { success: true, data }
        : { success: false, message: "Feedback invitation was not found." },
    );
};
export const postResend = async (request: Request, response: Response) => {
  const ref = invitationReferenceSchema.safeParse(request.params.referenceId);
  if (!ref.success) {
    response
      .status(400)
      .json({ success: false, message: "Enter a valid feedback reference." });
    return;
  }
  const result = await resendFeedbackInvitation(ref.data);
  if (result.outcome === "NOT_FOUND") {
    response
      .status(404)
      .json({ success: false, message: "Feedback invitation was not found." });
    return;
  }
  if (result.outcome === "UNAVAILABLE") {
    response.status(409).json({
      success: false,
      message: "Submitted or cancelled feedback links cannot be resent.",
    });
    return;
  }
  response.status(200).json({
    success: true,
    message:
      "A new WhatsApp feedback link was generated. The previous link is no longer valid.",
    data: result,
  });
};
export const patchCancel = async (request: Request, response: Response) => {
  const ref = invitationReferenceSchema.safeParse(request.params.referenceId);
  if (!ref.success) {
    response
      .status(400)
      .json({ success: false, message: "Enter a valid feedback reference." });
    return;
  }
  const outcome = await cancelFeedbackInvitation(ref.data);
  if (outcome === "NOT_FOUND") {
    response
      .status(404)
      .json({ success: false, message: "Feedback invitation was not found." });
    return;
  }
  if (outcome === "SUBMITTED") {
    response.status(409).json({
      success: false,
      message: "Submitted feedback cannot be cancelled.",
    });
    return;
  }
  response.status(200).json({
    success: true,
    message: "Feedback invitation cancelled successfully.",
  });
};

export const getResponses = async (request: Request, response: Response) => {
  const input = responseListQuerySchema.safeParse(request.query);
  if (!input.success) {
    response
      .status(400)
      .json({ success: false, message: "Invalid response filters." });
    return;
  }
  response
    .status(200)
    .json({ success: true, data: await listFeedbackResponses(input.data) });
};
export const getResponse = async (request: Request, response: Response) => {
  const id = responseIdSchema.safeParse(request.params.responseId);
  if (!id.success) {
    response
      .status(400)
      .json({ success: false, message: "Enter a valid response ID." });
    return;
  }
  const data = await getFeedbackResponse(id.data);
  response
    .status(data ? 200 : 404)
    .json(
      data
        ? { success: true, data }
        : { success: false, message: "Feedback response was not found." },
    );
};
export const patchModeration = async (request: Request, response: Response) => {
  const id = responseIdSchema.safeParse(request.params.responseId);
  const input = moderateFeedbackSchema.safeParse(request.body);
  if (!id.success || !input.success) {
    response.status(400).json({
      success: false,
      message: "Enter a valid response ID and moderation status.",
    });
    return;
  }
  const result = await moderateFeedbackResponse(
    id.data,
    input.data.status,
    response.locals.admin.id,
  );
  if (result.outcome === "NOT_FOUND") {
    response
      .status(404)
      .json({ success: false, message: "Feedback response was not found." });
    return;
  }
  if (result.outcome === "CONSENT_REQUIRED") {
    response.status(409).json({
      success: false,
      message:
        "This parent did not consent to publication. The feedback cannot be approved for the public page.",
    });
    return;
  }
  response.status(200).json({
    success: true,
    message: `Feedback ${input.data.status.toLowerCase()} successfully.`,
    data: result.response,
  });
};
