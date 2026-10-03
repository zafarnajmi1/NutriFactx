"use client";

import { useEffect, useState } from "react";

export function ManageCategoriesButton({ onChanged, compact = false }) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setEditing("");
      setDraft("");
      setDeleteTarget("");
      setError("");
      setSaving(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch("/api/categories")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Failed to load categories.");
        if (!cancelled) setCategories(Array.isArray(data.categories) ? data.categories : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load categories.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  function close() {
    if (saving) return;
    setOpen(false);
  }

  async function saveEdit(oldName) {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: oldName, newName: draft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to edit category.");
      setCategories((prev) =>
        [...new Set(prev.map((item) => (item === oldName ? data.name : item)))].sort(
          (left, right) => left.localeCompare(right),
        ),
      );
      setEditing("");
      setDraft("");
      onChanged?.({ type: "rename", from: oldName, to: data.name });
    } catch (err) {
      setError(err.message || "Failed to edit category.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (saving || !deleteTarget) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deleteTarget }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete category.");
      setCategories((prev) => prev.filter((item) => item !== deleteTarget));
      onChanged?.({
        type: "delete",
        from: deleteTarget,
        to: data.movedTo,
      });
      setDeleteTarget("");
    } catch (err) {
      setError(err.message || "Failed to delete category.");
    } finally {
      setSaving(false);
    }
  }

  const fallback =
    categories.find((item) => item !== deleteTarget) || "another category";

  return (
    <>
      <button
        type="button"
        className={compact ? "db-add-category-btn" : "db-secondary-btn"}
        onClick={() => setOpen(true)}
      >
        {compact ? "Edit / Delete" : "Manage categories"}
      </button>
      {open ? (
        <div className="db-confirm-overlay" role="presentation" onClick={close}>
          <div
            className="db-confirm-modal db-category-modal db-category-manage-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-categories-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="manage-categories-title">
              {deleteTarget ? "Delete category" : "Edit or delete category"}
            </h3>
            {deleteTarget ? (
              <>
                <p className="db-add-category-note">
                  Delete “{deleteTarget}”? Articles in this category will move
                  to “{fallback}”. Header, search, and topic pages will update.
                </p>
                {error ? <p className="db-add-category-error">{error}</p> : null}
                <div className="db-confirm-actions">
                  <button
                    type="button"
                    className="db-secondary-btn"
                    onClick={() => {
                      if (saving) return;
                      setDeleteTarget("");
                      setError("");
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="db-confirm-delete-btn"
                    onClick={confirmDelete}
                    disabled={saving}
                  >
                    {saving ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </>
            ) : (
              <>
                {loading ? <p className="db-add-category-note">Loading…</p> : null}
                <div className="db-category-manage-list">
                  {categories.map((name) => (
                    <div key={name} className="db-category-manage-row">
                      {editing === name ? (
                        <>
                          <input
                            className="db-input"
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            autoFocus
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                saveEdit(name);
                              }
                              if (event.key === "Escape") {
                                setEditing("");
                                setDraft("");
                              }
                            }}
                          />
                          <div className="db-row-actions">
                            <button
                              type="button"
                              className="db-row-action edit"
                              onClick={() => saveEdit(name)}
                              disabled={saving}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="db-row-action"
                              onClick={() => {
                                setEditing("");
                                setDraft("");
                              }}
                              disabled={saving}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span>{name}</span>
                          <div className="db-row-actions">
                            <button
                              type="button"
                              className="db-row-action edit"
                              onClick={() => {
                                setEditing(name);
                                setDraft(name);
                                setError("");
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="db-row-action delete"
                              onClick={() => {
                                setDeleteTarget(name);
                                setError("");
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {error ? <p className="db-add-category-error">{error}</p> : null}
                <div className="db-confirm-actions">
                  <button
                    type="button"
                    className="db-secondary-btn"
                    onClick={close}
                    disabled={saving}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function AddCategoryButton({ onAdded, compact = false }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
      setError("");
      setSaving(false);
    }
  }, [open]);

  function close() {
    if (saving) return;
    setOpen(false);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to add category.");
      onAdded?.(data.name);
      setOpen(false);
    } catch (err) {
      setError(err.message || "Failed to add category.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={compact ? "db-add-category-btn" : "db-new-post-btn"}
        onClick={() => setOpen(true)}
      >
        Add category
      </button>
      {open ? (
        <div
          className="db-confirm-overlay"
          role="presentation"
          onClick={close}
        >
          <div
            className="db-confirm-modal db-category-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-category-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="add-category-title">Add category</h3>
            <input
              className="db-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Category name"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  save();
                }
                if (event.key === "Escape") close();
              }}
            />
            {error ? <p className="db-add-category-error">{error}</p> : null}
            <div className="db-confirm-actions">
              <button
                type="button"
                className="db-secondary-btn"
                onClick={close}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="db-new-post-btn"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
