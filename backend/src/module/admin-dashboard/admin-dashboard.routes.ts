import { Router } from "express";
import { requireAuthenticatedAdmin } from "../auth/auth.middleware";
import { getAdminDashboard } from "./admin-dashboard.controller";

const adminDashboardRouter = Router();

// Every current and future /api/admin route must pass through Admin authorization.
adminDashboardRouter.use(requireAuthenticatedAdmin);
adminDashboardRouter.get("/dashboard", getAdminDashboard);

export default adminDashboardRouter;
