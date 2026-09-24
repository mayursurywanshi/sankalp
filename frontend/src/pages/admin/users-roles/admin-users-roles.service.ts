import { authorizedFetch } from "../admin-dashboard.service";
import {
  CreateRoleInput,
  LoginActivity,
  ManagedUser,
  UserRole,
  UserStatus,
  UsersPage,
  UsersSummary,
} from "./admin-users-roles.types";

const parse = async <T>(response: Response) => {
  const result = (await response.json()) as {
    success: boolean;
    message?: string;
    data?: T;
  };
  if (!response.ok || !result.success || result.data === undefined) {
    throw new Error(
      response.status === 401 || response.status === 403
        ? "SESSION_INVALID"
        : (result.message ?? "Unable to complete the request."),
    );
  }
  return result.data;
};

export const fetchUsersSummary = async () =>
  parse<UsersSummary>(await authorizedFetch("/api/admin/users-roles/summary"));

export const fetchUsers = async (filters: {
  search?: string;
  role?: UserRole | "";
  status?: UserStatus | "";
  page?: number;
  pageSize?: number;
}) => {
  const query = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 10),
  });
  if (filters.search) query.set("search", filters.search);
  if (filters.role) query.set("role", filters.role);
  if (filters.status) query.set("status", filters.status);
  return parse<UsersPage>(
    await authorizedFetch(`/api/admin/users-roles?${query}`),
  );
};

export const fetchUser = async (role: UserRole, userId: string) =>
  parse<ManagedUser>(
    await authorizedFetch(`/api/admin/users-roles/${role}/${userId}`),
  );
export const fetchLoginActivity = async (role: UserRole, userId: string) =>
  parse<LoginActivity[]>(
    await authorizedFetch(
      `/api/admin/users-roles/${role}/${userId}/login-activity`,
    ),
  );

export const createUserRole = async (input: CreateRoleInput) =>
  parse<ManagedUser>(
    await authorizedFetch("/api/admin/users-roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );

export const updateUserStatus = async (
  role: UserRole,
  userId: string,
  isActive: boolean,
) =>
  parse<ManagedUser>(
    await authorizedFetch(`/api/admin/users-roles/${role}/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    }),
  );
