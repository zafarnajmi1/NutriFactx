import pool from "./db";

async function ensureContactMessagesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      topic TEXT NOT NULL DEFAULT 'Other',
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
      ON contact_messages (created_at DESC);
    CREATE INDEX IF NOT EXISTS contact_messages_status_idx
      ON contact_messages (status);
  `);
}

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

function mapMessage(row) {
  return {
    id: String(row.id),
    name: row.full_name,
    email: row.email || "",
    initials: initialsFrom(row.full_name) || "U",
    topic: row.topic || "Other",
    text: row.message,
    status: row.status || "new",
    date: formatDate(row.created_at),
    time: formatRelative(row.created_at),
    createdAt: row.created_at,
  };
}

export async function createContactMessage({ name, email, topic, message }) {
  await ensureContactMessagesTable();
  const { rows } = await pool.query(
    `INSERT INTO contact_messages (full_name, email, topic, message, status, updated_at)
     VALUES ($1, $2, $3, $4, 'new', NOW())
     RETURNING *`,
    [
      String(name || "").trim(),
      String(email || "").trim().toLowerCase(),
      String(topic || "Other").trim() || "Other",
      String(message || "").trim(),
    ],
  );
  return rows[0] ? mapMessage(rows[0]) : null;
}

export async function listContactMessages() {
  await ensureContactMessagesTable();
  const { rows } = await pool.query(
    `SELECT * FROM contact_messages
     ORDER BY created_at DESC`,
  );
  return rows.map(mapMessage);
}

export async function updateContactMessage(id, { status, message }) {
  await ensureContactMessagesTable();
  const fields = [];
  const params = [];
  let i = 1;

  if (typeof message === "string" && message.trim()) {
    fields.push(`message = $${i++}`);
    params.push(message.trim());
  }

  if (status && ["new", "read", "replied", "archived"].includes(status)) {
    fields.push(`status = $${i++}`);
    params.push(status);
  }

  if (!fields.length) return null;

  fields.push(`updated_at = NOW()`);
  params.push(Number(id));

  const { rows } = await pool.query(
    `UPDATE contact_messages
     SET ${fields.join(", ")}
     WHERE id = $${i}
     RETURNING *`,
    params,
  );

  return rows[0] ? mapMessage(rows[0]) : null;
}

export async function deleteContactMessage(id) {
  await ensureContactMessagesTable();
  const result = await pool.query(
    `DELETE FROM contact_messages WHERE id = $1 RETURNING id`,
    [Number(id)],
  );
  return Boolean(result.rows[0]);
}
