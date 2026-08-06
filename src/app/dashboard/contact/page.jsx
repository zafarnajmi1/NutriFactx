"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardSidebar from "../DashboardSidebar";
import { getDashboardSession } from "../../../lib/dashboardAuth";
import "../dashboard.css";

const statusLabel = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};

const filters = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "read", label: "Read" },
  { key: "replied", label: "Replied" },
  { key: "archived", label: "Archived" },
];

export default function DashboardContactPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [viewTarget, setViewTarget] = useState(null);
  const [editStatus, setEditStatus] = useState("new");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/contact");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load messages");
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (err) {
      setLoadError(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentUser(getDashboardSession());
    loadMessages();
  }, [loadMessages]);

  const isAdmin = currentUser?.role === "admin";

  const counts = useMemo(() => {
    return {
      all: messages.length,
      new: messages.filter((m) => m.status === "new").length,
      read: messages.filter((m) => m.status === "read").length,
      replied: messages.filter((m) => m.status === "replied").length,
      archived: messages.filter((m) => m.status === "archived").length,
    };
  }, [messages]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter((item) => {
      const statusOk = filter === "all" || item.status === filter;
      if (!statusOk) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q)
      );
    });
  }, [messages, filter, query]);

  async function openView(item) {
    setViewTarget(item);
    setEditStatus(item.status);

    if (item.status === "new") {
      try {
        const res = await fetch(`/api/contact/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "read" }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.message) {
          setMessages((prev) =>
            prev.map((row) => (row.id === item.id ? data.message : row)),
          );
          setViewTarget(data.message);
          setEditStatus(data.message.status);
        }
      } catch {
        /* ignore mark-read errors */
      }
    }
  }

  function closeView() {
    setViewTarget(null);
  }

  async function saveStatus() {
    if (!viewTarget || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/contact/${viewTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Update failed");
      setMessages((prev) =>
        prev.map((item) => (item.id === viewTarget.id ? data.message : item)),
      );
      closeView();
    } catch (err) {
      setLoadError(err.message || "Update failed");
    } finally {
      setBusy(false);
    }
  }

  function requestDelete(item) {
    if (!isAdmin) return;
    setDeleteTarget(item);
  }

  function cancelDelete() {
    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (!isAdmin || !deleteTarget || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/contact/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setMessages((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      if (viewTarget?.id === deleteTarget.id) closeView();
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
        <DashboardSidebar active="contact" />

        <main className="db-main">
          <div className="db-topbar">
            <div>
              <h1>Contact messages</h1>
              <p className="sub">
                {counts.all} messages · {counts.new} new
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
                  placeholder="Search name, email, topic, message…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <span className="db-role-chip" title="Access">
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
              <p className="db-comments-readonly-hint">
                Messages submitted from the website Contact Us form.
              </p>
            </div>
          </div>

          <div className="db-panel">
            {loadError ? <p className="db-comments-empty">{loadError}</p> : null}
            {loading ? (
              <p className="db-comments-empty">Loading messages…</p>
            ) : visible.length === 0 ? (
              <p className="db-comments-empty">No contact messages match this filter.</p>
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
                          {item.name}
                          <span className="email">{item.email}</span>
                        </p>
                        <span className={`db-badge ${item.status === "new" ? "review" : item.status === "replied" ? "published" : item.status === "archived" ? "draft" : "pending"}`}>
                          {statusLabel[item.status] || item.status}
                        </span>
                      </div>

                      <p className="db-comments-manage-text">{item.text}</p>

                      <div className="db-comments-manage-foot">
                        <p className="db-comments-manage-article">
                          Topic: {item.topic}
                        </p>
                        <span className="db-comments-manage-time">
                          {item.time} · {item.date}
                        </span>
                      </div>
                    </div>

                    <div className="db-row-actions db-comments-manage-actions">
                      <button
                        type="button"
                        className="db-row-action edit"
                        onClick={() => openView(item)}
                      >
                        View
                      </button>
                      {isAdmin ? (
                        <button
                          type="button"
                          className="db-row-action delete"
                          onClick={() => requestDelete(item)}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="db-articles-footer">
              <span>
                Showing {visible.length} of {counts.all} messages
              </span>
            </div>
          </div>
        </main>
      </div>

      {viewTarget ? (
        <div className="db-confirm-overlay" role="presentation" onClick={closeView}>
          <div
            className="db-confirm-modal db-comment-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-contact-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="view-contact-title">Contact message</h3>
            <p className="db-comment-edit-meta">
              {viewTarget.name} · {viewTarget.email} · {viewTarget.topic}
            </p>

            <label className="db-field">
              Message
              <textarea
                className="db-textarea"
                rows={5}
                value={viewTarget.text}
                readOnly
              />
            </label>

            <label className="db-field">
              Status
              <select
                className="db-select"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
                <option value="archived">Archived</option>
              </select>
            </label>

            <div className="db-confirm-actions">
              <button type="button" className="db-secondary-btn" onClick={closeView}>
                Close
              </button>
              <button
                type="button"
                className="db-new-post-btn"
                disabled={busy}
                onClick={saveStatus}
              >
                {busy ? "Saving…" : "Save status"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget && isAdmin ? (
        <div className="db-confirm-overlay" role="presentation" onClick={cancelDelete}>
          <div
            className="db-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-contact-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-contact-title">Delete message?</h3>
            <p>
              Remove the message from <strong>{deleteTarget.name}</strong>? This cannot be
              undone.
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
                {busy ? "Deleting…" : "Delete message"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
