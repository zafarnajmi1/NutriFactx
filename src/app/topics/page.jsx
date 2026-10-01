import Link from "next/link";
import { getAllBlogs } from "@/lib/blogs";
import { listCategoryNames } from "@/lib/categories";
import { listDashboardCategoryHubs } from "@/lib/clusters";
import { absoluteUrl, getSiteUrl, sanitizeMetaText } from "@/lib/seo";
import { connection } from "next/server";

const pillClass =
  "inline-flex w-fit rounded-full bg-[#E1F5EE] px-2.5 py-0.5 text-xs font-medium text-[#085041]";

export async function generateMetadata() {
  await connection();
  const title = "Categories";
  const description = sanitizeMetaText(
    "Browse NutriFactx categories—protein, seed oils, vitamins, and other science-backed nutrition guides.",
  );
  const canonical = absoluteUrl("/topics");
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: "NutriFactx",
      title,
      description,
      url: canonical,
    },
  };
}

export default async function TopicsIndexPage() {
  await connection();
  const [blogs, categoryNames] = await Promise.all([
    getAllBlogs(),
    listCategoryNames().catch(() => []),
  ]);
  const clusters = listDashboardCategoryHubs(categoryNames, blogs);
  const siteUrl = getSiteUrl();
  const pageUrl = absoluteUrl("/topics", siteUrl);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Categories",
    description:
      "Topic clusters of science-backed nutrition articles from NutriFactx.",
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "NutriFactx",
      url: siteUrl,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: clusters.map((cluster, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/topics/${cluster.slug}`, siteUrl),
        name: cluster.name,
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
        <h1 className="nf-section-title mb-3.5">Categories</h1>
        {clusters.length === 0 ? (
          <p className="text-nf-secondary">No categories yet.</p>
        ) : (
          <ul className="nf-posts-grid">
            {clusters.map((cluster) => (
              <li key={cluster.slug}>
                <Link
                  href={`/topics/${cluster.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#ececec] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
                >
                  <span className={pillClass}>{cluster.name}</span>
                  <h2 className="mt-3 text-sm font-semibold leading-snug text-[#111111] sm:text-base">
                    {cluster.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#6b6b6b] sm:text-sm">
                    {cluster.description}
                  </p>
                  <p className="mt-auto border-t border-[#eeeeee] pt-3 text-xs text-[#8a8a8a]">
                    {cluster.posts.length}{" "}
                    {cluster.posts.length === 1 ? "article" : "articles"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
