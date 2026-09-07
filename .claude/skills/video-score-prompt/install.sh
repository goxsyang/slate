#!/usr/bin/env bash
# 把本 skill 複製到使用者層的 ~/.claude/skills/，讓所有專案都能用。
# 用法：bash .claude/skills/video-score-prompt/install.sh
set -euo pipefail
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${HOME}/.claude/skills/video-score-prompt"
mkdir -p "${HOME}/.claude/skills"
rm -rf "${DEST}"
cp -R "${SRC}" "${DEST}"
chmod +x "${DEST}/scripts/analyze_video.sh"
echo "已安裝到 ${DEST}"
for t in ffmpeg ffprobe python3; do
  command -v "$t" >/dev/null 2>&1 || echo "提醒：找不到 ${t}，量測腳本需要它（macOS: brew install ffmpeg）"
done
echo "重開 Claude Code 後即可用「配樂」「BGM」等關鍵字觸發。"
