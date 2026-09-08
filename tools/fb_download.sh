#!/bin/bash
# fb_download.sh — 一鍵下載 Facebook 影片 / Reels（macOS 專用，不需要事先安裝任何東西）
#
# 用法（網址請用英文雙引號包起來。Facebook 複製出來的網址常帶 ?mibextid=...，沒加引號 zsh 會直接報錯）：
#   bash tools/fb_download.sh "https://www.facebook.com/share/v/xxxxxxxx/" "https://www.facebook.com/share/r/yyyyyyyy/"
#
# 或不用下載檔案，直接把這一行貼進「終端機」：
#   curl -fsSL https://raw.githubusercontent.com/goxsyang/slate/main/tools/fb_download.sh | bash -s -- "網址1" "網址2"
#
# 它會做的事：
#   1. 下載 yt-dlp 官方的 macOS 通用執行檔（Intel / Apple Silicon 皆可，不需要 Python 或 Homebrew）
#      到 ~/Desktop/FB影片/.tools/ ，並用官方 SHA-256 校驗檔確認沒下載壞；之後每 3 天檢查一次更新。
#   2. 逐一下載影片。若未登入抓不到，會自動改用你電腦上瀏覽器裡已登入的 Facebook
#      （依序 Chrome → Safari → Edge → Firefox → Brave，只試有安裝、而且讀得到的）。
#      cookies 只在記憶體裡用一下，不會寫到磁碟，也不會寫進紀錄檔。
#   3. 完成後在 Finder 打開資料夾，並把完整過程寫進 ~/Desktop/FB影片/下載紀錄.log。
#
# 可調整的環境變數（一般不用理會）：
#   FBDL_DIR       輸出資料夾（預設 ~/Desktop/FB影片）
#   FBDL_BROWSERS  要嘗試的瀏覽器清單，空白分隔（預設自動偵測有安裝的）
#   FBDL_BIN_URL   yt-dlp 執行檔下載網址（預設為官方 macOS 版）

set -o pipefail

OUT_DIR="${FBDL_DIR:-$HOME/Desktop/FB影片}"
BIN_URL="${FBDL_BIN_URL:-https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos}"
LOG=""

# ------------------------------------------------------------------
# 畫面輸出的小工具（同時寫進紀錄檔）
# ------------------------------------------------------------------
to_log() { [ -n "$LOG" ] && printf '%s\n' "$@" >> "$LOG" 2>/dev/null; return 0; }
say()    { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; to_log "" "▶ $*"; }
ok()     { printf '\033[1;32m✔ %s\033[0m\n' "$*";   to_log "✔ $*"; }
warn()   { printf '\033[1;33m! %s\033[0m\n' "$*";   to_log "! $*"; }
note()   { printf '   %s\n' "$*";                    to_log "   $*"; }
die()    { printf '\n\033[1;31m✘ %s\033[0m\n' "$*" >&2; to_log "✘ $*"; exit 1; }

usage() {
  cat >&2 <<'USAGE'
用法：bash fb_download.sh "<FB影片網址>" ["更多網址"...]

網址請用英文雙引號包起來，例如：
  bash fb_download.sh "https://www.facebook.com/share/v/xxxxxxxx/?mibextid=wwXIfr" "https://www.facebook.com/share/r/yyyyyyyy/"
USAGE
}

if [ $# -eq 0 ]; then
  usage
  exit 2
fi

# ------------------------------------------------------------------
# 0. 準備資料夾（第一次寫桌面時 macOS 會問要不要讓「終端機」存取桌面）
# ------------------------------------------------------------------
echo "（若 macOS 跳出「終端機想要取用您桌面檔案夾中的檔案」，請按「好」）"
if ! mkdir -p "$OUT_DIR/.tools" 2>/dev/null; then
  ALT_DIR="$HOME/FB影片"
  printf '\033[1;33m! 無法建立 %s（macOS 可能沒有讓「終端機」存取桌面）。\033[0m\n' "$OUT_DIR"
  echo "   要修正：系統設定 → 隱私權與安全性 → 檔案與檔案夾 → 終端機 → 打開「桌面檔案夾」，然後重跑。"
  echo "   這次先改存到：$ALT_DIR"
  OUT_DIR="$ALT_DIR"
  mkdir -p "$OUT_DIR/.tools" || die "連 $OUT_DIR 也無法建立，請把這個畫面截圖給 Claude。"
fi

TOOL_DIR="$OUT_DIR/.tools"
BIN="$TOOL_DIR/yt-dlp"
LOG="$OUT_DIR/下載紀錄.log"
DONE_LIST="$TOOL_DIR/done.txt"
TMP_OUT="$TOOL_DIR/last_attempt.txt"
STAMP="$TOOL_DIR/.last_update_check"

cd "$OUT_DIR" || die "無法進入資料夾：$OUT_DIR"
: > "$DONE_LIST"
{
  echo
  echo "=================================================================="
  echo "執行時間：$(date '+%Y-%m-%d %H:%M:%S')"
  echo "網址："
  for u in "$@"; do echo "  $u"; done
} >> "$LOG"

# ------------------------------------------------------------------
# 1. 準備 yt-dlp（優先用獨立執行檔；不行再退回 python3 -m yt_dlp）
# ------------------------------------------------------------------
fetch_bin() {
  local name sums expected actual
  name="${BIN_URL##*/}"
  sums="$TOOL_DIR/SHA2-256SUMS"
  say "下載 yt-dlp 獨立執行檔（約 37MB，只需要一次）..."
  trap 'rm -f "$BIN.tmp" "$sums"' EXIT
  trap 'rm -f "$BIN.tmp" "$sums"; exit 130' INT TERM
  if ! curl -fL --progress-bar --retry 3 --connect-timeout 20 --max-time 900 -o "$BIN.tmp" "$BIN_URL"; then
    rm -f "$BIN.tmp"
    warn "無法從 GitHub 下載 yt-dlp（網路有問題？）。"
    trap - EXIT INT TERM
    return 1
  fi
  # 用官方校驗檔確認沒下載壞
  if curl -fsSL --retry 3 --connect-timeout 20 --max-time 60 -o "$sums" "${BIN_URL%/*}/SHA2-256SUMS"; then
    expected=$(awk -v n="$name" '$2 == n { print $1; exit }' "$sums")
    actual=$(shasum -a 256 "$BIN.tmp" | awk '{ print $1 }')
    if [ -n "$expected" ] && [ "$expected" != "$actual" ]; then
      rm -f "$BIN.tmp" "$sums"
      warn "yt-dlp 檔案校驗失敗（可能下載到一半中斷），請再跑一次。"
      trap - EXIT INT TERM
      return 1
    fi
    [ -z "$expected" ] && warn "校驗檔裡找不到 $name，略過完整性檢查。"
  else
    warn "無法下載校驗檔，略過完整性檢查。"
  fi
  rm -f "$sums"
  mv -f "$BIN.tmp" "$BIN" && chmod +x "$BIN"
  xattr -d com.apple.quarantine "$BIN" >/dev/null 2>&1 || true
  touch "$STAMP"
  trap - EXIT INT TERM
}

if [ -x "$BIN" ] && "$BIN" --version >/dev/null 2>&1; then
  if [ ! -f "$STAMP" ] || [ -n "$(find "$STAMP" -mtime +3 2>/dev/null)" ]; then
    say "檢查 yt-dlp 是否有新版..."
    if "$BIN" -U >> "$LOG" 2>&1; then
      ok "yt-dlp 已是最新版"
      touch "$STAMP"
    else
      warn "暫時無法檢查更新，先用現有版本繼續"
    fi
  fi
else
  fetch_bin || true
fi

YT=()
if [ -x "$BIN" ] && "$BIN" --version >/dev/null 2>&1; then
  YT=("$BIN")
  ok "使用 yt-dlp $("$BIN" --version 2>/dev/null)"
elif python3 -m yt_dlp --version >/dev/null 2>&1; then
  YT=(python3 -m yt_dlp)
  warn "獨立執行檔無法使用，改用 Python 版 yt-dlp $(python3 -m yt_dlp --version 2>/dev/null)（可能較舊）"
else
  die "找不到可用的 yt-dlp。請確認網路正常後再跑一次；若還是不行，請把 $LOG 的內容貼給 Claude。"
fi

# 沒有 ffmpeg 就只抓「影像＋聲音在同一個檔」的格式，避免下載到沒聲音的影片
FMT=()
if command -v ffmpeg >/dev/null 2>&1; then
  ok "找到 ffmpeg，會下載最高畫質並自動合併"
else
  FMT=(-f b)
fi

# ------------------------------------------------------------------
# 2. 偵測有安裝的瀏覽器（用來借用已登入的 Facebook）
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

safari_cookies_readable() {
  [ -r "$HOME/Library/Containers/com.apple.Safari/Data/Library/Cookies/Cookies.binarycookies" ] ||
  [ -r "$HOME/Library/Cookies/Cookies.binarycookies" ]
}

if [ -n "${FBDL_BROWSERS+x}" ]; then
  BROWSERS="$FBDL_BROWSERS"
else
  BROWSERS="$(detect_browsers | tr '\n' ' ')"
fi

# ------------------------------------------------------------------
# 3. 逐一下載
# ------------------------------------------------------------------
run_ytdlp() {  # $1 = 網址, $2 = 瀏覽器名稱（可為空）, $3 = 指定格式（可為空）
  local url="$1" browser="$2" fmt="$3" rc
  local extra=()
  [ -n "$browser" ] && extra=(--cookies-from-browser "$browser")
  if [ -n "$fmt" ]; then
    extra=(${extra[@]+"${extra[@]}"} -f "$fmt")
  else
    extra=(${extra[@]+"${extra[@]}"} ${FMT[@]+"${FMT[@]}"})
  fi
  to_log "" "--- 嘗試：${browser:-未登入}${fmt:+（格式 $fmt）} ---"
  : > "$TMP_OUT"
  "${YT[@]}" \
    --newline --progress-delta 5 \
    --retries 3 --fragment-retries 3 \
    -o "%(title).40s [%(id)s].%(ext)s" \
    --print-to-file "after_move:filepath" "$DONE_LIST" \
    ${extra[@]+"${extra[@]}"} \
    -- "$url" </dev/null 2>&1 | tee "$TMP_OUT"
  rc=$?
  cat "$TMP_OUT" >> "$LOG" 2>/dev/null
  return $rc
}

# 看最近一次嘗試的輸出，判斷失敗的種類
classify() {
  if   grep -q 'is not a valid URL' "$TMP_OUT";                    then echo invalid
  elif grep -q 'Requested format is not available' "$TMP_OUT";    then echo format
  elif grep -q 'HTTP Error 404' "$TMP_OUT";                        then echo gone
  elif grep -qiE 'Connection (refused|reset)|timed out|Temporary failure|nodename nor servname|Network is unreachable|Unable to connect to proxy|CERTIFICATE_VERIFY|HTTP Error 5[0-9][0-9]|bytes read|Giving up after' "$TMP_OUT"; then echo network
  elif grep -q 'could not find .* cookies database' "$TMP_OUT";   then echo nocookies
  elif grep -q 'cannot decrypt v10 cookies' "$TMP_OUT";           then echo denied
  else echo login
  fi
}

last_error() { local e; e=$(grep '^ERROR' "$TMP_OUT" | tail -n 1); printf '%s' "${e:0:160}"; }

# 數 done.txt 裡「真的存在」的檔案有幾個
count_done() {
  [ -f "$DONE_LIST" ] || { echo 0; return; }
  awk '!seen[$0]++' "$DONE_LIST" | {
    c=0
    while IFS= read -r f; do
      [ -n "$f" ] && [ -f "$f" ] && c=$((c + 1))
    done
    echo "$c"
  }
}

SUCCESS=()
PARTIAL=()
FAILED=()
REASONS=()
n=0
total=$#

for raw in "$@"; do
  n=$((n + 1))
  url="$raw"
  # 去掉 Facebook App 附加的追蹤參數
  case "$url" in *'?mibextid='*) url="${url%%\?mibextid=*}" ;; esac

  say "[$n/$total] 下載：$url"
  case "$url" in
    http://*|https://*) ;;
    *) warn "這不是網址，略過"; FAILED+=("$raw"); REASONS+=("不是網址（請確認有把整個網址貼上，並用英文雙引號包起來）"); continue ;;
  esac

  before=$(count_done)
  done_this=0
  reason=""
  used_browser=""

  if run_ytdlp "$url" ""; then
    done_this=1
  else
    cls=$(classify)
    first_err=$(last_error)
    case "$cls" in
      invalid) reason="不是有效的網址" ;;
      network) reason="網路問題（連不上 Facebook 或下載中斷）：$first_err" ;;
      format)  reason="format" ;;
      *)
        # 其他情況（含 404：Facebook 對未登入的人有時也回 404）都值得用登入狀態再試
        for b in $BROWSERS; do
          case "$b" in
            safari)
              if ! safari_cookies_readable; then
                warn "「終端機」沒有「完整磁碟取用權」，讀不到 Safari 的登入，先略過 Safari。"
                note "要用 Safari 的登入：系統設定 → 隱私權與安全性 → 完整磁碟取用權 → 打開「終端機」，"
                note "然後「完全結束終端機」（Cmd+Q）再重新開啟、重新貼一次指令。"
                continue
              fi
              ;;
            chrome|edge|brave)
              note "（若跳出「鑰匙圈」視窗，請輸入 Mac 登入密碼後按「允許」；每支影片會問一次，建議不要按「永遠允許」）"
              ;;
          esac
          warn "未登入狀態抓不到，改用 $b 裡已登入的 Facebook 再試一次..."
          if run_ytdlp "$url" "$b"; then
            done_this=1
            used_browser="$b"
            break
          fi
          cls=$(classify)
          case "$cls" in
            nocookies) note "$b 裡沒有可用的登入資料，換下一個。" ;;
            denied)    warn "你在鑰匙圈視窗按了「拒絕」，所以沒辦法用 $b 的登入。要用它的話請重跑並按「允許」。" ;;
            format)    reason="format"; used_browser="$b"; break ;;
            network)   reason="網路問題（連不上 Facebook 或下載中斷）：$(last_error)"; break ;;
            gone)      reason="影片不存在或已被刪除（HTTP 404）"; break ;;
          esac
        done
        ;;
    esac
  fi

  # 只有分離的影像／聲音串流、又沒有 ffmpeg：改成分開下載，至少把內容拿到
  if [ "$reason" = "format" ]; then
    warn "這支影片只有「影像」「聲音」分開的串流，這台電腦沒有 ffmpeg 可以合併。先把兩個檔案都抓下來。"
    lines_before=$(wc -l < "$DONE_LIST" | tr -d ' ')
    reason=""
    phantom=""
    if run_ytdlp "$url" "$used_browser" "bv*+ba"; then
      phantom=$(tail -n +$((lines_before + 1)) "$DONE_LIST" | tail -n 1)
    else
      case "$(classify)" in
        gone)    reason="影片不存在或已被刪除（HTTP 404）" ;;
        network) reason="網路問題（連不上 Facebook 或下載中斷）：$(last_error)" ;;
      esac
    fi
    parts=""
    if [ -n "$phantom" ] && [ ! -f "$phantom" ]; then
      for f in "${phantom%.*}".f*; do
        [ -f "$f" ] && parts="$parts$(basename "$f")、"
      done
    fi
    if [ -n "$parts" ]; then
      PARTIAL+=("${parts%、}")
      done_this=1
    elif [ -z "$reason" ]; then
      reason="這支影片只有分離的影像／聲音串流，下載失敗：$(last_error)"
    fi
  fi

  after=$(count_done)
  if [ "$after" -gt "$before" ] || [ "$done_this" = 1 ]; then
    SUCCESS+=("$url")
    if [ "$after" -gt "$before" ] && [ "$done_this" != 1 ]; then
      warn "部分項目失敗，但已有檔案下載完成"
    fi
  else
    FAILED+=("$url")
    if [ -z "$reason" ]; then
      reason="需要登入才看得到，但沒有一個瀏覽器的登入可用（可能是私人／限好友影片）：$first_err"
    fi
    REASONS+=("$reason")
  fi
done

# ------------------------------------------------------------------
# 4. 總結
# ------------------------------------------------------------------
rule() { echo "=================================================================="; to_log "=================================================================="; }
summary() {
  echo
  rule
  files=$(count_done)
  if [ "$files" -gt 0 ] || [ ${#PARTIAL[@]} -gt 0 ]; then
    ok "檔案位置：$OUT_DIR"
  fi
  if [ "$files" -gt 0 ]; then
    ok "已下載 $files 個檔案："
    awk '!seen[$0]++' "$DONE_LIST" | while IFS= read -r f; do
      [ -n "$f" ] && [ -f "$f" ] && note "• $(basename "$f")"
    done
  fi
  if [ ${#PARTIAL[@]} -gt 0 ]; then
    warn "有 ${#PARTIAL[@]} 支影片的影像和聲音是分開的兩個檔案（這台電腦沒有 ffmpeg 可以合併）："
    for p in "${PARTIAL[@]}"; do note "• $p"; done
    note "把這兩個檔案交給 Claude 或用 ffmpeg 就能合併成一支。"
  fi
  if [ ${#FAILED[@]} -gt 0 ]; then
    warn "有 ${#FAILED[@]} 支沒下載成功："
    i=0
    for u in "${FAILED[@]}"; do
      note "✘ $u"
      note "  原因：${REASONS[$i]}"
      i=$((i + 1))
    done
    echo
    note "完整過程記錄在：$LOG"
    note "把那個檔案的內容貼給 Claude，就能幫你看是哪一種問題。"
  fi
  parts_left=0
  for f in ./*.part; do [ -f "$f" ] && parts_left=$((parts_left + 1)); done
  if [ "$parts_left" -gt 0 ]; then
    note "另外有 $parts_left 個下載到一半的 .part 檔；再跑一次同樣的指令會從中斷處接著下載。"
  fi
  rule
}
summary

if command -v open >/dev/null 2>&1 && { [ "$(count_done)" -gt 0 ] || [ ${#PARTIAL[@]} -gt 0 ]; }; then
  open "$OUT_DIR"
fi

[ ${#FAILED[@]} -eq 0 ]
