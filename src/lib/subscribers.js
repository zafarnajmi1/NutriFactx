import pool from "./db";

const PLANS = new Set(["weekly", "monthly"]);
const STATUSES = new Set(["active", "paused", "unsubscribed"]);
const globalForSubscribers = globalThis;

async function ensureSubscribersTable() {
  if (!globalForSubscribers.subscribersSchemaPromise) {
    globalForSubscribers.subscribersSchemaPromise = pool
      .query(`
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
        CREATE INDEX IF NOT EXISTS subscribers_status_idx
          ON subscribers (status);
        CREATE INDEX IF NOT EXISTS subscribers_created_at_idx
          ON subscribers (created_at DESC);
      `)
      .catch((error) => {
        globalForSubscribers.subscribersSchemaPromise = null;
        throw error;
      });
  }
  return globalForSubscribers.subscribersSchemaPromise;
}

function initials(name = "") {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function mapSubscriber(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    initials: initials(row.name) || "S",
    plan: PLANS.has(row.plan) ? row.plan : "weekly",
    status: STATUSES.has(row.status) ? row.status : "active",
    source: row.source || "Website",
    joined: new Date(row.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
}

export async function listSubscribers() {
  await ensureSubscribersTable();
  const { rows } = await pool.query(
    `SELECT id, name, email, plan, status, source, created_at
     FROM subscribers
     ORDER BY created_at DESC, id DESC`,
  );
  return rows.map(mapSubscriber);
}

export async function updateSubscriber(id, input) {
  await ensureSubscribersTable();
  const name = String(input.name || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const plan = PLANS.has(input.plan) ? input.plan : "weekly";
  const status = STATUSES.has(input.status) ? input.status : "active";
  const source = String(input.source || "").trim() || "Website";

  const { rows } = await pool.query(
    `UPDATE subscribers
     SET name = $1, email = $2, plan = $3, status = $4, source = $5,
         updated_at = NOW()
     WHERE id = $6
     RETURNING id, name, email, plan, status, source, created_at`,
    [name, email, plan, status, source, Number(id)],
  );
  return mapSubscriber(rows[0]);
}

export async function deleteSubscriber(id) {
  await ensureSubscribersTable();
  const { rowCount } = await pool.query(
    `DELETE FROM subscribers WHERE id = $1`,
    [Number(id)],
  );
  return rowCount > 0;
}
