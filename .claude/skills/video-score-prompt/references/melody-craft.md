# 旋律與主題的工藝

研究彙整 2026-07-26（來源：Open Music Theory、Vaia、LANDR、Rareform Audio、ElevenLabs 官方指南等；硬事實已抽查）。
通用前提：AI 音樂模型對純理論術語服從度不穩，**術語＋知覺化描述並列**是最有效寫法——術語錨定方向，白話讓模型真正聽懂。
本檔只講旋律本身（動機、樂句、輪廓、hook、主題貫穿）。旋律底下的東西——調式底色、和聲、配器分層、力度曲線、轉折手法、旋律在旁白片該放哪——在 `arrangement-theory.md`，兩檔共用同一條原則：描述「音樂做什麼」優於「音樂是什麼」。

## 動機（motif）發展手法

動機是 2–5 個音的最小識別單位。發展手法讓一段音樂「只用一個想法」撐全曲而不無聊：

| 手法 | 原理 | prompt 可用描述 |
|---|---|---|
| 重複 | 原樣再現，建立記憶 | `a short motif repeated insistently, hypnotic and memorable` |
| 模進 sequence | 同形狀逐級移高/移低 | `the phrase repeats step by step higher, rising sequence building intensity` |
| 增值 augmentation | 音值拉長＝莊嚴放大 | `the main theme stretched into long, broad notes` |
| 減值 diminution | 縮短＝急促推進 | `the theme compressed into quick urgent repetitions` |
| 倒影 inversion | 音程方向鏡射 | `answered by its mirrored, inverted shape, familiar yet unsettling` |
| 逆行 retrograde | 音序倒放 | `the melody folds back on itself, palindrome-like` |

模型服從率最高的兩種：**模進**（`rising sequence`）與**增減值**（`the theme slows into long notes`），剛好對應影片的情緒爬升與收尾放大。倒影/逆行的術語模型幾乎聽不懂，必須翻成效果詞（unsettling、mirrored）。

## 樂句結構

- **問答句**（antecedent/consequent）：前句停在半終止像「問」，後句完全終止「答」。模型不懂 period 這個詞，但很懂 call-and-response：`question-and-answer melodic phrasing, the first phrase left hanging, the second resolving`
- **Sentence（2+2+4 樂句型）**：樂思陳述兩次→碎片化、節奏加密、推向終止，天生有前進推力。廣告與預告片的推進器：`a two-bar idea stated twice, then fragmented and driven forward to a strong cadence`

## 旋律輪廓與情緒

| 輪廓 | 情緒 | prompt 描述 |
|---|---|---|
| 上行 | 期待、提問、希望 | `steadily ascending melodic line, building anticipation and lift` |
| 下行 | 解決、嘆息、哀傷（sigh motif） | `gently descending, sigh-like phrases, resolving and wistful` |
| 拱形 | 醞釀→高點→釋放，最古典的敘事形 | `arching melody that climbs to an emotional peak then settles` |
| 鋸齒 | 不安、俏皮、神經質 | `jagged, angular melodic leaps, nervous playful energy` |

**輪廓詞是對位剪輯點的主力**：把影片戲劇曲線直接翻成方向指令（開場 ascending、高潮 peak、收尾 descending resolution）。模型對 rising / falling / peak / settle 這類方向詞的反應遠比抽象情緒詞（sad、epic）精準。這與 `arrangement-theory.md`「三條前提」第 2 條「描述音樂做什麼優於音樂是什麼」同一原理。

輪廓詞管的是旋律線的方向；整首曲子的力度形狀（單峰、先蹲再跳、瞬間全滿）與配器層數的加減（`strings enter` → `full` → `ease down layer by layer`）是另一層，兩者要一起寫才完整——見 `arrangement-theory.md` 第四、五節。

**旋律在旁白片該放哪**：旁白進行中不要主旋律（`no lead melody under the narration`），旋律只進人聲空窗並寫時間碼（`melodic phrase blooms at 41s–47s in the gap`）。動機要短（2–5 音）才塞得進空窗。頻段與配器的安全／危險對照見 `arrangement-theory.md` 第九節。

## Hook（廣告/短片角度）

四件事拆開講，模型才做得到——只寫 catchy 沒用：

1. **短**：2–5 個音
2. **重複中帶微變**：同形再現、尾音或節奏微調
3. **可唱性**：音域窄、級進為主
4. **早出現**：廣告曲 hook 前 5 秒亮相

`built around a simple, instantly memorable 4-note hook, introduced in the first seconds and repeated with small variations, easy to hum`

## Leitmotif：一個主題貫穿全片

主題綁定角色/概念，關鍵是**每次再現都變形**（配器、音域、速度、調性任一改變）。主題不動＝壁紙，主題演化＝敘事。

單次生成很難保證主題一致，雙管齊下：

- **語言上**：全曲明寫 `a single recurring main theme unifies the whole piece`，再逐段指定變形——低谷 `the main theme returns as a fragile solo variation`、高潮 `triumphant full reprise of the opening motif`。用 returns / reprise / variation of the opening theme 這組詞。再現時的變形手段可以借 `arrangement-theory.md`：升 key 再現（`lift a key higher`，第三節）、換配器層數（第四節）、從變奏彈回主調性用利的動詞（`snaps back to …`，第七節 E）
- **工法上**：ElevenLabs 分段續寫（先生 intro 確立主題再 extend）或 composition plan 分段——續寫機制沿用既有素材，是目前唯一可靠的主題再現保證

紅孩兒實戰已用過的簡化版：教室段的「天真笛子主題破碎再現」（見 scoring-craft.md 破碎再現節）就是 leitmotif 的單場應用。

## 落地心法

1. 每段 prompt 至少含一個「輪廓動詞」＋一個「發展手法」
2. 理論詞永遠配白話效果詞
3. 主題貫穿靠續寫工法，不靠一段長 prompt
4. 描述「音樂做什麼」（rises, fragments, returns）優於「音樂是什麼」（epic, emotional）
5. 旋律寫完再問三件事：底下幾層（第四節）、力度形狀（第五節）、有沒有擋到人聲（第九節）——都在 `arrangement-theory.md`
