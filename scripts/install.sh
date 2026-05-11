#!/usr/bin/env bash
set -euo pipefail

REPO="FallingReign/skills"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Usage: ./scripts/install.sh [skill-name]"
  echo "Examples:"
  echo "  ./scripts/install.sh"
  echo "  ./scripts/install.sh video-producer"
  exit 0
fi

TARGET="$REPO"
if [[ $# -ge 1 ]]; then
  TARGET="$REPO/$1"
fi

echo "Installing skills from: $TARGET"
npx skills@latest add "$TARGET"
