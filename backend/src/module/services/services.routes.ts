import { Router } from "express";
import { getServices } from "./services.controller";

const servicesRouter = Router();

servicesRouter.get("/", getServices);

export default servicesRouter;
