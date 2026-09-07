---
name: video-score-prompt
description: |
  影片配樂分析與 AI 配樂 prompt 產生器——先用 ffmpeg 量測影片的實際剪輯節奏與切點密度、讀畫面判讀戲劇曲線，
  再產出可直接貼進 ElevenLabs Music（或其他 AI 音樂工具）的英文 prompt，並附剪接對位表。
  當使用者提到「配樂」、「幫這段影片配樂」、「BGM」、「音樂 prompt」、「配樂 prompt」、「ElevenLabs 配樂」、
  「Eleven Music」、「AI 生配樂」、「這段的音樂起伏」、「高潮在哪」、「配樂節奏」、「情緒曲線」、
  「音樂要對到哪一秒」、「配樂太史詩」、「配樂不夠喜劇」、「重新剪過了配樂要調」、「suno prompt」、
  「背景音樂」時，務必觸發此 skill。即使使用者只是丟一個影片檔說「你分析一下這段配樂該怎麼做」、
  「幫我想這段的音樂」、「這段要什麼感覺的音樂」、「配樂重新給我一版」、「我改了剪輯你調一下」也應觸發。
  適用喜劇、動畫、劇情、廣告、形象片等任何需要配樂的影片段落，也適用於使用者已生成過配樂但覺得調性不對、
  要求調整（更喜劇／更輕／高潮不要拖／後面不要再起）的情況。
  本 skill 的核心主張是「絕不憑畫面猜測寫 prompt」——一律先量測再判讀。
---

# 影片配樂 Prompt

這份主檔只放流程、判斷分支與路由；詞彙、手法、平台事實都在 `references/`，命中情境才讀對應檔（見文末「延伸閱讀」）。

## 核心原則：先量測，再判讀，才寫字

配樂 prompt 的品質幾乎完全取決於前置工作。憑檔名或印象寫出來的 prompt，時間點一定對不上，情緒曲線也會落在錯的地方。

**流程是不可跳的四步**：

1. 量測——跑腳本拿時長、切點、密度曲線、**音軌能量／人聲空窗**、contact sheet。重剪時加 `--prev` 比對舊版；有現成曲要銜接時對那首曲子跑 `--music`
2. 判讀——讀 contact sheet，把畫面內容對到密度與能量數據上，定出情緒曲線、高潮點、轉折點；決定要不要拆成多段 cue
3. 寫 prompt——先對類型取骨架、再照模板填錨點，全域鐵則放第一段，控制在 900 字元內
4. 交付三件套——prompt（附字元數）＋關鍵選擇的理由＋剪接對位表（含必保點與容忍度）；多段變奏加拼接表

使用者是專業剪輯師：講結論、給可執行的選項，不要列問題請他選。只有「這場是喜劇還是悲劇」「黑畫面是不是 placeholder」這兩件事值得停下來確認。

## 步驟一：量測

腳本在本 skill 資料夾的 `scripts/analyze_video.sh`。下面的 `$SKILL` 代表這個 SKILL.md 所在的目錄：裝在使用者層時是 `~/.claude/skills/video-score-prompt`，裝在專案層時是 `<repo>/.claude/skills/video-score-prompt`。先用 `ls` 確認哪一個存在再執行。

```bash
SKILL=~/.claude/skills/video-score-prompt; [ -d "$SKILL" ] || SKILL=.claude/skills/video-score-prompt

# 一般情況
"$SKILL"/scripts/analyze_video.sh "<影片路徑>" [輸出目錄] [抽幀間隔] [場景閾值]

# 使用者說「我重新剪了」：帶舊版的 cuts.txt 比對，並把舊 prompt 的錨點一併換算成新版秒數
"$SKILL"/scripts/analyze_video.sh "<新版影片>" <新輸出目錄> --prev <舊輸出目錄>/cuts.txt --anchors "4.9,43,63.5"

# 前段是現成曲、後段要接 AI 新曲：先量那首現成曲（BPM 家族＋交接縫）
"$SKILL"/scripts/analyze_video.sh "<現成曲.mp3>" <輸出目錄> --music

# 只要數據不要圖（重跑比對、調門檻、拆 cue 重量子區段時快很多）
"$SKILL"/scripts/analyze_video.sh "<影片路徑>" <輸出目錄> --no-frames
```

一次產出：規格、音軌是否靜音、切點清單（`cuts.txt`）、每 5 秒密度長條圖、**每 2／4／5 秒的音軌能量長條圖與人聲空窗清單**（視窗依片長自動；`energy.txt`、`gaps.txt`）、contact sheet（每張 24 格）。`--prev` 另產「重剪比對」判定與對照表；`--music` 另產 BPM 估計與交接縫位置。其他選項（`--energy-win`、`--gap-db`、`--gap-min`）見 `analyze_video.sh --help`。

預設每 2 秒抽一幀。動作密集的段落之後可以用 1 秒間隔對那一段再抽一次，看清楚細節。

**音軌資訊要看，能量表更要看**：

- 腳本報「幾乎靜音」→ 純淨配樂用版，節奏只能靠畫面判讀，峰值位置回到 contact sheet 決定。
- 腳本報「有聲」→ 往下看「音軌能量」與「人聲空窗」兩張表。這是有旁白／SOT 的形象片最重要的一張表：
  - **空窗＝音樂可以獨佔聲場的地方＝峰值候選位置**。全片唯一的最大聲，優先落在「畫面戲劇重量最高」與「人聲空窗」的交集；交不到時，寧可把峰值往最近的空窗挪 1–2 秒，也不要疊在旁白上。
  - **最吵視窗＝配樂必須透明**。這些秒數在 prompt 裡交代 `thin, sparse mid-range, under the voice`；旁白貫穿的片子整段都要 `never competes with the narration`。人聲之下怎麼配器、旋律放哪，讀 `references/arrangement-theory.md` 第九節。
  - 空窗門檻預設為峰值 -20dB；環境音大的素材用 `--gap-db -30` 之類調整，門檻值印在表頭，判讀時看一下合不合理。
- 兩張表要一起讀：切點密度是「畫面有多忙」，能量是「聲音有多滿」。密而空（快剪＋沒人講話）＝音樂可以放開；密而滿（快剪＋SOT）＝音樂走透明長線，把打點讓給音效。

### 量測時的三條鐵則

1. **黑畫面 placeholder 不算低谷。** 使用者常在還沒補素材的位置放黑畫面或字卡。這些位置在切點表上是長鏡頭、在能量表上是靜音，看起來像該留白，其實之後會補進素材。判讀前先問一句「黑畫面是 placeholder 嗎」；是的話，曲線照前後段的走勢連過去，不要為它們設低谷或急停。
2. **重剪一律跑 `--prev`，不憑印象。** 判定結果直接決定要不要重判讀（見「重剪比對」一節）。
3. **有現成曲要接，先量現成曲再寫新 cue。** BPM 家族與交接縫位置都是量出來的，不是聽個大概（見「現成曲風格銜接」一節）。

### 沒有影片時的降級路徑（分鏡階段、動畫未完成、只拿到切點表或量測摘要）

不拒絕、不追問，照數據寫：跳過抽幀與讀圖，用分鏡／切點表／音軌摘要定段落與錨點，類型與方向照 3-0 查表。交付時在對位表上方標一行「**未讀畫面**：急停格（幻想破滅那一格）與峰值格待影片確認，錨點以分鏡秒數為準」，並把需要看畫面才能定的點（急停、峰值、hit）在對位表標「待確認」。影片到手後只補跑量測、核對這幾個點，不重寫 prompt。

## 步驟二：判讀

讀每張 contact sheet。檔名的 `fromNs` 是左上角第一格的秒數，之後每格加上抽幀間隔，4 欄 6 列由左至右、由上至下。

判讀時要產出三樣東西：

**逐段時間軸**——每段的起訖、畫面內容、情緒、強度（1–10 主觀刻度）。

**高潮點**——全片唯一的最大聲在哪一秒。這要靠讀畫面決定，不是看密度。密集區與高潮區經常不是同一處，詳見 `references/scoring-craft.md` 第一節。

**轉折點**——喜劇的笑點、情緒的反轉、氣勢的垮塌各在哪一秒。這些是 prompt 裡最需要明確寫出時間碼的地方。

三樣產出之後，再過四道判斷：

**峰值位置的雙重條件**——高潮點由畫面決定，但最終落點還要過一道人聲空窗的檢查：峰值那 2–3 秒必須沒有旁白／SOT。有旁白貫穿的片子，最大聲只能落在空窗裡；空窗太短（<3s）就把峰值做成「一擊」而不是「一段」。兩個補充：
- **hit／sting／dead stop 不受空窗限制**——它們短於一拍，疊在對白上反而是喜劇慣例（反轉揭曉那一下就該壓在台詞上）。空窗約束的是「峰值段落」，不是「打點」。
- **峰值段落與最近空窗距離 >2s 時**：峰值改落到那個空窗（通常是主標／logo／轉場），原視覺高潮點降級成一記 `held back` 的一擊（`powerful but deliberately held back, no choir yet`）或改寫成 `pull back to a hush`（先蹲再跳，讓空窗裡的峰更跳）。不要把峰值硬塞在旁白上，也不要只挪 1–2 秒然後仍疊在人聲上。

**轉折顯著度鐵則**——多段變奏（驚悚→浪漫→喜劇這類）的片子，每個轉折都必須「聽得出來」，而且每次重抽都要出來。判讀時對每個轉折標出：轉折那一格畫面是什麼、要硬切還是滑過、前後各留幾拍。喜劇急停點要選「幻想破滅的那一格」（例如女主皺眉）而不是「現實物件出現的那一格」（例如停標誌）——死寂蓋住表情，音樂再跟著物件同步懟出來，落差才成立。

**要不要拆成多段 cue**——符合任一條就拆：
- 風格硬切 ≥3 次（每次都要 `stops dead — instant cut`）
- 中間需要 ≥3 秒的完全靜音（模型對 `TOTAL SILENCE` 服從度低）
- 全長 >90 秒且前後段風格差異大

拆了之後每段 cue 各自量測（`--no-frames` 對子區段重跑，或直接以時間碼分段），每段對著明確的刀點寫，之後才拼得起來。不拆的話，一次生 3–4 版、跨版本挑段落拼接，這是多段變奏的常態工法，交付時要先講（見「多段變奏 cue」一節）。

**半秒錨點**——`13.5s`、`66.5s` 這種半秒錨點可以用，但只給 hit 類事件、全曲不超過 3 個；模型對 0.5 秒精度時好時壞，段落轉換一律用整秒。

判讀完成後，先把結論講給使用者聽再寫 prompt。特別是**這場戲是喜劇還是悲劇**的判斷——它取決於作品整體意圖而非單場，判斷錯了整場配樂都會錯。若不確定，講出你的判斷依據並讓使用者確認。

## 步驟三：寫 prompt

### 3-0. 先定類型與方向，再動筆

判讀完、寫字前，先做兩次查表，不要從零推敲：

1. **對類型取骨架**——查 `references/genre-playbooks.md`：用「使用者的話 → 類型索引」對到 22 型之一，選 A／B／C 方向（先問「這個案主怕什麼」：怕俗、怕太中國、怕太商業），取該型 ≤600 字元的骨架與「必寫反面詞（≤3）」。同時命中多型時：**交付對象／用途（標案、局處形象、廣告）優先於題材詞（地創、職人、廟宇）**，題材型只借配器；仍拿不定就以「結尾字卡／logo 所屬的那型」為主。使用者說「不要太中國風」「不要俗氣」時，同檔第一節有逐樂器替代表。
2. **取轉折手法與編曲動詞**——查 `references/arrangement-theory.md`：轉折點要用哪種打點／停止／推升／落下／回來手法（第七節工具箱，推升與落下成對出現）、高潮曲線用哪種原型（第五節）、配器加減法怎麼寫（第四節 `ease down layer by layer`）、想要的情緒對應什麼音色（第八節人格表）、切點間隔換算 BPM（第六節完整表，含 half-time 與「換算值落在類型範圍外時取每刀拍數」規則）。
3. **要 hook／記憶點／主題貫穿時**——使用者說「結尾要有記憶點」「一聽就記得」「主題要貫穿」，查 `references/melody-craft.md` Hook 節（短、重複微變、可唱、早出現四要件）與 leitmotif 節（再現時每次變形）；hook 句算一個正面句，寫進第一段或收尾段。

算式：**骨架＋這支片的量測錨點＋該型必寫反面詞（≤3）＝目標 800–900 字元**；選寫反面詞有預算才加。骨架刻意留空給錨點，不要直接貼骨架交付。

### 模板

**全域鐵則放第一段。** 管整首曲子的規則（`Instrumental, no singing`、`mickey-mousing every gag`、`hard genre switches on cue`、`Every mood switch must be clearly heard — distinct, never smoothed over`）一律放第一段；管某一段的反面詞放在那一段的描述之後。位置錯了就管不住。

五段結構，這是實戰驗證過最穩的骨架（60 秒原型）：

```
[類型] score, [時長]s, [場景/氛圍] — [全域鐵則，如 mickey-mousing every gag]. [樂器清單]. Instrumental, no singing.

[開場描述]，含 BPM 與調性。[第一個轉折] at [N]s.

[中段動作]。At [N]s [事件]，含速度切換。[轉折] at [N]s.

At [N]s [高潮] — [一擊的描述], then stop dead. [持續多久].

From [N]s to the end: [收尾情緒], [樂器], [BPM]. [反面詞防守].
```

### 多段變奏模板（驚悚→浪漫→喜劇這類一曲多風格）

```
[全域鐵則] Instrumental, no singing. Hard genre switches on cue — every mood switch must be clearly heard, distinct, never smoothed over. No intro, no build-up.

[段 A 0–Ns] [風格 A 描述，含 BPM]. At [N]s stops dead — instant cut, one beat of silence.

[段 B N–Ms] Crash straight into [風格 B] — instantly full, no build-up. [段內事件 at Xs]. [段 B 反面詞].

[段 C M–end] Snaps back to [風格 C]. [收尾方式]. [段 C 反面詞].
```

要點：每段開頭用硬動詞（`crash straight into`、`snaps back`、`slams into`）而不是 `sneaks`、`drifts`；段與段之間的刀點寫兩次——「前一段 stops dead at Ns」＋「後一段 at Ns」——模型才會真的切。

### 依長度配置錨點

一個錨點＝一句帶時間碼的音樂事件（約 60–90 字元）。經驗值：**每 20–25 秒最多 1 個，全曲不超過 6 個**，超過模型會全部鬆掉。

| 片長 | 錨點數 | 目標字元 | 備註 |
|---|---|---|---|
| 10s | 1 | 250–450 | 一句定調一句收；`no intro` 必寫 |
| 20s | 1–2 | 400–550 | 廣告 cutdown、短影音；hook 在前 2 秒算正面句不算錨點 |
| 30s | 2–3 | 500–700 | 廣告與短影音甜蜜點 |
| 45s | 3 | 600–800 | 短劇單場、PSA |
| 60s | 3–4 | 700–900 | 標準配置，上面的模板原型 |
| 90s | 4 | 800–900 | 形象片、品牌故事；中段開始合併相鄰事件 |
| 120s | 4–5 | 850–900（必寫反面詞已計入） | 中段合併相鄰事件；考慮 composition plan |
| 180s+ | 5–6 | 900 | 優先拆 cue 或升 plan |

**表格優先**；表外片長取相鄰兩列內插。粗算公式只用於表外片長：錨點數 ≈ 片長 ÷ 22（四捨五入，最少 1、上限 6）；目標字元 ≈ min(900, 300＋10×秒數) ±100。公式與表格差 1 個錨點時以表格為準。兩個都是經驗值，不是模型硬限制。

錨點過多時依序保留：唯一高潮 ＞ 斷崖／急停／靜音起點 ＞ 曲風硬切點 ＞ 拉升起點 ＞ 質地變化。完整分配比例、合併規則與砍字順序見 `references/ai-model-vocab.md`「prompt 結構最佳化模板」。

### 字元預算

**上限 1000 字元，寫作時壓到 900 以下。** 超過不會報錯，會安靜截掉後半——而後半是尾段設計與反面詞，最不能丟。（1000 這個數字是實戰＋旁證，API 官方未載明，見 `references/elevenlabs-music.md`。）

寫完務必實測字元數，這是唯一驗收；每加一個錨點就順手測一次：

```bash
python3 -c "print(len(open('prompt.txt').read().rstrip()))"
```

官方明講「prompt 長度與品質不一定正相關」。寫不下就是該刪，不是該想辦法塞。優先刪形容詞與連接語，**時間錨點與該型「必寫反面詞（≤3）」一個都不能省**；選寫反面詞可砍，砍的順序照 `references/ai-model-vocab.md`「字元砍法順序」的反面詞內部優先序（點名文化樂器 ＞ 尾段不再起 ＞ 該型頑固預設一句 ＞ 情緒防守）。

### 幾個非談判的細節

- 時間點寫成 `at 43s` 而不是 `at 43 seconds`，省字元且模型讀得懂
- 音樂落點寫得比畫面早 0.2 秒，聽起來才同步
- **取整規則**：量測值先減 0.2 秒；段落轉換取整秒（四捨五入：12.4−0.2＝12.2 → `12s`，100.5−0.2＝100.3 → `100s`）；hit 類可取到 .5（四捨五入到最近的 0.5：30.2−0.2＝30.0 → `30s`，13.7−0.2＝13.5 → `13.5s`），且半秒錨點全曲 ≤3 個
- 錨點分兩級：**hit 類（撞擊、急停、ta-da button）±0.2 秒必保**，寫進對位表的必保欄；**段落轉換 ±1–2 秒可接受**，用 ±2% 變速吸收。不要把每個錨點都當 hit 寫，模型反而顧不到真正的 hit
- 高潮要明寫「不要延續」：`then stop dead`、`no sustain`、`Three seconds only`。少了這句，模型會把一擊拖成一整個樂段
- 硬斷收尾寫 `stop dead mid-phrase — no ending chord, no fade-out, no reverb tail`；模型仍常偷加 decay，交付時註明「在剪輯軟體硬切即可」，不要為此再抽
- 尾段的反面詞放在尾段描述之後才管得住尾段
- 純器樂一律 `Instrumental, no singing`；走 API 再開 `force_instrumental: true`。**例外**：要 `epic wordless choir` 或 `vocal-chop textures without words` 時，prompt 改寫 `no lyrics, no words, wordless choir only`，且不開 `force_instrumental`（它是否會連 choir 一起砍掉屬推論、未查證）
- **絕對不要在 prompt 裡寫作曲家、樂團、歌手或曲名**——會觸發 `bad_prompt`。姓氏衍生的形容詞（-ian／-esque／-style）也不要冒險。要用描述取代：想要某人的感覺，就寫出那個感覺的樂器與質地

### 第三級指令的處理

中段全靜、硬斷無 decay、半秒精度、超過 5 個錨點同時準、choir 只在指定兩處出現——這些是模型服從度最低的一級，不要指望單次生成抽中。處理順序固定：**先拆 cue 各自生成 → 其次升 composition plan（music_v2，段落時長硬鎖）→ 最後剪輯後製**（硬斷靠硬切、靜音靠留空、尾段自堆靠淡出）。三級分級的完整清單與抽次換算見 `references/ai-model-vocab.md`「指令服從度分級」。

### 換平台時

ElevenLabs 的 inline 反面詞在 Suno／Udio 不可靠。Suno：反面詞改成 Exclude 欄純名詞（≤5 項）＋ Instrumental 開關；Udio：Instrumental Mode ＋ Style Reduction。Suno 無官方公開 API（2026-07 新聞，僅合作夥伴探索）。翻譯表見 `references/ai-model-vocab.md`「選用與換平台」。

## 步驟四：交付三件套

固定順序、固定格式，使用者才能一眼比對前後版本：

**1. prompt 本體**——code block，下方一行 `字元數：NNN / 1000`（python 實測值）。多段變奏或拆 cue 時，每段 cue 各一個 code block 各附字元數。

**2. 關鍵選擇的理由**——3–6 條，每條「哪個秒數／哪個詞 → 為什麼」。必含：高潮為什麼在那一秒（畫面理由＋空窗理由）、哪個爆點被壓住、哪個反面詞不能刪。使用者是專業影像工作者，理由讓他能自己判斷要不要改。

**3. 剪接對位表**——四欄：`秒數｜音樂事件｜畫面事件｜必保／容忍`。必保＝hit 類 ±0.2s；容忍＝段落轉換 ±1–2s（±2% 變速吸收）。表下註一句「若落點偏移，優先保住：（列 2–3 個，通常是高潮與斷崖）」。

**4.（多段變奏才有）拼接表**——建議一次生幾版、每一段從哪一版取、拼接刀點在哪一秒。

可選第五項：**預估 credits**——時長（分）× 900 × 抽次（官方 900 credits／分鐘；網頁介面一次兩變體是否加倍未查證），公式與方案細節見 `references/elevenlabs-music.md`「定價」。

## 使用者要求調整時

配樂是反覆修的工作，多數對話會停在「再調一版」。以下改法全部來自實戰驗證，詞彙皆為描述性：

| 使用者說 | 真正的意思 | 改法 |
|---|---|---|
| 「太史詩了」「太正經」 | 詞彙把模型拉向交響史詩 | 清掉 `fiery`、`tutti`、`epic`、`dread`、`climax`；換成 `goofy`、`honk`、`cymbal crash`、`mock-panic` |
| 「喜劇感不夠」 | 開場定調不夠明確 | 第一句改成 `Zany ... cartoon score` ＋ `mickey-mousing every gag`；加 xylophone、slapstick percussion |
| 「有趣但不要俗氣」 | goofy／woodblock 太卡通 | `sly witty groove — nimble pizzicato, finger snaps, light shuffle drums, playful marimba — cheeky but classy`；反面 `Not corny: no slide whistle, no kazoo, no circus` |
| 「太可愛了，要有懸疑」 | marimba／finger snaps／airy pads 是可愛的來源 | 底色換 `sneaky minor-key sleuth groove — walking upright bass, muted pizzicato, vibraphone, bass clarinet, brushes`；仙氣類從 `angelic shimmer` 改 `uncanny eerie shimmer, hushed` |
| 「更喜悅」「轉折要更開心」 | 正經詞拉走了喜悅 | `joyful lift`、`bright major key`、`glockenspiel sparkle`；刪 `quiet determination` 這類偏正經的詞 |
| 「更壯觀宏大」 | 史詩等級不夠 | genre 升 `Epic ... grand and monumental`；配器 `noble horns, timpani, massive drums, epic wordless choir`；峰值詞 `towering`、`colossal`、`thunderous`。choir 只在真高潮打出（頭尾兩處呼應） |
| 「不要中國風樂器」 | 題材（廟宇、媽祖）讓模型自動加鑼 | 反面詞必須點名 `no erhu, no guzheng, no dizi, no gongs` 並給正面替代，寫在該段描述之後；逐樂器替代表見 genre-playbooks.md 第一節 |
| 「甜度不夠」「浪漫感出不來」 | 旋律載體錯了 | 主旋律交給吉他：`clean electric guitar sings the hook`（劇集片尾曲腔）或 `bright acoustic guitar, campus love-song style`；加 `honey-sweet`、`sugary` |
| 「浪漫但不要苦情」 | ballad 一詞把模型拉向傷感 | 用 `joyful ... love song`（不用 ballad）、`bright major key`、`giddy falling-in-love bliss`；段尾 `Not sad, no melancholy` |
| 「一開始就要進副歌」 | 不要前奏 | `crash straight into the chorus — instantly full, no build-up, no intro`；要更突然就在段內 `lift a key higher`（升 key 比漸強落差更大） |
| 「撞擊那下要更重」 | 多發打擊糊成一片 | `one massive slamming downbeat hit`——one＋downbeat 指定單發正拍 |
| 「高潮不要拖」「X 秒就能收」 | 高潮該是一個點不是一段 | 縮成 2–3 秒，加 `a single hit, no sustain`，把輕鬆段起點往前移 |
| 「高潮不夠跳」 | 前一段太滿，沒有落差 | 先蹲再跳：前一段改 `pull back to a hush`，峰值句不動 |
| 「太厚」「拉升提早、放穩不要厚」 | 高位段太厚、收得太晚 | `From 84s ease down layer by layer, gently thinning`、`By 90s already calm`、`textures light never thick`；抽薄順序見 arrangement-theory.md 第四節 |
| 「後面不要再起昂」「輕鬆收」 | 模型在尾段自己堆了高潮 | 加 `Never rises again`、`no build`；輕鬆收寫 `laid-back, easygoing, no big build, no push, ease onto a soft bright final chord`；更狠就 `drop the epic scale completely and never return to it` |
| 「尾端做到滿」 | 要一個明確的 button | `full flourish crescendo landing one emphatic ta-da button hit at 9.5s, tight clean stop, no fade` |
| 「中間要完全靜音」「留白」 | 模型不會真的靜音 | 先試 `TOTAL SILENCE 23s to 29s, absolutely nothing`；不服從就拆成兩段 cue 各自生成再剪 |
| 「轉折不明顯」「每次重抽轉折都要出來」 | 模型把轉折抹平了 | 全域鐵則加 `Every mood switch must be clearly heard — distinct, never smoothed over`；轉折動詞磨利（`snaps back` 而非 `sneaks back`） |
| 「換一個感覺」「再給我一版不同的」 | 要換方向，不是重抽 | 換三軸（配器家族／律動／時代感）至少兩軸，時間軸段落與錨點不動，只換第一段與 texture 詞；見 genre-playbooks.md 第一節 |
| 「這版調性跑掉」 | 可能只是抽壞 | 先同 prompt 重抽 2–3 次；同一問題連續三抽都出現才改字，優先清掉拉向史詩的詞 |
| 「濃縮一點」 | 撞到字元上限或覺得囉嗦 | 砍形容詞與連接語，保留所有時間錨點與反面詞；砍字順序見 ai-model-vocab.md |
| 「我重新剪了」 | 時間碼全變了 | **重跑量測並帶 `--prev`**。「整體平移」→ 只平移錨點不改設計；「前綴相同後段重剪」→ 前段 prompt 一字不動、後段重判讀；「完全重排」→ 全部重判讀。改動只落在真正受影響的數字，使用者才能確認你沒動不該動的地方 |

## 重剪比對

使用者說「我改了剪輯」時，不要憑印象判斷動了哪裡。用新版影片跑量測並帶舊版的 cuts.txt：

```bash
analyze_video.sh "<新版影片>" <新輸出目錄> --prev <舊輸出目錄>/cuts.txt --anchors "<舊 prompt 裡所有秒數，逗號分隔>"
```

腳本會給判定與對照表，對應動作固定如下：

| 判定 | 意思 | 動作 |
|---|---|---|
| 完全相同 | 切點序列一致 | prompt 不動；使用者可能只換了輸出設定 |
| 整體平移 ±X 秒 | 新版＝舊版裁頭或加頭 | 只把所有錨點加減 X（腳本已換算），設計、詞彙、反面詞全部不動；超出新片長的錨點刪掉 |
| 前綴相同至 N 秒，之後整段平移 | N 秒後插入或刪掉了一段 | N 秒前錨點不動，N 秒後錨點加減偏移；插入處若是新素材，只補那一段的描述 |
| 前綴相同至 N 秒，之後重剪 | 前段沒動、後段重排 | 前段 prompt 一字不改；後段讀新的 contact sheet 重判讀 |
| 局部重剪（多段各自平移） | 中間抽換了段落 | 對照表逐段套偏移；「無對應」的段落重判讀 |
| 完全重排 | 序列對不上 | 全部重判讀，把它當新片 |

交付時附上判定那一行與對照表，並列出「動了哪些數字、沒動哪些」。這是使用者驗收的依據。

## 多段變奏 cue

一首曲子要換三種以上風格時，單次生成抽中全部段落的機率很低。標準做法：

1. 判讀時就決定拆不拆（標準見步驟二）。
2. 不拆：一次生 3–4 版，逐版聽每一段，跨版本挑最好的段落拼接。每段都對著明確的刀點寫（`stops dead at 14s` ＋ `at 14s crash straight into ...`），所以任何兩版在刀點上都能對拼。
3. 拆：每段 cue 各自寫 prompt、各自 ≤900 字元、各自對自己的刀點；中間需要靜音的位置就是天然的拆點。
4. 交付多一張拼接表：建議版數、每段取哪版、拼接秒數。

## 現成曲風格銜接

情境：前段用現成曲（使用者已選定），後段要接 AI 生成的新 cue，兩者不能打架。這是量測問題，不是形容詞問題。

**1. 量 BPM 家族**——對現成曲跑 `--music`。腳本用能量 onset 自相關給「主估計＋兩個候選」，並列出半拍／倍拍。**估計值一定要人耳確認**：跟著曲子拍手 10 秒，數出來的拍才是體感 BPM。實戰例：演算法估 152，體感是 76（半拍）——新 cue 寫 76 才對，寫 152 會變成兩倍速的另一首歌。prompt 寫體感值，可補 `half-time feel` 描述律動。

**2. 讀能量曲線與交接縫**——腳本印「有聲起點／最後飽滿／實際結束／尾巴長」。尾巴 ≥2 秒 → 曲子自帶淡出，新 cue 在「最後飽滿」附近 prelap 進場，前 2–4 秒只留低層。尾巴 <2 秒 → 曲子硬收，新 cue 緊接「實際結束」用一個 hit 直接進，或在剪輯裡對現成曲自己做 2–3 秒淡出再接。能量摘要告訴你現成曲收在什麼強度：收得滿 → 新 cue 開頭 `Open hushed` 讓耳朵休息；收得弱 → 可以平接。

**3. 調性與配器（人耳判讀，腳本不估調性）**——聽出現成曲是大調亮／小調暗、主要配器是弦樂／鋼琴／合成器。新 cue 不需要同調（模型對指定 key 的服從常中非必中），但要同「色溫」：暗接暗、亮接亮，配器至少共用一件主樂器當橋。

| 現成曲收尾 | 策略 | 新 cue 開頭寫法 |
|---|---|---|
| 自帶淡出 | 交叉 prelap | `Open hushed — a single low sustained pad and soft piano only for the first 4s, no drums before 6s, then gradually fill` |
| 硬收在一個 hit | hit 對 hit | `Begins on a single massive downbeat hit at 0s, instantly full, no intro` |
| 收在懸而未決 | 靜默縫 | 剪輯留 1–2 秒空氣，新 cue `enters from silence, sparse and low` |

銜接詞彙一律描述性：`same tempo family as the preceding cue, 76 BPM with a half-time feel`、`continues the warm orchestral palette of the previous section — strings-led, piano underneath`、`matching the dark minor-key mood, then lifting into bright major at 24s`。不要寫「像前面那首」「same as the reference track」——模型看不到那首曲子，只看得到你的文字。

驗證：新 cue 生成後，把兩段放上時間線實際聽交接處 10 秒。速度不合 → 先試 ±2% 變速對拍，不行就換 BPM 家族的另一個成員重生；色溫不合 → 不是改 BPM，是改配器橋與開頭強度（更 hushed）。

## 生成後的預期

同一組 prompt 每次結果差異很大。「轉折沒出來」「靜音被填滿」先問：這條指令本來就是第幾級？

| 指令等級 | 內容 | 建議抽次 |
|---|---|---|
| 第一級（寫了就有） | 配器、情緒、大小調、曲風、質地、全域鐵則、BPM | 2 次挑一 |
| 第二級（2–3 抽中一次，落點 ±1–2s） | 整秒錨點、段落轉換、升 key、速度切換、逐層抽薄、單發 hit、直接進副歌 | 3 次挑一或拼二 |
| 第三級（服從度低） | 中段全靜、硬斷無 decay、半秒精度、>5 錨點同時準、尾段絕不再起、choir 只在指定兩處 | 3–4 次＋準備拆段 |

調性跑掉先重抽 2–3 次，同一問題連續三抽都出現才改字；真要改，優先清掉會拉向史詩的詞。第三級不要硬抽，照步驟三「第三級指令的處理」走。

## 延伸閱讀

命中情境才讀，不要預載全部：

- `references/genre-playbooks.md` — 22 種影片類型的起手式（情緒詞／配器 BPM／結構比例／必寫反面詞／失敗模式／旁白共存／A-B-C 三方向＋≤600 字元骨架），三軸多樣性機制，台灣語境「不要太中國風」「不要俗氣」逐樂器替代表。**判讀完成、動筆之前讀**；使用者說「換一個感覺」「三個版本給我挑」時也讀
- `references/arrangement-theory.md` — 編曲與樂理工藝：調式情緒速查、和聲色彩與終止式、轉調翻頁（升 key／平行大小調）、配器分層加減法順序、力度曲線五原型（先蹲再跳／瞬間全滿／雙峰呼應）、完整切點→BPM 換算表（含 half-time、拍號、旁白片 rubato）、轉折手法工具箱（打點／停止／推升／落下／回來／轉場 30+ 手法）、音色情緒人格表、人聲之下的編曲。**寫 prompt 時需要精確的分層／力度／轉折動詞，或旁白片、訪談片配樂時讀**
- `references/scoring-craft.md` — 判讀方法與基礎手法：密度與戲劇重量的區別、力度天花板分配、喜劇四手法（洩氣／急煞／mickey-mousing／斷崖）、抒情手法（破碎再現／同素材換語境／甜中藏毒）、基礎 BPM 換算。**判讀階段讀**
- `references/comedy-tension-advanced.md` — 喜劇與緊張進階：裝傻 vs 搶答兩派、反差配樂、stinger 類型學、樂器喜劇人格、節奏喜劇、道安實戰補遺；ostinato／pedal point／Shepard tone、安靜比大聲緊張、跟打點 vs 鋪長線、剪接對位行話。**基礎手法不夠用或動作／懸疑段落時讀**
- `references/melody-craft.md` — 旋律工藝：動機發展、樂句問答、輪廓與情緒、hook 要件、leitmotif 貫穿工法。**需要主題感或旋律描述詞時讀**
- `references/chinese-idioms.md` — 「要哪一種中國」：五聲調式情緒、六大地域配器、台灣在地家族、京劇鑼鼓經、西遊記配方、嗩吶兩副面孔，末尾「反向：不要中國風時」。**任何中國風或台灣民俗需求先讀這份再寫**；「不要太中國風」則先讀 genre-playbooks.md 第一節
- `references/ai-model-vocab.md` — 三家模型（ElevenLabs／Suno／Udio）詞彙效度：已驗證有效詞（全域鐵則／情緒／配器／動態動詞／反面詞）、無效與會報錯的寫法、指令服從度三級與抽次換算、依片長的錨點預算與砍字順序、換平台語法差異。**prompt 不聽話、字數超標、或跨平台時讀**
- `references/elevenlabs-music.md` — ElevenLabs 平台事實（2026-09-02 查證）：純 prompt 字元上限與參數、時長上限的官方矛盾、composition plan（chunk 結構為 music_v2 專用）與何時該從 prompt 升級到 plan、video_to_music、定價與 credits 估算、地雷清單、未查證清單。**要走 API、需要精準對齊剪輯點、估成本、或撞到 bad_prompt／截斷時讀**

重剪比對、多段變奏、現成曲銜接三個流程在本檔對應小節，不另設參考檔。

### 實戰規則的正本位置（改規則只改正本，其他檔一行指回）

同一條實戰結論不在多份檔各寫一遍，避免日後漂移：

| 規則類別 | 正本 | 例 |
|---|---|---|
| 平台行為 | `references/elevenlabs-music.md`「地雷清單」 | 1000 字元靜默截尾、`force_instrumental` 與 wordless choir 衝突、結尾偷加 decay、中段全靜服從度低、`bad_prompt` |
| 詞彙效度與預算 | `references/ai-model-vocab.md` | 樂器否定兩條規則（點名 `no erhu, no guzheng, no dizi, no gongs` 的分流）、半秒錨點 ≤3、反面詞優先序、砍字順序、錨點預算 |
| 手法 | `references/arrangement-theory.md` | 急停選「幻想破滅那一格」、先蹲再跳、逐層抽薄、轉折工具箱、BPM 換算 |

其他檔提到這些規則時只寫一句＋指回正本，不重述內容。
