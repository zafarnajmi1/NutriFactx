import PageHero from "../components/common/PageHero";
import PageSeoJsonLd from "../components/common/PageSeoJsonLd";
import { buildPageMetadata } from "@/lib/siteSeo";
import { connection } from "next/server";

export async function generateMetadata() {
  await connection();
  return buildPageMetadata("terms");
}

const sections = [
  {
    title: "1. Acceptance of terms",
    body: "By accessing or using NutriFactx, you agree to these Terms of Use. If you do not agree, please do not use the website.",
  },
  {
    title: "2. Educational purpose",
    body: "NutriFactx publishes nutrition and wellness information for educational purposes only. Content is not medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before making health decisions.",
  },
  {
    title: "3. Accuracy and updates",
    body: "We aim to keep articles accurate and evidence-based, but research changes over time. We do not guarantee that every statement is complete or up to date. Use content at your own discretion.",
  },
  {
    title: "4. Acceptable use",
    body: "You may browse, share links, and leave constructive comments. You may not scrape the site at abusive rates, post spam or harmful content, attempt to break security, or use NutriFactx content to mislead others.",
  },
  {
    title: "5. User comments and messages",
    body: "If you submit comments or contact messages, you are responsible for what you send. We may remove or refuse content that is abusive, illegal, spammy, or off-topic.",
  },
  {
    title: "6. Intellectual property",
    body: "Articles, branding, and site design belong to NutriFactx or its licensors. You may quote short excerpts with attribution and a link back. You may not republish full articles without permission.",
  },
  {
    title: "7. Advertising",
    body: "NutriFactx may display advertising, including Google AdSense or similar networks. Ads are labeled as advertising when required. Advertisers are responsible for their own claims.",
  },
  {
    title: "8. Third-party links",
    body: "Our articles may link to external sites for sources or further reading. We are not responsible for third-party content, policies, or practices.",
  },
  {
    title: "9. Limitation of liability",
    body: "To the fullest extent allowed by law, NutriFactx is not liable for damages arising from use of the site or reliance on published content. The service is provided as available.",
  },
  {
    title: "10. Changes",
    body: "We may update these Terms of Use from time to time. The “Last updated” date on this page will change when we do. Continued use after updates means you accept the revised terms.",
  },
  {
    title: "11. Contact",
    body: "Questions about these terms can be sent to hello@nutrifactx.com or through the Contact page.",
  },
];

export default async function TermsOfUse() {
  await connection();
  return (
    <>
      <PageSeoJsonLd pageKey="terms" />
      <PageHero
        eyebrow="Legal"
        title="Terms of Use"
        description="Last updated: August 6, 2026. Please read these terms before using NutriFactx."
      />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="nf-animate-fade-up space-y-8 rounded-2xl border border-nf-border bg-white p-5 sm:p-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-medium text-nf-text">
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-nf-secondary sm:text-[15px]">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
