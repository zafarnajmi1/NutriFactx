import pool, { shouldUseLocalDbFallback } from "./db";

const globalForPages = globalThis;

export const SITE_CONTENT_PAGES = [
  {
    key: "privacy-policy",
    label: "Privacy Policy",
    path: "/privacy-policy",
    defaultEyebrow: "Legal",
    defaultTitle: "Privacy Policy",
    defaultDescription:
      "Last updated: August 2, 2026. This policy explains how NutriFactx handles your information.",
  },
  {
    key: "terms",
    label: "Terms of Use",
    path: "/terms",
    defaultEyebrow: "Legal",
    defaultTitle: "Terms of Use",
    defaultDescription:
      "Last updated: August 6, 2026. Please read these terms before using NutriFactx.",
  },
];

const DEFAULT_SECTIONS = {
  "privacy-policy": [
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
  ],
  terms: [
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
  ],
};

function getPageMeta(pageKey) {
  return SITE_CONTENT_PAGES.find((page) => page.key === pageKey) || null;
}

function sectionsToBody(sections) {
  return normalizeSections(sections)
    .map((section) => {
      if (section.title && section.body) {
        return `${section.title}\n${section.body}`;
      }
      if (section.title) return section.title;
      return section.body;
    })
    .join("\n\n");
}

function bodyToSections(body) {
  const text = String(body || "").trim();
  if (!text) return [];

  return text
    .split(/\n\n+/)
    .map((block) => {
      const lines = block.split("\n");
      const title = String(lines[0] || "").trim();
      const sectionBody = lines.slice(1).join("\n").trim();
      return { title, body: sectionBody };
    })
    .filter((section) => section.title || section.body);
}

function defaultContent(pageKey) {
  const meta = getPageMeta(pageKey);
  if (!meta) return null;
  const sections = DEFAULT_SECTIONS[pageKey] || [];
  return {
    pageKey,
    eyebrow: meta.defaultEyebrow,
    title: meta.defaultTitle,
    description: meta.defaultDescription,
    sections,
    body: sectionsToBody(sections),
  };
}

function normalizeSections(sections) {
  if (!Array.isArray(sections)) return [];
  return sections
    .map((section) => ({
      title: String(section?.title || "").trim(),
      body: String(section?.body || "").trim(),
    }))
    .filter((section) => section.title || section.body);
}

function mapPageContent(row, pageKey) {
  const fallback = defaultContent(pageKey);
  if (!row) return fallback;

  const sections = normalizeSections(row.sections);
  const resolvedSections = sections.length ? sections : fallback?.sections || [];
  return {
    pageKey,
    eyebrow: row.hero_eyebrow || fallback?.eyebrow || "Legal",
    title: row.hero_title || fallback?.title || "",
    description: row.hero_description || fallback?.description || "",
    sections: resolvedSections,
    body: sectionsToBody(resolvedSections),
  };
}

async function ensurePageContentTable() {
  if (!globalForPages.pageContentSchemaPromise) {
    globalForPages.pageContentSchemaPromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS site_page_content (
          page_key TEXT PRIMARY KEY,
          hero_eyebrow TEXT,
          hero_title TEXT,
          hero_description TEXT,
          sections JSONB NOT NULL DEFAULT '[]'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `)
      .catch((error) => {
        globalForPages.pageContentSchemaPromise = null;
        throw error;
      });
  }
  return globalForPages.pageContentSchemaPromise;
}

export async function listSiteContentPages() {
  await ensurePageContentTable();
  const { rows } = await pool.query(
    `SELECT page_key, hero_eyebrow, hero_title, hero_description, sections, updated_at
     FROM site_page_content`,
  );
  const byKey = new Map(rows.map((row) => [row.page_key, row]));

  return SITE_CONTENT_PAGES.map((page) => {
    const row = byKey.get(page.key);
    return {
      key: page.key,
      label: page.label,
      path: page.path,
      content: mapPageContent(row, page.key),
      updatedAt: row?.updated_at || null,
    };
  });
}

export async function getPageContent(pageKey) {
  const meta = getPageMeta(pageKey);
  if (!meta) return null;

  try {
    await ensurePageContentTable();
    const { rows } = await pool.query(
      `SELECT page_key, hero_eyebrow, hero_title, hero_description, sections, updated_at
       FROM site_page_content
       WHERE page_key = $1
       LIMIT 1`,
      [pageKey],
    );
    return mapPageContent(rows[0], pageKey);
  } catch (error) {
    if (shouldUseLocalDbFallback(error)) {
      console.warn(
        `[pages] PostgreSQL unavailable, using default content for ${pageKey}`,
      );
      return defaultContent(pageKey);
    }
    throw error;
  }
}

export async function savePageContent(pageKey, input) {
  const meta = getPageMeta(pageKey);
  if (!meta) {
    throw new Error("Unknown page key.");
  }

  await ensurePageContentTable();

  const eyebrow = String(input.eyebrow ?? meta.defaultEyebrow).trim();
  const title = String(input.title ?? meta.defaultTitle).trim();
  const description = String(input.description ?? meta.defaultDescription).trim();
  const sections = input.body
    ? bodyToSections(input.body)
    : normalizeSections(input.sections);

  if (!title) {
    throw new Error("Page title is required.");
  }
  if (!sections.length) {
    throw new Error("Page content is required.");
  }

  await pool.query(
    `INSERT INTO site_page_content (
       page_key, hero_eyebrow, hero_title, hero_description, sections, updated_at
     ) VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
     ON CONFLICT (page_key) DO UPDATE SET
       hero_eyebrow = EXCLUDED.hero_eyebrow,
       hero_title = EXCLUDED.hero_title,
       hero_description = EXCLUDED.hero_description,
       sections = EXCLUDED.sections,
       updated_at = NOW()`,
    [pageKey, eyebrow, title, description, JSON.stringify(sections)],
  );

  return getPageContent(pageKey);
}
