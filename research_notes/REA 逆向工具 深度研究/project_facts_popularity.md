# REA (Reverse Engineer Anything, morluto/rea, npm "rea-agents"): identity, provenance and real popularity

Note on access (applies to every section): research was done on 2026-10-15 between about 12:58 and 13:40 UTC (20:58–21:40 Taiwan time). In this session the GitHub REST API (`api.github.com`, via curl and `gh`) answered with a session-policy refusal: "GitHub access to this repository is not enabled for this session". `api.npmjs.org`, `npmjs.com`, `hn.algolia.com`, `news.ycombinator.com` and most news sites could not be reached (proxy 403, Cloudflare 403, or DNS failure in WebFetch). The **primary data** used here therefore comes from three places:
- (a) the public github.com HTML pages, read through WebFetch. WebFetch gives an AI-made summary of a page, not the raw API.
- (b) the npm registry JSON at `registry.npmjs.org`, fetched raw with curl.
- (c) the local clone at `/home/user/morluto/rea`, HEAD `b2257653…`, committed 2026-10-15 20:45:35 +0800.

Media figures come mostly from WebSearch result summaries. They are marked as secondary.

## 1. Who is "morluto"? An individual or a company? Prior projects, identity, money, motives

### Takeaway
morluto is a single pseudonymous GitHub developer, not a company. The public profile shows about 6.2k followers and 253 repos, and describes an "agents / RL environments / preference learning" researcher who works closely with the developer N0zoM1z0. I found no company, funding, product pricing or sponsorship for REA. The person's real-world identity is not disclosed anywhere I could reach.

### Cited Findings
- GitHub profile, read 2026-10-15 about 13:05 UTC:
  - display name "morluto", bio "member of technically staff"
  - an unlabeled profile field "Sinsai" (it may be a location or a company)
  - website morluto.bearblog.dev and X account x.com/morluto
  - **6.2k followers / 51 following, 253 public repositories**
  - pinned repos: jacobian 283★, **rea 259k★ / 65.2k forks**, leantoken 80★, flameox 199★, smokinggun 26★, plus a fork of N0zoM1z0/erdos-81
  - [GitHub profile](https://github.com/morluto)
- Profile README: opens with "Hey, I'm Morluto". It lists research on "agents, RL environments, and preference learning", claims to have solved Erdős problem #81 and several conjectures "with longtime collaborator N0zoM1z0", and gives no employer. Projects it lists: REA, Awesome Reverse Engineering, Jacobian, Preference ("research infrastructure for trading agents"), LeanToken, flameox, GitContribute, SmokingGun and Generate Social Preview. Contributions it lists: OpenClaw, Hermes, Qwen Code, MCP TypeScript SDK, SymPy, Triton and others — [morluto/morluto profile README](https://github.com/morluto/morluto). The Erdős claim is self-reported and was not verified.
- npm registry: the only maintainer of `rea-agents` is `morluto`, registered with a personal Hotmail address rather than a company domain. There is no `author` field — [registry.npmjs.org/rea-agents](https://registry.npmjs.org/rea-agents), fetched 2026-10-15 12:58 UTC.
- LICENSE copyright line: "Copyright (c) 2026 morluto". It names a person-handle, not a legal entity — `/home/user/morluto/rea/LICENSE` lines 1–3.
- N0zoM1z0 (git display name "Ysopwnable") is the main co-maintainer:
  - author of the HEAD commit (`git log`, 2026-10-15 20:45 +0800)
  - author of the 20k/30k/40k/50k/170k/200k/250k star-milestone PRs
  - In the release-contribution data for 6.4.0 + 6.5.0, morluto has 721 commits and 28 PRs; N0zoM1z0 has 196 commits and 146 PRs; kaoru0822-kitauji has 174 commits and 110 PRs.
  - Sources: `/home/user/morluto/rea/docs/releases/6.4.0.contributions.json` and `6.5.0.contributions.json`, author fields computed locally; [PR list](https://github.com/morluto/rea/pulls?q=is%3Apr+celebrate+stars)
- Heavy AI-agent authorship: in those same release windows, 170 commits carry the GitHub user "claude" as a co-author. Bot or agent authors such as `factory-droid[bot]` (46) and `cursoragent` (20) also appear. The star-milestone PR bodies themselves contain "Co-authored-by: Claude Opus 5.5" — `/home/user/morluto/rea/docs/releases/6.5.0.contributions.json` lines 1664 and 4803.
- Monetization signals:
  - no `.github/FUNDING.yml`
  - grep of README.md and website/src for pricing / enterprise / subscription / sponsor / donate found nothing
  - official channels are rea.tools, a Discord server, and skills.sh
  - Sources: local clone `/home/user/morluto/rea/.github/` listing; README.md lines 10–21
- The project lists itself in the official MCP Registry under the GitHub-namespaced name `io.github.morluto/rea` — `/home/user/morluto/rea/server.json` line 3; `package.json` `"mcpName": "io.github.morluto/rea"`.
- Impersonation risk:
  - The README warns, verbatim: "Get REA from morluto/rea, rea.tools, or the rea-agents npm package… A similar repository name or copied README does not establish that a download is official." — `/home/user/morluto/rea/README.md` lines 29–33.
  - Copycat repos include rea-githu/REA (a Windows zip "official free download" with about 8★) and NabilRFG12/Reverse-Engineer-anything (about 482★) — [WebSearch result: github.com/rea-githu/REA](https://github.com/rea-githu/REA); [NabilRFG12 repo](https://github.com/NabilRFG12/Reverse-Engineer-anything).
  - A fact-check article reports a fake repo carrying a trojan that Microsoft Defender flagged — [pasqualepillitteri.it](https://pasqualepillitteri.it/en/news/23845/rea-reverse-engineer-anything-github-true-false) (search summary, not opened).
- A Spreaker podcast mirror credits the repo to a different author ("keisuke horota"). That aggregator is unreliable — [Spreaker](https://www.spreaker.com/episode/github-morluto-rea-reverse-engineer-anything-with-agents-from-app-behavior-down-to-native-binaries--75616832) (search summary).

### Inferences
- REA is a personal or small-collective open-source project with a visible core of 2–3 maintainers: morluto, N0zoM1z0 and kaoru0822-kitauji. No commercial product is visible behind it. The likely motive is reputation or research. That is my inference; no source states a motive.
- The bio "member of technically staff" looks like a pun on the frontier-lab job title "Member of Technical Staff". It is not evidence that morluto works at any lab. Do not report it as such.
- The project is built in large part with AI coding agents (Claude, Factory Droid, Cursor). That fits the subject matter and helps explain the unusually fast release cadence.

### Gaps
- Real name, nationality and employer could not be established. morluto.bearblog.dev and x.com were unreachable from this session.
- "Sinsai" is unexplained.
- The Erdős #81 claim was not checked.

## 2. Creation date, launch, and release/version timeline

### Takeaway
- The repo reportedly existed from 2026-04-14 (secondary source only).
- The first npm release was 2026-07-12 (primary).
- The project was quiet from 9 Aug to 3 Oct, then shipped versions 3.2.0 to 6.5.0 between 3 and 14 Oct.
- The viral "launch" was 5–8 Oct 2026: first GitHub Trending appearance reported 5 Oct, 5.0.0 published 7 Oct, and a large HN thread by 10 Oct.

### Cited Findings
- **npm registry (primary), fetched 2026-10-15 12:58 UTC:** package `created` 2026-07-12T12:46:31Z; 32 versions; `latest` 6.5.0 published 2026-10-14T12:56:14Z; license "MIT" — [registry.npmjs.org/rea-agents](https://registry.npmjs.org/rea-agents). Full publish timeline (UTC):

  | Period | Versions and publish times |
  |---|---|
  | 12–24 Jul 2026 | 0.2.1 (07-12 12:46), 0.3.0, 0.4.0, 0.5.0, 1.0.0 (07-13 05:38), 1.1.0–1.7.0, 2.0.0 (07-16), 2.1.0 (07-18), 2.2.0 (07-20), 2.3.0, 2.4.0 (07-23), 2.5.0 (07-24) |
  | Aug 2026 | 3.0.0 (08-03), 3.1.0 (08-09) |
  | 9 Aug – 3 Oct | **no releases for about 8 weeks** |
  | 3–14 Oct 2026 | 3.2.0 (10-03 16:49), 3.2.1 (10-03 20:02), 4.0.0 (10-05 18:38), 4.0.1 (10-05 18:58), 4.1.0 (10-06 18:06), **5.0.0 (10-07 17:35)**, 6.0.0 (10-08 09:46), 6.1.0 (10-09 01:16), 6.2.0 (10-09 16:58), 6.3.0 (10-10 00:02), 6.4.0 (10-11 04:02), 6.5.0 (10-14 12:56) |

- **CHANGELOG (local):**
  - The earliest entries are rea-0.2.0 and 0.2.1, both dated 2026-07-12.
  - 0.2.0 includes "**identity:** rename package and CLI to REA", so the project existed under another name before 12 July.
  - 6.5.0 is dated 2026-10-13, which is the release-please date; npm publish was 10-14.
  - Source: `/home/user/morluto/rea/CHANGELOG.md` lines 3, 2541–2560 (36 version headings).
- **GitHub Releases page (primary HTML):** tags `rea-agents-6.5.0` (Latest, 14 Oct 12:32), 6.4.0 (11 Oct 03:58), 6.3.0 (09 Oct 23:56), 6.2.0 (09 Oct 16:51), 6.1.0 (09 Oct 01:08), 6.0.0 (08 Oct 09:40), all published by github-actions — [Releases](https://github.com/morluto/rea/releases). A release PR for **6.6.0** has been open since Oct 14 (#3476) — [PR list](https://github.com/morluto/rea/pulls?q=is%3Apr+celebrate+stars).
- **Repo creation 2026-04-14:** reported by a fact-check article ("created on April 14, 2026") — [pasqualepillitteri.it](https://pasqualepillitteri.it/en/news/23845/rea-reverse-engineer-anything-github-true-false) — and by Zhihu ("2026 年 4 月 14 日创建，10 月 5 日首次进入 GitHub Trending") — [知乎](https://zhuanlan.zhihu.com/p/2092012145072518657). Both come via search summaries. **UNVERIFIED against the API** because `created_at` could not be read: the API was blocked and the clone is shallow (`git rev-parse --is-shallow-repository` = true, one commit).
- **Launch and HN:**
  - Search results list several HN submissions: 1 point on Oct 6, 4 points on Oct 8, and 2 points on Oct 10. The Oct 10 one has a title saying the project is now "#1 trending repo on GitHub".
  - A main HN thread linking the official site reportedly reached **764 points and 325 comments by Oct 10**; another source says "768 points on 10 October".
  - Qiita says an early-October Show HN got only 3 points. systemdesign.academy instead says "3 points on Hacker News in July".
  - Sources: [HN item 50028275 (title "REA Reverse")](https://news.ycombinator.com/item?id=50028275), [Qiita](https://qiita.com/hisashi-ito/items/b2ec2262f0b26489ae38), [systemdesign.academy](https://www.systemdesign.academy/explained/rea-reverse-engineer-anything) — all via search summaries. HN itself was unreachable, so the point counts are **UNVERIFIED**.
- An X "Trending" card exists: "REA GitHub Tool Lets AI Reverse Engineer App Features from Binaries" — [x.com/i/trending/2108302228461080603](https://x.com/i/trending/2108302228461080603) (search result only).
- The Korean hands-on tests use "REA v6.4.0 · Windows 11 · Node.js 24", which matches 6.4.0 being the latest release from Oct 11 to Oct 14 — [wikidocs.net/451136](https://wikidocs.net/451136) (search result title).
- Runtime requirement: `"engines": {"node": "^22.19.0 || ^24.11.0 || >=26.0.0"}` — `/home/user/morluto/rea/package.json`.

### Inferences
- The repo was created around April (if that date is right), went public on npm in July, and went viral 5–8 October, coinciding with 4.x→5.0.0. The burst of major versions (3.2→6.0 in 5 days) comes from release-please semantic-version bumps on breaking-change commits. It does not mean a long maturation history.
- The two HN accounts (July vs October) are not reconciled. The 3-point Show HN may have been an early July post, separate from the October viral thread.

### Gaps
- Exact `created_at` and `pushed_at` from the GitHub API are missing. The API was blocked by session policy.
- The original launch post by morluto (on X or the blog) was not found or read.
- The pre-July package name was not determined.

## 3. License: what LICENSE says; other licenses; proprietary dependencies

### Takeaway
The post's claim of "MIT 授權" (MIT licence) is correct for REA's own code. The repo vendors or retains third-party material under Apache-2.0, BSD-3, GPL-3.0 (with the GCC Runtime Library Exception) and others. Its integrations with **IDA Pro / Hex-Rays, Hopper and JEB are proprietary tools that users must license themselves**. Ghidra (Apache-2.0), JADX and Wakaru are free.

### Cited Findings
- `/home/user/morluto/rea/LICENSE` lines 1–3: "MIT License / Copyright (c) 2026 morluto", followed by the standard MIT text. npm metadata and package.json also say `"license": "MIT"`. The GitHub page shows "MIT license" — [GitHub](https://github.com/morluto/rea).
- README lines 382–397 (verbatim): "REA-authored code is licensed under MIT. Third-party material retains its own licenses… **You must legally obtain and be authorized to use commercial tools**, including IDA Pro / Hex-Rays decompilers, Hopper, and JEB… REA grants no tool license, key, or activation entitlement… Cracked copies, stolen keys… are not authorized." — `/home/user/morluto/rea/README.md`
- `THIRD_PARTY_NOTICES.md`:
  - line 5: "REA's MIT license grants no rights to proprietary analysis tools."
  - lines 85–98: IDA Pro/Hex-Rays is "Proprietary Hex-Rays software governed by the EULA"; Hopper is "Proprietary Cryptic Apps software"; JEB is a "Proprietary PNF Software product". The JEB EULA "restricts public or third-party disclosure of decompiled code, reconstructed artifacts, and analysis reports".
  - line 96: ida-pro-mcp (MIT, Duncan Ogilvie) "requires IDA Pro and explicitly states that IDA Free is unsupported".
  - lines 57–65: Ghidra 12.1.4 Apache-2.0; JADX Apache-2.0; jadx-headless-mcp Apache-2.0; Wakaru Apache-2.0; ghidra-nativeaot MIT.
  - The Windows native addon statically links the MinGW-w64/GCC runtime (GPLv3 with the GCC Runtime Library Exception 3.1).
  - Source: `/home/user/morluto/rea/THIRD_PARTY_NOTICES.md`
- `licenses/` contains Apache-2.0, GPL-3.0, LGPL-2.0, GCC-Runtime-Library-Exception-3.1, MinGW-w64-runtime, Node-22.19.0, Frida 17.23.2 COPYING, Ghidra 12.1.4 LICENSE/NOTICE/DISCLAIMER, xterm-MIT, cfworker-MIT and npm-dependencies inventories. `third_party/` holds git submodules: jadx-headless-mcp, binwalk, unblob, ghidra-nativeaot and wakaru (from `.gitmodules`), plus evmole, pwndbg, pwntools, wabt and web-network-captures directories — `/home/user/morluto/rea/licenses/`, `/home/user/morluto/rea/.gitmodules`
- Hopper is not required for every target. Per CHANGELOG 6.5.0, native IDA was verified on "Linux IDA Free 9.4" and "Windows IDA Pro 9.3", while Ghidra profiles cover Linux, macOS and Windows — `/home/user/morluto/rea/CHANGELOG.md` lines 3–40.

### Inferences
- A user can run REA's native-binary path entirely on free tools (Ghidra, IDA Free for some flows). The Hopper and IDA Pro paths depend on paid commercial licences, and their EULAs (especially JEB's) may restrict sharing what the agent produces.

### Gaps
- Each submodule's licence at its pinned commit was not checked beyond what THIRD_PARTY_NOTICES states.

## 4. True star count today (primary data)

### Takeaway
As of **2026-10-15 about 13:00 UTC**, the official repo page shows **259.4k stars, 65.2k forks and 868 watchers**, with 3,293 commits, 563 open issues and 363 open PRs. The project's own README celebrates "250,000 GitHub stars". The post's "超過 22 萬星" (over 220,000 stars) is therefore **true as a raw counter, and in fact understated**.

### Cited Findings
- github.com/morluto/rea, read 2026-10-15 about 13:00 UTC through WebFetch (an HTML summary, not the raw API):
  - "**259.4k** stars"; the header button reads "Star 259k"
  - "**65.2k** forks", "**868** watching"
  - "3,293 Commits", "Issues 563", "Pull requests 363"
  - "MIT license", website https://rea.tools
  - About: "Reverse engineer anything with agents, from app behavior down to native binaries."
  - 20 topics, including agent-skills, ai-agents, claude-code, codex, ghidra, hopper, mcp, reverse-engineering and touhou
  - Source: [github.com/morluto/rea](https://github.com/morluto/rea)
- The profile page fetched minutes later gives the same figure: "rea: 259k / 65.2k" — [github.com/morluto](https://github.com/morluto).
- README at HEAD (committed 2026-10-15 12:45 UTC), line 348: "🎉 **250,000 GitHub stars — thank you!**" — `/home/user/morluto/rea/README.md`. The matching PR #3971 "docs: celebrate 250,000 GitHub stars 🎉" by N0zoM1z0 was merged Oct 15, 2026 — [PR list](https://github.com/morluto/rea/pulls?q=is%3Apr+celebrate+stars).
- An earlier search-engine snapshot of the same page showed "about 239k stars and 59.5k forks" (date unspecified, between Oct 14 and 15) — WebSearch summary of [github.com/morluto/rea](https://github.com/morluto/rea).
- REST API values (`stargazers_count`, `subscribers_count`, `created_at`, `pushed_at`, `network_count`): **NOT OBTAINED**. `curl https://api.github.com/repos/morluto/rea` and `gh api` returned `{"message":"GitHub access to this repository is not enabled for this session…"}`, a sandbox policy refusal rather than a GitHub error.

### Inferences
- When the FB post went up (about 13 hours before 2026-10-15 20:52 Taiwan time, so around 2026-10-14 23:50 UTC), the count was between the 200k milestone (crossed about Oct 13 16:11 UTC) and the 250k milestone (PR merged Oct 15). Likely it was about 235–245k. pasqualepillitteri reported 234,477 on Oct 14. ">220,000" was accurate at posting time.

### Gaps
- The exact API `stargazers_count` and `subscribers_count` at a precise timestamp are missing. WebFetch rounds to 0.1k and is an LLM summary.
- The contributor count shown on the GitHub page was not displayed in the fetched HTML.

## 5. Star growth curve and signs of star inflation

### Takeaway
The repo went from about 10k stars (Oct 6) to about 259k (Oct 15), roughly **+250k in about 9 days, an average near 28k a day**. The peak was about +87k in about 36 hours (Oct 12 04:00 → Oct 13 16:11 UTC). The **fork-to-star ratio (about 25%) is about twice that of comparable reverse-engineering MCP repos**, and watchers are low at about 0.33% of stars. These are anomalies that could hint at inorganic stars, but they prove nothing. Strong signs of real engagement also exist: hundreds of PR authors, large HN threads and global coverage. I could not sample stargazer accounts.

### Cited Findings
- **Project-authored milestone PRs (primary GitHub HTML; merge dates with day resolution)** — [PR list "celebrate stars"](https://github.com/morluto/rea/pulls?q=is%3Apr+celebrate+stars):

  | Milestone | PR | Status and date (2026) |
  |---|---|---|
  | 20k | #1079 | merged Oct 8 |
  | 30k | #1207 | merged Oct 9 |
  | 40k | #1334 | merged Oct 9 |
  | 50k | #1349 | merged Oct 10 |
  | 60k | #1559 | merged Oct 10 |
  | 80k | #1752, #1758 | merged Oct 11 |
  | 90k | #1858 | merged Oct 11 |
  | 100k | #2008 | closed or superseded Oct 12 |
  | 110k | #2042 | merged Oct 12 |
  | 170k | #2462 | merged Oct 13 |
  | 180k | #2740 | closed Oct 13 |
  | 200k | #2897 | opened Oct 13, merged Oct 14 |
  | 250k | #3971 | merged Oct 15 |

- PR #2042 body: "REA has passed 110,000 GitHub stars", with **112,830** at the time of the PR. It was merged Oct 12 (branch deleted at about 04:06) — [PR #2042](https://github.com/morluto/rea/pull/2042).
- PR #2897 (200k): "documentation-only… changes one milestone numeral per file" — [PR #2897](https://github.com/morluto/rea/pull/2897).
- **Fact-check timeline (secondary, via search summary):** 20,000 on Oct 8; 50,000 on Oct 10; 110,000 on Oct 11; 170,000 on Oct 13; 200,000 on Oct 14. Milestone requests: 110k at Oct 12 03:58 UTC, 170k at Oct 13 03:20, 180k at Oct 13 09:48, 200k at Oct 13 16:11 — "In about 36 hours the counter rose by 90,000". It also gives **234,477 stars / 58,512 forks as of Oct 14** — [pasqualepillitteri.it](https://pasqualepillitteri.it/en/news/23845/rea-reverse-engineer-anything-github-true-false).
- The same article notes that **forks are about 24% of stars, against about 11–12% for GhidraMCP or ida-pro-mcp**, says this alone is no evidence of inflation, cites the paper "Six Million (Suspected) Fake Stars in GitHub" (AI/LLM repos are frequent fake-star targets; stars should not be used alone for high-stakes decisions), and says nobody can tell from outside how many stars come from real users — [pasqualepillitteri.it](https://pasqualepillitteri.it/en/news/23845/rea-reverse-engineer-anything-github-true-false) (search summary; the page could not be opened).
- Early-phase figures:
  - ChainCatcher: from below 10,000 on Oct 6 to over 100,000 by Oct 12 — [ChainCatcher](https://www.chaincatcher.com/en/article/2295747)
  - AICoder: about 13k (12,962) on Oct 8 — [AICoder](https://aicoder.com/news/news-20261008-rea-reverse-engineer-anything-mcp-agents)
  - Zhihu: first entered GitHub Trending Oct 5; "三天内星标从一万出头推到三万以上" ("within three days, stars went from just over 10,000 to more than 30,000") — [知乎](https://zhuanlan.zhihu.com/p/2092012145072518657)
  - All via search summaries.
- Engagement indicators (primary):
  - 563 open issues and 363 open PRs; 3,293 commits — [GitHub](https://github.com/morluto/rea)
  - **229 unique commit authors and 187 unique PR authors** in the 6.4.0 and 6.5.0 release windows (about Oct 9–14) — computed from `/home/user/morluto/rea/docs/releases/6.4.0.contributions.json` (336 commits / 163 PRs) and `6.5.0.contributions.json` (893 commits / 529 PRs)
  - HN thread with about 764 points and 325 comments (secondary; see section 2)
- My own ratios from the 2026-10-15 13:00 UTC page: forks/stars = 65.2k / 259.4k = **25.1%**; watchers/stars = 868 / 259.4k = **0.33%**.

### Inferences
- The curve is a very steep but smooth S-shape. The jump from about 13k to about 113k between Oct 8 and Oct 12 coincides with the #1 GitHub Trending position, the HN front page and worldwide press. That is consistent with a genuine viral cascade, which can also attract star-farming. The data here cannot separate the two.
- A fork ratio twice that of peer repos is unusual. Possible benign explanations:
  - many contributors forking to open PRs (hundreds of PR authors)
  - "fork-to-try" behaviour driven by tutorials
  - automated agent-driven contributions; many commits are agent co-authored
  - Each of these is plausible, but none is confirmed.
- The project itself celebrates milestones every 10k–50k stars with PRs, many co-written with AI agents. That is a growth-signalling behaviour, but it is not evidence of manipulation.

### Gaps
- **Stargazer sampling was not possible:**
  - the API (`Accept: application/vnd.github.star+json`) was blocked by session policy
  - the HTML page github.com/morluto/rea/stargazers returned 404 (it needs login)
  - So no check of account age or activity was done, and no fake-star verdict can be issued.
- star-history.com, OSSInsight and Trendshift data could not be fetched (proxy 403 / DNS). The README embeds a star-history chart — `/home/user/morluto/rea/README.md` lines 352–356 — but it was not viewable here.
- Watcher ratios for peer repos were not measured, so the 0.33% is not benchmarked.

## 6. Explaining the 220k vs ~185k vs ~10.4k vs ~9.5k discrepancy; is 220k plausible?

### Takeaway
All four numbers can be correct snapshots taken at different times during an extremely fast climb. Roughly:
- **~9.5k / ~10.4k** come from about Oct 6–7, right after the project started trending.
- **~185k** is from about Oct 13.
- **~220k+** is from about Oct 14.
- The live count on Oct 15 is **~259k**.

220k is plausible and is confirmed by primary data. Even so, it would put a 6-month-old repo among roughly the top 20 most-starred repositories in GitHub's history, an extraordinary jump for which genuine-user composition cannot be verified.

### Cited Findings
- **~10.4k:** Startup Fortune "cites over 10,400 stars after launch" — [Startup Fortune, "An AI agent that reverse engineers any software just hit number one on GitHub"](https://startupfortune.com/an-ai-agent-that-reverse-engineers-any-software-just-hit-number-one-on-github/) (search summary; publication date not seen). AICoder headline: "(~13k GitHub stars)", dated Oct 8 — [AICoder](https://aicoder.com/news/news-20261008-rea-reverse-engineer-anything-mcp-agents).
- **~9.5k:** the aggregator was **not identified**. Candidates named in the scouting leads (everydev.ai/tools/rea, opensourcealternatives.to/item/rea) were not opened — UNVERIFIED. Trendshift showed an older "29,900+" snapshot — [Trendshift](https://trendshift.io/repositories/82054) (search summary).
- **Intermediate:**
  - 80k "in three days" — [KuCoin flash](https://www.kucoin.com/news/flash/github-project-rea-surpasses-80k-stars-in-three-days-sparks-open-source-debate)
  - ~109k — [systemdesign.academy](https://www.systemdesign.academy/explained/rea-reverse-engineer-anything)
  - 115k and 25k forks "by October 12" — [DEV Community](https://dev.to/hassann/what-is-rea-reverse-engineer-anything-the-mcp-server-that-hit-115k-github-stars-in-a-week-1coc) / [Apidog](https://apidog.com/blog/what-is-rea-reverse-engineer-anything/)
  - 120k as of Oct 12 — [InfoQ 中文](https://www.infoq.cn/article/BEJ6IXREBoXspGmXRQHj), [LINUX DO](https://linux.do/t/topic/3013993)
  - 143,700 stars / 33,200 forks as of Oct 12 ("140,000 GitHub Stars in Five Days") — [Medium/booststash](https://medium.com/@info.booststash/rea-the-reverse-engineering-tool-for-ai-agents-hits-140-000-github-stars-in-five-days-d30fa52d8650)
  - "1 週間で 15 万スター" (150k stars in one week), 158k by Oct 13 — [Qiita](https://qiita.com/hisashi-ito/items/b2ec2262f0b26489ae38)
  - "一个月干到15W+" (150k+ within a month) — [博客园](https://www.cnblogs.com/jinjiangongzuoshi/p/23295698)
- **~185k:** all-ai.de headline "GitHub 185.000 Sterne: REA baut jedes Tool einfach nach", body "fast 185.000 GitHub-Sterne" — [all-ai.de](https://www.all-ai.de/news/news26top/rea-github-erfolg) (search summary). That figure falls between the 180k (Oct 13 09:48 UTC) and 200k (Oct 13 16:11 UTC) milestones.
- **~220k:** a skills directory shows "rea - AI Agents on GitHub (220.7k★)" — [skillsllm.com](https://skillsllm.com/skill/rea). It is the likely origin of the post's figure. Later figures: 234,477 on Oct 14 ([pasqualepillitteri.it](https://pasqualepillitteri.it/en/news/23845/rea-reverse-engineer-anything-github-true-false)); "REA Hit 248K Stars" ([AgentConn](https://agentconn.com/blog/rea-reverse-engineering-agent/)); 241.5K on another skills directory (search summary).
- **Context, repos above 200k stars:** aggregated rankings (Kaggle 2026 dataset, EvanLi/Github-Ranking, GitStarClub as of 2026-08-30, gitstar.space) put **roughly 20 repositories** above 200k. Examples: build-your-own-x (~550k), sindresorhus/awesome (~510k), public-apis (~485k), freeCodeCamp (~456k), openclaw/openclaw (~390k), torvalds/linux (~229k), vuejs/vue (~213k), n8n (~206k). Sources: [Kaggle](https://www.kaggle.com/datasets/mubashirsidiki/2026-github-most-starred-projects), [EvanLi/Github-Ranking](https://github.com/EvanLi/Github-Ranking), [GitStarClub 2026](https://gitstarclub.com/rankings/2026) (search-summary figures; they vary by snapshot).

### Inferences
- The post's ">220,000" is not an exaggeration of the GitHub counter. At about 259k on Oct 15, REA would sit around rank 15–20 all-time, above torvalds/linux and vuejs/vue, about 10 days after it began trending. The ~9.5k and ~10.4k numbers are simply stale early snapshots.
- "Stars" here measure attention, not usage. A raw counter that is correct is not the same as a count of genuine users (see section 5).

### Gaps
- The exact outlet and date for "~9.5K" are unknown.
- The publication timestamps of Startup Fortune and all-ai.de were not seen directly.

## 7. npm downloads, GitHub Trending, contributor count

### Takeaway
- npm download data could not be fetched first-hand. A secondary analysis shows **~19.7k downloads in the 30 days to Oct 8**, with a daily spike from about 16/day to 9,000 on Oct 8. That is tiny next to 259k stars, though post-Oct-8 data is missing.
- The repo did reach #1 on GitHub Trending (reported from Oct 5 onward).
- At least **~190–230 distinct contributors** appear in just the last two releases.

### Cited Findings
- `api.npmjs.org/downloads/...` returned proxy 403 (curl) and DNS failure (WebFetch); `npmjs.com/package/rea-agents` returned a Cloudflare 403 — attempted 2026-10-15 12:58–13:20 UTC.
- Capital & Compute: **19,743 downloads from Sep 9 to Oct 8, 2026**; about 16/day in early October, 418 on Oct 3, 4,048 on Oct 5, 9,000 on Oct 8 — [capitalandcompute.net](https://capitalandcompute.net/blog/what-is-rea-reverse-engineer-anything/) (search summary).
- Socket lists 419 weekly downloads, apparently a stale v3.1.0 snapshot — [socket.dev](https://socket.dev/npm/package/rea-agents) (search summary).
- Trending:
  - Zhihu: first in GitHub Trending Oct 5; "REA 三天登顶 GitHub" ("REA tops GitHub in three days") — [知乎](https://zhuanlan.zhihu.com/p/2092012145072518657)
  - Startup Fortune: "just hit number one on GitHub" — [Startup Fortune](https://startupfortune.com/an-ai-agent-that-reverse-engineers-any-software-just-hit-number-one-on-github/)
  - aitoolly, Oct 13: "trends on GitHub" — [aitoolly](https://aitoolly.com/ai-news/article/2026-10-13-rea-by-morluto-trends-on-github-leveraging-ai-agents-to-reverse-engineer-anything-from-app-behaviors)
  - README carries a Trendshift badge (repo id 82054) — `/home/user/morluto/rea/README.md` line 19
- Contributors: 229 unique commit authors (bots and the "claude" co-author identity included) and 187 unique PR authors across the 6.4.0 + 6.5.0 windows — computed from `/home/user/morluto/rea/docs/releases/*.contributions.json`. CHANGELOG 6.5.0 thanks dozens of handles — `/home/user/morluto/rea/CHANGELOG.md` lines 15–40. GitHub totals: 3,293 commits, 363 open PRs, 563 open issues — [GitHub](https://github.com/morluto/rea).
- Other distribution channels: skills.sh listing ([skills.sh/morluto/rea](https://www.skills.sh/morluto/rea/reverse-engineer-anything)), Glama MCP directory ([glama.ai](https://glama.ai/mcp/servers/morluto/rea)), TypingMind skill — all from search results.

### Inferences
- If npm downloads stayed in the low thousands to low tens of thousands per day after Oct 8, actual installs are probably one to two orders of magnitude below the star count. That gap is common for viral repos and is not proof of fake stars. It does show the 220k figure measures attention more than adoption. This is an inference resting on pre-Oct-8 data.

### Gaps
- npm last-week and last-month downloads for Oct 8–15 are missing (the endpoint was blocked).
- The all-time contributor total from GitHub's contributors graph is missing.
- Daily Trending ranks were not checked against a primary archive.
