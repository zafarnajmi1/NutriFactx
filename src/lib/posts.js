import pool from "./db";

/** UI status → DB enum */
const STATUS_TO_DB = {
  draft: "DRAFT",
  review: "REVIEW",
  published: "PUBLISHED",
  archived: "ARCHIVED",
};

/** DB enum → UI status */
const STATUS_TO_UI = {
  DRAFT: "draft",
  REVIEW: "review",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

function formatDateShort(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatViews(views) {
  const n = Number(views) || 0;
  if (n <= 0) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function readingTimeFromHtml(html) {
  const plain = String(html || "")
    // Ignore embedded base64 images — they inflate "word" count and burn CPU.
    .replace(/data:image\/[a-z0-9+/=;,.\s-]+/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = plain ? plain.split(/\s+/).length : 0;
  const mins = Math.max(1, Math.ceil(words / 220));
  return `${mins} min read`;
}

function parseTags(tags) {
  if (Array.isArray(tags)) return tags.filter(Boolean);
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

/** Map DB row → public website blog shape */
export function mapPostToBlog(row) {
  if (!row) return null;
  const published = row.published_at || row.created_at;
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt || "",
    category: row.category || "Nutrition",
    author: row.author_name || "NutriFactx",
    date: formatDateShort(published),
    datetime: formatDateTime(published),
    slug: row.slug,
    readTime: readingTimeFromHtml(row.content),
    contentHtml: row.content || "",
    featuredImage: row.featured_image || "",
    tags: parseTags(row.tags),
    isFeatured: Boolean(row.is_featured),
    metaTitle: row.meta_title || "",
    metaDescription: row.meta_description || "",
    focusKeyword: row.focus_keyword || "",
    canonicalUrl: row.canonical_url || "",
    ogTitle: row.og_title || "",
    ogDescription: row.og_description || "",
    ogImage: row.og_image || "",
    twitterTitle: row.twitter_title || "",
    twitterDescription: row.twitter_description || "",
    twitterImage: row.twitter_image || "",
    robotsIndex: !row.no_index,
    robotsFollow: row.robots_follow !== false,
    schemaType: row.schema_type || "Article",
    publishedAt: published ? new Date(published).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

/** Card/list shape — never includes full HTML body. */
export function mapPostToBlogCard(row) {
  if (!row) return null;
  const blog = mapPostToBlog({ ...row, content: row.excerpt || "" });
  return {
    ...blog,
    contentHtml: "",
    readTime: readingTimeFromHtml(row.excerpt || ""),
  };
}

/** Map DB row → dashboard article list/form shape */
export function mapPostToDashboard(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    title: row.title,
    slug: row.slug,
    cat: row.category,
    category: row.category,
    author: row.author_name || "",
    status: STATUS_TO_UI[row.status] || "draft",
    date: formatDateShort(row.published_at || row.updated_at || row.created_at),
    views: formatViews(row.views),
    viewsRaw: Number(row.views) || 0,
    image: row.featured_image || "",
    featuredImage: row.featured_image || "",
    featuredImageName: row.featured_image_name || "",
    excerpt: row.excerpt || "",
    content: row.content || "",
    tags: Array.isArray(row.tags) ? row.tags.join(", ") : "",
    focusKeyword: row.focus_keyword || "",
    metaTitle: row.meta_title || "",
    metaDescription: row.meta_description || "",
    canonicalUrl: row.canonical_url || "",
    ogTitle: row.og_title || "",
    ogDescription: row.og_description || "",
    ogImage: row.og_image || "",
    twitterTitle: row.twitter_title || "",
    twitterDescription: row.twitter_description || "",
    twitterImage: row.twitter_image || "",
    robotsIndex: !row.no_index,
    robotsFollow: row.robots_follow !== false,
    schemaType: row.schema_type || "Article",
    isFeatured: Boolean(row.is_featured),
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

/** Lightweight map for dashboard articles table (no HTML body). */
export function mapPostToDashboardList(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    title: row.title,
    slug: row.slug,
    cat: row.category,
    category: row.category,
    author: row.author_name || "",
    status: STATUS_TO_UI[row.status] || "draft",
    date: formatDateShort(row.published_at || row.updated_at || row.created_at),
    views: formatViews(row.views),
    viewsRaw: Number(row.views) || 0,
    image: row.featured_image || "",
    featuredImage: row.featured_image || "",
    excerpt: row.excerpt || "",
    isFeatured: Boolean(row.is_featured),
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

const POST_SELECT = `
  SELECT
    p.*,
    u.name AS account_name,
    u.email AS author_email
  FROM posts p
  LEFT JOIN users u ON u.id = p.author_id
`;

/** List columns only — excludes heavy content HTML / base64 images. */
const POST_LIST_SELECT = `
  SELECT
    p.id,
    p.title,
    p.slug,
    p.category,
    p.author_name,
    p.status,
    p.published_at,
    p.updated_at,
    p.created_at,
    p.views,
    p.featured_image,
    p.excerpt,
    p.is_featured
  FROM posts p
`;

/** Public card/list columns — excludes content HTML body. */
const POST_CARD_SELECT = `
  SELECT
    p.id,
    p.title,
    p.slug,
    p.excerpt,
    p.category,
    p.author_name,
    p.published_at,
    p.created_at,
    p.updated_at,
    p.featured_image,
    p.tags,
    p.is_featured,
    p.meta_title,
    p.meta_description,
    p.focus_keyword,
    p.canonical_url,
    p.og_title,
    p.og_description,
    p.og_image,
    p.twitter_title,
    p.twitter_description,
    p.twitter_image,
    p.no_index,
    p.robots_follow,
    p.schema_type
  FROM posts p
`;

/** Dashboard edit shell — all fields except heavy content HTML. */
const POST_EDIT_META_SELECT = `
  SELECT
    p.id,
    p.title,
    p.slug,
    p.excerpt,
    p.category,
    p.author_name,
    p.status,
    p.published_at,
    p.created_at,
    p.updated_at,
    p.views,
    p.featured_image,
    p.featured_image_name,
    p.tags,
    p.is_featured,
    p.meta_title,
    p.meta_description,
    p.focus_keyword,
    p.canonical_url,
    p.og_title,
    p.og_description,
    p.og_image,
    p.twitter_title,
    p.twitter_description,
    p.twitter_image,
    p.no_index,
    p.robots_follow,
    p.schema_type
  FROM posts p
`;

/** Owning dashboard account for the post. The public byline is stored separately. */
async function resolveAuthorId(fallbackEmail) {
  if (fallbackEmail) {
    const byEmail = await pool.query(
      `SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1`,
      [fallbackEmail],
    );
    if (byEmail.rows[0]) return byEmail.rows[0].id;
  }
  const admin = await pool.query(
    `SELECT id FROM users WHERE user_role = 'ADMIN' ORDER BY id ASC LIMIT 1`,
  );
  if (admin.rows[0]) return admin.rows[0].id;
  const any = await pool.query(`SELECT id FROM users ORDER BY id ASC LIMIT 1`);
  return any.rows[0]?.id || 1;
}

export async function listAllPosts({ status } = {}) {
  const params = [];
  let where = "";
  if (status && STATUS_TO_DB[status]) {
    params.push(STATUS_TO_DB[status]);
    where = `WHERE p.status = $1`;
  }
  const { rows } = await pool.query(
    `${POST_LIST_SELECT} ${where} ORDER BY COALESCE(p.published_at, p.created_at) DESC, p.id DESC`,
    params,
  );
  return rows.map(mapPostToDashboardList);
}

export async function listPublishedPosts() {
  const { rows } = await pool.query(
    `${POST_CARD_SELECT}
     WHERE p.status = 'PUBLISHED'
     ORDER BY COALESCE(p.published_at, p.created_at) DESC, p.id DESC`,
  );
  return rows.map(mapPostToBlogCard);
}

/**
 * Recent = newly published (by published_at).
 * Latest = featured editorial picks (is_featured), fallback to recently updated.
 */
export async function getRecentPublished(limit = 4) {
  const { rows } = await pool.query(
    `${POST_CARD_SELECT}
     WHERE p.status = 'PUBLISHED'
     ORDER BY COALESCE(p.published_at, p.created_at) DESC, p.id DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map(mapPostToBlogCard);
}

export async function getLatestPublished(limit = 4) {
  const featured = await pool.query(
    `${POST_CARD_SELECT}
     WHERE p.status = 'PUBLISHED' AND p.is_featured = true
     ORDER BY COALESCE(p.published_at, p.updated_at) DESC, p.id DESC
     LIMIT $1`,
    [limit],
  );

  if (featured.rows.length >= limit) {
    return featured.rows.map(mapPostToBlogCard);
  }

  const excludeIds = featured.rows.map((r) => r.id);
  const remaining = limit - featured.rows.length;
  const params = [remaining];
  let excludeClause = "";
  if (excludeIds.length) {
    params.push(excludeIds);
    excludeClause = `AND NOT (p.id = ANY($2::int[]))`;
  }

  const fill = await pool.query(
    `${POST_CARD_SELECT}
     WHERE p.status = 'PUBLISHED'
       ${excludeClause}
     ORDER BY p.updated_at DESC, p.id DESC
     LIMIT $1`,
    params,
  );

  return [...featured.rows, ...fill.rows].map(mapPostToBlogCard);
}

/** Published articles explicitly selected for the website feature slider. */
export async function getFeaturedPublished(limit = 6) {
  const { rows } = await pool.query(
    `${POST_CARD_SELECT}
     WHERE p.status = 'PUBLISHED' AND p.is_featured = true
     ORDER BY COALESCE(p.published_at, p.updated_at, p.created_at) DESC, p.id DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map(mapPostToBlogCard);
}

export async function getPostBySlug(slug) {
  const { rows } = await pool.query(
    `${POST_SELECT} WHERE p.slug = $1 LIMIT 1`,
    [slug],
  );
  return rows[0] || null;
}

export async function getPublishedPostBySlug(slug) {
  const { rows } = await pool.query(
    `${POST_SELECT}
     WHERE p.slug = $1 AND p.status = 'PUBLISHED'
     LIMIT 1`,
    [slug],
  );
  return rows[0] ? mapPostToBlog(rows[0]) : null;
}

/** SEO/meta only — skips heavy content HTML for generateMetadata. */
export async function getPublishedPostMetaBySlug(slug) {
  const { rows } = await pool.query(
    `${POST_CARD_SELECT}
     WHERE p.status = 'PUBLISHED' AND p.slug = $1
     LIMIT 1`,
    [slug],
  );
  return rows[0] ? mapPostToBlogCard(rows[0]) : null;
}

export async function getPostById(id) {
  const { rows } = await pool.query(`${POST_SELECT} WHERE p.id = $1 LIMIT 1`, [
    Number(id),
  ]);
  return rows[0] || null;
}

/** Edit form fields without content HTML (fast first paint). */
export async function getPostMetaById(id) {
  const { rows } = await pool.query(
    `${POST_EDIT_META_SELECT} WHERE p.id = $1 LIMIT 1`,
    [Number(id)],
  );
  return rows[0] || null;
}

export async function getRelatedPublished(slug, limit = 6) {
  const catRes = await pool.query(
    `SELECT category FROM posts WHERE slug = $1 AND status = 'PUBLISHED' LIMIT 1`,
    [slug],
  );
  const category = catRes.rows[0]?.category || "";
  if (!catRes.rows[0]) {
    return getRecentPublished(limit);
  }

  const { rows } = await pool.query(
    `${POST_CARD_SELECT}
     WHERE p.status = 'PUBLISHED' AND p.slug <> $1
     ORDER BY
       CASE WHEN p.category = $2 THEN 0 ELSE 1 END,
       COALESCE(p.published_at, p.created_at) DESC
     LIMIT $3`,
    [slug, category, limit],
  );
  return rows.map(mapPostToBlogCard);
}

export async function searchPublishedPosts(query, limit = 6) {
  const q = String(query || "").trim();
  if (!q) return [];
  const { rows } = await pool.query(
    `${POST_CARD_SELECT}
     WHERE p.status = 'PUBLISHED'
       AND (
         p.title ILIKE $1
         OR COALESCE(p.excerpt, '') ILIKE $1
         OR p.category ILIKE $1
         OR COALESCE(p.author_name, '') ILIKE $1
       )
     ORDER BY COALESCE(p.published_at, p.created_at) DESC
     LIMIT $2`,
    [`%${q}%`, limit],
  );
  return rows.map(mapPostToBlogCard);
}

export async function createPost(payload, sessionUser) {
  const status = STATUS_TO_DB[payload.status] || "DRAFT";
  const authorId = await resolveAuthorId(sessionUser?.email);
  const tags = parseTags(payload.tags);
  const publishedAt =
    status === "PUBLISHED" ? payload.publishedAt || new Date() : null;

  const { rows } = await pool.query(
    `INSERT INTO posts (
       title, slug, content, excerpt, featured_image, featured_image_name,
       category, tags, status, meta_title, meta_description, focus_keyword,
       canonical_url, og_image, og_title, og_description, no_index,
       twitter_title, twitter_description, twitter_image, robots_follow,
       schema_type, is_featured, author_id, author_name, published_at, updated_at
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9::post_status,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,NOW()
     )
     RETURNING id`,
    [
      payload.title,
      payload.slug,
      payload.content || "",
      payload.excerpt || null,
      payload.featuredImage || null,
      payload.featuredImageName || null,
      payload.category || "Nutrition",
      tags,
      status,
      payload.metaTitle || null,
      payload.metaDescription || null,
      payload.focusKeyword || null,
      payload.canonicalUrl || null,
      payload.ogImage || null,
      payload.ogTitle || null,
      payload.ogDescription || null,
      payload.robotsIndex === false,
      payload.twitterTitle || null,
      payload.twitterDescription || null,
      payload.twitterImage || null,
      payload.robotsFollow !== false,
      payload.schemaType || "Article",
      Boolean(payload.isFeatured),
      authorId,
      String(payload.author || "").trim() || null,
      publishedAt,
    ],
  );

  return getPostById(rows[0].id);
}

export async function updatePost(id, payload, sessionUser) {
  const existing = await getPostById(id);
  if (!existing) return null;

  const status = STATUS_TO_DB[payload.status] || existing.status;
  const authorId =
    existing.author_id ||
    (await resolveAuthorId(sessionUser?.email || existing.author_email));
  const tags = parseTags(payload.tags);

  let publishedAt = existing.published_at;
  if (status === "PUBLISHED") {
    publishedAt = existing.published_at || new Date();
  }

  await pool.query(
    `UPDATE posts SET
       title = $1,
       slug = $2,
       content = $3,
       excerpt = $4,
       featured_image = $5,
       featured_image_name = $6,
       category = $7,
       tags = $8,
       status = $9::post_status,
       meta_title = $10,
       meta_description = $11,
       focus_keyword = $12,
       canonical_url = $13,
       og_image = $14,
       og_title = $15,
       og_description = $16,
       no_index = $17,
       twitter_title = $18,
       twitter_description = $19,
       twitter_image = $20,
       robots_follow = $21,
       schema_type = $22,
       is_featured = $23,
       author_id = $24,
       author_name = $25,
       published_at = $26,
       updated_at = NOW()
     WHERE id = $27`,
    [
      payload.title,
      payload.slug,
      payload.content || "",
      payload.excerpt || null,
      payload.featuredImage || null,
      payload.featuredImageName || null,
      payload.category || "Nutrition",
      tags,
      status,
      payload.metaTitle || null,
      payload.metaDescription || null,
      payload.focusKeyword || null,
      payload.canonicalUrl || null,
      payload.ogImage || null,
      payload.ogTitle || null,
      payload.ogDescription || null,
      payload.robotsIndex === false,
      payload.twitterTitle || null,
      payload.twitterDescription || null,
      payload.twitterImage || null,
      payload.robotsFollow !== false,
      payload.schemaType || "Article",
      Boolean(payload.isFeatured),
      authorId,
      String(payload.author || "").trim() || null,
      publishedAt,
      Number(id),
    ],
  );

  return getPostById(id);
}

export async function deletePost(id) {
  const result = await pool.query(`DELETE FROM posts WHERE id = $1 RETURNING id`, [
    Number(id),
  ]);
  return Boolean(result.rows[0]);
}

export async function slugExists(slug, excludeId) {
  const params = [slug];
  let sql = `SELECT id FROM posts WHERE slug = $1`;
  if (excludeId) {
    params.push(Number(excludeId));
    sql += ` AND id <> $2`;
  }
  sql += ` LIMIT 1`;
  const { rows } = await pool.query(sql, params);
  return Boolean(rows[0]);
}
