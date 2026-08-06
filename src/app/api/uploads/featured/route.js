import { randomUUID } from "node:crypto";
import {
  getServerDashboardSession,
  requireDashboardSession,
} from "@/lib/session";
import {
  deleteR2FeaturedImage,
  isR2Configured,
  uploadToR2,
} from "@/lib/r2";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function detectedImageType(buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
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

  return "";
}

export async function POST(request) {
  const session = await getServerDashboardSession();
  const gate = requireDashboardSession(session);
  if (!gate.ok) return gate.response;

  if (!isR2Configured()) {
    return Response.json(
      { error: "Cloudflare R2 is not configured on the server." },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || !file.size) {
      return Response.json(
        { error: "Please choose an image to upload." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: "Image must be under 5MB." },
        { status: 413 },
      );
    }

    if (!IMAGE_TYPES[file.type]) {
      return Response.json(
        { error: "Only JPG, PNG, WebP, and GIF images are supported." },
        { status: 415 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const actualType = detectedImageType(buffer);
    if (!actualType || actualType !== file.type) {
      return Response.json(
        { error: "The selected file is not a valid image." },
        { status: 415 },
      );
    }

    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const key = `featured/${year}/${month}/${randomUUID()}.${IMAGE_TYPES[actualType]}`;
    const url = await uploadToR2({
      key,
      body: buffer,
      contentType: actualType,
    });

    return Response.json(
      {
        ok: true,
        url,
        key,
        name: String(file.name || "Featured image").slice(0, 255),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/uploads/featured", error);
    return Response.json(
      { error: "Failed to upload featured image." },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  const session = await getServerDashboardSession();
  const gate = requireDashboardSession(session);
  if (!gate.ok) return gate.response;

  if (!isR2Configured()) {
    return Response.json(
      { error: "Cloudflare R2 is not configured on the server." },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const deleted = await deleteR2FeaturedImage(body.url);
    return Response.json({ ok: true, deleted });
  } catch (error) {
    console.error("DELETE /api/uploads/featured", error);
    return Response.json(
      { error: "Failed to remove featured image." },
      { status: 500 },
    );
  }
}
