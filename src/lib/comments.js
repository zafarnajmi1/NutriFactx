import pool from "./db";

const STATUS_TO_UI = {
  VISIBLE: "published",
  PENDING: "published",
  SPAM: "spam",
  HIDDEN: "spam",
  DELETED: "spam",
};

const STATUS_TO_DB = {
  published: "VISIBLE",
  spam: "SPAM",
};

function initialsFrom(name = "") {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(value) {
  if (!value) return "";
  const diffMs = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(value);
}

function mapCommentDashboard(row) {
  const author =
    row.author_name || row.user_name || "Anonymous";
  return {
    id: String(row.id),
    author,
    email: row.author_email || row.user_email || "",
    initials: initialsFrom(author),
    articleId: String(row.post_id),
    articleTitle: row.post_title || "Untitled",
    articleSlug: row.post_slug || "",
    text: row.content,
    status: STATUS_TO_UI[row.status] || "published",
    date: formatDate(row.created_at),
    time: formatRelative(row.created_at),
    createdAt: row.created_at,
  };
}

function mapCommentPublic(row) {
  const author = row.author_name || row.user_name || "Anonymous";
  return {
    id: String(row.id),
    author,
    date: formatRelative(row.created_at) || formatDate(row.created_at),
    content: row.content,
  };
}

const COMMENT_SELECT = `
  SELECT
    c.*,
    p.title AS post_title,
    p.slug AS post_slug,
    u.name AS user_name,
    u.email AS user_email
  FROM comments c
  JOIN posts p ON p.id = c.post_id
  LEFT JOIN users u ON u.id = c.user_id
`;

export async function listAllComments() {
  const { rows } = await pool.query(
    `${COMMENT_SELECT}
     WHERE c.status <> 'DELETED'
     ORDER BY c.created_at DESC`,
  );
  return rows.map(mapCommentDashboard);
}

export async function getVisibleCommentsForPost(postId) {
  const { rows } = await pool.query(
    `${COMMENT_SELECT}
     WHERE c.post_id = $1 AND c.status = 'VISIBLE'
     ORDER BY c.created_at DESC`,
    [Number(postId)],
  );
  return rows.map(mapCommentPublic);
}

export async function getVisibleCommentsBySlug(slug) {
  const { rows } = await pool.query(
    `${COMMENT_SELECT}
     WHERE p.slug = $1 AND c.status = 'VISIBLE'
     ORDER BY c.created_at DESC`,
    [slug],
  );
  return rows.map(mapCommentPublic);
}

/** @deprecated Use getVisibleCommentsBySlug */
export const getApprovedCommentsBySlug = getVisibleCommentsBySlug;
/** @deprecated Use getVisibleCommentsForPost */
export const getApprovedCommentsForPost = getVisibleCommentsForPost;

export async function createGuestComment({ postId, authorName, authorEmail, content }) {
  const { rows } = await pool.query(
    `INSERT INTO comments (content, status, post_id, user_id, author_name, author_email, updated_at)
     VALUES ($1, 'VISIBLE'::comment_status, $2, NULL, $3, $4, NOW())
     RETURNING id`,
    [
      String(content || "").trim(),
      Number(postId),
      String(authorName || "").trim(),
      String(authorEmail || "").trim() || null,
    ],
  );

  const id = rows[0]?.id;
  if (!id) return null;

  const full = await pool.query(`${COMMENT_SELECT} WHERE c.id = $1`, [id]);
  return full.rows[0] ? mapCommentPublic(full.rows[0]) : { id: String(id) };
}

export async function updateComment(id, { content, status }, { canChangeStatus }) {
  const fields = [];
  const params = [];
  let i = 1;

  if (typeof content === "string" && content.trim()) {
    fields.push(`content = $${i++}`);
    params.push(content.trim());
  }

  if (canChangeStatus && status && STATUS_TO_DB[status]) {
    fields.push(`status = $${i++}::comment_status`);
    params.push(STATUS_TO_DB[status]);
  }

  if (!fields.length) return null;

  fields.push(`updated_at = NOW()`);
  params.push(Number(id));

  const { rows } = await pool.query(
    `UPDATE comments SET ${fields.join(", ")}
     WHERE id = $${i} AND status <> 'DELETED'
     RETURNING id`,
    params,
  );

  if (!rows[0]) return null;

  const full = await pool.query(`${COMMENT_SELECT} WHERE c.id = $1`, [Number(id)]);
  return full.rows[0] ? mapCommentDashboard(full.rows[0]) : null;
}

export async function deleteComment(id) {
  const result = await pool.query(
    `DELETE FROM comments WHERE id = $1 RETURNING id`,
    [Number(id)],
  );
  return Boolean(result.rows[0]);
}
