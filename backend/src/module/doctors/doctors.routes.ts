import { Router } from "express";
import { deleteDoctor, getDoctor, getDoctors, postDoctorCredentials, postDoctorDetails } from "./doctors.controller";

const doctorAdminRouter = Router();

doctorAdminRouter.get("/", getDoctors);
doctorAdminRouter.get("/:doctorId", getDoctor);
doctorAdminRouter.post("/", postDoctorDetails);
doctorAdminRouter.post("/:doctorId/credentials", postDoctorCredentials);
doctorAdminRouter.delete("/:doctorId", deleteDoctor);

export default doctorAdminRouter;
