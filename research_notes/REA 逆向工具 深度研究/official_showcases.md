# REA official showcases: Windows Calculator "200 + 10% = 220" and DX-Ball sound pan (3,205 cases / 63 bytes)

Scope note: primary evidence is the REA repo's own website sources and evidence ledgers (local shallow clone `/home/user/morluto/rea`, HEAD `b2257653ca74e1013553d5bd916a0ef85a3c7678`, committed 2026-10-15 20:45 +0800), the public DX-Ball reconstruction repo (`github.com/N0zoM1z0/dx-ball`, files fetched via raw.githubusercontent.com at the pinned commit `a55dca27ec0a07018c1b2c95ae2be027f7d8c3c4` and at HEAD on 2026-10-15), and Microsoft's MIT-licensed Calculator source (pinned commit `d125246a4e19842ce1332e6c7839cf0e110027d8`). The live sites rea.tools, blog.eimoon.com, devblogs.microsoft.com, huxiu.com, simonwillison.net and blog.chrislewis.au could not be fetched from this environment (proxy/DNS refused); where those are used, the content comes from search-result snippets and is marked as such. No repo code was executed.

Official website origin: `https://rea.tools/` is the "preferred public origin"; the same HTML is also served on GitHub Pages at `https://morluto.github.io/rea/` — [website/README.md L210-212](https://github.com/morluto/rea/blob/main/website/README.md) (local: `/home/user/morluto/rea/website/README.md:210`).

---

## Q1. Windows Calculator: where is the official write-up, what did REA actually do, and how impressive is "200 + 10% = 220"?

### Takeaway
The Calculator example is a **homepage teaching example**, not one of the five listed "case studies". Its own evidence file says REA 4.1.0 produced a function dossier for a 10,656-byte function in the installed `CalcViewModel.dll`, but **the function was found by an analyst-assisted local instruction scan, the agent prompt/answer are illustrative (not a recorded autonomous run), the operator meanings were taken from Microsoft's public source, and no Windows GUI check was completed**. The behaviour itself is not a bug: it is long-standing, intended pocket-calculator semantics, written in plain C++ in Microsoft's open-source Calculator (`scifunc.cpp`, `case IDC_PERCENT`) with a comment that states the rule, and covered by Microsoft's own unit tests.

### Cited Findings

**Where the official material lives**
- Homepage section heading: "Why does Calculator give 220 for 200 + 10%?" and the later section "Example 02 · Windows Calculator — Rebuild Calculator's % button." — `/home/user/morluto/rea/website/public/index.html` L350 and following (published at [rea.tools](https://rea.tools/) / [morluto.github.io/rea](https://morluto.github.io/rea/)).
- The evidence ledger for it: `/home/user/morluto/rea/website/evidence/calculator-and-dino.md` ("Evidence collected on 9 October 2026 with the published REA 4.1.0 package." L3). [GitHub](https://github.com/morluto/rea/blob/main/website/evidence/calculator-and-dino.md)
- CHANGELOG entries: "website: explain REA with Calculator and a playable dinosaur lab" and "website: continue the Calculator example with reconstruction", both under release 6.2.0 (2026-10-09) — `/home/user/morluto/rea/CHANGELOG.md` L378, L554 (commits 11b9f03, 4578647, 18a1e8c).
- Calculator is **not** in the README "Showcases" section (which lists only DX-Ball, Notion, TH04) — `/home/user/morluto/rea/README.md` L216-247 — nor in the showcase index (Aegis, CTF, DX-Ball, Notion, TH04) — `/home/user/morluto/rea/website/public/showcase/index.html`.

**What REA actually inspected and returned (verbatim from the evidence file)**
- Target: "The installed Windows Calculator package is version `11.2508.4.0`, x64." Artifacts hashed: `calc.exe` launcher and package `CalcViewModel.dll` — `calculator-and-dino.md` L16-21.
- Launcher: "REA's function dossier for launcher `0x1400019f4` includes the call to `ShellExecuteW` with `ms-calculator:`." — L23-25. (i.e. `calc.exe` is only a stub that launches the UWP app.)
- "The calculation is in the installed app's model DLL. REA inspected function `0x1801245d0`, whose body occupies two ranges, totaling 10,656 bytes" — L27-29.
- "Its `case 0x76` checks the operator field against `0x5c` and `0x5b` and constructs the constant 100 in both paths. One path divides the current value by 100; the other combines the current value with the previous value divided by 100." — L33-36.
- **Key caveat, verbatim:** "The binary is stripped. A local instruction scan located candidates using operator IDs and the constant 100; REA then produced the complete function dossier. Function selection was analyst-assisted. The illustrative agent prompt is not a recording of an autonomous end-to-end discovery." — L48-51.
- **Key caveat, verbatim:** "The analyst thought bubbles illustrate the work of decoding those facts; they are not a recorded analyst transcript or a measured comparison of investigation times." — L42-44. The homepage labels these "Illustrative expert reasoning" (`index.html` L427, L498) and says "Selected assembly from the installed Calculator DLL. The thoughts and reply illustrate the findings." (L565-566).
- **Key caveat, verbatim:** "Helper meanings and operator names are interpretations checked against the public source below." — L45-46. "Microsoft's MIT-licensed source at commit `d125246a…` supplies the operator meanings and an independently readable implementation" — L55-57. "The public source commit is a crosscheck; it is not an identified build commit for that installed package. No PDB symbols were loaded." — L64-65.
- **Key caveat, verbatim:** "The Microsoft tests were inspected, not executed. A probe-owned Calculator window could be inspected, but it was no longer present at the input-check step; no completed Windows GUI input result is claimed." — L71-73.
- The homepage's "readable summary of the % handler" is: `if (operation == multiply || operation == divide) { percent = current / 100; } else { percent = current * previous / 100; }` (`index.html` ~L935-945), with the footer "Inspected with REA 4.1.0: Windows Calculator 11.2508.4.0, x64. The readable summary uses names from Microsoft's public source to explain the recovered branch." (L1002).
- Homepage's user-facing explanation: "With + — Take 10% of the first number. 10% of 200 = 20 → 200 + 20 = 220"; "With × — Turn 10% into 0.1. 200 × 0.1 = 20" (`index.html` ~L845-855).

**The behaviour is visible directly in Microsoft's open-source code**
- `src/CalcManager/CEngine/scifunc.cpp` at the pinned commit, `case IDC_PERCENT`:
  ```cpp
  // If the operator is multiply/divide, we evaluate this as "X [op] (Y%)"
  // Otherwise, we evaluate it as "X [op] (X * Y%)"
  if (m_nOpCode == IDC_MUL || m_nOpCode == IDC_DIV) { result = rat / 100; }
  else { result = rat * (m_lastVal / 100); }
  ```
  — [scifunc.cpp L98-111](https://github.com/microsoft/calculator/blob/d125246a4e19842ce1332e6c7839cf0e110027d8/src/CalcManager/CEngine/scifunc.cpp#L98-L111) (fetched and read).
- Operator IDs `#define IDC_DIV 91`, `#define IDC_MUL 92`, `#define IDC_PERCENT 118` (0x5b, 0x5c, 0x76 — exactly the constants REA's dossier showed) — [CCommand.h L71-72, L103](https://github.com/microsoft/calculator/blob/d125246a4e19842ce1332e6c7839cf0e110027d8/src/CalcManager/Header%20Files/CCommand.h).
- Microsoft's own unit tests encode the behaviour: `6 × 6 % =` expects `0.36`; `5 0 + 2 0 % =` expects `60` (i.e. 50 + 20% = 60) — [CalculatorManagerTest.cpp L350-370](https://github.com/microsoft/calculator/blob/d125246a4e19842ce1332e6c7839cf0e110027d8/src/CalculatorUnitTests/CalculatorManagerTest.cpp#L350-L370) (fetched and read).
- The `scifunc.cpp` file header reads "SCICALC Scientific Calculator for Windows 3.00.12 / (c)1989 Microsoft Corporation" — same file, L4-6, i.e. the engine lineage dates to Windows 3.0-era code.
- Microsoft open-sourced Windows Calculator on GitHub on 6 March 2019 under the MIT License (source, build system, unit tests) — [BleepingComputer](https://www.bleepingcomputer.com/news/microsoft/microsoft-open-sources-the-windows-10-calculator-on-github), [Windows Central](https://www.windowscentral.com/microsoft-open-sources-windows-calculator) (via search results).

**Intended, long-documented behaviour (not a bug)**
- Raymond Chen (Microsoft, *The Old New Thing*, 10 January 2008) explained that the Windows calculator percent key works like cheap pocket calculators: for addition, A + B% = A + (A × B/100); example 72 + 5% = 75.6 — [devblogs.microsoft.com/oldnewthing/20080110-00/?p=23853](https://devblogs.microsoft.com/oldnewthing/20080110-00/?p=23853) (content from search-result summaries; the page itself was blocked here, so exact title wording UNVERIFIED).
- GNOME Calculator changed its behaviour to match this convention: Launchpad bug "Make addition and subtraction of percentages take percentage of value on left-hand side" — [bugs.launchpad.net/bugs/328094](https://bugs.launchpad.net/bugs/328094) (search result).
- Huawei's support page documents the same A ± B% = A ± A×B% convention for its calculator — [consumer.huawei.com](https://consumer.huawei.com/qa/support/content/en-gb00408022) (search result).
- No GitHub issue in `microsoft/calculator` was found reporting 200 + 10% = 220 as a bug; the closest found is #2139 "Using '%' in Standard Calculator Clears Input" (March 2024, a different symptom) — [issue #2139](https://github.com/microsoft/calculator/issues/2139) (search result; GitHub search API was blocked in this environment, so the search was not exhaustive).

**The eimoon blog framing**
- Title (confirmed via search result): "微软十年没修的 Bug,AI 半小时就搞定了?REA 到底有多神" — [blog.eimoon.com/p/rea-reverse-engineer-anything/](https://blog.eimoon.com/p/rea-reverse-engineer-anything/).
- Per search-result summaries only (page blocked here, UNVERIFIED): the article says REA had "12.4 万 star" as of 12 October; uses the Calculator "200 + 10% 得 220, 200 × 10% 得 20" example to explain that REA makes the AI read the actual assembly instead of answering from memory; and its opening anecdote about a "ten-year bug" refers to a user who used AI to fix a Windows **Remote Desktop** problem that had bothered him for nearly ten years — not the Calculator. I found no independent source for that Remote Desktop anecdote.
- Huxiu (credited to APPSO) reportedly said REA had ">11 万 star" and cited the "3205 组测试" return-value match — [huxiu.com/article/4896826.html](https://www.huxiu.com/article/4896826.html) (search snippet only; UNVERIFIED).

### Inferences
- The Calculator demo shows that REA can surface a relevant branch (operator compares against 0x5b/0x5c, constant 100) from a stripped x64 DLL, but it **does not demonstrate autonomous discovery**: by REA's own ledger the function was located by an analyst-assisted scan, and the semantic labels came from Microsoft's public source. Because the exact rule (and even an explanatory comment) is in an MIT-licensed GitHub repo since 2019, and has been explained publicly by Microsoft since at least 2008, a model could answer "why 220?" from training data without any reverse engineering. As a capability proof it is weak; as a teaching example (manual vs agent workflow on a familiar app) it is reasonable — and REA's evidence file is unusually candid about this.
- The post's phrase "官方示範拆 Windows 小算盤，找出 200 + 10% 為什麼等於 220" is factually consistent with the homepage question, but implies an AI-driven discovery of something hidden. In reality the "why" was never hidden (intended, documented, open source), and the demo's agent dialogue is illustrative.
- The eimoon headline ("微软十年没修的 Bug") is clickbait-style framing: the Calculator behaviour is not a bug Microsoft failed to fix, and (per snippets) the "ten-year bug" is a separate Remote Desktop anecdote. Readers could easily conflate the two. Treat this as an inference pending direct reading of the article.

### Gaps
- Could not read blog.eimoon.com or huxiu.com directly (proxy/DNS refused); their content above is from search snippets.
- Could not fetch Raymond Chen's post to quote the exact title/wording.
- Could not run an exhaustive search of `microsoft/calculator` issues (GitHub search API blocked); there may be user issues complaining about % semantics that I did not find.
- Did not verify whether the `case IDC_PERCENT` comment existed in the very first 2019 open-source commit (only checked the pinned commit `d125246a`).

---

## Q2. DX-Ball: verify the specifics (version, address, what it computes, 3,205 cases, compiler, "63 bytes", decompiler error, reconstruction status, authorship)

### Takeaway
Every number in the post checks out against primary sources, but they describe **one 23-instruction, 63-byte, branch-free floating-point helper** that maps a brick's screen x-coordinate to a pan value `(1.5625·x − 500)·pan_scale` truncated to int. The 3,205 cases are simply every integer x in 0–640 × 5 scale values, run against the original x86 code inside a Unicorn CPU emulator; the 63-byte match is a VC4.0 `/Od` (unoptimised) recompile compared after applying 4 reviewed relocations. The wider reconstruction at the showcased checkpoint (7 Oct 2026) had 55 functions / 33 byte-exact and was explicitly not playable. The reconstruction repo is by N0zoM1z0, who is REA's #2 contributor (and author of the REA website), so it is not independent validation.

### Cited Findings

**Target and function**
- "Target: `DXBALL.EXE`, 158,208 bytes, PE i386. SHA-256: `756da1ba…72ba`. Function: `0x406400` through `0x40643e`, inclusive, 63 bytes. Recorded analysis: REA 4.1.0, Ghidra 12.1.4, Linux x64 host." — `/home/user/morluto/rea/website/evidence/dx-ball-sound-pan.md` L9-12 ([GitHub](https://github.com/morluto/rea/blob/main/website/evidence/dx-ball-sound-pan.md)).
- Game identity: "DX-Ball v1.07, English"; "Original release in included README: October 31, 1996"; "the 1996 Windows breakout game by Michael P. Welch, with original 3D graphics by Seumas McNally"; compiler candidate "VC4.0, compiler 10.00.5270 / linker 3.00.5270" — [dx-ball README @a55dca27 L11-13, L33-44](https://github.com/N0zoM1z0/dx-ball/blob/a55dca27ec0a07018c1b2c95ae2be027f7d8c3c4/README.md).
- Showcase page header: "Case study · DX-Ball 1.07 — Rebuilding DX-Ball from its executable." — `/home/user/morluto/rea/website/public/showcase/dx-ball/index.html`, published at [rea.tools/showcase/dx-ball/](https://rea.tools/showcase/dx-ball/).

**What the function computes**
- Recovered C (maintained source):
  ```c
  DxBallInt dxball_screen_pan(DxBallInt x)
  {
      double pan;
      pan = (double)x;
      pan = pan * 1.5625;
      pan = pan - 500.0;
      pan = pan * dxball_pan_scale;
      return (DxBallInt)pan;
  }
  ```
  and its caller `pan = dxball_screen_pan(x * 30 + 20);` in `dxball_hit_board_tile` — [src/gameplay.c @a55dca27 L41-56](https://github.com/N0zoM1z0/dx-ball/blob/a55dca27ec0a07018c1b2c95ae2be027f7d8c3c4/src/gameplay.c#L41).
- Evidence table: caller "multiplies its coordinate by 30, adds 20, pushes EAX" → "The input is a brick's horizontal screen position"; `FMUL [0x420068]` → 1.5625; `FSUB [0x420070]` → 500.0; `FMUL [0x4210a0]` → stored scale, initial 1.0; "Call to `__ftol` at 0x41678c — Convert the calculation to an integer" — `dx-ball-sound-pan.md` L25-32.
- "At a scale of 1, the recovered calculation returns −500 at the left edge, 0 at the center and 500 at the right edge. The next part of the audio work is integrating that value with the game's sound backend." — showcase page `index.html` ~L700-704.
- Full listing is 23 instructions, `0x406400: PUSH EBP` … `0x40643e: RET` — `dx-ball-sound-pan.md` L65-89 ("The expandable listing retains all 23 instructions." L93).

**The wrong first decompiler output and how it was corrected**
- "The original decompiler result reports `FUN_00406400(void)` and a conversion call, omitting the stack input and x87 expression." — `dx-ball-sound-pan.md` L36-38. The page shows Ghidra's pseudocode: `longlong FUN_00406400(void) { longlong lVar1; lVar1 = __ftol(); return lVar1; }` — showcase `index.html` L323-340.
- Correction route (page text): "The first function result for 0x406400 included pseudocode declaring FUN_00406400(void) and calling __ftol(). Its instruction view showed a stack input and floating-point operations. That discrepancy gave the agent a concrete reason to keep investigating." Three REA queries: `analyze_function {"procedure":"0x406400"}` (instruction view shows `MOV EAX, [EBP+0x8]` / `FILD`), `analyze_function {"procedure":"0x411f40"}` (caller: `ADD EAX, 0x14; PUSH EAX; CALL 0x00406400`), and two `read_bytes` (`0x420068` len 16 → `000000000000f93f0000000000407f40`; `0x4210a0` len 8 → `000000000000f03f`) — `dx-ball-sound-pan.md` L43-52; showcase page.
- DX-Ball project's own wording: "REA's pan pseudocode omitted its argument and x87 expression. The instruction facet reads `[EBP+8]`, loads the integer onto the x87 stack, then multiplies, subtracts and multiplies before `_ftol`… The original stack input and full return take precedence over the incomplete decompiler signature." — [docs/GAMEPLAY_OWNER.md @a55dca27 L29-34](https://github.com/N0zoM1z0/dx-ball/blob/a55dca27ec0a07018c1b2c95ae2be027f7d8c3c4/docs/GAMEPLAY_OWNER.md).
- Transcript status: "Query groups present the reasoning sequence rather than reproducing an entire chronological session." — `dx-ball-sound-pan.md` L56-57. The website update "reused the matching saved REA results… It did not start a new provider session or repeat the project's execution/compiler checks." — L18-20.

**3,205 cases — methodology**
- Official: "3,205 direct original-x86 differential cases: integer positions 0–640 at scales 0, 0.5, 1, 20 and −1." — `dx-ball-sound-pan.md` L101-102. Page: "The tests execute the original x86 function and compare its return value with the maintained C. They cover every integer position from 0 to 640 at five pan scales: 0, 0.5, 1, 20 and −1." (showcase `index.html` L682-689).
- 641 × 5 = 3,205 (arithmetic check).
- Harness: `tests/test_gameplay_differential.py` imports `from unicorn import UC_HOOK_CODE` (Unicorn CPU emulator) and loops `for scale in (0.0, 0.5, 1.0, 20.0, -1.0): … for x in range(641): assert native.call("dxball_screen_pan", x) == signed(target.call(0x406400, x))` — [tests/test_gameplay_differential.py @a55dca27 L13, L275-280](https://github.com/N0zoM1z0/dx-ball/blob/a55dca27ec0a07018c1b2c95ae2be027f7d8c3c4/tests/test_gameplay_differential.py) (read, not executed).
- "3,205 pan cases: every integer x from 0 through 640, scales 0, 0.5, 1, 20 and -1; actual target x87 arithmetic and `_ftol` execute unhooked." — [GAMEPLAY_OWNER.md L112-113](https://github.com/N0zoM1z0/dx-ball/blob/a55dca27ec0a07018c1b2c95ae2be027f7d8c3c4/docs/GAMEPLAY_OWNER.md). The pan cases are part of a 13,689-case gameplay suite (L110).
- The semantic-acceptance ledger row for `0x00406400,gameplay-screen-pan` records case count `3205` and scope "controlled boundaries and valid tested state only" — [config/semantic-acceptance.csv @a55dca27 L15](https://github.com/N0zoM1z0/dx-ball/blob/a55dca27ec0a07018c1b2c95ae2be027f7d8c3c4/config/semantic-acceptance.csv).

**63 bytes — what "match" means**
- "63 matching bytes for the complete VC4.0-compiled function, after applying every reviewed relocation and checking referenced constants." — `dx-ball-sound-pan.md` L103-104. Page: "The C function is compiled with the pinned VC4.0 toolchain. Compiler replay matches the complete function after applying the reviewed relocations and checking the referenced constants." (L691-696).
- Match unit: `[units.screen-pan] … target_address = 0x00406400, size = 63` with 4 relocations: DIR32 to 0x00420068 (1.5625), DIR32 to 0x00420070 (500.0), DIR32 to `_dxball_pan_scale` 0x004210A0, REL32 to `__ftol` 0x0041678C — [config/match-units.toml @a55dca27 L27-38](https://github.com/N0zoM1z0/dx-ball/blob/a55dca27ec0a07018c1b2c95ae2be027f7d8c3c4/config/match-units.toml).
- Compiler: pinned candidate [archaic-msvc/msvc400](https://github.com/archaic-msvc/msvc400/tree/97b4a530238f38b9320a21ca0cb98e4044df7916) run under Wine; "Canonical compile flags: `/nologo /c /Od /Ob0 /Oi- /Oy- /Gd /MT /Gy`"; "Matching thirty-three functions does not prove all original compilation flags, the complete compiler release, or original translation-unit boundaries." — [docs/BUILD_MATCHING.md @a55dca27 L3-26](https://github.com/N0zoM1z0/dx-ball/blob/a55dca27ec0a07018c1b2c95ae2be027f7d8c3c4/docs/BUILD_MATCHING.md).
- "Cold VC4.0 replay retains the original three complete COMDAT units: append (146 bytes), pan (63 bytes) and scan (139 bytes)… No bytes are masked, padded or copied into source." — [GAMEPLAY_OWNER.md L132-135](https://github.com/N0zoM1z0/dx-ball/blob/a55dca27ec0a07018c1b2c95ae2be027f7d8c3c4/docs/GAMEPLAY_OWNER.md).
- Oracle limits table: "Pinned VC4.0 COFF replay — Establishes: Complete function bytes after every explicitly reviewed relocation — Does not establish: Whole-EXE layout, untested function behavior"; "Gameplay x86 vs compiled native C — Does not establish: Ball physics, bonus/particle/audio backends" — [docs/ORACLES.md @a55dca27 L3-11](https://github.com/N0zoM1z0/dx-ball/blob/a55dca27ec0a07018c1b2c95ae2be027f7d8c3c4/docs/ORACLES.md).
- Scope disclaimer: "These claims apply to this function at the linked checkpoint… Game-level integration remains a separate project task." — `dx-ball-sound-pan.md` L106-108.

**Wider reconstruction status**
- At the showcased checkpoint (7 Oct 2026): "Boards, resources, brick hits, animations, particles and bonus production have **55 maintained functions**, **45,380 target differential cases**, and **33 byte-exact functions totaling 3,404 bytes**… A playable whole-game reconstruction is still in progress." — [README @a55dca27 L17-21](https://github.com/N0zoM1z0/dx-ball/blob/a55dca27ec0a07018c1b2c95ae2be027f7d8c3c4/README.md); [docs/PROGRESS.md @a55dca27](https://github.com/N0zoM1z0/dx-ball/blob/a55dca27ec0a07018c1b2c95ae2be027f7d8c3c4/docs/PROGRESS.md): 528 provisional Ghidra candidates, 55 source-present, 33 byte-exact, 3,404 exact bytes, "Origin still unclassified 473".
- The showcase page repeats "55 maintained C functions / 45,380 comparisons with original code / 33 functions with matching compiled bytes / Project checkpoint: 7 October 2026." — showcase `index.html` L246-259.
- At repo HEAD (fetched 2026-10-15) the numbers have moved on: "Status: Exact reconstruction is in progress. We'll finish that first, then get the game building and playable with the original Visual C++ 4.0 compiler." PROGRESS: 543 candidates, 457 source-present, 249 with scoped semantic acceptance, **361 byte-exact, 75,408 exact code bytes**, 204 entries identified as runtime dependencies, 45 compiler-generated, 24 unclassified; "The inventory includes game routines, runtime dependencies and compiler-generated code." — [README (HEAD)](https://github.com/N0zoM1z0/dx-ball/blob/HEAD/README.md), [docs/PROGRESS.md (HEAD)](https://github.com/N0zoM1z0/dx-ball/blob/HEAD/docs/PROGRESS.md).

**Agent and authorship**
- Current README: "Codex uses [REA] to inspect the original executable through Ghidra, recover its functions, and refine the source by comparing compiled code with the original." and setup pins "REA 6.4.0 and Ghidra 12.1.4" — [README (HEAD) L11-14, L114-116](https://github.com/N0zoM1z0/dx-ball/blob/HEAD/README.md). The pinned-checkpoint `docs/REA.md` configures "Codex MCP and skill" with `rea-agents` 4.1.0 — [docs/REA.md @a55dca27 L13, L39-56](https://github.com/N0zoM1z0/dx-ball/blob/a55dca27ec0a07018c1b2c95ae2be027f7d8c3c4/docs/REA.md).
- N0zoM1z0 is listed second (after morluto) in REA's contributor list — `/home/user/morluto/rea/website/public/contributors/people.json` L12-17 — and is quoted as the author of the epigraph in REA's `website/README.md` L1-5, `website/style-guide.md`, `website/figures.md`, `website/AGENTS.md`. The same account owns the TH04 reconstruction repo also showcased by REA — `/home/user/morluto/rea/README.md` L245.
- Reconstruction notes say it builds "on the evidence and replay discipline of [th095](https://github.com/N0zoM1z0/th095)" (a Touhou reconstruction by the same author) — [README @a55dca27 L29-31](https://github.com/N0zoM1z0/dx-ball/blob/a55dca27ec0a07018c1b2c95ae2be027f7d8c3c4/README.md).
- The DX-Ball showcase was added to REA in release 5.0.0 (2026-10-07): "add DX-Ball reconstruction showcase (#876)" and "website: introduce REA and the DX-Ball reconstruction (#906)" — `/home/user/morluto/rea/CHANGELOG.md` L937, L1138.

### Inferences
- Real-world input domain: the only caller passes `20 + 30·tile_x`; with board x in 0..19 (ORACLES.md L24 says target caller coordinate domain is 0..19), only 20 distinct x values (20…590) ever reach this function in the game. The 3,205-case sweep (0–640 × 5 scales) is therefore exhaustive and generous for the real integer input range, but it is a sweep of a one-line linear formula; it does not exercise all int32 inputs or arbitrary doubles for the scale. For a branch-free `(a·x − b)·s` function, 3,205 agreeing cases is strong evidence of equivalence but not an impressive number in itself.
- The "63 bytes match" is byte-identical machine code for one function after mapping 4 address fields (16 of the 63 bytes are relocation fields mapped to reviewed targets; the other 47 bytes are compared literally). With `/Od` (no optimisation), VC4.0 emits one `FST [EBP-8]` per C assignment; the maintained C is visibly written one assignment per x87 op (`pan = (double)x; pan = pan * 1.5625; …`) precisely to reproduce those stores. Matching this is close to the easiest possible matching-decomp case.
- Value of the showcase is less "AI can recompile 1996 games" and more a clean, honest illustration of a real methodological point: Ghidra's pseudocode was wrong (lost the stack argument and x87 expression), and the agent caught that by cross-checking the raw instruction view, the caller and the data bytes — a standard reverse-engineering habit.
- Because the reconstruction author is a core REA contributor and the agent tooling is pinned to REA, the DX-Ball numbers are vendor-produced evidence, albeit with unusually thorough public ledgers. Independent replication requires the user to supply the exact game ZIP (SHA-256 `e6c8a8d2…`) and the pinned toolchain.

### Gaps
- GitHub API for `N0zoM1z0/dx-ball` was blocked in this environment, so repo creation date, stars and commit history/authorship of individual commits (human vs agent) could not be checked.
- How much human steering went into the DX-Ball work (prompts, reviews) is not quantified anywhere I found; the showcase's prompt is labelled "An example prompt for your coding agent".
- I did not execute or reproduce any test; all numbers are as recorded by the project.
- Which model(s) drove the DX-Ball reconstruction is not stated in the files read (only "Codex" as the agent client).

---

## Q3. Is the Facebook post's paraphrase accurate, and how hard is a 63-byte match compared with the human matching-decomp community?

### Takeaway
The post's numbers (3,205 cases, 63 bytes, 1996 DX-Ball, Calculator 200 + 10% = 220) are accurate quotations of official material, but the framing overstates: "左右聲道算法重寫成 C" describes a single 63-byte linear helper that converts a brick's x-position into a pan value (audio integration not done), and the Calculator example was analyst-assisted and explains an intended, open-source, documented behaviour. Byte-matching a 23-instruction unoptimised function is routine in the matching-decomp hobby, which has produced full byte-identical rebuilds of whole games (e.g. Super Mario 64) and where LLM agents were already matching functions in 2025.

### Cited Findings
- Post text (user-supplied): "官方示範拆 Windows 小算盤，找出 200 + 10% 為什麼等於 220；還把 1996 年的遊戲 DX-Ball 的左右聲道算法重寫成 C 語言，測了 3,205 種情況全跟原版一樣，編譯出的 63 個位元組也一模一樣。"
- Official README wording: "Follow a sound call into its position-to-pan helper, inspect the instructions, and turn incomplete pseudocode into C. The reconstruction passes 3,205 original-x86 cases and reproduces all 63 compiled function bytes." — `/home/user/morluto/rea/README.md` L222-226.
- Official showcase index wording: "Recover a sound-pan calculation from a 1996 Windows game. REA's instructions, caller references and numeric constants lead to a small C function, checked against the original behavior and all 63 compiled bytes." — `/home/user/morluto/rea/website/public/showcase/index.html`.
- Official zh-TW translation used on the site: "重建的 C 程式碼透過 3,205 個用例與原始 x86 函式比較，並用 VC4.0 編譯結果匹配全部 63 位元組。" and "3,205 個行為測試用例", "63 位元組完全匹配" — `/home/user/morluto/rea/website/locales/zh-TW/messages.po` L7670-7688, L7818-7820. The site's zh-TW strings call Calculator "計算機", not "小算盤" (L13269).
- Official scoping: "These claims apply to this function at the linked checkpoint… Game-level integration remains a separate project task." — `dx-ball-sound-pan.md` L106-108; "The next part of the audio work is integrating that value with the game's sound backend." — showcase page L703.
- Matching-decomp definition and scale: Super Mario 64 decomp README: "This repo contains a full decompilation of Super Mario 64 of the following releases: Japan (jp), North America (us), Europe (eu), Shindou (sh) and iQue Player (cn)" and lists the byte-identical ROMs it builds with their SHA-1s — [n64decomp/sm64 README](https://github.com/n64decomp/sm64/blob/master/README.md) (fetched). Zelda OoT: "This is a WIP decompilation of The Legend of Zelda: Ocarina of Time… It is not producing a PC port." with per-version input-ROM hashes — [zeldaret/oot README](https://github.com/zeldaret/oot/blob/main/README.md) (fetched).
- tangOS describes matching decomp as compiling C with the original toolchain and comparing the output byte for byte; its sm64ds-decomp is at ~98% of functions / ~91% of code bytes — [github.com/tangOS-decomps](https://github.com/tangOS-decomps) (search-result summary).
- LLM agents in matching decomp before REA: Chris Lewis's Snowboard Kids 2 (N64) matching decompilation progressed from ~25% to ~45% matched between mid-November and 2 December 2025 after switching to Claude Opus 4.5 + Claude Code running non-interactively on the simplest unmatched functions first; a follow-up reports ~58%, then ~75% before stalling on the "long tail" — [Simon Willison, 6 Dec 2025](https://simonwillison.net/2025/Dec/6/one-shot-decompilation/), [blog.chrislewis.au: Using Coding Agents to Decompile Nintendo 64 Games](https://blog.chrislewis.au/using-coding-agents-to-decompile-nintendo-64-games/), [The Long Tail of LLM-Assisted Decompilation](https://blog.chrislewis.au/the-long-tail-of-llm-assisted-decompilation/) (all from search-result summaries; pages blocked here).
- A third-party test of an automated LLM pipeline on 60 functions from two decomp projects reported a 74% match rate — [gambiconf.substack.com](https://gambiconf.substack.com/p/can-llms-really-do-matching-decompilation) (search-result summary).
- DX-Ball's own disclaimer on what matches prove: "Matching thirty-three functions does not prove all original compilation flags, the complete compiler release, or original translation-unit boundaries." — [BUILD_MATCHING.md L23-25](https://github.com/N0zoM1z0/dx-ball/blob/a55dca27ec0a07018c1b2c95ae2be027f7d8c3c4/docs/BUILD_MATCHING.md).

### Inferences
- Accuracy scorecard for the post:
  - "1996 年的遊戲 DX-Ball" — accurate (v1.07, README dated 31 Oct 1996).
  - "左右聲道算法" — loosely accurate but inflated; the function only converts a screen x-coordinate into a signed pan value (−500…+500 at scale 1). No audio mixing or DirectSound code was reconstructed (DirectSound "remain[s] pending" per GAMEPLAY_OWNER.md L9).
  - "重寫成 C 語言" — accurate for that one 6-line function; omits that the broader game is not yet playable.
  - "測了 3,205 種情況全跟原版一樣" — accurate; omits that this is x ∈ 0..640 × 5 scales of a linear formula, run against the original code under emulation.
  - "編譯出的 63 個位元組也一模一樣" — accurate as "byte-identical complete function after reviewed relocations, compiled with VC4.0 /Od"; omits that 63 bytes is one tiny function.
  - "官方示範拆 Windows 小算盤" — accurate that it is an official homepage example; omits the official caveats (analyst-assisted function selection, illustrative prompt/answer, Microsoft source used for interpretation, no GUI check).
- Difficulty: matching optimised compiler output (register allocation, instruction scheduling, loops, switch tables) is where human decompers spend effort; an unoptimised (`/Od`), branch-free 23-instruction x87 function with known constants is near the trivial end. That said, the DX-Ball project's later progress (361 byte-exact entries, 75,408 bytes at HEAD, though including runtime/compiler-generated code) is a more meaningful signal of agent+REA throughput than the 63-byte showcase.
- The genuinely interesting point of the DX-Ball showcase is the decompiler-error catch, not the byte count — and that point is absent from the post.
- AI-assisted matching decomp already existed (Snowboard Kids 2 with Claude Code, 2025) without REA, so DX-Ball shows REA as convenient plumbing (Ghidra access + evidence records for an agent), not a new capability class.

### Gaps
- No authoritative quantitative source found for "how hard" a given function is to match (decomp.me does not publish per-function difficulty metrics I could access); the difficulty assessment is my inference from the /Od flag and instruction count.
- The Snowboard Kids 2 / gambiconf figures come from search summaries, not direct reads.

---

## Q4. Other official showcases (Electron, .NET, APK, firmware) and their evidence

### Takeaway
Official case studies at the 2026-10-15 checkpoint are five — Aegis (Android APK), DownUnderCTF masked-squares (native Linux ELF CTF), DX-Ball (native Win32 reconstruction), Notion (Electron JS), TH04 (PC-98 DOS reconstruction) — plus homepage teaching examples (Chrome-dino JS, Windows Calculator) and a "Notes" Electron teaching fixture. There is **no official .NET or firmware showcase**. Each has a candid evidence ledger; most targets have public source code that was used as a cross-check, and two of the native-reconstruction showcases come from the same contributor's own projects.

### Cited Findings
- Showcase list: "Android · APK analysis — How an authenticator generates a login code"; "CTF · Native analysis — Solve a CTF flag checker"; "Native · Reconstruction — DX-Ball's sound-pan calculation"; "Electron · Feature tracing — How Notion copies text and HTML"; "PC-98 DOS · Reconstruction — How TH04 aims a ring of bullets" — `/home/user/morluto/rea/website/public/showcase/index.html`; evidence files in `/home/user/morluto/rea/website/evidence/` (aegis-login-code.md, ctf-masked-squares.md, dx-ball-sound-pan.md, notion-clipboard.md, th04-bullet-ring.md, calculator-and-dino.md, guide-examples.md).
- **Aegis (APK):** "Inspection on 9 October 2026, using the published REA 6.1.0 CLI with the caller-supplied `jadx-headless-mcp` 0.7.1 provider"; target Aegis v3.4.3 official release APK, 6,881,897 bytes; "Matching source commit: `d6f4e592…`"; "The connected MCP server's Android provider was initially unavailable; it was not reconfigured. The page expresses the inspected selections as REA tool requests, using the same operation parameters as the successful CLI calls." — `aegis-login-code.md` L3-27. Aegis is an open-source authenticator ([beemdevelopment/Aegis](https://github.com/beemdevelopment/Aegis), linked from the evidence file); the showcase index describes the result as finding "Aegis's six-digit code calculation… see why the code changes every 30 seconds" (`showcase/index.html`) — i.e. the standard time-based one-time-password scheme (my characterisation).
- **CTF:** "masked squares flag checker, by joseph, tagged easy in the official DownUnderCTF 2023 repository"; REA 4.1.0 + Ghidra 12.1.4; Z3 solved the extracted 26 equations to `DUCTF{ezzzpzzz_07bcda7bfe81faf43caa}`; "the organizers' source confirmed the decoding/summing interpretation"; format restrictions "are analyst assumptions"; "A separate second-model search reached its timeout" — `ctf-masked-squares.md` L3-6, L75-95.
- **Notion (Electron):** Notion Desktop 7.6.1 shipped JavaScript; REA 4.1.0 `analyze_javascript_application` on `preload.js` (24,579 bytes) found `__electronApi` and a dynamic `invoke` channel; "The four-step figure summarizes this source reading; it is not an automatically paired IPC graph or a captured desktop execution." — `notion-clipboard.md` L1-36. This is the only closed-source commercial product among the case studies.
- **TH04 (DOS):** helper `bullet_velocity_and_angle_set` in PC-98 `MAIN.EXE` (156,258 bytes); source and historical-compiler checks pinned to [N0zoM1z0/th04](https://github.com/N0zoM1z0/th04) commit `0d72e980…`; "example prompt is an invitation to the reader's agent, not a transcript or a claim that this inspection independently discovered every source owner." — `th04-bullet-ring.md` L1-30, L48-49.
- **Dino (homepage):** REA inspected wayou's open-source t-rex-runner page (`index.js`, 90,241 bytes) whose digest "also matches `index.js` in repository commit `5455bfa4…`"; settings `ACCELERATION: 0.001, MAX_SPEED: 13, SPEED: 6`; a separate Playwright controller (not REA) ran the update loop — `calculator-and-dino.md` L75-118.
- **Notes Electron teaching fixture:** "This six-file, source-owned teaching fixture… It is a static analysis target, not an installed Electron distribution." — `guide-examples.md` L8-11.
- .NET / firmware: REA documents these capabilities (`docs/managed-code-analysis.md`, `docs/ghidra-nativeaot.md`, `docs/firmware-analysis.md` exist in `/home/user/morluto/rea/docs/`), but no showcase page or evidence ledger exists for them in `website/public/showcase/` or `website/evidence/`.
- README invites community cases: "If you've used REA on something interesting, we'd love to see it. Share your case in an issue or a pull request" — `/home/user/morluto/rea/README.md` L243-246.
- Version note: showcases were recorded with REA 4.1.0 (DX-Ball, CTF, Notion, TH04, Calculator, dino) and 6.1.0 (Aegis), whereas the repo is now at 6.5.x (`docs/releases/6.5.0.contributions.json` present).

### Inferences
- The showcase set is skewed to targets with **known ground truth** (open-source Calculator, Aegis, t-rex-runner, a CTF with published source/flag, author-owned reconstruction projects). That is good practice for verifiability, but it means none of the showcases demonstrates REA against obfuscated, packed or anti-tamper commercial native code — the scenario critics in the post ("加殼的程式照樣難拆") refer to. Notion is the exception but is unobfuscated packaged JavaScript, the easiest commercial target class.
- The evidence ledgers are notably more careful than the marketing summaries and media retellings: almost every one states that prompts are illustrative, that function selection or interpretation was assisted, or that checks were partial. Media/social posts (including this one) drop those caveats.

### Gaps
- Did not verify the live rea.tools pages (blocked); relied on the local clone of the website source at HEAD `b2257653`, which may differ slightly from what is deployed.
- No evidence found of any official showcase on .NET assemblies, firmware, or packed/protected binaries.
