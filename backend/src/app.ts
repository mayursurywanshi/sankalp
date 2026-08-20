import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import aboutRouter from "./module/about/about.routes";
import appointmentsRouter from "./module/appointments/appointments.routes";
import childDevelopmentRouter from "./module/child-development/child-development.routes";
import contactRouter from "./module/contact/contact.routes";
import homeRouter from "./module/home/home.routes";
import ourImpactRouter from "./module/our-impact/our-impact.routes";
import servicesRouter from "./module/services/services.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/api/health", (_request: Request, response: Response) => {
  response.status(200).json({
    success: true,
    message: "Sankalp API is running",
  });
});

app.use("/api/about", aboutRouter);
app.use("/api", appointmentsRouter);
app.use("/api/child-development", childDevelopmentRouter);
app.use("/api/contact", contactRouter);
app.use("/api/home", homeRouter);
app.use("/api/our-impact", ourImpactRouter);
app.use("/api/services", servicesRouter);

export default app;
