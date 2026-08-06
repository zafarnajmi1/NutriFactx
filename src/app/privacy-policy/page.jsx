import PageHero from "../components/common/PageHero";
import PageSeoJsonLd from "../components/common/PageSeoJsonLd";
import { buildPageMetadata } from "@/lib/siteSeo";
import { connection } from "next/server";

export async function generateMetadata() {
  await connection();
  return buildPageMetadata("privacy-policy");
}

const sections = [
  {
    title: "1. Information we collect",
    body: "We may collect information you provide directly, such as your name, email address, account details, comments, and messages sent through our contact form. We may also collect basic usage data such as pages visited, device type, and approximate location to improve the website experience.",
  },
  {
    title: "2. How we use your information",
    body: "We use your information to operate NutriFactx, manage accounts, publish and moderate comments, respond to inquiries, improve content quality, and keep the platform secure. We do not sell your personal information.",
  },
  {
    title: "3. Cookies and analytics",
    body: "NutriFactx may use cookies or similar technologies to remember preferences and understand how visitors use the site. You can control cookies through your browser settings. Disabling cookies may affect some site features.",
  },
  {
    title: "4. Sharing of information",
    body: "We may share information with trusted service providers who help us host, analyze, or operate the website, only as needed to provide those services. We may also disclose information if required by law or to protect the rights and safety of NutriFactx and its users.",
  },
  {
    title: "5. Data retention and security",
    body: "We keep personal information only as long as needed for the purposes described in this policy, unless a longer period is required by law. We use reasonable technical and organizational measures to protect your data, but no method of transmission over the internet is fully secure.",
  },
  {
    title: "6. Your choices",
    body: "Depending on your location, you may have rights to access, update, or delete your personal information, or to object to certain processing. To make a request, contact us at privacy@nutrifactx.com.",
  },
  {
    title: "7. Children’s privacy",
    body: "NutriFactx is not directed to children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has provided us personal information, please contact us so we can delete it.",
  },
  {
    title: "8. Updates to this policy",
    body: "We may update this Privacy Policy from time to time. When we do, we will revise the “Last updated” date on this page. Continued use of NutriFactx after changes means you accept the updated policy.",
  },
  {
    title: "9. Contact",
    body: "If you have questions about this Privacy Policy, email privacy@nutrifactx.com or use the Contact page on NutriFactx.",
  },
];

export default async function PrivacyPolicy() {
  await connection();
  return (
    <>
      <PageSeoJsonLd pageKey="privacy-policy" />
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="Last updated: August 2, 2026. This policy explains how NutriFactx handles your information."
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
