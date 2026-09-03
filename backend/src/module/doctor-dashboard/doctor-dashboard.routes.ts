import { Router } from "express";
import { requireAuthenticatedDoctor } from "../auth/auth.middleware";
import doctorAppointmentsRouter from "../doctor-appointments/doctor-appointments.routes";

const doctorDashboardRouter = Router();
doctorDashboardRouter.use(requireAuthenticatedDoctor);
doctorDashboardRouter.get("/overview", (_request, response) => {
  response.status(200).json({ success: true, data: { doctor: response.locals.doctor, message: "Doctor dashboard access verified." } });
});
doctorDashboardRouter.use("/appointments", doctorAppointmentsRouter);

export default doctorDashboardRouter;
