import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format");

export const dashboardQuerySchema = z
  .object({
    schedulePeriod: z
      .enum(["TODAY", "LAST_7_DAYS", "LAST_15_DAYS", "THIS_MONTH", "CUSTOM"])
      .default("TODAY"),
    fromDate: isoDate.optional(),
    toDate: isoDate.optional(),
  })
  .superRefine((input, context) => {
    if (input.schedulePeriod !== "CUSTOM") return;
    if (!input.fromDate)
      context.addIssue({
        code: "custom",
        path: ["fromDate"],
        message: "Start date is required",
      });
    if (!input.toDate)
      context.addIssue({
        code: "custom",
        path: ["toDate"],
        message: "End date is required",
      });
    if (!input.fromDate || !input.toDate) return;
    const from = new Date(`${input.fromDate}T00:00:00.000Z`);
    const to = new Date(`${input.toDate}T00:00:00.000Z`);
    if (
      Number.isNaN(from.getTime()) ||
      Number.isNaN(to.getTime()) ||
      from.toISOString().slice(0, 10) !== input.fromDate ||
      to.toISOString().slice(0, 10) !== input.toDate
    ) {
      context.addIssue({
        code: "custom",
        path: ["fromDate"],
        message: "Enter valid dates",
      });
      return;
    }
    if (from > to)
      context.addIssue({
        code: "custom",
        path: ["toDate"],
        message: "End date must be on or after start date",
      });
    if ((to.getTime() - from.getTime()) / 86400000 > 366)
      context.addIssue({
        code: "custom",
        path: ["toDate"],
        message: "Date range cannot exceed 366 days",
      });
  });

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
