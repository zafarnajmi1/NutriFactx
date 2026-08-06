import pool from "./db";

const globalForAnalytics = globalThis;

const BOT_PATTERN =
  /bot|crawler|spider|crawling|headless|preview|facebookexternalhit|slurp|bingpreview/i;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function cleanText(value, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanPath(value) {
  const path = cleanText(value, 500);
  return path.startsWith("/") ? path : "/";
}

export function isAnalyticsBot(userAgent) {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

export function detectDevice(userAgent = "") {
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return "Tablet";
  if (/mobile|iphone|ipod|android/i.test(userAgent)) return "Mobile";
  return "Desktop";
}

export function detectBrowser(userAgent = "") {
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/opr\/|opera/i.test(userAgent)) return "Opera";
  if (/chrome|crios/i.test(userAgent)) return "Chrome";
  if (/firefox|fxios/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent)) return "Safari";
  return "Other";
}

export function detectOs(userAgent = "") {
  if (/windows/i.test(userAgent)) return "Windows";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/macintosh|mac os/i.test(userAgent)) return "macOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Other";
}

export function classifyTraffic({
  referrer,
  utmSource,
  utmMedium,
  utmCampaign,
  siteHost,
}) {
  const sourceParam = cleanText(utmSource, 120);
  const mediumParam = cleanText(utmMedium, 120);
  const campaign = cleanText(utmCampaign, 180);

  if (sourceParam || mediumParam || campaign) {
    return {
      source: sourceParam || "campaign",
      medium: mediumParam || "campaign",
      campaign,
    };
  }

  const rawReferrer = cleanText(referrer, 1000);
  if (!rawReferrer) {
    return { source: "Direct", medium: "direct", campaign: "" };
  }

  try {
    const referrerUrl = new URL(rawReferrer);
    const host = referrerUrl.hostname.replace(/^www\./, "").toLowerCase();
    const ownHost = cleanText(siteHost, 255)
      .split(":")[0]
      .replace(/^www\./, "")
      .toLowerCase();

    if (host === ownHost) {
      return { source: "Direct", medium: "direct", campaign: "" };
    }

    if (
      /google\.|bing\.|yahoo\.|duckduckgo\.|baidu\.|yandex\./i.test(host)
    ) {
      return { source: "Organic search", medium: "organic", campaign: "" };
    }

    if (
      /facebook\.|instagram\.|t\.co$|twitter\.|linkedin\.|pinterest\.|youtube\.|tiktok\./i.test(
        host,
      )
    ) {
      return { source: "Social", medium: "social", campaign: "" };
    }

    return { source: host || "Referral", medium: "referral", campaign: "" };
  } catch {
    return { source: "Referral", medium: "referral", campaign: "" };
  }
}

export async function ensureAnalyticsSchema() {
  if (!globalForAnalytics.analyticsSchemaPromise) {
    globalForAnalytics.analyticsSchemaPromise = pool
      .query(`
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
      `)
      .catch((error) => {
        globalForAnalytics.analyticsSchemaPromise = null;
        throw error;
      });
  }

  return globalForAnalytics.analyticsSchemaPromise;
}

async function resolvePostId(path) {
  const pathname = cleanPath(path).split(/[?#]/)[0];
  const match = pathname.match(/^\/blogs\/([^/?#]+)\/?$/);
  if (!match) return null;

  const slug = decodeURIComponent(match[1]);
  const { rows } = await pool.query(
    `SELECT id FROM posts WHERE slug = $1 AND status = 'PUBLISHED' LIMIT 1`,
    [slug],
  );
  return rows[0]?.id || null;
}

export async function trackPageView(payload, requestContext = {}) {
  await ensureAnalyticsSchema();

  const sessionId = cleanText(payload.sessionId, 80);
  const visitorId = cleanText(payload.visitorId, 80);
  const pageKey = cleanText(payload.pageKey, 80);
  const path = cleanPath(payload.path);

  if (!sessionId || !visitorId || !pageKey || path.startsWith("/dashboard")) {
    return { tracked: false };
  }

  const userAgent = cleanText(requestContext.userAgent, 1000);
  if (isAnalyticsBot(userAgent)) return { tracked: false };

  const attribution = classifyTraffic({
    referrer: payload.referrer,
    utmSource: payload.utmSource,
    utmMedium: payload.utmMedium,
    utmCampaign: payload.utmCampaign,
    siteHost: requestContext.siteHost,
  });
  const postId = await resolvePostId(path);
  const countryCode = cleanText(requestContext.countryCode, 8) || null;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO analytics_sessions (
         session_id, visitor_id, landing_path, referrer, source, medium,
         campaign, device_type, browser, os, country_code
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (session_id) DO UPDATE SET
         last_seen_at = NOW()`,
      [
        sessionId,
        visitorId,
        path,
        cleanText(payload.referrer, 1000) || null,
        attribution.source,
        attribution.medium,
        attribution.campaign || null,
        detectDevice(userAgent),
        detectBrowser(userAgent),
        detectOs(userAgent),
        countryCode,
      ],
    );

    const inserted = await client.query(
      `INSERT INTO analytics_pageviews (
         page_key, session_id, visitor_id, path, title, post_id
       ) VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (page_key) DO NOTHING
       RETURNING id`,
      [
        pageKey,
        sessionId,
        visitorId,
        path,
        cleanText(payload.title, 300) || null,
        postId,
      ],
    );

    if (inserted.rows[0] && postId) {
      await client.query(
        `UPDATE posts SET views = COALESCE(views, 0) + 1 WHERE id = $1`,
        [postId],
      );
    }

    await client.query("COMMIT");
    return { tracked: Boolean(inserted.rows[0]) };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updatePageEngagement(payload) {
  await ensureAnalyticsSchema();

  const sessionId = cleanText(payload.sessionId, 80);
  const visitorId = cleanText(payload.visitorId, 80);
  const pageKey = cleanText(payload.pageKey, 80);
  if (!sessionId || !visitorId || !pageKey) return { tracked: false };

  const engagementMs = Math.round(clamp(payload.engagementMs, 0, 4 * 60 * 60 * 1000));
  const maxScroll = Math.round(clamp(payload.maxScroll, 0, 100));
  const engaged = engagementMs >= 10_000 || maxScroll >= 50;

  const { rowCount } = await pool.query(
    `UPDATE analytics_pageviews
     SET engagement_ms = GREATEST(engagement_ms, $1),
         max_scroll = GREATEST(max_scroll, $2),
         engaged = engaged OR $3,
         last_seen_at = NOW()
     WHERE page_key = $4 AND session_id = $5 AND visitor_id = $6`,
    [engagementMs, maxScroll, engaged, pageKey, sessionId, visitorId],
  );

  if (rowCount) {
    await pool.query(
      `UPDATE analytics_sessions SET last_seen_at = NOW()
       WHERE session_id = $1 AND visitor_id = $2`,
      [sessionId, visitorId],
    );
  }

  return { tracked: rowCount > 0 };
}
