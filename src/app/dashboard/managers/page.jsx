"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardSidebar from "../DashboardSidebar";
import { getDashboardSession } from "../../../lib/dashboardAuth";
import "../dashboard.css";

const roleLabel = {
  admin: "Admin",
  manager: "Manager",
};

const statusLabel = {
  active: "Active",
  inactive: "Inactive",
};

const emptyForm = {
  name: "",
  email: "",
  department: "Content",
  status: "active",
  role: "manager",
  password: "",
  confirmPassword: "",
};

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function validatePassword(password, { required = true } = {}) {
  if (!password) {
    return required ? "Password is required." : null;
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  return null;
}

export default function DashboardManagersPage() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [savedHint, setSavedHint] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/users");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not load users.");
      }
      const users = Array.isArray(data.users) ? data.users : [];
      setManagers(
        users.map((user) => ({
          ...user,
          password: user.hasPassword ? "••••••••" : "",
        })),
      );
    } catch (loadError) {
      setError(loadError.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentUser(getDashboardSession());
    loadUsers();
  }, [loadUsers]);

  const isAdmin = currentUser?.role === "admin";

  const counts = useMemo(() => {
    const managersOnly = managers.filter((m) => m.role === "manager");
    return {
      all: managers.length,
      manager: managersOnly.length,
      admin: managers.filter((m) => m.role === "admin").length,
      active: managers.filter((m) => m.status === "active").length,
      inactive: managers.filter((m) => m.status === "inactive").length,
    };
  }, [managers]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return managers.filter((item) => {
      let filterOk = true;
      if (filter === "manager" || filter === "admin") filterOk = item.role === filter;
      else if (filter === "active" || filter === "inactive") filterOk = item.status === filter;
      if (!filterOk) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q)
      );
    });
  }, [managers, filter, query]);

  function flash(message) {
    setSavedHint(message);
    window.setTimeout(() => setSavedHint(""), 3200);
  }

  function openAdd() {
    if (!isAdmin) return;
    setModalMode("add");
    setEditTarget(null);
    setForm(emptyForm);
    setShowPassword(false);
    setError("");
  }

  function openEdit(item) {
    if (!isAdmin) return;
    setModalMode("edit");
    setEditTarget(item);
    setForm({
      name: item.name,
      email: item.email,
      department: item.department,
      status: item.status,
      role: item.role,
      password: "",
      confirmPassword: "",
    });
    setShowPassword(false);
    setError("");
  }

  function closeModal() {
    setModalMode(null);
    setEditTarget(null);
    setForm(emptyForm);
    setError("");
    setShowPassword(false);
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!isAdmin || saving) return;

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const confirmPassword = form.confirmPassword;
    const isAdd = modalMode === "add";

    if (!name || !email) {
      setError("Name and email are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    const passwordError = validatePassword(password, { required: isAdd });
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        name,
        email,
        department: form.department,
        status: form.status,
        role: form.role,
        ...(password ? { password } : {}),
      };

      const url = isAdd
        ? "/api/dashboard/users"
        : `/api/dashboard/users/${editTarget.id}`;
      const method = isAdd ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not save user.");
      }

      await loadUsers();
      flash(
        isAdd
          ? `${roleLabel[form.role] || "User"} “${name}” added.`
          : password
            ? `“${name}” updated (password changed).`
            : `“${name}” updated.`,
      );
      closeModal();
    } catch (saveError) {
      setError(saveError.message || "Could not save user.");
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(item) {
    if (!isAdmin) return;
    if (
      String(currentUser?.email || "").toLowerCase() ===
      String(item.email).toLowerCase()
    ) {
      setError("You cannot remove your own account.");
      return;
    }
    setDeleteTarget(item);
  }

  function cancelDelete() {
    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (!isAdmin || !deleteTarget || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/users/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not remove user.");
      }
      await loadUsers();
      flash(`${roleLabel[deleteTarget.role] || "User"} “${deleteTarget.name}” removed.`);
      setDeleteTarget(null);
    } catch (deleteError) {
      setError(deleteError.message || "Could not remove user.");
    } finally {
      setSaving(false);
    }
  }

  const filters = [
    { key: "all", label: "All", count: counts.all },
    { key: "manager", label: "Managers", count: counts.manager },
    { key: "admin", label: "Admins", count: counts.admin },
    { key: "active", label: "Active", count: counts.active },
    { key: "inactive", label: "Inactive", count: counts.inactive },
  ];

  const isSelf = (item) =>
    String(currentUser?.email || "").toLowerCase() ===
    String(item.email).toLowerCase();

  return (
    <div className="dashboard-isolate">
      <div className="db-app">
        <DashboardSidebar active="managers" />

        <main className="db-main">
          <div className="db-topbar">
            <div>
              <h1>Managers</h1>
              <p className="sub">
                {counts.manager} managers · {counts.admin} admin · {counts.active} active
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
                  placeholder="Search name, email, department…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <span className="db-role-chip">{currentUser?.role || "guest"}</span>
              {isAdmin ? (
                <button type="button" className="db-new-post-btn" onClick={openAdd}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  Add user
                </button>
              ) : null}
            </div>
          </div>

          {savedHint ? <p className="db-form-hint db-managers-toast">{savedHint}</p> : null}
          {error && !modalMode ? <p className="db-manager-add-error">{error}</p> : null}

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
                    {item.label} ({item.count})
                  </button>
                ))}
              </div>
              <p className="db-comments-readonly-hint">
                {isAdmin
                  ? "Admin access — add admin or manager accounts, edit details, and set passwords."
                  : "Only admins can manage users."}
              </p>
            </div>
          </div>

          <div className="db-panel">
            {loading ? (
              <p className="db-comments-empty">Loading users…</p>
            ) : visible.length === 0 ? (
              <p className="db-comments-empty">No team members match this filter.</p>
            ) : (
              <div className="db-table-wrap">
                <table className="db-articles-table db-people-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Password</th>
                      <th>Joined</th>
                      {isAdmin ? <th className="db-articles-actions-col">Actions</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="db-people-cell">
                            <span className="db-people-avatar" aria-hidden="true">
                              {item.initials || initialsFromName(item.name)}
                            </span>
                            <div>
                              <p className="title">{item.name}</p>
                              <p className="cat">{item.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`db-badge role-${item.role}`}>
                            {roleLabel[item.role]}
                          </span>
                        </td>
                        <td>{item.department}</td>
                        <td>
                          <span className={`db-badge ${item.status}`}>
                            {statusLabel[item.status]}
                          </span>
                        </td>
                        <td>
                          <span className="db-password-mask" title="Password set">
                            {item.password ? "••••••••" : "Not set"}
                          </span>
                        </td>
                        <td>{item.joined}</td>
                        {isAdmin ? (
                          <td className="db-articles-actions-cell">
                            <div className="db-row-actions">
                              <button
                                type="button"
                                className="db-row-action edit"
                                onClick={() => openEdit(item)}
                              >
                                Edit
                              </button>
                              {isSelf(item) ? (
                                <span className="db-manager-locked">You</span>
                              ) : (
                                <button
                                  type="button"
                                  className="db-row-action delete"
                                  onClick={() => requestDelete(item)}
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="db-articles-footer">
              <span>
                Showing {visible.length} of {counts.all} team members
              </span>
            </div>
          </div>
        </main>
      </div>

      {modalMode ? (
        <div className="db-confirm-overlay" role="presentation" onClick={closeModal}>
          <div
            className="db-confirm-modal db-manager-add-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manager-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="manager-modal-title">
              {modalMode === "add" ? "Add user" : "Edit user"}
            </h3>
            <p className="db-comment-edit-meta">
              {modalMode === "add"
                ? "Create an admin or manager account and set their login password."
                : "Update details. Leave password blank to keep the current one."}
            </p>

            <form onSubmit={handleSave} className="db-manager-add-form">
              <label className="db-field">
                Full name
                <input
                  className="db-input"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Sara Malik"
                  required
                />
              </label>

              <label className="db-field">
                Work email
                <input
                  className="db-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="sara@nutrifactx.com"
                  required
                />
              </label>

              <div className="db-field-row">
                <label className="db-field">
                  Role
                  <select
                    className="db-select"
                    value={form.role}
                    onChange={(e) => updateField("role", e.target.value)}
                    disabled={modalMode === "edit" && isSelf(editTarget)}
                  >
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label className="db-field">
                  Department
                  <select
                    className="db-select"
                    value={form.department}
                    onChange={(e) => updateField("department", e.target.value)}
                  >
                    <option>Content</option>
                    <option>Editorial</option>
                    <option>SEO</option>
                    <option>Community</option>
                    <option>Marketing</option>
                  </select>
                </label>
              </div>

              <label className="db-field">
                Status
                <select
                  className="db-select"
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>

              <label className="db-field">
                {modalMode === "add" ? "Password" : "New password (optional)"}
                <div className="db-password-field">
                  <input
                    className="db-input"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder={modalMode === "add" ? "Min. 8 characters" : "Leave blank to keep current"}
                    autoComplete="new-password"
                    required={modalMode === "add"}
                  />
                  <button
                    type="button"
                    className="db-password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <label className="db-field">
                Confirm password
                <input
                  className="db-input"
                  type={showPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  required={modalMode === "add" || Boolean(form.password)}
                />
              </label>

              {error ? <p className="db-manager-add-error">{error}</p> : null}

              <div className="db-confirm-actions">
                <button type="button" className="db-secondary-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="db-new-post-btn" disabled={saving}>
                  {saving
                    ? "Saving…"
                    : modalMode === "add"
                      ? "Add user"
                      : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="db-confirm-overlay" role="presentation" onClick={cancelDelete}>
          <div
            className="db-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-manager-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-manager-title">Remove user?</h3>
            <p>
              Remove <strong>{deleteTarget.name}</strong> ({deleteTarget.email})? They
              will lose dashboard access.
            </p>
            <div className="db-confirm-actions">
              <button type="button" className="db-secondary-btn" onClick={cancelDelete}>
                Cancel
              </button>
              <button
                type="button"
                className="db-confirm-delete-btn"
                onClick={confirmDelete}
                disabled={saving}
              >
                Remove user
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
