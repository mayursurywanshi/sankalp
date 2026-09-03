import { Router } from "express";
import { requireAuthenticatedAdmin } from "../auth/auth.middleware";
import { getAdminDashboard } from "./admin-dashboard.controller";
import doctorAdminRouter from "../doctors/doctors.routes";
import adminAppointmentsRouter from "../admin-appointments/admin-appointments.routes";

const adminDashboardRouter = Router();

// Every current and future /api/admin route must pass through Admin authorization.
adminDashboardRouter.use(requireAuthenticatedAdmin);
adminDashboardRouter.get("/dashboard", getAdminDashboard);
adminDashboardRouter.use("/doctors", doctorAdminRouter);
adminDashboardRouter.use("/appointments", adminAppointmentsRouter);

export default adminDashboardRouter;
