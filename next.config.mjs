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
};

export default nextConfig;
