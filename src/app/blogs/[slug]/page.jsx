import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import BlogComments from "../../components/blog-components/BlogComments";
import { SidePostCard } from "../../components/blog-components/BlogDetailCards";
import BlogsCard from "../../components/common/BlogsCard";
import {
  getBlogBySlug,
  getBlogComments,
  getBlogMetaBySlug,
  getBlogSlugByFormerCanonical,
  getRecentBlogs,
  getRelatedBlogs,
} from "@/lib/blogs";
import { buildArticleBreadcrumbJsonLd, buildArticleJsonLd, buildArticleMetadata } from "@/lib/seo";
import "./blog-detail.css";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  let blog = await getBlogMetaBySlug(slug);
  if (!blog) {
    const liveSlug = await getBlogSlugByFormerCanonical(slug);
    if (liveSlug) {
      blog = await getBlogMetaBySlug(liveSlug);
    }
  }
  if (!blog) {
    return {
      title: "Blog not found",
      robots: { index: false, follow: false },
    };
  }
  return buildArticleMetadata(blog);
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    const liveSlug = await getBlogSlugByFormerCanonical(slug);
    if (liveSlug) {
      permanentRedirect(`/blogs/${liveSlug}`);
    }
    notFound();
  }

  // One recent query shared by sidebar + similar grid (was fetched twice).
  const [recentPosts, relatedPosts, comments] = await Promise.all([
    getRecentBlogs(5),
    getRelatedBlogs(blog.slug, 5),
    getBlogComments(blog.slug),
  ]);

  const sideRecent = recentPosts
    .filter((item) => item.slug !== blog.slug)
    .slice(0, 5);
  const similar = recentPosts
    .filter((item) => item.slug !== blog.slug)
    .slice(0, 4);
  const keywords = [
    blog.focusKeyword,
    ...(Array.isArray(blog.tags) ? blog.tags : []),
    blog.category,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  const showBannerImage = Boolean(blog.featuredImage);
  const jsonLd = buildArticleJsonLd(blog);
  const breadcrumbLd = buildArticleBreadcrumbJsonLd(blog);

  return (
    <div className="blog-detail-page">
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      {breadcrumbLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      ) : null}

      <div
        className={`bd-banner${showBannerImage ? " has-image" : ""}`}
        style={
          showBannerImage
            ? { backgroundImage: `url(${blog.featuredImage})` }
            : undefined
        }
        role={showBannerImage ? "img" : undefined}
        aria-label={showBannerImage ? blog.title : undefined}
      >
        <div className="bd-banner-inner">
          <span className="bd-eyebrow">{blog.category}</span>
          <h1>{blog.title}</h1>
          <div className="bd-banner-sub">
            By{" "}
            {blog.authorSlug ? (
              <Link href={`/authors/${blog.authorSlug}`} className="bd-author-link">
                {blog.author}
              </Link>
            ) : (
              blog.author
            )}{" "}
            &middot; {blog.date}
          </div>
        </div>
      </div>

      <div className="bd-layout">
        <aside className="bd-aside">
          <p className="bd-panel-title">Recent blogs</p>
          {sideRecent.map((post) => (
            <SidePostCard
              key={post.id}
              title={post.title}
              excerpt={post.excerpt}
              category={post.category}
              author={post.author}
              date={post.date}
              href={`/blogs/${post.slug}`}
              seed={post.slug}
              image={post.featuredImage}
            />
          ))}
        </aside>

        <div className="bd-article-column">
          <article itemScope itemType="https://schema.org/Article">
            <meta itemProp="headline" content={blog.metaTitle || blog.title} />
            {blog.metaDescription || blog.excerpt ? (
              <meta
                itemProp="description"
                content={blog.metaDescription || blog.excerpt}
              />
            ) : null}
            {keywords.length ? (
              <meta itemProp="keywords" content={keywords.join(", ")} />
            ) : null}

            <header>
              <div className="bd-article-meta">
                <div className="bd-avatar">{getInitials(blog.author)}</div>
                <div className="bd-author-name" itemProp="author">
                  {blog.authorSlug ? (
                    <Link href={`/authors/${blog.authorSlug}`} className="bd-author-link">
                      {blog.author}
                    </Link>
                  ) : (
                    blog.author
                  )}
                </div>
                <span className="bd-meta-dot">&middot;</span>
                <span className="bd-meta-date">{blog.date}</span>
              </div>
            </header>

            <div className="bd-article-body" itemProp="articleBody">
              {blog.contentHtml ? (
                <div
                  className="bd-article-html"
                  dangerouslySetInnerHTML={{ __html: blog.contentHtml }}
                />
              ) : (
                <p>{blog.excerpt}</p>
              )}
            </div>

            <BlogComments
              initialComments={comments}
              postId={blog.id}
              slug={blog.slug}
            />
          </article>
        </div>

        <aside className="bd-aside">
          <p className="bd-panel-title">Related blogs</p>
          {relatedPosts.map((post) => (
            <SidePostCard
              key={post.id}
              title={post.title}
              excerpt={post.excerpt}
              category={post.category}
              author={post.author}
              date={post.date}
              href={`/blogs/${post.slug}`}
              seed={post.slug}
              image={post.featuredImage}
            />
          ))}
        </aside>
      </div>

      <div className="bd-similar-section">
        <p className="bd-panel-title">Similar blogs</p>
        <div className="nf-posts-grid">
          {similar.map((post) => (
            <BlogsCard
              key={post.id}
              title={post.title}
              excerpt={post.excerpt}
              category={post.category}
              author={post.author}
              date={post.date}
              image={post.featuredImage}
              featured={post.isFeatured}
              href={`/blogs/${post.slug}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
