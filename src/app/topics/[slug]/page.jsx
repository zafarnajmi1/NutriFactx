import BlogsList from "../../components/blog-components/BlogsList";
import { getAllBlogs } from "@/lib/blogs";
import { listCategoryNames } from "@/lib/categories";
import { getTopicCluster } from "@/lib/clusters";
import { absoluteUrl, getSiteUrl, sanitizeMetaText } from "@/lib/seo";
import { connection } from "next/server";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  await connection();
  const { slug } = await params;
  const [blogs, dashboardCategories] = await Promise.all([
    getAllBlogs(),
    listCategoryNames().catch(() => []),
  ]);
  const cluster = getTopicCluster(slug, blogs, dashboardCategories);
  if (!cluster) {
    return {
      title: "Category not found",
      robots: { index: false, follow: false },
    };
  }

  const title = sanitizeMetaText(cluster.title);
  const description = sanitizeMetaText(cluster.description);
  const canonical = absoluteUrl(`/topics/${cluster.slug}`);
  const keywords = [
    cluster.focusKeyword,
    ...String(cluster.keywords || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  ];

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: "NutriFactx",
      title,
      description,
      url: canonical,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function TopicClusterPage({ params }) {
  await connection();
  const { slug } = await params;
  const [blogs, dashboardCategories] = await Promise.all([
    getAllBlogs(),
    listCategoryNames().catch(() => []),
  ]);
  const cluster = getTopicCluster(slug, blogs, dashboardCategories);
  if (!cluster) notFound();

  const siteUrl = getSiteUrl();
  const pageUrl = absoluteUrl(`/topics/${cluster.slug}`, siteUrl);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: cluster.title,
    description: cluster.description,
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "NutriFactx",
      url: siteUrl,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: cluster.posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/blogs/${post.slug}`, siteUrl),
        name: post.title,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="nf-page py-8 sm:py-10">
        <h1 className="nf-section-title mb-3.5">{cluster.name}</h1>
        <p className="mb-6 max-w-3xl text-nf-secondary">{cluster.description}</p>
        <BlogsList blogs={cluster.posts} />
      </div>
    </>
  );
}
