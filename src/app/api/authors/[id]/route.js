import {
  deleteAuthor,
  getAuthorById,
  updateAuthor,
} from "@/lib/authors";
import { deleteR2AuthorImage } from "@/lib/r2";
import { getServerDashboardSession, requireAdmin } from "@/lib/session";

async function cleanupAuthorImage(imageUrl) {
  if (!imageUrl) return;
  try {
    await deleteR2AuthorImage(imageUrl);
  } catch (error) {
    console.error("Cloudflare author image cleanup", error);
  }
}

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const author = await getAuthorById(id);
    if (!author || !author.isActive) {
      return Response.json({ error: "Author not found." }, { status: 404 });
    }
    return Response.json({ author });
  } catch (error) {
    console.error("GET /api/authors/[id]", error);
    return Response.json({ error: "Failed to load author." }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const session = await getServerDashboardSession();
  const gate = requireAdmin(session);
  if (!gate.ok) return gate.response;

  try {
    const { id } = await params;
    const existing = await getAuthorById(id);
    if (!existing) {
      return Response.json({ error: "Author not found." }, { status: 404 });
    }

    const body = await request.json();
    const author = await updateAuthor(id, body);
    if (existing.image && existing.image !== author.image) {
      await cleanupAuthorImage(existing.image);
    }

    return Response.json({ author });
  } catch (error) {
    if (/required|slug/i.test(error.message || "")) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("PATCH /api/authors/[id]", error);
    return Response.json({ error: "Failed to update author." }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const session = await getServerDashboardSession();
  const gate = requireAdmin(session);
  if (!gate.ok) return gate.response;

  try {
    const { id } = await params;
    const existing = await getAuthorById(id);
    if (!existing) {
      return Response.json({ error: "Author not found." }, { status: 404 });
    }

    const deleted = await deleteAuthor(id);
    if (!deleted) {
      return Response.json({ error: "Author not found." }, { status: 404 });
    }

    await cleanupAuthorImage(deleted.image_url);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/authors/[id]", error);
    return Response.json({ error: "Failed to delete author." }, { status: 500 });
  }
}
