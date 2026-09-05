import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import authRouter from "./module/auth/auth.routes";
import adminDashboardRouter from "./module/admin-dashboard/admin-dashboard.routes";
import aboutRouter from "./module/about/about.routes";
import appointmentsRouter from "./module/appointments/appointments.routes";
import childDevelopmentRouter from "./module/child-development/child-development.routes";
import contactRouter from "./module/contact/contact.routes";
import homeRouter from "./module/home/home.routes";
import ourImpactRouter from "./module/our-impact/our-impact.routes";
import servicesRouter from "./module/services/services.routes";
import doctorDashboardRouter from "./module/doctor-dashboard/doctor-dashboard.routes";
import { env } from "./config/env.config";

const app = express();

const configuredOrigins = new Set([
  env.FRONTEND_URL,
  ...env.CORS_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
]);

const isAllowedOrigin = (origin?: string) => {
  if (!origin || configuredOrigins.has(origin)) return true;
  if (env.NODE_ENV !== "production") {
    return /^https?:\/\/(?:localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(?::\d+)?$/.test(origin);
  }
  return false;
};

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) callback(null, true);
    else {
      callback(new Error("Origin is not allowed by CORS"));
    }
  },
}));
app.use(express.json());

app.get("/api/health", (_request: Request, response: Response) => {
  response.status(200).json({
    success: true,
    message: "Sankalp API is running",
  });
});

app.use("/api/about", aboutRouter);
app.use("/api/admin", adminDashboardRouter);
app.use("/api/auth", authRouter);
app.use("/api", appointmentsRouter);
app.use("/api/child-development", childDevelopmentRouter);
app.use("/api/doctor", doctorDashboardRouter);
app.use("/api/contact", contactRouter);
app.use("/api/home", homeRouter);
app.use("/api/our-impact", ourImpactRouter);
app.use("/api/services", servicesRouter);

app.use((error: Error, _request: Request, response: Response, next: NextFunction) => {
  if (error.message === "Origin is not allowed by CORS") {
    response.status(403).json({ success: false, message: "This website origin is not allowed to access the Sankalp API." });
    return;
  }
  next(error);
});

export default app;
