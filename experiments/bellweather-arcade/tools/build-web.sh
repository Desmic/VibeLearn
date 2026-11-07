#!/bin/bash
# The public web copy of the demo (Render static site, render.yaml at the repo root): the same page
# as the claude.ai artifact (tools/build-hosted.py), built from a clean checkout.
#   bash experiments/bellweather-arcade/tools/build-web.sh     → experiments/bellweather-arcade/dist/web
set -e
cd "$(dirname "$0")/.."
[ -d node_modules/three ] || npm ci --no-audit --no-fund
bash tools/build.sh
python3 tools/build-hosted.py --dest dist/web
echo "web build: $(du -sh dist/web | cut -f1) in dist/web"
