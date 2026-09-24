import { FormEvent, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "../../../components/admin/AdminSidebar";
import { logoutAdmin } from "../admin-dashboard.service";
import {
  createUserRole,
  fetchLoginActivity,
  fetchUser,
  fetchUsers,
  fetchUsersSummary,
  updateUserStatus,
} from "./admin-users-roles.service";
import {
  ManagedUser,
  UserRole,
  UserStatus,
  UsersPage,
  UsersSummary,
} from "./admin-users-roles.types";
import "./AdminUsersRoles.css";

const emptyPage: UsersPage = {
  items: [],
  pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
};
const statusLabel: Record<UserStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  PENDING: "Pending access",
};
export const AdminUsersRoles = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<UsersSummary | null>(null);
  const [users, setUsers] = useState<UsersPage>(emptyPage);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [lastLoginAt, setLastLoginAt] = useState<string | null>();
  const [pendingDoctors, setPendingDoctors] = useState<ManagedUser[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createRole, setCreateRole] = useState<UserRole>("ADMIN");
  const [form, setForm] = useState({
    fullName: "",
    loginId: "",
    doctorId: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleError = useCallback(
    (reason: unknown) => {
      if (reason instanceof Error && reason.message === "SESSION_INVALID")
        navigate("/login", { replace: true });
      else
        setNotice({
          type: "error",
          text:
            reason instanceof Error
              ? reason.message
              : "Unable to load users and roles.",
        });
    },
    [navigate],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextSummary, nextUsers] = await Promise.all([
        fetchUsersSummary(),
        fetchUsers({ search, role, status, page, pageSize: 10 }),
      ]);
      setSummary(nextSummary);
      setUsers(nextUsers);
      if (selected) {
        const replacement = nextUsers.items.find(
          (item) =>
            item.userId === selected.userId && item.role === selected.role,
        );
        if (replacement) setSelected(replacement);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [
    handleError,
    page,
    role,
    search,
    selected?.role,
    selected?.userId,
    status,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!selected) {
      setLastLoginAt(undefined);
      return;
    }
    setLastLoginAt(undefined);
    Promise.all([
      fetchUser(selected.role, selected.userId),
      fetchLoginActivity(selected.role, selected.userId),
    ])
      .then(([details, events]) => {
        setSelected(details);
        setLastLoginAt(
          events.find((event) => event.event === "LOGIN_SUCCESS")?.createdAt ??
            null,
        );
      })
      .catch(handleError);
  }, [handleError, selected?.role, selected?.userId]);

  const openCreate = async () => {
    setCreateOpen(true);
    setNotice(null);
    try {
      setPendingDoctors(
        (await fetchUsers({ role: "DOCTOR", status: "PENDING", pageSize: 100 }))
          .items,
      );
    } catch (error) {
      handleError(error);
    }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const input =
        createRole === "ADMIN"
          ? {
              role: "ADMIN" as const,
              fullName: form.fullName,
              loginId: form.loginId,
              password: form.password,
            }
          : {
              role: "DOCTOR" as const,
              doctorId: form.doctorId,
              password: form.password,
            };
      const created = await createUserRole(input);
      setCreateOpen(false);
      setForm({ fullName: "", loginId: "", doctorId: "", password: "" });
      setNotice({
        type: "success",
        text: `${created.fullName} now has ${created.role === "ADMIN" ? "Admin" : "Doctor"} access.`,
      });
      setSelected(created);
      await load();
    } catch (error) {
      handleError(error);
    } finally {
      setSaving(false);
    }
  };
  const toggleStatus = async (user: ManagedUser) => {
    const activate = user.status !== "ACTIVE";
    if (
      !window.confirm(
        `${activate ? "Activate" : "Deactivate"} access for ${user.fullName}?`,
      )
    )
      return;
    setSaving(true);
    setNotice(null);
    try {
      const updated = await updateUserStatus(user.role, user.userId, activate);
      setSelected(updated);
      setNotice({
        type: "success",
        text: `${updated.fullName} is now ${updated.status.toLowerCase()}.`,
      });
      await load();
    } catch (error) {
      handleError(error);
    } finally {
      setSaving(false);
    }
  };
  const logout = async () => {
    setLoggingOut(true);
    await logoutAdmin();
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-users-shell">
      <AdminSidebar onLogout={() => void logout()} loggingOut={loggingOut} />
      <main className="admin-users-page">
        <header className="admin-users-heading">
          <div>
            <small>ACCESS MANAGEMENT</small>
            <h1>Users &amp; Roles</h1>
            <p>
              Create secure accounts and control access across your clinical
              team.
            </p>
          </div>
          <button type="button" onClick={() => void openCreate()}>
            <span>＋</span> Create User Role
          </button>
        </header>
        {notice && (
          <p
            className={`admin-users-notice is-${notice.type}`}
            role={notice.type === "error" ? "alert" : "status"}
          >
            {notice.text}
          </p>
        )}
        <section className="admin-users-metrics" aria-label="User summary">
          <article>
            <span>👥</span>
            <div>
              <small>Total Users</small>
              <strong>{summary?.totalUsers ?? "—"}</strong>
            </div>
          </article>
          <article>
            <span>🛡️</span>
            <div>
              <small>Admins</small>
              <strong>{summary?.admins ?? "—"}</strong>
            </div>
          </article>
          <article>
            <span>🩺</span>
            <div>
              <small>Doctors</small>
              <strong>{summary?.doctors ?? "—"}</strong>
            </div>
          </article>
          <article>
            <span>✅</span>
            <div>
              <small>Active Access</small>
              <strong>{summary?.active ?? "—"}</strong>
            </div>
          </article>
          <article>
            <span>⏳</span>
            <div>
              <small>Pending Access</small>
              <strong>{summary?.pending ?? "—"}</strong>
            </div>
          </article>
        </section>
        <section className="admin-users-toolbar">
          <label>
            <span>⌕</span>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search name, Login ID, Doctor ID, phone or email…"
            />
          </label>
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value as UserRole | "");
              setPage(1);
            }}
            aria-label="Filter by role"
          >
            <option value="">All roles</option>
            <option value="ADMIN">Admin</option>
            <option value="DOCTOR">Doctor</option>
          </select>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as UserStatus | "");
              setPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING">Pending</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setRole("");
              setStatus("");
              setPage(1);
            }}
          >
            Reset
          </button>
        </section>
        <div
          className={`admin-users-workspace${selected ? " has-detail" : ""}`}
        >
          <section className="admin-users-list-card">
            {loading ? (
              <div className="admin-users-empty">
                <span>🌈</span>
                <h2>Loading team access…</h2>
              </div>
            ) : users.items.length ? (
              <div className="admin-users-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Login ID</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.items.map((user) => (
                      <tr
                        key={`${user.role}-${user.userId}`}
                        className={
                          selected?.userId === user.userId ? "is-selected" : ""
                        }
                      >
                        <td>
                          <button
                            className="admin-user-person"
                            type="button"
                            onClick={() => setSelected(user)}
                          >
                            <span>{user.role === "ADMIN" ? "👩‍💼" : "🧑‍⚕️"}</span>
                            <span>
                              <b>{user.fullName}</b>
                              <small>{user.doctorId ?? user.designation}</small>
                            </span>
                          </button>
                        </td>
                        <td>
                          <span
                            className={`admin-user-role is-${user.role.toLowerCase()}`}
                          >
                            {user.role === "ADMIN" ? "Admin" : "Doctor"}
                          </span>
                        </td>
                        <td>
                          <code>{user.loginId}</code>
                        </td>
                        <td>
                          <span
                            className={`admin-user-status is-${user.status.toLowerCase()}`}
                          >
                            {statusLabel[user.status]}
                          </span>
                        </td>
                        <td>
                          {new Date(user.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td>
                          <button
                            className="admin-user-view"
                            type="button"
                            onClick={() => setSelected(user)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-users-empty">
                <span>🪁</span>
                <h2>No users found</h2>
                <p>Try changing the search or filter.</p>
              </div>
            )}
            <footer>
              <span>
                Showing {users.items.length} of {users.pagination.total} users
              </span>
              <div>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  ‹
                </button>
                <b>
                  {page} / {users.pagination.totalPages}
                </b>
                <button
                  type="button"
                  disabled={page >= users.pagination.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  ›
                </button>
              </div>
            </footer>
          </section>
          {selected && (
            <aside className="admin-user-details">
              <button
                className="admin-user-details__close"
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close user details"
              >
                ×
              </button>
              <header>
                <span>{selected.role === "ADMIN" ? "👩‍💼" : "🧑‍⚕️"}</span>
                <div>
                  <small>{selected.role} ACCOUNT</small>
                  <h2>{selected.fullName}</h2>
                  <p>{selected.loginId}</p>
                </div>
              </header>
              <dl>
                <div>
                  <dt>Account status</dt>
                  <dd>
                    <span
                      className={`admin-user-status is-${selected.status.toLowerCase()}`}
                    >
                      {statusLabel[selected.status]}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Designation</dt>
                  <dd>{selected.designation}</dd>
                </div>
                {selected.doctorId && (
                  <div>
                    <dt>Doctor ID</dt>
                    <dd>{selected.doctorId}</dd>
                  </div>
                )}
                {selected.email && (
                  <div>
                    <dt>Email</dt>
                    <dd>{selected.email}</dd>
                  </div>
                )}
                {selected.phone && (
                  <div>
                    <dt>Phone</dt>
                    <dd>{selected.phone}</dd>
                  </div>
                )}
                <div>
                  <dt>Created</dt>
                  <dd>
                    {new Date(selected.createdAt).toLocaleString("en-IN")}
                  </dd>
                </div>
              </dl>
              {selected.status !== "PENDING" && (
                <button
                  className={
                    selected.status === "ACTIVE"
                      ? "is-deactivate"
                      : "is-activate"
                  }
                  type="button"
                  disabled={saving}
                  onClick={() => void toggleStatus(selected)}
                >
                  {selected.status === "ACTIVE"
                    ? "Deactivate Access"
                    : "Activate Access"}
                </button>
              )}
              <section>
                <h3>Last Login</h3>
                <div className="admin-user-last-login">
                  <span aria-hidden="true">🕐</span>
                  <p>
                    <b>
                      {lastLoginAt === undefined
                        ? "Checking last login…"
                        : lastLoginAt
                          ? new Date(lastLoginAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Never logged in"}
                    </b>
                    {lastLoginAt && (
                      <small>
                        {new Date(lastLoginAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    )}
                  </p>
                </div>
              </section>
            </aside>
          )}
        </div>
      </main>
      {createOpen && (
        <div
          className="admin-role-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving)
              setCreateOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-role-title"
          >
            <button
              className="admin-role-modal__close"
              type="button"
              onClick={() => setCreateOpen(false)}
              disabled={saving}
            >
              ×
            </button>
            <header>
              <span>🌟</span>
              <div>
                <small>SECURE TEAM ACCESS</small>
                <h2 id="create-role-title">Create User Role</h2>
                <p>Choose the account type and securely create login access.</p>
              </div>
            </header>
            <div className="admin-role-choice">
              <button
                type="button"
                className={createRole === "ADMIN" ? "is-active" : ""}
                onClick={() => setCreateRole("ADMIN")}
              >
                <span>🛡️</span>
                <b>Admin</b>
                <small>Manage clinic and team</small>
              </button>
              <button
                type="button"
                className={createRole === "DOCTOR" ? "is-active" : ""}
                onClick={() => setCreateRole("DOCTOR")}
              >
                <span>🩺</span>
                <b>Doctor</b>
                <small>Patients and clinical records</small>
              </button>
            </div>
            <form onSubmit={(event) => void submit(event)}>
              {createRole === "ADMIN" ? (
                <>
                  <label>
                    Full Name
                    <input
                      value={form.fullName}
                      onChange={(event) =>
                        setForm((value) => ({
                          ...value,
                          fullName: event.target.value,
                        }))
                      }
                      required
                      minLength={2}
                      maxLength={100}
                      placeholder="Enter Admin full name"
                    />
                  </label>
                  <label>
                    Login ID
                    <input
                      value={form.loginId}
                      onChange={(event) =>
                        setForm((value) => ({
                          ...value,
                          loginId: event.target.value,
                        }))
                      }
                      required
                      minLength={3}
                      maxLength={80}
                      placeholder="Example: Admin.Sankalp2"
                    />
                  </label>
                </>
              ) : (
                <label>
                  Select Pending Doctor
                  <select
                    value={form.doctorId}
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        doctorId: event.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">Select Doctor</option>
                    {pendingDoctors.map((doctor) => (
                      <option key={doctor.userId} value={doctor.doctorId ?? ""}>
                        {doctor.doctorId} · {doctor.fullName} · {doctor.loginId}
                      </option>
                    ))}
                  </select>
                  {!pendingDoctors.length && (
                    <small>No Doctors are waiting for login credentials.</small>
                  )}
                </label>
              )}
              <label>
                Password
                <div className="admin-role-password">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(event) =>
                      setForm((value) => ({
                        ...value,
                        password: event.target.value,
                      }))
                    }
                    required
                    minLength={8}
                    maxLength={72}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                <small>
                  Use uppercase, lowercase, number and special character.
                </small>
              </label>
              <footer>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    saving ||
                    (createRole === "DOCTOR" && !pendingDoctors.length)
                  }
                >
                  {saving
                    ? "Creating…"
                    : `Create ${createRole === "ADMIN" ? "Admin" : "Doctor"} Role`}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};
