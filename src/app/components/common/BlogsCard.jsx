import Link from "next/link";

const categoryStyles = {
  Nutrition: "bg-[#E1F5EE] text-[#085041]",
  Fitness: "bg-[#FCEBE7] text-[#993C1D]",
  "Mental health": "bg-[#EAF3DE] text-[#3B6D11]",
  Sleep: "bg-[#FBEAF0] text-[#993556]",
  Diabetes: "bg-[#EEEDFE] text-[#3C3489]",
  Wellness: "bg-[#FAEEDA] text-[#854F0B]",
  Design: "bg-[#EEEDFE] text-[#3C3489]",
  default: "bg-[#E1F5EE] text-[#085041]",
};

const imageTones = [
  "from-[#B5D4F4] to-[#7BA8D4]",
  "from-[#F0997B] to-[#D97858]",
  "from-[#97C459] to-[#6FA03A]",
  "from-[#ED93B1] to-[#D06A8F]",
  "from-[#AFA9EC] to-[#887FDB]",
  "from-[#5DCAA5] to-[#3AA882]",
  "from-[#EF9F27] to-[#D48410]",
];

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function BlogsCard({
  title,
  excerpt,
  category = "Nutrition",
  href = "/blogs",
  author = "NutriFactx",
  date,
  image,
  featured = false,
}) {
  const categoryClass = categoryStyles[category] || categoryStyles.default;
  const initials = getInitials(author);
  const tone =
    imageTones[
      Math.abs(
        [...(title || category)].reduce((sum, char) => sum + char.charCodeAt(0), 0)
      ) % imageTones.length
    ];

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#f3f3f3]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={title || "Article cover"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-br ${tone}`}
            aria-hidden="true"
          />
        )}

        {featured ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-nf-green-deep shadow-sm backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-nf-lime" aria-hidden="true" />
            Featured
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <span
          className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryClass}`}
        >
          {category}
        </span>

        <h3 className="mt-3 text-sm font-semibold leading-snug text-[#111111] sm:text-base">
          {title}
        </h3>

        {excerpt ? (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#6b6b6b] sm:text-sm">
            {excerpt}
          </p>
        ) : null}

        <div className="mt-auto border-t border-[#eeeeee] pt-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#d9d9d9] text-[0.625rem] font-medium text-[#555555]"
                aria-hidden="true"
              >
                {initials || "NF"}
              </span>
              <span className="truncate text-xs text-[#5f5f5f] sm:text-sm">{author}</span>
            </div>

            {date ? (
              <span className="inline-flex shrink-0 items-center gap-1 text-xs text-[#8a8a8a]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
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
      </div>
    </Link>
  );
}
