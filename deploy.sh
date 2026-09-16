#!/bin/bash
set -e
cd /home/opc/omnipdf
git pull origin main
pnpm install
# Not `npm test`: npm's script runner does its own dependency-tree check before
# running anything, and chokes on this repo's pnpm-shaped node_modules ("Cannot
# read properties of null (reading 'matches')" in @npmcli/arborist). Calling npx
# directly (same command the test script runs) skips that check entirely.
timeout 300 npx tsx tests/run-all.ts
npm run build
pm2 restart filecraft-drive
