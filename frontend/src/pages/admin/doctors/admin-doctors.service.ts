import { authorizedFetch } from "../admin-dashboard.service";
import { DeleteDoctorResponse, Doctor, DoctorForm, DoctorListResponse, DoctorResponse } from "./admin-doctors.types";

const parseResponse = async <T extends { success: boolean; message?: string }>(response: Response) => {
  const result = await response.json() as T;
  if (!response.ok || !result.success) {
    if (response.status === 401 || response.status === 403) throw new Error("SESSION_INVALID");
    const error = new Error(result.message ?? "REQUEST_FAILED") as Error & { details?: T };
    error.details = result;
    throw error;
  }
  return result;
};

const toApiDate = (value: string) => {
  const [year, month, day] = value.split("-");
  return `${day}-${month}-${year}`;
};

export const fetchDoctors = async (): Promise<Doctor[]> => {
  const response = await authorizedFetch("/api/admin/doctors");
  const result = await parseResponse<DoctorListResponse>(response);
  return result.data ?? [];
};

export const createDoctor = async (form: DoctorForm): Promise<DoctorResponse> => {
  const { password: _password, ...details } = form;
  const response = await authorizedFetch("/api/admin/doctors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...details, joiningDate: toApiDate(details.joiningDate), dateOfBirth: toApiDate(details.dateOfBirth) }),
  });
  return parseResponse<DoctorResponse>(response);
};

export const confirmDoctorCredentials = async (doctorId: string, password: string): Promise<DoctorResponse> => {
  const response = await authorizedFetch(`/api/admin/doctors/${encodeURIComponent(doctorId)}/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, confirm: true }),
  });
  return parseResponse<DoctorResponse>(response);
};

export const deleteDoctor = async (doctorId: string): Promise<DeleteDoctorResponse> => {
  const response = await authorizedFetch(`/api/admin/doctors/${encodeURIComponent(doctorId)}`, { method: "DELETE" });
  return parseResponse<DeleteDoctorResponse>(response);
};
