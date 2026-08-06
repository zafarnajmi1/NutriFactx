import Link from "next/link";

const tones = [
  "linear-gradient(135deg, #B5D4F4, #7BA8D4)",
  "linear-gradient(135deg, #F0997B, #D97858)",
  "linear-gradient(135deg, #97C459, #6FA03A)",
  "linear-gradient(135deg, #ED93B1, #D06A8F)",
  "linear-gradient(135deg, #AFA9EC, #887FDB)",
  "linear-gradient(135deg, #5DCAA5, #3AA882)",
  "linear-gradient(135deg, #EF9F27, #D48410)",
];

const categoryStyles = {
  Nutrition: { bg: "#E1F5EE", color: "#085041" },
  Fitness: { bg: "#FCEBE7", color: "#993C1D" },
  "Mental health": { bg: "#EAF3DE", color: "#3B6D11" },
  Sleep: { bg: "#FBEAF0", color: "#993556" },
  Diabetes: { bg: "#EEEDFE", color: "#3C3489" },
  Wellness: { bg: "#FAEEDA", color: "#854F0B" },
  Design: { bg: "#EEEDFE", color: "#3C3489" },
  default: { bg: "#E8F0FE", color: "#1A73E8" },
};

function toneFor(seed = "") {
  const sum = [...seed].reduce((total, char) => total + char.charCodeAt(0), 0);
  return tones[Math.abs(sum) % tones.length];
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function SidePostCard({
  title,
  excerpt,
  category = "Nutrition",
  author = "NutriFactx",
  date,
  href,
  seed,
  image,
}) {
  const badge = categoryStyles[category] || categoryStyles.default;
  const initials = getInitials(author);

  return (
    <Link href={href} className="bd-side-card">
      <div className="thumb">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={title || "Article cover"} className="thumb-image" />
        ) : (
          <div className="thumb-tone" style={{ background: toneFor(seed || title) }} />
        )}
      </div>
      <div className="body">
        <span className="badge" style={{ background: badge.bg, color: badge.color }}>
          {category}
        </span>
        <p className="title">{title}</p>
        {excerpt ? <p className="excerpt">{excerpt}</p> : null}
        <div className="meta">
          <div className="author">
            <span className="avatar" aria-hidden="true">
              {initials || "NF"}
            </span>
            <span className="author-name">{author}</span>
          </div>
          {date ? (
            <span className="datetime">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              {date}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function SimilarBlogCard({ title, date, href, seed }) {
  return (
    <Link href={href} className="bd-similar-card">
      <div className="media" style={{ background: toneFor(seed || title) }} />
      <div className="content">
        <p className="title">{title}</p>
        <p className="date">{date}</p>
      </div>
    </Link>
  );
}
