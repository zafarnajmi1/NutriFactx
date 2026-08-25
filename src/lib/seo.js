const FALLBACK_SITE_URL = "https://nutrifactx.com";

export function getSiteUrl() {
  const fromEnv = String(process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return FALLBACK_SITE_URL;
}

export function absoluteUrl(pathOrUrl, siteUrl = getSiteUrl()) {
  const value = String(pathOrUrl || "").trim();
  if (!value) return siteUrl;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^data:/i.test(value)) return value;
  if (value.startsWith("/")) return `${siteUrl}${value}`;
  return `${siteUrl}/${value}`;
}

/** Collapse whitespace/newlines so social crawlers get valid single-line meta tags. */
export function sanitizeMetaText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Public article URL for canonical / Open Graph / JSON-LD.
 * If canonical points at a different /blogs/{slug} on this site (common after a
 * slug rename), prefer the live post slug so social crawlers don't follow a 404.
 */
export function resolveArticleUrl(blog, siteUrl = getSiteUrl()) {
  const slug = String(blog?.slug || "").trim();
  const fallback = slug ? `/blogs/${slug}` : "/";
  const raw = String(blog?.canonicalUrl || "").trim();
  if (!raw) return absoluteUrl(fallback, siteUrl);

  const absolute = absoluteUrl(raw, siteUrl);
  try {
    const parsed = new URL(absolute);
    const siteHost = new URL(siteUrl).host;
    if (parsed.host === siteHost) {
      const match = parsed.pathname.match(/^\/blogs\/([^/]+)\/?$/);
      if (match && slug && match[1] !== slug) {
        return absoluteUrl(fallback, siteUrl);
      }
    }
  } catch {
    return absoluteUrl(fallback, siteUrl);
  }

  return absolute;
}

/**
 * Build Next.js Metadata from a published blog (dashboard SEO fields).
 */
export function buildArticleMetadata(blog) {
  if (!blog) {
    return { title: "Blog not found" };
  }

  const siteUrl = getSiteUrl();
  const title = sanitizeMetaText(blog.metaTitle || blog.title);
  const description = sanitizeMetaText(
    blog.metaDescription ||
      blog.excerpt ||
      "Science-backed nutrition facts and wellness insights from NutriFactx.",
  );
  const canonical = resolveArticleUrl(blog, siteUrl);
  const ogTitle = sanitizeMetaText(blog.ogTitle || title);
  const ogDescription = sanitizeMetaText(blog.ogDescription || description);
  const ogImageRaw = blog.ogImage || blog.featuredImage || "";
  // Social crawlers need a public http(s) URL — skip base64 data images
  const ogImage =
    /^https?:\/\//i.test(ogImageRaw) || ogImageRaw.startsWith("/")
      ? absoluteUrl(ogImageRaw, siteUrl)
      : "";
  const keywords = [
    blog.focusKeyword,
    ...(Array.isArray(blog.tags) ? blog.tags : []),
    blog.category,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  const images = ogImage
    ? [
        {
          url: absoluteUrl(ogImage, siteUrl),
          alt: ogTitle,
        },
      ]
    : undefined;
  const twitterTitle = sanitizeMetaText(blog.twitterTitle || ogTitle);
  const twitterDescription = sanitizeMetaText(
    blog.twitterDescription || ogDescription,
  );
  const twitterImageRaw =
    blog.twitterImage || blog.ogImage || blog.featuredImage || "";
  const twitterImage =
    /^https?:\/\//i.test(twitterImageRaw) || twitterImageRaw.startsWith("/")
      ? absoluteUrl(twitterImageRaw, siteUrl)
      : "";

  return {
    title,
    description,
    keywords: keywords.length ? keywords : undefined,
    authors: blog.author ? [{ name: blog.author }] : undefined,
    creator: blog.author || "NutriFactx",
    publisher: "NutriFactx",
    category: blog.category || undefined,
    robots: {
      index: blog.robotsIndex !== false,
      follow: blog.robotsFollow !== false,
      googleBot: {
        index: blog.robotsIndex !== false,
        follow: blog.robotsFollow !== false,
      },
    },
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      locale: "en_US",
      siteName: "NutriFactx",
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      publishedTime: blog.publishedAt || undefined,
      modifiedTime: blog.updatedAt || undefined,
      authors: blog.author ? [blog.author] : undefined,
      tags: keywords.length ? keywords : undefined,
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

/** JSON-LD Article / schema from dashboard schemaType */
export function buildArticleJsonLd(blog) {
  if (!blog) return null;
  const siteUrl = getSiteUrl();
  const schemaType = blog.schemaType || "Article";
  const url = resolveArticleUrl(blog, siteUrl);
  const imageRaw = blog.ogImage || blog.featuredImage || "";
  const image =
    /^https?:\/\//i.test(imageRaw) || imageRaw.startsWith("/")
      ? absoluteUrl(imageRaw, siteUrl)
      : undefined;
  const logoUrl = absoluteUrl("/brand/nutrifactx-icon.png", siteUrl);

  return {
    "@context": "https://schema.org",
    "@type": schemaType === "NewsArticle" ? "NewsArticle" : "Article",
    headline: sanitizeMetaText(blog.metaTitle || blog.title),
    description:
      sanitizeMetaText(blog.metaDescription || blog.excerpt) || undefined,
    image: image ? [image] : undefined,
    datePublished: blog.publishedAt || undefined,
    dateModified: blog.updatedAt || blog.publishedAt || undefined,
    author: {
      "@type": "Person",
      name: blog.author || "NutriFactx",
      ...(blog.authorSlug
        ? { url: absoluteUrl(`/authors/${blog.authorSlug}`, siteUrl) }
        : {}),
    },
    publisher: {
      "@type": "Organization",
      name: "NutriFactx",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: logoUrl,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    keywords: [blog.focusKeyword, ...(blog.tags || [])]
      .filter(Boolean)
      .join(", "),
    articleSection: blog.category || undefined,
    url,
  };
}

export function buildArticleBreadcrumbJsonLd(blog) {
  if (!blog) return null;
  const siteUrl = getSiteUrl();
  const articleUrl = resolveArticleUrl(blog, siteUrl);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blogs",
        item: absoluteUrl("/blogs", siteUrl),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: blog.title,
        item: articleUrl,
      },
    ],
  };
}
