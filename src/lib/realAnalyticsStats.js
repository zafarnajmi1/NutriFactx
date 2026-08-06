import pool from "./db";
import { ensureAnalyticsSchema } from "./analytics";

const RANGE_DAYS = { "7d": 7, "30d": 30, "90d": 90 };
const STATUS_TO_UI = {
  DRAFT: "draft",
  REVIEW: "review",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

function formatCompact(value) {
  const number = Number(value) || 0;
  if (number >= 1_000_000) {
    const compact = number / 1_000_000;
    return `${compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1)}M`;
  }
  if (number >= 1_000) {
    const compact = number / 1_000;
    return `${compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1)}k`;
  }
  return String(number);
}

function formatViews(value) {
  const number = Number(value) || 0;
  return number > 0 ? formatCompact(number) : "—";
}

function formatDateShort(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatPercent(current, previous) {
  const currentValue = Number(current) || 0;
  const previousValue = Number(previous) || 0;
  if (!currentValue && !previousValue) return "0%";
  if (!previousValue) return currentValue > 0 ? "+100%" : "0%";
  const change = ((currentValue - previousValue) / previousValue) * 100;
  const rounded = Math.round(change * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

function trendDirection(current, previous, lowerIsBetter = false) {
  const improved = lowerIsBetter
    ? Number(current) <= Number(previous)
    : Number(current) >= Number(previous);
  return improved ? "up" : "down";
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.round((Number(milliseconds) || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}m ${seconds}s`;
}

function initialsFrom(name = "") {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatRelative(value) {
  if (!value) return "";
  const difference = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(difference / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDateShort(value);
}

function getBounds(days) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  const previousEnd = new Date(start);
  const previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - days);
  return { start, end, previousStart, previousEnd };
}

async function periodMetrics(start, end) {
  const [pageviews, sessions] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*)::int AS views,
         COUNT(DISTINCT visitor_id)::int AS readers,
         COALESCE(AVG(engagement_ms), 0)::bigint AS avg_engagement_ms
       FROM analytics_pageviews
       WHERE viewed_at >= $1 AND viewed_at < $2`,
      [start, end],
    ),
    pool.query(
      `WITH per_session AS (
         SELECT
           session_id,
           COUNT(*)::int AS pageviews,
           BOOL_OR(engaged) AS has_engagement
         FROM analytics_pageviews
         WHERE viewed_at >= $1 AND viewed_at < $2
         GROUP BY session_id
       )
       SELECT
         COUNT(*)::int AS sessions,
         COUNT(*) FILTER (
           WHERE pageviews = 1 AND NOT has_engagement
         )::int AS bounces
       FROM per_session`,
      [start, end],
    ),
  ]);

  const values = pageviews.rows[0] || {};
  const sessionValues = sessions.rows[0] || {};
  const sessionCount = Number(sessionValues.sessions) || 0;
  const bounceCount = Number(sessionValues.bounces) || 0;

  return {
    views: Number(values.views) || 0,
    readers: Number(values.readers) || 0,
    avgEngagementMs: Number(values.avg_engagement_ms) || 0,
    sessions: sessionCount,
    bounceRate: sessionCount ? (bounceCount / sessionCount) * 100 : 0,
  };
}

async function trafficSeries(days) {
  const bucketDays = days <= 7 ? 1 : days <= 30 ? 4 : 7;
  const { rows } = await pool.query(
    `WITH buckets AS (
       SELECT generate_series(
         (CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day')::date,
         CURRENT_DATE::date,
         ($2::text || ' days')::interval
       ) AS bucket_start
     )
     SELECT
       CASE
         WHEN $1::int <= 7 THEN to_char(bucket_start, 'Dy')
         ELSE to_char(bucket_start, 'Mon DD')
       END AS label,
       COUNT(pv.id)::int AS value
     FROM buckets
     LEFT JOIN analytics_pageviews pv
       ON pv.viewed_at >= bucket_start
      AND pv.viewed_at < bucket_start + ($2::text || ' days')::interval
     GROUP BY bucket_start
     ORDER BY bucket_start`,
    [days, bucketDays],
  );

  return {
    labels: rows.map((row) => row.label),
    values: rows.map((row) => Number(row.value) || 0),
  };
}

export async function getTrafficChartData() {
  await ensureAnalyticsSchema();
  const [sevenDays, thirtyDays, ninetyDays] = await Promise.all([
    trafficSeries(7),
    trafficSeries(30),
    trafficSeries(90),
  ]);
  return {
    "7d": sevenDays,
    "30d": thirtyDays,
    "90d": ninetyDays,
  };
}

async function getSubscriberCount() {
  const exists = await pool.query(
    `SELECT to_regclass('public.subscribers') IS NOT NULL AS exists`,
  );
  if (!exists.rows[0]?.exists) return 0;
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS count FROM subscribers`);
  return Number(rows[0]?.count) || 0;
}

export async function getPublicSiteStats() {
  await ensureAnalyticsSchema();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [published, monthlyReaders] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS count
       FROM posts
       WHERE status = 'PUBLISHED'`,
    ),
    pool.query(
      `SELECT COUNT(DISTINCT visitor_id)::int AS count
       FROM analytics_pageviews
       WHERE viewed_at >= $1`,
      [monthStart],
    ),
  ]);

  return {
    publishedArticles: formatCompact(published.rows[0]?.count),
    monthlyReaders: formatCompact(monthlyReaders.rows[0]?.count),
  };
}

export async function getDashboardHomeData() {
  await ensureAnalyticsSchema();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    published,
    currentPublished,
    previousPublished,
    currentReaders,
    previousReaders,
    currentComments,
    previousComments,
    subscribers,
    topRows,
    recentRows,
    commentRows,
    traffic,
  ] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS count FROM posts WHERE status = 'PUBLISHED'`),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM posts
       WHERE status = 'PUBLISHED' AND published_at >= $1`,
      [monthStart],
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM posts
       WHERE status = 'PUBLISHED' AND published_at >= $1 AND published_at < $2`,
      [previousMonthStart, monthStart],
    ),
    pool.query(
      `SELECT COUNT(DISTINCT visitor_id)::int AS count
       FROM analytics_pageviews WHERE viewed_at >= $1`,
      [monthStart],
    ),
    pool.query(
      `SELECT COUNT(DISTINCT visitor_id)::int AS count
       FROM analytics_pageviews WHERE viewed_at >= $1 AND viewed_at < $2`,
      [previousMonthStart, monthStart],
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM comments
       WHERE created_at >= $1 AND status <> 'DELETED'`,
      [monthStart],
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM comments
       WHERE created_at >= $1 AND created_at < $2 AND status <> 'DELETED'`,
      [previousMonthStart, monthStart],
    ),
    getSubscriberCount(),
    pool.query(
      `SELECT
         p.id, p.title, p.category,
         COALESCE(COUNT(pv.id), 0)::int AS views,
         COALESCE(p.published_at, p.created_at) AS date
       FROM posts p
       LEFT JOIN analytics_pageviews pv ON pv.post_id = p.id
       WHERE p.status = 'PUBLISHED'
       GROUP BY p.id
       ORDER BY views DESC, date DESC
       LIMIT 5`,
    ),
    pool.query(
      `SELECT
         p.id, p.title, p.category, p.status, p.featured_image,
         COALESCE(COUNT(pv.id), 0)::int AS views,
         COALESCE(p.published_at, p.updated_at, p.created_at) AS date
       FROM posts p
       LEFT JOIN analytics_pageviews pv ON pv.post_id = p.id
       GROUP BY p.id
       ORDER BY COALESCE(p.updated_at, p.created_at) DESC
       LIMIT 4`,
    ),
    pool.query(
      `SELECT author_name, content, created_at
       FROM comments
       WHERE status <> 'DELETED'
       ORDER BY created_at DESC
       LIMIT 4`,
    ),
    getTrafficChartData(),
  ]);

  const publishedTotal = Number(published.rows[0]?.count) || 0;
  const publishedNow = Number(currentPublished.rows[0]?.count) || 0;
  const publishedBefore = Number(previousPublished.rows[0]?.count) || 0;
  const readersNow = Number(currentReaders.rows[0]?.count) || 0;
  const readersBefore = Number(previousReaders.rows[0]?.count) || 0;
  const commentsNow = Number(currentComments.rows[0]?.count) || 0;
  const commentsBefore = Number(previousComments.rows[0]?.count) || 0;

  return {
    greetingDate: now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    stats: {
      published: {
        value: formatCompact(publishedTotal),
        trend: formatPercent(publishedNow, publishedBefore),
        trendDir: trendDirection(publishedNow, publishedBefore),
      },
      readers: {
        value: formatCompact(readersNow),
        trend: formatPercent(readersNow, readersBefore),
        trendDir: trendDirection(readersNow, readersBefore),
      },
      comments: {
        value: formatCompact(commentsNow),
        trend: formatPercent(commentsNow, commentsBefore),
        trendDir: trendDirection(commentsNow, commentsBefore),
      },
      subscribers: {
        value: formatCompact(subscribers),
        trend: "0%",
        trendDir: "up",
      },
    },
    topArticles: topRows.rows.map((row) => ({
      title: row.title,
      meta: `${row.category} · ${formatDateShort(row.date)}`,
      views: formatViews(row.views),
    })),
    recentArticles: recentRows.rows.map((row) => ({
      id: String(row.id),
      title: row.title,
      cat: row.category,
      status: STATUS_TO_UI[row.status] || "draft",
      date: formatDateShort(row.date),
      views: formatViews(row.views),
      image:
        row.featured_image ||
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23e8eee9' width='100' height='100'/%3E%3C/svg%3E",
    })),
    comments: commentRows.rows.map((row) => {
      const name = row.author_name || "Anonymous";
      return {
        initials: initialsFrom(name) || "U",
        name,
        text: row.content,
        time: formatRelative(row.created_at),
      };
    }),
    traffic,
  };
}

function countryName(countryCode) {
  const code = String(countryCode || "").toUpperCase();
  if (!code) return "";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

export async function getAnalyticsData(rangeKey = "30d") {
  await ensureAnalyticsSchema();

  const days = RANGE_DAYS[rangeKey] || 30;
  const { start, end, previousStart, previousEnd } = getBounds(days);

  const [
    current,
    previous,
    traffic,
    channelRows,
    deviceRows,
    countryRows,
    categoryRows,
    articleRows,
  ] = await Promise.all([
    periodMetrics(start, end),
    periodMetrics(previousStart, previousEnd),
    getTrafficChartData(),
    pool.query(
      `WITH period_sessions AS (
         SELECT DISTINCT session_id
         FROM analytics_pageviews
         WHERE viewed_at >= $1 AND viewed_at < $2
       )
       SELECT s.source AS name, COUNT(*)::int AS sessions
       FROM period_sessions ps
       JOIN analytics_sessions s ON s.session_id = ps.session_id
       GROUP BY s.source
       ORDER BY sessions DESC
       LIMIT 5`,
      [start, end],
    ),
    pool.query(
      `WITH period_sessions AS (
         SELECT DISTINCT session_id
         FROM analytics_pageviews
         WHERE viewed_at >= $1 AND viewed_at < $2
       )
       SELECT s.device_type AS name, COUNT(*)::int AS sessions
       FROM period_sessions ps
       JOIN analytics_sessions s ON s.session_id = ps.session_id
       GROUP BY s.device_type
       ORDER BY sessions DESC`,
      [start, end],
    ),
    pool.query(
      `SELECT
         s.country_code,
         COUNT(DISTINCT pv.visitor_id)::int AS readers
       FROM analytics_pageviews pv
       JOIN analytics_sessions s ON s.session_id = pv.session_id
       WHERE pv.viewed_at >= $1 AND pv.viewed_at < $2
         AND s.country_code IS NOT NULL
       GROUP BY s.country_code
       ORDER BY readers DESC
       LIMIT 5`,
      [start, end],
    ),
    pool.query(
      `SELECT p.category AS name, COUNT(pv.id)::int AS views
       FROM analytics_pageviews pv
       JOIN posts p ON p.id = pv.post_id
       WHERE pv.viewed_at >= $1 AND pv.viewed_at < $2
       GROUP BY p.category
       ORDER BY views DESC
       LIMIT 5`,
      [start, end],
    ),
    pool.query(
      `WITH current_views AS (
         SELECT post_id, COUNT(*)::int AS views
         FROM analytics_pageviews
         WHERE viewed_at >= $1 AND viewed_at < $2 AND post_id IS NOT NULL
         GROUP BY post_id
       ),
       previous_views AS (
         SELECT post_id, COUNT(*)::int AS views
         FROM analytics_pageviews
         WHERE viewed_at >= $3 AND viewed_at < $4 AND post_id IS NOT NULL
         GROUP BY post_id
       )
       SELECT
         p.id, p.title, p.category,
         COALESCE(cv.views, 0)::int AS views,
         COALESCE(pv.views, 0)::int AS previous_views
       FROM posts p
       LEFT JOIN current_views cv ON cv.post_id = p.id
       LEFT JOIN previous_views pv ON pv.post_id = p.id
       WHERE p.status = 'PUBLISHED'
       ORDER BY views DESC, COALESCE(p.published_at, p.created_at) DESC
       LIMIT 5`,
      [start, end, previousStart, previousEnd],
    ),
  ]);

  const totalChannelSessions = channelRows.rows.reduce(
    (sum, row) => sum + Number(row.sessions),
    0,
  );
  const totalDeviceSessions = deviceRows.rows.reduce(
    (sum, row) => sum + Number(row.sessions),
    0,
  );
  const totalCountryReaders = countryRows.rows.reduce(
    (sum, row) => sum + Number(row.readers),
    0,
  );
  const totalCategoryViews = categoryRows.rows.reduce(
    (sum, row) => sum + Number(row.views),
    0,
  );
  const deviceColors = {
    Mobile: "var(--db-accent)",
    Desktop: "#3d6e93",
    Tablet: "var(--db-gold)",
  };

  return {
    range: rangeKey,
    stats: {
      views: formatCompact(current.views),
      viewsTrend: formatPercent(current.views, previous.views),
      viewsTrendDir: trendDirection(current.views, previous.views),
      readers: formatCompact(current.readers),
      readersTrend: formatPercent(current.readers, previous.readers),
      readersTrendDir: trendDirection(current.readers, previous.readers),
      avgTime: formatDuration(current.avgEngagementMs),
      avgTimeTrend: formatPercent(
        current.avgEngagementMs,
        previous.avgEngagementMs,
      ),
      avgTimeTrendDir: trendDirection(
        current.avgEngagementMs,
        previous.avgEngagementMs,
      ),
      bounce: `${Math.round(current.bounceRate * 10) / 10}%`,
      bounceTrend: formatPercent(current.bounceRate, previous.bounceRate),
      bounceTrendDir: trendDirection(
        current.bounceRate,
        previous.bounceRate,
        true,
      ),
    },
    traffic,
    channels: channelRows.rows.map((row) => ({
      name: row.name,
      value: totalChannelSessions
        ? Math.round((Number(row.sessions) / totalChannelSessions) * 100)
        : 0,
      sessions: formatCompact(row.sessions),
    })),
    devices: ["Mobile", "Desktop", "Tablet"].map((name) => {
      const row = deviceRows.rows.find((item) => item.name === name);
      const sessions = Number(row?.sessions) || 0;
      return {
        name,
        value: totalDeviceSessions
          ? Math.round((sessions / totalDeviceSessions) * 100)
          : 0,
        color: deviceColors[name],
      };
    }),
    categories: categoryRows.rows.map((row) => ({
      name: row.name,
      views: formatViews(row.views),
      share: totalCategoryViews
        ? Math.round((Number(row.views) / totalCategoryViews) * 100)
        : 0,
    })),
    countries: countryRows.rows.map((row) => ({
      name: countryName(row.country_code),
      readers: formatCompact(row.readers),
      share: totalCountryReaders
        ? Math.round((Number(row.readers) / totalCountryReaders) * 100)
        : 0,
    })),
    topArticles: articleRows.rows.map((row) => ({
      title: row.title,
      cat: row.category,
      views: formatViews(row.views),
      growth: formatPercent(row.views, row.previous_views),
    })),
  };
}
