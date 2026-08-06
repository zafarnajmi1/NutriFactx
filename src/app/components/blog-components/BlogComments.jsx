"use client";

import { useState } from "react";

const INITIAL_COUNT = 10;

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function BlogComments({
  initialComments = [],
  postId,
  slug,
}) {
  const [comments, setComments] = useState(initialComments);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const visibleComments = comments.slice(0, visibleCount);
  const hasMore = visibleCount < comments.length;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim() || submitting) return;

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          slug,
          authorName: name.trim(),
          authorEmail: email.trim(),
          content: message.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not post comment.");
      }

      const posted = data.comment || {
        id: String(data.id || Date.now()),
        author: name.trim(),
        date: "Just now",
        content: message.trim(),
      };

      setComments((prev) => [posted, ...prev]);
      setVisibleCount((prev) => Math.max(prev, INITIAL_COUNT));
      setNotice(data.message || "Comment posted.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(err.message || "Could not post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <hr className="bd-divider" />

      <div className="bd-comment-form">
        <h3>Leave a comment</h3>
        <form onSubmit={handleSubmit}>
          <div className="bd-name-row">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Your email"
              required
            />
          </div>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write your comment..."
            required
          />
          {error ? <p className="bd-comment-error">{error}</p> : null}
          {notice ? <p className="bd-comment-notice">{notice}</p> : null}
          <button type="submit" className="bd-submit-btn" disabled={submitting}>
            {submitting ? "Posting…" : "Post comment"}
          </button>
        </form>
      </div>

      <hr className="bd-divider" />

      <div className="bd-comments-list">
        <div className="bd-comments-head">
          <h3>Comments</h3>
          <span>{comments.length} comments</span>
        </div>

        {visibleComments.length === 0 ? (
          <p className="bd-comments-empty">No comments yet. Be the first.</p>
        ) : (
          visibleComments.map((comment) => (
            <div key={comment.id} className="bd-comment-item">
              <div className="bd-avatar">{getInitials(comment.author)}</div>
              <div className="bd-comment-body">
                <div className="row">
                  <span className="name">{comment.author}</span>
                  <span className="time">{comment.date}</span>
                </div>
                <p>{comment.content}</p>
              </div>
            </div>
          ))
        )}

        {hasMore ? (
          <div className="bd-load-more-wrap">
            <button
              type="button"
              className="bd-load-more-btn"
              onClick={() => setVisibleCount((prev) => prev + 10)}
            >
              Load more comments
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
