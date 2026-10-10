# ATFM 國際合作版圖動畫

A 17.42 s motion graphic for this voice-over line:

> 對外，我們汲取歐美國際先進的 ATFM 觀念與實務經驗，並拓展國際合作版圖，與日本、韓國、菲律賓、泰國、新加坡等國家一同執行 ATFM 措施。

It uses the design language of the *ATFM APAC orgs* reference animation:
- cream land on a sage sea, with paper grain
- bilingual label cards with a coloured left bar
- ruler-tick ellipses
- header-band cards that collapse into a |wordmark
- the gold TAIPEI FIR outline

The story is carried by the land shapes of Taiwan and of each partner, which lift off the map as each country is named.

**Deliverable:** `out/atfm-intl-cooperation.mp4`. It is 1920×1080 at 59.94 fps (the same as the narration master), 1044 frames, H.264 with no audio. Lay it under the VO starting at the clip's first frame. A native 4K version (3840×2160, same timing) renders with `--scale 2`.

## Storyboard: In → Absorb → Out → Together

Colours carry meaning:
- **Green**: Europe and the US, the sources of ATFM know-how.
- **Gold**: Taiwan and the Taipei FIR.
- **Navy / periwinkle**: cooperation partners.

| Time (s) | Narration | Picture |
|---|---|---|
| 0.00–2.20 | 對外 · 我們汲取 | Close-up on Taiwan. The island floods gold and lifts, the TAIPEI FIR outline draws on and the 臺灣 card lands. The camera then pulls out to a Pacific-centred world map. |
| 1.80–3.85 | 歐美國際先進的 | Europe floods green on 歐 (1.93 s) and the US on 美 (2.14 s), each with a card. Green arcs draw from both into the FIR. |
| 3.50–6.45 | ATFM 觀念與實務經驗 | The green card **ATFM / 汲取歐美先進 / 觀念與實務經驗** lands as "ATFM" is said (3.58–4.35 s), its last line on 觀. Particles stream into Taiwan. |
| 6.40–8.85 | 並拓展國際合作版圖 | The green card is absorbed into Taiwan, and a navy ripple goes out. The camera dives to the Asia-Pacific. The **PARTNERS / 拓展國際 / 合作版圖** card appears, and the ruler ellipse draws around the region with a sea-only wash. |
| 9.00–9.60 | (breath) | The PARTNERS card collapses into a **\|PARTNERS** wordmark, as in the reference. |
| 9.45–13.6 | 與日本 韓國 菲律賓 泰國 新加坡 | On each spoken name, an arc leaves the FIR through a gold handoff diamond. The partner's land shape floods periwinkle and lifts, and its pin and glyph card land. Singapore also gets a locator ring. |
| 13.9–14.8 | 等國家 | A highlight sweeps around the ellipse's ruler ticks and an echo ripple goes out. No unnamed countries are lit. |
| 14.85–17.42 | 一同執行 ATFM 措施 | All six shapes rise together and particles flow both ways on every arc. The navy **ATFM / 與各國一同執行 / 飛航流量管理措施** card appears. The camera comes to rest at 15.45 s, so the last ~2 s are a static hold that can be extended in the edit. |

Sensitivity choices:
- Mainland China is never labelled, filled or tinted. The ellipse wash and Taiwan's gold glow are painted under the land layer, so they tint the sea only.
- Taiwan lights up with Penghu, Kinmen, Matsu, Green Island and Lanyu. Natural Earth has no Matsu, so `engine.js` adds it by hand.
- Crimea is shown with Ukraine.
- The Taiwan card always sits east of the FIR, over the Pacific.
- No national flags: the cooperation is between ATFM units, and the series identifies countries by their land shapes.

Layout choices:
- No text goes below y = 914, so burned-in subtitles stay clear.

## Building and rendering

```bash
npm install          # d3, topojson, world-atlas, playwright (uses the preinstalled Chromium)
npm run setup        # builds data/world.js (Natural Earth 1:10m at 4 detail levels) and downloads Noto Sans TC
npm run render       # renders out/atfm-intl-cooperation.mp4 (about 3 min on 4 cores)
node scripts/render.mjs --audio narration.mp4   # also writes *_with-narration.mp4 for a sync check
node scripts/render.mjs --stills 2.5,9.9        # PNG stills to out/stills/
node scripts/render.mjs --scale 2 --out out/atfm-intl-cooperation_4K.mp4   # native 3840x2160 (same layout, 2x pixels)
scripts/contact-sheet.sh out/atfm-intl-cooperation.mp4 4   # timestamped review sheets
```

To scrub interactively, open `index.html` through any static server (for example `npx http-server`) and use the slider. `?t=12.3` jumps to a time.

## How it works

- `engine.js` is a time-driven renderer: every frame is a pure function of `t`, so renders are deterministic and frame-exact. It has four layers:
  - a canvas base map: sea, embossed land, flat fills and grain;
  - SVG overlays: ellipses, arcs, rings and pins;
  - a canvas for lifted country slabs;
  - HTML label cards.
- The camera interpolates `{center, px per degree}` keyframes with `d3.interpolateZoom`, and the map's detail level switches with the zoom.
- `timeline.js` holds the whole choreography. Word onsets are listed at its top. To retime a beat, edit its `on` / `t0` values.
- `scripts/render.mjs` drives headless Chromium through Playwright and captures each frame over CDP. The frames are encoded with ffmpeg (x264, CRF 14, BT.709 matrix and tags). After rendering it re-renders sample frames on a fresh page and fails if they differ beyond anti-aliasing noise.

Map data is from Natural Earth (public domain) via `world-atlas`. Fonts are Noto Sans TC (SIL OFL).
