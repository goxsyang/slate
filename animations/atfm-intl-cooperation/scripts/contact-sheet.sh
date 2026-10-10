#!/usr/bin/env bash
# Tile frames of a rendered MP4 into contact sheets for review.
#   scripts/contact-sheet.sh out/atfm-intl-cooperation.mp4 [fps=2] [outdir=out/sheets]
set -euo pipefail
in=${1:?mp4}; fps=${2:-2}; out=${3:-out/sheets}
mkdir -p "$out"; rm -f "$out"/sheet_*.jpg
ffmpeg -v error -i "$in" -vf "fps=$fps,scale=480:-1,drawtext=text='%{pts\:hms}':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6,tile=4x3" "$out/sheet_%02d.jpg"
ls "$out"
