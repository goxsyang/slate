# REA 在 macOS 的安裝與設定（Claude Code + Ghidra）

標示說明：
- 【REA 文件】：出自 REA 官方 repo 或官網，2026-10-15 查證。
- 【一般做法】：npm、macOS 或 Claude Code 的一般做法，REA 文件沒有寫。
- 【推論】：從已知事實推出來的建議。

所有會修改系統的指令，執行前都要先向使用者說明並取得同意。

## 目錄

1. 原則與版本基準
2. Xcode Command Line Tools
3. Node.js（3.1 檢查／3.2 安裝／3.3 npm 全域目錄需要管理員權限時）
4. JDK 21
5. Ghidra 12.1.4（5.1 下載與核對／5.2 解壓縮與路徑／5.3 建置原生反編譯器）
6. 安裝 REA（6.1 官方來源／6.2 查看套件資訊／6.3 驗證簽章與來源證明／6.4 正式安裝）
7. 註冊到 Claude Code（7.1 準備／7.2 檢查引擎／7.3 預覽／7.4 套用／7.5 重新啟動與驗證／7.6 第一次安全測試／7.7 改了哪些檔案與如何還原）
8. 選用：縮小 REA 的使用範圍、節省 context（8.1 獨立的設定檔／8.2 local scope／8.3 節省 context）
9. 更新
10. 解除安裝與清理

---

## 1. 原則與版本基準

- 只用官方來源：github.com/morluto/rea、rea.tools、npm 套件 `rea-agents`。【REA 文件】
- 固定版本：本文件以 `rea-agents@6.5.0` 為準。要裝其他版本，先讀 CHANGELOG，再用 `rea --help` 確認旗標。
- 不用 `sudo` 安裝 npm 套件，也不用 `curl … | bash` 執行 main 分支上的安裝指令稿。
- REA 的 setup 不會安裝或升級 Node.js、npm、Homebrew、Java 或 Ghidra，這些都由使用者自己安裝。【REA 文件】

| 元件 | 要求【REA 文件】 |
|---|---|
| Node.js | `^22.19.0 \|\| ^24.11.0 \|\| >=26.0.0`；Node 23、25、預先發行版不支援 |
| JDK | 64 位元完整 JDK 21 以上（含 `javac`），架構與主機相同 |
| Ghidra | 12.1.x（驗證版本 12.1.4），需要本機架構的原生反編譯器 |
| macOS 工具 | Xcode Command Line Tools 的 `xcrun swiftc`；建置反編譯器另需 `make`、`bison` |

每完成一節，都可以重新執行 `bash "<本 skill 目錄>/scripts/preflight_macos.sh"` 確認狀態。

## 2. Xcode Command Line Tools

為什麼需要：REA 在 macOS 啟動 Ghidra 這類子行程之前，會先用 `xcrun swiftc` 編譯一個很小的行程檢查輔助程式。Ghidra 原生反編譯器的建置也需要 `make` 和 `bison`。REA 不會自己安裝 Xcode。【REA 文件】

```bash
xcode-select -p          # 有輸出路徑代表已安裝
xcode-select --install   # 【一般做法】沒有安裝時，跳出 Apple 的安裝視窗
```

裝好後，用 `xcrun --find swiftc` 確認找得到 swiftc。

## 3. Node.js

### 3.1 檢查

```bash
node -v
npm -v
```

`node -v` 印出 v22.19 以上的 22.x、v24.11 以上的 24.x，或 v26 以上，就可以使用。【REA 文件】

### 3.2 安裝（三選一）

- **A. 沒有 Homebrew（建議）：** 從 https://nodejs.org/en/download 下載 Node.js 24 LTS 的 macOS 安裝檔（.pkg），裝完重新開啟終端機（REA 官網建議的首次安裝方式）。這種安裝的全域目錄通常在 `/usr/local`，需要管理員權限，請接著看 3.3。【REA 文件／一般做法】
- **B. 已經有 Homebrew：** REA 官網寫的是 `brew install node`，但那會裝 Homebrew 當時的最新版，不一定是 24 LTS。改用固定主要版本的 `node@24`。它是 keg-only（不會自動加進 PATH），要自己加一行：【一般做法】
  ```bash
  brew install node@24
  NODE24_BIN="$(brew --prefix node@24)/bin"
  echo "export PATH=\"$NODE24_BIN:\$PATH\"" >> "$HOME/.zprofile"
  ```
  重新開啟終端機後執行 `node -v`，要看到 v24.11 以上的 24.x。還原方式：刪掉 `~/.zprofile` 裡剛才加的那一行，再 `brew uninstall node@24`。Homebrew 的全域目錄通常在使用者可寫入的位置，不需要 sudo；preflight 會再檢查一次。
- **C. 已經在用 nvm 或 fnm：** 執行 `nvm install 24 && nvm use 24`，或 `fnm install 24 && fnm use 24`（REA 的 install.sh 提示的做法）。【REA 文件】
  - 【推論】日後切換 Node 版本時，全域安裝的 REA 路徑也會跟著改變。切換後請執行 `rea doctor --client claude_code --json`，必要時重跑 setup。

### 3.3 npm 全域目錄需要管理員權限時（EACCES）

preflight 顯示「npm 全域安裝目錄目前使用者無法寫入」時，**不要用 sudo**。sudo 會讓檔案歸 root 所有，也等於用管理員權限處理套件內容。可選的做法：

1. **建議：** 改用 3.2 的 B 或 C 安裝 Node，全域目錄就會在使用者自己的資料夾。
2. **把 npm 全域目錄改到家目錄。** 這是 npm 官方說明 EACCES 時的一般做法，REA 文件沒有寫：
   ```bash
   mkdir -p "$HOME/.npm-global"
   npm config set prefix "$HOME/.npm-global"
   echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> "$HOME/.zprofile"
   ```
   重新開啟終端機後生效。還原方式：執行 `npm config delete prefix`，再刪掉 `~/.zprofile` 裡剛才加的那一行。
3. **退而求其次：不做全域安裝，改用 npx 固定版本。** 例如 `npx -y rea-agents@6.5.0 setup --client claude_code --dry-run`。Claude Code 會註冊成 `npx -y rea-agents@6.5.0 mcp`。【REA 文件】
   - 缺點（推論）：每次啟動都要經過 npm 解析套件並寫入 npm 快取；而且預設會安裝選用相依套件，包括 Frida 與它的安裝指令稿，等於放棄 6.4 的 `--omit=optional`、`--ignore-scripts` 設定。
   - permissions.md 的片段 A 會拒絕 Claude 執行 `npx … rea-agents`。真的要用這個做法，請使用者自己在「終端機」執行，並先評估上面的缺點。本 skill 不建議這條路。

## 4. JDK 21

1. 開啟 REA 官網列出的下載頁：https://adoptium.net/temurin/releases/?version=21
2. 作業系統選 macOS。架構：Apple Silicon 選 **aarch64**，Intel 選 **x64**。套件類型選 **JDK**（不是 JRE）。下載 .pkg 並安裝。【一般做法】
3. 重新開啟終端機，執行下面兩個指令。【REA 文件】
   ```bash
   java -XshowSettings:properties -version
   javac -version
   ```
4. 看輸出確認以下幾點：
   - `java.home = …`：這個資料夾就是 `JAVA_HOME`。例如 `/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home`，實際路徑以輸出為準。
   - `os.arch = aarch64`（Apple Silicon）或 `x86_64`（Intel），要和主機架構相同。
   - `java.version` 是 21 以上；`javac -version` 有印出版本。
5. 裝了好幾個 JDK 時，可以用 `/usr/libexec/java_home -V` 列出全部【一般做法】。設定 REA 時，用 `JAVA_HOME` 明確指向 21 那一個。

為什麼架構要一致：Apple Silicon 上用 Rosetta 執行的 x86_64 JDK，會讓 REA doctor 判定失敗。【REA 文件】

## 5. Ghidra 12.1.4

### 5.1 下載與核對

1. 開啟 https://github.com/NationalSecurityAgency/ghidra/releases/tag/Ghidra_12.1.4_build
2. 在 **Assets** 下載 `ghidra_12.1.4_PUBLIC_<日期>.zip`。不要下載「Source code」。【REA 文件】
3. **一定要比對 SHA-256。**【一般做法】從同一個官方 release 頁面複製 zip 的 SHA-256 值，再計算下載檔的值：
   ```bash
   shasum -a 256 "$HOME"/Downloads/ghidra_12.1.4_PUBLIC_*.zip
   ```
   兩者必須完全相同。不同就停止：刪除這個下載檔，從官方頁面重新下載，不要解壓縮。找不到官方公布的值時，也先停下來告訴使用者。

### 5.2 解壓縮與 GHIDRA_INSTALL_DIR

建議解壓到使用者自己的資料夾（下面以 `~/tools` 為例），之後建置反編譯器時才不需要管理員權限。

```bash
mkdir -p "$HOME/tools"
cd "$HOME/tools" && unzip -q "$HOME"/Downloads/ghidra_12.1.4_PUBLIC_*.zip
ls "$HOME/tools/ghidra_12.1.4_PUBLIC/ghidraRun"
```

含有 `ghidraRun` 的那一層資料夾就是 `GHIDRA_INSTALL_DIR`，例如 `/Users/<帳號>/tools/ghidra_12.1.4_PUBLIC`。【REA 文件】

- 路徑必須是**絕對路徑**，REA 會拒絕相對路徑。
- REA 以 headless 方式執行 Ghidra，每次都用臨時專案（`-readOnly`、`-deleteProject`），不會開啟使用者自己的 Ghidra 專案，所以不需要先開過 Ghidra 的圖形介面。【REA 文件】
- REA 不會修改 Gatekeeper 隔離設定。【REA 文件】如果 macOS 阻擋執行，請參考 Ghidra 官方說明，不要自行關閉系統保護。

### 5.3 建置原生反編譯器（preflight 或 doctor 回報缺少時才需要）

全新的 macOS 安裝常常缺少本機架構的 `decompile` 執行檔。【REA 文件】下面的步驟會用 Apple 的編譯器，編譯 Ghidra 壓縮檔裡附的 C++ 原始碼：

- 只會在 Ghidra 資料夾裡產生檔案。
- 複製那一步只在目的地不存在時才會執行，不會覆蓋已有的反編譯器。
- 建置不需要 JDK。

**Apple Silicon（arm64）：**【REA 文件，在 macOS 15.6 arm64、Apple clang 17、bison 2.3 上驗證過】

```bash
export GHIDRA_INSTALL_DIR="$HOME/tools/ghidra_12.1.4_PUBLIC"
cd "$GHIDRA_INSTALL_DIR/Ghidra/Features/Decompiler/src/decompile/cpp"
make ghidra_opt ARCH_TYPE="-arch arm64" OSDIR=mac_arm_64
decompiler_dir="$GHIDRA_INSTALL_DIR/Ghidra/Features/Decompiler/os/mac_arm_64"
mkdir -p "$decompiler_dir"
test ! -e "$decompiler_dir/decompile" && test ! -L "$decompiler_dir/decompile" &&
  install -m 755 ghidra_opt "$decompiler_dir/decompile"
```

**Intel（x86_64）：**【REA 文件】

```bash
export GHIDRA_INSTALL_DIR="$HOME/tools/ghidra_12.1.4_PUBLIC"
cd "$GHIDRA_INSTALL_DIR/Ghidra/Features/Decompiler/src/decompile/cpp"
make ghidra_opt
decompiler_dir="$GHIDRA_INSTALL_DIR/Ghidra/Features/Decompiler/os/mac_x86_64"
mkdir -p "$decompiler_dir"
test ! -e "$decompiler_dir/decompile" && test ! -L "$decompiler_dir/decompile" &&
  install -m 755 ghidra_opt "$decompiler_dir/decompile"
```

- 編譯器拒絕沿用的 `-mmacosx-version-min=10.6` 旗標時，在 make 那一行最後加上 `ADDITIONAL_FLAGS="-w"` 再試一次。【REA 文件】
- 完成後用 `file "$decompiler_dir/decompile"` 確認架構（例如 `Mach-O 64-bit executable arm64`），再重跑 preflight。裝好 REA 之後，再以 `rea doctor --provider ghidra --json` 確認。

## 6. 安裝 REA

### 6.1 官方來源

REA 繁體中文 README 的原文：「REA 官方來源： morluto/rea, rea.tools, rea-agents (npm). 請透過這些官方來源提供的安裝與發布連結取得 REA。相似的儲存庫名稱或複製的 README 不能證明下載內容來自官方。」【REA 文件】

依先前的研究報告（不是 REA 文件，REA 文件沒有點名任何冒名者）：已出現冒名 repo（例如 rea-githu/REA 提供 Windows zip「官方免費下載」）；另有二手報導指某假倉庫夾帶被 Microsoft Defender 攔截的木馬。npm 上的維護者是 `morluto`。

### 6.2 查看套件資訊（不會安裝任何東西）

```bash
npm view rea-agents dist-tags.latest
npm view rea-agents@6.5.0 version dist.integrity maintainers
npm view rea-agents@6.5.0 dist.attestations --json
```

2026-10-15 查到的值：

- `version`：`6.5.0`
- `dist.integrity`：`sha512-C6BG7LyrAdR74mSjertM6PrxJkcNZ2bfQNOJornPo9erDEp2tyPRVYPnV5Yodr+1RqewCQla68WulXlVnveD+A==`
- `maintainers`：`morluto <morluto@hotmail.com>`（npm 會連同電子郵件一起印出）
- attestations：有 provenance，`predicateType` 為 `https://slsa.dev/provenance/v1`
- `dist-tags.latest`：查證當天是 `6.5.0`；之後出現較新的版本是正常的，不影響安裝 6.5.0，但請照第 9 節評估是否更新。

`version`、`dist.integrity`、`maintainers` 或 provenance 任何一項不同，就停下來，告訴使用者，不要繼續安裝。

### 6.3 驗證簽章與來源證明【一般做法：npm 內建功能，REA 文件沒有這一步】

`npm audit signatures` 不支援全域安裝，所以先在暫存資料夾裝一份來驗證。`--ignore-scripts` 讓這次安裝不執行任何安裝指令稿。

```bash
VERIFY_DIR="$(mktemp -d)"
cd "$VERIFY_DIR" &&
  npm init -y >/dev/null &&
  npm install --ignore-scripts --omit=optional --no-audit --no-fund rea-agents@6.5.0 &&
  npm audit signatures &&
  grep -A4 '"node_modules/rea-agents"' package-lock.json
cd "$HOME" && [ -n "$VERIFY_DIR" ] && rm -rf "$VERIFY_DIR"
```

怎麼判斷結果：

- 輸出應該說明各套件的 registry signatures 都已驗證，並列出已驗證的 attestations。
- `package-lock.json` 裡 `rea-agents` 的 `integrity` 要和 6.2 查到的相同。
- 出現 invalid、missing 等驗證失敗字樣，就停止安裝並回報。
- 【一般做法】也可以在 npmjs.com 的 rea-agents 套件頁面查看 Provenance 區塊，確認建置來源是 github.com/morluto/rea。

### 6.4 正式安裝（固定版本）

```bash
npm install --global --omit=optional --ignore-scripts rea-agents@6.5.0
command -v rea
rea --version
```

- `--omit=optional` 會略過選用相依套件。這包括 Frida 與它的安裝指令稿，也包括行程擷取用的 PTY 平台模組（依 npm registry 上的套件資料，`@lydell/node-pty` 的平台模組是它的選用相依套件）。少了這兩樣，Frida 插樁與 `capture_process_scenario` 這類「會執行程式」的功能就不能用，但 Ghidra 靜態分析用不到它們。【REA 文件：package.json 與封裝驗證指令稿】
- `--ignore-scripts` 不執行任何安裝指令稿。`rea-agents` 本身沒有 preinstall、install 或 postinstall 指令稿。REA 自己的封裝驗證也用 `--ignore-scripts --omit=optional` 安裝，確認 CLI 仍可啟動，而行程擷取會顯示為不可用。【REA 文件】
- 從全域安裝執行 setup 時，Claude Code 的註冊會直接指向這份全域安裝的進入點，所以全域安裝的版本就是 Claude Code 啟動的版本。【REA 文件】
- 日後真的需要 Frida 或行程擷取時，要另外評估，並在授權確認後才重新安裝。

## 7. 註冊到 Claude Code

### 7.1 準備

- **先完成 SKILL.md 步驟 4 的權限設定**（permissions.md 的片段 A 與 B）。註冊後重新啟動的第一個工作階段，就要已經有這些規則。
- 【推論】先關掉其他正在執行的 Claude Code 工作階段，避免同時改寫 `~/.claude.json`。REA 文件只要求先完全關閉 Claude Desktop。
- 多備份一份設定（setup 自己也會備份）：
  ```bash
  cp "$HOME/.claude.json" "$HOME/.claude.json.before-rea-$(date +%Y%m%d%H%M%S)"
  ```
- 以下指令中的 `<GHIDRA 絕對路徑>`、`<JDK 絕對路徑>`，由 Claude 換成 preflight 的 INFO 行（`export GHIDRA_INSTALL_DIR="…"`、`export JAVA_HOME="…"`）或第 4、5 節得到的實際路徑，再把填好的完整指令給使用者看；不要讓使用者自己改佔位文字。Claude 的 Bash 工具不會在多次呼叫之間保留 `export`，所以每個 `rea` 指令前面都要寫上這兩個變數。CLI 執行時讀的是當下 shell 的環境變數，不是 Claude Code 註冊裡的 `env`。

### 7.2 檢查引擎（唯讀）

```bash
GHIDRA_INSTALL_DIR="<GHIDRA 絕對路徑>" JAVA_HOME="<JDK 絕對路徑>" rea doctor --provider ghidra --json
```

`"healthy": true` 才繼續。失敗的檢查項目會附上 remediation，照著處理（也可以看 troubleshooting.md）。`rea doctor --json` 是完全唯讀的。【REA 文件】

### 7.3 預覽（dry-run，不會寫入）

```bash
GHIDRA_INSTALL_DIR="<GHIDRA 絕對路徑>" JAVA_HOME="<JDK 絕對路徑>" REA_ANALYSIS_PROVIDER=ghidra \
  rea setup --client claude_code --dry-run --json
```

- `--dry-run` 只回傳計畫（狀態 `planned`，結束碼 0）。【REA 文件】
- `REA_ANALYSIS_PROVIDER=ghidra` 與 `GHIDRA_INSTALL_DIR` **一定要**和 setup 寫在同一行。setup 只有在「沒有設定任何分析引擎」時才會提議安裝 Hopper（另外收費的商業軟體）；有設定 `GHIDRA_INSTALL_DIR`，或 `REA_ANALYSIS_PROVIDER` 不是 `auto`，就不會提議。setup 也會把 `REA_ANALYSIS_PROVIDER` 寫進註冊的 env，明確指定用 Ghidra。【REA 原始碼：src/application/SetupPlan.ts、SetupHost.ts、SetupRegistrationEnvironment.ts】

逐項向使用者說明計畫內容：

- 要修改的設定檔：`~/.claude.json`，新增 `mcpServers.rea`（`command`、`args` 和 `env`），`env` 包含 `GHIDRA_INSTALL_DIR`、`JAVA_HOME`、`REA_ANALYSIS_PROVIDER`。
- 要安裝的 skill：`~/.claude/skills/reverse-engineer-anything`。不想要的話可以加 `--skill=false`。本 skill 的步驟 7 會參考它，但規則以本 skill 為準。
- 備份：`~/.claude.json.rea.backup`。已經有備份時會保留原本那份；目前設定和備份不同時，會另外保存 `.rea.backup.<sha256>.recovery`。
- **dry-run 看不出 Hopper 會不會出現。** dry-run 不是互動模式，永遠不會規劃 Hopper，所以計畫裡沒有 Hopper 不代表實際套用時也沒有。要在 7.4 的確認畫面再看一次。【REA 原始碼：src/cli/setupCommands.ts】

### 7.4 套用（擇一）

**A. 建議：使用者自己在「終端機」執行（互動模式）**

```bash
GHIDRA_INSTALL_DIR="<GHIDRA 絕對路徑>" JAVA_HOME="<JDK 絕對路徑>" REA_ANALYSIS_PROVIDER=ghidra \
  rea setup --client claude_code
```

- 因為指定了 `--client claude_code`，setup 不會逐項詢問，而是列出一份合併的變更清單，只問一次：`Apply these N changes?`，選項是 `Yes, apply` / `No, cancel`。【REA 原始碼：src/cli/interactiveSetup.ts、src/application/Setup.ts】
- 因為同一行指令有 `GHIDRA_INSTALL_DIR` 與 `REA_ANALYSIS_PROVIDER=ghidra`，清單裡不應該有 Hopper。**回答前先讀清單**：如果出現「Hopper deep-analysis provider」（說明是 Download the official Hopper package…），選 `No, cancel`。這樣什麼都不會改；回頭檢查環境變數有沒有寫在同一行、路徑對不對，再執行一次。setup 沒有 `--no-hopper` 旗標。
- 清單只有 Claude Code 設定、REA skill 與備份時，才選 `Yes, apply`。
- 任何提示按 Ctrl-C 或選 `No, cancel`，都不會做任何修改。【REA 文件】

**B. 由 Claude 執行（非互動模式）**

Claude 的 Bash 不是終端機（TTY），setup 會以非互動模式執行；沒加 `--yes` 時會回報 `needs_confirmation` 並以結束碼 1 結束。【REA 文件】使用者明確同意 7.3 的計畫後，才能執行：

```bash
GHIDRA_INSTALL_DIR="<GHIDRA 絕對路徑>" JAVA_HOME="<JDK 絕對路徑>" REA_ANALYSIS_PROVIDER=ghidra \
  rea setup --client claude_code --yes
```

**不要加 `--install-hopper`**；沒有這個旗標時，`--yes` 不會安裝 Hopper。【REA 文件】

### 7.5 重新啟動與驗證

1. 完全結束 Claude Code，然後在分析資料夾重新啟動：`cd ~/rea-lab && claude`。
   - 重開會結束原本的對話。原本的對話如果就是在 `~/rea-lab` 開的，可以用 `claude --continue`（或啟動後輸入 `/resume`）接續；否則在新的工作階段說「繼續 REA 安裝，從步驟 5 的驗證開始」。【一般做法】
   - **呼叫任何 REA 工具之前**，請使用者確認：狀態列顯示 `⏸ manual mode on`；輸入 `/permissions` 看得到 `mcp__rea__` 規則。任何一項不符合就停下，回到 permissions.md 第 5 節檢查。
2. 執行 `rea doctor --client claude_code --skill --json`，看 `healthy`，以及 skill 的 `identity.skill.state`。【REA 文件】
3. 執行 `claude mcp list`，清單裡應該有 `rea`。注意這個指令會連線並啟動已註冊的伺服器。
4. 在 Claude Code 裡問：「確認 REA 已經連上，並列出你現在能用的 REA 工具。」（REA 官方的英文原句：「Check that REA is connected and show me which REA tools you can use.」）或請 Claude 呼叫 `binary_session`（參數 `{}`），看 `result.tool_availability`。【REA 文件】也可以輸入 `/mcp` 查看伺服器狀態。【一般做法】
5. doctor 正常、但 Claude Code 裡看不到工具，通常是還沒重新啟動。doctor 只檢查檔案與前置條件，不檢查即時連線。【REA 文件】

### 7.6 第一次安全測試

**用自己編譯的小程式（最推薦）：**

```bash
mkdir -p "$HOME/rea-lab" && cd "$HOME/rea-lab"
cat > hello.c <<'EOF'
#include <stdio.h>

static int add(int a, int b) { return a + b; }

int main(void) {
    printf("2 + 3 = %d\n", add(2, 3));
    return 0;
}
EOF
clang -O0 -o hello hello.c
```

接著用 CLI 分析。【REA 文件：docs/native-investigation.md】

```bash
GHIDRA_INSTALL_DIR="<GHIDRA 絕對路徑>" JAVA_HOME="<JDK 絕對路徑>" \
  rea inspect "$HOME/rea-lab/hello" --provider ghidra --json
GHIDRA_INSTALL_DIR="<GHIDRA 絕對路徑>" JAVA_HOME="<JDK 絕對路徑>" \
  rea search "$HOME/rea-lab/hello" add --kind procedures --provider ghidra --json
GHIDRA_INSTALL_DIR="<GHIDRA 絕對路徑>" JAVA_HOME="<JDK 絕對路徑>" \
  rea function "$HOME/rea-lab/hello" "<搜尋結果裡的確切函式名稱>" --provider ghidra --json
```

- macOS 上的函式名稱可能帶底線（例如 `_add`），請用搜尋結果裡的確切名稱；不要假設進入點一定叫 `entry`。【REA 文件】
- 名稱以 `-` 開頭時，改用 `--procedure=<名稱>` 的寫法。
- 第一次查詢時，Ghidra 要匯入並自動分析檔案，所以比較慢。

**在 Claude Code 裡（MCP）：** 例如說「用 REA 以 ghidra 開啟 ~/rea-lab/hello，找到 add 函式，說明它做什麼，附上 Evidence ID 和限制」。結束前請 Claude 先用 `export_evidence_bundle` 匯出需要的 Evidence（要給絕對路徑），再 `close_binary`。

**不需要 Ghidra 的官方範例：**

1. 下載 https://rea.tools/examples/notes-example.zip（一個只有 6 個檔案的 Electron App），解壓到 `~/rea-lab/notes-example`。
2. 在 Claude Code 問：「用 REA 找出我按下 Export notes 時會發生什麼事。說明 notes.csv 寫到哪裡、有哪些欄位，並列出相關的檔案與行號。」REA 官方的英文原句是：「Use REA to find what happens when I click Export notes. Show where notes.csv is written, which fields it contains, and the relevant files and lines.」兩種都可以。
3. 預期答案：寫到「下載項目」資料夾的 `notes.csv`，欄位是 `id` 和 `title`。【REA 文件】

**CTF 練習：** REA 官方案例用過 DownUnderCTF 2023 公開題庫裡的入門題 masked squares flag checker。它是 Linux ELF，在 Mac 上只能做靜態分析，正好適合練習。

### 7.7 setup 改了哪些檔案、如何還原

| 位置 | 內容 | 還原方式 |
|---|---|---|
| `~/.claude.json` 的 `mcpServers.rea` | REA 的 MCP 註冊（含 env） | `claude mcp remove --scope user rea` |
| `~/.claude/skills/reverse-engineer-anything/` | REA 內建分析流程 skill | 移到備份位置：`mv "$HOME/.claude/skills/reverse-engineer-anything" "$HOME/rea-skill-backup-$(date +%Y%m%d)"` |
| `~/.claude.json.rea.backup`（以及可能的 `.recovery` 檔） | setup 修改前的快照 | 最後手段：先結束所有 Claude Code，再用它覆蓋 `~/.claude.json`；這會一併還原其他 Claude Code 狀態，所以優先用上面的 `claude mcp remove` |
| npm 全域套件 `rea-agents` | REA 程式本體 | `npm uninstall --global rea-agents`【一般做法】 |
| `~/.rea` | REA 快取與狀態 | `rea uninstall --purge-data` |

`rea uninstall` 也能移除註冊與 skill，但它會同時處理其他 AI 工具（Codex、Cursor 等）裡的 REA 註冊，範圍比只針對 Claude 的還原廣。【REA 文件】

## 8. 選用：縮小 REA 的使用範圍、節省 context

setup 預設註冊在使用者層級，所以 Claude Code 開啟的每個專案都能呼叫 REA。【REA 文件】想縮小範圍有兩種做法。兩種都**不是安全邊界**：shell、檔案與網路存取仍然可用，同一個 macOS 帳號下的代理仍然能從 PATH 執行 `rea`。【REA 文件】

**先處理已有的註冊。** setup 是「疊加」的：如果已經照第 7 節註冊過，使用者層級的 REA 註冊與 `~/.claude/skills/reverse-engineer-anything` 在其他專案仍然有效，下面兩種做法就什麼都沒縮小。所以要先備份並移除它們（`CLAUDE_CONFIG_DIR` 要先 unset）：【REA 文件】

```bash
cp "$HOME/.claude.json" "$HOME/.claude.json.before-scope-$(date +%Y%m%d%H%M%S)"
claude mcp remove --scope user rea
mv "$HOME/.claude/skills/reverse-engineer-anything" "$HOME/rea-skill-backup-$(date +%Y%m%d%H%M%S)"
```

不要用 `rea uninstall` 做這件事，它也會處理其他 AI 工具的註冊，範圍更廣。

### 8.1 獨立的 Claude Code 設定檔

1. 先把 permissions.md 的片段 A 合併到 `~/.claude-rea/settings.json`，本 skill 也複製一份到 `~/.claude-rea/skills/`，才會在那個設定檔裡生效。【推論】
2. 預覽（不會寫入）：
   ```bash
   CLAUDE_CONFIG_DIR="$HOME/.claude-rea" GHIDRA_INSTALL_DIR="<GHIDRA 絕對路徑>" JAVA_HOME="<JDK 絕對路徑>" REA_ANALYSIS_PROVIDER=ghidra \
     rea setup --client claude_code --dry-run --json
   ```
3. 套用：同一行指令拿掉 `--dry-run --json`，依 7.4 的方式進行（使用者在終端機執行並讀清單，或同意後由 Claude 加 `--yes`）。
4. 啟動：`cd ~/rea-lab && CLAUDE_CONFIG_DIR="$HOME/.claude-rea" claude`。新設定檔可能需要重新登入。【REA 文件】
5. 之後每個檢查、更新、移除指令都要加**同樣的整組前綴**（`CLAUDE_CONFIG_DIR`、`GHIDRA_INSTALL_DIR`、`JAVA_HOME`、`REA_ANALYSIS_PROVIDER`），更新時同樣先 `--dry-run`。少了前綴，指令看到的就是預設設定檔，甚至會在那裡重新建立 REA 的註冊。【REA 文件】
   ```bash
   CLAUDE_CONFIG_DIR="$HOME/.claude-rea" GHIDRA_INSTALL_DIR="<GHIDRA 絕對路徑>" JAVA_HOME="<JDK 絕對路徑>" REA_ANALYSIS_PROVIDER=ghidra \
     rea doctor --client claude_code --skill --json
   CLAUDE_CONFIG_DIR="$HOME/.claude-rea" claude mcp remove --scope user rea   # 移除時
   ```

### 8.2 只給單一專案（local scope）

在專案資料夾執行（`CLAUDE_CONFIG_DIR` 要先 unset）。這樣不會安裝內建 skill，`rea doctor`、`rea uninstall`、`rea update` 也都看不到這個註冊。不要用 `--scope project`，那會寫出可能被 commit 的 `.mcp.json`。【REA 文件】

REA 文件的寫法是 `claude mcp add --scope local rea -- npx -y rea-agents@6.5.0 mcp`。但 npx 會在執行時安裝選用相依套件（包括 Frida 與它的安裝指令稿），和 6.4 的 `--omit=optional`、`--ignore-scripts` 設定相反。本 skill 建議改指向已經用 6.4 方式全域安裝的進入點；從全域安裝執行 setup 時，REA 自己註冊的也是這個進入點。【推論，依據 REA 原始碼 src/application/SetupHost.ts】

```bash
cd "<專案資料夾的絕對路徑>"
claude mcp add --scope local \
  --env GHIDRA_INSTALL_DIR="<GHIDRA 絕對路徑>" \
  --env JAVA_HOME="<JDK 絕對路徑>" \
  --env REA_ANALYSIS_PROVIDER=ghidra \
  rea -- "$(npm root -g)/rea-agents/scripts/rea.mjs" mcp
```

- 實際的選項寫法以 `claude mcp add --help` 為準。
- 移除：在同一個資料夾執行 `claude mcp remove --scope local rea`。
- 更新 REA 後，這個註冊會自動使用新的全域安裝（路徑不變），但要重新核對權限清單。

### 8.3 節省 context

- 用 Anthropic 官方登入時，Claude Code 通常會延後載入 MCP 工具定義。如果改用第三方的 `ANTHROPIC_BASE_URL`，每次請求都會帶上全部約 207 個工具定義。【REA 文件】
- 這種情況下，可以在 `~/.claude.json` 的 `mcpServers.rea.env` 加上 `"REA_MCP_INPUT_SCHEMA_PROFILE": "compact"`，然後重新啟動；setup 之後會保留這個設定。修改前先備份。【REA 文件】
- permissions.md 片段 A 用完整名稱拒絕的 21 個工具，會從 Claude 的可用清單中移除，也能少送一些工具定義。【Claude Code 文件】

## 9. 更新

1. 執行 `npm view rea-agents dist-tags.latest`，並閱讀 CHANGELOG（github.com/morluto/rea）。REA 只為最新版提供安全修正。【REA 文件】
2. 對新版本重做 6.2、6.3 的驗證。
3. `npm install --global --omit=optional --ignore-scripts rea-agents@<新版本>`
4. 加上和 7.3 相同的環境變數，執行 `rea setup --client claude_code --dry-run --json` 預覽，再依 7.4 套用，然後重新啟動 Claude Code。
5. 用 `rea --help` 確認旗標有沒有變。新版本可能新增工具：沒有列在權限設定裡的工具，在 Manual 模式下每次呼叫都會詢問（除非已有 allow 規則），auto 模式下則交給分類器。必要時更新 `permissions.md` 的清單。

官方另外提供 `rea update`。它會在擁有目前 CLI 的 npm 目錄安裝最新版，並回傳一個要另外執行的 setup 指令。【REA 文件】依 6.5.0 原始碼，`rea update` 執行的是 `npm install --global --ignore-scripts --prefix <prefix> rea-agents@<版本>`：保留 `--ignore-scripts`，但不帶 `--omit=optional`，會裝回 Frida 與 PTY 平台模組（不執行它們的安裝指令稿）。要維持 6.4 的設定，請用上面的手動流程。【REA 原始碼：src/application/Update.ts、dist/application/Update.js】

## 10. 解除安裝與清理

```bash
rea uninstall                 # 移除所有 AI 工具中由 REA 管理的註冊與 skill
rea uninstall --purge-data    # 另外移除 ~/.rea 的 cache 與 state
npm uninstall --global rea-agents   # 【一般做法】移除程式本體
```

- 解除安裝會保留 Hopper、Node.js、Evidence 檔、擷取資料、無關的 skill 與其他 MCP 伺服器。【REA 文件】
- local scope 的註冊要另外在該專案執行 `claude mcp remove --scope local rea`。用獨立設定檔時，每個指令都要加第 8.1 節的整組前綴。
- 從 `~/.claude/settings.json` 移除 permissions.md 片段 A 加入的規則（`mcp__rea__…`、`Bash(rea *)`、`Bash(*rea-agents*)`、`Bash(npx *rea-agents*)` 與 CLI 對應的 deny 規則），並刪除 `~/rea-lab/.claude/settings.json`；修改前先備份。
- 如果照 SKILL.md 步驟 5 在 `~/.claude/CLAUDE.md` 加過提醒那一行，也一併刪除。
- Ghidra：不再需要時，刪除 `~/tools/ghidra_12.1.4_PUBLIC`。
- JDK：依 Adoptium 官方說明移除。
- 隱私清理：
  - 刪除 `~/rea-lab`、匯出的 Evidence 檔與暫存驗證資料夾。
  - Claude Code 的對話紀錄以明文存放在 `~/.claude/projects/`，預設保留 30 天，可用 `cleanupPeriodDays` 調整。分析過敏感軟體後請記得清理。
