"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "../lib/api";
import { useScrollReveal } from "./use-scroll-reveal";

type FeedbackItem = {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  ai_sentiment: string;
  ai_priority: number | null;
  ai_summary: string;
  ai_tags: string[];
  isTrashed: boolean;
  trashedAt: string | null;
  createdAt: string;
};

type DashboardPayload = {
  items: FeedbackItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalFeedback: number;
    openItems: number;
    averagePriority: number;
    mostCommonTag: string;
  };
};

type SummaryPayload = {
  themes: string[];
};

const statusOptions = ["New", "In Review", "Resolved"];
const categoryOptions = ["All", "Bug", "Feature Request", "Improvement", "Other"];
const statusFilterOptions = ["All", "New", "In Review", "Resolved"];
const sortOptions = [
  { label: "Newest first", value: "date" },
  { label: "Priority", value: "priority" },
  { label: "Sentiment", value: "sentiment" }
];
const tokenKey = "feedpulse-admin-token";

function sentimentClass(value: string) {
  const lower = value.toLowerCase();
  if (lower === "positive" || lower === "negative" || lower === "neutral") {
    return `sentiment-chip sentiment-${lower}`;
  }
  return "sentiment-chip sentiment-neutral";
}

function categoryClass(value: string) {
  if (value === "Feature Request") {
    return "tag feature";
  }
  if (value === "Improvement") {
    return "tag improvement";
  }
  if (value === "Bug") {
    return "tag bug";
  }
  return "tag other";
}

function statusClass(value: string) {
  if (value === "Resolved") {
    return "status-select resolved";
  }
  if (value === "In Review") {
    return "status-select review";
  }
  return "status-select new";
}

function priorityStars(value: number | null) {
  const score = Math.max(0, Math.min(5, Math.round((value ?? 0) / 2)));
  return "*".repeat(score) + ".".repeat(5 - score);
}

export function AdminDashboard() {
  const router = useRouter();
  const rootRef = useRef<HTMLElement | null>(null);
  const [token, setToken] = useState("");
  const [loginForm, setLoginForm] = useState({
    email: "clarishajoseph016@gmail.com",
    password: "123456"
  });
  const [activeTab, setActiveTab] = useState<"dashboard" | "feedback" | "trash">("dashboard");
  const [filters, setFilters] = useState({
    category: "All",
    status: "All",
    search: "",
    sortBy: "date",
    page: 1
  });
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [themes, setThemes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoadingId, setAiLoadingId] = useState("");

  useScrollReveal(rootRef);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(tokenKey) ?? "";
    setToken(storedToken);
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(filters.page),
      limit: "10",
      sortBy: filters.sortBy,
      trashed: activeTab === "trash" ? "true" : "false"
    });

    if (filters.category !== "All") {
      params.set("category", filters.category);
    }
    if (filters.status !== "All") {
      params.set("status", filters.status);
    }
    if (filters.search.trim()) {
      params.set("search", filters.search.trim());
    }

    return params.toString();
  }, [activeTab, filters]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const [feedbackResponse, summaryResponse] = await Promise.all([
          apiRequest<DashboardPayload>(`/feedback?${queryString}`, { token }),
          apiRequest<SummaryPayload>("/feedback/summary", { token })
        ]);
        setData(feedbackResponse.data);
        setThemes(summaryResponse.data.themes ?? []);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not load dashboard");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [queryString, token]);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      const response = await apiRequest<{ token: string }>("/auth/login", {
        method: "POST",
        body: loginForm
      });
      window.localStorage.setItem(tokenKey, response.data.token);
      setToken(response.data.token);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    if (!token) {
      return;
    }
    try {
      await apiRequest(`/feedback/${id}`, {
        method: "PATCH",
        token,
        body: { status }
      });
      setData((current) =>
        current
          ? { ...current, items: current.items.map((item) => (item.id === id ? { ...item, status } : item)) }
          : current
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Status update failed");
    }
  };

  const trashFeedback = async (id: string) => {
    if (!token) {
      return;
    }
    try {
      await apiRequest(`/feedback/${id}`, { method: "DELETE", token });
      setData((current) =>
        current ? { ...current, items: current.items.filter((item) => item.id !== id) } : current
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Delete failed");
    }
  };

  const restoreFeedback = async (id: string) => {
    if (!token) {
      return;
    }
    try {
      await apiRequest(`/feedback/${id}/restore`, { method: "PATCH", token });
      setData((current) =>
        current ? { ...current, items: current.items.filter((item) => item.id !== id) } : current
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Restore failed");
    }
  };

  const rerunAi = async (id: string) => {
    if (!token) {
      return;
    }

    try {
      setAiLoadingId(id);
      const response = await apiRequest<FeedbackItem>(`/feedback/${id}/reanalyze`, {
        method: "POST",
        token
      });
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) => (item.id === id ? { ...item, ...response.data } : item))
            }
          : current
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "AI re-analysis failed");
    } finally {
      setAiLoadingId("");
    }
  };

  const logout = () => {
    window.localStorage.removeItem(tokenKey);
    window.localStorage.removeItem("feedpulse-user-token");
    window.localStorage.removeItem("feedpulse-user");
    setToken("");
    setData(null);
    router.push("/");
  };

  if (!token) {
    return (
      <section className="panel dashboard-login reveal-up is-visible" data-reveal ref={rootRef}>
        <div className="section-heading">
          <span className="pill">Protected dashboard</span>
          <h2>Admin login</h2>
          <p>Use your admin email and password to manage all feedback.</p>
        </div>

        <form onSubmit={login} className="login-grid">
          <label>
            Email
            <input
              type="email"
              value={loginForm.email}
              onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>
          {error ? <p className="notice error">{error}</p> : null}
          <button type="submit">Enter dashboard</button>
        </form>
      </section>
    );
  }

  return (
    <section className="dashboard-shell" ref={rootRef}>
      <aside className="dashboard-sidebar">
        <Link href="/" className="brand-block">
          <div className="brand-mark">P</div>
          <div>
            <strong>FeedPulse</strong>
            <span>AI CURATOR</span>
          </div>
        </Link>

        <nav className="sidebar-nav">
          <button type="button" className={activeTab === "dashboard" ? "sidebar-link active" : "sidebar-link"} onClick={() => setActiveTab("dashboard")}>
            Dashboard
          </button>
          <button type="button" className={activeTab === "feedback" ? "sidebar-link active" : "sidebar-link"} onClick={() => setActiveTab("feedback")}>
            Feedback
          </button>
          <button type="button" className={activeTab === "trash" ? "sidebar-link active" : "sidebar-link"} onClick={() => setActiveTab("trash")}>
            Trash
          </button>
        </nav>

        <button className="sidebar-logout" onClick={logout}>
          Logout
        </button>
      </aside>

      <div className="dashboard-content">
        <header className="admin-header reveal-up is-visible" data-reveal style={{ ["--reveal-delay" as string]: "40ms" }}>
          <div>
            <h1>{activeTab === "dashboard" ? "Admin Insights" : activeTab === "feedback" ? "All Feedback" : "Trash"}</h1>
            <p>
              {activeTab === "dashboard"
                ? "Real-time pulse of customer sentiment and feedback items."
                : activeTab === "feedback"
                  ? "All submitted feedback is stored here."
                  : "Restore feedback that was moved to trash."}
            </p>
          </div>

          <div className="admin-toolbar">
            <label className="search-box">
              <span>Search</span>
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))}
                placeholder="Search insights..."
              />
            </label>
            <div className="avatar-dot">A</div>
          </div>
        </header>

        {activeTab === "dashboard" ? (
          <>
            <section className="admin-stats">
              <article className="metric-card reveal-up" data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
                <span className="metric-badge cool">+ live</span>
                <p>Total feedback</p>
                <strong>{data?.stats.totalFeedback ?? 0}</strong>
              </article>
              <article className="metric-card reveal-up" data-reveal style={{ ["--reveal-delay" as string]: "140ms" }}>
                <span className="metric-badge warm">Active</span>
                <p>Open items</p>
                <strong>{data?.stats.openItems ?? 0}</strong>
              </article>
              <article className="metric-card reveal-up" data-reveal style={{ ["--reveal-delay" as string]: "200ms" }}>
                <span className="metric-badge muted">High</span>
                <p>Avg priority</p>
                <strong>{data?.stats.averagePriority ?? 0}</strong>
              </article>
              <article className="metric-card reveal-up" data-reveal style={{ ["--reveal-delay" as string]: "260ms" }}>
                <span className="metric-badge soft">Top</span>
                <p>Top tag</p>
                <strong>{data?.stats.mostCommonTag ?? "N/A"}</strong>
              </article>
            </section>

            <section className="summary-grid">
              <article className="summary-hero reveal-left" data-reveal style={{ ["--reveal-delay" as string]: "110ms" }}>
                <p className="summary-kicker">AI Summary</p>
                <h2>Critical product themes from the last 7 days</h2>
                <div className="theme-list">
                  {themes.length
                    ? themes.map((theme) => (
                        <span key={theme} className="summary-theme">
                          {theme}
                        </span>
                      ))
                    : <span className="summary-theme">No summary available yet.</span>}
                </div>
              </article>

              <article className="quick-actions reveal-right" data-reveal style={{ ["--reveal-delay" as string]: "180ms" }}>
                <h3>Quick Actions</h3>
                <button className="quick-action" type="button" onClick={() => setActiveTab("feedback")}>
                  Review all feedback
                </button>
                <button className="quick-action" type="button">
                  Assign high priority
                </button>
                <button className="quick-action" type="button" onClick={() => setActiveTab("trash")}>
                  Open trash
                </button>
              </article>
            </section>
          </>
        ) : null}

        {activeTab !== "dashboard" ? (
          <>
            <section className="filter-bar reveal-up" data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
              <div className="filter-row">
                <label className="filter-chip">
                  <span>Category</span>
                  <select
                    value={filters.category}
                    onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value, page: 1 }))}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="filter-chip">
                  <span>Status</span>
                  <select
                    value={filters.status}
                    onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}
                  >
                    {statusFilterOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="filter-chip">
                  <span>Sort</span>
                  <select
                    value={filters.sortBy}
                    onChange={(event) => setFilters((current) => ({ ...current, sortBy: event.target.value }))}
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            {error ? <p className="notice error">{error}</p> : null}
            {loading ? <p className="notice">Loading feedback...</p> : null}

            <section className="table-card reveal-up" data-reveal style={{ ["--reveal-delay" as string]: "130ms" }}>
              <div className="table-scroll">
                <table className="insight-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Sentiment</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>{activeTab === "trash" ? "Trashed" : "Date"}</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.title}</strong>
                          <span>{item.ai_summary || item.description || "No summary available yet."}</span>
                        </td>
                        <td>
                          <span className={categoryClass(item.category)}>{item.category}</span>
                        </td>
                        <td>
                          <span className={sentimentClass(item.ai_sentiment || "Neutral")}>
                            {item.ai_sentiment || "Pending AI"}
                          </span>
                        </td>
                        <td>
                          <span className="priority-stars">{priorityStars(item.ai_priority)}</span>
                        </td>
                        <td>
                          <select
                            className={statusClass(item.status)}
                            value={item.status}
                            disabled={activeTab === "trash"}
                            onChange={(event) => updateStatus(item.id, event.target.value)}
                          >
                            {statusOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>{new Date(activeTab === "trash" ? item.trashedAt ?? item.createdAt : item.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="table-action-stack">
                            {activeTab === "trash" ? (
                              <button type="button" className="table-action restore" onClick={() => restoreFeedback(item.id)}>
                                Restore
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="table-action ai"
                                  onClick={() => rerunAi(item.id)}
                                  disabled={aiLoadingId === item.id}
                                >
                                  {aiLoadingId === item.id ? "Running AI..." : "Re-run AI"}
                                </button>
                                <button type="button" className="table-action delete" onClick={() => trashFeedback(item.id)}>
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <footer className="table-footer">
                <p>
                  Showing {data?.items.length ?? 0} of {data?.pagination.total ?? 0} items
                </p>
                <div className="pager">
                  <button
                    disabled={(data?.pagination.page ?? 1) <= 1}
                    onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
                  >
                    Prev
                  </button>
                  <span className="page-indicator">{data?.pagination.page ?? 1}</span>
                  <button
                    disabled={(data?.pagination.page ?? 1) >= (data?.pagination.totalPages ?? 1)}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: Math.min(data?.pagination.totalPages ?? current.page, current.page + 1)
                      }))
                    }
                  >
                    Next
                  </button>
                </div>
              </footer>
            </section>
          </>
        ) : null}
      </div>
    </section>
  );
}
