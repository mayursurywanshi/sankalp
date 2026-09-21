import { Request, Response } from "express";
import {
  getDoctorPerformance,
  getPerformanceOverview,
  listDoctorPerformance,
} from "./admin-performance.service";
import {
  performanceDoctorIdSchema,
  performanceQuerySchema,
} from "./admin-performance.validation";

const invalidQuery = (response: Response, errors: unknown) =>
  response
    .status(400)
    .json({ success: false, message: "Invalid performance filters.", errors });

export const getOverview = async (request: Request, response: Response) => {
  const query = performanceQuerySchema.safeParse(request.query);
  if (!query.success) {
    invalidQuery(response, query.error.flatten().fieldErrors);
    return;
  }
  response
    .status(200)
    .json({
      success: true,
      data: await getPerformanceOverview(query.data.period),
    });
};

export const getDoctors = async (request: Request, response: Response) => {
  const query = performanceQuerySchema.safeParse(request.query);
  if (!query.success) {
    invalidQuery(response, query.error.flatten().fieldErrors);
    return;
  }
  response
    .status(200)
    .json({
      success: true,
      data: await listDoctorPerformance(query.data.period),
    });
};

export const getDoctor = async (request: Request, response: Response) => {
  const query = performanceQuerySchema.safeParse(request.query);
  const doctorId = performanceDoctorIdSchema.safeParse(request.params.doctorId);
  if (!query.success) {
    invalidQuery(response, query.error.flatten().fieldErrors);
    return;
  }
  if (!doctorId.success) {
    response
      .status(400)
      .json({ success: false, message: "Enter a valid Doctor ID." });
    return;
  }
  const data = await getDoctorPerformance(doctorId.data, query.data.period);
  response
    .status(data ? 200 : 404)
    .json(
      data
        ? { success: true, data }
        : { success: false, message: "Doctor was not found." },
    );
};
