"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FeedbackForm } from "./feedback-form";
import { apiRequest } from "../lib/api";

type StoredUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type MyFeedbackItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  ai_summary: string;
  submittedByEmail: string;
  createdAt: string;
};

function statusTagClass(status: string) {
  if (status === "Resolved") {
    return "status-pill solved";
  }

  if (status === "In Review") {
    return "status-pill reviewed";
  }

  return "status-pill sent";
}

const userStorageKey = "feedpulse-user";

export function HomeShell() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [items, setItems] = useState<MyFeedbackItem[]>([]);

  useEffect(() => {
    const fetchMine = async () => {
      const token = window.localStorage.getItem("feedpulse-user-token");
      const raw = window.localStorage.getItem(userStorageKey);

      if (!token || !raw) {
        setItems([]);
        return;
      }

      try {
        const response = await apiRequest<{ items: MyFeedbackItem[] }>("/feedback/mine", {
          token
        });
        setItems(response.data.items);
      } catch {
        setItems([]);
      }
    };

    void fetchMine();

    const handleRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<MyFeedbackItem | undefined>;
      const submittedItem = customEvent.detail;

      if (submittedItem) {
        setItems((current) => {
          const exists = current.some((item) => item.id === submittedItem.id);
          if (exists) {
            return current;
          }

          return [submittedItem, ...current];
        });
      }

      void fetchMine();
    };

    window.addEventListener("feedpulse:feedback-submitted", handleRefresh);

    return () => {
      window.removeEventListener("feedpulse:feedback-submitted", handleRefresh);
    };
  }, [user]);

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
    setItems([]);
  };

  return (
    <main className="landing-page">
      <header className="shell landing-topbar">
        <Link href="/" className="brand-inline">
          <span className="brand-mark small">P</span>
          <strong>FeedPulse</strong>
        </Link>
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

      {user ? (
        <section className="shell my-feedback-section">
          <div className="section-heading">
            <span className="pill">My feedback</span>
            <h2>Your submitted feedback</h2>
            <p>Everything you submitted is stored here so you can track its current status.</p>
          </div>

          <div className="my-feedback-grid">
            {items.length ? (
              items.map((item) => (
                <article key={item.id} className="panel my-feedback-card">
                  <div className="my-feedback-top">
                    <span className="pill small-pill">{item.category}</span>
                    <span className={statusTagClass(item.status)}>
                      {item.status === "Resolved" ? "Solved" : item.status === "In Review" ? "Reviewed" : "Sent"}
                    </span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  {item.ai_summary ? <div className="feedback-ai-note">AI: {item.ai_summary}</div> : null}
                  <div className="submitted-account">
                    Stored under: {item.submittedByEmail || user.email}
                  </div>
                  <div className="my-feedback-meta">
                    <span>Status: {item.status}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </article>
              ))
            ) : (
              <article className="panel my-feedback-card empty-state">
                <h3>No feedback submitted yet</h3>
                <p>Once you submit feedback, it will appear here.</p>
              </article>
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
