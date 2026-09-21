import { FormEvent, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "../../../components/admin/AdminSidebar";
import { logoutAdmin } from "../admin-dashboard.service";
import { fetchDoctors } from "../doctors/admin-doctors.service";
import { Doctor } from "../doctors/admin-doctors.types";
import { deletePatient } from "../patients/admin-patients.service";
import {
  assignContactDoctor,
  createAppointmentFromContact,
  deleteContactRequest,
  fetchContactRequestDetails,
  fetchContactRequests,
  fetchContactRequestSummary,
  saveContactFollowUp,
  saveContactStatus,
} from "./admin-contact-requests.service";
import {
  ContactFollowUpMethod,
  ContactRequestDetails,
  ContactRequestStatus,
  ContactRequestSummary,
} from "./admin-contact-requests.types";
import "./AdminContactRequests.css";

const tabs: Array<
  ["ALL" | ContactRequestStatus, keyof ContactRequestSummary, string]
> = [
  ["ALL", "all", "All"],
  ["NEW", "new", "New"],
  ["IN_PROGRESS", "inProgress", "In Progress"],
  ["RESOLVED", "resolved", "Resolved"],
];
const initialSummary: ContactRequestSummary = {
  all: 0,
  new: 0,
  inProgress: 0,
  resolved: 0,
};
const initialAppointment = {
  childName: "",
  childAge: "",
  childDateOfBirth: "",
  preferredDate: "",
  consent: false,
};

export const AdminContactRequests = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState<"ALL" | ContactRequestStatus>("ALL");
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof fetchContactRequests>>["items"]
  >([]);
  const [summary, setSummary] = useState(initialSummary);
  const [selected, setSelected] = useState<ContactRequestDetails | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [doctorId, setDoctorId] = useState("");
  const [followUp, setFollowUp] = useState<ContactFollowUpMethod>("CALL");
  const [note, setNote] = useState("");
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [appointment, setAppointment] = useState(initialAppointment);

  const handleError = useCallback(
    (reason: unknown) => {
      if (reason instanceof Error && reason.message === "SESSION_INVALID") {
        navigate("/login", { replace: true });
        return;
      }
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load contact requests.",
      );
    },
    [navigate],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [list, counts, doctorList] = await Promise.all([
        fetchContactRequests(active, debouncedSearch, page),
        fetchContactRequestSummary(),
        fetchDoctors(),
      ]);
      setItems(list.items);
      setTotalPages(Math.max(1, list.pagination.totalPages));
      setSummary(counts);
      setDoctors(doctorList.filter((doctor) => doctor.isActive));
    } catch (reason) {
      handleError(reason);
    } finally {
      setLoading(false);
    }
  }, [active, debouncedSearch, page, handleError]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!appointmentOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [appointmentOpen]);

  const choose = async (referenceId: string) => {
    setError("");
    try {
      const detail = await fetchContactRequestDetails(referenceId);
      setSelected(detail);
      setDoctorId(detail.assignedDoctor?.doctorId ?? "");
      setFollowUp(detail.followUpMethod ?? "CALL");
      setNote(detail.adminNote ?? "");
    } catch (reason) {
      handleError(reason);
    }
  };

  const refresh = async (message: string) => {
    if (selected)
      setSelected(await fetchContactRequestDetails(selected.referenceId));
    setNotice(message);
    await load();
  };

  const assign = async () => {
    if (!selected || !doctorId) return;
    setBusy(true);
    setError("");
    try {
      const result = await assignContactDoctor(
        selected.referenceId,
        doctorId,
        note,
      );
      await refresh(result.message);
    } catch (reason) {
      handleError(reason);
    } finally {
      setBusy(false);
    }
  };

  const saveFollowUp = async () => {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const result = await saveContactFollowUp(
        selected.referenceId,
        followUp,
        note,
      );
      await refresh(result.message);
    } catch (reason) {
      handleError(reason);
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (status: ContactRequestStatus) => {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const result = await saveContactStatus(
        selected.referenceId,
        status,
        note,
      );
      await refresh(result.message);
    } catch (reason) {
      handleError(reason);
    } finally {
      setBusy(false);
    }
  };

  const createAppointment = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const result = await createAppointmentFromContact(selected.referenceId, {
        ...appointment,
        childDateOfBirth: appointment.childDateOfBirth || undefined,
      });
      setAppointmentOpen(false);
      setAppointment(initialAppointment);
      await refresh(
        `${result.message} Reference: ${result.data.appointmentReferenceId}`,
      );
    } catch (reason) {
      handleError(reason);
    } finally {
      setBusy(false);
    }
  };

  const removeConvertedPatient = async () => {
    const patientId = selected?.convertedAppointment?.patient.patientId;
    if (!selected || !patientId) return;
    if (
      !window.confirm(
        `Delete patient ${patientId}? This permanently removes the patient, appointments, case history and feedback records.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await deletePatient(patientId);
      await refresh("Patient and associated records deleted successfully.");
    } catch (reason) {
      handleError(reason);
    } finally {
      setBusy(false);
    }
  };

  const removeSelectedContactRequest = async () => {
    if (!selected) return;
    if (
      !window.confirm(
        `Delete contact request ${selected.referenceId} from ${selected.name}? This removes the enquiry and its activity history only.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const result = await deleteContactRequest(selected.referenceId);
      setSelected(null);
      setNotice(result.message);
      await load();
    } catch (reason) {
      handleError(reason);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setLoggingOut(true);
    await logoutAdmin();
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-contact-shell">
      <AdminSidebar onLogout={() => void logout()} loggingOut={loggingOut} />
      <main className="admin-contact-page">
        <header className="admin-contact-heading">
          <div>
            <small>FAMILY ENQUIRIES</small>
            <h1>Contact Requests</h1>
            <p>Review every family enquiry and coordinate the next step.</p>
          </div>
          <span aria-hidden="true">💌</span>
        </header>

        {error && (
          <p className="admin-contact-alert is-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="admin-contact-alert is-success" role="status">
            {notice}
          </p>
        )}

        <div className="admin-contact-toolbar">
          <nav aria-label="Contact request status">
            {tabs.map(([value, key, label]) => (
              <button
                className={active === value ? "is-active" : ""}
                type="button"
                onClick={() => {
                  setActive(value);
                  setPage(1);
                  setSelected(null);
                }}
                key={value}
              >
                {label}
                <b>{summary[key]}</b>
              </button>
            ))}
          </nav>
          <label>
            <span aria-hidden="true">⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, phone, email or reference"
              aria-label="Search contact requests"
            />
          </label>
        </div>

        <div className="admin-contact-workspace">
          <section
            className="admin-contact-list-panel"
            aria-label="Contact requests"
          >
            {loading ? (
              <div className="admin-contact-empty">
                Loading contact requests…
              </div>
            ) : items.length === 0 ? (
              <div className="admin-contact-empty">
                <span>📭</span>
                <h2>No requests found</h2>
                <p>New Contact Us messages will appear here.</p>
              </div>
            ) : (
              <>
                <div className="admin-contact-list">
                  {items.map((item) => (
                    <button
                      className={`admin-contact-row${selected?.referenceId === item.referenceId ? " is-selected" : ""}`}
                      type="button"
                      onClick={() => void choose(item.referenceId)}
                      key={item.referenceId}
                    >
                      <span className="admin-contact-avatar" aria-hidden="true">
                        {item.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="admin-contact-person">
                        <strong>{item.name}</strong>
                        <small>
                          {item.referenceId} · {item.phone}
                        </small>
                        <small>{item.subject}</small>
                      </span>
                      <time>
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </time>
                      <i
                        className={`contact-status is-${item.status.toLowerCase()}`}
                      >
                        {item.status.replace("_", " ")}
                      </i>
                    </button>
                  ))}
                </div>
                <footer className="admin-contact-pagination">
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <div>
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage((value) => value - 1)}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((value) => value + 1)}
                    >
                      Next
                    </button>
                  </div>
                </footer>
              </>
            )}
          </section>

          <aside className="admin-contact-details">
            {!selected ? (
              <div className="admin-contact-empty">
                <span>👨‍👩‍👧</span>
                <h2>Select a request</h2>
                <p>Request details and follow-up controls will appear here.</p>
              </div>
            ) : (
              <>
                <header>
                  <div>
                    <small>{selected.referenceId}</small>
                    <h2>{selected.name}</h2>
                    <p>{selected.subject}</p>
                  </div>
                  <i
                    className={`contact-status is-${selected.status.toLowerCase()}`}
                  >
                    {selected.status.replace("_", " ")}
                  </i>
                </header>
                <div className="admin-contact-quick-actions">
                  <a
                    href={`tel:${selected.phone.replace(/\s/g, "")}`}
                    aria-label="Call parent"
                  >
                    ☎<span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/${selected.phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "91")}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Message parent on WhatsApp"
                  >
                    ◉<span>WhatsApp</span>
                  </a>
                  <a
                    href={`mailto:${selected.email}`}
                    aria-label="Email parent"
                  >
                    ✉<span>Email</span>
                  </a>
                </div>
                <dl className="admin-contact-info">
                  <div>
                    <dt>Phone</dt>
                    <dd>{selected.phone}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{selected.email}</dd>
                  </div>
                  <div>
                    <dt>Submitted</dt>
                    <dd>
                      {new Date(selected.createdAt).toLocaleString("en-IN")}
                    </dd>
                  </div>
                  <div>
                    <dt>Assigned To</dt>
                    <dd>
                      {selected.assignedDoctor
                        ? `Dr. ${selected.assignedDoctor.firstName} ${selected.assignedDoctor.lastName}`
                        : "Not assigned"}
                    </dd>
                  </div>
                </dl>
                <section className="admin-contact-message">
                  <small>MESSAGE</small>
                  <p>{selected.message}</p>
                </section>
                <div className="admin-contact-form-grid">
                  <label>
                    Assign Doctor
                    <select
                      value={doctorId}
                      onChange={(event) => setDoctorId(event.target.value)}
                      disabled={selected.status === "RESOLVED"}
                    >
                      <option value="">Choose an active Doctor</option>
                      {doctors.map((doctor) => (
                        <option value={doctor.doctorId} key={doctor.doctorId}>
                          Dr. {doctor.firstName} {doctor.lastName} —{" "}
                          {doctor.designation}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Follow-up Method
                    <select
                      value={followUp}
                      onChange={(event) =>
                        setFollowUp(event.target.value as ContactFollowUpMethod)
                      }
                    >
                      <option value="CALL">Call</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="EMAIL">Email</option>
                    </select>
                  </label>
                </div>
                <label className="admin-contact-note">
                  Admin Note
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={1000}
                    placeholder="Add follow-up or care coordination notes"
                  />
                </label>
                <div className="admin-contact-save-actions">
                  <button
                    type="button"
                    disabled={
                      !doctorId || busy || selected.status === "RESOLVED"
                    }
                    onClick={() => void assign()}
                  >
                    Assign Doctor
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void saveFollowUp()}
                  >
                    Save Follow-up
                  </button>
                </div>
                {selected.activities.length > 0 && (
                  <details className="admin-contact-history">
                    <summary>
                      Activity history ({selected.activities.length})
                    </summary>
                    {selected.activities.map((activity, index) => (
                      <article key={`${activity.createdAt}-${index}`}>
                        <b>{activity.event.replaceAll("_", " ")}</b>
                        <time>
                          {new Date(activity.createdAt).toLocaleString("en-IN")}
                        </time>
                        {activity.note && <p>{activity.note}</p>}
                      </article>
                    ))}
                  </details>
                )}
                <div className="admin-contact-final-actions">
                  <button
                    type="button"
                    className="is-delete-request"
                    disabled={busy}
                    onClick={() => void removeSelectedContactRequest()}
                  >
                    Delete Contact Request
                  </button>
                  {selected.status === "RESOLVED" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void changeStatus("IN_PROGRESS")}
                    >
                      Reopen Request
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void changeStatus("RESOLVED")}
                    >
                      ✓ Mark Resolved
                    </button>
                  )}
                  <button
                    type="button"
                    className="is-appointment"
                    disabled={Boolean(selected.convertedAppointment) || busy}
                    onClick={() => {
                      setAppointment({ ...initialAppointment, childName: "" });
                      setAppointmentOpen(true);
                    }}
                  >
                    {selected.convertedAppointment
                      ? `Appointment ${selected.convertedAppointment.referenceId}`
                      : "+ Create Appointment"}
                  </button>
                  {selected.convertedAppointment && (
                    <button
                      type="button"
                      className="is-delete-patient"
                      disabled={busy}
                      onClick={() => void removeConvertedPatient()}
                    >
                      Delete Patient{" "}
                      {selected.convertedAppointment.patient.patientId}
                    </button>
                  )}
                </div>
              </>
            )}
          </aside>
        </div>
      </main>

      {appointmentOpen && selected && (
        <div
          className="contact-appointment-dialog"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAppointmentOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-appointment-title"
          >
            <header>
              <div>
                <small>CONTACT REQUEST {selected.referenceId}</small>
                <h2 id="contact-appointment-title">
                  Create Appointment Request
                </h2>
                <p>Parent details will be carried over automatically.</p>
              </div>
              <button
                type="button"
                aria-label="Close appointment form"
                onClick={() => setAppointmentOpen(false)}
              >
                ×
              </button>
            </header>
            <form onSubmit={createAppointment}>
              <label>
                Child’s Name
                <input
                  value={appointment.childName}
                  onChange={(event) =>
                    setAppointment({
                      ...appointment,
                      childName: event.target.value,
                    })
                  }
                  minLength={2}
                  maxLength={80}
                  required
                />
              </label>
              <label>
                Child’s Age
                <input
                  value={appointment.childAge}
                  onChange={(event) =>
                    setAppointment({
                      ...appointment,
                      childAge: event.target.value,
                    })
                  }
                  placeholder="Example: 4 years"
                  required
                />
              </label>
              <label>
                Child’s Date of Birth
                <input
                  type="date"
                  max={new Date().toLocaleDateString("en-CA")}
                  value={appointment.childDateOfBirth}
                  onChange={(event) =>
                    setAppointment({
                      ...appointment,
                      childDateOfBirth: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Preferred Date
                <input
                  type="date"
                  min={new Date().toLocaleDateString("en-CA")}
                  value={appointment.preferredDate}
                  onChange={(event) =>
                    setAppointment({
                      ...appointment,
                      preferredDate: event.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="contact-appointment-consent">
                <input
                  type="checkbox"
                  checked={appointment.consent}
                  onChange={(event) =>
                    setAppointment({
                      ...appointment,
                      consent: event.target.checked,
                    })
                  }
                  required
                />
                <span>
                  I confirm that the parent consented to be contacted about this
                  appointment.
                </span>
              </label>
              <footer>
                <button type="button" onClick={() => setAppointmentOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="is-create"
                  disabled={busy || !appointment.consent}
                >
                  {busy ? "Creating…" : "Create Appointment"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};
