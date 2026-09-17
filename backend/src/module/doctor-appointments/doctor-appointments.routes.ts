import { Router } from "express";
import {
  getMyAppointment,
  getMyAppointments,
  getMyAvailability,
  getPatientCaseHistory,
  patchCaseHistory,
  postCaseHistory,
  postFollowUp,
} from "./doctor-appointments.controller";

const doctorAppointmentsRouter = Router();
doctorAppointmentsRouter.get("/", getMyAppointments);
doctorAppointmentsRouter.get("/availability", getMyAvailability);
doctorAppointmentsRouter.get("/:referenceId", getMyAppointment);
doctorAppointmentsRouter.post("/:referenceId/follow-up", postFollowUp);
doctorAppointmentsRouter.post("/:referenceId/case-history", postCaseHistory);
doctorAppointmentsRouter.get(
  "/patients/:patientId/case-history",
  getPatientCaseHistory,
);
doctorAppointmentsRouter.patch(
  "/case-history/:caseHistoryId",
  patchCaseHistory,
);
export default doctorAppointmentsRouter;
