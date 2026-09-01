import { NextFunction, Request, Response } from "express";
import { getAuthenticatedUser } from "./auth.service";
import { getBearerToken } from "./auth.token";

export const requireAuthenticatedAdmin = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const admin = await getAuthenticatedUser(getBearerToken(request));

    if (!admin) {
      response.status(401).json({
        success: false,
        message: "Authentication is required. Please log in as an Admin.",
      });
      return;
    }

    if (admin.role !== "ADMIN") {
      response.status(403).json({
        success: false,
        message: "Admin access is required.",
      });
      return;
    }

    response.locals.admin = admin;
    next();
  } catch (error) {
    console.error("Unable to authorize Admin request", error);
    response.status(500).json({
      success: false,
      message: "Unable to verify Admin access.",
    });
  }
};
