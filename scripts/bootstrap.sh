#!/usr/bin/env bash
# scripts/bootstrap.sh
# Imitates the Docker build stage locally without building an image.
# Run from the project root.

set -euo pipefail

BUILD_DIR="${1:-/tmp/expressjs-blog-build}"

echo ">>> Cleaning build dir: $BUILD_DIR"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

echo ">>> Copying source files..."
cp ./.yarnrc.yml "$BUILD_DIR/"
cp ./package.json "$BUILD_DIR/"
cp ./yarn.lock "$BUILD_DIR/"
cp -r ./.yarn "$BUILD_DIR/.yarn"
cp -r ./node_modules "$BUILD_DIR/node_modules"
cp -r ./public "$BUILD_DIR/public"
cp -r ./scripts "$BUILD_DIR/scripts"
cp -r ./content "$BUILD_DIR/content"
cp -r ./src "$BUILD_DIR/src"

if [ -d "./.puppeteer" ]; then
  mkdir -p ./puppeteer
  cp -r ./.puppeteer/. ./puppeteer
fi

echo ">>> Computing build SHA..."
find "$BUILD_DIR" -type f \
  -not -path '*/node_modules/*' \
  -not -path '*/.yarn/*' \
  -print0 | sort -z | xargs -0 sha256sum | sha256sum | cut -d' ' -f1 \
  >"$BUILD_DIR/BUILD_SHA_FILE"
echo ">>> Build SHA: $(cat $BUILD_DIR/BUILD_SHA_FILE)"

echo ">>> Enabling corepack..."
# corepack enable
# corepack prepare yarn@4.9.2 --activate

echo ">>> Running yarn combine:css and workspaces focus..."
cd "$BUILD_DIR"
yarn combine:css
yarn workspaces focus --production

echo ""
echo ">>> Bootstrap complete. Build dir: $BUILD_DIR"
echo ">>> To test the runtime stage:"
echo "    NODE_ENV=production PORT=3000 node $BUILD_DIR/src/app.js"

yarn start
