import { authorizedFetch } from "../admin-dashboard.service";
import {
  ClinicSettings,
  ContactLocationInput,
  FeedbackInput,
  WorkingHoursInput,
} from "./admin-settings.types";

const parse = async (response: Response) => {
  const result = (await response.json()) as {
    success: boolean;
    message?: string;
    data?: ClinicSettings;
  };
  if (!response.ok || !result.success || !result.data) {
    throw new Error(
      response.status === 401 || response.status === 403
        ? "SESSION_INVALID"
        : (result.message ?? "Unable to save settings."),
    );
  }
  return result.data;
};

export const fetchSettings = async () =>
  parse(await authorizedFetch("/api/admin/settings"));

const patchSettings = async (path: string, body: unknown) =>
  parse(
    await authorizedFetch(`/api/admin/settings/${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

export const saveContactLocation = (input: ContactLocationInput) =>
  patchSettings("contact-location", input);
export const saveWorkingHours = (input: WorkingHoursInput) =>
  patchSettings("working-hours", input);
export const saveFeedback = (input: FeedbackInput) =>
  patchSettings("feedback", input);
