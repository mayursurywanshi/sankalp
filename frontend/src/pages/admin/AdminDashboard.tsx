import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "../../components/admin/AdminSidebar";
import { clearAccessToken } from "../login/auth-storage";
import { fetchAdminDashboard, logoutAdmin } from "./admin-dashboard.service";
import { DashboardData, SchedulePeriod } from "./admin-dashboard.types";
import "./AdminDashboard.css";

const metricCards = [
  ["totalAppointments", "Total Appointments", "📅", "All appointment requests"],
  ["pendingRequests", "Pending Requests", "⏳", "Needs your attention"],
  ["totalPatients", "Total Patients", "🧒", "Children supported"],
  ["totalDoctors", "Total Doctors", "🩺", "Active specialists"],
  ["newEnquiries", "New Enquiries", "💬", "View contact requests"],
] as const;

const timeAgo = (value: string) => {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000),
  );
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours} hr ago` : `${Math.floor(hours / 24)} day ago`;
};

const scheduleGradient = (schedule: DashboardData["todaySchedule"]) => {
  if (!schedule.total) return "conic-gradient(#e8f0f3 0 100%)";
  const assigned = (schedule.assigned / schedule.total) * 100;
  const requested = assigned + (schedule.requested / schedule.total) * 100;
  const completed = requested + (schedule.completed / schedule.total) * 100;
  return `conic-gradient(#48a6e8 0 ${assigned}%, #ffbc42 ${assigned}% ${requested}%, #72c789 ${requested}% ${completed}%, #f56b78 ${completed}% 100%)`;
};

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [schedulePeriod, setSchedulePeriod] = useState<SchedulePeriod>("TODAY");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const loadDashboard = useCallback(async () => {
    setError("");
    try {
      if (schedulePeriod === "CUSTOM" && (!customFrom || !customTo)) return;
      setData(
        await fetchAdminDashboard({
          period: schedulePeriod,
          fromDate: customFrom || undefined,
          toDate: customTo || undefined,
        }),
      );
    } catch (caught) {
      if (caught instanceof Error && caught.message === "SESSION_INVALID") {
        clearAccessToken();
        navigate("/login", { replace: true });
        return;
      }
      setError(
        "We could not load the dashboard. Please check the server and try again.",
      );
    }
  }, [customFrom, customTo, navigate, schedulePeriod]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logoutAdmin();
    navigate("/login", { replace: true });
  };

  if (!data && !error)
    return (
      <div className="admin-dashboard-shell">
        <AdminSidebar onLogout={handleLogout} loggingOut={loggingOut} />
        <main
          className="admin-dashboard admin-dashboard--loading"
          aria-label="Loading dashboard"
        >
          <div className="admin-skeleton admin-skeleton--title" />{" "}
          <div className="admin-skeleton-grid">
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="admin-skeleton" key={index} />
            ))}
          </div>
          <div className="admin-skeleton admin-skeleton--large" />
        </main>
      </div>
    );

  return (
    <div className="admin-dashboard-shell">
      <AdminSidebar onLogout={handleLogout} loggingOut={loggingOut} />
      <main className="admin-dashboard">
        {error ? (
          <section className="admin-error" role="alert">
            <span>🌤️</span>
            <h1>Dashboard needs a moment</h1>
            <p>{error}</p>
            <button type="button" onClick={() => void loadDashboard()}>
              Try Again
            </button>
          </section>
        ) : (
          data && (
            <>
              <section className="admin-welcome">
                <p>CLINIC OVERVIEW</p>
                <h1>
                  Welcome back, {data.admin.fullName.split(" ")[0]}!{" "}
                  <span aria-hidden="true">👋</span>
                </h1>
                <span>Here’s what’s happening in your clinic today.</span>
              </section>
              <section className="admin-metrics" aria-label="Clinic summary">
                {metricCards.map(([key, title, icon, note]) => (
                  <article key={key}>
                    <div
                      className={`admin-metric-icon admin-metric-icon--${key}`}
                      aria-hidden="true"
                    >
                      {icon}
                    </div>
                    <div>
                      <p>{title}</p>
                      <strong>{data.metrics[key]}</strong>
                      <span>{note}</span>
                    </div>
                  </article>
                ))}
              </section>
              <div className="admin-dashboard-grid">
                <section className="admin-panel admin-appointments">
                  <header>
                    <div>
                      <small>REQUESTS</small>
                      <h2>Appointment Requests</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/admin/appointments")}
                    >
                      View All
                    </button>
                  </header>
                  {data.appointmentRequests.length ? (
                    <div className="admin-request-list">
                      {data.appointmentRequests.map((item) => (
                        <article key={item.referenceId}>
                          <div
                            className="admin-child-avatar"
                            aria-hidden="true"
                          >
                            🧒
                          </div>
                          <div>
                            <strong>{item.childName}</strong>
                            <p>
                              {item.childAge} · Parent: {item.parentName}
                            </p>
                            <span>
                              {item.preferredDate}
                              {item.preferredTime
                                ? ` at ${item.preferredTime}`
                                : " · Time pending"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/admin/appointments?search=${encodeURIComponent(item.referenceId)}`,
                              )
                            }
                          >
                            Assign Doctor
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="admin-empty">No appointment requests yet.</p>
                  )}
                </section>
                <div className="admin-dashboard-stack">
                  <section className="admin-panel admin-schedule">
                    <header>
                      <div>
                        <small>
                          {data.todaySchedule.range.label.toUpperCase()}
                        </small>
                        <h2>Schedule Summary</h2>
                      </div>
                      <div className="admin-schedule-filter">
                        <select
                          value={schedulePeriod}
                          onChange={(event) =>
                            setSchedulePeriod(
                              event.target.value as SchedulePeriod,
                            )
                          }
                          aria-label="Schedule summary period"
                        >
                          <option value="TODAY">Today</option>
                          <option value="LAST_7_DAYS">Last 7 days</option>
                          <option value="LAST_15_DAYS">Last 15 days</option>
                          <option value="THIS_MONTH">This month</option>
                          <option value="CUSTOM">Select date range</option>
                        </select>
                        <strong>{data.todaySchedule.total}</strong>
                      </div>
                    </header>
                    {schedulePeriod === "CUSTOM" && (
                      <div className="admin-schedule-dates">
                        <label>
                          From
                          <input
                            type="date"
                            value={customFrom}
                            onChange={(event) =>
                              setCustomFrom(event.target.value)
                            }
                            max={customTo || undefined}
                          />
                        </label>
                        <label>
                          To
                          <input
                            type="date"
                            value={customTo}
                            onChange={(event) =>
                              setCustomTo(event.target.value)
                            }
                            min={customFrom || undefined}
                          />
                        </label>
                      </div>
                    )}
                    <div className="admin-schedule__body">
                      <div
                        className="admin-donut"
                        style={{
                          background: scheduleGradient(data.todaySchedule),
                        }}
                      >
                        <span>
                          {data.todaySchedule.total}
                          <small>Visits</small>
                        </span>
                      </div>
                      <ul>
                        <li>
                          <i className="is-confirmed" />
                          Assigned <b>{data.todaySchedule.assigned}</b>
                        </li>
                        <li>
                          <i className="is-requested" />
                          Requested <b>{data.todaySchedule.requested}</b>
                        </li>
                        <li>
                          <i className="is-completed" />
                          Completed <b>{data.todaySchedule.completed}</b>
                        </li>
                        <li>
                          <i className="is-cancelled" />
                          Cancelled <b>{data.todaySchedule.cancelled}</b>
                        </li>
                      </ul>
                    </div>
                  </section>
                  <section className="admin-panel admin-activities">
                    <header>
                      <div>
                        <small>UPDATES</small>
                        <h2>Recent Activities</h2>
                      </div>
                    </header>
                    {data.recentActivities.length ? (
                      <ul>
                        {data.recentActivities.map((activity) => (
                          <li key={`${activity.type}-${activity.id}`}>
                            <span aria-hidden="true">
                              {activity.type === "APPOINTMENT" ? "📅" : "💬"}
                            </span>
                            <p>
                              {activity.message}
                              <small>{timeAgo(activity.createdAt)}</small>
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="admin-empty">No recent activity.</p>
                    )}
                  </section>
                </div>
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
};
