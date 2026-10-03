#!/usr/bin/env node
/**
 * Convert existing R2 media (featured, content, authors, team) to compressed WebP.
 * Overwrites the original object so live <img> URLs keep working, and also
 * writes a .webp sibling. Updates the connected database URLs when possible.
 *
 * Usage:
 *   node scripts/convert-r2-images-to-webp.js
 *   DRY_RUN=1 node scripts/convert-r2-images-to-webp.js
 */
const fs = require("fs");
const path = require("path");
const { createHash, createHmac } = require("node:crypto");
const sharp = require("sharp");
const { Pool } = require("pg");

const WEBP_MAX_EDGE = 1600;
const WEBP_QUALITY = 75;
const SKIP_IF_WEBP_UNDER = 120 * 1024;

function loadEnv() {
  const out = {};
  for (const name of [".env.local", ".env"]) {
    const envPath = path.join(__dirname, "..", name);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const i = line.indexOf("=");
      const key = line.slice(0, i).trim();
      if (!(key in out)) out[key] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
  return out;
}

const env = loadEnv();
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

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

async function signedR2({ method, key = "", query = "", body = Buffer.alloc(0), headers = {} }) {
  const config = getR2Config();
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(body);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const objectPath = key ? `/${encodeURIComponent(config.bucket)}/${encodeObjectPath(key)}` : `/${encodeURIComponent(config.bucket)}`;
  const payloadHash = sha256(payload);
  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    method,
    objectPath,
    query,
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
  const url = `https://${host}${objectPath}${query ? `?${query}` : ""}`;
  return fetch(url, {
    method,
    headers: {
      Authorization: authorization,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      ...headers,
    },
    body: method === "GET" || method === "DELETE" ? undefined : payload,
  });
}

function encodeRfc3986(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) =>
    `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function canonicalQuery(params) {
  return Object.keys(params)
    .sort()
    .map((key) => `${encodeRfc3986(key)}=${encodeRfc3986(String(params[key]))}`)
    .join("&");
}

async function listR2Keys() {
  const keys = [];
  let continuation = "";
  do {
    const params = { "list-type": "2", "max-keys": "1000" };
    if (continuation) params["continuation-token"] = continuation;
    const query = canonicalQuery(params);
    const response = await signedR2({ method: "GET", query });
    const xml = await response.text();
    if (!response.ok) {
      throw new Error(`R2 list failed (${response.status}): ${xml.slice(0, 400)}`);
    }
    const found = [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map((match) =>
      match[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"'),
    );
    keys.push(...found);
    const truncated = /<IsTruncated>\s*true\s*<\/IsTruncated>/i.test(xml);
    const tokenMatch = xml.match(
      /<NextContinuationToken>([^<]+)<\/NextContinuationToken>/,
    );
    continuation = truncated && tokenMatch ? tokenMatch[1] : "";
  } while (continuation);
  return keys;
}

async function getR2Object(key) {
  const response = await signedR2({ method: "GET", key });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`R2 get failed (${response.status}) ${key}: ${detail}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "";
  return { buffer, contentType };
}

async function putR2Object(key, body, contentType) {
  const response = await signedR2({
    method: "PUT",
    key,
    body,
    headers: {
      "Cache-Control": "public, max-age=604800",
      "Content-Type": contentType,
    },
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 400);
    throw new Error(`R2 put failed (${response.status}) ${key}: ${detail}`);
  }
}

function webpKeyFor(key) {
  return key.replace(/\.(png|jpe?g|bmp|avif|webp)$/i, ".webp");
}

function publicUrlFor(key) {
  const config = getR2Config();
  return `${config.publicBaseUrl}/${encodeObjectPath(key)}`;
}

async function toWebp(buffer) {
  const image = sharp(buffer, { animated: true, failOn: "none" });
  const meta = await image.metadata();
  if (meta.format === "gif" && (meta.pages || 1) > 1) {
    return { skip: "animated-gif" };
  }
  const webp = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({
      width: WEBP_MAX_EDGE,
      height: WEBP_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 6 })
    .toBuffer();
  return { skip: null, buffer: webp, width: meta.width, height: meta.height };
}

async function rewriteDatabase(pool, urlMap) {
  if (!urlMap.size) return 0;
  let changed = 0;
  const { rows: posts } = await pool.query(
    `SELECT id, featured_image, featured_image_name, og_image, twitter_image, content FROM posts`,
  );
  for (const row of posts) {
    let featured = row.featured_image || "";
    let og = row.og_image || "";
    let twitter = row.twitter_image || "";
    let content = row.content || "";
    let name = row.featured_image_name || "";
    let dirty = false;
    for (const [from, to] of urlMap) {
      if (featured === from) {
        featured = to;
        dirty = true;
      }
      if (og === from) {
        og = to;
        dirty = true;
      }
      if (twitter === from) {
        twitter = to;
        dirty = true;
      }
      if (content.includes(from)) {
        content = content.split(from).join(to);
        dirty = true;
      }
      if (name && from.endsWith(path.posix.basename(from))) {
        name = name.replace(/\.(png|jpe?g|bmp|avif)$/i, ".webp");
      }
    }
    if (!dirty) continue;
    if (!DRY_RUN) {
      await pool.query(
        `UPDATE posts
         SET featured_image = $1,
             featured_image_name = $2,
             og_image = $3,
             twitter_image = $4,
             content = $5,
             updated_at = NOW()
         WHERE id = $6`,
        [featured || null, name || null, og || null, twitter || null, content, row.id],
      );
    }
    changed += 1;
    console.log(`  db posts#${row.id} urls updated`);
  }

  for (const table of ["site_authors", "site_team_members"]) {
    try {
      const { rows } = await pool.query(`SELECT id, image_url FROM ${table}`);
      for (const row of rows) {
        const next = urlMap.get(row.image_url);
        if (!next || next === row.image_url) continue;
        if (!DRY_RUN) {
          await pool.query(
            `UPDATE ${table} SET image_url = $1, updated_at = NOW() WHERE id = $2`,
            [next, row.id],
          );
        }
        changed += 1;
        console.log(`  db ${table}#${row.id} url updated`);
      }
    } catch {
      /* ignore missing table/column */
    }
  }
  return changed;
}

function isConvertibleKey(key) {
  if (!/\.(png|jpe?g|bmp|avif|webp)$/i.test(key)) return false;
  if (key.startsWith("brand/") || key.includes("favicon")) return false;
  return /^(featured|content|authors|team)\//.test(key);
}

async function main() {
  const config = getR2Config();
  console.log(
    `${DRY_RUN ? "[dry-run] " : ""}Converting R2 images in ${config.bucket} → WebP (max ${WEBP_MAX_EDGE}px, q${WEBP_QUALITY})`,
  );

  const keys = (await listR2Keys()).filter(isConvertibleKey);
  console.log(`Found ${keys.length} image object(s)`);

  const urlMap = new Map();
  let converted = 0;
  let skipped = 0;
  let saved = 0;

  for (const key of keys) {
    try {
      const { buffer } = await getR2Object(key);
      if (/\.webp$/i.test(key) && buffer.length <= SKIP_IF_WEBP_UNDER) {
        skipped += 1;
        continue;
      }
      const result = await toWebp(buffer);
      if (result.skip) {
        console.log(`  skip ${key} (${result.skip})`);
        skipped += 1;
        continue;
      }
      if (result.buffer.length >= buffer.length && /\.webp$/i.test(key)) {
        skipped += 1;
        continue;
      }
      const nextKey = webpKeyFor(key);
      const fromUrl = publicUrlFor(key);
      const toUrl = publicUrlFor(nextKey);
      console.log(
        `  ${key}  ${buffer.length} → ${result.buffer.length} bytes` +
          (nextKey !== key ? `  (+ ${nextKey})` : ""),
      );
      if (!DRY_RUN) {
        await putR2Object(key, result.buffer, "image/webp");
        if (nextKey !== key) {
          await putR2Object(nextKey, result.buffer, "image/webp");
        }
      }
      urlMap.set(fromUrl, toUrl);
      converted += 1;
      saved += Math.max(0, buffer.length - result.buffer.length);
    } catch (error) {
      console.warn(`  fail ${key}: ${error.message}`);
    }
  }

  const pool = new Pool({
    user: env.DB_USER,
    host: !env.DB_HOST || env.DB_HOST === "localhost" ? "127.0.0.1" : env.DB_HOST,
    database: env.DB_NAME,
    password: env.DB_PASSWORD,
    port: Number(env.DB_PORT) || 5432,
  });
  try {
    const dbChanged = await rewriteDatabase(pool, urlMap);
    console.log(`Database rows updated: ${dbChanged}`);
  } finally {
    await pool.end();
  }

  console.log(
    `\nDone. converted=${converted} skipped=${skipped} saved≈${Math.round(saved / 1024)} KiB${DRY_RUN ? " (dry run)" : ""}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
