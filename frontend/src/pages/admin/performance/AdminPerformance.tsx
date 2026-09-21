import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "../../../components/admin/AdminSidebar";
import { logoutAdmin } from "../admin-dashboard.service";
import {
  fetchDoctorPerformance,
  fetchDoctorPerformances,
  fetchPerformanceOverview,
} from "./admin-performance.service";
import {
  DoctorPerformance,
  DoctorPerformanceListItem,
  PerformanceOverview,
  PerformancePeriod,
  TrendPoint,
} from "./admin-performance.types";
import "./AdminPerformance.css";

const periodLabels: Record<PerformancePeriod, string> = {
  WEEK: "This Week",
  MONTH: "This Month",
  QUARTER: "This Quarter",
  YEAR: "This Year",
};
const metricCards = [
  ["totalAppointments", "Total Appointments", "📅", "totalAppointments"],
  [
    "completedAppointments",
    "Completed Appointments",
    "✅",
    "completedAppointments",
  ],
  ["newPatients", "New Patients", "🧒", "newPatients"],
  ["overallSatisfaction", "Overall Satisfaction", "⭐", "overallSatisfaction"],
] as const;
const chartColors = [
  "#0aa3a5",
  "#20b779",
  "#f2aa2f",
  "#7c55c7",
  "#e86879",
  "#65758b",
];

const LineChart = ({ points }: { points: TrendPoint[] }) => {
  const max = Math.max(1, ...points.map((point) => point.appointments));
  const coordinates = points
    .map(
      (point, index) =>
        `${points.length === 1 ? 50 : (index / (points.length - 1)) * 100},${92 - (point.appointments / max) * 76}`,
    )
    .join(" ");
  const completed = points
    .map(
      (point, index) =>
        `${points.length === 1 ? 50 : (index / (points.length - 1)) * 100},${92 - (point.completed / max) * 76}`,
    )
    .join(" ");
  return (
    <div className="performance-line-chart">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-label="Appointment trend"
      >
        <g>
          {[20, 40, 60, 80].map((y) => (
            <line x1="0" x2="100" y1={y} y2={y} key={y} />
          ))}
        </g>
        <polyline className="is-total" points={coordinates} />
        <polyline className="is-complete" points={completed} />
      </svg>
      <div>
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
};

export const AdminPerformance = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PerformancePeriod>("MONTH");
  const [view, setView] = useState<"CHART" | "TABLE">("CHART");
  const [tab, setTab] = useState<"CLINIC" | "DOCTOR">("CLINIC");
  const [overview, setOverview] = useState<PerformanceOverview | null>(null);
  const [doctors, setDoctors] = useState<DoctorPerformanceListItem[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [doctor, setDoctor] = useState<DoctorPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const handleError = useCallback(
    (reason: unknown) => {
      if (reason instanceof Error && reason.message === "SESSION_INVALID")
        navigate("/login", { replace: true });
      else
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load performance data.",
        );
    },
    [navigate],
  );
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      fetchPerformanceOverview(period),
      fetchDoctorPerformances(period),
    ])
      .then(([clinic, list]) => {
        if (!active) return;
        setOverview(clinic);
        setDoctors(list);
        setDoctorId((current) =>
          current && list.some((item) => item.doctorId === current)
            ? current
            : (list[0]?.doctorId ?? ""),
        );
      })
      .catch(handleError)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period, handleError]);
  useEffect(() => {
    if (!doctorId) {
      setDoctor(null);
      return;
    }
    let active = true;
    fetchDoctorPerformance(doctorId, period)
      .then((data) => {
        if (active) setDoctor(data);
      })
      .catch(handleError);
    return () => {
      active = false;
    };
  }, [doctorId, period, handleError]);
  const specializationTotal =
    overview?.appointmentsBySpecialization.reduce(
      (sum, item) => sum + item.count,
      0,
    ) ?? 0;
  const donut = useMemo(() => {
    let cursor = 0;
    const segments = (overview?.appointmentsBySpecialization ?? []).map(
      (item, index) => {
        const start = cursor;
        cursor += specializationTotal
          ? (item.count / specializationTotal) * 100
          : 0;
        return `${chartColors[index % chartColors.length]} ${start}% ${cursor}%`;
      },
    );
    return segments.length
      ? `conic-gradient(${segments.join(",")})`
      : "#e9f0f5";
  }, [overview, specializationTotal]);
  const logout = async () => {
    setLoggingOut(true);
    await logoutAdmin();
    navigate("/login", { replace: true });
  };
  const activeTrend =
    tab === "DOCTOR"
      ? (doctor?.appointmentTrend ?? [])
      : (overview?.appointmentTrend ?? []);
  return (
    <div className="admin-performance-shell">
      <AdminSidebar onLogout={() => void logout()} loggingOut={loggingOut} />
      <main className="admin-performance-page">
        <header className="performance-heading">
          <div>
            <small>CLINIC INSIGHTS</small>
            <h1>Performance Tracker</h1>
            <p>
              Understand clinic growth and each Doctor’s contribution to child
              care.
            </p>
          </div>
        </header>
        {error && (
          <p className="performance-alert" role="alert">
            {error}
          </p>
        )}
        <section className="performance-toolbar">
          <select
            aria-label="Performance period"
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value as PerformancePeriod)
            }
          >
            {Object.entries(periodLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="Display format"
            value={view}
            onChange={(event) =>
              setView(event.target.value as "CHART" | "TABLE")
            }
          >
            <option value="CHART">Chart View</option>
            <option value="TABLE">Table View</option>
          </select>
        </section>
        <nav className="performance-tabs">
          <button
            className={tab === "CLINIC" ? "is-active" : ""}
            onClick={() => setTab("CLINIC")}
          >
            Clinic Overview
          </button>
          <button
            className={tab === "DOCTOR" ? "is-active" : ""}
            onClick={() => setTab("DOCTOR")}
          >
            Individual Doctor Performance
          </button>
        </nav>
        {loading || !overview ? (
          <section className="performance-loading">
            Preparing your clinic insights…
          </section>
        ) : tab === "CLINIC" ? (
          <>
            <section className="performance-metrics">
              {metricCards.map(([key, label, icon, comparison]) => (
                <article key={key}>
                  <span>{icon}</span>
                  <div>
                    <small>{label}</small>
                    <strong>
                      {key === "overallSatisfaction"
                        ? `${overview.metrics[key]} / 5`
                        : overview.metrics[key]}
                    </strong>
                    <em
                      className={
                        overview.comparisons[comparison] < 0 ? "is-down" : ""
                      }
                    >
                      {overview.comparisons[comparison] >= 0 ? "↑" : "↓"}{" "}
                      {Math.abs(overview.comparisons[comparison])}
                      {key === "overallSatisfaction" ? "" : "%"}
                    </em>
                  </div>
                </article>
              ))}
            </section>
            {view === "CHART" ? (
              <section className="performance-grid">
                <article className="performance-card performance-trend">
                  <h2>Appointments Trend</h2>
                  <LineChart points={activeTrend} />
                  <footer>
                    <span>● Total appointments</span>
                    <span>● Completed</span>
                  </footer>
                </article>
                <article className="performance-card">
                  <h2>Appointments by Doctor Specialization</h2>
                  <div className="performance-donut-wrap">
                    <div
                      className="performance-donut"
                      style={{ background: donut }}
                    >
                      <span>
                        <b>{specializationTotal}</b>Total
                      </span>
                    </div>
                    <ul>
                      {overview.appointmentsBySpecialization.map(
                        (item, index) => (
                          <li key={item.specialization}>
                            <i
                              style={{
                                background:
                                  chartColors[index % chartColors.length],
                              }}
                            />
                            {item.specialization}
                            <b>
                              {specializationTotal
                                ? Math.round(
                                    (item.count / specializationTotal) * 100,
                                  )
                                : 0}
                              %
                            </b>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </article>
                <article className="performance-card">
                  <h2>Overall Satisfaction</h2>
                  <div className="performance-bars">
                    {overview.satisfactionTrend.map((item) => (
                      <span key={item.label}>
                        <i style={{ height: `${(item.rating / 5) * 100}%` }} />
                        <small>{item.label}</small>
                        <b>{item.rating}</b>
                      </span>
                    ))}
                  </div>
                </article>
              </section>
            ) : (
              <section className="performance-card">
                <h2>Clinic Performance Data</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Appointments</th>
                      <th>Completed</th>
                      <th>Completion Rate</th>
                      <th>Cancelled</th>
                      <th>Satisfaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{periodLabels[period]}</td>
                      <td>{overview.metrics.totalAppointments}</td>
                      <td>{overview.metrics.completedAppointments}</td>
                      <td>{overview.metrics.completionRate}%</td>
                      <td>{overview.metrics.cancelledAppointments}</td>
                      <td>{overview.metrics.overallSatisfaction}/5</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            )}
          </>
        ) : (
          <section className="doctor-performance">
            <label>
              Select Doctor
              <select
                value={doctorId}
                onChange={(event) => setDoctorId(event.target.value)}
              >
                {doctors.map((item) => (
                  <option value={item.doctorId} key={item.doctorId}>
                    Dr. {item.firstName} {item.lastName} — {item.designation}
                  </option>
                ))}
              </select>
            </label>
            {doctor ? (
              <>
                <header>
                  <span>🩺</span>
                  <div>
                    <h2>
                      Dr. {doctor.doctor.firstName} {doctor.doctor.lastName}
                    </h2>
                    <p>
                      {doctor.doctor.doctorId} · {doctor.doctor.designation}
                    </p>
                  </div>
                </header>
                <section className="performance-metrics doctor-metrics">
                  {[
                    ["Assigned", doctor.metrics.assignedAppointments],
                    ["Completed", doctor.metrics.completedAppointments],
                    ["Unique Patients", doctor.metrics.uniquePatients],
                    ["Completion Rate", `${doctor.metrics.completionRate}%`],
                    ["Average Rating", `${doctor.metrics.averageRating}/5`],
                    ["Feedback", doctor.metrics.feedbackResponses],
                  ].map(([label, value]) => (
                    <article key={label}>
                      <div>
                        <small>{label}</small>
                        <strong>{value}</strong>
                      </div>
                    </article>
                  ))}
                </section>
                {view === "CHART" ? (
                  <div className="performance-card">
                    <h2>Doctor Appointment Trend</h2>
                    <LineChart points={activeTrend} />
                  </div>
                ) : (
                  <div className="performance-card">
                    <h2>Appointment Status</h2>
                    <table>
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doctor.statusDistribution.map((item) => (
                          <tr key={item.status}>
                            <td>{item.status}</td>
                            <td>{item.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="performance-loading">
                Select a Doctor to view performance.
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
