"use client";

import { useState } from "react";
import BlogsCard from "../common/BlogsCard";

const PAGE_SIZE = 30;

/** Page numbers around the current page, with gaps marked as null. */
function buildPageItems(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const items = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push(null);
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push(null);
  items.push(total);

  return items;
}

export default function BlogsList({ blogs = [] }) {
  const [page, setPage] = useState(1);

  if (blogs.length === 0) {
    return <p className="text-nf-secondary">No published articles yet.</p>;
  }

  const totalPages = Math.max(1, Math.ceil(blogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleBlogs = blogs.slice(start, start + PAGE_SIZE);

  function goToPage(next) {
    setPage(Math.min(Math.max(next, 1), totalPages));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const arrowClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-nf-border bg-white text-nf-secondary transition hover:border-nf-green hover:text-nf-green disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-nf-border disabled:hover:text-nf-secondary";

  return (
    <>
      <div className="nf-posts-grid">
        {visibleBlogs.map((post) => (
          <BlogsCard
            key={post.id}
            title={post.title}
            excerpt={post.excerpt}
            category={post.category}
            author={post.author}
            date={post.date}
            image={post.featuredImage}
            featured={post.isFeatured}
            href={`/blogs/${post.slug}`}
          />
        ))}
      </div>

      {totalPages > 1 ? (
        <nav
          className="mt-8 flex items-center justify-center gap-1.5"
          aria-label="Blog pagination"
        >
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className={arrowClass}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="16"
              height="16"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {buildPageItems(currentPage, totalPages).map((item, index) =>
            item === null ? (
              <span
                key={`gap-${index}`}
                className="px-1 text-sm text-nf-secondary"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => goToPage(item)}
                aria-label={`Page ${item}`}
                aria-current={item === currentPage ? "page" : undefined}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-sm font-medium transition ${
                  item === currentPage
                    ? "border-nf-green bg-nf-green text-white"
                    : "border-nf-border bg-white text-nf-text hover:border-nf-green hover:text-nf-green"
                }`}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className={arrowClass}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="16"
              height="16"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </nav>
      ) : null}
    </>
  );
}
