import {
  createGuestComment,
  listAllComments,
} from "@/lib/comments";
import { getPostById, getPublishedPostBySlug } from "@/lib/posts";
import {
  getServerDashboardSession,
  requireDashboardSession,
} from "@/lib/session";

export async function GET() {
  const session = await getServerDashboardSession();
  const gate = requireDashboardSession(session);
  if (!gate.ok) return gate.response;

  try {
    const comments = await listAllComments();
    return Response.json({ comments });
  } catch (error) {
    console.error("GET /api/comments", error);
    return Response.json({ error: "Failed to load comments" }, { status: 500 });
  }
}

/** Public: submit a comment on a published post */
export async function POST(request) {
  try {
    const body = await request.json();
    const authorName = String(body.authorName || body.name || "").trim();
    const authorEmail = String(body.authorEmail || body.email || "").trim();
    const content = String(body.content || body.message || "").trim();
    const slug = String(body.slug || "").trim();
    const postIdRaw = body.postId;

    if (!authorName || !authorEmail || !content) {
      return Response.json(
        { error: "Name, email, and comment are required." },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
      return Response.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    let postId = postIdRaw ? Number(postIdRaw) : null;
    if (!postId && slug) {
      const blog = await getPublishedPostBySlug(slug);
      postId = blog?.id || null;
    }

    if (!postId) {
      return Response.json({ error: "Post not found." }, { status: 404 });
    }

    const post = await getPostById(postId);
    if (!post || post.status !== "PUBLISHED") {
      return Response.json({ error: "Post not found." }, { status: 404 });
    }

    const comment = await createGuestComment({
      postId,
      authorName,
      authorEmail,
      content,
    });

    return Response.json(
      {
        ok: true,
        comment,
        message: "Comment posted.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/comments", error);
    return Response.json({ error: "Failed to submit comment" }, { status: 500 });
  }
}
