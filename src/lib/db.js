import { Pool } from "pg";

const globalForPg = globalThis;

function resolveDbHost(host) {
  const trimmed = String(host || "").trim();
  if (!trimmed || trimmed === "localhost") return "127.0.0.1";
  return trimmed;
}

function getPoolConfig() {
  const missing = ["DB_USER", "DB_HOST", "DB_NAME", "DB_PASSWORD"].filter(
    (key) => !String(process.env[key] || "").trim(),
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing database env vars: ${missing.join(", ")}. Add them to .env.local`,
    );
  }

  return {
    user: process.env.DB_USER,
    host: resolveDbHost(process.env.DB_HOST),
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  };
}

export function isDbUnavailableError(error) {
  if (!error) return false;

  if (Array.isArray(error.errors)) {
    return error.errors.some((item) => isDbUnavailableError(item));
  }

  const code = error.code;
  return (
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "57P01" ||
    code === "53300"
  );
}

export function shouldUseLocalDbFallback(error) {
  return process.env.NODE_ENV !== "production" && isDbUnavailableError(error);
}

const pool =
  globalForPg.pgPool ??
  new Pool(getPoolConfig());

pool.on("error", (error) => {
  console.error("[db] Unexpected pool error:", error.message);
});

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

export default pool;
