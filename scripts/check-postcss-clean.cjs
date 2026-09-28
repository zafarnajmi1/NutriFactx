const { readFileSync } = require("fs");
const { join } = require("path");

const file = join(__dirname, "..", "postcss.config.mjs");
const source = readFileSync(file, "utf8");

if (
  source.includes("A8-1131") ||
  source.includes("_0x54d6a0") ||
  source.includes("global.i") ||
  source.length > 500
) {
  console.error(
    "ERROR: postcss.config.mjs looks infected. Use the short Tailwind-only config.",
  );
  process.exit(1);
}
