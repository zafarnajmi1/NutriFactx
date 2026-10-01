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
      DEFAULT_ARTICLE_CATEGORIES,
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
