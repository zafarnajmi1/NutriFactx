"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import TipTapEditor from "./TipTapEditor";
import { isLikelyImageFile } from "@/lib/imageUpload";

const SITE_URL = String(
  process.env.NEXT_PUBLIC_SITE_URL || "https://nutrifactx.com",
).replace(/\/+$/, "");

function canonicalUrlForSlug(slug) {
  const cleanSlug = String(slug || "").trim();
  return cleanSlug ? `${SITE_URL}/blogs/${cleanSlug}` : "";
}

export const ARTICLE_CATEGORIES = [
  "Nutrition",
  "Fitness",
  "Mental health",
  "Sleep",
  "Diabetes",
  "Wellness",
  "Recipes",
  "Health",
];

export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Keep long upload names readable in the preview card. */
function shortFileName(name, maxLength = 28) {
  const clean = String(name || "").trim();
  if (clean.length <= maxLength) return clean;

  const dot = clean.lastIndexOf(".");
  const extension = dot > 0 ? clean.slice(dot) : "";
  const base = dot > 0 ? clean.slice(0, dot) : clean;
  const keep = Math.max(6, maxLength - extension.length - 1);

  return `${base.slice(0, keep)}…${extension}`;
}

function slugWordCount(slug) {
  return String(slug || "")
    .split("-")
    .filter(Boolean).length;
}

function stripHtml(html) {
  return String(html || "")
    // Drop base64 payloads before tag stripping (keeps SEO checks fast).
    .replace(/data:image\/[a-z0-9+/=;,.\s-]+/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text) {
  const clean = String(text || "").trim();
  if (!clean) return 0;
  return clean.split(/\s+/).length;
}

function buildSeoChecks(form) {
  const plain = stripHtml(form.content);
  const words = countWords(plain);
  const metaTitle = form.metaTitle || form.title;
  const metaDesc = form.metaDescription || form.excerpt;
  const focus = form.focusKeyword.trim().toLowerCase();
  const titleHasFocus = focus && metaTitle.toLowerCase().includes(focus);
  const descHasFocus = focus && metaDesc.toLowerCase().includes(focus);
  const contentHasFocus = focus && plain.toLowerCase().includes(focus);
  const slugHasFocus = focus && form.slug.toLowerCase().includes(slugify(focus));
  const slugWords = slugWordCount(form.slug);
  const headingCount = (
    String(form.content || "").match(/<(h2|h3)(\s|>)/gi) || []
  ).length;
  const linkCount = (String(form.content || "").match(/<a\s[^>]*href=/gi) || [])
    .length;
  const authorSet = String(form.author || "").trim().length >= 2;
  const tagsSet = String(form.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean).length;
  let focusHits = 0;
  if (focus) {
    try {
      const escaped = focus.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      focusHits = (plain.toLowerCase().match(new RegExp(escaped, "g")) || [])
        .length;
    } catch {
      focusHits = plain.toLowerCase().split(focus).length - 1;
    }
  }
  const focusDensityOk =
    !focus || words < 100 ? true : focusHits >= 2 && focusHits / words <= 0.03;

  return [
    {
      id: "title-len",
      label: "SEO title length (30–60)",
      pass: metaTitle.length >= 30 && metaTitle.length <= 60,
      hint: `${metaTitle.length} chars`,
    },
    {
      id: "desc-len",
      label: "Meta description (120–160)",
      pass: metaDesc.length >= 120 && metaDesc.length <= 160,
      hint: `${metaDesc.length} chars`,
    },
    {
      id: "focus",
      label: "Focus keyword set",
      pass: focus.length >= 2,
      hint: focus || "Missing",
    },
    {
      id: "focus-title",
      label: "Focus keyword in SEO title",
      pass: Boolean(titleHasFocus),
      hint: titleHasFocus ? "Found" : "Not found",
    },
    {
      id: "focus-desc",
      label: "Focus keyword in meta description",
      pass: Boolean(descHasFocus),
      hint: descHasFocus ? "Found" : "Not found",
    },
    {
      id: "focus-content",
      label: "Focus keyword in content",
      pass: Boolean(contentHasFocus),
      hint: contentHasFocus ? "Found" : "Not found",
    },
    {
      id: "focus-density",
      label: "Natural keyword use (not stuffed)",
      pass: Boolean(focusDensityOk),
      hint: focus
        ? `${focusHits} mentions · keep natural`
        : "Set focus keyword first",
    },
    {
      id: "slug-set",
      label: "URL slug set",
      pass: slugWords > 0,
      hint: form.slug
        ? `${slugWords} words · ${form.slug.length} chars`
        : "e.g. vitamin-b12-benefits",
    },
    {
      id: "focus-slug",
      label: "Focus keyword in URL slug",
      pass: Boolean(slugHasFocus),
      hint: slugHasFocus ? "Found" : "Not found",
    },
    {
      id: "words",
      label: "Content depth (800+ words)",
      pass: words >= 800,
      hint: `${words} words`,
    },
    {
      id: "words-strong",
      label: "Competitive depth (1,200+ words)",
      pass: words >= 1200,
      hint: words >= 1200 ? "Strong for ranking" : `${words}/1200 words`,
    },
    {
      id: "headings",
      label: "Clear structure (2+ H2/H3)",
      pass: headingCount >= 2,
      hint: headingCount ? `${headingCount} headings` : "Add H2/H3 sections",
    },
    {
      id: "links",
      label: "Helpful links in content",
      pass: linkCount >= 1,
      hint: linkCount ? `${linkCount} link(s)` : "Add 1+ internal/outbound link",
    },
    {
      id: "author",
      label: "Public author byline set",
      pass: authorSet,
      hint: authorSet ? form.author.trim() : "Needed for trust (E-E-A-T)",
    },
    {
      id: "tags",
      label: "Tags added (2+)",
      pass: tagsSet >= 2,
      hint: tagsSet ? `${tagsSet} tags` : "Add related topic tags",
    },
    {
      id: "excerpt",
      label: "Excerpt / summary filled",
      pass: form.excerpt.trim().length >= 40,
      hint: form.excerpt.trim().length ? `${form.excerpt.trim().length} chars` : "Missing",
    },
    {
      id: "image",
      label: "Featured image uploaded",
      pass: Boolean(form.featuredImage.trim()),
      hint: form.featuredImage.trim() ? "Set" : "Missing",
    },
    {
      id: "og",
      label: "Open Graph fields",
      pass: Boolean((form.ogTitle || form.title) && (form.ogDescription || metaDesc)),
      hint: "Social share readiness",
    },
    {
      id: "twitter",
      label: "Twitter title or description",
      pass: Boolean(
        form.twitterTitle.trim() ||
          form.twitterDescription.trim() ||
          form.ogTitle.trim() ||
          form.ogDescription.trim() ||
          metaDesc,
      ),
      hint: "Falls back to Open Graph if empty",
    },
    {
      id: "canonical",
      label: "Canonical URL",
      pass: Boolean(form.canonicalUrl.trim()),
      hint: form.canonicalUrl.trim() ? "Set" : "Optional but recommended",
    },
  ];
}

function rankingBand(score) {
  if (score >= 85)
    return { label: "Strong ranking + AdSense readiness", tone: "good" };
  if (score >= 65) return { label: "Good chance with polish", tone: "ok" };
  if (score >= 40) return { label: "Needs SEO improvements", tone: "warn" };
  return { label: "Low ranking expectation", tone: "bad" };
}

const AI_RANKING_GUIDE = [
  {
    title: "1. Pick one focus keyword",
    text: "Example: “vitamin d3 benefits”. Put it in the title, slug, meta, and naturally in the first 100 words.",
  },
  {
    title: "2. Use AI as a draft only",
    text: "Generate the outline and first draft with AI, then rewrite weak sections in your own voice.",
  },
  {
    title: "3. Fact-check before publish",
    text: "Health content must be accurate. Verify dosages, claims, and add sources. Never invent studies.",
  },
  {
    title: "4. Add unique value",
    text: "Include practical tips, clear H2 sections, examples, and who the advice is for. Thin AI fluff will not rank.",
  },
  {
    title: "5. Aim for depth",
    text: "Target 1,200+ useful words for competitive topics. Short posts rarely earn AdSense traffic.",
  },
  {
    title: "6. Complete SEO fields",
    text: "Fill meta title/description, featured image, author byline, tags, and Open Graph before publishing.",
  },
  {
    title: "7. Interlink related articles",
    text: "Link to 1–3 related NutriFactx posts. This helps Google discover pages and keeps readers longer.",
  },
];

export const emptyArticleForm = {
  title: "",
  slug: "",
  category: ARTICLE_CATEGORIES[0],
  status: "draft",
  tags: "",
  author: "",
  featuredImage: "",
  featuredImageName: "",
  excerpt: "",
  content: "",
  focusKeyword: "",
  metaTitle: "",
  metaDescription: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  twitterTitle: "",
  twitterDescription: "",
  twitterImage: "",
  robotsIndex: true,
  robotsFollow: true,
  schemaType: "Article",
  isFeatured: false,
};

/**
 * Shared add/edit article composer (same layout for both).
 */
export default function ArticleComposer({
  mode = "create",
  articleId = null,
  initialForm = emptyArticleForm,
  formId = "article-form",
}) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const featuredFileRef = useRef(null);
  const uploadedFeaturedRef = useRef(new Set());
  const [form, setForm] = useState(() => {
    const next = { ...emptyArticleForm, ...initialForm };
    if (!next.canonicalUrl && next.slug) {
      next.canonicalUrl = canonicalUrlForSlug(next.slug);
    }
    return next;
  });

  // Two-phase edit load: meta first, then content body.
  useEffect(() => {
    if (!isEdit) return;
    const nextContent = initialForm?.content;
    if (typeof nextContent !== "string") return;
    setForm((prev) => {
      if (prev.content === nextContent) return prev;
      return { ...prev, content: nextContent };
    });
  }, [isEdit, initialForm?.content]);

  const [slugTouched, setSlugTouched] = useState(Boolean(initialForm?.slug));
  const [canonicalTouched, setCanonicalTouched] = useState(
    Boolean(initialForm?.canonicalUrl),
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [featuredName, setFeaturedName] = useState(() => {
    if (initialForm?.featuredImageName) return initialForm.featuredImageName;
    if (initialForm?.featuredImage) {
      try {
        const path = String(initialForm.featuredImage).split("?")[0];
        const file = path.split("/").pop();
        return file || "Current featured image";
      } catch {
        return "Current featured image";
      }
    }
    return "";
  });
  const [featuredError, setFeaturedError] = useState("");
  const [featuredUploading, setFeaturedUploading] = useState(false);
  // Once a social field is edited by hand, stop overwriting it from SEO fields.
  const [socialTouched, setSocialTouched] = useState({
    ogTitle: Boolean(initialForm?.ogTitle),
    ogDescription: Boolean(initialForm?.ogDescription),
    twitterTitle: Boolean(initialForm?.twitterTitle),
    twitterDescription: Boolean(initialForm?.twitterDescription),
  });

  function markSocialTouched(field) {
    setSocialTouched((prev) =>
      prev[field] ? prev : { ...prev, [field]: true },
    );
  }

  function update(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "title" && !slugTouched) {
        next.slug = slugify(value);
      }
      if (
        !canonicalTouched &&
        (field === "title" || field === "slug")
      ) {
        next.canonicalUrl = canonicalUrlForSlug(next.slug);
      }

      // One-way only: SEO → social. Editing social fields never changes SEO.
      if (field === "metaTitle") {
        if (!socialTouched.ogTitle) next.ogTitle = value;
        if (!socialTouched.twitterTitle) next.twitterTitle = value;
      }
      if (field === "metaDescription") {
        if (!socialTouched.ogDescription) next.ogDescription = value;
        if (!socialTouched.twitterDescription) next.twitterDescription = value;
      }
      if (field === "title" && !String(prev.metaTitle || "").trim()) {
        if (!socialTouched.ogTitle) next.ogTitle = value;
        if (!socialTouched.twitterTitle) next.twitterTitle = value;
      }
      if (field === "excerpt" && !String(prev.metaDescription || "").trim()) {
        if (!socialTouched.ogDescription) next.ogDescription = value;
        if (!socialTouched.twitterDescription) next.twitterDescription = value;
      }

      return next;
    });
  }

  async function deleteUploadedFeaturedImage(url) {
    const response = await fetch("/api/uploads/featured", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Could not remove featured image.");
    }
  }

  async function handleFeaturedUpload(files) {
    setFeaturedError("");
    const file = [...(files || [])].find((item) => isLikelyImageFile(item));
    if (!file) {
      setFeaturedError("Please choose an image file (JPG, PNG, WebP, GIF, AVIF, or BMP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFeaturedError("Image must be under 10MB.");
      return;
    }

    setFeaturedUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/uploads/featured", {
        method: "POST",
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not upload featured image.");
      }

      const previousImage = form.featuredImage;
      const imageUrl = data.url;
      const fileLabel = data.name || file.name;
      uploadedFeaturedRef.current.add(imageUrl);
      setFeaturedName(fileLabel);
      setForm((prev) => {
        const titleSource = String(prev.metaTitle || prev.title || "").trim();
        const descSource = String(
          prev.metaDescription || prev.excerpt || prev.ogDescription || "",
        ).trim();
        return {
          ...prev,
          featuredImage: imageUrl,
          featuredImageName: fileLabel,
          ogImage: imageUrl,
          twitterImage: imageUrl,
          ogTitle: socialTouched.ogTitle
            ? prev.ogTitle
            : titleSource || prev.ogTitle,
          twitterTitle: socialTouched.twitterTitle
            ? prev.twitterTitle
            : titleSource || prev.twitterTitle,
          twitterDescription: socialTouched.twitterDescription
            ? prev.twitterDescription
            : descSource || prev.twitterDescription,
          ogDescription: socialTouched.ogDescription
            ? prev.ogDescription
            : descSource || prev.ogDescription,
        };
      });
      if (uploadedFeaturedRef.current.has(previousImage)) {
        try {
          await deleteUploadedFeaturedImage(previousImage);
          uploadedFeaturedRef.current.delete(previousImage);
        } catch {
          setFeaturedError(
            "New image uploaded, but the previous temporary image could not be removed.",
          );
        }
      }
    } catch (error) {
      setFeaturedError(error.message || "Could not upload featured image.");
    } finally {
      setFeaturedUploading(false);
    }
  }

  function resetFeaturedImage() {
    update("featuredImage", "");
    update("featuredImageName", "");
    setFeaturedName("");
    if (featuredFileRef.current) featuredFileRef.current.value = "";
  }

  async function clearFeaturedImage() {
    setFeaturedError("");
    const imageUrl = form.featuredImage;
    if (!uploadedFeaturedRef.current.has(imageUrl)) {
      resetFeaturedImage();
      return;
    }

    setFeaturedUploading(true);
    try {
      await deleteUploadedFeaturedImage(imageUrl);
      uploadedFeaturedRef.current.delete(imageUrl);
      resetFeaturedImage();
    } catch (error) {
      setFeaturedError(error.message || "Could not remove featured image.");
    } finally {
      setFeaturedUploading(false);
    }
  }

  const plainContent = useMemo(() => stripHtml(form.content), [form.content]);
  const wordCount = countWords(plainContent);
  const readingMins = Math.max(1, Math.ceil(wordCount / 220));
  const checks = useMemo(() => buildSeoChecks(form), [form]);
  const passed = checks.filter((item) => item.pass).length;
  const score = Math.round((passed / checks.length) * 100);
  const band = rankingBand(score);
  const serpTitle = form.metaTitle || form.title || "Article title preview";
  const serpDesc =
    form.metaDescription ||
    form.excerpt ||
    "Meta description will appear here for Google search results.";
  const serpUrl = form.canonicalUrl || `https://nutrifactx.com/blogs/${form.slug || "vitamin-b12-benefits"}`;

  async function persist(nextStatus) {
    if (saving || featuredUploading) return;
    setSaving(true);
    setSaveError("");
    setSaved(false);

    const payload = {
      ...form,
      status: nextStatus || form.status,
      title: form.title.trim(),
      slug: form.slug.trim(),
      isFeatured: Boolean(form.isFeatured),
    };

    try {
      const url =
        isEdit && articleId ? `/api/posts/${articleId}` : "/api/posts";
      const method = isEdit && articleId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 413) {
          throw new Error(
            "Article is too large to save. Try fewer/smaller images in content, or use Featured image instead.",
          );
        }
        throw new Error(data.error || "Could not save article.");
      }

      uploadedFeaturedRef.current.delete(payload.featuredImage);
      setSaved(true);
      if (nextStatus) {
        update("status", nextStatus);
      }

      if (!isEdit && data.article?.id) {
        router.push(`/dashboard/articles/${data.article.id}/edit`);
        router.refresh();
        return;
      }

      router.refresh();
    } catch (err) {
      setSaveError(err.message || "Could not save article.");
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    persist();
  }

  return (
    <>
      <div className="db-topbar">
        <div>
          <h1>{isEdit ? "Edit article" : "Add article"}</h1>
          <p className="sub">
            Write content, optimize SEO, and check Google ranking expectations.
          </p>
        </div>
        <div className="db-topbar-right">
          <Link href="/dashboard/articles" className="db-muted-link">
            Back to articles
          </Link>
          <button
            type="submit"
            form={formId}
            className="db-new-post-btn"
            disabled={saving || featuredUploading}
          >
            {featuredUploading
              ? "Uploading image…"
              : saving
              ? "Saving…"
              : isEdit
                ? "Update article"
                : "Save article"}
          </button>
        </div>
      </div>

      <form id={formId} onSubmit={handleSubmit} className="db-composer">
        <div className="db-composer-main">
          <section className="db-panel db-composer-section">
            <div className="db-composer-section-head">
              <h2>Article details</h2>
              <p>Core publishing fields for your post.</p>
            </div>

            <label className="db-field">
              Title
              <input
                className="db-input"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                required
                placeholder="e.g. Protein needs for active adults"
              />
            </label>

            <div className="db-field-row">
              <label className="db-field">
                URL slug
                <input
                  className="db-input"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    update("slug", slugify(e.target.value));
                  }}
                  required
                  placeholder="vitamin-b12-benefits"
                />
              </label>
              <label className="db-field">
                Focus keyword
                <input
                  className="db-input"
                  value={form.focusKeyword}
                  onChange={(e) => update("focusKeyword", e.target.value)}
                  placeholder="e.g. protein needs"
                />
              </label>
            </div>
            <p className="db-field-row-note">
              /blogs/{form.slug || "vitamin-b12-benefits"} · Any length is
              allowed. Shorter, keyword-focused URLs usually read better in
              search results.
            </p>

            <div className="db-field-row db-field-row-3">
              <label className="db-field">
                Category
                <select
                  className="db-select"
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                >
                  {ARTICLE_CATEGORIES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="db-field">
                Status
                <select
                  className="db-select"
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="review">In review</option>
                  <option value="published">Published</option>
                </select>
              </label>
              <label className="db-field">
                Featured
                <select
                  className="db-select"
                  value={form.isFeatured ? "yes" : "no"}
                  onChange={(e) => update("isFeatured", e.target.value === "yes")}
                  title="Yes = Latest posts + banner image on detail page"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes — Latest + banner</option>
                </select>
              </label>
            </div>

            <div className="db-field-row">
              <label className="db-field">
                Author
                <input
                  className="db-input"
                  value={form.author}
                  onChange={(e) => update("author", e.target.value)}
                  placeholder="Writer name shown on the website"
                />
              </label>
              <label className="db-field">
                Tags
                <input
                  className="db-input"
                  value={form.tags}
                  onChange={(e) => update("tags", e.target.value)}
                  placeholder="nutrition, protein, fitness"
                />
              </label>
            </div>

            <div className="db-field">
              <span className="db-featured-label">Featured image</span>
              <input
                ref={featuredFileRef}
                type="file"
                accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.avif,.bmp,.heic,.heif"
                hidden
                disabled={featuredUploading}
                onChange={(e) => {
                  handleFeaturedUpload(e.target.files);
                  e.target.value = "";
                }}
              />

              {form.featuredImage ? (
                <div className="db-featured-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.featuredImage} alt="Featured preview" />
                  <div className="db-featured-preview-meta">
                    <p className="name" title={featuredName || undefined}>
                      {shortFileName(featuredName) || "Current featured image"}
                    </p>
                    <p className="hint">
                      {String(form.featuredImage).startsWith("data:")
                        ? "Uploaded from your gallery"
                        : "Saved featured image"}
                    </p>
                    <div className="db-row-actions">
                      <button
                        type="button"
                        className="db-row-action edit"
                        onClick={() => featuredFileRef.current?.click()}
                        disabled={featuredUploading}
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        className="db-row-action delete"
                        onClick={clearFeaturedImage}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="db-featured-drop"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add("is-drag");
                  }}
                  onDragLeave={(e) => e.currentTarget.classList.remove("is-drag")}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("is-drag");
                    handleFeaturedUpload(e.dataTransfer.files);
                  }}
                >
                  <p>Upload from gallery or drag an image here</p>
                  <button
                    type="button"
                    className="db-secondary-btn"
                    onClick={() => featuredFileRef.current?.click()}
                    disabled={featuredUploading}
                  >
                    Choose image
                  </button>
                    <span className="db-field-hint">JPG, PNG, WebP, GIF, AVIF, or BMP · max 10MB</span>
                </div>
              )}
              {featuredError ? <p className="db-manager-add-error">{featuredError}</p> : null}
            </div>

            <label className="db-field">
              Excerpt
              <textarea
                className="db-textarea"
                value={form.excerpt}
                onChange={(e) => update("excerpt", e.target.value)}
                rows={3}
                placeholder="Short summary used on cards and as a fallback meta description"
              />
            </label>
          </section>

          <section className="db-panel db-composer-section">
            <div className="db-composer-section-head">
              <div>
                <h2>Content</h2>
                <p>Write your article — Visual / Text, media, headings, lists.</p>
              </div>
              <div className="db-composer-stats">
                <span>{wordCount} words</span>
                <span>~{readingMins} min read</span>
              </div>
            </div>
            <TipTapEditor
              value={form.content}
              onChange={(html) => update("content", html)}
              placeholder="Start writing your article…"
            />
          </section>

          <section className="db-panel db-composer-section">
            <div className="db-composer-section-head">
              <h2>SEO & Google fields</h2>
              <p>Search appearance, indexing, and social metadata.</p>
            </div>

            <label className="db-field">
              SEO title
              <input
                className="db-input"
                value={form.metaTitle}
                onChange={(e) => update("metaTitle", e.target.value)}
                placeholder="Keep around 50–60 characters"
                maxLength={70}
              />
              <span className="db-field-hint">
                {(form.metaTitle || form.title).length}/60 recommended
              </span>
            </label>

            <label className="db-field">
              Meta description
              <textarea
                className="db-textarea"
                value={form.metaDescription}
                onChange={(e) => update("metaDescription", e.target.value)}
                rows={3}
                placeholder="Compelling summary for Google results (120–160 characters)"
                maxLength={180}
              />
              <span className="db-field-hint">
                {(form.metaDescription || form.excerpt).length}/160 recommended
              </span>
            </label>

            <label className="db-field">
              Canonical URL
              <input
                className="db-input"
                value={form.canonicalUrl}
                onChange={(e) => {
                  setCanonicalTouched(true);
                  update("canonicalUrl", e.target.value);
                }}
                placeholder="https://nutrifactx.com/blogs/vitamin-b12-benefits"
              />
            </label>

            <div className="db-field-row">
              <label className="db-field">
                Open Graph title
                <input
                  className="db-input"
                  value={form.ogTitle}
                  onChange={(e) => {
                    markSocialTouched("ogTitle");
                    update("ogTitle", e.target.value);
                  }}
                  placeholder="Defaults to SEO title"
                />
              </label>
              <label className="db-field">
                Schema type
                <select
                  className="db-select"
                  value={form.schemaType}
                  onChange={(e) => update("schemaType", e.target.value)}
                >
                  <option>Article</option>
                  <option>BlogPosting</option>
                  <option>NewsArticle</option>
                  <option>HowTo</option>
                  <option>FAQPage</option>
                </select>
              </label>
            </div>

            <label className="db-field">
              Open Graph description
              <textarea
                className="db-textarea"
                value={form.ogDescription}
                onChange={(e) => {
                  markSocialTouched("ogDescription");
                  update("ogDescription", e.target.value);
                }}
                rows={2}
                placeholder="Defaults to meta description"
              />
            </label>

            <label className="db-field">
              Open Graph image URL
              <input
                className="db-input"
                value={form.ogImage}
                onChange={(e) => update("ogImage", e.target.value)}
                placeholder="Defaults to featured image"
              />
            </label>

            <div className="db-field-row">
              <label className="db-field">
                Twitter title
                <input
                  className="db-input"
                  value={form.twitterTitle}
                  onChange={(e) => {
                    markSocialTouched("twitterTitle");
                    update("twitterTitle", e.target.value);
                  }}
                  placeholder="Defaults to Open Graph title"
                />
              </label>
              <label className="db-field">
                Twitter image URL
                <input
                  className="db-input"
                  value={form.twitterImage}
                  onChange={(e) => update("twitterImage", e.target.value)}
                  placeholder="Defaults to Open Graph image"
                />
              </label>
            </div>

            <label className="db-field">
              Twitter description
              <textarea
                className="db-textarea"
                value={form.twitterDescription}
                onChange={(e) => {
                  markSocialTouched("twitterDescription");
                  update("twitterDescription", e.target.value);
                }}
                rows={2}
                placeholder="Defaults to Open Graph description"
              />
            </label>

            <div className="db-seo-robots">
              <label className="db-check">
                <input
                  type="checkbox"
                  checked={form.robotsIndex}
                  onChange={(e) => update("robotsIndex", e.target.checked)}
                />
                Allow indexing (index)
              </label>
              <label className="db-check">
                <input
                  type="checkbox"
                  checked={form.robotsFollow}
                  onChange={(e) => update("robotsFollow", e.target.checked)}
                />
                Follow links (follow)
              </label>
            </div>
          </section>

          <div className="db-form-actions">
            <button
              type="submit"
              className="db-new-post-btn"
              disabled={saving || featuredUploading}
            >
              {featuredUploading
                ? "Uploading image…"
                : saving
                ? "Saving…"
                : isEdit
                  ? "Update article"
                  : "Save article"}
            </button>
            <button
              type="button"
              className="db-secondary-btn"
              disabled={saving || featuredUploading}
              onClick={() => persist("review")}
            >
              Save & send to review
            </button>
            <Link href="/dashboard/articles" className="db-muted-link">
              Cancel
            </Link>
            {saveError ? (
              <p className="db-form-hint" style={{ color: "#b42318" }}>
                {saveError}
              </p>
            ) : null}
            {saved && !saveError ? (
              <p className="db-form-hint">
                {isEdit ? "Article updated in the database." : "Article saved."}
              </p>
            ) : null}
          </div>
        </div>

        <aside className="db-composer-side">
          <div className="db-panel db-seo-score-card">
            <p className="db-seo-score-label">SEO score</p>
            <p className={`db-seo-score-value tone-${band.tone}`}>{score}</p>
            <p className={`db-seo-band tone-${band.tone}`}>{band.label}</p>
            <div className="db-seo-meter">
              <span style={{ width: `${score}%` }} />
            </div>
            <p className="db-seo-score-meta">
              {passed}/{checks.length} ranking checks passed
            </p>
          </div>

          <div className="db-panel">
            <div className="db-composer-section-head">
              <h2>Google preview</h2>
            </div>
            <div className="db-serp-preview">
              <p className="db-serp-url">{serpUrl}</p>
              <p className="db-serp-title">{serpTitle}</p>
              <p className="db-serp-desc">{serpDesc}</p>
            </div>
          </div>

          <div className="db-panel">
            <div className="db-composer-section-head">
              <h2>Ranking expectations</h2>
              <p>Checklist Google-friendly posts usually need.</p>
            </div>
            <ul className="db-seo-checklist">
              {checks.map((item) => (
                <li key={item.id} className={item.pass ? "pass" : "fail"}>
                  <span className="mark">{item.pass ? "✓" : "•"}</span>
                  <div>
                    <p className="label">{item.label}</p>
                    <p className="hint">{item.hint}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="db-panel">
            <div className="db-composer-section-head">
              <h2>AI writing → Google ranking</h2>
              <p>
                Follow this before publishing. Raw AI text rarely ranks or earns
                AdSense traffic.
              </p>
            </div>
            <ol className="db-seo-guide">
              {AI_RANKING_GUIDE.map((item) => (
                <li key={item.title}>
                  <p className="label">{item.title}</p>
                  <p className="hint">{item.text}</p>
                </li>
              ))}
            </ol>
            <p className="db-seo-guide-note">
              Aim for score 85+ before publishing. Keep medical claims accurate —
              Google treats nutrition as a high-trust topic.
            </p>
          </div>
        </aside>
      </form>
    </>
  );
}
