import { Request, Response } from "express";
import { getDashboardData } from "./admin-dashboard.service";
import { dashboardQuerySchema } from "./admin-dashboard.validation";

export const getAdminDashboard = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const query = dashboardQuerySchema.safeParse(request.query);
  if (!query.success) {
    response.status(400).json({
      success: false,
      message: "Invalid schedule date range.",
      errors: query.error.flatten().fieldErrors,
    });
    return;
  }
  try {
    const dashboard = await getDashboardData(query.data);
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
