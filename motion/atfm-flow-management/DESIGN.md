# ATFM 兩種流量管理功能 — Design System (v5)

Source of truth for every composition in this project. Derived from the client's v4 reference
(`ATFM 流量管理 v4`, HyperFrames 0.8.128, 1920×1080, 59.94 fps) and refined toward a more
polished, editorial motion-graphics treatment. **Do not invent new colours, fonts, radii or
easing families** — extend only through the tokens below.

## 1. Concept

> *"Calm, precise choreography of the sky."* Air traffic is shown as an orderly, breathing system:
> lines draw with intent, aircraft move at even spacing, and every constraint (weather, runway
> work, a restricted boundary point) is answered by the system re-timing departures so the
> flow stays smooth. Editorial infographic, not sci-fi HUD.

Mood words: 安定、精準、有序、溫潤 (calm, precise, orderly, warm).

## 2. Canvas & layout grid

- 1920×1080, 59.94 fps (`60000/1001`). Composition length **49.0 s**. t=0 ≙ source TC `00;04;26;25`.
- Left margin **110 px**; right margin **110 px** (content right edge x=1810).
- **Header band** y 60–200: kicker (y≈88 cap-centre) + title (y≈150 cap-centre). Owned by the ROOT
  composition (`#hdr`), never by scenes.
- **Stage band** y 220–860: all scene content lives here.
- **Footnote** right-aligned at x=1810, y≈890: `航路、時段與機場配置為解說示意`. Owned by ROOT.
- **Subtitle-safe zone y 915–1080 must stay EMPTY** (editor burns subtitles there). Nothing may
  enter it except the plain background and full-bleed background treatments.

## 3. Colour tokens (CSS custom properties in `assets/atfm.css`)

| token | hex | use |
|---|---|---|
| `--bg` | `#F3ECE5` | page background (warm cream) |
| `--bg-deep` | `#EAE2D8` | vignette / pressed surfaces |
| `--card` | `#FBF7F2` | cards, labels |
| `--card-line` | `#E6DDD2` | 1 px card border |
| `--ink` | `#2F3A37` | body text on cards |
| `--ink-soft` | `#6E6A64` | kicker, footnote, secondary labels |
| `--teal` | `#1F6B62` | primary: titles, routes, nodes, available slots |
| `--teal-2` | `#3E8C80` | secondary teal, hover/active states, gradients |
| `--teal-soft` | `#A9C7BD` | pale routes, inactive arcs |
| `--mint` | `#E1EEE8` | zone fills, chips |
| `--sea` | `#C9D4CD` | map sea |
| `--sea-deep` | `#B9C8BF` | map sea vignette |
| `--land` | `#EEE8DD` | map land |
| `--coast` | `#D2CABD` | coastline stroke |
| `--terra` | `#B25135` | constraint / restriction accent (dots, warning text) |
| `--terra-soft` | `#F2DDD3` | constraint chip background |
| `--slot-off` | `#D8C4B9` | restricted / unavailable slot |
| `--gold` | `#A8761A` | Taiwan / Taipei FIR hub accent (used sparingly) |
| `--gold-soft` | `#E9D9B0` | Taiwan land highlight |

Rules: teal = system / order; terracotta = constraint; gold = Taiwan identity. No pure black,
no pure white backgrounds, no saturated blues, no neon glows.

## 4. Typography

- **Noto Sans TC** (variable, `assets/fonts/NotoSansTC.woff2`, weights 300–800) for everything
  CJK and Latin. Family name in CSS: `"ATFM Sans"`.
- **IBM Plex Mono** Medium/SemiBold (`"ATFM Mono"`) only for data inside the system panel
  (flight IDs, clock times like `10:25`, counts).
- Scale: title 54/700 teal, letter-spacing 0.02em · kicker 22/500 `--ink-soft`, letter-spacing 0.22em ·
  card title 30/700 teal · card body 24/500 ink · label 26/700 teal · small label 20/500 ink-soft ·
  section numeral 220/200 teal (thin) · footnote 20/500 ink-soft.
- Full-width CJK space `　` separates number and phrase (`第一　機場端流量管理`).
- Never use `<br>` in body copy.

## 5. Shape language

- Cards: radius 20, 1 px `--card-line` border, fill `--card`, shadow
  `0 18px 40px -22px rgba(60,48,36,.35), 0 2px 6px rgba(60,48,36,.06)`.
- Chips: radius 12 (pill height 48), fill `--mint` (system) or `--terra-soft` (constraint).
- Slot bars: 64×22, radius 6, gap 12. States: `on` = teal, `off` = slot-off, `assigned` = teal with
  white check tick, `pending` = 2 px teal outline on card.
- Routes: 5 px teal round-capped; secondary routes 3 px `--teal-soft`; data/signal links 3 px
  dashed (10/12) `--teal-2`.
- Nodes: 18 px teal dot with 4 px `--card` ring; constraint node uses `--terra`.
- Aircraft: vector top-view airliner (`ATFM_KIT.plane()`), white fuselage, teal tail, soft
  ground shadow. Always oriented along its path tangent.
- Airports: isometric raster `assets/img/airport.png` (cut-out of the v4 airport, upscaled), with
  CSS contact shadow. Never distort its aspect ratio.

## 6. Motion language

- Eases: entrances `power3.out` (0.6–0.9 s) / `expo.out` for line draws; exits `power2.in` (0.35–0.5 s);
  state changes `power2.inOut`; camera moves `sine.inOut` (2–4 s). Springy `back.out(1.4)` only for
  small chips/dots popping in.
- Stagger 0.06–0.12 s. Nothing pops in without a motion (fade+8–16 px rise, mask wipe, or line draw).
- **Always alive:** every scene keeps a slow camera drift (scale 1.00→1.03 or 8–20 px pan) and
  at least one ambient loop (aircraft moving, pulses, signal dashes) so no frame is ever frozen.
- Aircraft move with eased velocity (no linear except cruise), spacing between aircraft is even —
  the visual metaphor for flow management.
- Constraints arrive with a short terracotta pulse (scale 0.6→1, ring expanding 1→2.2, opacity 0.5→0).
- System actions (ATFM re-timing) are shown by dashed signal lines travelling from the system panel
  to the departure airport, followed by time values rolling to new values.
- VO sync: the visual beat for a line lands 0.1–0.3 s **after** the VO line starts; every scene
  must land its key information while its VO line is speaking.
- Transitions between sub-compositions: 0.5–0.8 s overlap; outgoing content fades/moves out,
  incoming builds in (no hard cuts, no flashy wipes).

## 7. Header (root) text schedule

| t (s) | kicker | title |
|---|---|---|
| 0.00 | `ATFM　飛航流量管理` | `兩種流量管理功能` |
| 5.30 | `ATFM　飛航流量管理` | `全方位守護臺灣的天空` |
| 7.57 | `01　AIRPORT FLOW MANAGEMENT` | `第一　機場端流量管理` |
| 10.91 | `01　機場端流量管理` | `目的地受限，到場容量降低` |
| 18.65 | `01　機場端流量管理` | `自動重新派發起飛時間` |
| 23.91 | `02　BORDER POINT FLOW MANAGEMENT` | `第二　邊境點流量管理` |
| 26.96 | `02　邊境點流量管理` | `邊境點受限，通過時段縮減` |
| 30.08 | `02　邊境點流量管理` | `自動調控過境航班起飛時間` |
| 34.75 | `02　邊境點流量管理` | `達成跨區作業整合` |
| 37.77 | `跨區協作　CROSS-REGION` | `超越國界的接力賽` |
| 40.97 | `01 ＋ 02` | `兩項功能相互配合` |
| 43.73 | `臺北飛航情報區　TAIPEI FIR` | `讓天空運作更加順暢` |

## 8. VO timing (relative to t=0)

| # | start | end | line |
|---|---|---|---|
| 1 | 0.000 | 4.805 | ATFM 系統現階段提供 2 種流量管理功能 |
| 2 | 5.305 | 7.574 | 全方位守護臺灣的天空 |
| 3 | 7.574 | 10.661 | 第一 機場端流量管理 |
| 4 | 10.911 | 15.199 | 當目的地機場因天氣或跑道維護等因素 |
| 5 | 15.566 | 17.985 | 而降低機場到場容量時 |
| 6 | 18.652 | 23.273 | 系統會自動重新派發起飛機場航班的起飛時間 |
| 7 | 23.907 | 26.393 | 第二 邊境點流量管理 |
| 8 | 26.960 | 29.513 | 當邊境點受到流管限制時 |
| 9 | 30.080 | 34.484 | 系統能自動調控並派發過境航班的起飛時間 |
| 10 | 34.751 | 37.204 | 達到跨區作業整合目的 |
| 11 | 37.771 | 40.541 | 這是一場超越國界的接力賽 |
| 12 | 40.974 | 43.193 | 這 2 項功能相互配合 |
| 13 | 43.727 | 47.364 | 讓臺北飛航情報區的天空運作更加順暢 |

## 9. Accuracy guardrails

- Taiwan must always be present and correctly drawn on every map (the v4 map omitted it).
- The Taipei FIR outline comes from `ATFM_MAP.fir.RCAA` — the OFFICIAL CAA eAIP ENR 2.1 lateral limits
  (21°N 117°30′E – 21°N 121°30′E – 23°30′N 124°E – 29°N 124°E – 29°N 117°30′E). Do not hand-draw it.
- **Routes are real ATS routes only**: A1 (ELATO–MKG–APU–BULAN) and M750 (ENVAR–ANLOT–SANAS–MOLKA) from
  `ATFM_WORLD.AIRWAY`, drawn as straight segments between fixes. Never invent a route or a boundary point.
- No national borders, no country names, no flags, no airline liveries or logos.
- Neighbouring regions are referred to generically (`區域 A / B / C`, `鄰近飛航情報區`). Boundary
  points are unnamed (`邊境點`). All routes/slots/times are illustrative (footnote says so).
- Times in the system panel use 24 h `HH:MM`, illustrative values only.
