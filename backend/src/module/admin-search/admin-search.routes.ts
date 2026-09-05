import { Router } from "express";
import { getAdminSearch } from "./admin-search.controller";

const adminSearchRouter = Router();
adminSearchRouter.get("/", getAdminSearch);
export default adminSearchRouter;
