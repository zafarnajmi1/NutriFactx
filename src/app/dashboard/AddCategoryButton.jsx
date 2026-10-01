"use client";

import { useEffect, useState } from "react";

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
