"use client";

import { useState } from "react";

const topics = ["Article question", "Guest post", "Correction", "Collaboration", "Other"];

export default function ContactForm() {
  const [topic, setTopic] = useState(topics[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          topic,
          message: message.trim(),
          consent,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not send message.");
      }

      setNotice(data.message || "Message sent. We’ll get back to you soon.");
      setName("");
      setEmail("");
      setMessage("");
      setConsent(false);
      setTopic(topics[0]);
    } catch (err) {
      setError(err.message || "Could not send message.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="ct-topic-label">What&apos;s this about?</p>
      <div className="ct-pills">
        {topics.map((item) => (
          <button
            key={item}
            type="button"
            className={`ct-pill${topic === item ? " selected" : ""}`}
            onClick={() => setTopic(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <input type="hidden" name="topic" value={topic} />

      <div className="ct-field-row">
        <div className="ct-field">
          <label htmlFor="fname">Full name</label>
          <input
            type="text"
            id="fname"
            name="name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="ct-field">
          <label htmlFor="email">Email address</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="ct-field">
        <label htmlFor="message">Your message</label>
        <textarea
          id="message"
          name="message"
          placeholder="Tell us how we can help..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>

      <label className="ct-consent">
        <input
          type="checkbox"
          name="consent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
        />
        <span>I agree to be contacted by Nutrifactx regarding my message.</span>
      </label>

      {error ? (
        <p className="ct-response-note" style={{ color: "#b42318" }}>
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="ct-response-note" style={{ color: "#1f6b45" }}>
          {notice}
        </p>
      ) : null}

      <button type="submit" className="ct-submit" disabled={submitting}>
        {submitting ? "Sending…" : "Send message"}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15" aria-hidden="true">
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      </button>

      <div className="ct-response-note">
        {/* <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true">
          <path d="M9 12l2 2 4-4" />
          <circle cx="12" cy="12" r="9" />
        </svg> */}
        {/* <span>We read every message personally, no auto-replies.</span> */}
      </div>
    </form>
  );
}
