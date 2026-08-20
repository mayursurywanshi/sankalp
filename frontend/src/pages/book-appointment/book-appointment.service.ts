import { AppointmentContentResponse, AppointmentFormData, AppointmentSubmitResponse } from "./book-appointment.types";

const API_URL = process.env.REACT_APP_API_URL ?? "http://localhost:5000";

export const getAppointmentContent = async (): Promise<AppointmentContentResponse> => {
  const response = await fetch(`${API_URL}/api/appointments-request`);
  if (!response.ok) throw new Error("Unable to load appointment information.");
  return response.json() as Promise<AppointmentContentResponse>;
};

export const requestAppointment = async (formData: AppointmentFormData): Promise<AppointmentSubmitResponse> => {
  const response = await fetch(`${API_URL}/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  const result = await response.json() as AppointmentSubmitResponse;
  if (!response.ok) throw result;
  return result;
};
