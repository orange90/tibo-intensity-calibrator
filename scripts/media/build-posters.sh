#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SOURCE_DIR="$PROJECT_ROOT/media/source-frames"
OUTPUT_DIR="$PROJECT_ROOT/public/frames"

command -v sips >/dev/null 2>&1 || {
  echo "缺少 sips；请在 macOS 上运行此脚本，或用等价图片工具生成 800px JPG。" >&2
  exit 1
}

mkdir -p "$OUTPUT_DIR"

for source in "$SOURCE_DIR"/frame-*.png; do
  name="$(basename "$source" .png)"
  sips -s format jpeg -s formatOptions 82 -Z 800 "$source" --out "$OUTPUT_DIR/$name.jpg" >/dev/null
done
