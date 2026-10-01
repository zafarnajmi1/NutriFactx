import { getAllBlogs } from "@/lib/blogs";
import { listCategoryNames } from "@/lib/categories";
import { slugifyTopic } from "@/lib/clusters";

/** Public header dropdown: categories saved in the dashboard. */
export async function GET() {
  try {
    const names = await listCategoryNames();
    const topics = names.map((name) => ({
      name,
      slug: slugifyTopic(name),
    }));
    return Response.json({ topics });
  } catch (error) {
    console.error("GET /api/topics", error);
    try {
      const blogs = await getAllBlogs();
      const fallback = [
        ...new Set(
          (Array.isArray(blogs) ? blogs : [])
            .map((blog) => String(blog.category || "").trim())
            .filter(Boolean),
        ),
      ].map((name) => ({ name, slug: slugifyTopic(name) }));
      return Response.json({ topics: fallback });
    } catch {
      return Response.json({ topics: [] });
    }
  }
}
