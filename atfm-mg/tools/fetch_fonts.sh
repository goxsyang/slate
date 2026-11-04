#!/usr/bin/env bash
# Download full Noto Sans TC weights (Google Fonts, SIL OFL) into fonts/.
# Only needed when you change on-screen text; the committed subset in
# fonts/subset/ already covers every glyph the composition uses.
set -euo pipefail
cd "$(dirname "$0")/../fonts"
css=$(curl -fsSL "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap")
i=0
for w in 300 400 500 700 900; do
  i=$((i + 1))
  url=$(printf '%s\n' "$css" | grep -oE 'https://[^)]+\.ttf' | sed -n "${i}p")
  curl -fsSL -o "NotoSansTC-$w.ttf" "$url"
  echo "NotoSansTC-$w.ttf"
done
