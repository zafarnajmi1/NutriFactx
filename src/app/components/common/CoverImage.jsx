import Image from "next/image";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
const SITE_HOSTS = new Set([
  "media.nutrifactx.com",
  "nutrifactx.com",
  "www.nutrifactx.com",
]);

function isOptimizableSrc(src) {
  const value = String(src || "").trim();
  if (!value || value.startsWith("data:") || value.startsWith("blob:")) {
    return false;
  }
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (SITE_HOSTS.has(url.hostname) || LOCAL_HOSTS.has(url.hostname)) return true;
    return (
      url.hostname.endsWith(".r2.dev") ||
      url.hostname.endsWith(".r2.cloudflarestorage.com")
    );
  } catch {
    return false;
  }
}

export default function CoverImage({
  src,
  alt = "",
  className = "",
  sizes,
  priority = false,
}) {
  if (!src) return null;

  if (isOptimizableSrc(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={className}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`absolute inset-0 h-full w-full ${className}`}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
}
