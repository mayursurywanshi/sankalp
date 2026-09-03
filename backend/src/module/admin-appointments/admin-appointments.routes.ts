import { Router } from "express";
import { getAppointment, getAppointments, getSummary, patchStatus, postAssignment } from "./admin-appointments.controller";

const adminAppointmentsRouter = Router();
adminAppointmentsRouter.get("/", getAppointments);
adminAppointmentsRouter.get("/summary", getSummary);
adminAppointmentsRouter.get("/:referenceId", getAppointment);
adminAppointmentsRouter.post("/:referenceId/assignment", postAssignment);
adminAppointmentsRouter.patch("/:referenceId/status", patchStatus);

export default adminAppointmentsRouter;
