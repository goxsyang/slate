/* s1_ground — 單日案例 · 5 月 5 日   (window 0 → 6.15 s)
 *
 * Left  : KPI 「時段安排 38 個 CTOT」, desk calendar (the 5/4 date sheet rolls
 *         back over the binding to reveal 5/5), 38 mini CTOT tickets dealt
 *         from the date into a 5×8 board.
 * Right : KPI 「累計地面等待 528 分鐘」, 12-hour stopwatch whose hand is locked
 *         to the counter (528 min → 264°, the dial itself reads 8:48; each
 *         completed hour lights its tick), parked plane on a ground line.
 *         The plane / ground / stopwatch sit on screen as a 30 % ghost from
 *         0.55 s and swap emphasis with the left group at 3.10 s.
 * Bridge: one teal dot per ticket streams through a dotted channel into the
 *         stopwatch (「累計」).
 * Exit  : camera tilt-up — both groups travel down and fade (left leads).
 *
 * Everything is a pure function of t (GSAP tweens on the paused master
 * timeline + K.onFrame hooks).
 */
MG.scene("s1_ground", function (tl) {
  const { C } = K;
  const BASE = 0.935; // baseline / font-size for Noto Sans TC at line-height 1.0
  const FONT = '"Noto Sans TC", sans-serif';

  // ------------------------------------------------------------ helpers
  const S = (tag, attrs, parent) => K.svg(tag, attrs, parent);
  const box = (parent, style) => K.el("div", { cls: "abs", style: style || {} }, parent);
  const canvas = (parent) => K.svgCanvas(parent);
  const lerp = (a, b, p) => a + (b - a) * p;
  const smooth = (x) => { x = K.clamp01(x); return x * x * (3 - 2 * x); };
  const ePos = K.easeFn("power2.out");
  const eSc = K.easeFn("power3.out");
  const eP2InOut = K.easeFn("power2.inOut");
  const eP1In = K.easeFn("power1.in");
  const f2 = (v) => v.toFixed(2);
  const setA = (n, k, v) => { if (n.getAttribute(k) !== v) n.setAttribute(k, v); };

  /** Gentle drift; amplitude follows o.env(t) or ramps in from o.from. */
  function drift(o) {
    const fn = (t) => {
      const amp = o.env ? o.env(t) : smooth((t - (o.from || 0)) / (o.ramp || 1.2));
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
    // label 46 px (34 × 1.35, broadcast legibility); the label→number gap
    // tightens from 18 to 12 so the number / bar B stay where they were
    const LABEL = 46;
    const label = K.text(g, o.label, { x: 4, y: 0, size: LABEL, weight: 500, color: C.teal });
    const numTop = LABEL * 1.2 + 12;
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
  // calendar page; the stand foot sits on the x ≈ 100 ink line
  const PL = 158, PR = 398, PT = 540, PB = 841, PW = PR - PL, PH = PB - PT;
  const BAND = 54;                          // header band height
  const HOLES = [PL + 62, PR - 62];         // binder ring x
  const HOLE_Y = PT + 22;
  const GRID = { x: PL + 18, y: PT + BAND + 18, w: PW - 36, h: PH - BAND - 36 };
  const DATE_C = { x: GRID.x + GRID.w / 2, y: GRID.y + GRID.h / 2 }; // centre of 「5/5」
  const SHEET_T = PT + BAND;                // top (hinge) of the flipping date sheet
  // ticket board
  const TK = { w: 78, h: 31, gx: 10, gy: 7.5, x0: 442, y0: PT, cols: 5, n: 38 };
  // right group
  // dial centred over its (enlarged, right-margin-flush) caption
  const SW = { cx: 1641, cy: 355, r: 88, sw: 10 };
  const PLANE = { x: 990, scale: 0.92, bottom: 842 };
  const GROUND_Y = 843;
  // colours specific to the calendar illustration (reference f_022)
  const CAL = {
    band: "#5b97d1", stand: "#3a78b8", gridFill: "#e6f0fa", gridLine: "#97bfe6",
    ring: "#6aa3da", page: "#ffffff", hole: C.navy,
  };

  // ================================================================ TIMING
  const T = {
    calIn: 0.10, flip: 0.29, flipDur: 0.33, ring: 0.58, ringDur: 0.48,
    ghost: 0.55, slots: 0.80, deal: 0.96, dealStag: 0.0145, dealDur: 0.5, dealLand: 0.29,
    kpiA: 1.0, unitA: 1.62,
    dim: 3.10, dimDur: 0.45, rightIn: 3.22,
    dots: 3.18, dotGate: 3.40, dotStag: 0.0092, dotDur: 0.5,
    count: 3.30, countDur: 0.68, unitB: 3.80,
    caption: 4.30, ground: 4.92, chocks: 5.0, exit: 5.50,
  };
  const landA = T.deal + (TK.n - 1) * T.dealStag + T.dealLand; // ≈ 1.79, counter A lands with last ticket
  const landB = T.count + T.countDur;                            // 3.98

  // ------------------------------------------------------------ layers
  const root = K.layer("s1", 2);
  // soft floor guard (same idea as S2/S3): the static scene ends by y ≈ 855;
  // during the tilt-down exit nothing may reach the raised footnote band
  // (glyphs from y 912) — content dissolves between y 870 and 886
  const GUARD = "linear-gradient(to bottom, #000 0px, #000 870px, transparent 886px)";
  root.style.webkitMaskImage = GUARD;
  root.style.maskImage = GUARD;
  const leftExit = box(root, { left: 0, top: 0 });
  const leftDim = box(leftExit, { left: 0, top: 0 });
  const rightExit = box(root, { left: 0, top: 0 });
  const fxWrap = box(root, { left: 0, top: 0 });

  // ================================================================ LEFT
  const kA = kpi(leftDim, { x: 96, y: 225, label: "時段安排", final: "38", unit: "個 CTOT" });

  // ---- calendar ------------------------------------------------------
  const calEnter = box(leftDim, { left: 0, top: 0 });
  const calFloat = box(calEnter, { left: 0, top: 0 });
  const calBase = canvas(calFloat);

  // soft contact shadow
  S("ellipse", { cx: (PL + PR) / 2 - 26, cy: PB + 3, rx: 168, ry: 7, fill: "#e9f0f5" }, calBase);
  // A-frame stand: a wide navy-outlined triangle behind the page
  S("path", {
    d: `M${PL + 4} ${PT + 14} L${PL - 57} ${PB - 2} Q${PL - 58} ${PB + 1} ${PL - 54} ${PB + 1} L${PL + 14} ${PB + 1} Z`,
    fill: CAL.stand, stroke: C.navy, "stroke-width": 3, "stroke-linejoin": "round",
  }, calBase);

  function drawGrid(g) {
    S("rect", { x: GRID.x, y: GRID.y, width: GRID.w, height: GRID.h, rx: 3, fill: CAL.gridFill, stroke: CAL.gridLine, "stroke-width": 1.8 }, g);
    for (let i = 1; i < 3; i++) {
      const gx = GRID.x + (GRID.w * i) / 3, gy = GRID.y + (GRID.h * i) / 3;
      S("line", { x1: gx, y1: GRID.y, x2: gx, y2: GRID.y + GRID.h, stroke: CAL.gridLine, "stroke-width": 1.8 }, g);
      S("line", { x1: GRID.x, y1: gy, x2: GRID.x + GRID.w, y2: gy, stroke: CAL.gridLine, "stroke-width": 1.8 }, g);
    }
  }
  function drawDate(g, str, color, opacity) {
    // the date, knocked out of the grid lines
    return S("text", {
      x: DATE_C.x, y: DATE_C.y + 23, "text-anchor": "middle", "font-family": FONT, "font-weight": 700,
      "font-size": 64, fill: color, stroke: CAL.gridFill, "stroke-width": 12, "paint-order": "stroke",
      "stroke-linejoin": "round", "letter-spacing": "-1", opacity: opacity == null ? 1 : opacity, text: str,
    }, g);
  }

  // fixed part of the calendar: page, header band, binder holes, 5/5 sheet
  const pageG = S("g", {}, calBase);
  S("rect", { x: PL, y: PT, width: PW, height: PH, rx: 11, fill: CAL.page }, pageG);
  S("path", {
    d: `M${PL} ${SHEET_T} V${PT + 11} Q${PL} ${PT} ${PL + 11} ${PT} H${PR - 11} Q${PR} ${PT} ${PR} ${PT + 11} V${SHEET_T} Z`,
    fill: CAL.band,
  }, pageG);
  S("line", { x1: PL, y1: SHEET_T, x2: PR, y2: SHEET_T, stroke: C.navy, "stroke-width": 2.5 }, pageG);
  for (const hx of HOLES) S("ellipse", { cx: hx, cy: HOLE_Y, rx: 8.5, ry: 6.5, fill: CAL.hole }, pageG);
  drawGrid(pageG);
  const date55 = drawDate(pageG, "5/5", C.teal);
  S("rect", { x: PL, y: PT, width: PW, height: PH, rx: 11, fill: "none", stroke: C.navy, "stroke-width": 3 }, pageG);

  // terracotta hand-drawn ring around 「5/5」 (≈1.1 turns, slight wobble)
  const ringPts = [];
  {
    const N = 90, turns = 1.1, a0 = -2.55, tilt = -0.1;
    for (let i = 0; i <= N; i++) {
      const u = i / N, a = a0 + u * turns * Math.PI * 2;
      const wob = 1 + 0.035 * Math.sin(u * 7.1 + 0.6) + 0.06 * u;
      const ex = 72 * wob * Math.cos(a), ey = 43 * wob * Math.sin(a);
      ringPts.push([DATE_C.x + 2 + ex * Math.cos(tilt) - ey * Math.sin(tilt), DATE_C.y + 1 + ex * Math.sin(tilt) + ey * Math.cos(tilt)]);
    }
  }
  const ring55 = S("path", {
    d: "M" + ringPts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L"),
    fill: "none", stroke: C.terra, "stroke-width": 4.5, "stroke-linecap": "round", "stroke-linejoin": "round",
  }, calBase);

  // the 5/4 date sheet only (no band, no holes): hinged at the band's bottom
  // edge, it rolls back over the binding and is hidden at exactly 90°
  const SH = PB - SHEET_T;
  const flip = box(calFloat, { left: PL - 2, top: SHEET_T, width: PW + 4, height: SH + 2 });
  flip.style.transformOrigin = "50% 0px";
  const flipSvg = S("svg", {
    width: PW + 4, height: SH + 2, viewBox: `${PL - 2} ${SHEET_T} ${PW + 4} ${SH + 2}`,
    style: "position:absolute;left:0;top:0;overflow:visible",
  }, flip);
  const sheetD = `M${PL} ${SHEET_T + 1.25} V${PB - 11} Q${PL} ${PB} ${PL + 11} ${PB} H${PR - 11} Q${PR} ${PB} ${PR} ${PB - 11} V${SHEET_T + 1.25} Z`;
  S("path", { d: sheetD, fill: CAL.page }, flipSvg);
  drawGrid(flipSvg);
  drawDate(flipSvg, "5/4", C.tealDim, 0.6); // "yesterday": never asserts the wrong date at full contrast
  S("path", {
    d: `M${PL} ${SHEET_T} V${PB - 11} Q${PL} ${PB} ${PL + 11} ${PB} H${PR - 11} Q${PR} ${PB} ${PR} ${PB - 11} V${SHEET_T}`,
    fill: "none", stroke: C.navy, "stroke-width": 3, "stroke-linejoin": "round",
  }, flipSvg);
  const flipShade = S("path", { d: sheetD, fill: C.navy, opacity: 0 }, flipSvg);

  // binder rings on top of both sheets
  const calTop = canvas(calFloat);
  for (const hx of HOLES) {
    const ry = (HOLE_Y - (PT - 26)) / 2, cyR = HOLE_Y - ry, rx = 14.5;
    const pa = (deg) => [hx + rx * Math.cos((deg * Math.PI) / 180), cyR + ry * Math.sin((deg * Math.PI) / 180)];
    const [ax, ay] = pa(112), [bx, by] = pa(68);
    const d = `M${f2(ax)} ${f2(ay)} A${rx} ${ry} 0 1 1 ${f2(bx)} ${f2(by)}`;
    S("path", { d, fill: "none", stroke: C.navy, "stroke-width": 11, "stroke-linecap": "round" }, calTop);
    S("path", { d, fill: "none", stroke: CAL.ring, "stroke-width": 5, "stroke-linecap": "round" }, calTop);
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
    const sx = DATE_C.x + (rng() - 0.5) * 18, sy = DATE_C.y + (rng() - 0.5) * 8;
    const rot0 = (rng() - 0.5) * 26, lift = 45 + rng() * 35;
    // rows below the date travel sideways instead of arcing over landed rows
    const qx = (sx + cx) / 2, qy = cy > DATE_C.y ? (sy + cy) / 2 - 30 : Math.min(sy, cy) - lift;
    tickets.push({ i, c, r, cx, cy, slot, sx, sy, qx, qy, rot0 });
  }
  for (const tk of tickets) {
    // full-emphasis ticket = reference f_022/f_023 (navy outline, sky fill,
    // blue glyph, solid orange square); the 0.35 group dim gives f_025
    const g = S("g", { opacity: 0 }, tkSvg);
    S("path", { d: TD, fill: C.skyPale, stroke: C.navy, "stroke-width": 1.8, "stroke-linejoin": "round" }, g);
    S("path", { d: PLANE_GLYPH, fill: C.blue, transform: `translate(${-TK.w / 2 + 6} ${-10.8}) scale(0.9)` }, g);
    S("line", { x1: 9, y1: -TK.h / 2 + 6, x2: 9, y2: TK.h / 2 - 6, stroke: "#9fb3c8", "stroke-width": 1.2, "stroke-dasharray": "2.2 2.6", "stroke-linecap": "round" }, g);
    S("rect", { x: 17.5, y: -6.5, width: 13, height: 13, rx: 2, fill: C.orange }, g);
    tk.g = g;
  }

  // ================================================================ RIGHT
  const kB = kpi(rightExit, { x: 1000, y: 225, label: "累計地面等待", final: "528", unit: "分鐘", lift: 2 });

  // everything illustrative on the right lives in the ghost wrapper: it is on
  // screen at 30 % while 「38 個 CTOT」 is the focus, then swaps emphasis
  const rightGhost = box(rightExit, { left: 0, top: 0 });

  // ground + plane
  const groundSvg = canvas(rightGhost);
  S("ellipse", { cx: 1430, cy: GROUND_Y + 1, rx: 400, ry: 8, fill: "#e9f0f5" }, groundSvg);
  const ground = S("line", { x1: 960, y1: GROUND_Y, x2: 1840, y2: GROUND_Y, stroke: C.navy, "stroke-width": 2, "stroke-linecap": "round" }, groundSvg);
  // 「地面等待」: a teal band just under the ground line, beneath the gears
  const groundBand = S("line", { x1: 1336, y1: GROUND_Y + 7, x2: 1742, y2: GROUND_Y + 7, stroke: C.teal, "stroke-width": 6, "stroke-linecap": "round" }, groundSvg);

  const planeEnter = box(rightGhost, { left: 0, top: 0 });
  const pim = MG.images["assets/plane_side.png"];
  const pH = pim.naturalHeight * PLANE.scale;
  const PLANE_TOP = PLANE.bottom - pH;
  const plane = K.img(planeEnter, "assets/plane_side.png", { x: PLANE.x, y: PLANE_TOP, scale: PLANE.scale });
  plane.style.clipPath = "inset(0 0 1px 0)"; // drop the faint baked-in ground hairline

  // anti-collision beacons (top of fuselage near the wing root + belly) and
  // wheel chocks under the main gear
  const planeFx = canvas(planeEnter);
  const ax = (px) => PLANE.x + px * PLANE.scale, ay = (py) => PLANE_TOP + py * PLANE.scale;
  const beacons = [[ax(326), ay(174) - 1.5], [ax(318), ay(294) + 1.5]].map(([bx, by]) => {
    const halo = S("circle", { cx: bx, cy: by, r: 9, fill: C.terra, opacity: 0 }, planeFx);
    const core = S("circle", { cx: bx, cy: by, r: 3.4, fill: C.terra, stroke: C.navy, "stroke-width": 1.2, opacity: 0.35 }, planeFx);
    return { halo, core };
  });
  const chocks = [ax(398) - 8, ax(516) + 8].map((cxk) => {
    const g = S("g", {}, planeFx);
    S("path", {
      d: `M${cxk - 8} ${GROUND_Y - 1} L${cxk - 4.5} ${GROUND_Y - 10} H${cxk + 4.5} L${cxk + 8} ${GROUND_Y - 1} Z`,
      fill: C.teal, stroke: C.navy, "stroke-width": 1.4, "stroke-linejoin": "round",
    }, g);
    return g;
  });

  // ---- stopwatch (12-hour dial) --------------------------------------
  const swFloat = box(rightGhost, { left: 0, top: 0 });
  swFloat.style.transformOrigin = `${SW.cx}px ${SW.cy}px`;
  const swPop = box(swFloat, { left: 0, top: 0 });
  const sw = canvas(swPop);
  const { cx: X, cy: Y, r: R } = SW;
  const crown = S("g", {}, sw);
  S("rect", { x: X - 8, y: Y - R - 24, width: 16, height: 22, fill: C.teal }, crown);
  S("rect", { x: X - 24, y: Y - R - 38, width: 48, height: 17, rx: 5, fill: C.teal }, crown);
  const sideBtn = S("g", { transform: `rotate(-42 ${X} ${Y})` }, sw);
  S("rect", { x: X - 6, y: Y - R - 17, width: 12, height: 14, rx: 3, fill: C.teal }, sideBtn);
  S("circle", { cx: X, cy: Y, r: R, fill: C.tealSoft }, sw);
  S("circle", { cx: X, cy: Y, r: R, fill: "none", stroke: C.teal, "stroke-width": SW.sw }, sw);
  const ticks = [];
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2, major = k % 3 === 0;
    const r1 = R - 24 - (major ? 4 : 0), r2 = R - 13;
    ticks.push({
      el: S("line", {
        x1: X + r1 * Math.sin(a), y1: Y - r1 * Math.cos(a), x2: X + r2 * Math.sin(a), y2: Y - r2 * Math.cos(a),
        stroke: C.teal, "stroke-width": major ? 5 : 4, "stroke-linecap": "round",
      }, sw),
      w: major ? 5 : 4,
    });
  }
  const hand = S("g", {}, sw);
  S("line", { x1: X, y1: Y + 10, x2: X, y2: Y - R + 26, stroke: C.terra, "stroke-width": 7, "stroke-linecap": "round" }, hand);
  S("circle", { cx: X, cy: Y, r: 10.5, fill: C.teal }, sw);
  S("circle", { cx: X, cy: Y, r: 3.6, fill: C.tealSoft }, sw);

  const caption = K.text(rightExit, "相當於 8 小時 48 分", { x: 0, y: Y + R + 36, size: 41, weight: 400, color: C.gray, ls: 0.02 });
  { // centred under the dial, but never past the right margin (x 1824)
    const cw = caption.getBoundingClientRect().width / MG.stageScale;
    caption.style.left = Math.min(X - cw / 2, 1822 - cw) + "px";
  }

  // ================================================================ FX (dots)
  const fx = canvas(fxWrap);
  const guideG = S("g", {}, fx);
  const flashG = S("g", {}, fx);
  const dotsG = S("g", {}, fx);

  // ---- calendar entrance + date-sheet flip ---------------------------
  tl.fromTo(calEnter, { autoAlpha: 0, y: 30, scale: 0.96, transformOrigin: `${(PL + PR) / 2}px ${PB}px` },
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.85, ease: "expo.out" }, T.calIn);
  K.onFrame((t) => {
    const x = K.clamp01((t - T.flip) / T.flipDur);
    if (x >= 1) { flip.style.visibility = "hidden"; return; }
    flip.style.visibility = "";
    // projected sheet height falls ~ (1 - x²): the motion starts as a gentle
    // peel and is spread over the whole 0.33 s rather than bunched at the end
    const th = (Math.acos(1 - eP1In(x)) * 180) / Math.PI;
    flip.style.transform = `perspective(1000px) rotateX(${(-th).toFixed(3)}deg)`;
    setA(flipShade, "opacity", f2((0.15 * th) / 90));
  });
  tl.fromTo(date55, { scale: 0.94, transformOrigin: "50% 60%" }, { scale: 1, duration: 0.7, ease: "expo.out" }, T.flip + 0.18);
  K.drawIn(tl, ring55, T.ring, T.ringDur, "power2.inOut");
  tl.fromTo(ring55, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, T.ring);
  drift({ node: calFloat, ay: 3, ax: 1, period: 6.2, phase: 0.4, from: 1.0 });
  drift({ node: kA.wrap, ay: 1.6, period: 7.4, phase: 2.6, from: 1.8, ramp: 1.6 });

  // ---- KPI A ----------------------------------------------------------
  K.fadeIn(tl, kA.label, T.kpiA, { y: 14, dur: 0.8 });
  tl.fromTo(kA.numWrap, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out" }, T.kpiA + 0.12);
  K.textIn(tl, kA.unit, T.unitA, { dur: 0.8, stagger: 0.045 });
  K.barIn(tl, kA.bar, landA, 0.8);
  K.onFrame((t) => {
    let n = 0;
    for (let i = 0; i < TK.n; i++) if (t >= T.deal + i * T.dealStag + T.dealLand) n++;
    const s = String(n);
    if (kA.num.textContent !== s) kA.num.textContent = s;
  });

  // ---- tickets dealt from the date -----------------------------------
  const gridDrift = drift({ node: tkFloat, ay: 2.5, ax: 0.8, period: 5.3, phase: 2.1, from: 2.2 });
  K.onFrame((t) => {
    for (const tk of tickets) {
      // slot: faint dashed outline, wave in, then hidden by the ticket
      const sp = smooth((t - (T.slots + (tk.c + tk.r) * 0.018)) / 0.3);
      setA(tk.slot, "opacity", f2(sp * 0.9));
      const s0 = T.deal + tk.i * T.dealStag;
      if (t < s0) { setA(tk.g, "opacity", "0"); continue; }
      const p = K.clamp01((t - s0) / T.dealDur);
      const u = ePos(p), v = 1 - u, es = eSc(p);
      const x = v * v * tk.sx + 2 * v * u * tk.qx + u * u * tk.cx;
      const y = v * v * tk.sy + 2 * v * u * tk.qy + u * u * tk.cy;
      const sc = 0.35 + 0.65 * Math.pow(u, 1.6); // small in flight, grows into its slot
      const rot = tk.rot0 * (1 - es);
      setA(tk.g, "opacity", f2(K.clamp01((t - s0) / 0.03)));
      tk.g.setAttribute("transform", `translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)}) scale(${sc.toFixed(3)})`);
    }
  });

  // ---- right ghost (0.55 → 0.3) and the emphasis swap (3.10) -----------
  tl.fromTo(rightGhost, { autoAlpha: 0, y: 16 }, { autoAlpha: 0.3, y: 0, duration: 0.85, ease: "expo.out" }, T.ghost);
  tl.fromTo(planeEnter, { x: 80 }, { x: 0, duration: 1.1, ease: "expo.out" }, T.ghost + 0.07);
  K.drawIn(tl, ground, T.ghost, 0.9, "power3.out");
  tl.fromTo(leftDim, { autoAlpha: 1 }, { autoAlpha: 0.35, duration: T.dimDur, ease: "power2.inOut", immediateRender: false }, T.dim);
  tl.to(rightGhost, { autoAlpha: 1, duration: T.dimDur, ease: "power2.inOut", immediateRender: false }, T.dim);

  // ---- KPI B + stopwatch ---------------------------------------------
  K.textIn(tl, kB.label, T.rightIn, { dur: 0.85, stagger: 0.035 });
  tl.fromTo(kB.numWrap, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out" }, T.count - 0.04);
  K.counter(kB.num, { from: 0, to: 528, at: T.count, dur: T.countDur, ease: "power2.inOut" });
  K.textIn(tl, kB.unit, T.unitB, { dur: 0.8, stagger: 0.05 });
  K.barIn(tl, kB.bar, landB, 0.8);
  // one soft pulse as the stopwatch takes the focus
  tl.fromTo(swPop, { scale: 1, transformOrigin: `${X}px ${Y}px` }, { scale: 1.05, duration: 0.2, ease: "power2.out" }, T.rightIn);
  tl.to(swPop, { scale: 1, duration: 0.3, ease: "sine.inOut", immediateRender: false }, T.rightIn + 0.2);
  // crown press as the count lands
  tl.fromTo(crown, { y: 0 }, { y: 5, duration: 0.08, ease: "power2.out" }, landB - 0.04);
  tl.to(crown, { y: 0, duration: 0.35, ease: "power2.out", immediateRender: false }, landB + 0.04);
  K.fadeIn(tl, caption, T.caption, { y: 10, dur: 0.7 });
  drift({ node: kB.wrap, ay: 1.6, period: 7.0, phase: 0.9, from: 3.9, ramp: 1.4 });
  const swDrift = drift({ node: swFloat, ay: 3.5, ax: 1, rot: 1.2, period: 5.6, phase: 1.1, from: 0.9, ramp: 1.6 });

  // 「地面等待」: the teal band glides along under the gear, chocks pop in
  tl.fromTo(groundBand, { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 0.4, ease: "power2.out" }, T.ground);
  tl.fromTo(groundBand, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, T.ground);
  chocks.forEach((g, k) => {
    tl.fromTo(g, { autoAlpha: 0, scale: 0, transformOrigin: "50% 100%" },
      { autoAlpha: 1, scale: 1, duration: 0.45, ease: "back.out(1.4)" }, T.chocks + k * 0.08);
  });
  // beacons: deterministic 1 Hz flash ("engines on, waiting on the ground")
  K.onFrame((t) => {
    beacons.forEach((b, k) => {
      const ph = t - 0.18 - k * 0.5;
      const f = Math.pow(Math.max(0, Math.sin(2 * Math.PI * ph)), 8);
      setA(b.core, "opacity", f2(0.25 + 0.75 * f));
      setA(b.halo, "opacity", f2(0.28 * f));
    });
  });

  // hand locked to the counter on a 12-hour dial: 0.5° per minute, so the
  // hand ends between 8 and 9 and the dial itself reads 8:48
  const valB = (t) => 528 * eP2InOut(K.clamp01((t - T.count) / T.countDur));
  const crossT = [];
  for (let k = 1; k <= 8; k++) {
    let lo = T.count, hi = landB;
    for (let it = 0; it < 40; it++) { const m = (lo + hi) / 2; if (valB(m) < 60 * k) lo = m; else hi = m; }
    crossT.push(hi);
  }
  K.onFrame((t) => {
    hand.setAttribute("transform", `rotate(${(valB(t) * 0.5).toFixed(2)} ${X} ${Y})`);
    // each completed hour lights its tick (the hand is passing it)
    for (let k = 1; k <= 8; k++) {
      const ph = t - crossT[k - 1], tk = ticks[k];
      const lit = ph >= 0;
      const pop = lit ? 3.2 * (1 - smooth(ph / 0.3)) : 0;
      setA(tk.el, "stroke", lit ? C.terra : C.teal);
      setA(tk.el, "stroke-width", f2(tk.w + (lit ? 0.6 : 0) + pop));
    }
  });

  // ---- 「累計」: one dot per ticket streams into the stopwatch ---------
  // shared channel: through the gap between bar B and the fin tip, sagging
  // over the fuselage, entering the dial from its lower left
  const G = [990, 494];
  const LANE = [G, [1180, 497], [X - 113.5, 595.7], [X - 41, 442]];
  const cub = (P, u) => {
    const v = 1 - u;
    return [
      v * v * v * P[0][0] + 3 * v * v * u * P[1][0] + 3 * v * u * u * P[2][0] + u * u * u * P[3][0],
      v * v * v * P[0][1] + 3 * v * v * u * P[1][1] + 3 * v * u * u * P[2][1] + u * u * u * P[3][1],
    ];
  };
  const lanePts = [];
  for (let k = 0; k <= 60; k++) lanePts.push(cub(LANE, k / 60));
  const E = LANE[3];
  for (let k = 1; k <= 8; k++) lanePts.push([lerp(E[0], X, k / 8), lerp(E[1], Y, k / 8)]);
  const N_LANE_CURVE = 60; // index of E in lanePts

  // motion profile: accelerate off the ticket, then cruise at a constant,
  // trackable speed through the channel (no end-of-flight speed spike)
  const ACC = 0.45, KC = 1 / (1 - ACC / 2);
  const prof = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < ACC ? (KC * x * x) / (2 * ACC) : KC * (x - ACC / 2));
  const profInv = (s) => (s < (KC * ACC) / 2 ? Math.sqrt((2 * ACC * s) / KC) : s / KC + ACC / 2);
  const dRng = K.rng(77);
  const dots = tickets.map((tk) => {
    // gate-scheduled: dot i crosses the channel gate at TG0 + i·Δ (± a little
    // jitter), so the merge is evenly fed instead of bunching into a blob;
    // release time is solved back from each ticket's leg length
    const tGate = T.dotGate + tk.i * T.dotStag + (dRng() - 0.5) * 0.6 * T.dotStag;
    const o = gridDrift(tGate - 0.2);
    const p0 = [tk.cx + 24 + o[0], tk.cy + o[1]];
    const leg = [p0, [p0[0] + 60, p0[1] - 55], [G[0] - 120, G[1]], G];
    const raw = [], wgt = [];
    for (let k = 0; k <= 40; k++) { raw.push(cub(leg, k / 40)); wgt.push(smooth(k / 40)); }
    const gateIdx = raw.length - 1;
    for (let k = 1; k < lanePts.length; k++) {
      raw.push(lanePts[k]);
      wgt.push(k <= N_LANE_CURVE ? 1 : 1 - (k - N_LANE_CURVE) / 8);
    }
    // lateral lane offset so the merge doesn't stack (3 sub-lanes, ±5 px)
    const off = ((tk.i % 3) - 1) * 5;
    const pts = raw.map((p, k) => {
      const a = raw[Math.max(0, k - 1)], b = raw[Math.min(raw.length - 1, k + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0];
      const nl = Math.hypot(nx, ny) || 1;
      return [p[0] + (nx / nl) * off * wgt[k], p[1] + (ny / nl) * off * wgt[k]];
    });
    const cum = [0];
    for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    const flash = S("path", { d: TD, fill: "none", stroke: C.teal, "stroke-width": 2.2, opacity: 0 }, flashG);
    const trail = S("path", { d: "", fill: C.teal, opacity: 0 }, dotsG);
    const dot = S("circle", { cx: 0, cy: 0, r: 6, fill: C.teal, opacity: 0 }, dotsG);
    const len = cum[cum.length - 1], gateLen = cum[gateIdx];
    const rel = tGate - T.dotDur * profInv(gateLen / len);
    return { tk, rel, pts, cum, len, gateLen, flash, trail, dot };
  });
  const posAt = (d, L) => {
    L = Math.max(0, Math.min(d.len, L));
    let lo = 0, hi = d.cum.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (d.cum[m] < L) lo = m; else hi = m; }
    const seg = d.cum[hi] - d.cum[lo] || 1, f = (L - d.cum[lo]) / seg;
    return [lerp(d.pts[lo][0], d.pts[hi][0], f), lerp(d.pts[lo][1], d.pts[hi][1], f)];
  };
  const sAt = (d, t) => d.len * prof((t - d.rel) / T.dotDur);
  // the dial drifts; dots home in on its live centre over their last 200 px
  const homing = (d, s, t) => {
    const w = smooth((s - (d.len - 200)) / 200);
    if (w <= 0) return [0, 0];
    const o = swDrift(t);
    return [o[0] * w, o[1] * w];
  };

  // faint dotted guide along the shared channel: draws on from the gate,
  // and is consumed behind the last dot to pass each point
  const guide = [];
  {
    const cumL = [0];
    for (let k = 1; k <= N_LANE_CURVE; k++) cumL.push(cumL[k - 1] + Math.hypot(lanePts[k][0] - lanePts[k - 1][0], lanePts[k][1] - lanePts[k - 1][1]));
    const laneLen = cumL[N_LANE_CURVE];
    const STEP = 13;
    for (let L = 6; L < laneLen - 4; L += STEP) {
      let k = 1;
      while (cumL[k] < L) k++;
      const f = (L - cumL[k - 1]) / (cumL[k] - cumL[k - 1]);
      const gx = lerp(lanePts[k - 1][0], lanePts[k][0], f), gy = lerp(lanePts[k - 1][1], lanePts[k][1], f);
      // time the last dot passes this point
      let tHide = 0;
      for (const d of dots) tHide = Math.max(tHide, d.rel + T.dotDur * profInv(Math.min(1, (d.gateLen + L) / d.len)));
      const el = S("circle", { cx: f2(gx), cy: f2(gy), r: 2.6, fill: C.tealDim, opacity: 0 }, guideG);
      guide.push({ el, tIn: T.dots - 0.04 + 0.3 * (L / laneLen), tHide });
    }
  }

  K.onFrame((t) => {
    for (const gd of guide) {
      const a = smooth((t - gd.tIn) / 0.1) * (1 - smooth((t - gd.tHide) / 0.08));
      setA(gd.el, "opacity", f2(a * 0.9));
    }
    const go = gridDrift(t);
    for (const d of dots) {
      // ticket outline flicks teal as its dot leaves
      const ph = t - d.rel;
      const fa = ph < 0 ? 0 : ph < 0.06 ? ph / 0.06 : Math.max(0, 1 - (ph - 0.06) / 0.42);
      setA(d.flash, "opacity", f2(fa * 0.95));
      if (fa > 0) d.flash.setAttribute("transform", `translate(${f2(d.tk.cx + go[0])} ${f2(d.tk.cy + go[1])})`);
      if (ph < 0 || ph > T.dotDur) {
        setA(d.dot, "opacity", "0");
        setA(d.trail, "opacity", "0");
        continue;
      }
      const s = sAt(d, t);
      const p = posAt(d, s), h = homing(d, s, t);
      const grow = smooth(ph / 0.06), shrink = smooth((d.len - s) / 60);
      d.dot.setAttribute("cx", f2(p[0] + h[0]));
      d.dot.setAttribute("cy", f2(p[1] + h[1]));
      d.dot.setAttribute("r", (6 * grow * shrink).toFixed(2));
      setA(d.dot, "opacity", "1");
      // short tapered tail: recent path, capped at 36 px
      const NQ = 4, rad = 5.2 * grow * shrink;
      const q = [];
      for (let k = 0; k <= NQ; k++) {
        const back = Math.min(s - sAt(d, t - k * 0.006), (36 * k) / NQ);
        const pk = posAt(d, s - back), hk = homing(d, s - back, t);
        q.push([pk[0] + hk[0], pk[1] + hk[1]]);
      }
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
      setA(d.trail, "opacity", f2(0.34 * shrink));
    }
  });

  // ---- exit: camera tilt-up (layer travels down + fades) -------------
  // steep power3.in so the outgoing velocity meets S2's expo.out arrival;
  // both groups are gone by 5.88, before S2's holding loop reaches them
  [[leftExit, T.exit, "power2.in", 5.60], [rightExit, T.exit + 0.04, "power1.in", 5.58]].forEach(([n, at, fe, fa]) => {
    tl.fromTo(n, { y: 0 }, { y: 240, duration: 0.5, ease: "power3.in", immediateRender: false }, at);
    tl.fromTo(n, { autoAlpha: 1 }, { autoAlpha: 0, duration: 5.88 - fa, ease: fe, immediateRender: false }, fa);
  });
  tl.set(fxWrap, { autoAlpha: 0 }, 4.3);
});
