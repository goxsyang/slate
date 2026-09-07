#!/bin/bash
# analyze_video.sh — 影片配樂節奏分析：一次拿到時長、切點、密度曲線、音軌能量／人聲空窗、contact sheet
#
# 用法:
#   analyze_video.sh <影片路徑> [輸出目錄] [抽幀間隔秒（可小數）] [場景閾值] [選項...]
#
# 選項（可放在任何位置）:
#   --prev <舊版 cuts.txt>   重剪比對：判定「完全相同／整體平移／前綴相同後段重剪／局部重剪／完全重排」
#   --anchors "a,b,c"        搭配 --prev：把舊 prompt 的秒數錨點換算成新版秒數（以整體平移量為準）
#   --energy-win <秒>        音軌能量長條圖的視窗秒數（預設依片長自動：≤40s→2、≤150s→4、其餘 5）
#   --gap-db <dB>            人聲空窗門檻（預設自動：峰值 -20dB，最低 -60）
#   --gap-min <秒>           空窗最短長度才列出（預設 1.0）
#   --music                  音訊模式：輸入是現成曲（mp3/wav/m4a…），只做能量曲線＋BPM 估計＋淡出縫分析，不抽幀
#   --no-frames              跳過抽幀與 contact sheet（只要數據時用，快很多）
#
# 預設: 輸出到 ./score-analysis，每 2 秒抽一幀，場景閾值 0.12
#
# 為什麼閾值用 0.12 而不是 ffmpeg 常見的 0.3：配樂要的不只是「剪接點」，
# 而是「畫面劇變點」——動畫裡的爆炸、閃光、快速運鏡都算音樂該跟的動作。
# 0.12 會把這些一起抓進來，密度分布因此更貼近實際的動作強度。
#
# 依賴：ffmpeg / ffprobe / awk / python3（僅標準庫，不用 numpy、librosa）。

set -uo pipefail

# ─── 參數解析（位置參數 + 選項混用）──────────────
PREV=""; ANCHORS=""; EWIN=""; GAPDB=""; GAPMIN="1.0"; MUSIC=0; NOFRAMES=0
POS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --prev)       PREV="${2:?--prev 需要舊版 cuts.txt 路徑}"; shift 2 ;;
    --anchors)    ANCHORS="${2:?--anchors 需要逗號分隔的秒數}"; shift 2 ;;
    --energy-win) EWIN="${2:?--energy-win 需要秒數}"; shift 2 ;;
    --gap-db)     GAPDB="${2:?--gap-db 需要 dB 值}"; shift 2 ;;
    --gap-min)    GAPMIN="${2:?--gap-min 需要秒數}"; shift 2 ;;
    --music)      MUSIC=1; shift ;;
    --no-frames)  NOFRAMES=1; shift ;;
    -h|--help)    sed -n '2,20p' "$0"; exit 0 ;;
    --*)          echo "未知選項: $1" >&2; exit 1 ;;
    *)            POS+=("$1"); shift ;;
  esac
done
set -- "${POS[@]+"${POS[@]}"}"

VIDEO="${1:?用法: analyze_video.sh <影片路徑> [輸出目錄] [抽幀間隔] [場景閾值] [--prev 舊cuts.txt] [--music] [--no-frames]}"
OUT="${2:-./score-analysis}"
STEP="${3:-2}"
THRESH="${4:-0.12}"

[ -f "$VIDEO" ] || { echo "找不到檔案: $VIDEO" >&2; exit 1; }
command -v ffmpeg >/dev/null 2>&1 || { echo "需要 ffmpeg（brew install ffmpeg）" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "需要 python3（能量／比對分析用，僅標準庫）" >&2; exit 1; }
[ -z "$PREV" ] || [ -f "$PREV" ] || { echo "找不到舊版切點檔: $PREV" >&2; exit 1; }

# ─── 數值選項檢查：非數值直接報錯退出，不讓 python 在半路噴 traceback ───
is_num() { printf '%s' "$1" | awk '/^[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)$/{ok=1} END{exit ok?0:1}'; }
is_pos() { is_num "$1" && awk -v x="$1" 'BEGIN{exit (x>0)?0:1}'; }
[ -z "$EWIN" ]  || is_pos "$EWIN"  || { echo "--energy-win 需要正數（秒），收到：$EWIN" >&2; exit 1; }
[ -z "$GAPDB" ] || is_num "$GAPDB" || { echo "--gap-db 需要數值（dB，通常是負數如 -30），收到：$GAPDB" >&2; exit 1; }
is_pos "$GAPMIN" || { echo "--gap-min 需要正數（秒），收到：$GAPMIN" >&2; exit 1; }
is_pos "$STEP"   || { echo "抽幀間隔需要正數（秒，可用小數如 0.5），收到：$STEP" >&2; exit 1; }
is_num "$THRESH" || { echo "場景閾值需要數值（0–1，預設 0.12），收到：$THRESH" >&2; exit 1; }

mkdir -p "$OUT"
BASE=$(basename "$VIDEO")

echo "════════════════════════════════════════════"
echo " $BASE"
echo "════════════════════════════════════════════"

# ─── 規格 ───────────────────────────────────────
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO")
HAS_VIDEO=0
if ffprobe -v error -select_streams v:0 -show_entries stream=codec_type -of csv=p=0 "$VIDEO" 2>/dev/null | grep -q video; then
  # 純音訊檔可能帶封面圖（附件串流），這裡只認真正的影像串流
  if [ "$(ffprobe -v error -select_streams v:0 -show_entries stream_disposition=attached_pic -of csv=p=0 "$VIDEO" 2>/dev/null | head -1)" != "1" ]; then
    HAS_VIDEO=1
  fi
fi
if [ "$HAS_VIDEO" = "1" ]; then
  ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate \
    -of csv=p=0 "$VIDEO" | head -1 | awk -F, '{printf "解析度 %sx%s   fps %s\n", $1, $2, $3}'
else
  echo "影像   無（純音訊）"
  MUSIC=1
fi
printf "時長   %.2f 秒\n" "$DUR"

# ─── 音軌：是否為靜音的「配樂用」版本 ───────────
HAS_AUDIO=0
SILENT=0
MEAN=""
if ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$VIDEO" 2>/dev/null | grep -q .; then
  HAS_AUDIO=1
  MEAN=$(ffmpeg -hide_banner -i "$VIDEO" -af volumedetect -f null - 2>&1 \
         | grep -o 'mean_volume: [-0-9.]*' | awk '{print $2}')
  if [ -n "${MEAN:-}" ]; then
    if [ "$(awk -v m="$MEAN" 'BEGIN{print (m < -45) ? 1 : 0}')" = "1" ]; then
      SILENT=1
      echo "音軌   平均 ${MEAN}dB → 幾乎靜音（純淨配樂用版，節奏只能靠畫面判讀）"
    elif [ "$MUSIC" = "1" ]; then
      echo "音軌   平均 ${MEAN}dB（現成曲）"
    else
      echo "音軌   平均 ${MEAN}dB → 有聲（對白/音效也會佔頻段，配樂要留空間）"
    fi
  fi
else
  echo "音軌   無"
fi

# ═══════════════════════════════════════════════
# 影片模式：切點 → 密度（原有輸出，格式不變）
# ═══════════════════════════════════════════════
if [ "$MUSIC" = "0" ]; then
  # ─── 場景切點 ───────────────────────────────────
  echo
  echo "─── 切點（閾值 $THRESH）───"
  rm -f "$OUT/scenes.txt"
  ffmpeg -v error -i "$VIDEO" -vf "select='gt(scene,$THRESH)',metadata=print:file=$OUT/scenes.txt" \
    -an -f null - 2>/dev/null
  grep -o 'pts_time:[0-9.]*' "$OUT/scenes.txt" 2>/dev/null | sed 's/pts_time://' \
    | awk '{printf "%.2f\n", $1}' > "$OUT/cuts.txt"
  COUNT=$(wc -l < "$OUT/cuts.txt" | tr -d ' ')
  echo "共 $COUNT 個，平均 $(awk -v d="$DUR" -v c="$COUNT" 'BEGIN{printf "%.2f", (c>0)? d/c : 0}') 秒一個"
  echo
  tr '\n' ' ' < "$OUT/cuts.txt"; echo

  # ─── 密度曲線：動作強度的客觀代理 ───────────────
  # 密度高 = 剪得碎 = 動作激烈；密度低 = 長鏡頭 = 該留白。
  # 注意「最密」不等於「戲劇最重」——高潮常落在密集段之後，判讀時務必分開看。
  echo
  echo "─── 每 5 秒切點密度 ───"
  awk -v dur="$DUR" '
    { b = int($1/5)*5; cnt[b]++; if (cnt[b] > max) max = cnt[b] }
    END {
      for (t = 0; t < dur; t += 5) {
        n = (t in cnt) ? cnt[t] : 0
        bar = ""
        w = (max > 0) ? int(n * 40 / max) : 0
        for (i = 0; i < w; i++) bar = bar "█"
        printf "%5.0f-%-5.0f %3d  %s\n", t, t+5, n, bar
      }
    }' "$OUT/cuts.txt"
fi

# ═══════════════════════════════════════════════
# 新增：音軌能量分佈 ＋ 人聲空窗（影片模式）／ BPM ＋ 淡出縫（音訊模式）
# ═══════════════════════════════════════════════
# 原理：把音軌解成 16kHz 單聲道 PCM，每 0.5s 一格算 RMS dB（細格），
# 再彙整成 N 秒視窗畫長條。細格用來找空窗（連續低於門檻 ≥ gap-min 秒），
# 視窗用來一眼看能量分佈。空窗＝音樂可獨佔聲場的峰值候選位置；
# 大聲段＝旁白／SOT 在講話，配樂必須透明。
if [ "$HAS_AUDIO" = "1" ]; then
  RAW="$OUT/audio16k.pcm"
  ffmpeg -v error -i "$VIDEO" -vn -ac 1 -ar 16000 -f s16le "$RAW" -y 2>/dev/null
  if [ -s "$RAW" ]; then
    python3 - "$RAW" "$DUR" "$OUT" "${EWIN:-auto}" "${GAPDB:-auto}" "$GAPMIN" "$MUSIC" "${MEAN:-nan}" <<'PY'
import sys, math, array, os
raw, dur, out, ewin, gapdb, gapmin, music, meanvol = sys.argv[1:9]
dur = float(dur); gapmin = float(gapmin); music = music == "1"
SR = 16000; CELL = 0.5; HOP = 0.01
data = array.array('h')
with open(raw, 'rb') as f:
    data.frombytes(f.read())
n = len(data)
if n == 0:
    print("音軌能量：解不出樣本"); sys.exit(0)

def rms_db(seg):
    if len(seg) == 0: return -99.0
    s = 0
    for v in seg: s += v * v
    m = s / len(seg)
    return -99.0 if m <= 0 else max(-99.0, 10 * math.log10(m / (32768.0 ** 2)))

# 細格 0.5s
cs = int(SR * CELL)
cells = [rms_db(data[i:i + cs]) for i in range(0, n, cs)]
peak = max(cells)
with open(os.path.join(out, "energy.txt"), "w") as f:
    for i, v in enumerate(cells):
        f.write(f"{i * CELL:.1f}\t{v:.1f}\n")

# 視窗秒數
if ewin == "auto":
    W = 2 if dur <= 40 else (4 if dur <= 150 else 5)
else:
    W = float(ewin)
per = max(1, int(round(W / CELL)))
wins = []
for i in range(0, len(cells), per):
    chunk = cells[i:i + per]
    a, b = i * CELL, min(dur, (i + per) * CELL)
    if b - a < CELL:  # 片尾不足一格的零頭視窗不印（避免出現 76-76 這種空列）
        continue
    lin = sum(10 ** (v / 10) for v in chunk) / len(chunk)
    wins.append((a, b, 10 * math.log10(lin) if lin > 0 else -99.0, max(chunk)))

# 門檻
if gapdb == "auto":
    thr = max(-60.0, peak - 20.0)
else:
    thr = float(gapdb)

# 空窗：連續細格 < thr 且長度 ≥ gapmin
gaps = []
start = None
for i, v in enumerate(cells + [999]):
    t = i * CELL
    if v < thr and start is None:
        start = t
    elif v >= thr and start is not None:
        end = min(t, dur)
        if end - start >= gapmin - 1e-9:
            gaps.append((start, end))
        start = None

nearly_silent = (meanvol != "nan" and float(meanvol) < -45)

print()
label = "現成曲能量曲線" if music else "音軌能量"
print(f"─── {label}（每 {W:g}s RMS dB，峰值 {peak:.1f}dB，空窗門檻 {thr:.0f}dB）───")
lo = min(v for _, _, v, _ in wins); hi = max(v for _, _, v, _ in wins)
span = max(1.0, hi - max(lo, thr - 10))
gap_idx = 0
for (a, b, v, mx) in wins:
    w = int(max(0, (v - max(lo, thr - 10))) / span * 40)
    bar = "█" * w
    # 該視窗是否含空窗
    mark = ""
    for (ga, gb) in gaps:
        ov = min(b, gb) - max(a, ga)
        if ov > 0:
            mark = "  ◁ 空窗" if ov >= (b - a) - 1e-9 else "  ◁ 部分空窗"
            break
    print(f"{a:5.0f}-{b:<5.0f} {v:6.1f}  {bar}{mark}")

if nearly_silent:
    print("（整軌幾乎靜音，空窗分析無意義——這是純淨配樂版，峰值位置回到畫面判讀）")
elif not music:
    print()
    print(f"─── 人聲空窗（連續 ≥{gapmin:g}s 低於 {thr:.0f}dB；音樂可獨佔聲場的峰值候選）───")
    if not gaps:
        print("無——全片有聲不間斷，配樂只能走透明長線，峰值放在 SOT 最弱的視窗")
    else:
        with open(os.path.join(out, "gaps.txt"), "w") as f:
            for (ga, gb) in gaps:
                print(f"  {ga:6.1f}s – {gb:6.1f}s  ({gb - ga:4.1f}s)" + ("  ← 最長" if (gb - ga) == max(g[1] - g[0] for g in gaps) else ""))
                f.write(f"{ga:.1f}\t{gb:.1f}\n")
        total = sum(gb - ga for ga, gb in gaps)
        print(f"  合計 {total:.1f}s 空窗 / {dur:.1f}s（{100 * total / dur:.0f}%）")
    # 最吵的三個視窗：配樂必須透明
    loud = sorted(wins, key=lambda x: -x[2])[:3]
    print("  最吵視窗（配樂在此必須透明）：" + "、".join(f"{a:.0f}-{b:.0f}s {v:.0f}dB" for a, b, v, _ in loud))

# ─── 音訊模式：BPM 估計 ＋ 淡出縫 ─────────────────
if music and not nearly_silent:
    # 能量包絡（10ms hop），onset = log 能量的正向差分，對 60–200 BPM 的 lag 做自相關
    hop = int(SR * HOP)
    env = []
    for i in range(0, n - hop, hop):
        seg = data[i:i + hop]
        s = 0
        for v in seg: s += v * v
        env.append(math.log10(s / hop + 1.0))
    onset = [max(0.0, env[i] - env[i - 1]) for i in range(1, len(env))]
    mu = sum(onset) / max(1, len(onset))
    onset = [o - mu for o in onset]
    L = len(onset)
    if L > 400:
        best = []
        lag_min = int(round(60.0 / 200.0 / HOP))   # 200 BPM
        lag_max = int(round(60.0 / 60.0 / HOP))    # 60 BPM
        norm = sum(o * o for o in onset) or 1.0
        acf = {}
        for lag in range(lag_min, lag_max + 1):
            s = 0.0
            for i in range(lag, L):
                s += onset[i] * onset[i - lag]
            acf[lag] = s / norm
        # 取局部峰
        peaks = [(acf[l], l) for l in range(lag_min + 1, lag_max) if acf[l] >= acf[l - 1] and acf[l] >= acf[l + 1]]
        peaks.sort(reverse=True)
        print()
        print("─── BPM 估計（能量 onset 自相關；半拍／倍拍需人耳確認）───")
        if not peaks:
            print("  估不出穩定週期（可能是無節拍的 ambient／自由速度），改用人耳數拍")
        else:
            top = peaks[:3]
            for k, (score, lag) in enumerate(top):
                bpm = 60.0 / (lag * HOP)
                tag = "主估計" if k == 0 else "候選"
                print(f"  {tag}: {bpm:6.1f} BPM（信心 {score:.2f}）  半拍 {bpm / 2:5.1f} / 倍拍 {bpm * 2:5.1f}")
            b0 = 60.0 / (top[0][1] * HOP)
            print(f"  寫 prompt 用同一 BPM 家族：{b0 / 2:.0f} / {b0:.0f} / {b0 * 2:.0f}，選最接近體感的那個")
    # 淡出縫：最後一次高於 (峰值-6dB) 的細格 = 尾聲仍飽滿；最後一次高於 (峰值-30dB) = 實際結束
    last_full = max((i for i, v in enumerate(cells) if v >= peak - 6), default=0) * CELL
    last_aud = max((i for i, v in enumerate(cells) if v >= peak - 30), default=0) * CELL
    first_aud = min((i for i, v in enumerate(cells) if v >= peak - 30), default=0) * CELL
    print()
    print("─── 交接縫（淡出／淡入位置）───")
    print(f"  有聲起點 {first_aud:.1f}s ｜ 最後飽滿 {last_full:.1f}s ｜ 實際結束 {last_aud:.1f}s ｜ 尾巴長 {max(0, last_aud - last_full):.1f}s")
    if last_aud - last_full >= 2.0:
        print(f"  → 曲子自帶淡出，新 cue 從 {last_full:.1f}s 附近 prelap 進場（Open hushed，前 2–4s 只留低層）")
    else:
        print(f"  → 曲子硬收，新 cue 要不就緊接 {last_aud:.1f}s 直接進，要不就在剪輯裡自己做 2–3s 淡出再接")
    # 能量三段摘要
    third = max(1, len(wins) // 3)
    segs = [wins[:third], wins[third:2 * third], wins[2 * third:]]
    names = ["前段", "中段", "後段"]
    print("  能量摘要：" + "、".join(f"{nm} {sum(v for _, _, v, _ in s) / len(s):.0f}dB" for nm, s in zip(names, segs) if s))
PY
  fi
  rm -f "$RAW"
fi

# ═══════════════════════════════════════════════
# 新增：重剪比對（--prev 舊版 cuts.txt）
# ═══════════════════════════════════════════════
if [ "$MUSIC" = "0" ] && [ -n "$PREV" ]; then
  echo
  echo "─── 重剪比對（舊版 $(basename "$PREV") → 新版 cuts.txt）───"
  python3 - "$PREV" "$OUT/cuts.txt" "$DUR" "$ANCHORS" <<'PY'
import sys, bisect
from collections import Counter
prev_path, new_path, dur, anchors = sys.argv[1:5]
dur = float(dur)
def load(p):
    out = []
    for line in open(p):
        line = line.strip()
        if not line: continue
        try: out.append(float(line.split()[0]))
        except ValueError: pass
    return out
A = load(prev_path); B = load(new_path)
TOL = 0.06  # 秒；約 1.5 幀@25fps，吃掉 ffmpeg 取樣誤差
Q = 0.05    # 偏移量量化格
print(f"舊版 {len(A)} 個切點 ｜ 新版 {len(B)} 個切點")
if not A or not B:
    print("其中一邊沒有切點，無法比對"); sys.exit(0)

def near(x, arr):
    # 回傳 arr 中與 x 最接近的值（若在 TOL 內），否則 None
    i = bisect.bisect_left(arr, x)
    best = None
    for j in (i - 1, i):
        if 0 <= j < len(arr) and abs(arr[j] - x) <= TOL:
            if best is None or abs(arr[j] - x) < abs(best - x): best = arr[j]
    return best

A.sort(); B.sort()
# 1) 完全相同
if len(A) == len(B) and all(abs(a - b) <= TOL for a, b in zip(A, B)):
    print("判定：完全相同——切點序列一致，prompt 錨點不用動")
    sys.exit(0)

# 2) 偏移候選：直方圖投票只用來「提名」，選哪個偏移以「一對一配對數」為準。
#    頻閃段（每 0.05s 一刀）會讓每個新切點對鄰近 3–4 個舊切點都投票，直方圖被灌爆後
#    真值可能排到第 7 名（2026-09-03 道安眼罩篇實證：真值 -9.70 support 186，假值 -9.80 有 223）。
#    一對一配對（每個舊切點只能用一次）不受灌票影響——只有真正的偏移能讓每個新切點各自對到一個舊切點。
votes = Counter()
for b in B:
    for a in A:
        d = b - a
        if abs(d) <= dur:
            votes[round(d / Q) * Q] += 1
def support(d):
    return sum(v for k, v in votes.items() if abs(k - d) <= Q + 1e-9)
top = sorted(votes, key=lambda k: -support(k))[:8]
cand_set = set()
for d in top:
    for k in (-2, -1, 0, 1, 2):          # 連鄰格一起提名，避免真值被灌票擠出前八名
        cand_set.add(round(d + k * Q, 2))

def match_1to1(d):
    # 以偏移 d 把每個新切點 b 對到最近且尚未被用掉的舊切點（雙方皆已排序，greedy）
    used = set(); out = []
    for b in B:
        x = b - d
        i = bisect.bisect_left(A, x)
        best = None
        for j in range(max(0, i - 2), min(len(A), i + 2)):
            if j not in used and abs(A[j] - x) <= TOL and (best is None or abs(A[j] - x) < abs(A[best] - x)):
                best = j
        if best is not None:
            used.add(best); out.append((b, A[best]))
    return out

scored = {}
for d in cand_set:
    m = match_1to1(d)
    if not m: continue
    ds = sorted(b - a for b, a in m); dm = ds[len(ds) // 2]   # 用配對的中位數精修
    m2 = match_1to1(dm)
    if len(m2) >= len(m): m, d = m2, dm
    key = round(d, 2)
    if key not in scored or len(m) > len(scored[key][1]):
        scored[key] = (d, m)
ranked = sorted(scored.values(), key=lambda x: (-len(x[1]), abs(x[0])))   # 配對數多者優先，同分取 |d| 小者
if ranked:
    best_d, matched = ranked[0]
    cands = [d for d, _ in ranked][:8]
else:
    best_d, matched, cands = 0.0, [], []
ratio_new = len(matched) / len(B)
ratio_old = len(matched) / len(A)
n_match = len(matched)

# 3) 前綴（偏移 0）
prefix = 0
for a, b in zip(A, B):
    if abs(a - b) <= TOL: prefix += 1
    else: break

# 4) 分段偏移（RLE）：每個新切點取「使其對到舊切點」的最強偏移（在前 8 候選裡），再壓成連續段
seg = []
for b in B:
    pick = None
    for d in cands:
        a = near(b - d, A)
        if a is not None:
            pick = (round(d / Q) * Q, a); break
    seg.append((b, pick))
def rle(seg):
    runs = []  # [dq or None, b_start, b_end, a_start, a_end, count, diffs]
    for b, pick in seg:
        dq = None if pick is None else pick[0]
        if runs and runs[-1][0] == dq:
            r = runs[-1]; r[2] = b; r[4] = (pick[1] if pick else None); r[5] += 1
            if pick: r[6].append(b - pick[1])
        else:
            runs.append([dq, b, b, (pick[1] if pick else None), (pick[1] if pick else None), 1, ([b - pick[1]] if pick else [])])
    return runs
runs = rle(seg)
# 孤點（只有 1 個切點撐的偏移）多半是巧合，除非它的偏移與某個 ≥2 切點的段相同；否則視為未對應
strong = set(r[0] for r in runs if r[5] >= 2 and r[0] is not None)
seg = [(b, (p if (p is None or p[0] in strong) else None)) for b, p in seg]
runs = rle(seg)
sig_runs = [r for r in runs if r[5] >= 2 and r[0] is not None]
def run_d(r):
    ds = sorted(r[6]); return ds[len(ds) // 2] if ds else r[0]

# 4b) 收斂保險：所有吻合段的偏移彼此差 ≤ 2×TOL 且合計覆蓋 ≥90% 新切點 → 其實是整體平移，
#     只是頻閃段把偏移拆成 -9.70／-9.78／-9.62 這種碎段；收斂成中位數，不要判成「局部重剪」
converged = False
if sig_runs and ratio_new < 0.9:
    rds = [run_d(r) for r in sig_runs]
    cover = sum(r[5] for r in sig_runs) / len(B)
    if max(rds) - min(rds) <= 2 * TOL and cover >= 0.9:
        alld = sorted(x for r in sig_runs for x in r[6])
        dm = alld[len(alld) // 2]
        if abs(dm) > TOL:
            best_d = dm; n_match = sum(r[5] for r in sig_runs); converged = True

# 5) 判定
def fmt_d(d): return f"{d:+.2f}s"
print()
if ratio_new >= 0.9 and ratio_old >= 0.9 and abs(best_d) <= TOL:
    verdict = "幾乎相同（只有零星切點差異，多半是 ffmpeg 取樣抖動）"
elif (ratio_new >= 0.9 or converged) and abs(best_d) > TOL:
    verdict = f"整體平移 {fmt_d(best_d)}（新版 = 舊版 {'+' if best_d >= 0 else '-'} {abs(best_d):.2f}s；{n_match}/{len(B)} 個新切點精確吻合）"
    if converged:
        verdict += "——頻閃段使偏移微幅分裂（差 ≤0.12s），已收斂成中位數；下表偏移欄的小差異可忽略"
elif prefix >= 3 and prefix < len(B):
    rest = [r for r in sig_runs if r[1] > B[prefix - 1] + TOL]
    rest_cnt = len(B) - prefix
    if len(rest) == 1 and rest[0][5] >= 0.9 * rest_cnt and abs(run_d(rest[0])) > TOL:
        d2 = run_d(rest[0])
        verdict = (f"前綴相同至 {B[prefix - 1]:.2f}s（前 {prefix} 個切點沒動），之後整段平移 {fmt_d(d2)}"
                   f"——{B[prefix - 1]:.1f}s 與 {rest[0][1]:.1f}s 之間{'插入' if d2 > 0 else '刪掉'}了約 {abs(d2):.1f}s")
    else:
        verdict = f"前綴相同至 {B[prefix - 1]:.2f}s（前 {prefix} 個切點沒動），之後重剪"
elif len(sig_runs) >= 2 and sum(r[5] for r in sig_runs) / len(B) >= 0.5:
    verdict = f"局部重剪——{len(sig_runs)} 段各自平移，見下表"
elif ratio_new < 0.3:
    verdict = "完全重排——切點序列對不上，全部重新判讀（讀新的 contact sheet，錨點全部重定）"
else:
    verdict = "部分重排——只有零星段落吻合，建議按下表逐段確認"
print("判定：" + verdict)

# 6) 對照表
print()
print("新版區間          舊版對應區間        偏移      切點數  說明")
for r in runs:
    dq, b0, b1, a0, a1, c = r[:6]
    if dq is None:
        print(f"{b0:7.2f}-{b1:<7.2f}   （無對應）          —         {c:3d}   新版新增／重剪的段落，需重判讀")
    else:
        d = run_d(r)
        note = "沒動" if abs(d) <= TOL else "平移"
        print(f"{b0:7.2f}-{b1:<7.2f}   {a0:7.2f}-{a1:<7.2f}   {fmt_d(d):>8}  {c:3d}   {note}")
# 舊版被刪的切點
used = set(a for _, p in seg if p for a in [p[1]])
dropped = [a for a in A if a not in used]
if dropped:
    # 壓成範圍
    rngs = []; s = dropped[0]; e = dropped[0]
    for a in dropped[1:]:
        if a - e <= 5.0: e = a
        else: rngs.append((s, e)); s = e = a
    rngs.append((s, e))
    print()
    print("舊版有、新版沒有的切點區間（被裁掉或重剪）：" + "、".join(f"{s:.2f}-{e:.2f}s" for s, e in rngs))

# 7) 錨點換算：舊 prompt 的秒數 → 新版秒數。單一平移直接加偏移；分段時找錨點落在哪個吻合段（舊版座標）
single = abs(best_d) > TOL and (ratio_new >= 0.9 or converged)
if single:
    print()
    print(f"prompt 錨點換算：新秒數 = 舊秒數 {'+' if best_d >= 0 else '-'} {abs(best_d):.2f}；超出新片長的錨點要刪")
elif sig_runs:
    print()
    print("prompt 錨點換算：分段——錨點落在哪個舊版區間就套那段的偏移；落在重剪區的錨點要重判讀")
if anchors:
    outs = []
    for tok in anchors.split(","):
        tok = tok.strip()
        if not tok: continue
        try: t = float(tok)
        except ValueError: continue
        if single:
            nt = t + best_d; flag = "" if 0 <= nt <= dur else "（超出新片長，刪）"
            outs.append(f"{t:g}s→{nt:.1f}s{flag}")
        elif sig_runs:
            # 找最近的吻合段（舊版座標），距離 >3s 視為落在重剪區
            best = None
            for r in sig_runs:
                a0, a1 = r[3], r[4]
                dist = 0.0 if a0 <= t <= a1 else min(abs(t - a0), abs(t - a1))
                if best is None or dist < best[0]: best = (dist, r)
            if best and best[0] <= 3.0:
                nt = t + run_d(best[1]); flag = "" if 0 <= nt <= dur else "（超出新片長，刪）"
                outs.append(f"{t:g}s→{nt:.1f}s{flag}")
            else:
                outs.append(f"{t:g}s→？（重剪區，重判讀）")
        else:
            outs.append(f"{t:g}s→？（無吻合段）")
    print("  " + "、".join(outs))
PY
fi

# ═══════════════════════════════════════════════
# 抽幀 ＋ contact sheet（原有輸出，格式不變）
# ═══════════════════════════════════════════════
if [ "$MUSIC" = "0" ] && [ "$NOFRAMES" = "0" ]; then
  # ─── 抽幀（連續編號，方便後面按批拼圖）─────────
  echo
  echo "─── 抽幀（每 ${STEP}s）───"
  mkdir -p "$OUT/frames"
  rm -f "$OUT/frames"/f*.jpg "$OUT"/sheet*.jpg
  idx=0
  t=0
  while [ "$(awk -v t="$t" -v d="$DUR" 'BEGIN{print (t<d)?1:0}')" = "1" ]; do
    ffmpeg -v error -ss "$t" -i "$VIDEO" -frames:v 1 -vf "scale=440:-1" -q:v 4 \
      "$OUT/frames/f$(printf %04d "$idx").jpg" -y 2>/dev/null
    idx=$((idx + 1))
    t=$(awk -v t="$t" -v s="$STEP" 'BEGIN{printf "%.3f", t+s}')   # 浮點累加，STEP 可為 0.5 之類的小數
  done
  echo "$idx 張（f0000 = 0s，每張 +${STEP}s）"

  # ─── 拼 contact sheet：每張 24 格（4x6）─────────
  # 用 image2 的 -start_number 分批，比 glob 或 concat 可靠。
  # tile 湊滿 24 格才輸出一張，最後不足的那批會由 EOF flush 補齊。
  PER=24
  SHEET=1
  start=0
  while [ "$start" -lt "$idx" ]; do
    FROM_SEC=$(awk -v a="$start" -v s="$STEP" 'BEGIN{printf "%g", a*s}')
    ffmpeg -v error -start_number "$start" -i "$OUT/frames/f%04d.jpg" \
      -vf "scale=370:-1,tile=4x6:margin=6:padding=6:color=black" \
      -frames:v 1 -q:v 3 "$OUT/sheet${SHEET}_from${FROM_SEC}s.jpg" -y 2>/dev/null
    [ -f "$OUT/sheet${SHEET}_from${FROM_SEC}s.jpg" ] || break
    SHEET=$((SHEET + 1))
    start=$((start + PER))
  done
fi

echo
echo "─── 產出 ───"
ls -1 "$OUT"/sheet*.jpg 2>/dev/null | sed 's/^/  /'
[ -f "$OUT/cuts.txt" ] && echo "  $OUT/cuts.txt"
[ -f "$OUT/energy.txt" ] && echo "  $OUT/energy.txt（每 0.5s RMS dB）"
[ -f "$OUT/gaps.txt" ] && echo "  $OUT/gaps.txt（人聲空窗起訖）"
echo
if [ "$MUSIC" = "0" ]; then
  if [ "$NOFRAMES" = "0" ]; then
    echo "讀圖規則：檔名 fromNs 是左上角第一格的秒數，之後每格 +${STEP}s，由左至右、由上至下 4 欄 6 列。"
  fi
  if [ "$HAS_AUDIO" = "0" ]; then
    echo "本片無音軌：把畫面內容對到上面的密度表，再寫 prompt。黑畫面 placeholder 不算低谷。"
  elif [ "$SILENT" = "1" ]; then
    echo "音軌幾乎靜音：把畫面內容對到上面的密度表，再寫 prompt；峰值位置回到畫面判讀。黑畫面 placeholder 不算低谷。"
  else
    echo "把畫面內容對到上面的密度表與能量表，再寫 prompt。"
    echo "空窗＝音樂可獨佔聲場的峰值候選；最吵視窗＝配樂必須透明。黑畫面 placeholder 不算低谷。"
  fi
else
  echo "現成曲銜接：新 cue 用同一 BPM 家族；在「最後飽滿」秒數附近 prelap 進場，"
  echo "前 2–4s 只留低層（Open hushed），不要在對方還飽滿時搶進。"
fi
