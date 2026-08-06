"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardSidebar from "../DashboardSidebar";
import "../dashboard.css";

const statusLabel = {
  published: "Published",
  draft: "Draft",
  review: "In review",
};

const filters = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "review", label: "In review" },
  { key: "draft", label: "Draft" },
];

export default function DashboardArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/posts");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load articles");
      setArticles(Array.isArray(data.articles) ? data.articles : []);
    } catch (err) {
      setLoadError(err.message || "Failed to load articles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const categories = useMemo(() => {
    const set = new Set(articles.map((a) => a.cat).filter(Boolean));
    return [...set].sort();
  }, [articles]);

  const counts = useMemo(() => {
    return {
      all: articles.length,
      published: articles.filter((a) => a.status === "published").length,
      review: articles.filter((a) => a.status === "review").length,
      draft: articles.filter((a) => a.status === "draft").length,
    };
  }, [articles]);

  const visible = useMemo(() => {
    return articles.filter((item) => {
      const statusOk = filter === "all" || item.status === filter;
      const catOk = category === "all" || item.cat === category;
      return statusOk && catOk;
    });
  }, [articles, filter, category]);

  const allVisibleSelected =
    visible.length > 0 && visible.every((item) => selected.includes(item.id));

  function toggleAll() {
    if (allVisibleSelected) {
      setSelected((prev) => prev.filter((id) => !visible.some((item) => item.id === id)));
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      visible.forEach((item) => next.add(item.id));
      return [...next];
    });
  }

  function toggleOne(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function requestDelete(item) {
    setDeleteTarget(item);
  }

  function cancelDelete() {
    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    const id = deleteTarget.id;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setArticles((prev) => prev.filter((item) => item.id !== id));
      setSelected((prev) => prev.filter((item) => item !== id));
      setDeleteTarget(null);
    } catch (err) {
      setLoadError(err.message || "Delete failed");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="dashboard-isolate">
      <div className="db-app">
        <DashboardSidebar active="articles" />

        <main className="db-main">
          <div className="db-topbar">
            <div>
              <h1>Articles</h1>
              <p className="sub">
                {counts.all} articles · {counts.draft} in draft · {counts.review} in review
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

          <div className="db-panel db-articles-filter">
            <div className="db-articles-filter-inner">
              <div className="db-chart-tabs">
                {filters.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`db-chart-tab${filter === item.key ? " active" : ""}`}
                    onClick={() => setFilter(item.key)}
                  >
                    {item.label} ({counts[item.key]})
                  </button>
                ))}
              </div>
              <div className="db-articles-filter-selects">
                <select
                  className="db-articles-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="all">All categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <select className="db-articles-select" defaultValue="newest">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="views">Most viewed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="db-panel">
            {loadError ? <p className="db-comments-empty">{loadError}</p> : null}
            {loading ? (
              <p className="db-comments-empty">Loading articles…</p>
            ) : visible.length === 0 ? (
              <p className="db-comments-empty">
                No articles yet.{" "}
                <Link href="/dashboard/articles/new">Create your first article</Link>
              </p>
            ) : (
              <table className="db-articles-table">
                <thead>
                  <tr>
                    <th className="db-articles-check-col">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleAll}
                        aria-label="Select all articles"
                      />
                    </th>
                    <th>Article</th>
                    <th>Author</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Views</th>
                    <th className="db-articles-actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(item.id)}
                          onChange={() => toggleOne(item.id)}
                          aria-label={`Select ${item.title}`}
                        />
                      </td>
                      <td>
                        <div className="db-post-cell">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              item.image ||
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23e8eee9' width='100' height='100'/%3E%3C/svg%3E"
                            }
                            alt=""
                          />
                          <div>
                            <p className="title">{item.title}</p>
                            <p className="cat">{item.cat}</p>
                          </div>
                        </div>
                      </td>
                      <td>{item.author || "NutriFactx"}</td>
                      <td>
                        <span className={`db-badge ${item.status}`}>
                          {statusLabel[item.status] || item.status}
                        </span>
                      </td>
                      <td>{item.date}</td>
                      <td>{item.views}</td>
                      <td className="db-articles-actions-cell">
                        <div className="db-row-actions">
                          <Link
                            href={`/dashboard/articles/${item.id}/edit`}
                            className="db-row-action edit"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="db-row-action delete"
                            onClick={() => requestDelete(item)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="db-articles-footer">
              <span>
                Showing {visible.length ? `1–${visible.length}` : "0"} of {counts.all} articles
              </span>
              <div className="db-articles-pager">
                <button type="button" className="db-icon-btn db-pager-btn" aria-label="Previous page">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button type="button" className="db-icon-btn db-pager-btn" aria-label="Next page">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {deleteTarget ? (
        <div
          className="db-confirm-overlay"
          role="presentation"
          onClick={cancelDelete}
        >
          <div
            className="db-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-article-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-article-title">Delete article?</h3>
            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.title}</strong>? This action cannot be undone.
            </p>
            <div className="db-confirm-actions">
              <button type="button" className="db-secondary-btn" onClick={cancelDelete}>
                Cancel
              </button>
              <button
                type="button"
                className="db-confirm-delete-btn"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete article"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
