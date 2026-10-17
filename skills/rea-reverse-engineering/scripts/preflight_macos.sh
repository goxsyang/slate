#!/bin/bash
# preflight_macos.sh — REA（rea-agents）安裝前檢查：macOS · Claude Code · Ghidra
#
# 這支腳本「只檢查、只回報」：
#   - 不安裝、不下載、不修改任何設定或使用者檔案
#   - npm 查詢時寫的除錯日誌與快取，導到一個暫存資料夾，結束時刪除
#     （不碰 ~/.npm；也不使用 npm_config_logs_max=0，那會刪掉使用者既有的 npm 日誌）
#   - 不執行 REA（不呼叫 rea、rea-agents 或 npx rea-agents）
#   - 不執行 `claude mcp list`（那會啟動已註冊的 MCP 伺服器）
#   - 不執行 macOS 的 /usr/bin/java 替身程式（沒有 JDK 時它可能跳出安裝提示）
# 相容 macOS 內建的 bash 3.2：不使用關聯陣列、mapfile，也不使用 set -e，
# 任何一項檢查失敗都會繼續做完其餘檢查。
#
# 用法：
#   bash preflight_macos.sh             執行全部檢查
#   bash preflight_macos.sh --selftest  只測試 Node 版本範圍判斷邏輯
#   bash preflight_macos.sh --help      顯示說明
#
# 結束碼：0 = 沒有 FAIL；1 = 至少一項 FAIL；2 = 自我測試失敗
#
# 檢查基準（2026-10-15 依 REA 官方 repo 與 npm 6.5.0 套件查證）：
#   - Node.js engines："^22.19.0 || ^24.11.0 || >=26.0.0"（package.json）
#   - Ghidra 12.1.x（REA 驗證版本 12.1.4）
#   - 64 位元「完整」JDK 21 以上（需含 javac），架構必須與主機相同（Apple Silicon 不可用 Rosetta 的 x86_64 JDK）
#   - macOS 需要 Xcode Command Line Tools 的 xcrun swiftc；自行建置 Ghidra 原生反編譯器另需 make、bison

REA_PINNED_VERSION="6.5.0"
DEFAULT_ENGINES_RANGE="^22.19.0 || ^24.11.0 || >=26.0.0"
GHIDRA_VERIFIED="12.1.4"
JDK_MIN_DEFAULT=21

# 避免 npm 在檢查時連網查詢新版本
npm_config_update_notifier=false
export npm_config_update_notifier

PASS_N=0
WARN_N=0
FAIL_N=0
NEXT_STEPS=""

pass() { PASS_N=$((PASS_N + 1)); printf '  [PASS] %s\n' "$*"; }
warn() { WARN_N=$((WARN_N + 1)); printf '  [WARN] %s\n' "$*"; }
fail() { FAIL_N=$((FAIL_N + 1)); printf '  [FAIL] %s\n' "$*"; }
info() { printf '  [INFO] %s\n' "$*"; }
hint() { printf '         → %s\n' "$*"; }
section() { printf '\n== %s ==\n' "$*"; }
add_next() {
  NEXT_STEPS="${NEXT_STEPS}  - $*
"
}

# ---------------------------------------------------------------------------
# 版本範圍判斷（npm semver 的常用子集：^ ~ >= > <= < = 與 ||）
# ---------------------------------------------------------------------------

# 把 "v24.11.0"、"=24.11"、"24"、"1.x" 轉成 "主 次 修 給定段數"，
# 例如 "24 11 0 3"、"24 11 0 2"、"24 0 0 1"、"1 0 0 1"。
# 段數小於 3 代表部分版本（npm 的 X-range），由 comparator_ok 換算上下限。
# 無法解析時回傳 1。
parse_ver() {
  local v maj min pat rest n
  v="$1"
  v="${v#v}"
  v="${v#=}"
  case "$v" in
    '' | *-* | *+*) return 1 ;;
  esac
  maj="${v%%.*}"
  rest="${v#*.}"
  [ "$rest" = "$v" ] && rest=""
  min="${rest%%.*}"
  pat="${rest#*.}"
  [ "$pat" = "$rest" ] && pat=""
  case "$min" in x | X | '*') min="" ;; esac
  case "$pat" in x | X | '*') pat="" ;; esac
  # x 之後不能再出現具體數字（例如 1.x.3）
  if [ -z "$min" ] && [ -n "$pat" ]; then return 1; fi
  n=3
  [ -z "$pat" ] && n=2
  [ -z "$min" ] && n=1
  [ -z "$min" ] && min=0
  [ -z "$pat" ] && pat=0
  case "$maj" in '' | *[!0-9]*) return 1 ;; esac
  case "$min" in *[!0-9]*) return 1 ;; esac
  case "$pat" in *[!0-9]*) return 1 ;; esac
  printf '%s %s %s %s\n' "$((10#$maj))" "$((10#$min))" "$((10#$pat))" "$n"
}

# 比較兩個 "M m p"，輸出 -1 / 0 / 1
ver_cmp() {
  local a1 a2 a3 b1 b2 b3
  # shellcheck disable=SC2086
  set -- $1 $2
  a1=$1; a2=$2; a3=$3; b1=$4; b2=$5; b3=$6
  if [ "$a1" -ne "$b1" ]; then
    [ "$a1" -lt "$b1" ] && echo -1 || echo 1
    return
  fi
  if [ "$a2" -ne "$b2" ]; then
    [ "$a2" -lt "$b2" ] && echo -1 || echo 1
    return
  fi
  if [ "$a3" -ne "$b3" ]; then
    [ "$a3" -lt "$b3" ] && echo -1 || echo 1
    return
  fi
  echo 0
}

# comparator_ok "M m p" ">=26.0.0"：0 = 符合，1 = 不符合，2 = 無法解析
# 部分版本依 npm 的 X-range 規則處理：例如 "24" = ">=24.0.0 <25.0.0"、
# "<=24" = "<25.0.0"、">24" = ">=25.0.0"、"~1" = ">=1.0.0 <2.0.0"、
# "^0" = ">=0.0.0 <1.0.0"、"^0.0" = ">=0.0.0 <0.1.0"。
comparator_ok() {
  local ver comp op base t lo xhi hi c1 c2 b1 b2 b3 n
  ver="$1"
  comp="$2"
  case "$comp" in
    '*' | x | X) return 0 ;;
  esac
  case "$comp" in
    '>='*) op='>='; base="${comp#>=}" ;;
    '<='*) op='<='; base="${comp#<=}" ;;
    '>'*) op='>'; base="${comp#>}" ;;
    '<'*) op='<'; base="${comp#<}" ;;
    '^'*) op='^'; base="${comp#^}" ;;
    '~'*) op='~'; base="${comp#\~}" ;;
    '='*) op='='; base="${comp#=}" ;;
    *) op='='; base="$comp" ;;
  esac
  t=$(parse_ver "$base") || return 2
  # shellcheck disable=SC2086
  set -- $t
  b1=$1
  b2=$2
  b3=$3
  n=$4
  lo="$b1 $b2 $b3"
  # 部分版本的上限（不含）：把最後一個給定的段數加 1
  case "$n" in
    1) xhi="$((b1 + 1)) 0 0" ;;
    2) xhi="$b1 $((b2 + 1)) 0" ;;
    *) xhi="" ;;
  esac
  c1=$(ver_cmp "$ver" "$lo")
  case "$op" in
    '>=') [ "$c1" -ge 0 ] ;;
    '<') [ "$c1" -lt 0 ] ;;
    '<=')
      if [ -n "$xhi" ]; then
        c2=$(ver_cmp "$ver" "$xhi")
        [ "$c2" -lt 0 ]
      else
        [ "$c1" -le 0 ]
      fi
      ;;
    '>')
      if [ -n "$xhi" ]; then
        c2=$(ver_cmp "$ver" "$xhi")
        [ "$c2" -ge 0 ]
      else
        [ "$c1" -gt 0 ]
      fi
      ;;
    '=')
      if [ -n "$xhi" ]; then
        c2=$(ver_cmp "$ver" "$xhi")
        [ "$c1" -ge 0 ] && [ "$c2" -lt 0 ]
      else
        [ "$c1" -eq 0 ]
      fi
      ;;
    '^')
      if [ "$b1" -gt 0 ] || [ "$n" -eq 1 ]; then
        hi="$((b1 + 1)) 0 0"
      elif [ "$b2" -gt 0 ] || [ "$n" -eq 2 ]; then
        hi="0 $((b2 + 1)) 0"
      else
        hi="0 0 $((b3 + 1))"
      fi
      c2=$(ver_cmp "$ver" "$hi")
      [ "$c1" -ge 0 ] && [ "$c2" -lt 0 ]
      ;;
    '~')
      if [ "$n" -eq 1 ]; then
        hi="$((b1 + 1)) 0 0"
      else
        hi="$b1 $((b2 + 1)) 0"
      fi
      c2=$(ver_cmp "$ver" "$hi")
      [ "$c1" -ge 0 ] && [ "$c2" -lt 0 ]
      ;;
    *) return 2 ;;
  esac
}

# range_ok "v24.18.0" "^22.19.0 || ^24.11.0 || >=26.0.0"
#   0 = 符合，1 = 不符合，2 = 無法自動判讀
# 預先發行版（例如 v26.0.0-rc.1）一律視為不符合：npm 的範圍規則不會讓
# 預先發行版符合沒有標註預先發行的範圍，REA 文件也明說不支援預先發行版。
range_ok() {
  local raw range ver alts alt comp all any r unknown result
  raw="${1#v}"
  range="$2"
  case "$raw" in *-*) return 1 ;; esac
  # 連字號範圍（例如 "1.2.3 - 2.3.4"）不在這個子集內，交給人工判讀
  case "$range" in *' - '*) return 2 ;; esac
  ver=$(parse_ver "$raw") || return 2
  # 只取 "主 次 修"，去掉最後的段數欄位
  ver="${ver% *}"
  # 運算子後面的空白去掉（">= 26" → ">=26"），再把 || 換成換行
  alts=$(printf '%s\n' "$range" | sed 's/\([<>=^~]\)[[:space:]]*/\1/g' | awk '{ gsub(/[|][|]/, "\n"); print }')
  unknown=0
  result=1
  set -f
  while IFS= read -r alt; do
    all=1
    any=0
    for comp in $alt; do
      any=1
      comparator_ok "$ver" "$comp"
      r=$?
      if [ "$r" -eq 2 ]; then
        unknown=1
        all=0
        break
      fi
      if [ "$r" -ne 0 ]; then
        all=0
        break
      fi
    done
    if [ "$any" -eq 1 ] && [ "$all" -eq 1 ]; then
      result=0
      break
    fi
  done <<EOF
$alts
EOF
  set +f
  if [ "$result" -eq 0 ]; then return 0; fi
  if [ "$unknown" -eq 1 ]; then return 2; fi
  return 1
}

run_selftest() {
  local bad=0 line v exp got range
  range="$DEFAULT_ENGINES_RANGE"
  printf '自我測試：Node 版本是否符合 "%s"\n' "$range"
  for line in \
    "v22.19.0:0" "v22.18.9:1" "v22.20.1:0" "v22.99.0:0" "v23.0.0:1" "v23.11.0:1" \
    "v24.10.9:1" "v24.11.0:0" "v24.18.0:0" "v25.0.0:1" "v25.9.0:1" \
    "v26.0.0:0" "v26.1.2:0" "v27.0.0:0" "v20.18.0:1" "v18.20.4:1" \
    "v24.11.0-rc.1:1" "v26.0.0-nightly20260101:1" "garbage:2"; do
    v="${line%:*}"
    exp="${line##*:}"
    range_ok "$v" "$range"
    got=$?
    if [ "$got" -eq "$exp" ]; then
      printf '  ok    %-28s → %s\n' "$v" "$got"
    else
      printf '  WRONG %-28s → %s（預期 %s）\n' "$v" "$got" "$exp"
      bad=1
    fi
  done
  printf '其他範圍形式：\n'
  for line in \
    "1.2.3|^1.2.0|0" "2.0.0|^1.2.0|1" "0.2.5|^0.2.3|0" "0.3.0|^0.2.3|1" \
    "1.2.9|~1.2.3|0" "1.3.0|~1.2.3|1" "5.0.0|>=4 <6|0" "6.0.0|>=4 <6|1" \
    "26.0.0|>= 26.0.0|0" "1.0.0|1.x|0" "2.0.0|1.x|1" \
    "24.11.0|24|0" "25.0.0|24|1" "24.11.0|=24|0" "24.11.0|24 || 26|0" \
    "25.1.0|24 || 26|1" "1.5.0|~1|0" "2.0.0|~1|1" "0.5.0|^0|0" "1.0.0|^0|1" \
    "0.0.5|^0.0|0" "0.1.0|^0.0|1" "0.2.9|^0.2|0" "0.3.0|^0.2|1" \
    "24.99.0|<=24|0" "25.0.0|<=24|1" "24.5.0|>24|1" "25.0.0|>24|0" \
    "1.2.9|1.2|0" "1.3.0|1.2|1" "1.0.0|*|0" "1.5.0|1.2.3 - 2.3.4|2" "1.0.0|1.x.3|2"; do
    v="${line%%|*}"
    range="${line#*|}"
    exp="${range##*|}"
    range="${range%|*}"
    range_ok "$v" "$range"
    got=$?
    if [ "$got" -eq "$exp" ]; then
      printf '  ok    %-8s 對 %-12s → %s\n' "$v" "$range" "$got"
    else
      printf '  WRONG %-8s 對 %-12s → %s（預期 %s）\n' "$v" "$range" "$got" "$exp"
      bad=1
    fi
  done
  if [ "$bad" -eq 0 ]; then
    echo "自我測試全部通過。"
    return 0
  fi
  echo "自我測試有錯誤。"
  return 2
}

# ---------------------------------------------------------------------------
# 小工具
# ---------------------------------------------------------------------------

# 解析符號連結（不依賴 readlink -f，舊版 macOS 沒有）
resolve_path() {
  local p t n d
  p="$1"
  n=0
  while [ -L "$p" ] && [ "$n" -lt 40 ]; do
    t=$(readlink "$p")
    case "$t" in
      /*) p="$t" ;;
      *) p="$(dirname "$p")/$t" ;;
    esac
    n=$((n + 1))
  done
  d=$(cd "$(dirname "$p")" 2>/dev/null && pwd -P)
  if [ -n "$d" ]; then
    printf '%s/%s\n' "$d" "$(basename "$p")"
  else
    printf '%s\n' "$p"
  fi
}

# 讀 key=value 形式的設定檔（例如 Ghidra 的 application.properties）
read_prop() {
  sed -n "s/^$2=//p" "$1" 2>/dev/null | head -n 1 | tr -d '\r'
}

# 讀 JDK release 檔的 KEY="value"
read_release() {
  sed -n "s/^$2=\"\{0,1\}\([^\"]*\)\"\{0,1\}.*/\1/p" "$1" 2>/dev/null | head -n 1
}

normalize_arch() {
  case "$1" in
    arm64 | aarch64) echo arm64 ;;
    x86_64 | amd64 | x64) echo x86_64 ;;
    *) echo "$1" ;;
  esac
}

has_jdk_bundle() {
  local b
  for b in /Library/Java/JavaVirtualMachines/*.jdk "$HOME"/Library/Java/JavaVirtualMachines/*.jdk; do
    [ -d "$b" ] && return 0
  done
  return 1
}

# 從 package.json 取出 engines.node
read_engines_node() {
  awk '
    /"engines"[[:space:]]*:/ { inb = 1 }
    inb && /"node"[[:space:]]*:/ {
      sub(/.*"node"[[:space:]]*:[[:space:]]*"/, "")
      sub(/".*/, "")
      print
      exit
    }
  ' "$1" 2>/dev/null
}

# ---------------------------------------------------------------------------
# 參數
# ---------------------------------------------------------------------------

case "${1:-}" in
  --selftest)
    run_selftest
    exit $?
    ;;
  -h | --help)
    awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "$0"
    exit 0
    ;;
esac

# npm 每次執行都會寫除錯日誌（預設在 ~/.npm/_logs）。把日誌與快取導到暫存資料夾，
# 結束時刪除，讓這支腳本不在使用者的家目錄留下任何檔案。
# 不用 npm_config_logs_max=0：實測它會讓 npm 刪掉使用者既有的日誌。
NPM_TMP=""
if command -v npm >/dev/null 2>&1; then
  NPM_TMP=$(mktemp -d 2>/dev/null) || NPM_TMP=""
  if [ -n "$NPM_TMP" ] && [ -d "$NPM_TMP" ]; then
    npm_config_logs_dir="$NPM_TMP/logs"
    npm_config_cache="$NPM_TMP/cache"
    export npm_config_logs_dir npm_config_cache
    trap 'rm -rf "$NPM_TMP"' EXIT
    trap 'exit 130' INT TERM
  else
    NPM_TMP=""
  fi
fi

printf 'REA 安裝前檢查（唯讀：不安裝、不修改、不執行 REA）\n'
printf '檢查時間：%s\n' "$(date '+%Y-%m-%d %H:%M:%S %Z' 2>/dev/null)"
printf '版本基準：REA %s、Ghidra %s、JDK %s+（2026-10-15 查證）\n' "$REA_PINNED_VERSION" "$GHIDRA_VERIFIED" "$JDK_MIN_DEFAULT"

# ---------------------------------------------------------------------------
# 1. 作業系統與 CPU
# ---------------------------------------------------------------------------
section "1. 作業系統與 CPU 架構"

OS_NAME=$(uname -s 2>/dev/null)
IS_MAC=0
[ "$OS_NAME" = "Darwin" ] && IS_MAC=1
HW_ARCH=""

if [ "$IS_MAC" -eq 1 ]; then
  MAC_VER=$(sw_vers -productVersion 2>/dev/null)
  if [ "$(sysctl -n hw.optional.arm64 2>/dev/null)" = "1" ]; then
    HW_ARCH=arm64
    HW_DESC="Apple Silicon（arm64）"
  else
    HW_ARCH=x86_64
    HW_DESC="Intel（x86_64）"
  fi
  pass "macOS ${MAC_VER:-（版本不明）}，硬體：$HW_DESC"
  info "REA 文件記錄的 Apple Silicon 端到端驗證環境：macOS 15.6 arm64 + Ghidra 12.1.4（REA 文件沒有列出最低 macOS 版本）"
  if [ "$(sysctl -n sysctl.proc_translated 2>/dev/null)" = "1" ]; then
    warn "目前這個終端機是在 Rosetta 轉譯下執行（x86_64 模擬）"
    hint "請用原生 arm64 的終端機執行 Node、JDK 與 REA；REA 會拒絕在 Apple Silicon 上以 Rosetta 執行的 x86_64 JDK"
    add_next "關閉終端機的「使用 Rosetta 開啟」，用原生 arm64 模式重新執行本檢查"
  fi
else
  HW_ARCH=$(normalize_arch "$(uname -m 2>/dev/null)")
  warn "這支腳本是為 macOS 設計；目前系統是 ${OS_NAME:-未知}（$(uname -m 2>/dev/null)）。macOS 專屬檢查會略過，其餘結果僅供參考。"
fi

case "$IS_MAC:$HW_ARCH" in
  1:arm64) DEC_DIR="mac_arm_64" ;;
  1:x86_64) DEC_DIR="mac_x86_64" ;;
  0:arm64) DEC_DIR="linux_arm_64" ;;
  *) DEC_DIR="linux_x86_64" ;;
esac

# ---------------------------------------------------------------------------
# 2. Xcode Command Line Tools
# ---------------------------------------------------------------------------
section "2. Xcode Command Line Tools（xcrun swiftc、make、bison）"

if [ "$IS_MAC" -eq 1 ]; then
  DEV_DIR=$(xcode-select -p 2>/dev/null)
  if [ -n "$DEV_DIR" ] && [ -d "$DEV_DIR" ]; then
    pass "開發者工具目錄：$DEV_DIR"
    SWIFTC=$(xcrun --find swiftc 2>/dev/null)
    if [ -n "$SWIFTC" ]; then
      pass "swiftc：$SWIFTC（REA 在 macOS 監督 Ghidra 等子行程時需要）"
    else
      fail "找不到 swiftc（xcrun --find swiftc 失敗）"
      hint "REA 在 macOS 需要 Apple 的 Swift 編譯器（透過 xcrun）；REA 不會自己安裝 Xcode 或 Command Line Tools"
      add_next "安裝或修復 Xcode Command Line Tools（見 references/install-macos.md 第 2 節）"
    fi
    for TOOL in make bison; do
      TP=$(xcrun --find "$TOOL" 2>/dev/null)
      if [ -n "$TP" ]; then
        pass "$TOOL：$TP"
      else
        warn "找不到 $TOOL（只有在需要自行建置 Ghidra 原生反編譯器時才需要）"
      fi
    done
  else
    fail "沒有偵測到 Xcode Command Line Tools"
    hint "REA 在 macOS 需要 xcrun swiftc；建置 Ghidra 原生反編譯器也需要 make 與 bison"
    hint "Apple 的一般安裝方式（REA 文件沒有列出指令）：xcode-select --install"
    add_next "安裝 Xcode Command Line Tools（見 references/install-macos.md 第 2 節）"
  fi
else
  info "非 macOS，略過"
fi

# ---------------------------------------------------------------------------
# 先收集已安裝的 REA 套件資訊（供 Node 檢查參考 engines）
# ---------------------------------------------------------------------------
NPM_BIN=$(command -v npm 2>/dev/null)
NPM_ROOT=""
NPM_PREFIX=""
REA_PKG_JSON=""
REA_INSTALLED_VER=""
ENGINES_RANGE="$DEFAULT_ENGINES_RANGE"
ENGINES_SRC="REA $REA_PINNED_VERSION 的 package.json（2026-10-15 查證）"
if [ -n "$NPM_BIN" ]; then
  NPM_ROOT=$(npm root -g 2>/dev/null)
  NPM_PREFIX=$(npm prefix -g 2>/dev/null)
  if [ -n "$NPM_ROOT" ] && [ -f "$NPM_ROOT/rea-agents/package.json" ]; then
    REA_PKG_JSON="$NPM_ROOT/rea-agents/package.json"
    REA_INSTALLED_VER=$(sed -n 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$REA_PKG_JSON" | head -n 1)
    PKG_ENGINES=$(read_engines_node "$REA_PKG_JSON")
    if [ -n "$PKG_ENGINES" ]; then
      ENGINES_RANGE="$PKG_ENGINES"
      ENGINES_SRC="已安裝的 rea-agents ${REA_INSTALLED_VER:-?} 的 package.json"
    fi
  fi
fi

# ---------------------------------------------------------------------------
# 3. Node.js 與 npm
# ---------------------------------------------------------------------------
section "3. Node.js 與 npm"

NODE_BIN=$(command -v node 2>/dev/null)
if [ -z "$NODE_BIN" ]; then
  fail "找不到 node"
  hint "REA 需要 Node.js 22.x（>=22.19）、24.x（>=24.11）或 26 以上，並搭配同一份 npm"
  add_next "安裝 Node.js（建議 24 LTS；見 references/install-macos.md 第 3 節）"
else
  NODE_V=$(node -v 2>/dev/null)
  range_ok "$NODE_V" "$ENGINES_RANGE"
  R=$?
  case "$R" in
    0) pass "node $NODE_V 符合 engines 範圍「$ENGINES_RANGE」（依據：$ENGINES_SRC）" ;;
    1)
      fail "node $NODE_V 不符合 engines 範圍「$ENGINES_RANGE」（依據：$ENGINES_SRC）"
      hint "Node 23、25 與預先發行版不受支援；建議改用 Node 24 LTS"
      add_next "更換為受支援的 Node.js 版本（見 references/install-macos.md 第 3 節）"
      ;;
    *)
      warn "無法自動判讀 node $NODE_V 是否符合「$ENGINES_RANGE」，請人工確認"
      ;;
  esac
  case "$NODE_BIN" in
    "$HOME"/.nvm/*) NODE_KIND="nvm" ;;
    *fnm*) NODE_KIND="fnm" ;;
    /opt/homebrew/* | /usr/local/Cellar/* | /usr/local/opt/*) NODE_KIND="Homebrew" ;;
    /usr/local/bin/node) NODE_KIND="nodejs.org 安裝檔或 Intel Mac 的 Homebrew" ;;
    *) NODE_KIND="其他" ;;
  esac
  info "node 位置：$NODE_BIN（推測來源：$NODE_KIND）"
  NODE_ARCH=$(normalize_arch "$(node -p 'process.arch' 2>/dev/null)")
  if [ -n "$NODE_ARCH" ] && [ -n "$HW_ARCH" ]; then
    if [ "$NODE_ARCH" = "$HW_ARCH" ]; then
      pass "node 架構 $NODE_ARCH 與主機相同"
    else
      warn "node 架構是 $NODE_ARCH，主機是 $HW_ARCH（可能透過 Rosetta 執行）"
      hint "建議安裝與主機相同架構的 Node.js，避免架構判斷不一致（此為推論，REA 文件未明寫）"
    fi
  fi
fi

if [ -z "$NPM_BIN" ]; then
  fail "找不到 npm"
  hint "npm 通常隨 Node.js 一起安裝；請重新安裝 Node.js"
  add_next "重新安裝 Node.js（含 npm）（references/install-macos.md 第 3 節）"
else
  NPM_V=$(npm -v 2>/dev/null)
  pass "npm ${NPM_V:-?}（$NPM_BIN）"
  if [ -n "$NPM_PREFIX" ]; then
    W_TARGET="$NPM_ROOT"
    [ -d "$W_TARGET" ] || W_TARGET="$NPM_PREFIX"
    W_OK=1
    [ -w "$W_TARGET" ] || W_OK=0
    if [ -d "$NPM_PREFIX/bin" ] && [ ! -w "$NPM_PREFIX/bin" ]; then W_OK=0; fi
    if [ "$W_OK" -eq 1 ]; then
      pass "npm 全域安裝目錄可由目前使用者寫入（$NPM_PREFIX），不需要 sudo"
    else
      warn "npm 全域安裝目錄（$NPM_PREFIX）目前使用者無法寫入；npm install --global 會失敗（EACCES）"
      hint "不要用 sudo 安裝；改用見 references/install-macos.md 第 3.3 節的做法"
      add_next "處理 npm 全域目錄權限（references/install-macos.md 第 3.3 節）"
    fi
  fi
fi

# ---------------------------------------------------------------------------
# 4. Java（JDK）
# ---------------------------------------------------------------------------
section "4. Java（需要 64 位元完整 JDK ${JDK_MIN_DEFAULT} 以上，含 javac）"

JDK_HOME=""
JDK_SRC=""
JDK_MAJOR=""
if [ -n "${JAVA_HOME:-}" ]; then
  case "$JAVA_HOME" in
    /*)
      JDK_HOME="$JAVA_HOME"
      JDK_SRC="JAVA_HOME 環境變數"
      ;;
    *)
      fail "JAVA_HOME 是相對路徑（$JAVA_HOME）；REA 會拒絕相對路徑"
      hint "改成絕對路徑，例如 java -XshowSettings:properties -version 印出的 java.home"
      add_next "把 JAVA_HOME 改成絕對路徑"
      ;;
  esac
fi
if [ -z "$JDK_HOME" ] && [ "$IS_MAC" -eq 1 ] && [ -x /usr/libexec/java_home ] && has_jdk_bundle; then
  H=$(/usr/libexec/java_home 2>/dev/null)
  if [ -n "$H" ] && [ -d "$H" ]; then
    JDK_HOME="$H"
    JDK_SRC="/usr/libexec/java_home（系統預設 JDK）"
  fi
fi
if [ -z "$JDK_HOME" ]; then
  JAVA_BIN=$(command -v java 2>/dev/null)
  if [ -n "$JAVA_BIN" ]; then
    if [ "$IS_MAC" -eq 1 ] && [ "$JAVA_BIN" = "/usr/bin/java" ]; then
      : # macOS 的 /usr/bin/java 是系統替身；沒有 JDK 時執行可能跳出安裝提示，所以不執行
    else
      H=$("$JAVA_BIN" -XshowSettings:properties -version 2>&1 | sed -n 's/^[[:space:]]*java\.home = //p' | head -n 1)
      if [ -n "$H" ]; then
        JDK_HOME="$H"
        JDK_SRC="PATH 上的 java（$JAVA_BIN）"
      fi
    fi
  fi
fi

if [ -z "$JDK_HOME" ]; then
  fail "沒有偵測到 JDK"
  hint "請安裝 64 位元 JDK 21 以上（含 javac）；Apple Silicon 請選 aarch64 版本"
  hint "REA 官網列出的下載來源：https://adoptium.net/temurin/releases/?version=21"
  for BJ in /opt/homebrew/opt/openjdk*/libexec/openjdk.jdk/Contents/Home /usr/local/opt/openjdk*/libexec/openjdk.jdk/Contents/Home; do
    if [ -d "$BJ" ]; then
      info "另外找到 Homebrew 的 JDK（未設為預設）：$BJ；若要使用，可讓 JAVA_HOME 指向它後重新檢查"
    fi
  done
  add_next "安裝 JDK 21（references/install-macos.md 第 4 節）"
elif [ ! -d "$JDK_HOME" ]; then
  fail "JDK 路徑不存在：$JDK_HOME（來源：$JDK_SRC）"
  add_next "修正 JAVA_HOME，或重新安裝 JDK 21（references/install-macos.md 第 4 節）"
else
  JV=""
  JA=""
  if [ -f "$JDK_HOME/release" ]; then
    JV=$(read_release "$JDK_HOME/release" JAVA_VERSION)
    JA=$(read_release "$JDK_HOME/release" OS_ARCH)
  fi
  if [ -z "$JV" ] && [ -x "$JDK_HOME/bin/java" ]; then
    PROPS=$("$JDK_HOME/bin/java" -XshowSettings:properties -version 2>&1)
    JV=$(printf '%s\n' "$PROPS" | sed -n 's/^[[:space:]]*java\.version = //p' | head -n 1)
    JA=$(printf '%s\n' "$PROPS" | sed -n 's/^[[:space:]]*os\.arch = //p' | head -n 1)
  fi
  case "$JV" in
    1.*) M="${JV#1.}"; M="${M%%.*}" ;;
    *) M="${JV%%[._+-]*}" ;;
  esac
  case "$M" in
    '' | *[!0-9]*)
      warn "讀不到 JDK 版本（$JDK_HOME）"
      ;;
    *)
      JDK_MAJOR="$M"
      if [ "$M" -ge "$JDK_MIN_DEFAULT" ]; then
        pass "JDK $JV（主要版本 $M）位置：$JDK_HOME（來源：$JDK_SRC）"
      else
        fail "JDK $JV 太舊（主要版本 $M）；Ghidra 12.1 需要 JDK 21 以上"
        add_next "安裝 JDK 21 並讓 JAVA_HOME 指向它（references/install-macos.md 第 4 節）"
      fi
      ;;
  esac
  if [ -x "$JDK_HOME/bin/javac" ]; then
    pass "有 javac（完整 JDK）"
  else
    fail "$JDK_HOME 裡沒有 javac；REA 需要完整 JDK，不能只有 JRE"
    add_next "改裝完整 JDK（含 javac）"
  fi
  if [ -n "$JA" ]; then
    JA_N=$(normalize_arch "$JA")
    if [ -n "$HW_ARCH" ] && [ "$JA_N" = "$HW_ARCH" ]; then
      pass "JDK 架構 $JA 與主機相同"
    else
      fail "JDK 架構是 $JA，主機是 ${HW_ARCH:-未知}；REA doctor 會拒絕架構不符的 JDK（例如 Apple Silicon 上的 x86_64 JDK）"
      add_next "安裝與主機相同架構的 JDK，並用 JAVA_HOME 指向它"
    fi
  else
    warn "讀不到 JDK 架構"
  fi
  if [ -z "${JAVA_HOME:-}" ]; then
    info "目前沒有設定 JAVA_HOME；設定 REA 時建議明確使用：export JAVA_HOME=\"$JDK_HOME\""
  fi
fi
if [ "$IS_MAC" -eq 1 ] && [ -x /usr/libexec/java_home ] && has_jdk_bundle; then
  info "這台 Mac 上找到的 JDK（/usr/libexec/java_home -V）："
  /usr/libexec/java_home -V 2>&1 | sed -n '/^[[:space:]]/p' | sed 's/^[[:space:]]*/         /'
fi

# ---------------------------------------------------------------------------
# 5. Ghidra
# ---------------------------------------------------------------------------
section "5. Ghidra（REA 6.5.0 接受 12.1.x，驗證版本 $GHIDRA_VERIFIED）"

CAND_KEYS="|"
CAND_LINES=""
add_candidate() {
  case "$CAND_KEYS" in *"|$1|"*) return ;; esac
  CAND_KEYS="${CAND_KEYS}$1|"
  CAND_LINES="${CAND_LINES}$1	$2
"
}

if [ -n "${GHIDRA_INSTALL_DIR:-}" ]; then
  case "$GHIDRA_INSTALL_DIR" in
    /*)
      if [ -d "$GHIDRA_INSTALL_DIR" ]; then
        add_candidate "${GHIDRA_INSTALL_DIR%/}" "GHIDRA_INSTALL_DIR 環境變數"
      else
        fail "GHIDRA_INSTALL_DIR 指向不存在的資料夾：$GHIDRA_INSTALL_DIR"
        add_next "修正 GHIDRA_INSTALL_DIR（必須是含有 ghidraRun 的資料夾的絕對路徑）"
      fi
      ;;
    *)
      fail "GHIDRA_INSTALL_DIR 是相對路徑（$GHIDRA_INSTALL_DIR）；REA 會拒絕相對路徑"
      add_next "把 GHIDRA_INSTALL_DIR 改成絕對路徑（含有 ghidraRun 的資料夾）"
      ;;
  esac
else
  info "目前沒有設定 GHIDRA_INSTALL_DIR（REA 會優先使用它；沒設定時才會在 PATH 找 ghidra 或 ghidraRun）"
fi

for NAME in ghidraRun ghidra; do
  P=$(command -v "$NAME" 2>/dev/null)
  if [ -n "$P" ]; then
    RP=$(resolve_path "$P")
    D=$(dirname "$RP")
    [ -f "$D/ghidraRun" ] && add_candidate "$D" "PATH 上的 $NAME"
  fi
done

for G in /Applications/ghidra_* "$HOME"/Applications/ghidra_* "$HOME"/ghidra_* \
  "$HOME"/tools/ghidra_* "$HOME"/Downloads/ghidra_* "$HOME"/Downloads/ghidra_*/ghidra_* \
  /opt/ghidra* /opt/homebrew/Caskroom/ghidra/*/ghidra_* /usr/local/Caskroom/ghidra/*/ghidra_*; do
  if [ -d "$G" ] && [ -f "$G/ghidraRun" ]; then
    add_candidate "$G" "常見安裝位置"
  fi
done

GHIDRA_OK_DIRS=""
NEED_DECOMPILER=0
# GHIDRA_INSTALL_DIR 指定的資料夾用嚴格模式（問題記為 FAIL）；
# 其他自動找到的候選只記為 WARN，避免舊版殘留讓整體檢查失敗。
bad() {
  if [ "$CAND_STRICT" -eq 1 ]; then fail "$@"; else warn "$@"; fi
}
check_ghidra_dir() {
  local d src props ver jmin dec found finfo ok
  d="$1"
  src="$2"
  ok=1
  CAND_STRICT=0
  case "$src" in GHIDRA_INSTALL_DIR*) CAND_STRICT=1 ;; esac
  printf '  · 候選：%s（來源：%s）\n' "$d" "$src"
  if [ ! -f "$d/ghidraRun" ]; then
    bad "這個資料夾沒有 ghidraRun，不是 Ghidra 安裝根目錄：$d"
    hint "GHIDRA_INSTALL_DIR 要指向解壓縮後「含有 ghidraRun」的那一層資料夾"
    return
  fi
  props="$d/Ghidra/application.properties"
  ver=$(read_prop "$props" 'application\.version')
  jmin=$(read_prop "$props" 'application\.java\.min')
  case "$ver" in
    "$GHIDRA_VERIFIED") pass "Ghidra $ver（REA 驗證過的版本）" ;;
    12.1.*) pass "Ghidra $ver（REA 6.5.0 接受 12.1.x；驗證版本為 $GHIDRA_VERIFIED）" ;;
    "")
      bad "讀不到 Ghidra 版本（$props）"
      ok=0
      ;;
    *)
      bad "Ghidra $ver：REA 6.5.0 只接受 12.1.x（驗證版本 $GHIDRA_VERIFIED）"
      ok=0
      ;;
  esac
  if [ -f "$d/support/analyzeHeadless" ]; then
    pass "有 support/analyzeHeadless"
  else
    bad "缺少 support/analyzeHeadless"
    ok=0
  fi
  found=""
  for dec in "$d/Ghidra/Features/Decompiler/os/$DEC_DIR/decompile" "$d/Ghidra/Features/Decompiler/build/os/$DEC_DIR/decompile"; do
    if [ -f "$dec" ]; then
      found="$dec"
      break
    fi
  done
  if [ -n "$found" ]; then
    finfo=$(file -b "$found" 2>/dev/null)
    case "$HW_ARCH:$finfo" in
      arm64:*arm64* | arm64:*aarch64* | x86_64:*x86_64* | x86_64:*x86-64*)
        pass "原生反編譯器符合本機架構：${found#"$d"/}（${finfo%%,*}）"
        ;;
      *)
        bad "原生反編譯器的架構和本機（$HW_ARCH）不符或無法判讀：${found#"$d"/}（${finfo:-無法判讀}）"
        hint "REA 會讀取執行檔本身的標頭判斷架構；不符時要為本機重新建置（references/install-macos.md 第 5.3 節，先把舊檔移到備份位置）"
        NEED_DECOMPILER=1
        ok=0
        ;;
    esac
    if [ ! -x "$found" ]; then
      bad "原生反編譯器沒有執行權限：$found"
      hint "REA 需要可執行的 decompile。確認是本機架構後可執行 chmod 755 \"$found\"；不確定時照第 5.3 節重新建置"
      NEED_DECOMPILER=1
      ok=0
    fi
  else
    bad "缺少本機架構（$DEC_DIR）的 Ghidra 原生反編譯器"
    hint "全新的 macOS 安裝常需要自行建置；步驟見 references/install-macos.md 第 5.3 節"
    NEED_DECOMPILER=1
    ok=0
  fi
  if [ -n "$jmin" ]; then
    case "$jmin:$JDK_MAJOR" in
      *[!0-9:]* | *: | :*) info "這個 Ghidra 宣告的最低 Java 版本：$jmin" ;;
      *)
        if [ "$JDK_MAJOR" -ge "$jmin" ]; then
          pass "JDK $JDK_MAJOR 符合這個 Ghidra 宣告的最低 Java 版本 $jmin"
        else
          bad "JDK $JDK_MAJOR 低於這個 Ghidra 宣告的最低 Java 版本 $jmin"
          ok=0
        fi
        ;;
    esac
  fi
  if [ "$ok" -eq 1 ]; then
    GHIDRA_OK_DIRS="${GHIDRA_OK_DIRS}$d
"
  fi
}

if [ -z "$CAND_LINES" ]; then
  fail "找不到 Ghidra 安裝"
  hint "下載 Ghidra $GHIDRA_VERIFIED 的 release 壓縮檔（不是 Source code）：https://github.com/NationalSecurityAgency/ghidra/releases/tag/Ghidra_${GHIDRA_VERIFIED}_build"
  add_next "安裝 Ghidra $GHIDRA_VERIFIED（references/install-macos.md 第 5 節）"
else
  while IFS='	' read -r CD CS; do
    [ -n "$CD" ] && check_ghidra_dir "$CD" "$CS"
  done <<EOF
$CAND_LINES
EOF
  if [ -z "$GHIDRA_OK_DIRS" ]; then
    fail "找到的 Ghidra 都還不能給 REA 使用（見上面各候選的問題）"
    if [ "$NEED_DECOMPILER" -eq 1 ]; then
      add_next "為本機建置 Ghidra 原生反編譯器（references/install-macos.md 第 5.3 節）"
    else
      add_next "安裝或修正 Ghidra $GHIDRA_VERIFIED（references/install-macos.md 第 5 節）"
    fi
  elif [ -z "${GHIDRA_INSTALL_DIR:-}" ]; then
    FIRST_OK=$(printf '%s' "$GHIDRA_OK_DIRS" | head -n 1)
    pass "找到可用的 Ghidra：$FIRST_OK"
    info "設定 REA 時請明確使用絕對路徑：export GHIDRA_INSTALL_DIR=\"$FIRST_OK\""
  fi
fi

# ---------------------------------------------------------------------------
# 6. Claude Code
# ---------------------------------------------------------------------------
section "6. Claude Code"

CLAUDE_BIN=$(command -v claude 2>/dev/null)
if [ -n "$CLAUDE_BIN" ]; then
  CV=$(claude --version 2>/dev/null | head -n 1)
  pass "Claude Code CLI：${CV:-（讀不到版本）}（$CLAUDE_BIN）"
  info "REA 的 Claude Code 驗證紀錄使用 2.1.296；REA 文件沒有列出最低版本"
else
  warn "這個終端機的 PATH 上找不到 claude 指令"
  hint "官方安裝方式見 https://code.claude.com/docs/en/setup；註冊後的檢查與還原會用到 claude mcp 指令"
fi

if [ -n "${CLAUDE_CONFIG_DIR:-}" ]; then
  CFG_ROOT="$CLAUDE_CONFIG_DIR"
  CLAUDE_JSON="$CLAUDE_CONFIG_DIR/.claude.json"
  info "CLAUDE_CONFIG_DIR=$CLAUDE_CONFIG_DIR（正在使用獨立設定檔；之後每個 REA 指令都要加同樣的前綴）"
else
  CFG_ROOT="$HOME/.claude"
  CLAUDE_JSON="$HOME/.claude.json"
fi

if [ -f "$CLAUDE_JSON" ]; then
  if grep -q '"rea"[[:space:]]*:' "$CLAUDE_JSON" 2>/dev/null; then
    info "$CLAUDE_JSON 裡似乎已有名為 rea 的項目（文字比對，僅供參考；請以 rea doctor --client claude_code --json 確認）"
  else
    info "$CLAUDE_JSON 裡還沒有看到 rea 項目（文字比對）"
  fi
  if [ -f "$CLAUDE_JSON.rea.backup" ]; then
    info "已有 REA setup 建立的備份：$CLAUDE_JSON.rea.backup"
  fi
else
  info "$CLAUDE_JSON 不存在（尚未使用過 Claude Code，或使用其他設定位置）"
fi

if [ -d "$CFG_ROOT/skills/reverse-engineer-anything" ]; then
  info "已安裝 REA 內建 skill：$CFG_ROOT/skills/reverse-engineer-anything"
fi

if [ -f "$CFG_ROOT/settings.json" ]; then
  if grep -q 'mcp__rea__' "$CFG_ROOT/settings.json" 2>/dev/null; then
    info "$CFG_ROOT/settings.json 已含有 mcp__rea__ 權限規則"
  else
    info "$CFG_ROOT/settings.json 尚未設定 REA 權限規則（見 references/permissions.md）"
  fi
fi

# ---------------------------------------------------------------------------
# 7. REA 本身（只看檔案與 npm 清單，不執行 rea）
# ---------------------------------------------------------------------------
section "7. REA（rea-agents）安裝狀態"

REA_BIN=$(command -v rea 2>/dev/null)
if [ -n "$NPM_BIN" ]; then
  NPM_LS=$(npm ls -g rea-agents --depth=0 2>/dev/null | sed -n '/rea-agents@/p' | head -n 1)
  if [ -n "$NPM_LS" ]; then
    info "npm ls -g：$(printf '%s' "$NPM_LS" | sed 's/^[^r]*//')"
  fi
fi

if [ -n "$REA_INSTALLED_VER" ]; then
  if [ "$REA_INSTALLED_VER" = "$REA_PINNED_VERSION" ]; then
    pass "已全域安裝 rea-agents $REA_INSTALLED_VER（$REA_PKG_JSON）"
  else
    warn "已全域安裝 rea-agents $REA_INSTALLED_VER，與本 skill 查證的 $REA_PINNED_VERSION 不同"
    hint "先閱讀官方 CHANGELOG，並以 rea --help、rea setup --help 確認旗標，不要假設與 $REA_PINNED_VERSION 相同"
  fi
  if [ -n "$PKG_ENGINES" ] && [ "$PKG_ENGINES" != "$DEFAULT_ENGINES_RANGE" ]; then
    info "已安裝版本的 engines.node 為「$PKG_ENGINES」，與 $REA_PINNED_VERSION 的「$DEFAULT_ENGINES_RANGE」不同；上面的 Node 檢查已採用已安裝版本的範圍"
  fi
  if [ -d "$NPM_ROOT/rea-agents/node_modules/frida" ] || [ -d "$NPM_ROOT/frida" ]; then
    info "偵測到選用相依套件 frida（只有動態插樁工具會用到；Ghidra 靜態分析不需要）"
  fi
else
  info "尚未以 npm 全域安裝 rea-agents（安裝步驟見 references/install-macos.md 第 6 節）"
fi

if [ -n "$REA_BIN" ]; then
  RRB=$(resolve_path "$REA_BIN")
  case "$RRB" in
    *"/rea-agents/"*) info "rea 指令：$REA_BIN → $RRB" ;;
    *)
      warn "PATH 上的 rea 指令看起來不是 npm 套件 rea-agents：$REA_BIN → $RRB"
      hint "請確認來源；REA 官方來源只有 github.com/morluto/rea、rea.tools 與 npm 套件 rea-agents"
      ;;
  esac
fi

if [ -d "$HOME/.rea" ]; then
  info "REA 快取與狀態資料夾存在：$HOME/.rea（rea uninstall --purge-data 會移除其中的 cache 與 state）"
fi

# ---------------------------------------------------------------------------
# 8. Homebrew（選用）
# ---------------------------------------------------------------------------
section "8. Homebrew（選用，不是必要條件）"

BREW_BIN=$(command -v brew 2>/dev/null)
if [ -z "$BREW_BIN" ]; then
  for BP in /opt/homebrew/bin/brew /usr/local/bin/brew; do
    if [ -x "$BP" ]; then
      BREW_BIN="$BP"
      break
    fi
  done
fi
if [ -n "$BREW_BIN" ]; then
  pass "Homebrew：$BREW_BIN"
else
  info "沒有 Homebrew；可以改用 nodejs.org 的官方安裝檔安裝 Node.js"
fi

# ---------------------------------------------------------------------------
# 總結
# ---------------------------------------------------------------------------
section "總結"
printf '  PASS：%s　WARN：%s　FAIL：%s\n' "$PASS_N" "$WARN_N" "$FAIL_N"
if [ -n "$NEXT_STEPS" ]; then
  printf '  建議的下一步：\n%s' "$NEXT_STEPS"
elif [ "$FAIL_N" -eq 0 ]; then
  printf '  前置條件看起來都已就緒，可以進行「安裝 REA」步驟（references/install-macos.md 第 6 節）。\n'
fi
if [ "$WARN_N" -gt 0 ]; then
  printf '  有 %s 項 WARN：不一定會阻擋安裝，但請逐項看過上面的說明。\n' "$WARN_N"
fi
printf '  （這支腳本沒有修改任何設定或檔案；npm 的暫存日誌會在結束時刪除。修正後可以隨時重新執行。）\n'

if [ "$FAIL_N" -gt 0 ]; then
  exit 1
fi
exit 0
