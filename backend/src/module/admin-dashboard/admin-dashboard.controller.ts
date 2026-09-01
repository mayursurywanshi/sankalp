import { Request, Response } from "express";
import { getDashboardData } from "./admin-dashboard.service";

export const getAdminDashboard = async (_request: Request, response: Response): Promise<void> => {
  try {
    const dashboard = await getDashboardData();
    response.status(200).json({
      success: true,
      data: {
        admin: response.locals.admin,
        ...dashboard,
      },
    });
  } catch (error) {
    console.error("Unable to load Admin dashboard", error);
    response.status(500).json({
      success: false,
      message: "Unable to load the Admin dashboard.",
    });
  }
};
