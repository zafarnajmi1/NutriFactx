import "server-only";
import { createHash, createHmac } from "node:crypto";

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

function getConfig() {
  const config = {
    accountId: process.env.CF_ACCOUNT_ID?.trim(),
    accessKeyId: process.env.CF_R2_ACCESS_KEY_ID?.trim(),
    secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY?.trim(),
    bucket: process.env.CF_R2_BUCKET?.trim() || "nutrifactx-media",
    publicBaseUrl: process.env.CF_R2_PUBLIC_BASE_URL?.trim()?.replace(/\/+$/, ""),
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    const error = new Error(`Missing R2 configuration: ${missing.join(", ")}`);
    error.code = "R2_NOT_CONFIGURED";
    throw error;
  }

  return config;
}

export function isR2Configured() {
  try {
    getConfig();
    return true;
  } catch {
    return false;
  }
}

async function signedR2Request({ method, key, body = Buffer.alloc(0), headers = {} }) {
  const config = getConfig();
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
    method,
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

  return fetch(`https://${host}${canonicalUri}`, {
    method,
    headers: {
      Authorization: authorization,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      ...headers,
    },
    body: method === "DELETE" ? undefined : payload,
  });
}

export async function uploadToR2({ key, body, contentType }) {
  const config = getConfig();
  const response = await signedR2Request({
    method: "PUT",
    key,
    body,
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": contentType,
    },
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`R2 upload failed (${response.status}): ${detail}`);
  }

  return `${config.publicBaseUrl}/${encodeObjectPath(key)}`;
}

/**
 * Delete only objects that belong to this app's configured public R2 domain
 * and the given prefix (e.g. featured/, team/).
 */
export async function deleteR2ObjectByPrefix(imageUrl, prefix) {
  if (!imageUrl || !prefix) return false;

  const config = getConfig();
  let image;
  let publicBase;
  try {
    image = new URL(imageUrl);
    publicBase = new URL(config.publicBaseUrl);
  } catch {
    return false;
  }

  const basePath = publicBase.pathname.replace(/\/+$/, "");
  const objectPrefix = `${basePath}/${prefix.replace(/^\/+|\/+$/g, "")}/`;
  if (
    image.origin !== publicBase.origin ||
    !image.pathname.startsWith(objectPrefix)
  ) {
    return false;
  }

  const encodedKey = image.pathname.slice(basePath.length + 1);
  let key;
  try {
    key = encodedKey
      .split("/")
      .map((part) => decodeURIComponent(part))
      .join("/");
  } catch {
    return false;
  }
  if (!key.startsWith(prefix.replace(/^\/+|\/+$/g, "") + "/")) return false;

  const response = await signedR2Request({ method: "DELETE", key });
  if (!response.ok && response.status !== 404) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`R2 delete failed (${response.status}): ${detail}`);
  }

  return true;
}

/** @deprecated Use deleteR2ObjectByPrefix(url, "featured") */
export async function deleteR2FeaturedImage(imageUrl) {
  return deleteR2ObjectByPrefix(imageUrl, "featured");
}

export async function deleteR2TeamImage(imageUrl) {
  return deleteR2ObjectByPrefix(imageUrl, "team");
}

export async function deleteR2ContentImage(imageUrl) {
  return deleteR2ObjectByPrefix(imageUrl, "content");
}
