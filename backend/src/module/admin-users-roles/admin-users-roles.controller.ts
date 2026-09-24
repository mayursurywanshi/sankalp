import { Request, Response } from "express";
import {
  createUserRole,
  getUserLoginActivity,
  getUserRole,
  getUsersRolesSummary,
  listUsersRoles,
  updateUserRoleStatus,
} from "./admin-users-roles.service";
import {
  createUserRoleSchema,
  updateUserStatusSchema,
  userIdSchema,
  userRoleSchema,
  usersListSchema,
} from "./admin-users-roles.validation";

const identifiers = (request: Request) => {
  const role = userRoleSchema.safeParse(
    String(request.params.role ?? "").toUpperCase(),
  );
  const userId = userIdSchema.safeParse(request.params.userId);
  return role.success && userId.success
    ? { role: role.data, userId: userId.data }
    : null;
};

export const getSummary = async (_request: Request, response: Response) => {
  response
    .status(200)
    .json({ success: true, data: await getUsersRolesSummary() });
};

export const getUsers = async (request: Request, response: Response) => {
  const parsed = usersListSchema.safeParse(request.query);
  if (!parsed.success) {
    response
      .status(400)
      .json({
        success: false,
        message: "Invalid user filters.",
        errors: parsed.error.flatten().fieldErrors,
      });
    return;
  }
  response
    .status(200)
    .json({ success: true, data: await listUsersRoles(parsed.data) });
};

export const getUser = async (request: Request, response: Response) => {
  const parsed = identifiers(request);
  if (!parsed) {
    response
      .status(400)
      .json({ success: false, message: "Enter a valid role and user ID." });
    return;
  }
  const user = await getUserRole(parsed.role, parsed.userId);
  response
    .status(user ? 200 : 404)
    .json(
      user
        ? { success: true, data: user }
        : { success: false, message: "User was not found." },
    );
};

export const postUserRole = async (request: Request, response: Response) => {
  const parsed = createUserRoleSchema.safeParse(request.body);
  if (!parsed.success) {
    response
      .status(400)
      .json({
        success: false,
        message: "Please correct the highlighted fields.",
        errors: parsed.error.flatten().fieldErrors,
      });
    return;
  }
  const result = await createUserRole(
    parsed.data,
    response.locals.admin.loginId,
  );
  if (result.outcome === "NOT_FOUND") {
    response
      .status(404)
      .json({ success: false, message: "Doctor was not found." });
    return;
  }
  if (result.outcome === "ALREADY_CREATED") {
    response
      .status(409)
      .json({
        success: false,
        message: "Login credentials already exist for this Doctor.",
      });
    return;
  }
  if (result.outcome === "DUPLICATE") {
    response
      .status(409)
      .json({ success: false, message: "This Login ID is already in use." });
    return;
  }
  response
    .status(201)
    .json({
      success: true,
      message: `${parsed.data.role === "ADMIN" ? "Admin" : "Doctor"} role created successfully.`,
      data: result.user,
    });
};

export const patchUserStatus = async (request: Request, response: Response) => {
  const parsed = identifiers(request);
  const body = updateUserStatusSchema.safeParse(request.body);
  if (!parsed || !body.success) {
    response
      .status(400)
      .json({
        success: false,
        message: "Enter a valid role, user ID, and status.",
      });
    return;
  }
  const result = await updateUserRoleStatus(
    parsed.role,
    parsed.userId,
    body.data.isActive,
    response.locals.admin.id,
  );
  if (result.outcome === "NOT_FOUND") {
    response
      .status(404)
      .json({ success: false, message: "User was not found." });
    return;
  }
  if (result.outcome === "SELF_DEACTIVATION") {
    response
      .status(409)
      .json({
        success: false,
        message: "You cannot deactivate your own Admin account.",
      });
    return;
  }
  if (result.outcome === "CREDENTIALS_REQUIRED") {
    response
      .status(409)
      .json({
        success: false,
        message:
          "Create Doctor login credentials before activating this account.",
      });
    return;
  }
  response
    .status(200)
    .json({
      success: true,
      message: `User account ${body.data.isActive ? "activated" : "deactivated"} successfully.`,
      data: result.user,
    });
};

export const getLoginActivity = async (
  request: Request,
  response: Response,
) => {
  const parsed = identifiers(request);
  if (!parsed) {
    response
      .status(400)
      .json({ success: false, message: "Enter a valid role and user ID." });
    return;
  }
  const activity = await getUserLoginActivity(parsed.role, parsed.userId);
  response
    .status(activity ? 200 : 404)
    .json(
      activity
        ? { success: true, data: activity }
        : { success: false, message: "User was not found." },
    );
};
