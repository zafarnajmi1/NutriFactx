import { searchPublishedPosts } from "@/lib/posts";

/** Public search for header suggestions */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const posts = await searchPublishedPosts(q, 6);
    return Response.json({ posts });
  } catch (error) {
    console.error("GET /api/posts/search", error);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
