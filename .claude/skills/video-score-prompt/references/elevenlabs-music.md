# ElevenLabs Music：參數、限制與實戰地雷

用途：要走 API、要精準對齊剪輯點（composition plan）、要估 credits、或撞到 `bad_prompt`／截斷／時長問題時查。純寫 prompt 的詞彙效度在 ai-model-vocab.md。

查證日期 2026-09-02（前版 2026-07-26）。官方文件會變，數字有疑慮時重查：
- API 參考 `elevenlabs.io/docs/api-reference/music/compose`
- composition plan 指南 `elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans`
- prompting 最佳實務 `elevenlabs.io/docs/overview/capabilities/music/best-practices`

可信度標記：【官方】官方文件原文、【實戰】本 skill 真實使用者驗證、【第三方】非官方來源、【未查證】查不到官方依據。標記不可升級。

## 三條路，先選對

| 路徑 | 何時用 | 時間控制精度 | 模型 |
|---|---|---|---|
| **純文字 prompt** | 大多數情況。快、可在網頁介面直接貼 | 中——時間點是引導，不是保證 | v1 / v2 |
| **composition plan** | 需要精準對齊剪輯點、多段變奏、中段真正靜音時 | 高——每段 duration_ms 硬鎖（v2） | v1／v2 都接受 plan【官方 compose 參考頁】；**chunk 結構的 plan 需 music_v2**【官方 how-to 頁】。本 skill 只用 v2 chunk plan |
| **video_to_music** | 想讓模型自己看畫面 | 低——但省去人工判讀 | — |

實務順序：**先 prompt 抽 2–3 次，不行再升 plan**。plan 只能走 API，網頁介面貼 prompt 對使用者最快。

## 純文字 prompt

### 字元上限

**網頁介面實戰上限 1000 字元，寫作時壓到 900 以下。**

- 988 字元的 prompt 在網頁介面被截斷【實戰】；2026-09 四支影片二十餘輪迭代反覆確認：初稿常落在 930–1010，超過就靜默截尾【實戰】
- compose 端點的 `prompt` 參數，官方 API 文件**未載明長度上限**（2026-09 再查證仍無）【官方】
- `video_to_music` 的 `description` 明載 ≤1000 字元【官方】——與實戰上限一致，可視為同一套限制的旁證，但**不等於 compose 端點的官方上限**
- 超過上限**不會報錯**，會安靜截掉後半——後半正是尾段設計與反面詞，最不能丟【實戰】
- 全形符號與 `—` 破折號在不同計算方式下可能不只算一個字元，這是留 100 字元餘裕的原因【實戰】

寫完務必實測：`python3 -c "print(len(open('prompt.txt').read().rstrip()))"`

### 參數（`POST https://api.elevenlabs.io/v1/music`）【官方，2026-09-02】

| 參數 | 型別 | 說明 |
|---|---|---|
| `prompt` | string | 文字描述。**不能與 `composition_plan` 併用** |
| `music_length_ms` | int | 3,000–600,000。**只與 `prompt` 併用**；不給則模型自行決定 |
| `model_id` | enum | `music_v1`（API 預設，過渡期）／`music_v2`。網頁介面預設已是 v2；官方明講過渡期後 API 也會改 v2 預設 |
| `force_instrumental` | bool | 預設 false。官方原話「Guarantees that the generated song will be instrumental」。**只在 prompt 模式可用** |
| `composition_plan` | object | 不能與 `prompt` 併用；接受 `MusicPrompt` 或 `CompositionPlan` 結構 |
| `seed` | int | 官方：同 seed 同參數「有助於一致，但不保證完全重現」。**不能與 `prompt` 併用**（只在 plan 模式） |
| `respect_sections_durations` | bool | 預設 true。針對 **music_v1 的 plan**（v1 接受另一種 sections 結構）；v2 忽略（v2 chunk 段落時長恆為硬鎖） |
| `store_for_inpainting` | bool | 預設 false。保存輸出供之後局部重生 |
| `finetune_id` | string | 自訂微調模型 ID（Music Finetunes） |
| `sign_with_c2pa` | bool | 預設 false，僅 mp3 |
| `output_format` | query enum | 預設 `auto`；格式 `codec_sample_rate_bitrate`（如 `mp3_44100_128`）。mp3 192kbps 需 Creator 以上、PCM 44.1kHz 需 Pro 以上 |

另有 `POST /v1/music/detailed`（文件頁 compose-detailed）：多兩個參數 `with_timestamps`、`with_waveform_visual`，回傳 multipart（audio ＋ composition_plan ＋ song_metadata）。要拿模型實際採用的段落結構回來對照剪輯點時用這個【官方】。

另有 stream 端點（文件頁 `music/stream`），本 skill 用不到，不展開。

### 時長上限：官方文件自相矛盾，做長片前先實測

- 能力總覽頁：「minimum duration of 3 seconds and a maximum duration of 5 minutes」【官方】
- compose API：`music_length_ms` 上限 600,000ms（10 分鐘）【官方】
- 產品頁（eleven-creative/products/music）：「the maximum is 10 minutes」【官方】
- composition plan 總長上限 10 分鐘【官方】

矛盾未解，本檔不裁定。實務規則讓上限失去影響：**單支 cue 不要超過 3 分鐘**——不是因為上限，而是錨點越多越抽不中（見 ai-model-vocab.md「指令服從度分級」）；長片以剪輯硬切點拆成多個 cue 各自生成，銜接處寫 `Open hushed` 並保持同 BPM 家族【實戰】。

## composition plan（本 skill 只用 music_v2 的 chunk 結構）【官方，2026-09-02／2026-09-03 複查】

不能與 `prompt` 併用。兩個模型都吃 plan，但結構不同：compose API 參考頁明載 `composition_plan` 可用於 music_v1 與 music_v2；**chunk 結構的 plan（下面這種 `chunks[]`＋`positive_styles`／`negative_styles`）需 `model_id: music_v2`**（how-to 頁明文）；music_v1 接受的是另一種 sections 結構，`respect_sections_durations` 就是針對 v1 plan 的旗標。本 skill 只用 v2 chunk plan，v1 plan 不展開。結構：

```json
{
  "model_id": "music_v2",
  "composition_plan": {
    "chunks": [
      {
        "text": "[Intro] {tiptoe pizzicato}",
        "duration_ms": 8000,
        "positive_styles": ["sneaky minor-key sleuth groove", "walking upright bass",
                            "muted pizzicato", "vibraphone", "bass clarinet", "brushes", "92 BPM"],
        "negative_styles": ["vocals", "epic drums", "slide whistle", "kazoo"],
        "context_adherence": "high"
      }
    ]
  }
}
```

限制與官方建議：

- 每段 3,000–120,000ms；最多 30 段；總長 3 秒至 10 分鐘
- `positive_styles`／`negative_styles` 各最多 50 項；**styles 必須是英文**（歌詞可任何語言）
- `context_adherence`：`low`／`medium`／`high`（預設 high）
- 官方原話：「The first chunk is the most important: its styles set the overall tone and genre for the whole song」——**第一段的 styles 決定全曲基調**（與純 prompt「全域鐵則放第一段」同構）
- 官方建議前幾段各放 **6–7 個 styles** 直到方向確立；要具體（`warm acoustic guitar with light fingerpicking` 勝過泛稱）
- 官方原話：「Use negative styles liberally to prevent unwanted sounds」——**plan 模式的 negative_styles 是官方鼓勵大量使用的專用欄位**，與純 prompt 裡 inline 否定樂器名詞的不可靠不同（見 ai-model-vocab.md 第二表）。要擋 `erhu`、`gongs`、`slide whistle` 這類樂器，plan 模式是最乾淨的地方
- `text` 欄位可含 `[Section name]` 方括號段名、歌詞行、與 `{...}` 大括號 inline 指令（如 `{guitar solo}`、`{scratching}`）；曲風、配器、人聲風格這類全域特性放 `positive_styles` 不放 text
- 歌詞每段 ≤30 行、每行 ≤200 字元；段名 1–100 字元
- styles 提到藝人或受著作權保護內容 → `bad_composition_plan` 錯誤，附替代建議

**v2 段落時長恆為硬鎖**：`respect_sections_durations` 只影響 v1【官方】。第三方實測（DevelopersIO 部落格，2026）：指定 4000／8000ms 等段長，產出檔長精確吻合（32.040s）；純器樂段用 `[Soft Intro]`＋`{instrumental hook}` 標記即可，不需歌詞【第三方】。

**plan 模式的 instrumental**：`force_instrumental` 只在 prompt 模式可用。plan 模式要純器樂，每段 `negative_styles` 放 `vocals`、`singing`、`lyrics`，`text` 只放段名與 `{...}` 指令、不放任何歌詞行。這是實務歸納，非官方明文【未查證】。要 wordless choir 時 `negative_styles` 只放 `lyrics`、`words`，不放 `vocals`【未查證】。

**先請模型產 plan 再改**：`create-composition-plan` 端點（文件頁 `api-reference/music/create-composition-plan`）吃 `prompt`＋`music_length_ms`（3,000–600,000）＋可選 `source_composition_plan`，回傳 plan JSON。用法：把 900 字元 prompt 丟進去拿一份初始 plan，人工把 `duration_ms` 對到剪輯刀點，再送 compose。確切 URL path 以文件頁為準【官方，path 未逐字抄錄】。

### 何時該從 prompt 升級到 plan

- 使用者要求**中段全靜**（如 `TOTAL SILENCE 23s to 29s`）——純 prompt 服從度低【實戰】；plan 可把該段獨立成一個 chunk，`positive_styles` 放 `silence`、`no sound`（效果未查證），或乾脆不生成那段、剪輯時留空
- **多段硬切變奏**（驚悚→韓劇→喜劇）——純 prompt 一次抽中全部轉折的機率低，要生 3–4 版跨版本拼【實戰】；plan 每段獨立 styles，轉折在段界天生成立
- **總長超過 120 秒且錨點 ≥5 個**——prompt 字元預算撐不住
- **choir 或某樂器只准出現在指定段落**——純 prompt 屬第三級服從度；plan 只在那幾段的 `positive_styles` 放它、其餘段 `negative_styles` 擋它

升級前的順序（第三級指令的標準處理）：拆 cue 各自生成 → 升 plan → 剪輯後製。硬斷結尾的 decay 直接剪輯硬切，不走這條路。

## video_to_music【官方，2026-09-02】

`POST https://api.elevenlabs.io/v1/music/video-to-music`，multipart form：

- `videos` — 必填，1 至 10 個影片檔，合計 ≤200MB、總長 ≤600 秒
- `description` — 選填，≤1000 字元
- `tags` — 選填，≤10 個風格標籤（如 `cinematic`、`upbeat`）
- `model_id` — 選填
- `sign_with_c2pa` — 選填，僅 mp3
- `output_format` — query，同 compose

```bash
curl -X POST "https://api.elevenlabs.io/v1/music/video-to-music?output_format=mp3_44100_128" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -F "videos=@scene.mp4" \
  -F "description=..." \
  -F "tags=cinematic" \
  --output score.mp3
```

值得試，但別把它當成免除判讀的理由。它看得到畫面，看不到你的意圖——哪一段是假高潮、哪個笑點要壓住、尾段該不該再起，這些都要靠 `description` 講清楚。**把人工判讀寫成的 900 字元 prompt 直接當 description 餵給它**（同一份字剛好在 1000 上限內），是最好的用法。

網頁介面是否有對應的「上傳影片配樂」功能：官方產品文件未提及【未查證】。

## 其他 v2 能力（與本 skill 的關係）

- **Audio Reference**：上傳約 30 秒參考音檔引導「整體音色、製作風格、配器、速度、情緒」；官方明講**不是設計來做曲風轉換**；每個參考檔先過著作權檢查，設計給「你自己做的音樂」。**用途**：「新 cue 要接現成曲」的風格銜接，可拿使用者自製的前段 cue 當參考——拿版權曲當參考會被擋【官方】
- **Inpainting**：網頁介面選一段重生、不動其餘；v2 品質改善。**用途**：一版抽到 90% 對、只有轉折段跑掉時，比整曲重抽划算【官方】
- **Extend／`+` 加段**：介面可在曲末逐段加新段落。**用途**：主題貫穿（先生 intro 確立主題再續寫，見 melody-craft.md）【官方】
- **Music Finetunes**：`finetune_id`。本 skill 不使用
- **Sound effects embedded inside tracks**：v2 可在曲內嵌音效。喜劇 stinger（`slide whistle drop`、`jaw harp boing`）在 v2 命中率理論上較高【官方能力，效果未查證】

## 定價

- 官方定價頁：「Eleven Music 900 credits per minute」【官方】
- 官方：「Credits are charged per generation request, not per download」；內容與設定不變時可能有少量免費重生【官方】
- 第三方稱網頁介面預設一次產兩個變體、實際一分鐘成品約 1,800 credits【第三方，未查證】
- 商用授權：Starter 以上含「Music commercial use」；Free 不含【官方定價頁】。方案 credits 數與價格會變，接案前重看定價頁

估算公式（交付時可選附上）：**時長（分鐘）× 900 × 抽次**。一支 90 秒 cue 抽 3 次 ≈ 1.5×900×3 = 4,050 credits；若兩變體計價則加倍（未查證）。多段變奏 cue 依 ai-model-vocab.md 抽次表用 3–4 次計。

## 官方 prompting 指引摘要（best-practices 頁，2026-09-02）

- **BPM 與調性**：官方原話「The model holds a stated BPM and key precisely enough to layer the output with other material」——BPM 遵循度官方掛保證，調性「often captures」。寫 `130 BPM`、`in A minor`
- **時間點**：官方例句 `lyrics begin at 15 seconds`、`instrumental only after 1:45`、`no vocals until the chorus at 0:52`——證明自然語言時間碼是被支援的語法
- **純器樂**：官方寫法 `instrumental only`；API 再加 `force_instrumental: true`
- **段落敘事**：官方建議依序敘述編曲，用連接詞 `start with`、`then`、`bring in`；建議明寫 Intro／Verse／Chorus／Breakdown／Outro 分段
- **靜音要明寫**：官方原話「Without the *just*, the model fills the silence — mark the silences explicitly」。例：`no melody, just drums`。這條直接支持本 skill 的 `then stop dead`、`one beat of silence`、`absolutely nothing` 寫法——但「明寫」只保證模型知道，不保證服從（中段全靜仍屬第三級）
- **長度不等於品質**：官方原話「Prompt length and detail do not always correlate with better quality outputs. For more creative and unexpected results, try using simple, evocative keywords」——寫不下就是該刪，不是該想辦法塞
- 官方 cookbook 範例 prompt 的結構：情境一句（`for a high-adrenaline video game scene`）→ 配器與質地（`driving synth arpeggios, punchy drums, distorted bass, glitch effects`）→ 速度範圍（`130–150 bpm`）→ 動態行為（`rising tension, quick transitions, dynamic energy bursts`）。與本 skill 五段結構的第一段完全同構

## 地雷清單

**不能提特定藝人、樂團或受著作權保護的歌詞。** 官方原話：「This includes mentioning a band or musician by name or using copyrighted lyrics」。觸發 `bad_prompt` 錯誤，回應附 `prompt_suggestion` 替代寫法（含有害內容時不附建議）【官方】。所以參考風格要用描述取代人名——想要某位日本動畫作曲家的感覺，就寫 `nostalgic solo piano with sustained warm strings`。內部分析文件裡引用作曲家做參照沒問題，但**不要複製到 prompt 裡**。曲名同樣不要寫（官方未明列曲名，但曲名等同指向受保護作品，一律避免）；「作曲家姓氏＋-ian／-esque／-style」的衍生形容詞也不要冒險【實戰保守原則】。

**預設會唱歌。** 官方：「By default, most music prompts will include lyrics」。純配樂一定要 `force_instrumental: true`，或在 prompt 明寫 `Instrumental, no singing`。plan 模式每段 `negative_styles` 擋 `vocals`。兩個都寫【官方＋實戰】。

**wordless choir／vocal-chop 與 force_instrumental 衝突。** 要 `epic wordless choir`（史詩型）、`wordless female vocals`（chinese-idioms 西遊記配方）或 `vocal-chop textures without words`（短影音型）時，**不要開** `force_instrumental`——推論它會把 choir 一起殺掉；prompt 改寫 `no lyrics, no words, wordless choir only`【實戰寫法；force_instrumental 對 choir 的實際行為未查證，建議實測一次】。

**尾段會自己堆高潮。** 最頑固的傾向：對話段、收尾段，模型會慢慢疊一個小高潮上來。只寫 `no swells` 擋不住，要加 `no build` 與 `Never rises again`【實戰】。

**爆點會自動配戰鼓。** prompt 裡出現 fireball、explosion、climax 這類詞，模型預設往史詩靠。同句補 `no epic drums` 才壓得住【實戰】。

**語境會自動召喚民族樂器。** 媽祖、廟宇、中國、日本、印度……這類語境詞會讓模型自動加鑼、二胡、尺八。不要中國風時反面詞必須**點名樂器並給正面替代**：`no erhu, no guzheng, no dizi, no gongs`，只寫 `no Chinese style` 不夠【實戰】。走 plan 模式時把這串放 `negative_styles`。

**結尾偷加 decay。** `stop dead mid-phrase — no ending chord, no fade-out, no reverb tail` 寫了模型仍常留一點殘響；實務上在剪輯軟體硬切即可，不要為此反覆重抽【實戰】。

**中段全靜服從度低。** `TOTAL SILENCE 23s to 29s, absolutely nothing` 有時會被填東西。備案：拆成兩段 cue 各自生成再剪，或升級 composition plan【實戰】。

**同 prompt 每次結果不同。** 隨機性很大，同一組 prompt 值得跑 2–3 次挑最好的。多段變奏 cue 更要一次生 3–4 版，跨版本挑段落拼接——每段都對著明確刀點所以可拼【實戰】。若某次結果調性跑掉，先別急著改 prompt——可能只是抽壞了。真要改，優先清掉會拉向史詩的詞（`fiery`、`tutti`、`epic`、`dread`）。

**seed 不在 prompt 模式。** 想「同一版微調」不能靠 seed（prompt 模式不接受）；改用 inpainting 或 plan 模式＋seed【官方】。

**換平台時反面詞失效。** ElevenLabs 的 inline 反面詞在 Suno／Udio 不可靠；翻譯表在 ai-model-vocab.md「選用與換平台」。Suno 無官方公開 API（2026-07 僅合作夥伴探索）【新聞】。

## 未查證清單（寫進交付物時保留標記）

1. 網頁介面 prompt 1000 字元上限——只有實戰（988 被截）＋ video_to_music description 的旁證；compose API 官方未載明
2. 時長上限 5 分鐘 vs 10 分鐘——官方三頁互相矛盾
3. `force_instrumental` 是否殺掉 wordless choir——推論
4. plan 模式純器樂做法（negative_styles 放 vocals、text 不放歌詞）——實務歸納
5. `create-composition-plan` 端點確切 path——以文件頁為準
6. 網頁介面兩變體計價、每分鐘 ~1,800 credits——第三方
7. 網頁介面是否有上傳影片配樂功能——未查證
8. v2 內嵌音效對喜劇 stinger 命中率——能力官方、效果未查證
9. plan chunk 的 `positive_styles` 放 `silence` 是否真的產生靜音——未查證
