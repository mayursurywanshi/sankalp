import { LoginFormData, LoginResponse } from "./login.types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export const loginUser = async (form: LoginFormData): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(form),
  });
  const result = await response.json() as LoginResponse;
  if (!response.ok) return result;
  return result;
};
