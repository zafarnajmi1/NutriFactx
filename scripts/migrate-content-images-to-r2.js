#!/usr/bin/env node
/**
 * Migrates base64 data:image embeds in post content to Cloudflare R2 URLs.
 * Safe to re-run: skips images that are already http(s) URLs.
 *
 * Usage: node scripts/migrate-content-images-to-r2.js
 * Dry run: DRY_RUN=1 node scripts/migrate-content-images-to-r2.js
 */
const fs = require("fs");
const path = require("path");
const { createHash, createHmac, randomUUID } = require("node:crypto");
const { Pool } = require("pg");

function loadEnv() {
  const candidates = [".env.local", ".env"];
  const out = {};
  for (const name of candidates) {
    const envPath = path.join(__dirname, "..", name);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const i = line.indexOf("=");
      const key = line.slice(0, i).trim();
      const val = line.slice(i + 1).trim();
      if (!(key in out)) out[key] = val;
    }
  }
  return out;
}

const env = loadEnv();
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

const IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/bmp": "bmp",
};

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key, value) {
  return createHmac("sha256", key).update(value).digest();
}

function encodeObjectPath(value) {
  return String(value)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function getR2Config() {
  const config = {
    accountId: env.CF_ACCOUNT_ID?.trim(),
    accessKeyId: env.CF_R2_ACCESS_KEY_ID?.trim(),
    secretAccessKey: env.CF_R2_SECRET_ACCESS_KEY?.trim(),
    bucket: env.CF_R2_BUCKET?.trim() || "nutrifactx-media",
    publicBaseUrl: env.CF_R2_PUBLIC_BASE_URL?.trim()?.replace(/\/+$/, ""),
  };
  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) {
    throw new Error(`Missing R2 configuration: ${missing.join(", ")}`);
  }
  return config;
}

async function uploadToR2({ key, body, contentType }) {
  const config = getR2Config();
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(body);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${encodeURIComponent(config.bucket)}/${encodeObjectPath(key)}`;
  const payloadHash = sha256(payload);
  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");
  const dateKey = hmac(`AWS4${config.secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, "auto");
  const serviceKey = hmac(regionKey, "s3");
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(`https://${host}${canonicalUri}`, {
    method: "PUT",
    headers: {
      Authorization: authorization,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": contentType,
    },
    body: payload,
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`R2 upload failed (${response.status}): ${detail}`);
  }

  return `${config.publicBaseUrl}/${encodeObjectPath(key)}`;
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(
    /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i,
  );
  if (!match) return null;
  const contentType = match[1].toLowerCase();
  if (!IMAGE_EXTENSIONS[contentType]) return null;
  const buffer = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
  if (!buffer.length) return null;
  return { contentType, buffer };
}

const DATA_IMG_RE =
  /(?:src\s*=\s*["']|url\()(data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+)["']?\)?/gi;

async function migrateHtml(html) {
  const text = String(html || "");
  if (!text.includes("data:image")) {
    return { html: text, replaced: 0 };
  }

  const found = [];
  let m;
  const re = new RegExp(DATA_IMG_RE.source, "gi");
  while ((m = re.exec(text)) !== null) {
    found.push(m[1]);
  }
  if (!found.length) return { html: text, replaced: 0 };

  const unique = [...new Set(found)];
  const map = new Map();
  let replaced = 0;

  for (const dataUrl of unique) {
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
      console.warn("  skip unreadable data URL");
      continue;
    }
    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const key = `content/${year}/${month}/${randomUUID()}.${IMAGE_EXTENSIONS[parsed.contentType]}`;
    if (DRY_RUN) {
      const fake = `https://media.nutrifactx.com/${key}`;
      map.set(dataUrl, fake);
      replaced += 1;
      console.log(`  [dry-run] would upload ${parsed.contentType} (${parsed.buffer.length} bytes)`);
      continue;
    }
    const url = await uploadToR2({
      key,
      body: parsed.buffer,
      contentType: parsed.contentType,
    });
    map.set(dataUrl, url);
    replaced += 1;
    console.log(`  uploaded ${parsed.contentType} → ${url}`);
  }

  let next = text;
  for (const [dataUrl, url] of map.entries()) {
    next = next.split(dataUrl).join(url);
  }
  return { html: next, replaced };
}

async function main() {
  getR2Config();
  const pool = new Pool({
    user: env.DB_USER,
    host: env.DB_HOST,
    database: env.DB_NAME,
    password: env.DB_PASSWORD,
    port: Number(env.DB_PORT) || 5432,
  });

  try {
    const { rows } = await pool.query(
      `SELECT id, slug, title, content
       FROM posts
       WHERE content LIKE '%data:image%'
       ORDER BY id ASC`,
    );
    console.log(
      `Found ${rows.length} post(s) with embedded images${DRY_RUN ? " (dry run)" : ""}`,
    );

    let totalImages = 0;
    for (const row of rows) {
      console.log(`\n#${row.id} ${row.slug || row.title}`);
      const { html, replaced } = await migrateHtml(row.content);
      totalImages += replaced;
      if (!replaced) continue;
      if (!DRY_RUN && html !== row.content) {
        await pool.query(
          `UPDATE posts SET content = $1, updated_at = NOW() WHERE id = $2`,
          [html, row.id],
        );
        console.log(`  saved (${replaced} image(s))`);
      }
    }

    console.log(`\nDone. Migrated ${totalImages} image(s) across ${rows.length} post(s).`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
