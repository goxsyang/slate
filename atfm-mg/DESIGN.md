# ATFM 效益段落 — MG design spec

30.03 s motion-graphics insert for the ATFM film, voice-over 00;08;40 – 00;09;08.
Rendered 1920×1080 @ 59.94 fps (drop-frame timeline). **Clip frame 0 = edit
timeline 00;08;40;00.** All times below are seconds from that frame
(`CUES.t()` converts timecodes; `CUES.words` holds the word anchors).

The look must be indistinguishable from the v4 reference film (`ATFM_2D v4`):
white editorial slides, teal headline + big teal KPI numbers, terracotta
accents, flat navy-outlined illustrations. Our job is the same language with
far more refined motion: precise sync to the VO, purposeful choreography,
everything gently alive, no dead frames, no cheap effects.

## Voice-over (sync targets)

| line | start → end | text | key anchors |
|---|---|---|---|
| L1 | ~0.30 → 3.22 | 以 5 月 5 日 38 個 CTOT | date 0.45 · 38 1.55 |
| L2 | 3.22 → 8.68 | 累計 528 分鐘的地面等待／一口氣省下了 57.9 噸的 CO2 | 528 3.75 · 地面等待 5.0 · 一口氣 5.95 · 57.9 6.95 · CO2 8.1 |
| L3 | 9.19 → 12.25 | 同時也是燃油成本／與空中盤旋風險的縮減 | 燃油成本 9.85 · 空中盤旋風險 10.85 · 縮減 11.75 |
| L4 | 12.25 → 15.95 | 這就是 ATFM 為航空公司帶來的真實價值 | ATFM 12.85 · 航空公司 13.75 · 真實價值 15.0 |
| — | 15.95 → 18.55 | (silence — transition) | |
| L5 | 18.55 → 24.24 | 這套系統我們僅以 645 萬硬體費用／自主研發完成 | 645 萬 19.9 · 硬體費用 20.85 · 自主研發完成 22.4 |
| L6 | 25.04 → 27.93 | 為國家節省了／約 4 億元的公帑 | 為國家節省了 25.04 · 約 4 億元 26.35 · 公帑 27.2 |
| — | 27.93 → 30.03 | hold / tail | |

A number must *land* (counter finished, accent bar drawn) on or just after the
moment it is spoken, never later than ~0.25 s after.

## Design system (already implemented — reuse, don't restyle)

* Canvas: pure white `#fff`. No gradients/vignettes/drop shadows except the
  soft ground/contact shadows of illustrations (very light, e.g. `#e9f0f5`).
* Colour (`K.C`): teal `#1e6e65` (headlines, KPI, data), tealDim `#b4cfca`
  (de-emphasised), tealSoft `#e1eeec`, tealLine `#cfe3df` (faint guides),
  gray `#565e5d` (secondary text), terra `#c47259` (accent bars, frames,
  connectors, highlight rings), terraSoft `#ecd1ca`, peach `#fcd4c0`,
  orange `#ee8b43` (fuel), blue `#3280c1`, navy `#1f3f6e` (outlines),
  navyMid `#275787` (molecule core), sky `#bed9f1`, skyPale `#e6eff8`,
  ticketLine `#aebcc9`.
* Type: Noto Sans TC. KPI label 34px/500 teal · KPI number 170px/700 teal
  (tabular figures, class `num`) · unit 52px/700 teal · secondary 30–34px/400
  gray · accent bar 100×6 terracotta, rounded, under the number.
* Illustrations: flat, navy `#1f3f6e` outlines (2.5–3px at 1:1), light blue
  fills, orange/blue airline accents; icons drawn as inline SVG in this
  style. Raster assets (alpha PNG, extracted from the reference):
  `assets/plane_side.png` 904×349 (parked, side view),
  `assets/plane_fly.png` 1183×316 (climbing 3/4 view),
  `assets/rack.png` 562×561 (server rack + small switch table),
  `assets/apron.png` 1040×440 (opaque airport apron backdrop, optional).
  Reference stills (1 fps) for style matching:
  `$REF/frames/f_001.png … f_060.png` — esp. f_025 (CTOT/528 slide),
  f_027/f_031/f_034 (57.9 / 燃油 / 盤旋 slide), f_044 (645 slide), f_058.
* Layout: margin x = 96. Header zone y < 200 and footnote zone y > 945
  belong to the chrome (src/chrome.js) — **scenes never draw there**.
  Scene content lives in x 96–1824, y 215–930.

### Motion language

* Entrances: `expo.out` 0.7–1.0 s, short travel (16–40 px) or scale from
  0.94–0.97, fade via `autoAlpha`. Secondary items trail by 0.08–0.15 s.
* Exits: `power2.in` 0.35–0.5 s, travel ≤ 30 px. Nothing pops off.
* Icon pops may use `back.out(1.4)`; nothing else bounces.
* Text: `K.textIn` / `K.textOut` (masked per-character rise) for any word
  that is spoken; `K.fadeIn` for secondary text.
* Numbers: `K.counter` (pure function of time) + `K.barIn` accent bar on landing.
* Lines/rings/frames: DrawSVG (`K.drawIn`).
* Everything that is on screen > 1.5 s gets subtle life: `K.float` (3–6 px,
  period 4–7 s) or a slow drift. Never let a frame look frozen.
* De-emphasis = dim to autoAlpha 0.35 (reference behaviour), not removal.
* No hard cuts, no flashes, no particle confetti, no camera shake, no
  motion blur hacks, no emoji, no drop shadows on text.

## Technical contract (must follow)

* Each scene file registers `MG.scene(name, function (tl) {...})` and builds
  its own layer via `K.layer(name, z)`. Only touch your own file. Do **not**
  edit `kit.js`, `chrome.js`, `main.js`, `cues.js`, `style.css` — put any
  helper you need inside your scene file (prefix it to avoid globals).
* Everything is driven by the paused master timeline `tl` (absolute times in
  seconds) or by `K.onFrame(fn(t))` pure functions of time. Never use CSS
  transitions/animations, `Date`, `Math.random` (use `K.rng(seed)`), timers,
  or rAF. Rendering seeks to arbitrary frames in any order; every frame
  must be a pure function of t.
* Before its entrance and after its exit every element must be invisible
  (`autoAlpha: 0`). Use `fromTo` for entrances and `to(..., {immediateRender:false})`
  for later changes of the same property, to avoid GSAP from/to conflicts.
* `K.float` sets the CSS `translate`/`rotate` properties; GSAP owns
  `transform`. Put float on a wrapper if GSAP animates x/y on the same node
  — or just apply float to the node itself (they compose).
* SVG: use `K.svgCanvas(layer)` for a full-stage SVG in stage coordinates.
* Preview: `node tools/render.mjs stills --times 1.0,1.2,1.4 --out <dir>`
  then `python3 tools/contact.py <dir> <sheet.png> 3 640` and look at it.
  Add `--review` to burn in the VO subtitle + timecode. Render densely
  (every 0.1–0.2 s) through transitions to check motion continuity.

## Scene breakdown

### S1 — 單日案例 · 5 月 5 日 (file `src/scenes/s1_ground.js`, window 0 → 6.15)

Chrome: eyebrow 「單日案例 · 5 月 5 日」, title 「把等待留在地面」 (in at 0.0, out 5.30).
Footnote 「CTOT 為時段安排；528 分鐘是累計地面等待時間。」.

Composition (final state ≈ 5.0 s), mirrors reference f_025 but refined:

* **Left group (CTOT)**, x 96–860
  * KPI A at x 96, y 232: label 「時段安排」, number 「38」 + unit 「個 CTOT」.
  * Desk calendar (inline SVG, reference style: two binder rings, light-blue
    header band, navy outline, 3×3 grid, big 「5/5」 in tealDim), ~280×360 at
    x 110–390, y 470–830.
  * 38 mini CTOT tickets (boarding-pass shape with side notches, white fill,
    ticketLine outline, small blue plane glyph left, peach square right),
    grid 5 columns × 8 rows (last row 3) at x 440–860, y 470–830.
* **Right group (ground wait)**, x 980–1824
  * KPI B at x 1000, y 232: label 「累計地面等待」, number 「528」 + unit 「分鐘」.
  * Stopwatch (inline SVG like reference: teal ring, tealSoft face, 12 teal
    ticks, crown + side button, terracotta hand, teal hub), r ≈ 92,
    centre ≈ (1700, 330).
  * `plane_side.png` parked at ~0.92 scale, x ≈ 990, bottom ≈ 841; navy 2px
    ground line y ≈ 843 from x 960 to 1840; faint contact shadow.

Choreography:
* 0.25–0.9 calendar rises in (y 30 → 0, scale .96 → 1).
* 0.45–1.3 「5 月 5 日」: top page showing 「5/4」 flips up and away (3D rotateX
  around the binding, perspective) revealing 「5/5」; terracotta ring draws
  around 「5/5」 0.9–1.4.
* 1.2 KPI A label + number (starting at 0) appear.
* 1.45–2.75 「38 個 CTOT」: tickets are dealt from the calendar to their
  cells along gentle arcs, stagger ≈ 0.032 s, each ≈ 0.5 s expo.out with
  scale .6 → 1 and a small rotation settling to 0. Counter 0 → 38 lands with
  the last ticket (~2.9); accent bar A draws.
* 3.1–3.5 left group dims to 0.35 (KPI A number → tealDim feel).
* 3.22–4.1 right group enters: label, plane slides in from x +80 with fade
  (expo.out), ground line draws left→right, stopwatch pops.
* 3.3–4.6 「累計」: one small teal dot per ticket (38) arcs from its ticket
  into the stopwatch and is absorbed (stagger ≈ 0.025, power2.in); each
  ticket's outline flicks teal as its dot leaves.
* 3.45–4.75 counter 0 → 528 (power2.inOut) **locked** to the stopwatch hand
  spinning 8.8 turns with the same ease (528 min = 8.8 × 60). Eight small
  pips around the dial light one per completed turn. Caption 「約 8 小時 48 分」
  (30px gray) fades in under the stopwatch at 4.85.
* 4.75 counter lands; accent bar B draws; tiny crown press on the stopwatch.
* 4.8–5.45 hold, everything floating subtly.
* 5.45–6.1 exit as a camera tilt-up: the whole S1 layer travels down (y +200)
  and fades (left group leads by 0.08 s). S2 arrives from above.

### S2 — 協調帶來的效益 (file `src/scenes/s2_benefits.js`, window 5.6 → 17.2)

Chrome: 5.62 「協調帶來的效益／減碳、燃油與空中盤旋」 ; 12.30
「ATFM 航空交通流量管理／為航空公司帶來的真實價值」 (chrome draws a terracotta
underline under 「真實價值」 at 15.0) ; everything clears at 16.55.
Footnote 「57.9 噸為原稿案例數據，並非畫面中單架航機的排放量。」.

**Beat A — CO₂ (5.7 → 9.0)**
* Enter from above (camera tilt continuation): elements start y −160 and
  settle 5.7–6.5 expo.out.
* KPI C at x 96, y 232: label 「減少 CO₂」 (subscript ₂ as a smaller lowered
  「2」), number 「57.9」 (decimals 1) + unit 「噸」.
* Sky stage: holding pattern = dashed racetrack loop (tealLine, 4px, round
  dashes) ≈ x 1130–1770, y 260–500; a small top-down airliner glyph circles
  it (MotionPath) 5.9 → 6.9 to read as "airborne holding".
* CO₂ molecules (reference f_027 style: navyMid core + two sky atoms, navy
  outline, bonds), ≈ 12, emitted along the loop behind the glyph, drifting up.
* Hero `plane_fly.png` at ≈ 0.78 scale enters from lower-left 5.8–6.9 and
  drifts slowly up-right (≈ 40 px) through the beat, lower half of frame.
* 6.9 → 7.85 「57.9 噸」: counter 0 → 57.9 while the saving is visualised:
  the loop retracts (DrawSVG to 0), the glyph leaves on a straight line, the
  molecules dissolve one by one (shrink + tiny ring), accent bar at 7.85.
* 8.1 「CO2」: subtle emphasis on the label (e.g. ₂ lifts, tiny pulse).

**Beat B — fuel & holding (9.0 → 12.25)** build a 3-column benefit row
(columns at x 96 / 700 / 1304, width ≈ 520, content y ≈ 300–700):
* 8.95–9.6 KPI C morphs into column 1: molecule icon above, 「57.9 噸」 at
  ≈ 96 px, caption 「CO₂ 減排」. Hero plane accelerates out up-right (take-off
  feel) by 9.8.
* 9.75–10.6 「燃油成本」: column 2 — orange fuel-drop icon draws in, its
  liquid level drains (clip) to show reduction, terracotta down-arrow; text
  「燃油成本」 (≈ 64 px teal) + caption 「地面等待，不在空中耗油」.
* 10.8–12.1 「空中盤旋風險的縮減」: column 3 — holding-loop icon with a small
  plane glyph draws in; on 「縮減」 (11.75) the loop morphs (MorphSVG) into a
  straight arrow; text 「盤旋風險」 + down-arrow; caption 「減少空中等待與盤旋」.

**Beat C — 「這就是 ATFM 為航空公司帶來的真實價值」 (12.25 → 15.95)**
* 12.6–13.4 a thin terracotta sum-line draws under the three columns
  (y ≈ 735); an 「ATFM」 pill (teal fill, white bold letters) centred below it,
  letters revealed one by one 12.85–13.6 (synced to A-T-F-M).
* 13.75–14.6 thin teal connector lines grow from the pill up to each column
  (tree / bracket), columns lift 8 px in sequence.
* 15.0 「真實價值」: the three icons give one synchronized soft pulse.
* 16.55–17.15 exit: columns/pill/lines leave (textOut / fade, stagger L→R).

### S3 — 投入範圍 → 公共價值 (file `src/scenes/s3_cost.js`, window 17.0 → 30.03)

Chrome: 17.25 「03　投入範圍／硬體投入，自主研發完成」, footnote
「645 萬元僅對應硬體費用；全案的人力、研發、建置與維護須另依口徑核算。」;
24.45 「04　公共價值／為國家節省公帑」, footnote 「以 645 萬元為 1 格；約 4 億元 ≈ 62 格。」.

**Beat A — rack & 645 (17.3 → 24.3)**, mirrors reference f_044:
* `rack.png` at x 150, y 262 inside a terracotta frame (stroke 4, x 128–724,
  y 244–836) that draws on 17.5–18.4.
* 17.6–18.9 rack assembles: cabinet revealed bottom→top, then the units
  (switch ≈ y 60–95, servers, storage — measure the PNG) slide in from the
  right one by one; cables draw (overlay paths matching the blue cables) or
  simply reveal.
* 18.6–19.4 status LEDs blink on unit by unit, then keep a slow idle blink.
* 19.6–19.95 terracotta connector from the frame (724, 350) to (905, 350).
* 19.7 label 「硬體費用」 (40 px/500) at (952, 312); 19.85–20.85 counter
  0 → 645 (≈ 220 px/700) + 「萬元」 (≈ 64 px); accent bar at landing.
* 20.9 secondary 「伺服器與網路設備」 (32 px gray).
* 22.4–23.2 「自主研發完成」: teal pill badge with white text + a check that
  draws; all rack LEDs turn teal together and a soft light sweep passes over
  the rack.

**Beat B — transition (24.25 → 25.1)**: rack, frame, connector and texts exit
left; the 「645」 collapses into a terracotta unit square (≈ 50×50) that flies
to its place next to the grid.

**Beat C — 4 億 (25.04 → 30.03)**
* Left: label 「為國家節省」 (34 px/500) at (96, 250) from 25.1; KPI 「約」
  (60 px) + 「4」 (≈ 230 px, digit rolls 0→4 inside a mask) + 「億元」 (≈ 72 px)
  revealed 26.35–27.0; accent bar 27.0; caption 「約為硬體投入的 62 倍」
  (32 px gray) at 27.25.
* Right: 62 teal squares (cell ≈ 50, gap ≈ 12, 10 columns, last row 2) at
  x ≈ 1150–1758, y ≈ 330–752. 25.2–26.5 they spawn from the terracotta unit
  square in a wave (stagger ≈ 0.017, each ≈ 0.55 s expo.out, scale .3 → 1).
* Legend bottom-left (y ≈ 840): terra square 「硬體投入 645 萬元」 · teal
  square 「節省 約 4 億元」.
* 27.9 → 30.03 hold: one slow diagonal shimmer across the grid (~28.3),
  terracotta unit square breathes once, whole content layer pushes in
  scale 1 → 1.015.
