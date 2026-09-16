#!/bin/bash
set -e
cd /home/opc/omnipdf
git pull origin main
pnpm install
timeout 300 npm test
npm run build
pm2 restart filecraft-drive
