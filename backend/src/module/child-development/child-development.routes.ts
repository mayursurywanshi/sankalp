import { Router } from "express";
import { getChildDevelopment } from "./child-development.controller";

const childDevelopmentRouter = Router();

childDevelopmentRouter.get("/", getChildDevelopment);

export default childDevelopmentRouter;
