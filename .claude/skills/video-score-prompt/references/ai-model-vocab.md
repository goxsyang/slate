# AI 音樂模型 prompt 詞彙有效性實測表

用途：寫 prompt 或 prompt 不聽話時查——哪些詞真的有效、哪些會反效果、哪些會報錯、每種指令的服從度與該抽幾次、依影片長度該放幾個錨點、換平台時反面詞怎麼翻譯。

研究彙整 2026-07-26，實戰增補 2026-09-02（四支影片、二十餘輪迭代）。涵蓋 ElevenLabs Music（主力）／Suno／Udio。

可信度標記：
- 【實戰】本 skill 真實使用者反覆驗證過的寫法——**最高優先級**
- 【官方】官方文件原文
- 【共識】大量社群實測共識
- 【第三方】單一非官方來源，待驗證
- 【未查證】查不到依據，只是合理推論

標記不可升級：整合其他檔案時，【未查證】不得改成【官方】，【第三方】不得改成【共識】。

**總原則**：所有詞都是機率提示，不是指令。失敗就重抽或換更簡單的字，**別加更多字**。

**鐵律**：prompt 內絕不寫作曲家、樂團、歌手、曲名——ElevenLabs 回 `bad_prompt`（官方明文）。想要某人的感覺，寫出那個感覺的樂器、質地與行為。連「作曲家姓氏＋-ian／-esque／-style」這種名字衍生形容詞也不要冒險，一律換成 `grand operatic-style heavy brass` 這類純描述【實戰保守原則】。內部分析文件裡引用人名做參照沒問題，但不要複製進 prompt。

---

## 第一表：已驗證有效詞彙（ElevenLabs 為主）

### A. 全域鐵則（放第一段，管全曲）

| 目的 | 寫法 | 來源 |
|---|---|---|
| 每次重抽轉折都要出來 | `Every mood switch must be clearly heard — distinct, never smoothed over` | 實戰 |
| 多段硬切變奏 | `hard genre switches on cue` | 實戰 |
| 喜劇跟點總則 | `mickey-mousing every gag` | 實戰 |
| 純器樂 | `Instrumental, no singing`（＋API `force_instrumental: true`） | 實戰＋官方 |
| 純器樂（官方寫法） | `instrumental only` | 官方 |
| 對白留空間 | `sparse mid-range`、`textures light never thick` | 實戰 |
| 直接進副歌、無前奏 | `no intro`、`crash straight into the chorus ... instantly full, no build-up` | 實戰 |
| 旁白片一個調到底 | `stays in one key, no modulation` | 未查證（arrangement-theory.md 推定） |

### B. 情緒與調性（服從度最高的一類）

| 目的 | 有效寫法 | 會拉走的詞 | 來源 |
|---|---|---|---|
| 喜悅 | `joyful lift`、`bright major key`、`glockenspiel sparkle`、`giddy falling-in-love bliss` | `quiet determination`（偏正經）、`ballad`（拉向苦情） | 實戰 |
| 喜悅的浪漫 | `joyful ... love song`、`honey-sweet`、`sugary`；段尾 `Not sad, no melancholy` | `ballad`、`bittersweet` | 實戰 |
| 有趣但不俗氣 | `sly witty groove — nimble pizzicato, finger snaps, light shuffle drums, playful marimba — cheeky but classy` | `goofy`、`woodblock`、`slide whistle`、`kazoo`、`circus` | 實戰 |
| 可愛 | `marimba`、`finger snaps`、`airy pads`、`angelic shimmer` | — | 實戰（這幾個詞是「太可愛」的來源，要懸疑就拿掉） |
| 喜劇內的懸疑 | `sneaky minor-key sleuth groove — walking upright bass, muted pizzicato, vibraphone, bass clarinet, brushes` | `angelic`、`airy` | 實戰 |
| 詭異而非天使 | `uncanny ... eerie shimmer, hushed` | `angelic shimmer` | 實戰 |
| 宏大史詩 | `Epic ... grand and monumental`、`towering`、`colossal ... thunderous ... vast and monumental` | — | 實戰 |
| 輕鬆收尾 | `laid-back ... easygoing`、`ease onto a soft bright final chord` | `triumphant`、`soaring` | 實戰 |
| 甜中藏毒 | `seductive but faintly wrong, a sour note buried underneath` | `dark`、`sinister`（太直白） | 實戰（scoring-craft） |
| 質地形容詞 | `breathy` `raw` `live` `aggressive` `eerie` | — | 官方 |
| 稀疏／壓低 | `sparse`、`muted` | — | 單測，偏弱——單獨寫效果不穩，要搭配編曲描述（`sparse mid-range, no lead melody under the voice`）才管得住 |
| 質地形容詞 | `warm` `gritty` `lush` `airy` | — | 共識 |
| 精準情緒詞 | `euphoric` / `melancholic` / `propulsive` | `happy` / `sad` / `energetic`（高頻詞被平均化） | 第三方 |

底色與樂器的分工：**底色（大小調、調式）決定觀眾的直覺，樂器只是表情**。「太可愛要有懸疑」的正解是換底色（sneaky minor-key）而不是只換樂器【實戰】。調式速查表在 arrangement-theory.md 第一節。

### C. 配器（服從度最高的一類）

| 目的 | 有效寫法 | 來源 |
|---|---|---|
| 史詩配器 | `noble horns, timpani, massive drums, epic wordless choir` | 實戰 |
| choir 只在兩處 | `choir only at 5s and 157s, nowhere else` | 實戰（頭尾呼應；寫法有效但屬第三級服從度，見下） |
| wordless choir 與純器樂並存 | `no lyrics, no words, wordless choir only`；**不開** `force_instrumental` | 實戰寫法＋推論（force_instrumental 對 choir 的實際行為未查證） |
| 短影音人聲切片 | `vocal-chop textures without words`（同樣不開 force_instrumental） | 未查證 |
| 韓劇腔主旋律 | `clean electric guitar sings the hook` | 實戰 |
| 校園情歌腔 | `bright acoustic guitar ... campus love-song style` | 實戰 |
| 偵探潛行 | `walking upright bass, muted pizzicato, vibraphone, bass clarinet, brushes` | 實戰 |
| 喜劇人格樂器 | `clumsy staccato bassoon`、`fluttering piccolo runs`、`sarcastic wah-wah muted trumpet`、`skeletal xylophone`、`tiptoe pizzicato strings` | 共識（comedy-tension-advanced） |
| 獨奏 | `solo` 前綴：`solo electric guitar` | 官方 |
| 效果詞 | `distorted bass`、`tape saturation` | 官方 |
| 製作詞 | `lo-fi`、`cinematic` | 共識（三家最穩） |
| 民族樂器（中國地域） | 「拼音＋英文類名」雙寫：`rawap lute`、`dap frame drum`、`dizi bamboo flute` | 共識（chinese-idioms） |
| 台灣在地樂器 | `beiguan`、`nanguan`、`nakashi`、`moon lute (yueqin)`、`temple drum troupe` | **未查證**——ElevenLabs 上無實測紀錄。待辦：找一支廟宇或台語短劇素材做 A/B（拼音＋類名 vs 純行為描述 `raw processional gongs and shawm`），結果回寫此表 |

按情緒反查的 21 列樂器人格表（溫暖／冷／神聖／懷舊／科技／鄉土／都會…）與「同一樂器多重人格」在 arrangement-theory.md 第八節。

### D. 動態與行為動詞（描述「音樂做什麼」，比「音樂是什麼」準）

| 目的 | 有效寫法 | 弱寫法 | 來源 |
|---|---|---|---|
| 逐層抽薄 | `From 84s ease down layer by layer, gently thinning` | `get quieter`、`fade` | 實戰 |
| 給緩衝 | `By 90s already calm` | — | 實戰 |
| 先蹲再跳 | 峰前一段 `pull back to a hush` | — | 實戰 |
| 高潮是一個點 | `a single hit, no sustain`、`Three seconds only`、`then stop dead` | `climax`（會拖成一段） | 實戰 |
| 單發正拍重擊 | `one massive slamming downbeat hit` | `big hit`（可能連打） | 實戰 |
| 收尾做滿 | `full flourish crescendo landing one emphatic ta-da button hit at 9.5s, tight clean stop, no fade` | — | 實戰 |
| 急停 | `stops dead — instant cut, one beat of silence` | `pause`、`break` | 實戰（急停點選「幻想破滅那一格」如角色皺眉，不選「物件出現那一格」；死寂蓋住表情、音樂跟物件同步懟出） |
| 硬斷結尾 | `stop dead mid-phrase — no ending chord, no fade-out, no reverb tail` | `abrupt ending` | 實戰（模型仍常偷加 decay，剪輯硬切） |
| 升 key 拉落差 | `lift a key higher`（韓劇 OST 簽名手法，比漸強落差更大） | `get more intense` | 實戰 |
| 轉折動詞要利 | `snaps back` | `sneaks back` | 實戰 |
| 三次遞進 | `same gag, slyer` → `stranger` → `the grandest` | — | 實戰（rule-of-three） |
| 假緊張＋鬆一口氣 | `tiptoe pizzicato, rising tremolo` ＋ `relief exhale` | — | 實戰 |
| 銜接前曲淡出 | `Open hushed`（＋同 BPM 家族） | — | 實戰 |
| 保留給真高潮 | `powerful but deliberately held back, no choir and no gong yet` | `smaller` | 實戰（scoring-craft） |
| 輪廓動詞 | `rising` / `falling` / `peak` / `settle` / `returns` / `fragments` | `epic` / `emotional` | 共識（melody-craft） |
| 靜音要明寫 | `just drums`、`absolutely nothing`、`one beat of silence` | 不寫（模型會填滿） | 官方＋實戰 |

推升與落下要成對出現：單獨一個 `riser` 是模型自補高潮的破口，寫了 `rising` 就要寫它落在哪【實戰歸納】。完整的打點／停止／推升／落下／回來／轉場工具箱在 arrangement-theory.md 第七節。

### E. 時間、速度、調性

| 目的 | 有效寫法 | 來源 |
|---|---|---|
| 時間錨點 | `at 43s`（不寫 `at 43 seconds`；比畫面切點早 0.2s） | 實戰 |
| 區間 | `From 84s to the end`、`between 20s and 32s` | 實戰 |
| 官方時間碼語法 | `lyrics begin at 15 seconds`、`instrumental only after 1:45`、`no vocals until the chorus at 0:52` | 官方 |
| BPM | `92 BPM`；官方掛保證「holds a stated BPM ... precisely enough to layer」 | 官方 |
| BPM 家族銜接 | 量測現成曲 BPM（如 152 ≈ 體感 76 半拍），新 cue 同家族 | 實戰 |
| 調性 | `in A minor`、`bright major key`；官方「often captures」——常中非必中 | 官方 |
| 速度切換 | `half-time groove shifting to double-time` | 共識 |

### F. 反面詞（防守用，放在要管的那段之後）

| 防守對象 | 寫法 | 來源 |
|---|---|---|
| 尾段自堆高潮 | `Never rises again`、`no build`、`no push`、`no big build`（單獨 `no swells` 不夠） | 實戰 |
| 爆點配戰鼓 | `no epic drums` | 實戰 |
| 喜劇變史詩 | `no epic`、`no drama` | 實戰 |
| 語境召喚民族樂器 | **點名**：`no erhu, no guzheng, no dizi, no gongs` | 實戰 |
| 俗氣喜劇 | `Not corny: no slide whistle, no kazoo, no circus` | 實戰 |
| 苦情 | `Not sad, no melancholy` | 實戰 |
| 前奏 | `no intro`、`no build-up` | 實戰 |
| 殘響 | `no fade`、`no reverb tail`、`tight clean stop` | 實戰 |
| 人聲 | `no singing`＋`force_instrumental` | 實戰＋官方 |
| 人聲（但要 wordless choir／vocal-chop） | `no lyrics, no words`；不開 `force_instrumental` | 實戰寫法＋未查證 |

---

## 第二表：已知無效／會被忽略／會反效果的寫法

| 寫法 | 問題 | 改法 | 來源 |
|---|---|---|---|
| `no drums`、`without drums` | 名詞本身提高鼓出現機率（同圖像生成）；純 prompt 裡用名詞否定樂器不可靠 | 正面替代：`acoustic only`、`piano-led, upright bass`；ElevenLabs plan 模式改用 `negative_styles` 欄位 | 共識＋官方 |
| `no Chinese style` | 太抽象，模型還是加鑼 | 點名樂器 `no erhu, no guzheng, no gongs` | 實戰 |
| `no swells` 單獨用 | 擋不住尾段自堆 | 加 `no build`、`Never rises again` | 實戰 |
| `climax at 63s` 不加限制 | 模型把一擊拖成整個樂段 | `a single hit at 63s, then stop dead, no sustain` | 實戰 |
| `TOTAL SILENCE 23s to 29s` | 服從度低，常被填東西 | 拆兩段 cue／升 composition plan／剪輯留空 | 實戰 |
| `stop dead ... no reverb tail` | 模型常偷加 decay | 接受，剪輯硬切；不要為此重抽 | 實戰 |
| 半秒錨點過多（`13.5s`、`14.5s`、`66.5s`…） | 0.5s 精度時好時壞；錨點一多全部鬆掉 | 半秒只給 hit 類、全曲 ≤3 個；段落轉換一律整秒 | 實戰 |
| `at 43 seconds` | 浪費字元，效果同 `at 43s` | `at 43s` | 實戰 |
| `240 BPM` | 剪輯比音樂能承載的更碎；模型給的是雜訊 | `150 BPM` ＋ `dense percussion hits` | 實戰（scoring-craft） |
| `sensual` / `action` 用在慢戲 | 模型配得比畫面急 | 開頭補 `slow` | 實戰（scoring-craft） |
| `goofy`、`honk`、`woodblock` | 俗氣；使用者要「有趣但不俗」時反效果 | `sly witty groove ... cheeky but classy` | 實戰 |
| `quiet determination` | 偏正經，拉走喜悅 | `joyful lift`、`bright major key` | 實戰 |
| `ballad` | 拉向苦情 | `love song`、`joyful` | 實戰 |
| `angelic shimmer` / `airy pads` / `marimba` / `finger snaps` | 是「太可愛」的來源 | 要懸疑就換底色 `sneaky minor-key` ＋ `uncanny eerie shimmer, hushed` | 實戰 |
| `fiery`、`tutti`、`epic`、`dread`、`climax` 用在喜劇 | 拉向交響史詩 | `goofy`（限卡通語境）、`cymbal crash`、`mock-panic` | 實戰 |
| `sneaks back` | 轉折不明顯，重抽常被抹平 | `snaps back` | 實戰 |
| `swells` 當推升動詞 | 語意偏「慢慢脹大」，模型常做成純音量而非加樂器 | `build layer by layer, adding [樂器]`；反向用 `ease down layer by layer` | 實戰歸納 |
| `crescendo` 不指定加什麼 | 模型做成純音量推 | 寫加法順序：先加什麼、再加什麼（arrangement-theory.md 第四節七層階梯） | 實戰歸納 |
| `Calm` ＋ `Aggressive` 同段 | 矛盾互抵 | 一段一情緒，轉折用時間錨切開 | 共識 |
| 單段 8+ 個逗號形容詞 | 權重平均化稀釋 | 3–6 個強詞 | 共識 |
| `wide stereo`、`hall reverb`、`intimate close-mic` | 只是風格暗示，非混音指令；close-mic 常被讀成親密人聲風 | 可寫，別期待工程精度 | 共識偏弱 |
| `inversion`、`retrograde`、`period` 等理論術語 | 模型幾乎聽不懂 | 翻成效果詞：`mirrored, unsettling`、`question-and-answer phrasing` | 共識（melody-craft） |
| `Shepard tone`、`鑼鼓經` 等學名 | 模型未必認得 | 效果描述：`endlessly rising pitch, never resolving`、`frantic accelerating gongs and cymbals` | 共識 |
| `catchy` 單獨用 | 做不到 | 拆四件事：短／重複微變／可唱／早出現 | 共識（melody-craft） |
| 為黑畫面 placeholder 留低谷 | 之後會補素材，曲線白留 | 不為 placeholder 設計；曲線照前後段走勢連過去 | 實戰 |
| `force_instrumental: true` ＋ `wordless choir` | 推論會把 choir 一起殺掉 | 改 `no lyrics, no words, wordless choir only`，不開 force_instrumental | 未查證 |
| prompt 寫 `sparse mid-range` 就不混音 | prompt 只能讓編曲避開人聲頻段，取代不了混音的 ducking／EQ | 交付時提醒使用者：人聲之下仍靠剪輯軟體混音 | 共識（arrangement-theory.md 第九節） |

### 樂器否定的兩條規則（表面矛盾的調和）

「用名詞否定樂器不可靠」（共識）與「媽祖案必須點名 `no erhu, no guzheng, no dizi, no gongs`」（實戰）並不衝突，差別在題材：

1. **一般題材**：正面替代。要排除吉他就寫 `piano-led, upright bass`，不寫 `no guitar`——名詞本身會召喚。
2. **文化強預設題材**（廟宇、媽祖、婚禮、日本、印度、西部、聖誕……語境詞本身就會召喚整組樂器）：**點名否定＋正面替代並用**。單獨 `no Chinese style` 太抽象擋不住；單獨正面替代又壓不過語境的預設。媽祖案實證兩者並用才乾淨。

台灣語境「不要太中國風」的逐樂器替代表在 genre-playbooks.md 第一節；「要哪一種中國」在 chinese-idioms.md；「提到即召喚 vs 文化預設」的完整說明在 arrangement-theory.md 第八節。

---

## 第三表：會觸發錯誤的寫法（ElevenLabs）

| 寫法 | 錯誤 | 官方依據 | 改法 |
|---|---|---|---|
| 作曲家／樂團／歌手名字（任何形式，含 `in the style of X`、名字衍生形容詞） | `bad_prompt`，附 `prompt_suggestion` | 官方：「mentioning a band or musician by name」 | 用樂器＋質地＋行為描述 |
| 受著作權保護的歌詞 | `bad_prompt` | 官方 | 自寫歌詞或純器樂 |
| 曲名 | 推定同上 | 官方未明列 | 一律避免【實戰保守原則】 |
| composition plan 的 styles 含上述內容 | `bad_composition_plan`，附替代建議 | 官方 | 同上 |
| 有害內容 | 錯誤且**不附**建議 | 官方 | — |
| `prompt` ＋ `composition_plan` 併用 | 參數衝突 | 官方 | 二選一 |
| `prompt` ＋ `seed` | 參數衝突（seed 只在 plan 模式） | 官方 | plan 模式才用 seed |
| `music_length_ms` ＋ `composition_plan` | 只與 prompt 併用 | 官方 | plan 的長度由各段 `duration_ms` 加總 |
| composition plan 的 styles 非英文 | 不合規 | 官方：「All styles must be in English」 | 歌詞可中文，styles 一律英文 |
| 超過 1000 字元 | **不報錯**，靜默截尾 | 實戰（988 被截）；API 上限官方未載明 | 壓到 900 以下，python 實測 |
| `force_instrumental` 用在 plan 模式 | 被忽略 | 官方：只在 prompt 模式 | 每段 `negative_styles` 放 `vocals` |

其他平台的錯誤機制：Suno／Udio 的藝人名處理方式**未查證**——Udio 官方 help 甚至示範 `in the style of [Artist]`，但本 skill 為跨平台一致性與著作權風險，**三家一律不寫人名**。

---

## 指令服從度分級（ElevenLabs 純 prompt 模式）

先分級再決定是重抽、拆段還是升 plan。「轉折沒出來」「靜音被填滿」先問：這條指令本來就是第幾級？

### 第一級：最聽話（一次抽中率高，寫了就有）

配器、情緒形容詞、大調／小調、曲風、質地、全域鐵則、`instrumental`、BPM（官方掛保證）、第一段定調。

補救策略：幾乎不用補救。若沒出現，通常是被同段其他詞蓋掉——刪掉打架的詞，不是加字。

### 第二級：中等（2–3 抽會中一次；落點 ±1–2s）

時間錨點（整秒）、段落轉換、升 key、速度切換、逐層抽薄、單發 hit、直接進副歌、rule-of-three 遞進、調性精確到某個 key。

補救策略：
1. 同 prompt 重抽 2–3 次挑最好的（先別改字）
2. 落點偏移 ±1–2s → 剪輯 ±2% 變速吸收（hit 類 ±0.2s 必保，段落轉換才可吸收）
3. 轉折被抹平 → 加全域鐵則 `Every mood switch must be clearly heard`，轉折動詞磨利
4. 多段變奏一次抽不齊 → 生 3–4 版跨版本拼段落（每段對著刀點，可拼）

### 第三級：最差（服從度低，不要指望單次生成）

中段全靜（`TOTAL SILENCE`）、硬斷結尾無 decay、半秒精度、超過 5 個錨點同時準、尾段絕不再起（長尾段）、choir 只在指定兩處出現。

補救策略（依序）：
1. **拆段生成**：以刀點為界拆成 2–3 個 cue，各自 prompt，各自 3 抽
2. **升 composition plan**（music_v2）：段落時長硬鎖，靜音段獨立成 chunk
3. **剪輯後製**：硬斷靠剪輯軟體硬切；靜音靠剪輯留空；尾段自堆靠淡出或截斷。**不要為 decay 反覆重抽**
4. **inpainting**：只重生跑掉的那段（網頁介面 v2）

### 分級與抽次的實務換算

| 分級 | 建議抽次 | 期望 |
|---|---|---|
| 只有第一級指令（10–30s 單情緒） | 2 次 | 挑一 |
| 含第二級（30–90s，3–4 錨點） | 3 次 | 挑一或拼二 |
| 含第三級（多段變奏、中段靜音、90s+） | 3–4 次 ＋ 準備拆段 | 拼三 |

重抽 vs 換 prompt 的分界：調性跑掉先重抽 2–3 次；同一問題連續三抽都出現才改字。使用者說「換一個感覺」不是重抽，是換軸（配器家族／律動／時代感至少換兩軸，時間軸段落不動）——見 genre-playbooks.md 第一節。

---

## prompt 結構最佳化模板：依影片長度調整

五段骨架不變（總則→開場→中段→高潮→收尾＋反面詞），變的是**錨點數量**與**字元分配**。

以下錨點預算與字元分配是**本 skill 由四支實戰影片（24s–197s）歸納的工作規則，不是模型硬限制**【實戰歸納，經驗值】。

### 錨點的定義與預算

一個「錨點」＝一個帶時間碼的音樂事件句，通常 60–90 字元（`At 63s one massive slamming downbeat hit, then stop dead, no sustain.` ≈ 72）。

**錨點上限經驗值：總長每 20–25 秒最多 1 個，全曲不超過 6 個。** 超過就是第三級服從度，模型會全部鬆掉。

### 各長度的配置

| 影片長度 | 錨點數 | 目標字元 | 五段分配（約） | 備註 |
|---|---|---|---|---|
| **10s** | 1（結尾 button 或單一 hit） | 250–450 | 總則 40%／開場＋中段合併 30%／高潮＋收尾合併 30% | 不分中段；一句定調一句收。`no intro` 必寫 |
| **30s** | 2–3 | 500–700 | 總則 25%／開場 15%／中段 25%／高潮 15%／收尾 20% | 廣告與短影音甜蜜點；仍可用完整五段 |
| **60s** | 3–4 | 700–900 | 總則 20%／開場 15%／中段 30%／高潮 15%／收尾 20% | 標準配置；SKILL.md 模板原型 |
| **120s** | 4–5 | 850–900（必寫反面詞 ≤3 已計入） | 總則 20%／開場 10%／中段 35%／高潮 15%／收尾 20% | 字元頂到上限；中段合併相鄰事件；選寫反面詞多半塞不下；考慮 plan |
| **180s+** | 5–6（prompt 極限） | 900 | 同上，但每個錨點壓到 60 字元 | **優先拆 cue 或升 composition plan**；單 prompt 只在段落單純（如純氛圍鋪底）時可行 |

分配是比例不是硬規定；**必寫反面詞（≤3）永遠算在收尾段的 20% 裡，不可被擠掉**；選寫反面詞依「反面詞內部優先序」取捨。20s／45s／90s 的內插值與粗算公式見 SKILL.md「依長度配置錨點」。

用 genre-playbooks.md 的類型骨架起手時：骨架（≤600 字元）＋量測錨點＋該型必寫反面詞＝目標 800–900；每加一個錨點順手 python 實測一次。

### 錨點過多時的取捨原則（依序保留）

1. **唯一最大聲的高潮**——一個都不能少
2. **斷崖／急停／靜音起點**——喜劇的笑點成立與否在此
3. **曲風硬切點**——多段變奏的段界
4. **拉升起點**（build 從哪一秒開始）——±2s 可容忍，可寫成區間 `From 40s`
5. **質地變化**（抽薄、換主奏樂器）——最先被刪，改用 `then`、`gradually` 的相對描述取代時間碼

合併規則：
- 相距 <3s 的兩個事件合成一句（`at 43s a hit, one beat of silence, then at 45s tiptoe pizzicato`→`at 43s a hit, one beat of silence, then tiptoe pizzicato`）
- 半秒錨點只留 hit 類；段落轉換取整秒
- 連續同向變化（越來越大）寫成一個區間＋一個終點：`From 40s build steadily to a peak at 63s`

### 字元砍法順序（超過 900 時）

1. 形容詞堆疊（三個留一個最強的）
2. 連接語（`and then`→`then`；`in order to`→刪）
3. 重複的情緒詞（總則寫過的不在各段重寫）
4. 第 5 級錨點（質地變化）的時間碼→相對描述
5. 「選寫」反面詞（見下方優先序，從最低級開始砍）
6. **永遠不砍**：高潮句、斷崖句、該型「必寫反面詞（≤3）」、`Instrumental, no singing`

**反面詞內部優先序**（跨型疊加撐不進預算時，從第 4 級往上砍；120s 旁白片實測：第 1 型必寫 6 項＋「不要太中國風」5 項＋hook＋5 個錨點初稿 1099 字元，砍三輪才 954，所以各型「必寫」已改為 ≤3 項）：

1. **點名文化樂器**（`no erhu, no guzheng, no dizi, no gongs`）——語境會召喚整組樂器，少寫一個就出現一個
2. **尾段不再起**（`Never rises again`、`no build at the end`）——模型最頑固的預設，且放在尾段才管得住
3. **該型頑固預設一句**（形象片的 `no stock-corporate ukulele and whistling`、喜劇的 `Not corny: no slide whistle, no kazoo, no circus`、短影音的 `no intro, no fade-out`）——每型只留一句最會出事的
4. **情緒防守**（`not sad, no melancholy`、`no epic`、`no drama`）——多半能靠正面詞（`joyful`、`bright major key`）壓住，預算不夠時第一個砍

同一級內：一組並列（`no slide whistle, no kazoo, no circus`）算一項，砍時整組砍不拆散。各型的「必寫 ≤3／選寫」分法在 genre-playbooks.md 各型「必寫反面詞」行。

### 各長度範例骨架（僅結構，非成品）

**10s（logo sting／片尾 button）**
```
[Genre] sting, 10s — [mood], no intro, instantly full. [3–4 instruments]. Instrumental, no singing.
Builds fast to one emphatic [hit type] at [N]s, tight clean stop, no fade. Not [反面], no [反面].
```

**30s（廣告）**
```
[Genre] score, 30s, [scene] — [global rule]. [instruments]. Instrumental, no singing.
[Opening mood], [BPM], [key]. [Turn] at [N]s.
At [N]s [peak] — [one hit], then stop dead. From [N]s: [outro mood], no build. [反面詞].
```

**60s／120s**：用 SKILL.md 五段模板；120s 把中段寫成「兩個區間＋一個事件」而非四個獨立錨點。

**180s+**：以剪輯硬切點拆成 cue A／B／C，各自套 60s 模板；銜接處 cue B 開頭寫 `Open hushed, continuing from a [前段描述] fade`，並保持同 BPM 家族。

---

## 三家平台事實速查（2026-09-02 查證）

### ElevenLabs Music
- 純 prompt：網頁 1000 字元實戰上限；API `prompt` 官方未載明上限；`music_length_ms` 3s–10min【官方】；能力頁寫 5 分鐘上限（文件自相矛盾，見 elevenlabs-music.md）
- composition plan：v1／v2 皆接受【官方 compose 參考頁】；**chunk 結構 plan 為 v2 專用**（本 skill 用的那種），≤30 段、每段 3–120s、styles 各 ≤50、段長硬鎖【官方】
- 時間碼：自然語言支援【官方例句】；BPM 官方掛保證；調性「often」【官方】
- video_to_music：`POST /v1/music/video-to-music`，description ≤1000、tags ≤10、影片合計 ≤600s／200MB【官方】
- 定價：900 credits／分鐘【官方定價頁】；網頁預設兩變體計價【第三方，未查證】
- 藝人名 → `bad_prompt`【官方】

### Suno
- 現行 v5.5（2026-03-26）、v5（2025-09-23）【官方 release notes】
- 長度：官方 release notes 舊條目寫 4 分鐘上限＋2 分鐘 extend；第三方稱 2026-07 起 v5.5 有 Duration slider 至 8 分鐘【第三方，未查證】
- Style 欄 1000 字元、Lyrics 5000（V4.5+）【第三方】
- Exclude Styles：Pro／Premier 專用（2024-09-19）【官方】；Instrumental 開關【官方】；Replace Section 局部重生（2024-10-10）【官方】
- **無官方公開 API**：2026-07-01 CPO 宣布探索合作夥伴 API，無時程【新聞】。市面上的「Suno API」都是第三方非官方
- 結構標籤 `[Intro][Verse][Chorus][Build][Drop][Outro][End]`、`[Instrumental]`、`[Guitar Solo]`；Style 欄 4–7 個描述詞為甜蜜點；`127 BPM` 只是「approximate guidance」【第三方指南】
- 不給結構標籤會自動套 verse-chorus——要非典型結構（純器樂長線、多段變奏）必須明寫標籤；不寫 BPM 則落到曲風預設（pop 約 100–120）【共識】
- 純器樂：Custom Mode → Instrumental 開關；負面控制：Advanced Options → Exclude 欄填純名詞【官方＋共識】

### Udio
- 官方 help：Instrumental Mode、Advanced Controls 的 Style Reduction、歌詞內 `[Chorus]`、`[Guitar Solo]`、`(括號)` 為和聲【官方】
- 官方 help 示範 `in the style of [Artist]`——**本 skill 仍不使用**
- BPM：官方只給「slow / fast」定性引導，無數值機制【官方】
- 「v4、48kHz、10 分鐘、inpainting／stem 分離」——**僅第三方來源，未查證**
- API：**未查證**

### 選用與換平台

要對秒數／結構精準（配樂對點）→ ElevenLabs；人聲流行歌 → Suno；器樂質感＋逐段修 → Udio。本 skill 主力是 ElevenLabs，Suno／Udio 只在使用者指定時換平台。

換平台時 prompt 不能原樣貼——inline 否定在那兩家不可靠，反面詞要翻譯成專用欄位：

| ElevenLabs prompt 裡的 | → Suno | → Udio |
|---|---|---|
| `Instrumental, no singing` | Custom Mode → Instrumental 開關 | Instrumental Mode |
| `no slide whistle, no kazoo, no circus`、`no erhu, no guzheng` | Advanced Options → Exclude 欄，純名詞 `slide whistle, kazoo, erhu, guzheng`（≤5 項、勿用減號） | Style Reduction 滑桿（無法逐樂器） |
| `Never rises again`、`no build` | 沒有對應欄位；靠 `[Outro]` 標籤＋Style 欄的 `calm outro` 正面描述 | 靠段落重生補救 |
| `at 43s ...` 時間錨 | 無對應；用 `[Chorus]`、`[Drop]` 結構標籤近似 | 歌詞內 `[tags]` 近似 |
| `92 BPM` | 寫範圍 `(85-95 BPM)` | 只有 `slow` / `fast` |

## 三家語法差異速查

| | Suno | Udio | ElevenLabs |
|---|---|---|---|
| 主介面 | Style 欄＋Lyrics 欄分離 | 自由文字＋tag chips | 單一自由文字（或 API plan） |
| 結構標記 | Lyrics 內 [方括號] | Lyrics 內 [tags] | 自然語言時間戳；plan 的 [段名]＋{指令} |
| 負面控制 | Exclude 欄＋Instrumental 開關 | Style Reduction 滑桿＋Instrumental Mode | prompt：正面限定＋非樂器名詞否定；plan：`negative_styles` 欄位 |
| 硬控結構 | 無（機率性） | 段落重生補救 | composition plan 硬鎖（v2） |
| BPM | 窗口，寫範圍 `(85-95 BPM)` 較穩 | 只有 slow/fast | 官方掛保證 |
| 藝人名 | 未查證 | 官方示範可寫 | `bad_prompt` |

---

## 相關檔案

- `elevenlabs-music.md` — API 參數、字元與時長上限、composition plan、定價、地雷清單
- `arrangement-theory.md` — 調式／和聲／轉調／配器分層／力度曲線／轉折工具箱／樂器人格／人聲之下的編曲（詞彙的樂理根據）
- `genre-playbooks.md` — 22 型起手骨架、三軸多樣性、台灣語境替代表
- `scoring-craft.md`、`comedy-tension-advanced.md`、`melody-craft.md`、`chinese-idioms.md` — 本表引用「共識」來源的原文
