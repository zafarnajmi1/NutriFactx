#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Node $(node -v)"
echo "==> Restoring tracked build files"
git restore postcss.config.mjs package-lock.json 2>/dev/null || true
rm -f pnpm-lock.yaml pnpm-workspace.yaml

echo "==> Installing dependencies (includes Tailwind for CSS build)"
npm ci

echo "==> Building production bundle"
rm -rf .next
npm run build

echo "==> Restarting app"
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart nutrifactx || pm2 start npm --name nutrifactx -- start
  pm2 save
else
  echo "PM2 not found. Run: npm start"
fi

echo "==> Deploy complete"
