import { z } from "zod";

export const performanceQuerySchema = z.object({
  period: z.enum(["WEEK", "MONTH", "QUARTER", "YEAR"]).default("MONTH"),
});

export const performanceDoctorIdSchema = z
  .string()
  .regex(/^DOC\d{6}$/, "Enter a valid Doctor ID");

export type PerformancePeriod = z.infer<
  typeof performanceQuerySchema
>["period"];
