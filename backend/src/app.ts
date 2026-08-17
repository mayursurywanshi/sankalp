import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import homeRouter from "./module/home/home.routes";

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

app.use("/api/home", homeRouter);

export default app;
