import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import logo from "../../assets/sankalp-logo.webp";
import { loadFeedbackForm, submitFeedback } from "./feedback.service";
import "./FeedbackForm.css";

export const FeedbackForm = () => {
  const { token = "" } = useParams();
  const [context, setContext] = useState<{
    parentName: string;
    childName: string;
    expiresAt: string;
  } | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let active = true;
    loadFeedbackForm(token)
      .then((data) => {
        if (active) {
          setContext(data);
          setDisplayName(data.parentName);
        }
      })
      .catch((reason) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "This feedback link is unavailable.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!rating) {
      setError("Please select a rating from 1 to 5 stars.");
      return;
    }
    setBusy(true);
    try {
      await submitFeedback(token, {
        rating,
        feedback,
        parentDisplayName: displayName,
        consentToPublish: consent,
      });
      setComplete(true);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to submit feedback.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="family-feedback-page">
      <section className="family-feedback-card">
        <img
          src={logo}
          alt="Sankalp Physiotherapy and Child Development Clinic"
        />
        {loading ? (
          <div className="family-feedback-loading">
            <span />
            <span />
            <span />
          </div>
        ) : complete ? (
          <div className="family-feedback-success">
            <span aria-hidden="true">🌈</span>
            <h1>Thank you for your feedback!</h1>
            <p>Your experience has been shared securely with Team Sankalp.</p>
            <Link to="/">Return to Sankalp Home</Link>
          </div>
        ) : error && !context ? (
          <div className="family-feedback-unavailable">
            <span aria-hidden="true">🔒</span>
            <h1>Feedback link unavailable</h1>
            <p>{error}</p>
            <Link to="/">Return to Sankalp Home</Link>
          </div>
        ) : (
          context && (
            <>
              <header>
                <small>YOUR EXPERIENCE MATTERS</small>
                <h1>Hello, {context.parentName}! 👋</h1>
                <p>
                  Tell us about the care received by{" "}
                  <strong>{context.childName}</strong>. Your feedback helps us
                  support every child better.
                </p>
              </header>
              <form onSubmit={submit}>
                <fieldset>
                  <legend>How would you rate your experience?</legend>
                  <div className="family-feedback-stars">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        className={value <= rating ? "is-selected" : ""}
                        type="button"
                        onClick={() => setRating(value)}
                        aria-label={`${value} star${value > 1 ? "s" : ""}`}
                        aria-pressed={value === rating}
                        key={value}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <small>
                    {rating
                      ? `${rating} out of 5 stars`
                      : "Select a star rating"}
                  </small>
                </fieldset>
                <label>
                  Your Name
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    minLength={2}
                    maxLength={80}
                    required
                  />
                </label>
                <label>
                  Share Your Feedback
                  <textarea
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    minLength={10}
                    maxLength={2000}
                    placeholder="Tell us about your experience with Sankalp…"
                    required
                  />
                  <small>{feedback.length}/2000</small>
                </label>
                <label className="family-feedback-consent">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                  />
                  <span>
                    I give permission to publish this feedback on the Sankalp
                    website. My contact details and my child’s private
                    information will not be displayed.
                  </span>
                </label>
                {error && (
                  <p className="family-feedback-error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="family-feedback-submit"
                  type="submit"
                  disabled={busy}
                >
                  {busy ? "Submitting…" : "Submit Feedback"}
                </button>
                <p className="family-feedback-expiry">
                  🔒 Secure single-use form · Valid until{" "}
                  {new Date(context.expiresAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </form>
            </>
          )
        )}
      </section>
    </main>
  );
};
