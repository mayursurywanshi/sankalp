import { CookieOptions, Request, Response } from "express";
import { env } from "../../config/env.config";
import { authenticateUser, getAuthenticatedUser, revokeAuthenticationSession } from "./auth.service";
import { loginSchema } from "./auth.validation";

export const AUTH_COOKIE_NAME = "sankalp_session";

const cookieOptions = (expiresAt?: Date): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  ...(expiresAt ? { expires: expiresAt } : {}),
});

export const login = async (request: Request, response: Response): Promise<void> => {
  const validation = loginSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({
      success: false,
      message: "Please correct the highlighted fields.",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const session = await authenticateUser(validation.data);
    if (!session) {
      response.status(401).json({ success: false, message: "Invalid role, Login ID, or password." });
      return;
    }

    response.cookie(AUTH_COOKIE_NAME, session.token, cookieOptions(session.expiresAt));
    response.status(200).json({ success: true, message: "Welcome back!", data: session.user });
  } catch (error) {
    console.error("Unable to log in", error);
    response.status(500).json({ success: false, message: "Unable to log in. Please try again." });
  }
};

export const getSession = async (request: Request, response: Response): Promise<void> => {
  try {
    const user = await getAuthenticatedUser(request.cookies[AUTH_COOKIE_NAME]);
    if (!user) {
      response.status(401).json({ success: false, message: "Your session is not active." });
      return;
    }
    response.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Unable to read authentication session", error);
    response.status(500).json({ success: false, message: "Unable to verify your session." });
  }
};

export const logout = async (request: Request, response: Response): Promise<void> => {
  try {
    await revokeAuthenticationSession(request.cookies[AUTH_COOKIE_NAME]);
    response.clearCookie(AUTH_COOKIE_NAME, cookieOptions());
    response.status(200).json({ success: true, message: "You have been logged out successfully." });
  } catch (error) {
    console.error("Unable to log out", error);
    response.status(500).json({ success: false, message: "Unable to log out. Please try again." });
  }
};
