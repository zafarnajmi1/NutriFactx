#!/usr/bin/env node
/**
 * Seeds About Us team members using existing Cloudflare R2 image URLs.
 * Safe to re-run: skips names that already exist.
 * Usage: node scripts/seed-team-from-r2.js
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

const TEAM = [
  {
    name: "Emma Wilson",
    role: "Chief Editor",
    image:
      "https://media.nutrifactx.com/team/2026/08/9c6c0f8d-e7e1-4129-823e-ff90d3da90ce.png",
    sortOrder: 0,
  },
  {
    name: "Sophia Clarke",
    role: "Medical Content Writer",
    image:
      "https://media.nutrifactx.com/team/2026/08/fb167372-a2f7-4ad0-b445-47ac4315b9b5.jpg",
    sortOrder: 0,
  },
  {
    name: "Olivia Bennett",
    role: "Fact-Checker / Research Analyst",
    image:
      "https://media.nutrifactx.com/team/2026/08/b17aeb88-780a-4f99-8a89-7c38d66b935b.jpg",
    sortOrder: 0,
  },
  {
    name: "Daniel Brooks",
    role: "Graphic/Content Designer",
    image:
      "https://media.nutrifactx.com/team/2026/08/576efd6e-7121-44a6-a155-ddbe1f57beb1.jpg",
    sortOrder: 0,
  },
  {
    name: "Jack Morrison",
    role: "Social Media & Outreach Manager",
    image:
      "https://media.nutrifactx.com/team/2026/08/337ea275-2987-4e64-b180-ba8ae73924e7.jpg",
    sortOrder: 0,
  },
  {
    name: "Henry Walker",
    role: "Copy Editor",
    image:
      "https://media.nutrifactx.com/team/2026/08/43dd138b-4ed7-421f-a568-8fb179bdcf5d.jpg",
    sortOrder: 0,
  },
  {
    name: "Amelia Foster",
    role: "Nutrition Writer",
    image:
      "https://media.nutrifactx.com/team/2026/08/75a55c67-1cf0-47b5-b771-6b45800f8b86.jpg",
    sortOrder: 5,
  },
  {
    name: "James Carter",
    role: "Health & Nutrition Researcher",
    image:
      "https://media.nutrifactx.com/team/2026/08/58a21dba-9fc4-4cda-85ca-d51b055c92a4.jpg",
    sortOrder: 5,
  },
];

(async () => {
  await pool.query(`
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
  `);

  let inserted = 0;
  for (const member of TEAM) {
    const result = await pool.query(
      `INSERT INTO site_team_members (name, role, image_url, sort_order, is_active)
       SELECT $1, $2, $3, $4, TRUE
       WHERE NOT EXISTS (
         SELECT 1 FROM site_team_members WHERE name = $1
       )
       RETURNING id`,
      [member.name, member.role, member.image, member.sortOrder],
    );
    if (result.rowCount) inserted += 1;
  }

  const { rows } = await pool.query(
    `SELECT count(*)::int AS c FROM site_team_members WHERE is_active = TRUE`,
  );
  console.log(`Team seed done. Inserted ${inserted}. Active members: ${rows[0].c}`);
  await pool.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
