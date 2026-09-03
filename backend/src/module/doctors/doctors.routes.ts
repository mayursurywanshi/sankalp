import { Router } from "express";
import { deleteDoctor, getDoctor, getDoctors, postDoctorCredentials, postDoctorDetails } from "./doctors.controller";
import { getAppointments } from "../admin-appointments/admin-appointments.controller";

const doctorAdminRouter = Router();

doctorAdminRouter.get("/", getDoctors);
doctorAdminRouter.get("/:doctorId", getDoctor);
doctorAdminRouter.post("/", postDoctorDetails);
doctorAdminRouter.post("/:doctorId/credentials", postDoctorCredentials);
doctorAdminRouter.delete("/:doctorId", deleteDoctor);
doctorAdminRouter.get("/:doctorId/appointments", (request, response, next) => { request.query.doctorId = request.params.doctorId; void getAppointments(request, response).catch(next); });

export default doctorAdminRouter;
