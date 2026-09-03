import { Router } from "express";
import { getMyAppointment, getMyAppointments, getPatientCaseHistory, patchCaseHistory, postCaseHistory } from "./doctor-appointments.controller";

const doctorAppointmentsRouter = Router();
doctorAppointmentsRouter.get("/", getMyAppointments);
doctorAppointmentsRouter.get("/:referenceId", getMyAppointment);
doctorAppointmentsRouter.post("/:referenceId/case-history", postCaseHistory);
doctorAppointmentsRouter.get("/patients/:patientId/case-history", getPatientCaseHistory);
doctorAppointmentsRouter.patch("/case-history/:caseHistoryId", patchCaseHistory);
export default doctorAppointmentsRouter;
