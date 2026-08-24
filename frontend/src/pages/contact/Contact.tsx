import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { PageSkeleton } from "../../components/loading/PageSkeleton";
import { getContactContent, sendContactMessage } from "./contact.service";
import { ContactContent, ContactFormData, ContactMessageResponse } from "./contact.types";
import "./Contact.css";

const initialForm: ContactFormData = { name: "", phone: "", email: "", message: "" };
const detailIcons: Record<string, string> = { phone: "☎", whatsapp: "W", email: "@", address: "●", timings: "◷" };

export const Contact = () => {
  const [content, setContent] = useState<ContactContent | null>(null);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getContactContent()
      .then(({ data }) => { if (isMounted) setContent(data); })
      .catch(() => { if (isMounted) setLoadError("We could not load the contact page. Please try again."); });
    return () => { isMounted = false; };
  }, []);

  const updateField = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: [] }));
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setStatus(null);
    try {
      const result = await sendContactMessage(form);
      setStatus({ type: "success", message: result.message });
      setForm(initialForm);
    } catch (error) {
      const result = error as ContactMessageResponse;
      setFieldErrors(result.errors ?? {});
      setStatus({ type: "error", message: result.message ?? "We could not send your message. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadError) return <main className="contact-status" role="alert"><h1>Unable to load Contact Us</h1><p>{loadError}</p></main>;
  if (!content) return <PageSkeleton cards={3} />;

  return (
    <main className="contact-page">
      <section className="contact-hero" aria-labelledby="contact-title">
        <span>Care begins with a conversation</span>
        <h1 id="contact-title">{content.hero.title}</h1>
        <p>{content.hero.description} Reach out and our team will guide you toward the right support for your child.</p>
      </section>

      <section className="contact-layout" aria-label="Contact Sankalp">
        <article className="contact-panel contact-combined">
          <section className="contact-details" aria-labelledby="contact-details-title">
            <header><span>Connect with us</span><h2 id="contact-details-title">We’re here for your family</h2></header>
            <div className="contact-details__list">
              {content.details.map((detail) => (
                <div className="contact-detail" key={detail.id}>
                  <span className={`contact-detail__icon contact-detail__icon--${detail.id}`} aria-hidden="true">{detailIcons[detail.id] ?? "•"}</span>
                  <div><strong>{detail.label}</strong>{detail.href ? <a href={detail.href}>{detail.value}</a> : <p>{detail.value}</p>}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="contact-form-card" aria-labelledby="contact-form-title">
            <header><span>Tell us how we can help</span><h2 id="contact-form-title">{content.form.title}</h2></header>
            <form onSubmit={submitForm} noValidate>
            <label htmlFor="contact-name">Your Name</label>
            <input id="contact-name" name="name" value={form.name} onChange={updateField} placeholder="Enter your name" autoComplete="name" aria-invalid={Boolean(fieldErrors.name?.length)} required />
            {fieldErrors.name?.[0] && <small className="contact-field-error">{fieldErrors.name[0]}</small>}

            <label htmlFor="contact-phone">Phone Number</label>
            <input id="contact-phone" name="phone" type="tel" value={form.phone} onChange={updateField} placeholder="Enter phone number" autoComplete="tel" aria-invalid={Boolean(fieldErrors.phone?.length)} required />
            {fieldErrors.phone?.[0] && <small className="contact-field-error">{fieldErrors.phone[0]}</small>}

            <label htmlFor="contact-email">Email</label>
            <input id="contact-email" name="email" type="email" value={form.email} onChange={updateField} placeholder="Enter email" autoComplete="email" aria-invalid={Boolean(fieldErrors.email?.length)} required />
            {fieldErrors.email?.[0] && <small className="contact-field-error">{fieldErrors.email[0]}</small>}

            <label htmlFor="contact-message">Message</label>
            <div className="contact-message-field">
              <textarea id="contact-message" name="message" value={form.message} onChange={updateField} placeholder="Type your message..." rows={5} maxLength={900} aria-describedby="contact-message-count" aria-invalid={Boolean(fieldErrors.message?.length)} required />
              <span id="contact-message-count" className="contact-message-count" aria-live="polite">{form.message.length}/900 characters</span>
            </div>
            {fieldErrors.message?.[0] && <small className="contact-field-error">{fieldErrors.message[0]}</small>}

            {status && <p className={`contact-form-status contact-form-status--${status.type}`} role="status">{status.message}</p>}
            <button className="contact-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send Message"}</button>
            </form>
          </section>
        </article>

        <article className="contact-panel contact-map">
          <iframe src={content.map.embedUrl} title={`Location of ${content.map.label}`} allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
          <a className="contact-map__button" href={content.map.directionsUrl} target="_blank" rel="noreferrer">See On Map</a>
        </article>
      </section>
    </main>
  );
};
