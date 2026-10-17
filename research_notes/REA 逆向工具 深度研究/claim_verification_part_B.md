# REA 貼文事實查核：Part B（C6–C10）

查核者：獨立查核子代理（Part B）
查核時間：2026-10-15（UTC 約 13:30）
本機 clone：`/home/user/morluto/rea`，HEAD `b2257653ca74e1013553d5bd916a0ef85a3c7678`（2026-10-15 20:45 +0800），package.json 版本 6.5.0。只讀取檔案，沒有執行任何內容。

## 方法與限制（請先讀）

- **網路限制。** 這個 session 的出口代理擋掉了大多數新聞網站：tech.ifeng.com、zhihu、huxiu、inside.com.tw、next.ink、rea.tools、dev.to、mydrivers、smzdm、kucoin 等，WebFetch 回 DNS/403。
  - `api.github.com/repos/morluto/rea` 也被擋（"GitHub access to this repository is not enabled for this session"），所以**我沒有取得 stargazers_count**。
  - 可以存取的有 `raw.githubusercontent.com`（用來讀 N0zoM1z0/dx-ball 釘選 commit 的原始檔）和 WebSearch（只回傳摘要）。
- **證據等級：**
  - **一級：** 本機 repo 檔案（附行號），以及 raw.githubusercontent 上 dx-ball 釘選 commit 的檔案。
  - **二級：** 新聞報導。只能透過 WebSearch 摘要取得，無法逐字核對全文。凡是二級證據都會註明。
- 本機 repo 裡的 `website/public/**/index.html` 就是官方網站 rea.tools 的原始碼（例如 FAQ、showcase 頁面），可以視為官方網站文字的一級來源。
- 下載的檔案存放在 `/tmp/claude-0/-home-user-slate/39b3d953-ede3-5fb7-9e08-1cdeabd1ac6c/scratchpad/partB/dl/`。

---

## C6. DX-Ball 左右聲道（聲像 pan）算法改寫成 C，3,205 種情況全一致，63 位元組一模一樣

**判定：MOSTLY_TRUE（數字全部正確，但脈絡被省略），信心：高**

### 一級證據

**README.md:222-229**

> "### DX-Ball: reconstruct a sound-pan calculation … Follow a sound call into its position-to-pan helper, inspect the instructions, and turn incomplete pseudocode into C. The reconstruction passes 3,205 original-x86 cases and reproduces all 63 compiled function bytes."

**docs/readme/README_zh-TW.md:179-181**

> 「DX-Ball：重建聲像計算 … 重建結果通過了 3,205 個原始 x86 測試用例，並復現了編譯後函數的全部 63 個位元組。」

**website/evidence/dx-ball-sound-pan.md**（官方網站的證據檔）

- 目標檔案：
  > "Target: `DXBALL.EXE`, 158,208 bytes, PE i386." SHA-256 `756da1ba…72ba`
- 函數範圍：
  > "Function: `0x406400` through `0x40643e`, inclusive, 63 bytes."
- 使用工具：
  > "Recorded analysis: REA 4.1.0, Ghidra 12.1.4, Linux x64 host."
- 驗證範圍：
  > "3,205 direct original-x86 differential cases: integer positions 0–640 at scales 0, 0.5, 1, 20 and −1." / "63 matching bytes for the complete VC4.0-compiled function, after applying every reviewed relocation and checking referenced constants."
- 適用範圍：
  > "These claims apply to this function at the linked checkpoint … Game-level integration remains a separate project task."
- 第一版反編譯結果是錯的：
  > "The original decompiler result reports `FUN_00406400(void)` and a conversion call, omitting the stack input and x87 expression."

**website/public/showcase/dx-ball/index.html**（rea.tools/showcase/dx-ball/ 的原始碼）

- 標題：
  > "Rebuilding DX-Ball from its executable. The goal is a maintainable C version of the 1996 Windows game."
- 分工：
  > "REA supplies the instructions, callers and data reads; the reconstruction project implements and tests the result."
- 專案進度：
  > "55 maintained C functions · 45,380 comparisons with original code · 33 functions with matching compiled bytes · Project checkpoint: 7 October 2026."
- 示範用的提示詞：
  > "Use REA to find how DX-Ball calculates sound panning. Explain the calculation and show the code."
- 輸出範圍：
  > "At a scale of 1, the recovered calculation returns −500 at the left edge, 0 at the center and 500 at the right edge. The next part of the audio work is integrating that value with the game's sound backend."

**重建專案 N0zoM1z0/dx-ball，釘選 commit a55dca27ec0a07018c1b2c95ae2be027f7d8c3c4**（經 raw.githubusercontent.com 讀取）

- `src/gameplay.c:41-49`：`DxBallInt dxball_screen_pan(DxBallInt x)`，算式為
  `pan=(double)x; pan=pan*1.5625; pan=pan-500.0; pan=pan*dxball_pan_scale; return (DxBallInt)pan;`
- `src/gameplay.c:56`：呼叫端是 `pan = dxball_screen_pan(x * 30 + 20);`
- `config/match-units.toml:27-38`：`[units.screen-pan] … target_address = 0x00406400, size = 63`，含 4 個 relocation（兩個 double 常數、`_dxball_pan_scale`、`__ftol`）。
- `config/semantic-acceptance.csv:15`：位址 `0x00406400`、單元 `gameplay-screen-pan`，cases 欄位為 `3205`。
- `tests/test_gameplay_differential.py`：
  - 第 13 行 `from unicorn import UC_HOOK_CODE`，代表原始 x86 函數是在 Unicorn 模擬器裡執行。
  - 第 275 行 `for scale in (0.0, 0.5, 1.0, 20.0, -1.0):`
  - 第 278 行 `for x in range(641):`
  - 641 × 5 = 3,205，數字吻合。
- `docs/BUILD_MATCHING.md:77-79`：
  > "REA's gameplay investigation adds the 146-byte fastcall explosion append and 63-byte cdecl sound-pan function and 139-byte explosive scan…"
- `docs/PROGRESS.md`：
  > "Source-present functions 55 … Byte-exact functions 33 … A playable whole-game build is still pending."
- `README.md`（dx-ball）：
  - > "Codex uses REA to inspect the original executable through Ghidra"
  - 環境需求包括 Wine、Visual C++ 4.0、JDK、Ghidra，並鎖定 "currently REA 6.4.0 and Ghidra 12.1.4"。
  - > "DX-Ball was created by Michael P. Welch, with 3D graphics by Seumas McNally. Original game files are supplied separately."
- `LICENSE`：MIT，"Copyright (c) 2026 N0zoM1z0"。

**N0zoM1z0 與 REA 的關係**

- REA 的 `website/public/contributors/people.json:13-17` 把 N0zoM1z0 列為第 2 位貢獻者，僅次於 morluto。
- 官網的 `website/README.md:3-5` 引用了 N0zoM1z0 的話。
- 結論：這是 REA 核心貢獻者自己的專案，不是獨立第三方的成果。

**「1996 年」**

- 這個年份可以確認。官網原文就寫 "the 1996 Windows game"。
- WebSearch 摘要（Wikipedia、MobyGames、homeoftheunderdogs）也指出 DX-Ball 是 Michael P. Welch 於 1996 年發表的 Windows 免費 breakout 遊戲。

### 細節與脈絡（貼文沒說的部分）

1. **只是一個很小的函數。** 「左右聲道算法」實際上是一個 63 位元組的小函數，內容是一行算式：`(1.5625·x − 500)·scale` 後轉成整數。它把磚塊的水平座標換算成 −500 到 500 的聲像值，並不是完整的音訊混音演算法。
   - 真正的左右聲道輸出由 DirectSound 負責，重建專案自己寫明這部分還沒完成。
   - `docs/GAMEPLAY_OWNER.md:9`："…DirectSound remain pending."
2. **測試和比對不是 REA 做的。** 3,205 個案例由重建專案自己的 Unicorn 差分測試完成；63 位元組比對則是用 VC4.0 編譯器重放，並在套用審核過的 relocation 對映之後才比對。REA 只提供指令、呼叫者和資料讀取。
3. **官方示範，但出自核心貢獻者。** 說它是「官方示範」大致正確：README 和官網 showcase 都有。但這是核心貢獻者的專案，代理是 Codex，使用 REA 4.1.0。
4. **第一版反編譯結果是錯的。** `FUN_00406400(void)` 漏掉了參數，是代理對照組合語言之後才修正。貼文沒有提到這點，而這正好說明人工或代理的驗證是必要的。
5. **整個遊戲的重建還沒完成。** 截至 2026-10-07 的 checkpoint：55 個函數有原始碼，其中 33 個位元組完全一致，可玩的完整版本尚未完成。

---

## C7. 據報導，逆向圈老手直言是炒作；加殼程式照樣難拆；伺服器上的邏輯碰不到

**判定：MOSTLY_TRUE（確實有這些報導，但「加殼照樣難拆」被概括過頭了），信心：中**

### 主要報導來源（二級，只取得 WebSearch 摘要，無法讀全文）

極客公園 2026-10-12〈一周 10 万星，AI「逆向一切」，但大家不要过于兴奋〉：

- 原文：https://www.geekpark.net/news/372263
- 轉載：tech.ifeng.com/c/8x8ubG3BSNJ、finance.sina.com.cn/tech/roll/2026-10-12/doc-iniuyxuw0423270.shtml、news.mydrivers.com/1/1156/1156898.htm、news.17173.com/content/10132026/020528855.shtml

摘要中的內容：

- **「炒作」：** Elias Bachaalany（逆向工程教材《Practical Reverse Engineering》合著者，曾任職 IDA 開發商 Hex-Rays）轉發 REA 推介時，只用一個詞評價：炒作（hype），並列出早已存在的同類工具，例如 GhidraMCP、IDA Pro MCP。
  - 荷蘭 AI Insider（aiinsider.nl/nieuws/rea-reverse-engineer-anything-github-ai-agents/）與 KuCoin 快訊也有相同報導，英文原話為 "Hype."。
  - 他另外補充："That's true, for now."
  - **原始 X 貼文我沒能直接核實（UNVERIFIED primary）。**
- **加殼：** 安全博主「轩辕之风」的說法（WebSearch 摘要逐字）：
  > 「没加壳的程序 AI 轻松拿下，轻度加壳也行，VMP 这类高强度虚拟化保护目前还啃不动」
  > 「REA 连动态调试都没有」
  - 什么值得买（post.smzdm.com/p/arzr0k3g）轉述 B 站 UP 主「轩辕的编程宇宙」10/13 的 8 輪實測：
    - 移位密碼 1 分 11 秒
    - RC4 3 分 20 秒
    - VMP 虛擬化強度打開後，54 分鐘宣告失敗
  - 以上都是二級資料。
- **伺服器：** Bachaalany 的建議是：只要程式在使用者設備上執行就能被拆，所以關鍵邏輯放在伺服器上才穩妥。極客公園摘要指出，放在伺服器上的邏輯是 REA 這類工具拿不到的。

### 一級佐證（本機 repo）

- **README.md:180（Websites 一列）：** REA 對網站能拿到的只有 "Page structure, scripts, network observations and requested screenshots"，也就是瀏覽器端的內容和網路流量。依設計就看不到伺服器端程式碼。
- **docs/managed-code-analysis.md:383-384：** 
  > "Its absence does not exclude dynamic resolution, generated code, protected code, native helpers, or server-side behavior."
- **CONTRIBUTING.md:127-129**，REA 不整合下列工作流：
  > "REA does not integrate or officially distribute: - Purpose-built workflows to defeat commercial packing or code-virtualization protections and automatically recover protected code."
- **CONTRIBUTING.md:139-140：** 
  > "Ordinary extraction and general static deobfuscation are not excluded merely because the input is packed or obfuscated"
- **DISCLAIMER.md:12-13：** 不支援 "circumventing DRM, license checks, anti-cheat systems or other technical protection measures"

### 細節與脈絡

- **「逆向圈老手」：** 公開具名的主要只有 Bachaalany 一人。他確實是資深人士，但「老手們」不宜解讀成整個圈子的共識。
- **「加殼的程式照樣難拆」：** 這句被概括過頭了。同一則報導說的是：無殼或輕度加殼 AI 處理得了，難的是 VMP 這類高強度虛擬化保護。REA 本身也明文不提供破殼／去虛擬化工作流（CONTRIBUTING.md:127-129）。
- **「伺服器上的邏輯碰不到」：** 正確，而且是設計使然，REA 只分析本機的檔案和看得到的流量。

---

## C8. 官方 FAQ：分析在你電腦上跑，結果交給 AI 代理，模型商有自己的資料政策

**判定：TRUE，信心：高**

### 一級證據

- **README.md:302-305（FAQ）：**
  > "Does REA upload my app? — REA analyzes targets locally. Your agent receives the tool results, and its model provider has its own data policy."
- **docs/readme/README_zh-TW.md:239-241：**
  > 「REA 會上傳我的應用嗎？— REA 在本機分析目標。AI 代理會接收工具結果，其模型提供商有自己的資料政策。」
  - 貼文的措辭和這句繁中翻譯幾乎逐句對應。
- **website/public/faq/index.html（rea.tools/faq/，Data and sharing 段）：**
  > "Does REA upload my app? REA analyzes targets on your machine. Your agent receives the results, and its model provider's data policy applies to those results."
- **README.md:63：**
  > "Analysis runs locally, and results include the evidence and limitations behind each conclusion."

### 細節與脈絡

- **語氣差異：** 貼文用「卻」，帶有警示意味；官方 FAQ 的語氣是中性的。
- **送出去的不只是結論：** 交給代理的「結果」可能包含反編譯程式碼片段、字串等。極客公園與博客園的文章都提醒，拆客戶或受 NDA 約束的軟體，可能因此構成違約（二級）。
- **「本機」不代表完全沒有外部影響：** DISCLAIMER.md:47-59 提到，部分工作流會執行目標、擷取網路流量或操作裝置：
  > "Local operation does not establish authorization or guarantee that executed targets and third-party tools have no external effects."
- **IDA Free 會用到網路：** docs/ida-provider.md:66：
  > "IDA Free's cloud decompiler needs network access"

---

## C9. 法律上是灰區；官方只說拿來分析你擁有或被授權的軟體

**判定：MOSTLY_TRUE（「灰區」有依據；「官方只說」把官方說法講得太簡單），信心：中高**

### 一級證據（REA 官方說法）

- **README.md:367-368：**
  > "REA is for lawful research, education, interoperability, software preservation, and analysis of software you own or are authorized to examine."
- **README_zh-TW.md:297：**
  > 「REA 用於合法的研究、教育、互通性、軟體保存，以及分析你擁有或獲准檢查的軟體。」
- **DISCLAIMER.md:5-8**，官方列出的合法用途比貼文說的廣得多：
  > "REA is built for lawful analysis: security research, malware and incident analysis, vulnerability research and coordinated disclosure, CTFs and education, interoperability, software preservation, and debugging or auditing software you own or are authorized to examine."
- **DISCLAIMER.md:10-19**，官方明文不支援的用途：
  - circumventing DRM、license checks、anti-cheat
  - game cheats
  - "copying proprietary software or reproducing its protected code and assets"
  - 規避 AI 模型商的使用政策
- **DISCLAIMER.md:21-24：**
  > "You are responsible for obtaining any required authorization … Reverse engineering may be restricted in your jurisdiction or by the license of the software you analyze."
- **DISCLAIMER.md:68-71：**
  > "Obtaining source-like output or an analysis report does not grant rights to the original program, its data, or the generated output."
- **README.md:389 與 DISCLAIMER.md:80-86：** IDA、Hopper、JEB 必須合法取得；"Cracked copies, stolen keys … are not authorized"。
- **值得注意的矛盾：** README.md:61 的宣傳語是
  > "See a feature in an app that you want in your own product? Ask your agent to investigate it with REA. … and build a version for your project."
  
  這和 DISCLAIMER 的「不協助複製專有軟體」並存，正好說明它處在灰色地帶。

### 法律背景（說明「灰區」的依據）

- **美國：**
  - 17 U.S.C. §1201(f)：僅為「互通性」而規避存取控制屬於例外（govinfo.gov USCODE-2024 title17 §1201）。
  - Sega v. Accolade, 977 F.2d 1510（9th Cir. 1992）：反組譯可構成 fair use（copyright.gov 摘要）。
  - Bowers v. Baystate, 320 F.3d 1317（Fed. Cir. 2003）：shrink-wrap 授權中禁止逆向的條款可以執行。
  - 換句話說，著作權上合法，契約上仍可能違約。
- **歐盟：**
  - Directive 2009/24/EC Art. 6：只有在「為達成互通性而不可或缺」的條件下，才允許反編譯（legislation.gov.uk/eudr/2009/24/article/6）。
  - Art. 8：「Any contractual provisions contrary to Article 6 or to the exceptions provided for in Article 5(2) and (3) shall be null and void」（legislation.gov.uk/eudr/2009/24/article/8；ippt.eu）。
- **台灣：**
  - 著作權法第 80 條之 2 第 3 項列有「為進行還原工程者」的防盜拷措施例外。這是 WebSearch 摘要（tipo.gov.tw、lawreview.law.nycu.edu.tw）提到的。
  - 我沒能讀取全國法規資料庫原文，所以條文的確切項款標示屬中信心。
  - 這個例外只針對「規避防盜拷措施」，不等於一般性允許反編譯或重製。
- **中國：**
  - 《计算机软件保护条例》第 17 條：「为了学习和研究软件内含的设计思想和原理……可以不经软件著作权人许可，不向其支付报酬」，但條文沒有明說反向工程合法（gov.cn 2013 修订版）。
  - 極客公園提到《著作权法》第五十條的適用問題「未有定論」（二級）。
- **小結：** 合法與否取決於法域、目的（互通性、研究或複製）、授權條款（EULA）和是否規避保護措施。用「灰區」來形容合理。

### 細節

- 貼文「官方**只**說…你擁有或被授權的軟體」這部分偏簡化。官方文字還列了合法研究、教育、互通性、軟體保存、資安研究、惡意程式分析、CTF，另外有一整份 DISCLAIMER 列出不支援的用途，並明說逆向可能受法域和授權限制。
- 不過，如果把「只說」理解成「官方沒有給任何法律保證，責任全由使用者承擔」，那是正確的：DISCLAIMER.md:37-43、88-95 寫明 "No project description … establishes that your intended use is lawful or safe."

---

## C10（框架）：「把逆向工程師的工作，變成一句話問 AI」

**判定：EXAGGERATED，信心：中（屬評論性框架）**

### 支持「一句話」說法的證據（官方自己就這樣行銷）

- 官網 showcase 的範例提示詞只有一句：
  > "Use REA to find how DX-Ball calculates sound panning. Explain the calculation and show the code."
  （website/public/showcase/dx-ball/index.html）
- FAQ：
  > "Give it a local target and one behavior to investigate."
  （website/public/faq/index.html）
- README.md:61 的宣傳語同樣是「問你的代理」。

### 反對的證據（一句話背後還有很多事）

1. **安裝門檻不低。**
   - README.md:166："REA requires Node.js 22.x (>=22.19), 24.x (>=24.11), or 26+, plus npm."
   - package.json:44-45 engines：`"node": "^22.19.0 || ^24.11.0 || >=26.0.0"`
   - 原生深度分析需要 Hopper、Ghidra 或 IDA（README.md:171；FAQ "Deep native analysis uses one of them"）。
   - Ghidra 12.1.x 需要 64 位元完整 JDK 21+（docs/installation.md:767-776）。
   - Hopper 是商業軟體，demo 有限制（docs/installation.md:502-503）。
   - REA 不負責安裝或授權 IDA（docs/ida-provider.md:3）。
   - 商業工具必須合法取得授權（README.md:389-395）。
   - DX-Ball 示範本身還需要 Wine、Visual C++ 4.0、JDK、Ghidra、固定版本的 Node 22.19.0 和 Codex（dx-ball README）。
2. **REA 不寫程式也不負責驗證。** 官網原文：
   > "REA supplies the instructions, callers and data reads; the reconstruction project implements and tests the result."
   
   3,205 個差分測試和 63 位元組編譯比對，都是重建專案自建的測試工具做的。
3. **工具輸出本身會出錯。** DX-Ball 的第一版反編譯是 `FUN_00406400(void)`，漏掉了參數，要靠組合語言比對才修正。
   - DISCLAIMER.md:63-66："Decompilation, reconstruction, heuristics, and AI-assisted analysis may be incomplete or incorrect … Review the underlying evidence and verify consequential conclusions before relying on them."
4. **有明確失效情境（二級）：**
   - VMP 高強度虛擬化保護，實測 54 分鐘後宣告失敗（smzdm 轉述 B 站實測）。
   - REA 不提供破殼和反反除錯（CONTRIBUTING.md:127-131）。
   - 伺服器端邏輯拿不到。
5. **規模的對比。** 「一句話」的示範產物是一個 63 位元組的函數；整個 DX-Ball 重建到 10/7 為止，528 個 Ghidra 候選函數中只有 55 個有原始碼、33 個位元組完全一致，仍無法遊玩（dx-ball docs/PROGRESS.md）。
6. **REA 本質上是整合層。** 它不是新的反編譯技術（README.md:63-65；極客公園、note.com/zephel01 稱其為 "bundler"）。GhidraMCP、IDA Pro MCP 等早已存在（二級）。

### 結論

- 互動介面確實是用自然語言問代理，官方也用一句話提示詞來行銷，所以貼文不算捏造。
- 但從證據看，REA 降低的是「門檻與操作成本」。它沒有讓逆向工程師的工作變成只需問一句話：環境建置、商業引擎授權、反編譯錯誤的判讀、差分和編譯驗證、加殼和伺服器端的限制，都還是要人來做或監督。
- 因此判定為誇大。

---

## 來源清單

**本機 repo（/home/user/morluto/rea，HEAD b2257653）**

- README.md：61, 63, 166, 171, 180, 222-229, 302-305, 348, 364-368, 389-395
- docs/readme/README_zh-TW.md：179-181, 239-241, 297
- DISCLAIMER.md：5-24, 37-43, 47-59, 63-71, 80-95
- CONTRIBUTING.md：105-140
- website/evidence/dx-ball-sound-pan.md
- website/public/showcase/dx-ball/index.html
- website/public/faq/index.html
- website/public/contributors/people.json：13-17
- package.json：44-45
- docs/installation.md：502-503, 767-776
- docs/ida-provider.md：3, 66
- docs/managed-code-analysis.md：383-384

**N0zoM1z0/dx-ball @ a55dca27（raw.githubusercontent.com）**

- README.md（main 分支）
- src/gameplay.c：41-56
- config/match-units.toml：27-38
- config/semantic-acceptance.csv：15
- tests/test_gameplay_differential.py：13, 275-278
- docs/BUILD_MATCHING.md：77-79
- docs/PROGRESS.md
- docs/GAMEPLAY_OWNER.md
- LICENSE

**新聞（二級，僅 WebSearch 摘要）**

- https://www.geekpark.net/news/372263（極客公園 2026-10-12）
- https://tech.ifeng.com/c/8x8ubG3BSNJ
- https://finance.sina.com.cn/tech/roll/2026-10-12/doc-iniuyxuw0423270.shtml
- https://news.mydrivers.com/1/1156/1156898.htm
- https://aiinsider.nl/nieuws/rea-reverse-engineer-anything-github-ai-agents/
- https://www.kucoin.com/news/flash/ai-reverse-engineering-tool-rea-surges-by-100-000-stars-in-a-week-sparking-legal-and-technical-controversies
- https://post.smzdm.com/p/arzr0k3g
- https://www.huxiu.com/article/4896423.html
- https://note.com/zephel01/n/n9d2ed82dcd4d

**法規**

- https://www.govinfo.gov/content/pkg/USCODE-2024-title17/html/USCODE-2024-title17-chap12-sec1201.htm
- https://www.legislation.gov.uk/eudr/2009/24/article/6
- https://www.legislation.gov.uk/eudr/2009/24/article/8/data.html
- https://www.copyright.gov/fair-use/summaries/segaenters-accolade-9thcir1992.pdf
- https://en.wikipedia.org/wiki/Bowers_v._Baystate_Technologies,_Inc.
- https://www.tipo.gov.tw/wSite/public/Attachment/0/f1747972069582.pdf（台灣著作權法第 80 條之 2）
- https://www.gov.cn/zhengce/2013-02/08/content_2602615.htm（計算機軟件保護條例）

**DX-Ball 年份**

- WebSearch 摘要：mobygames、homeoftheunderdogs.net/game.php?id=2795、en.everybodywiki.com/DX-Ball

## 未能核實

- **morluto/rea 的 GitHub stargazers_count：** API 被本 session 出口政策擋下。README.md:348 自稱 "250,000 GitHub stars"，這是專案自述，不是 API 數據。
- **Bachaalany 原始 X 貼文：** 只有二手報導。
- **極客公園及轉載文章全文逐字：** 只取得 WebSearch 摘要。
- **台灣著作權法第 80 條之 2 的現行條文：** 沒能讀取全國法規資料庫原文。
