export type UserRole = "ADMIN" | "DOCTOR";
export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING";

export type ManagedUser = {
  userId: string;
  role: UserRole;
  loginId: string;
  fullName: string;
  doctorId: string | null;
  email: string | null;
  phone: string | null;
  designation: string;
  status: UserStatus;
  createdAt: string;
};

export type UsersPage = {
  items: ManagedUser[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type UsersSummary = {
  totalUsers: number;
  admins: number;
  doctors: number;
  active: number;
  inactive: number;
  pending: number;
};

export type LoginActivity = {
  id: string;
  event: "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGOUT" | "SESSION_EXPIRED";
  attemptedLoginId: string;
  createdAt: string;
};

export type CreateRoleInput =
  | { role: "ADMIN"; fullName: string; loginId: string; password: string }
  | { role: "DOCTOR"; doctorId: string; password: string };
