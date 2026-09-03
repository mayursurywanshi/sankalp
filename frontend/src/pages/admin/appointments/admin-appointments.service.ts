import { authorizedFetch } from "../admin-dashboard.service";
import { fetchDoctors } from "../doctors/admin-doctors.service";
import { Doctor } from "../doctors/admin-doctors.types";
import { ApiResponse, Appointment, AppointmentDetail, AppointmentStatus, AppointmentSummary } from "./admin-appointments.types";

const parse = async <T>(response: Response): Promise<T> => {
  const result = await response.json() as ApiResponse<T>;
  if (!response.ok || !result.success || result.data === undefined) throw new Error(response.status === 401 || response.status === 403 ? "SESSION_INVALID" : result.message ?? "Request failed");
  return result.data;
};
export const getAppointments = async (status?: AppointmentStatus) => parse<Appointment[]>(await authorizedFetch(`/api/admin/appointments${status ? `?status=${status}` : ""}`));
export const getAppointmentSummary = async () => parse<AppointmentSummary>(await authorizedFetch("/api/admin/appointments/summary"));
export const getAppointmentDetail = async (id: string) => parse<AppointmentDetail>(await authorizedFetch(`/api/admin/appointments/${encodeURIComponent(id)}`));
export const getAssignableDoctors = async (): Promise<Doctor[]> => (await fetchDoctors()).filter((doctor) => doctor.isActive && doctor.credentialStatus === "ACTIVE");
export const assignAppointment = async (id: string, data: { doctorId: string; scheduledDate: string; scheduledTime: string; note?: string }) => parse<Appointment>(await authorizedFetch(`/api/admin/appointments/${encodeURIComponent(id)}/assignment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }));
export const changeAppointmentStatus = async (id: string, status: "COMPLETED" | "CANCELLED", note: string) => parse<Appointment>(await authorizedFetch(`/api/admin/appointments/${encodeURIComponent(id)}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, note }) }));
