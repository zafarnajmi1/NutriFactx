"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardSidebar from "../DashboardSidebar";
import { getDashboardSession } from "../../../lib/dashboardAuth";
import "../dashboard.css";

const canModerateRoles = new Set(["admin", "manager"]);

const statusLabel = {
  published: "Published",
  spam: "Spam",
};

const filters = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "spam", label: "Spam" },
];

export default function DashboardCommentsPage() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [editText, setEditText] = useState("");
  const [editStatus, setEditStatus] = useState("published");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/comments");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load comments");
      setComments(Array.isArray(data.comments) ? data.comments : []);
    } catch (err) {
      setLoadError(err.message || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentUser(getDashboardSession());
    loadComments();
  }, [loadComments]);

  const canModerate = canModerateRoles.has(currentUser?.role);
  const isAdmin = currentUser?.role === "admin";
  const canEditComment = canModerate;
  const canDeleteComment = isAdmin;

  const counts = useMemo(() => {
    return {
      all: comments.length,
      published: comments.filter((c) => c.status === "published").length,
      spam: comments.filter((c) => c.status === "spam").length,
    };
  }, [comments]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return comments.filter((item) => {
      const statusOk = filter === "all" || item.status === filter;
      if (!statusOk) return false;
      if (!q) return true;
      return (
        item.author.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q) ||
        item.articleTitle.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q)
      );
    });
  }, [comments, filter, query]);

  function openEdit(item) {
    if (!canEditComment) return;
    setEditTarget(item);
    setEditText(item.text);
    setEditStatus(item.status === "spam" ? "spam" : "published");
  }

  function closeEdit() {
    setEditTarget(null);
    setEditText("");
  }

  async function saveEdit() {
    if (!canEditComment || !editTarget || busy) return;
    const text = editText.trim();
    if (!text) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/comments/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          status: isAdmin ? editStatus : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Update failed");
      setComments((prev) =>
        prev.map((item) => (item.id === editTarget.id ? data.comment : item)),
      );
      closeEdit();
    } catch (err) {
      setLoadError(err.message || "Update failed");
    } finally {
      setBusy(false);
    }
  }

  function requestDelete(item) {
    if (!canDeleteComment) return;
    setDeleteTarget(item);
  }

  function cancelDelete() {
    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (!canDeleteComment || !deleteTarget || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/comments/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setComments((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setLoadError(err.message || "Delete failed");
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dashboard-isolate">
      <div className="db-app">
        <DashboardSidebar active="comments" />

        <main className="db-main">
          <div className="db-topbar">
            <div>
              <h1>Comments</h1>
              <p className="sub">
                {counts.all} comments · {counts.spam} spam
              </p>
            </div>
            <div className="db-topbar-right">
              <div className="db-search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  placeholder="Search comments, authors, articles…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <span className="db-role-chip" title="Moderation access">
                {currentUser?.role || "guest"}
              </span>
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
              {!canEditComment ? (
                <p className="db-comments-readonly-hint">
                  View only — sign in as manager or admin to update comments.
                </p>
              ) : isAdmin ? (
                <p className="db-comments-readonly-hint">
                  Comments go live immediately. You can edit, mark spam, or delete.
                </p>
              ) : (
                <p className="db-comments-readonly-hint">
                  Manager access — you can update comment text only.
                </p>
              )}
            </div>
          </div>

          <div className="db-panel">
            {loadError ? <p className="db-comments-empty">{loadError}</p> : null}
            {loading ? (
              <p className="db-comments-empty">Loading comments…</p>
            ) : visible.length === 0 ? (
              <p className="db-comments-empty">No comments match this filter.</p>
            ) : (
              <ul className="db-comments-manage-list">
                {visible.map((item) => (
                  <li key={item.id} className="db-comments-manage-item">
                    <div className="db-comments-manage-avatar" aria-hidden="true">
                      {item.initials}
                    </div>

                    <div className="db-comments-manage-body">
                      <div className="db-comments-manage-meta">
                        <p className="db-comments-manage-author">
                          {item.author}
                          <span className="email">{item.email}</span>
                        </p>
                        <span className={`db-badge ${item.status === "spam" ? "spam" : "published"}`}>
                          {statusLabel[item.status] || "Published"}
                        </span>
                      </div>

                      <p className="db-comments-manage-text">{item.text}</p>

                      <div className="db-comments-manage-foot">
                        <p className="db-comments-manage-article">
                          on{" "}
                          <Link href={`/dashboard/articles/${item.articleId}/edit`}>
                            {item.articleTitle}
                          </Link>
                        </p>
                        <span className="db-comments-manage-time">
                          {item.time} · {item.date}
                        </span>
                      </div>
                    </div>

                    {canEditComment ? (
                      <div className="db-row-actions db-comments-manage-actions">
                        <button
                          type="button"
                          className="db-row-action edit"
                          onClick={() => openEdit(item)}
                        >
                          Edit
                        </button>
                        {canDeleteComment ? (
                          <button
                            type="button"
                            className="db-row-action delete"
                            onClick={() => requestDelete(item)}
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            <div className="db-articles-footer">
              <span>
                Showing {visible.length} of {counts.all} comments
              </span>
            </div>
          </div>
        </main>
      </div>

      {editTarget ? (
        <div className="db-confirm-overlay" role="presentation" onClick={closeEdit}>
          <div
            className="db-confirm-modal db-comment-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-comment-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="edit-comment-title">Edit comment</h3>
            <p className="db-comment-edit-meta">
              {editTarget.author} · {editTarget.articleTitle}
            </p>

            <label className="db-field">
              Comment
              <textarea
                className="db-textarea"
                rows={4}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
            </label>

            {isAdmin ? (
              <label className="db-field">
                Status
                <select
                  className="db-select"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="published">Published</option>
                  <option value="spam">Spam</option>
                </select>
              </label>
            ) : null}

            <div className="db-confirm-actions">
              <button type="button" className="db-secondary-btn" onClick={closeEdit}>
                Cancel
              </button>
              <button
                type="button"
                className="db-new-post-btn"
                disabled={!editText.trim() || busy}
                onClick={saveEdit}
              >
                {busy ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget && canDeleteComment ? (
        <div className="db-confirm-overlay" role="presentation" onClick={cancelDelete}>
          <div
            className="db-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-comment-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-comment-title">Delete comment?</h3>
            <p>
              Remove the comment from <strong>{deleteTarget.author}</strong> on{" "}
              <strong>{deleteTarget.articleTitle}</strong>? This cannot be undone.
            </p>
            <div className="db-confirm-actions">
              <button type="button" className="db-secondary-btn" onClick={cancelDelete}>
                Cancel
              </button>
              <button
                type="button"
                className="db-confirm-delete-btn"
                onClick={confirmDelete}
                disabled={busy}
              >
                {busy ? "Deleting…" : "Delete comment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
