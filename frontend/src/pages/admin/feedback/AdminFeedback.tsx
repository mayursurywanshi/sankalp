import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "../../../components/admin/AdminSidebar";
import { clearAccessToken } from "../../login/auth-storage";
import { logoutAdmin } from "../admin-dashboard.service";
import {
  createInvitation,
  fetchEligiblePatients,
  fetchFeedbackResponses,
  moderateFeedback,
} from "./admin-feedback.service";
import {
  EligiblePatient,
  FeedbackModerationStatus,
  FeedbackResponse,
  FeedbackShare,
} from "./admin-feedback.types";
import "./AdminFeedback.css";

export const AdminFeedback = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<EligiblePatient[]>([]);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [patientId, setPatientId] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [share, setShare] = useState<FeedbackShare | null>(null);
  const [activeTab, setActiveTab] = useState<"SEND" | "RESPONSES">("SEND");
  const [filter, setFilter] = useState<FeedbackModerationStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleError = useCallback(
    (reason: unknown) => {
      if (reason instanceof Error && reason.message === "SESSION_INVALID") {
        clearAccessToken();
        navigate("/login", { replace: true });
        return;
      }
      setNotice({
        type: "error",
        text:
          reason instanceof Error
            ? reason.message
            : "Unable to load feedback information.",
      });
    },
    [navigate],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [families, submitted] = await Promise.all([
        fetchEligiblePatients(),
        fetchFeedbackResponses(),
      ]);
      setPatients(families);
      setResponses(submitted);
    } catch (reason) {
      handleError(reason);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.patientId === patientId) ?? null,
    [patients, patientId],
  );
  const selectedAppointment =
    selectedPatient?.appointments.find(
      (appointment) => appointment.referenceId === appointmentId,
    ) ?? null;
  const alreadySubmitted = Boolean(
    selectedAppointment?.feedbackInvitations[0]?.response,
  );
  const submittedResponse =
    selectedAppointment?.feedbackInvitations[0]?.response;
  const submittedResponseDetails = responses.find(
    (item) => item.id === submittedResponse?.id,
  );
  const visibleResponses =
    filter === "ALL"
      ? responses
      : responses.filter((item) => item.moderationStatus === filter);

  const choosePatient = (value: string) => {
    const patient = patients.find((item) => item.patientId === value);
    setPatientId(value);
    setAppointmentId(patient?.appointments[0]?.referenceId ?? "");
    setShare(null);
    setNotice(null);
  };

  const generate = async (event: FormEvent) => {
    event.preventDefault();
    if (!patientId || !appointmentId) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await createInvitation(patientId, appointmentId);
      setShare(result.share);
      setNotice({ type: "success", text: result.message });
      await load();
    } catch (reason) {
      handleError(reason);
    } finally {
      setBusy(false);
    }
  };

  const moderate = async (
    item: FeedbackResponse,
    status: "APPROVED" | "REJECTED",
  ) => {
    setBusy(true);
    setNotice(null);
    try {
      const result = await moderateFeedback(item.id, status);
      setNotice({ type: "success", text: result.message });
      setResponses(await fetchFeedbackResponses());
    } catch (reason) {
      handleError(reason);
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!share) return;
    await navigator.clipboard.writeText(share.shortFeedbackLink);
    setNotice({ type: "success", text: "Feedback link copied." });
  };
  const logout = async () => {
    setLoggingOut(true);
    await logoutAdmin();
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-feedback-shell">
      <AdminSidebar onLogout={() => void logout()} loggingOut={loggingOut} />
      <main className="admin-feedback-page">
        <header className="admin-feedback-heading">
          <div>
            <small>FAMILY VOICES</small>
            <h1>Feedback</h1>
            <p>
              Invite families to share their experience and review responses
              before publication.
            </p>
          </div>
          <span aria-hidden="true">💌</span>
        </header>
        <nav className="admin-feedback-tabs" aria-label="Feedback sections">
          <button
            className={activeTab === "SEND" ? "is-active" : ""}
            onClick={() => setActiveTab("SEND")}
            type="button"
          >
            📨 Send Feedback Link
          </button>
          <button
            className={activeTab === "RESPONSES" ? "is-active" : ""}
            onClick={() => setActiveTab("RESPONSES")}
            type="button"
          >
            ⭐ Parent Responses{" "}
            <b>
              {
                responses.filter((item) => item.moderationStatus === "PENDING")
                  .length
              }
            </b>
          </button>
        </nav>
        {notice && (
          <p
            className={`admin-feedback-notice is-${notice.type}`}
            role={notice.type === "error" ? "alert" : "status"}
          >
            {notice.text}
          </p>
        )}
        {loading ? (
          <section
            className="admin-feedback-loading"
            aria-label="Loading feedback"
          >
            <span />
            <span />
          </section>
        ) : activeTab === "SEND" ? (
          <div className="admin-feedback-compose">
            <section className="admin-feedback-card admin-feedback-form-card">
              <header>
                <span>💬</span>
                <div>
                  <h2>Send Feedback Link</h2>
                  <p>Available after the Doctor saves the visit case history</p>
                </div>
              </header>
              <form onSubmit={generate}>
                <label>
                  Select Patient / Parent
                  <select
                    value={patientId}
                    onChange={(event) => choosePatient(event.target.value)}
                    required
                  >
                    <option value="">Choose a family</option>
                    {patients.map((patient) => (
                      <option value={patient.patientId} key={patient.patientId}>
                        {patient.parentName} ({patient.patientName})
                        {patient.isActive ? "" : " · Inactive"}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Completed Visit
                  <select
                    value={appointmentId}
                    onChange={(event) => {
                      setAppointmentId(event.target.value);
                      setShare(null);
                      setNotice(null);
                    }}
                    disabled={!selectedPatient}
                    required
                  >
                    <option value="">Choose appointment</option>
                    {selectedPatient?.appointments.map((appointment) => (
                      <option
                        value={appointment.referenceId}
                        key={appointment.referenceId}
                      >
                        {appointment.referenceId} ·{" "}
                        {appointment.scheduledDate
                          ? new Date(
                              appointment.scheduledDate,
                            ).toLocaleDateString("en-IN")
                          : "Completed"}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset>
                  <legend>Send Via</legend>
                  <label className="admin-feedback-channel">
                    <input type="radio" checked readOnly /> <span>◉</span>{" "}
                    WhatsApp
                  </label>
                </fieldset>
                <label>
                  WhatsApp Number
                  <input
                    value={selectedPatient?.primaryPhone ?? ""}
                    placeholder="Select a family first"
                    readOnly
                  />
                </label>
                {alreadySubmitted && (
                  <div className="admin-feedback-submitted">
                    <span>✓</span>
                    <div>
                      <strong>Feedback already submitted</strong>
                      <small>
                        Rating:{" "}
                        {
                          selectedAppointment?.feedbackInvitations[0]?.response
                            ?.rating
                        }
                        /5 ·{" "}
                        {
                          selectedAppointment?.feedbackInvitations[0]?.response
                            ?.moderationStatus
                        }
                      </small>
                    </div>
                  </div>
                )}
                <button
                  className="admin-feedback-generate"
                  type="submit"
                  disabled={
                    busy || !patientId || !appointmentId || alreadySubmitted
                  }
                >
                  {busy
                    ? "Generating…"
                    : alreadySubmitted
                      ? "Feedback Received"
                      : "Generate WhatsApp Link"}
                </button>
              </form>
            </section>
            <section
              className={`admin-feedback-card admin-feedback-preview${alreadySubmitted ? " is-summary" : ""}`}
            >
              {alreadySubmitted ? (
                <div className="admin-feedback-summary">
                  <div
                    className="admin-feedback-summary-art"
                    aria-hidden="true"
                  >
                    <span>🌈</span>
                    <b>💛</b>
                    <i>✨</i>
                  </div>
                  <span className="admin-feedback-summary-label">
                    Feedback received
                  </span>
                  <h2>Thank you for sharing!</h2>
                  <p>
                    {selectedPatient?.parentName} shared feedback for{" "}
                    <strong>{selectedPatient?.patientName}</strong>.
                  </p>
                  <div
                    className="admin-feedback-summary-stars"
                    aria-label={`${submittedResponse?.rating ?? 0} out of 5 stars`}
                  >
                    {"★".repeat(submittedResponse?.rating ?? 0)}
                    {"☆".repeat(5 - (submittedResponse?.rating ?? 0))}
                  </div>
                  <div className="admin-feedback-summary-grid">
                    <div>
                      <small>Appointment</small>
                      <strong>{selectedAppointment?.referenceId}</strong>
                    </div>
                    <div>
                      <small>Review status</small>
                      <strong
                        className={`is-${submittedResponse?.moderationStatus.toLowerCase()}`}
                      >
                        {submittedResponse?.moderationStatus}
                      </strong>
                    </div>
                    <div>
                      <small>Rating</small>
                      <strong>{submittedResponse?.rating}/5</strong>
                    </div>
                    <div>
                      <small>Submitted</small>
                      <strong>
                        {submittedResponse?.submittedAt
                          ? new Date(
                              submittedResponse.submittedAt,
                            ).toLocaleDateString("en-IN")
                          : "Received"}
                      </strong>
                    </div>
                  </div>
                  {submittedResponseDetails?.feedback && (
                    <blockquote>
                      “{submittedResponseDetails.feedback}”
                    </blockquote>
                  )}
                  <button
                    className="admin-feedback-view-response"
                    type="button"
                    onClick={() => {
                      setFilter("ALL");
                      setActiveTab("RESPONSES");
                    }}
                  >
                    View Parent Response
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className="admin-feedback-illustration"
                    aria-hidden="true"
                  >
                    <span>💛</span>
                    <b>✉️</b>
                    <i>⭐</i>
                  </div>
                  <h2>We value your feedback!</h2>
                  <p>Your feedback helps us serve every child better.</p>
                  <div className="admin-feedback-stars" aria-label="Five stars">
                    ★★★★★
                  </div>
                  {share ? (
                    <>
                      <div className="admin-feedback-link">
                        <span>{share.shortFeedbackLink}</span>
                        <button
                          type="button"
                          onClick={() => void copyLink()}
                          aria-label="Copy feedback link"
                        >
                          ▣
                        </button>
                      </div>
                      <a
                        className="admin-feedback-whatsapp"
                        href={share.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open WhatsApp &amp; Send
                      </a>
                    </>
                  ) : (
                    <div className="admin-feedback-link is-empty">
                      Secure short link will appear here
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        ) : (
          <section className="admin-feedback-responses">
            <header>
              <div>
                <h2>Parent Feedback Responses</h2>
                <p>Approve only responses with publication consent.</p>
              </div>
              <select
                aria-label="Filter feedback status"
                value={filter}
                onChange={(event) =>
                  setFilter(
                    event.target.value as FeedbackModerationStatus | "ALL",
                  )
                }
              >
                <option value="ALL">All responses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </header>
            {visibleResponses.length === 0 ? (
              <div className="admin-feedback-empty">
                <span>🧸</span>
                <h3>No responses found</h3>
                <p>Submitted parent feedback will appear here.</p>
              </div>
            ) : (
              <div className="admin-feedback-response-grid">
                {visibleResponses.map((item) => (
                  <article className="admin-feedback-response" key={item.id}>
                    <header>
                      <div>
                        <strong>{item.parentDisplayName}</strong>
                        <small>
                          Parent of {item.patient.patientName} ·{" "}
                          {item.patient.patientId}
                        </small>
                      </div>
                      <span
                        className={`is-${item.moderationStatus.toLowerCase()}`}
                      >
                        {item.moderationStatus}
                      </span>
                    </header>
                    <div
                      className="admin-feedback-stars"
                      aria-label={`${item.rating} out of 5 stars`}
                    >
                      {"★".repeat(item.rating)}
                      {"☆".repeat(5 - item.rating)}
                    </div>
                    <blockquote>{item.feedback}</blockquote>
                    <footer>
                      <small>
                        {new Date(item.submittedAt).toLocaleString("en-IN")} ·{" "}
                        {item.consentToPublish
                          ? "✓ Publication consent"
                          : "No publication consent"}
                      </small>
                      {item.moderationStatus === "PENDING" && (
                        <div>
                          <button
                            type="button"
                            onClick={() => void moderate(item, "REJECTED")}
                            disabled={busy}
                          >
                            Reject
                          </button>
                          <button
                            className="is-approve"
                            type="button"
                            onClick={() => void moderate(item, "APPROVED")}
                            disabled={busy || !item.consentToPublish}
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </footer>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
