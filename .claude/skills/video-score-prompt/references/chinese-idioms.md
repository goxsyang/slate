# 中國音樂地域色彩速查——「哪一種中國」，以及「不要中國」時怎麼擋

研究彙整 2026-07-26（來源：中文維基、國立傳統藝術中心、Wikipedia Muqam/Suona 等；許鏡清配方已查證屬實）；2026-09-02 依媽祖園區案實戰補「反向」與「台灣在地」兩節。
**人名只作說明**：本檔說明文字裡出現的作曲家、劇名、曲名、品牌（例如下面「1986 配方」節的標題與說明）只是給你理解配方用的，**一個都不能進 prompt**（含衍生形容詞）；prompt 區塊本身已是乾淨的描述性寫法，只複製 code block，不複製節名與說明文。
核心心法：**避免只寫 `Chinese style`**——那會得到均質化的「醬油中國風」。先選地域、再選調式情緒、最後加打擊語法，三層疊加。樂器一律「拼音＋英文類名」雙寫（`rawap lute`、`dap frame drum`），命中率最高。

**先分流**：這份檔回答「要哪一種中國」。使用者說「不要太中國風」「不要國樂」時，改讀 `genre-playbooks.md` 第一節「台灣語境的兩大高頻要求」的逐樂器替代表，再回到本檔末尾「反向」節看點名否定的規則。廟宇／媽祖／遶境類影片的整段起手式在 `genre-playbooks.md` 第 17 型，本檔只管詞彙。

## 五聲調式的情緒色彩

| 調式 | 情緒 | prompt 寫法 |
|---|---|---|
| 宮 | 端正莊重（大調感） | `Chinese major pentatonic (gong mode), stately and grounded` |
| 商 | 蒼勁悲壯、蒼涼 | `shang mode pentatonic, solemn and desolate, Dorian-like color` |
| 角 | 明朗生機、初春感 | `jue mode pentatonic, fresh and hopeful, spring-like brightness` |
| 徵 | 熱烈歡快（民間吹打） | `zhi mode pentatonic, festive and fiery, bright celebratory feel` |
| 羽 | 哀婉柔潤（小調感） | `Chinese minor pentatonic (yu mode), melancholic, flowing like water` |

實務捷徑：模型多半聽得懂 `major pentatonic`（≈宮/徵）與 `minor pentatonic`（≈羽/商），疊情緒形容詞微調即可。西方調式（Dorian／Lydian／和聲小調等）的情緒對照在 `arrangement-theory.md` 第一節。

## 地域色彩清單

**西域／新疆（火焰山、絲路）**——手鼓 dap、熱瓦普 rawap、都塔爾 dutar、艾捷克 ghijak；木卡姆音階帶增二度：
> `Uyghur Silk Road music, galloping dap frame drum rhythm, plucked rawap and dutar lutes, exotic augmented-second scale (muqam flavor), desert caravan atmosphere, fiery and hypnotic`

**江南絲竹（水鄉、園林、文氣）**——二胡、笛子、琵琶、揚琴、簫；細膩加花：
> `Jiangnan sizhu chamber ensemble, gentle dizi bamboo flute and erhu, delicate pipa and yangqin dulcimer, flowing ornamented melody, elegant watertown serenity`

**廣東音樂（市井、明快）**——高胡領奏、滑音華麗：
> `Cantonese music style, bright agile gaohu fiddle lead, sparkling yangqin, playful sliding ornaments, lively teahouse mood, brisk and cheerful`

**北方嗩吶吹打（黃土地、民俗）**：
> `northern Chinese suona shawm and sheng mouth organ, loud rustic wind-and-percussion band, festive village celebration, raw piercing brass-like timbre`

**蒙古草原**——馬頭琴、長調、呼麥：
> `Mongolian steppe music, morin khuur horsehead fiddle drone, khoomei throat singing overtones, vast open grassland, epic and lonesome`

**西南少數民族（雲貴苗侗）**——蘆笙、葫蘆絲：
> `southwest Chinese minority folk, lusheng bamboo mouth organ ensemble, mellow hulusi gourd flute, tribal bamboo percussion, misty mountain village, earthy and dancing`

## 台灣在地家族——「台灣味，但不是中國風」

台灣案主（廟宇、老街、台語劇、地方創生）常同時要求「有在地味」與「不要中國風」，兩者不衝突：走台灣在地家族，不走上面的六大地域。

| 語境 | 樂器／語法（拼音＋英文類名雙寫） | 一句可貼 |
|---|---|---|
| 廟宇、遶境、陣頭 | `Taiwanese temple procession drum troupe`、`beiguan-style gongs and suona`、`temple bell`、`wooden fish (muyu) clicks`、`firecracker-like percussion bursts` | `raw and live Taiwanese temple drum troupe, beiguan gongs and suona calls, processional` |
| 文雅、茶席、古厝 | `nanguan pipa and dongxiao (slow, refined)` | `slow refined nanguan-style pipa and dongxiao flute, chamber intimacy` |
| 復古台味、老街、夜市、那卡西 | `nakashi accordion and electric organ`、`twangy electric guitar`、`moon lute (yueqin)` | `retro Taiwanese nakashi lilt — accordion, electric organ, twangy guitar, gentle shuffle` |
| 鄉鎮長輩、台語情感 | `Hokkien folk-song lilt` | `warm nylon guitar with a Hokkien folk-song lilt, brushed shuffle` |

**命中率未查證**：這批台灣詞在 ElevenLabs 上尚無實測紀錄（2026-09-02），上面六大地域詞有 2026-07-26 研究背書、媽祖案只驗證過「否定」那一側。用法：先照雙寫貼，聽起來像「醬油中國風」就退回**行為描述**（`raw processional gongs and shawm, live and unpolished`、`cheap electric organ and accordion, dance-hall lilt`），不用拼音。做過 A/B 後請把結果回寫到 `ai-model-vocab.md` 的實測表。

廟宇語境的嗩吶一律鎖定面孔（見末節）；佛教場域通常 `no suona, no firecrackers`，道教／民間信仰才是鼓陣與嗩吶的主場——分流細節在 `genre-playbooks.md` 第 17 型。

## 京劇鑼鼓經：動作場面的節奏語法

鑼鼓經＝鼓板、大鑼、小鑼、鐃鈸的節奏套語，功能是「引導—配合—收束」動作：

- **急急風**：最快速反覆的鑼鼓點，開打、廝殺、急上急下場——戰鬥 BGM 的打擊底
- **四擊頭**：四記重擊收在亮相——pose 定格的 hit point

模型無「鑼鼓經」概念，用材質＋行為描述近似：
> `Peking opera percussion battle pattern, frantic accelerating gongs and cymbals, rolling clappers and drum, sharp accented gong hits punctuating freeze-frame poses`

收尾亮相可單獨要求：`ending with four emphatic gong-and-cymbal strokes into a sudden stop`

## 1986《西遊記》許鏡清配方——「火焰山/西域風情」的大眾記憶原型

已查證屬實：**Yamaha DX7 合成器＋電子鼓＋民族樂器（古箏、琵琶）＋西洋管弦＋無詞女聲吟唱**（〈雲宮迅音〉配方，被稱為中國電子音樂第一曲）。西域段落再疊手鼓律動與增二度異域音階。

> `1986 Chinese TV fantasy score style, retro synthesizer lead with electronic drums, blended with pipa, guzheng and orchestral brass, ethereal wordless female vocals; add dap hand-drum groove and sinuous exotic scale with augmented seconds for desert flavor`

注意：無詞女聲吟唱與純器樂鐵則衝突——改寫 `no lyrics, no words, wordless vocals only`、不開 `force_instrumental`，規則正本在 `elevenlabs-music.md` 地雷清單「wordless choir／vocal-chop 與 force_instrumental 衝突」。

## 反向：使用者說「不要中國風樂器」時（媽祖案實證）

`ai-model-vocab.md` 的通則是「用名詞否定樂器不可靠（提到即召喚），改正面替代」。但 2026-09-02 媽祖園區落成片實測：**媽祖／廟宇語境下模型一定自動加鑼、二胡與五聲旋律，只給正面替代壓不住，必須點名**：

> `contemporary orchestral, no erhu, no guzheng, no dizi, no gongs, no pentatonic clichés`

兩條規則的分流（一般題材正面替代；文化強預設題材點名否定＋正面替代並用）正本在 `ai-model-vocab.md`「樂器否定的兩條規則」；逐樂器的正面替代整表在 `genre-playbooks.md` 第一節。真要留一絲東方色時只給「一條」：`a single bamboo flute line as color, not the lead`。

## 嗩吶的兩副面孔

紅白事通吃的樂器，**只寫 `suona` 模型常隨機給你辦喜事**，務必用形容詞鎖定哪一面：

- 喜劇面：`comedic suona solo, shrill playful bird-call imitations, fast tonguing and cheeky glissandi, rowdy wedding-band chaos`
- 悲愴面：`solemn suona lament, long wailing sustained notes over slow deep gongs, funeral procession gravity, piercing grief`
- 廟宇面（遶境、起駕，既不喜也不悲）：`festive processional suona calls over temple drums` 或作點綴 `one solemn suona line as color, not the lead`——二選一寫死，不要同時出現「festive」與「solemn」
