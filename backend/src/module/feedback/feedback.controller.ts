import { Request, Response } from "express";
import {
  openFeedbackInvitation,
  submitParentFeedback,
} from "./feedback.service";
import {
  feedbackTokenSchema,
  submitFeedbackSchema,
} from "./feedback.validation";

const unavailable = (outcome: string, response: Response) => {
  const messages: Record<string, string> = {
    NOT_FOUND: "This feedback link is invalid.",
    EXPIRED: "This feedback link has expired.",
    CANCELLED: "This feedback link was cancelled.",
    SUBMITTED: "Feedback has already been submitted using this link.",
  };
  response.status(outcome === "NOT_FOUND" ? 404 : 410).json({
    success: false,
    code: outcome,
    message: messages[outcome] ?? "This feedback link is unavailable.",
  });
};

export const getFeedbackForm = async (request: Request, response: Response) => {
  const token = feedbackTokenSchema.safeParse(request.params.token);
  if (!token.success) {
    response
      .status(404)
      .json({ success: false, message: "This feedback link is invalid." });
    return;
  }
  try {
    const result = await openFeedbackInvitation(token.data);
    if (result.outcome === "SUBMITTED") {
      response.status(200).json({
        success: true,
        data: { status: "SUBMITTED" },
        message: "Your feedback is already submitted.",
      });
      return;
    }
    if (result.outcome !== "AVAILABLE") {
      unavailable(result.outcome, response);
      return;
    }
    response.status(200).json({
      success: true,
      data: { status: "AVAILABLE", ...result.data },
    });
  } catch (error) {
    console.error("Unable to open feedback link", error);
    response
      .status(500)
      .json({ success: false, message: "Unable to open the feedback form." });
  }
};

export const postFeedback = async (request: Request, response: Response) => {
  const token = feedbackTokenSchema.safeParse(request.params.token);
  const body = submitFeedbackSchema.safeParse(request.body);
  if (!token.success) {
    response
      .status(404)
      .json({ success: false, message: "This feedback link is invalid." });
    return;
  }
  if (!body.success) {
    response
      .status(400)
      .json({
        success: false,
        message: "Please correct the highlighted fields.",
        errors: body.error.flatten().fieldErrors,
      });
    return;
  }
  try {
    const result = await submitParentFeedback(token.data, body.data);
    if (result.outcome !== "SUBMITTED_NOW") {
      unavailable(result.outcome, response);
      return;
    }
    response
      .status(201)
      .json({
        success: true,
        message: "Thank you for sharing your feedback with Sankalp! 😊",
        data: result.data,
      });
  } catch (error) {
    console.error("Unable to submit feedback", error);
    response
      .status(500)
      .json({
        success: false,
        message: "Unable to submit your feedback. Please try again.",
      });
  }
};
