/* s3_cost — S3 投入範圍：硬體投入 645 萬 → 為國家節省 約 4 億元
 *            (window 17.0 → 30.03 s, one merged page; header 「03　投入範圍／
 *            硬體投入」 stays up to the end, no footnote)
 *
 * LEFT  hardware block  — terracotta frame around ONE server cabinet, short
 *        connector, KPI 「硬體費用 645 萬元」 + accent bar + 「伺服器與網路設備」.
 *   17.12  frame draws with the chrome header; floor wipes in.  Until the
 *          savings block arrives the whole hardware block sits 250 px right
 *          of home, so the lone block is balanced on the page
 *   17.46  empty cabinet rises; units slide out from behind the right post
 *          (bottom → top) with empty plug sockets; the plugs seat in the top
 *          switch and their leads grow down the gutter and fan into the patch
 *          unit at the bottom, seating its plugs (no cable leaves the
 *          cabinet); status LEDs boot unit by unit (patch unit boots as its
 *          plugs seat, ~19.5)
 *   19.56  connector → 「硬體費用」, 645 counter lands ~0.5 s after 「645 萬」,
 *          萬元 + accent bar; 20.92 secondary line on 「硬體費用」
 *   21.48  「make room」: the hardware block glides home (lands 22.36)
 *
 * RIGHT savings block   — 「軟體自主研發完成」 ＋ 「後續維護費用」 → terracotta
 *        sum bracket → 「為國家節省公帑」 / 「約 4 億元」 (the hero).
 *   22.36  「自主研發完成」: teal pill builds, check draws; rack LEDs turn mint
 *          together and a light sweep crosses the metal
 *   23.8   (VO pause) ＋ draws, light pill 「後續維護費用」 with a wrench that
 *          turns into place; 24.57 terracotta ↓ badge (cost avoided)
 *   25.04  「為國家節省了」: bracket draws under the pills, 「為國家節省」 rises;
 *          25.46 junction + stem hand the sum down to the result
 *   26.35  「約 4 億元」: 約 → 4 rolls into its mask → 億元 → accent bar 27.0;
 *          27.16 「公帑」 completes the label
 *   27.9 → 30.03  composed hold: both blocks float (mid-swing), the hero
 *          breathes 1 → 1.012, LEDs idle-blink.
 *
 * The cabinet is assets/rack_cabinet.png (built by tools/make_rack_cabinet.py
 * from the reference rack.png): a two-panel sprite — left the assembled
 * cabinet, right the same cabinet empty — in rack.png's pixel coordinates.
 * Unit canvases are cut from the assembled panel at build time.
 *
 * Every frame is a pure function of t (paused GSAP timeline + K.onFrame).
 */
MG.scene("s3_cost", function (tl) {
  const { C } = K;
  const W = CUES.words;
  const T_IN = 17.0;

  // ------------------------------------------------------------- helpers
  const TAU = 2 * Math.PI;
  const ez = (n) => gsap.parseEase(n);
  const c01 = K.clamp01;
  const lerp = (a, b, p) => a + (b - a) * p;
  const f2 = (v) => (Math.round(v * 100) / 100).toString();
  const div = (parent, style, cls) => K.el("div", { cls: "abs " + (cls || ""), style: style || {} }, parent);
  const S = (tag, attrs, parent) => K.svg(tag, attrs, parent);
  function setVis(node, on) {
    const v = on ? "visible" : "hidden";
    if (node.style.visibility !== v) node.style.visibility = v;
  }
  function setAttr(node, k, v) {
    if (node.getAttribute(k) !== v) node.setAttribute(k, v);
  }
  // line-box top → alphabetic baseline for Noto Sans TC
  const baseOff = (size, lh) => (lh / 2 + 0.436) * size;
  // CJK ink sits ~0.075em below the Latin baseline: lift CJK units by that
  const CJK_LIFT = 0.075;
  /** envelope-controlled float (CSS translate; composes with GSAP transform) */
  function floatEnv(node, o, env) {
    const ax = o.ax || 0, ay = o.ay || 0, per = o.period || 5, ph = o.phase || 0;
    K.onFrame((t) => {
      const e = env ? env(t) : 1;
      const a = (TAU * t) / per + ph;
      node.style.translate = `${f2(ax * e * Math.sin(a * 0.83 + 1.3))}px ${f2(ay * e * Math.sin(a))}px`;
    });
  }
  const ramp = (from, dur) => (t) => K.prog(t, from, dur || 1.2, "sine.inOut");
  function hex(c) { return [1, 3, 5].map((i) => parseInt(c.substr(i, 2), 16)); }
  function mix(a, b, p) {
    const A = hex(a), B = hex(b);
    return "rgb(" + A.map((v, i) => Math.round(lerp(v, B[i], p))).join(",") + ")";
  }

  // ------------------------------------------------------------- layer
  const layer = K.layer("s3", 3);
  // content band y 225–888: clear of the 74 px title above (glyphs end y 173)
  const GUARD = "linear-gradient(to bottom, transparent 200px, #000 224px, #000 888px, transparent 902px)";
  layer.style.webkitMaskImage = GUARD;
  layer.style.maskImage = GUARD;
  K.onFrame((t) => setVis(layer, t >= T_IN));

  // =================================================================
  // LEFT — frame, floor, cabinet
  // =================================================================
  const SPRITE = "assets/rack_cabinet.png";
  const RW = 324, RH = 561;          // one sprite panel (cabinet ink x 11–321)
  const PADX = 40;
  const FR = { x0: 120, y0: 252, r: 4 };
  const RX = FR.x0 + PADX - 11, RY = FR.y0 + 18;
  FR.x1 = RX + 321 + PADX;
  FR.y1 = RY + 574;
  const FLOOR_Y = RY + 538;

  const A = div(layer);
  // one shared float for the cabinet and the KPI column, so the connector
  // that joins them never shears; phased so the block is mid-swing (≈ 6 px
  // of travel) through the final hold 27.9 → 30.03
  const aFloat = div(A);
  floatEnv(aFloat, { ay: 3.5, ax: 0.9, period: 6.2, phase: 2.08 }, ramp(18.9, 1.5));
  // 「make room」: while it is the only block on the page the hardware block
  // sits GLIDE px right of home (balanced on the canvas); it glides home just
  // before the savings block arrives, landing as pill 1 pops (22.36)
  const GLIDE = 250, T_GLIDE = 21.48, GLIDE_D = 0.88;
  tl.fromTo(A, { x: GLIDE }, { x: 0, duration: GLIDE_D, ease: "power3.inOut" }, T_GLIDE);

  const frameSvg = K.svgCanvas(aFloat);
  // floor band + contact shadow (inside the frame)
  const floorG = S("g", {}, frameSvg);
  S("rect", { x: FR.x0 + 2, y: FLOOR_Y, width: FR.x1 - FR.x0 - 4, height: FR.y1 - FLOOR_Y - 2, fill: "#e9f1f9" }, floorG);
  S("rect", { x: FR.x0 + 2, y: FLOOR_Y, width: FR.x1 - FR.x0 - 4, height: 2, fill: "#d5e4f2" }, floorG);
  const shadowG = S("g", {}, frameSvg);
  S("ellipse", { cx: RX + 166, cy: RY + 558, rx: 172, ry: 6, fill: "#d3e2f0" }, shadowG);
  // frame: two halves drawn from the top-left corner, meeting bottom-right
  const r = FR.r;
  const frameAttrs = { fill: "none", stroke: C.terra, "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round" };
  const frameA = S("path", Object.assign({
    d: `M${FR.x0 + r} ${FR.y0} L${FR.x1 - r} ${FR.y0} A${r} ${r} 0 0 1 ${FR.x1} ${FR.y0 + r} L${FR.x1} ${FR.y1 - r} A${r} ${r} 0 0 1 ${FR.x1 - r} ${FR.y1}`,
  }, frameAttrs), frameSvg);
  const frameB = S("path", Object.assign({
    d: `M${FR.x0 + r} ${FR.y0} A${r} ${r} 0 0 0 ${FR.x0} ${FR.y0 + r} L${FR.x0} ${FR.y1 - r} A${r} ${r} 0 0 0 ${FR.x0 + r} ${FR.y1} L${FR.x1 - r} ${FR.y1}`,
  }, frameAttrs), frameSvg);

  // the frame starts with the chrome header (17.25), right after S2 has gone
  const T_FRAME = 17.12;
  tl.fromTo(frameSvg, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05, ease: "none" }, T_FRAME);
  K.drawIn(tl, frameA, T_FRAME, 1.0, "power3.out");
  K.drawIn(tl, frameB, T_FRAME, 1.0, "power3.out");
  // floor wipes in (left → right) ahead of the cabinet, so the base never floats
  tl.fromTo(floorG, { opacity: 0, scaleX: 0.0, svgOrigin: `${FR.x0} ${FLOOR_Y}` }, { opacity: 1, scaleX: 1, duration: 0.6, ease: "power3.out" }, 17.32);
  tl.fromTo(shadowG, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.out" }, 17.95);

  // ---- cabinet canvases ----------------------------------------------
  const rackBox = div(aFloat, { left: RX, top: RY, width: RW, height: RH });
  const IMG = MG.images[SPRITE];
  function mkCanvas(parent, x, y, w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.className = "abs";
    Object.assign(c.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
    parent.appendChild(c);
    return c;
  }
  // assembled cabinet (sprite panel 1)
  const fullCv = document.createElement("canvas");
  fullCv.width = RW; fullCv.height = RH;
  fullCv.getContext("2d").drawImage(IMG, 0, 0, RW, RH, 0, 0, RW, RH);

  // unit slots (PNG coords): x 40–292 incl. mounting ears
  const UX0 = 40, UX1 = 292;
  const UNITS = [
    { y0: 55, y1: 93 },   // 0 switch (patch leads plugged in)
    { y0: 145, y1: 201 }, // 1 server
    { y0: 211, y1: 267 }, // 2 server
    { y0: 277, y1: 349 }, // 3 storage
    { y0: 362, y1: 418 }, // 4 server
    { y0: 470, y1: 508 }, // 5 patch unit (leads plugged in from above)
  ];

  // empty cabinet (sprite panel 2)
  const cab = mkCanvas(rackBox, 0, 0, RW, RH);
  cab.getContext("2d").drawImage(IMG, RW, 0, RW, RH, 0, 0, RW, RH);

  // units: clipped at the right rail where the mounting ears end, so each one
  // slides out from behind the post and never crosses the side panel
  const unitsClip = div(rackBox, { left: 0, top: 0, width: RW, height: RH });
  unitsClip.style.clipPath = `inset(0px ${RW - UX1}px 0px 0px)`;
  // the switch (0) and the patch unit (5) slide in with EMPTY plug sockets:
  // the four plug heads (x 223–270, y 64–92 / mirrored 471–499) are painted
  // over with the bare faceplate (column x 274 of the same rows, stretched),
  // and the cable masks below — same x, same half-width — reveal them as the
  // leads plug in, so no unit ever shows cut-off cable stubs
  const PLUG_X = [229, 240, 252, 265], PLUG_HW = 6;
  const PLUG_ROWS = { 0: [63, 94], 5: [469, 500] };
  const unitCv = UNITS.map((u, i) => {
    const c = mkCanvas(unitsClip, UX0, u.y0, UX1 - UX0, u.y1 - u.y0);
    const ctx = c.getContext("2d");
    ctx.drawImage(fullCv, UX0, u.y0, UX1 - UX0, u.y1 - u.y0, 0, 0, UX1 - UX0, u.y1 - u.y0);
    const rows = PLUG_ROWS[i];
    if (rows) {
      const y0 = Math.max(rows[0], u.y0), y1 = Math.min(rows[1], u.y1);
      PLUG_X.forEach((x) => ctx.drawImage(fullCv, 274, y0, 1, y1 - y0, x - PLUG_HW - UX0, y0 - u.y0, 2 * PLUG_HW, y1 - y0));
    }
    return c;
  });

  // patch leads: the assembled raster revealed through stroked masks that grow
  // along each cable (pure function of t, redrawn per frame in the window).
  // The bottom fan mirrors the top one (y → 563 − y).
  const cblCv = mkCanvas(rackBox, 0, 0, RW, RH);
  const bctx = cblCv.getContext("2d");
  const T_CBL = 18.6;
  const T_BOT = T_CBL + 0.6;
  const CABLES = [
    // four plugs seat in the top switch, their leads fan out into the gutter
    { d: "M229 69 L229 96 C230 116 248 129 292 138", w: 12, at: T_CBL, dur: 0.26, ease: "power2.in" },
    { d: "M240 69 L240 96 C241 112 256 125 293 136", w: 12, at: T_CBL + 0.035, dur: 0.26, ease: "power2.in" },
    { d: "M252 69 L252 96 C252 109 265 121 294 134", w: 12, at: T_CBL + 0.07, dur: 0.26, ease: "power2.in" },
    { d: "M265 69 L265 96 C266 106 277 118 295 132", w: 12, at: T_CBL + 0.105, dur: 0.26, ease: "power2.in" },
    // bundle down the gutter past the ties (constant speed ≈ 700 px/s)
    { d: "M296 126 L299 140 L299.5 423 L296 437", w: 22, at: T_CBL + 0.2, dur: 0.44, ease: "none" },
    // and into the patch unit at the bottom, decelerating as the plugs seat
    { d: "M292 425 C248 434 230 447 229 467 L229 494", w: 12, at: T_BOT, dur: 0.27, ease: "power2.out" },
    { d: "M293 427 C256 438 241 451 240 467 L240 494", w: 12, at: T_BOT + 0.02, dur: 0.26, ease: "power2.out" },
    { d: "M294 429 C265 442 253 454 252 467 L252 494", w: 12, at: T_BOT + 0.04, dur: 0.25, ease: "power2.out" },
    { d: "M295 431 C277 445 266 457 265 467 L265 494", w: 12, at: T_BOT + 0.06, dur: 0.24, ease: "power2.out" },
  ];
  (function () {
    const probe = S("svg", { width: 0, height: 0, style: "position:absolute" }, layer);
    CABLES.forEach((c) => {
      const p = S("path", { d: c.d }, probe);
      c.len = p.getTotalLength();
      c.p2d = new Path2D(c.d);
      c.e = ez(c.ease);
    });
    probe.remove();
  })();
  const CBL_END = Math.max(...CABLES.map((c) => c.at + c.dur));
  const T_SWAP = CBL_END + 0.02, SWAP_D = 0.2;
  let cblKey = "";
  K.onFrame((t) => {
    const on = t >= T_CBL && t < T_SWAP + SWAP_D + 0.02;
    setVis(cblCv, on);
    if (!on) return;
    const ps = CABLES.map((c) => c.e(c01((t - c.at) / c.dur)));
    const key = ps.map((p) => p.toFixed(4)).join(",");
    if (key === cblKey) return;
    cblKey = key;
    bctx.globalCompositeOperation = "source-over";
    bctx.clearRect(0, 0, RW, RH);
    bctx.strokeStyle = "#fff";
    bctx.lineCap = "round";
    bctx.lineJoin = "round";
    CABLES.forEach((c, i) => {
      const p = ps[i];
      if (p <= 0.002) return;
      bctx.lineWidth = c.w;
      bctx.setLineDash(p >= 1 ? [] : [c.len * p, c.len + 50]);
      bctx.stroke(c.p2d);
    });
    bctx.setLineDash([]);
    bctx.globalCompositeOperation = "source-in";
    bctx.drawImage(fullCv, 0, 0);
    bctx.globalCompositeOperation = "source-over";
  });

  // assembled cabinet (takes over once everything is in place)
  const fullView = mkCanvas(rackBox, 0, 0, RW, RH);
  fullView.getContext("2d").drawImage(fullCv, 0, 0);

  const T_CAB = 17.46;
  tl.fromTo(cab, { clipPath: "inset(100% 0% 0% 0%)", y: 10 }, { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.7, ease: "power3.inOut" }, T_CAB);
  tl.fromTo(cab, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: "none" }, T_CAB);
  // units slide out from behind the right post, bottom → top
  const UNIT_AT = [18.4, 18.3, 18.2, 18.11, 18.02, 17.94];
  const UNIT_TRAVEL = 96;
  unitCv.forEach((c, i) => {
    tl.fromTo(c, { x: UNIT_TRAVEL }, { x: 0, duration: 0.6, ease: "expo.out" }, UNIT_AT[i]);
    tl.fromTo(c, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04, ease: "none" }, UNIT_AT[i]);
  });
  tl.fromTo(fullView, { autoAlpha: 0 }, { autoAlpha: 1, duration: SWAP_D, ease: "none" }, T_SWAP);
  tl.set([cab, ...unitCv], { autoAlpha: 0, immediateRender: false }, T_SWAP + SWAP_D + 0.02);

  // ---- status LEDs --------------------------------------------------
  const LED_SPEC = [];
  // switch indicators (the patch unit's are the mirror image, y → 563 − y)
  [[69.5, 68], [69.5, 79.5], [87.5, 68], [87.5, 79.5]].forEach(([x, y], k) => {
    LED_SPEC.push({ u: 0, x, y, w: 10, h: 5.5, k });
    LED_SPEC.push({ u: 5, x, y: 563 - y, w: 10, h: 5.5, k });
  });
  // servers: power button + two status squares
  [[1, 146], [2, 212], [4, 363]].forEach(([u, oy]) => {
    LED_SPEC.push({ u, x: 244.5, y: oy + 14, rad: 4.2, k: 0 });
    LED_SPEC.push({ u, x: 244.5, y: oy + 27.75, w: 5.5, h: 5, k: 1 });
    LED_SPEC.push({ u, x: 244.5, y: oy + 41, w: 6.5, h: 5, k: 2 });
  });
  // storage drive activity dots
  [83, 105, 127, 149, 171, 193, 215, 237, 252].forEach((x, k) => LED_SPEC.push({ u: 3, x, y: 329.5, rad: 2.6, k, drive: true }));

  const ledSvg = S("svg", { width: RW, height: RH, viewBox: `0 0 ${RW} ${RH}`, style: "position:absolute;left:0;top:0;overflow:visible" }, rackBox);
  const BOOT_AT = [18.72, 18.84, 18.95, 19.06, 19.17, CBL_END + 0.02]; // patch unit boots as its leads plug in
  const T_READY = 22.9;
  const AMBER = { core: "#ffd29c", halo: "#ee8b43" };
  const MINT = { core: "#a6f3dd", halo: "#2fb999" };
  const lrng = K.rng(3317);
  const leds = LED_SPEC.map((s) => {
    const g = S("g", { transform: `translate(${s.x} ${s.y})` }, ledSvg);
    // halos stay tight; on the light switch faceplates they are dialled down
    const light = s.u === 0 || s.u === 5;
    const halo = S("circle", { r: s.rad ? s.rad * 1.85 : Math.max(s.w, s.h) * (light ? 0.8 : 1.0), fill: AMBER.halo, opacity: 0 }, g);
    const core = s.rad
      ? S("circle", { r: s.rad, fill: AMBER.core, opacity: 0 }, g)
      : S("rect", { x: -s.w / 2, y: -s.h / 2, width: s.w, height: s.h, rx: 1.4, fill: AMBER.core, opacity: 0 }, g);
    return {
      s, g, halo, core,
      on: BOOT_AT[s.u] + s.k * 0.035,
      per: s.drive ? 0.55 + lrng() * 0.6 : 1.6 + lrng() * 1.6,
      ph: lrng() * TAU,
      haloK: light ? 0.22 : 0.4,
    };
  });
  const readyE = ez("power2.inOut");
  K.onFrame((t) => {
    const rp = readyE(c01((t - T_READY) / 0.3));
    const flash = Math.max(0, 1 - Math.abs(t - (T_READY + 0.12)) / 0.45);
    const coreC = mix(AMBER.core, MINT.core, rp), haloC = mix(AMBER.halo, MINT.halo, rp);
    for (const L of leds) {
      const a = t - L.on;
      let b = 0;
      if (a >= 0) {
        // power-on: quick blink, then settle into a slow idle pulse
        if (a < 0.07) b = 1;
        else if (a < 0.13) b = 0.18;
        else {
          const ph = (TAU * t) / L.per + L.ph;
          const pulse = 0.5 + 0.5 * Math.cos(ph);
          b = L.s.drive ? 0.42 + 0.58 * Math.pow(pulse, 2.2) : 0.72 + 0.28 * Math.pow(pulse, 1.6);
          b = Math.min(1, b * c01((a - 0.13) / 0.08 + 0.6));
        }
      }
      b = Math.min(1.25, b + 0.6 * flash * (a > 0 ? 1 : 0));
      setAttr(L.core, "opacity", f2(Math.min(1, b)));
      setAttr(L.halo, "opacity", f2(L.haloK * b));
      setAttr(L.core, "fill", coreC);
      setAttr(L.halo, "fill", haloC);
    }
  });

  // ---- light sweep: only the navy metal catches it --------------------
  // mask = the assembled sprite panel at 1:1 through a colour matrix that
  // keeps dark opaque pixels (navy metal) and drops light fills:
  // A' = 2.2·A − 0.8·(R+G+B); the mask region crops the sprite to panel 1
  const sweepSvg = S("svg", { width: RW, height: RH, viewBox: `0 0 ${RW} ${RH}`, style: "position:absolute;left:0;top:0;overflow:visible" }, rackBox);
  const sdefs = S("defs", {}, sweepSvg);
  const sgrad = S("linearGradient", { id: "s3-sweep-g", x1: 0, y1: 0, x2: 1, y2: 0 }, sdefs);
  [[0, 0], [0.5, 0.42], [1, 0]].forEach(([o, a]) => S("stop", { offset: o, "stop-color": "#ffffff", "stop-opacity": a }, sgrad));
  const darkF = S("filter", { id: "s3-sweep-dark", filterUnits: "userSpaceOnUse", x: 0, y: 0, width: RW, height: RH, "color-interpolation-filters": "sRGB" }, sdefs);
  S("feColorMatrix", { type: "matrix", values: "0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -0.8 -0.8 -0.8 2.2 0" }, darkF);
  const smask = S("mask", { id: "s3-sweep-mask", maskUnits: "userSpaceOnUse", x: 0, y: 0, width: RW, height: RH, "mask-type": "alpha", style: "mask-type:alpha" }, sdefs);
  S("image", { href: SPRITE, x: 0, y: 0, width: 2 * RW, height: RH, preserveAspectRatio: "none", filter: "url(#s3-sweep-dark)" }, smask);
  const sweepG = S("g", { mask: "url(#s3-sweep-mask)" }, sweepSvg);
  const sweep = S("rect", { x: -90, y: -40, width: 180, height: RH + 80, fill: "url(#s3-sweep-g)" }, sweepG);
  const T_SWEEP = 22.78, SWEEP_D = 0.9;
  const sweepE = ez("power1.inOut");
  K.onFrame((t) => {
    const p = (t - T_SWEEP) / SWEEP_D;
    const on = p > 0 && p < 1;
    setVis(sweepSvg, on);
    if (!on) return;
    const x = lerp(-160, RW + 160, sweepE(p));
    sweep.setAttribute("transform", `translate(${f2(x)} 0) skewX(-18)`);
  });

  // =================================================================
  // LEFT — connector, 「硬體費用 645 萬元」, secondary
  // =================================================================
  const CONN_LEN = 80, CONN_GAP = 47;
  const TX = FR.x1 + CONN_LEN + CONN_GAP;
  // 645 stays fully legible but a step below the 4 億 hero (230 / 94)
  const LBL = 54, NUM = 170, UNIT = 64, SEC = 43;
  // column (label → number → bar → scope line) sits on the frame's optical centre
  const COL_H = LBL * 1.2 + 16 + baseOff(NUM, 1.0) + 60 + SEC * 1.2;
  const LBL_Y = Math.round((FR.y0 + FR.y1) / 2 - COL_H / 2 - 14);
  const CONN_Y = Math.round(LBL_Y + LBL * 0.6 + 2); // on the label's ink centre
  const conSvg = K.svgCanvas(aFloat);
  const conn = S("path", { d: `M${FR.x1} ${CONN_Y} L${FR.x1 + CONN_LEN} ${CONN_Y}`, fill: "none", stroke: C.terra, "stroke-width": 4, "stroke-linecap": "round" }, conSvg);
  K.drawIn(tl, conn, 19.56, 0.4, "power3.out");

  const kpiCol = div(aFloat);
  const hwLabel = K.text(kpiCol, "硬體費用", { x: TX, y: LBL_Y, size: LBL, weight: 500, color: C.teal, ls: 0.04 });
  K.textIn(tl, hwLabel, 19.66, { dur: 0.85, stagger: 0.04 });

  const NUM_TOP = LBL_Y + LBL * 1.2 + 16;
  const NUM_BASE = baseOff(NUM, 1.0);
  const NUM_X = TX - 8;
  const numWrap = div(kpiCol, { left: NUM_X, top: NUM_TOP });
  const PADM = 16;
  const numMask = div(numWrap, { overflow: "hidden" });
  const numInner = K.text(numMask, "645", { x: PADM, y: PADM, size: NUM, weight: 700, color: C.teal, ls: -0.01, lh: 1.0, cls: "num" });
  const numW = numInner.offsetWidth;
  numInner.textContent = "0";
  Object.assign(numMask.style, { left: -PADM + "px", top: -PADM + "px", width: numW + PADM * 2 + "px", height: NUM + PADM * 2 + "px" });
  const unitLeft = numW + 22;
  const unitTop = NUM_BASE - CJK_LIFT * UNIT - baseOff(UNIT, 1.0);
  const unitMask = div(numWrap, { overflow: "hidden" });
  const unitInner = K.text(unitMask, "萬元", { x: PADM, y: PADM, size: UNIT, weight: 700, color: C.teal, lh: 1.0, ls: 0.02 });
  const unitW = unitInner.offsetWidth;
  Object.assign(unitMask.style, { left: unitLeft - PADM + "px", top: unitTop - PADM + "px", width: unitW + PADM * 2 + "px", height: UNIT + PADM * 2 + "px" });
  const BASE_Y = NUM_TOP + NUM_BASE;
  const bar645 = K.accentBar(kpiCol, TX + 2, Math.round(BASE_Y + 28));
  const HW_RIGHT = NUM_X + unitLeft + unitW; // right edge of the hardware block

  // 「645 萬」 is spoken at W.w645: the readout passes 600 by ~20.05 and lands
  // ~0.55 s after the cue; 萬元 and the accent bar follow straight away
  const T_645 = W.w645 - 0.14;
  const T_645_LAND = T_645 + 0.02 + 0.68;
  tl.fromTo(numInner, { yPercent: 104, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: "expo.out" }, T_645);
  K.counter(numInner, { from: 0, to: 645, at: T_645 + 0.02, dur: 0.68, ease: "expo.out" });
  tl.fromTo(unitInner, { yPercent: 104, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.65, ease: "expo.out" }, 20.25);
  K.barIn(tl, bar645, T_645_LAND - 0.02, 0.7);

  const SEC_Y = Math.round(BASE_Y + 60);
  const secText = K.text(kpiCol, "伺服器與網路設備", { x: TX + 1, y: SEC_Y, size: SEC, weight: 400, color: C.gray, ls: 0.04 });
  // 「硬體費用」 (20.85): the label answers with a soft pulse, the scope line follows
  const T_HW = W.hardware;
  tl.fromTo(hwLabel, { scale: 1 }, { scale: 1.04, transformOrigin: "0% 55%", duration: 0.24, ease: "sine.out" }, T_HW);
  tl.to(hwLabel, { scale: 1, duration: 0.5, ease: "sine.inOut", immediateRender: false }, T_HW + 0.24);
  K.fadeIn(tl, secText, T_HW + 0.07, { y: 14, dur: 0.75 });

  // =================================================================
  // RIGHT — 「軟體自主研發完成」 ＋ 「後續維護費用」 → 為國家節省公帑 約 4 億元
  // =================================================================
  const B = div(layer);
  // the whole savings block drifts as one (bracket and pills never shear)
  floatEnv(B, { ay: 2.8, ax: 0.9, period: 5.6, phase: 2.1 }, ramp(24.7, 1.6));

  // pills: disc + label; BS keeps disc, glyph and paddings in proportion
  const BH = 86, BS = BH / 66, BT = 46;
  const pillW = (txt) => BH + 8 + txt.offsetWidth - 0.08 * BT + 38;
  // the block's right edge (bracket end) sits at x 1784: its right margin
  // (136) answers the frame's left margin (120) once the round pill ends and
  // the open bracket are taken into account; never closer than 120 px to
  // the hardware block
  const P1_TEXT = "軟體自主研發完成";
  const p1W = (function () {
    const n = K.text(B, P1_TEXT, { size: BT, weight: 700, ls: 0.08 });
    const w = pillW(n);
    n.remove();
    return w;
  })();
  const RBX = Math.round(Math.max(HW_RIGHT + 120, 1784 - 6 - p1W));
  function makePill(x, y, str, o) {
    const g = div(B, { left: x, top: y });
    const bg = div(g, { left: 0, top: 0, width: BH, height: BH, background: o.fill, border: o.border || "none", boxSizing: "border-box", borderRadius: BH / 2 + "px" });
    const txt = K.text(g, str, { x: BH + 8, y: BH / 2 - (baseOff(BT, 1.2) - 0.38 * BT), size: BT, weight: 700, color: o.ink, ls: 0.08 });
    const w = pillW(txt);
    const svg = S("svg", { width: BH, height: BH, viewBox: `${-BH / 2} ${-BH / 2} ${BH} ${BH}`, style: "position:absolute;left:0;top:0;overflow:visible" }, g);
    const disc = S("g", {}, svg);
    S("circle", { r: f2(21 * BS), fill: o.disc }, disc);
    return { g, bg, txt, w, svg, disc };
  }
  const ck = (x, y) => f2(x * BS) + " " + f2(y * BS);

  // pill 1 — 軟體自主研發完成 (teal, white disc, drawn check)
  const P1_Y = FR.y0;
  const p1 = makePill(RBX, P1_Y, P1_TEXT, { fill: C.teal, ink: "#ffffff", disc: "#ffffff" });
  const check = S("path", { d: `M${ck(-9.5, 0.5)} L${ck(-3, 7)} L${ck(9.5, -6.5)}`, fill: "none", stroke: C.teal, "stroke-width": f2(4.6 * BS), "stroke-linecap": "round", "stroke-linejoin": "round" }, p1.disc);
  const T_DEV = W.selfDev; // 22.4
  tl.fromTo(p1.bg, { autoAlpha: 0, scale: 0.6, transformOrigin: `${BH / 2}px ${BH / 2}px` }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.4)" }, T_DEV - 0.04);
  tl.fromTo(p1.bg, { width: BH }, { width: p1.w, duration: 0.8, ease: "expo.out", immediateRender: false }, T_DEV + 0.1);
  tl.fromTo(p1.disc, { scale: 0, svgOrigin: "0 0" }, { scale: 1, duration: 0.5, ease: "back.out(1.6)" }, T_DEV + 0.02);
  K.textIn(tl, p1.txt, T_DEV + 0.14, { dur: 0.75, stagger: 0.04 });
  K.drawIn(tl, check, T_READY - 0.06, 0.34, "power2.out");
  // one soft halo expands from the pill when the check lands
  const halo = div(p1.g, { left: 0, top: 0, width: p1.w, height: BH, border: "2px solid " + C.teal, borderRadius: BH / 2 + "px", boxSizing: "border-box" });
  K.onFrame((t) => {
    const p = (t - (T_READY + 0.2)) / 0.85;
    const on = p > 0 && p < 1;
    setVis(halo, on);
    if (!on) return;
    const g = 18 * (1 - Math.pow(1 - p, 2.2));
    Object.assign(halo.style, { left: f2(-g) + "px", top: f2(-g) + "px", width: f2(p1.w + 2 * g) + "px", height: f2(BH + 2 * g) + "px", borderRadius: f2(BH / 2 + g) + "px", opacity: f2(0.45 * (1 - p)) });
  });

  // ＋ — a full-size sum operator (46 px) on the disc axis, so the two items
  // read as one addition
  const PLUS_GAP = 72, PLUS_R = 23;
  const P2_Y = P1_Y + BH + PLUS_GAP;
  const plusSvg = K.svgCanvas(B);
  const PX = RBX + BH / 2, PY = P1_Y + BH + PLUS_GAP / 2;
  const plusAttrs = { fill: "none", stroke: C.teal, "stroke-width": 6.5, "stroke-linecap": "round" };
  const plusH = S("path", Object.assign({ d: `M${PX - PLUS_R} ${PY} L${PX + PLUS_R} ${PY}` }, plusAttrs), plusSvg);
  const plusV = S("path", Object.assign({ d: `M${PX} ${PY - PLUS_R} L${PX} ${PY + PLUS_R}` }, plusAttrs), plusSvg);
  // both strokes grow together from the centre, so it reads as ＋ from the
  // first frame (a turning ＋ passes through ×, a staggered one through −)
  const T_PLUS = 23.8;
  tl.fromTo(plusSvg, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, ease: "none" }, T_PLUS);
  K.drawIn(tl, plusH, T_PLUS, 0.45, "power3.out", "50% 50%");
  K.drawIn(tl, plusV, T_PLUS, 0.45, "power3.out", "50% 50%");

  // pill 2 — 後續維護費用 (light variant: white, teal outline, teal disc with a
  // white wrench that turns into place)
  const p2 = makePill(RBX, P2_Y, "後續維護費用", { fill: "#ffffff", border: "3px solid " + C.teal, ink: C.teal, disc: C.teal });
  const wrench = S("g", {}, p2.disc);
  const wr = S("g", { transform: "rotate(45)" }, wrench);
  S("path", { d: `M0 ${f2(-1 * BS)} L0 ${f2(11.2 * BS)}`, fill: "none", stroke: "#ffffff", "stroke-width": f2(5.4 * BS), "stroke-linecap": "round" }, wr);
  S("circle", { cx: 0, cy: f2(-6.2 * BS), r: f2(6.9 * BS), fill: "#ffffff" }, wr);
  // open jaw, cut in the disc colour
  S("path", { d: `M${f2(-2.4 * BS)} ${f2(-15 * BS)} L${f2(-2.4 * BS)} ${f2(-6.2 * BS)} A${f2(2.4 * BS)} ${f2(2.4 * BS)} 0 0 0 ${f2(2.4 * BS)} ${f2(-6.2 * BS)} L${f2(2.4 * BS)} ${f2(-15 * BS)} Z`, fill: C.teal }, wr);
  S("circle", { cx: 0, cy: f2(9.6 * BS), r: f2(1.35 * BS), fill: C.teal }, wr);
  const T_P2 = 23.95;
  tl.fromTo(p2.bg, { autoAlpha: 0, scale: 0.6, transformOrigin: `${BH / 2}px ${BH / 2}px` }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.4)" }, T_P2);
  tl.fromTo(p2.bg, { width: BH }, { width: p2.w, duration: 0.8, ease: "expo.out", immediateRender: false }, T_P2 + 0.12);
  tl.fromTo(p2.disc, { scale: 0, svgOrigin: "0 0" }, { scale: 1, duration: 0.5, ease: "back.out(1.6)" }, T_P2 + 0.05);
  tl.fromTo(wrench, { rotation: -70, svgOrigin: "0 0" }, { rotation: 0, duration: 0.75, ease: "back.out(1.4)" }, T_P2 + 0.08);
  K.textIn(tl, p2.txt, T_P2 + 0.16, { dur: 0.75, stagger: 0.045 });
  // S2's terracotta reduction badge (↓) on the disc's lower right: this cost
  // is avoided
  const BADGE_R = 12, BK = BADGE_R / 19;
  const badge = S("g", { transform: `translate(${f2(16.5 * BS)} ${f2(16.5 * BS)})` }, p2.svg);
  const badgeIn = S("g", {}, badge);
  S("circle", { r: BADGE_R, fill: C.terra, stroke: "#fff", "stroke-width": 2.6 }, badgeIn);
  S("path", { d: `M0 ${f2(-8.5 * BK)} L0 ${f2(8 * BK)} M${f2(-6.5 * BK)} ${f2(2 * BK)} L0 ${f2(8.5 * BK)} L${f2(6.5 * BK)} ${f2(2 * BK)}`, fill: "none", stroke: "#fff", "stroke-width": 2.6, "stroke-linecap": "round", "stroke-linejoin": "round" }, badgeIn);
  tl.fromTo(badgeIn, { scale: 0, svgOrigin: "0 0" }, { scale: 1, duration: 0.55, ease: "back.out(1.6)" }, T_P2 + 0.62);

  // sum bracket under the pills (terracotta, ticks up), drawn left → right on
  // 「為國家節省了」
  const SUM_Y = P2_Y + BH + 32, TICK = 20;
  const SUM_X0 = RBX - 6, SUM_X1 = RBX + Math.round(Math.max(p1.w, p2.w)) + 6;
  const sumSvg = K.svgCanvas(B);
  const sum = S("path", { d: `M${SUM_X0} ${SUM_Y - TICK} L${SUM_X0} ${SUM_Y} L${SUM_X1} ${SUM_Y} L${SUM_X1} ${SUM_Y - TICK}`, fill: "none", stroke: C.terra, "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round" }, sumSvg);
  // S2 sum grammar: a teal junction on the operator axis (discs, ＋) and a
  // short stem that hands the sum down to its result
  const STEM = 20;
  const node = S("circle", { cx: PX, cy: SUM_Y, r: 6, fill: C.teal, stroke: "#fff", "stroke-width": 2.5 }, sumSvg);
  const stem = S("path", { d: `M${PX} ${SUM_Y} L${PX} ${SUM_Y + STEM}`, fill: "none", stroke: C.teal, "stroke-width": 3, "stroke-linecap": "round" }, sumSvg);
  sumSvg.insertBefore(stem, sum);
  const T_NAT = W.nation; // 25.04
  tl.fromTo(sumSvg, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, ease: "none" }, T_NAT - 0.04);
  K.drawIn(tl, sum, T_NAT - 0.04, 0.75, "power2.inOut");
  tl.fromTo(node, { scale: 0, svgOrigin: `${PX} ${SUM_Y}` }, { scale: 1, duration: 0.45, ease: "back.out(1.8)" }, T_NAT + 0.42);
  K.drawIn(tl, stem, T_NAT + 0.5, 0.25, "power2.out");

  // 「為國家節省公帑」: 為國家節省 on 「為國家節省了」, 公帑 completes it on 「的公帑」
  const LBL2 = 46;
  const NAT_Y = SUM_Y + 24;
  const natLabel = K.text(B, "為國家節省公帑", { x: RBX + 4, y: NAT_Y, size: LBL2, weight: 500, color: C.teal, ls: 0.04 });
  const natChars = K.charsOf(natLabel);
  tl.fromTo(natChars.slice(0, 5), { yPercent: 108 }, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.045 }, T_NAT + 0.06);
  tl.fromTo(natChars.slice(5), { yPercent: 108 }, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.045 }, W.publicFund - 0.04);

  // hero KPI 「約 4 億元」 — the page's hero, set close under its label so the
  // two read as one unit
  const N4 = 230, YUE = 68, YI = 94;
  const N4_TOP = NAT_Y + 38;
  const B4 = N4_TOP + baseOff(N4, 1.0); // baseline (stage y)
  // hero wrapper: a very slow breath through the final hold
  const hero = div(B);
  const yue = K.text(hero, "約", { x: RBX + 2, y: B4 - CJK_LIFT * YUE - baseOff(YUE, 1.2), size: YUE, weight: 700, color: C.teal, lh: 1.2, ls: 0 });
  const yueW = yue.offsetWidth;
  // rolling digit: a 3 → 4 strip inside a soft-edged mask
  const D_X = RBX + 2 + yueW + 8;
  const probe = K.text(B, "4", { x: 0, y: 0, size: N4, weight: 700, lh: 1.0, ls: -0.01, cls: "num" });
  const dW = probe.offsetWidth;
  probe.remove();
  // mask spans the digit ink only (cap top ≈ 0.19em below the line top,
  // baseline at 0.936em) and is fully opaque from 2 px above the cap top;
  // its 28 px top fade sits under the label, so a passing digit never
  // leaves an edge there
  const INK_T = Math.round(0.19 * N4), INK_B = Math.round(baseOff(N4, 1.0));
  const M_T = INK_T - 30, M_H = INK_B + 26 - M_T;
  const rollMask = div(hero, { left: D_X - 8, top: N4_TOP + M_T, width: dW + 16, height: M_H, overflow: "hidden" });
  const FADE = "linear-gradient(to bottom, transparent 0px, #000 28px, #000 " + (M_H - 24) + "px, transparent " + M_H + "px)";
  rollMask.style.webkitMaskImage = FADE;
  rollMask.style.maskImage = FADE;
  const stripIn = div(rollMask, { left: 8, top: -M_T });
  const strip = div(stripIn, { left: 0, top: 0 });
  // the faint 3 sits GAP3 above the 4 — more than the mask height plus one
  // digit — so the two are never in view together: the 3 streaks through in
  // the roll's first frames and fades before it reaches the label, the mask
  // is empty, then only the 4 decelerates into place (no readable wrong
  // figure next to 「約」)
  const GAP3 = 600, ROLL_FROM = 780;
  const d3 = K.text(strip, "3", { x: 0, y: -GAP3, size: N4, weight: 700, color: C.teal, lh: 1.0, ls: -0.01, cls: "num" });
  d3.style.opacity = 0.14;
  K.text(strip, "4", { x: 0, y: 0, size: N4, weight: 700, color: C.teal, lh: 1.0, ls: -0.01, cls: "num" });
  const YI_X = D_X + dW + 14;
  const yi = K.text(hero, "億元", { x: YI_X, y: B4 - CJK_LIFT * YI - baseOff(YI, 1.2), size: YI, weight: 700, color: C.teal, lh: 1.2, ls: 0.02 });
  // the hero's accent bar sits on the frame's bottom line (pill 1 shares its top line)
  const bar4 = K.accentBar(B, RBX + 4, FR.y1 - 3);

  const T_YI = W.yi4; // 26.35
  K.textIn(tl, yue, T_YI - 0.08, { dur: 0.7 });
  // one fast upward roll: the 3 has gone by ~26.35, the 4 enters ~26.40 and
  // settles ~26.62
  const ROLL_AT = T_YI - 0.05, ROLL_D = 0.5;
  tl.fromTo(stripIn, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04, ease: "none" }, ROLL_AT);
  tl.fromTo(strip, { y: ROLL_FROM }, { y: 0, duration: ROLL_D, ease: "expo.out" }, ROLL_AT);
  tl.to(d3, { autoAlpha: 0, duration: 0.012, ease: "none", immediateRender: false }, ROLL_AT + 0.03);
  K.textIn(tl, yi, T_YI + 0.38, { dur: 0.75, stagger: 0.06 });
  K.barIn(tl, bar4, 27.0, 0.7);
  // hold: the hero breathes 1 → 1.012 about the 4's baseline
  const T_HOLD = 27.9;
  const HERO_O = `${f2(D_X + dW / 2)}px ${f2(B4)}px`;
  tl.fromTo(hero, { scale: 1, transformOrigin: HERO_O }, { scale: 1.012, transformOrigin: HERO_O, duration: CUES.DURATION - T_HOLD, ease: "sine.inOut" }, T_HOLD);
});
