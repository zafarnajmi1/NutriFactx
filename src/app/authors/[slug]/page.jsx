import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthorBySlug, listPostsByAuthorSlug } from "@/lib/authors";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";
import "./author.css";

function formatListDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) {
    return { title: "Author not found", robots: { index: false, follow: false } };
  }
  const description =
    author.qualifications ||
    author.title ||
    (author.bio ? String(author.bio).slice(0, 155) : "") ||
    `${author.name} — NutriFactx author`;
  return {
    title: author.name,
    description,
    alternates: {
      canonical: absoluteUrl(`/authors/${author.slug}`),
    },
    openGraph: {
      title: author.name,
      description,
      url: absoluteUrl(`/authors/${author.slug}`),
      type: "profile",
    },
  };
}

export default async function AuthorBioPage({ params }) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const posts = await listPostsByAuthorSlug(author.slug, 12);
  const siteUrl = getSiteUrl();
  const pageUrl = absoluteUrl(`/authors/${author.slug}`, siteUrl);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    url: pageUrl,
    ...(author.title ? { jobTitle: author.title } : {}),
    ...(author.image ? { image: author.image } : {}),
    ...(author.qualifications ||
    (author.showCredentials !== false && author.credentials)
      ? {
          hasCredential: [
            author.qualifications,
            author.showCredentials !== false ? author.credentials : "",
          ]
            .filter(Boolean)
            .join(". "),
        }
      : {}),
    ...(author.bio ? { description: author.bio } : {}),
    worksFor: {
      "@type": "Organization",
      name: "NutriFactx",
      url: siteUrl,
    },
  };

  return (
    <div className="author-bio-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="abio-hero">
        <div className="abio-hero-inner">
          <p className="abio-eyebrow">Author</p>
          <div className="abio-identity">
            {author.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="abio-photo" src={author.image} alt={author.name} />
            ) : (
              <div className="abio-photo abio-photo-fallback" aria-hidden="true">
                {author.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join("")}
              </div>
            )}
            <div>
              <h1>{author.name}</h1>
              {author.title ? <p className="abio-title">{author.title}</p> : null}
              {author.qualifications ? (
                <p className="abio-quals">{author.qualifications}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="abio-layout">
        <article className="abio-main">
          {author.bio ? (
            <section className="abio-section">
              <h2>About</h2>
              <p className="abio-prose">{author.bio}</p>
            </section>
          ) : null}

          {author.education ? (
            <section className="abio-section">
              <h2>Education &amp; degrees</h2>
              <p className="abio-prose">{author.education}</p>
            </section>
          ) : null}

          {author.showCredentials !== false && author.credentials ? (
            <section className="abio-section">
              <h2>Certifications</h2>
              <p className="abio-prose">{author.credentials}</p>
            </section>
          ) : null}

          {author.experience ? (
            <section className="abio-section">
              <h2>Experience</h2>
              <p className="abio-prose">{author.experience}</p>
            </section>
          ) : null}

          <section className="abio-section">
            <h2>Articles by {author.name.split(" ")[0]}</h2>
            {posts.length === 0 ? (
              <p className="abio-empty">No published articles yet.</p>
            ) : (
              <ul className="abio-posts">
                {posts.map((post) => (
                  <li key={post.id}>
                    <Link href={`/blogs/${post.slug}`}>
                      <span className="abio-post-title">{post.title}</span>
                      <span className="abio-post-meta">
                        {post.category}
                        {post.published_at || post.created_at
                          ? ` · ${formatListDate(post.published_at || post.created_at)}`
                          : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </article>
      </div>
    </div>
  );
}
