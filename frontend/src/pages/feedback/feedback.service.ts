const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export class FeedbackRequestError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
  }
}

const parse = async <T extends { success: boolean; message?: string }>(
  response: Response,
) => {
  const result = (await response.json()) as T & { code?: string };
  if (!response.ok || !result.success)
    throw new FeedbackRequestError(
      result.message ?? "Unable to process feedback.",
      result.code,
    );
  return result;
};

export const loadFeedbackForm = async (token: string) => {
  const result = await parse<{
    success: boolean;
    data:
      | { status: "SUBMITTED" }
      | {
          status: "AVAILABLE";
          parentName: string;
          childName: string;
          expiresAt: string;
        };
  }>(await fetch(`${API_URL}/api/feedback/${encodeURIComponent(token)}`));
  return result.data;
};

export const submitFeedback = async (
  token: string,
  body: {
    rating: number;
    feedback: string;
    parentDisplayName: string;
    consentToPublish: boolean;
  },
) =>
  parse<{ success: boolean; message: string }>(
    await fetch(`${API_URL}/api/feedback/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
