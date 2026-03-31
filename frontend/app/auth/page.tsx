import Link from "next/link";
import { AuthPanel } from "../../components/auth-panel";

export default function AuthPage() {
  return (
    <main className="dashboard-page">
      <header className="shell landing-topbar auth-topbar">
        <Link href="/" className="brand-inline">
          <span className="brand-mark small">P</span>
          <strong>FeedPulse</strong>
        </Link>
      </header>

      <div className="shell">
        <AuthPanel />
      </div>
    </main>
  );
}
