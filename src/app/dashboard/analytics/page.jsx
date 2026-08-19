"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardSidebar from "../DashboardSidebar";
import TrafficChart from "../TrafficChart";
import { getDashboardSession } from "@/lib/dashboardAuth";
import "../dashboard.css";

const emptyStats = {
  views: "0",
  viewsTrend: "0%",
  viewsTrendDir: "up",
  readers: "0",
  readersTrend: "0%",
  readersTrendDir: "up",
  avgTime: "—",
  avgTimeTrend: "0%",
  avgTimeTrendDir: "up",
  bounce: "—",
  bounceTrend: "0%",
  bounceTrendDir: "up",
};

export default function DashboardAnalyticsPage() {
  const [range, setRange] = useState("30d");
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState("");

  const isAdmin = currentUser?.role === "admin";

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/analytics?range=${range}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) setPayload(data);
    } catch {
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    setCurrentUser(getDashboardSession());
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  async function confirmResetAnalytics() {
    setResetBusy(true);
    setResetError("");
    try {
      const res = await fetch("/api/dashboard/analytics", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || data.error || "Failed to reset analytics");
      }
      setShowResetConfirm(false);
      await loadAnalytics();
    } catch (err) {
      setResetError(err.message || "Failed to reset analytics");
    } finally {
      setResetBusy(false);
    }
  }

  const stats = useMemo(
    () => ({ ...emptyStats, ...(payload?.stats || {}) }),
    [payload],
  );
  const channels = payload?.channels || [];
  const devices = payload?.devices || [];
  const categories = payload?.categories || [];
  const countries = payload?.countries || [];
  const topArticles = payload?.topArticles || [];
  const traffic = payload?.traffic;

  return (
    <div className="dashboard-isolate">
      <div className="db-app">
        <DashboardSidebar active="analytics" />

        <main className="db-main">
          <div className="db-topbar">
            <div>
              <h1>Analytics</h1>
              <p className="sub">
                Traffic, engagement, and content performance across NutriFactx.
              </p>
            </div>
            <div className="db-topbar-right">
              <div className="db-chart-tabs db-analytics-range">
                {[
                  { key: "7d", label: "7 days" },
                  { key: "30d", label: "30 days" },
                  { key: "90d", label: "90 days" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`db-chart-tab${range === item.key ? " active" : ""}`}
                    onClick={() => setRange(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <Link href="/dashboard/articles" className="db-secondary-btn">
                View articles
              </Link>
              {isAdmin ? (
                <button
                  type="button"
                  className="db-secondary-btn"
                  onClick={() => {
                    setResetError("");
                    setShowResetConfirm(true);
                  }}
                >
                  Reset data
                </button>
              ) : null}
            </div>
          </div>

          <div className="db-stats-grid">
            <div className="db-stat-card">
              <div className="db-stat-top">
                <div className="db-stat-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                    <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <span className={`db-stat-trend ${stats.viewsTrendDir || "up"}`}>
                  {stats.viewsTrend}
                </span>
              </div>
              <p className="db-stat-value">{loading ? "…" : stats.views}</p>
              <p className="db-stat-label">Page views</p>
            </div>

            <div className="db-stat-card">
              <div className="db-stat-top">
                <div className="db-stat-icon green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span className={`db-stat-trend ${stats.readersTrendDir || "up"}`}>
                  {stats.readersTrend}
                </span>
              </div>
              <p className="db-stat-value">{loading ? "…" : stats.readers}</p>
              <p className="db-stat-label">Unique readers</p>
            </div>

            <div className="db-stat-card">
              <div className="db-stat-top">
                <div className="db-stat-icon gold">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <span className={`db-stat-trend ${stats.avgTimeTrendDir || "up"}`}>
                  {stats.avgTimeTrend}
                </span>
              </div>
              <p className="db-stat-value">{loading ? "…" : stats.avgTime}</p>
              <p className="db-stat-label">Avg. time on page</p>
            </div>

            <div className="db-stat-card">
              <div className="db-stat-top">
                <div className="db-stat-icon red">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                    <path d="M3 12h18" />
                    <path d="M12 3v18" />
                    <path d="M7 7l10 10" />
                  </svg>
                </div>
                <span className={`db-stat-trend ${stats.bounceTrendDir || "up"}`}>
                  {stats.bounceTrend}
                </span>
              </div>
              <p className="db-stat-value">{loading ? "…" : stats.bounce}</p>
              <p className="db-stat-label">Bounce rate</p>
            </div>
          </div>

          <div className="db-content-grid">
            <div className="db-panel">
              <TrafficChart data={traffic} />
            </div>

            <div className="db-panel">
              <div className="db-panel-head">
                <h2>Traffic sources</h2>
              </div>
              {channels.length === 0 ? (
                <p className="db-comments-empty">No source tracking data yet.</p>
              ) : (
                <ul className="db-analytics-bars">
                  {channels.map((item) => (
                    <li key={item.name}>
                      <div className="db-analytics-bar-meta">
                        <span className="label">{item.name}</span>
                        <span className="value">
                          {item.value}% · {item.sessions}
                        </span>
                      </div>
                      <div className="db-analytics-bar-track">
                        <span style={{ width: `${item.value}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="db-analytics-grid-3">
            <div className="db-panel">
              <div className="db-panel-head">
                <h2>Devices</h2>
              </div>
              {devices.every((d) => !d.value) ? (
                <p className="db-comments-empty">No device tracking data yet.</p>
              ) : (
                <>
                  <div className="db-device-stack" aria-hidden="true">
                    {devices.map((item) => (
                      <span
                        key={item.name}
                        style={{ width: `${item.value}%`, background: item.color }}
                        title={`${item.name}: ${item.value}%`}
                      />
                    ))}
                  </div>
                  <ul className="db-device-legend">
                    {devices.map((item) => (
                      <li key={item.name}>
                        <span className="dot" style={{ background: item.color }} />
                        <span className="label">{item.name}</span>
                        <span className="value">{item.value}%</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="db-panel">
              <div className="db-panel-head">
                <h2>By category</h2>
              </div>
              {categories.length === 0 ? (
                <p className="db-comments-empty">No category data yet.</p>
              ) : (
                <ul className="db-analytics-bars compact">
                  {categories.map((item) => (
                    <li key={item.name}>
                      <div className="db-analytics-bar-meta">
                        <span className="label">{item.name}</span>
                        <span className="value">{item.views}</span>
                      </div>
                      <div className="db-analytics-bar-track">
                        <span style={{ width: `${item.share}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="db-panel">
              <div className="db-panel-head">
                <h2>Top countries</h2>
              </div>
              {countries.length === 0 ? (
                <p className="db-comments-empty">No country tracking data yet.</p>
              ) : (
                <ul className="db-analytics-list">
                  {countries.map((item, index) => (
                    <li key={item.name}>
                      <span className="num">{index + 1}</span>
                      <div>
                        <p className="title">{item.name}</p>
                        <p className="meta">{item.share}% of readers</p>
                      </div>
                      <span className="views">{item.readers}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="db-panel">
            <div className="db-panel-head">
              <h2>Top performing articles</h2>
              <Link href="/dashboard/articles">Manage all</Link>
            </div>
            <div className="db-table-wrap">
              <table className="db-articles-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Article</th>
                    <th>Category</th>
                    <th>Views</th>
                    <th>Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {topArticles.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <p className="db-comments-empty">No published articles yet.</p>
                      </td>
                    </tr>
                  ) : (
                    topArticles.map((item, index) => (
                      <tr key={`${item.title}-${index}`}>
                        <td>{index + 1}</td>
                        <td>
                          <p className="db-analytics-article-title">{item.title}</p>
                        </td>
                        <td>{item.cat}</td>
                        <td>{item.views}</td>
                        <td>
                          <span className="db-stat-trend up">{item.growth}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {showResetConfirm ? (
        <div
          className="db-confirm-overlay"
          role="presentation"
          onClick={() => {
            if (!resetBusy) setShowResetConfirm(false);
          }}
        >
          <div
            className="db-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-analytics-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="reset-analytics-title">Reset analytics data?</h3>
            <p>
              This clears all page views, sessions, and article view counts.
              New traffic will be tracked from zero. This cannot be undone.
            </p>
            {resetError ? <p className="db-manager-add-error">{resetError}</p> : null}
            <div className="db-confirm-actions">
              <button
                type="button"
                className="db-secondary-btn"
                onClick={() => setShowResetConfirm(false)}
                disabled={resetBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="db-confirm-delete-btn"
                onClick={confirmResetAnalytics}
                disabled={resetBusy}
              >
                {resetBusy ? "Resetting…" : "Reset analytics"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
