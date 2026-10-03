#!/bin/bash
# Build the game into out/ (plain ES modules + import map; serve out/ with any static server).
#   bash tools/build.sh      then   npx vite preview --outDir out   or   npm run check
set -e
cd "$(dirname "$0")/.."   # the game folder (experiments/bellweather-arcade)
mkdir -p out && rm -rf out/*
npx tsc -p tsconfig.build.json || echo '!! TYPE ERRORS above: the build went on, but run npm run check before shipping'
cp -r public/* out/
cp src/style.css out/style.css
mkdir -p out/three && cp -r node_modules/three/build node_modules/three/examples out/three/
# fix relative imports -> .js, drop css import
python3 tools/fiximports.py
sed -e 's#<script type="module" src="/src/main.ts"></script>#<link rel="stylesheet" href="/style.css"><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script><script type="module" src="/src/main.js"></script>#' index.html > out/index.html
mkdir -p out/tools && find tools -maxdepth 1 -type f -exec cp -t out/tools/ {} +
