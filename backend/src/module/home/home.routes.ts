import { Router } from "express";
import { getHome } from "./home.controller";

const homeRouter = Router();
homeRouter.get("/", getHome);

export default homeRouter;
