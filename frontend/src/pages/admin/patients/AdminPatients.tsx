import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "../../../components/admin/AdminSidebar";
import { logoutAdmin } from "../admin-dashboard.service";
import {
  createPatient,
  fetchPatient,
  fetchPatients,
  fetchPatientSummary,
  updatePatient,
} from "./admin-patients.service";
import {
  PatientDetail,
  PatientFilters,
  PatientForm,
  PatientList,
  PatientListItem,
  PatientSummary,
} from "./admin-patients.types";
import "./AdminPatients.css";

const emptyForm: PatientForm = {
  patientName: "",
  dateOfBirth: "",
  gender: "",
  parentName: "",
  primaryPhone: "",
  email: "",
  isActive: true,
};
const initialFilters: PatientFilters = {
  search: "",
  status: "",
  ageGroup: "",
  page: 1,
  pageSize: 10,
};
const toInputDate = (value: string | null) =>
  value ? value.split("-").reverse().join("-") : "";
const statusLabel = (status: string) =>
  status === "FOLLOW_UP"
    ? "Follow-up"
    : status.charAt(0) + status.slice(1).toLowerCase();

export const AdminPatients = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [result, setResult] = useState<PatientList>({
    items: [],
    pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
  });
  const [filters, setFilters] = useState(initialFilters);
  const [draftSearch, setDraftSearch] = useState("");
  const [selected, setSelected] = useState<PatientDetail | null>(null);
  const [modal, setModal] = useState<"ADD" | "EDIT" | null>(null);
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const latestRequest = useRef(0);
  const handleError = useCallback(
    (reason: unknown) => {
      if (reason instanceof Error && reason.message === "SESSION_INVALID")
        navigate("/login", { replace: true });
      else
        setError(
          reason instanceof Error ? reason.message : "Unable to load patients.",
        );
    },
    [navigate],
  );
  const load = useCallback(async () => {
    const requestNumber = ++latestRequest.current;
    setLoading(true);
    setError("");
    try {
      const [counts, patients] = await Promise.all([
        fetchPatientSummary(),
        fetchPatients(filters),
      ]);
      if (requestNumber === latestRequest.current) {
        setSummary(counts);
        setResult(patients);
      }
    } catch (reason) {
      if (requestNumber === latestRequest.current) handleError(reason);
    } finally {
      if (requestNumber === latestRequest.current) setLoading(false);
    }
  }, [filters, handleError]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) =>
        current.search === draftSearch
          ? current
          : { ...current, search: draftSearch, page: 1 },
      );
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draftSearch]);
  const viewPatient = async (patient: PatientListItem) => {
    setError("");
    try {
      setSelected(await fetchPatient(patient.patientId));
    } catch (reason) {
      handleError(reason);
    }
  };
  const openAdd = () => {
    setForm(emptyForm);
    setFieldErrors({});
    setModal("ADD");
  };
  const openEdit = () => {
    if (!selected) return;
    const item = selected.patient;
    setForm({
      patientName: item.patientName,
      dateOfBirth: toInputDate(item.dateOfBirth),
      gender: (item.gender as PatientForm["gender"]) ?? "",
      parentName: item.parentName,
      primaryPhone: item.primaryPhone,
      email: item.email ?? "",
      isActive: item.isActive,
    });
    setFieldErrors({});
    setModal("EDIT");
  };
  const savePatient = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setFieldErrors({});
    try {
      const saved =
        modal === "EDIT" && selected
          ? await updatePatient(selected.patient.patientId, form)
          : await createPatient(form);
      setNotice(
        modal === "EDIT"
          ? "Patient updated successfully."
          : "Patient added successfully.",
      );
      setModal(null);
      await load();
      setSelected(await fetchPatient(saved.patientId));
    } catch (reason) {
      const issue = reason as Error & { errors?: Record<string, string[]> };
      setFieldErrors(issue.errors ?? {});
      setError(issue.message);
    } finally {
      setBusy(false);
    }
  };
  const logout = async () => {
    setLoggingOut(true);
    await logoutAdmin();
    navigate("/login", { replace: true });
  };
  const exportRows = () => {
    const rows = [
      [
        "Patient ID",
        "Patient Name",
        "Age",
        "Gender",
        "Parent",
        "Phone",
        "Status",
      ],
      ...result.items.map((item) => [
        item.patientId,
        item.patientName,
        String(item.age ?? ""),
        item.gender ?? "",
        item.parentName,
        item.primaryPhone,
        statusLabel(item.status),
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "sankalp-patients.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const metrics = summary
    ? ([
        ["👨‍👩‍👧", "Total Patients", summary.totalPatients, "patients"],
        ["🧒", "New Patients", summary.newPatients, "new"],
        ["🌱", "Active Patients", summary.activePatients, "active"],
        ["⏰", "Follow-ups Due", summary.followUpsDue, "follow"],
        ["📘", "Inactive", summary.inactivePatients, "inactive"],
      ] as const)
    : [];
  return (
    <div className="admin-patients-shell">
      <AdminSidebar onLogout={() => void logout()} loggingOut={loggingOut} />
      <main className="admin-patients-page">
        <header className="patients-heading">
          <div>
            <small>PATIENT CARE</small>
            <h1>Patients</h1>
            <p>View and manage every child’s clinic journey.</p>
          </div>
          <button type="button" onClick={openAdd}>
            ＋ Add New Patient
          </button>
        </header>
        {error && (
          <p className="patients-alert patients-alert--error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="patients-alert patients-alert--success" role="status">
            {notice}
          </p>
        )}
        <section className="patient-metrics">
          {metrics.map(([icon, label, count, theme]) => (
            <article
              className={`patient-metric patient-metric--${theme}`}
              key={label}
            >
              <span>{icon}</span>
              <div>
                <small>{label}</small>
                <strong>{count}</strong>
              </div>
            </article>
          ))}
        </section>
        <form
          className="patient-filters"
          onSubmit={(event) => event.preventDefault()}
        >
          <label>
            <span>⌕</span>
            <input
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder="Search by patient name, phone or ID"
            />
          </label>
          <select
            value={filters.ageGroup}
            onChange={(event) =>
              setFilters({ ...filters, ageGroup: event.target.value, page: 1 })
            }
          >
            <option value="">All Age Groups</option>
            {["0-2", "2-4", "4-6", "6-8", "8-10", "10-12", "12+"].map((age) => (
              <option value={age} key={age}>
                {age} years
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters({
                ...filters,
                status: event.target.value as PatientFilters["status"],
                page: 1,
              })
            }
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="FOLLOW_UP">Follow-up</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button
            className="patient-filter-reset"
            type="button"
            onClick={() => {
              setDraftSearch("");
              setFilters(initialFilters);
            }}
          >
            Reset
          </button>
          <button className="patient-export" type="button" onClick={exportRows}>
            ⇩ Export
          </button>
        </form>
        <div className={`patients-workspace${selected ? " has-detail" : ""}`}>
          <section className="patients-table-card">
            {loading ? (
              <div className="patients-empty">Loading patient records…</div>
            ) : result.items.length === 0 ? (
              <div className="patients-empty">
                <span>🧸</span>
                <h2>No patients found</h2>
                <p>Try another filter or add a new patient.</p>
              </div>
            ) : (
              <div className="patients-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Patient</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Parent</th>
                      <th>Next Appointment</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((patient, index) => (
                      <tr key={patient.patientId}>
                        <td>
                          {(result.pagination.page - 1) *
                            result.pagination.pageSize +
                            index +
                            1}
                        </td>
                        <td>
                          <span className="patient-name-cell">
                            <i>🧒</i>
                            <span>
                              <b>{patient.patientName}</b>
                              <small>{patient.patientId}</small>
                            </span>
                          </span>
                        </td>
                        <td>
                          {patient.age === null ? "—" : `${patient.age} Y`}
                        </td>
                        <td>{patient.gender ?? "—"}</td>
                        <td>{patient.parentName}</td>
                        <td>
                          {patient.nextAppointment ? (
                            <>
                              <b>{patient.nextAppointment.date}</b>
                              <small>{patient.nextAppointment.time}</small>
                            </>
                          ) : (
                            "Not scheduled"
                          )}
                        </td>
                        <td>
                          <i
                            className={`patient-status patient-status--${patient.status.toLowerCase()}`}
                          >
                            {statusLabel(patient.status)}
                          </i>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => void viewPatient(patient)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <footer>
              <span>
                Showing {result.items.length} of {result.pagination.total}{" "}
                patients
              </span>
              <div>
                <button
                  type="button"
                  disabled={filters.page <= 1}
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page - 1 })
                  }
                >
                  ‹
                </button>
                <b>
                  Page {result.pagination.page} of{" "}
                  {Math.max(result.pagination.totalPages, 1)}
                </b>
                <button
                  type="button"
                  disabled={filters.page >= result.pagination.totalPages}
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page + 1 })
                  }
                >
                  ›
                </button>
              </div>
              <label>
                Rows
                <select
                  value={filters.pageSize}
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      pageSize: Number(event.target.value),
                      page: 1,
                    })
                  }
                >
                  <option>10</option>
                  <option>25</option>
                  <option>50</option>
                </select>
              </label>
            </footer>
          </section>
          {selected && (
            <aside className="patient-detail-panel">
              <header>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close patient details"
                >
                  ×
                </button>
                <div className="patient-detail-title">
                  <span>🧒</span>
                  <div>
                    <h2>{selected.patient.patientName}</h2>
                    <p>Patient ID: {selected.patient.patientId}</p>
                    <i
                      className={`patient-status patient-status--${selected.patient.status.toLowerCase()}`}
                    >
                      {statusLabel(selected.patient.status)}
                    </i>
                  </div>
                  <button type="button" onClick={openEdit}>
                    ✎ Edit
                  </button>
                </div>
              </header>
              <section>
                <h3>Basic Information</h3>
                <dl>
                  <div>
                    <dt>Age / DOB</dt>
                    <dd>
                      {selected.patient.age ?? "—"} Years |{" "}
                      {selected.patient.dateOfBirth ?? "Not provided"}
                    </dd>
                  </div>
                  <div>
                    <dt>Gender</dt>
                    <dd>{selected.patient.gender ?? "Not provided"}</dd>
                  </div>
                  <div>
                    <dt>Parent</dt>
                    <dd>{selected.patient.parentName}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{selected.patient.primaryPhone}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{selected.patient.email ?? "Not provided"}</dd>
                  </div>
                  <div>
                    <dt>Current Therapist</dt>
                    <dd>
                      {selected.patient.therapist?.name ?? "Not assigned"}
                    </dd>
                  </div>
                </dl>
              </section>
              <section>
                <h3>Appointments ({selected.appointments.length})</h3>
                {selected.appointments.length ? (
                  selected.appointments.slice(0, 5).map((appointment) => (
                    <article
                      className="patient-history-row"
                      key={String(appointment.referenceId)}
                    >
                      <b>{String(appointment.referenceId)}</b>
                      <span>
                        {String(
                          appointment.scheduledDate ??
                            appointment.preferredDate,
                        )}{" "}
                        ·{" "}
                        {String(
                          appointment.scheduledTime ??
                            appointment.preferredTime,
                        )}
                      </span>
                      <i>{String(appointment.status)}</i>
                    </article>
                  ))
                ) : (
                  <p>No appointments recorded.</p>
                )}
              </section>
              <section>
                <h3>Clinical History ({selected.caseHistory.length})</h3>
                {selected.caseHistory.length ? (
                  selected.caseHistory.map((record) => (
                    <details
                      className="patient-case-row"
                      key={String(record.id)}
                    >
                      <summary>
                        Visit #{String(record.appointmentNumber)} ·{" "}
                        {String(record.appointmentDate)}
                      </summary>
                      <p>{String(record.caseHistory)}</p>
                    </details>
                  ))
                ) : (
                  <p>No case history recorded.</p>
                )}
              </section>
            </aside>
          )}
        </div>
      </main>
      {modal && (
        <div className="patient-modal-backdrop">
          <section
            className="patient-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="patient-modal-title"
          >
            <header>
              <div>
                <small>
                  {modal === "ADD"
                    ? "NEW PATIENT"
                    : selected?.patient.patientId}
                </small>
                <h2 id="patient-modal-title">
                  {modal === "ADD" ? "Add New Patient" : "Edit Patient"}
                </h2>
              </div>
              <button type="button" onClick={() => setModal(null)}>
                ×
              </button>
            </header>
            <form onSubmit={savePatient}>
              <div className="patient-form-grid">
                <label>
                  Patient Name
                  <input
                    value={form.patientName}
                    onChange={(event) =>
                      setForm({ ...form, patientName: event.target.value })
                    }
                    required
                  />
                  {fieldErrors.patientName?.[0] && (
                    <small>{fieldErrors.patientName[0]}</small>
                  )}
                </label>
                <label>
                  Date of Birth
                  <input
                    type="date"
                    max={new Date().toLocaleDateString("en-CA")}
                    value={form.dateOfBirth}
                    onChange={(event) =>
                      setForm({ ...form, dateOfBirth: event.target.value })
                    }
                    required
                  />
                  {fieldErrors.dateOfBirth?.[0] && (
                    <small>{fieldErrors.dateOfBirth[0]}</small>
                  )}
                </label>
                <label>
                  Gender
                  <select
                    value={form.gender}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        gender: event.target.value as PatientForm["gender"],
                      })
                    }
                  >
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </label>
                <label>
                  Parent / Guardian Name
                  <input
                    value={form.parentName}
                    onChange={(event) =>
                      setForm({ ...form, parentName: event.target.value })
                    }
                    required
                  />
                  {fieldErrors.parentName?.[0] && (
                    <small>{fieldErrors.parentName[0]}</small>
                  )}
                </label>
                <label>
                  Phone Number
                  <input
                    value={form.primaryPhone}
                    onChange={(event) =>
                      setForm({ ...form, primaryPhone: event.target.value })
                    }
                    required
                  />
                  {fieldErrors.primaryPhone?.[0] && (
                    <small>{fieldErrors.primaryPhone[0]}</small>
                  )}
                </label>
                <label>
                  Email Address
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({ ...form, email: event.target.value })
                    }
                  />
                  {fieldErrors.email?.[0] && (
                    <small>{fieldErrors.email[0]}</small>
                  )}
                </label>
                {modal === "EDIT" && (
                  <label className="patient-active-toggle">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        setForm({ ...form, isActive: event.target.checked })
                      }
                    />
                    <span>Patient is active</span>
                  </label>
                )}
              </div>
              <footer>
                <button type="button" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button type="submit" disabled={busy}>
                  {busy
                    ? "Saving…"
                    : modal === "ADD"
                      ? "Add Patient"
                      : "Save Changes"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};
