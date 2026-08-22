"use client";

import { useEffect, useRef, useState } from "react";
import { isLikelyImageFile } from "@/lib/imageUpload";
import DashboardSidebar from "../DashboardSidebar";
import "../dashboard.css";

const emptyForm = {
  name: "",
  role: "",
  image: "",
  bio: "",
  sortOrder: 0,
  isActive: true,
};

export default function DashboardTeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef(null);
  const uploadedRef = useRef(new Set());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/team-members")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Failed to load team members.");
        }
        if (!cancelled) {
          setMembers(Array.isArray(data.members) ? data.members : []);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error.message || "Failed to load team members.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function openAdd() {
    setModalMode("add");
    setEditTarget(null);
    setForm(emptyForm);
    setUploadError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function openEdit(item) {
    setModalMode("edit");
    setEditTarget(item);
    setForm({
      name: item.name,
      role: item.role,
      image: item.image || "",
      bio: item.bio || "",
      sortOrder: item.sortOrder || 0,
      isActive: item.isActive !== false,
    });
    setUploadError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function closeModal() {
    if (busy || uploading) return;
    setModalMode(null);
    setEditTarget(null);
    setForm(emptyForm);
    setUploadError("");
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function deleteUploadedImage(url) {
    const response = await fetch("/api/uploads/team", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Could not remove team image.");
    }
  }

  async function handleImageUpload(files) {
    setUploadError("");
    const file = [...(files || [])].find((item) => isLikelyImageFile(item));
    if (!file) {
      setUploadError("Please choose a JPG, PNG, WebP, GIF, AVIF, or BMP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image must be under 10MB.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/uploads/team", {
        method: "POST",
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not upload team image.");
      }

      const previous = form.image;
      uploadedRef.current.add(data.url);
      updateField("image", data.url);
      if (uploadedRef.current.has(previous)) {
        try {
          await deleteUploadedImage(previous);
          uploadedRef.current.delete(previous);
        } catch {
          setUploadError(
            "New image uploaded, but the previous temporary image could not be removed.",
          );
        }
      }
    } catch (error) {
      setUploadError(error.message || "Could not upload team image.");
    } finally {
      setUploading(false);
    }
  }

  async function clearImage() {
    setUploadError("");
    const imageUrl = form.image;
    if (!uploadedRef.current.has(imageUrl)) {
      updateField("image", "");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      await deleteUploadedImage(imageUrl);
      uploadedRef.current.delete(imageUrl);
      updateField("image", "");
      if (fileRef.current) fileRef.current.value = "";
    } catch (error) {
      setUploadError(error.message || "Could not remove team image.");
    } finally {
      setUploading(false);
    }
  }

  async function saveMember() {
    if (busy || uploading) return;
    setBusy(true);
    setLoadError("");
    try {
      const payload = {
        name: form.name.trim(),
        role: form.role.trim(),
        image: form.image.trim(),
        bio: form.bio.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        isActive: Boolean(form.isActive),
      };

      const url =
        modalMode === "edit" && editTarget
          ? `/api/team-members/${editTarget.id}`
          : "/api/team-members";
      const method = modalMode === "edit" ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not save team member.");
      }

      uploadedRef.current.delete(payload.image);
      if (modalMode === "edit") {
        setMembers((current) =>
          current.map((item) =>
            item.id === editTarget.id ? data.member : item,
          ),
        );
      } else {
        setMembers((current) => [...current, data.member]);
      }
      closeModal();
    } catch (error) {
      setLoadError(error.message || "Could not save team member.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || busy) return;
    setBusy(true);
    setLoadError("");
    try {
      const response = await fetch(`/api/team-members/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete team member.");
      }
      setMembers((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (error) {
      setLoadError(error.message || "Failed to delete team member.");
    } finally {
      setBusy(false);
    }
  }

  const activeCount = members.filter((item) => item.isActive).length;

  return (
    <div className="dashboard-isolate">
      <div className="db-app">
        <DashboardSidebar active="team" />

        <main className="db-main">
          <div className="db-topbar">
            <div>
              <h1>Team</h1>
              <p className="sub">
                Manage About Us team members. Photos upload to Cloudflare and
                appear on the public team section.
              </p>
            </div>
            <div className="db-topbar-right">
              <button type="button" className="db-new-post-btn" onClick={openAdd}>
                Add team member
              </button>
            </div>
          </div>

          <div className="db-panel">
            {loadError ? <p className="db-comments-empty">{loadError}</p> : null}
            {loading ? (
              <p className="db-comments-empty">Loading team members…</p>
            ) : members.length === 0 ? (
              <p className="db-comments-empty">
                No team members yet. Add the first profile for the About Us page.
              </p>
            ) : (
              <div className="db-table-wrap">
                <table className="db-articles-table db-people-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Designation</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="db-people-cell">
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.image}
                                alt=""
                                className="db-team-thumb"
                              />
                            ) : (
                              <span className="db-people-avatar" aria-hidden="true">
                                {item.name
                                  .split(/\s+/)
                                  .slice(0, 2)
                                  .map((part) => part[0]?.toUpperCase())
                                  .join("") || "T"}
                              </span>
                            )}
                            <div>
                              <p className="title">{item.name}</p>
                              {item.bio ? (
                                <p className="cat">{item.bio}</p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td>{item.role}</td>
                        <td>{item.sortOrder}</td>
                        <td>
                          <span
                            className={`db-badge ${item.isActive ? "published" : "draft"}`}
                          >
                            {item.isActive ? "Visible" : "Hidden"}
                          </span>
                        </td>
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
                {members.length} member{members.length === 1 ? "" : "s"} ·{" "}
                {activeCount} visible on About Us
              </span>
            </div>
          </div>
        </main>
      </div>

      {modalMode ? (
        <div className="db-confirm-overlay" role="presentation" onClick={closeModal}>
          <div
            className="db-confirm-modal db-comment-edit-modal db-team-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-member-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="team-member-title">
              {modalMode === "edit" ? "Edit team member" : "Add team member"}
            </h3>

            <div className="db-team-modal-body">
            <label className="db-field">
              Full name
              <input
                className="db-input"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Ayesha Khan"
                disabled={busy || uploading}
              />
            </label>

            <label className="db-field">
              Designation
              <input
                className="db-input"
                value={form.role}
                onChange={(event) => updateField("role", event.target.value)}
                placeholder="Founder & editor-in-chief"
                disabled={busy || uploading}
              />
            </label>

            <label className="db-field">
              Short bio (optional)
              <textarea
                className="db-textarea"
                value={form.bio}
                onChange={(event) => updateField("bio", event.target.value)}
                rows={2}
                placeholder="Internal note or short profile line"
                disabled={busy || uploading}
              />
            </label>

            <div className="db-field-row">
              <label className="db-field">
                Display order
                <input
                  className="db-input"
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(event) =>
                    updateField("sortOrder", event.target.value)
                  }
                  disabled={busy || uploading}
                />
              </label>
              <label className="db-field db-check" style={{ alignSelf: "end" }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    updateField("isActive", event.target.checked)
                  }
                  disabled={busy || uploading}
                />
                Show on About Us
              </label>
            </div>

            <div className="db-field">
              <span className="db-featured-label">Profile photo</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.avif,.bmp,.heic,.heif"
                className="sr-only"
                disabled={uploading || busy}
                onChange={(event) => {
                  handleImageUpload(event.target.files);
                  event.target.value = "";
                }}
              />
              {form.image ? (
                <div className="db-featured-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image} alt="Team preview" />
                  <div className="db-featured-preview-meta">
                    <p className="name">Team photo uploaded</p>
                    <div className="db-featured-preview-actions">
                      <button
                        type="button"
                        className="db-secondary-btn"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading || busy}
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        className="db-secondary-btn"
                        onClick={clearImage}
                        disabled={uploading || busy}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="db-secondary-btn"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || busy}
                >
                  {uploading ? "Uploading…" : "Upload photo"}
                </button>
              )}
              {uploadError ? (
                <p className="db-manager-add-error">{uploadError}</p>
              ) : null}
            </div>
            </div>

            <div className="db-confirm-actions">
              <button
                type="button"
                className="db-new-post-btn"
                onClick={saveMember}
                disabled={busy || uploading}
              >
                {busy ? "Saving…" : modalMode === "edit" ? "Save changes" : "Add member"}
              </button>
              <button
                type="button"
                className="db-secondary-btn"
                onClick={closeModal}
                disabled={busy || uploading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className="db-confirm-overlay"
          role="presentation"
          onClick={() => !busy && setDeleteTarget(null)}
        >
          <div
            className="db-confirm-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Delete team member?</h3>
            <p>
              Remove <strong>{deleteTarget.name}</strong> from the About Us team?
              Their Cloudflare photo will also be deleted.
            </p>
            <div className="db-confirm-actions">
              <button
                type="button"
                className="db-row-action delete"
                onClick={confirmDelete}
                disabled={busy}
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
              <button
                type="button"
                className="db-secondary-btn"
                onClick={() => setDeleteTarget(null)}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
