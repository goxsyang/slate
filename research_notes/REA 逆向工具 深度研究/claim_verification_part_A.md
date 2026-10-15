# REA claim verification, Part A (C1 to C5)

Researcher: independent fact-check sub-agent (Part A). Working date: 2026-10-15.
I did not read any other file in this folder.

## Method and access limits

- Local clone: `/home/user/morluto/rea`, HEAD `b2257653ca74e1013553d5bd916a0ef85a3c7678`
  (committed 2026-10-15 20:45:35 +0800, "test(ghidra): isolate source admission failure sessions").
  This is a shallow clone with 1 commit, so git history of individual lines is not available.
  I only read files; nothing was executed.
- GitHub REST API: **blocked in this session.** At 2026-10-15 13:24:27 UTC,
  `curl -s https://api.github.com/repos/morluto/rea` returned
  `"GitHub access to this repository is not enabled for this session..."`. `gh api` returned the same 403,
  and the search API was refused. So `stargazers_count` from the API could **not** be obtained.
- Fallback for stars: WebFetch of the public GitHub HTML pages (fetched at about 13:25 UTC on
  2026-10-15). WebFetch summarizes pages with a small model, so I fetched two different pages
  and cross-checked them against the repo's own README.
- npm registry (`https://registry.npmjs.org/rea-agents`) reachable via curl. `api.npmjs.org`
  (download counts) blocked, so downloads were not checked.
- rea.tools, morluto.github.io and most news sites (next.ink, ifeng, dev.to, agentconn, gigazine,
  ccleaks) were **not reachable** (proxy 403 or DNS failure in WebFetch). For those I used
  WebSearch snippets only, and I mark them as secondary. The official website's content was
  verified from its **source in the repo** (`website/public/index.html` and `website/evidence/`).

---

## C1. REA is an open-source project under the MIT license

**Verdict: TRUE. Confidence: high.**

Evidence:
- `/home/user/morluto/rea/LICENSE:1-3`: "MIT License" / "Copyright (c) 2026 morluto", followed by the standard MIT text (lines 5-21).
- `/home/user/morluto/rea/package.json:6`: `"license": "MIT",`. The package is `"name": "rea-agents"` (line 2), version 6.5.0 (line 4).
- npm registry (queried 2026-10-15 ~13:27 UTC, https://registry.npmjs.org/rea-agents): top-level `license` = `MIT`; `versions["6.5.0"].license` = `MIT`; `dist-tags.latest` = `6.5.0`; first publish (`time.created`) 2026-07-12T12:46:31Z; 32 versions.
- `/home/user/morluto/rea/README.md:380-387`: "## License / [MIT](LICENSE) / REA-authored code is licensed under MIT. Third-party material retains its own licenses and copyright notices; see [Third-party notices](THIRD_PARTY_NOTICES.md)..."
- The GitHub repo page (WebFetch, https://github.com/morluto/rea) sidebar shows "MIT license".

Nuance (context the post leaves out):
- MIT covers only **REA-authored code**. `THIRD_PARTY_NOTICES.md:3-6`: "REA-authored code is licensed under [MIT](LICENSE). Third-party material retains its own copyright, license, attribution, and NOTICE requirements. REA's MIT license grants no rights to proprietary analysis tools."
- Some bundled or optional parts carry other licenses. The Windows native addon statically links the GCC runtime (GPLv3 with the GCC Runtime Library Exception; `THIRD_PARTY_NOTICES.md`, "Windows native addon" row). Optional `frida@17.23.2` is "LGPL-2.0 WITH WxWindows-exception-3.1". Several dependencies are Apache-2.0. The license texts are in `/home/user/morluto/rea/licenses/`.
- Commercial engines are not covered. `README.md:389-391`: "**You must legally obtain and be authorized to use commercial tools**, including IDA Pro / Hex-Rays decompilers, Hopper, and JEB, under their applicable licenses. REA grants no tool license, key, or activation entitlement."
- Safety side note: an unofficial look-alike repo exists. A WebSearch result lists `github.com/rea-githu/REA` ("REA Reverse Engineer Anything 6.3.0 is the local MCP zip ... Official free download. Local zip"). The official README warns at `README.md:29-33`: "Get REA from morluto/rea, rea.tools, or the rea-agents npm package ... A similar repository name or copied README does not establish that a download is official."

Sources: LICENSE; package.json; README.md; THIRD_PARTY_NOTICES.md; https://registry.npmjs.org/rea-agents; https://github.com/morluto/rea

---

## C2. REA has more than 220,000 (22 萬) stars on GitHub

**Verdict: TRUE. The number was right when the post went up and is an undercount now. Confidence: high that the count is above 220k. The exact figure is medium, because the API was blocked.**

Evidence:
- The GitHub REST API was **not available** (see Method), so no `stargazers_count` value.
- WebFetch of https://github.com/morluto/rea at about 2026-10-15 13:25 UTC: "**260.0k** stars" (button "Star260k (260k)"), "**65.4k** forks", "**871** watching", "3,299 Commits", sidebar "MIT license", website "rea.tools".
- WebFetch of https://github.com/morluto (owner profile), same time: pinned "rea: 260k stars, 65.4k forks". Owner "6.2k followers". Bio "member of technically staff".
- The repo's own README at HEAD (2026-10-15 20:45 +0800), `/home/user/morluto/rea/README.md:346-348`: "## Star history / 🎉 **250,000 GitHub stars — thank you!**". The zh-TW README, `docs/readme/README_zh-TW.md:281`: "🎉 **GitHub Star 達到 250,000 個，感謝大家！**"
- Milestone commits show the growth during the release cycle. `CHANGELOG.md` has "20,000 GitHub stars" (line 770), "30,000" (546-547) and "40,000" (308-309). `docs/releases/6.4.0.contributions.json` has 50,000 and 60,000. `docs/releases/6.5.0.contributions.json` has 80,000, 90,000 and 110,000 (6.5.0 is dated 2026-10-13 at `CHANGELOG.md:3`).
- Secondary snapshots from WebSearch results (pages not fetchable, so the numbers come from search snippets):
  - An Oct 7 trending report listed 9,658 stars and 1,070 forks.
  - dev.to and apidog: "The MCP Server That Hit 115K GitHub Stars in a Week" (by Oct 12).
  - INSIDE (inside.com.tw/article/42615): "狂掃 GitHub 12 萬星".
  - OSCHINA (oschina.net/news/502941): "5 万 star".
  - Zhihu: "GitHub 31.2K Star".
  - skillsllm.com/skill/rea: "220.7k★".
  - agentconn.com: "REA Hit 248K Stars".
  - A search-engine snapshot of the GitHub page showed "239.1k stars and 59.5k forks".

Timing: the post went up about 13 h before 2026-10-15 20:52 Taiwan time, so around 2026-10-15 07:50 +0800 (2026-10-14 23:50 UTC). Snapshots from the same period range from 220.7k to 248k. "超過 22 萬星" (more than 220,000 stars) matches the skillsllm "220.7k" snapshot closely, which suggests the post took its number from a snapshot of that kind. As of 2026-10-15 13:25 UTC the repo page shows 260k.

Nuance and caveats:
- The very different figures in the press (9.6k / 31.2k / 50k / 115k / 120k / 185k / 220k / 248k / 260k) are **snapshots taken at different times** during extremely fast growth, from fewer than 10k on about Oct 7 to 260k on Oct 15. They are not necessarily errors.
- Stars are not users. Weekly npm download counts could not be checked (api.npmjs.org blocked).
- Unusual pattern, not proof of anything: 260k stars with only 871 watchers (about 0.3%), and an owner with 6.2k followers. Roughly 250k stars in about 8 days would be one of the fastest climbs GitHub has seen. I did not examine stargazer accounts, so I make **no claim** about whether the stars are organic. Readers should treat the star count as a popularity signal, not a quality signal.

Sources: https://github.com/morluto/rea (WebFetch); https://github.com/morluto (WebFetch); README.md:346-348; docs/readme/README_zh-TW.md:281; CHANGELOG.md; docs/releases/*.contributions.json; WebSearch snippets for dev.to, apidog.com, inside.com.tw, oschina.net, zhihu, skillsllm.com and agentconn.com (all UNVERIFIED first-hand).

---

## C3. REA connects Hopper, Ghidra and IDA to AI agents such as Claude Code, Codex and Cursor, letting them analyse programs without source code

**Verdict: TRUE. Confidence: high.**

Evidence:
- `/home/user/morluto/rea/README.md:61`: "Ask your agent to investigate it with REA. It can inspect the app without its source code, explain how the feature works, show the evidence, and build a version for your project."
- `README.md:65`: "Native analysis can use an existing Hopper, Ghidra, or IDA installation; setup can optionally install Hopper with approval. Static JavaScript analysis needs no native analysis engine."
- `README.md:88-89`: "Setup supports Claude Code, Codex, Cursor, Gemini CLI, Grok Build and [other agents]".
- `README.md:153-155`: "Your agent calls REA through MCP to inspect the target and trace relevant code. REA returns findings with their evidence."
- `README.md:171`: Native binaries returns "Pseudocode, assembly, strings, symbols, calls and references", requiring "Hopper, Ghidra or IDA".
- `docs/installation.md:454-484`: the supported-clients table lists 24 clients, including Claude Code, Claude Desktop, Codex, Cursor, Gemini CLI, Windsurf, Devin, OpenCode, GitHub Copilot CLI, VS Code, Grok Build and others.
- `server.json:2-27`: an MCP registry entry `io.github.morluto/rea`, npm `rea-agents`, stdio transport.
- The zh-TW README, `docs/readme/README_zh-TW.md:63`, is very likely what the post paraphrased: "原生分析可以使用已有的 Hopper、Ghidra 或 IDA；設定流程也可以在你核准後安裝 Hopper。"

Nuance:
- REA is a **bridge/MCP layer**, not a new decompiler. Users must supply the engine.
  - Hopper is commercial with demo limits (`docs/installation.md:502-503`: "Hopper is separate commercial software with its own license. Its free demo has vendor-defined limits").
  - Ghidra must be pre-installed (12.1.x plus JDK 21). `docs/installation.md:765-767`: "REA connects to an existing Ghidra installation on Linux x64/arm64, macOS x64/arm64, or experimental Windows x64 P0."
  - IDA works through a third-party MCP server or an optional bridge. `docs/ida-provider.md:3`: "REA adapts an existing IDA MCP server into its native analysis tools. Existing IDA Pro profiles use mrexodia/ida-pro-mcp ... REA does not install, upgrade, activate, or license them."
- On Windows, native support is limited. The automated Hopper installer is macOS/Linux only (`docs/installation.md:506-507`), and Windows Ghidra is "experimental Windows x64 support for the read-only P0 boundary" (`docs/windows-ghidra-p0.md:9`).
- "Without source code" means the agent gets **pseudocode and assembly**, not the original source (README FAQ, `README.md:295-297`: "Native analysis returns pseudocode and assembly.").
- The post's list is incomplete. REA also adapts Kuna, GNU objdump, Rizin, JEB and JADX (`README.md:199-210`, `README.md:183-185`), and works with more than 20 agents.
- The Chinese commentator Gorden Sun (X, per WebSearch snippet, UNVERIFIED first-hand) remarked: "逆向引擎还是用的现有的，提示词写好的话，Codex本来就能做" (the reversing engines are existing ones; with a good prompt, Codex could already do this).

Sources: README.md; docs/installation.md; docs/ida-provider.md; docs/windows-ghidra-p0.md; server.json; docs/readme/README_zh-TW.md.

---

## C4. REA can analyse native executables, JavaScript/Electron apps, .NET programs, and websites

**Verdict: TRUE. Confidence: high.** This is nearly a word-for-word rendering of the official README.

Evidence:
- `/home/user/morluto/rea/README.md:63`: "REA connects your agent to tools for inspecting native binaries, JavaScript and Electron apps, .NET assemblies, and websites. You can also use the same tools from your terminal. Analysis runs locally, and results include the evidence and limitations behind each conclusion."
- zh-TW, `docs/readme/README_zh-TW.md:61`: "REA 將 AI 代理連接到分析工具，用於檢查原生二進位檔案、JavaScript 和 Electron 應用、.NET 程式集以及網站。"
- Capability table, `README.md:169-193`:
  - Native binaries (line 171): "Pseudocode, assembly, strings, symbols, calls and references"
  - JavaScript / Electron (line 179): "Modules, imports, source maps, routes, IPC and native add-on relationships"
  - Websites (line 180): "Page structure, scripts, network observations and requested screenshots | A Chrome-family browser"
  - .NET assemblies (line 182): "Metadata, CIL instructions, declared native dependencies and build comparisons | None (static only)"

Nuance:
- **Websites**: REA analyses only the **client side**. `docs/browser-observation.md:9` says "REA can attach to a user-owned Chrome-family browser through the Chrome DevTools Protocol (CDP) and produce bounded Evidence about an existing page. This is a passive reverse-engineering capability, not a general browser automation or remote-control surface." Server-side code is not visible, which matches the post's own caveat that logic on servers can't be reached.
- **.NET**: static metadata and CIL inspection. Built-in C# decompilation is not a core feature. `docs/managed-code-analysis.md:3-5`: "REA inspects .NET PE/CLI artifacts without loading or executing their code. It can identify an assembly, inspect metadata and CIL, compare members across builds..." ILSpy is optional and caller-supplied (lines 474-484). NativeAOT .NET is handled as a native target (lines 330-332).
- The post's list is incomplete. The table also covers Go and Rust binaries, WASM, EVM bytecode, SQLite, Android APKs and devices, Flutter, firmware, pcap and packet captures, logic-analyzer signals and process behavior (`README.md:172-193`). Several of these need caller-supplied tools or are Linux-only.
- Packed or obfuscated binaries are not specifically addressed in the README. That limitation belongs to Part B's claim set and was not checked here.

Sources: README.md:63,169-193; docs/readme/README_zh-TW.md:61; docs/browser-observation.md; docs/managed-code-analysis.md.

---

## C5. The official demo took apart Windows Calculator and found out why 200 + 10% = 220

**Verdict: MOSTLY_TRUE. Confidence: high.** The demo exists on the official website and the explanation is correct. The post leaves out that the demo is an illustrative, analyst-assisted beginner example, cross-checked against Microsoft's already-public source code.

Evidence that the official demo exists (from the website source in the repo; the live rea.tools was unreachable):
- `/home/user/morluto/rea/website/public/index.html:348-351`: "See the full Calculator investigation" / "Why does Calculator give 220 for 200 + 10%?"
- `index.html:529-530` (example prompt): "Use REA to inspect Windows Calculator. Why does 200 + 10% give 220?" The example answer at `index.html:535-544`: "After +, the % button takes a percentage of the first number." / "10% of 200 = 20" / "200 + 20 = 220".
- `index.html:805-806`: "Example 02 · Windows Calculator" / "Rebuild Calculator's % button."
- `index.html:850` and `index.html:856`: "With + ... Take 10% of the first number. 10% of 200 = 20 → 200 + 20 = 220". "With × ... Turn 10% into 0.1. 200 × 0.1 = 20".
- `index.html:1002-1004`: "Inspected with REA 4.1.0: Windows Calculator 11.2508.4.0, x64. The readable summary uses names from Microsoft's public source to explain the recovered branch."
- `CHANGELOG.md:378` (under 6.2.0, 2026-10-09): "**website:** explain REA with Calculator and a playable dinosaur lab".
- Secondary: a WebSearch snippet citing gigazine.net (2026-10-14) and ccleaks.com describes the same Calculator example (UNVERIFIED first-hand).

Evidence for the missing context, from `/home/user/morluto/rea/website/evidence/calculator-and-dino.md`:
- Line 3: "Evidence collected on 9 October 2026 with the published REA 4.1.0 package."
- Lines 16 and 27-29: Calculator package `11.2508.4.0` x64. The work is in `CalcViewModel.dll`, function `0x1801245d0` (10,656 bytes).
- Lines 33-36: "Its `case 0x76` checks the operator field against `0x5c` and `0x5b` and constructs the constant 100 in both paths. One path divides the current value by 100; the other combines the current value with the previous value divided by 100."
- Lines 41-44: "The analyst thought bubbles illustrate the work of decoding those facts; they are not a recorded analyst transcript or a measured comparison of investigation times."
- Lines 48-51: "**The binary is stripped. A local instruction scan located candidates using operator IDs and the constant 100; REA then produced the complete function dossier. Function selection was analyst-assisted. The illustrative agent prompt is not a recording of an autonomous end-to-end discovery.**"
- Lines 45-46 and 55-65: "Helper meanings and operator names are interpretations checked against the public source below." Microsoft's **MIT-licensed public Calculator source** (commit d125246a) supplies `IDC_DIV = 91`, `IDC_MUL = 92`, `IDC_PERCENT = 118`, and the percent branch `rat * (m_lastVal / 100)`. Microsoft's own unit test already documents "`50 + 20 % = 60`". The source commit "is not an identified build commit for that installed package. No PDB symbols were loaded."
- Lines 67-73: "The homepage's named C-like rule is an explanatory summary. Its `200 + 10%` and `200 × 10%` controls compute those cases from that rule using the fixed inputs 200 and 10 ... The Microsoft tests were inspected, not executed. ... **no completed Windows GUI input result is claimed.**"
- `website/figures.md:57-60`: "Calculator's assembly comes from a real installed model DLL; the named calculation is a readable summary crosschecked against Microsoft's public source."

Assessment:
- The core facts are accurate. The official site does present REA inspecting the installed Windows Calculator DLL and explaining why 200 + 10% gives 220: after "+", % means "percent of the first operand", so 10% of 200 is 20 and 200 + 20 = 220.
- The post leaves out three things:
  - The demo is an **illustrative beginner example** (homepage "Example 02"). It is not one of the three formal README showcases (DX-Ball, Notion, TH04, `README.md:218-245`).
  - By the project's own admission, function selection was **analyst-assisted**, and the prompt and answer are illustrative, not a recorded autonomous run.
  - The behavior and its reason were **already public**. Windows Calculator has been open source (MIT) on GitHub, and Microsoft's own test (`50 + 20 % = 60`) documents it. REA's finding was cross-checked against that source.
- Some Chinese coverage hypes this example. The blog.eimoon.com title is "微软十年没修的 Bug,AI 半小时就搞定了?" (a bug Microsoft left unfixed for ten years, solved by AI in half an hour?). The behavior is a documented design rule, not a bug. The Facebook post itself does not call it a bug.

Sources: website/public/index.html (lines cited); website/evidence/calculator-and-dino.md; website/figures.md; CHANGELOG.md:378; Microsoft source links quoted in the evidence file (github.com/microsoft/calculator, commit d125246a4e19842ce1332e6c7839cf0e110027d8, not fetched by me).

---

## Summary table

| ID | Claim | Verdict | Confidence |
|----|-------|---------|------------|
| C1 | MIT open source | TRUE | high |
| C2 | More than 220k GitHub stars | TRUE (260k at 2026-10-15 ~13:25 UTC via GitHub page; API blocked) | high (above 220k) / medium (exact) |
| C3 | Bridges Hopper/Ghidra/IDA to Claude Code/Codex/Cursor, analysis without source | TRUE | high |
| C4 | Native, JS/Electron, .NET, websites | TRUE (websites = client side only; .NET = static metadata/CIL) | high |
| C5 | Official Calculator 200 + 10% = 220 demo | MOSTLY_TRUE (illustrative, analyst-assisted, cross-checked against Microsoft's public source) | high |
