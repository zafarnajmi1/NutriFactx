import pool, { shouldUseLocalDbFallback } from "./db";
import { DEFAULT_ARTICLE_CATEGORIES } from "./categoryDefaults";

export { DEFAULT_ARTICLE_CATEGORIES };

const globalForCategories = globalThis;

function slugifyCategory(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeName(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function ensureCategoriesTable() {
  if (!globalForCategories.categoriesSchemaPromise) {
    globalForCategories.categoriesSchemaPromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS site_categories (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS site_categories_name_lower
          ON site_categories (LOWER(name));
      `)
      .then(async () => {
        const { rows } = await pool.query(
          `SELECT COUNT(*)::int AS n FROM site_categories`,
        );
        if ((rows[0]?.n || 0) > 0) return;
        for (const name of DEFAULT_ARTICLE_CATEGORIES) {
          const slug = slugifyCategory(name);
          await pool.query(
            `INSERT INTO site_categories (name, slug)
             VALUES ($1, $2)
             ON CONFLICT (slug) DO NOTHING`,
            [name, slug],
          );
        }
      })
      .catch((error) => {
        globalForCategories.categoriesSchemaPromise = null;
        throw error;
      });
  }
  return globalForCategories.categoriesSchemaPromise;
}

function uniqueNames(...groups) {
  const seen = new Set();
  const names = [];
  for (const group of groups) {
    for (const raw of group || []) {
      const name = normalizeName(raw);
      const key = name.toLowerCase();
      if (!name || seen.has(key)) continue;
      seen.add(key);
      names.push(name);
    }
  }
  return names.sort((left, right) => left.localeCompare(right));
}

export async function listCategoryNames() {
  try {
    await ensureCategoriesTable();
    const [saved, used] = await Promise.all([
      pool.query(`SELECT name FROM site_categories ORDER BY name ASC`),
      pool.query(
        `SELECT DISTINCT category AS name
         FROM posts
         WHERE category IS NOT NULL AND BTRIM(category) <> ''
         ORDER BY 1 ASC`,
      ),
    ]);
    return uniqueNames(
      saved.rows.map((row) => row.name),
      used.rows.map((row) => row.name),
    );
  } catch (error) {
    if (shouldUseLocalDbFallback(error)) {
      return [...DEFAULT_ARTICLE_CATEGORIES];
    }
    throw error;
  }
}

export async function createCategory(name) {
  const clean = normalizeName(name);
  if (clean.length < 2) {
    throw new Error("Enter a category name.");
  }
  if (clean.length > 60) {
    throw new Error("Category name must be under 60 characters.");
  }

  await ensureCategoriesTable();
  const slug = slugifyCategory(clean);
  if (!slug) {
    throw new Error("Enter a valid category name.");
  }

  try {
    await pool.query(
      `INSERT INTO site_categories (name, slug) VALUES ($1, $2)`,
      [clean, slug],
    );
  } catch (error) {
    if (error.code === "23505") {
      throw new Error("That category already exists.");
    }
    throw error;
  }

  return clean;
}

export async function renameCategory(oldName, newName) {
  const from = normalizeName(oldName);
  let to = normalizeName(newName);
  if (from.length < 2) throw new Error("Choose a category to edit.");
  if (to.length < 2) throw new Error("Enter a category name.");
  if (to.length > 60) throw new Error("Category name must be under 60 characters.");

  await ensureCategoriesTable();
  const newSlug = slugifyCategory(to);
  if (!newSlug) throw new Error("Enter a valid category name.");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const current = await client.query(
      `SELECT id, name, slug FROM site_categories WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [from],
    );
    const conflict = await client.query(
      `SELECT id FROM site_categories
       WHERE id <> COALESCE($1::bigint, 0)
         AND (LOWER(name) = LOWER($2) OR slug = $3)
       LIMIT 1`,
      [current.rows[0]?.id || null, to, newSlug],
    );

    if (conflict.rows[0]) {
      const surviving = await client.query(
        `SELECT name FROM site_categories WHERE id = $1`,
        [conflict.rows[0].id],
      );
      if (surviving.rows[0]?.name) to = surviving.rows[0].name;
      if (current.rows[0]) {
        await client.query(`DELETE FROM site_categories WHERE id = $1`, [
          current.rows[0].id,
        ]);
      }
    } else if (current.rows[0]) {
      await client.query(
        `UPDATE site_categories SET name = $1, slug = $2 WHERE id = $3`,
        [to, newSlug, current.rows[0].id],
      );
    } else {
      await client.query(
        `INSERT INTO site_categories (name, slug) VALUES ($1, $2)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name`,
        [to, newSlug],
      );
    }

    await client.query(
      `UPDATE posts
       SET category = $1, updated_at = NOW()
       WHERE LOWER(BTRIM(COALESCE(category, ''))) = LOWER($2)`,
      [to, from],
    );
    await client.query("COMMIT");
    return to;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    if (error.code === "23505") {
      throw new Error("That category already exists.");
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteCategory(name) {
  const clean = normalizeName(name);
  if (clean.length < 2) throw new Error("Choose a category to delete.");

  await ensureCategoriesTable();
  const names = await listCategoryNames();
  if (names.length <= 1) {
    throw new Error("Keep at least one category.");
  }

  const fallback =
    names.find((item) => item.toLowerCase() !== clean.toLowerCase()) ||
    DEFAULT_ARTICLE_CATEGORIES[0];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM site_categories WHERE LOWER(name) = LOWER($1)`,
      [clean],
    );
    await client.query(
      `UPDATE posts
       SET category = $1, updated_at = NOW()
       WHERE LOWER(BTRIM(COALESCE(category, ''))) = LOWER($2)`,
      [fallback, clean],
    );
    const fallbackSlug = slugifyCategory(fallback);
    if (fallbackSlug) {
      await client.query(
        `INSERT INTO site_categories (name, slug) VALUES ($1, $2)
         ON CONFLICT (slug) DO NOTHING`,
        [fallback, fallbackSlug],
      );
    }
    await client.query("COMMIT");
    return { deleted: clean, movedTo: fallback };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw error;
  } finally {
    client.release();
  }
}
