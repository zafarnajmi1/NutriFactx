import PageHero from "../components/common/PageHero";
import PageSeoJsonLd from "../components/common/PageSeoJsonLd";
import { getPageContent } from "@/lib/sitePageContent";
import { buildPageMetadata } from "@/lib/siteSeo";
import { connection } from "next/server";

export async function generateMetadata() {
  await connection();
  return buildPageMetadata("privacy-policy");
}

export default async function PrivacyPolicy() {
  await connection();
  const content = await getPageContent("privacy-policy");
  const sections = content?.sections || [];

  return (
    <>
      <PageSeoJsonLd pageKey="privacy-policy" />
      <PageHero
        eyebrow={content?.eyebrow}
        title={content?.title}
        description={content?.description}
      />

      <div className="nf-prose py-10 sm:py-14">
        <div className="nf-animate-fade-up space-y-8 rounded-2xl border border-nf-border bg-white p-5 sm:p-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="nf-section-title">{section.title}</h2>
              <p className="nf-body-text mt-2">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
