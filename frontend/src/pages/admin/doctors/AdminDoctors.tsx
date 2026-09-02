import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "../../../components/admin/AdminSidebar";
import { clearAccessToken } from "../../login/auth-storage";
import { logoutAdmin } from "../admin-dashboard.service";
import { confirmDoctorCredentials, createDoctor, deleteDoctor, fetchDoctors } from "./admin-doctors.service";
import { Doctor, DoctorForm } from "./admin-doctors.types";
import "./AdminDoctors.css";

const emptyForm: DoctorForm = { firstName: "", lastName: "", phone: "", email: "", designation: "", joiningDate: "", dateOfBirth: "", password: "" };

export const AdminDoctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState<DoctorForm>(emptyForm);
  const [mode, setMode] = useState<"list" | "form" | "review" | "credentials">("list");
  const [pendingDoctor, setPendingDoctor] = useState<Doctor | null>(null);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [showDoctorPassword, setShowDoctorPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleApiError = useCallback((error: unknown, fallback: string) => {
    if (error instanceof Error && error.message === "SESSION_INVALID") { clearAccessToken(); navigate("/login", { replace: true }); return; }
    const details = (error as Error & { details?: { errors?: Record<string, string[]>; message?: string } })?.details;
    setErrors(details?.errors ?? {});
    setMessage({ type: "error", text: details?.message ?? (error instanceof Error && error.message !== "REQUEST_FAILED" ? error.message : fallback) });
  }, [navigate]);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    try { setDoctors(await fetchDoctors()); }
    catch (error) { handleApiError(error, "Unable to load Doctor details."); }
    finally { setLoading(false); }
  }, [handleApiError]);

  useEffect(() => { void loadDoctors(); }, [loadDoctors]);

  const updateField = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: [] }));
    setMessage(null);
  };

  const submitDetails = async (event: FormEvent) => {
    event.preventDefault(); setSubmitting(true); setMessage(null); setErrors({});
    try {
      const response = await createDoctor(form);
      if (!response.data) throw new Error("Doctor details were not returned by the server.");
      setPendingDoctor(response.data); setMode("review"); setMessage({ type: "success", text: response.message });
    } catch (error) { handleApiError(error, "Unable to save Doctor details."); }
    finally { setSubmitting(false); }
  };

  const confirmCredentials = async () => {
    if (!pendingDoctor) return;
    setSubmitting(true); setMessage(null);
    try {
      const response = await confirmDoctorCredentials(pendingDoctor.doctorId, form.password);
      if (!response.data) throw new Error("Created Doctor credentials were not returned.");
      setPendingDoctor(response.data); setMode("credentials"); setMessage({ type: "success", text: response.message });
    } catch (error) { handleApiError(error, "Unable to create Doctor credentials."); }
    finally { setSubmitting(false); }
  };

  const handleLogout = async () => { setLoggingOut(true); await logoutAdmin(); navigate("/login", { replace: true }); };
  const showForm = () => { setShowDoctorPassword(false); setForm(emptyForm); setPendingDoctor(null); setErrors({}); setMessage(null); setMode("form"); };
  const finishCredentialDisplay = async () => { setShowDoctorPassword(false); setForm(emptyForm); setPendingDoctor(null); setMode("list"); setMessage({ type: "success", text: "Doctor account is ready to use." }); await loadDoctors(); };
  const copyCredentials = async () => {
    if (!pendingDoctor) return;
    await navigator.clipboard.writeText(`Login ID: ${pendingDoctor.loginId}\nTemporary Password: ${form.password}`);
    setMessage({ type: "success", text: "Credentials copied. Please share them securely." });
  };
  const confirmDelete = async () => {
    if (!doctorToDelete) return;
    setSubmitting(true);
    try {
      const response = await deleteDoctor(doctorToDelete.doctorId);
      setDoctors((current) => current.filter((doctor) => doctor.doctorId !== doctorToDelete.doctorId));
      setDoctorToDelete(null); setMessage({ type: "success", text: response.message });
    } catch (error) { setDoctorToDelete(null); handleApiError(error, "Unable to delete Doctor."); }
    finally { setSubmitting(false); }
  };

  return <div className="admin-dashboard-shell">
    <AdminSidebar onLogout={handleLogout} loggingOut={loggingOut} />
    <main className="admin-doctors-page">
      <header className="doctor-page-header"><div><small>TEAM MANAGEMENT</small><h1>Doctors</h1><p>Create secure Doctor accounts and manage your clinical team.</p></div>{mode === "list" && <button type="button" onClick={showForm}><span>＋</span>Add Doctor</button>}</header>
      {message && <p className={`doctor-alert doctor-alert--${message.type}`} role="status">{message.text}</p>}

      {mode === "list" && <section className="doctor-list-card">
        <header><div><h2>Doctor Directory</h2><span>{doctors.length} {doctors.length === 1 ? "Doctor" : "Doctors"}</span></div><label><span>⌕</span><input type="search" placeholder="Search will be available soon" disabled /></label></header>
        {loading ? <div className="doctor-loading">{Array.from({ length: 3 }).map((_, index) => <span key={index} />)}</div> : doctors.length === 0 ? <div className="doctor-empty"><span>🩺</span><h2>No Doctors added yet</h2><p>Create the first Doctor profile and secure Login ID.</p><button type="button" onClick={showForm}>Add First Doctor</button></div> : <div className="doctor-table-wrap"><table><thead><tr><th>Doctor</th><th>Doctor ID</th><th>Login ID</th><th>Password</th><th>Contact</th><th>Joining Date</th><th>Credentials</th><th>Action</th></tr></thead><tbody>{doctors.map((doctor) => <tr key={doctor.doctorId}><td><div className="doctor-person"><span>{doctor.firstName[0]}{doctor.lastName[0]}</span><p><strong>Dr. {doctor.firstName} {doctor.lastName}</strong><small>{doctor.designation}</small></p></div></td><td><b>{doctor.doctorId}</b></td><td><code>{doctor.loginId}</code></td><td><span className="doctor-masked-password">••••••••</span></td><td><p className="doctor-contact">{doctor.phone}<small>{doctor.email}</small></p></td><td>{doctor.joiningDate}</td><td><i className={`doctor-status doctor-status--${doctor.credentialStatus.toLowerCase()}`}>{doctor.credentialStatus}</i></td><td><button className="doctor-delete-button" type="button" onClick={() => setDoctorToDelete(doctor)}>Delete</button></td></tr>)}</tbody></table></div>}
      </section>}

      {mode === "form" && <section className="doctor-form-card"><header><button type="button" onClick={() => setMode("list")}>← Back</button><div><span>👩‍⚕️</span><h2>Add a New Doctor</h2><p>Enter the Doctor’s personal and professional details.</p></div></header><form onSubmit={submitDetails} noValidate>
        <div className="doctor-form-grid">
          <label>First Name<input name="firstName" value={form.firstName} onChange={updateField} placeholder="Enter first name" required />{errors.firstName?.[0] && <small>{errors.firstName[0]}</small>}</label>
          <label>Last Name<input name="lastName" value={form.lastName} onChange={updateField} placeholder="Enter last name" required />{errors.lastName?.[0] && <small>{errors.lastName[0]}</small>}</label>
          <label>Phone Number<input name="phone" value={form.phone} onChange={updateField} placeholder="10-digit mobile number" inputMode="numeric" maxLength={10} required />{errors.phone?.[0] && <small>{errors.phone[0]}</small>}</label>
          <label>Email Address<input name="email" type="email" value={form.email} onChange={updateField} placeholder="doctor@example.com" required />{errors.email?.[0] && <small>{errors.email[0]}</small>}</label>
          <label className="doctor-field-wide">Designation<select name="designation" value={form.designation} onChange={updateField} required><option value="" disabled>Select designation</option><option>Pediatric Physiotherapist</option><option>Occupational Therapist</option><option>Speech Therapist</option><option>Behavioral Therapist</option><option>Developmental Pediatrician</option><option>Clinical Psychologist</option></select>{errors.designation?.[0] && <small>{errors.designation[0]}</small>}</label>
          <label>Joining Date<input name="joiningDate" type="date" value={form.joiningDate} onChange={updateField} required />{errors.joiningDate?.[0] && <small>{errors.joiningDate[0]}</small>}</label>
          <label>Date of Birth<input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateField} max={new Date().toISOString().slice(0, 10)} required />{errors.dateOfBirth?.[0] && <small>{errors.dateOfBirth[0]}</small>}</label>
          <label className="doctor-field-wide">Temporary Password<span className="doctor-password-input"><input name="password" type={showDoctorPassword ? "text" : "password"} value={form.password} onChange={updateField} placeholder="Minimum 8 characters" autoComplete="new-password" minLength={8} maxLength={72} required /><button type="button" aria-label={showDoctorPassword ? "Hide Doctor password" : "Show Doctor password"} aria-pressed={showDoctorPassword} onClick={() => setShowDoctorPassword((visible) => !visible)}>{showDoctorPassword ? "🙈" : "👁️"}</button></span>{errors.password?.[0] && <small>{errors.password[0]}</small>}<em>Include uppercase, lowercase, number, and special character. It will only be sent after confirmation.</em></label>
        </div><footer><button type="button" onClick={() => setMode("list")}>Cancel</button><button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Create Doctor Details"}</button></footer>
      </form></section>}

      {mode === "review" && pendingDoctor && <section className="doctor-review-card"><header><span>✓</span><div><small>FINAL CONFIRMATION</small><h2>Review Doctor Details</h2><p>Confirm these details before creating the permanent Login ID and password.</p></div></header><div className="doctor-generated-ids"><div><small>Doctor ID</small><strong>{pendingDoctor.doctorId}</strong><span>Permanent and non-editable</span></div><div><small>Generated Login ID</small><strong>{pendingDoctor.loginId}</strong><span>Permanent and unique</span></div></div><dl><div><dt>Doctor Name</dt><dd>Dr. {pendingDoctor.firstName} {pendingDoctor.lastName}</dd></div><div><dt>Designation</dt><dd>{pendingDoctor.designation}</dd></div><div><dt>Phone Number</dt><dd>{pendingDoctor.phone}</dd></div><div><dt>Email Address</dt><dd>{pendingDoctor.email}</dd></div><div><dt>Joining Date</dt><dd>{pendingDoctor.joiningDate}</dd></div><div><dt>Date of Birth</dt><dd>{pendingDoctor.dateOfBirth}</dd></div><div><dt>Password</dt><dd className="doctor-password-review"><span>{showDoctorPassword ? form.password : "•".repeat(Math.min(form.password.length, 12))}</span><button type="button" aria-label={showDoctorPassword ? "Hide confirmation password" : "Show confirmation password"} aria-pressed={showDoctorPassword} onClick={() => setShowDoctorPassword((visible) => !visible)}>{showDoctorPassword ? "🙈" : "👁️"}</button></dd></div><div><dt>Credential Status</dt><dd><i className="doctor-status doctor-status--pending">PENDING</i></dd></div></dl><aside><span>🔐</span><p><strong>Secure credential creation</strong>The password will be hashed before it is stored and cannot be viewed afterward.</p></aside><footer><button type="button" onClick={() => { setShowDoctorPassword(false); setForm(emptyForm); setPendingDoctor(null); setMode("list"); void loadDoctors(); }}>Create Login Later</button><button type="button" onClick={() => void confirmCredentials()} disabled={submitting}>{submitting ? "Creating Secure Login…" : "Confirm & Create Login"}</button></footer></section>}

      {mode === "credentials" && pendingDoctor && <section className="doctor-credentials-card"><div className="doctor-credentials-card__icon">🔐</div><small>ACCOUNT CREATED</small><h2>Doctor Login is Ready</h2><p>Copy these credentials now. The temporary password cannot be viewed again after leaving this screen.</p><div><label>Doctor ID<strong>{pendingDoctor.doctorId}</strong></label><label>Login ID<strong>{pendingDoctor.loginId}</strong></label><label>Temporary Password<span className="doctor-password-result"><strong>{showDoctorPassword ? form.password : "•".repeat(Math.min(form.password.length, 12))}</strong><button type="button" aria-label={showDoctorPassword ? "Hide created password" : "Show created password"} aria-pressed={showDoctorPassword} onClick={() => setShowDoctorPassword((visible) => !visible)}>{showDoctorPassword ? "🙈" : "👁️"}</button></span></label><label>Status<i className="doctor-status doctor-status--active">ACTIVE</i></label></div><footer><button type="button" onClick={() => void copyCredentials()}>Copy Credentials</button><button type="button" onClick={() => void finishCredentialDisplay()}>Done</button></footer></section>}

      {doctorToDelete && <div className="doctor-modal-backdrop" role="presentation"><section className="doctor-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-doctor-title"><span>⚠️</span><h2 id="delete-doctor-title">Delete Dr. {doctorToDelete.firstName} {doctorToDelete.lastName}?</h2><p>Doctor ID: <strong>{doctorToDelete.doctorId}</strong></p><aside>This permanently deletes the Doctor profile and login credentials. This action cannot be undone.</aside><footer><button type="button" onClick={() => setDoctorToDelete(null)} disabled={submitting}>Cancel</button><button type="button" onClick={() => void confirmDelete()} disabled={submitting}>{submitting ? "Deleting…" : "Delete Doctor"}</button></footer></section></div>}
    </main>
  </div>;
};
