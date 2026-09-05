import { clearAccessToken, getBearerAuthorization } from "../login/auth-storage";
import { AdminSearchResults, DashboardData, DashboardResponse, SessionResponse } from "./admin-dashboard.types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export const authorizedFetch = async (path: string, init?: RequestInit) => {
  const headers = new Headers(init?.headers);
  const authorization = getBearerAuthorization().Authorization;
  if (authorization) headers.set("Authorization", authorization);
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });
  if (response.status === 401 || response.status === 403) clearAccessToken();
  return response;
};

export const verifySession = async () => {
  const response = await authorizedFetch("/api/auth/session");
  const result = await response.json() as SessionResponse;
  if (!response.ok || !result.success) throw new Error("SESSION_INVALID");
  return result.data;
};

export const fetchAdminDashboard = async (): Promise<DashboardData> => {
  const response = await authorizedFetch("/api/admin/dashboard");
  const result = await response.json() as DashboardResponse;
  if (!response.ok || !result.success || !result.data) {
    throw new Error(response.status === 401 || response.status === 403 ? "SESSION_INVALID" : result.message ?? "DASHBOARD_ERROR");
  }
  return result.data;
};

export const searchAdminRecords = async (query: string): Promise<AdminSearchResults> => {
  const response = await authorizedFetch(`/api/admin/search?query=${encodeURIComponent(query)}`);
  const result = await response.json() as { success: boolean; message?: string; data?: AdminSearchResults };
  if (!response.ok || !result.success || !result.data) throw new Error(response.status === 401 || response.status === 403 ? "SESSION_INVALID" : result.message ?? "SEARCH_ERROR");
  return result.data;
};

export const logoutAdmin = async () => {
  try {
    await authorizedFetch("/api/auth/logout", { method: "POST" });
  } finally {
    clearAccessToken();
  }
};
