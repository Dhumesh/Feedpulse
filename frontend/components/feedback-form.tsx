"use client";

import { FormEvent, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";

const categories = ["Bug", "Feature Request", "Improvement", "Other"];
const minDescription = 20;

const initialState = {
  title: "",
  description: "",
  category: "Feature Request",
  submitterName: "",
  submitterEmail: ""
};

export function FeedbackForm() {
  const [form, setForm] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const descriptionCount = form.description.length;
  const canSubmit = useMemo(
    () => form.title.trim().length > 0 && descriptionCount >= minDescription,
    [descriptionCount, form.title]
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      setMessage({ type: "error", text: "Add a title and at least 20 characters in the description." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await apiRequest("/feedback", {
        method: "POST",
        body: form
      });
      setForm(initialState);
      setMessage({ type: "success", text: "Feedback submitted. The product team can review it now." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Could not submit feedback"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="panel form-card" onSubmit={onSubmit}>
      <div className="section-heading">
        <span className="pill">Public feedback form</span>
        <h2>Tell the team what matters most.</h2>
        <p>Share bugs, feature requests, or improvements without signing in.</p>
      </div>

      <label>
        Title
        <input
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          maxLength={120}
          placeholder="Short summary of the issue or request"
        />
      </label>

      <label>
        Description
        <textarea
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          rows={7}
          placeholder="Explain what happened, what you expected, and why it matters."
        />
        <div className="hint-row">
          <span>Minimum 20 characters</span>
          <span>{descriptionCount} characters</span>
        </div>
      </label>

      <label>
        Category
        <select
          value={form.category}
          onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <div className="two-col">
        <label>
          Name <span className="optional">(optional)</span>
          <input
            value={form.submitterName}
            onChange={(event) => setForm((current) => ({ ...current, submitterName: event.target.value }))}
            placeholder="Jane Doe"
          />
        </label>

        <label>
          Email <span className="optional">(optional)</span>
          <input
            type="email"
            value={form.submitterEmail}
            onChange={(event) => setForm((current) => ({ ...current, submitterEmail: event.target.value }))}
            placeholder="jane@company.com"
          />
        </label>
      </div>

      {message ? <p className={`notice ${message.type}`}>{message.text}</p> : null}

      <button type="submit" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit feedback"}
      </button>
    </form>
  );
}
