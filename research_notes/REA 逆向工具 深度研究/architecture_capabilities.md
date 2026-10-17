# REA (Reverse Engineer Anything): architecture, capabilities, setup and ecosystem position

Scope note: Current as of 2026-10-15. Primary source is the local shallow clone at `/home/user/morluto/rea`, HEAD `b2257653ca74e1013553d5bd916a0ef85a3c7678`, committed 2026-10-15 20:45 +0800. I only read it and did not execute it. Repo citations below use commit-pinned GitHub URLs of the form `https://github.com/morluto/rea/blob/b2257653.../<path>#L<line>`. Each one corresponds to the same file and line in the local clone.

I could not use some sources:
- The GitHub API and npm download stats were blocked by the proxy (HTTP 403).
- Several third-party review sites failed DNS/proxy: gittested.com, benchclaw.io, korben.info, hysenlabs.com, starlog.is, hex-rays.com and sidekick.binary.ninja.

Claims that rest only on search-result snippets from those sites are marked UNVERIFIED.

## Q1. What exactly is REA (MCP server, CLI, or both)? What does `setup` do? Which agents and OSes are supported?

### Takeaway
REA is one npm package (`rea-agents`, v6.5.0, MIT) that is **both** a local stdio MCP server (`rea-agents mcp`) and a CLI (`rea …`). The two share the same workflows. `npx rea-agents setup` is an approval-gated installer:
- It writes REA's MCP registration (pinned to an exact version) into the config of each selected agent, out of 24 supported clients.
- It installs a bundled "reverse-engineer-anything" agent skill (workflow instructions).
- It can optionally install the Hopper demo, or record an existing Ghidra installation's path.

It runs on Linux, macOS and Windows, but engine support differs per OS. Windows is the narrowest: Ghidra there is "experimental P0" and read-only, and there is no Hopper and no Kuna.

### Cited Findings
- Package identity:
  - npm name `rea-agents`, version `6.5.0`, license MIT.
  - Description: "Reverse engineer anything from your terminal or agent with one CLI and MCP server."
  - Binaries `rea` and `rea-agents` both map to `scripts/rea.mjs`.
  - `mcpName` is `io.github.morluto/rea`.
  - Source: [package.json](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/package.json)
- MCP Registry entry `io.github.morluto/rea`, version 6.5.0. It runs over stdio transport, launched as `npx rea-agents mcp` (`"runtimeHint": "npx"`, `"transport": {"type": "stdio"}`, positional argument `"mcp"`) — [server.json](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/server.json)
- "REA is published in the official MCP Registry as `io.github.morluto/rea`… the Registry entry does not introduce a second distribution artifact." Manual config: `"command": "npx", "args": ["-y", "rea-agents@6.5.0", "mcp"]`. — [docs/installation.md L1088-1118](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/installation.md#L1088)
- Self-description: "REA connects your agent to tools for inspecting native binaries, JavaScript and Electron apps, .NET assemblies, and websites. You can also use the same tools from your terminal. Analysis runs locally, and results include the evidence and limitations behind each conclusion." — [README.md L63](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L63)
- "Your agent calls REA through MCP to inspect the target and trace relevant code. REA returns findings with their evidence. The agent uses them to ask follow-up questions, explain the behavior, or write and test an implementation. CLI commands use the same workflows." — [README.md L153-156](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L153)
- What setup does: "Setup registers REA with your agent and installs matching workflow instructions. Native analysis can use an existing Hopper, Ghidra, or IDA installation; setup can optionally install Hopper with approval. Static JavaScript analysis needs no native analysis engine." — [README.md L65](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L65)
- Setup details — [docs/installation.md L14-117](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/installation.md#L14):
  - Setup previews the plan (paths, network origins, integrity evidence, package-manager commands) and requires approval.
  - It creates `.rea.backup` copies and uses atomic writes. `--dry-run`, `--client`, `--all-detected`, `--skill=false` and `--install-hopper` are supported.
  - "Hopper is a separate optional choice: setup shows its proposed installation or connection and requires its own explicit approval. It can also save verified paths for an existing Ghidra installation."
- Registrations are pinned: "Persistent registrations should use one exact package version. `rea setup` writes the same package-runner shape… and pins it to the exact version that performed setup." — [docs/installation.md L1112-1116](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/installation.md#L1112)
- Supported clients (24, with `--client` IDs) — [docs/installation.md L454-487](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/installation.md#L454):
  - Claude Code, Claude Desktop, Codex, Cursor, Gemini CLI, Windsurf, Devin, OpenCode, Antigravity, GitHub Copilot CLI, Command Code, Qwen Code, Kimi Code, VS Code, Grok Build, OMP, Pi, Hermes, Qoder, Factory Droid, Trae, WorkBuddy, ZCode, DeepSeek Harness.
  - "`droid`, `dsh`, `kimi`, `qoder`, `trae`, `workbuddy`, and `zcode` require `rea-agents@6.5.0` or later."
  - Grok Bot uses a manual hosted connector.
  - Any other MCP client: "Any agent that supports local MCP servers" ([README.md L257](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L257)).
- The website FAQ lists a shorter set of 14 clients plus Grok Bot: "Claude Code, Claude Desktop, Codex, Cursor, Gemini CLI, Windsurf, Devin, OpenCode, Antigravity, GitHub Copilot CLI, Command Code, Grok Build, OMP, and VS Code." It probably lags the docs. — [website/public/faq/index.html](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/website/public/faq/index.html) (official site: https://rea.tools/faq/)
- Node requirement: "REA requires Node.js 22.x (>=22.19), 24.x (>=24.11), or 26+, plus npm." — [README.md L166](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L166). This matches `"engines": {"node": "^22.19.0 || ^24.11.0 || >=26.0.0"}` in [package.json](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/package.json). `.nvmrc` pins 24.18.0. SQLite inspection needs Node 24.15+ or 26+ ([README L177](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L177)).
- OS and engine matrix:
  - Hopper: "The automated Hopper installer supports macOS 12+, Ubuntu 24.04+, Fedora 41+, Nobara 44+, 64-bit Arch Linux, CachyOS, or Omarchy." — [docs/installation.md L506](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/installation.md#L506). "Hopper installation remains unavailable on Windows. Setup never installs Ghidra…" — [docs/installation.md ~L829-830](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/installation.md#L829)
  - Ghidra: "REA connects to an existing Ghidra installation on Linux x64/arm64, macOS x64/arm64, or experimental Windows x64 P0." — [docs/installation.md L765](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/installation.md#L765)
  - Windows P0 scope: "Status: experimental Windows x64 support for the read-only P0 boundary." Windows 10+ x64, fixed local NTFS volumes only. — [docs/windows-ghidra-p0.md](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/windows-ghidra-p0.md)
  - Kuna: "Windows is not supported yet." — [docs/kuna-provider.md L25](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/kuna-provider.md#L25)
  - Linux prerequisite: Ghidra, JADX, firmware tools and static JS/Electron analysis "require a procps-compatible `ps` on REA's `PATH`". — [README.md L71-74](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L71)
- Release timeline:
  - npm registry: package created 2026-07-12T12:46Z; `latest` = 6.5.0, published 2026-10-14T12:56Z; 32 versions; the single maintainer is `morluto`.
  - Publish times: 4.1.0 at 2026-10-06; 6.0.0 at 2026-10-08; 6.4.0 at 2026-10-11.
  - Source: [registry.npmjs.org/rea-agents](https://registry.npmjs.org/rea-agents)
  - CHANGELOG dates: 0.2.0 (2026-07-12), 1.0.0 (2026-07-13), 3.0.0 (2026-08-01), 4.0.0 (2026-10-05), 5.0.0 (2026-10-07), 6.0.0 (2026-10-08), 6.1.0, 6.2.0 and 6.3.0 (all 2026-10-09), 6.4.0 (2026-10-11), 6.5.0 (2026-10-13). There are 36 release headings in all. — [CHANGELOG.md](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/CHANGELOG.md)
- Bundled skill: `.agents/skills/reverse-engineer-anything/SKILL.md` (metadata version "42"). It is also distributed via skills.sh. "Installing this skill supplies instructions; it does not register the REA MCP server, install analysis engines, or add tools to an already-running agent." — [SKILL.md](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/.agents/skills/reverse-engineer-anything/SKILL.md); see also [README.md L284-288](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L284)
- Star count (self-reported): the README's star-history section says "🎉 **250,000 GitHub stars — thank you!**" — [README.md L348](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L348). A third-party research repo reports "0 → 247,148 stars by 2026-10-15" — [github.com/ringozzt/rea-research](https://github.com/ringozzt/rea-research). I could not check either figure because the GitHub API was blocked.

### Inferences
- REA is a local stdio MCP server plus a CLI. It is not a hosted service, and it does not contain or call an LLM.
- `package.json` dependencies include `@modelcontextprotocol/server`/`client` 2.3.1, `playwright-core`, `@babel/parser`, `@electron/asar` and optional `frida`, but **no model-provider SDK**. The "AI" part is therefore entirely the user's agent (Claude Code, Codex, etc.).
- The project went from 4.x to 6.5.0 in about a week (Oct 5–13, 2026), which coincides with the viral launch. Expect rapid churn, and expect press numbers (tool counts, versions) to go stale quickly.

### Gaps
- I could not verify the live GitHub star count, forks, or npm weekly downloads (GitHub API and api.npmjs.org returned 403 via the proxy). Other researchers should cover the star-count controversy.
- The README badge mentions "Termux" build scripts (`build:termux` in package.json), but I found no documentation that Android/Termux is officially supported. UNVERIFIED.

## Q2. Which engine does REA use per target type (native, JS/Electron, .NET, "websites"), and what else is supported?

### Takeaway
For native code, REA **does not decompile anything itself**. It drives a provider you supply:
- Hopper (commercial; setup can install the free demo).
- Ghidra (free; bring your own 12.1.x).
- IDA, through the third-party `mrexodia/ida-pro-mcp` server or the `ida-free-mcp` plugin.
- Kuna (an Apache-2.0 decompiler).
- Lighter offline options: objdump/Rizin.

JavaScript/Electron and .NET analysis use REA's **own built-in static parsers**:
- JS/Electron: Babel parser and ASAR reader, plus an optional Wakaru unbundler.
- .NET: its own metadata/CIL reader, plus optional ILSpy.

"Websites" means **client-side** observation of what a browser receives: REA attaches over the Chrome DevTools Protocol to a Chrome-family browser you own and reads the DOM, scripts, source maps and network metadata, or it reads saved HAR/SAZ captures. That cannot reach server-side code.

The project also covers a long tail of other targets: Android (JADX/Apktool/ADB/JEB), firmware (Binwalk/Unblob), Go, Rust, WASM, EVM, SQLite, pcaps, logic signals, crash dumps, process capture, and Frida dynamic instrumentation. Each needs its own caller-supplied tool.

### Cited Findings
- Target table — [README.md L169-193](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L169):

  | Target | Engine / requirement (README) |
  |---|---|
  | Native binaries | "Hopper, Ghidra or IDA" |
  | Go binaries | "Built-in static ELF/PE/thin Mach-O inspection" |
  | Rust binaries | Built-in cargo-auditable inspection |
  | WASM | "Caller-supplied WABT 1.0.42" |
  | EVM bytecode | Linux x64 |
  | SQLite | Node 24.15+ |
  | Recorded Linux crashes | pwntools / GDB / pwndbg |
  | JavaScript / Electron | "Node.js and npm" |
  | Websites | "A Chrome-family browser" |
  | Saved network captures | HAR / Fiddler SAZ / mitmdump |
  | .NET assemblies | "None (static only)" |
  | Android APKs | "Headless JADX and a full JDK" |
  | Android devices | adb |
  | JEB projects | "A caller-started JEB client serving MCP" |
  | Android resources | Apktool |
  | Flutter | Static APK parsing |
  | Firmware | "Binwalk / Unblob on Linux" |
  | Packets | TShark |
  | Logic signals | sigrok-cli |
  | Packages / Apple bundles | Built-in |
  | Process behavior | "Linux/macOS with a native PTY" |

- "For offline native-binary inspection, REA also supports caller-supplied GNU objdump and Rizin… REA does not install or update either provider." — [README.md L199-202](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L199)
- Native providers named in the README: Hopper, Ghidra, IDA, Kuna, and experimental Windows Ghidra. "Ghidra also supports 16-bit DOS analysis." — [README.md L206-211](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L206). There are further Ghidra docs for MIPS, PPC, RISC-V, PSP, NativeAOT and raw/6502 targets (`docs/ghidra-*.md`, `docs/raw-binary.md`).
- **IDA is a wrapper around a third-party MCP server.** "REA adapts an existing IDA MCP server into its native analysis tools. Existing IDA Pro profiles use mrexodia/ida-pro-mcp; an optional native bridge for IDA Pro and IDA Free is described below… REA does not install, upgrade, activate, or license them, and does not bundle another IDA server." — [docs/ida-provider.md L3](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/ida-provider.md#L3)
  - Attached mode (an already-open IDA GUI) requires ida-pro-mcp's "upstream 1.4.0 legacy tools".
  - Headless mode requires ida-pro-mcp's "database supervisor" API (`idb_open`/`idb_list`/`idb_close`, idalib).
  - Optional IDA Free/Pro path via the `0xshlomil/ida-free-mcp` native plugin: "It requires neither IDAPython nor idalib." — [docs/ida-provider.md L60](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/ida-provider.md#L60). "IDA Free's cloud decompiler needs network access and may request consent." — [L66](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/ida-provider.md#L66)
- Kuna: "Kuna is an Apache-2.0 decompiler distributed as one `kuna` executable. REA uses a `kuna` you supply." Supported targets: "ELF and thin Mach-O executables for x86-64, AArch64 and ARM; PE and universal Mach-O are rejected." — [docs/kuna-provider.md](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/kuna-provider.md)
- **.NET uses REA's own static reader:** "REA inspects .NET PE/CLI artifacts without loading or executing their code." There are "seven shipped tools": `inspect_managed_artifact`, `inspect_managed_members`, `inspect_managed_native_boundaries`, `compare_managed_members`, `verify_managed_native_boundaries`, `import_managed_reconstruction` and `project_managed_application_graph`. "Native-body bridge mapping and managed runtime execution are outside the current tool set." — [docs/managed-code-analysis.md L3-24](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/managed-code-analysis.md#L3)
- ILSpy is optional and outside the package: "Optional separately installed .NET decompiler; not a redistributed REA dependency." — [THIRD_PARTY_NOTICES.md L75](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/THIRD_PARTY_NOTICES.md#L75). "`ICSharpCode.Decompiler`/`ilspycmd` can supply reconstruction inference… and remains non-canonical." — [docs/managed-code-analysis.md ~L478-480](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/managed-code-analysis.md#L478)
- JavaScript/Electron:
  - The CLI example `analyze-javascript-application /path --json` returns "modules, imports, Electron boundaries and their evidence". — [README.md L104-111](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L104)
  - Package dependencies include `@babel/parser` 8.0.4 and `@electron/asar` 4.2.0. — [package.json](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/package.json)
  - Optional bundle unpacking via Wakaru: "REA accepts Wakaru ^1.13.0 on Linux x64" (user-supplied via `REA_WAKARU_COMMAND`). — [docs/javascript-recovery.md L10-18](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/javascript-recovery.md#L10)
- **"Websites" = client-side CDP observation:** "REA can attach to a user-owned Chrome-family browser through the Chrome DevTools Protocol (CDP) and produce bounded Evidence about an existing page. This is a passive reverse-engineering capability, not a general browser automation or remote-control surface." — [docs/browser-observation.md L9](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/browser-observation.md#L9)
  - Tools: `list_browser_targets`; `inspect_web_page` (DOM, accessibility, scripts, resources, network/console metadata); `analyze_web_bundle` ("parses selected script artifacts without execution and derives chunk edges, route and endpoint candidates, vendor fingerprints… source-map/original-source evidence"); `observe_web_session`; `discover_webmcp_tools`; `compare_web_captures`; `capture_web_screenshot`; `compare_web_screenshots`; `export_web_scripts`.
  - Source: [docs/browser-observation.md L1-35](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/browser-observation.md#L1)
- Website showcase example (dinosaur game): "REA inspected the HTTP page https://wayou.github.io/t-rex-runner/ in an owned Chrome 150.0.7871.124 session through a loopback debugging connection." The returned evidence was the page's `index.js` source. — [website/evidence/calculator-and-dino.md L80](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/website/evidence/calculator-and-dino.md#L80)
- Android: JADX through the third-party `jadx-headless-mcp 0.7.1` JAR, supplied by the user (`REA_JADX_MCP_JAR`). — [docs/android-analysis.md L40-58](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/android-analysis.md#L40). JEB is reached through "A caller-started JEB client serving MCP" ([README L185](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L185)).
- **Dynamic analysis / Frida:** "REA exposes Frida device and process discovery, attach or spawn sessions, and caller-authored JavaScript instrumentation through the CLI and MCP. The Node bindings are an optional package dependency… REA does not install Frida server on a target." — [docs/frida-instrumentation.md L3](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/frida-instrumentation.md#L3)
  - Eight MCP tools: `list_frida_devices`, `list_frida_processes`, `start_frida_session`, `load_frida_script`, `resume_frida_session`, `unload_frida_script`, `frida_session_status`, `close_frida_session` ([L7](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/frida-instrumentation.md#L7)).
  - `optionalDependencies: {"frida": "17.23.2"}` in [package.json](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/package.json).
  - Other dynamic surfaces: GDB/pwndbg, Rizin debug sessions, LLDB tracer (`bridge/native/rea_lldb_tracer.py`), Electron/JS runtime observation, mitmproxy capture, ADB device control, PTY process capture. Sources: tool contracts list in [src/contracts/toolContracts.ts](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/src/contracts/toolContracts.ts) and the `files` list in package.json.
- Mach-O/PE/ELF: Go and Rust inspection read "ELF/PE/thin Mach-O" ([README L173-174](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L173)). Hopper handles Mach-O (e.g. ObjC selectors in [docs/native-investigation.md L39](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/native-investigation.md#L39)). Windows Ghidra P0 admits "native x86, x86-64, ARMNT (Thumb-2) and ARM64 PE applications and DLLs" ([docs/installation.md ~L800](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/installation.md#L800)).
- Which engines the showcases actually used:
  - DX-Ball: "Recorded analysis: REA 4.1.0, Ghidra 12.1.4, Linux x64 host." — [website/evidence/dx-ball-sound-pan.md L12](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/website/evidence/dx-ball-sound-pan.md#L12). So it used Ghidra, not Hopper or IDA.
  - Windows Calculator: package "version `11.2508.4.0`, x64"; the calculation was in `CalcViewModel.dll`, function `0x1801245d0` (10,656 bytes). — [website/evidence/calculator-and-dino.md L10-29](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/website/evidence/calculator-and-dino.md#L10)
- Third-party engines are external: "The upstream executables and their dependency graphs are supplied separately. Git submodules pin inspection sources; they are not included in the npm package." Pinned submodules: jadx-headless-mcp, binwalk, unblob, ghidra-nativeaot, wakaru. — [THIRD_PARTY_NOTICES.md L50-53](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/THIRD_PARTY_NOTICES.md#L50); [.gitmodules](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/.gitmodules)

### Inferences
- The Facebook post says REA analyzes "網站" (websites). That is accurate only in the sense of **client-side artifacts**: the HTML/JS/source maps, browser-visible network traffic, and screenshots of pages open in a browser you control. Nothing in the docs suggests REA can see server-side code. This agrees with the critics' point quoted in the post ("伺服器上的邏輯也碰不到", server-side logic is out of reach).
- "Reverse Engineer Anything" is mainly breadth by integration. Most non-trivial decompilation (native code, Android, IDA, firmware unpacking, JS unbundling) is delegated to existing tools that the user must obtain. REA's own parsers cover lighter static formats: JS/Electron module graphs, .NET metadata/CIL, Go/Rust build info, Flutter, Apple bundles and SQLite.

### Gaps
- I found no explicit doc on iOS IPA handling, beyond Apple app bundles and Mach-O via Hopper. UNVERIFIED.
- I did not determine the exact list of CPU architectures each provider supports across all docs. Many `docs/ghidra-*.md` architecture guides exist (MIPS, PPC, RISC-V, PSP, 6502, DOS).

## Q3. How does REA drive the engines? What tools are exposed (and how many)? Is there an evidence/knowledge store, a reconstruction-verification harness, and session management?

### Takeaway
How each engine is driven:
- **Hopper:** a Python bridge script injected via Hopper's own `--python` launcher option. It talks over an authenticated Unix socket. On Linux, the demo build runs on a private Xvfb display.
- **Ghidra:** headless (`analyzeHeadless` plus a packaged Java `HeadlessScript`) in an ephemeral, isolated project.
- **IDA:** REA proxies an upstream IDA MCP server, which can be headless idalib.
- **Kuna:** run as a subprocess.

All engines are put behind one provider-neutral tool vocabulary (`open_binary` → `analyze_function`, `procedure_pseudo_code`, `xrefs`, `read_bytes`, …), with one deep provider bound per session and no automatic fallback.

The public catalog is about **172–173 MCP tools** (documented counts on main and in the 6.5.0 timeframe), plus **6 guided MCP prompts**. Every tool returns a content-addressed **Evidence** record (`evidence_id`, normalized result, limitations, unknowns), which can be exported as a bundle and compared.

REA has *evidence-accounting* tools for reconstructions (`build_reconstruction_obligation_ledger`, `evaluate_reconstruction_coverage`, `verify_reconstruction` prompt). It does **not** ship a compiler/byte-matching harness. The DX-Ball byte match was done in a separate reconstruction repo.

### Cited Findings
- Hopper mechanism: "Authenticated REA adapter executed on Hopper's dedicated Python thread. The bootstrap injects `REA_SOCKET` and a random `REA_TOKEN` before executing this file with Hopper's supported `--python` launcher option." — [bridge/hopper_bridge.py L1-5](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/bridge/hopper_bridge.py#L1)
  - Linux demo: "REA runs the supported demo build on a private Xvfb display and selects Hopper's offered demo mode for each analysis session." — [docs/installation.md L576](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/installation.md#L576)
  - Linux concurrency: one Hopper application per user. "A competing CLI or MCP session receives the owning session ID before Hopper is launched." — [docs/installation.md ~L594-600](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/installation.md#L594)
- Ghidra mechanism: "REA imports one target into an ephemeral Ghidra database… GUI controls and persistent database mutation are unavailable." "One `analyzeHeadless` import produces exactly one Program." — [docs/ghidra-provider.md L3-30](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/ghidra-provider.md#L3). "Ghidra sessions use a packaged Java `HeadlessScript`, an isolated temporary project, and private home, cache, and runtime directories." — [SECURITY.md L38](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/SECURITY.md#L38). The Java bridge sources are in `bridge/ghidra/ReaGhidraBridge.java` and related files ([package.json `files`](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/package.json)).
- Ghidra operation count: "The adapter exposes 26 read-only operations: fourteen inventory/name/search operations and twelve function-analysis operations… On Linux and macOS, `annotate_native_function` also edits a function name and/or entry comments…" — [docs/installation.md L786](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/installation.md#L786)
- IDA headless mechanism: "REA copies the admitted binary into a private temporary directory, checks its digest, and requests an owned worker with `force_headless`… On close or failed startup, it releases its session with `save: false`…" — [docs/ida-provider.md](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/ida-provider.md) (headless section)
- Provider binding: "One deep provider stays bound to the target; runtime failure never selects another provider automatically." — [docs/ghidra-provider.md L21-22](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/ghidra-provider.md#L21). If several providers are configured, `auto` reports `ambiguous` and the user picks one via `--provider` / `open_binary.provider_id` ([docs/installation.md L327-332](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/installation.md#L327); [docs/kuna-provider.md](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/kuna-provider.md)).
- **Tool count:**
  - "On main at 04089d5be, with 172 tools, that payload measured about 496 KB with the default profile and about 290 KB with `compact`. By the o200k and cl100k tokenizers, that is roughly 120k and 68k tokens." This is the cost when Claude Code's tool search is off. — [docs/client-configuration.md L103-110](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/client-configuration.md#L103)
  - The 6.5.0 contribution record (Kimi Code PR #2744) reports "real-client verification on Kimi Code 0.40.1 (173 tools discovered…)". — [docs/releases/6.5.0.contributions.json L12777](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/releases/6.5.0.contributions.json#L12777)
  - The canonical inventory is `TOOL_CONTRACTS` ("Complete ordered public inventory used by registration and verification"), which concatenates 36 contract families: official Hopper-style proxy ops, enhanced, native, binary diagnostics, analysis view, artifacts, EVM, Go, Rust, WASM, SQLite, captures, signals, managed, Android, Apktool, pcap, Flutter, JEB, ADB, firmware, browser, Electron, JS runtime, application, web script/runtime/network, JS recovery, session, Cutter, reverse-engineering tools, GDB, Rizin debug, Frida. — [src/contracts/toolContracts.ts L1-75](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/src/contracts/toolContracts.ts#L38)
  - The machine-readable catalog is generated at build time and "not checked-in". — [docs/mcp-contracts.md L805-815](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/mcp-contracts.md#L805)
  - Third-party counts conflict and are stale: "133 个 MCP tools" at v5.0.0 (2026-10-07), and later "about 139 tools, 94 CLI commands, and 26 providers" — [ringozzt/rea-research](https://github.com/ringozzt/rea-research). Another write-up cites "126+ tools" (search snippet only, UNVERIFIED).
- Representative tool names. All of these exist in `src/contracts` (verified by grep):
  - Session: `open_binary`, `binary_session`, `close_binary`.
  - Native inventory/navigation: `list_documents`, `list_procedures`, `search_procedures`, `list_strings`, `search_strings`, `list_names`, `list_segments`, `goto_address`, `xrefs`.
  - Function analysis: `procedure_pseudo_code`, `procedure_assembly`, `procedure_callers`, `procedure_callees`, `procedure_references`, `analyze_function`, `batch_decompile`, `read_function_instructions`, `read_bytes`, `search_bytes`, `get_call_graph`, `trace_call_path`, `resolve_native_call_targets`, `inspect_native_load_image`.
  - Annotation: `set_comment`, `set_address_name`, `annotate_native_function`.
  - Workflow and feature tracing: `investigate_feature`, `trace_feature`, `trace_application_feature`, `trace_native_ui_action`.
  - Comparison: `compare_functions`, `inspect_artifact`, `compare_artifacts`, `compare_application_versions`.
  - Evidence: `get_evidence_bundle`, `export_evidence_bundle`.
  - Reconstruction: `verify_reconstruction`, `evaluate_reconstruction_coverage`, `build_reconstruction_obligation_ledger`, `audit_residual_unknowns`.
  - JS: `analyze_javascript_application`, `recover_javascript_sources`, `trace_javascript_semantics`.
  - Web: `inspect_web_page`, `analyze_web_bundle`.
  - Mobile/firmware/managed: `inspect_android_class`, `extract_firmware`, `inspect_managed_members`.
  - Frida, GDB and Rizin-debug session families.
  - Source: tool-name grep over [src/contracts](https://github.com/morluto/rea/tree/b2257653ca74e1013553d5bd916a0ef85a3c7678/src/contracts). The scratch list is at `/tmp/claude-0/-home-user-slate/39b3d953-ede3-5fb7-9e08-1cdeabd1ac6c/scratchpad/toolnames2.txt`. It is a regex approximation (178 candidates including a few false positives) and not authoritative.
- Evidence store: "Evidence-producing tools return the complete canonical Evidence record in both text and structured content. Read `structuredContent.normalized_result` for the operation result and `structuredContent.evidence_id` for its identity… The same record is retained in the session bundle… Pass the returned Evidence directly to a compatible comparison tool…" — [docs/mcp-contracts.md L11-25](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/mcp-contracts.md#L11)
  - Evidence IDs look like `ev_<sha256>`, e.g. the DX-Ball pan dossier `ev_ddca5813…` ([dx-ball evidence L13](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/website/evidence/dx-ball-sound-pan.md#L13)).
  - Function dossiers declare per-facet availability (`pseudocode`, `assembly`, `callers`, `callees`, `references`, `cfg`…) ([docs/mcp-contracts.md L50-56](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/mcp-contracts.md#L50)).
- Guided prompts: "REA exposes six provider-neutral investigation workflows through the MCP `prompts` capability": `investigate_feature`, `compare_application_versions`, `verify_reconstruction`, `trace_crash`, `audit_residual_unknowns`, `prepare_bounded_process_capture`. "The prompts also ask agents to keep observations, inferences, and unknowns distinct." — [docs/mcp-prompts.md L3-26](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/mcp-prompts.md#L3)
- Reconstruction verification is evidence-ledger based:
  - "`build_reconstruction_obligation_ledger` turns authenticated Evidence records into a deterministic list of reconstruction claims… The ledger is conservative by design… A required obligation closes only when one manifest binding supplies a unique owner, any required parser/schema/domain type, every required case fixture, and a passing verifier whose authority is comparable to the original observation." — [docs/reconstruction-obligation-ledgers.md L3-17](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/reconstruction-obligation-ledgers.md#L3)
  - "`rea evaluate-reconstruction-coverage coverage.json --json` evaluates an inline coverage workspace… a passing verifier summary cannot promote inferred Evidence into a replay observation." — [docs/reconstruction-coverage.md L3-11](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/reconstruction-coverage.md#L3)
  - The 9-stage "reconstruction readiness" verifier is a repo CI check: "The report evaluator is part of the repository verifier, not a public REA tool." — [docs/reconstruction-readiness.md L15](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/reconstruction-readiness.md#L15)
- The DX-Ball byte matching came from the external project, not REA:
  - "The reconstruction project's recorded checks establish: 3,205 direct original-x86 differential cases: integer positions 0–640 at scales 0, 0.5, 1, 20 and −1. 63 matching bytes for the complete VC4.0-compiled function, after applying every reviewed relocation…"
  - "The website update reused the matching saved REA results… It did not start a new provider session or repeat the project's execution/compiler checks."
  - Sources: [website/evidence/dx-ball-sound-pan.md L15-18, L99-107](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/website/evidence/dx-ball-sound-pan.md#L99). The showcase page says: "REA supplies the instructions, callers and data reads; the reconstruction project implements and tests the result." ([website/public/showcase/dx-ball/index.html](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/website/public/showcase/dx-ball/index.html); live: https://rea.tools/showcase/dx-ball/)
  - Reconstruction repo: https://github.com/N0zoM1z0/dx-ball, checkpoint commit `a55dca27…`, 7 Oct 2026.
- DX-Ball project-wide numbers (showcase page): "55 maintained C functions", "45,380 comparisons with original code", "33 functions with matching compiled bytes"; "Project checkpoint: 7 October 2026." — [website/public/showcase/dx-ball/index.html ~L246-256](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/website/public/showcase/dx-ball/index.html#L246)
- The agent workflow in DX-Ball used three calls: `analyze_function {"procedure":"0x406400"}`, `analyze_function {"procedure":"0x411f40"}` (caller), and two `read_bytes` calls (constants 1.5625, 500.0, scale 1.0). The reconstructed C is `pan = (double)x; pan = pan * 1.5625; pan = pan - 500.0; pan = pan * dxball_pan_scale; return (DxBallInt)pan;`. — [showcase page](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/website/public/showcase/dx-ball/index.html); [evidence L49-60](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/website/evidence/dx-ball-sound-pan.md#L49)
- Engineering and testing posture:
  - "Provider and platform claims require their corresponding real verification lanes." — [docs/roadmap.md](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/roadmap.md)
  - "`npm run verify:agent` evaluates investigation scenarios through a real local Codex CLI." — [docs/testing.md L1389](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/testing.md#L1389)
  - package.json has per-client verification scripts (`verify:claude-client`, `verify:gemini-client`, `verify:copilot-client`, `verify:deepseek-client`, …).
- Security model: "REA authenticates its Hopper and Ghidra bridges with per-session random capability tokens. POSIX uses current-user Unix sockets… This is not a sandbox and does not protect against malicious processes already running as the same operating-system user. Opening an untrusted binary delegates parsing and analysis to the selected local provider with that user's permissions." — [SECURITY.md L26-36](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/SECURITY.md#L26)
- Tool-design philosophy: "Public names and semantics remain provider-neutral, with exact coverage reported per provider… Keep the catalog complete; report capability/session availability instead of truncating schemas." Tool shapes are inspect / search / trace / compare / workflow / observe; "Prefer primitives; compose workflows". — [docs/tool-design.md](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/tool-design.md)

### Inferences
- The "verification" in the viral claims (3,205 cases, 63 identical bytes) is real but **external to REA**. The agent used REA's evidence to write C, and a separate project-specific harness compiled it with Visual C++ 4.0 and ran differential tests. REA's built-in reconstruction tools only *account for* whether claims are backed by comparable evidence. A non-specialist should read "REA proved 63 identical bytes" as "a reconstruction project that used REA proved 63 identical bytes for one 63-byte function".
- The tool catalog is very large (~172 tools; ~120k tokens of schema if a client loads all tools eagerly). That is a practical cost for agents without deferred tool loading, and REA documents a `compact` schema profile as a mitigation.

### Gaps
- I could not run REA to get the authoritative `binary_session` catalog for 6.5.0. The exact tool count for the published npm 6.5.0 versus main is therefore unconfirmed (documented: 172 at main commit 04089d5be; 173 in the Kimi Code 6.5.0 PR verification).
- I did not determine whether REA has any persistent cross-session "knowledge database" beyond Evidence bundles, `~/.rea` cache/state, and the Kuna export cache. I found none in the docs. Ghidra databases are ephemeral and Hopper `.hop` databases are declined on macOS ([docs/installation.md ~L533-540](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/installation.md#L533)).

## Q4. Requirements and cost (Node, licensed engines, AI subscriptions)

### Takeaway
REA itself is free (MIT) and needs Node 22.19+/24.11+/26+ and npm. The real costs are elsewhere:
- **The analysis engine.** Ghidra is free (BYO 12.1.x + JDK 21). Hopper is commercial, though the free demo works and setup can install it. IDA via REA's main path requires **IDA Pro**, because upstream ida-pro-mcp doesn't support IDA Free; a separate experimental plugin path supports IDA Free with its cloud decompiler. JEB is commercial.
- **The AI agent subscription or API** (Claude Code, Codex, etc.). REA ships no model.
- **Context/token overhead** from the large tool catalog and verbose evidence.

REA explicitly warns that it grants no license for any commercial tool.

### Cited Findings
- "**You must legally obtain and be authorized to use commercial tools**, including IDA Pro / Hex-Rays decompilers, Hopper, and JEB, under their applicable licenses. REA grants no tool license, key, or activation entitlement. Trials and demos remain subject to vendor terms, including user, feature, automation, and output sharing restrictions." — [README.md L389-395](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L389)
- Hopper: "Hopper is separate commercial software with its own license. Its free demo has vendor-defined limits, and a paid license is optional." On macOS, setup downloads the official DMG, checks the digest and installs it to `~/Applications`. On Linux it verifies the official package's PGP signature (fingerprint `7C2D73BA…`). — [docs/installation.md L500-560](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/installation.md#L500)
- Ghidra: Ghidra 12.1.x is accepted; "Current 12.1 releases require JDK 21 or newer… The bridge is verified with Ghidra 12.1.4 and JDK 21." It needs the native decompiler for the host architecture. — [docs/installation.md L765-784](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/installation.md#L765). Ghidra license: Apache-2.0, "Bring your own Ghidra 12.1.4" ([THIRD_PARTY_NOTICES.md](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/THIRD_PARTY_NOTICES.md#L56)).
- IDA:
  - ida-pro-mcp: "Its README requires IDA Pro and explicitly states that IDA Free is unsupported." — [THIRD_PARTY_NOTICES.md L96](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/THIRD_PARTY_NOTICES.md#L96). Upstream confirms: IDA Pro 8.3+ (9 recommended), "IDA Free is not supported" — [github.com/mrexodia/ida-pro-mcp](https://github.com/mrexodia/ida-pro-mcp)
  - The optional ida-free-mcp path "IDA Pro and IDA Free can use…" is experimental, and IDA Free's cloud decompiler needs network — [docs/ida-provider.md L45-66](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/ida-provider.md#L45)
  - IDA EULA: "Availability of an API or a bridge does not grant hosting, service, or additional-user rights." — [THIRD_PARTY_NOTICES.md L95](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/THIRD_PARTY_NOTICES.md#L95)
- JEB: "The published EULA restricts public or third-party disclosure of decompiled code…" — [THIRD_PARTY_NOTICES.md ~L98](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/THIRD_PARTY_NOTICES.md#L98)
- No engine is needed for JS/.NET: "Deep native analysis uses one of them. Static JavaScript and .NET inspection work without a native analysis engine." — [README.md L266-268](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L266)
- Models used for the showcase reconstructions (Touhou/TH09 article evidence): "The project operator identifies `gpt-dots` as GPT-6-Astra"; `gpt-web` usage was "commonly GPT-5.6-Sol earlier and GPT-6-Sol recently"; there were also `gpt-6.1-sol` and `gpt-6-luna-max` commits. — [website/evidence/reverse-engineering-models.md L19-33](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/website/evidence/reverse-engineering-models.md#L19). So the showcase work was done with top-tier, high-effort OpenAI models.
- Context overhead: "with 172 tools, that payload measured about 496 KB… roughly 120k and 68k tokens" when a client loads all tool definitions. — [docs/client-configuration.md L108-110](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/client-configuration.md#L108)
- Third-party measurements (from search snippets only; the source pages were unreachable, so all are UNVERIFIED):
  - "the agent scored 74 of 75 checklist points with ordinary tools and 73 of 75 with rea, and rea used about 2.5 times the tokens" (attributed to gittested.com/reviews/morluto-rea).
  - "a 1,648-byte source file produced about 907 KB of JSON evidence" (also reported by [ringozzt/rea-research](https://github.com/ringozzt/rea-research)).

### Inferences
- Cheapest viable path: free Ghidra + JDK 21, plus an agent subscription the user already has. Anyone wanting IDA-quality decompilation through REA's main IDA route needs an IDA Pro license, since the IDA Free path is experimental and limited.
- The model bill is likely the dominant marginal cost. This is inferred from the tool-schema size and the verbose Evidence payloads. A 2.5× token overhead was reported by one tester, but I could not verify it.

### Gaps
- Current Hopper, IDA Pro and JEB prices are not stated in the repo, and I did not fetch the vendor pricing pages. This is not covered here.
- REA publishes no minimum model or subscription tier. It says only that it works with any MCP-capable agent.

## Q5. Prior art and comparison: what does REA add, and what is merely bundling?

### Takeaway
Connecting an LLM agent to a disassembler/decompiler over MCP was **not new** in Oct 2026:
- GhidraMCP (LaurieWired), ida-pro-mcp (mrexodia), ReVa (cyberkaida), GhidrAssistMCP, the Binary Ninja MCP and Sidekick, and radare2's r2ai/r2mcp all predate it.
- Hex-Rays shipped an **official** IDA MCP server in late Sept 2026.
- Academic work such as LLM4Decompile attacks the decompilation step itself with trained models.

REA's own IDA path literally wraps ida-pro-mcp. Its Android path wraps jadx-headless-mcp, and its JEB path wraps JEB's MCP. Its novelty lies elsewhere:
- (a) one provider-neutral vocabulary across Hopper, Ghidra, IDA and Kuna, with per-provider coverage declarations;
- (b) far broader non-native coverage (JS/Electron, .NET, browser/CDP, Android, firmware, captures, Frida) in a single server;
- (c) a strict "Evidence" contract with IDs, unknowns, comparisons and obligation ledgers;
- (d) a one-command, approval-gated setup across 24 agent clients, plus a bundled workflow skill;
- (e) heavy lifecycle and safety engineering.

The decompiler output quality is the underlying engine's, not REA's.

### Cited Findings
- GhidraMCP (LaurieWired): "an Model Context Protocol server for allowing LLMs to autonomously reverse engineer applications". It is a Ghidra plugin with an HTTP server plus a Python MCP bridge, and has a headless mode via PyGhidra. Snapshot: 11.3k stars. — [github.com/LaurieWired/GhidraMCP](https://github.com/LaurieWired/GhidraMCP)
- ida-pro-mcp (mrexodia): "Simple MCP Server to allow vibe reversing in IDA Pro."
  - Headless `idalib-mcp` supervisor; IDA Pro 8.3+; "IDA Free is not supported".
  - About 40 core tools plus about 20 debugger tools (my count from the README).
  - 12.9k stars.
  - Its README now says "I recommend using the Official Hex-Rays IDA MCP Server instead!"
  - Source: [github.com/mrexodia/ida-pro-mcp](https://github.com/mrexodia/ida-pro-mcp)
- Official Hex-Rays IDA MCP (HexRaysSA/ida-mcp): "Official Hex-Rays IDA MCP Server"; MIT; needs IDA 9.4+ with idalib and Python 3.11+; built on "IDA Nexus" so "multiple clients [can] seamlessly share and operate on IDA databases"; 1.2k stars. — [github.com/HexRaysSA/ida-mcp](https://github.com/HexRaysSA/ida-mcp)
  - Search snippets attribute to Hex-Rays: "It's free, open source, and works with any LLM. Your agent writes IDAPython, uses ~20% fewer tokens, and can share an IDB with you in real time" (X post, ~26 Sep 2026), and support for "IDA Pro, Home, Classroom and OEM". The blog [hex-rays.com/blog/hex-rays-ida-mcp-server](https://hex-rays.com/blog/hex-rays-ida-mcp-server) was unreachable from here, so these details are UNVERIFIED.
- ReVa (cyberkaida): "A Ghidra extension that provides a Model Context Protocol (MCP) server for AI-assisted reverse engineering."
  - Ghidra 12.0+, with assistant (GUI) and headless modes.
  - "tool driven approach" with many small tools, designed to limit "context rot".
  - Ships Claude Code plugins/skills for triage, deep analysis, crypto and CTF.
  - 874 stars.
  - Source: [github.com/cyberkaida/reverse-engineering-assistant](https://github.com/cyberkaida/reverse-engineering-assistant)
- GhidrAssistMCP (jtang613): a Ghidra extension MCP server with "100 explicit tools, 93 of which are enabled by default"; v3.0.0; 773 stars; paired with the GhidrAssist client. — [github.com/jtang613/GhidrAssistMCP](https://github.com/jtang613/GhidrAssistMCP)
- radare2: r2ai is "LLM-based reversing plugin for radare2" plus the `decai` decompiler plugin. It supports local and remote models (ollama, openai, anthropic…). The official MCP is a separate project, `r2mcp`. 490 stars. — [github.com/radareorg/r2ai](https://github.com/radareorg/r2ai)
- Binary Ninja:
  - Sidekick is Vector 35's commercial AI extension. A search snippet says its 26.0 release "adds MCP servers for live capabilities" (UNVERIFIED; [sidekick.binary.ninja](https://sidekick.binary.ninja/blog/sidekick-26-0-a-whole-new-experience-in-reversing-with-ai) was unreachable).
  - fosdickio/binary_ninja_mcp is an open-source plugin exposing Binary Ninja's API over MCP (search snippet; [archestra.ai listing](https://archestra.ai/mcp-catalog/fosdickio__binary_ninja_mcp)).
- LLM4Decompile (academic): "the pioneering open-source large language model dedicated to decompilation"; 1.3B–22B models.
  - Re-executability up to "64.9%" (9B-v2) on the HumanEval-Decompile-style benchmark.
  - Limited to "x86-64 Linux binaries from GCC at O0 through O3".
  - arXiv 2403.05286 (EMNLP 2024). Later work includes SK²Decompile (2025-10-04) and decompile-bench (2025-05-20).
  - Source: [github.com/albertan017/LLM4Decompile](https://github.com/albertan017/LLM4Decompile)
- REA's dependence on prior art, from its own docs:
  - IDA: "REA adapts an existing IDA MCP server… Existing IDA Pro profiles use mrexodia/ida-pro-mcp" ([docs/ida-provider.md L3](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/ida-provider.md#L3)).
  - Android: "JADX provides the Android decompiler, while jadx-headless-mcp provides the separate headless integration used by REA" ([THIRD_PARTY_NOTICES.md L43-45](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/THIRD_PARTY_NOTICES.md#L43)).
  - Other engines credited: Ghidra, Kuna, Binwalk, Unblob, Wakaru, WABT, pwntools, Unicorn, pwndbg, GDB, LLDB, mitmproxy, adb, ILSpy ([THIRD_PARTY_NOTICES.md L56-76](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/THIRD_PARTY_NOTICES.md#L56)).
- REA's differentiators, from its own design docs:
  - Provider-neutral naming with per-provider coverage ([docs/tool-design.md](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/tool-design.md)).
  - Evidence records and comparisons ([docs/mcp-contracts.md L11-25](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/mcp-contracts.md#L11)).
  - Obligation ledgers ([docs/reconstruction-obligation-ledgers.md](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/reconstruction-obligation-ledgers.md)).
  - Admission criteria: "New capabilities must return useful evidence through shared CLI/MCP workflows, preserve observations and unknowns, and declare actual authority and lifecycle constraints." ([docs/roadmap.md](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/roadmap.md))
- An independent Chinese research repo reaches a similar view. It calls REA an "agent 化编排层" (agent orchestration layer), not a decompiler. GhidraMCP and ida-pro-mcp were enabling agent-to-decompiler integration "as early as March 2025". REA's advantage is "breadth, packaging, and the evidence contract, not being first". "工具数本身不是壁垒" (tool count itself is not a moat). bethington/ghidra-mcp reportedly exposes 272 tools on Ghidra alone. — [github.com/ringozzt/rea-research](https://github.com/ringozzt/rea-research) (third-party, not peer-reviewed; the bethington figure is UNVERIFIED)
- One review is summarized in search results as calling REA "a workflow coordinator, not a decompiler, and its value depends on the provider you already have installed". This is attributed to hysenlabs.com/projects/morluto-rea, which was unreachable, so it is UNVERIFIED.

### Inferences
- **Genuinely new, or at least uncommon, in REA:**
  1. One MCP vocabulary over four native backends plus many non-native analyzers.
  2. Coverage beyond native binaries in the same server: Electron IPC/preload tracing, .NET CIL, CDP website inspection, HAR/SAZ, Android/ADB, firmware, Frida.
  3. The Evidence/unknowns/obligation-ledger discipline, which pushes agents to separate observation from inference.
  4. Installer/doctor tooling for 24 agent clients.
- **Repackaged:**
  - Decompilation itself (Ghidra/Hopper/IDA/Kuna/JADX/ILSpy).
  - IDA connectivity (ida-pro-mcp / ida-free-mcp).
  - Android decompilation (jadx-headless-mcp), firmware carving (Binwalk/Unblob) and JS unbundling (Wakaru).
  - The basic "LLM agent + decompiler over MCP" idea, already popularized by GhidraMCP and ida-pro-mcp in 2025.
- Unlike LLM4Decompile, REA trains no model and makes no claims about decompilation accuracy. Accuracy depends on the engine plus the general-purpose agent model.

### Gaps
- I found no rigorous, independent benchmark comparing REA against GhidraMCP, ida-pro-mcp, ReVa or the Hex-Rays server on the same tasks. The only measured comparison I found is the unverifiable gittested snippet (74/75 vs 73/75, about 2.5× tokens).
- I could not fetch first-hand creation dates for GhidraMCP or ida-pro-mcp. "March 2025" comes only from the third-party ringozzt report.

## Q6. Documented limitations (packers, obfuscation, anti-debug, server-side code, large binaries, accuracy)

### Takeaway
The official FAQ says little about limitations. Its only data/privacy statement is "REA analyzes targets on your machine. Your agent receives the results, and its model provider's data policy applies". It has **no** FAQ entry on packers, obfuscation or server-side code, so those criticisms in the Facebook post come from press and critics, not from the FAQ.

The technical docs do concede several limits:
- Packed binaries must be unpacked separately.
- Obfuscation limits metadata; improving obfuscated managed-code comparison is a roadmap item.
- Static equality does not equal runtime behavior.
- Decompiler output can be wrong or incomplete.
- Big binaries need longer startup deadlines (Ghidra defaults to 330 s, but the MCP SDK's default client wait is 60 s).
- Windows support is narrower.
- REA is "not a sandbox".

The showcases are notably candid about analyst assistance and scope.

### Cited Findings
- FAQ data policy: "REA analyzes targets on your machine. Your agent receives the results, and its model provider's data policy applies to those results." — [website/public/faq/index.html](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/website/public/faq/index.html) (https://rea.tools/faq/). README: "REA analyzes targets locally. Your agent receives the tool results, and its model provider has its own data policy." — [README.md L304-305](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L304)
- Legal scope: "REA is for lawful research, education, interoperability, software preservation, and analysis of software you own or are authorized to examine." — [README.md L367-368](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L367)
  - The project "does not support, and will not help with: circumventing DRM, license checks, anti-cheat systems or other technical protection measures; developing game cheats…; copying proprietary software or reproducing its protected code and assets; evading the usage policies or safety measures of AI model providers…" — [DISCLAIMER.md L10-20](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/DISCLAIMER.md#L10)
- Packers: "For a packed executable, importing the original can analyze its unpacking stub. Analyze a separately prepared unpacked copy to inspect the original…" — [docs/ghidra-dos.md L150-151](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/ghidra-dos.md#L150). Ghidra string search only covers Ghidra-defined strings ("Packed…" caveat) — [docs/ghidra-provider.md L40](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/ghidra-provider.md#L40)
- Obfuscation: Go binaries — "removal and obfuscation can limit metadata" ([docs/go-binaries.md L77](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/go-binaries.md#L77)). Roadmap priority: "Improve obfuscated managed-code comparisons and verified native links." ([docs/roadmap.md L15](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/roadmap.md#L15))
- Anti-debug / anti-analysis: no dedicated documentation found (see Gaps). The DISCLAIMER refuses help with circumventing "technical protection measures" ([DISCLAIMER.md L12](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/DISCLAIMER.md#L12)).
- Server-side code: web analysis is "passive" CDP observation of a user-owned browser ([docs/browser-observation.md L9](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/browser-observation.md#L9)). JS analysis of a "procedure path is the server-side procedure name, not a resolved URL" ([docs/javascript-artifact-reconstruction.md L293](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/javascript-artifact-reconstruction.md#L293)). The managed-code doc likewise excludes "server-side behavior" from what static inspection establishes ([docs/managed-code-analysis.md L384](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/managed-code-analysis.md#L384)).
- Large binaries and timeouts:
  - "For large binaries, raise the provider's startup deadline with `REA_GHIDRA_STARTUP_TIMEOUT_MS` or `REA_HOPPER_STARTUP_TIMEOUT_MS`." — [README.md L212-213](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L212)
  - Defaults: Hopper startup 120,000 ms, Ghidra startup 330,000 ms. "The pinned client SDK 2.3.1 defaults to 60,000 ms and can cancel earlier than REA's startup deadline." Setup therefore writes 450 s tool deadlines for Codex/Kimi. — [docs/mcp-contracts.md L502-524](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/mcp-contracts.md#L502)
  - Note: third-party reports that "Ghidra cold starts can take up to 330 seconds" misread this. 330 s is REA's default *deadline*, not a measured time.
  - IDA headless: "REA does not impose an engine memory limit" ([docs/ida-provider.md](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/ida-provider.md)).
- Accuracy caveats in the docs:
  - IDA: "Rendered pseudocode has upstream traversal limits and does not prove complete source recovery." ([docs/ida-provider.md L66](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/ida-provider.md#L66))
  - Static comparison: "Static artifact equality does not establish unchanged runtime behavior." ([docs/mcp-contracts.md L37](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/mcp-contracts.md#L37))
  - Kuna: `--jobs` >1 can "change about 40–60% of function bodies on the measured binaries" ([docs/kuna-provider.md](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/kuna-provider.md))
  - Ghidra contracts "describe Ghidra observations, not equivalence with another engine's pseudocode" ([docs/ghidra-provider.md L23-24](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/ghidra-provider.md#L23))
- The showcases' own disclaimers:
  - DX-Ball: "The original decompiler result reports `FUN_00406400(void)` and a conversion call, omitting the stack input and x87 expression." The agent had to read raw instructions. ([dx-ball evidence L36-38](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/website/evidence/dx-ball-sound-pan.md#L36))
  - "These claims apply to this function at the linked checkpoint… Game-level integration remains a separate project task." ([L105-107](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/website/evidence/dx-ball-sound-pan.md#L105))
  - Windows Calculator: "The binary is stripped. A local instruction scan located candidates using operator IDs and the constant 100; REA then produced the complete function dossier. Function selection was analyst-assisted. The illustrative agent prompt is not a recording of an autonomous end-to-end discovery." ([calculator-and-dino.md L48-51](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/website/evidence/calculator-and-dino.md#L48))
  - Calculator percentage example: "The homepage's named C-like rule is an explanatory summary. Its `200 + 10%` and `200 × 10%` controls compute those cases from that rule… The Microsoft tests were inspected, not executed… no completed Windows GUI input result is claimed." Microsoft's open-source calculator code (MIT) was used as a cross-check. ([L53-76](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/website/evidence/calculator-and-dino.md#L53))
- Security: "This is not a sandbox… Opening an untrusted binary delegates parsing and analysis to the selected local provider with that user's permissions." ([SECURITY.md L33-36](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/SECURITY.md#L33)) Runtime workflows (Frida, process capture, browser) execute or interact with targets "using your user permissions" ([README.md L195-197](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/README.md#L195)).
- Platform limits: Windows Ghidra is "experimental" and read-only. There is no Hopper or Kuna on Windows. Linux Hopper allows one application per user. ([docs/windows-ghidra-p0.md](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/windows-ghidra-p0.md); [docs/kuna-provider.md L25](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/kuna-provider.md#L25); [docs/installation.md ~L590-600](https://github.com/morluto/rea/blob/b2257653ca74e1013553d5bd916a0ef85a3c7678/docs/installation.md#L590))
- Third-party summary of self-described limits: REA "does not recover original source code or clone whole applications"; obfuscation, packing, anti-analysis and uncommon architectures make reconstruction harder; "anything" is aspirational. — [github.com/ringozzt/rea-research](https://github.com/ringozzt/rea-research)

### Inferences
- The Facebook post is accurate in two places:
  - "官方 FAQ 也寫了，分析在你電腦上跑，結果卻會交給 AI 代理，模型商有自己的資料政策" (the official FAQ itself says analysis runs on your computer, but the results go to the AI agent, and the model provider has its own data policy) — this matches the FAQ.
  - "官方只說拿來分析你擁有或被授權的軟體" (the project only says to use it on software you own or are authorized to analyze) — this matches the README/DISCLAIMER.
- The packer and server-side criticisms are consistent with the docs: unpack separately; web analysis is client-side only. But they are critics' claims, not FAQ text.
- The showcases' fine print (analyst-assisted selection, a 63-byte single function, an external compiler harness, a decompiler that was initially wrong) is the best evidence that REA speeds up an expert-style workflow. It does not show that REA autonomously "breaks" arbitrary software.

### Gaps
- I found no official statement on anti-debugging or anti-tamper, or on how Frida/GDB workflows handle protected targets.
- I found no official accuracy metric for REA as a whole. The repo intentionally reports per-claim evidence rather than aggregate accuracy.
- I could not verify the reported third-party hands-on tests: Korben (Ghidra patching task), the Korean wikidocs test (REA v6.4.0, Windows 11, Codex CLI 0.162.1), gittested and benchclaw. Their pages were unreachable from this environment.
