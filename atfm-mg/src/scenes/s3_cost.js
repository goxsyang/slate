/* s3_cost — S3 投入範圍 → 公共價值   (window 17.0 → 30.03 s)
 *
 * Beat A  (17.3 → 24.3)  terracotta frame draws; the server rack assembles
 *                        (empty cabinet rises, units slide in, patch cables
 *                        run to the side switch, status LEDs boot unit by
 *                        unit); connector → 「硬體費用 645 萬元」, secondary
 *                        line, 「自主研發完成」 badge with check, LEDs turn
 *                        teal together and a soft light sweep crosses the rack.
 * Beat B  (24.25 → 25.1) rack / frame / texts exit left; 「645」 condenses
 *                        into a terracotta unit square that glides next to
 *                        the grid.
 * Beat C  (25.04 → 30.03) 62 teal squares spawn from the unit square in a
 *                        wave; 「為國家節省 約 4 億元」 with a rolling digit,
 *                        caption 「約為硬體投入的 62 倍」, legend; composed
 *                        hold with a diagonal shimmer, one breath of the unit
 *                        square and a slow push-in.
 *
 * The rack is the reference raster (assets/rack.png).  To assemble it, the
 * scene builds canvases from it once at build time: an "empty cabinet" (unit
 * slots and patch cables painted over with clean interior / gutter texture),
 * one canvas per unit, the side table, and a cleaned full copy that takes over
 * once assembled.  Drawing only (no pixel reads), so file:// tainting is fine.
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
  /** masked single-line text whose characters rise in (house reveal) */
  function maskedLine(parent, str, o) {
    const n = K.text(parent, str, o);
    return n;
  }

  // ------------------------------------------------------------- layer
  const layer = K.layer("s3", 3);
  const GUARD = "linear-gradient(to bottom, transparent 200px, #000 226px, #000 928px, transparent 945px)";
  layer.style.webkitMaskImage = GUARD;
  layer.style.maskImage = GUARD;
  K.onFrame((t) => setVis(layer, t >= T_IN));

  // =================================================================
  // BEAT A — frame, floor, rack
  // =================================================================
  const RX = 150, RY = 262, RW = 562, RH = 561;
  const FR = { x0: 128, y0: 244, x1: 724, y1: 836, r: 4 };
  const FLOOR_Y = 800;

  const A = div(layer);
  const rackExit = div(A);
  const rackFloat = div(rackExit);
  floatEnv(rackFloat, { ay: 2.2, ax: 0.8, period: 6.4, phase: 0.4 }, ramp(18.9, 1.5));

  const frameSvg = K.svgCanvas(rackFloat);
  // floor band + contact shadows (inside the frame)
  const floorG = S("g", {}, frameSvg);
  S("rect", { x: FR.x0 + 2, y: FLOOR_Y, width: FR.x1 - FR.x0 - 4, height: FR.y1 - FLOOR_Y - 2, fill: "#e9f1f9" }, floorG);
  S("rect", { x: FR.x0 + 2, y: FLOOR_Y, width: FR.x1 - FR.x0 - 4, height: 2, fill: "#d5e4f2" }, floorG);
  const shadowG = S("g", {}, frameSvg);
  S("ellipse", { cx: RX + 166, cy: RY + 560, rx: 168, ry: 6, fill: "#d3e2f0" }, shadowG);
  S("ellipse", { cx: RX + 442, cy: RY + 560, rx: 112, ry: 4.5, fill: "#d8e6f2" }, shadowG);
  // frame: two halves drawn from the top-left corner, meeting bottom-right
  const r = FR.r;
  const frameA = S("path", {
    d: `M${FR.x0 + r} ${FR.y0} L${FR.x1 - r} ${FR.y0} A${r} ${r} 0 0 1 ${FR.x1} ${FR.y0 + r} L${FR.x1} ${FR.y1 - r} A${r} ${r} 0 0 1 ${FR.x1 - r} ${FR.y1}`,
    fill: "none", stroke: C.terra, "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round",
  }, frameSvg);
  const frameB = S("path", {
    d: `M${FR.x0 + r} ${FR.y0} A${r} ${r} 0 0 0 ${FR.x0} ${FR.y0 + r} L${FR.x0} ${FR.y1 - r} A${r} ${r} 0 0 0 ${FR.x0 + r} ${FR.y1} L${FR.x1 - r} ${FR.y1}`,
    fill: "none", stroke: C.terra, "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round",
  }, frameSvg);

  const T_FRAME = 17.5;
  tl.fromTo(frameSvg, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: "none" }, T_FRAME);
  K.drawIn(tl, frameA, T_FRAME, 0.9, "power2.inOut");
  K.drawIn(tl, frameB, T_FRAME, 0.9, "power2.inOut");
  tl.fromTo(floorG, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power1.out" }, 17.72);
  tl.fromTo(shadowG, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.out" }, 17.95);

  // ---- rack canvases ------------------------------------------------
  const rackBox = div(rackFloat, { left: RX, top: RY, width: RW, height: RH });
  const IMG = MG.images["assets/rack.png"];
  function mkCanvas(parent, x, y, w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.className = "abs";
    Object.assign(c.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
    parent.appendChild(c);
    return c;
  }
  // cleaned full rack (ragged extracted floor removed — we draw our own)
  const fullCv = document.createElement("canvas");
  fullCv.width = RW; fullCv.height = RH;
  const fctx = fullCv.getContext("2d");
  fctx.drawImage(IMG, 0, 0);
  [[0, 528, 10, 33], [0, 548, 17, 13], [50, 548, 233, 13], [316, 530, 22, 31], [352, 541, 178, 20],
    [358, 534, 162, 8], [546, 528, 16, 33]].forEach((q) => fctx.clearRect(q[0], q[1], q[2], q[3]));

  // unit slots (PNG coords): x 40–292 incl. mounting ears
  const UX0 = 40, UX1 = 292;
  const UNITS = [
    { y0: 55, y1: 93 },   // 0 switch
    { y0: 145, y1: 201 }, // 1 server
    { y0: 211, y1: 267 }, // 2 server
    { y0: 277, y1: 349 }, // 3 storage
    { y0: 362, y1: 418 }, // 4 server
  ];
  const CABLE_BAND = { y0: 93, y1: 145 };

  // empty cabinet
  const cab = mkCanvas(rackBox, 0, 0, RW, RH);
  const cctx = cab.getContext("2d");
  cctx.drawImage(fullCv, 0, 0);
  const BAND = { y: 26, h: 29 };    // clean interior rows above the switch
  function tileInterior(y0, y1) {
    for (let y = y0; y < y1; y += BAND.h) {
      const h = Math.min(BAND.h, y1 - y);
      cctx.drawImage(fullCv, UX0, BAND.y, UX1 - UX0, h, UX0, y, UX1 - UX0, h);
    }
  }
  UNITS.forEach((u) => tileInterior(u.y0, u.y1));
  tileInterior(CABLE_BAND.y0, CABLE_BAND.y1);
  // cable gutter between right rail and side panel
  const GUT = { x: 290, w: 33, sy: 431, sh: 96 };
  for (let y = 92; y < 402; y += GUT.sh) {
    const h = Math.min(GUT.sh, 402 - y);
    cctx.drawImage(fullCv, GUT.x, GUT.sy, GUT.w, h, GUT.x, y, GUT.w, h);
  }
  cctx.clearRect(323, 300, RW - 323, RH - 300); // side table arrives separately

  // units
  const unitCv = UNITS.map((u) => {
    const c = mkCanvas(rackBox, UX0, u.y0, UX1 - UX0, u.y1 - u.y0);
    c.getContext("2d").drawImage(fullCv, UX0, u.y0, UX1 - UX0, u.y1 - u.y0, 0, 0, UX1 - UX0, u.y1 - u.y0);
    return c;
  });
  // side table + small switch
  const TB = { x: 334, y: 330 };
  const tableCv = mkCanvas(rackBox, TB.x, TB.y, RW - TB.x, RH - TB.y);
  tableCv.getContext("2d").drawImage(fullCv, TB.x, TB.y, RW - TB.x, RH - TB.y, 0, 0, RW - TB.x, RH - TB.y);

  // patch cables: original pixels revealed through drawn mask strokes
  const cableSvg = S("svg", { width: RW, height: RH, viewBox: `0 0 ${RW} ${RH}`, style: "position:absolute;left:0;top:0;overflow:visible" }, rackBox);
  const cdefs = S("defs", {}, cableSvg);
  const cmask = S("mask", { id: "s3-cable-mask", maskUnits: "userSpaceOnUse", x: 0, y: 0, width: RW, height: RH }, cdefs);
  const mk = (d, w) => S("path", { d, fill: "none", stroke: "#fff", "stroke-width": w, "stroke-linecap": "round", "stroke-linejoin": "round" }, cmask);
  const fan = [
    mk("M229 86 L229 96 C230 116 248 129 292 138", 12),
    mk("M240 86 L240 96 C241 112 256 125 293 136", 12),
    mk("M251 86 L251 96 C252 109 265 121 294 134", 12),
    mk("M265 86 L265 96 C266 106 277 118 295 132", 12),
  ];
  const bundle = mk("M296 126 L299 140 L299 330 C300 352 312 362 340 362", 22);
  const branch = mk("M299 318 C300 352 306 380 340 388", 16);
  S("image", { href: "assets/rack.png", x: 0, y: 0, width: RW, height: RH, mask: "url(#s3-cable-mask)" }, cableSvg);

  // assembled rack (takes over once everything is in place)
  const fullView = mkCanvas(rackBox, 0, 0, RW, RH);
  fullView.getContext("2d").drawImage(fullCv, 0, 0);

  const T_CAB = 17.62;
  tl.fromTo(cab, { clipPath: "inset(100% 0% 0% 0%)", y: 10 }, { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.7, ease: "power3.inOut" }, T_CAB);
  tl.fromTo(cab, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: "none" }, T_CAB);
  tl.fromTo(tableCv, { y: 26 }, { y: 0, duration: 0.7, ease: "expo.out" }, 18.02);
  tl.fromTo(tableCv, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power1.out" }, 18.02);
  // units slide in from the right, bottom → top
  const UNIT_AT = [18.44, 18.32, 18.22, 18.12, 18.02];
  unitCv.forEach((c, i) => {
    tl.fromTo(c, { x: 64 }, { x: 0, duration: 0.6, ease: "expo.out" }, UNIT_AT[i]);
    tl.fromTo(c, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.16, ease: "power1.out" }, UNIT_AT[i]);
  });
  // cables run from the switch ports down the gutter to the side switch
  const T_CBL = 18.6;
  fan.forEach((p, i) => K.drawIn(tl, p, T_CBL + i * 0.035, 0.26, "power2.in"));
  K.drawIn(tl, bundle, T_CBL + 0.2, 0.42, "power1.inOut");
  K.drawIn(tl, branch, T_CBL + 0.42, 0.24, "power2.out");
  const T_SWAP = 19.3;
  tl.fromTo(fullView, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: "none" }, T_SWAP);
  tl.set([cab, tableCv, cableSvg, ...unitCv], { autoAlpha: 0 }, T_SWAP + 0.3);

  // ---- status LEDs --------------------------------------------------
  const LED_SPEC = [];
  // switch indicators
  [[69.5, 68], [69.5, 79.5], [87.5, 68], [87.5, 79.5]].forEach(([x, y], k) => LED_SPEC.push({ u: 0, x, y, w: 10, h: 5.5, k }));
  // servers: power button + two status squares
  [[1, 146], [2, 212], [4, 363]].forEach(([u, oy]) => {
    LED_SPEC.push({ u, x: 244.5, y: oy + 14, rad: 4.2, k: 0 });
    LED_SPEC.push({ u, x: 244.5, y: oy + 27.75, w: 5.5, h: 5, k: 1 });
    LED_SPEC.push({ u, x: 244.5, y: oy + 41, w: 6.5, h: 5, k: 2 });
  });
  // storage drive activity dots
  [83, 105, 127, 149, 171, 193, 215, 237, 252].forEach((x, k) => LED_SPEC.push({ u: 3, x, y: 329.5, rad: 2.6, k, drive: true }));
  // side switch
  [356, 362.6, 369.2].forEach((y, k) => LED_SPEC.push({ u: 5, x: 368, y, w: 6, h: 3.6, k }));

  const ledSvg = S("svg", { width: RW, height: RH, viewBox: `0 0 ${RW} ${RH}`, style: "position:absolute;left:0;top:0;overflow:visible" }, rackBox);
  const BOOT_AT = [18.66, 18.8, 18.92, 19.04, 19.16, 19.3];
  const T_READY = 22.9;
  const AMBER = { core: "#ffd29c", halo: "#ee8b43" };
  const MINT = { core: "#a6f3dd", halo: "#2fb999" };
  const lrng = K.rng(3317);
  const leds = LED_SPEC.map((s) => {
    const g = S("g", { transform: `translate(${s.x} ${s.y})` }, ledSvg);
    const halo = S("circle", { r: s.rad ? s.rad * 2.1 : Math.max(s.w, s.h) * 1.15, fill: AMBER.halo, opacity: 0 }, g);
    const core = s.rad
      ? S("circle", { r: s.rad, fill: AMBER.core, opacity: 0 }, g)
      : S("rect", { x: -s.w / 2, y: -s.h / 2, width: s.w, height: s.h, rx: 1.4, fill: AMBER.core, opacity: 0 }, g);
    return {
      s, g, halo, core,
      on: BOOT_AT[s.u] + s.k * 0.035,
      per: s.drive ? 0.55 + lrng() * 0.6 : 1.6 + lrng() * 1.6,
      ph: lrng() * TAU,
      duty: s.drive ? 0.35 + lrng() * 0.3 : 0.6,
    };
  });
  const readyE = ez("power2.inOut");
  K.onFrame((t) => {
    if (t < 18.5 || t > 25.0) return;
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
      L.core.setAttribute("opacity", f2(Math.min(1, b)));
      L.halo.setAttribute("opacity", f2(0.42 * b));
      setAttr(L.core, "fill", coreC);
      setAttr(L.halo, "fill", haloC);
    }
  });

  // ---- light sweep (masked by the rack's alpha) ----------------------
  const sweepSvg = S("svg", { width: RW, height: RH, viewBox: `0 0 ${RW} ${RH}`, style: "position:absolute;left:0;top:0;overflow:visible" }, rackBox);
  const sdefs = S("defs", {}, sweepSvg);
  const sgrad = S("linearGradient", { id: "s3-sweep-g", x1: 0, y1: 0, x2: 1, y2: 0 }, sdefs);
  [[0, 0], [0.5, 0.42], [1, 0]].forEach(([o, a]) => S("stop", { offset: o, "stop-color": "#ffffff", "stop-opacity": a }, sgrad));
  const smask = S("mask", { id: "s3-sweep-mask", maskUnits: "userSpaceOnUse", x: 0, y: 0, width: RW, height: RH, "mask-type": "alpha", style: "mask-type:alpha" }, sdefs);
  S("image", { href: "assets/rack.png", x: 0, y: 0, width: RW, height: 528 }, smask);
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
  // BEAT A — connector, 「硬體費用 645 萬元」, secondary, badge
  // =================================================================
  const TX = 952;
  const CONN_Y = 350;
  const conSvg = K.svgCanvas(A);
  const conn = S("path", { d: `M${FR.x1} ${CONN_Y} L905 ${CONN_Y}`, fill: "none", stroke: C.terra, "stroke-width": 4, "stroke-linecap": "round" }, conSvg);
  K.drawIn(tl, conn, 19.6, 0.4, "power3.out");

  const right = div(A);
  const rightFloat = div(right);
  floatEnv(rightFloat, { ay: 3, ax: 1, period: 5.8, phase: 1.1 }, ramp(20.9, 1.4));

  const LBL = 40;
  const LBL_Y = Math.round(CONN_Y - LBL * 0.6 - 2); // ink centred on the connector
  const hwLabel = K.text(rightFloat, "硬體費用", { x: TX, y: LBL_Y, size: LBL, weight: 500, color: C.teal, ls: 0.04 });
  K.textIn(tl, hwLabel, 19.72, { dur: 0.85, stagger: 0.04 });

  const NUM = 220, UNIT = 64;
  const NUM_TOP = LBL_Y + LBL * 1.2 + 16;
  const NUM_BASE = baseOff(NUM, 1.0);
  const numWrap = div(rightFloat, { left: TX - 10, top: NUM_TOP });
  const PADM = 16;
  const numMask = div(numWrap, { overflow: "hidden" });
  const numInner = K.text(numMask, "645", { x: PADM, y: PADM, size: NUM, weight: 700, color: C.teal, ls: -0.01, lh: 1.0, cls: "num" });
  const numW = numInner.offsetWidth;
  numInner.textContent = "0";
  Object.assign(numMask.style, { left: -PADM + "px", top: -PADM + "px", width: numW + PADM * 2 + "px", height: NUM + PADM * 2 + "px" });
  const unitLeft = numW + 24;
  const unitTop = NUM_BASE - CJK_LIFT * UNIT - baseOff(UNIT, 1.0);
  const unitMask = div(numWrap, { overflow: "hidden" });
  const unitInner = K.text(unitMask, "萬元", { x: PADM, y: PADM, size: UNIT, weight: 700, color: C.teal, lh: 1.0, ls: 0.02 });
  const unitW = unitInner.offsetWidth;
  Object.assign(unitMask.style, { left: unitLeft - PADM + "px", top: unitTop - PADM + "px", width: unitW + PADM * 2 + "px", height: UNIT + PADM * 2 + "px" });
  const BASE_Y = NUM_TOP + NUM_BASE;
  const bar645 = K.accentBar(rightFloat, TX + 2, Math.round(BASE_Y + 28));

  const T_645 = 19.84, T_645_LAND = 20.85;
  tl.fromTo(numInner, { yPercent: 104, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.65, ease: "expo.out" }, T_645);
  K.counter(numInner, { from: 0, to: 645, at: T_645 + 0.04, dur: T_645_LAND - T_645 - 0.04, ease: "power2.out" });
  tl.fromTo(unitInner, { yPercent: 104, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.65, ease: "expo.out" }, 20.5);
  K.barIn(tl, bar645, T_645_LAND, 0.7);

  const SEC = 32;
  const SEC_Y = Math.round(BASE_Y + 62);
  const secText = K.text(rightFloat, "伺服器與網路設備", { x: TX + 1, y: SEC_Y, size: SEC, weight: 400, color: C.gray, ls: 0.04 });
  K.fadeIn(tl, secText, 20.92, { y: 14, dur: 0.75 });

  // 「自主研發完成」 badge: check disc pops, pill unrolls, text rises, check draws
  const BH = 66, BY = SEC_Y + SEC * 1.2 + 34, BX = TX;
  const badge = div(rightFloat, { left: BX, top: BY });
  const badgeBg = div(badge, { left: 0, top: 0, width: BH, height: BH, background: C.teal, borderRadius: BH / 2 + "px" });
  const BT = 34;
  const badgeTxt = K.text(badge, "自主研發完成", { x: BH + 6, y: BH / 2 - (baseOff(BT, 1.2) - 0.38 * BT), size: BT, weight: 700, color: "#ffffff", ls: 0.08 });
  const BW = BH + 6 + badgeTxt.offsetWidth - 0.08 * BT + 30;
  const discSvg = S("svg", { width: BH, height: BH, viewBox: `${-BH / 2} ${-BH / 2} ${BH} ${BH}`, style: "position:absolute;left:0;top:0;overflow:visible" }, badge);
  const pingRing = S("circle", { r: 21, fill: "none", stroke: C.teal, "stroke-width": 2.5, opacity: 0 }, discSvg);
  const disc = S("g", {}, discSvg);
  S("circle", { r: 21, fill: "#ffffff" }, disc);
  const check = S("path", { d: "M-9.5 0.5 L-3 7 L9.5 -6.5", fill: "none", stroke: C.teal, "stroke-width": 4.6, "stroke-linecap": "round", "stroke-linejoin": "round" }, disc);
  const T_DEV = W.selfDev; // 22.4
  tl.fromTo(badgeBg, { autoAlpha: 0, scale: 0.6, transformOrigin: `${BH / 2}px ${BH / 2}px` }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.4)" }, T_DEV - 0.04);
  tl.fromTo(badgeBg, { width: BH }, { width: BW, duration: 0.8, ease: "expo.out", immediateRender: false }, T_DEV + 0.1);
  tl.fromTo(disc, { scale: 0, transformOrigin: "0px 0px" }, { scale: 1, duration: 0.5, ease: "back.out(1.6)" }, T_DEV + 0.02);
  K.textIn(tl, badgeTxt, T_DEV + 0.16, { dur: 0.75, stagger: 0.045 });
  K.drawIn(tl, check, T_READY - 0.06, 0.34, "power2.out");
  K.onFrame((t) => {
    const p = (t - (T_READY + 0.22)) / 0.8;
    const on = p > 0 && p < 1;
    setVis(pingRing, on);
    if (!on) return;
    const e = 1 - Math.pow(1 - p, 2);
    pingRing.setAttribute("r", f2(BH / 2 + 2 + 20 * e));
    pingRing.setAttribute("opacity", f2(0.5 * (1 - p)));
  });

  // =================================================================
  // BEAT B — exit left; 645 condenses into the unit square
  // =================================================================
  const T_X = 24.25;
  tl.to(rackExit, { x: -40, autoAlpha: 0, duration: 0.5, ease: "power2.in", immediateRender: false }, T_X);
  tl.to(conn, { drawSVG: "0% 0%", duration: 0.32, ease: "power2.in", immediateRender: false }, T_X);
  K.textOut(tl, hwLabel, T_X + 0.02, { dur: 0.4, stagger: 0.015 });
  tl.to(unitInner, { yPercent: -104, duration: 0.38, ease: "power2.in", immediateRender: false }, T_X + 0.04);
  tl.to(bar645, { scaleX: 0, transformOrigin: "100% 50%", duration: 0.35, ease: "power2.in", immediateRender: false }, T_X + 0.02);
  tl.to(secText, { x: -24, autoAlpha: 0, duration: 0.4, ease: "power2.in", immediateRender: false }, T_X + 0.06);
  tl.to(badge, { x: -28, autoAlpha: 0, duration: 0.42, ease: "power2.in", immediateRender: false }, T_X + 0.1);

  // unit square destination: left of the grid, on its middle row
  const CELL = 50, GAP = 12, COLS = 10, NCELL = 62;
  const GX = 1150, GY = 330;
  const USQ = { x: GX - CELL - 54, y: GY + 3 * (CELL + GAP) };
  const usqCx = USQ.x + CELL / 2, usqCy = USQ.y + CELL / 2;
  // number centre (stage coords) at the moment of collapse
  const numCx = TX - 10 + numW / 2, numCy = NUM_TOP + NUM_BASE - NUM * 0.365;

  const push = div(layer);
  const usqMove = div(push, { left: USQ.x, top: USQ.y, width: CELL, height: CELL });
  const usqPop = div(usqMove, { left: 0, top: 0, width: CELL, height: CELL });
  const usq = div(usqPop, { left: 0, top: 0, width: CELL, height: CELL, background: C.terra, borderRadius: "7px" });

  const T_COL = 24.36;
  tl.to(numInner, { color: C.terra, duration: 0.22, ease: "power1.in", immediateRender: false }, T_COL);
  tl.to(numWrap, { scale: 0.18, transformOrigin: `${numW / 2}px ${NUM_BASE - NUM * 0.365}px`, duration: 0.34, ease: "power3.in", immediateRender: false }, T_COL);
  tl.to(numWrap, { autoAlpha: 0, duration: 0.1, ease: "none", immediateRender: false }, T_COL + 0.26);
  tl.fromTo(usqPop, { scale: 0, rotation: -45, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.42, ease: "back.out(1.4)" }, T_COL + 0.24);
  tl.fromTo(usqMove, { x: numCx - usqCx, y: numCy - usqCy }, { x: 0, y: 0, duration: 0.6, ease: "power3.inOut" }, T_COL + 0.36);
  // hard guarantee: Beat A gone
  tl.set(A, { autoAlpha: 0 }, 24.95);

  // =================================================================
  // BEAT C — 62 squares, 「為國家節省 約 4 億元」, legend, hold
  // =================================================================
  push.style.transformOrigin = "960px 560px";
  const gridG = div(push);
  floatEnv(gridG, { ay: 2.5, ax: 1, period: 6.2, phase: 2.2 }, ramp(26.6, 1.4));
  const cells = [];
  for (let i = 0; i < NCELL; i++) {
    const col = i % COLS, row = Math.floor(i / COLS);
    const x = GX + col * (CELL + GAP), y = GY + row * (CELL + GAP);
    const n = div(gridG, { left: x, top: y, width: CELL, height: CELL, background: C.teal, borderRadius: "7px" });
    cells.push({ n, x, y, cx: x + CELL / 2, cy: y + CELL / 2, col, row });
  }
  // wave order: distance from the unit square
  const order = cells.slice().sort((a, b) => Math.hypot(a.cx - usqCx, a.cy - usqCy) - Math.hypot(b.cx - usqCx, b.cy - usqCy));
  const T_SPAWN = 25.18, STAG = 0.0145, FLY = 0.6;
  order.forEach((c, k) => {
    c.at = T_SPAWN + k * STAG;
    tl.fromTo(c.n, { x: usqCx - c.cx, y: usqCy - c.cy, scale: 0.3 },
      { x: 0, y: 0, scale: 1, duration: FLY, ease: "expo.out" }, c.at);
    tl.fromTo(c.n, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: "none" }, c.at);
  });
  // unit square gives a small push as copies leave it
  tl.fromTo(usq, { scale: 1 }, { scale: 0.9, duration: 0.18, ease: "power2.out" }, T_SPAWN - 0.02);
  tl.to(usq, { scale: 1, duration: 0.9, ease: "sine.inOut", immediateRender: false }, T_SPAWN + 0.3);

  // left: KPI
  const LX = 96;
  const leftC = div(push);
  floatEnv(leftC, { ay: 3, ax: 1, period: 5.6, phase: 0.3 }, ramp(27.0, 1.2));
  const natLabel = K.text(leftC, "為國家節省", { x: LX + 4, y: 250, size: 34, weight: 500, color: C.teal, ls: 0.04 });
  K.textIn(tl, natLabel, W.nation + 0.06, { dur: 0.9, stagger: 0.04 });

  const N4 = 230, YUE = 60, YI = 72;
  const N4_TOP = 250 + 34 * 1.2 + 22;
  const B4 = N4_TOP + baseOff(N4, 1.0); // baseline (stage y)
  const yueMaskWrap = div(leftC, { left: LX, top: 0 });
  const yue = K.text(yueMaskWrap, "約", { x: 0, y: B4 - CJK_LIFT * YUE - baseOff(YUE, 1.0), size: YUE, weight: 700, color: C.teal, lh: 1.0, ls: 0 });
  const yueW = yue.offsetWidth;
  // rolling digit
  const D_X = LX + yueW + 10;
  const probe = K.text(leftC, "4", { x: 0, y: 0, size: N4, weight: 700, lh: 1.0, ls: -0.01, cls: "num" });
  const dW = probe.offsetWidth;
  probe.remove();
  const ROLL_PAD = 34;
  const rollMask = div(leftC, { left: D_X - 6, top: N4_TOP - ROLL_PAD, width: dW + 12, height: N4 + ROLL_PAD * 2, overflow: "hidden" });
  const FADE = "linear-gradient(to bottom, transparent 0px, #000 " + (ROLL_PAD + 30) + "px, #000 " + (N4 + ROLL_PAD - 4) + "px, transparent " + (N4 + ROLL_PAD * 2) + "px)";
  rollMask.style.webkitMaskImage = FADE;
  rollMask.style.maskImage = FADE;
  const stripIn = div(rollMask, { left: 6, top: ROLL_PAD });
  const strip = div(stripIn, { left: 0, top: 0 });
  ["0", "1", "2", "3", "4"].forEach((d, k) => K.text(strip, d, { x: 0, y: k * N4, size: N4, weight: 700, color: C.teal, lh: 1.0, ls: -0.01, cls: "num" }));
  const YI_X = D_X + dW + 18;
  const yiWrap = div(leftC, { left: 0, top: 0 });
  const yi = K.text(yiWrap, "億元", { x: YI_X, y: B4 - CJK_LIFT * YI - baseOff(YI, 1.0), size: YI, weight: 700, color: C.teal, lh: 1.0, ls: 0.02 });
  const bar4 = K.accentBar(leftC, LX + 4, Math.round(B4 + 30));
  const capY = Math.round(B4 + 66);
  const cap4 = K.text(leftC, "約為硬體投入的 62 倍", { x: LX + 2, y: capY, size: 32, weight: 400, color: C.gray, ls: 0.03 });

  const T_YI = W.yi4; // 26.35
  K.textIn(tl, yue, T_YI - 0.06, { dur: 0.7 });
  tl.fromTo(stripIn, { y: N4 * 0.9, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.2, ease: "power2.out" }, T_YI + 0.02);
  tl.fromTo(strip, { y: 0 }, { y: -4 * N4, duration: 0.62, ease: "power2.inOut" }, T_YI + 0.14);
  K.textIn(tl, yi, T_YI + 0.36, { dur: 0.75, stagger: 0.06 });
  K.barIn(tl, bar4, 27.0, 0.7);
  K.fadeIn(tl, cap4, 27.25, { y: 14, dur: 0.75 });

  // legend (bottom-left)
  const LEG_Y = 840, SW = 24, LEG = 28;
  const legend = div(push);
  function legendItem(x, color, html, at) {
    const g = div(legend, { left: x, top: LEG_Y });
    div(g, { left: 0, top: 0, width: SW, height: SW, background: color, borderRadius: "5px" });
    const tx = K.text(g, "", { x: SW + 12, y: SW / 2 - (baseOff(LEG, 1.2) - 0.38 * LEG), size: LEG, weight: 400, color: C.gray, ls: 0.02 });
    tx.innerHTML = html;
    K.fadeIn(tl, g, at, { y: 12, dur: 0.7 });
    return { g, w: SW + 12 + tx.offsetWidth };
  }
  const lg1 = legendItem(LX + 4, C.terra, '硬體投入 <b style="font-weight:500;color:' + C.terra + '">645</b> 萬元', 25.4);
  legendItem(LX + 4 + lg1.w + 44, C.teal, '節省 約 <b style="font-weight:500;color:' + C.teal + '">4</b> 億元', 27.5);

  // ---- hold: shimmer, breath, push-in ----------------------------------
  const T_SHIM = 28.25, SHIM_D = 1.25;
  const shimE = ez("sine.inOut");
  const sMin = Math.min(...cells.map((c) => c.cx + 0.7 * c.cy)), sMax = Math.max(...cells.map((c) => c.cx + 0.7 * c.cy));
  const TEAL_HI = "#4aa596";
  K.onFrame((t) => {
    const p = (t - T_SHIM) / SHIM_D;
    const live = p > -0.05 && p < 1.05;
    for (const c of cells) {
      let k = 0;
      if (live) {
        const s = (c.cx + 0.7 * c.cy - sMin) / (sMax - sMin);
        const f = lerp(-0.25, 1.25, shimE(c01(p)));
        k = Math.exp(-Math.pow((s - f) / 0.11, 2));
      }
      const bg = k > 0.004 ? mix(C.teal, TEAL_HI, k) : C.teal;
      if (c.n.style.background !== bg) c.n.style.background = bg;
      c.n.style.scale = k > 0.004 ? (1 + 0.05 * k).toFixed(4) : "";
    }
  });
  tl.fromTo(usqPop, { scale: 1 }, { scale: 1.12, duration: 0.5, ease: "sine.inOut", immediateRender: false }, 28.95);
  tl.to(usqPop, { scale: 1, duration: 0.75, ease: "sine.inOut", immediateRender: false }, 29.45);
  tl.fromTo(push, { scale: 1 }, { scale: 1.015, duration: CUES.DURATION - 27.9, ease: "sine.inOut" }, 27.9);
});
