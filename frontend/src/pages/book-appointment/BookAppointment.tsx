import { CSSProperties, ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { PageSkeleton } from "../../components/loading/PageSkeleton";
import appointmentHeroImage from "../../assets/book-appointment/appointment-booking-hero.png";
import { getAppointmentContent, requestAppointment } from "./book-appointment.service";
import { AppointmentContent, AppointmentFormData, AppointmentSubmitResponse } from "./book-appointment.types";
import "./BookAppointment.css";

const initialForm: AppointmentFormData = {
  parentName: "", childName: "", childAge: "", phone: "", email: "",
  preferredDate: "", preferredTime: "", consent: false,
};

const helpSymbols = ["✦", "◷", "✓"];
const clockHours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
type ClockMinute = 0 | 30;
type ClockPeriod = "AM" | "PM";

const periodForHour = (hour: number): ClockPeriod => hour === 10 || hour === 11 ? "AM" : "PM";
const formatClockTime = (hour: number, minute: ClockMinute) =>
  `${hour}:${minute.toString().padStart(2, "0")} ${periodForHour(hour)}`;

const parseClockTime = (value: string) => {
  const match = value.match(/^(\d{1,2}):(00|30) (AM|PM)$/);
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) as ClockMinute, period: match[3] as ClockPeriod };
};

export const BookAppointment = () => {
  const [content, setContent] = useState<AppointmentContent | null>(null);
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loadError, setLoadError] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [clockStep, setClockStep] = useState<"hour" | "minute">("hour");
  const [draftHour, setDraftHour] = useState(10);
  const [draftMinute, setDraftMinute] = useState<ClockMinute>(0);
  const timeTriggerRef = useRef<HTMLButtonElement>(null);
  const minimumDate = useMemo(() => new Date().toLocaleDateString("en-CA"), []);
  const availableTimes = useMemo(() => new Set(content?.timeSlots ?? []), [content]);

  useEffect(() => {
    let isMounted = true;
    getAppointmentContent()
      .then(({ data }) => { if (isMounted) setContent(data); })
      .catch(() => { if (isMounted) setLoadError("We could not load appointment details. Please try again."); });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!isTimePickerOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") cancelTimeSelection(); };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  });

  const updateField = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    const nextValue = type === "checkbox" ? (event.target as HTMLInputElement).checked : value;
    setForm((current) => ({ ...current, [name]: nextValue }));
    setFieldErrors((current) => ({ ...current, [name]: [] }));
  };

  const openTimePicker = () => {
    const selected = parseClockTime(form.preferredTime) ?? parseClockTime(content?.timeSlots[0] ?? "10:00 AM");
    if (selected) {
      setDraftHour(selected.hour);
      setDraftMinute(selected.minute);
    }
    setClockStep("hour");
    setIsTimePickerOpen(true);
  };

  const cancelTimeSelection = () => {
    setIsTimePickerOpen(false);
    window.setTimeout(() => timeTriggerRef.current?.focus(), 0);
  };

  const confirmTimeSelection = () => {
    const selectedTime = formatClockTime(draftHour, draftMinute);
    if (!availableTimes.has(selectedTime)) return;
    setForm((current) => ({ ...current, preferredTime: selectedTime }));
    setFieldErrors((current) => ({ ...current, preferredTime: [] }));
    setIsTimePickerOpen(false);
    window.setTimeout(() => timeTriggerRef.current?.focus(), 0);
  };

  const availableMinutes = (hour: number) =>
    ([0, 30] as ClockMinute[]).filter((minute) => availableTimes.has(formatClockTime(hour, minute)));

  const selectHour = (hour: number) => {
    const minutes = availableMinutes(hour);
    if (!minutes.length) return;
    setDraftHour(hour);
    setDraftMinute(minutes.includes(draftMinute) ? draftMinute : minutes[0]);
    setClockStep("minute");
  };

  const selectMinute = (minute: ClockMinute) => {
    if (!availableTimes.has(formatClockTime(draftHour, minute))) return;
    setDraftMinute(minute);
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      setStatus({ type: "error", message: result.message ?? "We could not request your appointment. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadError) return <main className="appointment-status" role="alert"><h1>Unable to load Book Appointment</h1><p>{loadError}</p></main>;
  if (!content) return <PageSkeleton cards={3} />;

  return (
    <main className="appointment-page">
      <section className="appointment-hero" aria-labelledby="appointment-title">
        <div className="appointment-hero__copy"><span>Support starts here</span><h1 id="appointment-title">{content.hero.title}</h1><p>{content.hero.tagline}</p></div>
        <div className="appointment-hero__image"><img src={appointmentHeroImage} alt="Parent booking an appointment while a child plays in a pediatric therapy clinic" /></div>
      </section>

      <section className="appointment-layout">
        <aside className="appointment-help interactive-card" aria-labelledby="appointment-help-title">
          <header><span className="appointment-help__mark">♡</span><h2 id="appointment-help-title">{content.help.title}</h2></header>
          <div className="appointment-help__steps">
            {content.help.steps.map((step, index) => <div className="appointment-help__step" key={step.title}><span>{helpSymbols[index]}</span><div><strong>{step.title}</strong><p>{step.description}</p></div></div>)}
          </div>
          <div className="appointment-help__contact">
            <strong>Clinic Hours</strong><p>{content.clinicHours.weekdays}<br />{content.clinicHours.sunday}</p>
            <a href={`tel:${content.phone.replace(/\s/g, "")}`}>{content.phone}</a>
            <a href={`mailto:${content.email}`}>{content.email}</a>
          </div>
          <div className="appointment-help__privacy"><strong>Your information is safe with us.</strong><p>We respect your privacy and never share your details.</p></div>
        </aside>

        <div className="appointment-form-card interactive-card">
          <header><span>Schedule a visit</span><h2>Request an Appointment</h2><p>Share your details and choose a convenient time. Our team will call to confirm.</p></header>
          <form onSubmit={submitForm} noValidate>
            <div className="appointment-form__grid">
              <label>Parent Name<input name="parentName" value={form.parentName} onChange={updateField} placeholder="Enter parent name" autoComplete="name" aria-invalid={Boolean(fieldErrors.parentName?.length)} required />{fieldErrors.parentName?.[0] && <small>{fieldErrors.parentName[0]}</small>}</label>
              <label>Child’s Name<input name="childName" value={form.childName} onChange={updateField} placeholder="Enter child’s name" aria-invalid={Boolean(fieldErrors.childName?.length)} required />{fieldErrors.childName?.[0] && <small>{fieldErrors.childName[0]}</small>}</label>
              <label>Child’s Age<input name="childAge" value={form.childAge} onChange={updateField} placeholder="Example: 4 years" aria-invalid={Boolean(fieldErrors.childAge?.length)} required />{fieldErrors.childAge?.[0] && <small>{fieldErrors.childAge[0]}</small>}</label>
              <label>Phone Number<input name="phone" type="tel" value={form.phone} onChange={updateField} placeholder="Enter 10-digit mobile number" autoComplete="tel" aria-invalid={Boolean(fieldErrors.phone?.length)} required />{fieldErrors.phone?.[0] && <small>{fieldErrors.phone[0]}</small>}</label>
              <label className="appointment-form__email">Email Address<input name="email" type="email" value={form.email} onChange={updateField} placeholder="Enter your email address" autoComplete="email" aria-invalid={Boolean(fieldErrors.email?.length)} required />{fieldErrors.email?.[0] && <small>{fieldErrors.email[0]}</small>}</label>
              <label>Preferred Date<input name="preferredDate" type="date" min={minimumDate} value={form.preferredDate} onChange={updateField} aria-invalid={Boolean(fieldErrors.preferredDate?.length)} required />{fieldErrors.preferredDate?.[0] && <small>{fieldErrors.preferredDate[0]}</small>}</label>
              <div className="appointment-form__time">
                <span id="appointment-time-label">Preferred Time</span>
                <button ref={timeTriggerRef} className={`appointment-time-trigger${fieldErrors.preferredTime?.length ? " is-invalid" : ""}`} type="button" aria-haspopup="dialog" aria-expanded={isTimePickerOpen} aria-labelledby="appointment-time-label appointment-time-value" onClick={openTimePicker}><strong id="appointment-time-value">{form.preferredTime || "Select time slot"}</strong><span aria-hidden="true">◷</span></button>
                {fieldErrors.preferredTime?.[0] && <small>{fieldErrors.preferredTime[0]}</small>}
              </div>
            </div>
            <label className="appointment-consent"><input name="consent" type="checkbox" checked={form.consent} onChange={updateField} /><span>{content.consentLabel}</span></label>
            {fieldErrors.consent?.[0] && <small className="appointment-consent-error">{fieldErrors.consent[0]}</small>}
            {status && <p className={`appointment-form-status appointment-form-status--${status.type}`} role="status">{status.message}</p>}
            <button className="appointment-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Requesting..." : "Book Appointment"}</button>
          </form>
        </div>
      </section>

      <section className="appointment-trust" aria-label="Our appointment commitments">
        <article className="interactive-card"><span>♡</span><div><strong>Compassionate Care</strong><p>Every child is treated with kindness and respect.</p></div></article>
        <article className="interactive-card"><span>◎</span><div><strong>Experienced Specialists</strong><p>Expertise and dedication in every session.</p></div></article>
        <article className="interactive-card"><span>▣</span><div><strong>Confidential &amp; Secure</strong><p>Your information is protected with care.</p></div></article>
      </section>

      {isTimePickerOpen && <div className="appointment-time-dialog" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) cancelTimeSelection(); }}>
        <section className="appointment-time-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="time-picker-title">
          <header><span className="appointment-time-dialog__clock" aria-hidden="true">◷</span><div><span>Preferred appointment time</span><h2 id="time-picker-title">{formatClockTime(draftHour, draftMinute)}</h2></div></header>
          <div className="appointment-time-dialog__controls">
            <div className="appointment-time-dialog__steps" aria-label="Choose hour or minute">
              <button className={clockStep === "hour" ? "is-active" : ""} type="button" onClick={() => setClockStep("hour")}>{draftHour}</button>
              <span>:</span>
              <button className={clockStep === "minute" ? "is-active" : ""} type="button" onClick={() => setClockStep("minute")}>{draftMinute.toString().padStart(2, "0")}</button>
            </div>
          </div>
          <div className="appointment-clock" aria-label={clockStep === "hour" ? "Select an hour" : "Select minutes"}>
            {clockStep === "hour" ? <>
              <span className="appointment-clock__hand" style={{ "--hand-angle": `${clockHours.findIndex((hour) => hour === draftHour) * 30}deg` } as CSSProperties} />
              {clockHours.map((hour, index) => <button className={`appointment-clock__number${draftHour === hour ? " is-selected" : ""}`} style={{ "--clock-angle": `${index * 30}deg` } as CSSProperties} type="button" aria-label={`${hour} o'clock`} disabled={!availableMinutes(hour).length} onClick={() => selectHour(hour)} key={hour}>{hour}</button>)}
            </> : <>
              <span className="appointment-clock__hand" style={{ "--hand-angle": `${draftMinute * 6}deg` } as CSSProperties} />
              {([0, 30] as ClockMinute[]).map((minute) => <button className={`appointment-clock__minute appointment-clock__minute--${minute}${draftMinute === minute ? " is-selected" : ""}`} type="button" aria-label={`${minute.toString().padStart(2, "0")} minutes`} disabled={!availableTimes.has(formatClockTime(draftHour, minute))} onClick={() => selectMinute(minute)} key={minute}>{minute.toString().padStart(2, "0")}</button>)}
            </>}
            <span className="appointment-clock__center" />
          </div>
          <p className="appointment-time-dialog__hint">Clinic appointments are available from 10:00 AM to 7:00 PM.</p>
          <footer><button className="appointment-time-dialog__cancel" type="button" onClick={cancelTimeSelection}>Cancel</button><button className="appointment-time-dialog__select" type="button" onClick={confirmTimeSelection}>Select</button></footer>
        </section>
      </div>}
    </main>
  );
};
