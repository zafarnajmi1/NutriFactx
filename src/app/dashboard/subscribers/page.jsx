"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardSidebar from "../DashboardSidebar";
import "../dashboard.css";

const statusLabel = {
  active: "Active",
  paused: "Paused",
  unsubscribed: "Unsubscribed",
};

const planLabel = {
  weekly: "Weekly digest",
  monthly: "Monthly roundup",
};

const filters = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "paused", label: "Paused" },
  { key: "unsubscribed", label: "Unsubscribed" },
];

export default function DashboardSubscribersPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("all");
  const [plan, setPlan] = useState("all");
  const [query, setQuery] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/subscribers")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Failed to load subscribers.");
        }
        if (!cancelled) {
          setSubscribers(
            Array.isArray(data.subscribers) ? data.subscribers : [],
          );
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error.message || "Failed to load subscribers.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(
    () => ({
      all: subscribers.length,
      active: subscribers.filter((item) => item.status === "active").length,
      paused: subscribers.filter((item) => item.status === "paused").length,
      unsubscribed: subscribers.filter(
        (item) => item.status === "unsubscribed",
      ).length,
    }),
    [subscribers],
  );

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return subscribers.filter((item) => {
      const statusMatches = filter === "all" || item.status === filter;
      const planMatches = plan === "all" || item.plan === plan;
      if (!statusMatches || !planMatches) return false;
      if (!search) return true;
      return (
        item.name.toLowerCase().includes(search) ||
        item.email.toLowerCase().includes(search) ||
        item.source.toLowerCase().includes(search)
      );
    });
  }, [subscribers, filter, plan, query]);

  function openEdit(item) {
    setLoadError("");
    setEditTarget(item);
    setEditForm({
      name: item.name,
      email: item.email,
      plan: item.plan,
      status: item.status,
      source: item.source,
    });
  }

  function closeEdit() {
    if (busy) return;
    setEditTarget(null);
    setEditForm(null);
  }

  async function saveEdit() {
    if (!editTarget || !editForm || busy) return;
    setBusy(true);
    setLoadError("");
    try {
      const response = await fetch(`/api/subscribers/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to update subscriber.");
      }
      setSubscribers((current) =>
        current.map((item) =>
          item.id === editTarget.id ? data.subscriber : item,
        ),
      );
      setEditTarget(null);
      setEditForm(null);
    } catch (error) {
      setLoadError(error.message || "Failed to update subscriber.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || busy) return;
    setBusy(true);
    setLoadError("");
    try {
      const response = await fetch(`/api/subscribers/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete subscriber.");
      }
      setSubscribers((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (error) {
      setLoadError(error.message || "Failed to delete subscriber.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dashboard-isolate">
      <div className="db-app">
        <DashboardSidebar active="subscribers" />

        <main className="db-main">
          <div className="db-topbar">
            <div>
              <h1>Subscribers</h1>
              <p className="sub">
                {counts.all} subscribers · {counts.active} active ·{" "}
                {counts.paused} paused
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
                  placeholder="Search name, email, source…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
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
                  value={plan}
                  onChange={(event) => setPlan(event.target.value)}
                >
                  <option value="all">All plans</option>
                  <option value="weekly">Weekly digest</option>
                  <option value="monthly">Monthly roundup</option>
                </select>
              </div>
            </div>
          </div>

          <div className="db-panel">
            {loadError ? <p className="db-comments-empty">{loadError}</p> : null}
            {loading ? (
              <p className="db-comments-empty">Loading subscribers…</p>
            ) : visible.length === 0 ? (
              <p className="db-comments-empty">
                No subscribers match this filter.
              </p>
            ) : (
              <div className="db-table-wrap">
                <table className="db-articles-table db-people-table">
                  <thead>
                    <tr>
                      <th>Subscriber</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Source</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="db-people-cell">
                            <span className="db-people-avatar" aria-hidden="true">
                              {item.initials}
                            </span>
                            <div>
                              <p className="title">{item.name}</p>
                              <p className="cat">{item.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>{planLabel[item.plan]}</td>
                        <td>
                          <span className={`db-badge ${item.status}`}>
                            {statusLabel[item.status]}
                          </span>
                        </td>
                        <td>{item.source}</td>
                        <td>{item.joined}</td>
                        <td>
                          <div className="db-row-actions">
                            <button
                              type="button"
                              className="db-row-action edit"
                              onClick={() => openEdit(item)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="db-row-action delete"
                              onClick={() => setDeleteTarget(item)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="db-articles-footer">
              <span>
                Showing {visible.length} of {counts.all} subscribers
              </span>
            </div>
          </div>
        </main>
      </div>

      {editTarget && editForm ? (
        <div className="db-confirm-overlay" role="presentation" onClick={closeEdit}>
          <div
            className="db-confirm-modal db-comment-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-subscriber-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="edit-subscriber-title">Edit subscriber</h3>
            <label className="db-field">
              Name
              <input
                className="db-input"
                value={editForm.name}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>
            <label className="db-field">
              Email
              <input
                className="db-input"
                type="email"
                value={editForm.email}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </label>
            <label className="db-field">
              Plan
              <select
                className="db-select"
                value={editForm.plan}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    plan: event.target.value,
                  }))
                }
              >
                <option value="weekly">Weekly digest</option>
                <option value="monthly">Monthly roundup</option>
              </select>
            </label>
            <label className="db-field">
              Status
              <select
                className="db-select"
                value={editForm.status}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="unsubscribed">Unsubscribed</option>
              </select>
            </label>
            <label className="db-field">
              Source
              <input
                className="db-input"
                value={editForm.source}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    source: event.target.value,
                  }))
                }
              />
            </label>

            {loadError ? (
              <p className="db-manager-add-error">{loadError}</p>
            ) : null}

            <div className="db-confirm-actions">
              <button
                type="button"
                className="db-secondary-btn"
                onClick={closeEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                className="db-new-post-btn"
                onClick={saveEdit}
                disabled={
                  busy || !editForm.name.trim() || !editForm.email.trim()
                }
              >
                {busy ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className="db-confirm-overlay"
          role="presentation"
          onClick={() => {
            if (!busy) setDeleteTarget(null);
          }}
        >
          <div
            className="db-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-subscriber-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="delete-subscriber-title">Delete subscriber?</h3>
            <p>
              Remove <strong>{deleteTarget.name}</strong> (
              {deleteTarget.email})? This cannot be undone.
            </p>
            <div className="db-confirm-actions">
              <button
                type="button"
                className="db-secondary-btn"
                onClick={() => setDeleteTarget(null)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="db-confirm-delete-btn"
                onClick={confirmDelete}
                disabled={busy}
              >
                {busy ? "Deleting…" : "Delete subscriber"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
