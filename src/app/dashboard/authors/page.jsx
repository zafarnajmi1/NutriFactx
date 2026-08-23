"use client";

import { useEffect, useRef, useState } from "react";
import { isLikelyImageFile } from "@/lib/imageUpload";
import DashboardSidebar from "../DashboardSidebar";
import "../dashboard.css";

const emptyForm = {
  name: "",
  slug: "",
  title: "",
  qualifications: "",
  credentials: "",
  showCredentials: true,
  education: "",
  experience: "",
  bio: "",
  image: "",
  sortOrder: 0,
  isActive: true,
};

export default function DashboardAuthorsPage() {
  const [authors, setAuthors] = useState([]);
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
    fetch("/api/authors")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Failed to load authors.");
        }
        if (!cancelled) {
          setAuthors(Array.isArray(data.authors) ? data.authors : []);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error.message || "Failed to load authors.");
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
      name: item.name || "",
      slug: item.slug || "",
      title: item.title || "",
      qualifications: item.qualifications || "",
      credentials: item.credentials || "",
      showCredentials: item.showCredentials !== false,
      education: item.education || "",
      experience: item.experience || "",
      bio: item.bio || "",
      image: item.image || "",
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
    const response = await fetch("/api/uploads/authors", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Could not remove author image.");
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
      const response = await fetch("/api/uploads/authors", {
        method: "POST",
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not upload author image.");
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
      setUploadError(error.message || "Could not upload author image.");
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
      setUploadError(error.message || "Could not remove author image.");
    } finally {
      setUploading(false);
    }
  }

  async function saveAuthor() {
    if (busy || uploading) return;
    setBusy(true);
    setLoadError("");
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        title: form.title.trim(),
        qualifications: form.qualifications.trim(),
        credentials: form.credentials.trim(),
        showCredentials: Boolean(form.showCredentials),
        education: form.education.trim(),
        experience: form.experience.trim(),
        bio: form.bio.trim(),
        image: form.image.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        isActive: Boolean(form.isActive),
      };

      const url =
        modalMode === "edit" && editTarget
          ? `/api/authors/${editTarget.id}`
          : "/api/authors";
      const method = modalMode === "edit" ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not save author.");
      }

      uploadedRef.current.delete(payload.image);
      if (modalMode === "edit") {
        setAuthors((current) =>
          current.map((item) =>
            item.id === editTarget.id ? data.author : item,
          ),
        );
      } else {
        setAuthors((current) => [...current, data.author]);
      }
      closeModal();
    } catch (error) {
      setLoadError(error.message || "Could not save author.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || busy) return;
    setBusy(true);
    setLoadError("");
    try {
      const response = await fetch(`/api/authors/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete author.");
      }
      setAuthors((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (error) {
      setLoadError(error.message || "Failed to delete author.");
    } finally {
      setBusy(false);
    }
  }

  const activeCount = authors.filter((item) => item.isActive).length;

  return (
    <div className="dashboard-isolate">
      <div className="db-app">
        <DashboardSidebar active="authors" />

        <main className="db-main">
          <div className="db-topbar">
            <div>
              <h1>Authors</h1>
              <p className="sub">
                Author bios for article bylines (E-E-A-T). Degrees, certifications,
                and experience appear on public author pages.
              </p>
            </div>
            <div className="db-topbar-right">
              <button type="button" className="db-new-post-btn" onClick={openAdd}>
                Add author
              </button>
            </div>
          </div>

          <div className="db-panel">
            {loadError ? <p className="db-comments-empty">{loadError}</p> : null}
            {loading ? (
              <p className="db-comments-empty">Loading authors…</p>
            ) : authors.length === 0 ? (
              <p className="db-comments-empty">
                No authors yet. Add profiles so articles can link to a bio page.
              </p>
            ) : (
              <div className="db-table-wrap">
                <table className="db-articles-table db-people-table">
                  <thead>
                    <tr>
                      <th>Author</th>
                      <th>Qualifications</th>
                      <th>Slug</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {authors.map((item) => (
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
                                  .join("") || "A"}
                              </span>
                            )}
                            <div>
                              <p className="title">{item.name}</p>
                              <p className="cat">{item.title || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td>{item.qualifications || "—"}</td>
                        <td>/authors/{item.slug}</td>
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
                {authors.length} author{authors.length === 1 ? "" : "s"} ·{" "}
                {activeCount} visible on the website
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
            aria-labelledby="author-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="author-modal-title">
              {modalMode === "edit" ? "Edit author" : "Add author"}
            </h3>

            <div className="db-team-modal-body">
              <label className="db-field">
                Full name
                <input
                  className="db-input"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Dr Kainat Fatima"
                  disabled={busy || uploading}
                />
              </label>

              <label className="db-field">
                URL slug
                <input
                  className="db-input"
                  value={form.slug}
                  onChange={(event) => updateField("slug", event.target.value)}
                  placeholder="dr-kainat-fatima (auto if empty)"
                  disabled={busy || uploading}
                />
              </label>

              <label className="db-field">
                Title / role
                <input
                  className="db-input"
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="Registered Dietitian · Clinical Nutritionist"
                  disabled={busy || uploading}
                />
              </label>

              <label className="db-field">
                Qualifications
                <input
                  className="db-input"
                  value={form.qualifications}
                  onChange={(event) =>
                    updateField("qualifications", event.target.value)
                  }
                  placeholder="RD, MSc Nutrition"
                  disabled={busy || uploading}
                />
              </label>

              <label className="db-field">
                Education / degrees
                <textarea
                  className="db-textarea"
                  value={form.education}
                  onChange={(event) => updateField("education", event.target.value)}
                  rows={2}
                  placeholder="MSc Human Nutrition, University…"
                  disabled={busy || uploading}
                />
              </label>

              <label className="db-field">
                Certifications
                <textarea
                  className="db-textarea"
                  value={form.credentials}
                  onChange={(event) =>
                    updateField("credentials", event.target.value)
                  }
                  rows={2}
                  placeholder="Licenses and board certifications"
                  disabled={busy || uploading}
                />
              </label>
              <label className="db-field db-check">
                <input
                  type="checkbox"
                  checked={form.showCredentials}
                  onChange={(event) =>
                    updateField("showCredentials", event.target.checked)
                  }
                  disabled={busy || uploading}
                />
                Show certifications on author profile
              </label>

              <label className="db-field">
                Experience
                <textarea
                  className="db-textarea"
                  value={form.experience}
                  onChange={(event) => updateField("experience", event.target.value)}
                  rows={3}
                  placeholder="Years of practice, specialties, clinical background"
                  disabled={busy || uploading}
                />
              </label>

              <label className="db-field">
                Full bio
                <textarea
                  className="db-textarea"
                  value={form.bio}
                  onChange={(event) => updateField("bio", event.target.value)}
                  rows={4}
                  placeholder="Detailed author biography for the public bio page"
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
                  Visible on website
                </label>
              </div>

              <div className="db-field">
                <span className="db-featured-label">Author photo</span>
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
                    <img src={form.image} alt="Author preview" />
                    <div className="db-featured-preview-meta">
                      <p className="name">Author photo uploaded</p>
                      <div className="db-featured-preview-actions">
                        <button
                          type="button"
                          className="db-secondary-btn"
                          disabled={uploading || busy}
                          onClick={() => fileRef.current?.click()}
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          className="db-secondary-btn"
                          disabled={uploading || busy}
                          onClick={clearImage}
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
                    disabled={uploading || busy}
                    onClick={() => fileRef.current?.click()}
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
                className="db-secondary-btn"
                onClick={closeModal}
                disabled={busy || uploading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="db-new-post-btn"
                onClick={saveAuthor}
                disabled={busy || uploading || !form.name.trim()}
              >
                {busy ? "Saving…" : "Save author"}
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
            <h3>Delete author?</h3>
            <p>
              Remove <strong>{deleteTarget.name}</strong>? Articles keep their
              byline text; the bio page link will stop working.
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
                className="db-row-action delete"
                onClick={confirmDelete}
                disabled={busy}
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
