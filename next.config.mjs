import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // TipTap's useEditor is incompatible with React Compiler in this setup
  reactCompiler: false,
  // Allow large article saves when content embeds original images (no pixel compression).
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
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
