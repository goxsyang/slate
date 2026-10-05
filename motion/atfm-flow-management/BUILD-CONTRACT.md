# Scene build contract (read before writing any compositions/*.html)

Project root: this directory. Render = HyperFrames 0.8.130 (headless Chrome seeks every frame).
Visual rules live in DESIGN.md; the plan lives in STORYBOARD.md. This file is the technical contract.

## File shape (sub-composition)

```html
<!doctype html>
<html>
  <head><meta charset="UTF-8" /></head>
  <body>
    <template>
      <style>
        @font-face { font-family: "ATFM Sans"; src: url("assets/fonts/NotoSansTC.woff2") format("woff2"); font-weight: 100 900; font-display: block; }
        @font-face { font-family: "ATFM Mono"; src: url("assets/fonts/IBMPlexMono-SemiBold.woff2") format("woff2"); font-weight: 600; font-display: block; }
        #c2-root { position: absolute; inset: 0; overflow: hidden; }
        #c2-root .c2-xxx { ... }            /* every selector scoped under the scene root id */
      </style>
      <div id="c2-root" data-composition-id="c2-airport" data-width="1920" data-height="1080" data-duration="16.9"></div>
      <script>
        (function () {
          var K = window.ATFM_KIT;               // shared kit (assets/atfm-kit.js) — already loaded by index.html
          var root = document.getElementById("c2-root");
          var tl = gsap.timeline({ paused: true });
          // build DOM/SVG with K.el / K.s / K.card / K.map ... then add tweens at LOCAL times
          tl.set({}, {}, 16.9);                  // pad timeline to the window length
          window.__timelines["c2-airport"] = tl; // key == data-composition-id == host id in index.html
        })();
      </script>
    </template>
  </body>
</html>
```

- ids: `c1-map-intro`, `c2-airport`, `c3-border`, `c4-relay`, `c5-map-outro`; scene root element id `c1-root` … `c5-root`.
  Prefix EVERY id and class you create with the scene prefix (`c2-…`) — ids must be unique across the assembled page
  (SVG `<defs>` ids too: gradients, masks, filters, and K.map `{id:"c2"}`).
- All times in your timeline are LOCAL (0 = the scene's `data-start` in index.html). Window lengths:
  c1 8.2 · c2 16.9 · c3 14.1 · c4 4.0 · c5 8.3. Global→local: subtract the window start (0 / 7.4 / 23.6 / 37.3 / 40.7).
- Font families: only `"ATFM Sans"` and `"ATFM Mono"` (declared in-file as above; lint requires it). Copy must be
  Traditional Chinese (Taiwan). After adding new characters run `python3 tools/subset-fonts.py`.
- Asset URLs are relative to the project root: `assets/img/airport.png`, `assets/img/cloud.png`, `assets/img/truck.png`.

## Seek-safety rules (violations = broken render)

1. ONE paused GSAP timeline, registered last. No `tl.play()`, no `onUpdate/onComplete` callbacks (the runtime seeks with
   events suppressed — callbacks never fire). Express motion as property tweens or the kit plugins:
   `along` (K.fly), `count`, `cam` (K.camTo). `drawSVG` (DrawSVGPlugin), `morphSVG`, `CustomEase` are registered.
2. No `Math.random`, `Date.now`, `performance.now`, timers, fetch. Use `K.rng(seed)`.
3. Never put a CSS `transform` on an element you tween with GSAP x/y/scale/rotation — set initial state with `fromTo`.
   Don't center with `translate(-50%,-50%)`; compute left/top numbers.
4. Never tween `display`/`visibility`/`autoAlpha` on the scene root. Fade children.
5. Use `fromTo` for anything that must be hidden before it appears (fromTo renders its start state immediately).
   For several sequential tweens on the same property of the same element, the first is `fromTo`, later ones `to`
   with consistent values. `repeat` counts must be finite.
6. Don't measure layout (`getBoundingClientRect`) to place things; compute coordinates with numbers.
   `path.getTotalLength()/getPointAtLength()` is fine (geometry, not layout).
7. Transformed HTML elements must be block/inline-block/flex items with real size.

## Kit cheat-sheet (assets/atfm-kit.js — read it for signatures)

- DOM: `K.el(tag, attrs, kids)`, `K.s(svgTag, attrs, kids)`; `K.card({x,y,w,h,title,body,note})`, `K.chip(text,{x,y,warn,card})`,
  `K.slots(["on","off","empty"])` (+ `row.__slots`), `K.slotTo(tl, slot, "on"|"off"|"teal2", t)`, `K.panel({...})`, `K.tag(text, ok)`,
  `K.roll("10:05",{h})` + `K.rollTo(tl, el, "10:25", t)`, `K.node(x,y,{r,color})` (SVG), `K.airport({x,y,w})`, `K.img({src,x,y,w})`,
  `K.cones({n,h})`, `K.rain(tl, svg, {...})`.
- Geometry: `K.arc(x0,y0,x1,y1,bulge)`, `K.smooth(points)`, `K.AIRPORT` (runway/stands/squash), `K.airportPt(ax,ay,aw,px,py)`.
- Aircraft: `K.plane({len, alt, squash, x, y, angle})` → SVG `<g>`; `K.fly(tl, plane, pathEl, t, dur, {from,to,alt0,alt1,squash0,squash1,trail,trailLen,ease})`;
  `K.placePlane(g,x,y,angle,alt,squash)` for static placement. Planes and their paths must live in the SAME svg coordinate space.
- Motion: `K.inUp(tl, el, t, {y,dur,scale})`, `K.out(tl, el, t)`, `K.pop(tl, el, t)`, `K.draw(tl, path, t, dur)`, `K.undraw`,
  `K.flow(tl, dashedPath, t0, t1, speed)`, `K.pulse(tl, circle, t, {r0,r1,dur,repeat})`, `tl.to(el,{count:{from,to,fmt}},t)`.
- Map: `var m = K.map(root, {id:"c1", band:[220,860], cam:{cx,cy,z}})`; `K.ll(lon,lat)` → world xy; add SVG to `m.world`
  (routes: use `vector-effect="non-scaling-stroke"`), keep markers screen-sized with `K.mapFixed(m, g, x, y, k)`, planes with
  `K.mapPlane(m, plane)`, HTML labels with `K.pin(m, el, x, y, dx, dy)`; camera ONLY via `K.camTo(tl, m, t, dur, fromState, toState, ease)`
  with explicit, chained states. `m.L.taiwan`, `m.L.firFill`, `m.L.firLine` are pre-built layers (opacity 0 / plain by default).

## Layout guardrails

- Stage content within y 220–860 (map band may feather 20 px beyond). NOTHING in y ≥ 915. Keep clear of the header
  area (x 110–1410, y 60–205) and the footnote (x 1480–1810, y 868–906).
- Text ≥ 20 px. Max ~12 CJK characters per label line. No `<br>`.
- z-order inside a scene via `z-index` / SVG order.

## Verify before handing back

```bash
npx hyperframes lint                       # must be 0 errors
npx hyperframes snapshot --at <global times> -o /tmp/claude-0/-home-user-slate/24d7b024-93d3-5c9d-afd5-aa5100195b80/scratchpad/snap-<scene> --no-end
```
Look at every snapshot PNG with the Read tool (they are 1920×1080) and fix what looks wrong before finishing.
