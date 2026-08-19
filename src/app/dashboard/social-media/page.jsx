"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "../DashboardSidebar";
import "../dashboard.css";

const platforms = [
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://www.facebook.com/nutrifactx",
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://www.instagram.com/nutrifactx",
  },
  {
    key: "x",
    label: "X (Twitter)",
    placeholder: "https://x.com/nutrifactx",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "https://www.linkedin.com/company/nutrifactx",
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://www.youtube.com/@nutrifactx",
  },
  {
    key: "pinterest",
    label: "Pinterest",
    placeholder: "https://www.pinterest.com/nutrifactx",
  },
  {
    key: "reddit",
    label: "Reddit",
    placeholder: "https://www.reddit.com/user/nutrifactx",
  },
];

const emptyLinks = Object.fromEntries(
  platforms.map((platform) => [platform.key, ""]),
);

export default function DashboardSocialMediaPage() {
  const [links, setLinks] = useState(emptyLinks);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadLinks() {
      try {
        const response = await fetch("/api/social-links");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Could not load social links.");
        }
        if (!cancelled) setLinks({ ...emptyLinks, ...(data.links || {}) });
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Could not load social links.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadLinks();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const response = await fetch("/api/social-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not save social links.");
      }
      setLinks({ ...emptyLinks, ...(data.links || {}) });
      setSaved(true);
    } catch (saveError) {
      setError(saveError.message || "Could not save social links.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dashboard-isolate">
      <div className="db-app">
        <DashboardSidebar active="social-media" />

        <main className="db-main">
          <div className="db-topbar">
            <div>
              <h1>Social media</h1>
              <p className="sub">
                Manage the social profile links shown in the website footer and
                contact page.
              </p>
            </div>
          </div>

          <section className="db-panel db-composer-section">
            <div className="db-composer-section-head">
              <div>
                <h2>Social profile links</h2>
                <p>
                  Leave a field empty to hide that icon from the footer and
                  contact page.
                </p>
              </div>
            </div>

            <form className="db-form" onSubmit={handleSubmit}>
              {platforms.map((platform) => (
                <label className="db-field" key={platform.key}>
                  {platform.label}
                  <input
                    className="db-input"
                    type="url"
                    value={links[platform.key]}
                    onChange={(event) => {
                      setSaved(false);
                      setLinks((current) => ({
                        ...current,
                        [platform.key]: event.target.value,
                      }));
                    }}
                    placeholder={platform.placeholder}
                    disabled={loading || saving}
                  />
                </label>
              ))}

              {error ? <p className="db-manager-add-error">{error}</p> : null}
              {saved ? (
                <p className="db-field-hint">
                  Social media links saved and updated on the website.
                </p>
              ) : null}

              <div className="db-form-actions">
                <button
                  type="submit"
                  className="db-new-post-btn"
                  disabled={loading || saving}
                >
                  {loading ? "Loading…" : saving ? "Saving…" : "Save links"}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
