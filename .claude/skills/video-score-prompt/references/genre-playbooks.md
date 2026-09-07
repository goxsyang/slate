# 影片類型配樂 Playbook——快速定調、精準、有多樣性

整理日期 2026-09-02。來源：本 skill 四支影片二十餘輪實戰（敬師月／媽祖園區／彰化道安一、三篇）、
既有六份 reference、以及配樂實務慣例。**這份檔回答「這種片該從哪裡起手」，不取代量測與判讀**——
量測（`scripts/analyze_video.sh`）與判讀（`scoring-craft.md`）永遠先做，playbook 只是把起手式從零推敲縮短成填數字。

BPM 範圍與結構比例是配樂慣例，不是任何模型的 API 事實；模型服從度以 `ai-model-vocab.md` 為準。
所有 prompt 詞彙一律描述性，**絕不寫作曲家／樂團／歌手／曲名**（ElevenLabs 會回 `bad_prompt`）。

---

## 〇、怎麼用這份檔（三步）

1. **對類型**：用下方「使用者的話 → 類型」索引找到 playbook；一支片常同時命中多型（例：落成片＝史詩＋宗教民俗；縣府地創形象片＝形象片＋職人＋地創）。**同時命中多型時：交付對象／用途（標案、局處形象、廣告、婚禮）優先於題材詞（地創、職人、廟宇、美食）；題材型只借配器**，不套它的結構與首選方向。仍拿不定就以「結尾字卡／logo 所屬的那型」為主（落成片結尾是揭幕 logo → 史詩型；地創片結尾是縣府 logo → 形象片型）。
2. **選方向**：每型有 A／B／C 三個方向，先問自己「這個案主怕什麼」（怕俗、怕太中國、怕太商業）再選，不確定就 A。
3. **套骨架改數字**：骨架 ≤600 字元、以該型典型長度為例；把量測拿到的錨點秒數填進去，補上該型「必寫反面詞（≤3 項，一組並列算一項）」，「選寫」反面詞有預算才加，總長壓 900 字元以下再交付。跨型疊加或加了「不要太中國風」整組時預算一定爆，砍法照 `ai-model-vocab.md`「反面詞內部優先序」（點名文化樂器 ＞ 尾段不再起 ＞ 該型頑固預設一句 ＞ 情緒防守）。
   算式是「骨架＋這支片的量測錨點＋該型必寫反面詞＝目標 800–900 字元」——骨架刻意留空給錨點，**不要直接貼骨架交付**（少了這支片的轉折描述），也不要一路加到超過 1000（會靜默截斷）。每加一個錨點順手實測一次：`python3 -c "print(len(open('prompt.txt').read().rstrip()))"`。錨點數依片長的預算（每 20–25 秒約 1 個、全曲 ≤6，經驗值）與取捨順序見 `ai-model-vocab.md`「prompt 結構最佳化模板」。

### 使用者的話 → 類型索引

| 使用者常說 | 類型 | 首選方向 |
|---|---|---|
| 形象片、標案、局處、年度成果、企業簡介 | 1 政府／企業形象片 | A 鋼琴弦樂 |
| 宣導、防詐、道安、衛教、公益 | 2 公益宣導 PSA | 看落點：溫情 A／警示 C |
| 活動花絮、開幕、論壇、園遊會、精華 | 3 活動紀錄 | A 律動 pop |
| 產品片、新品、功能、規格 | 4 產品廣告 | A 極簡電子 |
| 品牌故事、創辦人、職人、老店 | 5 品牌故事 | A 木吉他鋼琴 |
| Reels、Shorts、直式、社群 | 6 短影音 9:16 | 看內容 |
| 短劇、搞笑、台語劇、鄉土 | 7 喜劇短劇 | A 機靈不俗 |
| 偶像劇、韓劇感、告白、戀愛 | 8 浪漫／偶像劇仿作 | A 清音電吉他 |
| 驚悚、懸疑、詭異、恐怖梗 | 9 驚悚懸疑 | A 弦樂低鳴 |
| 落成、揭牌、里程碑、大器、宏偉 | 10 史詩／里程碑 | A 管弦合唱 |
| 紀錄片、訪談、口述、人物誌 | 11 紀錄片／訪談 | A 極簡鋼琴 |
| 婚禮、成長、家庭、週年 | 12 婚禮／家庭紀念 | A 鋼琴情歌 |
| 兒童、教材、幼兒園、繪本 | 13 兒童教育 | A 木琴烏克 |
| 運動、賽事、健身、追逐、打鬥 | 14 運動／動作 | 看畫面質感 |
| 科技、AI、智慧、未來、數位 | 15 科技／未來感 | A 玻璃極簡 |
| 旅遊、美食、小鎮、地方創生、市集 | 16 旅遊／美食／地創 | A 咖啡館爵士 |
| 廟宇、媽祖、進香、遶境、法會 | 17 宗教／民俗 | 看世代：B 現代交響鼓陣 |
| 敬師、畢業、感恩、校慶 | 18 教育／感恩 | A 鋼琴弦樂暖 |
| vlog、日常、chill、讀書 | 19 Lo-fi vlog | A jazz-hop |
| 帶貨、團購、開箱、優惠 | 20 電商帶貨 | A pop-electro |
| 遊戲、動畫、角色、冒險 | 21 遊戲／動畫 | 看畫風 |
| MG、說明動畫、資訊圖表、字幕動畫 | 22 Kinetic typography／MG | A 木琴撥弦 |

索引表命中多型時的優先序：**交付對象／用途 ＞ 題材詞**。「縣政府＋地方創生＋職人」是第 1 型（形象片）借第 16／5 型配器，不是第 16 型的 bossa nova；「廟宇落成」是第 10 型借第 17 型鼓陣；「品牌短影音」是第 6 型借第 4 型 hook。

---

## 一、通用層（每型都適用）

### 1. 多樣性機制：三軸至少換兩軸

同一類型要出 3 個「明顯不同」的方向，靠三條軸切換；**每個方向與前一個至少差兩軸，且配器家族為必換軸**——只換律動與時代感、配器家族不換（例如「電子直拍 150 BPM」vs「混合 half-time 150 BPM」都是電子鼓底）聽感仍會很接近，不算換方向：

| 軸 | 選項 | 換軸後 prompt 要動的位置 |
|---|---|---|
| **配器家族** | 管弦 orchestral／電子 electronic／原聲民謠 acoustic-folk／爵士 jazz／混合 hybrid／台灣在地 Taiwanese-local | 第一段樂器清單＋每段 texture 詞 |
| **律動** | 直八分 straight／搖擺 shuffle-swing／半拍 half-time／密集十六分 driving 16ths／無脈動 rubato, no pulse | BPM 數字＋律動描述（`brushed shuffle`、`half-time feel`） |
| **時代感** | 電影感無時代 timeless cinematic／復古 retro 70s–90s／當代 contemporary／未來 futuristic | 製作詞（`tape saturation`、`vinyl crackle`、`glassy digital`、`wide modern mix`） |

實作方式：五段模板的**時間軸段落（第二到第五段）完全不動**，只換第一段的「類型＋配器＋BPM」與各段 texture 詞。這樣三版落點一致、剪接對位表共用，使用者可跨版本拼段落（session 實證：多段變奏 cue 一次抽中全部的機率低，一次生 3–4 版跨版本拼是常態）。

跟「同 prompt 重抽 2–3 次」的差別：重抽是修運氣，換軸才是換方向。使用者說「換一個感覺」→ 換軸；說「這版調性跑掉」→ 先重抽。

聽感驗收：三版各聽前 10 秒，若閉眼分不出是三首不同的曲子（同一種鼓底、同一種主奏樂器），就是沒換到配器家族，回三軸表重組。

各型固定的 A／B／C 是「該型最常見案主」的示範；**受眾是年輕族群／要活力**時，各型的極簡科技或 timeless 電影感方向通常不合用，改用「當代流行」組合：pop-electro（electronic，straight，`bright synth chords, four-on-the-floor`）／funk 復古（jazz-hybrid，shuffle，`funky guitar, slap bass, brass stabs`）／indie-rock 樂團（acoustic-band，straight，`live drums, jangly guitars, anthemic`）——三者配器家族互異，可直接當三方向。

### 2. 旁白／對白共存的通用策略（各型再細分）

音軌能量圖（每 2–5 秒 RMS）先讀出旁白／SOT 的分佈與空窗，然後：

- **空窗＝音樂獨佔聲場的位置**：峰值、hook、hit 全部排在空窗；旁白密集段只給 bed。
- **透明 bed 的寫法**：`transparent bed under narration, sparse mid-range, no lead melody competing with the voice`；旋律放到高音（glockenspiel、high strings）或低音（cello、sub pulse），中頻讓給人聲。
- **段落動詞**：進旁白 `thin out to a soft pulse at Ns`，出旁白 `melody returns at Ns`。
- **致詞／長 SOT 前要收**：`By Ns already calm`（敬師案：市長致詞前收乾）——給 3–6 秒緩衝，不要收在致詞第一個字上。
- 生成後在剪輯軟體做 ducking 是常態，prompt 只負責「那裡本來就薄」，不必期待模型做 sidechain。

### 3. 台灣語境的兩大高頻要求

**「不要太中國風」**——問題通常出在三處：五聲音階旋律、國樂樂器、宮廷劇弦樂語法。替代表：

| 模型愛加的 | 反面詞 | 正面替代（同步寫才管得住） |
|---|---|---|
| 二胡 | `no erhu` | `solo cello` / `viola line` |
| 古箏 | `no guzheng` | `harp` / `nylon guitar arpeggios` / `piano arpeggios` |
| 笛子 | `no dizi` | `alto flute` / `clarinet` / `low breathy flute`（若真要一絲東方色，只給「一條」：`a single bamboo flute line as color, not the lead`） |
| 鑼 | `no gongs` | `orchestral bass drum` / `Taiwanese temple drum troupe`（廟宇語境） |
| 五聲旋律 | `no pentatonic clichés` | `modern diatonic melody` |
| 宮廷劇弦樂 | `no Chinese palace-drama strings` | `contemporary film strings` |

一句可貼的整組：`contemporary orchestral, no erhu, no guzheng, no dizi, no gongs, no pentatonic clichés`（媽祖案實證有效）。
這與 `ai-model-vocab.md`「用名詞否定樂器不可靠、改正面替代」的通則不衝突，分流規則是：**一般題材正面替代優先；題材本身會觸發文化強預設（廟宇、婚禮、聖誕、國樂團畫面）時，點名否定＋正面替代並用**，反面詞放在該段描述之後。
要「台灣味但不中國」→ 走台灣在地家族：`Taiwanese temple drum troupe`、`beiguan gongs and suona`（廟宇）、`nanguan pipa and dongxiao`（文雅）、`nakashi accordion and electric organ`（復古台味）、`Hokkien folk-song lilt`、`moon lute (yueqin)`——這批台灣詞的命中率**未查證**，雙寫法與退回行為描述的做法見 `chinese-idioms.md`「台灣在地家族」節。
反過來，使用者**真的要**東方色（水鄉、絲路、蒙古、京劇打鬥）時，別在這張表打轉——回 `chinese-idioms.md` 選地域、調式與鑼鼓語法，那份檔是本表的正面。

**「不要俗氣」**——俗氣的來源固定：滑管哨、kazoo、馬戲團、廉價合成銅管、罐頭企業烏克麗麗＋口哨＋拍手、ta-da 號角。整組：
- 正面：`classy, tasteful, restrained, understated elegance, characterful`
- 反面：`Not corny: no slide whistle, no kazoo, no circus, no cheesy synth brass, no stock-corporate ukulele and whistling, no hand claps, no ta-da fanfare`
- 喜劇要「有趣但不俗」：`sly witty groove — nimble pizzicato, finger snaps, light shuffle drums, playful marimba — cheeky but classy`（道安案實證）。
- 例外：兒童教育、活動紀錄、旅遊可以用 ukulele／claps，那裡它們不俗，是類型語言。

**「太商業／太罐頭」**——模型不懂 `no stock-library`，改正面：`original, characterful, with a distinct melodic identity`，並給一個具體 hook 描述（見 `melody-craft.md` Hook 節）。

### 4. 結構模板的共用記號

- 比例用全長百分比寫，套用時換算成秒數再對到量測的切點。
- `hush`＝低於 bed 的靜謐開場；`lift`＝一次明確抬升；`peak`＝全曲唯一最大聲；`ease down layer by layer`＝逐層抽薄；`button`＝結尾扣上的一擊；`stop dead`＝硬斷無尾音。
- 每型只標「該型最常需要的事件」，其餘照 `scoring-craft.md`。

---

## 二、各類型 Playbook

### 1. 政府／企業形象片

- **核心情緒詞**：`dignified, warm, forward-looking, confident, hopeful, trustworthy, quietly proud, uplifting`
- **配器／BPM**：piano、warm strings、soft pulse（muted kick 或 pizzicato）、glockenspiel、light cymbal swells；80–110 BPM。標案審查口味：大器但溫暖，不要太商業、不要太史詩。
- **結構（60–180s）**：hush 10% → 敘事鋪陳 35%（旁白密）→ lift 10% → peak 15%（放在旁白空窗或 logo 前）→ ease down 20% → button 10%。若有長官致詞，peak 必須在致詞前 3–6 秒收完。
- **必寫反面詞（≤3）**：`Never rises again`、`no stock-corporate ukulele and whistling`、`no epic drums`；**選寫**：`no choir, no hand claps, not sad, no melancholy`；旁白多時加正面句 `textures light never thick`。
- **失敗模式**：① 罐頭感——加 hook 描述與 `characterful`；② 太史詩——清 `epic/tutti/fiery`，peak 改 `broad and warm, not thunderous`；③ 峰值撞旁白——peak 移到空窗，加 `By Ns already calm`；④ 偏正經拉走喜悅——別用 `quiet determination`，用 `joyful lift, bright major key`。
- **旁白共存**：`transparent bed under narration, melody only in narration gaps`；峰值 12–15 秒內收。
- **三方向**：A 鋼琴＋弦樂（timeless，straight）／B 電子脈衝＋合成 pad（contemporary，half-time，智慧城市／科技局處）／C 木質民謠（acoustic-folk，shuffle，社區、農業、長照）。
- **骨架（60s 為例）**：

```text
Warm uplifting corporate score, 60s, dignified and hopeful. Piano, warm strings, soft muted pulse, glockenspiel sparkle. Instrumental, no singing.

Open hushed, solo piano, 92 BPM, bright major key, transparent bed under narration. Strings enter at 12s.

At 28s a joyful lift — pulse and full strings, textures light never thick. Peak at 40s in the narration gap: broad and warm, no epic drums, no choir.

From 46s ease down layer by layer, gently thinning. By 52s already calm. Soft bright chord at 59s, short tail. No ukulele, no whistling, no hand claps. Never rises again.
```

### 2. 公益宣導 PSA

- **核心情緒詞**：溫情線 `sincere, gentle, caring, reflective, reassuring`；警示線 `sobering, uneasy, ticking, unresolved, then relief`
- **配器／BPM**：felt piano、soft strings、subtle pad、light guitar；60–85 BPM。警示線：low drone、ticking pulse、single piano note。
- **結構（30–90s）**：問題 30%（稀疏或低鳴）→ 轉折 10%（一個明確的 `turn`）→ 解方 40%（暖、升）→ tagline 20%（收乾、留一個明亮尾音）。道安／防詐常是「驚悚→釋然」或「喜劇→一句正經」，見類型 7、9。
- **必寫反面詞（≤3）**：溫情線 `no melodrama, no epic, no build at the end`；警示線但不想嚇人時 `no horror sting, no jump scare`；**選寫**：`no weeping violins, no comedy`。
- **失敗模式**：① 苦情過頭——去 `tragic/heartbreaking`，用 `tender but hopeful`；② 前段太亮沒把問題當真——問題段給 `uneasy, sparse, minor tint`；③ 最後一句 slogan 被音樂蓋掉——`drop to a single held note under the final line`。
- **旁白共存**：幾乎全程旁白，`stays under the voice throughout`，peak 只允許在 slogan 前的 2–4 秒空窗。
- **三方向**：A felt piano 親密（timeless）／B 暖電子脈衝（contemporary，half-time，年輕族群）／C 木吉他台灣民謠感（acoustic，`Hokkien folk-song lilt`，鄉鎮長輩受眾）。
- **骨架（45s 為例）**：

```text
Sincere public-service score, 45s, gentle and reassuring. Felt piano, soft strings, subtle warm pad. Instrumental, no singing.

Open sparse and uneasy, single piano notes over a low soft drone, 72 BPM, minor tint, stays under the voice.

At 14s the turn — warm major key, strings enter tenderly, a simple hopeful 4-note motif, rising slowly.

At 30s a gentle peak, tender but hopeful, never loud. From 36s thin out to piano only. Under the final line at 41s a single held bright note, then soft stop. No melodrama, no weeping violins, no epic, no build at the end.
```

### 3. 活動紀錄（花絮／精華）

- **核心情緒詞**：`upbeat, energetic, celebratory, vibrant, buoyant, feel-good momentum`
- **配器／BPM**：drums、bass、guitars、synth stabs、brass hits、claps（此型可用）；110–128 BPM。
- **結構（60–120s）**：teaser 5%（片名／場地空鏡，稀疏）→ drop 10%（第一個爆點對到開場切點）→ groove 45%（含 SOT 時降成 pulse）→ 第二 drop 25%（人潮／高潮活動）→ outro 10%（logo，`tight ending on a downbeat`）。
- **必寫反面詞（≤3）**：`no vocals, no long intro, no corporate ukulele`；**選寫**：`no cheesy EDM risers on every cut`；若案主是公部門，以 `no aggressive bass, family-friendly energy` **取代必寫第 3 項** `no corporate ukulele`（必寫維持 ≤3）。
- **失敗模式**：① 從頭 high 到尾沒起伏——明寫 `breathe at Ns: strip to drums and bass`；② drop 不在切點——drop 秒數對量測的密度爆發起點且早 0.2s；③ SOT 被蓋——`under interview at Ns drop to a sparse pulse, groove returns at Ns`。
- **旁白共存**：SOT 段 `drums only, no melody`；旁白型花絮走類型 1 的透明 bed。
- **三方向**：A funk-pop groove（electronic，straight）／B cinematic hybrid drums（hybrid，half-time，論壇／頒獎）／C indie-folk stomp-clap（acoustic-folk，shuffle，市集／園遊會）。
- **骨架（90s 為例）**：

```text
Upbeat feel-good event score, 90s, celebratory and vibrant. Punchy drums, funky bass, bright guitar chops, brass stabs, hand claps. Instrumental, no singing.

Open with a light teaser, filtered and sparse, 120 BPM, 4 bars. Drop at 6s — full groove hits on the cut.

At 34s under interview thin to drums and bass only, no melody. Groove returns at 48s with a lift.

Second drop at 66s, biggest energy, brass stabs and claps, feel-good major key. From 82s ride out, tight ending on a downbeat at 89s, no fade. No vocals, no long intro, no cheesy risers.
```

### 4. 產品廣告（15–30s）

- **核心情緒詞**：`sleek, confident, crisp, premium, punchy, effortless`
- **配器／BPM**：minimal electronic、analog synth plucks、tight drums、sub bass、one signature sound（`glass pluck`／`metallic hit`）；95–125 BPM。
- **結構（15–30s）**：hook 0–3s（不許 intro）→ feature beats 60%（每個功能一個 accent）→ reveal hit 80% 處 → tagline tail 15%（`clean stop with a short bright tail`）。
- **必寫反面詞（≤3）**：`no intro, no fade-out, no vocals`；**選寫**：`no slow build, no cheesy synth brass`
- **失敗模式**：① 5 秒 intro 吃掉 15 秒廣告的三分之一——`starts instantly full`；② hook 出現太晚——`4-note hook in the first 2 seconds`；③ 太吵蓋旁白——`sparse, leaves the mid-range open`；④ 食品／生活類用了冷科技聲——換 B 方向。
- **旁白共存**：`rhythm carries under the voice, hook in the first 3 seconds and again under the tagline`。
- **三方向**：A 極簡科技（electronic，straight，3C／金融）／B 溫暖有機（acoustic＋brushes，shuffle，食品／保養／家居）／C 大膽銅管＋hip-hop swagger（hybrid，half-time，潮牌／運動）。**年輕族群／活力型產品**（手搖飲、零食、潮流小物）A 不合用，換成 pop-electro（`bright synth chords, four-on-the-floor`）／funk 復古（`funky guitar, slap bass, brass stabs`）／indie-rock 樂團（`live drums, jangly guitars, anthemic`），見第一節末。
- **骨架（20s 為例）**：

```text
Sleek premium product score, 20s, confident and crisp. Analog synth plucks, tight electronic drums, deep sub bass, one glassy signature hit. Instrumental, no singing.

Starts instantly full, no intro, 112 BPM, a 4-note hook in the first 2 seconds, sparse mid-range under the voice.

Accents on each feature at 5s, 9s and 13s — a crisp pluck hit each time, no build between them.

At 16s the reveal — one clean bold hit, then hook restated under the tagline. Clean stop at 19.5s with a short bright tail, no fade-out, no cheesy synth brass.
```

### 5. 品牌故事（創辦人／職人／老店）

- **核心情緒詞**：`heartfelt, authentic, grounded, weathered, quietly proud, nostalgic turning hopeful`
- **配器／BPM**：nylon 或 steel acoustic guitar、piano、warm strings、brushed drums、harmonica 或 clarinet 一條線；70–100 BPM。
- **結構（60–180s）**：起源 25%（稀疏，`a single guitar`）→ 困境 20%（minor tint，`hesitant`）→ 轉折 10%（`the turn`，加暖）→ 今日 30%（full，`quietly proud`）→ 願景 15%（不再堆高，`settles`）。
- **必寫反面詞（≤3）**：`no epic, no corporate polish, no build at the end`；**選寫**：`not sad, no melodrama`
- **失敗模式**：① 沒有弧線一路暖——困境段一定要給 minor tint；② 太光滑像企業片——`slightly rough, live-room feel, imperfect and human`；③ 訪談被旋律干擾——旋律只在 b-roll。
- **旁白共存**：訪談為主，`stays under speech, melody only in the b-roll gaps at Ns and Ns`。
- **三方向**：A 木吉他＋鋼琴（acoustic-folk，straight）／B 鋼琴＋弦樂電影感（timeless，rubato 開場）／C 台味復古（`warm nylon guitar, harmonica, brushed shuffle, a Hokkien folk-song lilt`，老店／市場／漁港）。
- **骨架（90s 為例）**：

```text
Heartfelt brand-story score, 90s, authentic and grounded. Nylon acoustic guitar, warm piano, soft strings, brushed drums. Instrumental, no singing.

Open with a single guitar, 84 BPM, hesitant and nostalgic, stays under speech, melody only in b-roll gaps.

At 22s a minor tint — sparse, uncertain, piano alone. The turn at 40s: warmth returns, strings enter, a simple hopeful motif.

From 55s full and quietly proud, live-room feel, imperfect and human. From 76s settle, guitar and piano only, ends on a warm resolved chord at 89s. No epic, no corporate polish, not sad, no build at the end.
```

### 6. 短影音（9:16 社群）

- **核心情緒詞**：`instant, hooky, punchy, trendy, scroll-stopping`
- **配器／BPM**：plucks、trap hi-hats、808 bass、claps、vocal-chop 質感（純器樂寫 `vocal-chop textures, no words`；要 vocal-chop 時 negative 只寫 `no lyrics, no words`，**不要開 `force_instrumental`**——它是否會連無詞人聲一起砍掉未查證，見 `elevenlabs-music.md`）；90–140 BPM（trap 用 half-time 70）。
- **結構（15–60s）**：hook 0–2s（無 intro）→ 每 5–8 秒一個變化（切換 hi-hat 密度或加 pluck）→ drop 對到最強畫面 → loop-ready 結尾（`ends on a downbeat that can loop back to the start`；模型服從度未實測）。
- **必寫反面詞（≤3）**：`no intro, no fade-out, no vocals with words`；**選寫**：`no slow build`
- **失敗模式**：① 開頭 3 秒沒東西被滑掉——`starts on the hook, first beat full`；② 太完整像正曲——要 `loop-based, minimal changes`；③ 講話型內容被蓋——用 lo-fi 或 minimal beat（類型 19）。
- **旁白共存**：talking-head 用 `minimal beat, no melody, leaves the voice on top`；純畫面才給旋律。
- **三方向**：A lo-fi chill（electronic，half-time，日常／開箱）／B bright pop-electro（contemporary，straight，美妝／穿搭）／C dramatic trailer-cut（hybrid，`braam and riser into a hit`，反轉／驚喜）。
- **骨架（30s 為例）**：

```text
Punchy social-video beat, 30s, hooky and trendy. Bright synth plucks, crisp trap hi-hats, deep 808 bass, claps, vocal-chop textures without words. No lyrics, no words, wordless vocal chops only.

Starts on the hook, first beat full, no intro, 140 BPM half-time feel. Hi-hats double at 8s.

Drop at 15s on the cut — bass and claps hit together, biggest moment. At 22s strip to plucks and bass for a breath.

Ends at 29.5s on a clean downbeat that can loop back to the start, no fade-out, no slow build.
```

### 7. 喜劇短劇（含台語短劇）

- **核心情緒詞**：`sly, witty, cheeky, zany, mock-serious, deadpan`；台味線 `retro Taiwanese variety-show flavor, twangy, nakashi lilt`
- **配器／BPM**：pizzicato、marimba、clarinet、bass clarinet、muted trumpet、tuba、brushes、finger snaps；100–140 BPM。台味：`electric organ, twangy electric guitar, nakashi accordion, moon lute (yueqin)`。
- **結構**：底色 groove → gag 點各一 hit／sting → 急停（`stops dead — instant cut, one beat of silence`）→ 反轉段 `hard genre switch on cue` → 收尾 button（`ta-da button hit` 或反向的 `one quiet note`）。路線抉擇（裝傻 vs 搶答）與 stinger 類型見 `comedy-tension-advanced.md`。
- **必寫反面詞（≤3）**：`Not corny: no slide whistle, no kazoo, no circus`（一組算一項）；**選寫**：`no epic, no drama`（情境正經、裝傻派配樂時升為必寫）；台語劇要「台味但不俗」加 `no cheesy synth brass, tasteful`。
- **失敗模式**：① 太可愛沒懸疑——底色換 `sneaky minor-key sleuth groove — walking upright bass, muted pizzicato, vibraphone, bass clarinet, brushes`，marimba／snaps／airy pads 是可愛的來源；② 轉折被抹平——加全域鐵則 `Every mood switch must be clearly heard — distinct, never smoothed over`，動詞磨利（`snaps back` 不是 `sneaks back`）；③ 急停點選錯——選「幻想破滅的那一格」（表情），不是「現實物件出現」；④ 三段式沒遞進——`same gag, slyer` → `stranger` → `the grandest`；⑤ 喜劇內的緊張變真懸疑——`tiptoe pizzicato, rising tremolo` 收在 `relief exhale`。這五條的展開說明與三種底色配方（可愛／偵探／不俗）在 `comedy-tension-advanced.md`「喜劇篇實戰補遺」與「樂器的喜劇人格」。
- **對白共存**：對白喜劇走裝傻派、低音量、`sparse, never steps on the dialogue`；肢體喜劇才 `mickey-mousing every gag`。
- **三方向**：A 機靈不俗（jazz，shuffle，`cheeky but classy`）／B 卡通 slapstick（orchestral，`zany cartoon score, mickey-mousing`）／C 台味復古（Taiwanese-local，`electric organ and twangy guitar, nakashi lilt, 80s Taiwanese TV comedy feel`）。
- **骨架（40s 為例）**：

```text
Sly witty comedy score, 40s, cheeky but classy. Nimble pizzicato, finger snaps, shuffle drums, playful marimba, muted trumpet. Every mood switch must be clearly heard, never smoothed over. Instrumental, no singing.

Sneaky groove, 118 BPM, deadpan minor key. Gag hits at 8s and 15s — one crisp accent each, no build.

At 22s stops dead — instant cut, one beat of silence. At 23s snaps back as a grand orchestral swell, played straight.

At 33s deflates — lone bassoon, sad trombone slide. One ta-da button hit at 39.5s, tight stop, no fade. Not corny: no slide whistle, no kazoo, no circus.
```

### 8. 浪漫／偶像劇仿作

- **核心情緒詞**：`giddy, honey-sweet, dreamy, heart-fluttering, sugary, falling-in-love bliss`
- **配器／BPM**：clean electric guitar sings the hook（韓劇腔）、piano、lush strings、light pop drums、bells；72–100 BPM。校園情歌腔：`bright acoustic guitar`。
- **結構**：片尾曲式「直接進副歌」——`crash straight into the chorus, instantly full, no build-up`（0%）→ 副歌 40% → 升 key 抬升（`lift a key higher at Ns`，韓劇簽名手法）→ 甜度最高段 30% → 收（`ease onto a soft bright final chord`）。仿作用於喜劇時，下一段接急停（見類型 7）。
- **必寫反面詞（≤3）**：`Not sad, no melancholy, no ballad sobbing`（一組算一項）；**選寫**：`no minor key`；純器樂時 `no singing` 但可留 `vocal-like guitar phrasing`。
- **失敗模式**：① 苦情——用 `joyful love song` 不用 `ballad`；② 甜度不夠——旋律載體換吉他並加 `honey-sweet, sugary`；③ 慢慢起沒有落差——`instantly full` ＋升 key 取代漸強。
- **對白共存**：仿作段通常無對白（幻想段）；有對白時 `guitar hook only between lines`。
- **三方向**：A 韓劇清音電吉他（contemporary，straight）／B 日系 city-pop 明亮合成（retro 80s，`bright synth chords, slap-bass lilt`）／C 校園情歌木吉他（acoustic，shuffle）。
- **骨架（25s 為例）**：

```text
Joyful romantic love-song score, 25s, honey-sweet and dreamy. Clean electric guitar sings the hook, lush strings, warm piano, light pop drums, bells. Instrumental, no singing.

Crash straight into the chorus at 0s — instantly full, no build-up, no intro, 88 BPM, bright major key, giddy falling-in-love bliss.

At 12s lift a key higher, strings soar, sugary and glowing, the sweetest moment.

From 20s ease onto a soft bright final chord, guitar phrase lingering, ends at 24.5s. Not sad, no melancholy, no ballad sobbing.
```

### 9. 驚悚懸疑

- **核心情緒詞**：`ominous, creeping, dread, unsettling, held breath, unresolved`
- **配器／BPM**：low drone、sub pulse、string tremolo、col legno taps、prepared-piano clicks、metallic scrapes、a ticking clock；60–90 BPM 或無脈動。
- **結構**：hush 20%（幾乎無聲，`only a low drone`）→ creep 40%（`chromatically rising`、`slowly layering`）→ 爆前抽掉 5%（`music dropout, silence`）→ sting 1 秒 → 餘波 25%（`unresolved held note` 或轉釋然）。「安靜比大聲緊張」與 pedal point 見 `comedy-tension-advanced.md`。
- **必寫反面詞（≤3）**：`no melody, no trailer braams, no jump-scare hit on every cut`；**選寫**：`no epic`；不想嚇到觀眾（道安宣導）時，以 `unsettling but never terrifying` **取代必寫第 3 項** `no jump-scare hit on every cut`（必寫維持 ≤3）。
- **失敗模式**：① 一開始就太響——`starts almost silent`；② 恐怖弦樂 cliché 滿場——`restrained, mostly texture and pulse`；③ sting 過長——`one sharp sting, half a second, then dead silence`；④ 之後接喜劇反轉時餘波太重——`cut to nothing at Ns`。
- **對白共存**：`a single sub-bass pedal under the dialogue, nothing else`。
- **三方向**：A 管弦低鳴（orchestral，rubato）／B 電子脈衝 dread（electronic，`slow synth pulse, dark analog`）／C 有機質地（`scrapes, creaks, breath-like textures, no instruments recognizable`）。
- **骨架（30s 為例）**：

```text
Creeping suspense score, 30s, ominous and unresolved. Low sustained drone, sub-bass pulse, string tremolo, metallic scrapes, a faint ticking clock. Instrumental, no singing.

Starts almost silent, only the drone, no pulse, no melody. At 8s the ticking and a slow sub pulse at 60 BPM begin.

From 14s chromatically rising tremolo strings, slowly layering, never resolving. At 22s music dropout — total silence for one second.

At 23s one sharp sting, half a second, then dead silence. From 24s a single held low note, unresolved, fading by 29s. No epic, no trailer braams, no melody.
```

### 10. 史詩／落成／里程碑

- **核心情緒詞**：`grand, monumental, towering, colossal, solemn turning triumphant, vast, noble`
- **配器／BPM**：noble horns、timpani、massive drums、soaring strings、epic wordless choir（與 `no singing` 衝突——negative 只擋 lyrics：`no lyrics, no words`，且**不要開 `force_instrumental`**，它是否會把 choir 一起砍掉未查證，見 `elevenlabs-music.md`）；70–90 BPM（half-time 體感，媽祖案現成曲演算法估 152≈體感 76）。
- **結構（120–200s）**：`Open hushed` 3%（可接現成曲淡出）→ 開場爆點 5 秒內（`burst at 5s`，雲隙光／空拍揭露）→ 鋪陳 35%（旁白，收成 bed）→ 儀式段 20%（hold，`held back, no choir yet`）→ 真高潮 10%（`colossal, thunderous, choir`，對到完工／揭幕特寫）→ noble outro 15%（`settles with dignity`）。choir 只在頭尾兩個震撼點出現，頭尾呼應。
- **必寫反面詞（≤3）**：媽祖／廟宇卻不要中國風：`no erhu, no guzheng, no dizi, no gongs`（點名文化樂器，一組算一項，永遠第一個保）；**選寫**：`no trailer braams`（視案主口味）；旁白段加正面句 `textures light never thick`。
- **失敗模式**：① 不夠壯觀——genre 升 `Epic ... grand and monumental`，峰值詞升 `towering / colossal / thunderous / vast`；② 兩個震撼點分不出層級——第一個 `powerful but held back, no choir and no gong yet`；③ 黑畫面 placeholder 被當低谷——曲線不為它們留低谷；④ 銜接現成曲不順——量 BPM 與能量曲線，新 cue 同 BPM 家族、`Open hushed`。
- **旁白共存**：中段全部 bed，`horns only in narration gaps`。
- **三方向**：A 管弦＋合唱（orchestral，half-time）／B 混合預告片式（hybrid，`synth pulse under orchestra, modern wide mix`）／C 台灣廟宇鼓陣融合（Taiwanese-local，`temple drum troupe and suona stabs over orchestra`，要台味時）。
- **骨架（180s 為例）**：

```text
Epic ceremonial score, 180s, grand and monumental. Noble horns, timpani, massive drums, soaring strings, epic wordless choir. No lyrics, no words, wordless choir only.

Open hushed, low strings, 76 BPM. At 5s a towering burst — full brass and choir, then settle to a warm bed under narration by 14s, textures light never thick.

At 60s a powerful swell, held back, no choir yet. From 96s hold solemn and noble, sparse.

At 150s the colossal peak — thunderous drums, full choir, vast and monumental. From 162s settle with dignity, broad resolved chord at 179s. No erhu, no guzheng, no dizi, no gongs.
```

### 11. 紀錄片／訪談片

- **核心情緒詞**：`observational, contemplative, understated, patient, honest, unhurried`
- **配器／BPM**：felt piano、muted strings、subtle guitar harmonics、ambient pad、occasional cello；60–80 BPM 或無脈動。
- **結構**：長弧線、事件少——`slow arcs, very few events`；章節轉場給 `a gentle shift at Ns`；全片最多一個 `quiet peak`。
- **必寫反面詞（≤3）**：`no dramatic swells, no build, stays under speech`；**選寫**：`no epic, no emotional manipulation`
- **失敗模式**：① 音樂替觀眾決定情緒——`neutral, lets the words carry the emotion`；② 太有存在感——`barely there, ambient`；③ 每次訪談切 b-roll 都起——限制事件數。
- **訪談共存**：`piano notes only between sentences, never under the voice`；長訪談段可全靜。
- **三方向**：A 極簡鋼琴（timeless，rubato）／B ambient 電子（`soft granular pad, slow filtered pulse`）／C 室內弦樂（`small string ensemble, sustained, chamber intimacy`）。
- **骨架（120s 為例）**：

```text
Understated documentary score, 120s, contemplative and honest. Felt piano, muted strings, soft ambient pad. Instrumental, no singing.

Open barely there, single piano notes, no pulse, neutral, lets the words carry the emotion, piano only between sentences.

A gentle shift at 40s — strings enter sustained, still under speech. At 78s a quiet peak, warm but restrained, no swell.

From 95s thin back to piano, ends unresolved on a single held note at 119s. No dramatic swells, no build, no epic, stays under speech throughout.
```

### 12. 婚禮／家庭紀念

- **核心情緒詞**：`tender, glowing, nostalgic, joyful tears, warm, intimate, radiant`
- **配器／BPM**：piano、acoustic guitar、warm strings、music box、glockenspiel、light brushes；70–95 BPM。
- **結構**：準備段 20%（`gentle, intimate`）→ 儀式 25%（`swell`）→ 派對 25%（`upbeat, light drums`）→ 誓言／信 20%（`tender, piano only`）→ 收 10%（`radiant final chord`）。成長紀錄：music box 開場 → 全團 → music box 回來。
- **必寫反面詞（≤3）**：`not sad, no melancholy, no epic drums`；**選寫**：`no cheesy, no corporate`
- **失敗模式**：① 甜到膩——加 `restrained, elegant`；② 誓言段被蓋——`piano only under the vows`；③ 派對段變 EDM——`light brushed drums, never club`。
- **對白共存**：誓言／信件 `single piano under the words`，旋律只在空窗。
- **三方向**：A 鋼琴情歌（timeless）／B indie-folk（acoustic，shuffle，戶外婚禮）／C 弦樂四重奏（`string quartet elegance`，教堂／飯店）。
- **骨架（90s 為例）**：

```text
Tender wedding score, 90s, glowing and intimate. Warm piano, acoustic guitar, soft strings, music box, glockenspiel. Instrumental, no singing.

Open gentle and intimate, music box and piano, 80 BPM, bright major key.

At 20s a warm swell as strings enter — radiant, elegant, restrained. At 42s lighter and joyful, brushed drums, guitar strums, never club.

At 62s piano only under the vows, tender, single notes. At 78s one last warm bloom of strings, ends on a radiant resolved chord at 89s. Not sad, no melancholy, no epic drums, no cheesy.
```

### 13. 兒童教育

- **核心情緒詞**：`bouncy, curious, friendly, bright, playful, gentle wonder`
- **配器／BPM**：ukulele（此型合法）、glockenspiel、marimba、toy piano、recorder、light claps、bouncy bass；100–125 BPM。
- **結構**：簡單循環，`question-and-answer phrasing`；每個知識點一個小 accent；結尾 `cheerful button`。
- **必寫反面詞（≤3）**：`no sudden loud hits, no drama, no minor key`；**選寫**：`no distortion, no epic`
- **失敗模式**：① 太幼稚令大人受不了——`charming, not babyish`；② 老師講解被蓋——`very light, mostly plucks and bells under the voice`；③ 節奏太快追不上口語——降到 100 BPM。
- **旁白共存**：`stays soft and simple under the teacher's voice, accents only on picture changes`。
- **三方向**：A 烏克麗麗＋鐘琴（acoustic-folk，straight）／B chiptune 8-bit（retro，`bright 8-bit chiptune, square-wave lead`）／C 原聲小樂隊（`clarinet, tuba, brushes, gentle swing`）。
- **骨架（60s 為例）**：

```text
Bouncy children's educational score, 60s, curious and friendly. Ukulele, glockenspiel, marimba, toy piano, soft claps, bouncy bass. Instrumental, no singing.

Open cheerful and simple, 108 BPM, bright major key, question-and-answer phrasing, charming not babyish, very light under the teacher's voice.

Small accents on picture changes at 12s, 24s and 36s — a bell ding each, no build.

At 48s a happy little lift, still gentle. Ends on a cheerful button at 59s, short clean stop. No drama, no minor key, no sudden loud hits.
```

### 14. 運動／動作

- **核心情緒詞**：`driving, relentless, fierce, adrenaline, propulsive, explosive`
- **配器／BPM**：hybrid drums、distorted bass、brass stabs、electric guitar、synth risers、staccato string ostinato；128–150 BPM（half-time 體感 64–75）。
- **結構**：準備 hush 15%（`heartbeat pulse, breath`）→ drop 對到第一個動作 → ostinato 40% → 慢動作 dip 10%（`half-time, filtered`）→ 最後衝刺 25%（`double-time, biggest`）→ 硬斷或 stinger。
- **必寫反面詞（≤3）**：`no vocals, no cheesy`＋真人動作片 `no cartoon hits`（見「跟打點 vs 鋪長線」）；**選寫**：`no epic choir`（除非要）。
- **失敗模式**：① 全程滿載無層次——慢動作段必給 dip；② 剪點太碎跟不上——切點間隔 0.25s 時寫 150 BPM＋`dense percussion`，不寫 240；③ 打點太多顯卡通——每場只挑 2–3 個 hit。
- **對白共存**：教練喊話／訪談 `drums and bass only`。
- **三方向**：A hip-hop trap（electronic，half-time，街頭／健身）／B rock（`distorted guitars, live drums`，賽事）／C 管弦混合（hybrid，`staccato string ostinato, huge drums`，武術／追逐）。
- **骨架（45s 為例）**：

```text
Driving action score, 45s, fierce and propulsive. Hybrid drums, distorted bass, brass stabs, staccato string ostinato, synth risers. Instrumental, no singing.

Open with a heartbeat pulse and breath-like texture, 140 BPM half-time feel, tense, held back.

Drop at 7s on the first hit — full drums and bass, relentless ostinato. At 22s slow-motion dip: half-time, filtered, drums thin.

At 30s double-time, biggest energy, brass stabs on the cuts at 33s and 38s. Final hit at 44s, stop dead, no fade. No vocals, no cheesy, no cartoon hits.
```

### 15. 科技／未來感

- **核心情緒詞**：`sleek, precise, luminous, forward, cool, intelligent, clean`
- **配器／BPM**：analog synth arps、glass plucks、sub bass、soft glitch percussion、filtered pads、one warm element（`soft piano` 或 `warm pad`）避免全冷；100–124 BPM。
- **結構**：arp intro 15% → 逐層加入 40%（`each feature adds a layer`）→ reveal hit 10% → 展開 25% → clean outro 10%（`clean stop, short digital tail`）。
- **必寫反面詞（≤3）**：`no orchestral, no epic drums, no aggressive EDM drop`；**選寫**：`no cheesy 80s cliché`（要復古走 C 時反而不能寫）
- **失敗模式**：① 冷到沒感情——加一個 warm element；② 通用科技 loop——給 hook 與 `a distinct 4-note synth motif`；③ 旁白被高頻 arp 干擾——`arps soft and filtered under narration`。
- **旁白共存**：`steady low pulse and filtered arps under narration, lead motif only in gaps`。
- **三方向**：A 玻璃極簡（electronic，straight）／B 電影混合（hybrid，`synth pulse with soft strings, wide modern mix`，企業級 AI）／C 復古 synthwave（retro 80s，`analog arps, gated drums`，遊戲／潮牌）。
- **骨架（60s 為例）**：

```text
Sleek futuristic tech score, 60s, luminous and precise. Analog synth arps, glass plucks, deep sub bass, soft glitch percussion, a warm pad. Instrumental, no singing.

Open with a soft filtered arp, 116 BPM, a distinct 4-note synth motif in the first bars, arps soft under narration.

Each feature adds a layer at 12s, 24s and 34s — pluck, then pulse, then pad, no drop between.

Reveal hit at 42s — one clean bright impact, full and wide. From 52s strip back to the arp, clean stop at 59.5s with a short digital tail. No orchestral, no epic drums, no aggressive EDM drop.
```

### 16. 旅遊／美食／地方創生

- **核心情緒詞**：`sunlit, breezy, savory, inviting, unhurried, local warmth, appetizing`
- **配器／BPM**：nylon guitar、ukulele（此型可用）、brushes、marimba、accordion、mandolin、clarinet、upright bass；90–115 BPM。台味：`nakashi accordion`、`moon lute`、`Hokkien folk-song lilt`。
- **結構**：抵達 15%（`a single guitar, light`）→ 漫遊 35%（groove）→ 品嚐／製作特寫 20%（`sizzle moments: playful accents`）→ 夕陽 20%（`warm, slower`）→ 告別 10%（`gentle button`）。
- **必寫反面詞（≤3）**：`no epic, no corporate, no whistling`；**選寫**：`no cheesy`；地創標案加 `no stock travel-vlog cliché`（模型未必懂，同步給 hook）。
- **失敗模式**：① 像旅遊頻道罐頭——換 C 方向加地方樂器一條線；② 美食特寫沒「口水感」——`playful pizzicato and marimba accents on close-ups`；③ 夕陽段變苦情——`warm and content, not sad`。
- **旁白共存**：旁白型走透明 bed；有在地人受訪 `guitar only under speech`。
- **三方向**：A 咖啡館爵士 bossa（jazz，`bossa nova brushes, nylon guitar, vibraphone`）／B indie-folk（acoustic，shuffle，山線／單車）／C 台味復古（Taiwanese-local，`nakashi accordion, moon lute, gentle shuffle`，老街／漁港／夜市）。
- **骨架（60s 為例）**：

```text
Sunlit travel-and-food score, 60s, breezy and inviting. Nylon guitar, brushed drums, marimba, accordion, upright bass. Instrumental, no singing.

Open with a single guitar, light and unhurried, 100 BPM, bossa-like brushes enter at 8s.

At 20s full groove, warm and playful. Playful pizzicato and marimba accents on the food close-ups at 28s, 33s and 37s.

At 44s slower and golden, accordion melody, warm and content, not sad. Ends on a gentle button at 59s, short tail. No epic, no corporate, no cheesy, no whistling.
```

### 17. 宗教／民俗（台灣廟宇、媽祖、遶境）

- **核心情緒詞**：`sacred, reverent, communal fervor, incense and drums, solemn, festive, protective, blessing`。佛教場域偏 `serene, still, compassionate`；道教／民間信仰偏 `fervent, processional, thunderous drums`。
- **配器／BPM**：台灣在地家族優先——`Taiwanese temple procession drum troupe`、`beiguan-style gongs and suona`、`nanguan pipa and dongxiao (slow, refined)`、`temple bell, wooden fish (muyu) clicks`、`firecracker-like percussion bursts`；現代化用 orchestra 承載，鼓陣做 accent。BPM：儀式 60–76，遶境 100–120，電音 128–132。
- **結構**：清晨香火 15%（`temple bell, hush`）→ 起駕 10%（`drums enter`）→ 遶境 35%（`processional drums, suona calls`）→ 神轎／入廟高潮 15%（全片唯一 peak）→ 祈福 25%（`calm, blessing, bell returns`）。
- **必寫反面詞（≤3）**：要現代不要中國風——`no erhu, no guzheng, no dizi, no pentatonic clichés`（一組算一項）；鑼要保留時 `temple gongs only as accents, not a wall of gongs`；佛教場域 `no suona, no firecrackers`（佛教時升為必寫）；**選寫**：`no Chinese palace-drama strings`。嗩吶必鎖定面孔（喜／悲／廟宇三選一，見 `chinese-idioms.md`「嗩吶的兩副面孔」）。台灣在地樂器的雙寫法與命中率未查證的退路在 `chinese-idioms.md`「台灣在地家族」節。
- **失敗模式**：① 模型給「醬油中國風」——先選台灣在地家族，再決定要不要一絲東方色；② 廟會整場吵——遶境段之外全部收成 bell 與 pad；③ 嗩吶亂辦喜事——`solemn suona call` 或 `festive suona`，二選一寫死；④ 案主是年輕世代廟宇或觀光局——走 C。
- **旁白共存**：解說旁白多，鼓陣只在空窗；`bell and pad under narration`。
- **三方向**：A 傳統陣頭（Taiwanese-local，`drum troupe, beiguan gongs and suona, raw and live`）／B 現代交響＋鼓陣（hybrid，`contemporary orchestra with temple drum accents, one suona line as color`，落成／形象片首選）／C 廟會電音（electronic，`pounding four-on-the-floor with temple drum troupe and suona stabs, techno temple festival`，青年／觀光）。
- **骨架（90s 為例，B 方向）**：

```text
Reverent Taiwanese temple score, 90s, sacred turning festive. Contemporary orchestra with temple drum troupe accents, temple bell, one solemn suona line as color. Instrumental, no singing.

Open hushed, a single temple bell and low strings, 72 BPM, bell and pad under narration.

At 18s drums enter softly. From 30s processional drums build, suona calls at 38s and 46s, strings rising.

At 58s the peak — thunderous drum troupe, full orchestra, grand. From 70s calm, blessing, bell returns, resolved at 89s. No erhu, no guzheng, no dizi, no pentatonic clichés, gongs only as accents.
```

### 18. 教育／感恩（敬師、畢業、校慶）

- **核心情緒詞**：`grateful, warm, joyful lift, bright, bittersweet turning bright, heartfelt`
- **配器／BPM**：piano、warm strings、glockenspiel sparkle、acoustic guitar、light drums；76–100 BPM。
- **結構（敬師案實證）**：hush 10% → 回憶段 30%（`tender, sparse`）→ joyful lift 15%（`bright major key, glockenspiel sparkle`）→ peak 10%（致詞前收完）→ `ease down layer by layer, gently thinning` 20% → `By Ns already calm` 15%。「先蹲再跳」：終極峰前一段改 `pull back to a hush`。
- **必寫反面詞（≤3）**：`never rises again, no melancholy, no epic`；正面句 `textures light never thick` 另計；避免 `quiet determination`（偏正經拉走喜悅）。
- **失敗模式**：① 轉折不夠喜悅——換 `joyful lift, bright major key, glockenspiel sparkle`；② 高位段太厚壓到致詞——`textures light never thick` ＋提早收；③ 畢業變苦情——`bittersweet but smiling, not sad`。
- **旁白共存**：全程旁白，peak 只在空窗；致詞前 `By Ns already calm`。
- **三方向**：A 鋼琴弦樂暖（timeless，straight）／B 原聲流行小樂隊（acoustic，`acoustic guitar, light drums, campus pop warmth`，畢業）／C 音樂盒到全團（`music box opening blooming into full strings`，回憶型）。
- **骨架（114s 為例）**：

```text
Warm grateful score, 114s, heartfelt and joyful. Piano, warm strings, glockenspiel sparkle, light acoustic guitar. Instrumental, no singing.

Open hushed, solo piano, 84 BPM, tender and sparse under narration. Strings enter at 24s, bittersweet but smiling.

At 50s pull back to a hush. At 56s a joyful lift — bright major key, glockenspiel sparkle, full warm strings, textures light never thick.

Peak at 72s in the narration gap, broad and bright. From 84s ease down layer by layer, gently thinning. By 90s already calm, piano only, warm chord at 113s. No melancholy, no epic, never rises again.
```

### 19. Lo-fi vlog

- **核心情緒詞**：`cozy, hazy, unhurried, nostalgic, mellow, rainy-afternoon`
- **配器／BPM**：dusty piano、Rhodes、jazz guitar、vinyl crackle、tape saturation、soft boom-bap drums、muted upright bass；70–90 BPM。
- **結構**：loop 為主，`minimal changes`；最多兩個事件（`filter opens at Ns`、`drums drop out at Ns`）；結尾 `loops or fades on the beat`。
- **必寫反面詞（≤3）**：`no build, no drop, no vocals`；**選寫**：`no epic, no bright polish`
- **失敗模式**：① 太乾淨——`lo-fi, tape saturation, vinyl crackle, slightly detuned`（`lo-fi` 是最穩製作詞）；② 太多事件——限兩個；③ 講話被蓋——`drums soft, piano sparse under the voice`。
- **旁白共存**：天生的 bed，`stays mellow under the voice throughout`。
- **三方向**：A jazz-hop（`Rhodes, boom-bap, jazz chords`）／B ambient guitar（`clean guitar loops, reverb, no drums`）／C bossa lo-fi（`nylon guitar, soft shaker, tape warmth`）。
- **骨架（60s 為例）**：

```text
Cozy lo-fi vlog beat, 60s, hazy and unhurried. Dusty Rhodes piano, jazz guitar, vinyl crackle, tape saturation, soft boom-bap drums, muted upright bass. Instrumental, no singing.

Loop-based, 78 BPM, mellow jazz chords, slightly detuned, stays soft under the voice throughout.

Drums drop out at 24s leaving piano and crackle. Drums return at 34s, filter opens gently.

Ends at 59s fading on the beat. No build, no drop, no epic, no bright polish.
```

### 20. 電商帶貨

- **核心情緒詞**：`bright, punchy, urgent-friendly, upbeat, shopping energy, irresistible`
- **配器／BPM**：pop-electro plucks、claps、bouncy bass、bells（價格揭露）、brass stabs；110–128 BPM。
- **結構**：hook 0–2s → 產品點 50%（每個賣點一個 accent）→ 價格／優惠 sting（`a bright bell ding and a bass hit at Ns`）→ CTA 段 loop（`repeating hook under the call to action`）→ 硬收。
- **必寫反面詞（≤3）**：`no slow intro, no fade-out, no vocals with words`；**選寫**：`no cinematic`；主播口播型加正面句 `very sparse, voice on top`。
- **失敗模式**：① 音樂比主播搶——口播型走 `minimal beat`；② 沒有價格 sting——賣點與價格要有不同的 accent；③ 太吵像夜市——`bright but clean, not harsh`。
- **旁白共存**：口播密集，`beat and bass only under speech, hook in gaps and under the CTA`。
- **三方向**：A pop-EDM（electronic，straight）／B funky groove（`funky guitar, slap bass, brass stabs`）／C 可愛電子（`kawaii bright synths, toy-like bells, bouncy`，美妝／零食）。
- **骨架（30s 為例）**：

```text
Bright e-commerce promo beat, 30s, punchy and upbeat. Pop synth plucks, claps, bouncy bass, bright bells, brass stabs. Instrumental, no singing.

Starts on the hook at 0s, no intro, 124 BPM, bright and clean, not harsh, beat and bass only under speech.

Accents on the selling points at 6s, 11s and 16s — a pluck stab each. At 20s the price sting: one bright bell ding and a bass hit.

From 22s repeat the hook under the call to action. Hard stop on a downbeat at 29.5s, no fade-out, no slow intro.
```

### 21. 遊戲／動畫

- **核心情緒詞**：依畫風——冒險 `playful, adventurous, heroic, whimsical, wide-eyed`；戰鬥 `driving, heroic, relentless`；治癒 `gentle, dreamy, pastoral`
- **配器／BPM**：chiptune／orchestral hybrid／synth-pop；主題必須早出現且可循環；100–140 BPM。
- **結構**：主題陳述 0–8 秒 → 探索 loop → 戰鬥／事件（`hard switch at Ns`）→ 勝利 stinger → 回主題。
- **必寫反面詞（≤3）**：`no vocals`＋依畫風一項（要卡通感時 `no realistic gritty film-score texture`）；**選寫**：`no lo-fi`；動畫短片依情緒另加。
- **失敗模式**：① 主題不記得——`a simple heroic 5-note theme stated in the first 4 seconds and returning at Ns`；② 戰鬥段不夠切換——`hard switch`；③ 童趣變幼稚——`whimsical, not babyish`。
- **對白共存**：動畫對白多，`theme only between lines, light pulse under dialogue`。
- **三方向**：A chiptune 8-bit（retro，`square-wave lead, arpeggiated chords, punchy noise drums`）／B 管弦奇幻（orchestral，`sweeping strings, heroic horns, harp runs`）／C 動畫片頭 synth-pop 能量（contemporary，`bright synth-pop, driving drums, anthemic`）。
- **骨架（45s 為例）**：

```text
Whimsical adventure game score, 45s, playful and heroic. Sweeping strings, heroic horns, harp runs, light percussion. Instrumental, no singing.

A simple heroic 5-note theme stated in the first 4 seconds, 120 BPM, bright major key, wide-eyed wonder.

At 16s hard switch to battle — driving percussion, minor key, urgent brass. At 30s a victory stinger, one bright fanfare hit.

From 32s the theme returns triumphant, full orchestra. Ends on a bold resolved chord at 44.5s, clean stop. No vocals, no gritty film-score texture, whimsical not babyish.
```

### 22. Kinetic typography／MG 說明動畫

- **核心情緒詞**：`clean, clever, precise, light, informative, tidy, bright-minded`
- **配器／BPM**：plucks、marimba、soft synth、finger snaps、muted kick、light hi-hat、bell accents；100–120 BPM。政府 MG（ATFM、CTOT 之類）：`calm, authoritative, precise`。
- **結構**：穩定 grid 全程（`steady rhythmic bed, no lead melody`）→ 每個 text hit 一個 accent（`a soft pluck accent on each text reveal`）→ 章節換段（`section change at Ns: new chord color`）→ 結尾 button（`one tidy ending hit`）。
- **必寫反面詞（≤3）**：`no lead melody competing with the voice, no build, no drums overpowering narration`；**選寫**：`no emotional swells, no epic`
- **失敗模式**：① 旋律跟旁白打架——最常見，明寫 `rhythmic bed only, no melody`；② accent 不在字上——秒數對到動畫的 text reveal 且早 0.2s，accent 用 `soft pluck` 不用 hit；③ 太冷像簡報——加 `warm marimba, friendly`。
- **旁白共存**：這一型旁白就是主角，音樂 bed 全程低存在感；解說停頓處才 `a little melodic fill`。
- **三方向**：A 木琴撥弦（acoustic，straight，親民政策）／B minimal techno（electronic，`soft techno pulse, clicks and glass`，科技／數據）／C 爵士刷鼓（jazz，`brushed swing, upright bass, vibraphone`，輕鬆解說）。
- **骨架（60s 為例）**：

```text
Clean explainer score, 60s, clever and precise. Soft synth plucks, warm marimba, finger snaps, muted kick, light hi-hat, bell accents. Instrumental, no singing.

Steady rhythmic bed from 0s, 110 BPM, friendly and tidy, no lead melody, leaves the voice on top.

A soft pluck accent on each text reveal at 6s, 13s, 21s and 29s. Section change at 32s: new chord color, a little melodic fill in the pause, then back to the bed.

At 50s a small warm lift, still light. One tidy ending hit at 59s, clean stop. No emotional swells, no epic, no drums overpowering narration, no build.
```

---

## 三、跨類型速查

### 該型模型最愛自作主張加的東西（總表）

| 類型 | 模型會偷加 | 一句擋 |
|---|---|---|
| 形象片／感恩 | 尾段小高潮、烏克麗麗口哨 | `Never rises again` ＋ `no ukulele, no whistling` |
| 史詩／廟宇 | 鑼、二胡、戰鼓 | `no gongs, no erhu, no epic drums` |
| 喜劇 | 滑管哨、馬戲團 | `Not corny: no slide whistle, no kazoo, no circus` |
| 浪漫 | 苦情小調 | `Not sad, no melancholy, no ballad sobbing` |
| 驚悚 | 每個切點都 jump scare、預告片 braam | `no jump-scare hit on every cut, no trailer braams` |
| 產品／短影音／電商 | 慢 intro、淡出 | `no intro, no fade-out` |
| 紀錄片／MG | 旋律搶旁白、情緒 swell | `no lead melody, no dramatic swells` |
| 兒童 | 突然大聲 hit | `no sudden loud hits` |
| 所有類型 | 人聲 | `Instrumental, no singing` ＋ `force_instrumental: true`；例外：要 wordless choir／vocal-chop 時改 `no lyrics, no words` 且不開 `force_instrumental`（第 6、10 型） |

### 錨點精度慣例（各型共用）

hit ±0.2s 必保／段落轉換 ±1–2s、半秒錨點只給 hit 且 ≤3、量測值減 0.2 秒後的取整規則——正本在 SKILL.md「幾個非談判的細節」；中段全靜與硬斷偷加 decay 的處理——正本在 `elevenlabs-music.md` 地雷清單。此處不重述。

### 這份檔的已知邊界

- BPM 範圍與比例是慣例起手式，量測結果永遠優先。
- 三方向是「換軸」的示範，不是窮舉；使用者說「都不像」時回到三軸表重組。
- 台灣在地樂器詞（`beiguan`、`nanguan`、`nakashi`、`moon lute`）在各模型的命中率**未查證**，建議「拼音＋英文類名」雙寫並實測；命中率低時退回「描述行為」（`raw processional gongs and shawm`）。實測後把結果回寫 `ai-model-vocab.md`；詞表本體在 `chinese-idioms.md`「台灣在地家族」。
- 骨架裡的分層動詞（`ease down layer by layer`、`textures light never thick`、`pull back to a hush`）只給了最常用的幾個；要更精確的加減法順序、力度曲線原型與轉折工具箱，讀 `arrangement-theory.md` 第四、五、七節。
- 未涵蓋：音樂 MV、直播開場、Podcast 片頭、企業內訓、募資、建案、餐飲開店——可借用最近的類型（分別為 6／3／19／22／5／1／16），累積兩次以上實戰再補附錄型。
