# ATFM v5 — STORYBOARD (final, director's cut)

**Concept.** *Flow management = even spacing.* v4's form stays one-to-one: map overview, airport pair, boundary diagram, 區域 relay, map recap. Every v4 card now does something. Two calm machines run side by side: the map keeps air traffic moving at even intervals, and the ATFM panel visibly turns each constraint into new departure times. Flights then leave exactly on the clock and land or cross into the slots that remain (1·3·5 of 5).

Base: "faithful". Grafted: from "system", the 5-step grammar, the status pill, sliding slot letters, the gate capsule, the panel-frame handoff, the zone morph, Taipei in the relay and the hero flight. From "cinematic", the zoom-aware shadow fix, 20 px tags, the 「全方位」 route sweep and D crossing BP on the VO10 beat. Every judge objection is fixed below; see §0.6.

---

## 0. Global

### 0.1 Pre-build tasks (do these first, in this order)

| # | file | change | why |
|---|---|---|---|
| P1 | `tools/build-map.mjs` → regenerate `assets/map-data.js` | Replace the bbox filter `inTW` (lon 119.2–122.2, lat 21.7–25.45) with an **allow-list by ring centroid**. Allow: main island and its islets (lon 119.95–122.05, lat 21.85–25.35: Green Island, Lanyu, Xiaoliuqiu, Guishan, Waisanding), Penghu (119.30–119.75, 23.15–23.85), Wuqiu (119.43–119.50, 24.95–25.01), Kinmen (118.18–118.52, 24.36–24.56) and Matsu (119.85–120.55, 25.90–26.40). **Explicitly exclude Nanri Island** (119.44–119.57, 25.17–25.25). It is PRC-administered, but the current bbox puts it in `M.taiwan` as ring 3, so it would be painted gold. Also **dedupe identical rings**: rings 15–21 duplicate 8–14. Put Kinmen, Matsu and Wuqiu behind `const TW_OUTLYING = true`. | Accuracy guardrail (DESIGN §9). Client question Q1 below. |
| P2 | `assets/atfm-kit.js` | **(a) Already in the kit (commit f438a97) — do NOT edit `K.placePlane`.** The shadow offset is `off = s*(4.5 + a*22)` with `s = __base/z` for map planes, so it is constant on screen at any zoom. (The old `off = 3 + a*14*s*1.6` line no longer exists; re-applying the earlier patch would bring the drift back.) **(b) Already in the kit: `K.reveal(tl, path, t, dur, {id, width, ease, from, to})`.** It adds a userSpace `<mask id>` holding a white copy of the path's `d` (stroke `width` in the path's own user units, round caps), puts `mask=url(#id)` on the visible path and tweens `drawSVG "from% from%" → "from% to%"` on the copy; it returns the copy. Every masked draw in this storyboard uses it: **map lines width 40 (world units), screen-space dashed links width 12**, ids prefixed `cN-rv-…` and unique. There is no `K.maskLine`; call `K.reveal` once per path. **(c)** Add `K.legs(tl, plane, path, t0, legs)`: it chains `K.fly` with no gaps. Only leg 0 gets `immediateRender:true`; every later leg gets `immediateRender:false`. Each leg is `{to, dur, ease, alt0, alt1, squash0, squash1}`, and `from` is the previous `to` (leg 0 takes `from`). **(d)** Add `K.fracAt(path, x, y)`: it samples 800 points with `getPointAtLength` and returns s/L of the nearest point. Use it for every breakpoint below. The listed fractions are reference values to assert against (±0.002). | Judges: shadow drift at zoom (fixed); DrawSVG is not zoom-safe on non-scaling or dashed strokes (K.reveal); immediateRender trap. |
| P3 | `assets/atfm.css` | `.k-tag{font-size:20px}` · `.k-panel-bar .k-bar-right{font-size:20px}` · `.k-panel-head{font-size:20px}` · new `.k-pill` (h 30, r 9, padding 0 12, 20/700, display inline-flex, align center). | Text ≥ 20 px everywhere (contract). |
| P4 | `assets/atfm-world.js` (new) + `<script>` in `index.html` after `atfm-kit.js` | `window.ATFM_WORLD = {PT, ROUTE, CAM, STYLE}` (values in §0.4). c1 and c5 both read it, so the recap is the same map, pixel for pixel. | Shared constants (cinematic graft). |
| P5 | fonts | After copy is in place, run `python3 tools/subset-fonts.py`. `✓` and `→` exist in Noto Sans TC. Use `✓` only in Sans text, never in Mono. | Build contract. |

### 0.2 Layering, camera language and recurring motifs

- **Two layers per non-map scene.** `#cN-stage` is the *world* layer: airports, routes, planes, weather, zones, boundary. It drifts slowly, always one continuous tween. `#cN-ui` is the *UI* layer: panel, slot card, chips and signal links. It never drifts. The result is gentle parallax, and every UI handoff across scenes is pixel-exact. A link that starts under a UI card starts **≥ 30 px inside** that card's edge, so drift can never expose its end.
- **Map scenes (c1, c5)** move only through `K.camTo`, chained gaplessly. Pushes use `sine.inOut`; the zoom-through uses `power2.in` and its settle uses `power3.out`. Pins and `mapFixed` own the outer transform, so **only animate their inner child**. A pinned label may pop only while its whole box is inside the opaque band (y 238–842) for the camera state at that moment. Check it with the same `cam` interpolation: linear cx/cy, log z, then the ease.
- **Recurring motifs:**
  - (1) Even spacing on every route.
  - (2) The **slot card**: flight letters sit above the slots, slots 2 and 4 go `off`, the affected letters slide to slots 3 and 5, and a **tick** lands when the flight lands or crosses.
  - (3) The **ATFM panel** with a status pill.
  - (4) **Dashed signal links** with a travelling packet. A terra packet carries constraint info into the panel; a teal packet carries the dispatch out.
  - (5) **Gold = Taiwan identity**: the island, the Taipei node in c4, the gold FIR in c5.
  - (6) Pulses fire **only on real events**: a landing, a crossing, an arrival. The one exception is the small FIR **edge-dot sweep** (r 6 → 20–22) in c1 「全方位」 and the c5 close. Its west step is always BPW's *real* crossing pulse, so no node ever gets a fake pulse and no two pulses overlap on one circle.
- **One grammar, used twice (c2 and c3).** Constraint → slots drop → detect (input link + pill 「已偵測」) → recompute and dispatch (pill 「計算中」, letters slide, **signal first, then values roll**, pill 「✓ 已派發」) → result. In the result, flights leave exactly when the panel clock reaches their time, 1.4 s apart (= 10 min), and tick their slot on landing or crossing. The **first flight keeps its slot and time** (A, D). Only the affected flights (B, C, E, F) are re-timed. This is the accurate model and the easiest to read. The panel always **enters in S0 「監控中」** and goes S0 → S1 only when the terra input packet arrives. Each lettered plane keeps its letter tag and time tag through the take-off roll; both fade (0.20 s, power2.in) at its **lift-off**. Unlettered traffic (N1, N2, T1, T2) carries no tags.

### 0.3 ATFM panel component (identical in c2 and c3)

- `K.panel({x, y:228, w:560, title:"ATFM 流量管理系統", clock:"10:01" (c3: "09:30"), cols:"110px 76px 30px 92px 1fr", rows})`. **No head row.** The clock is driven by one `count` tween per scene at 7.143 min/s (10 min = 1.4 s).
- Row height is overridden to 48: `row.style.height="48px"`. The panel is therefore 54 + 3×48 + 2 = **200 px tall (y 228–428)**.
- **Bar:** LED · title · `.k-pill` stack (margin-left auto, w 116) · clock (`.k-bar-right`, `count` plugin, fmt "time", margin-left 14).
- **Pill states,** stacked absolutely and switched only by 0.25 s opacity crossfades:

  | state | text | background | text colour |
  |---|---|---|---|
  | S0 | 監控中 | #E1EEE8 | #1F6B62 |
  | S1 | 已偵測 | #F2DDD3 | #B25135 |
  | S2 | 計算中 | #FBF7F2 + 1.5 px #A9C7BD ring | #1F6B62 |
  | S3 | ✓ 已派發 | #E1EEE8 | #1F6B62 |

- **LED:** `#9fe0c9` in S0 and S3; `#B25135` in S1 and S2. There is **one** soft ring pulse on detect (box-shadow 0→8 px, rgba(178,81,53,.35)→0, 0.6 s). **No blinking, no progress bar.**
- **Row cells:**
  - `航班 X`: 24/600 ink.
  - Original time: `.k-num` 22/600 #6E6A64, with a 1.5 px #6E6A64 strike line on top (scaleX 0, origin left).
  - `→`: 20/500 #6E6A64.
  - New time: `K.roll(t,{h:34})` in a mono 24/600 #1F6B62 wrapper, opacity 0.45 until it rolls.
  - Tag stack: a 120×34 holder with absolutely stacked `K.tag`s.
- Set `gsap.set(row.__hl,{opacity:0})` at build time, because the CSS shows it by default.

### 0.4 Shared map data (`ATFM_WORLD`, world units; d = `K.smooth(points)`)

| key | value |
|---|---|
| `PT.RCTP` | (7.7, −50.2) |
| `PT.RCKH` | (−21.6, 40.5) |
| `PT.BPW` | boundary point on the FIR **west edge**, 117.5°E 22.4°N: (−116.1, 47.0). Open sea. |
| `PT.TWC` | Taiwan centroid: (1, 3) |
| `PT.FIR_SE` | (99.5, 14.5) |
| FIR-edge crossing dots | where each route crosses the FIR outline (computed on the `K.smooth` curves): `X_N` (23.8, −112.2) on SN · `X_E1` (99.5, −59.45) on R01 · `X_E2` (99.5, −17.6) on R02 · `X_S` (−29.9, 96.8) on SS · W = BPW (−116.1, 47.0) on R02/RH. The east dots sit exactly on the 124°E edge (x 99.5). |
| `ROUTE.R01` | arrival into RCTP from the ENE: [[900,−215],[520,−140],[240,−85],[90,−58],[7.7,−50.2]]. L 907.8. Enters the FIR at frac 0.8985. |
| `ROUTE.R02` | transit, SW → BPW → over central Taiwan → E: [[−560,420],[−380,235],[−230,118],[−116.1,47],[−55,16],[10,−2],[120,−20],[400,−45],[900,−95]]. L 1614.1. **BPW frac 0.3611**; exits the FIR at frac 0.5019. |
| `ROUTE.SN` | arrival from the N: [[330,−640],[170,−360],[48,−160],[18,−95],[7.7,−50.2]]. L 674.6. |
| `ROUTE.SS` | departure from RCKH, southbound: [[−21.6,40.5],[−30,100],[−26,240],[0,420]]. L 382.2. |
| `ROUTE.RH` | the hero, c5 only, SW → BPW → strait → RCTP: [[−560,420],[−380,235],[−230,118],[−116.1,47],[−84,13],[−44,−22],[7.7,−50.2]]. L 742.0. **BPW frac 0.7854**. Shares the R02 segment up to BPW. |
| `CAM.F0` | {cx −20, cy −40, z 1.00}: v4 framing; Taiwan sits at x 949–1013 like v4's centre. |
| `CAM.F0d` | {−14, −42, 1.04} |
| `CAM.F1` | {−8, −50, 1.90}: FIR at x 755–1164, y 262–819 |
| `CAM.F2` | {−120.87, −75.91, 4.20}: RCTP lands at **(1500, 648) = c2 destination airport centre** |
| `CAM.F2z` | {−102.5, −72.24, 4.90}: RCTP is still at (1500, 648) (cx = 7.7 − 540/z, cy = −50.2 − 108/z). F2 → F2z (×1.167) mirrors the c2 DST's 0.86 → 1 scale (×1.163). Drift of RCTP during the move ≤ 1.5 px. |
| `CAM.S` | {0, 39.7, 3.00}: Taiwan centre at (963, 430) = c4 Taipei node |
| `CAM.B` | {−5, −45, 1.60}: FIR at x 782–1127, y 298–767 |
| `CAM.FB` | {−2, −46, 1.72} |
| `CAM.FBp` | {0, −47, 1.78} |

- **Styles:**
  - R01 and R02: #1F6B62, 5 px, non-scaling, round caps.
  - SN and SS: #3E8C80, 3 px.
  - RH: #1F6B62, 4 px.
  - Hero highlight: #3E8C80, 7 px, opacity 0.5.
  - Map nodes: `K.node` r 9 (BPW r 8) + `K.mapFixed`.
- **Map planes:** `K.plane({len:40})` (c5 `len:34`) + `K.mapPlane`. Ease is always `"none"`, and they **never take `trail`**: a trail on a non-scaling path detaches when zoomed.
- **Plane position rule:** f(t) = f_event − (T_event − t)·V/L, with L taken from `getTotalLength()` at build time. A plane fades in over 0.3 s when it spawns on screen, and fades over its last 0.3 s at its end.
- **Draw rule:** **every map line that draws on uses `K.reveal(tl, path, t, dur, {id, width:40, ease})`**, which draws its mask copy. That includes the dashed `L.firLine`. DrawSVG directly on a map path is forbidden. A map line that is already fully drawn (c5) gets no mask at all.

### 0.5 Global timing — every VO line → visible beat (0.1–0.3 s after the line starts)

| VO | start | line | scene | beat (G) | what lands |
|---|---|---|---|---|---|
| 1 | 0.000 | ATFM 系統現階段提供 2 種流量管理功能 | c1 | 0.10 · 2.90 | Band opens and graticule rises · chips 01 and 02 on 「2 種」 |
| 2 | 5.305 | 全方位守護臺灣的天空 | c1 | 5.45 · 5.55 · 5.58 · 6.00 | Push to the FIR · FIR fill brightens · edge dots light clockwise N → E → S → W (「全方位」, W = the real BPW crossing at 6.35) · guardian rings (「守護」) |
| 3 | 7.574 | 第一 機場端流量管理 | c2 | 7.70 | The zoom-through lands at 7.70 with RCTP exactly on (1500, 648); the destination airport rises out of RCTP while the map settles F2 → F2z |
| 4 | 10.911 | 當目的地機場因天氣或跑道維護等因素 | c2 | 11.05 · 12.85 · 13.65 | 目的地機場 turns terra · cloud on 「天氣」 · runway hatch on 「跑道」 |
| 5 | 15.566 | 而降低機場到場容量時 | c2 | 15.85 | Slots 2 and 4 go off (5 → 3), B and C hold |
| 6 | 18.652 | 系統會自動重新派發起飛機場航班的起飛時間 | c2 | 18.76 · 18.98 · 19.50 · 19.95 · 20.24 · 23.12 | Panel enters (監控中) · 已偵測 on packet arrival · 計算中 + letters slide (「自動」), then the dispatch signal · B released at 10:10 · ✓ 已派發 (「派發」) · B lands, slot 3 ticked |
| 7 | 23.907 | 第二 邊境點流量管理 | c3 | 24.05 | Boundary draws while the panel glides into the Taipei FIR zone |
| 8 | 26.960 | 當邊境點受到流管限制時 | c3 | 27.10 | BP turns terra, the gate closes, slots 2 and 4 go off |
| 9 | 30.080 | 系統能自動調控並派發過境航班的起飛時間 | c3 | 30.20 · 30.95 · 31.19 · 31.90 | 計算中 · dispatch signal draws · its packet crosses the boundary (ring) · D released |
| 10 | 34.751 | 達到跨區作業整合目的 | c3 | 34.90 · 35.00 | D crosses BP in slot 1 · mint spreads over both regions |
| 11 | 37.771 | 這是一場超越國界的接力賽 | c4 | 37.88 · 38.52 · 39.88 | Nodes pop · baton handed across each border with the plane |
| 12 | 40.974 | 這 2 項功能相互配合 | c5 | 41.10 · 41.45 · 41.60 · 42.15 · 43.05 | Anchor nodes pop · chip 02 · hero crosses BPW (02) · chip 01 (「相互配合」, once its box is inside the band) · hero lands at RCTP (01) |
| 13 | 43.727 | 讓臺北飛航情報區的天空運作更加順暢 | c5 | 43.85 · 43.90 · 44.90 | Push in · gold FIR draw (「臺北飛航情報區」) · FIR label · even flows to the end |

**Speeds:**

| scene | speed |
|---|---|
| c1 | 120 wu/s |
| c2 | 360 px/s (eased roll and rollout keep speed continuous: power2.in over L ends at 2L/T) |
| c3 | 260 px/s |
| c4 | ~440 px/s (the 「接力賽」 sprint) |
| c5 | 110 wu/s |

**Release spacing** is 1.4 s (= 10 clock minutes) in both functions.

**Plane instances:**

| scene | instances | ≤ visible at once |
|---|---|---|
| c1 | 14 | 10 |
| c2 | 5 (N1, N2, A, B, C) | 5 |
| c3 | 5 (T1, T2, D, E, F) | 5 |
| c4 | 1 | 1 |
| c5 | 15 | 9 |

### 0.6 Judge objections → resolution

| objection | resolution |
|---|---|
| D1 node on land at the China–Laos–Vietnam tri-point | No off-FIR nodes at all. Routes enter from off-frame; the only nodes are RCTP, RCKH and BPW. |
| BP on the east edge in c1 but the neighbour on the left in c3 | BP is on the **west edge** (117.5°E) in c1 and c5, matching c3's left-hand neighbour and vertical boundary. |
| c2 loop never closes; C never released | A (keeps its time) lands and ticks slot 1 at 18.30. B lands and ticks slot 3 at 23.12, inside VO6. C is released at 21.35. |
| ROUTE2 sags to y 700 | The destination airport is **mirrored**, so planes fly a true **rising ∩ arc** between the two runway ends (apex y 472), like v4. |
| Rolls before the signal | The signal draws first in both functions; values roll only after the packet arrives. |
| Plain c2→c3 and c3→c4 fades | Panel-frame handoff + glide (c2→c3); mint zone morphs into the c4 centre column (c3→c4); Taipei node scales into Taiwan (c4→c5). |
| Text under 20 px | Tags, letters, clock and pills are all ≥ 20 (P3). |
| chip01 anchored over the Gulf of Tonkin | chip01 is pinned to **RCTP**, chip02 to **BPW**, both with leaders. |
| Stage-drift gaps; misregistered handoffs | One continuous drift tween per scene. UI layers don't drift; the c3 drift returns to exactly 1.0 by 37.20 for the zone morph. |
| Rotating throttle ring reads as HUD | Replaced by the gate capsule (opens per metered crossing). |
| 600 px/s, 0.75 s spacing (system) | 360 px/s with eased roll and rollout, 1.4 s spacing. |
| ~25 planes in c5 | 15 instances, ≤ 9 visible. S_S is drawn only at VO13. |
| Taipei absent from the relay | c4 = 區域 A → **臺北飛航情報區 (gold node)** → 區域 B, keeping v4's form and micro-labels. |
| Kinmen/Matsu; Taiwan height | P1 fixes the gold layer (and removes Nanri). Taiwan main island is **122 wu tall**, not 80. |
| Political anchoring (cinematic) | No real-place nodes or labels outside Taiwan; no routes from or to named foreign airports; neighbours stay 區域 A/B and 鄰近飛航情報區. |
| Truck raster | Not used. Cloud raster plus vector hatch and cones only. |

### 0.7 Client questions (raise before final render)

- **Q1.** Gold highlight for Kinmen, Matsu and Wuqiu. Default is **on**: they are Taiwan-administered but sit outside the Taipei FIR polygon, next to the mainland coast. Toggle `TW_OUTLYING`.
- **Q2.** The destination airport raster is **mirrored** (scaleX −1 on the `<img>`, aspect unchanged) so the flight arc can rise like v4's. Is that acceptable?
- **Q3.** All times, slots and routes are illustrative; the footnote already says so.

---

## Frame 1 — c1-map-intro
status: outline
src: compositions/c1-map-intro.html
window: 0.0–8.2

### Purpose

- **VO1** 「ATFM 系統現階段提供 2 種流量管理功能」: the v4 map overview, now with **Taiwan in gold** and the **Taipei FIR**. Two calm traffic streams; chip **01 pinned at Taoyuan (RCTP)**, chip **02 pinned at the boundary point on the FIR west edge (BPW)**.
- **VO2** 「全方位守護臺灣的天空」: push in until the FIR fills the band. Routes from N/E/S/W light up around the FIR in turn, and guardian rings sweep out from Taiwan, clipped to the FIR.
- **Out:** zoom-through into RCTP, which becomes the c2 destination airport.

### Layout (z low → high; all map items via kit)

| z | element | spec |
|---|---|---|
| 1 | `#c1-band` | div, inset 0 (wrapper used for the clip-path band reveal) |
| 1 | `m = K.map(#c1-band, {id:"c1", band:[220,860], feather:36, cam:CAM.F0})` | — |
| map | `L.grat` | opacity 0 |
| map | `L.taiwan` | fill → #E9D9B0, stroke → #A8761A |
| map | `L.firFill` | opacity 0 |
| map | `L.firLine` | dashed 12/9 teal 2.4 (kit default); drawn with `K.reveal(tl, L.firLine, 0.20, 1.50, {id:"c1-rv-fir", width:40, ease:"expo.inOut"})` |
| map | `m.under` → Taiwan halo | two copies of `M.taiwan`, stroke #E9D9B0, non-scaling, 16 px @ 0.5 and 30 px @ 0.25, inside `<g opacity=0>` |
| map | `m.world` → routes | R01, R02, SN, SS as `<path>` (styles §0.4, `vector-effect:non-scaling-stroke`), each drawn with `K.reveal` (ids `c1-rv-r01`, `c1-rv-r02`, `c1-rv-sn`, `c1-rv-ss`; width 40) at the times in Beats |
| map | `m.world` → guardian rings | 3 `<circle cx=1 cy=3 r=20>`, stroke #3E8C80 1.6 non-scaling, fill none, opacity 0, `clip-path=url(#c1-firclip)` (clipPath = FIR d) |
| map | `m.world` → planes | 14 × `K.plane({len:40})` + `K.mapPlane` (see Aircraft) |
| map | `m.top` | nodes RCTP (r 9 teal), BPW (r 8 teal), RCKH (r 5 teal-2) + 4 edge dots `X_N`, `X_E1`, `X_E2`, `X_S` (r 6 #3E8C80 with card ring), each `K.mapFixed(m, g, x, y, 1)`. Each `g` holds an inner `<g class=c1-in>` (animated) and a pulse circle (`K.pulse`). |
| pins | **chip01** | `K.pin(m, wrap, RCTP, 0, 0)` → inner `.c1-in`: SVG leader (0,0)→(168,−108), teal 2 px + 4 px dot at the chip end, plus `K.chip` card chip at left 160, top −160. At F0: chip box x 1148–1438, y 370–422; clears R01 plane wingtips by ≈ 12 px. |
| pins | **chip02** | `K.pin(m, wrap, BPW, 0, 0)` → leader (0,0)→(24,49) + chip at left 20, top 49. At F0: box x 884–1174, y 676–728, over the Bashi Channel, 31 px below Taiwan's south tip, with R02 above it. |

### Copy

`01　機場端流量管理` · `02　邊境點流量管理`. In each chip, `01`/`02` is `<span>` mono 24/600 #3E8C80, gap 12; the phrase is 24/700 teal. Nothing else; the header is owned by the root.

### Beats

| L | G | element | action / props | dur | ease |
|---|---|---|---|---|---|
| 0.00 | 0.00 | `#c1-band` | clip-path `inset(50% 0 50% 0)` → `inset(0% 0 0% 0)` | 0.85 | expo.out |
| 0.00 | 0.00 | camera | `camTo` F0 → F0d | 5.45 | sine.inOut |
| 0.10 | 0.10 | `L.grat` | opacity 0 → 0.32 (**VO1 beat**) | 1.00 | power2.out |
| 0.20 | 0.20 | `L.firLine` | set opacity 1; `K.reveal` id `c1-rv-fir` (mask copy draws 0% → 100%) | 1.50 | expo.inOut |
| 0.30 | 0.30 | `L.taiwan` | fill/stroke to gold | 0.60 | power2.out |
| 0.50 | 0.50 | halo group | opacity 0 → 0.7, then → 0.25 at 1.00 (0.9, sine.inOut) | 0.50 | power2.out |
| 1.20 | 1.20 | R01 | `K.reveal` `c1-rv-r01` (east end → RCTP); 97 % drawn by 1.90 | 1.00 | expo.inOut |
| 1.30 | 1.30 | `L.firFill` | opacity 0 → 0.10 | 0.80 | power2.out |
| 1.30 | 1.30 | R02 | `K.reveal` `c1-rv-r02` (SW → E). Starts at 1.30 so it is 87 % drawn at 1.90, ahead of the leading R02 plane (frac 0.342); a 1.40/1.20 draw would be only 16 % drawn there | 1.00 | expo.inOut |
| 1.90 | 1.90 | planes R01 ×4, R02 ×4 | opacity 0 → 1 | 0.30 | power1.out |
| 2.00 | 2.00 | BPW node inner | K.pop from 0.6 | 0.55 | back.out(1.5) |
| 2.15 | 2.15 | RCTP node inner | K.pop; BPW pulse (R02 plane crosses) | 0.55 | back.out(1.5) |
| 2.85 | 2.85 | chip01 leader | drawSVG 0 → 100% (screen SVG, solid) | 0.35 | expo.out |
| 2.90 | 2.90 | chip01 chip | K.pop from 0.7 + y 10 → 0 (**「2 種」**) | 0.55 | back.out(1.4) |
| 3.00 / 3.05 | 3.00 / 3.05 | chip02 leader / chip | same | 0.35 / 0.55 | — |
| 3.40 · 4.80 | — | RCTP pulse | r 9 → 32, opacity 0.5 → 0 (R01 landings) | 0.90 | power2.out |
| 3.55 · 4.95 | — | BPW pulse | r 8 → 30 (R02 crossings) | 0.90 | power2.out |
| 5.30 | 5.30 | chips + leaders | K.out on inner | 0.35 | power2.in |
| 5.45 | 5.45 | camera | `camTo` F0d → F1 (**VO2 beat**). 1.50 s is shorter than DESIGN's 2–4 s guide because VO2 lasts only 2.27 s and the dive must land on the VO3 beat; push and dive form one continuous move | 1.50 | sine.inOut |
| 5.55 | 5.55 | `L.firFill` | 0.10 → 0.18 | 1.00 | power2.out |
| 5.60 | 5.60 | SN | `K.reveal` `c1-rv-sn` (north → RCTP) | 0.80 | expo.out |
| 5.58 / 5.77 / 5.96 / 6.15 | 5.58 / 5.77 / 5.96 / 6.15 | dots X_N / X_E1 / X_E2 / X_S | inner pop (0.45, back.out(1.6)), then pulse r 6 → 22 (0.80, power2.out) at +0.10 (**「全方位」, clockwise**, even 0.19–0.20 s steps; X_N lands inside the VO2 window 5.405–5.605; the W step is the real BPW crossing pulse at 6.35) | 0.45 | back.out(1.6) |
| 5.85 | 5.85 | SS + RCKH dot | `K.reveal` `c1-rv-ss` from RCKH; dot inner K.pop | 0.70 | expo.out |
| 6.00 / 6.40 / 6.80 | — | guardian rings | r 20 → 230, opacity 0.55 → 0 (**「守護」**) | 1.60 | power1.out |
| 6.20 · 6.90 | — | RCTP pulse | R01 and SN landings | 0.90 | power2.out |
| 6.35 | 6.35 | BPW pulse | R02 (P2d) crossing, r 8 → 30; also the west step that completes the 「全方位」 circuit (no separate fake pulse) | 0.90 | power2.out |
| 6.45 | 6.45 | halo | 0.25 → 0.8 (0.6, power2.out), then → 0.35 at 7.05 (0.9) (**「臺灣」**) | — | — |
| 6.95 | 6.95 | camera | `camTo` F1 → F2 (zoom-through). RCTP travels (990, 540) → (1500, 648) and lands **exactly at 7.70**, the c2 VO3 beat | 0.75 | power2.in |
| 6.95 | 6.95 | RCTP node inner | scale 1 → 1.8 | 0.75 | power2.in |
| 7.50 | 7.50 | `#c1-band` | opacity 1 → 0 | 0.65 | power2.in |
| 7.60 | 7.60 | RCTP pulse | P1d lands; the dive follows it in | 0.60 | power2.out |
| 7.70 | 7.70 | camera | `camTo` F2 → F2z (settle, RCTP held at (1500, 648) ± 1.5 px; matches the DST's 0.86 → 1 scale-up) | 0.50 | power3.out |

### Aircraft choreography (V = 120 wu/s, ease none, alt 1)

| route | plane | event (G) | spawn G @ frac | ends |
|---|---|---|---|---|
| R01 | P1a | lands RCTP 3.40 | 1.90 @ 0.802 | fades 3.10–3.40 |
| R01 | P1b | lands 4.80 | 1.90 @ 0.617 | — |
| R01 | P1c | lands 6.20 | 1.90 @ 0.432 | — |
| R01 | P1d | lands 7.60 | 1.90 @ 0.247 | — |
| R02 | P2a–P2d | cross BPW at 2.15 / 3.55 / 4.95 / 6.35 | 1.90 @ 0.342 / 0.238 / 0.134 / 0.030 | continue to frac 1, off-frame right (still on screen at 8.2) |
| R02 | P2e | crosses BPW 7.75 | spawns 2.89 @ 0 (off-band) | — |
| SN | PNa | lands 6.90 | 5.75 @ 0.795 | — |
| SN | PNb | — | 5.75 @ 0.40 | exits with the scene |
| SS | PSa | departs RCKH 6.30 @ frac 0 | squash none, alt 0 → 1 over the first 0.4 s | exits the band bottom ≈ 6.9 (at F1) |

Spacing is 1.4 s on R01 and R02 alike: orderly sky from the first frame.

### Transition in/out

- **In:** the band opens from its centre line.
- **Out:** zoom-through. The F1 → F2 dive (6.95–7.70, power2.in) puts RCTP at (1500, 648) exactly at 7.70, where c2's destination airport rises. F2 → F2z (7.70–8.20, power3.out) keeps RCTP fixed while z goes 4.2 → 4.9, in step with the DST's 0.86 → 1 scale. `#c1-band` fades 7.50–8.15 (opacity ≈ 0.9 at 7.70, ≈ 0 by 8.15).
- **c2 side:** see Frame 2 *Transition in* (DST rises at 7.70, DEP slides in at 7.80).

### Ambient loops

- Camera (F0 → F0d 0–5.45 · → F1 5.45–6.95 · → F2 6.95–7.70 · → F2z 7.70–8.20, gapless).
- Planes on every route.
- Event pulses only.

### Build notes

- Every map line, the FIR included, draws on with `K.reveal` (width 40). Never DrawSVG a map path directly.
- Set `L.firLine` opacity 1 at 0.20, **inside** its mask (never fade a dashed line in).
- Pins and `mapFixed`: animate `.c1-in` only.
- The clip-path sits on the outer `#c1-band`; the band mask-image stays on `m.wrap`. Never put both on one element.
- `L.halo1/L.halo2` → opacity 0 at 6.95 (0.3, power1.in) if zoom frames are slow (land path ≈ 600 KB).
- Planes use `K.legs`/`K.fly` with explicit `from`; P2e's first tween starts at 2.89.
- Read the BPW frac at runtime with `K.fracAt` (expect 0.3611).

---

## Frame 2 — c2-airport
status: outline
src: compositions/c2-airport.html
window: 7.4–24.3

### Purpose

- **VO3**: normal flow between the departure airport and the destination airport, which is Taoyuan from c1.
- **VO4**: weather and runway works at the destination.
- **VO5**: arrival slots 5 → 3; the affected flights B and C wait on the ground (A keeps its slot and has already left).
- **VO6**: the system detects, recomputes and **dispatches** new departure times. B leaves at 10:10 and C at 10:20, 1.4 s apart. B lands in its slot and slot 3 ticks, closing the loop on screen.

### Layout (L = G − 7.4)

**World layer `#c2-stage`** (z 1–2; drift tween origin 960 560):

| order | element | spec |
|---|---|---|
| 1 | glow | div 1230–1770 × 540–820, `radial-gradient(closest-side, rgba(178,81,53,.18), transparent)`, opacity 0 |
| 2 | DEP | `K.airport({x:120, y:486, w:600})` (k 0.375). Runway R(u) = (161.25 + 457.5u, 611.6 − 101.6u); E = R(1) = (618.75, 510). Taxiway H(u) = R(u) + (6.5, 29.3). **LU** = R(0.50) = (390.0, 560.8); **Q1** = H(0.36) = (332.4, 604.3); **Q2** = H(0.22) = (268.4, 618.6); **Q3** = H(0.08) = (204.4, 632.8). |
| 3 | DST (mirrored) | `K.airport({x:1200, y:486, w:600})`, then `gsap.set(dstImg, {scaleX:-1})` on the inner `<img>` only. Runway (landing direction, +12.5°): R′(u) = (1301.25 + 457.5u, 510 + 101.6u). **TD** = R′(0.10) = (1347.0, 520.2); **RO** = R′(0.46) = (1511.7, 556.8). Centre (1500, 648). |
| 4 | FX svg 1920×1080 | **ROUTE2** (visible arc) `M618.75 510Q960 434.35 1301.25 510`, #A9C7BD 4 px, round. **Apex y 472.2**; tangents ±12.5° match both runways. |
| 4 | FX svg | **FLT2** (hidden): `M390 560.81L545.55 526.26L618.75 510Q960 434.35 1301.25 510L1347 520.16L1511.7 556.75`. L 1138.0; fracs LU 0 · **LO 0.1400** · **E 0.2059** · **H′ 0.8106** · **TD 0.8517** · RO 1. |
| 4 | FX svg | **TURN2** `M1511.7 556.75C1541 563.2 1556 588 1586 598` (85.6) |
| 4 | FX svg | **MERGE** Q1 → LU `M332.45 604.34C356.85 598.94 365.6 566.21 390 560.81` (73.5) |
| 4 | FX svg | **TAXI** Q2 → Q1 `M268.4 618.57L332.45 604.34` and Q3 → Q2 `M204.35 632.79L268.4 618.57` (65.6 each) |
| 4 | FX svg | **hatch**: `<g transform="translate(1566.6 568.9) rotate(12.5)">` with rect x 0, y −11, w 159.3, h 22, rx 3. Fill: 45° pattern `c2-hatch` (terra 4 / terra-soft 6), stroke #B25135 1.5. Animate scaleX on an inner g, origin 0% 50%. Covers R′(0.58)–R′(0.92). |
| 4 | FX svg | **cones**: 3 × `K.cones({n:1, h:20})`, bottom-centres at R′(0.62) (1584.9, 573.0), R′(0.72) (1630.7, 583.2), R′(0.82) (1676.4, 593.3) |
| 4 | FX svg | **planes** N1, N2, A, B, C: `K.plane({len:52})`; ground uses alt 0, squash 0.55. Children of **A, B, C only** (N1 and N2 carry no tags): **letter tag** `<g transform="translate(0 30)">`, circle r 15 fill #FBF7F2, 2 px ring + 20/700 letter (ink-soft neutral, terra hold, teal dispatched); **hold ring** circle r 22, fill none, stroke #B25135 2 px, opacity 0; **time tag** `<g transform="translate(0 −40)">`, rect x −38 y −15 76×30 r 8 fill #FBF7F2 stroke #A9C7BD 1.5 + mono 20/600 #1F6B62 centred, opacity 0. Letter + time tags fade 0.20 power2.in at lift-off: A 16.02, B 20.84, C 22.24. |
| 5 | rain svg | `K.rain(tl, svg, {id:"c2-rain", x:1370, y:470, w:150, h:92, n:12, t0:L 5.55, t1:L 16.85})` |
| 6 | cloud | `K.img({src:K.PROPS.cloud.src, x:1352, y:404, w:180})` (h 94 → y 404–498), opacity 0 |
| 7 | labels | `.k-label` 26/700 teal, `xPercent:−50`: `起飛機場` at (420, top 818); `目的地機場` at (1500, top 818). Underline: div 120×3 at (1440, 856), #B25135, scaleX 0. |

**UI layer `#c2-ui`** (z 3, never drifts):

| order | element | spec |
|---|---|---|
| 1 | links svg | **INLINK** `M1370 320L1210 320` (L 160): dashed #3E8C80 3 px 10/12, drawn with `K.reveal` id `c2-rv-in`, width 12; packet circle r 6 #B25135 (moved with the `along` plugin, `rotate:false`). Visible only between card and panel (1250–1330). **SIG2** `K.smooth([[740,388],[640,402],[520,440],[356,480]])` (L 395.8): dashed #3E8C80 3 px 10/12, `K.reveal` id `c2-rv-sig`, width 12; packet r 6 #3E8C80. Starts 50 px inside the panel and ends 10 px inside the DEP chip (chip y 440–492). |
| 2 | slot card | `K.card({x:1330, y:236, w:440, h:150})`. Title `到場容量` (30/700; the VO/header term, never the header's full line). Right-aligned `可用時段` (20/500 ink-soft) + `K.roll("5",{h:34})` (mono 26/600 teal). Letters A/B/C (20/700) centred above slot centres x 1392 / 1468 / 1544, top 322. `K.slots(5×on)` at top 348; slot centres x 1392 + 76i. Per slot: tick svg centred on the slot (path `M-7 0L-2 5L8-5`, stroke #FBF7F2 2.5, round caps, drawSVG 0). Slot ring pulse ("assigned" and tick ring): `box-shadow 0 0 0 0 rgba(62,140,128,0.55)` → `0 0 0 8px rgba(62,140,128,0)`. |
| 3 | panel | §0.3 at x 690 (x 690–1250, y 228–428). Rows: `航班 A｜10:00｜→｜10:00｜[已起飛]` · `航班 B｜10:05｜→｜10:05｜[等待][已派發]` · `航班 C｜10:10｜→｜10:10｜[等待][已派發]`. Pill starts at **S0 監控中**, LED mint #9fe0c9 (same grammar as c3). |
| 4 | cause chips | `K.chip("天氣",{warn})` at (1550, 408); `K.chip("跑道維護",{warn})` at (1640, 488), just above the hatch. |
| 5 | DEP chip | `K.chip("地面等待",{warn})` and `K.chip("已接收新起飛時間")` stacked at (130, 440); x 130–370, y 440–492. B's time tag at LU (top ≈ 505 with drift) stays ≥ 12 px below it. |

Clearances checked:
- The arc keeps planes ≥ 17 px below the panel bottom (wingtip y ≥ 448, ≥ 445 at full stage drift).
- Cloud bottom 498 vs landing-plane top 507.
- Card bottom 386 vs cloud top 404.
- Chip 跑道維護 bottom 540 vs DST top 567.

### Copy

`起飛機場` · `目的地機場` · `到場容量` · `可用時段` · `5`→`3` · `A` `B` `C` · `天氣` · `跑道維護` · `地面等待` · `已接收新起飛時間` · `ATFM 流量管理系統` · `監控中` `已偵測` `計算中` `✓ 已派發` · `航班 A/B/C` · `10:00` `10:05` `10:10` `10:20` · `→` · `已起飛` `等待` `已派發` · clock HH:MM · time tags `10:10` `10:20`

**Never** 「到場容量降低」 (that is the header's line).

### Beats

| L | G | element | action / props | dur | ease |
|---|---|---|---|---|---|
| 0.00 | 7.40 | `#c2-stage` | scale 1 → 1.025, x 0 → −10 (one tween, whole window) | 16.90 | sine.inOut |
| 0.30 | 7.70 | DST wrapper | opacity 0 → 1, scale 0.86 → 1, origin 50% 50% (**VO3 beat**, catches the zoom-through) | 0.80 | power3.out |
| 0.40 | 7.80 | DEP wrapper | opacity 0 → 1, x −40 → 0 | 0.80 | power3.out |
| 0.40 | 7.80 | N2 @LU, A @Q1, B @Q2, C @Q3 (+ A/B/C letter tags) | opacity 0 → 1 | 0.40 | power1.out |
| 0.30 | 7.70 | ROUTE2 | `K.draw` 0 → 100% (screen path, solid). expo.out keeps the draw front ahead of N1 from its first visible frame; expo.inOut would leave N1 flying over an undrawn arc | 0.90 | expo.out |
| 0.60 / 0.70 | 8.00 / 8.10 | labels | K.inUp y 12 | 0.60 | power3.out |
| 1.00 | 8.40 | slot card | K.inUp y 16 | 0.70 | power3.out |
| 1.20 | 8.60 | slots | scaleX 0 → 1 (origin left), stagger 0.06 | 0.40 | power3.out |
| 1.30 | 8.70 | `可用時段` + roll | opacity 0 → 1 | 0.40 | power2.out |
| 1.40 | 8.80 | letters A B C | K.pop, stagger 0.06 | 0.45 | back.out(1.5) |
| 3.65 | 11.05 | `目的地機場` | colour → #B25135 (**VO4 beat**); underline scaleX 0 → 1 (0.5 expo.out); glow 0 → 1 (0.8 power2.out) | 0.40 | power2.inOut |
| 5.45 | 12.85 | cloud | x +50 → 0, opacity 0 → 1 (**「天氣」**) | 0.90 | power3.out |
| 5.50 | 12.90 | `天氣` chip | K.pop | 0.55 | back.out(1.5) |
| 5.55 | 12.95 | rain | K.rain on (until 24.25) | — | — |
| 6.25 | 13.65 | hatch | scaleX 0 → 1 (**「跑道」**); N2 is braking just short of it | 0.60 | power3.out |
| 6.30 | 13.70 | `跑道維護` chip | K.pop | 0.55 | back.out(1.5) |
| 6.40 | 13.80 | cones | pop from y +6, stagger 0.08 | 0.45 | back.out(1.6) |
| 6.40 | 13.80 | cloud | x 0 ↔ −6 yoyo, repeat 3 (ends 22.60, inside the window) | 2.20 | sine.inOut |
| 8.30 | 15.70 | cause chips | K.out, stagger 0.05 | 0.35 | power2.in |
| 8.45 | 15.85 | slots 2, 4 | `K.slotTo` "off", stagger 0.15 (**VO5 beat, 「降低」**) | 0.40 | power2.inOut |
| 8.62 | 16.02 | A letter tag | opacity → 0 (A lifts off) | 0.20 | power2.in |
| 8.65 | 16.05 | counter | `rollTo` "3" + colour #B25135 | 0.60 | power3.inOut |
| 8.75 | 16.15 | letters B, C | colour → #B25135, stagger 0.08 | 0.30 | power2.inOut |
| 9.10 | 16.50 | B, C letter tags + hold rings | tags → terra; `K.pulse` r 22 → 38, repeat 1, gap 0.35 (ends 19.05, before any release) | 1.10 | power2.out |
| 9.20 | 16.60 | DEP chip `地面等待` | K.pop | 0.55 | back.out(1.5) |
| 10.90 | 18.30 | slot 1 tick + ring | tick drawSVG 0 → 100% (0.3); slot ring pulse `0 0 0 0 rgba(62,140,128,0.55)` → `0 0 0 8px rgba(62,140,128,0)` (A touched down 18.26) | 0.60 | power2.out |
| 11.36 | 18.76 | panel | opacity 0 → 1, y 24 → 0; pill **S0 監控中**, LED mint (**VO6 beat**, 「系統」) | 0.70 | power3.out |
| 11.46 / 11.54 / 11.62 | 18.86 / 18.94 / 19.02 | rows | K.inUp y 10 | 0.50 | power3.out |
| 11.36 | 18.76 | clock | `count` 601.43 → 633.93, fmt time (= 10:01 → 10:34; 10:10 at 19.95, 10:20 at 21.35) | 4.55 | none |
| 11.38 | 18.78 | INLINK | `K.reveal` `c2-rv-in` (card → panel) | 0.20 | expo.out |
| 11.40 | 18.80 | INLINK packet (terra) | along INLINK → panel; opacity 0 → 1 (0.05) at start, → 0 (0.05) on arrival 18.98 (**detect**) | 0.18 | power1.inOut |
| 11.58 | 18.98 | pill + LED | S0 → S1 `已偵測` (0.25 crossfade; ≥ 50 % visible 19.10–19.63); LED → #B25135 + single ring pulse (0.60, power2.out) | 0.25 | power2.inOut |
| 12.10 | 19.50 | pill | S1 → S2 `計算中` (inside 「自動」 19.35–19.70) | 0.25 | power2.inOut |
| 12.10 / 12.22 | 19.50 / 19.62 | row highlights B, C | 0 → 1 (0.2) → 0 (0.4) | 0.60 | power2.inOut |
| 12.14 | 19.54 | letter B | x +76 (slot 2 → 3) + colour → teal | 0.40 | power2.inOut |
| 12.24 | 19.64 | letter C | x +152 (slot 3 → 5) + teal | 0.45 | power2.inOut |
| 12.54 / 12.69 | 19.94 / 20.09 | slots 3 / 5 | "assigned" ring pulse as each letter lands | 0.60 | power2.out |
| 12.18 | 19.58 | SIG2 | `K.reveal` `c2-rv-sig` (panel → DEP chip) (**signal first**, after 計算中) | 0.30 | expo.out |
| 12.20 | 19.60 | SIG2 packet (teal) | along SIG2; arrives in the DEP chip at 19.86, then opacity → 0 (0.05) | 0.26 | power1.inOut |
| 12.48 | 19.88 | SIG2 | `K.flow` 40 px/s until 23.50 | — | none |
| 12.45 | 19.85 | DEP chip | 地面等待 → 已接收新起飛時間 crossfade | 0.30 | power2.inOut |
| 12.46 / 12.52 | 19.86 / 19.92 | letter tags B, C | → teal | 0.25 | power2.inOut |
| 12.46 / 12.54 | 19.86 / 19.94 | time tags B `10:10`, C `10:20` | K.pop. They ride with the planes and fade at lift-off (B 20.84, C 22.24; 0.20 power2.in) | 0.45 | back.out(1.5) |
| 12.48 / 12.60 | 19.88 / 20.00 | panel new time B → `10:10`, C → `10:20` | `rollTo` (digit stagger 0.05) + opacity 0.45 → 1 (**values roll after the packet arrives, 19.86**) | 0.60 | power3.inOut |
| 12.55 | 19.95 | B | **released, roll** (clock 10:10). Tags stay through the roll and fade at lift-off 20.84. | — | — |
| 12.64 / 12.76 | 20.04 / 20.16 | status tags B, C | 等待 → 已派發 | 0.25 | power2.inOut |
| 12.70 / 12.82 | 20.10 / 20.22 | strike lines + original times | scaleX 0 → 1; original time opacity → 0.5 | 0.30 | power2.out |
| 12.84 | 20.24 | pill + LED | S2 → S3 `✓ 已派發` (「派發」 ≈ 20.27); LED → #9fe0c9 | 0.25 | power2.inOut |
| 13.44 | 20.84 | B tags | letter + time tag opacity → 0 (B lifts off) | 0.20 | power2.in |
| 13.95 | 21.35 | C | **released, roll** (clock 10:20) | — | — |
| 14.84 | 22.24 | C tags | letter + time tag opacity → 0 (C lifts off) | 0.20 | power2.in |
| 15.72 | 23.12 | slot 3 tick + ring | B touched down 23.08 (**loop closed inside VO6**) | 0.60 | power2.out |
| 15.95 | 23.35 | panel rows, pill, clock | opacity → 0 (handoff prep) | 0.25 | power2.in |
| 16.10 | 23.50 | left group | DEP, 起飛機場, DEP chip, SIG2: opacity 0, x −40 | 0.45 | power2.in |
| 16.40 | 23.80 | c2 panel frame | `set` opacity 0 (c3's identical frame is on top since 23.75) | — | — |
| 16.40 | 23.80 | right group | DST, label, underline, glow, slot card, cloud, rain, hatch, cones, ROUTE2, INLINK, all planes: opacity 0, x +24 | 0.45 | power2.in |

### Aircraft choreography

V = 360 px/s, built with `K.legs` on FLT2.

**Standard flight** from a roll start t₀:

| leg | from frac | to frac | dur | ease | alt | squash |
|---|---|---|---|---|---|---|
| roll | 0 | 0.1400 | 0.885 | power2.in | 0 | 0.55 |
| climb | 0.1400 | 0.2059 | 0.208 | none | 0 → 1 | 0.55 → 1 |
| arc | 0.2059 | 0.8106 | 1.911 | none | 1 | 1 |
| approach | 0.8106 | 0.8517 | 0.130 | none | 1 → 0 | 1 → 0.55 |
| rollout | 0.8517 | 1 | 0.937 | power2.out | 0 | 0.55 |

Then TURN2 (0.76, power1.inOut), fading over its last 0.3 s.

- Roll start → touchdown = **3.134 s**.
- Speed is continuous at 360 everywhere (2·159.3/0.885 = 75/0.208 = 360).
- Ground headings are −12.5° at the DEP and +12.5° at the DST (mirrored).

| plane | schedule (G) |
|---|---|
| N1 (airborne at start) | arc from frac 0.4563, 7.75–8.87 (fade in 7.75–8.05) · approach 8.87–9.00 · rollout 9.00–9.94 · TURN2 9.94–10.70 · fade 10.40–10.70 |
| N2 (at LU) | roll **9.90** · climb 10.79 · arc 10.99–12.90 · approach → touchdown **13.03** (in the rain) · rollout to 13.97, stopping at R′(0.46), 55 px short of the hatch · TURN2 13.97–14.73 · fade 14.43–14.73 |
| A (Q1) | MERGE 10.60–11.35 (power1.inOut), lined up and waiting for 10:00 · roll **15.13** · touchdown **18.26** → **slot 1 tick 18.30** · rollout to 19.20 · TURN2 19.20–19.96 · fade 19.66–19.96 · letter tag fades at lift-off 16.02 (0.20) |
| B (Q2) | TAXI Q2 → Q1 11.00–11.70 (sine.inOut) · MERGE Q1 → LU 15.55–16.30 · **holds on the runway** (terra ring 16.50) · roll **19.95** · lift-off 20.84 (tags fade 20.84–21.04) · touchdown **23.08** → **tick 23.12** · rollout until the scene fades |
| C (Q3) | TAXI Q3 → Q2 11.10–11.80 · Q2 → Q1 15.65–16.35 · holds · MERGE 20.45–21.20 · roll **21.35** · lift-off 22.24 (tags fade 22.24–22.44) · mid-arc (≈ x 1100) when the right group fades at 23.80 |

**Reading:** airborne traffic keeps landing; unaffected A leaves on time; affected B and C wait; after dispatch they leave exactly on 10:10 and 10:20 (1.4 s apart); B lands into slot 3.

### Transition in/out

- **In:** catches c1's zoom-through. c1's dive lands RCTP on (1500, 648) at 7.70; at that frame the DST starts scaling up from 0.86 around (1500, 648), while c1 settles F2 → F2z (same ×1.16 growth) and its band fades out by 8.15. N1 continues c1's landing story. c2's stage drift is ≈ 0 at 7.70 (progress 0.0008), so the registration holds.
- **Out:** panel-frame handoff. Rows, pill and clock clear 23.35–23.60. c3 shows an identical frame (bar + LED mint + title, empty 200 px body) at the same rect 23.60–23.75, c2's frame is `set` to 0 at 23.80, and c3 glides it into the Taipei FIR zone from 23.85. The left group drifts out left (23.50–23.95) and the right group fades right (23.80–24.25, inside the 24.30 window end).
- **c3 side:** see Frame 3 *Transition in*.

### Ambient loops

- Stage drift (one tween).
- Planes the whole window (N1, N2, A, B, C).
- Rain 12.95–24.25 and cloud bob.
- SIG2 dash flow.
- Panel clock.
- Hold rings.

### Build notes

- Mirror only `dstImg`, via `gsap.set`, and never tween it. The entrance scale lives on the wrapper.
- FLT2 breakpoints: assert with `K.fracAt` against the table (±0.002).
- Plane children (tags, rings) are siblings of `__body` inside the plane `<g>`, so they translate but never rotate.
- **Snapshot-check these:**
  - Q1–Q3 sit on the painted parallel taxiway (adjust ±6 px; if Q3 lands on grass, use u 0.40/0.26/0.12).
  - LU is on the runway centreline.
  - The hatch sits on the painted runway.
  - The mirrored stand at the TURN2 end (1586, 598) is on the apron.
- `K.rain` lives inside the right-group wrapper, so the group fade covers it.
- Every `rollTo` keeps the text length (5 chars).

---

## Frame 3 — c3-border
status: outline
src: compositions/c3-border.html
window: 23.6–37.7

### Purpose

- **VO7**: the v4 boundary diagram. The neighbouring FIR is on the left with its departure airport; the **Taipei FIR** is the mint zone on the right, home of the ATFM panel. Pre-restriction transit traffic is **dense** (crossings 0.69 s apart).
- **VO8**: the boundary point is restricted. The gate closes and passage slots go 5 → 3.
- **VO9**: the system detects, recomputes, and its dispatch **crosses the boundary** to the neighbouring departure airport. D (on time) and then E and F leave on the clock.
- **VO10**: D crosses the BP in slot 1 on the beat. Mint spreads over both regions (cross-region integration), and E crosses in slot 3.

### Layout (L = G − 23.6)

**World layer `#c3-stage`** (drift origin 980 580):

| order | element | spec |
|---|---|---|
| 1 | TintR (Taipei FIR zone) | div x 980–1810, y 228–852, #E1EEE8, border-radius 0 24 24 0, clip `inset(0 100% 0 0)` |
| 1 | TintL | div x 110–980, same height, #E1EEE8 opacity 0.55, radius 24 0 0 24, clip `inset(0 0 0 100%)` |
| 2 | boundary | SVG line x 980, y 228 → 852, #3E8C80 3 px, dash 10/12, opacity 0.85, in a wrapper clipped `inset(0 0 100% 0)`. Plus **seam** line (same geometry, #3E8C80 4 px, dasharray `60 700`, opacity 0). |
| 3 | region labels | `鄰近飛航情報區` (`.k-label.is-soft`, right edge 956, top 238) · `臺北飛航情報區` (20/700 teal, left 1004, top 238) |
| 4 | DEP | `K.airport({x:124, y:585, w:380})` (k 0.2375). R3(u) = (150.1 + 289.8u, 664.6 − 64.4u); E (439.9, 600.2). **LU** R3(0.54) = (306.6, 629.8); **Q1** (275.9, 656.1); **Q2** (229.6, 666.4). Label `外區起飛機場` (26/700, xPercent −50) at (314, top 806). |
| 5 | FX svg | **ROUTE3** `M439.9 600.2C498.5 587.2 560 580 620 580L1810 580`: #1F6B62 5 px; linearGradient stroke alpha 1 → 0 over x 1650–1810. |
| 5 | FX svg | **FLT3** (hidden) `M306.6 629.8L439.9 600.2C498.5 587.2 560 580 620 580L1990 580`: L 1688.1; **LO 0.0598** · climb end 0.1150 · **BP 0.4015** · fade-out 0.8935 (x 1810). |
| 5 | FX svg | **MERGE3** `M275.9 656.1C292.5 652.4 290 633.5 306.6 629.8`; **TAXI3** `M229.6 666.4L275.9 656.1` |
| 5 | FX svg | **BP** `K.node(980,580,{r:9})` + pass-pulse circle + white check (path `M-5 0L-1.5 3.5L5.5-3.5`, stroke 2.2, drawSVG 0). **Gate capsule**: rect 6×44 r 3, #B25135, centred on BP, scaleY 0 (origin centre). |
| 5 | FX svg | **BPLINK** `K.smooth([[994,568],[1120,530],[1300,480],[1430,398]])` (L ≈ 470): dashed #3E8C80 3 px 10/12, `K.reveal` id `c3-rv-bp`, width 12; packet r 6 #B25135. Ends 30 px inside the panel bottom (y 428), so the stage drift (≤ 9 px, always up/right there) never exposes its end. |
| 5 | FX svg | **DISP3** `K.smooth([[1290,398],[1200,470],[980,488],[640,494],[460,520],[356,546]])` (L 967.8; boundary at frac 0.3497): dashed #3E8C80 3 px 10/12, `K.reveal` id `c3-rv-disp`, width 12; packet r 6 #3E8C80. Starts 40 px inside the panel's left edge and 30 px above its bottom, **crosses the boundary at (980, 488)**, ends 10 px inside the DEP chip (y 508–560). Crossing ring: circle r 6 at (980, 488), fill none, stroke #3E8C80 2 px. |
| 5 | FX svg | planes T1, T2, D, E, F: `K.plane({len:38})`. **D, E, F only** carry letter tags / hold rings / time tags built as in c2 (letter tag r 15, 20/700 at +30; hold ring stroke #B25135 2 px; time tag 76×30 r 8, mono 20/600 at −40). T1 and T2 carry none. Tags fade 0.20 power2.in at lift-off: D 32.68, E 34.08, F 35.48. |

**UI layer `#c3-ui`:**

| order | element | spec |
|---|---|---|
| 1 | panel | §0.3, rows `航班 D｜10:20｜→｜10:20｜[排定][已起飛]` · `航班 E｜10:25｜→｜10:25｜[排定][等待][已派發]` · `航班 F｜10:30｜→｜10:30｜[排定][等待][已派發]`. Starts at x 690 (handoff) and **ends at x 1250** (x 1250–1810, y 228–428). Pill S0, LED mint. Rows, pill and clock start at opacity 0. |
| 2 | slot card | `K.card({x:770, y:300, w:440, h:150})`, straddling the boundary as in v4. Title `通過時段` (matches the header's 通過時段縮減); right-aligned `可用` + roll `5`; letters D/E/F (20/700) centred above slot centres x 832 / 908 / 984, top 386; `K.slots(5×on)` at top 412; ticks and slot ring pulses as in c2. |
| 3 | chips | `K.chip("邊境點",{card:true})` at (864, 624) · `K.chip("流管限制",{warn:true})` at (996, 624). They flank the boundary; plane wingtips + shadow end at y ≤ 611. |
| 4 | DEP chip | `K.chip("已接收新起飛時間")` at (130, 508), x 130–370, y 508–560, opacity 0. D's time tag at LU (top ≈ 575 with drift) stays ≥ 14 px below it. |

### Copy

`鄰近飛航情報區` · `臺北飛航情報區` · `外區起飛機場` · `邊境點` · `流管限制` · `通過時段` · `可用` · `D` `E` `F` · `ATFM 流量管理系統` · `監控中` `已偵測` `計算中` `✓ 已派發` · `航班 D/E/F` · `10:20` `10:25` `10:30` `10:40` · `→` · `排定` `等待` `已派發` `已起飛` · `已接收新起飛時間` · time tags `10:20` `10:30` `10:40`

### Beats

| L | G | element | action / props | dur | ease |
|---|---|---|---|---|---|
| 0.00 | 23.60 | `#c3-stage` | scale 1 → 1.02 | 6.90 | sine.inOut |
| 6.90 | 30.50 | `#c3-stage` | scale 1.02 → 1.00 (exactly 1.0 by 37.20) | 6.70 | sine.inOut |
| 0.00 | 23.60 | panel frame (bar + empty body) at x 690 | opacity 0 → 1 (identical to c2's frame) | 0.15 | none |
| 0.25 | 23.85 | panel | x 690 → 1250 (**glide into the Taipei FIR zone**) | 1.00 | power3.inOut |
| 0.35 | 23.95 | T1, T2 | fade in (cruising) | 0.30 | power1.out |
| 0.45 | 24.05 | boundary | clip reveal top → bottom (**VO7 beat**) | 0.80 | expo.out |
| 0.55 | 24.15 | TintR | clip → `inset(0)` | 0.90 | power3.out |
| 0.60 | 24.20 | DEP | K.inUp y 20 | 0.80 | power3.out |
| 0.30 | 23.90 | ROUTE3 | `K.draw` 0 → 100% (screen path, solid). Starts with T1/T2 and uses expo.out, so the front (32 % at 23.95, 69 % at 24.05) is always ahead of T1 (0.28 of ROUTE3 at 23.95 → BP at 0.39 at 24.56) and T2 (0.15). A 24.30 expo.inOut draw would leave T1 crossing BP on an undrawn line | 0.90 | expo.out |
| 0.70 | 24.30 | D @LU, E @Q1, F @Q2 + letter tags | opacity 0 → 1 | 0.40 | power1.out |
| 0.80 | 24.40 | `鄰近飛航情報區` | x +14 → 0, opacity (after the panel clears it at 24.34) | 0.60 | power3.out |
| 0.85 | 24.45 | BP | K.pop | 0.55 | back.out(1.5) |
| 0.92 | 24.52 | `外區起飛機場` | K.inUp | 0.60 | power3.out |
| 0.95 | 24.55 | `臺北飛航情報區` | x −14 → 0, opacity (the panel cleared at 24.51) | 0.60 | power3.out |
| 0.96 / 1.66 | 24.56 / 25.26 | BP pass pulses | T1 / T2 cross (**dense: 0.69 s**), r 9 → 30 | 0.80 | power2.out |
| 1.05 | 24.65 | `邊境點` chip | K.inUp | 0.60 | power3.out |
| 1.20 | 24.80 | slot card | K.inUp y 16 | 0.70 | power3.out |
| 1.35 | 24.95 | panel rows / pill S0 / clock | rows K.inUp y 10, stagger 0.08; pill + clock fade 0.3 | 0.50 | power3.out |
| 1.35 | 24.95 | clock | **one** `count` 570.36 → 661.43 (09:30 → 11:01) to the window end. That is the same 7.143 min/s as c2 (10 min = 1.4 s), so the clock shows 10:20 at 31.90, 10:30 at 33.30 and 10:40 at 34.70 with no speed jump | 12.75 | none |
| 1.40 | 25.00 | slots | scaleX cascade, stagger 0.06 | 0.40 | power3.out |
| 1.60 | 25.20 | letters D E F | K.pop, stagger 0.06 | 0.45 | back.out(1.5) |
| 3.50 | 27.10 | BP dot | fill → #B25135 (0.3); `K.pulse` terra r 10 → 46, repeat 2, gap 0.2 (**VO8 beat**) | 1.00 | power2.out |
| 3.55 | 27.15 | gate capsule | scaleY 0 → 1 (**gate closes**) | 0.50 | back.out(1.4) |
| 3.95 / 4.10 | 27.55 / 27.70 | slots 2, 4 | → off | 0.40 | power2.inOut |
| 4.15 | 27.75 | counter | → `3` + terra | 0.60 | power3.inOut |
| 4.25 / 4.33 | 27.85 / 27.93 | letters E, F | → terra | 0.30 | power2.inOut |
| 4.50 | 28.10 | E, F letter tags + hold rings | → terra; rings r 18 → 32, repeat 2, gap 0.4, stagger 0.1 (ends ≤ 32.0, before E moves) | 1.00 | power2.out |
| 4.80 | 28.40 | `流管限制` chip | K.pop (on 「流管限制」) | 0.55 | back.out(1.5) |
| 4.95 | 28.55 | BPLINK | `K.reveal` `c3-rv-bp` (BP → panel) | 0.40 | expo.out |
| 5.05 | 28.65 | BPLINK packet (terra) | along → panel; opacity 0 → 1 (0.05) at start, → 0 (0.05) on arrival 29.05 (**detect**) | 0.40 | power1.inOut |
| 5.45 | 29.05 | pill + LED | S0 → S1 `已偵測`; LED terra + single ring | 0.25 | power2.inOut |
| 5.45 | 29.05 | BPLINK | `K.flow` 40 px/s until 37.25 | — | none |
| 5.50 / 5.58 | 29.10 / 29.18 | row tags E, F | 排定 → 等待 | 0.25 | power2.inOut |
| 6.60 | 30.20 | pill | S1 → S2 `計算中` (**VO9 beat**); row highlights E 30.25, F 30.37 | 0.25 | power2.inOut |
| 6.70 | 30.30 | letter E | x +76 (2 → 3) + teal | 0.45 | power2.inOut |
| 6.80 | 30.40 | letter F | x +152 (3 → 5) + teal | 0.50 | power2.inOut |
| 7.15 / 7.30 | 30.75 / 30.90 | slots 3 / 5 | "assigned" ring pulse | 0.60 | power2.out |
| 7.35 | 30.95 | DISP3 | `K.reveal` `c3-rv-disp` (**signal first; crosses the boundary**) | 0.55 | expo.out |
| 7.37 | 30.97 | DISP3 packet | along DISP3; reaches the boundary (frac 0.3497) at **31.19** and the DEP chip at 31.50, then opacity → 0 (0.05) | 0.53 | power1.inOut |
| 7.59 | 31.19 | crossing ring at (980, 488) | r 6 → 26, opacity 0.6 → 0 (fires exactly as the packet crosses) | 0.70 | power2.out |
| 7.90 | 31.50 | DEP chip `已接收新起飛時間` | K.pop | 0.55 | back.out(1.5) |
| 7.95 / 8.02 / 8.09 | 31.55 / 31.62 / 31.69 | time tags D `10:20`, E `10:30`, F `10:40` | K.pop; E, F letter tags → teal | 0.45 | back.out(1.5) |
| 7.95 / 8.07 | 31.55 / 31.67 | panel new times E → `10:30`, F → `10:40` | `rollTo` + opacity 0.45 → 1 | 0.60 | power3.inOut |
| 8.15 / 8.27 | 31.75 / 31.87 | status tags E, F | 等待 → 已派發 | 0.25 | power2.inOut |
| 8.25 / 8.37 | 31.85 / 31.97 | strike lines | scaleX 0 → 1 | 0.30 | power2.out |
| 8.30 | 31.90 | D | **released, roll** (clock reads 10:20 from the single clock tween). Tags stay through the roll. | — | — |
| 8.35 | 31.95 | pill + LED; D tag | S2 → S3 `✓ 已派發`, LED mint; D row 排定 → 已起飛 | 0.25 | power2.inOut |
| 8.40 | 32.00 | DISP3 | `K.flow` 40 px/s until 37.25 | — | none |
| 9.08 | 32.68 | D tags | letter + time tag opacity → 0 (D lifts off) | 0.20 | power2.in |
| 10.48 | 34.08 | E tags | letter + time tag opacity → 0 (E lifts off) | 0.20 | power2.in |
| 11.88 | 35.48 | F tags | letter + time tag opacity → 0 (F lifts off) | 0.20 | power2.in |
| 11.15 | 34.75 | gate | open: scaleY 1 → 0.25, opacity → 0.4 | 0.15 | power2.out |
| 11.30 | 34.90 | BP + slot 1 | **D crosses BP** in slot 1: teal pass pulse; slot 1 tick (**VO10 beat**) | 0.80 | power2.out |
| 11.40 | 35.00 | TintL | clip → `inset(0)` (mint spreads left from the boundary, **「跨區」**) | 1.20 | power3.inOut |
| 11.40 | 35.00 | boundary | opacity 0.85 → 0.4 | 1.00 | power2.inOut |
| 11.50 | 35.10 | seam light | opacity 0 → 1 (0.2) and dashoffset 0 → −760 (light runs down the boundary), then opacity → 0 at 36.10 (0.2) | 1.20 | sine.inOut |
| 11.55 | 35.15 | gate | close: scaleY → 1, opacity → 1 | 0.20 | power2.inOut |
| 11.80 | 35.40 | BP dot | fill terra → #1F6B62 + white check drawSVG/pop | 0.40 | back.out(1.5) |
| 12.55 | 36.15 | gate | open for E | 0.15 | power2.out |
| 12.62 | 36.22 | both region labels | scale 1 → 1.06 → 1 together (**「整合」**) | 0.60 | sine.inOut |
| 12.70 | 36.30 | BP + slot 3 | **E crosses** in slot 3: pass pulse; slot 3 tick | 0.80 | power2.out |
| 12.95 | 36.55 | gate | close | 0.20 | power2.inOut |
| 13.65 | 37.25 | UI | panel, card, chips: K.out, stagger 0.03 | 0.35 | power2.in |
| 13.65 | 37.25 | world | DEP, labels, ROUTE3, planes, BP, gate, links, TintL: opacity 0 (x −30 for the DEP group) | 0.35 | power2.in |
| 13.65 | 37.25 | **zone morph** | TintR left 980 → 660, width 830 → 600, border-radius → 0; boundary wrapper x 0 → −320 (rides the zone's left edge) | 0.40 | power2.inOut |

### Aircraft choreography

V = 260 px/s on FLT3.

**Standard departure from LU:**

| leg | frac | dur | ease | alt | squash |
|---|---|---|---|---|---|
| roll | 0 → 0.0598 | 0.777 | power2.in | 0 | 0.55 |
| climb | → 0.1150 | 0.358 | none | 0 → 1 | 0.55 → 1 |
| cruise | → 0.8935 | — | none | 1 | 1 |

Fade over the last 0.3 s. Roll start → BP = **2.995 s**.

| plane | schedule (G) |
|---|---|
| T1 | cruise 0.3069 → 0.8935, 23.95–27.76; BP **24.56** |
| T2 | 0.2003 → 0.8935, 23.95–28.45; BP **25.26** (0.69 s after T1: the dense "before") |
| D (@LU, keeps 10:20) | roll **31.90** · LO 32.68 (tags fade) · climb end 33.04 · **BP 34.90** · at x ≈ 1590 when the world fades at 37.25 |
| E (@Q1) | MERGE3 32.10–32.80 (power1.inOut) · roll **33.30** (10:30) · LO 34.08 (tags fade) · **BP 36.30** |
| F (@Q2) | TAXI3 32.20–32.90 · MERGE3 33.55–34.25 · roll **34.70** (10:40) · lift-off 35.48 (tags fade) · at x ≈ 865 when the world fades at 37.25 (BP would be 37.70) |

**After:** departures and crossings are 1.4 s apart in assigned slots.

### Transition in/out

- **In (overlap 23.60–24.30 with c2):** c3's identical panel frame fades in over c2's at x 690 (23.60–23.75). c2 hides its frame at 23.80, and c3 glides the frame from x 690 to 1250 (23.85–24.85). c3's world builds from 23.90 (ROUTE3, T1/T2) while c2's right group is still fading out right (23.80–24.25).
- **Out (overlap 37.30–37.70 with c4):** UI and world fade 37.25–37.60, and the mint Taipei zone morphs into c4's centre column (x 660–1260, y 228–852) over 37.25–37.65. The boundary (opacity 0.4, dash 10/12, offset 0) rides its left edge to x 660 and becomes c4's left divider. TintR and the boundary stay at full value until c3 ends at 37.70, by which time c4's identical column and divider are opaque (37.62–37.70). This overlap is 0.4 s, set by index.html/BRIEF (DESIGN §6 asks 0.5–0.8 s). It works because the handoff is a match-cut on identical geometry, not a crossfade.
- **c4 side:** see Frame 4 *Transition in*.

### Ambient loops

- Stage breathe (in to 30.50, out to 37.20).
- T1/T2, then D/E/F.
- Hold rings.
- BPLINK and DISP3 dash flow.
- Panel clock.
- Gate cycles.

### Build notes

- The panel lives in `#c3-ui` (no drift), so the handoff is exact. Its rows, pill and clock are hidden until 24.95.
- The c3 window starts at 23.6: nothing before that.
- The stage scale must be exactly 1.0 from 37.20 so the morph matches c4.
- Planes on the ground use squash 0.55, heading −12.5°.
- Never place a destination airport on the right; the mint zone *is* the Taipei FIR.
- If queue planes read too small at w 380, raise the airport to w 420 (k 0.2625) and recompute every point.

---

## Frame 4 — c4-relay
status: outline
src: compositions/c4-relay.html
window: 37.3–41.3

### Purpose

**VO11** 「這是一場超越國界的接力賽」: v4's relay form, with **Taipei FIR at the centre**. An assigned-slot **baton**, the same element as the slot cards, is handed 區域 A → 臺北飛航情報區 → 區域 B. Each hand-off happens exactly as the aircraft below crosses each border, and the aircraft draws its own trail.

### Layout (L = G − 37.3)

**`#c4-stage`** (one drift tween: scale 1 → 1.02, **origin 960 430** = the Taipei node, 37.30–41.30, sine.inOut). Everything lives in this one layer, bottom to top. The crossing dots, the plane and the dividers therefore share one transform, and the dots stay on the dividers. (With fixed dividers they would slide up to 4.3 px off by 39.88.) The Taipei node stays exactly at (960, 430) for the c5 handoff. During the c3 → c4 handoff (37.62–37.70) the scale is ≤ 1.0005: the column edges move ≤ 0.2 px from c3's morph end state, which is invisible.

| element | spec |
|---|---|
| centre column | div x 660–1260, y 228–852, #E1EEE8, no radius, opacity 0. Its geometry equals c3's morph end state. |
| dividers | SVG lines at x 660 and 1260, y 228 → 852, #3E8C80 3 px, dash 10/12 (offset 0, same as c3's boundary), opacity 0.4, inside a wrapper whose opacity starts at 0. The right one sits in a second wrapper clipped `inset(0 0 100% 0)`. |
| track | (360, 430) → (1560, 430), #A9C7BD 4 px |
| nodes | A `K.node(360,430,{r:11})` teal · **Taipei** `K.node(960,430,{r:13, color:"#A8761A"})` · B `K.node(1560,430,{r:11})` teal; each with an inner `<g>` for animation |
| labels | `.k-label` 26/700 teal, xPercent −50, top 458, centred at x 360 / 960 / 1560 |
| micro-labels | `.k-label.is-soft` 20/500, top 500, same centres |
| baton | HTML 64×22, radius 6, #1F6B62, with a centred white tick SVG (path `M-7 0L-2 5L8-5`, stroke #FBF7F2 2.5, round caps; the slot-card tick); top-left (328, 381), i.e. centred 38 px above node A |
| smile | **SMILE** `M140 600Q960 940 1780 600`: arc length 1685.8, lowest (960, 770); used as the plane path and as its trail (teal 4 px, `trailLen 3000`, dasharray initialised `"0 99999"`) |
| crossing dots | r 6 #3E8C80 with a 3 px #FBF7F2 ring, each with its own pulse circle (fill none, stroke #3E8C80 2 px), at **(660, 747.2)** and **(1260, 747.2)**, which lie on SMILE and on the dividers |
| plane | `K.plane({len:64})`, alt 1, top of the svg |

### Copy

`區域 A` · `臺北飛航情報區` · `區域 B` · `收到資訊` · `協調時序` · `回應確認`

### Beats

| L | G | element | action / props | dur | ease |
|---|---|---|---|---|---|
| 0.00 | 37.30 | plane | along SMILE 0 → 1, trail on, 37.30–41.10 | 3.80 | none |
| 0.10 | 37.40 | plane | opacity 0 → 1 | 0.30 | power1.out |
| 0.00 | 37.30 | `#c4-stage` | scale 1 → 1.02, transform-origin 960 430 | 4.00 | sine.inOut |
| 0.32 | 37.62 | centre column + left-divider wrapper | opacity 0 → 1 (lands on c3's morphed zone; c3 holds it until 37.70) | 0.08 | none |
| 0.35 | 37.65 | right divider | clip reveal top → bottom | 0.50 | expo.out |
| 0.45 / 0.55 | 37.75 / 37.85 | crossing dots | K.pop | 0.45 | back.out(1.6) |
| 0.58 | 37.88 | node A | K.pop (**VO11 beat**) | 0.50 | back.out(1.5) |
| 0.60 | 37.90 | track | drawSVG 0 → 100% | 0.90 | expo.inOut |
| 0.68 / 0.78 | 37.98 / 38.08 | Taipei node / node B | K.pop | 0.50 | back.out(1.5) |
| 0.68 / 0.76 / 0.84 | 37.98 / 38.06 / 38.14 | labels | K.inUp y 12 | 0.60 | power3.out |
| 0.80 | 38.10 | baton | K.pop at A | 0.40 | back.out(1.5) |
| 0.85 | 38.15 | `收到資訊` | K.inUp y 10 | 0.50 | power3.out |
| 0.80 | 38.10 | baton | x 0 → 600 (crosses x 660 at 38.525); y keyframes `[0, −22, 0]` (each half 0.425, sine.inOut) | 0.85 | power2.inOut |
| 1.22 | 38.52 | dot @660 | pulse r 6 → 22 (**plane crosses the first border**) | 0.70 | power2.out |
| 1.65 | 38.95 | Taipei node | gold ring pulse r 13 → 40; baton scale 1 → 1.12 → 1 (Taipei re-times it) | 0.90 | power2.out |
| 1.70 | 39.00 | `協調時序` | K.inUp | 0.50 | power3.out |
| 2.15 | 39.45 | baton | x 600 → 1200 (crosses 1260 at 39.875); y keyframes `[0, −22, 0]` as above | 0.85 | power2.inOut |
| 2.58 | 39.88 | dot @1260 | pulse r 6 → 22 (**second border, 「接力」**) | 0.70 | power2.out |
| 3.00 | 40.30 | node B | ring pulse r 11 → 34 (baton arrives above B) | 0.90 | power2.out |
| 3.02 | 40.32 | `回應確認` | K.inUp | 0.50 | power3.out |
| 3.00 | 40.30 | trail | stroke-width 4 → 6 → 4 | 0.50 | sine.inOut |
| 3.40 | 40.70 | everything except the plane and Taipei node | opacity → 0, stagger 0.03 | 0.40 | power2.in |
| 3.40 | 40.70 | Taipei node inner | scale 1 → 2.4, opacity → 0 (hands over to c5's Taiwan at (963, 430)) | 0.45 | power2.in |
| 3.65 | 40.95 | plane | opacity → 0 | 0.30 | power2.in |

### Aircraft choreography

- One plane at ~440 px/s, the fastest beat of the film, for the race.
- `along` uses **arc length**, so the crossings were computed numerically: x 660 at **38.52**, x 1260 at **39.88** (y 747.2).
- The baton hand-off midpoints are at 38.525 and 39.875.

### Transition in/out

- **In (overlap 37.30–37.70 with c3):** the plane enters at 37.30 (opacity from 37.40) while c3's world fades (37.25–37.60). c3's zone morph lands on the centre column at 37.65; c4's column and left divider become opaque at 37.62–37.70, exactly as c3 ends. The old boundary becomes the left divider.
- **Out (overlap 40.70–41.30 with c5):** everything but the plane and the Taipei node fades 40.70–41.10+. The gold Taipei node (still exactly at (960, 430), the drift origin) scales 1 → 2.4 and fades 40.70–41.15 while c5's map fades in at CAM.S with Taiwan's centre at (963, 430). The plane fades 40.95–41.25, inside the 41.30 window end.
- **c5 side:** see Frame 5 *Transition in*.

### Ambient loops

- Plane + self-drawn trail.
- Divider dash flow (`K.flow` 20 px/s, 37.62–40.70).
- Stage drift.

### Build notes

- The column and dividers live **inside** the drifting stage (origin 960 430). The drift is ≤ 0.2 px during the 37.62–37.70 handoff, and this keeps dots, dividers and plane registered.
- The plane's `along` is the only `immediateRender` tween on it.
- The Taipei node is gold (#A8761A); its label stays teal.
- Smile lowest point (770 → 776 at drift 1.02 about y 430) plus wingspan (±30) and shadow (17) stays ≤ 826, clear of the footnote (y 870) and the subtitle zone (915).
- If density reads high, drop the micro-labels first.

---

## Frame 5 — c5-map-outro
status: outline
src: compositions/c5-map-outro.html
window: 40.7–49.0

### Purpose

- **VO12** 「這 2 項功能相互配合」: the c1 map returns (same routes, same anchors and chips). A **hero flight** crosses the boundary point (02) and then lands at Taoyuan (01): one flight handled by both functions.
- **VO13** 「讓臺北飛航情報區的天空運作更加順暢」: push in. The FIR is redrawn in gold, every crossing on the FIR edge lights in turn, and RCTP receives an arrival every 1.2 s while BPW passes one every 1.8 s. It ends live.

### Layout (L = G − 40.7)

| element | spec |
|---|---|
| map | `K.map(root,{id:"c5", band:[220,860], feather:36, cam:CAM.S})`. Taiwan gold from frame 1; firFill 0.10; grat 0.32; `L.firLine` opacity 1 (already drawn); halo group 0.25. |
| routes | R01, R02, SN, RH as plain fully drawn `<path>`s (styles §0.4, no mask, no tween). SS is drawn at VO13 with `K.reveal(tl, ss, 4.80, 0.80, {id:"c5-rv-ss", width:40, ease:"expo.out"})`; the reveal's fromTo hides it until then. |
| hero highlight | copy of RH d, #3E8C80 7 px non-scaling, round caps, opacity 0.5. Drawn with `K.reveal(tl, hl, 0.90, 1.45, {id:"c5-rv-hero", width:40, from:78.54, to:100, ease:"none"})`, which goes from 78.54 %–78.54 % (hidden) to 78.54 %–100 % in step with the hero. |
| gold FIR | `M.fir.RCAA.d`, #A8761A 2.4 px non-scaling, solid. Drawn with `K.reveal(tl, gold, 3.20, 1.60, {id:"c5-rv-gold", width:40, ease:"power2.inOut"})` |
| nodes | RCTP, BPW (as c1), RCKH (r 5, hidden until VO13), edge dots X_N / X_E1 / X_E2 / X_S (r 6, hidden), SE corner dot at FIR_SE (r 5 teal) |
| chip01 | pinned at RCTP, **leader (0,0) → (168,−108), chip at (160,−160)**, same as c1. At CAM.S RCTP is at (983, 270), so the chip box would sit at y 110–162: inside the header band and outside the map band. It therefore pops **only at 42.15**, when the S → B pull-back has brought RCTP to y ≈ 404 (box ≈ x 1143–1433, y 244–296, fully inside the opaque band). The box then descends with the camera to y 369–421 at 43.60. At B: box x 1140–1430, y 372–424; it clears SN by ≥ 110 px and R01 plane wingtips by ≥ 21 px, and stays outside the FIR east edge (x 1127). |
| chip02 | pinned at BPW, leader → (24,49), chip at (20,49). At its 41.45 pop BPW is at ≈ (631, 581), so the box is ≈ x 651–941, y 630–682: inside the band, with Taiwan's south tip ≥ 15 px above and right of it. At B: box x 802–1092, y 736–788, below Taiwan's tip (715); SS is not drawn yet. |
| FIR label | `K.chip("臺北飛航情報區",{card:true})` pinned at FIR_SE, chip at (40,−10) plus a 40 px teal leader (0,0) → (40,16). At FB: box x 1175–1395, y 634–686, 50 px below R02. |
| planes | 15 × `K.plane({len:34})` + `K.mapPlane` |

### Copy

`01　機場端流量管理` · `02　邊境點流量管理` · `臺北飛航情報區`

### Beats

| L | G | element | action / props | dur | ease |
|---|---|---|---|---|---|
| 0.00 | 40.70 | `m.wrap` | opacity 0 → 1 (crossfade over c4's blooming Taipei node) | 0.50 | power1.inOut |
| 0.00 | 40.70 | camera | `camTo` S → S (hold) | 0.20 | none |
| 0.20 | 40.90 | camera | `camTo` S → B (pull back from Taiwan to the whole FIR) | 2.95 | sine.inOut |
| 0.40 / 0.48 | 41.10 / 41.18 | RCTP / BPW node inner | K.pop (**VO12 beat**) | 0.55 | back.out(1.5) |
| 0.70 / 0.75 | 41.40 / 41.45 | chip02 leader / chip | leader `K.draw` (0.35, expo.out) / inner K.pop from 0.7 + y 10 → 0 (02 first: the hero meets BPW first) | 0.55 | back.out(1.4) |
| 0.90 | 41.60 | BPW | **hero crosses BPW**: 02 pulse r 8 → 30 | 0.90 | power2.out |
| 0.90 | 41.60 | hero highlight | `K.reveal` `c5-rv-hero` 78.54 % → 100 %, locked to the hero (same window, both `ease:"none"`) | 1.45 | none |
| 1.40 / 1.45 | 42.10 / 42.15 | chip01 leader / chip | leader `K.draw` (0.35, expo.out) / inner K.pop from 0.7 + y 10 → 0 (on 「相互配合」 ≈ 42.2; first frame at which the whole box is inside the band) | 0.55 | back.out(1.4) |
| 1.15 | 41.85 | RCTP | pulse (SN arrival) | 0.90 | power2.out |
| 2.35 | 43.05 | RCTP | **hero lands** (01): pulse r 9 → 40 (「相互配合」) | 1.00 | power2.out |
| 2.60 | 43.30 | hero highlight | opacity 0.5 → 0 | 0.50 | power2.inOut |
| 2.70 | 43.40 | BPW | pulse (R02 crossing) | 0.90 | power2.out |
| 2.90 | 43.60 | chips + leaders | K.out inner | 0.35 | power2.in |
| 3.15 | 43.85 | camera | `camTo` B → FB (**VO13 beat**) | 2.75 | sine.inOut |
| 3.20 | 43.90 | gold FIR | `K.reveal` `c5-rv-gold` 0 → 100 % (「臺北飛航情報區」) | 1.60 | power2.inOut |
| 3.30 | 44.00 | `L.firFill` | 0.10 → 0.16 | 1.20 | power2.out |
| 3.50 | 44.20 | halo | 0.25 → 0.8 (0.6, power2.out), then → 0.4 (0.9) | — | — |
| 3.55 · 4.75 · 5.95 · 7.15 | 44.25 · 45.45 · 46.65 · 47.85 | RCTP | pulses (arrivals every 1.2 s) | 0.90 | power2.out |
| 4.20 | 44.90 | FIR label + SE corner dot | dot inner K.pop (0.45, back.out(1.6)); label inner K.inUp; leader `K.draw` 44.95–45.35 (expo.out) | 0.60 | power3.out |
| 4.50 · 6.30 · 8.10 | 45.20 · 47.00 · 48.80 | BPW | pulses (crossings every 1.8 s) | 0.90 | power2.out |
| 4.80 | 45.50 | SS + RCKH dot | `K.reveal` `c5-rv-ss` from RCKH; RCKH inner K.pop (south spoke completes the circle) | 0.80 | expo.out |
| 4.85 / 4.97 / 5.09 / 5.21 | 45.55 / 45.67 / 45.79 / 45.91 | edge dots X_N, X_E1, X_E2, X_S | inner K.pop clockwise (BPW, already shown, is the W member) | 0.45 | back.out(1.6) |
| 5.90 | 46.60 | camera | `camTo` FB → FBp | 2.40 | sine.inOut |
| 5.90 | 46.60 | halo | 0.4 ↔ 0.6 yoyo, repeat 2 | 0.80 | sine.inOut |
| 6.90 / 7.20 / 7.50 / 7.80 | 47.60 / 47.90 / 48.20 / 48.50 | edge dots X_N / X_E1 / X_E2 / X_S | closing sweep, pulse r 6 → 20 in turn; the W step is BPW's **real** crossing pulse at 48.80 (no fake pulse on BPW, no overlap with it) | 0.80 | power2.out |
| 8.30 | 49.00 | — | ends live and moving; no fade (the editor owns the cut) | — | — |

### Aircraft choreography

V = 110 wu/s, ease none, f(t) = f_event − (T − t)·110/L. Spawn at 40.70 unless noted.

| route | event | T (G) | f @ 40.70 / spawn | note |
|---|---|---|---|---|
| RH | **hero**: BPW 41.60, RCTP **43.05** | 43.05 | 0.652 | on screen at (357, 717) at CAM.S |
| RH | BPW 45.20 → RCTP 46.65 | 46.65 | 0.118 | — |
| RH | BPW 48.80 → RCTP 50.25 | 50.25 | spawn 43.50 @ 0 | — |
| R01 | RCTP | 44.25 | 0.570 | — |
| R01 | RCTP | 47.85 | 0.134 | — |
| R01 | RCTP | 51.45 | spawn 43.20 @ 0 | — |
| SN | RCTP | 41.85 | 0.812 | — |
| SN | RCTP | 45.45 | 0.225 | — |
| SN | RCTP | 49.05 | spawn 42.92 @ 0 | — |
| R02 | crossed BPW 39.80 | — | 0.422 | continues east |
| R02 | BPW | 43.40 | 0.177 | — |
| R02 | BPW | 47.00 | spawn 41.70 @ 0 | — |
| R02 | BPW | 50.60 | spawn 45.30 @ 0 | — |
| SS | departs RCKH | 46.10 · 48.50 | @ 0 | alt 0 → 1 over 0.4 s |

- RCTP arrivals: 41.85 · 43.05 · 44.25 · 45.45 · 46.65 · 47.85, every **1.2 s**.
- BPW crossings: 41.60 · 43.40 · 45.20 · 47.00 · 48.80, every **1.8 s**.
- RH and R02 merge before BPW and split after it.

### Transition in/out

- **In (overlap 40.70–41.30 with c4):** c4's gold Taipei node (960, 430) blooms (scale 1 → 2.4, fading, 40.70–41.15) as `m.wrap` fades up 40.70–41.20 at the same spot. CAM.S puts Taiwan's centre at (963, 430) and holds until 40.90; by 41.15 the S → B pull-back has moved Taiwan's centre ≤ 6 px, which is hidden by the fading bloom. c4's plane and trail are gone by 41.25.
- **c4 side:** see Frame 4 *Transition in/out*.
- **Out:** none; the piece ends live at 49.0.

### Ambient loops

- Camera (S → B → FB → FBp, gapless).
- Five even streams.
- Event pulses.
- Halo breathe.
- Closing edge-dot sweep (47.60–49.0), ending on BPW's real crossing.

### Build notes

- Same `ATFM_WORLD` routes and styles as c1.
- Lines that draw on use `K.reveal` only (SS, hero highlight, gold FIR); the other routes are static and unmasked. No `trail` on map planes. The hero's "trail" is the highlight reveal, locked by the identical time window and `ease:"none"`.
- Chips and the FIR label animate inner children only.
- If the scene reads busy, drop SS planes first, then the third R02 plane.
- Assert `K.fracAt(RH, BPW)` ≈ 0.7854 and `K.fracAt(R02, BPW)` ≈ 0.3611 at build.

---

## Snapshot QA (global times)

1.2 · 1.95 · 2.95 · 3.6 · 5.2 · 6.1 · 6.35 · 7.0 · 7.3 · 7.70 · 7.75 · 8.1 · 9.0 · 11.2 · 13.1 · 13.9 · 16.6 · 18.3 · 19.06 · 19.4 · 19.85 · 20.3 · 20.9 · 21.5 · 23.12 · 23.65 · 23.9 · 24.0 · 24.6 · 25.3 · 27.3 · 28.9 · 30.5 · 31.19 · 31.7 · 32.7 · 33.1 · 34.9 · 35.6 · 36.3 · 37.3 · 37.66 · 38.52 · 39.2 · 39.88 · 40.4 · 40.75 · 41.0 · 41.3 · 41.6 · 42.15 · 42.4 · 43.05 · 44.5 · 45.6 · 47.0 · 48.2 · 48.9

**Handoff frames, check for zero jump:** 7.60–7.80 (c1 dive lands RCTP on the DST centre at 7.70), 23.60–23.85 (panel frame), 37.62–37.70 (zone → column), 40.70–41.15 (Taipei node → Taiwan).

**Pin check (c5):** at 41.30 chip01 must not be visible (its box would be at y ≈ 129); at 42.15 its top must be ≥ 238.

**Every frame:** nothing at y ≥ 915; nothing in the header box (x 110–1410, y 60–205); text ≥ 20 px.
