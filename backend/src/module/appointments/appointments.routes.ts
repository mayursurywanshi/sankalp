import { Router } from "express";
import { getAppointmentContent, submitAppointmentRequest } from "./appointments.controller";

const appointmentsRouter = Router();

appointmentsRouter.get("/appointments-request", getAppointmentContent);
appointmentsRouter.post("/appointments", submitAppointmentRequest);

export default appointmentsRouter;
