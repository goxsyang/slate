#!/bin/bash
# fb_download.sh — 一鍵下載 Facebook 影片 / Reels（macOS 專用，不需要事先安裝任何東西）
#
# 用法：
#   bash tools/fb_download.sh <FB影片網址> [更多網址...]
#
# 或不用下載檔案，直接一行貼進「終端機」：
#   curl -fsSL https://raw.githubusercontent.com/goxsyang/slate/main/tools/fb_download.sh | bash -s -- <網址1> <網址2>
#
# 它會做的事：
#   1. 把 yt-dlp 官方的 macOS 獨立執行檔（Intel / Apple Silicon 通用，不需要 Python 或 Homebrew）
#      下載到 ~/Desktop/FB影片/.tools/ ；已經有的話會順便檢查更新。
#   2. 逐一下載影片。若未登入抓不到，會自動改用你電腦上瀏覽器裡已登入的 Facebook
#      （依序嘗試 Chrome → Safari → Edge → Firefox → Brave，只試有安裝的）。
#   3. 完成後在 Finder 打開資料夾，並把完整紀錄寫進 ~/Desktop/FB影片/下載紀錄.log。
#
# 可調整的環境變數（一般不用理會）：
#   FBDL_DIR       輸出資料夾（預設 ~/Desktop/FB影片）
#   FBDL_BROWSERS  要嘗試的瀏覽器清單，空白分隔（預設會自動偵測有安裝的）
#   FBDL_BIN_URL   yt-dlp 執行檔下載網址（預設為官方 macOS 版）

set -o pipefail

OUT_DIR="${FBDL_DIR:-$HOME/Desktop/FB影片}"
TOOL_DIR="$OUT_DIR/.tools"
BIN="$TOOL_DIR/yt-dlp"
LOG="$OUT_DIR/下載紀錄.log"
DONE_LIST="$TOOL_DIR/done.txt"
BIN_URL="${FBDL_BIN_URL:-https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos}"

say()  { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✔ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }
die()  { printf '\n\033[1;31m✘ %s\033[0m\n' "$*" >&2; exit 1; }

if [ $# -eq 0 ]; then
  cat >&2 <<'USAGE'
用法：bash fb_download.sh <FB影片網址> [更多網址...]

例如：
  bash fb_download.sh "https://www.facebook.com/share/v/xxxxxxxx/" "https://www.facebook.com/share/r/yyyyyyyy/"
USAGE
  exit 2
fi

mkdir -p "$TOOL_DIR" || die "無法建立資料夾：$OUT_DIR"
cd "$OUT_DIR"       || die "無法進入資料夾：$OUT_DIR"
: > "$DONE_LIST"
{
  echo "=================================================================="
  echo "執行時間：$(date '+%Y-%m-%d %H:%M:%S')"
  echo "網址："
  for u in "$@"; do echo "  $u"; done
} >> "$LOG"

# ------------------------------------------------------------------
# 1. 準備 yt-dlp（優先用獨立執行檔；不行再退回 python3 -m yt_dlp）
# ------------------------------------------------------------------
YT=()

if [ -x "$BIN" ] && "$BIN" --version >/dev/null 2>&1; then
  say "檢查 yt-dlp 是否有新版..."
  "$BIN" -U 2>&1 | tail -n 1 | tee -a "$LOG" || true
else
  say "下載 yt-dlp 獨立執行檔（約 37MB，只需要一次）..."
  if curl -fL --progress-bar --retry 3 -o "$BIN.tmp" "$BIN_URL"; then
    mv -f "$BIN.tmp" "$BIN"
    chmod +x "$BIN"
    # 用 curl 下載不會被標記為隔離檔案，但保險起見還是清一下
    xattr -d com.apple.quarantine "$BIN" >/dev/null 2>&1 || true
  else
    rm -f "$BIN.tmp"
    warn "無法從 GitHub 下載 yt-dlp。"
  fi
fi

if [ -x "$BIN" ] && "$BIN" --version >/dev/null 2>&1; then
  YT=("$BIN")
  ok "使用 yt-dlp $("$BIN" --version 2>/dev/null)"
elif python3 -m yt_dlp --version >/dev/null 2>&1; then
  YT=(python3 -m yt_dlp)
  warn "獨立執行檔無法使用，改用 Python 版 yt-dlp $(python3 -m yt_dlp --version 2>/dev/null)（可能較舊）"
else
  die "找不到可用的 yt-dlp。請確認網路正常後再跑一次；若還是不行，請把畫面截圖或 $LOG 的內容貼給 Claude。"
fi

# ------------------------------------------------------------------
# 2. 偵測有安裝的瀏覽器（用來借用已登入的 Facebook cookies）
# ------------------------------------------------------------------
detect_browsers() {
  local key app
  # 一行一個「名稱|路徑」，用 | 切，避免 app 名稱裡的空白被拆開
  printf '%s\n' \
    "chrome|/Applications/Google Chrome.app" \
    "safari|/Applications/Safari.app" \
    "safari|/System/Applications/Safari.app" \
    "safari|/System/Volumes/Preboot/Cryptexes/App/System/Applications/Safari.app" \
    "edge|/Applications/Microsoft Edge.app" \
    "firefox|/Applications/Firefox.app" \
    "brave|/Applications/Brave Browser.app" |
  while IFS='|' read -r key app; do
    if [ -d "$app" ] || [ -d "$HOME$app" ]; then
      echo "$key"
    fi
  done | awk '!seen[$0]++'
}

if [ -n "${FBDL_BROWSERS+x}" ]; then
  BROWSERS="$FBDL_BROWSERS"
else
  BROWSERS="$(detect_browsers | tr '\n' ' ')"
fi

# ------------------------------------------------------------------
# 3. 逐一下載
# ------------------------------------------------------------------
run_ytdlp() {  # $1 = 網址, $2 = 瀏覽器名稱（可為空）
  local url="$1" browser="$2"
  local extra=()
  [ -n "$browser" ] && extra=(--cookies-from-browser "$browser")
  "${YT[@]}" \
    --no-playlist \
    --newline --progress-delta 1 \
    --retries 3 --fragment-retries 3 \
    -o "%(title).40s [%(id)s].%(ext)s" \
    --print-to-file "after_move:filepath" "$DONE_LIST" \
    ${extra[@]+"${extra[@]}"} \
    "$url" </dev/null 2>&1 | tee -a "$LOG"
}

SUCCESS=()
FAILED=()
n=0
total=$#

for url in "$@"; do
  n=$((n + 1))
  say "[$n/$total] 下載：$url"
  if run_ytdlp "$url" ""; then
    SUCCESS+=("$url")
    continue
  fi

  done_this=0
  for b in $BROWSERS; do
    warn "未登入狀態抓不到，改用 $b 裡已登入的 Facebook 再試一次..."
    case "$b" in
      chrome|edge|brave)
        echo "   （若跳出「鑰匙圈」視窗，請按「永遠允許」並輸入 Mac 登入密碼）" ;;
      safari)
        echo "   （若出現權限錯誤，需到 系統設定 → 隱私權與安全性 → 完整磁碟取用權，把「終端機」打開）" ;;
    esac
    if run_ytdlp "$url" "$b"; then
      done_this=1
      break
    fi
  done

  if [ "$done_this" = 1 ]; then
    SUCCESS+=("$url")
  else
    FAILED+=("$url")
  fi
done

# ------------------------------------------------------------------
# 4. 總結
# ------------------------------------------------------------------
echo
echo "=================================================================="
if [ -s "$DONE_LIST" ]; then
  ok "已下載 ${#SUCCESS[@]} 支影片，檔案在：$OUT_DIR"
  while IFS= read -r f; do
    [ -n "$f" ] && printf '   • %s\n' "$(basename "$f")"
  done < "$DONE_LIST"
fi
if [ ${#FAILED[@]} -gt 0 ]; then
  warn "有 ${#FAILED[@]} 支沒下載成功："
  for u in "${FAILED[@]}"; do printf '   ✘ %s\n' "$u"; done
  echo
  echo "可能原因：影片是私人／限好友、已被刪除，或瀏覽器裡沒有登入 Facebook。"
  echo "完整錯誤紀錄在：$LOG"
  echo "把那個檔案的內容貼給 Claude，就能幫你看是哪一種。"
fi
echo "=================================================================="

if command -v open >/dev/null 2>&1 && [ -s "$DONE_LIST" ]; then
  open "$OUT_DIR"
fi

[ ${#FAILED[@]} -eq 0 ]
