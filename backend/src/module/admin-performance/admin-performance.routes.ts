import { Router } from "express";
import {
  getDoctor,
  getDoctors,
  getOverview,
} from "./admin-performance.controller";

const adminPerformanceRouter = Router();
adminPerformanceRouter.get("/overview", getOverview);
adminPerformanceRouter.get("/doctors", getDoctors);
adminPerformanceRouter.get("/doctors/:doctorId", getDoctor);

export default adminPerformanceRouter;
