import { randomUUID } from "node:crypto";
import {
  getServerDashboardSession,
  requireDashboardSession,
} from "@/lib/session";
import {
  IMAGE_EXTENSIONS,
  MAX_IMAGE_UPLOAD_BYTES,
  resolveUploadImageMime,
} from "@/lib/imageUpload";
import {
  deleteR2AuthorImage,
  isR2Configured,
  uploadToR2,
} from "@/lib/r2";

export const runtime = "nodejs";

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

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      return Response.json(
        { error: "Image must be under 10MB." },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const actualType = resolveUploadImageMime(buffer, file.type);
    if (!actualType || !IMAGE_EXTENSIONS[actualType]) {
      return Response.json(
        {
          error:
            "Unsupported image. Use JPG, PNG, WebP, GIF, AVIF, or BMP (any extension is fine).",
        },
        { status: 415 },
      );
    }

    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const key = `authors/${year}/${month}/${randomUUID()}.${IMAGE_EXTENSIONS[actualType]}`;
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
        name: String(file.name || "Author photo").slice(0, 255),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/uploads/authors", error);
    return Response.json(
      { error: "Failed to upload author image." },
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
    const deleted = await deleteR2AuthorImage(body.url);
    return Response.json({ ok: true, deleted });
  } catch (error) {
    console.error("DELETE /api/uploads/authors", error);
    return Response.json(
      { error: "Failed to remove author image." },
      { status: 500 },
    );
  }
}
