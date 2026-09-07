# 編曲與樂理工藝——用模型聽得懂的音樂語言描述「怎麼編」

用途：寫 prompt 時需要精確的分層／力度／轉折動詞，或旁白片、訪談片配樂時讀。研究彙整 2026-09-02，內含四支影片二十餘輪迭代確認的實戰原句。
這份檔補的是其他參考檔沒講的「編曲層」：調性／和聲／轉調／配器分層／力度曲線／節奏與拍號／轉折手法／音色人格／人聲之下的編曲。
判讀方法在 `scoring-craft.md`、旋律在 `melody-craft.md`、喜劇與懸疑進階在 `comedy-tension-advanced.md`、中國風在 `chinese-idioms.md`——本檔不重複那些內容，只在需要時指回去。

## 讀這份檔之前

**使用者的話 → 先看哪一節**

| 使用者說 | 看 |
|---|---|
| 「太厚／太滿」「放穩不要厚」 | 四（抽薄順序、`textures light never thick`） |
| 「高潮不夠跳」「拉升提早」 | 五（先蹲再跳、曲線原型） |
| 「轉折聽不出來」「每次重抽都要出來」 | 六末「節奏切換」全域鐵則＋七（動詞磨利） |
| 「太可愛了要有懸疑」「浪漫但不苦情」 | 一（底色決定直覺）＋八（人格表） |
| 「更壯觀」「甜度不夠」「不要俗氣」 | 八（人格表） |
| 「不要中國風樂器」「一直跑出鑼」 | 八末（文化預設要點名擋） |
| 「配樂把旁白蓋掉了」「訪談片要配」 | 九（人聲之下） |
| 「一開始就要進副歌」「升 key」 | 三（轉調）＋五（瞬間全滿） |
| 「這段 BPM 怎麼抓」「旁白片要不要鼓」 | 六（完整換算表、rubato 三解法） |

**三條前提**

1. **術語＋知覺化描述並列。** AI 音樂模型對純樂理術語的服從度不穩（調性「常中非必中」，調式更弱）。術語錨定方向，白話讓模型真的做到：`Lydian` 單獨寫不如 `Lydian brightness, floating and wide-eyed`。
2. **描述「音樂做什麼」優於「音樂是什麼」。** rises / thins / snaps back / lifts a key 這類動詞，比 epic / emotional 這類形容詞精準得多。本檔所有詞彙都盡量寫成動作（與 `melody-craft.md` 的輪廓動詞原則同源）。
3. **絕不寫作曲家、樂團、歌手、曲名。** 會回 `bad_prompt`。連衍生形容詞（某某風、某某式）都避免——想要某人的感覺，把那個感覺拆成調式＋配器＋質地寫出來。本檔所有範例都遵守這條，可直接貼用。

**驗證標記**

- ✔實戰：本 skill 實際案例（紅孩兒、敬師月、媽祖園區、彰化道安等）在 ElevenLabs Music 上確認有效的原句或原詞
- 【共識】：AI 音樂 prompt 社群普遍有效、或已在 `ai-model-vocab.md` 記錄
- 【推定】：樂理上正確、用效果詞包裝過，但尚未在 ElevenLabs 上專門驗證。用了之後結果好就升級標記；不要在未驗證前把【推定】升級

**字元預算的取捨順序**（1000 上限／900 目標不變）：時間錨點 ＞ 反面詞 ＞ 分層與力度動詞 ＞ 節奏與拍號 ＞ 調性調式 ＞ 和聲細節。樂理詞很省字（2–4 個字），但服從度最低，所以永遠排在錨點與反面詞之後刪。

---

## 一、調性與調式：情緒的底色

### 大調／小調之外

只寫 major / minor 只能分「亮／暗」。影視配樂真正好用的是調式——每個調式差一兩個音，情緒色彩卻完全不同。

| 調式 | 一句話色彩 | 影視慣用場景 | prompt 寫法（術語＋效果詞） | 標記 |
|---|---|---|---|---|
| Ionian（大調） | 明亮、篤定、圓滿 | 喜悅、勝利、廣告收尾 | `bright major key, warm and resolved` | ✔實戰（`bright major key`） |
| Aeolian（自然小調） | 憂鬱、內省、電影感 | 抒情、失落、預告片主體 | `natural minor, melancholic and cinematic` | 【共識】 |
| Dorian | 小調但不悲，帶一絲希望與酷勁 | 偵探、都會、民謠、太空 | `Dorian minor, cool and slightly hopeful, jazzy undertone` | 【推定】 |
| Lydian | 大調再往上飄一個音，驚奇、魔法、飛翔 | 童趣奇幻、發現、夢境、開闊天空 | `Lydian brightness, floating and wide-eyed, sense of wonder` | 【推定】 |
| Mixolydian | 大調但少了緊繃，鄉土、搖滾、開朗不正經 | 公路、鄉村、輕喜劇、慶典 | `Mixolydian major, laid-back and rootsy, bluesy swagger` | 【推定】 |
| Phrygian | 小調再壓一個音，異域、威脅、黑暗 | 反派、沙漠、格鬥、暗黑史詩 | `Phrygian minor, dark and exotic, menacing` | 【推定】 |
| Locrian | 不穩定到無法落地 | 極短的崩壞／瘋狂片段 | 幾乎不單獨用，寫 `unstable, never settling` 即可 | 【推定】 |
| 和聲小調 harmonic minor | 小調加一個升導音＝戲劇性、東方／中東色 | 復仇、宮廷陰謀、絲路 | `harmonic minor with an augmented-second twist, dramatic and exotic` | 【共識】（`augmented-second` 見 chinese-idioms） |
| 全音階 whole-tone | 沒有重心，飄浮、暈眩、夢 | 回憶溶接、催眠、魔法轉場 | `whole-tone haze, dreamlike and weightless` | 【推定】 |
| 八音階／減音階 octatonic | 對稱、機械、不祥 | 怪物、機關、驚悚追逐 | `symmetrical diminished-scale runs, sinister and mechanical` | 【推定】 |
| 五聲 pentatonic | 無半音摩擦＝純真、民謠、東方 | 童年、鄉土、中國風（見 chinese-idioms） | `major pentatonic, innocent and folk-like` | 【共識】 |
| 藍調音階 | 苦中帶笑、痞 | 都會喜劇、街頭 | `bluesy minor pentatonic with bent notes, sly and streetwise` | 【共識】 |

### 選調性的實務規則

- **底色決定直覺，樂器只是表情。** 要「懸疑但可愛」：小調底色（`sneaky minor-key … groove`）加可愛樂器，而不是大調底色加懸疑樂器。觀眾的直覺跟著底色走。✔實戰（道安三：從「太可愛」改到「有懸疑」靠的是換底色，不是加樂器）
- **要「喜悅」而不是「正經」**：`bright major key` ＋ `joyful lift` ＋ 高頻閃亮樂器（`glockenspiel sparkle`）。`quiet determination` 這類詞會把大調拉成正劇。✔實戰
- **要「浪漫但不苦情」**：大調＋ `joyful … love song`；段尾補 `Not sad, no melancholy`。用 `ballad` 一詞會往苦情靠。✔實戰
- **具體 key 名要不要寫？** ElevenLabs 官方支援 `in A minor` 這種寫法（見 elevenlabs-music.md）。實務上寫 key 名只在兩種情況有意義：(a) 要接現成曲，需同 key 或關係調；(b) 要指定轉調方向（`lift from D to E`）。其餘寫調式＋色彩即可，省字。
- **旁白片通常一個調到底**：`stays in one key throughout, no modulation` 可防模型自作主張。【推定】

---

## 二、和聲色彩速查

模型對和弦名稱的服從度比調式更低，但幾個「有名字的聲響」值得寫，因為它們同時是質地描述。

| 和聲手法 | 聽感 | 用途 | prompt 寫法 | 標記 |
|---|---|---|---|---|
| 掛留 sus2／sus4 | 懸著、未決、乾淨 | 開場、旁白底、等待 | `suspended chords, open and unresolved` | 【共識】 |
| 大七／加九 maj7／add9 | 夢幻、柔軟、都會 | 浪漫、城市夜景、溫情 | `dreamy major-seventh harmony, soft and glowing` | 【共識】 |
| 小七／小九 | 溫暖的憂鬱、爵士 | 都會抒情、偵探 | `mellow minor-seventh chords, smoky and reflective` | 【推定】 |
| 減七 dim7 | 不祥、懸疑、默片反派 | 危機逼近、偷偷摸摸 | `creeping diminished chords, sinister and unstable` | 【共識】 |
| 增三 aug | 驚奇又不安、魔法 | 魔法揭曉、幻覺 | `augmented chords shimmering with uneasy wonder` | 【推定】 |
| 空五度 open fifths | 古老、宏大、空曠、中性 | 史詩開場、荒原、儀式 | `open fifths, hollow and ancient, vast` | 【共識】 |
| 四度疊置 quartal | 現代、英雄、乾淨的力量 | 科技、都市英雄、新聞感 | `stacked-fourth harmony, modern and heroic` | 【推定】 |
| 音簇 cluster | 混亂、痛、恐怖 | 撞擊、驚嚇、崩潰 | `dissonant clusters` | 【共識】（comedy-tension-advanced 已用） |
| 半音中音 chromatic mediant | 突然換色、翻頁、奇觀 | 揭幕、飛越、時空跳躍 | `sudden chromatic-mediant shift, like the sky opening` | 【推定】 |
| 皮卡第三度 Picardy third | 小調曲末落在大調＝終於釋懷 | 悲劇收尾留一絲光 | `ends on an unexpected major chord, a ray of light` | 【推定】 |
| 借用小下屬 minor iv | 大調裡的一滴淚 | 甜中帶酸、離別 | `a bittersweet minor-chord borrowed into the major key` | 【推定】 |
| 不協和暗埋 | 美但不對勁 | 背叛、陷阱 | `a sour note buried underneath` | ✔實戰（scoring-craft「甜中藏毒」） |

### 和聲節奏（和弦多久換一次）

這是最少人寫、卻最影響「急不急」的參數：

- 一小節換一次以上＝推進、焦躁 → `chords changing every beat, restless`
- 兩小節換一次＝行進、敘事 → `steady chord changes every two bars`
- 整段不換（pedal／drone）＝懸置、儀式、等待 → `one static harmony held throughout`（見 comedy-tension-advanced 的 pedal point）

### 終止式：收尾的七種落法

`scoring-craft.md` 的「不解決的收尾」與「斷崖收乾」是其中兩種，這裡補齊。

| 終止 | 感覺 | prompt 寫法 | 標記 |
|---|---|---|---|
| 正格終止 | 圓滿、句號 | `lands firmly on the home chord` | 【共識】 |
| 變格終止（阿們） | 溫柔的釋然、宗教感 | `gentle plagal amen-like resolution` | 【推定】 |
| 半終止 | 問號、待續 | `ends on the dominant, left hanging like a question` | 【推定】 |
| 假終止 | 以為要結束卻沒有 | `deceptive cadence, a false ending that slips sideways` | 【推定】 |
| 不解決 | 委屈沒出口 | `Ends unresolved on a single held note` | ✔實戰 |
| 軟落 | 輕鬆收、不做作 | `ease onto a soft bright final chord` | ✔實戰 |
| 無終止（硬斷） | 剪接接手 | `stop dead mid-phrase — no ending chord, no fade-out, no reverb tail` | ✔實戰（模型常偷加 decay，剪輯時硬切即可，不要為 decay 反覆重抽） |

---

## 三、轉調：翻頁與升溫

轉調是「用一句話讓觀眾感覺場景換了」最省字的手段。六種手法對應六種戲劇功能：

| 手法 | 戲劇功能 | 放在哪 | prompt 寫法 | 標記 |
|---|---|---|---|---|
| **升 key**（升半音或全音） | 突然更亮、更激動、副歌翻倍 | 副歌再現、第二波高潮、情緒加碼點 | `lift a key higher at 20s` | ✔實戰（比漸強更突然、落差更大；道安一 20s） |
| **平行大小調互換**（同主音） | 小→大＝天亮、釋懷；大→小＝烏雲、翻臉 | 情緒反轉點 | `shifts from minor to its parallel major, the clouds part` ／ `darkens into the parallel minor` | 【推定】 |
| **關係大小調** | 微妙、不驚動觀眾的色溫變化 | 段落過渡 | `slips into the relative minor, a shade cooler` | 【推定】 |
| **遠關係／半音中音** | 翻頁、奇觀、時空跳躍 | 揭幕鏡頭、空拍展開、蒙太奇起點 | `a bold distant key change, like turning a page` | 【推定】 |
| **直接轉調**（不鋪墊） | 硬切、喜劇、拼貼 | 曲風急轉、gag 切換 | `hard genre switches on cue` ＋ `no transition, cut straight into the new key` | ✔實戰（前者）／【推定】（後者） |
| **樞紐轉調**（pivot） | 觀眾沒察覺就換了 | 旁白片段落間 | `modulates smoothly, almost unnoticed` | 【推定】 |

**與剪輯的配合**：轉調要落在切點上（比畫面早 0.2 秒），落在鏡頭中間會像出錯。多段變奏片最好每段一個明確 key／曲風宣告，模型才知道那是刻意的。

**反向使用**：模型會自己亂轉調。旁白片、氣氛片寫 `stays in one key, no modulation` 當防守。【推定】

---

## 四、配器分層：加法與減法

### 標準加法順序（從薄到滿）

這是管弦與流行編曲共用的「堆疊階梯」。寫 prompt 時按這個順序逐段宣告「現在有幾層」，模型的力度曲線會比只寫 crescendo 精確得多——模型常把 crescendo 做成純音量，而不是加樂器。

```
1  獨奏／單一音色      solo piano / solo cello / a lone flute
2  ＋低音              add a low pad / upright bass enters / sub-bass underneath
3  ＋律動              light pulse / shaker and soft kick / pizzicato pulse
4  ＋和聲牆            strings swell in / warm pad widens / choir hums
5  ＋對旋律            a counter-melody answers on horn / second violin line weaves
6  ＋銅管／合唱        noble horns join / epic wordless choir enters
7  全奏＋打擊          full orchestra with timpani, massive drums, everything at once
```

對應 prompt 動詞：`enters` `joins` `adds` `widens` `swells in` `layers up` `builds in clear steps`。✔實戰的完整組合：`noble horns, timpani, massive drums, epic wordless choir`（宏大高潮層，媽祖案）。

### 抽薄的反向順序（從滿到薄）

減法比加法更需要明說，因為模型的預設是「越後面越滿」。順序是先抽打擊與銅管、再抽和聲牆、最後只留獨奏＋低音或純獨奏：

```
From 84s ease down layer by layer, gently thinning     ✔實戰
By 90s already calm                                    ✔實戰（給緩衝，不要剛好壓線）
drums drop out first, then brass, leaving strings and piano     【推定】
strip back to solo piano and a low pad                 【推定】
```

`ease down layer by layer` 比「變小聲」精準——它告訴模型抽樂器而不是拉 fader。抽薄後的段落再補一句厚度上限：`textures light never thick`。✔實戰（敬師案：高潮要在市長致詞前結束、市長前放穩不要厚，就是這三句解決的）

### 織度厚薄的詞彙

| 薄 → 厚 | 詞彙 |
|---|---|
| 極薄 | `bare` `a single line` `nothing but` `hushed` |
| 薄 | `sparse` `airy` `transparent` `light` `thin` `open space` |
| 中 | `moderate` `clear layers` `uncluttered` |
| 厚 | `lush` `full` `dense` `rich` `wall of strings` |
| 極厚 | `massive` `towering` `colossal` `saturated` `everything at once` |

✔實戰：`hushed`、`light`、`towering`、`colossal`、`massive`；【共識】：`lush`、`airy`、`sparse`（見 ai-model-vocab）。

### 織度類型

不只厚薄，「怎麼疊」也有名字，而且模型多半聽得懂效果描述：

- **齊奏 unison**：所有人一條線＝力量、宣示 → `all instruments in unison, one massive line`
- **主旋律＋伴奏 homophonic**：最常見，旋律清楚 → `a clear melody over simple accompaniment`
- **對位 polyphonic**：多條線互咬＝聰明、緊張、豐富 → `interweaving counter-melodies`、`theme chasing itself in canon`（comedy-tension-advanced 已用）
- **支聲 heterophonic**：同一旋律各自加花＝中國絲竹、民間 → 見 chinese-idioms
- **層疊 ostinato**：固定音型上疊層＝推進 → `repeating rhythmic cell, gradually layering`（comedy-tension-advanced 已用）

### 音區與空間

- 低音區堆滿＝沉重、危險；高音區堆滿＝光、閃亮、緊繃。`weight in the low register` ／ `everything sits high and bright` 【推定】
- 八度疊奏＝宏大：`melody doubled in octaves across strings and horns` 【推定】
- 留空＝清楚：`hollow in the middle, low pad and high sparkle only` 【推定】——這也是「人聲之下」的核心手法（第九節）

---

## 五、力度曲線設計

`scoring-craft.md` 第二節講了「一支曲子只能有一個最大聲」與「保留樂器給真高潮」。這一節補的是把曲線畫出來的具體手法。

### 五種曲線原型

| 原型 | 形狀 | 適用 | 關鍵 prompt 句 | 標記 |
|---|---|---|---|---|
| **單峰** | 慢升→一個峰→抽薄收 | 形象片、感恩片、落成片 | `one single peak at 63s, never louder before or after` | ✔實戰概念（敬師案） |
| **先蹲再跳** | 峰前突然安靜，再全滿 | 要讓峰「跳」出來 | `pull back to a hush at 55s, then …` | ✔實戰（敬師案：終極峰前一段改成 hush，峰就跳出來了） |
| **階梯式** | 每 8 小節加一層，看得見台階 | 廣告、蒙太奇、倒數 | `builds in clear steps, each phrase adds a layer` | 【推定】 |
| **瞬間全滿** | 沒有前奏，第一拍就是副歌 | 片尾曲式、鼓舞、翻轉 | `crash straight into the chorus … instantly full, no build-up, no intro` | ✔實戰（道安一） |
| **雙峰呼應** | 開場一擊＋結尾一擊，中間壓住 | 史詩片頭尾扣 | `no choir until 157s`（天花板保留寫法）＋ 開場 5 秒內就爆 | ✔實戰概念（媽祖案：4.9s 雲隙光與 157.5s 雕像特寫，choir 只在這兩處） |

### 動態手法工具

- **天花板保留**：`powerful but deliberately held back, no choir and no gong yet` ✔實戰（`no … yet` 讓模型理解是節制而非做小）
- **突弱 subito piano**：全滿中瞬間掉到耳語，比漸弱更抓人 → `sudden drop to a whisper, no fade` 【推定】
- **突強 sforzando／accent**：單發重音 → `one massive slamming downbeat hit` ✔實戰（`one` ＋ `downbeat` 指定單發正拍）
- **一擊不延續**：`a single hit, no sustain`、`then stop dead`、`Three seconds only` ✔實戰
- **hairpin 漲落**：小幅呼吸式起伏，適合旁白底 → `gentle breathing swells, never dramatic` 【推定】。注意：`swells` 是尾段防守要禁的詞，用在旁白底時記得加 `never dramatic` 限制
- **懸而未決**：pedal point／ostinato（見 comedy-tension-advanced）→ `sustained low string pedal, unresolved`
- **尾段永不再起**：`Never rises again`、`no build`、`no big build, no push`、`drop the epic scale completely and never return to it` ✔實戰

### 力度等級對照

模型不認 pp / ff 這類記號，用效果詞：

| 樂譜 | 效果詞 |
|---|---|
| ppp–pp | `barely there` `a whisper` `hushed` ✔ |
| p | `soft` `gentle` `quiet` |
| mp–mf | `moderate` `steady` `easygoing` ✔ |
| f | `full` `strong` `bold` |
| ff–fff | `towering` ✔ `colossal … thunderous` ✔ `massive` ✔ `everything at once` |

### 收尾方式一覽

| 方式 | prompt 句 | 標記 |
|---|---|---|
| ta-da 扣上 | `full flourish crescendo landing one emphatic ta-da button hit at 9.5s, tight clean stop, no fade` | ✔實戰（「尾端做到滿」） |
| 硬斷 | `stop dead mid-phrase — no ending chord, no fade-out, no reverb tail` | ✔實戰 |
| 軟落 | `laid-back … easygoing … ease onto a soft bright final chord` | ✔實戰（「後面不要浮誇，輕鬆收」） |
| 懸著 | `Ends unresolved on a single held note` | ✔實戰 |
| 餘響 | `abrupt stop with a long ringing tail` | 【共識】（comedy-tension-advanced） |
| 淡出 | 盡量不用——模型的淡出常拖太長，剪輯做更準 | — |

---

## 六、節奏、拍號與切點密度

### 完整換算表

`scoring-craft.md` 第六節只講原則與常用值。實際上要先決定**一刀對應幾拍**，同一個切點間隔可以對應三種速度；形象片與旁白片（一刀 1.5–4 秒）若按一刀一拍會算出 15–40 BPM 的荒謬值。

公式：`BPM = 60 × (每刀拍數) ÷ (平均切點間隔秒)`

| 平均間隔 | 一刀一拍 | 一刀兩拍 | 一刀一小節（4/4） | 怎麼選 |
|---|---|---|---|---|
| 0.25s | 240 ✗ | 120 | 60 | 不寫 240；寫 120–150 ＋ `dense 16th-note percussion` |
| 0.33s | 180 | 90 | 45 | 動作段用一刀一拍 180 太急，多半取一刀兩拍 90 ＋ `driving eighths` |
| 0.4s | 150 | 75 | — | 快板動作甜蜜點（一刀一拍） |
| 0.5s | 120 | 60 | — | 中快板；追逐、蒙太奇 |
| 0.67s | 90 | 180 ✗ | — | 輕鬆行進、都會（一刀一拍 90） |
| 0.75s | 80 | 160 | — | 抒情行進（80）；蒙太奇要更衝取一刀兩拍 160 ＋ `cut every 2 beats` |
| 0.8s | 75 | 150 | — | 蒙太奇／產品廣告：一刀一拍 75 低於第 4 型 95–125，取一刀兩拍 150 ＋ `cut every 2 beats` |
| 1.0s | 60 | 120 | — | 慢板；或當成 120 的兩拍一刀 |
| 1.5s | 40 → rubato | 80 | 160 | 旁白片常見：一刀兩拍 80 |
| 1.6s | 37 → rubato | 75 | 150 | 對白喜劇：一刀兩拍 75 ＋ `cut every 2 beats`，或一刀一小節 150（快口喜劇）；要進 100–140 可改 3/4 一刀三拍＝112 |
| 2.0s | — | 60 | 120 | 對話、訪談 |
| 3.0s | — | — | 80 | 長鏡頭、風景 |
| 4.0s | — | — | 60 | 抒情、空拍 |
| 6–8s | — | — | 30–40 → 改寫 `rubato` | 純氛圍，不要給脈搏 |

**選列規則**
- 動作、喜劇、蒙太奇：一刀一拍（音樂跟每刀）
- 形象片、旁白片：一刀兩拍或一刀一小節（音樂跨過剪點，見 comedy-tension-advanced「鋪長線」）
- **換算值落在該型 playbook 的 BPM 範圍之外時**（genre-playbooks 說「量測優先」，指的是切點間隔優先，不是硬套一刀一拍的數字）：改取每刀拍數——往右挪一欄（一刀兩拍／一刀一小節）或往左挪——直到 BPM 進範圍，並在 prompt 明寫對應關係：`cut every 2 beats`／`one cut per bar`。兩欄都不進範圍時取最接近者；或改拍號讓「一刀一小節」成立（3/4 一刀三拍：1.6s → 112；6/8 一刀六個八分：1.5s → 240 八分＝80 附點四分）。BPM 是第一級指令（官方掛保證），寫錯直接影響成品，寧可多寫一句 `cut every 2 beats` 也不要憑感覺
- 換算出來超過 180：不是速度問題，是**細分密度**問題——BPM 壓回 120–150，改寫 `16th-note` / `tremolo` / `rapid percussion` 讓密度來自細分而不是速度
- 換算出來低於 50：不要給穩定脈搏，改 rubato（下文）
- 這些 BPM 是本 skill 的工作慣例（經驗值），不是模型硬限制

### 半拍體感（half-time feel）

同一個 BPM，backbeat 落在第三拍而不是二、四拍，聽起來慢一半但細分依然密——**壯闊又有動能**的標準做法。媽祖案量到現成曲演算法 152 BPM、體感是 76 半拍；新 cue 用同一 BPM 家族接上才不會跳。✔實戰（量測與銜接經驗；演算法 BPM 一律人耳確認半拍／倍拍）

- `76 BPM half-time feel, heavy backbeat, busy hi-hat underneath` 【推定】（詞彙本身未在 ElevenLabs 單獨驗證）
- 反向：`double-time feel` 讓慢歌突然變急而 BPM 不變（comedy-tension-advanced 的 `half-time groove shifting to double-time` 已用）

### 拍號的情緒

| 拍號 | 感覺 | 用途 | prompt |
|---|---|---|---|
| 4/4 | 中性、行進 | 預設 | 不用寫 |
| 3/4 | 華爾滋、旋轉、優雅／醉 | 舞會、回憶、諷刺的優雅 | `in a lilting waltz, 3/4` 【共識】 |
| 6/8 | 搖擺、英雄行進、海洋 | 冒險、船、搖籃 | `rolling 6/8, heroic and swaying` 【推定】 |
| 12/8 | 藍調、慢搖、深情 | 靈魂樂、慢舞 | `slow 12/8 shuffle, soulful` 【推定】 |
| 5/4 | 數不穩、酷、間諜 | 追蹤、偵探、科技 | `in 5/4, off-kilter and cool` 【推定】 |
| 7/8 | 焦躁、跛行 | 懸疑、機關 | `propulsive, in 7/8`（comedy-tension-advanced 已用） |

### 律動的質感

- **直拍 vs 搖擺**：`straight eighths` ＝機械、現代；`swung` / `shuffle` ＝人味、慵懶、爵士。✔實戰：`light shuffle drums`、`laid-back … easygoing`
- **切分**：`syncopated, pushing ahead of the beat` ＝興奮；`behind the beat, lazy` ＝慵懶 【共識】
- **錯拍笨拙**：見 comedy-tension-advanced `off-beat accents, deliberately clumsy syncopation`

### 旁白片的 rubato

旁白片最大的節奏問題是**旁白本身沒有節拍**。給它一個固定脈搏，每個句尾都會跟鼓打架。三種解法：

1. **無脈搏**：`rubato, free-flowing, no steady pulse, no drums` ——純氛圍、感恩、追思 【推定】
2. **暗示脈搏**：脈搏來自琶音或撥弦而非鼓組 → `pulse implied by a soft piano arpeggio, no drum kit` 【推定】
3. **慢而穩**：一刀兩拍 70–80 ＋ `gentle, unhurried pulse`——大多數形象片的安全解 【共識】

配合 `ritardando`（`slowing down into the final phrase`）與 `accelerando`（`gradually quickening`）處理段落交接。【共識】

### 節奏切換

- 硬切：`hard tempo switch at 20s`、`hard genre switches on cue` ✔實戰
- 順切：metric modulation（見 comedy-tension-advanced）
- **全域鐵則**：`Every mood switch must be clearly heard — distinct, never smoothed over` ✔實戰（多段變奏片放 prompt 第一段，每次重抽轉折都出得來；反面詞放該段描述之後才管得住該段）

---

## 七、轉折手法工具箱

`comedy-tension-advanced.md` 的 stinger 類型學（sting／button／sneak／bridge）與預告片語彙（braam／riser／impact）已涵蓋一部分，這裡補齊成完整工具箱，按「用來做什麼」分類。`scoring-craft.md` 第三節的洩氣／急煞／斷崖是基礎款，這裡列出它們的變體與相鄰手法。

### A. 打點類（一個點）

| 手法 | 長度 | 用途 | prompt | 標記 |
|---|---|---|---|---|
| hit | 瞬間 | 撞擊、揭曉、定格 | `one massive slamming downbeat hit` | ✔實戰 |
| stinger／sting | 1–5s | 驚嚇、笑點、反轉 | `short comedic sting ending on a hard button` | 【共識】 |
| button | 瞬間 | cue 結尾扣上 | `one emphatic ta-da button hit … tight clean stop` | ✔實戰 |
| tag | 1–3s | 收尾後再補一小句（喜劇「補刀」） | `after the stop, a tiny two-note tag, then silence` | 【推定】 |
| 鑼／鈸 choke | 瞬間 | 亮相、東方定格 | `sharp gong hit, choked immediately` | 【推定】 |
| whip／snap | 瞬間 | 甩、抽、快速動作 | `whip-crack snare` | 【推定】 |

### B. 停止類（讓音樂消失）

| 手法 | 用途 | prompt | 標記 |
|---|---|---|---|
| dead stop | 幻想破滅、發現不妙 | `stops dead — instant cut, one beat of silence` | ✔實戰 |
| 中句硬斷 | 剪接接手 | `stop dead mid-phrase — no ending chord, no fade-out, no reverb tail` | ✔實戰 |
| 唱片刮停 | 卡通急煞、喜劇「等等」 | `record-scratch stop, everything halts mid-note` | 【推定】（急煞概念在 scoring-craft ✔） |
| 全休止 GP | 觀眾跟著愣住 | `sudden dead stop, then one quiet note` | 【共識】 |
| 延長記號 fermata | 懸在半空 | `hold the last note, suspended, time stops` | 【推定】 |
| 抽掉音樂 dropout | 爆點前一刻 | `music drops out completely, only silence before the impact` | 【共識】 |
| 靜默段 | 中段留白 | `TOTAL SILENCE 23s to 29s, absolutely nothing` | ✔實戰（服從度低；備案拆成兩段 cue 各自生成再剪） |

**急停點選哪一格**：選「幻想破滅的那一格」（角色皺眉），不是「現實物件出現的那一格」（停標誌）——讓死寂蓋住表情，音樂再跟物件同步懟出。✔實戰（道安一）

### C. 推升類（往上走）

| 手法 | 用途 | prompt | 標記 |
|---|---|---|---|
| riser | 爆點前 1–4 秒 | `long rising sweep into a massive hit` | 【共識】 |
| tremolo build | 懸疑升溫、喜劇假緊張 | `rising tremolo` | ✔實戰 |
| 半音上行 | 越來越危險 | `chromatically rising strings` | 【共識】 |
| 鼓 fill | 進副歌前 | `drum fill leading into the chorus` | 【推定】 |
| pickup／弱起 | 讓段落「跳」進來 | `a quick pickup into the downbeat` | 【推定】 |
| 鈸漲 cymbal swell | 溫和的推升 | `cymbal swell into the next section` | 【共識】 |
| 反向鈸 | 電子感的吸氣 | `reverse-cymbal suck into the drop` | 【推定】 |
| 升 key | 副歌翻倍 | `lift a key higher` | ✔實戰 |

### D. 落下類（往下走）

| 手法 | 用途 | prompt | 標記 |
|---|---|---|---|
| drop | 電子／預告片：推升後的重擊落地 | `the drop lands at 32s, heavy and wide` | 【共識】 |
| breakdown | 抽掉所有律動只剩和聲，喘息 | `breakdown to pads only, no drums` | 【共識】 |
| 洩氣 deflate | 喜劇翻車 | `everything deflates — lone bassoon and a sad trombone slide` | ✔實戰（scoring-craft） |
| 下滑 gliss／fall | 墜落、失敗 | `trombone fall`、`slide whistle drop`（後者俗氣，見第八節） | 【共識】 |
| 逐層抽薄 | 高潮後退場 | `ease down layer by layer, gently thinning` | ✔實戰 |
| 鬆一口氣 | 假緊張解除 | `relief exhale` | ✔實戰 |

### E. 回來類

| 手法 | 用途 | prompt | 標記 |
|---|---|---|---|
| snap back | 從變奏彈回主調性 | `snaps back to the sleuth groove`（動詞要利，`sneaks back` 太軟） | ✔實戰 |
| 假結尾 | 以為完了又來 | `false ending, then one more surge` | 【推定】（與「尾段不再起」衝突，只在刻意時用） |
| 主題再現 | 見 melody-craft | `triumphant full reprise of the opening motif` | 【共識】 |
| prelap | 音樂先進畫面後到 | `intro that can start under the previous scene` | 【共識】 |

### F. 轉場類

| 手法 | 用途 | prompt | 標記 |
|---|---|---|---|
| 上滑 gliss | 魔法、進入幻想 | `harp glissando upward, entering a dream` | 【共識】 |
| 曲風硬切 | 拼貼、多段變奏 | `hard genre switches on cue` | ✔實戰 |
| 半音中音翻頁 | 揭幕 | `a bold distant key change, like turning a page` | 【推定】 |
| 淡接 | 前後 cue 銜接 | `Open hushed`（接上一首淡出） | ✔實戰（媽祖案接現成曲） |

**使用原則**（延續 comedy-tension-advanced「hit 稀有才有力」）：每場最多 2–3 個打點類、1–2 個停止類；**推升類永遠成對出現**——有 riser 就要有它落到的 hit 或 drop，單獨的 riser 是模型最愛自己補高潮的破口。

---

## 八、樂器與音色的情緒人格（不限喜劇）

`comedy-tension-advanced.md` 有喜劇人格表（低音管、短笛、弱音小號、木琴、slide whistle、口簧、撥弦）。這裡按**情緒**反查：想要某種感覺時，哪些樂器天生就是那個人格。每列的第一組是實戰或共識最穩的，後面是備選。

| 想要的感覺 | 天生就是的樂器／音色 | 一句 prompt | 標記 |
|---|---|---|---|
| **可愛** | marimba、finger snaps、airy pads、glockenspiel、pizzicato、ukulele、口哨 | `playful marimba, finger snaps, airy pads` | ✔實戰（這三樣就是「可愛」的來源） |
| **喜悅／閃亮** | glockenspiel、鐘琴、高音鋼琴、明亮弦樂、handclaps | `glockenspiel sparkle, joyful lift, bright major key` | ✔實戰 |
| **甜（戀愛）** | clean electric guitar 唱 hook、bright acoustic guitar、鋼琴＋弦樂、豎琴 | `clean electric guitar sings the hook, honey-sweet` ／ `bright acoustic guitar … campus love-song style, sugary` | ✔實戰（甜度靠旋律載體換樂器：電吉他＝偶像劇腔、木吉他＝校園情歌腔） |
| **懸疑（偵探／潛行）** | walking upright bass、muted pizzicato、vibraphone、bass clarinet、brushes、低音長笛 | `sneaky minor-key sleuth groove — walking upright bass, muted pizzicato, vibraphone, bass clarinet, brushes` | ✔實戰 |
| **詭異／不安** | 弓拉 vibraphone、celesta 走音、glass-like 高音、金屬刮擦、顫音弦樂 | `uncanny … eerie shimmer, hushed` | ✔實戰（仙女從 `angelic shimmer` 改 `uncanny`） |
| **宏大／史詩** | noble horns、timpani、massive drums、epic wordless choir、低音銅管、大鑼 | `noble horns, timpani, massive drums, epic wordless choir` | ✔實戰 |
| **溫暖** | cello、warm strings、felt piano、nylon guitar、電鋼琴、clarinet 低音區 | `warm cello and felt piano, intimate and tender` | 【共識】 |
| **冷／疏離** | glassy synth pads、高把位持續小提琴、冰冷鐘聲、prepared piano、乾的數位 pluck | `glassy cold synth pads, icy high strings, detached` | 【推定】 |
| **廉價／俗氣**（要避開時用來點名） | slide whistle、kazoo、circus organ、woodblock、goofy synth | 反面詞：`Not corny: no slide whistle, no kazoo, no circus` | ✔實戰 |
| **有趣但有品** | pizzicato、finger snaps、shuffle drums、marimba、muted brass 輕觸 | `sly witty groove — nimble pizzicato, finger snaps, light shuffle drums, playful marimba — cheeky but classy` | ✔實戰（拿掉 goofy／woodblock 換來的） |
| **神聖／莊嚴** | 管風琴、合唱、鐘、低音弦樂長音 | `church organ and hushed choir, solemn bells` | 【共識】 |
| **懷舊** | music box、老鋼琴＋膠片雜音、弱音小號（非喜劇語境）、口琴、tape saturation | `music-box melody over vinyl crackle, faded and nostalgic` | 【共識】（`tape saturation` 官方有效） |
| **童真** | toy piano、music box、直笛、木琴、口哨、kalimba | `toy piano and kalimba, innocent and small` | 【共識】 |
| **哀傷** | solo cello、oboe、雙簧類哀鳴管、鋼琴單音、低音弦樂 | `solo cello lament over sparse piano` | 【共識】 |
| **希望／黎明** | 鋼琴上行＋弦樂漸入、法國號、長笛 | `piano rising into warm strings, a horn call of hope` | 【共識】 |
| **危險／威脅** | 低音銅管、taiko、sub-bass、低音弦樂 tremolo、金屬打擊 | `low brass growl, taiko and sub-bass, menacing` | 【共識】 |
| **科技／未來** | analog synth arpeggio、pulsing bass、乾淨數位 pluck、glitch 打擊 | `pulsing analog synth arpeggio, clean and futuristic` | 【共識】 |
| **鄉土／田園** | acoustic guitar、口琴、fiddle、mandolin、手風琴 | `acoustic guitar and fiddle, rustic and sunlit` | 【共識】 |
| **都會／時尚** | 電鋼琴、brushed drums、upright bass、薩克斯（輕）、vibraphone | `mellow electric piano and brushed drums, late-night city cool` | 【共識】 |
| **浪漫（正劇）** | 弦樂、鋼琴、豎琴、雙簧管 | `sweeping strings and piano, tender and romantic` | 【共識】 |
| **緊張（喜劇內）** | tiptoe pizzicato、rising tremolo、木管顫音 | `tiptoe pizzicato, rising tremolo, then relief exhale` | ✔實戰（mock-tension 與真懸疑的差別在收法：有 exhale） |

### 同一樂器的多重人格

跟 chinese-idioms 的「嗩吶兩副面孔」同理，幾個樂器不加形容詞就會抽錯面：

- **弱音小號**：喜劇＝嘲諷哇哇腔；懷舊＝深夜寂寞。寫 `sarcastic wah-wah muted trumpet` 或 `lonely muted trumpet, late-night`
- **手風琴**：法式浪漫 vs 東歐酒館 vs 探戈。加地域詞
- **合唱**：史詩（`epic wordless choir`）vs 神聖（`hushed sacred choir`）vs 恐怖（`whispering dissonant choir`）。要 wordless choir 時反面詞改寫 `no lyrics, no words`，不要寫 `no singing`（force_instrumental 是否會連 choir 一起砍掉：未查證，建議實測）
- **鋼琴**：`felt piano`（親密）／`bright concert piano`（正式）／`toy piano`（童真）／`prepared piano`（詭異）——一定要加前綴
- **木琴類**：xylophone＝骨頭、機械、卡通；marimba＝溫暖、可愛；vibraphone＝懸疑、爵士。三者不可互換

### 「提到即召喚」與文化預設的衝突

一般題材正面替代優先、文化強預設題材（廟宇、婚禮、聖誕、國樂團畫面）點名否定＋正面替代並用（`no erhu, no guzheng, no dizi, no gongs` ✔實戰）——兩條規則的分流正本在 `ai-model-vocab.md`「樂器否定的兩條規則」，逐樂器替代表在 `genre-playbooks.md` 第一節。真要東方色但不要「醬油中國風」時，改讀 `chinese-idioms.md` 選地域。

---

## 九、人聲之下的編曲

旁白片與訪談片的配樂，第一任務不是好聽，是**不擋人聲**。SKILL.md 步驟一提到「留中頻空間」（`sparse mid-range`），這一節講具體怎麼留。這是形象片最常見的配樂失敗原因。

### 頻段常識

人聲基頻約 85–255 Hz，語音清晰度（子音、辨識）集中在 1–4 kHz，整體「存在感」在 200 Hz–4 kHz。【共識，聲學常識，非 API 事實】
配樂只要在這個帶裡放**持續且忙碌**的東西（中音區旋律、密集鋼琴、飽滿銅管、有歌詞感的合成器），旁白就會糊。

### 配器選擇：往上、往下、往慢

| 位置 | 安全 | 危險 |
|---|---|---|
| **低頻**（旁白以下） | sub-bass、low pad、大提琴長音、低音鼓輕點 | 忙碌的 bass line、低音銅管持續 |
| **高頻**（旁白以上） | glockenspiel、high sparkle、shaker、高把位弦樂長音、豎琴泛音 | 尖銳的高音旋律（短笛、高音小號） |
| **中頻**（旁白所在） | 慢起音 pad、柔弱的弦樂鋪底（音量低）| 中音區主旋律（雙簧管、小號、薩克斯、電吉他 lead）、密集鋼琴、無詞合唱（跟人聲搶同一種音色） |
| **節奏** | 稀疏、無 snare 或很輕的 brush | 密集 hi-hat、重 snare、每拍都有東西 |

一句話寫法：`low pad and high sparkle, hollow in the middle, leaving room for the voice` 【推定】；既有 ✔ 的簡短版是 `sparse mid-range`。

### 旋律怎麼放

- **旁白進行中**：沒有主旋律，只有和聲與質地 → `no lead melody under the narration` 【推定】
- **旁白空窗**：旋律或動機在這裡才登場，而且要寫時間碼 → `melodic phrase blooms at 41s–47s in the gap, then recedes` 【推定】
- 動機短（2–5 音，見 melody-craft），句子短，不與旁白的句子搶呼吸

### 旁白片 vs SOT 片：兩種不同的節目

| | 旁白片（VO 貫穿） | SOT 片（訪談／同期聲片段） |
|---|---|---|
| 人聲特性 | 連續、經過處理、音量穩定 | 斷續、現場收音、音量不穩、含環境音 |
| 音樂角色 | 情緒 bed，全程存在 | 更透明，常被 duck 到很低甚至抽掉 |
| 峰值放哪 | 旁白空窗（能量圖上的谷） | SOT 段之間的 B-roll／轉場 |
| 節奏 | 可有溫和脈搏（一刀兩拍 70–80）| 盡量無明顯拍點，否則與 SOT 的剪點打架 |
| 中頻策略 | 留但可有柔弱鋪底 | 中頻幾乎清空，`transparent` |
| prompt 關鍵 | `gentle bed under narration, rises only in the gaps at 41s and 88s` 【推定】 | `transparent, sits far under dialogue, no pulse, no lead` 【推定】 |

**能量圖是判讀依據**：把音軌每 2–5 秒的 RMS 畫出來，空窗＝音樂可獨佔聲場的峰值位置，大聲 SOT 段＝音樂必須透明。✔實戰（跨案例通則：四支片有三支靠能量圖找到空窗才定峰值）。這比看 contact sheet 更直接，旁白片一定要做——峰值的雙重條件是「畫面戲劇重量 ∩ 人聲空窗」。`analyze_video.sh` 固定輸出能量表（`energy.txt`，每 0.5s RMS dB）與空窗清單（`gaps.txt`），直接用。

### 混音是另一件事

prompt 能做的是讓音樂**天生**不擋人聲；生出來之後，ducking／sidechain、在 2–4 kHz 挖一刀 EQ，仍然要在剪輯軟體做。不要期待一句 `leaves room for the voice` 取代混音。

---

## 十、把這些組起來：三個段落範本

下面是「一段」的寫法，不是整支 prompt。目的是示範樂理詞怎麼在 900 字元預算裡跟錨點、反面詞共存。

**A. 溫情旁白形象片的高潮與退場（單峰＋抽薄）**

```
Builds in clear steps from 60s — strings widen, glockenspiel sparkle, joyful lift in a bright major key — to one single peak at 78s, textures light never thick. From 84s ease down layer by layer, gently thinning; by 90s already calm, solo piano and a low pad, no lead melody under the narration. Never rises again.
```

**B. 史詩落成片的雙峰扣（開場即爆＋天花板保留）**

```
Opens hushed on open fifths; at 4.9s the sky opens — noble horns, timpani, massive drums, epic wordless choir, towering. Then pull back to a hush; 76 BPM half-time feel, held back, no choir until 157s. At 157s the colossal reprise, thunderous, vast and monumental. No erhu, no guzheng, no dizi, no gongs.
```

**C. 喜劇多段變奏的一次轉折（dead stop → 硬切曲風 → snap back）**

```
Every mood switch must be clearly heard — distinct, never smoothed over. At 13.5s stops dead — instant cut, one beat of silence. At 14s crash straight into a joyful love song, bright major key, clean electric guitar sings the hook, honey-sweet, instantly full, no build-up. At 20s lift a key higher. At 24s snaps back to the sneaky minor-key sleuth groove.
```

三段各 300–360 字元（python 實測），樂理詞（open fifths、half-time feel、bright major key、lift a key）加起來不到 40 字元——**樂理詞便宜，動詞與錨點才是主體**。

---

## 十一、落地心法

1. **每個段落至少寫「幾層」＋「往哪走」**：`solo piano` → `strings enter` → `full` → `thinning`，比任何形容詞都精準
2. **調性寫色彩不寫學名**，學名只在需要指定轉調方向或接現成曲時出現
3. **轉折動詞要利**：snaps / crashes / stops dead / lifts；軟動詞（sneaks / drifts / fades）只用在真的要軟的地方
4. **推升與落下成對**：有 riser 就要有它落的點；有峰就要寫它怎麼退
5. **人聲之下：往上、往下、往慢**，中頻只放慢起音的鋪底，旋律進空窗
6. **文化預設要點名擋**：一般情況正面替代，題材會召喚固定樂器時點名否定＋替代並用
7. **【推定】的詞用了有效就回來升級成 ✔實戰**，讓這份表越用越準
