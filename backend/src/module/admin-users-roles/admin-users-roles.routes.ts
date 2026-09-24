import { Router } from "express";
import {
  getLoginActivity,
  getSummary,
  getUser,
  getUsers,
  patchUserStatus,
  postUserRole,
} from "./admin-users-roles.controller";

const adminUsersRolesRouter = Router();

adminUsersRolesRouter.get("/summary", getSummary);
adminUsersRolesRouter.get("/", getUsers);
adminUsersRolesRouter.post("/", postUserRole);
adminUsersRolesRouter.get("/:role/:userId/login-activity", getLoginActivity);
adminUsersRolesRouter.get("/:role/:userId", getUser);
adminUsersRolesRouter.patch("/:role/:userId/status", patchUserStatus);

export default adminUsersRolesRouter;
