#!/usr/bin/env node
/**
 * Quick PostgreSQL connection check for local development.
 * Usage: node scripts/check-db.js
 */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local — copy .env.example and set your DB credentials.");
  process.exit(1);
}

const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

const host =
  !env.DB_HOST || env.DB_HOST === "localhost" ? "127.0.0.1" : env.DB_HOST;

const pool = new Pool({
  user: env.DB_USER,
  host,
  database: env.DB_NAME,
  password: env.DB_PASSWORD,
  port: Number(env.DB_PORT) || 5432,
  connectionTimeoutMillis: 5000,
});

(async () => {
  try {
    const { rows } = await pool.query("SELECT current_database() AS db, current_user AS user");
    console.log(`Connected to PostgreSQL: database=${rows[0].db}, user=${rows[0].user}`);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("PostgreSQL connection failed:", error.message);
    console.error("");
    console.error("Fix:");
    console.error("1. Open pgAdmin or start PostgreSQL 18 from Applications");
    console.error("2. Confirm .env.local matches your local database name/password");
    console.error("3. Run: node scripts/check-db.js");
    await pool.end().catch(() => {});
    process.exit(1);
  }
})();
