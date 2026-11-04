#!/usr/bin/env bash
# Final renders for the ATFM v5 segment.
#   tools/make-renders.sh            → renders/ATFM_flow-management_v5.mp4 (delivery, 59.94 fps, 49 s)
#                                     + renders/ATFM_flow-management_v5_REVIEW_subtitles.mp4 (VO subtitles burned in)
# Requires: hyperframes 0.8.130 CLI, ffmpeg with libass, tools/vo.ass (from tools/vo.srt), tools/fonts-src/NotoSansTC-VF.ttf
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=renders/ATFM_flow-management_v5.mp4
REV=renders/ATFM_flow-management_v5_REVIEW_subtitles.mp4
mkdir -p renders
echo "== lint"; npx --yes hyperframes@0.8.130 lint
echo "== render delivery"; npx --yes hyperframes@0.8.130 render --quality delivery --fps 60000/1001 -w 3 -o "$OUT"
echo "== verify"; ffprobe -v error -show_entries stream=width,height,r_frame_rate,nb_frames,duration -of compact "$OUT"
echo "== review copy with VO subtitles"
# libass needs a font dir with a CJK face; the subtitles sit in the empty bottom zone (y ≥ 915) the film keeps clear
ffmpeg -y -v error -i "$OUT" -vf "ass=tools/vo.ass:fontsdir=tools/fonts-src" \
  -c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p -r 60000/1001 -movflags +faststart "$REV"
ffprobe -v error -show_entries stream=nb_frames,duration -of compact "$REV"
ls -la renders/*.mp4
