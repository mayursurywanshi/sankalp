import { authorizedFetch } from "../admin-dashboard.service";
import {
  ContactFollowUpMethod,
  ContactRequestDetails,
  ContactRequestPage,
  ContactRequestStatus,
  ContactRequestSummary,
} from "./admin-contact-requests.types";

const parse = async <T extends { success: boolean; message?: string }>(
  response: Response,
) => {
  const result = (await response.json()) as T;
  if (!response.ok || !result.success) {
    if (response.status === 401 || response.status === 403)
      throw new Error("SESSION_INVALID");
    throw new Error(result.message ?? "Unable to process contact request.");
  }
  return result;
};

export const fetchContactRequests = async (
  status: "ALL" | ContactRequestStatus,
  search: string,
  page: number,
) => {
  const query = new URLSearchParams({ page: String(page), limit: "10" });
  if (status !== "ALL") query.set("status", status);
  if (search.trim()) query.set("search", search.trim());
  const result = await parse<{ success: true; data: ContactRequestPage }>(
    await authorizedFetch(`/api/admin/contact-requests?${query}`),
  );
  return result.data;
};

export const fetchContactRequestSummary = async () => {
  const result = await parse<{
    success: true;
    data: ContactRequestSummary;
  }>(await authorizedFetch("/api/admin/contact-requests/summary"));
  return result.data;
};

export const fetchContactRequestDetails = async (referenceId: string) => {
  const result = await parse<{
    success: true;
    data: ContactRequestDetails;
  }>(
    await authorizedFetch(
      `/api/admin/contact-requests/${encodeURIComponent(referenceId)}`,
    ),
  );
  return result.data;
};

export const assignContactDoctor = async (
  referenceId: string,
  doctorId: string,
  note: string,
) =>
  parse<{ success: true; message: string }>(
    await authorizedFetch(
      `/api/admin/contact-requests/${encodeURIComponent(referenceId)}/assignment`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, note: note || undefined }),
      },
    ),
  );

export const saveContactFollowUp = async (
  referenceId: string,
  method: ContactFollowUpMethod,
  note: string,
) =>
  parse<{ success: true; message: string }>(
    await authorizedFetch(
      `/api/admin/contact-requests/${encodeURIComponent(referenceId)}/follow-up`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, note: note || undefined }),
      },
    ),
  );

export const saveContactStatus = async (
  referenceId: string,
  status: ContactRequestStatus,
  note: string,
) =>
  parse<{ success: true; message: string }>(
    await authorizedFetch(
      `/api/admin/contact-requests/${encodeURIComponent(referenceId)}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: note || undefined }),
      },
    ),
  );

export const createAppointmentFromContact = async (
  referenceId: string,
  body: {
    childName: string;
    childAge: string;
    childDateOfBirth?: string;
    preferredDate: string;
    consent: boolean;
  },
) =>
  parse<{
    success: true;
    message: string;
    data: { appointmentReferenceId: string; patientId: string };
  }>(
    await authorizedFetch(
      `/api/admin/contact-requests/${encodeURIComponent(referenceId)}/appointment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    ),
  );
