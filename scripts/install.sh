#!/usr/bin/env bash
set -euo pipefail

REPO="FallingReign/skills"
VERSION="0.1.0"

print_banner() {
  cat <<'EOF'
  ___      _ _ _              ____       _             
 | __|_ _ | | (_)_ _  __ _   | _ \___ __| |_ _  _ _ __ 
 | _|| ' \| | | | ' \/ _` |  |   / -_) _` | ' \| | '_ \
 |_| |_||_|_|_|_|_||_\__, |  |_|_\___\__,_|_||_|_| .__/
                     |___/                        |_|   
EOF
}

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

print_banner
echo "Version: $VERSION"
echo "Installing skills from: $TARGET"
npx skills@latest add "$TARGET"
