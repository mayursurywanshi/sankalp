import { authorizedFetch } from "../admin-dashboard.service";
import {
  DoctorPerformance,
  DoctorPerformanceListItem,
  PerformanceOverview,
  PerformancePeriod,
} from "./admin-performance.types";

const parse = async <T>(response: Response) => {
  const result = (await response.json()) as {
    success: boolean;
    message?: string;
    data?: T;
  };
  if (!response.ok || !result.success || result.data === undefined)
    throw new Error(
      response.status === 401 || response.status === 403
        ? "SESSION_INVALID"
        : (result.message ?? "Unable to load performance data."),
    );
  return result.data;
};
export const fetchPerformanceOverview = async (period: PerformancePeriod) =>
  parse<PerformanceOverview>(
    await authorizedFetch(`/api/admin/performance/overview?period=${period}`),
  );
export const fetchDoctorPerformances = async (period: PerformancePeriod) =>
  parse<DoctorPerformanceListItem[]>(
    await authorizedFetch(`/api/admin/performance/doctors?period=${period}`),
  );
export const fetchDoctorPerformance = async (
  doctorId: string,
  period: PerformancePeriod,
) =>
  parse<DoctorPerformance>(
    await authorizedFetch(
      `/api/admin/performance/doctors/${encodeURIComponent(doctorId)}?period=${period}`,
    ),
  );
