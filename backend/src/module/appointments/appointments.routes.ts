import { Router } from "express";
import { getAppointmentContent, submitAppointmentRequest } from "./appointments.controller";
import { createPublicSubmissionRateLimit } from "../../middleware/public-submission-rate-limit";

const appointmentsRouter = Router();

appointmentsRouter.get("/appointments-request", getAppointmentContent);
appointmentsRouter.post("/appointments", createPublicSubmissionRateLimit(), submitAppointmentRequest);

export default appointmentsRouter;
