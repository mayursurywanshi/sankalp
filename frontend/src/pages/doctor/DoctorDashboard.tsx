import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/sankalp-logo.webp";
import { logoutAdmin } from "../admin/admin-dashboard.service";
import {
  createCaseHistory,
  fetchDoctorAppointment,
  fetchDoctorAppointments,
  fetchMyAvailability,
  fetchPatientHistory,
  scheduleFollowUp,
  updateCaseHistory,
} from "./doctor-appointments.service";
import {
  CaseHistoryForm,
  DoctorAppointment,
  DoctorAppointmentDetail,
  PatientHistory,
} from "./doctor-appointments.types";
import "./DoctorDashboard.css";

const emptyForm: CaseHistoryForm = {
  appointmentDate: "",
  presentingConcern: "",
  medicalHistory: "",
  assessment: "",
  treatmentProvided: "",
  therapyGoals: "",
  progressNotes: "",
  homeProgram: "",
  recommendations: "",
  caseHistory: "",
  additionalNotes: "",
};
const inputDate = (date?: string | null) =>
  date ? date.split("-").reverse().join("-") : "";
const fromHistory = (
  value: NonNullable<DoctorAppointmentDetail["caseHistory"]>,
): CaseHistoryForm => ({
  appointmentDate: inputDate(value.appointmentDate),
  presentingConcern: value.presentingConcern ?? "",
  medicalHistory: value.medicalHistory ?? "",
  assessment: value.assessment ?? "",
  treatmentProvided: value.treatmentProvided ?? "",
  therapyGoals: value.therapyGoals ?? "",
  progressNotes: value.progressNotes ?? "",
  homeProgram: value.homeProgram ?? "",
  recommendations: value.recommendations ?? "",
  caseHistory: value.caseHistory,
  additionalNotes: value.additionalNotes ?? "",
});

export const patientIdForHistoryRefresh = (
  detail: DoctorAppointmentDetail,
): string => {
  const patientId = detail.patient?.patientId || detail.patientId;
  if (!patientId) throw new Error("Patient information is unavailable.");
  return patientId;
};

export const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<DoctorAppointment[]>([]);
  const [selected, setSelected] = useState<DoctorAppointmentDetail | null>(
    null,
  );
  const [history, setHistory] = useState<PatientHistory | null>(null);
  const [view, setView] = useState<"TODAY" | "PREVIOUS" | "ALL">("TODAY");
  const [form, setForm] = useState<CaseHistoryForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [menu, setMenu] = useState(false);
  const [slotDialog, setSlotDialog] = useState(false);
  const [slotDays, setSlotDays] = useState<
    Array<{
      date: string;
      label: string;
      closed: boolean;
      slots: Array<{ time: string; available: boolean }>;
    }>
  >([]);
  const [chosenSlot, setChosenSlot] = useState<{
    date: string;
    time: string;
  } | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const todayDisplay = useMemo(
    () => new Date().toLocaleDateString("en-GB").replaceAll("/", "-"),
    [],
  );
  const todayInput = useMemo(() => new Date().toLocaleDateString("en-CA"), []);
  const handleError = useCallback(
    (reason: unknown) => {
      if (reason instanceof Error && reason.message === "SESSION_INVALID")
        navigate("/login", { replace: true });
      else
        setError(
          reason instanceof Error ? reason.message : "Something went wrong.",
        );
    },
    [navigate],
  );
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchDoctorAppointments());
    } catch (reason) {
      handleError(reason);
    } finally {
      setLoading(false);
    }
  }, [handleError]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!slotDialog) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [slotDialog]);
  const visible = items.filter((item) => {
    if (view === "ALL") return true;
    if (view === "TODAY") return item.scheduledDate === todayDisplay;
    if (!item.scheduledDate) return false;
    const [day, month, year] = item.scheduledDate.split("-").map(Number);
    return (
      new Date(year, month - 1, day).getTime() < new Date().setHours(0, 0, 0, 0)
    );
  });
  const select = async (item: DoctorAppointment) => {
    setError("");
    setNotice("");
    try {
      const [detail, previous] = await Promise.all([
        fetchDoctorAppointment(item.referenceId),
        fetchPatientHistory(item.patientId),
      ]);
      setSelected(detail);
      setHistory(previous);
      setForm(
        detail.caseHistory
          ? fromHistory(detail.caseHistory)
          : {
              ...emptyForm,
              appointmentDate: inputDate(detail.scheduledDate) || todayInput,
            },
      );
    } catch (reason) {
      handleError(reason);
    }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (selected.caseHistory)
        await updateCaseHistory(selected.caseHistory.id, form);
      else await createCaseHistory(selected.referenceId, form);
      const detail = await fetchDoctorAppointment(selected.referenceId);
      setSelected(detail);
      setForm(detail.caseHistory ? fromHistory(detail.caseHistory) : form);
      setHistory(await fetchPatientHistory(patientIdForHistoryRefresh(detail)));
      setNotice("Patient case history saved successfully.");
      await load();
    } catch (reason) {
      handleError(reason);
    } finally {
      setBusy(false);
    }
  };
  const logout = async () => {
    await logoutAdmin();
    navigate("/login", { replace: true });
  };
  const openNextAppointment = async () => {
    if (!selected?.caseHistory) {
      setError(
        "Save the patient case history before scheduling the next appointment.",
      );
      return;
    }
    setError("");
    setChosenSlot(null);
    setSlotDialog(true);
    setSlotsLoading(true);
    const dates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      const iso = date.toLocaleDateString("en-CA");
      return {
        iso,
        display: iso.split("-").reverse().join("-"),
        label: date.toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "short",
        }),
        closed: date.getDay() === 0,
      };
    });
    const results = await Promise.all(
      dates.map(async (day) => {
        if (day.closed)
          return {
            date: day.display,
            label: day.label,
            closed: true,
            slots: [],
          };
        try {
          const result = await fetchMyAvailability(day.display);
          return {
            date: day.display,
            label: day.label,
            closed: false,
            slots: result.slots,
          };
        } catch {
          return {
            date: day.display,
            label: day.label,
            closed: true,
            slots: [],
          };
        }
      }),
    );
    setSlotDays(results);
    setSlotsLoading(false);
  };
  const confirmNextAppointment = async () => {
    if (!selected || !chosenSlot) return;
    setBusy(true);
    setError("");
    try {
      const result = await scheduleFollowUp(
        selected.referenceId,
        chosenSlot.date,
        chosenSlot.time,
      );
      setNotice(
        `Next appointment ${result.referenceId} scheduled for ${result.scheduledDate} at ${result.scheduledTime}.`,
      );
      setSlotDialog(false);
      await load();
    } catch (reason) {
      handleError(reason);
    } finally {
      setBusy(false);
    }
  };
  const fields: Array<[keyof CaseHistoryForm, string, string]> = [
    [
      "presentingConcern",
      "Presenting Concern",
      "What brought the child for care?",
    ],
    [
      "medicalHistory",
      "Medical History",
      "Relevant medical and developmental history",
    ],
    [
      "assessment",
      "Clinical Assessment",
      "Observations and assessment findings",
    ],
    [
      "treatmentProvided",
      "Treatment Provided",
      "Therapy completed during this visit",
    ],
    ["therapyGoals", "Therapy Goals", "Short and long-term goals"],
    ["progressNotes", "Progress Notes", "Response and progress observed"],
    ["homeProgram", "Home Program", "Activities advised for home"],
    ["recommendations", "Recommendations", "Further clinical recommendations"],
  ];
  return (
    <div className="doctor-dashboard-shell">
      <button
        className="doctor-menu-button"
        type="button"
        onClick={() => setMenu(!menu)}
      >
        ☰ <span>Menu</span>
      </button>
      <aside className={`doctor-sidebar${menu ? " is-open" : ""}`}>
        <img src={logo} alt="Sankalp" />
        <nav>
          <button className="is-active" type="button">
            ▦ Dashboard
          </button>
          <button type="button" onClick={() => setView("TODAY")}>
            📅 Today’s Patients
          </button>
          <button type="button" onClick={() => setView("PREVIOUS")}>
            📖 Patient History
          </button>
        </nav>
        <button
          className="doctor-logout"
          type="button"
          onClick={() => void logout()}
        >
          ↪ Logout
        </button>
      </aside>
      <main className="doctor-dashboard">
        <header>
          <div>
            <small>DOCTOR WORKSPACE</small>
            <h1>My Patient Schedule</h1>
            <p>
              Review appointments and keep each child’s clinical journey up to
              date.
            </p>
          </div>
          <span className="doctor-profile">
            🧑‍⚕️ <b>Doctor</b>
          </span>
        </header>
        {error && (
          <p className="doctor-alert doctor-alert--error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="doctor-alert doctor-alert--success" role="status">
            {notice}
          </p>
        )}
        <nav className="doctor-tabs">
          {(["TODAY", "PREVIOUS", "ALL"] as const).map((value) => (
            <button
              className={view === value ? "is-active" : ""}
              type="button"
              onClick={() => setView(value)}
              key={value}
            >
              {value === "TODAY"
                ? "Today"
                : value === "PREVIOUS"
                  ? "Previous Days"
                  : "All Assigned"}
            </button>
          ))}
        </nav>
        <div className="doctor-workspace">
          <section className="doctor-patient-list">
            {loading ? (
              <p>Loading patients…</p>
            ) : visible.length === 0 ? (
              <div className="doctor-empty">
                <span>🪁</span>
                <h2>No patients in this view</h2>
                <p>Your assigned appointments will appear here.</p>
              </div>
            ) : (
              visible.map((item) => (
                <button
                  className={
                    selected?.referenceId === item.referenceId
                      ? "is-selected"
                      : ""
                  }
                  type="button"
                  onClick={() => void select(item)}
                  key={item.referenceId}
                >
                  <span>🧒</span>
                  <span>
                    <strong>{item.childName}</strong>
                    <small>
                      {item.childAge} · {item.patientId}
                    </small>
                    <small>
                      {item.scheduledDate} · {item.scheduledTime}
                    </small>
                  </span>
                  <i>
                    {item.caseHistory
                      ? item.caseHistory.isLocked
                        ? "COMPLETED"
                        : "HISTORY ADDED"
                      : "CASE NOTES DUE"}
                  </i>
                </button>
              ))
            )}
          </section>
          <section className="doctor-case-panel">
            {!selected ? (
              <div className="doctor-empty">
                <span>📋</span>
                <h2>Select a patient</h2>
                <p>
                  Appointment details and case-history tools will open here.
                </p>
              </div>
            ) : (
              <>
                <header>
                  <div>
                    <small>{selected.referenceId}</small>
                    <h2>{selected.childName}</h2>
                    <p>
                      {selected.childAge} · Parent: {selected.parentName} ·{" "}
                      {selected.phone}
                    </p>
                  </div>
                  <b>{selected.status}</b>
                </header>
                {selected.assignmentNote && (
                  <p className="doctor-assignment-note">
                    <b>Admin note:</b> {selected.assignmentNote}
                  </p>
                )}
                <form className="doctor-case-form" onSubmit={save}>
                  <div className="doctor-date-fields doctor-date-fields--single">
                    <label>
                      Appointment Date
                      <input
                        type="date"
                        value={form.appointmentDate}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            appointmentDate: event.target.value,
                          })
                        }
                        disabled={Boolean(selected.caseHistory)}
                        required
                      />
                    </label>
                  </div>
                  <div className="doctor-clinical-grid">
                    {fields.map(([name, label, placeholder]) => (
                      <label key={name}>
                        {label}
                        <textarea
                          value={form[name]}
                          onChange={(event) =>
                            setForm({ ...form, [name]: event.target.value })
                          }
                          placeholder={placeholder}
                        />
                      </label>
                    ))}
                  </div>
                  <label>
                    Complete Case History
                    <textarea
                      className="doctor-case-main"
                      value={form.caseHistory}
                      onChange={(event) =>
                        setForm({ ...form, caseHistory: event.target.value })
                      }
                      minLength={5}
                      placeholder="Record the child’s detailed clinical case history"
                      required
                    />
                  </label>
                  <label>
                    Additional Notes
                    <textarea
                      value={form.additionalNotes}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          additionalNotes: event.target.value,
                        })
                      }
                      placeholder="Any other notes for future visits"
                    />
                  </label>
                  {selected.caseHistory?.isLocked && (
                    <p className="doctor-locked">
                      🔒 This completed appointment is locked.
                    </p>
                  )}
                  <div className="doctor-case-actions">
                    {!selected.caseHistory?.isLocked && (
                      <button type="submit" disabled={busy}>
                        {busy
                          ? "Saving…"
                          : selected.caseHistory
                            ? "Update Case History"
                            : "Save Case History"}
                      </button>
                    )}
                    <button
                      className="is-next"
                      type="button"
                      disabled={busy || !selected.caseHistory}
                      onClick={() => void openNextAppointment()}
                    >
                      Next Appointment
                    </button>
                  </div>
                </form>
                {history && history.caseHistory.length > 0 && (
                  <details className="doctor-history">
                    <summary>
                      Previous visit history ({history.caseHistory.length})
                    </summary>
                    {history.caseHistory.map((visit) => (
                      <article key={visit.id}>
                        <b>
                          Visit #{visit.appointmentNumber} ·{" "}
                          {visit.appointmentDate}
                        </b>
                        <p>{visit.caseHistory}</p>
                        {visit.nextAppointmentDate && (
                          <small>
                            Next appointment: {visit.nextAppointmentDate}
                          </small>
                        )}
                      </article>
                    ))}
                  </details>
                )}
              </>
            )}
          </section>
        </div>
      </main>
      {slotDialog && (
        <div
          className="doctor-slot-dialog"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSlotDialog(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="doctor-slot-title"
          >
            <header>
              <div className="doctor-slot-dialog__heading">
                <span className="doctor-slot-dialog__icon" aria-hidden="true">
                  📅
                </span>
                <div>
                  <small>FOLLOW-UP SCHEDULING</small>
                  <h2 id="doctor-slot-title">Choose the Next Appointment</h2>
                  <p>
                    Scheduling for <strong>{selected?.childName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close appointment slots"
                onClick={() => setSlotDialog(false)}
              >
                ×
              </button>
            </header>
            <div className="doctor-slot-legend" aria-label="Slot colour guide">
              <span>
                <i className="is-available" /> Available
              </span>
              <span>
                <i className="is-booked" /> Booked
              </span>
              <span>
                <i className="is-selected" /> Selected
              </span>
              <p>Clinic hours: 10:00 AM to 7:00 PM · 30-minute slots</p>
            </div>
            {slotsLoading ? (
              <p className="doctor-slots-loading">Loading Doctor schedule…</p>
            ) : (
              <div className="doctor-slot-days">
                {slotDays.map((day) => (
                  <article key={day.date}>
                    <h3>
                      {day.label}
                      <small>{day.date}</small>
                    </h3>
                    {day.closed ? (
                      <p className="doctor-clinic-closed">Clinic Closed</p>
                    ) : (
                      <div className="doctor-slot-grid">
                        {day.slots.map((slot) => (
                          <button
                            className={`${slot.available ? "is-available" : "is-booked"}${chosenSlot?.date === day.date && chosenSlot.time === slot.time ? " is-selected" : ""}`}
                            type="button"
                            disabled={!slot.available}
                            onClick={() =>
                              setChosenSlot({ date: day.date, time: slot.time })
                            }
                            key={slot.time}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
            <footer>
              <span>
                {chosenSlot
                  ? `Selected: ${chosenSlot.date} at ${chosenSlot.time}`
                  : "Select an available time slot"}
              </span>
              <div>
                <button type="button" onClick={() => setSlotDialog(false)}>
                  Cancel
                </button>
                <button
                  className="is-confirm"
                  type="button"
                  disabled={!chosenSlot || busy}
                  onClick={() => void confirmNextAppointment()}
                >
                  {busy ? "Scheduling…" : "Confirm Appointment"}
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};
