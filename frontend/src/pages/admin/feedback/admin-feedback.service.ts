import { authorizedFetch } from "../admin-dashboard.service";
import {
  EligiblePatient,
  FeedbackInvitationResult,
  FeedbackModerationStatus,
  FeedbackResponse,
} from "./admin-feedback.types";

const parse = async <T extends { success: boolean; message?: string }>(
  response: Response,
) => {
  const result = (await response.json()) as T;
  if (!response.ok || !result.success) {
    if (response.status === 401 || response.status === 403)
      throw new Error("SESSION_INVALID");
    const error = new Error(
      result.message ?? "Unable to complete the feedback request.",
    ) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return result;
};

export const fetchEligiblePatients = async (search = "") => {
  const query = search.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";
  const result = await parse<{ success: boolean; data: EligiblePatient[] }>(
    await authorizedFetch(`/api/admin/feedback/eligible-patients${query}`),
  );
  return result.data;
};

export const createInvitation = async (
  patientId: string,
  appointmentReferenceId: string,
) => {
  const result = await parse<{
    success: boolean;
    message: string;
    data: { outcome: string } & FeedbackInvitationResult;
  }>(
    await authorizedFetch("/api/admin/feedback/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, appointmentReferenceId }),
    }),
  );
  return { message: result.message, ...result.data };
};

export const fetchFeedbackResponses = async (
  status?: FeedbackModerationStatus,
) => {
  const query = new URLSearchParams({ page: "1", limit: "50" });
  if (status) query.set("status", status);
  const result = await parse<{
    success: boolean;
    data: { items: FeedbackResponse[] };
  }>(await authorizedFetch(`/api/admin/feedback/responses?${query}`));
  return result.data.items;
};

export const moderateFeedback = async (
  responseId: string,
  status: "APPROVED" | "REJECTED",
) =>
  parse<{ success: boolean; message: string }>(
    await authorizedFetch(
      `/api/admin/feedback/responses/${encodeURIComponent(responseId)}/moderation`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      },
    ),
  );
