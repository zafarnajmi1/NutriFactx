import { listCategoryNames } from "@/lib/categories";
import { slugifyTopic } from "@/lib/clusters";
import { searchPublishedPosts } from "@/lib/posts";

/** Public search for header suggestions (posts + matching categories). */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = String(searchParams.get("q") || "").trim();
    if (!q) {
      return Response.json({ posts: [], categories: [] });
    }

    const needle = q.toLowerCase();
    const [posts, names] = await Promise.all([
      searchPublishedPosts(q, 6),
      listCategoryNames().catch(() => []),
    ]);

    const categories = names
      .filter((name) => String(name || "").toLowerCase().includes(needle))
      .slice(0, 4)
      .map((name) => ({
        name,
        slug: slugifyTopic(name),
      }));

    return Response.json({ posts, categories });
  } catch (error) {
    console.error("GET /api/posts/search", error);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
