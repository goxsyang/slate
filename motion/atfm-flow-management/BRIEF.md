---
workflow: general-video
flow: automation
storyboard: yes
canvas: 1920x1080
fps: 60000/1001
duration: 49.0
source_timecode_in: "00;04;26;25"
---

# Brief — ATFM「兩種流量管理功能」段落動畫 v5

## Request (client, zh-TW)
依照口白長度與內容製作動畫；以附件影片（v4）的設計風格與形態為基準重新設計，讓整體風格一致，
並以「精緻呈現」為主；必要時進行圖像生成與製作，盡可能發揮 MG 能力。

## What this segment must explain
1. The ATFM system currently provides **two** flow-management functions that together protect Taiwan's sky.
2. **01 機場端流量管理 (airport-side)** — when the *destination* airport's arrival capacity drops (weather,
   runway maintenance), the system automatically re-issues **departure times** to flights still on the ground
   at the *departure* airport, so they arrive into the reduced number of arrival slots in order.
3. **02 邊境點流量管理 (boundary-point)** — when an FIR **boundary point** is under a flow restriction, the
   system automatically regulates and issues departure times for the flights that will cross that point,
   so they pass it in order — achieving cross-region (跨區) operational integration.
4. It's a relay race beyond borders: information and order are handed from region to region.
5. The two functions work together so the **Taipei FIR (臺北飛航情報區)** sky runs more smoothly.

## Reference (v4) — keep its identity, raise the craft
- Frames: `/tmp/claude-0/-home-user-slate/24d7b024-93d3-5c9d-afd5-aa5100195b80/scratchpad/ref/full_*.png`
  (t = 3, 9.5, 16.5, 21.5, 27.5, 34, 39, 45, 51 s) and contact sheets `sheet_1..4.jpg` (1 fps).
- v4 structure: map overview → airport pair (constraint cards, slot bars, re-dispatch card) → boundary
  scene (vertical dashed boundary, shaded zone, red point, slot bars) → relay (區域 A/B/C) → map recap.
- v4 weaknesses to fix: mostly static "slides"; elements just fade in; the map omits Taiwan; few moving
  aircraft; no sense of the system acting; cards are generic; transitions are plain cuts/fades.

## Deliverables
- HyperFrames project (this directory) rendering to `renders/ATFM_flow-management_v5.mp4`
  (1920×1080, 59.94 fps, 49.0 s, starts at source TC 00;04;26;25), plus a review copy with VO subtitles.

## Constraints
- See DESIGN.md (tokens, layout grid, motion language, header schedule, VO timings, accuracy guardrails).
- Subtitle-safe zone y ≥ 915 stays empty. Header (kicker+title) and footnote are owned by index.html.
- Five sub-compositions (time windows are absolute seconds on the master timeline):
  - `c1-map-intro` 0.0–8.2 · `c2-airport` 7.4–24.3 · `c3-border` 23.6–37.7 · `c4-relay` 37.3–41.3 · `c5-map-outro` 40.7–49.0
- Assets: `assets/img/airport.png` (isometric airport, 1600×864, alpha), `assets/map-data.js`
  (`ATFM_MAP.land` / `.graticule` / `.fir.RCAA.d` path data in world units + `ATFM_MAP.project([lon,lat])`),
  `assets/atfm-kit.js` (`ATFM_KIT`: plane(), fly(), draw(), flow(), pulse(), card(), chip(), slots(),
  slotTo(), panel(), tag(), roll()/rollTo(), node(), airport(), arc(), smooth(), rng()), `assets/atfm.css`.
- No external network at render time, no randomness/clocks, GSAP only, one paused timeline per composition.
