"use client";

import DashboardSidebar from "../../DashboardSidebar";
import ArticleComposer from "../../ArticleComposer";
import "../../dashboard.css";

export default function NewArticlePage() {
  return (
    <div className="dashboard-isolate">
      <div className="db-app">
        <DashboardSidebar active="new" />
        <main className="db-main">
          <ArticleComposer mode="create" formId="new-article-form" />
        </main>
      </div>
    </div>
  );
}
