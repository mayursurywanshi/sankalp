import { Router } from "express";
import { getOurImpact } from "./our-impact.controller";

const ourImpactRouter = Router();
ourImpactRouter.get("/", getOurImpact);

export default ourImpactRouter;
