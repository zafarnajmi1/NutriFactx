"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardSidebar from "../DashboardSidebar";
import "../dashboard.css";

const emptyContent = {
  eyebrow: "",
  title: "",
  description: "",
  body: "",
};

export default function DashboardPagesPage() {
  const [pages, setPages] = useState([]);
  const [activeKey, setActiveKey] = useState("privacy-policy");
  const [form, setForm] = useState(emptyContent);
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
        const response = await fetch("/api/site-pages");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Could not load pages.");
        }
        const nextPages = Array.isArray(data.pages) ? data.pages : [];
        if (!cancelled) {
          setPages(nextPages);
          const first = nextPages.find((p) => p.key === "privacy-policy") || nextPages[0];
          if (first?.content) {
            setActiveKey(first.key);
            setForm({
              eyebrow: first.content.eyebrow || "",
              title: first.content.title || "",
              description: first.content.description || "",
              body: first.content.body || "",
            });
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Could not load pages.");
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
    setForm({
      eyebrow: page.content?.eyebrow || "",
      title: page.content?.title || "",
      description: page.content?.description || "",
      body: page.content?.body || "",
    });
    setSaved(false);
    setError("");
  }

  function updateField(field, value) {
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
      const response = await fetch("/api/site-pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageKey: activeKey, content: form }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not save page.");
      }

      const content = data.content || form;
      setForm({
        eyebrow: content.eyebrow || "",
        title: content.title || "",
        description: content.description || "",
        body: content.body || "",
      });
      setPages((current) =>
        current.map((page) =>
          page.key === activeKey ? { ...page, content } : page,
        ),
      );
      setSaved(true);
    } catch (saveError) {
      setError(saveError.message || "Could not save page.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dashboard-isolate">
      <div className="db-app">
        <DashboardSidebar active="pages" />

        <main className="db-main">
          <div className="db-topbar">
            <div>
              <h1>Pages</h1>
              <p className="sub">
                Edit Privacy Policy and Terms of Use content shown on the public
                website.
              </p>
            </div>
          </div>

          <section className="db-panel db-composer-section">
            <div className="db-composer-section-head">
              <div>
                <h2>Legal page content</h2>
                <p>
                  Choose a page tab, edit the full content in one editor, then save.
                </p>
              </div>
            </div>

            <div className="db-seo-page-tabs" role="tablist" aria-label="Legal pages">
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
                  Hero eyebrow
                  <input
                    className="db-input"
                    value={form.eyebrow}
                    onChange={(e) => updateField("eyebrow", e.target.value)}
                    placeholder="Legal"
                    disabled={loading || saving}
                  />
                </label>
                <label className="db-field">
                  Page title
                  <input
                    className="db-input"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Privacy Policy"
                    disabled={loading || saving}
                    required
                  />
                </label>
              </div>

              <label className="db-field">
                Hero description
                <textarea
                  className="db-textarea"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={2}
                  placeholder="Last updated line shown under the title"
                  disabled={loading || saving}
                />
              </label>

              <label className="db-field">
                Page content
                <textarea
                  className="db-textarea"
                  value={form.body}
                  onChange={(e) => updateField("body", e.target.value)}
                  rows={18}
                  placeholder={"1. Section title\nSection paragraph text...\n\n2. Next section title\nNext section paragraph..."}
                  disabled={loading || saving}
                  required
                />
                <span className="db-field-hint">
                  One editor for the full page. Put each section title on its own line,
                  then the paragraph below it. Separate sections with a blank line.
                </span>
              </label>

              {error ? <p className="db-manager-add-error">{error}</p> : null}
              {saved ? (
                <p className="db-field-hint">Page content saved to the database.</p>
              ) : null}

              <div className="db-form-actions">
                <button
                  type="submit"
                  className="db-new-post-btn"
                  disabled={loading || saving || !activeKey}
                >
                  {loading ? "Loading…" : saving ? "Saving…" : "Save page"}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
