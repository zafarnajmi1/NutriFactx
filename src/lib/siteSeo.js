import pool, { shouldUseLocalDbFallback } from "./db";
import { absoluteUrl, getSiteUrl, sanitizeMetaText } from "./seo";

export const SITE_SEO_PAGES = [
  {
    key: "home",
    label: "Home",
    path: "/",
    schemaOptions: ["WebSite", "WebPage", "CollectionPage"],
  },
  {
    key: "blogs",
    label: "Blogs",
    path: "/blogs",
    schemaOptions: ["CollectionPage", "WebPage", "Blog"],
  },
  {
    key: "about-us",
    label: "About Us",
    path: "/about-us",
    schemaOptions: ["AboutPage", "WebPage"],
  },
  {
    key: "contact",
    label: "Contact",
    path: "/contact",
    schemaOptions: ["ContactPage", "WebPage"],
  },
  {
    key: "privacy-policy",
    label: "Privacy Policy",
    path: "/privacy-policy",
    schemaOptions: ["WebPage"],
  },
  {
    key: "terms",
    label: "Terms of Use",
    path: "/terms",
    schemaOptions: ["WebPage"],
  },
];

const DEFAULT_SHARE_IMAGE = "/brand/nutrifactx-icon.png";

const PAGE_KEYS = SITE_SEO_PAGES.map((page) => page.key);

const DEFAULTS = {
  home: {
    metaTitle:
      "NutriFactx | Science-Backed Nutrition Facts & Practical Wellness Guides",
    metaDescription:
      "Clear, science-backed nutrition facts and practical wellness guides from NutriFactx—vitamins, diet tips, and everyday health explained simply.",
    focusKeyword: "science-backed nutrition facts",
    keywords:
      "science-backed nutrition facts, NutriFactx, wellness guides, vitamins, healthy eating",
    canonicalUrl: "/",
    ogTitle: "NutriFactx | Science-Backed Nutrition Facts",
    ogDescription:
      "Science-backed nutrition facts and practical wellness guides you can use every day.",
    ogImage: DEFAULT_SHARE_IMAGE,
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: "",
    robotsIndex: true,
    robotsFollow: true,
    schemaType: "WebSite",
  },
  blogs: {
    metaTitle: "Nutrition & Wellness Articles | NutriFactx",
    metaDescription:
      "Browse NutriFactx nutrition and wellness articles—practical guides on diet, kids’ health, seed oils, vitamins, and everyday healthy habits.",
    focusKeyword: "nutrition and wellness articles",
    keywords:
      "nutrition and wellness articles, NutriFactx blog, diet tips, healthy eating guides",
    canonicalUrl: "/blogs",
    ogTitle: "Nutrition & Wellness Articles | NutriFactx",
    ogDescription:
      "Practical nutrition and wellness articles from NutriFactx—clear guides for everyday health decisions.",
    ogImage: DEFAULT_SHARE_IMAGE,
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: "",
    robotsIndex: true,
    robotsFollow: true,
    schemaType: "CollectionPage",
  },
  "about-us": {
    metaTitle: "About NutriFactx | Science-Backed Nutrition Team",
    metaDescription:
      "Learn about NutriFactx’s mission to make science-backed nutrition facts clear, accurate, and useful for everyday health decisions.",
    focusKeyword: "about NutriFactx",
    keywords:
      "about NutriFactx, nutrition team, science-backed health, NutriFactx mission",
    canonicalUrl: "/about-us",
    ogTitle: "About NutriFactx | Science-Backed Nutrition Team",
    ogDescription:
      "Meet NutriFactx—science-backed nutrition facts and wellness insights made clear and practical.",
    ogImage: DEFAULT_SHARE_IMAGE,
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: "",
    robotsIndex: true,
    robotsFollow: true,
    schemaType: "AboutPage",
  },
  contact: {
    metaTitle: "Contact NutriFactx | Questions & Partnerships",
    metaDescription:
      "Have a nutrition question, story idea, or partnership inquiry? Contact the NutriFactx team—we’d love to hear from you.",
    focusKeyword: "contact NutriFactx",
    keywords:
      "contact NutriFactx, nutrition questions, partnerships, NutriFactx support",
    canonicalUrl: "/contact",
    ogTitle: "Contact NutriFactx",
    ogDescription:
      "Reach the NutriFactx team with questions, feedback, corrections, or partnership ideas.",
    ogImage: DEFAULT_SHARE_IMAGE,
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: "",
    robotsIndex: true,
    robotsFollow: true,
    schemaType: "ContactPage",
  },
  "privacy-policy": {
    metaTitle: "Privacy Policy | NutriFactx",
    metaDescription:
      "How NutriFactx collects, uses, and protects your personal information.",
    focusKeyword: "NutriFactx privacy policy",
    keywords: "privacy policy, data protection, NutriFactx",
    canonicalUrl: "/privacy-policy",
    ogTitle: "Privacy Policy | NutriFactx",
    ogDescription:
      "How NutriFactx collects, uses, and protects your personal information.",
    ogImage: DEFAULT_SHARE_IMAGE,
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: "",
    robotsIndex: true,
    robotsFollow: true,
    schemaType: "WebPage",
  },
  terms: {
    metaTitle: "Terms of Use | NutriFactx",
    metaDescription:
      "Terms of use for NutriFactx, including content guidelines, acceptable use, and site policies.",
    focusKeyword: "NutriFactx terms of use",
    keywords: "terms of use, terms of service, NutriFactx",
    canonicalUrl: "/terms",
    ogTitle: "Terms of Use | NutriFactx",
    ogDescription:
      "Terms of use for NutriFactx, including content guidelines, acceptable use, and site policies.",
    ogImage: DEFAULT_SHARE_IMAGE,
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: "",
    robotsIndex: true,
    robotsFollow: true,
    schemaType: "WebPage",
  },
};

const emptySeo = {
  metaTitle: "",
  metaDescription: "",
  focusKeyword: "",
  keywords: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  twitterTitle: "",
  twitterDescription: "",
  twitterImage: "",
  robotsIndex: true,
  robotsFollow: true,
  schemaType: "WebPage",
};

const globalForSiteSeo = globalThis;

function mapRow(row, pageKey) {
  const defaults = DEFAULTS[pageKey] || emptySeo;
  if (!row) {
    return {
      pageKey,
      ...defaults,
    };
  }

  return {
    pageKey,
    metaTitle: row.meta_title || defaults.metaTitle || "",
    metaDescription: row.meta_description || defaults.metaDescription || "",
    focusKeyword: row.focus_keyword || defaults.focusKeyword || "",
    keywords: row.keywords || defaults.keywords || "",
    canonicalUrl: row.canonical_url || defaults.canonicalUrl || "",
    ogTitle: row.og_title || defaults.ogTitle || "",
    ogDescription: row.og_description || defaults.ogDescription || "",
    ogImage: row.og_image || defaults.ogImage || "",
    twitterTitle: row.twitter_title || defaults.twitterTitle || "",
    twitterDescription:
      row.twitter_description || defaults.twitterDescription || "",
    twitterImage: row.twitter_image || defaults.twitterImage || "",
    robotsIndex: row.robots_index !== false,
    robotsFollow: row.robots_follow !== false,
    schemaType: row.schema_type || defaults.schemaType || "WebPage",
  };
}

async function ensureSiteSeoTable() {
  if (!globalForSiteSeo.siteSeoSchemaPromise) {
    globalForSiteSeo.siteSeoSchemaPromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS site_page_seo (
          page_key TEXT PRIMARY KEY,
          meta_title TEXT,
          meta_description TEXT,
          focus_keyword TEXT,
          keywords TEXT,
          canonical_url TEXT,
          og_title TEXT,
          og_description TEXT,
          og_image TEXT,
          twitter_title TEXT,
          twitter_description TEXT,
          twitter_image TEXT,
          robots_index BOOLEAN NOT NULL DEFAULT TRUE,
          robots_follow BOOLEAN NOT NULL DEFAULT TRUE,
          schema_type TEXT NOT NULL DEFAULT 'WebPage',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `)
      .then(async () => {
        for (const page of SITE_SEO_PAGES) {
          const defaults = DEFAULTS[page.key];
          await pool.query(
            `INSERT INTO site_page_seo (
               page_key, meta_title, meta_description, focus_keyword, keywords,
               canonical_url, og_title, og_description, og_image,
               twitter_title, twitter_description, twitter_image,
               robots_index, robots_follow, schema_type, updated_at
             ) VALUES (
               $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW()
             )
             ON CONFLICT (page_key) DO NOTHING`,
            [
              page.key,
              defaults.metaTitle,
              defaults.metaDescription,
              defaults.focusKeyword,
              defaults.keywords,
              defaults.canonicalUrl,
              defaults.ogTitle,
              defaults.ogDescription,
              defaults.ogImage,
              defaults.twitterTitle || null,
              defaults.twitterDescription || null,
              defaults.twitterImage || null,
              defaults.robotsIndex,
              defaults.robotsFollow,
              defaults.schemaType,
            ],
          );
        }
      })
      .catch((error) => {
        globalForSiteSeo.siteSeoSchemaPromise = null;
        throw error;
      });
  }
  return globalForSiteSeo.siteSeoSchemaPromise;
}

export function isValidSiteSeoPage(pageKey) {
  return PAGE_KEYS.includes(pageKey);
}

export async function listSiteSeoPages() {
  try {
    await ensureSiteSeoTable();
    const { rows } = await pool.query(
      `SELECT *
       FROM site_page_seo
       WHERE page_key = ANY($1::text[])`,
      [PAGE_KEYS],
    );

    return SITE_SEO_PAGES.map((page) => ({
      ...page,
      seo: mapRow(
        rows.find((row) => row.page_key === page.key),
        page.key,
      ),
    }));
  } catch (error) {
    if (shouldUseLocalDbFallback(error)) {
      console.warn("[siteSeo] PostgreSQL unavailable, using default SEO pages");
      return SITE_SEO_PAGES.map((page) => ({
        ...page,
        seo: mapRow(null, page.key),
      }));
    }
    throw error;
  }
}

export async function getSiteSeo(pageKey) {
  if (!isValidSiteSeoPage(pageKey)) return null;

  try {
    await ensureSiteSeoTable();
    const { rows } = await pool.query(
      `SELECT * FROM site_page_seo WHERE page_key = $1 LIMIT 1`,
      [pageKey],
    );
    return mapRow(rows[0], pageKey);
  } catch (error) {
    if (shouldUseLocalDbFallback(error)) {
      console.warn(`[siteSeo] PostgreSQL unavailable, using defaults for ${pageKey}`);
      return mapRow(null, pageKey);
    }
    throw error;
  }
}

export async function saveSiteSeo(pageKey, payload) {
  if (!isValidSiteSeoPage(pageKey)) {
    throw new Error("Unknown page.");
  }
  await ensureSiteSeoTable();

  const defaults = DEFAULTS[pageKey] || emptySeo;
  const next = {
    metaTitle: String(payload.metaTitle || "").trim() || defaults.metaTitle,
    metaDescription:
      String(payload.metaDescription || "").trim() || defaults.metaDescription,
    focusKeyword: String(payload.focusKeyword || "").trim(),
    keywords: String(payload.keywords || "").trim(),
    canonicalUrl:
      String(payload.canonicalUrl || "").trim() || defaults.canonicalUrl,
    ogTitle: String(payload.ogTitle || "").trim(),
    ogDescription: String(payload.ogDescription || "").trim(),
    ogImage: String(payload.ogImage || "").trim(),
    twitterTitle: String(payload.twitterTitle || "").trim(),
    twitterDescription: String(payload.twitterDescription || "").trim(),
    twitterImage: String(payload.twitterImage || "").trim(),
    robotsIndex: payload.robotsIndex !== false,
    robotsFollow: payload.robotsFollow !== false,
    schemaType: String(payload.schemaType || defaults.schemaType).trim(),
  };

  await pool.query(
    `INSERT INTO site_page_seo (
       page_key, meta_title, meta_description, focus_keyword, keywords,
       canonical_url, og_title, og_description, og_image,
       twitter_title, twitter_description, twitter_image,
       robots_index, robots_follow, schema_type, updated_at
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW()
     )
     ON CONFLICT (page_key) DO UPDATE SET
       meta_title = EXCLUDED.meta_title,
       meta_description = EXCLUDED.meta_description,
       focus_keyword = EXCLUDED.focus_keyword,
       keywords = EXCLUDED.keywords,
       canonical_url = EXCLUDED.canonical_url,
       og_title = EXCLUDED.og_title,
       og_description = EXCLUDED.og_description,
       og_image = EXCLUDED.og_image,
       twitter_title = EXCLUDED.twitter_title,
       twitter_description = EXCLUDED.twitter_description,
       twitter_image = EXCLUDED.twitter_image,
       robots_index = EXCLUDED.robots_index,
       robots_follow = EXCLUDED.robots_follow,
       schema_type = EXCLUDED.schema_type,
       updated_at = NOW()`,
    [
      pageKey,
      next.metaTitle,
      next.metaDescription,
      next.focusKeyword || null,
      next.keywords || null,
      next.canonicalUrl,
      next.ogTitle || null,
      next.ogDescription || null,
      next.ogImage || null,
      next.twitterTitle || null,
      next.twitterDescription || null,
      next.twitterImage || null,
      next.robotsIndex,
      next.robotsFollow,
      next.schemaType,
    ],
  );

  return getSiteSeo(pageKey);
}

function parseKeywords(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolvePublicImage(raw, siteUrl) {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("/")) {
    return absoluteUrl(value, siteUrl);
  }
  return "";
}

/** Build Next.js Metadata for a managed public page. */
export async function buildPageMetadata(pageKey) {
  const seo = (await getSiteSeo(pageKey)) || mapRow(null, pageKey);
  const page = SITE_SEO_PAGES.find((item) => item.key === pageKey);
  const siteUrl = getSiteUrl();
  const title = sanitizeMetaText(seo.metaTitle || page?.label || "NutriFactx");
  const description = sanitizeMetaText(
    seo.metaDescription ||
      "Science-backed nutrition facts and wellness insights from NutriFactx.",
  );
  const canonical = absoluteUrl(
    seo.canonicalUrl || page?.path || "/",
    siteUrl,
  );
  const ogTitle = sanitizeMetaText(seo.ogTitle || title);
  const ogDescription = sanitizeMetaText(seo.ogDescription || description);
  const ogImage = resolvePublicImage(
    seo.ogImage || DEFAULT_SHARE_IMAGE,
    siteUrl,
  );
  const twitterTitle = sanitizeMetaText(seo.twitterTitle || ogTitle);
  const twitterDescription = sanitizeMetaText(
    seo.twitterDescription || ogDescription,
  );
  const twitterImage =
    resolvePublicImage(seo.twitterImage, siteUrl) || ogImage;
  const keywords = [
    seo.focusKeyword,
    ...parseKeywords(seo.keywords),
  ].filter(Boolean);

  const images = ogImage
    ? [{ url: ogImage, alt: ogTitle }]
    : undefined;

  return {
    title,
    description,
    keywords: keywords.length ? keywords : undefined,
    robots: {
      index: seo.robotsIndex !== false,
      follow: seo.robotsFollow !== false,
      googleBot: {
        index: seo.robotsIndex !== false,
        follow: seo.robotsFollow !== false,
      },
    },
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: "NutriFactx",
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      images,
    },
    twitter: {
      card: twitterImage ? "summary_large_image" : "summary",
      title: twitterTitle,
      description: twitterDescription,
      images: twitterImage
        ? [{ url: twitterImage, alt: twitterTitle }]
        : undefined,
    },
  };
}

export async function buildPageJsonLd(pageKey) {
  const seo = (await getSiteSeo(pageKey)) || mapRow(null, pageKey);
  const page = SITE_SEO_PAGES.find((item) => item.key === pageKey);
  const siteUrl = getSiteUrl();
  const url = absoluteUrl(seo.canonicalUrl || page?.path || "/", siteUrl);
  const image = resolvePublicImage(
    seo.ogImage || DEFAULT_SHARE_IMAGE,
    siteUrl,
  );

  return {
    "@context": "https://schema.org",
    "@type": seo.schemaType || "WebPage",
    name: sanitizeMetaText(seo.metaTitle || page?.label || "NutriFactx"),
    description: sanitizeMetaText(seo.metaDescription) || undefined,
    url,
    image: image || undefined,
    keywords: [seo.focusKeyword, ...parseKeywords(seo.keywords)]
      .filter(Boolean)
      .join(", "),
    isPartOf: {
      "@type": "WebSite",
      name: "NutriFactx",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "NutriFactx",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(DEFAULT_SHARE_IMAGE, siteUrl),
      },
    },
  };
}
