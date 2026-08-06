import { buildPageJsonLd } from "@/lib/siteSeo";

/** Renders JSON-LD for a dashboard-managed public page. */
export default async function PageSeoJsonLd({ pageKey }) {
  const jsonLd = await buildPageJsonLd(pageKey);
  if (!jsonLd) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
