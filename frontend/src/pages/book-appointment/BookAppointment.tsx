import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { PageSkeleton } from "../../components/loading/PageSkeleton";
import appointmentHeroImage from "../../assets/book-appointment/appointment-booking-hero.webp";
import {
  getAppointmentContent,
  requestAppointment,
} from "./book-appointment.service";
import {
  AppointmentContent,
  AppointmentFormData,
  AppointmentSubmitResponse,
} from "./book-appointment.types";
import "./BookAppointment.css";

const initialForm: AppointmentFormData = {
  parentName: "",
  childName: "",
  childAge: "",
  childDateOfBirth: "",
  phone: "",
  email: "",
  preferredDate: "",
  consent: false,
};

const helpSymbols = ["📝", "🕐", "💌"];
export const BookAppointment = () => {
  const [content, setContent] = useState<AppointmentContent | null>(null);
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loadError, setLoadError] = useState("");
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const minimumDate = useMemo(() => new Date().toLocaleDateString("en-CA"), []);
  const maximumBirthDate = minimumDate;

  useEffect(() => {
    let isMounted = true;
    getAppointmentContent()
      .then(({ data }) => {
        if (isMounted) setContent(data);
      })
      .catch(() => {
        if (isMounted)
          setLoadError(
            "We could not load appointment details. Please try again.",
          );
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const updateField = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target;
    const nextValue =
      type === "checkbox" ? (event.target as HTMLInputElement).checked : value;
    setForm((current) => ({ ...current, [name]: nextValue }));
    setFieldErrors((current) => ({ ...current, [name]: [] }));
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.childDateOfBirth) {
      setFieldErrors((current) => ({
        ...current,
        childDateOfBirth: ["Select the child’s date of birth"],
      }));
      setStatus({
        type: "error",
        message: "Please select the child’s date of birth.",
      });
      return;
    }
    setIsSubmitting(true);
    setFieldErrors({});
    setStatus(null);
    try {
      const result = await requestAppointment(form);
      setStatus({ type: "success", message: result.message });
      setForm(initialForm);
    } catch (error) {
      const result = error as AppointmentSubmitResponse;
      setFieldErrors(result.errors ?? {});
      setStatus({
        type: "error",
        message:
          result.message ??
          "We could not request your appointment. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadError)
    return (
      <main className="appointment-status" role="alert">
        <h1>Unable to load Book Appointment</h1>
        <p>{loadError}</p>
      </main>
    );
  if (!content) return <PageSkeleton cards={3} />;

  return (
    <main className="appointment-page">
      <section className="appointment-hero" aria-labelledby="appointment-title">
        <div className="appointment-hero__copy">
          <span>Support starts here</span>
          <h1 id="appointment-title">{content.hero.title}</h1>
          <p>{content.hero.tagline}</p>
        </div>
        <div className="appointment-hero__image">
          <img
            src={appointmentHeroImage}
            alt="Parent booking an appointment while a child plays in a pediatric therapy clinic"
          />
        </div>
      </section>

      <section className="appointment-layout">
        <aside
          className="appointment-help interactive-card"
          aria-labelledby="appointment-help-title"
        >
          <header>
            <span className="appointment-help__mark" aria-hidden="true">
              🫶
            </span>
            <h2 id="appointment-help-title">{content.help.title}</h2>
          </header>
          <div className="appointment-help__steps">
            {content.help.steps.map((step, index) => (
              <div className="appointment-help__step" key={step.title}>
                <span>{helpSymbols[index]}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="appointment-help__contact">
            <span aria-hidden="true">🕒</span>
            <div>
              <strong>Clinic Hours</strong>
              <p>
                {content.clinicHours.weekdays}
                <br />
                {content.clinicHours.sunday}
              </p>
              <a href={`tel:${content.phone.replace(/\s/g, "")}`}>
                {content.phone}
              </a>
              <a href={`mailto:${content.email}`}>{content.email}</a>
            </div>
          </div>
          <div className="appointment-help__privacy">
            <span aria-hidden="true">🔒</span>
            <div>
              <strong>Your information is safe with us.</strong>
              <p>We respect your privacy and never share your details.</p>
            </div>
          </div>
        </aside>

        <div className="appointment-form-card interactive-card">
          <header>
            <span>Schedule a visit</span>
            <h2>Request an Appointment</h2>
            <p>
              Share your details and preferred date. Our team will assign an
              available time and call to confirm.
            </p>
          </header>
          <form onSubmit={submitForm} noValidate>
            <div className="appointment-form__grid">
              <label>
                Parent Name
                <input
                  name="parentName"
                  value={form.parentName}
                  onChange={updateField}
                  placeholder="Enter parent name"
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.parentName?.length)}
                  required
                />
                {fieldErrors.parentName?.[0] && (
                  <small>{fieldErrors.parentName[0]}</small>
                )}
              </label>
              <label>
                Child’s Name
                <input
                  name="childName"
                  value={form.childName}
                  onChange={updateField}
                  placeholder="Enter child’s name"
                  aria-invalid={Boolean(fieldErrors.childName?.length)}
                  required
                />
                {fieldErrors.childName?.[0] && (
                  <small>{fieldErrors.childName[0]}</small>
                )}
              </label>
              <label>
                Child’s Age
                <input
                  name="childAge"
                  value={form.childAge}
                  onChange={updateField}
                  placeholder="Example: 4 years"
                  aria-invalid={Boolean(fieldErrors.childAge?.length)}
                  required
                />
                {fieldErrors.childAge?.[0] && (
                  <small>{fieldErrors.childAge[0]}</small>
                )}
              </label>
              <label>
                Child’s Date of Birth
                <input
                  name="childDateOfBirth"
                  type="date"
                  max={maximumBirthDate}
                  value={form.childDateOfBirth}
                  onChange={updateField}
                  aria-invalid={Boolean(fieldErrors.childDateOfBirth?.length)}
                  required
                />
                {fieldErrors.childDateOfBirth?.[0] && (
                  <small>{fieldErrors.childDateOfBirth[0]}</small>
                )}
              </label>
              <label>
                Phone Number
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={updateField}
                  placeholder="Enter 10-digit mobile number"
                  autoComplete="tel"
                  aria-invalid={Boolean(fieldErrors.phone?.length)}
                  required
                />
                {fieldErrors.phone?.[0] && (
                  <small>{fieldErrors.phone[0]}</small>
                )}
              </label>
              <label className="appointment-form__email">
                Email Address
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email?.length)}
                  required
                />
                {fieldErrors.email?.[0] && (
                  <small>{fieldErrors.email[0]}</small>
                )}
              </label>
              <label className="appointment-form__date">
                Preferred Date
                <input
                  name="preferredDate"
                  type="date"
                  min={minimumDate}
                  value={form.preferredDate}
                  onChange={updateField}
                  aria-invalid={Boolean(fieldErrors.preferredDate?.length)}
                  required
                />
                {fieldErrors.preferredDate?.[0] && (
                  <small>{fieldErrors.preferredDate[0]}</small>
                )}
              </label>
            </div>
            <p className="appointment-form__date-note">
              <span aria-hidden="true">📅</span>
              Choose a convenient date. Our team will confirm the available time
              with you by phone.
            </p>
            <label className="appointment-consent">
              <input
                name="consent"
                type="checkbox"
                checked={form.consent}
                onChange={updateField}
              />
              <span>{content.consentLabel}</span>
            </label>
            {fieldErrors.consent?.[0] && (
              <small className="appointment-consent-error">
                {fieldErrors.consent[0]}
              </small>
            )}
            {status && (
              <p
                className={`appointment-form-status appointment-form-status--${status.type}`}
                role="status"
              >
                {status.message}
              </p>
            )}
            <button
              className="appointment-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Requesting..." : "Book Appointment"}
            </button>
          </form>
        </div>
      </section>

      <section
        className="appointment-trust"
        aria-label="Our appointment commitments"
      >
        <article className="appointment-trust__card appointment-trust__card--care">
          <span aria-hidden="true">💗</span>
          <div>
            <strong>Compassionate Care</strong>
            <p>Every child is treated with kindness and respect.</p>
          </div>
        </article>
        <article className="appointment-trust__card appointment-trust__card--specialists">
          <span aria-hidden="true">🧑‍⚕️</span>
          <div>
            <strong>Experienced Specialists</strong>
            <p>Expertise and dedication in every session.</p>
          </div>
        </article>
        <article className="appointment-trust__card appointment-trust__card--secure">
          <span aria-hidden="true">🔒</span>
          <div>
            <strong>Confidential &amp; Secure</strong>
            <p>Your information is protected with care.</p>
          </div>
        </article>
      </section>
    </main>
  );
};
