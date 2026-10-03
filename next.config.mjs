import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function imageRemotePatterns() {
  const patterns = [
    { protocol: "https", hostname: "media.nutrifactx.com", pathname: "/**" },
    { protocol: "https", hostname: "nutrifactx.com", pathname: "/**" },
    { protocol: "https", hostname: "www.nutrifactx.com", pathname: "/**" },
    { protocol: "https", hostname: "*.r2.dev", pathname: "/**" },
    { protocol: "http", hostname: "localhost", pathname: "/**" },
  ];
  const r2Base = process.env.CF_R2_PUBLIC_BASE_URL?.trim();
  if (r2Base) {
    try {
      const url = new URL(r2Base);
      const protocol = url.protocol.replace(":", "");
      if (protocol === "http" || protocol === "https") {
        patterns.push({
          protocol,
          hostname: url.hostname,
          pathname: "/**",
        });
      }
    } catch {
      /* ignore invalid public media URL */
    }
  }
  return patterns;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // TipTap's useEditor is incompatible with React Compiler in this setup
  reactCompiler: false,
  images: {
    remotePatterns: imageRemotePatterns(),
    formats: ["image/avif", "image/webp"],
    qualities: [50, 75],
    deviceSizes: [640, 750, 828, 1080, 1200, 1600],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  // Allow large article saves when content embeds original images (no pixel compression).
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    inlineCss: true,
  },
  turbopack: {
    root: __dirname,
  },
  transpilePackages: [
    "@tiptap/react",
    "@tiptap/core",
    "@tiptap/pm",
    "@tiptap/starter-kit",
    "@tiptap/extension-image",
    "@tiptap/extension-placeholder",
    "@tiptap/extension-text-align",
    "@tiptap/extension-underline",
    "@tiptap/extension-table",
    "@tiptap/extension-table-row",
    "@tiptap/extension-table-cell",
    "@tiptap/extension-table-header",
    "@tiptap/extensions",
  ],
  // Canonical host is nutrifactx.com (no www). www is a live duplicate in GSC.
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "www.nutrifactx.com" }],
        destination: "https://nutrifactx.com/",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.nutrifactx.com" }],
        destination: "https://nutrifactx.com/:path*",
        permanent: true,
      },
      {
        source:
          "/blogs/how-to-avoid-seed-oils-when-eating-out-a-practical-guide",
        destination: "/blogs/how-to-avoid-seed-oils-at-restaurants",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
