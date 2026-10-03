import "server-only";
import sharp from "sharp";
import {
  IMAGE_EXTENSIONS,
  MAX_IMAGE_UPLOAD_BYTES,
  resolveUploadImageMime,
} from "@/lib/imageUpload";

const WEBP_MAX_EDGE = 1600;
const WEBP_QUALITY = 75;

const UNSUPPORTED_ERROR =
  "Unsupported image. Use JPG, PNG, WebP, GIF, AVIF, or BMP (any extension is fine).";

/**
 * Convert a dashboard upload to compressed WebP (max 1600px).
 * Animated GIFs stay GIF so motion is not lost.
 */
export async function optimizeImageForUpload(inputBuffer, declaredType = "") {
  const actualType = resolveUploadImageMime(inputBuffer, declaredType);
  if (!actualType || !IMAGE_EXTENSIONS[actualType]) {
    return { ok: false, status: 415, error: UNSUPPORTED_ERROR };
  }

  if (actualType === "image/gif") {
    try {
      const meta = await sharp(inputBuffer, {
        animated: true,
        failOn: "none",
      }).metadata();
      if ((meta.pages || 1) > 1) {
        return {
          ok: true,
          buffer: inputBuffer,
          contentType: "image/gif",
          extension: "gif",
        };
      }
    } catch {
      /* convert still GIF to WebP below */
    }
  }

  try {
    const buffer = await sharp(inputBuffer, { failOn: "none" })
      .rotate()
      .resize({
        width: WEBP_MAX_EDGE,
        height: WEBP_MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY, effort: 6 })
      .toBuffer();

    return {
      ok: true,
      buffer,
      contentType: "image/webp",
      extension: "webp",
    };
  } catch {
    return {
      ok: false,
      status: 415,
      error: "Could not convert this image. Try JPG, PNG, or WebP.",
    };
  }
}

export async function prepareImageUpload(file) {
  if (!(file instanceof File) || !file.size) {
    return { ok: false, status: 400, error: "Please choose an image to upload." };
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return { ok: false, status: 413, error: "Image must be under 10MB." };
  }

  const input = Buffer.from(await file.arrayBuffer());
  const optimized = await optimizeImageForUpload(input, file.type);
  if (!optimized.ok) return optimized;

  return {
    ...optimized,
    originalName: String(file.name || "image").slice(0, 255),
  };
}
