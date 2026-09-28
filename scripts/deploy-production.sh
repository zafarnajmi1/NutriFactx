#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Node $(node -v)"

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

if grep -q "A8-1131" postcss.config.mjs 2>/dev/null || [[ "$(wc -c < postcss.config.mjs)" -gt 500 ]]; then
  echo "ERROR: postcss.config.mjs is infected. Aborting deploy."
  exit 1
fi

echo "==> Installing dependencies (includes Tailwind for CSS build)"
npm ci

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
