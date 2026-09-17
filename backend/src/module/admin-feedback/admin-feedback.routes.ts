import { Router } from "express";
import { getEligiblePatients, getFeedbackVerification, getInvitation, getInvitations, getResponse, getResponses, patchCancel, patchModeration, postInvitation, postResend } from "./admin-feedback.controller";

const adminFeedbackRouter = Router();
adminFeedbackRouter.get("/eligible-patients", getEligiblePatients);
adminFeedbackRouter.get("/verification", getFeedbackVerification);
adminFeedbackRouter.post("/invitations", postInvitation);
adminFeedbackRouter.get("/invitations", getInvitations);
adminFeedbackRouter.get("/invitations/:referenceId", getInvitation);
adminFeedbackRouter.post("/invitations/:referenceId/resend", postResend);
adminFeedbackRouter.patch("/invitations/:referenceId/cancel", patchCancel);
adminFeedbackRouter.get("/responses", getResponses);
adminFeedbackRouter.get("/responses/:responseId", getResponse);
adminFeedbackRouter.patch("/responses/:responseId/moderation", patchModeration);
export default adminFeedbackRouter;
