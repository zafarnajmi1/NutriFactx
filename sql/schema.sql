-- NutriFactx core tables (extends existing posts/comments/users)
-- Run via: node scripts/ensure-schema.js

ALTER TYPE post_status ADD VALUE IF NOT EXISTS 'REVIEW';
ALTER TYPE comment_status ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE comment_status ADD VALUE IF NOT EXISTS 'SPAM';

ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS featured_image_name text;
-- Public byline typed in the composer, independent of the dashboard account.
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

-- Privacy-friendly first-party analytics. Visitor/session identifiers are
-- random browser IDs; IP addresses are never stored.
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
       ('pinterest')
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
