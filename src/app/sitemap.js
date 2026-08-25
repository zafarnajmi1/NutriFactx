import { listAuthors } from "@/lib/authors";
import { getAllBlogs } from "@/lib/blogs";
import { getSiteUrl } from "@/lib/seo";
import { listSiteSeoPages } from "@/lib/siteSeo";

export default async function sitemap() {
  const siteUrl = getSiteUrl();
  const [blogs, seoPages, authors] = await Promise.all([
    getAllBlogs(),
    listSiteSeoPages(),
    listAuthors({ activeOnly: true }).catch(() => []),
  ]);

  const staticRoutes = seoPages
    .filter((page) => page.seo?.robotsIndex !== false)
    .map((page) => {
      const path = page.path === "/" ? "" : page.path;
      return {
        url: `${siteUrl}${path}`,
        lastModified: new Date(),
        changeFrequency:
          page.key === "home" || page.key === "blogs" ? "daily" : "monthly",
        priority: page.key === "home" ? 1 : page.key === "blogs" ? 0.9 : 0.6,
      };
    });

  const articleRoutes = blogs
    .filter((blog) => blog.robotsIndex !== false)
    .map((blog) => ({
      url: `${siteUrl}/blogs/${blog.slug}`,
      lastModified: blog.updatedAt ? new Date(blog.updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const authorRoutes = (Array.isArray(authors) ? authors : [])
    .filter((author) => author?.slug)
    .map((author) => ({
      url: `${siteUrl}/authors/${author.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    }));

  return [...staticRoutes, ...articleRoutes, ...authorRoutes];
}
