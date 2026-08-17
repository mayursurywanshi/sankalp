import { Router } from "express";
import { getAbout } from "./about.controller";

const aboutRouter = Router();

aboutRouter.get("/", getAbout);

export default aboutRouter;
