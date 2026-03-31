"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FeedbackForm } from "./feedback-form";

type StoredUser = {
  email: string;
  name: string;
  role: string;
};

const userStorageKey = "feedpulse-user";

export function HomeShell() {
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(userStorageKey);

    if (!raw) {
      return;
    }

    try {
      setUser(JSON.parse(raw) as StoredUser);
    } catch {
      window.localStorage.removeItem(userStorageKey);
    }
  }, []);

  const logout = () => {
    window.localStorage.removeItem("feedpulse-user-token");
    window.localStorage.removeItem("feedpulse-user");
    window.localStorage.removeItem("feedpulse-admin-token");
    setUser(null);
  };

  return (
    <main className="landing-page">
      <header className="shell landing-topbar">
        <div className="brand-inline">
          <span className="brand-mark small">P</span>
          <strong>FeedPulse</strong>
        </div>
        <div className="topbar-actions">
          {user ? (
            <>
              <span className="user-chip">{user.email}</span>
              <button type="button" className="secondary-link" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth" className="secondary-link">
                Login
              </Link>
              <Link href="/auth?mode=register" className="primary-link">
                Register
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="landing-hero shell">
        <div className="landing-copy">
          <span className="pill">The Digital Curator</span>
          <h1>FeedPulse turns user feedback into product clarity.</h1>
          <p>
            Collect feedback publicly, analyze it with Gemini, and route your team toward the
            highest-signal work with sentiment, priority, and trend summaries.
          </p>
          <div className="hero-actions">
            <a href="#submit" className="primary-link">
              Submit feedback
            </a>
          </div>
        </div>

        <div className="landing-spotlight">
          <div className="spotlight-card primary">
            <span>AI Categorization</span>
            <strong>Bug, feature request, improvement, or other</strong>
          </div>
          <div className="spotlight-card">
            <span>Sentiment Detection</span>
            <strong>Instant negative, neutral, or positive labeling</strong>
          </div>
          <div className="spotlight-card">
            <span>Priority Scoring</span>
            <strong>1 to 10 urgency score for triage</strong>
          </div>
        </div>
      </section>

      <section id="submit" className="shell submit-section">
        <FeedbackForm />
      </section>
    </main>
  );
}
