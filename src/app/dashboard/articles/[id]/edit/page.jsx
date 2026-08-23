"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardSidebar from "../../../DashboardSidebar";
import ArticleComposer, { emptyArticleForm } from "../../../ArticleComposer";
import "../../../dashboard.css";

export default function EditArticlePage() {
  const params = useParams();
  const id = String(params.id || "");
  const [initialForm, setInitialForm] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        // Phase 1: meta fields only (fast) so the form can render.
        const metaRes = await fetch(`/api/posts/${id}?fields=meta`);
        const metaData = await metaRes.json().catch(() => ({}));
        if (!metaRes.ok) throw new Error(metaData.error || "Article not found");
        if (cancelled) return;
        setInitialForm({ ...emptyArticleForm, ...metaData.article, content: "" });
        setLoading(false);

        // Phase 2: full body for the editor (may be large).
        const fullRes = await fetch(`/api/posts/${id}`);
        const fullData = await fullRes.json().catch(() => ({}));
        if (!fullRes.ok) throw new Error(fullData.error || "Article not found");
        if (cancelled) return;
        setInitialForm({ ...emptyArticleForm, ...fullData.article });
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Article not found");
          setLoading(false);
        }
      }
    }

    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="dashboard-isolate">
      <div className="db-app">
        <DashboardSidebar active="articles" />
        <main className="db-main">
          {loading ? (
            <p className="db-comments-empty" style={{ padding: "2rem" }}>
              Loading article…
            </p>
          ) : error ? (
            <div style={{ padding: "2rem" }}>
              <p className="db-comments-empty">{error}</p>
              <Link href="/dashboard/articles" className="db-muted-link">
                Back to articles
              </Link>
            </div>
          ) : (
            <ArticleComposer
              key={id}
              mode="edit"
              articleId={id}
              formId={`edit-article-form-${id}`}
              initialForm={initialForm}
            />
          )}
        </main>
      </div>
    </div>
  );
}
