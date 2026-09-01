import { ChangeEvent, FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/sankalp-logo.png";
import background from "../../assets/login/login-background.png";
import { loginUser } from "./login.service";
import { LoginFormData, LoginResponse } from "./login.types";
import { storeAccessToken } from "./auth-storage";
import "./Login.css";

const initialForm: LoginFormData = { role: "", loginId: "", password: "", rememberMe: false };

export const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const updateField = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target;
    const name = target.name as keyof LoginFormData;
    const value = target instanceof HTMLInputElement && target.type === "checkbox" ? target.checked : target.value;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: [] }));
    setStatus(null);
  };

  const validate = () => {
    const errors: Record<string, string[]> = {};
    if (!form.role) errors.role = ["Select Admin or Doctor"];
    if (form.loginId.trim().length < 3) errors.loginId = ["Enter your Login ID"];
    if (form.password.length < 8) errors.password = ["Password must contain at least 8 characters"];
    return errors;
  };

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setStatus({ type: "error", message: "Please complete the highlighted fields." });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);
    try {
      const result: LoginResponse = await loginUser({ ...form, loginId: form.loginId.trim() });
      if (!result.success) {
        setFieldErrors(result.errors ?? {});
        setStatus({ type: "error", message: result.message });
        return;
      }
      if (!result.data?.accessToken) {
        setStatus({ type: "error", message: "The login response did not contain an access token." });
        return;
      }
      storeAccessToken(result.data.accessToken, form.rememberMe);
      setForm((current) => ({ ...current, password: "" }));
      setStatus({ type: "success", message: `${result.message} ${result.data.user.fullName}`.trim() });
      if (result.data.user.role === "ADMIN") navigate("/admin/dashboard", { replace: true });
    } catch {
      setStatus({
        type: "error",
        message: "Cannot reach the Sankalp server. Please confirm the backend is running and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page" style={{ backgroundImage: `url(${background})` }}>
      <Link className="login-page__home" to="/" aria-label="Return to Sankalp home">← Back to Home</Link>
      <section className="login-card" aria-labelledby="login-title">
        <img className="login-card__logo" src={logo} alt="Sankalp Child Development Center" />
        <header>
          <span>Secure account access</span>
          <h1 id="login-title">Welcome Back! <span aria-hidden="true">👋</span></h1>
          <p>Login to access your Sankalp account.</p>
        </header>

        <form onSubmit={submitLogin} noValidate>
          <label htmlFor="login-role">Select Role</label>
          <div className="login-field login-field--select">
            <span aria-hidden="true">🛡️</span>
            <select id="login-role" name="role" value={form.role} onChange={updateField} aria-invalid={Boolean(fieldErrors.role?.length)} required>
              <option value="" disabled>Select your role</option>
              <option value="ADMIN">Admin</option>
              <option value="DOCTOR">Doctor</option>
            </select>
          </div>
          {fieldErrors.role?.[0] && <small className="login-field-error">{fieldErrors.role[0]}</small>}

          <label htmlFor="login-id">Login ID</label>
          <div className="login-field">
            <span aria-hidden="true">👤</span>
            <input id="login-id" name="loginId" value={form.loginId} onChange={updateField} placeholder="Enter your Login ID" autoComplete="username" aria-invalid={Boolean(fieldErrors.loginId?.length)} required />
          </div>
          {fieldErrors.loginId?.[0] && <small className="login-field-error">{fieldErrors.loginId[0]}</small>}

          <label htmlFor="login-password">Password</label>
          <div className="login-field">
            <span aria-hidden="true">🔒</span>
            <input id="login-password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={updateField} placeholder="Enter your password" autoComplete="current-password" aria-invalid={Boolean(fieldErrors.password?.length)} required />
            <button className="login-password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "🙈" : "👁️"}</button>
          </div>
          {fieldErrors.password?.[0] && <small className="login-field-error">{fieldErrors.password[0]}</small>}

          <div className="login-options">
            <label className="login-remember"><input name="rememberMe" type="checkbox" checked={form.rememberMe} onChange={updateField} /><span>Remember me</span></label>
            <button type="button" disabled title="Password reset will be available soon">Forgot Password?</button>
          </div>

          {status && <p className={`login-status login-status--${status.type}`} role="status">{status.message}</p>}
          <button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Logging in..." : "Login"}</button>
        </form>
        <p className="login-card__security"><span aria-hidden="true">🛡️</span> Secure login protected by Sankalp</p>
      </section>
    </main>
  );
};
