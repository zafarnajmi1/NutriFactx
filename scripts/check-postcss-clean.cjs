const { existsSync, readFileSync, readdirSync, statSync } = require("fs");
const { extname, join } = require("path");

const root = join(__dirname, "..");
const errors = [];

function fail(message) {
  errors.push(message);
}

if (existsSync(join(root, "api.js"))) {
  fail("Root api.js is malware. Delete it and do not run it.");
}

const pkg = readFileSync(join(root, "package.json"), "utf8");
if (pkg.includes("api.js")) {
  fail("package.json still launches api.js. Use plain next dev/build/start.");
}

const postcss = readFileSync(join(root, "postcss.config.mjs"), "utf8");
if (postcss.length > 400) {
  fail("postcss.config.mjs is too large and looks infected.");
}

const postcssMarkers = [
  "8-1131",
  "A8-1131",
  "_0x",
  "fromCharCode",
  "createRequire",
  "global[",
  "global.i",
];
for (const marker of postcssMarkers) {
  if (postcss.includes(marker)) {
    fail(`postcss.config.mjs contains malware marker: ${marker}`);
  }
}

const allowedRootJs = new Set([
  "next.config.mjs",
  "eslint.config.mjs",
  "postcss.config.mjs",
]);
for (const name of readdirSync(root)) {
  const path = join(root, name);
  if (!statSync(path).isFile()) continue;
  if (![".js", ".mjs", ".cjs"].includes(extname(name))) continue;
  if (allowedRootJs.has(name)) continue;
  fail(`Unexpected root file ${name}. Malware droppers often use this name — remove it.`);
}

if (errors.length) {
  console.error("ERROR: malware payload detected:");
  for (const message of errors) {
    console.error(` - ${message}`);
  }
  process.exit(1);
}
