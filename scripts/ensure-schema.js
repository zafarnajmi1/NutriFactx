#!/usr/bin/env node
/**
 * Ensures posts/comments schema extensions exist.
 * Usage: node scripts/ensure-schema.js
 */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const envPath = path.join(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const pool = new Pool({
  user: env.DB_USER,
  host: env.DB_HOST,
  database: env.DB_NAME,
  password: env.DB_PASSWORD,
  port: Number(env.DB_PORT) || 5432,
});

async function addEnum(type, value) {
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = '${type}' AND e.enumlabel = '${value}'
      ) THEN
        ALTER TYPE ${type} ADD VALUE '${value}';
      END IF;
    END $$;
  `);
}

(async () => {
  await addEnum("post_status", "REVIEW");
  await addEnum("comment_status", "PENDING");
  await addEnum("comment_status", "SPAM");

  await pool.query(`
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS featured_image_name text;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name text;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS og_title text;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS og_description text;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS twitter_title text;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS twitter_description text;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS twitter_image text;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS robots_follow boolean NOT NULL DEFAULT true;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS schema_type text DEFAULT 'Article';
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

    ALTER TABLE comments ALTER COLUMN user_id DROP NOT NULL;
    ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_name text;
    ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_email text;
    ALTER TABLE comments ALTER COLUMN status SET DEFAULT 'VISIBLE';

    CREATE UNIQUE INDEX IF NOT EXISTS posts_slug_unique ON posts (slug);

    CREATE TABLE IF NOT EXISTS analytics_sessions (
      session_id TEXT PRIMARY KEY,
      visitor_id TEXT NOT NULL,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      landing_path TEXT NOT NULL,
      referrer TEXT,
      source TEXT NOT NULL DEFAULT 'Direct',
      medium TEXT NOT NULL DEFAULT 'direct',
      campaign TEXT,
      device_type TEXT NOT NULL DEFAULT 'Desktop',
      browser TEXT NOT NULL DEFAULT 'Other',
      os TEXT NOT NULL DEFAULT 'Other',
      country_code TEXT
    );

    CREATE TABLE IF NOT EXISTS analytics_pageviews (
      id BIGSERIAL PRIMARY KEY,
      page_key TEXT NOT NULL UNIQUE,
      session_id TEXT NOT NULL
        REFERENCES analytics_sessions(session_id) ON DELETE CASCADE,
      visitor_id TEXT NOT NULL,
      path TEXT NOT NULL,
      title TEXT,
      post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL,
      viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      engagement_ms INTEGER NOT NULL DEFAULT 0,
      max_scroll SMALLINT NOT NULL DEFAULT 0,
      engaged BOOLEAN NOT NULL DEFAULT FALSE
    );

    CREATE INDEX IF NOT EXISTS analytics_sessions_started_at_idx
      ON analytics_sessions (started_at DESC);
    CREATE INDEX IF NOT EXISTS analytics_sessions_visitor_id_idx
      ON analytics_sessions (visitor_id);
    CREATE INDEX IF NOT EXISTS analytics_pageviews_viewed_at_idx
      ON analytics_pageviews (viewed_at DESC);
    CREATE INDEX IF NOT EXISTS analytics_pageviews_session_id_idx
      ON analytics_pageviews (session_id);
    CREATE INDEX IF NOT EXISTS analytics_pageviews_visitor_id_idx
      ON analytics_pageviews (visitor_id);
    CREATE INDEX IF NOT EXISTS analytics_pageviews_post_id_idx
      ON analytics_pageviews (post_id);

    CREATE TABLE IF NOT EXISTS site_social_links (
      platform TEXT PRIMARY KEY,
      url TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    INSERT INTO site_social_links (platform)
    VALUES ('facebook'), ('instagram'), ('x'), ('linkedin'), ('youtube'),
           ('pinterest'), ('reddit')
    ON CONFLICT (platform) DO NOTHING;

    CREATE TABLE IF NOT EXISTS subscribers (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      plan TEXT NOT NULL DEFAULT 'weekly',
      status TEXT NOT NULL DEFAULT 'active',
      source TEXT NOT NULL DEFAULT 'Website',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS subscribers_status_idx ON subscribers (status);
    CREATE INDEX IF NOT EXISTS subscribers_created_at_idx
      ON subscribers (created_at DESC);

    CREATE TABLE IF NOT EXISTS site_page_seo (
      page_key TEXT PRIMARY KEY,
      meta_title TEXT,
      meta_description TEXT,
      focus_keyword TEXT,
      keywords TEXT,
      canonical_url TEXT,
      og_title TEXT,
      og_description TEXT,
      og_image TEXT,
      twitter_title TEXT,
      twitter_description TEXT,
      twitter_image TEXT,
      robots_index BOOLEAN NOT NULL DEFAULT TRUE,
      robots_follow BOOLEAN NOT NULL DEFAULT TRUE,
      schema_type TEXT NOT NULL DEFAULT 'WebPage',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS site_team_members (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      image_url TEXT,
      bio TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS site_team_members_sort_idx
      ON site_team_members (sort_order ASC, id ASC);
    CREATE INDEX IF NOT EXISTS site_team_members_active_idx
      ON site_team_members (is_active);

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
    CREATE INDEX IF NOT EXISTS site_authors_sort_idx
      ON site_authors (sort_order ASC, id ASC);
    CREATE INDEX IF NOT EXISTS site_authors_active_idx
      ON site_authors (is_active);
    CREATE UNIQUE INDEX IF NOT EXISTS site_authors_slug_unique
      ON site_authors (slug);

    ALTER TABLE site_authors
      ADD COLUMN IF NOT EXISTS show_credentials BOOLEAN NOT NULL DEFAULT TRUE;

    ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS author_profile_id BIGINT
      REFERENCES site_authors(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS posts_author_profile_id_idx
      ON posts (author_profile_id);

    CREATE TABLE IF NOT EXISTS site_page_content (
      page_key TEXT PRIMARY KEY,
      hero_eyebrow TEXT,
      hero_title TEXT,
      hero_description TEXT,
      sections JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Content';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await pool.query(`
    INSERT INTO users (name, email, password, user_role)
    SELECT v.name, v.email, v.password, v.role::user_role
    FROM (VALUES
      ('Admin', 'admin@nutrifactx.com', 'admin1234', 'ADMIN'),
      ('Bilal Ahmed', 'bilal@nutrifactx.com', 'manager123', 'MANAGER'),
      ('Hina Noor', 'hina@nutrifactx.com', 'manager123', 'MANAGER')
    ) AS v(name, email, password, role)
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = v.email);
  `);

  // Seed About Us team profiles (images already on Cloudflare R2).
  // Skip any name that already exists so live data is never overwritten.
  await pool.query(`
    INSERT INTO site_team_members (name, role, image_url, bio, sort_order, is_active)
    SELECT v.name, v.role, v.image_url, NULL, v.sort_order, TRUE
    FROM (VALUES
      ('Emma Wilson', 'Chief Editor',
        'https://media.nutrifactx.com/team/2026/08/9c6c0f8d-e7e1-4129-823e-ff90d3da90ce.png', 0),
      ('Sophia Clarke', 'Medical Content Writer',
        'https://media.nutrifactx.com/team/2026/08/fb167372-a2f7-4ad0-b445-47ac4315b9b5.jpg', 0),
      ('Olivia Bennett', 'Fact-Checker / Research Analyst',
        'https://media.nutrifactx.com/team/2026/08/b17aeb88-780a-4f99-8a89-7c38d66b935b.jpg', 0),
      ('Daniel Brooks', 'Graphic/Content Designer',
        'https://media.nutrifactx.com/team/2026/08/576efd6e-7121-44a6-a155-ddbe1f57beb1.jpg', 0),
      ('Jack Morrison', 'Social Media & Outreach Manager',
        'https://media.nutrifactx.com/team/2026/08/337ea275-2987-4e64-b180-ba8ae73924e7.jpg', 0),
      ('Henry Walker', 'Copy Editor',
        'https://media.nutrifactx.com/team/2026/08/43dd138b-4ed7-421f-a568-8fb179bdcf5d.jpg', 0),
      ('Amelia Foster', 'Nutrition Writer',
        'https://media.nutrifactx.com/team/2026/08/75a55c67-1cf0-47b5-b771-6b45800f8b86.jpg', 5),
      ('James Carter', 'Health & Nutrition Researcher',
        'https://media.nutrifactx.com/team/2026/08/58a21dba-9fc4-4cda-85ca-d51b055c92a4.jpg', 5)
    ) AS v(name, role, image_url, sort_order)
    WHERE NOT EXISTS (
      SELECT 1 FROM site_team_members t WHERE t.name = v.name
    );
  `);

  console.log("Schema ensured.");
  await pool.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
