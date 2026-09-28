import { randomUUID } from "node:crypto";
import {
  getServerDashboardSession,
  requireDashboardSession,
} from "@/lib/session";
import {
  prepareImageUpload,
} from "@/lib/optimizeImage";
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
    const prepared = await prepareImageUpload(file);
    if (!prepared.ok) {
      return Response.json(
        { error: prepared.error },
        { status: prepared.status },
      );
    }

    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const key = `authors/${year}/${month}/${randomUUID()}.${prepared.extension}`;
    const url = await uploadToR2({
      key,
      body: prepared.buffer,
      contentType: prepared.contentType,
    });

    return Response.json(
      {
        ok: true,
        url,
        key,
        name: prepared.originalName || "Author photo",
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
