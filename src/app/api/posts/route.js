import {
  createPost,
  listAllPosts,
  mapPostToDashboard,
  slugExists,
} from "@/lib/posts";
import {
  getServerDashboardSession,
  requireDashboardSession,
} from "@/lib/session";

export async function GET() {
  const session = await getServerDashboardSession();
  const gate = requireDashboardSession(session);
  if (!gate.ok) return gate.response;

  try {
    const articles = await listAllPosts();
    return Response.json({ articles });
  } catch (error) {
    console.error("GET /api/posts", error);
    return Response.json({ error: "Failed to load articles" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerDashboardSession();
  const gate = requireDashboardSession(session);
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const slug = String(body.slug || "").trim();

    if (!title || !slug) {
      return Response.json(
        { error: "Title and slug are required." },
        { status: 400 },
      );
    }

    if (await slugExists(slug)) {
      return Response.json(
        { error: "That slug is already in use." },
        { status: 409 },
      );
    }

    const row = await createPost(body, session);
    return Response.json(
      { article: mapPostToDashboard(row) },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/posts", error);
    return Response.json({ error: "Failed to create article" }, { status: 500 });
  }
}
