import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { PageSkeleton } from "../../components/loading/PageSkeleton";
import { getContactContent, sendContactMessage } from "./contact.service";
import { ContactContent, ContactFormData, ContactMessageResponse } from "./contact.types";
import "./Contact.css";

const initialForm: ContactFormData = { name: "", phone: "", email: "", message: "" };

const DetailIcon = ({ type }: { type: string }) => {
  if (type === "phone") return <svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2 11 11 0 0 0 3.5 1.1 1 1 0 0 1 .8 1v3.4a1 1 0 0 1-1 1A18.2 18.2 0 0 1 2.5 4.3a1 1 0 0 1 1-1h3.4a1 1 0 0 1 1 .8A11 11 0 0 0 9 7.6a1 1 0 0 1-.2 1l-2.2 2.2Z" /></svg>;
  if (type === "whatsapp") return <svg viewBox="0 0 24 24"><path d="M20 11.6a8 8 0 0 1-11.8 7L4 20l1.4-4A8 8 0 1 1 20 11.6Z" /><path d="M9 8.5c.5 2.8 2 4.4 4.8 5.2M9.1 8.5l1.2 2-1 1M13.8 13.7l1-1 2 1.1" /></svg>;
  if (type === "email") return <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
  if (type === "address") return <svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
  if (type === "timings") return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /></svg>;
};

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
          <section className="contact-details contact-inner-card" aria-labelledby="contact-details-title">
            <header><span>Connect with us</span><h2 id="contact-details-title">We’re here for your family</h2></header>
            <div className="contact-details__list">
              {content.details.map((detail) => (
                <div className="contact-detail" key={detail.id}>
                  <span className={`contact-detail__icon contact-detail__icon--${detail.id}`} aria-hidden="true"><DetailIcon type={detail.id} /></span>
                  <div><strong>{detail.label}</strong>{detail.href ? <a href={detail.href}>{detail.value}</a> : <p>{detail.value}</p>}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="contact-form-card contact-inner-card" aria-labelledby="contact-form-title">
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
