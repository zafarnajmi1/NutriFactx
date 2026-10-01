import { getAllBlogs } from "@/lib/blogs";
import { listTopicClusters } from "@/lib/clusters";

/** Public category/topic hubs for the header dropdown. */
export async function GET() {
  try {
    const blogs = await getAllBlogs();
    const topics = listTopicClusters(blogs).map((cluster) => ({
      slug: cluster.slug,
      name: cluster.name,
    }));
    return Response.json({ topics });
  } catch (error) {
    console.error("GET /api/topics", error);
    return Response.json({ topics: [] });
  }
}
