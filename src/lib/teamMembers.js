import pool from "./db";

const globalForTeam = globalThis;

function mapTeamMember(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name,
    role: row.role,
    image: row.image_url || "",
    bio: row.bio || "",
    sortOrder: Number(row.sort_order) || 0,
    isActive: row.is_active !== false,
  };
}

async function ensureTeamTable() {
  if (!globalForTeam.teamSchemaPromise) {
    globalForTeam.teamSchemaPromise = pool
      .query(`
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
      `)
      .catch((error) => {
        globalForTeam.teamSchemaPromise = null;
        throw error;
      });
  }
  return globalForTeam.teamSchemaPromise;
}

export async function listTeamMembers({ activeOnly = false } = {}) {
  await ensureTeamTable();
  const where = activeOnly ? "WHERE is_active = TRUE" : "";
  const { rows } = await pool.query(
    `SELECT id, name, role, image_url, bio, sort_order, is_active, created_at, updated_at
     FROM site_team_members
     ${where}
     ORDER BY sort_order ASC, id ASC`,
  );
  return rows.map(mapTeamMember);
}

export async function getTeamMemberById(id) {
  await ensureTeamTable();
  const { rows } = await pool.query(
    `SELECT id, name, role, image_url, bio, sort_order, is_active, created_at, updated_at
     FROM site_team_members
     WHERE id = $1
     LIMIT 1`,
    [Number(id)],
  );
  return mapTeamMember(rows[0]);
}

export async function createTeamMember(input) {
  await ensureTeamTable();
  const name = String(input.name || "").trim();
  const role = String(input.role || "").trim();
  if (!name || !role) {
    throw new Error("Name and designation are required.");
  }

  const { rows } = await pool.query(
    `INSERT INTO site_team_members (
       name, role, image_url, bio, sort_order, is_active, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING id`,
    [
      name,
      role,
      String(input.image || "").trim() || null,
      String(input.bio || "").trim() || null,
      Number(input.sortOrder) || 0,
      input.isActive !== false,
    ],
  );

  return getTeamMemberById(rows[0].id);
}

export async function updateTeamMember(id, input) {
  await ensureTeamTable();
  const existing = await getTeamMemberById(id);
  if (!existing) return null;

  const name = String(input.name ?? existing.name).trim();
  const role = String(input.role ?? existing.role).trim();
  if (!name || !role) {
    throw new Error("Name and designation are required.");
  }

  await pool.query(
    `UPDATE site_team_members SET
       name = $1,
       role = $2,
       image_url = $3,
       bio = $4,
       sort_order = $5,
       is_active = $6,
       updated_at = NOW()
     WHERE id = $7`,
    [
      name,
      role,
      String(input.image ?? existing.image).trim() || null,
      String(input.bio ?? existing.bio).trim() || null,
      Number(input.sortOrder ?? existing.sortOrder) || 0,
      input.isActive !== false,
      Number(id),
    ],
  );

  return getTeamMemberById(id);
}

export async function deleteTeamMember(id) {
  await ensureTeamTable();
  const { rows } = await pool.query(
    `DELETE FROM site_team_members WHERE id = $1 RETURNING image_url`,
    [Number(id)],
  );
  return rows[0] || null;
}
