export function optimizedImagePath(src, width = 828, quality = 75) {
  const value = String(src || "").trim();
  if (!value) return "";
  const params = new URLSearchParams({
    url: value,
    w: String(width),
    q: String(quality),
  });
  return `/_next/image?${params.toString()}`;
}
