import pool, { shouldUseLocalDbFallback } from "./db";

const globalForAuthors = globalThis;

function slugifyAuthor(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapAuthor(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    title: row.title || "",
    qualifications: row.qualifications || "",
    credentials: row.credentials || "",
    showCredentials: row.show_credentials !== false,
    education: row.education || "",
    experience: row.experience || "",
    bio: row.bio || "",
    image: row.image_url || "",
    sortOrder: Number(row.sort_order) || 0,
    isActive: row.is_active !== false,
  };
}

export async function ensureAuthorsTable() {
  if (!globalForAuthors.authorsSchemaPromise) {
    globalForAuthors.authorsSchemaPromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS site_authors (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          title TEXT,
          qualifications TEXT,
          credentials TEXT,
          show_credentials BOOLEAN NOT NULL DEFAULT TRUE,
          education TEXT,
          experience TEXT,
          bio TEXT,
          image_url TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        ALTER TABLE site_authors
          ADD COLUMN IF NOT EXISTS show_credentials BOOLEAN NOT NULL DEFAULT TRUE;
        CREATE INDEX IF NOT EXISTS site_authors_sort_idx
          ON site_authors (sort_order ASC, id ASC);
        CREATE INDEX IF NOT EXISTS site_authors_active_idx
          ON site_authors (is_active);
        CREATE UNIQUE INDEX IF NOT EXISTS site_authors_slug_unique
          ON site_authors (slug);
        ALTER TABLE posts
          ADD COLUMN IF NOT EXISTS author_profile_id BIGINT
          REFERENCES site_authors(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS posts_author_profile_id_idx
          ON posts (author_profile_id);
      `)
      .catch((error) => {
        globalForAuthors.authorsSchemaPromise = null;
        throw error;
      });
  }
  return globalForAuthors.authorsSchemaPromise;
}

async function uniqueSlug(base, excludeId = null) {
  let slug = slugifyAuthor(base) || "author";
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const params = [candidate];
    let sql = `SELECT id FROM site_authors WHERE slug = $1`;
    if (excludeId) {
      params.push(Number(excludeId));
      sql += ` AND id <> $2`;
    }
    sql += ` LIMIT 1`;
    const { rows } = await pool.query(sql, params);
    if (!rows[0]) return candidate;
    n += 1;
  }
}

export async function listAuthors({ activeOnly = false } = {}) {
  try {
    await ensureAuthorsTable();
    const where = activeOnly ? "WHERE is_active = TRUE" : "";
    const { rows } = await pool.query(
      `SELECT id, name, slug, title, qualifications, credentials, show_credentials,
              education, experience, bio, image_url, sort_order, is_active, created_at, updated_at
       FROM site_authors
       ${where}
       ORDER BY sort_order ASC, name ASC, id ASC`,
    );
    return rows.map(mapAuthor);
  } catch (error) {
    if (shouldUseLocalDbFallback(error)) {
      console.warn("[authors] PostgreSQL unavailable, returning empty list");
      return [];
    }
    throw error;
  }
}

export async function getAuthorById(id) {
  await ensureAuthorsTable();
  const { rows } = await pool.query(
    `SELECT id, name, slug, title, qualifications, credentials, show_credentials,
            education, experience, bio, image_url, sort_order, is_active, created_at, updated_at
     FROM site_authors
     WHERE id = $1
     LIMIT 1`,
    [Number(id)],
  );
  return mapAuthor(rows[0]);
}

export async function getAuthorBySlug(slug) {
  await ensureAuthorsTable();
  const clean = String(slug || "").trim().toLowerCase();
  if (!clean) return null;
  const { rows } = await pool.query(
    `SELECT id, name, slug, title, qualifications, credentials, show_credentials,
            education, experience, bio, image_url, sort_order, is_active, created_at, updated_at
     FROM site_authors
     WHERE slug = $1 AND is_active = TRUE
     LIMIT 1`,
    [clean],
  );
  return mapAuthor(rows[0]);
}

export async function createAuthor(input) {
  await ensureAuthorsTable();
  const name = String(input.name || "").trim();
  if (!name) throw new Error("Author name is required.");

  const slug = await uniqueSlug(input.slug || name);

  const { rows } = await pool.query(
    `INSERT INTO site_authors (
       name, slug, title, qualifications, credentials, show_credentials, education,
       experience, bio, image_url, sort_order, is_active, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
     RETURNING id`,
    [
      name,
      slug,
      String(input.title || "").trim() || null,
      String(input.qualifications || "").trim() || null,
      String(input.credentials || "").trim() || null,
      input.showCredentials !== false,
      String(input.education || "").trim() || null,
      String(input.experience || "").trim() || null,
      String(input.bio || "").trim() || null,
      String(input.image || "").trim() || null,
      Number(input.sortOrder) || 0,
      input.isActive !== false,
    ],
  );

  return getAuthorById(rows[0].id);
}

export async function updateAuthor(id, input) {
  await ensureAuthorsTable();
  const existing = await getAuthorById(id);
  if (!existing) return null;

  const name = String(input.name ?? existing.name).trim();
  if (!name) throw new Error("Author name is required.");

  const slugInput = String(input.slug ?? existing.slug).trim();
  const slug = await uniqueSlug(slugInput || name, id);
  const showCredentials =
    input.showCredentials !== undefined
      ? Boolean(input.showCredentials)
      : existing.showCredentials !== false;

  await pool.query(
    `UPDATE site_authors SET
       name = $1,
       slug = $2,
       title = $3,
       qualifications = $4,
       credentials = $5,
       show_credentials = $6,
       education = $7,
       experience = $8,
       bio = $9,
       image_url = $10,
       sort_order = $11,
       is_active = $12,
       updated_at = NOW()
     WHERE id = $13`,
    [
      name,
      slug,
      String(input.title ?? existing.title).trim() || null,
      String(input.qualifications ?? existing.qualifications).trim() || null,
      String(input.credentials ?? existing.credentials).trim() || null,
      showCredentials,
      String(input.education ?? existing.education).trim() || null,
      String(input.experience ?? existing.experience).trim() || null,
      String(input.bio ?? existing.bio).trim() || null,
      String(input.image ?? existing.image).trim() || null,
      Number(input.sortOrder ?? existing.sortOrder) || 0,
      input.isActive !== false,
      Number(id),
    ],
  );

  return getAuthorById(id);
}

export async function deleteAuthor(id) {
  await ensureAuthorsTable();
  const { rows } = await pool.query(
    `DELETE FROM site_authors WHERE id = $1 RETURNING image_url`,
    [Number(id)],
  );
  return rows[0] || null;
}

export async function listPostsByAuthorSlug(slug, limit = 12) {
  await ensureAuthorsTable();
  const { rows } = await pool.query(
    `SELECT p.id, p.title, p.slug, p.excerpt, p.category, p.author_name,
            p.published_at, p.created_at, p.featured_image, p.is_featured
     FROM posts p
     INNER JOIN site_authors a ON a.id = p.author_profile_id
     WHERE a.slug = $1 AND a.is_active = TRUE AND p.status = 'PUBLISHED'
     ORDER BY COALESCE(p.published_at, p.created_at) DESC, p.id DESC
     LIMIT $2`,
    [String(slug || "").trim().toLowerCase(), Number(limit) || 12],
  );
  return rows;
}

export { slugifyAuthor };
