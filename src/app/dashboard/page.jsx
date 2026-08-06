import Link from "next/link";
import DashboardSidebar from "./DashboardSidebar";
import TrafficChart from "./TrafficChart";
import { getDashboardHomeData } from "@/lib/realAnalyticsStats";
import "./dashboard.css";

export const metadata = {
  title: "Dashboard | NutriFactx",
  description: "NutriFactx editorial dashboard",
};

const statusLabel = {
  published: "Published",
  draft: "Draft",
  review: "In review",
};

export default async function DashboardPage() {
  const data = await getDashboardHomeData();
  const { stats, topArticles, recentArticles, comments, traffic, greetingDate } =
    data;

  return (
    <div className="dashboard-isolate">
      <div className="db-app">
        <DashboardSidebar active="dashboard" />

        <main className="db-main">
          <div className="db-topbar">
            <div>
              <h1>Good morning, Ayesha</h1>
              <p className="sub">
                Here&apos;s how Nutrifactx is performing today, {greetingDate}.
              </p>
            </div>
            <div className="db-topbar-right">
              <div className="db-search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <input type="text" placeholder="Search articles, comments..." />
              </div>
              <button type="button" className="db-icon-btn" aria-label="Notifications">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="dot" />
              </button>
              <Link href="/dashboard/articles/new" className="db-new-post-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                New article
              </Link>
            </div>
          </div>

          <div className="db-stats-grid">
            <div className="db-stat-card">
              <div className="db-stat-top">
                <div className="db-stat-icon green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <span className={`db-stat-trend ${stats.published.trendDir}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                    <path d="M23 6l-9.5 9.5-5-5L1 18" />
                  </svg>
                  {stats.published.trend}
                </span>
              </div>
              <p className="db-stat-value">{stats.published.value}</p>
              <p className="db-stat-label">Published articles</p>
            </div>

            <div className="db-stat-card">
              <div className="db-stat-top">
                <div className="db-stat-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                    <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <span className={`db-stat-trend ${stats.readers.trendDir}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                    <path d="M23 6l-9.5 9.5-5-5L1 18" />
                  </svg>
                  {stats.readers.trend}
                </span>
              </div>
              <p className="db-stat-value">{stats.readers.value}</p>
              <p className="db-stat-label">Monthly readers</p>
            </div>

            <div className="db-stat-card">
              <div className="db-stat-top">
                <div className="db-stat-icon gold">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <span className={`db-stat-trend ${stats.comments.trendDir}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                    <path d="M23 6l-9.5 9.5-5-5L1 18" />
                  </svg>
                  {stats.comments.trend}
                </span>
              </div>
              <p className="db-stat-value">{stats.comments.value}</p>
              <p className="db-stat-label">Comments this month</p>
            </div>

            <div className="db-stat-card">
              <div className="db-stat-top">
                <div className="db-stat-icon red">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span className={`db-stat-trend ${stats.subscribers.trendDir}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                    <path d="M23 18l-9.5-9.5-5 5L1 6" />
                  </svg>
                  {stats.subscribers.trend}
                </span>
              </div>
              <p className="db-stat-value">{stats.subscribers.value}</p>
              <p className="db-stat-label">Newsletter subscribers</p>
            </div>
          </div>

          <div className="db-content-grid">
            <div className="db-panel">
              <TrafficChart data={traffic} />
            </div>

            <div className="db-panel">
              <div className="db-panel-head">
                <h2>Top articles</h2>
                <Link href="/dashboard/articles">View all</Link>
              </div>
              {topArticles.length === 0 ? (
                <p className="db-comments-empty">No published articles yet.</p>
              ) : (
                topArticles.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="db-rank-item">
                    <div className="db-rank-num">{index + 1}</div>
                    <div>
                      <p className="title">{item.title}</p>
                      <p className="meta">{item.meta}</p>
                    </div>
                    <span className="views">{item.views}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="db-content-grid">
            <div className="db-panel">
              <div className="db-panel-head">
                <h2>Recent articles</h2>
                <Link href="/dashboard/articles">Manage all</Link>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Views</th>
                  </tr>
                </thead>
                <tbody>
                  {recentArticles.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <p className="db-comments-empty">No articles yet.</p>
                      </td>
                    </tr>
                  ) : (
                    recentArticles.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="db-post-cell">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.image} alt="" />
                            <div>
                              <p className="title">{item.title}</p>
                              <p className="cat">{item.cat}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`db-badge ${item.status}`}>
                            {statusLabel[item.status] || item.status}
                          </span>
                        </td>
                        <td>{item.date}</td>
                        <td>{item.views}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="db-panel">
              <div className="db-panel-head">
                <h2>Latest comments</h2>
                <Link href="/dashboard/comments">View all</Link>
              </div>
              <div className="db-comments-list">
                {comments.length === 0 ? (
                  <p className="db-comments-empty">No comments yet.</p>
                ) : (
                  comments.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="db-comment-row">
                      <div className="avatar">{item.initials}</div>
                      <div>
                        <p className="name">{item.name}</p>
                        <p className="text">{item.text}</p>
                        <p className="time">{item.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
