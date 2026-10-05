/* s2_benefits — S2 協調帶來的效益 (window 5.6 → 17.2)
 *
 * Beat A  (5.7 → 9.0)  CO₂: KPI 57.9 噸, airborne holding loop with a circling
 *                      glyph that sheds CO₂ molecules, hero plane climbing.
 *                      On 「57.9 噸」 the glyph breaks out, the loop unwinds and
 *                      the molecules dissolve while the counter runs.
 * Beat B  (9.0 → 12.25) three benefit columns: CO₂ / 燃油成本 / 盤旋風險.
 * Beat C  (12.25 → 15.95) terracotta sum-line, ATFM pill, tree connectors,
 *                      synchronized payoff pulse on 「真實價值」.
 * Exit    16.55 → 17.15.
 *
 * Every frame is a pure function of t (GSAP timeline + K.onFrame).
 */
MG.scene("s2_benefits", function (tl) {
  const { C } = K;
  const W = CUES.words;
  const T_IN = 5.6, T_END = 17.2;

  // ------------------------------------------------------------- helpers
  const PI = Math.PI, TAU = 2 * PI;
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
  /** horizontally centred single-line text */
  function textC(parent, str, cx, top, o) {
    const n = K.text(parent, str, Object.assign({ x: 0, y: top }, o));
    if (o && o.html) n.innerHTML = o.html;
    const ls = (o && o.ls != null ? o.ls : 0.02) * (o.size || 40);
    const w = n.offsetWidth - ls; // trailing letter-spacing is not ink
    n.style.left = f2(cx - w / 2) + "px";
    return n;
  }
  /** envelope-controlled float (CSS translate; composes with GSAP transform) */
  function floatEnv(node, o, env) {
    const ax = o.ax || 0, ay = o.ay || 0, per = o.period || 5, ph = o.phase || 0, rot = o.rot || 0;
    K.onFrame((t) => {
      const e = env ? env(t) : 1;
      const a = (TAU * t) / per + ph;
      node.style.translate = `${f2(ax * e * Math.sin(a * 0.83 + 1.3))}px ${f2(ay * e * Math.sin(a))}px`;
      if (rot) node.style.rotate = `${(rot * e * Math.sin(a * 0.71 + 0.4)).toFixed(3)}deg`;
    });
  }
  // CJK ink sits ~0.09em below the Latin baseline (Noto Sans TC metrics);
  // line-box top -> baseline = (lh/2 + 0.436) em.
  const baseOff = (size, lh) => (lh / 2 + 0.436) * size;

  // ------------------------------------------------------------- layer
  const layer = K.layer("s2", 2);
  // soft guard: scenes never draw into header (<200) or footnote (>945)
  const GUARD = "linear-gradient(to bottom, transparent 200px, #000 226px, #000 928px, transparent 945px)";
  layer.style.webkitMaskImage = GUARD;
  layer.style.maskImage = GUARD;
  K.onFrame((t) => setVis(layer, t >= T_IN && t <= T_END));

  // ------------------------------------------------------------- drawings
  const GLYPH_D =
    "M34 0 C34 -2.8 31 -4.6 26 -4.6 L9 -4.6 L-5 -30 L-11.5 -30 L-5.5 -4.6 L-21 -4.6 L-28 -13 L-33 -13 " +
    "L-30.5 -3.4 C-32.5 -2.4 -33.5 -1.2 -33.5 0 C-33.5 1.2 -32.5 2.4 -30.5 3.4 L-33 13 L-28 13 L-21 4.6 " +
    "L-5.5 4.6 L-11.5 30 L-5 30 L9 4.6 L26 4.6 C31 4.6 34 2.8 34 0 Z";
  /** top-down airliner, nose to +x, ~68 px long at scale 1 */
  function makeGlyph(parent, sw) {
    const g = S("g", {}, parent);
    const eng = { fill: C.sky, stroke: C.navy, "stroke-width": sw * 0.75, "stroke-linejoin": "round" };
    S("rect", Object.assign({ x: 1, y: -17.6, width: 11.5, height: 5.6, rx: 2.8 }, eng), g);
    S("rect", Object.assign({ x: 1, y: 12, width: 11.5, height: 5.6, rx: 2.8 }, eng), g);
    S("path", { d: GLYPH_D, fill: "#fff", stroke: C.navy, "stroke-width": sw, "stroke-linejoin": "round" }, g);
    S("path", { d: "M-5.5 -29.6 L-11 -29.6 M-5.5 29.6 L-11 29.6", fill: "none", stroke: C.orange, "stroke-width": sw * 1.15, "stroke-linecap": "round" }, g);
    S("path", { d: "M-19 0 L-30.5 0", fill: "none", stroke: C.blue, "stroke-width": sw * 1.15, "stroke-linecap": "round" }, g);
    S("path", { d: "M27 -2.4 Q29.6 0 27 2.4", fill: "none", stroke: C.navy, "stroke-width": sw * 0.7, "stroke-linecap": "round" }, g);
    return g;
  }
  /** CO₂ molecule (reference f_027): navyMid core, two sky atoms, navy bonds */
  function makeMolecule(parent) {
    const g = S("g", {}, parent);
    S("line", { x1: -56, y1: 0, x2: 56, y2: 0, stroke: C.navy, "stroke-width": 7.5, "stroke-linecap": "round" }, g);
    [-58, 58].forEach((x) => {
      S("circle", { cx: x, cy: 0, r: 18, fill: C.sky, stroke: C.navy, "stroke-width": 5 }, g);
      S("path", { d: `M${x - 10} -2 A10 10 0 0 1 ${x - 2} -10`, fill: "none", stroke: "#fff", "stroke-width": 3.8, "stroke-linecap": "round" }, g);
    });
    S("circle", { cx: 0, cy: 0, r: 23, fill: C.navyMid, stroke: C.navy, "stroke-width": 4 }, g);
    S("path", { d: "M-13 -4 A13.5 13.5 0 0 1 -4 -13", fill: "none", stroke: "#fff", "stroke-opacity": 0.5, "stroke-width": 4, "stroke-linecap": "round" }, g);
    return g;
  }
  /** terracotta "reduction" badge with a white down arrow */
  function makeBadge(parent, x, y) {
    const g = S("g", { transform: `translate(${x} ${y})` }, parent);
    const inner = S("g", {}, g);
    S("circle", { r: 19, fill: C.terra, stroke: "#fff", "stroke-width": 3.5 }, inner);
    S("path", { d: "M0 -8.5 L0 8 M-6.5 2 L0 8.5 L6.5 2", fill: "none", stroke: "#fff", "stroke-width": 3.4, "stroke-linecap": "round", "stroke-linejoin": "round" }, inner);
    return inner;
  }

  // =================================================================
  // BEAT A — sky stage: holding racetrack, glyph, trail, molecules
  // =================================================================
  const RT = { x1: 1250, x2: 1650, cy: 380, R: 120 };
  const STR = RT.x2 - RT.x1, ARC = PI * RT.R, P = 2 * STR + 2 * ARC;
  const TOPY = RT.cy - RT.R;
  /** position on the racetrack, arc length s from S0=(x1, top) clockwise;
   *  s > P continues straight along +x (the break-out line). */
  function rt(s) {
    if (s >= P) return { x: RT.x1 + (s - P), y: TOPY, a: TAU };
    if (s < 0) s = 0;
    if (s < STR) return { x: RT.x1 + s, y: TOPY, a: 0 };
    s -= STR;
    if (s < ARC) { const f = s / RT.R; return { x: RT.x2 + RT.R * Math.sin(f), y: RT.cy - RT.R * Math.cos(f), a: f }; }
    s -= ARC;
    if (s < STR) return { x: RT.x2 - s, y: RT.cy + RT.R, a: PI };
    s -= STR;
    const f = s / RT.R;
    return { x: RT.x1 - RT.R * Math.sin(f), y: RT.cy + RT.R * Math.cos(f), a: PI + f };
  }
  const LOOP_D = `M${RT.x1} ${TOPY} L${RT.x2} ${TOPY} A${RT.R} ${RT.R} 0 0 1 ${RT.x2} ${RT.cy + RT.R} ` +
    `L${RT.x1} ${RT.cy + RT.R} A${RT.R} ${RT.R} 0 0 1 ${RT.x1} ${TOPY}`;

  const skyEnter = div(layer);
  const sky = K.svgCanvas(skyEnter);
  const defs = S("defs", {}, sky);
  const loopMask = S("mask", { id: "s2-loop-mask", maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 1920, height: 1080 }, defs);
  const loopMaskPath = S("path", { d: LOOP_D, fill: "none", stroke: "#fff", "stroke-width": 20 }, loopMask);
  const NDASH = 78;
  S("path", {
    d: LOOP_D, fill: "none", stroke: C.tealDim, "stroke-width": 4, "stroke-linecap": "round",
    "stroke-dasharray": `6 ${(P / NDASH - 6).toFixed(3)}`, mask: "url(#s2-loop-mask)",
  }, sky);
  const molG = S("g", {}, sky);
  const trailG = S("g", { fill: "none", stroke: C.teal, "stroke-width": 4, "stroke-linecap": "butt", "stroke-linejoin": "round" }, sky);
  const glyphG = S("g", {}, sky);
  makeGlyph(glyphG, 2.5);

  // glyph timing: one lap S0→S0 ending on 「57.9」, then straight out (+x)
  const tLapA = 5.62, tBrk = W.t579;
  const vLap = P / (tBrk - tLapA);
  const ACC = 1500;
  function glyphS(t) {
    if (t <= tBrk) return Math.max(0, (t - tLapA) * vLap);
    const d = t - tBrk;
    return P + vLap * d + 0.5 * ACC * d * d;
  }
  // loop unwinds forward from the break point, pulled after the departing
  // glyph, while the counter runs
  const tE0 = tBrk + 0.02, tE1 = W.t579 + 0.86;
  const eraseE = ez("power1.inOut");
  const eraseA = (t) => P * eraseE(c01((t - tE0) / (tE1 - tE0)));

  // trail (segments of decreasing opacity behind the glyph)
  const NTR = 12, TRAIL = 420;
  const trail = [];
  for (let k = 0; k < NTR; k++) trail.push(S("path", { d: "" }, trailG));
  function segD(s0, s1, n) {
    let d = "";
    for (let j = 0; j <= n; j++) {
      const p = rt(lerp(s0, s1, j / n));
      d += (j ? "L" : "M") + f2(p.x) + " " + f2(p.y);
    }
    return d;
  }

  // molecules shed behind the glyph
  const NMOL = 12;
  const rnd = K.rng(5051);
  const mols = [];
  for (let i = 0; i < NMOL; i++) {
    const s = 150 + (i * (P - 215)) / (NMOL - 1);
    const p = rt(s);
    const n = { x: Math.sin(p.a), y: -Math.cos(p.a) };
    const onTop = s < STR || s > P - 4;
    const side = onTop ? -1 : i % 4 === 1 ? -1 : 1;
    const d = side < 0 ? 30 + rnd() * 34 : 34 + rnd() * 52;
    let qx = p.x + n.x * side * d + (rnd() - 0.5) * 30, qy = p.y + n.y * side * d - 18 - rnd() * 22;
    qx = Math.min(qx, 1784);
    qy = Math.max(qy, 268);
    const sc = 0.3 + rnd() * 0.26;
    const g = S("g", {}, molG);
    const ring = S("circle", { r: 10, fill: "none", stroke: C.teal, "stroke-width": 2 }, molG);
    const inner = makeMolecule(g);
    // dissolve when the unwinding front passes s:  eraseA(t) = s
    const target = s / P;
    let lo = 0, hi = 1;
    for (let it = 0; it < 30; it++) { const m = (lo + hi) / 2; if (eraseE(m) < target) lo = m; else hi = m; }
    mols.push({
      s, p, qx, qy, sc, g, ring, inner,
      tSpawn: tLapA + s / vLap,
      tGone: tE0 + hi * (tE1 - tE0),
      rot0: -50 + rnd() * 100,
      spin: (rnd() < 0.5 ? -1 : 1) * (8 + rnd() * 10),
      ph: rnd() * TAU,
    });
  }
  const popE = ez("back.out(1.7)"), driftE = ez("power2.out"), goneE = ez("back.in(2.2)"), ringE = ez("power2.out");

  K.onFrame((t) => {
    const live = t >= T_IN && t <= 9.0;
    setVis(sky, live);
    if (!live) return;
    // track: visible portion [a, P]
    const a = eraseA(t);
    const L = Math.max(0, P - a);
    setAttr(loopMaskPath, "stroke-dasharray", `${f2(L)} ${f2(P + 40)}`);
    setAttr(loopMaskPath, "stroke-dashoffset", f2(-a));
    // glyph
    const sg = glyphS(t);
    const gp = rt(sg);
    const gA = 1 - c01((gp.x - 1680) / 140);
    setVis(glyphG, gA > 0.001 && t >= tLapA);
    setAttr(glyphG, "transform", `translate(${f2(gp.x)} ${f2(gp.y)}) rotate(${f2((gp.a * 180) / PI)}) scale(1.08)`);
    glyphG.setAttribute("opacity", f2(gA));
    // trail
    for (let k = 0; k < NTR; k++) {
      const s1 = sg - (TRAIL * k) / NTR - (k === 0 ? 16 : 0);
      const s0 = Math.max(0, sg - (TRAIL * (k + 1)) / NTR);
      const seg = trail[k];
      if (s1 <= s0 + 0.5 || gA <= 0.001 || t < tLapA) { setVis(seg, false); continue; }
      setVis(seg, true);
      seg.setAttribute("d", segD(s0, s1, 6));
      seg.setAttribute("opacity", f2(0.9 * Math.pow(1 - k / NTR, 1.4) * gA));
    }
    // molecules
    for (const m of mols) {
      const age = t - m.tSpawn;
      if (age < 0) { setVis(m.g, false); setVis(m.ring, false); continue; }
      let sc = m.sc * popE(c01(age / 0.5));
      const gone = t - m.tGone;
      if (gone > 0) sc *= 1 - goneE(c01(gone / 0.28));
      const dp = driftE(c01(age / 2.2));
      const x = lerp(m.p.x, m.qx, dp) + 2.5 * Math.sin(t * 1.3 + m.ph);
      const y = lerp(m.p.y, m.qy, dp) + 3 * Math.sin(t * 1.9 + m.ph * 1.7) - 4 * c01(age / 3);
      setVis(m.g, sc > 0.004);
      setAttr(m.g, "transform", `translate(${f2(x)} ${f2(y)}) rotate(${f2(m.rot0 + m.spin * age)}) scale(${sc.toFixed(4)})`);
      // dissolve ring
      const rp = c01((gone - 0.12) / 0.34);
      const ringOn = gone > 0.12 && rp < 1;
      setVis(m.ring, ringOn);
      if (ringOn) {
        m.ring.setAttribute("cx", f2(x));
        m.ring.setAttribute("cy", f2(y));
        m.ring.setAttribute("r", f2((7 + 18 * ringE(rp)) * (m.sc / 0.45)));
        m.ring.setAttribute("stroke-width", f2(2 * (1 - 0.6 * rp)));
        m.ring.setAttribute("opacity", f2(0.55 * (1 - rp)));
      }
    }
  });

  tl.fromTo(skyEnter, { y: -160 }, { y: 0, duration: 0.9, ease: "expo.out" }, 5.72);
  tl.fromTo(skyEnter, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: "power1.inOut" }, 5.86);
  tl.to(skyEnter, { autoAlpha: 0, duration: 0.2, ease: "power1.in", immediateRender: false }, 8.6);

  // =================================================================
  // BEAT A — hero plane (enters lower-left, drifts, takes off at 8.9)
  // =================================================================
  const PLS = 0.78;
  const PL = { x: 350, y: 574, w: 1183 * PLS, h: 316 * PLS };
  const planeExit = div(layer);
  const planeEnter = div(planeExit);
  const plane = K.img(planeEnter, "assets/plane_fly.png", { x: PL.x, y: PL.y, scale: PLS });
  const T_PLANE = 5.98;
  tl.fromTo(planeEnter, { x: -300, y: 160 }, { x: 0, y: 0, duration: 1.25, ease: "expo.out" }, T_PLANE);
  tl.fromTo(planeEnter, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power1.out" }, T_PLANE);
  K.onFrame((t) => {
    const p = K.prog(t, T_PLANE, 3.2, "sine.inOut");
    const b = Math.sin((TAU * t) / 4.6);
    plane.style.translate = `${f2(44 * p + 1.5 * Math.sin((TAU * t) / 6.1))}px ${f2(-20 * p + 3.5 * b)}px`;
    plane.style.rotate = `${(0.35 * Math.sin((TAU * t) / 5.3 + 0.8)).toFixed(3)}deg`;
  });
  tl.fromTo(planeExit, { x: 0, y: 0, rotation: 0 },
    { x: 1380, y: -300, rotation: -4, transformOrigin: `${PL.x + PL.w / 2}px ${PL.y + PL.h / 2}px`, duration: 0.95, ease: "power2.in", immediateRender: false }, 8.88);
  tl.to(planeExit, { autoAlpha: 0, duration: 0.32, ease: "power1.in", immediateRender: false }, 9.48);

  // =================================================================
  // BEAT A — KPI C 「減少 CO₂ / 57.9 噸」
  // =================================================================
  const KX = 96, KY = 232;
  const NUM_SIZE = 170, UNIT_SIZE = 52;
  const NUM_Y = KY + 34 * 1.2 + 18;
  const kpiEnter = div(layer);
  const kpiFloat = div(kpiEnter);
  const label = K.text(kpiFloat, "", { x: KX + 4, y: KY, size: 34, weight: 500, color: C.teal });
  label.innerHTML = '減少 <span class="s2-co2">CO<span class="s2-sub">2</span></span>';
  const co2 = label.querySelector(".s2-co2"), sub = label.querySelector(".s2-sub");
  Object.assign(co2.style, { display: "inline-block", transformOrigin: "20% 75%" });
  Object.assign(sub.style, { display: "inline-block", fontSize: "0.6em", position: "relative", top: "0.32em", marginLeft: "0.05em" });

  const numLift = div(kpiFloat);
  const numExit = div(numLift);
  const numWrap = div(numExit, { left: KX, top: NUM_Y, transformOrigin: "0px 0px" });
  const PADM = 14;
  const numMask = div(numWrap, { overflow: "hidden" });
  const numInner = K.text(numMask, "57.9", { x: PADM, y: PADM, size: NUM_SIZE, weight: 700, color: C.teal, ls: -0.01, lh: 1.0, cls: "num" });
  const numW = numInner.offsetWidth;
  numInner.textContent = "0.0";
  Object.assign(numMask.style, { left: -PADM + "px", top: -PADM + "px", width: numW + PADM * 2 + "px", height: NUM_SIZE + PADM * 2 + "px" });
  const NUM_BASE = baseOff(NUM_SIZE, 1.0);
  const unitLeft = numW + 20;
  const unitTop = NUM_BASE - 0.075 * UNIT_SIZE - baseOff(UNIT_SIZE, 1.0);
  const unitMask = div(numWrap, { overflow: "hidden" });
  const unitInner = K.text(unitMask, "噸", { x: PADM, y: PADM, size: UNIT_SIZE, weight: 700, color: C.teal, lh: 1.0 });
  const unitW = unitInner.offsetWidth;
  Object.assign(unitMask.style, { left: unitLeft - PADM + "px", top: unitTop - PADM + "px", width: unitW + PADM * 2 + "px", height: UNIT_SIZE + PADM * 2 + "px" });
  const bar = K.accentBar(kpiFloat, KX + 4, NUM_Y + NUM_BASE + 22);

  // entrance (camera tilt continuation)
  tl.fromTo(kpiEnter, { y: -160 }, { y: 0, duration: 0.85, ease: "expo.out" }, 5.68);
  tl.fromTo(kpiEnter, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: "power1.out" }, 5.68);
  floatEnv(kpiFloat, { ay: 3, ax: 1.5, period: 5.6, phase: 0.6 }, (t) => 1 - K.prog(t, 8.85, 0.45, "sine.inOut"));

  // 57.9 counter, landing at the end of the spoken phrase
  const T_NUM = W.t579 - 0.18, T_LAND = W.t579 + 0.85;
  tl.fromTo(numInner, { yPercent: 104, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: "expo.out" }, T_NUM);
  K.counter(numInner, { from: 0, to: 57.9, decimals: 1, at: T_NUM + 0.06, dur: T_LAND - T_NUM - 0.06, ease: "power4.out" });
  tl.fromTo(unitInner, { yPercent: 135, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: "expo.out" }, W.t579 + 0.52);
  K.barIn(tl, bar, T_LAND, 0.7);

  // 「CO2」 emphasis: thin terracotta underline draws, tiny pulse, subscript hops
  const co2Mark = K.el("div", { cls: "abs", style: {
    left: co2.offsetLeft + 1, top: 47, width: co2.offsetWidth - 2, height: 3,
    background: C.terra, borderRadius: "1.5px", transformOrigin: "0% 50%" } }, label);
  tl.fromTo(co2Mark, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "expo.out" }, W.co2);
  tl.fromTo(co2, { scale: 1 }, { scale: 1.12, duration: 0.22, ease: "power2.out" }, W.co2 - 0.02);
  tl.to(co2, { scale: 1, duration: 0.55, ease: "sine.inOut", immediateRender: false }, W.co2 + 0.2);
  tl.fromTo(sub, { y: 0 }, { y: -7, duration: 0.2, ease: "power2.out" }, W.co2 + 0.04);
  tl.to(sub, { y: 0, duration: 0.5, ease: "sine.inOut", immediateRender: false }, W.co2 + 0.24);

  // =================================================================
  // BEAT B — columns
  // =================================================================
  const COLX = [356, 960, 1564];
  const ICON_Y = 402, DISC_R = 96, BOX = 330;
  const BASE = 604; // ink bottom line of the column headline
  const MAIN = 64, CAP = 30;
  const CAP_Y = BASE + 30;
  const T_MORPH = 8.84;

  const cols = COLX.map((cx, i) => {
    const lift = div(layer);
    const exit = div(lift);
    const pop = div(exit, { left: cx - BOX / 2, top: ICON_Y - BOX / 2, width: BOX, height: BOX });
    const pulse = div(pop, { left: 0, top: 0, width: BOX, height: BOX });
    const svg = S("svg", { width: BOX, height: BOX, viewBox: `${-BOX / 2} ${-BOX / 2} ${BOX} ${BOX}`, style: "position:absolute;left:0;top:0;overflow:visible" }, pulse);
    const ring = S("circle", { r: DISC_R, fill: "none", stroke: C.teal, "stroke-width": 2.5, opacity: 0 }, svg);
    const disc = S("circle", { r: DISC_R, fill: C.tealSoft }, svg);
    const art = S("g", {}, svg);
    const badge = makeBadge(svg, 68, 68);
    floatEnv(pulse, { ay: 4, ax: 1.2, period: 5.2 + i * 0.45, phase: i * 1.9 });
    return { cx, lift, exit, pop, pulse, svg, ring, disc, art, badge };
  });

  // ---- column 1: CO₂ (KPI morphs in) ---------------------------------
  const c1 = cols[0];
  const molArt = S("g", {}, c1.art);
  const molLive = S("g", {}, molArt);
  makeMolecule(S("g", { transform: "rotate(28) scale(0.98)" }, molLive));
  K.onFrame((t) => setAttr(molLive, "transform", `rotate(${f2(4 * Math.sin((TAU * t) / 6.3))})`));
  const cap1 = textC(c1.lift, "CO₂ 減排", c1.cx, CAP_Y, { size: CAP, weight: 400, color: C.gray, ls: 0.02,
    html: 'CO<span style="display:inline-block;font-size:0.6em;position:relative;top:0.3em;margin-left:0.04em">2</span> 減排' });

  // morph KPI number → column-1 headline (centred, 96 px)
  const MS = 96 / NUM_SIZE, US = 1.3; // unit ends ≈ 38 px next to the 96 px number
  const totalW = unitLeft + unitW * US;
  const morphX = c1.cx - (totalW * MS) / 2 - KX;
  const morphY = BASE - NUM_BASE * MS - NUM_Y;
  const MDUR = 0.72;
  tl.to(label, { y: -16, autoAlpha: 0, duration: 0.4, ease: "power2.in", immediateRender: false }, T_MORPH);
  tl.to(bar, { scaleX: 0, transformOrigin: "100% 50%", duration: 0.35, ease: "power2.in", immediateRender: false }, T_MORPH);
  tl.fromTo(numWrap, { x: 0, y: 0, scale: 1 }, { x: morphX, y: morphY, scale: MS, duration: MDUR, ease: "power3.inOut", immediateRender: false }, T_MORPH + 0.04);
  tl.fromTo(unitMask, { scale: 1 }, { scale: US, transformOrigin: `${PADM}px ${PADM + baseOff(UNIT_SIZE, 1.0)}px`, duration: MDUR, ease: "power3.inOut", immediateRender: false }, T_MORPH + 0.04);
  tl.fromTo(c1.pop, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.75, ease: "expo.out" }, 9.24);
  tl.fromTo(molArt, { scale: 0.35, rotation: -40, transformOrigin: "50% 50%" }, { scale: 1, rotation: 0, duration: 0.7, ease: "back.out(1.4)" }, 9.3);
  K.fadeIn(tl, cap1, 9.48, { y: 14, dur: 0.7 });

  // ---- column 2: 燃油成本 ---------------------------------------------
  const c2 = cols[1];
  // starts at the bottom centre (smooth point) so the tip is a real join
  const D_DROP = "M0 60 C-23 60 -42 42 -42 18 C-42 -12 -12 -42 0 -62 C12 -42 42 -12 42 18 C42 42 23 60 0 60 Z";
  c2.art.setAttribute("transform", "scale(1.1)");
  const c2defs = S("defs", {}, c2.svg);
  const fuelClip = S("clipPath", { id: "s2-fuel-clip" }, c2defs);
  const fuelWave = S("path", { d: "" }, fuelClip);
  S("path", { d: D_DROP }, S("clipPath", { id: "s2-drop-clip" }, c2defs));
  const dropEmpty = S("path", { d: D_DROP, fill: "#fdeee4" }, c2.art);
  const dropLiquid = S("g", { "clip-path": "url(#s2-fuel-clip)" }, c2.art);
  S("path", { d: D_DROP, fill: C.orange }, dropLiquid);
  S("path", { d: "M-26 14 C-28 29 -21 41 -10 47", fill: "none", stroke: "#fff", "stroke-opacity": 0.85, "stroke-width": 5.5, "stroke-linecap": "round" }, dropLiquid);
  const LV_FULL = -30, LV_LOW = 16;
  const prevLevel = S("path", { d: `M-40 ${LV_FULL} L40 ${LV_FULL}`, fill: "none", stroke: C.terra, "stroke-width": 2.4, "stroke-dasharray": "5 5", opacity: 0, "clip-path": "url(#s2-drop-clip)" }, c2.art);
  const dropLine = S("path", { d: D_DROP, fill: "none", stroke: C.orange, "stroke-width": 5, "stroke-linejoin": "round", "stroke-linecap": "round" }, c2.art);
  const fillE = ez("power2.out"), drainE = ez("power2.inOut");
  const T_FUEL = W.fuel;
  K.onFrame((t) => {
    if (t < 9.6 || t > T_END) return;
    let lv = lerp(66, LV_FULL, fillE(c01((t - (T_FUEL + 0.1)) / 0.5)));
    lv = lerp(lv, LV_LOW, drainE(c01((t - (T_FUEL + 0.62)) / 0.6)));
    const amp = 2.2 * c01((66 - lv) / 20);
    let d = "";
    for (let x = -50; x <= 50; x += 5) {
      const y = lv + amp * Math.sin(x * 0.12 + t * 4.2) + amp * 0.5 * Math.sin(x * 0.21 - t * 2.7);
      d += (x === -50 ? "M" : "L") + x + " " + f2(y);
    }
    fuelWave.setAttribute("d", d + " L50 70 L-50 70 Z");
  });
  tl.fromTo(c2.pop, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.75, ease: "expo.out" }, T_FUEL - 0.12);
  K.drawIn(tl, dropLine, T_FUEL - 0.08, 0.6, "power2.inOut");
  tl.fromTo(dropEmpty, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power1.out" }, T_FUEL + 0.14);
  tl.fromTo(prevLevel, { opacity: 0 }, { opacity: 0.9, duration: 0.3, ease: "power1.out" }, T_FUEL + 0.72);
  const main2 = textC(c2.lift, "燃油成本", c2.cx, BASE - 0.02 * MAIN - baseOff(MAIN, 1.2), { size: MAIN, weight: 700, color: C.teal, ls: 0.02 });
  const cap2 = textC(c2.lift, "地面等待，不在空中耗油", c2.cx, CAP_Y, { size: CAP, weight: 400, color: C.gray, ls: 0.02 });
  K.textIn(tl, main2, T_FUEL - 0.04, { dur: 0.85, stagger: 0.045 });
  K.fadeIn(tl, cap2, T_FUEL + 0.3, { y: 14, dur: 0.7 });

  // ---- column 3: 盤旋風險 ----------------------------------------------
  // A small plane circles, its trail forming a ⟳ loop (plane = arrow head).
  // On 「縮減」 the trail uncurls (curvature → 0) into a straight line and the
  // plane ends up heading right: holding → direct.
  const c3 = cols[2];
  const R3 = 50;
  const COV = 0.8, LEN_LOOP = COV * TAU * R3, LEN_STR = 136;
  const N3 = 90;
  const TH_MID = (0.5 * LEN_LOOP) / R3;
  /** trail, tail first, head last; centred.  m: curvature → 0 (loop →
   *  straight), r: rotation progress of the trail's mid-heading from TH_MID
   *  on to 2π, so the plane keeps turning clockwise while the loop opens */
  function curve3(m, r) {
    const len = lerp(LEN_LOOP, LEN_STR, m);
    const ds = len / N3;
    const phi = TH_MID + (TAU - TH_MID) * r;
    const head = (u) => (1 - m) * ((u * LEN_LOOP) / R3 - TH_MID) + phi;
    const pts = [{ x: 0, y: 0, a: head(0) }];
    let x = 0, y = 0;
    for (let k = 1; k <= N3; k++) {
      const a = head((k - 0.5) / N3);
      x += Math.cos(a) * ds; y += Math.sin(a) * ds;
      pts.push({ x, y, a: head(k / N3) });
    }
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    const ox = (x0 + x1) / 2 + 10 * m * m, oy = (y0 + y1) / 2; // straight: centre tail→nose
    for (const p of pts) { p.x -= ox; p.y -= oy; }
    return pts;
  }
  function at3(pts, u) {
    const f = c01(u) * N3, k = Math.min(N3 - 1, Math.floor(f)), r = f - k;
    const p = pts[k], q = pts[k + 1];
    return { x: lerp(p.x, q.x, r), y: lerp(p.y, q.y, r), a: lerp(p.a, q.a, r) };
  }
  const loopLine = S("path", { d: "", fill: "none", stroke: C.teal, "stroke-width": 5, "stroke-linecap": "round", "stroke-linejoin": "round" }, c3.art);
  const g3 = S("g", {}, c3.art);
  makeGlyph(g3, 4.0);
  const T_HOLD = W.holding, T_CUT = W.cut;
  const T_CIRC = T_HOLD - 0.02;
  const SWEEP = 1.8 * PI; // angle the plane travels before 「縮減」
  const circE = ez("sine.in"), morphE = ez("power2.inOut"), turnE = ez("power2.out"), popG = ez("back.out(1.7)");
  const MORPH3 = 0.7;
  K.onFrame((t) => {
    if (t < T_CIRC - 0.05 || t > T_END) return;
    const mp = c01((t - T_CUT) / MORPH3);
    const m = morphE(mp);
    const pts = curve3(m, turnE(mp));
    const trav = SWEEP * circE(c01((t - T_CIRC) / (T_CUT - T_CIRC)));
    const psi = trav - SWEEP;            // rotation of the loop (0 at 「縮減」)
    const lenFrac = m > 0 ? 1 : Math.min(1, (trav * R3) / LEN_LOOP);
    const cs = Math.cos(psi), sn = Math.sin(psi);
    const rot = (p) => ({ x: p.x * cs - p.y * sn, y: p.x * sn + p.y * cs });
    // trail
    const u0 = 1 - lenFrac;
    const k0 = Math.ceil(u0 * N3);
    let d = "";
    if (lenFrac > 0.004) {
      const q0 = rot(at3(pts, u0));
      d = "M" + f2(q0.x) + " " + f2(q0.y);
      for (let k = k0; k <= N3; k++) { const q = rot(pts[k]); d += "L" + f2(q.x) + " " + f2(q.y); }
    }
    loopLine.setAttribute("d", d);
    setVis(loopLine, lenFrac > 0.004);
    // plane at the head; gentle life once straight
    const h = at3(pts, 1);
    const hp = rot(h);
    const life = c01((t - T_CUT - MORPH3) / 0.8);
    const bob = life * 1.6 * Math.sin((TAU * t) / 2.9);
    const gs = popG(c01((t - T_CIRC) / 0.4));
    setVis(g3, gs > 0.002);
    g3.setAttribute("transform", `translate(${f2(hp.x)} ${f2(hp.y + bob)}) rotate(${f2(((h.a + psi) * 180) / PI)}) scale(${(0.6 * gs).toFixed(4)})`);
  });
  tl.fromTo(c3.pop, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.75, ease: "expo.out" }, T_HOLD - 0.07);
  const main3 = textC(c3.lift, "盤旋風險", c3.cx, BASE - 0.02 * MAIN - baseOff(MAIN, 1.2), { size: MAIN, weight: 700, color: C.teal, ls: 0.02 });
  const cap3 = textC(c3.lift, "減少空中等待與盤旋", c3.cx, CAP_Y, { size: CAP, weight: 400, color: C.gray, ls: 0.02 });
  K.textIn(tl, main3, T_HOLD, { dur: 0.85, stagger: 0.045 });
  K.fadeIn(tl, cap3, T_HOLD + 0.32, { y: 14, dur: 0.7 });

  // reduction badges
  [[c1, 9.7], [c2, T_FUEL + 0.68], [c3, T_CUT + 0.08]].forEach(([c, at]) => {
    tl.fromTo(c.badge, { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.55, ease: "back.out(1.6)" }, at);
  });

  // =================================================================
  // BEAT C — sum-line, ATFM pill, tree connectors, payoff
  // =================================================================
  const SUM_Y = 758, RISER_TOP = 708;
  const PILL_W = 232, PILL_H = 72, PILL_Y = 794;
  const sumLine = div(layer, { left: 96, top: SUM_Y - 1.5, width: 1728, height: 3, background: C.terra, borderRadius: "1.5px" });
  tl.fromTo(sumLine, { scaleX: 0, transformOrigin: "50% 50%" }, { scaleX: 1, duration: 0.85, ease: "expo.inOut" }, 12.58);

  const conWrap = div(layer);
  const con = K.svgCanvas(conWrap);
  const lineAttrs = { fill: "none", stroke: C.teal, "stroke-width": 3, "stroke-linecap": "round" };
  const stem = S("path", Object.assign({ d: `M960 ${PILL_Y} L960 ${SUM_Y}` }, lineAttrs), con);
  const risers = COLX.map((cx) => S("path", Object.assign({ d: `M${cx} ${SUM_Y} L${cx} ${RISER_TOP}` }, lineAttrs), con));
  const nodes = COLX.map((cx) => S("circle", { cx, cy: SUM_Y, r: 6, fill: C.teal, stroke: "#fff", "stroke-width": 2.5 }, con));
  const dots = [0, 1, 2].map(() => S("circle", { r: 4.5, fill: C.teal }, con));

  const pillWrap = div(layer);
  const pillBg = div(pillWrap, { left: 960 - PILL_W / 2, top: PILL_Y, width: PILL_W, height: PILL_H, background: C.teal, borderRadius: PILL_H / 2 + "px" });
  const PT = 44;
  const pillText = textC(pillWrap, "ATFM", 960, PILL_Y + PILL_H / 2 - (baseOff(PT, 1.2) - 0.37 * PT), { size: PT, weight: 700, color: "#fff", ls: 0.14 });
  tl.fromTo(pillBg, { autoAlpha: 0, scaleX: 0.25, scaleY: 0.7 }, { autoAlpha: 1, scaleX: 1, scaleY: 1, duration: 0.7, ease: "expo.out" }, W.atfm - 0.17);
  K.textIn(tl, pillText, W.atfm, { dur: 0.55, stagger: 0.2, ease: "expo.out" });

  // tree: stem up from the pill, signal splits along the sum-line, risers up
  const T_TREE = W.airline;
  K.drawIn(tl, stem, T_TREE, 0.22, "power2.out", "0% 0%");
  tl.fromTo(nodes[1], { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.45, ease: "back.out(1.8)" }, T_TREE + 0.18);
  K.drawIn(tl, risers[1], T_TREE + 0.22, 0.28, "power2.out", "0% 0%");
  [0, 2].forEach((i) => {
    tl.fromTo(nodes[i], { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.45, ease: "back.out(1.8)" }, T_TREE + 0.52);
    K.drawIn(tl, risers[i], T_TREE + 0.56, 0.28, "power2.out", "0% 0%");
  });
  const LIFT = 8;
  const liftAt = [T_TREE + 0.72, T_TREE + 0.38, T_TREE + 0.72];
  cols.forEach((c, i) => {
    tl.fromTo(c.lift, { y: 0 }, { y: -LIFT, duration: 0.7, ease: "expo.out" }, liftAt[i]);
  });
  tl.fromTo(numLift, { y: 0 }, { y: -LIFT, duration: 0.7, ease: "expo.out" }, liftAt[0]);

  // signal dots: (1) split along the sum-line with the tree, (2) the payoff
  // run pill → each column arriving on 「真實價值」
  const pathsTo = COLX.map((cx) => [[960, PILL_Y], [960, SUM_Y], [cx, SUM_Y], [cx, RISER_TOP]]);
  function along(pts, u) {
    let L = 0; const seg = [];
    for (let k = 1; k < pts.length; k++) { const l = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); seg.push(l); L += l; }
    let d = c01(u) * L;
    for (let k = 0; k < seg.length; k++) {
      if (d <= seg[k] || k === seg.length - 1) { const r = seg[k] ? Math.min(1, d / seg[k]) : 0; return [lerp(pts[k][0], pts[k + 1][0], r), lerp(pts[k][1], pts[k + 1][1], r)]; }
      d -= seg[k];
    }
  }
  const T_VAL = W.value;
  const runE = ez("power2.inOut");
  K.onFrame((t) => {
    for (let i = 0; i < 3; i++) {
      const dot = dots[i];
      let on = false, x = 0, y = 0, o = 0;
      // run 1: along the sum-line only (side columns)
      const u1 = (t - (T_TREE + 0.2)) / 0.34;
      if (i !== 1 && u1 >= 0 && u1 <= 1) {
        const e = runE(u1);
        x = lerp(960, COLX[i], e); y = SUM_Y; o = Math.min(1, u1 * 6, (1 - u1) * 6); on = true;
      }
      // run 2: pill → column, arriving at T_VAL
      const u2 = (t - (T_VAL - 0.5)) / 0.5;
      if (u2 >= 0 && u2 <= 1) {
        const p = along(pathsTo[i], runE(u2));
        x = p[0]; y = p[1]; o = Math.min(1, u2 * 6, (1 - u2) * 5); on = true;
      }
      setVis(dot, on && o > 0.01);
      if (on) { dot.setAttribute("cx", f2(x)); dot.setAttribute("cy", f2(y)); dot.setAttribute("opacity", f2(o)); }
    }
  });

  // payoff pulse on 「真實價值」
  const ringOut = ez("power2.out");
  cols.forEach((c) => {
    tl.fromTo(c.pulse, { scale: 1 }, { scale: 1.07, duration: 0.24, ease: "power2.out" }, T_VAL);
    tl.to(c.pulse, { scale: 1, duration: 0.6, ease: "sine.inOut", immediateRender: false }, T_VAL + 0.24);
    K.onFrame((t) => {
      const p = (t - T_VAL) / 1.0;
      const on = p >= 0 && p < 1;
      setVis(c.ring, on);
      if (!on) return;
      c.ring.setAttribute("r", f2(DISC_R + 34 * ringOut(p)));
      c.ring.setAttribute("opacity", f2(0.55 * (1 - p)));
    });
  });

  // =================================================================
  // EXIT 16.55 → 17.15 (stagger L→R)
  // =================================================================
  const T_X = 16.55;
  const mains = [null, main2, main3], caps = [cap1, cap2, cap3];
  cols.forEach((c, i) => {
    const t0 = T_X + i * 0.07;
    tl.to(c.exit, { y: -22, autoAlpha: 0, duration: 0.4, ease: "power2.in", immediateRender: false }, t0);
    if (mains[i]) K.textOut(tl, mains[i], t0 + 0.02, { dur: 0.36, stagger: 0.012 });
    K.fadeOut(tl, caps[i], t0 + 0.05, { y: -12, dur: 0.34 });
    tl.to([risers[i], nodes[i]], { opacity: 0, duration: 0.3, ease: "power1.in", immediateRender: false }, t0);
  });
  tl.to(numInner, { yPercent: -104, duration: 0.38, ease: "power2.in", immediateRender: false }, T_X + 0.02);
  tl.to(unitInner, { yPercent: -140, duration: 0.38, ease: "power2.in", immediateRender: false }, T_X + 0.06);
  tl.to(sumLine, { scaleX: 0, transformOrigin: "100% 50%", duration: 0.45, ease: "power2.in", immediateRender: false }, T_X + 0.08);
  tl.to(stem, { opacity: 0, duration: 0.3, ease: "power1.in", immediateRender: false }, T_X + 0.2);
  K.textOut(tl, pillText, T_X + 0.17, { dur: 0.32, stagger: 0.02 });
  tl.to(pillBg, { autoAlpha: 0, scaleX: 0.3, duration: 0.34, ease: "power2.in", immediateRender: false }, T_X + 0.21);
  // hard guarantee: nothing of S2 survives its window
  tl.set([kpiEnter, conWrap, pillWrap, ...cols.map((c) => c.lift)], { autoAlpha: 0 }, T_X + 0.62);
});
