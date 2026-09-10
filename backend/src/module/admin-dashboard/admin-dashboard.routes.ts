import { Router } from "express";
import { requireAuthenticatedAdmin } from "../auth/auth.middleware";
import { getAdminDashboard } from "./admin-dashboard.controller";
import doctorAdminRouter from "../doctors/doctors.routes";
import adminAppointmentsRouter from "../admin-appointments/admin-appointments.routes";
import adminPatientsRouter from "../admin-patients/admin-patients.routes";
import adminSearchRouter from "../admin-search/admin-search.routes";
import adminSuccessStoriesRouter from "../admin-success-stories/admin-success-stories.routes";

const adminDashboardRouter = Router();

// Every current and future /api/admin route must pass through Admin authorization.
adminDashboardRouter.use(requireAuthenticatedAdmin);
adminDashboardRouter.get("/dashboard", getAdminDashboard);
adminDashboardRouter.use("/search", adminSearchRouter);
adminDashboardRouter.use("/doctors", doctorAdminRouter);
adminDashboardRouter.use("/appointments", adminAppointmentsRouter);
adminDashboardRouter.use("/patients", adminPatientsRouter);
adminDashboardRouter.use("/success-stories-posts", adminSuccessStoriesRouter);

export default adminDashboardRouter;
