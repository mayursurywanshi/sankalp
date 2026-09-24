import { FormEvent, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "../../../components/admin/AdminSidebar";
import { logoutAdmin } from "../admin-dashboard.service";
import {
  fetchSettings,
  saveContactLocation,
  saveFeedback,
  saveWorkingHours,
} from "./admin-settings.service";
import { ClinicSettings } from "./admin-settings.types";
import "./AdminSettings.css";

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const AdminSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fail = useCallback(
    (reason: unknown) => {
      if (reason instanceof Error && reason.message === "SESSION_INVALID")
        navigate("/login", { replace: true });
      else
        setNotice({
          type: "error",
          text:
            reason instanceof Error
              ? reason.message
              : "Unable to load settings.",
        });
    },
    [navigate],
  );

  useEffect(() => {
    fetchSettings()
      .then(setSettings)
      .catch(fail)
      .finally(() => setLoading(false));
  }, [fail]);

  const update = <K extends keyof ClinicSettings>(
    key: K,
    value: ClinicSettings[K],
  ) =>
    setSettings((current) =>
      current ? { ...current, [key]: value } : current,
    );
  const save = async (
    section: string,
    action: () => Promise<ClinicSettings>,
  ) => {
    setSaving(section);
    setNotice(null);
    try {
      setSettings(await action());
      setNotice({
        type: "success",
        text: `${section} settings saved successfully.`,
      });
    } catch (error) {
      fail(error);
    } finally {
      setSaving(null);
    }
  };
  const submitContact = (event: FormEvent) => {
    event.preventDefault();
    if (!settings) return;
    void save("Contact and location", () => saveContactLocation(settings));
  };
  const submitHours = (event: FormEvent) => {
    event.preventDefault();
    if (!settings) return;
    void save("Working hours", () => saveWorkingHours(settings));
  };
  const submitFeedback = (event: FormEvent) => {
    event.preventDefault();
    if (!settings) return;
    void save("Feedback", () => saveFeedback(settings));
  };
  const logout = async () => {
    setLoggingOut(true);
    await logoutAdmin();
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-settings-shell">
      <AdminSidebar onLogout={() => void logout()} loggingOut={loggingOut} />
      <main className="admin-settings-page">
        <header className="admin-settings-heading">
          <div>
            <small>CLINIC PREFERENCES</small>
            <h1>Settings</h1>
            <p>
              Manage clinic contact details, appointment availability and
              feedback links.
            </p>
          </div>
          <span aria-hidden="true">⚙️</span>
        </header>
        {notice && (
          <p
            className={`admin-settings-notice is-${notice.type}`}
            role={notice.type === "error" ? "alert" : "status"}
          >
            {notice.text}
          </p>
        )}
        {loading || !settings ? (
          <section className="admin-settings-loading">
            Loading clinic settings…
          </section>
        ) : (
          <div className="admin-settings-grid">
            <form
              className="admin-settings-card contact"
              onSubmit={submitContact}
            >
              <header>
                <span>📍</span>
                <div>
                  <h2>Contact &amp; Location</h2>
                  <p>These details update across the public website.</p>
                </div>
              </header>
              <div className="admin-settings-fields two">
                <label>
                  Phone Number
                  <input
                    required
                    value={settings.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </label>
                <label>
                  WhatsApp Number
                  <input
                    required
                    value={settings.whatsapp}
                    onChange={(e) => update("whatsapp", e.target.value)}
                  />
                </label>
                <label>
                  Email Address
                  <input
                    required
                    type="email"
                    value={settings.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </label>
                <label>
                  Instagram URL
                  <input
                    required
                    type="url"
                    value={settings.instagramUrl}
                    onChange={(e) => update("instagramUrl", e.target.value)}
                  />
                </label>
                <label className="wide">
                  Clinic Address
                  <textarea
                    required
                    rows={3}
                    value={settings.address}
                    onChange={(e) => update("address", e.target.value)}
                  />
                </label>
                <label className="wide">
                  Google Maps Embed URL
                  <input
                    required
                    type="url"
                    value={settings.mapEmbedUrl}
                    onChange={(e) => update("mapEmbedUrl", e.target.value)}
                  />
                </label>
                <label className="wide">
                  Directions URL
                  <input
                    required
                    type="url"
                    value={settings.directionsUrl}
                    onChange={(e) => update("directionsUrl", e.target.value)}
                  />
                </label>
              </div>
              <button disabled={saving !== null}>
                {saving === "Contact and location"
                  ? "Saving…"
                  : "Save Contact & Location"}
              </button>
            </form>
            <div className="admin-settings-side">
              <form className="admin-settings-card" onSubmit={submitHours}>
                <header>
                  <span>🕐</span>
                  <div>
                    <h2>Working Hours</h2>
                    <p>Controls appointment dates and available time slots.</p>
                  </div>
                </header>
                <div className="admin-settings-fields two">
                  <label>
                    Opening Time
                    <input
                      required
                      type="time"
                      value={settings.openingTime}
                      onChange={(e) => update("openingTime", e.target.value)}
                    />
                  </label>
                  <label>
                    Closing Time
                    <input
                      required
                      type="time"
                      value={settings.closingTime}
                      onChange={(e) => update("closingTime", e.target.value)}
                    />
                  </label>
                  <label>
                    Slot Duration
                    <select
                      value={settings.slotDurationMinutes}
                      onChange={(e) =>
                        update("slotDurationMinutes", Number(e.target.value))
                      }
                    >
                      {[15, 30, 45, 60].map((value) => (
                        <option value={value} key={value}>
                          {value} minutes
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Advance Booking Limit
                    <input
                      required
                      type="number"
                      min="1"
                      max="365"
                      value={settings.maximumAdvanceBookingDays}
                      onChange={(e) =>
                        update(
                          "maximumAdvanceBookingDays",
                          Number(e.target.value),
                        )
                      }
                    />
                  </label>
                </div>
                <fieldset>
                  <legend>Working Days</legend>
                  <div className="admin-working-days">
                    {days.map((day, index) => (
                      <label
                        className={
                          settings.workingDays.includes(index) ? "selected" : ""
                        }
                        key={day}
                      >
                        <input
                          type="checkbox"
                          checked={settings.workingDays.includes(index)}
                          onChange={() =>
                            update(
                              "workingDays",
                              settings.workingDays.includes(index)
                                ? settings.workingDays.filter(
                                    (value) => value !== index,
                                  )
                                : [...settings.workingDays, index].sort(),
                            )
                          }
                        />
                        {day.slice(0, 3)}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <button
                  disabled={
                    saving !== null || settings.workingDays.length === 0
                  }
                >
                  {saving === "Working hours"
                    ? "Saving…"
                    : "Save Working Hours"}
                </button>
              </form>
              <form className="admin-settings-card" onSubmit={submitFeedback}>
                <header>
                  <span>💬</span>
                  <div>
                    <h2>Feedback Links</h2>
                    <p>Choose how long a secure feedback link remains valid.</p>
                  </div>
                </header>
                <label>
                  Link Expiry (hours)
                  <input
                    required
                    type="number"
                    min="1"
                    max="168"
                    value={settings.feedbackExpiryHours}
                    onChange={(e) =>
                      update("feedbackExpiryHours", Number(e.target.value))
                    }
                  />
                  <small>Allowed range: 1 hour to 7 days (168 hours).</small>
                </label>
                <button disabled={saving !== null}>
                  {saving === "Feedback" ? "Saving…" : "Save Feedback Settings"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
