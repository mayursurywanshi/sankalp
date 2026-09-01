import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import authRouter from "./module/auth/auth.routes";
import aboutRouter from "./module/about/about.routes";
import appointmentsRouter from "./module/appointments/appointments.routes";
import childDevelopmentRouter from "./module/child-development/child-development.routes";
import contactRouter from "./module/contact/contact.routes";
import homeRouter from "./module/home/home.routes";
import ourImpactRouter from "./module/our-impact/our-impact.routes";
import servicesRouter from "./module/services/services.routes";
import { env } from "./config/env.config";

const app = express();

const isAllowedOrigin = (origin?: string) => {
  if (!origin || origin === env.FRONTEND_URL) return true;
  if (env.NODE_ENV !== "production") {
    return /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin);
  }
  return false;
};

app.use(helmet());
app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) callback(null, true);
    else callback(new Error("Origin is not allowed by CORS"));
  },
}));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_request: Request, response: Response) => {
  response.status(200).json({
    success: true,
    message: "Sankalp API is running",
  });
});

app.use("/api/about", aboutRouter);
app.use("/api/auth", authRouter);
app.use("/api", appointmentsRouter);
app.use("/api/child-development", childDevelopmentRouter);
app.use("/api/contact", contactRouter);
app.use("/api/home", homeRouter);
app.use("/api/our-impact", ourImpactRouter);
app.use("/api/services", servicesRouter);

export default app;
