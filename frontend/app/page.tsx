import Link from "next/link";
import { FeedbackForm } from "../components/feedback-form";

export default function HomePage() {
  return (
    <main className="landing-page">
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
            <Link href="/dashboard" className="secondary-link">
              View admin insights
            </Link>
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
