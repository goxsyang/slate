# REA 疑難排解（macOS · Claude Code · Ghidra）

先跑這三個檢查，再查下面的表：

1. `bash "<本 skill 目錄>/scripts/preflight_macos.sh"`：唯讀的前置條件檢查（Claude 的工作目錄通常不是 skill 目錄，所以要用完整路徑）。
2. 加上 `GHIDRA_INSTALL_DIR=… JAVA_HOME=…` 執行 `rea doctor --provider ghidra --json`，以及 `rea doctor --client claude_code --skill --json`。doctor 是完全唯讀的；必要檢查失敗時結束碼為 1；每個失敗項目都附有 remediation。【REA 文件】
3. 在 Claude Code 裡呼叫 `binary_session`（參數 `{}`），看 `result.tool_availability`，了解每個工具目前能不能用，以及原因。

標示：【REA 文件】出自 REA 官方文件或原始碼訊息；【一般做法】非 REA 文件；【推論】推出的建議。

## 目錄

- A. 前置軟體（Node、Xcode、Java、Ghidra）
- B. 安裝 REA
- C. setup 與 Claude Code 註冊
- D. Ghidra 執行期間
- E. 讀結果時的常見誤解
- F. 日誌與回報問題

---

## A. 前置軟體

| 症狀 | 原因 | 處理方式 |
|---|---|---|
| node 版本不符 | REA 只支援 22.x（>=22.19）、24.x（>=24.11）、26 以上；23、25、預先發行版不支援【REA 文件】 | 改裝 Node 24 LTS（install-macos.md 第 3 節） |
| 找不到 `swiftc`，或 macOS 上啟動 Ghidra 時失敗 | REA 在 macOS 需要 `xcrun swiftc` 來監督子行程；REA 不會安裝 Xcode【REA 文件】 | 安裝 Xcode Command Line Tools（install-macos.md 第 2 節）。編譯輔助程式的期限預設 120,000 ms，可用 `REA_SWIFTC_COMPILE_TIMEOUT_MS` 調整【REA 文件】：CLI 加在指令前面；MCP 則因為 setup 不會把這個變數寫進註冊，要先備份 `~/.claude.json`，手動加進 `mcpServers.rea.env`，再重新啟動 |
| doctor 的 Java 檢查顯示「Install … or set JAVA_HOME before starting REA」或「Update JAVA_HOME to the root of … installation」 | JDK 版本不在 Ghidra 宣告的範圍內，或 `JAVA_HOME` 指錯位置【REA 文件】 | 安裝 JDK 21 以上；`JAVA_HOME` 要指向 `java -XshowSettings:properties -version` 印出的 `java.home`（JDK 根目錄，不是 `bin`） |
| doctor 顯示「Point JAVA_HOME at a JDK whose architecture matches the built decompiler」 | Apple Silicon 上用了 x86_64（Rosetta）JDK，或 JDK 回報的平台和主機不同【REA 文件】 | 改裝 aarch64 版 JDK，讓 `JAVA_HOME` 指向它；終端機不要用 Rosetta 開啟 |
| 缺少 `javac` | 裝到的是 JRE；REA 需要完整 JDK【REA 文件】 | 改裝 JDK 套件 |
| 設定被拒，訊息提到 relative path | `GHIDRA_INSTALL_DIR` 或 `JAVA_HOME` 用了相對路徑；REA 一律拒絕相對路徑【REA 文件】 | 改成絕對路徑 |
| doctor 顯示「Install a Ghidra 12.1.x release (verified with 12.1.4), or update REA for another Ghidra line.」 | Ghidra 版本不是 12.1.x【REA 文件】 | 安裝 Ghidra 12.1.4（install-macos.md 第 5 節） |
| 設了 `GHIDRA_INSTALL_DIR`，但 REA 沒有用 PATH 上的 Ghidra | 只要有設定 `GHIDRA_INSTALL_DIR`，就一定優先使用它，即使路徑無效【REA 文件】 | 修正這個變數，或把它 unset |
| `native_decompiler` 缺少或架構不符 | 全新的 macOS 安裝常常沒有本機架構的 `decompile`；REA 會讀取執行檔標頭來判斷架構【REA 文件】 | 依 install-macos.md 第 5.3 節建置 |
| make 時被 `-mmacosx-version-min=10.6` 旗標擋下 | 工具鏈不接受沿用的舊旗標【REA 文件】 | 在 make 指令後面加 `ADDITIONAL_FLAGS="-w"` |
| 複製 `decompile` 那一步沒有動作 | 這一步只在目的地不存在時才複製，不會覆蓋既有檔案【REA 文件】 | 【推論】確認舊檔案架構不符後，先把它移到備份位置（不要直接刪除），再重新執行複製 |

## B. 安裝 REA

| 症狀 | 原因 | 處理方式 |
|---|---|---|
| `npm install --global` 出現 EACCES | 全域目錄需要管理員權限（常見於 nodejs.org 的 .pkg 安裝）【一般做法】 | **不要用 sudo**；依 install-macos.md 第 3.3 節處理 |
| 裝好後找不到 `rea` | npm 全域的 bin 目錄不在 PATH 上【一般做法】 | 確認 `npm prefix -g` 底下的 `bin` 在 PATH 中，重新開啟終端機 |
| `npm view` 或 `npm audit signatures` 的結果和預期不同 | 可能是不同版本，或來源有問題 | **停止安裝**，向使用者回報，不要繼續 |
| PATH 上的 `rea` 不是 `rea-agents` | 名稱衝突，或來源不明的程式 | 用 `command -v rea` 找出它的位置並確認來源；官方來源只有 github.com/morluto/rea、rea.tools、npm 上的 `rea-agents` |
| 需要行程擷取或 Frida，卻顯示不可用或被拒絕 | 安裝時用了 `--omit=optional`，PTY 平台模組與 Frida 沒有安裝；權限設定也預設拒絕會執行程式碼的工具 | 這是刻意的選擇（見 permissions.md 第 7 節）。真的需要時，先重新確認授權範圍與風險，再決定要不要不加 `--omit=optional` 重新安裝。REA 文件也說明 Frida 在 macOS 上未經驗證 |

## C. setup 與 Claude Code 註冊

| 症狀 | 原因 | 處理方式 |
|---|---|---|
| setup 回傳 `needs_confirmation`，結束碼 1 | 非互動模式（例如 Claude 的 Bash）下沒有加 `--yes`【REA 文件】 | 請使用者在「終端機」互動執行；或在使用者同意計畫後加上 `--yes`（不要加 `--install-hopper`） |
| 終端機 setup 的 `Apply these N changes?` 清單裡出現「Hopper deep-analysis provider」 | setup 沒看到任何已設定的分析引擎：`GHIDRA_INSTALL_DIR`、`REA_ANALYSIS_PROVIDER=ghidra` 沒有寫在同一行，或路徑錯誤【REA 原始碼：src/application/SetupPlan.ts】 | 選 `No, cancel`（什麼都不會改）。修正環境變數，先用 `rea doctor --provider ghidra --json` 確認健康，再重跑 |
| 在 `~/rea-lab` 啟動後，狀態列顯示 `⏵⏵ auto mode on` | 沒有在 `~/rea-lab` 裡啟動，或 `~/rea-lab/.claude/settings.json` 不存在、格式錯誤【推論】 | 先不要呼叫 REA 工具。確認是用 `cd ~/rea-lab && claude` 啟動，檢查並驗證片段 B 的 JSON 格式（permissions.md 第 5 節），再重新啟動 |
| setup 一開始就整個中止 | 既有設定檔格式錯誤或位置不安全，REA 會在寫入任何檔案前就擋下整個交易【REA 文件】 | 用 `node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))' ~/.claude.json` 檢查格式；修正前先備份 |
| skill 狀態顯示 `unmanaged` | skill 目錄是符號連結或不是資料夾；setup 拒絕寫入符號連結位置【REA 文件】 | 改成一般資料夾，或用 `--skill=false` |
| setup 完成，但 Claude Code 裡看不到 REA 工具 | Claude Code 還沒重新啟動。doctor 只檢查檔案，不檢查即時連線【REA 文件】 | 完全結束 Claude Code 再重開。也可以用 `claude mcp list` 或 `/mcp` 查看；`rea mcp doctor --json` 會檢查 MCP 伺服器能否正常啟動，並在 `diagnostics` 附上子行程日誌【REA 文件】 |
| 註冊的 env 裡沒有 `GHIDRA_INSTALL_DIR` 或 `JAVA_HOME` | setup 只會在 Ghidra 檢查結果為可用時才寫入這些路徑；而且環境變數必須在執行 setup 的同一個指令裡【REA 文件】 | 先讓 `rea doctor --provider ghidra --json` 回報健康，再帶著相同的變數重跑 setup |
| `capability_unavailable` 且 `selection_reason: ambiguous` | 有多個引擎都支援這個目標【REA 文件】 | 在 `open_binary` 指定 `provider_id: "ghidra"`，CLI 加 `--provider ghidra` |
| `provider_unavailable` | 選定的引擎不能用；REA 不會自動切換到其他引擎【REA 文件】 | 看 `message`、`remediation.action`、`details.rejections`，然後執行 `rea doctor --provider ghidra --json` |
| 切換 Node 版本（nvm 或 fnm）後，REA 伺服器起不來 | 【推論】註冊指向舊的全域安裝路徑 | 執行 `rea doctor --client claude_code --json`，必要時用新的 Node 重新安裝 REA 並重跑 setup |
| 用了獨立設定檔，但檢查結果對不上 | 指令沒有加 `CLAUDE_CONFIG_DIR=…` 前綴，看到的是預設設定檔【REA 文件】 | 每個 `claude`、`rea` 指令都加同樣的前綴 |
| local scope 的註冊沒出現在 doctor，也沒被 uninstall 移除 | `rea doctor`、`uninstall`、`update` 只讀使用者層級的註冊【REA 文件】 | 在該專案資料夾執行 `claude mcp remove --scope local rea` |
| 第三方 API 端點下 context 不夠用，或 autocompact 一直重複 | 使用第三方的 `ANTHROPIC_BASE_URL` 時，tool search 會關閉，約 207 個工具定義每次都會送出【REA 文件】 | 在 `mcpServers.rea.env` 加上 `"REA_MCP_INPUT_SCHEMA_PROFILE": "compact"` 並重新啟動；端點支援 `tool_reference` 時可設 `ENABLE_TOOL_SEARCH=true`；遇到無法辨識的模型時可設 `CLAUDE_CODE_MAX_CONTEXT_TOKENS`【REA 文件】 |

## D. Ghidra 執行期間

| 症狀 | 原因 | 處理方式 |
|---|---|---|
| 第一次查詢很久 | `open_binary` 不會等待匯入；第一次 Ghidra 查詢才開始匯入與自動分析。每個新工作階段都會重新匯入【REA 文件】 | 正常現象，請耐心等候。分析小程式通常比大型 App 快很多 |
| 第一次查詢逾時 | Ghidra 的啟動期限預設 330,000 ms；大型檔案可能需要更久【REA 文件】 | 設定 `REA_GHIDRA_STARTUP_TIMEOUT_MS`（1 到 2,147,483,647 的整數）：CLI 加在指令前面；MCP 則在 setup 時帶上這個變數，setup 會把它寫進註冊的 env。復原流程：需要時先匯出 Evidence → `close_binary` → 以相同路徑和 `provider_id: "ghidra"` 執行 `open_binary` → 重試【REA 文件】 |
| Claude Code 端逾時 | REA 文件沒有 Claude Code 的逾時說明 | 依 2026-10-15 的 Claude Code 文件：`MCP_TOOL_TIMEOUT` 預設非常長；stdio 伺服器的閒置逾時預設 30 分鐘，可用 `CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT` 調整；`MCP_TIMEOUT` 是伺服器啟動逾時。實際設定請查 Claude Code 官方文件 |
| 分析 Swift 或 Objective-C 的 arm64 Mach-O 時卡住 | 特定分析器停滯【REA 文件】 | 設定 `REA_GHIDRA_DISABLED_ANALYZERS="Objective-C Message Analyzer"`。CLI：加在指令前面。MCP：setup 不會把這個變數寫進註冊，要先備份 `~/.claude.json`，手動加進 `mcpServers.rea.env`，再重新啟動 |
| 記憶體不足 | 預設 heap 2G，依序讀取 `GHIDRA_HEADLESS_MAXMEM`、`GHIDRA_MAXMEM`【REA 文件】 | CLI：加在指令前面，例如 `GHIDRA_HEADLESS_MAXMEM=4G`。MCP：這個變數必須傳給 REA 伺服器行程，而它不在 setup 自動轉寫的清單裡，所以要先備份 `~/.claude.json`，再手動加進 `mcpServers.rea.env`，然後重新啟動 |
| `_JAVA_OPTIONS` 等設定沒有作用 | REA 會清掉 `_JAVA_OPTIONS`、`JAVA_TOOL_OPTIONS`、`JDK_JAVA_OPTIONS`、`GHIDRA_JAVA_OPTIONS`【REA 文件】 | 改用上面列出的 REA 專用變數 |
| 結果太大，出現 `resource_constraint` | 單次回應受傳輸大小限制；結果已完整保留在這個工作階段【REA 文件】 | 用錯誤訊息 `details.reported_limits.evidence_reference` 回報的 Evidence 參照呼叫 `inspect_analysis_view` 分頁查看（`analyze_function` 的結果還會附上可直接使用的 `continuation`）；或用 `get_evidence_bundle` 加 `"detail": "summary"` 與篩選條件找出 Evidence ID；或用 `export_evidence_bundle` 匯出。**不要**在 Ghidra 工具（例如 `procedure_pseudo_code`、`analyze_function`）加 `"detail"`：REA 的輸入格式很嚴格，會直接拒絕。接受 `detail` 的只有 `analyze_javascript_application`、`inspect_binary_layout`、`inspect_artifact`、`inspect_wasm_artifact`、`inspect_macho`、`decode_interface_builder` 與 `get_evidence_bundle`【REA 文件：docs/mcp-contracts.md】 |
| `close_binary` 之後 Evidence 不見了 | `close_binary` 會清掉這個連線的 Evidence 帳本【REA 文件】 | 關閉前先 `export_evidence_bundle`（絕對路徑）；也可以用 `snapshot_path` 保存快取的分析 |

## E. 讀結果時的常見誤解

| 誤解 | 事實【REA 文件】 |
|---|---|
| pseudocode 就是原始碼 | pseudocode 是 Ghidra 的反編譯輸出，「never original source」；需要精確時看組合語言 |
| 函式看起來被截斷，所以程式有問題 | Ghidra 的 no-return 假設可能截斷函式本體，請看 Evidence 的 `limitations` |
| 呼叫清單是空的，所以沒有呼叫 | 覆蓋不完整時，空結果不能證明不存在；間接呼叫可能沒有解析出來 |
| `search_strings` 找不到，所以檔案裡沒有這段文字 | 它只搜尋已定義的字串物件；可以改用 `search_bytes` 或 `read_bytes` |
| 比較結果是 `changed`，所以行為改變了 | 只代表文字上有差異，不代表行為不同 |
| 靜態分析看到這段程式，所以它會執行 | 靜態分析沒有觀察到執行；結論要分成觀察、推論、未知 |
| 看不到某項邏輯，所以軟體沒有這個功能 | 伺服器端邏輯、動態載入的程式碼，靜態分析本來就看不到 |

## F. 日誌與回報問題

- REA 以 JSON 格式把日誌寫到 **stderr**，沒有獨立的日誌檔。層級由 `REA_LOG_LEVEL` 控制（`trace`、`debug`、`info`、`warn`、`error`、`fatal`、`silent`，預設 `info`）。【REA 文件】
- REA 文件沒有說明 Claude Code 把 MCP 伺服器的 stderr 存在哪裡，請改用 `rea mcp doctor --json` 的 `diagnostics`。
- 回報錯誤前先更新到最新版，問題可能已經修好了。【REA 文件】
- 一般問題到 github.com/morluto/rea 開 issue，附上 REA 版本、目標類型、重現步驟與錯誤訊息；**不要附上二進位檔、權杖或私人路徑**。
- 資安問題請用 GitHub 的 Security 分頁「Report a vulnerability」私下回報。【REA 文件】
