/**
 * Apply SEO audit fixes to site pages + align the two published article SEO fields.
 *
 * Usage (local or server, with DB env loaded):
 *   node --env-file=.env.local scripts/apply-seo-audit-fixes.js
 */
const { Pool } = require("pg");

function resolveDbHost(host) {
  const trimmed = String(host || "").trim();
  if (!trimmed || trimmed === "localhost") return "127.0.0.1";
  return trimmed;
}

function sanitize(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

const PAGE_SEO = {
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
    schemaType: "ContactPage",
  },
};

const ARTICLE_FIXES = [
  {
    slug: "how-to-avoid-seed-oils-at-restaurants",
    title: "How to Avoid Seed Oils at Restaurants: A Practical Guide",
    focusKeyword: "how to avoid seed oils at restaurants",
    metaTitle: "How to Avoid Seed Oils at Restaurants: A Practical Guide",
    metaDescription:
      "How to avoid seed oils at restaurants without the stress: where they hide on menus, what to ask your server, and realistic swaps that actually work.",
    ogTitle: "How to Avoid Seed Oils at Restaurants: A Practical Guide",
    ogDescription:
      "How to avoid seed oils at restaurants without the stress: where they hide on menus, what to ask your server, and realistic swaps that actually work.",
    canonicalUrl:
      "https://nutrifactx.com/blogs/how-to-avoid-seed-oils-at-restaurants",
  },
  {
    slug: "healthy-school-lunchbox-ideas",
    title:
      "Healthy School Lunchbox Ideas: How to Cut Down on Ultra-Processed Foods",
    focusKeyword: "healthy school lunchbox ideas",
    metaTitle: "Healthy School Lunchbox Ideas Parents Actually Use",
    metaDescription:
      "Healthy school lunchbox ideas that go beyond crackers and fruit snacks: simple, kid-approved swaps parents can actually stick to every week.",
    ogTitle: "Healthy School Lunchbox Ideas Parents Actually Use",
    ogDescription:
      "Healthy school lunchbox ideas that go beyond crackers and fruit snacks: simple, kid-approved swaps parents can actually stick to every week.",
    canonicalUrl: "https://nutrifactx.com/blogs/healthy-school-lunchbox-ideas",
  },
];

async function main() {
  const missing = ["DB_USER", "DB_HOST", "DB_NAME", "DB_PASSWORD"].filter(
    (key) => !String(process.env[key] || "").trim(),
  );
  if (missing.length) {
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }

  const pool = new Pool({
    user: process.env.DB_USER,
    host: resolveDbHost(process.env.DB_HOST),
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
  });

  for (const [pageKey, seo] of Object.entries(PAGE_SEO)) {
    await pool.query(
      `INSERT INTO site_page_seo (
         page_key, meta_title, meta_description, focus_keyword, keywords,
         canonical_url, og_title, og_description, og_image,
         robots_index, robots_follow, schema_type, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,'/brand/nutrifactx-icon.png',TRUE,TRUE,$9,NOW()
       )
       ON CONFLICT (page_key) DO UPDATE SET
         meta_title = EXCLUDED.meta_title,
         meta_description = EXCLUDED.meta_description,
         focus_keyword = EXCLUDED.focus_keyword,
         keywords = EXCLUDED.keywords,
         canonical_url = EXCLUDED.canonical_url,
         og_title = EXCLUDED.og_title,
         og_description = EXCLUDED.og_description,
         schema_type = EXCLUDED.schema_type,
         updated_at = NOW()`,
      [
        pageKey,
        seo.metaTitle,
        seo.metaDescription,
        seo.focusKeyword,
        seo.keywords,
        seo.canonicalUrl,
        seo.ogTitle,
        seo.ogDescription,
        seo.schemaType,
      ],
    );
    console.log(`Updated page SEO: ${pageKey}`);
  }

  for (const article of ARTICLE_FIXES) {
    const result = await pool.query(
      `UPDATE posts SET
         title = $1,
         focus_keyword = $2,
         meta_title = $3,
         meta_description = $4,
         og_title = $5,
         og_description = $6,
         twitter_title = $5,
         twitter_description = $6,
         canonical_url = $7,
         updated_at = NOW()
       WHERE slug = $8
       RETURNING id, slug`,
      [
        article.title,
        article.focusKeyword,
        sanitize(article.metaTitle),
        sanitize(article.metaDescription),
        sanitize(article.ogTitle),
        sanitize(article.ogDescription),
        article.canonicalUrl,
        article.slug,
      ],
    );
    if (result.rows[0]) {
      console.log(`Updated article SEO: ${article.slug}`);
    } else {
      console.log(`Skipped (not found): ${article.slug}`);
    }
  }

  // Strip newlines from any remaining meta/og descriptions
  await pool.query(`
    UPDATE posts SET
      meta_description = regexp_replace(btrim(meta_description), '\\s+', ' ', 'g'),
      og_description = regexp_replace(btrim(og_description), '\\s+', ' ', 'g'),
      twitter_description = regexp_replace(btrim(twitter_description), '\\s+', ' ', 'g'),
      updated_at = NOW()
    WHERE meta_description ~ '\\s' OR og_description ~ '\\s' OR twitter_description ~ '\\s'
  `);

  console.log("Done.");
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
