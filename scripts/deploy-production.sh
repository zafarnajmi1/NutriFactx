#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Node $(node -v)"

# Never git add/commit/push from the server. That is how infected
# postcss/package.json got back onto GitHub and blocked laptop pushes.

# Malware dropper. Never run it. Never git-restore it from history.
rm -f api.js

# Strip the npm-script hook if a deploy copy still has it.
node -e '
const fs = require("fs");
const file = "package.json";
const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
let changed = false;
for (const [name, value] of Object.entries(pkg.scripts || {})) {
  if (typeof value === "string" && value.includes("api.js")) {
    pkg.scripts[name] = value.replace(/node api\.js && /g, "").replace(/node api\.js/g, "").trim();
    changed = true;
  }
}
if (changed) fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
'

# Never git-restore postcss — that reintroduced malware from an infected commit.
# Always write the known-clean Tailwind config before build.
cat > postcss.config.mjs << 'EOF'
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
EOF

git restore package-lock.json 2>/dev/null || true
rm -f pnpm-lock.yaml pnpm-workspace.yaml

if [[ -f api.js ]]; then
  echo "ERROR: api.js is still present. Aborting deploy."
  exit 1
fi
if grep -q "api.js" package.json; then
  echo "ERROR: package.json still references api.js. Aborting deploy."
  exit 1
fi
if grep -Eq "A?8-1131|_0x|fromCharCode|createRequire|global\[" postcss.config.mjs 2>/dev/null \
  || [[ "$(wc -c < postcss.config.mjs)" -gt 500 ]]; then
  echo "ERROR: postcss.config.mjs is infected. Aborting deploy."
  exit 1
fi

node scripts/check-postcss-clean.cjs

echo "==> Installing dependencies (includes Tailwind for CSS build)"
# npm ci fails on npm 12 when the lockfile is missing optional Next/ESLint peers.
# Use install with a pinned lockfile instead of aborting deploy.
npm install --no-audit --no-fund --legacy-peer-deps

echo "==> Building production bundle"
rm -rf .next
npm run build

echo "==> Restarting app"
if command -v pm2 >/dev/null 2>&1; then
  pm2 stop nutrifactx >/dev/null 2>&1 || true
  # Drop leftover next-server copies that cause CSS 500 / EADDRINUSE
  pkill -f "next-server" >/dev/null 2>&1 || true
  pkill -f "next start" >/dev/null 2>&1 || true
  sleep 1
  pm2 start npm --name nutrifactx -- start || pm2 restart nutrifactx
  pm2 save
else
  echo "PM2 not found. Run: npm start"
fi

echo "==> Deploy complete"
