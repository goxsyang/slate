# REA 的 Claude Code 權限設定

## 目錄

1. 為什麼要設定、設計原則
2. 片段 A：REA 工具規則（使用者層級）
3. 片段 B：分析專用資料夾的模式設定（專案層級）
4. 片段 C：可疑檔案用的嚴格模式（專案層級）
5. 套用步驟（備份、合併、驗證、重新啟動、確認）
6. 權限提示出現時怎麼回答
7. 需要執行類工具時（選用，預設不開）
8. 注意事項與已知限制

---

## 1. 為什麼要設定、設計原則

REA 不要求、也不提供任何權限核准機制，要不要詢問完全交給 MCP 用戶端（Claude Code）決定。REA 給每個工具標註的效果（annotations）「只是提示，不是授權控制」。REA 的 setup 也**不會**寫入任何 Claude Code 權限規則。【REA 文件：docs/mcp-contracts.md】

**要在註冊 REA 之前就套用。** Claude Code v2.1.283 以後，互動模式預設從 auto 模式開始；沒有符合任何規則的動作會交給分類器判斷，不會問使用者。【Claude Code 文件】如果先註冊 REA 再設權限，重新啟動後到套用規則之前，所有 REA 工具（包括會執行程式碼的工具）都由分類器決定。`mcp__rea__…` 規則在伺服器還不存在時就可以寫入並生效，所以順序是：先套用本檔的片段 A、B，再執行 `rea setup`。

REA 6.5.0 共有 207 個工具。這份清單是依 REA 原始碼的效果表 `src/contracts/toolEffects.ts` 逐一比對產生的，6.5.0 套件裡的 `dist/contracts/toolEffects.js` 與 2026-10-15 的 main 完全相同。本設定針對「只做靜態分析」的使用方式：

| 分層 | 數量 | 內容 | 為什麼 |
|---|---|---|---|
| allow（自動允許） | 78 | 只會在本機開啟、解析檔案並記錄 Evidence 的靜態工具（Ghidra 函式、反編譯、字串、交叉參照、載入映像與數值追蹤；Mach-O、Go、Rust、PE 資源；Apple 的 Interface Builder、keyed archive、dylib 解析；JavaScript/Electron；.NET；Evidence 整理與比較） | 不執行目標、不連網、不寫檔、不改目標。只會啟動 REA 自己的輔助程式、使用者設定的引擎（Ghidra），或 Xcode Command Line Tools 附的唯讀檢查程式（`inspect_macho`、`inspect_signature`、`inspect_plist`、`list_architectures`、`demangle_swift` 會呼叫 `lipo`、`otool`、`nm`、`codesign`、`plutil` 等）。REA 定義這些不算「外部程式碼」 |
| ask（每次詢問） | 79 + 2 | 連到執行中的 App、瀏覽器、裝置或網路的工具；會寫檔、匯出、解壓、丟棄 Evidence 或編輯分析中繼資料的工具；可能含個資的離線讀取（HAR 封包紀錄、SQLite）；Android、韌體、封包、WebAssembly 等會寫暫存檔的解析工具；以及透過 Bash 執行的 `rea` 與 `rea-agents` 指令 | 這些操作會影響裝置或資料、寫入檔案，或讀到隱私內容，每次都應由使用者確認 |
| deny（直接拒絕） | 21 + 15 | 15 個會執行外部程式碼的工具（行程、瀏覽器、Electron、原生 UI 情境擷取、LLDB、Frida、GDB、Rizin、Cutter）與 6 個會修改 Android 裝置的工具；加上它們在 CLI 的對應指令，以及 `npx … rea-agents` | 使用者的用途都是靜態分析。在平常使用的 Mac 上，一次手滑核准英文提示，就可能真的執行樣本。需要時依第 7 節另外開啟 |
| 未列出 | 29 | 24 個只記錄 Evidence 的工具（Hopper 導覽與註解、除錯工作階段狀態、比較執行期擷取結果、Android／Harmony 結構圖等，這個設定用不到，為了精簡沒有列入）；5 個會啟動本機輔助程式的檢查工具（`inspect_with_objdump`、`inspect_asset_catalog`、`inspect_adb_client`、`inspect_apktool_client`）或切換 Hopper 畫面的 `goto_address` | Manual 模式下每次呼叫都會詢問（除非已有 allow 規則）；auto 模式下交給分類器 |

兩個重要原則：

- **不要**把 `mcp__rea` 或 `mcp__rea__*` 放進 allow，那等於連會執行程式碼的工具都自動核准。也不要放進 ask：ask 的優先順序高於 allow，放進去後每個靜態工具都會一直跳出詢問。
- 即使是「靜態」工具，也會用使用者的權限讓本機引擎解析檔案。REA 不是沙箱，可疑檔案仍要在隔離環境分析（見 `isolated-analysis.md`）。【REA 文件：SECURITY.md】

規則語法依據 Claude Code 官方文件（2026-10-15 查閱）：

- `mcp__<伺服器>__<工具>` 會符合單一工具。REA 的伺服器名稱是 `rea`。
- 評估順序是 deny → ask → allow，先符合的規則決定結果，與規則寫得多精確無關。
- 任何設定層級的 deny 或 ask，都優先於任何層級的 allow；任何層級的 deny，其他層級都無法改成允許或詢問。
- 只寫完整工具名稱的 deny 規則，會把那個工具從 Claude 的可用清單中移除。
- settings.json 無法針對 MCP 工具的參數設規則（帶括號的 `mcp__` 規則會被略過）；要依參數拒絕，只能在啟動時用 CLI 的 `--disallowedTools` 設 deny。
- Bash 規則裡的 `*` 可以出現在任何位置，也能符合空白；`Bash(rea *)` 也符合單獨的 `rea`。deny 與 ask 規則會略過指令開頭的 `VAR=…` 設定，所以 `GHIDRA_INSTALL_DIR=… rea …` 這種寫法仍然會被規則攔到。
- 名稱含 `_` 的規則**打錯字也不會有警告**，請直接複製下面的清單，不要手打。

## 2. 片段 A：REA 工具規則（使用者層級）

合併到 `~/.claude/settings.json`。使用 `CLAUDE_CONFIG_DIR` 獨立設定檔時，改成 `$CLAUDE_CONFIG_DIR/settings.json`。

為什麼放使用者層級：setup 是把 REA 註冊在使用者層級，每個專案都能呼叫 REA，所以規則也應該到處生效。這份片段只影響 `mcp__rea__…` 工具與 `rea`、`rea-agents` 相關指令，不影響使用者的其他工作。

```json
{
  "permissions": {
    "allow": [
      "mcp__rea__open_binary", "mcp__rea__binary_session",
      "mcp__rea__binary_overview", "mcp__rea__list_documents",
      "mcp__rea__list_procedures", "mcp__rea__search_procedures",
      "mcp__rea__list_strings", "mcp__rea__search_strings",
      "mcp__rea__list_segments", "mcp__rea__list_names",
      "mcp__rea__procedure_info", "mcp__rea__procedure_address",
      "mcp__rea__procedure_pseudo_code", "mcp__rea__procedure_assembly",
      "mcp__rea__procedure_callers", "mcp__rea__procedure_callees",
      "mcp__rea__procedure_references", "mcp__rea__resolve_containing_procedure",
      "mcp__rea__read_function_instructions", "mcp__rea__inspect_native_instruction",
      "mcp__rea__inspect_native_data_type", "mcp__rea__resolve_native_call_targets",
      "mcp__rea__xrefs", "mcp__rea__find_xrefs_to_name",
      "mcp__rea__analyze_function", "mcp__rea__batch_decompile",
      "mcp__rea__get_call_graph", "mcp__rea__trace_call_path",
      "mcp__rea__trace_feature", "mcp__rea__read_bytes",
      "mcp__rea__search_bytes", "mcp__rea__address_to_file_offset",
      "mcp__rea__inspect_address_context", "mcp__rea__get_objc_classes",
      "mcp__rea__get_objc_protocols", "mcp__rea__analyze_swift_types",
      "mcp__rea__inspect_native_api", "mcp__rea__inspect_macho",
      "mcp__rea__inspect_signature", "mcp__rea__inspect_plist",
      "mcp__rea__list_architectures", "mcp__rea__demangle_swift",
      "mcp__rea__inspect_pe_resources", "mcp__rea__inspect_go_binary",
      "mcp__rea__inspect_rust_binary", "mcp__rea__inspect_electron_fuses",
      "mcp__rea__analyze_javascript_application", "mcp__rea__inspect_analysis_view",
      "mcp__rea__trace_application_feature", "mcp__rea__trace_javascript_semantics",
      "mcp__rea__compare_application_versions", "mcp__rea__compare_source_to_bundle",
      "mcp__rea__compare_javascript_export_shapes", "mcp__rea__inspect_managed_artifact",
      "mcp__rea__inspect_managed_members", "mcp__rea__inspect_managed_native_boundaries",
      "mcp__rea__compare_managed_members", "mcp__rea__verify_managed_native_boundaries",
      "mcp__rea__project_managed_application_graph", "mcp__rea__get_evidence_bundle",
      "mcp__rea__list_unknowns", "mcp__rea__record_unknown",
      "mcp__rea__update_unknown", "mcp__rea__verify_unknown_resolution",
      "mcp__rea__compare_functions", "mcp__rea__compare_artifacts",
      "mcp__rea__compare_bundles", "mcp__rea__find_changed_behavior",
      "mcp__rea__build_call_path", "mcp__rea__verify_reconstruction",
      "mcp__rea__evaluate_reconstruction_coverage", "mcp__rea__inspect_native_load_image",
      "mcp__rea__trace_native_values", "mcp__rea__inspect_native_dispatch_metadata",
      "mcp__rea__trace_dylib_resolution", "mcp__rea__decode_interface_builder",
      "mcp__rea__inspect_keyed_archive", "mcp__rea__project_apple_application_graph"
    ],
    "ask": [
      "mcp__rea__start_frida_session", "mcp__rea__unload_frida_script",
      "mcp__rea__close_frida_session", "mcp__rea__observe_web_execution",
      "mcp__rea__start_gdb_session", "mcp__rea__list_browser_targets",
      "mcp__rea__inspect_web_page", "mcp__rea__analyze_web_bundle",
      "mcp__rea__observe_web_session", "mcp__rea__discover_webmcp_tools",
      "mcp__rea__capture_web_screenshot", "mcp__rea__inspect_web_event_listeners",
      "mcp__rea__trace_web_module_imports", "mcp__rea__list_electron_targets",
      "mcp__rea__inspect_electron_page", "mcp__rea__list_javascript_runtime_targets",
      "mcp__rea__observe_javascript_runtime", "mcp__rea__observe_native_ui",
      "mcp__rea__list_frida_devices", "mcp__rea__list_frida_processes",
      "mcp__rea__list_cutter_sessions", "mcp__rea__inspect_jeb_client",
      "mcp__rea__open_jeb_project", "mcp__rea__list_jeb_units",
      "mcp__rea__decompile_jeb_item", "mcp__rea__list_adb_devices",
      "mcp__rea__inspect_adb_device", "mcp__rea__list_adb_packages",
      "mcp__rea__read_adb_logcat", "mcp__rea__inspect_adb_package",
      "mcp__rea__list_adb_processes", "mcp__rea__list_adb_directory",
      "mcp__rea__list_adb_features", "mcp__rea__list_adb_services",
      "mcp__rea__inspect_adb_display", "mcp__rea__inspect_adb_window",
      "mcp__rea__read_adb_setting", "mcp__rea__resolve_adb_packages",
      "mcp__rea__pull_adb_package", "mcp__rea__pull_adb_file",
      "mcp__rea__capture_adb_screen", "mcp__rea__collect_adb_bugreport",
      "mcp__rea__close_binary", "mcp__rea__export_evidence_bundle",
      "mcp__rea__import_evidence_bundle", "mcp__rea__inspect_artifact",
      "mcp__rea__extract_artifact", "mcp__rea__export_web_scripts",
      "mcp__rea__recover_javascript_sources", "mcp__rea__annotate_native_function",
      "mcp__rea__set_address_name", "mcp__rea__set_addresses_names",
      "mcp__rea__set_comment", "mcp__rea__set_inline_comment",
      "mcp__rea__set_bookmark", "mcp__rea__unset_bookmark",
      "mcp__rea__inspect_web_network_capture", "mcp__rea__inspect_sqlite_database",
      "mcp__rea__decode_android_resources", "mcp__rea__decode_signal_recording",
      "mcp__rea__extract_firmware", "mcp__rea__identify_flutter_build",
      "mcp__rea__inspect_android_class", "mcp__rea__inspect_android_method",
      "mcp__rea__inspect_android_package", "mcp__rea__inspect_binary_layout",
      "mcp__rea__inspect_dart_aot", "mcp__rea__inspect_evm_interface",
      "mcp__rea__inspect_firmware_regions", "mcp__rea__inspect_packet_capture",
      "mcp__rea__inspect_packet_fields", "mcp__rea__inspect_pcap_capture",
      "mcp__rea__inspect_pcap_client", "mcp__rea__inspect_recorded_crash",
      "mcp__rea__inspect_signal_decoders", "mcp__rea__inspect_wasm_artifact",
      "mcp__rea__search_android_classes", "mcp__rea__trace_android_references",
      "mcp__rea__trace_web_source_location",
      "Bash(rea *)", "Bash(*rea-agents*)"
    ],
    "deny": [
      "mcp__rea__cutter_command", "mcp__rea__gdb_console",
      "mcp__rea__start_rizin_debug_session", "mcp__rea__rizin_debug_command",
      "mcp__rea__close_rizin_debug_session", "mcp__rea__close_gdb_session",
      "mcp__rea__execute_rizin_command", "mcp__rea__load_frida_script",
      "mcp__rea__resume_frida_session", "mcp__rea__instrument_with_frida",
      "mcp__rea__capture_native_ui_scenario", "mcp__rea__observe_native_calls",
      "mcp__rea__capture_browser_scenario", "mcp__rea__capture_electron_scenario",
      "mcp__rea__capture_process_scenario", "mcp__rea__push_adb_file",
      "mcp__rea__install_adb_package", "mcp__rea__uninstall_adb_package",
      "mcp__rea__start_adb_app", "mcp__rea__start_adb_activity",
      "mcp__rea__stop_adb_app",
      "Bash(*observe-native-calls*)", "Bash(*capture-native-ui-scenario*)",
      "Bash(*capture-electron-scenario*)", "Bash(*capture-browser-scenario*)",
      "Bash(*capture-process*)", "Bash(*debug-with-gdb*)",
      "Bash(*debug-with-rizin*)", "Bash(*execute-rizin-command*)",
      "Bash(*cutter-command*)", "Bash(*instrument-with-frida*)",
      "Bash(*push-adb-file*)", "Bash(*install-adb-package*)",
      "Bash(*start-adb-*)", "Bash(*stop-adb-app*)",
      "Bash(npx *rea-agents*)"
    ]
  }
}
```

`deny` 最後幾行是 CLI 的對應指令。REA 的 CLI 不受 MCP 規則約束：例如 `rea observe-native-calls` 會用 LLDB 執行目標，而 LLDB 隨 Xcode Command Line Tools 一起安裝。`Bash(npx *rea-agents*)` 擋下用 npx 臨時下載執行 REA：那會略過固定版本，並且裝回選用的 Frida 與它的安裝指令稿（REA 內建 skill 的範例用的就是 `npx -y rea-agents@latest`）。

## 3. 片段 B：分析專用資料夾的模式設定（專案層級）

為逆向分析開一個專用資料夾 `~/rea-lab`，並在裡面建立 `.claude/settings.json`：

```json
{
  "permissions": {
    "defaultMode": "default",
    "disableBypassPermissionsMode": "disable",
    "disableAutoMode": "disable"
  }
}
```

為什麼需要：

- `"defaultMode": "default"`：從 Manual 模式開始，每個沒有 allow 規則的動作都會詢問。啟動後狀態列會顯示 `⏸ manual mode on`。
- `"disableAutoMode": "disable"`：只設 `defaultMode` 只決定「從哪個模式開始」，使用者仍然可以按 Shift+Tab 切到 auto 模式，或在 Bash 提示裡選「Yes, and switch to auto mode」。設了這一項，auto 模式就從切換循環和提示選項裡消失，在這個資料夾裡啟動的工作階段會一直停在 Manual 模式。這個設定放在任何設定檔都有效。【Claude Code 文件】
- `"disableBypassPermissionsMode": "disable"`：阻止進入略過所有權限檢查的模式。這個設定放在任何設定檔都有效；放在組織的 managed settings 時，其他層級無法覆蓋。【Claude Code 文件】
- 除了 dontAsk 模式（會直接拒絕），明確的 ask 規則在 Manual、auto、bypassPermissions 模式下都會詢問。【Claude Code 文件】

只放在專案層級，是為了不改變使用者平常在其他專案的工作習慣。所以**分析一律在 `~/rea-lab` 裡啟動 `claude`**（`cd ~/rea-lab && claude`），並確認狀態列顯示 `⏸ manual mode on`。

## 4. 片段 C：可疑檔案用的嚴格模式（專案層級）

分析來路不明的檔案時，依 `isolated-analysis.md` 在虛擬機器裡另外開一個資料夾，在它的 `.claude/settings.json` 寫入：

```json
{
  "permissions": {
    "defaultMode": "default",
    "disableBypassPermissionsMode": "disable",
    "disableAutoMode": "disable",
    "ask": [
      "mcp__rea__open_binary", "mcp__rea__inspect_artifact",
      "mcp__rea__extract_artifact"
    ],
    "deny": [
      "mcp__rea__cutter_command", "mcp__rea__gdb_console",
      "mcp__rea__start_rizin_debug_session", "mcp__rea__rizin_debug_command",
      "mcp__rea__close_rizin_debug_session", "mcp__rea__close_gdb_session",
      "mcp__rea__execute_rizin_command", "mcp__rea__load_frida_script",
      "mcp__rea__resume_frida_session", "mcp__rea__instrument_with_frida",
      "mcp__rea__capture_native_ui_scenario", "mcp__rea__observe_native_calls",
      "mcp__rea__capture_browser_scenario", "mcp__rea__capture_electron_scenario",
      "mcp__rea__capture_process_scenario", "mcp__rea__push_adb_file",
      "mcp__rea__install_adb_package", "mcp__rea__uninstall_adb_package",
      "mcp__rea__start_adb_app", "mcp__rea__start_adb_activity",
      "mcp__rea__stop_adb_app",
      "Bash(*observe-native-calls*)", "Bash(*capture-native-ui-scenario*)",
      "Bash(*capture-electron-scenario*)", "Bash(*capture-browser-scenario*)",
      "Bash(*capture-process*)", "Bash(*debug-with-gdb*)",
      "Bash(*debug-with-rizin*)", "Bash(*execute-rizin-command*)",
      "Bash(*cutter-command*)", "Bash(*instrument-with-frida*)",
      "Bash(*push-adb-file*)", "Bash(*install-adb-package*)",
      "Bash(*start-adb-*)", "Bash(*stop-adb-app*)",
      "Bash(*rea-agents*)"
    ]
  }
}
```

和片段 A 比，多了這些：

- `ask` 裡的 `open_binary`、`inspect_artifact`、`extract_artifact`：專案層級的 ask 優先於使用者層級的 allow，所以每開一個不可信的檔案（或掛載 DMG、解壓縮）都要使用者有意識地核准一次。
- `Bash(*rea-agents*)` 改成拒絕：在這個資料夾裡不安裝、不更新、不用 npx 執行 REA。安裝與更新請到別的資料夾進行。
- deny 清單和片段 A 重複是刻意的：即使使用者層級的設定被改動，這個資料夾的限制仍然有效。

**這些規則擋不住所有寫法。** 例如透過其他指令稿、別名、複製到別處的 REA 進入點，或 `sh -c` 包起來的指令，都可能不符合規則字串。這就是可疑檔案仍然一定要在虛擬機器裡分析的原因。

## 5. 套用步驟

修改權限設定屬於改變系統行為，**一定要先讓使用者看過、明確同意**。也可以讓使用者自己貼上。

1. **備份**（檔案存在時）：
   ```bash
   cp "$HOME/.claude/settings.json" "$HOME/.claude/settings.json.bak-$(date +%Y%m%d%H%M%S)"
   ```
2. **讀取現有內容並合併：**
   - 把片段 A 的 `allow`、`ask`、`deny` 各自加進現有的 `permissions.allow`、`permissions.ask`、`permissions.deny` 陣列（陣列不存在就建立），去掉重複項目。
   - 不要刪除或改動使用者原有的其他規則和設定。
   - 如果原本就有 `mcp__rea`、`mcp__rea__*`，或「Yes, and don't ask again」留下的 REA 工具 allow 規則，要向使用者說明風險，經同意後再移除。
3. **驗證 JSON 格式**（node 是安裝 REA 時就有的）：
   ```bash
   node -e 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); console.log("JSON OK")' "$HOME/.claude/settings.json"
   ```
4. 建立 `~/rea-lab/.claude/settings.json`（片段 B），同樣驗證格式：
   ```bash
   mkdir -p "$HOME/rea-lab/.claude"
   ```
   檔案已存在時先備份再合併。片段 C 只在虛擬機器裡的嚴格模式資料夾使用。
5. **重新啟動 Claude Code，並在分析資料夾裡啟動**（`cd ~/rea-lab && claude`）。確認兩件事再繼續：
   - 狀態列顯示 `⏸ manual mode on`。
   - 輸入 `/permissions`，清單裡看得到 `mcp__rea__` 規則。【一般做法】

還原方式：用第 1 步的備份覆蓋回去，或刪除加入的 `mcp__rea__…`、`Bash(rea *)`、`Bash(*rea-agents*)`、`Bash(npx *rea-agents*)` 與上面那些 CLI 對應規則；刪除 `~/rea-lab/.claude/settings.json`。

## 6. 權限提示出現時怎麼回答

Claude Code 的提示是英文，選項大致如下：

| 英文選項 | 意思 | 怎麼選 |
|---|---|---|
| Yes | 只核准這一次 | 先看清楚工具名稱和目標檔案，沒問題才選 |
| Yes, and don't ask again … | 永久加入 allow 規則 | **不要選** |
| Yes, and switch to auto mode | 核准並把整個工作階段切到 auto 模式 | **不要選**（`~/rea-lab` 裡設了 `disableAutoMode`，通常不會出現） |
| No | 拒絕 | 不確定時就選這個，再請 Claude 用中文說明 |

- 選「Yes, and don't ask again」會留下永久的 allow 規則。對於列在 ask 或 deny 裡的工具，ask 與 deny 仍然優先；但未列出的工具和 Bash 指令就會被永久放行。
- 被拒絕的工具，不要換個方式重試或繞道執行，也不要擅自擴大核准範圍。這和 REA 內建 skill 的原則一致：「Do not retry the same rejected call, silently broaden approvals, or rewrite MCP effects as read-only.」【REA 文件】
- 讀過目標內容之後，Claude 如果提議執行、安裝、下載或傳送任何東西，要特別小心，那可能是提示注入（見 safe-use-and-legal.md）。

## 7. 需要執行類工具時（選用，預設不開）【推論】

任何層級的 deny 都無法被其他層級改成 ask，所以不能只在某個專案資料夾裡「打開」被拒絕的工具。真的需要時：

1. 先依 SKILL.md 步驟 0b 確認授權範圍**包含執行**，並記錄下來。可疑檔案一律不執行。
2. 最好在虛擬機器裡進行（見 `isolated-analysis.md`）。部分工具還需要安裝時用 `--omit=optional` 略過的 Frida 或 PTY 模組，要另外評估。
3. 經使用者同意後，備份 `~/.claude/settings.json`，只把這次需要的那幾個工具名稱（與對應的 CLI 規則）從 `deny` 移到 `ask`。
4. 完成後用備份還原，讓它們回到 `deny`。

## 8. 注意事項與已知限制

- **CLI 不受 MCP 規則約束。** 透過 Bash 執行的 `rea capture-process ./scenario.json` 之類的指令，不會經過 `mcp__rea__…` 規則。所以片段 A 把 `Bash(rea *)`、`Bash(*rea-agents*)` 設成 ask，並把會執行程式碼或修改裝置的 CLI 指令另外設成 deny。【Claude Code 文件、REA 文件：src/cliCommandNames.ts】
- **規則依賴伺服器名稱 `rea`。** 如果手動用別的名稱註冊，每條規則都要跟著改。
- **新版本可能新增工具。** 更新 REA 後要核對工具清單。新工具沒有列進規則時，Manual 模式下每次呼叫都會詢問（除非已有 allow 規則），auto 模式下則交給分類器。
- **REA 標成 `readOnlyHint` 的工具只有 6 個。** 幾乎所有分析工具都會記錄 Evidence，所以被標成「非唯讀」。不能用這個提示判斷工具安不安全，請以本清單為準。【REA 文件】
- **這些規則不是沙箱。** shell、檔案與網路存取仍由 Claude Code 的其他權限控制。
