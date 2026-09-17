import { Router } from "express";
import { createPublicSubmissionRateLimit } from "../../middleware/public-submission-rate-limit";
import { getFeedbackForm, postFeedback } from "./feedback.controller";

const feedbackRouter = Router();
feedbackRouter.get("/:token", getFeedbackForm);
feedbackRouter.post("/:token", createPublicSubmissionRateLimit(), postFeedback);
export default feedbackRouter;
