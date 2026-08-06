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
        const res = await fetch(`/api/posts/${id}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Article not found");
        if (cancelled) return;
        setInitialForm({ ...emptyArticleForm, ...data.article });
      } catch (err) {
        if (!cancelled) setError(err.message || "Article not found");
      } finally {
        if (!cancelled) setLoading(false);
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
