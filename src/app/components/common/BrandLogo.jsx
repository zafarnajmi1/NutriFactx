import Link from "next/link";

/**
 * Site brand mark: N icon + wordmark text for light backgrounds.
 * The PNG wordmark has a black canvas, so header/footer use the icon + text.
 */
export default function BrandLogo({
  href = "/",
  className = "",
  showWord = true,
  size = 28,
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 font-medium tracking-tight ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/nutrifactx-icon.png"
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-[22%]"
        aria-hidden="true"
      />
      {showWord ? (
        <span className="font-[family-name:var(--font-fraunces)] text-nf-text">
          Nutri<span className="text-nf-lime">Factx</span>
        </span>
      ) : (
        <span className="sr-only">NutriFactx</span>
      )}
    </Link>
  );
}
