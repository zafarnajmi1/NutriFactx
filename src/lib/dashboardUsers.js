import pool, { shouldUseLocalDbFallback } from "./db";

const globalForUsers = globalThis;

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function mapDbRole(role) {
  const value = String(role || "").toUpperCase();
  if (value === "ADMIN") return "admin";
  if (value === "MANAGER") return "manager";
  return "manager";
}

function mapSessionRole(role) {
  const value = String(role || "").toLowerCase();
  if (value === "admin") return "ADMIN";
  if (value === "manager") return "MANAGER";
  return "MANAGER";
}

function formatJoined(date) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function mapDashboardUser(row) {
  if (!row) return null;
  const role = mapDbRole(row.user_role);
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    initials: initialsFromName(row.name),
    role,
    status: row.status || "active",
    department: row.department || "Content",
    joined: formatJoined(row.created_at),
    hasPassword: Boolean(row.password),
  };
}

async function ensureUserColumns() {
  if (!globalForUsers.userColumnsPromise) {
    globalForUsers.userColumnsPromise = pool
      .query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Content';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      `)
      .catch((error) => {
        globalForUsers.userColumnsPromise = null;
        throw error;
      });
  }
  return globalForUsers.userColumnsPromise;
}

export async function listDashboardUsers() {
  await ensureUserColumns();
  const { rows } = await pool.query(
    `SELECT id, name, email, password, user_role, department, status, created_at, updated_at
     FROM users
     WHERE user_role IN ('ADMIN', 'MANAGER')
     ORDER BY
       CASE user_role WHEN 'ADMIN' THEN 0 ELSE 1 END,
       created_at ASC,
       id ASC`,
  );
  return rows.map(mapDashboardUser);
}

export async function getDashboardUserById(id) {
  await ensureUserColumns();
  const { rows } = await pool.query(
    `SELECT id, name, email, password, user_role, department, status, created_at, updated_at
     FROM users
     WHERE id = $1
       AND user_role IN ('ADMIN', 'MANAGER')
     LIMIT 1`,
    [Number(id)],
  );
  return mapDashboardUser(rows[0]);
}

export async function emailExists(email, excludeId = null) {
  await ensureUserColumns();
  const normalized = String(email || "").trim().toLowerCase();
  const { rows } = await pool.query(
    `SELECT id FROM users WHERE lower(email) = $1 LIMIT 1`,
    [normalized],
  );
  if (!rows.length) return false;
  if (excludeId && String(rows[0].id) === String(excludeId)) return false;
  return true;
}

export async function createDashboardUser(input) {
  await ensureUserColumns();

  const name = String(input.name || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const password = String(input.password || "");
  const role = mapSessionRole(input.role);
  const department = String(input.department || "Content").trim() || "Content";
  const status = String(input.status || "active").trim() === "inactive" ? "inactive" : "active";

  if (!name || !email) {
    throw new Error("Name and email are required.");
  }
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  if (await emailExists(email)) {
    throw new Error("A user with this email already exists.");
  }

  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password, user_role, department, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4::user_role, $5, $6, NOW(), NOW())
     RETURNING id`,
    [name, email, password, role, department, status],
  );

  return getDashboardUserById(rows[0].id);
}

export async function updateDashboardUser(id, input) {
  await ensureUserColumns();
  const existing = await getDashboardUserById(id);
  if (!existing) return null;

  const name = String(input.name ?? existing.name).trim();
  const email = String(input.email ?? existing.email).trim().toLowerCase();
  const role = mapSessionRole(input.role ?? existing.role);
  const department = String(input.department ?? existing.department).trim() || "Content";
  const status =
    String(input.status ?? existing.status).trim() === "inactive" ? "inactive" : "active";
  const password = String(input.password || "");

  if (!name || !email) {
    throw new Error("Name and email are required.");
  }
  if (password && password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  if (await emailExists(email, id)) {
    throw new Error("A user with this email already exists.");
  }

  const params = [name, email, role, department, status];
  let passwordClause = "";
  if (password) {
    passwordClause = ", password = $6";
    params.push(password);
  }
  params.push(Number(id));
  const idParam = password ? "$7" : "$6";

  await pool.query(
    `UPDATE users SET
       name = $1,
       email = $2,
       user_role = $3::user_role,
       department = $4,
       status = $5,
       updated_at = NOW()
       ${passwordClause}
     WHERE id = ${idParam}
       AND user_role IN ('ADMIN', 'MANAGER')`,
    params,
  );

  return getDashboardUserById(id);
}

export async function deleteDashboardUser(id) {
  await ensureUserColumns();
  const existing = await getDashboardUserById(id);
  if (!existing) return false;

  const { rowCount } = await pool.query(
    `DELETE FROM users
     WHERE id = $1
       AND user_role IN ('ADMIN', 'MANAGER')`,
    [Number(id)],
  );
  return rowCount > 0;
}

export async function authenticateDashboardUser(email, password) {
  await ensureUserColumns();
  const normalized = String(email || "").trim().toLowerCase();
  const pass = String(password || "");

  const { rows } = await pool.query(
    `SELECT id, name, email, password, user_role, department, status, created_at, updated_at
     FROM users
     WHERE lower(email) = $1
       AND user_role IN ('ADMIN', 'MANAGER')
     LIMIT 1`,
    [normalized],
  );

  const row = rows[0];
  if (!row || row.password !== pass) return null;
  if (row.status === "inactive") return null;

  const mapped = mapDashboardUser(row);
  return {
    id: mapped.id,
    name: mapped.name,
    email: mapped.email,
    role: mapped.role,
    title: mapped.role === "admin" ? "Admin" : "Manager",
    initials: mapped.initials,
  };
}

export async function tryAuthenticateDashboardUser(email, password) {
  try {
    return await authenticateDashboardUser(email, password);
  } catch (error) {
    if (shouldUseLocalDbFallback(error)) {
      return null;
    }
    throw error;
  }
}
