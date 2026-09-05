import { Router } from "express";
import { getPatient, getPatients, getSummary, patchPatient, postPatient } from "./admin-patients.controller";

const adminPatientsRouter = Router();
adminPatientsRouter.get("/summary", getSummary);
adminPatientsRouter.get("/", getPatients);
adminPatientsRouter.post("/", postPatient);
adminPatientsRouter.get("/:patientId", getPatient);
adminPatientsRouter.patch("/:patientId", patchPatient);
export default adminPatientsRouter;
