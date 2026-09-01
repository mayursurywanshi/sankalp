export type LoginRole = "ADMIN" | "DOCTOR";

export type LoginFormData = {
  role: LoginRole | "";
  loginId: string;
  password: string;
  rememberMe: boolean;
};

export type AuthenticatedUser = {
  id: string;
  loginId: string;
  fullName: string;
  role: LoginRole;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  data?: AuthenticatedUser;
  errors?: Record<string, string[]>;
};
