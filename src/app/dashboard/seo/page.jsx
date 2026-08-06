"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardSidebar from "../DashboardSidebar";
import "../dashboard.css";

const emptySeo = {
  metaTitle: "",
  metaDescription: "",
  focusKeyword: "",
  keywords: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  twitterTitle: "",
  twitterDescription: "",
  twitterImage: "",
  robotsIndex: true,
  robotsFollow: true,
  schemaType: "WebPage",
};

export default function DashboardSeoPage() {
  const [pages, setPages] = useState([]);
  const [activeKey, setActiveKey] = useState("home");
  const [form, setForm] = useState(emptySeo);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const activePage = useMemo(
    () => pages.find((page) => page.key === activeKey) || null,
    [pages, activeKey],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadPages() {
      try {
        const response = await fetch("/api/site-seo");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Could not load SEO settings.");
        }
        const nextPages = Array.isArray(data.pages) ? data.pages : [];
        if (!cancelled) {
          setPages(nextPages);
          const first = nextPages[0];
          if (first) {
            setActiveKey(first.key);
            setForm({ ...emptySeo, ...(first.seo || {}) });
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Could not load SEO settings.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadPages();
    return () => {
      cancelled = true;
    };
  }, []);

  function selectPage(page) {
    setActiveKey(page.key);
    setForm({ ...emptySeo, ...(page.seo || {}) });
    setSaved(false);
    setError("");
  }

  function update(field, value) {
    setSaved(false);
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving || !activeKey) return;
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const response = await fetch("/api/site-seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageKey: activeKey, seo: form }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not save SEO settings.");
      }

      setForm({ ...emptySeo, ...(data.seo || {}) });
      setPages((current) =>
        current.map((page) =>
          page.key === activeKey
            ? { ...page, seo: { ...emptySeo, ...(data.seo || {}) } }
            : page,
        ),
      );
      setSaved(true);
    } catch (saveError) {
      setError(saveError.message || "Could not save SEO settings.");
    } finally {
      setSaving(false);
    }
  }

  const schemaOptions = activePage?.schemaOptions || [
    "WebPage",
    "WebSite",
    "CollectionPage",
    "AboutPage",
    "ContactPage",
  ];

  return (
    <div className="dashboard-isolate">
      <div className="db-app">
        <DashboardSidebar active="seo" />

        <main className="db-main">
          <div className="db-topbar">
            <div>
              <h1>SEO</h1>
              <p className="sub">
                Manage Google and social metadata for every public website page.
                Strong titles and descriptions help pages rank and earn AdSense
                traffic. Article SEO is still edited on each article.
              </p>
            </div>
          </div>

          <section className="db-panel db-composer-section">
            <div className="db-composer-section-head">
              <div>
                <h2>Page SEO settings</h2>
                <p>
                  Fill title, description, keywords, Open Graph, Twitter, robots,
                  and schema for stronger search visibility.
                </p>
              </div>
            </div>

            <div className="db-seo-page-tabs" role="tablist" aria-label="Website pages">
              {pages.map((page) => (
                <button
                  key={page.key}
                  type="button"
                  role="tab"
                  aria-selected={page.key === activeKey}
                  className={`db-seo-page-tab${page.key === activeKey ? " active" : ""}`}
                  onClick={() => selectPage(page)}
                  disabled={loading || saving}
                >
                  {page.label}
                </button>
              ))}
            </div>

            <form className="db-form" onSubmit={handleSubmit}>
              {activePage ? (
                <p className="db-field-hint">
                  Editing <strong>{activePage.label}</strong> · path{" "}
                  <code>{activePage.path}</code>
                </p>
              ) : null}

              <div className="db-field-row">
                <label className="db-field">
                  SEO title
                  <input
                    className="db-input"
                    value={form.metaTitle}
                    onChange={(e) => update("metaTitle", e.target.value)}
                    placeholder="Primary Google title"
                    maxLength={70}
                    disabled={loading || saving}
                  />
                  <span className="db-field-hint">
                    {form.metaTitle.length}/60 recommended
                  </span>
                </label>
                <label className="db-field">
                  Focus keyword
                  <input
                    className="db-input"
                    value={form.focusKeyword}
                    onChange={(e) => update("focusKeyword", e.target.value)}
                    placeholder="Main phrase to rank for"
                    disabled={loading || saving}
                  />
                </label>
              </div>

              <label className="db-field">
                Meta description
                <textarea
                  className="db-textarea"
                  value={form.metaDescription}
                  onChange={(e) => update("metaDescription", e.target.value)}
                  rows={3}
                  placeholder="Compelling summary for Google results (120–160 characters)"
                  maxLength={180}
                  disabled={loading || saving}
                />
                <span className="db-field-hint">
                  {form.metaDescription.length}/160 recommended
                </span>
              </label>

              <label className="db-field">
                Keywords
                <input
                  className="db-input"
                  value={form.keywords}
                  onChange={(e) => update("keywords", e.target.value)}
                  placeholder="Comma-separated keywords"
                  disabled={loading || saving}
                />
              </label>

              <label className="db-field">
                Canonical URL
                <input
                  className="db-input"
                  value={form.canonicalUrl}
                  onChange={(e) => update("canonicalUrl", e.target.value)}
                  placeholder="https://nutrifactx.com/ or /blogs"
                  disabled={loading || saving}
                />
              </label>

              <div className="db-field-row">
                <label className="db-field">
                  Open Graph title
                  <input
                    className="db-input"
                    value={form.ogTitle}
                    onChange={(e) => update("ogTitle", e.target.value)}
                    placeholder="Defaults to SEO title"
                    disabled={loading || saving}
                  />
                </label>
                <label className="db-field">
                  Schema type
                  <select
                    className="db-select"
                    value={form.schemaType}
                    onChange={(e) => update("schemaType", e.target.value)}
                    disabled={loading || saving}
                  >
                    {schemaOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="db-field">
                Open Graph description
                <textarea
                  className="db-textarea"
                  value={form.ogDescription}
                  onChange={(e) => update("ogDescription", e.target.value)}
                  rows={2}
                  placeholder="Defaults to meta description"
                  disabled={loading || saving}
                />
              </label>

              <label className="db-field">
                Open Graph image URL
                <input
                  className="db-input"
                  value={form.ogImage}
                  onChange={(e) => update("ogImage", e.target.value)}
                  placeholder="/apple-touch-icon.png or full HTTPS URL"
                  disabled={loading || saving}
                />
              </label>

              <div className="db-field-row">
                <label className="db-field">
                  Twitter title
                  <input
                    className="db-input"
                    value={form.twitterTitle}
                    onChange={(e) => update("twitterTitle", e.target.value)}
                    placeholder="Defaults to Open Graph title"
                    disabled={loading || saving}
                  />
                </label>
                <label className="db-field">
                  Twitter image URL
                  <input
                    className="db-input"
                    value={form.twitterImage}
                    onChange={(e) => update("twitterImage", e.target.value)}
                    placeholder="Defaults to Open Graph image"
                    disabled={loading || saving}
                  />
                </label>
              </div>

              <label className="db-field">
                Twitter description
                <textarea
                  className="db-textarea"
                  value={form.twitterDescription}
                  onChange={(e) => update("twitterDescription", e.target.value)}
                  rows={2}
                  placeholder="Defaults to Open Graph description"
                  disabled={loading || saving}
                />
              </label>

              <div className="db-seo-robots">
                <label className="db-check">
                  <input
                    type="checkbox"
                    checked={form.robotsIndex}
                    onChange={(e) => update("robotsIndex", e.target.checked)}
                    disabled={loading || saving}
                  />
                  Allow indexing (index)
                </label>
                <label className="db-check">
                  <input
                    type="checkbox"
                    checked={form.robotsFollow}
                    onChange={(e) => update("robotsFollow", e.target.checked)}
                    disabled={loading || saving}
                  />
                  Follow links (follow)
                </label>
              </div>

              {error ? <p className="db-manager-add-error">{error}</p> : null}
              {saved ? (
                <p className="db-field-hint">
                  SEO settings saved and applied on the website.
                </p>
              ) : null}

              <div className="db-form-actions">
                <button
                  type="submit"
                  className="db-new-post-btn"
                  disabled={loading || saving || !activeKey}
                >
                  {loading ? "Loading…" : saving ? "Saving…" : "Save SEO"}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
