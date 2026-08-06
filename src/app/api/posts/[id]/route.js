import {
  deletePost,
  getPostById,
  mapPostToDashboard,
  slugExists,
  updatePost,
} from "@/lib/posts";
import {
  getServerDashboardSession,
  requireDashboardSession,
} from "@/lib/session";
import { deleteR2FeaturedImage } from "@/lib/r2";

async function cleanupFeaturedImage(imageUrl) {
  if (!imageUrl) return;
  try {
    await deleteR2FeaturedImage(imageUrl);
  } catch (error) {
    // The article mutation already succeeded; log cleanup for retry/inspection.
    console.error("Cloudflare featured image cleanup", error);
  }
}

export async function GET(_request, { params }) {
  const session = await getServerDashboardSession();
  const gate = requireDashboardSession(session);
  if (!gate.ok) return gate.response;

  try {
    const { id } = await params;
    const row = await getPostById(id);
    if (!row) {
      return Response.json({ error: "Article not found" }, { status: 404 });
    }
    return Response.json({ article: mapPostToDashboard(row) });
  } catch (error) {
    console.error("GET /api/posts/[id]", error);
    return Response.json({ error: "Failed to load article" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const session = await getServerDashboardSession();
  const gate = requireDashboardSession(session);
  if (!gate.ok) return gate.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const title = String(body.title || "").trim();
    const slug = String(body.slug || "").trim();

    if (!title || !slug) {
      return Response.json(
        { error: "Title and slug are required." },
        { status: 400 },
      );
    }

    if (await slugExists(slug, id)) {
      return Response.json(
        { error: "That slug is already in use." },
        { status: 409 },
      );
    }

    const existing = await getPostById(id);
    if (!existing) {
      return Response.json({ error: "Article not found" }, { status: 404 });
    }

    const row = await updatePost(id, body, session);
    if (!row) {
      return Response.json({ error: "Article not found" }, { status: 404 });
    }
    if (
      existing.featured_image &&
      existing.featured_image !== row.featured_image &&
      existing.featured_image !== row.og_image &&
      existing.featured_image !== row.twitter_image
    ) {
      await cleanupFeaturedImage(existing.featured_image);
    }
    return Response.json({ article: mapPostToDashboard(row) });
  } catch (error) {
    console.error("PATCH /api/posts/[id]", error);
    return Response.json({ error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const session = await getServerDashboardSession();
  const gate = requireDashboardSession(session);
  if (!gate.ok) return gate.response;

  try {
    const { id } = await params;
    const existing = await getPostById(id);
    if (!existing) {
      return Response.json({ error: "Article not found" }, { status: 404 });
    }

    const ok = await deletePost(id);
    if (!ok) {
      return Response.json({ error: "Article not found" }, { status: 404 });
    }
    await cleanupFeaturedImage(existing.featured_image);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/posts/[id]", error);
    return Response.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
