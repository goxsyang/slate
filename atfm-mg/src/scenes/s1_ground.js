/* s1_ground — 單日案例 · 5 月 5 日   (window 0 → 6.15 s)
 *
 * Left  : KPI 「時段安排 38 個 CTOT」, desk calendar (5/4 page flips away to
 *         reveal 5/5), 38 mini CTOT tickets dealt from the date into a 5×8 board.
 * Right : KPI 「累計地面等待 528 分鐘」, stopwatch whose minute hand is locked
 *         to the counter (528 min = 8.8 turns), parked plane on a ground line.
 * Bridge: one teal dot per ticket streams through a single lane into the
 *         stopwatch (「累計」).
 * Exit  : camera tilt-up — the layer travels down and fades (left leads).
 *
 * Everything is a pure function of t (GSAP tweens on the paused master
 * timeline + K.onFrame hooks).
 */
MG.scene("s1_ground", function (tl) {
  const { C } = K;
  const FPS = CUES.FPS;
  const BASE = 0.935; // baseline / font-size for Noto Sans TC at line-height 1.0
  const FONT = '"Noto Sans TC", sans-serif';

  // ------------------------------------------------------------ helpers
  const S = (tag, attrs, parent) => K.svg(tag, attrs, parent);
  const box = (parent, style) => K.el("div", { cls: "abs", style: style || {} }, parent);
  const canvas = (parent) => K.svgCanvas(parent);
  const lerp = (a, b, p) => a + (b - a) * p;
  const smooth = (x) => { x = K.clamp01(x); return x * x * (3 - 2 * x); };
  const eDeal = K.easeFn("power3.out");
  const eP2InOut = K.easeFn("power2.inOut");
  const eP1In = K.easeFn("power1.in");
  const f2 = (v) => v.toFixed(2);

  /** Gentle drift whose amplitude ramps in from `from`; returns offset fn. */
  function drift(o) {
    const fn = (t) => {
      const amp = smooth((t - (o.from || 0)) / (o.ramp || 1.2));
      const a = (2 * Math.PI * t) / o.period + (o.phase || 0);
      return [
        amp * (o.ax || 0) * Math.sin(a * 0.83 + 1.3),
        amp * (o.ay || 0) * Math.sin(a),
        amp * (o.rot || 0) * Math.sin(a * 0.71 + 0.4),
      ];
    };
    if (o.node) {
      K.onFrame((t) => {
        const d = fn(t);
        o.node.style.translate = `${f2(d[0])}px ${f2(d[1])}px`;
        if (o.rot) o.node.style.rotate = `${d[2].toFixed(3)}deg`;
      });
    }
    return fn;
  }

  /** KPI block with the unit sitting on the number's baseline. */
  function kpi(parent, o) {
    const wrap = box(parent, { left: 0, top: 0 });
    const g = box(wrap, { left: o.x, top: o.y });
    const label = K.text(g, o.label, { x: 4, y: 0, size: 34, weight: 500, color: C.teal });
    const numTop = 34 * 1.2 + 18;
    const numWrap = box(g, { left: 0, top: numTop });
    const num = K.text(numWrap, o.final, { x: 0, y: 0, size: 170, weight: 700, ls: -0.01, lh: 1.0, cls: "num" });
    const w = num.getBoundingClientRect().width / MG.stageScale;
    num.textContent = "0";
    // unit on the number's baseline; a CJK-only unit is lifted by its small
    // descent so the ink bottoms line up (same optical rule as S2's 「噸」)
    const unit = K.text(g, o.unit, { x: w + 20, y: numTop + (170 - 52) * BASE - (o.lift || 0), size: 52, weight: 700, color: C.teal, lh: 1.0, ls: 0.01 });
    const baseY = o.y + numTop + 170 * BASE;
    const bar = K.accentBar(wrap, o.x + 4, Math.round(baseY + 22), 100, 6);
    return { wrap, g, label, numWrap, num, unit, bar, baseY, w };
  }

  // ------------------------------------------------------------ layout
  // calendar page (front sheet)
  const PL = 132, PR = 380, PT = 540, PB = 841, PW = PR - PL, PH = PB - PT;
  const BAND = 54;                          // header band height
  const HOLES = [PL + 64, PR - 64];         // binder ring x
  const HOLE_Y = PT + 22;
  const GRID = { x: PL + 18, y: PT + BAND + 18, w: PW - 36, h: PH - BAND - 36 };
  const DATE_C = { x: GRID.x + GRID.w / 2, y: GRID.y + GRID.h / 2 }; // centre of 「5/5」
  // ticket board
  const TK = { w: 78, h: 31, gx: 10, gy: 7.5, x0: 430, y0: PT, cols: 5, n: 38 };
  // right group
  const SW = { cx: 1700, cy: 355, r: 88, sw: 10 };
  const PLANE = { x: 990, scale: 0.92, bottom: 842 };
  const GROUND_Y = 843;
  // colours specific to the calendar illustration (reference f_022)
  const CAL = {
    band: "#5b97d1", stand: "#3a78b8", gridFill: "#e6f0fa", gridLine: "#97bfe6",
    ring: "#6aa3da", page: "#ffffff", hole: C.navy,
  };

  // ------------------------------------------------------------ layers
  const root = K.layer("s1", 2);
  const leftExit = box(root, { left: 0, top: 0 });
  const leftDim = box(leftExit, { left: 0, top: 0 });
  const rightExit = box(root, { left: 0, top: 0 });
  const fxWrap = box(root, { left: 0, top: 0 });

  // ================================================================ LEFT
  const kA = kpi(leftDim, { x: 96, y: 232, label: "時段安排", final: "38", unit: "個 CTOT" });

  // ---- calendar ------------------------------------------------------
  const calEnter = box(leftDim, { left: 0, top: 0 });
  const calFloat = box(calEnter, { left: 0, top: 0 });
  const calBase = canvas(calFloat);

  // soft contact shadow
  S("ellipse", { cx: (PL + PR) / 2 - 12, cy: PB + 3, rx: 150, ry: 7, fill: "#e9f0f5" }, calBase);
  // A-frame stand peeking out on the left
  S("path", {
    d: `M${PL + 22} ${PT + 26} L${PL - 32} ${PB - 2} Q${PL - 33} ${PB + 1} ${PL - 29} ${PB + 1} L${PL + 12} ${PB + 1} Z`,
    fill: CAL.stand, stroke: C.navy, "stroke-width": 3, "stroke-linejoin": "round",
  }, calBase);

  function drawPage(svgParent, ox, oy, dateText, dateColor) {
    const g = S("g", { transform: `translate(${ox} ${oy})` }, svgParent);
    const x = PL, y = PT;
    S("rect", { x, y, width: PW, height: PH, rx: 11, fill: CAL.page }, g);
    // header band (rounded top corners)
    S("path", {
      d: `M${x} ${y + BAND} V${y + 11} Q${x} ${y} ${x + 11} ${y} H${x + PW - 11} Q${x + PW} ${y} ${x + PW} ${y + 11} V${y + BAND} Z`,
      fill: CAL.band,
    }, g);
    S("line", { x1: x, y1: y + BAND, x2: x + PW, y2: y + BAND, stroke: C.navy, "stroke-width": 2.5 }, g);
    for (const hx of HOLES) S("ellipse", { cx: hx, cy: HOLE_Y, rx: 8.5, ry: 6.5, fill: CAL.hole }, g);
    // 3×3 grid
    S("rect", { x: GRID.x, y: GRID.y, width: GRID.w, height: GRID.h, rx: 3, fill: CAL.gridFill, stroke: CAL.gridLine, "stroke-width": 1.8 }, g);
    for (let i = 1; i < 3; i++) {
      const gx = GRID.x + (GRID.w * i) / 3, gy = GRID.y + (GRID.h * i) / 3;
      S("line", { x1: gx, y1: GRID.y, x2: gx, y2: GRID.y + GRID.h, stroke: CAL.gridLine, "stroke-width": 1.8 }, g);
      S("line", { x1: GRID.x, y1: gy, x2: GRID.x + GRID.w, y2: gy, stroke: CAL.gridLine, "stroke-width": 1.8 }, g);
    }
    // the date, knocked out of the grid lines
    const tx = S("text", {
      x: DATE_C.x, y: DATE_C.y + 23, "text-anchor": "middle", "font-family": FONT, "font-weight": 700,
      "font-size": 64, fill: dateColor, stroke: CAL.gridFill, "stroke-width": 12, "paint-order": "stroke",
      "stroke-linejoin": "round", "letter-spacing": "-1", text: dateText,
    }, g);
    // page outline last so it sits on top of the band
    S("rect", { x, y, width: PW, height: PH, rx: 11, fill: "none", stroke: C.navy, "stroke-width": 3 }, g);
    return { g, tx };
  }

  const page55 = drawPage(calBase, 0, 0, "5/5", C.teal);

  // terracotta hand-drawn ring around 「5/5」 (≈1.08 turns, slight wobble)
  const ringPts = [];
  {
    const N = 90, turns = 1.1, a0 = -2.55, tilt = -0.1;
    for (let i = 0; i <= N; i++) {
      const u = i / N, a = a0 + u * turns * Math.PI * 2;
      const wob = 1 + 0.035 * Math.sin(u * 7.1 + 0.6) + 0.06 * u;
      const ex = 74 * wob * Math.cos(a), ey = 44 * wob * Math.sin(a);
      ringPts.push([DATE_C.x + 2 + ex * Math.cos(tilt) - ey * Math.sin(tilt), DATE_C.y + 1 + ex * Math.sin(tilt) + ey * Math.cos(tilt)]);
    }
  }
  const ring55 = S("path", {
    d: "M" + ringPts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L"),
    fill: "none", stroke: C.terra, "stroke-width": 4.5, "stroke-linecap": "round", "stroke-linejoin": "round",
  }, calBase);

  // the 5/4 sheet that flips away (own element so it can rotate in 3D)
  const flip = box(calFloat, { left: PL - 4, top: PT - 4, width: PW + 8, height: PH + 8 });
  const flipSvg = S("svg", { width: PW + 8, height: PH + 8, viewBox: `${PL - 4} ${PT - 4} ${PW + 8} ${PH + 8}`, style: "position:absolute;left:0;top:0;overflow:visible" }, flip);
  drawPage(flipSvg, 0, 0, "5/4", C.tealDim);
  const flipShade = S("rect", { x: PL, y: PT, width: PW, height: PH, rx: 11, fill: C.navy, opacity: 0 }, flipSvg);

  // binder rings on top of both sheets
  const calTop = canvas(calFloat);
  for (const hx of HOLES) {
    const ry = (HOLE_Y - (PT - 26)) / 2, cyR = HOLE_Y - ry, rx = 14.5;
    const pa = (deg) => [hx + rx * Math.cos((deg * Math.PI) / 180), cyR + ry * Math.sin((deg * Math.PI) / 180)];
    const [ax, ay] = pa(112), [bx, by] = pa(68);
    const d = `M${f2(ax)} ${f2(ay)} A${rx} ${ry} 0 1 1 ${f2(bx)} ${f2(by)}`;
    S("path", { d, fill: "none", stroke: C.navy, "stroke-width": 11, "stroke-linecap": "round" }, calTop);
    S("path", { d, fill: "none", stroke: CAL.ring, "stroke-width": 5, "stroke-linecap": "round" }, calTop);
    // highlight on the ring's upper-left
    const [h1x, h1y] = pa(200), [h2x, h2y] = pa(250);
    S("path", { d: `M${f2(h1x)} ${f2(h1y)} A${rx} ${ry} 0 0 1 ${f2(h2x)} ${f2(h2y)}`, fill: "none", stroke: "#d6e7f7", "stroke-width": 1.8, "stroke-linecap": "round" }, calTop);
  }

  // ---- ticket board --------------------------------------------------
  const tkFloat = box(leftDim, { left: 0, top: 0 });
  const tkSvg = canvas(tkFloat);
  const rng = K.rng(505);

  function ticketD(w, h, r, n) {
    const a = w / 2, b = h / 2;
    return `M${-a + r} ${-b} H${a - r} A${r} ${r} 0 0 1 ${a} ${-b + r} V${-n} A${n} ${n} 0 0 0 ${a} ${n} V${b - r} ` +
      `A${r} ${r} 0 0 1 ${a - r} ${b} H${-a + r} A${r} ${r} 0 0 1 ${-a} ${b - r} V${n} A${n} ${n} 0 0 0 ${-a} ${-n} V${-b + r} A${r} ${r} 0 0 1 ${-a + r} ${-b} Z`;
  }
  const TD = ticketD(TK.w, TK.h, 5, 4.6);
  // top-view airliner glyph (24-unit box, nose to the right)
  const PLANE_GLYPH = "M22.4 12c0-.9-.8-1.5-1.9-1.5h-5.6L10.2 3.2H8l2.6 7.3H5.6L3.8 7.9H2.2l1 4.1-1 4.1h1.6l1.8-2.6h5L8 20.8h2.2l4.7-7.3h5.6c1.1 0 1.9-.6 1.9-1.5z";

  const tickets = [];
  for (let i = 0; i < TK.n; i++) {
    const c = i % TK.cols, r = Math.floor(i / TK.cols);
    const cx = TK.x0 + TK.w / 2 + c * (TK.w + TK.gx);
    const cy = TK.y0 + TK.h / 2 + r * (TK.h + TK.gy);
    // faint slot the ticket lands in
    const slot = S("path", { d: TD, transform: `translate(${cx} ${cy})`, fill: "none", stroke: "#d9e3e8", "stroke-width": 1.3, "stroke-dasharray": "3 3.2", opacity: 0 }, tkSvg);
    tickets.push({ i, c, r, cx, cy, slot, rot0: (rng() - 0.5) * 26, lift: 70 + rng() * 40 });
  }
  for (const tk of tickets) {
    const g = S("g", { opacity: 0 }, tkSvg);
    S("path", { d: TD, fill: "#ffffff", stroke: C.ticketLine, "stroke-width": 1.6 }, g);
    S("path", { d: PLANE_GLYPH, fill: C.blue, transform: `translate(${-TK.w / 2 + 6} ${-10.8}) scale(0.9)` }, g);
    S("line", { x1: 9, y1: -TK.h / 2 + 6, x2: 9, y2: TK.h / 2 - 6, stroke: "#c9d4dd", "stroke-width": 1.2, "stroke-dasharray": "2.2 2.6", "stroke-linecap": "round" }, g);
    S("rect", { x: 17.5, y: -6.5, width: 13, height: 13, rx: 2, fill: C.peach }, g);
    tk.g = g;
  }

  // ================================================================ RIGHT
  const kB = kpi(rightExit, { x: 1000, y: 232, label: "累計地面等待", final: "528", unit: "分鐘", lift: 2 });

  // ground + plane
  const groundSvg = canvas(rightExit);
  const shadow = S("ellipse", { cx: 1430, cy: GROUND_Y + 1, rx: 400, ry: 8, fill: "#e9f0f5" }, groundSvg);
  const ground = S("line", { x1: 960, y1: GROUND_Y, x2: 1840, y2: GROUND_Y, stroke: C.navy, "stroke-width": 2, "stroke-linecap": "round" }, groundSvg);
  const planeEnter = box(rightExit, { left: 0, top: 0 });
  const pim = MG.images["assets/plane_side.png"];
  const pH = pim.naturalHeight * PLANE.scale;
  const plane = K.img(planeEnter, "assets/plane_side.png", { x: PLANE.x, y: PLANE.bottom - pH, scale: PLANE.scale });
  plane.style.clipPath = "inset(0 0 1px 0)"; // drop the faint baked-in ground hairline
  // teal emphasis on the ground under the wheels (「地面等待」)
  const groundMark = S("line", { x1: 1336, y1: GROUND_Y, x2: 1742, y2: GROUND_Y, stroke: C.teal, "stroke-width": 4, "stroke-linecap": "round" }, groundSvg);

  // ---- stopwatch -----------------------------------------------------
  const swFloat = box(rightExit, { left: 0, top: 0 });
  swFloat.style.transformOrigin = `${SW.cx}px ${SW.cy}px`;
  const swPop = box(swFloat, { left: 0, top: 0 });
  const sw = canvas(swPop);
  const { cx: X, cy: Y, r: R } = SW;
  const crown = S("g", {}, sw);
  S("rect", { x: X - 8, y: Y - R - 24, width: 16, height: 22, fill: C.teal }, crown);
  S("rect", { x: X - 24, y: Y - R - 38, width: 48, height: 17, rx: 5, fill: C.teal }, crown);
  const sideBtn = S("g", { transform: `rotate(42 ${X} ${Y})` }, sw);
  S("rect", { x: X - 6, y: Y - R - 17, width: 12, height: 14, rx: 3, fill: C.teal }, sideBtn);
  const face = S("circle", { cx: X, cy: Y, r: R, fill: C.tealSoft }, sw);
  const rim = S("circle", { cx: X, cy: Y, r: R, fill: "none", stroke: C.teal, "stroke-width": SW.sw, transform: `rotate(-90 ${X} ${Y})` }, sw);
  const ticks = [];
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2, major = k % 3 === 0;
    const r1 = R - 24 - (major ? 4 : 0), r2 = R - 13;
    ticks.push(S("line", {
      x1: X + r1 * Math.sin(a), y1: Y - r1 * Math.cos(a), x2: X + r2 * Math.sin(a), y2: Y - r2 * Math.cos(a),
      stroke: C.teal, "stroke-width": major ? 5 : 4, "stroke-linecap": "round",
    }, sw));
  }
  const SWEEP_N = 7;
  const sweep = [];
  for (let k = 0; k < SWEEP_N; k++) sweep.push(S("path", { d: "", fill: C.terra, opacity: 0 }, sw));
  const hand = S("g", {}, sw);
  S("line", { x1: X, y1: Y + 10, x2: X, y2: Y - R + 26, stroke: C.terra, "stroke-width": 7, "stroke-linecap": "round" }, hand);
  S("circle", { cx: X, cy: Y, r: 10.5, fill: C.teal }, sw);
  S("circle", { cx: X, cy: Y, r: 3.6, fill: C.tealSoft }, sw);

  // hour pips (one per completed turn), orbiting the dial clockwise
  const PIP_R = R + 25;
  const pips = [];
  for (let k = 0; k < 8; k++) {
    const deg = 22.5 + k * 45, a = (deg * Math.PI) / 180;
    const px = X + PIP_R * Math.sin(a), py = Y - PIP_R * Math.cos(a);
    pips.push({ el: S("circle", { cx: px, cy: py, r: 4.6, fill: C.tealLine }, sw), px, py });
  }
  const caption = K.text(rightExit, "約 8 小時 48 分", { x: 0, y: Y + R + 40, size: 30, weight: 400, color: C.gray, ls: 0.02 });
  caption.style.left = X - caption.getBoundingClientRect().width / MG.stageScale / 2 + "px";

  // ================================================================ FX (dots)
  const fx = canvas(fxWrap);
  const flashG = S("g", {}, fx);
  const dotsG = S("g", {}, fx);

  // ================================================================ TIMING
  const T = {
    calIn: 0.25, flip: 0.45, ring: 0.92, kpiA: 1.2, slots: 1.22, deal: 1.45, dealStag: 0.032, dealDur: 0.56, dealLand: 0.28,
    unitA: 1.92, dim: 3.1, rightIn: 3.22, dots: 3.27, dotStag: 0.025, dotDur: 0.55,
    count: 3.45, countDur: 1.3, unitB: 4.32, caption: 4.85, ground: 4.98, exit: 5.45,
  };
  const landA = T.deal + (TK.n - 1) * T.dealStag + T.dealLand; // counter A lands with last ticket
  const landB = T.count + T.countDur;                   // 4.75

  // ---- calendar entrance + flip -------------------------------------
  tl.fromTo(calEnter, { autoAlpha: 0, y: 30, scale: 0.96, transformOrigin: `${(PL + PR) / 2}px ${PB}px` },
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.85, ease: "expo.out" }, T.calIn);
  gsap.set(flip, { transformOrigin: `50% ${HOLE_Y - PT + 4}px`, transformPerspective: 1100 });
  tl.fromTo(flip, { rotationX: 0 }, { rotationX: 90, duration: 0.56, ease: "power2.in" }, T.flip);
  tl.fromTo(flipShade, { opacity: 0 }, { opacity: 0.22, duration: 0.56, ease: "power2.in" }, T.flip);
  tl.fromTo(flip, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.03, ease: "none", immediateRender: false }, T.flip + 0.53);
  // 5/5 settles in with a tiny scale as it is revealed
  tl.fromTo(page55.tx, { scale: 0.94, transformOrigin: "50% 60%" }, { scale: 1, duration: 0.7, ease: "expo.out" }, T.flip + 0.42);
  K.drawIn(tl, ring55, T.ring, 0.55, "power2.inOut");
  tl.fromTo(ring55, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, T.ring);
  drift({ node: calFloat, ay: 3, ax: 1, period: 6.2, phase: 0.4, from: 1.0 });
  drift({ node: kA.wrap, ay: 1.6, period: 7.4, phase: 2.6, from: 1.8, ramp: 1.6 });

  // ---- KPI A ----------------------------------------------------------
  K.fadeIn(tl, kA.label, T.kpiA, { y: 14, dur: 0.8 });
  tl.fromTo(kA.numWrap, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out" }, T.kpiA + 0.06);
  K.textIn(tl, kA.unit, T.unitA, { dur: 0.8, stagger: 0.045 });
  K.barIn(tl, kA.bar, landA, 0.8);
  K.onFrame((t) => {
    let n = 0;
    for (let i = 0; i < TK.n; i++) if (t >= T.deal + i * T.dealStag + T.dealLand) n++;
    const s = String(n);
    if (kA.num.textContent !== s) kA.num.textContent = s;
  });

  // ---- tickets dealt from the date -----------------------------------
  const gridDrift = drift({ node: tkFloat, ay: 2.5, ax: 0.8, period: 5.3, phase: 2.1, from: 3.0 });
  K.onFrame((t) => {
    for (const tk of tickets) {
      // slot: faint dashed outline, wave in, then hidden by the ticket
      const sp = smooth((t - (T.slots + (tk.c + tk.r) * 0.018)) / 0.3);
      tk.slot.setAttribute("opacity", f2(sp * 0.9));
      const s0 = T.deal + tk.i * T.dealStag;
      const p = K.clamp01((t - s0) / T.dealDur);
      if (t < s0) { tk.g.setAttribute("opacity", 0); tk.g.setAttribute("transform", ""); continue; }
      const e = eDeal(p);
      const sx = DATE_C.x, sy = DATE_C.y;
      const qx = (sx + tk.cx) / 2, qy = Math.min(sy, tk.cy) - tk.lift;
      const u = e, v = 1 - u;
      const x = v * v * sx + 2 * v * u * qx + u * u * tk.cx;
      const y = v * v * sy + 2 * v * u * qy + u * u * tk.cy;
      const sc = 0.6 + 0.4 * e;
      const rot = tk.rot0 * (1 - e);
      tk.g.setAttribute("opacity", f2(K.clamp01((t - s0) / 0.07)));
      tk.g.setAttribute("transform", `translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)}) scale(${sc.toFixed(3)})`);
    }
  });

  // ---- left group dims ------------------------------------------------
  tl.fromTo(leftDim, { autoAlpha: 1 }, { autoAlpha: 0.35, duration: 0.45, ease: "power2.inOut", immediateRender: false }, T.dim);

  // ---- right group enters --------------------------------------------
  K.textIn(tl, kB.label, T.rightIn, { dur: 0.85, stagger: 0.035 });
  tl.fromTo(kB.numWrap, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out" }, T.rightIn + 0.1);
  K.counter(kB.num, { from: 0, to: 528, at: T.count, dur: T.countDur, ease: "power2.inOut" });
  K.textIn(tl, kB.unit, T.unitB, { dur: 0.8, stagger: 0.05 });
  K.barIn(tl, kB.bar, landB, 0.8);

  K.drawIn(tl, ground, T.rightIn - 0.02, 0.85, "power3.out");
  tl.fromTo(shadow, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, ease: "power1.out" }, T.rightIn + 0.25);
  tl.fromTo(planeEnter, { autoAlpha: 0, x: 80 }, { autoAlpha: 1, x: 0, duration: 1.05, ease: "expo.out" }, T.rightIn + 0.12);

  tl.fromTo(swPop, { autoAlpha: 0, scale: 0.6, transformOrigin: `${X}px ${Y}px` },
    { autoAlpha: 1, scale: 1, duration: 0.65, ease: "back.out(1.4)" }, T.rightIn);
  K.drawIn(tl, rim, T.rightIn, 0.6, "power2.out");
  tl.fromTo(ticks, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: "power1.out", stagger: 0.025 }, T.rightIn + 0.12);
  tl.fromTo(pips.map((p) => p.el), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, stagger: 0.03 }, T.rightIn + 0.3);
  // crown press as the count lands
  tl.fromTo(crown, { y: 0 }, { y: 5, duration: 0.08, ease: "power2.out" }, landB - 0.04);
  tl.to(crown, { y: 0, duration: 0.35, ease: "power2.out", immediateRender: false }, landB + 0.04);
  K.fadeIn(tl, caption, T.caption, { y: 10, dur: 0.7 });
  drift({ node: kB.wrap, ay: 1.6, period: 7.0, phase: 0.9, from: 4.0, ramp: 1.4 });
  drift({ node: swFloat, ay: 3.5, ax: 1, rot: 1.2, period: 5.6, phase: 1.1, from: landB + 0.1 });

  // 「地面等待」— a teal line glides along the ground under the wheels
  tl.fromTo(groundMark, { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 0.6, ease: "power2.inOut" }, T.ground);
  tl.fromTo(groundMark, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, T.ground);

  // hand locked to the counter: 528 min = 8.8 turns (6° per minute)
  const valB = (t) => 528 * eP2InOut(K.clamp01((t - T.count) / T.countDur));
  const crossT = [];
  for (let k = 1; k <= 8; k++) {
    let lo = T.count, hi = landB;
    for (let it = 0; it < 40; it++) { const m = (lo + hi) / 2; if (valB(m) < 60 * k) lo = m; else hi = m; }
    crossT.push(hi);
  }
  K.onFrame((t) => {
    const ang = valB(t) * 6;
    hand.setAttribute("transform", `rotate(${ang.toFixed(2)} ${X} ${Y})`);
    // speed sweep: a faint wedge trailing the hand, only while it spins fast
    const w = ang - valB(t - 1 / FPS) * 6; // deg per frame
    const span = Math.min(w * 1.4, 140);
    const strength = Math.min(1, w / 40) * 0.2;
    for (let k = 0; k < SWEEP_N; k++) {
      const el = sweep[k];
      if (span < 3) { el.setAttribute("opacity", 0); continue; }
      const b = ang - (span * k) / SWEEP_N, a = ang - (span * (k + 1)) / SWEEP_N, rr = R - 20;
      const a1 = (a * Math.PI) / 180, a2 = (b * Math.PI) / 180;
      el.setAttribute("d", `M${X} ${Y} L${f2(X + rr * Math.sin(a1))} ${f2(Y - rr * Math.cos(a1))} A${rr} ${rr} 0 0 1 ${f2(X + rr * Math.sin(a2))} ${f2(Y - rr * Math.cos(a2))} Z`);
      el.setAttribute("opacity", f2(strength * (1 - k / SWEEP_N)));
    }
    for (let k = 0; k < 8; k++) {
      const ph = t - crossT[k];
      const lit = ph >= 0;
      const pop = lit ? 1 + 0.55 * (1 - smooth(ph / 0.28)) : 1;
      pips[k].el.setAttribute("fill", lit ? C.terra : C.tealLine);
      pips[k].el.setAttribute("r", (4.6 * pop).toFixed(2));
    }
  });

  // ---- 「累計」: one dot per ticket streams into the stopwatch ---------
  const L0 = [1050, 487];            // lane gate: between 「528」 and the tail fin
  const LQ = [1462, 545];            // lane control: above the fuselage
  const END = [X, Y];
  const dots = tickets.map((tk) => {
    const rel = T.dots + tk.i * T.dotStag;
    const o = gridDrift(rel);
    const p0 = [tk.cx + 24 + o[0], tk.cy + o[1]];
    const c1 = [p0[0] + 60, p0[1] - 55];
    const c2 = [L0[0] - 115, L0[1] - 12];
    const pts = [];
    for (let k = 0; k <= 48; k++) {
      const u = k / 48, v = 1 - u;
      pts.push([
        v * v * v * p0[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * L0[0],
        v * v * v * p0[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * L0[1],
      ]);
    }
    for (let k = 1; k <= 40; k++) {
      const u = k / 40, v = 1 - u;
      pts.push([v * v * L0[0] + 2 * v * u * LQ[0] + u * u * END[0], v * v * L0[1] + 2 * v * u * LQ[1] + u * u * END[1]]);
    }
    const cum = [0];
    for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    const flash = S("path", { d: TD, fill: "none", stroke: C.teal, "stroke-width": 2.2, opacity: 0 }, flashG);
    const trail = S("path", { d: "", fill: C.teal, opacity: 0 }, dotsG);
    const dot = S("circle", { cx: 0, cy: 0, r: 6, fill: C.teal, opacity: 0 }, dotsG);
    return { tk, rel, pts, cum, len: cum[cum.length - 1], flash, trail, dot };
  });
  const posAt = (d, s) => {
    const L = d.len * s;
    let lo = 0, hi = d.cum.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (d.cum[m] < L) lo = m; else hi = m; }
    const seg = d.cum[hi] - d.cum[lo] || 1, f = (L - d.cum[lo]) / seg;
    return [lerp(d.pts[lo][0], d.pts[hi][0], f), lerp(d.pts[lo][1], d.pts[hi][1], f)];
  };
  const progAt = (d, t) => eP1In(K.clamp01((t - d.rel) / T.dotDur));
  K.onFrame((t) => {
    const go = gridDrift(t);
    for (const d of dots) {
      // ticket outline flicks teal as its dot leaves
      const ph = t - d.rel;
      const fa = ph < 0 ? 0 : ph < 0.06 ? ph / 0.06 : Math.max(0, 1 - (ph - 0.06) / 0.42);
      d.flash.setAttribute("opacity", f2(fa * 0.95));
      if (fa > 0) d.flash.setAttribute("transform", `translate(${f2(d.tk.cx + go[0])} ${f2(d.tk.cy + go[1])})`);
      if (ph < 0 || ph > T.dotDur) {
        d.dot.setAttribute("opacity", 0);
        d.trail.setAttribute("opacity", 0);
        continue;
      }
      const s = progAt(d, t);
      const p = posAt(d, s);
      const grow = smooth(ph / 0.09), shrink = 1 - smooth((s - 0.8) / 0.2);
      d.dot.setAttribute("cx", f2(p[0]));
      d.dot.setAttribute("cy", f2(p[1]));
      d.dot.setAttribute("r", (6 * grow * shrink).toFixed(2));
      d.dot.setAttribute("opacity", 1);
      // tapered comet tail: samples of the recent path, width -> 0
      const NQ = 8, rad = 5.4 * grow * shrink;
      const q = [];
      for (let k = 0; k <= NQ; k++) q.push(posAt(d, progAt(d, t - k * 0.0075)));
      const left = [], right = [];
      for (let k = 0; k <= NQ; k++) {
        const a = q[Math.max(0, k - 1)], b = q[Math.min(NQ, k + 1)];
        let nx = -(a[1] - b[1]), ny = a[0] - b[0];
        const nl = Math.hypot(nx, ny) || 1;
        nx /= nl; ny /= nl;
        const w = rad * (1 - k / NQ);
        left.push(f2(q[k][0] + nx * w) + " " + f2(q[k][1] + ny * w));
        right.push(f2(q[k][0] - nx * w) + " " + f2(q[k][1] - ny * w));
      }
      d.trail.setAttribute("d", "M" + left.join(" L") + " L" + right.reverse().join(" L") + " Z");
      d.trail.setAttribute("opacity", f2(0.34 * shrink));
    }
  });

  // ---- exit: camera tilt-up (layer travels down + fades) -------------
  [[leftExit, T.exit], [rightExit, T.exit + 0.08]].forEach(([n, at]) => {
    tl.fromTo(n, { y: 0 }, { y: 200, duration: 0.6, ease: "power2.in", immediateRender: false }, at);
    // fully faded by +96 px, i.e. before anything reaches the footnote zone
    tl.fromTo(n, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.42, ease: "power1.in", immediateRender: false }, at + 0.05);
  });
  tl.set(fxWrap, { autoAlpha: 0 }, 4.95);
});
