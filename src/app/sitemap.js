import { listAuthors } from "@/lib/authors";
import { getAllBlogs } from "@/lib/blogs";
import { listCategoryNames } from "@/lib/categories";
import { listTopicClusters, slugifyTopic } from "@/lib/clusters";
import { getSiteUrl } from "@/lib/seo";
import { SITE_SEO_PAGES, listSiteSeoPages } from "@/lib/siteSeo";

function safeDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

async function safeList(fn, fallback = []) {
  try {
    const result = await fn();
    return Array.isArray(result) ? result : fallback;
  } catch (error) {
    console.error("[sitemap]", error?.message || error);
    return fallback;
  }
}

export default async function sitemap() {
  const siteUrl = getSiteUrl();
  const [blogs, seoPages, authors, categoryNames] = await Promise.all([
    safeList(() => getAllBlogs()),
    safeList(() => listSiteSeoPages()),
    safeList(() => listAuthors({ activeOnly: true })),
    safeList(() => listCategoryNames()),
  ]);

  const staticSource = seoPages.length
    ? seoPages
    : SITE_SEO_PAGES.map((page) => ({
        ...page,
        seo: { robotsIndex: true },
      }));

  const staticRoutes = staticSource
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
    .filter((blog) => blog?.slug && blog.robotsIndex !== false)
    .map((blog) => ({
      url: `${siteUrl}/blogs/${blog.slug}`,
      lastModified: safeDate(blog.updatedAt),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const authorRoutes = authors
    .filter((author) => author?.slug)
    .map((author) => ({
      url: `${siteUrl}/authors/${author.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    }));

  const clustered = listTopicClusters(blogs);
  const seenTopicSlugs = new Set(clustered.map((cluster) => cluster.slug));
  const dashboardTopicRoutes = categoryNames
    .map((name) => slugifyTopic(name))
    .filter((slug) => slug && !seenTopicSlugs.has(slug))
    .map((slug) => ({
      url: `${siteUrl}/topics/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const clusterRoutes = [
    {
      url: `${siteUrl}/topics`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.75,
    },
    ...clustered.map((cluster) => ({
      url: `${siteUrl}/topics/${cluster.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    })),
    ...dashboardTopicRoutes,
  ];

  return [...staticRoutes, ...articleRoutes, ...clusterRoutes, ...authorRoutes];
}
