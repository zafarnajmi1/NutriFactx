import Link from "@tiptap/extension-link";

/**
 * Link mark with on-page / off-page SEO attributes.
 * Allows relative/on-page hrefs (/path, #hash, ?query) that TipTap would otherwise reject.
 */
export const SeoLink = Link.extend({
  name: "link",

  addOptions() {
    return {
      ...this.parent?.(),
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: {
        class: "nf-editor-link",
      },
      isAllowedUri: (url, ctx) => {
        const href = String(url || "").trim();
        if (!href) return false;
        if (
          href.startsWith("/") ||
          href.startsWith("#") ||
          href.startsWith("?") ||
          href.startsWith("./") ||
          href.startsWith("../") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:")
        ) {
          return true;
        }
        return ctx.defaultValidate(href);
      },
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      href: {
        default: null,
      },
      target: {
        default: null,
        parseHTML: (el) => el.getAttribute("target"),
        renderHTML: (attrs) => (attrs.target ? { target: attrs.target } : {}),
      },
      rel: {
        default: null,
        parseHTML: (el) => el.getAttribute("rel"),
        renderHTML: (attrs) => (attrs.rel ? { rel: attrs.rel } : {}),
      },
      title: {
        default: null,
        parseHTML: (el) => el.getAttribute("title"),
        renderHTML: (attrs) => (attrs.title ? { title: attrs.title } : {}),
      },
      class: {
        default: "nf-editor-link",
      },
      linkType: {
        default: "onpage",
        parseHTML: (el) => el.getAttribute("data-link-type") || "onpage",
        renderHTML: (attrs) => ({
          "data-link-type": attrs.linkType || "onpage",
        }),
      },
    };
  },
});

export function detectLinkType(url) {
  const raw = String(url || "").trim();
  if (!raw) return "onpage";
  if (raw.startsWith("#") || raw.startsWith("/") || raw.startsWith("./") || raw.startsWith("../")) {
    return "onpage";
  }
  try {
    const u = new URL(raw, "https://nutrifactx.local");
    const host = u.hostname.replace(/^www\./, "");
    if (
      host === "nutrifactx.local" ||
      host === "localhost" ||
      host.endsWith("nutrifactx.com") ||
      raw.startsWith("?")
    ) {
      return "onpage";
    }
  } catch {
    /* keep offpage */
  }
  return "offpage";
}

export function buildLinkAttrs({
  href,
  linkType,
  openNewTab,
  nofollow,
  sponsored,
  ugc,
  title,
}) {
  const type = linkType || detectLinkType(href);
  const relParts = new Set();

  if (type === "offpage") {
    relParts.add("noopener");
    relParts.add("noreferrer");
  }
  if (nofollow) relParts.add("nofollow");
  if (sponsored) relParts.add("sponsored");
  if (ugc) relParts.add("ugc");

  return {
    href: String(href || "").trim(),
    linkType: type,
    target: openNewTab || type === "offpage" ? "_blank" : null,
    rel: relParts.size ? [...relParts].join(" ") : null,
    title: title?.trim() || null,
  };
}
