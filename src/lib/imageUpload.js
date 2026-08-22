/**
 * Shared image sniffing / validation for dashboard uploads.
 */

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

export const IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/bmp": "bmp",
};

/** Normalize browser MIME quirks (e.g. image/jpg). */
export function normalizeImageMime(type = "") {
  const raw = String(type || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw === "image/jpg" || raw === "image/pjpeg") return "image/jpeg";
  if (raw === "image/x-png") return "image/png";
  if (raw === "image/x-windows-bmp") return "image/bmp";
  return raw;
}

/**
 * Detect real image type from file bytes.
 * WhatsApp and some cameras often use a .png name for JPEG data.
 */
export function detectImageMime(buffer) {
  if (!buffer || buffer.length < 3) return "";

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  const gifHeader = buffer.subarray(0, 6).toString("ascii");
  if (gifHeader === "GIF87a" || gifHeader === "GIF89a") {
    return "image/gif";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(4, 8).toString("ascii") === "ftyp"
  ) {
    const brand = buffer.subarray(8, 12).toString("ascii");
    if (brand.startsWith("avif") || brand.startsWith("avis")) {
      return "image/avif";
    }
  }

  if (
    buffer.length >= 2 &&
    buffer[0] === 0x42 &&
    buffer[1] === 0x4d
  ) {
    return "image/bmp";
  }

  return "";
}

/**
 * Resolve the MIME we should store/serve.
 * Prefer magic bytes; fall back to declared type when sniffing fails.
 */
export function resolveUploadImageMime(buffer, declaredType = "") {
  const sniffed = detectImageMime(buffer);
  if (sniffed && IMAGE_EXTENSIONS[sniffed]) return sniffed;

  const declared = normalizeImageMime(declaredType);
  if (declared && IMAGE_EXTENSIONS[declared]) return declared;

  return "";
}

export function isLikelyImageFile(file) {
  if (!file) return false;
  const type = normalizeImageMime(file.type);
  if (type.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp|avif|bmp|heic|heif)$/i.test(
    String(file.name || ""),
  );
}
