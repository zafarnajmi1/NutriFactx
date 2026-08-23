import { createAuthor, listAuthors } from "@/lib/authors";
import { getServerDashboardSession, requireAdmin } from "@/lib/session";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const publicOnly = searchParams.get("public") === "1";
    const authors = await listAuthors({ activeOnly: publicOnly });
    return Response.json({ authors });
  } catch (error) {
    console.error("GET /api/authors", error);
    return Response.json({ error: "Failed to load authors." }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerDashboardSession();
  const gate = requireAdmin(session);
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const author = await createAuthor(body);
    return Response.json({ author }, { status: 201 });
  } catch (error) {
    if (/required|slug/i.test(error.message || "")) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("POST /api/authors", error);
    return Response.json({ error: "Failed to create author." }, { status: 500 });
  }
}
