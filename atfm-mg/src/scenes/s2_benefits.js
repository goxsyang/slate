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
  // soft guard: scenes never draw into header (<200) or footnote band
  // (glyphs 912+; content ends by L.contentBottom = 885)
  const GUARD = "linear-gradient(to bottom, transparent 200px, #000 226px, #000 872px, transparent 885px)";
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
  // Racetrack (stadium), clockwise.  Path length s is measured from
  // S0 = (x1, top).  The glyph flies a slow partial lap and, on 「57.9」,
  // reaches the top-right corner (s = P + STR) where — instead of turning
  // down into the right arc — it eases into a −12° climb and leaves.
  const RT = { x1: 1220, x2: 1620, cy: 400, R: 120 };
  const STR = RT.x2 - RT.x1, ARC = PI * RT.R, P = 2 * STR + 2 * ARC;
  const TOPY = RT.cy - RT.R, BOTY = RT.cy + RT.R;
  const BRK_TH = (12 * PI) / 180, BRK_R = 150, BRK_ARC = BRK_TH * BRK_R;
  const SB = P + STR; // path length at the break point (top-right corner)
  const BX0 = RT.x2 + BRK_R * Math.sin(BRK_TH), BY0 = TOPY - BRK_R * (1 - Math.cos(BRK_TH));
  function loopAt(s) {
    s = ((s % P) + P) % P;
    if (s < STR) return { x: RT.x1 + s, y: TOPY, a: 0 };
    s -= STR;
    if (s < ARC) { const f = s / RT.R; return { x: RT.x2 + RT.R * Math.sin(f), y: RT.cy - RT.R * Math.cos(f), a: f }; }
    s -= ARC;
    if (s < STR) return { x: RT.x2 - s, y: BOTY, a: PI };
    s -= STR;
    const f = s / RT.R;
    return { x: RT.x1 - RT.R * Math.sin(f), y: RT.cy + RT.R * Math.cos(f), a: PI + f };
  }
  /** glyph path: the loop up to the break, then a short easing turn and a
   *  straight −12° departure ("direct") */
  function rt(s) {
    if (s < SB) return loopAt(s);
    let d = s - SB;
    if (d < BRK_ARC) { const f = d / BRK_R; return { x: RT.x2 + BRK_R * Math.sin(f), y: TOPY - BRK_R * (1 - Math.cos(f)), a: -f }; }
    d -= BRK_ARC;
    return { x: BX0 + d * Math.cos(BRK_TH), y: BY0 - d * Math.sin(BRK_TH), a: -BRK_TH };
  }
  const LOOP_D = `M${RT.x1} ${TOPY} L${RT.x2} ${TOPY} A${RT.R} ${RT.R} 0 0 1 ${RT.x2} ${BOTY} ` +
    `L${RT.x1} ${BOTY} A${RT.R} ${RT.R} 0 0 1 ${RT.x1} ${TOPY}`;
  // same loop, starting at the break corner (the erase runs from there)
  const LOOP_D2 = `M${RT.x2} ${TOPY} A${RT.R} ${RT.R} 0 0 1 ${RT.x2} ${BOTY} L${RT.x1} ${BOTY} ` +
    `A${RT.R} ${RT.R} 0 0 1 ${RT.x1} ${TOPY} L${RT.x2} ${TOPY}`;

  const skyEnter = div(layer);
  const sky = K.svgCanvas(skyEnter);
  const defs = S("defs", {}, sky);
  const loopMask = S("mask", { id: "s2-loop-mask", maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 1920, height: 1080 }, defs);
  const loopMaskPath = S("path", { d: LOOP_D2, fill: "none", stroke: "#fff", "stroke-width": 20 }, loopMask);
  // right-edge fade for the departing glyph + trail (opaque to x 1790)
  const edgeGrad = S("linearGradient", { id: "s2-edge-grad", gradientUnits: "userSpaceOnUse", x1: 1790, y1: 0, x2: 1826, y2: 0 }, defs);
  S("stop", { offset: 0, "stop-color": "#fff" }, edgeGrad);
  S("stop", { offset: 1, "stop-color": "#000" }, edgeGrad);
  const edgeMask = S("mask", { id: "s2-edge-mask", maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 1920, height: 1080 }, defs);
  S("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "url(#s2-edge-grad)" }, edgeMask);

  // ghost: the erased part of the loop stays as a faint solid track
  const ghost = S("path", { d: LOOP_D2, fill: "none", stroke: C.tealLine, "stroke-width": 3, "stroke-linecap": "butt" }, sky);
  const NDASH = 78;
  S("path", {
    d: LOOP_D, fill: "none", stroke: C.tealDim, "stroke-width": 4, "stroke-linecap": "round",
    "stroke-dasharray": `6 ${(P / NDASH - 6).toFixed(3)}`, mask: "url(#s2-loop-mask)",
  }, sky);
  // direct route left behind by the departure (dotted, arrow-headed)
  const ROUTE_X = 1800;
  const routeLen = BRK_ARC + (ROUTE_X - BX0) / Math.cos(BRK_TH);
  const routeG = S("g", { opacity: 0 }, sky);
  {
    let d = "";
    for (let j = 0; j <= 24; j++) { const p = rt(SB + (routeLen * j) / 24); d += (j ? "L" : "M") + f2(p.x) + " " + f2(p.y); }
    S("path", { d, fill: "none", stroke: C.tealDim, "stroke-width": 3, "stroke-linecap": "round", "stroke-dasharray": "5 8" }, routeG);
    const e = rt(SB + routeLen);
    S("path", { d: "M-11 -8 L0 0 L-11 8", fill: "none", stroke: C.tealDim, "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round",
      transform: `translate(${f2(e.x)} ${f2(e.y)}) rotate(${f2((e.a * 180) / PI)})` }, routeG);
  }
  const molG = S("g", {}, sky);
  const flyG = S("g", { mask: "url(#s2-edge-mask)" }, sky);
  const trailG = S("g", { fill: "none", stroke: C.teal, "stroke-width": 4, "stroke-linecap": "butt", "stroke-linejoin": "round" }, flyG);
  const glyphG = S("g", {}, flyG);
  makeGlyph(glyphG, 2.5);

  // glyph timing: a calm partial lap (≈0.65 P at 640 px/s) that reaches the
  // corner exactly on 「57.9」, then a gently accelerating departure
  const tBrk = W.t579, V = 640, ACC = 600;
  const S_START = SB - 0.65 * P;               // bottom straight
  const tLap0 = tBrk - (SB - S_START) / V;     // ≈ 5.37 (hidden until the sky fades in)
  function glyphS(t) {
    if (t <= tBrk) return S_START + (t - tLap0) * V;
    const d = t - tBrk;
    return SB + V * d + 0.5 * ACC * d * d;
  }
  // loop retracts from the break corner forward (the turn it no longer
  // flies), while the counter runs; the erased part remains as a ghost
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

  // CO₂ molecules: emitted on the track behind the glyph, they drift into
  // fixed rest positions inside the loop (or just below it), every atom
  // ≥ 48 px clear of the track centreline.  Four were shed on the earlier,
  // unseen part of the lap and simply fade in with the sky; three pop behind
  // the glyph.  [emission s (unwrapped), rest x, rest y, rotation]
  const MOL_SC = 0.46;
  const MOL_DEF = [
    [400 + ARC / 2, 1610, 420, 12],       // right arc  (pre)
    [777 + 50, 1572, 606, -16],           // bottom     (pre)
    [777 + 180, 1446, 612, 8],            // bottom     (pre)
    [777 + 210, 1410, 436, 16],           // bottom     (pre)
    [1177 + 2.36 * RT.R, 1204, 398, 10],  // left arc   (pops ≈ 6.18)
    [P + 95, 1316, 362, -14],             // top        (pops ≈ 6.47)
    [P + 285, 1506, 366, -8],             // top        (pops ≈ 6.77)
  ];
  const trackDist = (x, y) => {
    const cx = Math.max(RT.x1, Math.min(RT.x2, x));
    return Math.abs(Math.hypot(x - cx, y - RT.cy) - RT.R);
  };
  const rnd = K.rng(5051);
  const mols = MOL_DEF.map(([sE, qx, qy, rot0]) => {
    const p = rt(sE);
    const g = S("g", {}, molG);
    const ring = S("circle", { r: 10, fill: "none", stroke: C.teal, "stroke-width": 1.5 }, molG);
    makeMolecule(g);
    // clearance check (dev aid): nearest atom edge to the track centreline
    const cr = Math.cos((rot0 * PI) / 180), sr = Math.sin((rot0 * PI) / 180);
    let clr = Infinity;
    [[-58, 20.5], [0, 25], [58, 20.5]].forEach(([ax, ar]) => {
      clr = Math.min(clr, trackDist(qx + ax * MOL_SC * cr, qy + ax * MOL_SC * sr) - ar * MOL_SC);
    });
    if (clr < 48) console.warn("s2 molecule clearance", qx, qy, clr.toFixed(1));
    // dissolve when the retracting front (from the corner) passes it
    const target = ((((sE - STR) % P) + P) % P) / P;
    let lo = 0, hi = 1;
    for (let it = 0; it < 30; it++) { const m = (lo + hi) / 2; if (eraseE(m) < target) lo = m; else hi = m; }
    return {
      p, qx, qy, g, ring, rot0,
      tSpawn: tLap0 + (sE - S_START) / V,
      tGone: tE0 + hi * (tE1 - tE0) - 0.04,
      ph: rnd() * TAU, sw: 3 + rnd() * 3,
    };
  });
  const popE = ez("back.out(1.6)"), driftE = ez("power3.out"), goneE = ez("back.in(1.6)"), ringE = ez("power2.out");

  const T_SKY_IN = 6.0, T_SKY_OUT = 8.55;
  K.onFrame((t) => {
    const live = t >= T_IN && t <= T_SKY_OUT + 0.4;
    setVis(sky, live);
    if (!live) return;
    // active dashed track: visible [a, P] of LOOP_D2; ghost: [0, a]
    const a = eraseA(t);
    const L = Math.max(0, P - a);
    setAttr(loopMaskPath, "stroke-dasharray", `${f2(L)} ${f2(P + 40)}`);
    setAttr(loopMaskPath, "stroke-dashoffset", f2(-a));
    setVis(ghost, a > 0.5);
    setAttr(ghost, "stroke-dasharray", `${f2(a)} ${f2(P + 40)}`);
    // direct route fades in as the trail flows out
    routeG.setAttribute("opacity", f2(K.prog(t, 7.3, 0.5, "power1.inOut")));
    // glyph
    const sg = glyphS(t);
    const gp = rt(sg);
    setVis(glyphG, gp.x < 1840);
    setAttr(glyphG, "transform", `translate(${f2(gp.x)} ${f2(gp.y)}) rotate(${f2((gp.a * 180) / PI)}) scale(1.08)`);
    // trail
    for (let k = 0; k < NTR; k++) {
      const s1 = sg - (TRAIL * k) / NTR - (k === 0 ? 16 : 0);
      const s0 = sg - (TRAIL * (k + 1)) / NTR;
      const seg = trail[k];
      if (s1 <= s0 + 0.5 || rt(s0).x > 1840) { setVis(seg, false); continue; }
      setVis(seg, true);
      setAttr(seg, "d", segD(s0, s1, 6));
      setAttr(seg, "opacity", f2(0.9 * Math.pow(1 - k / NTR, 1.4)));
    }
    // molecules
    for (const m of mols) {
      const age = t - m.tSpawn;
      if (age < 0) { setVis(m.g, false); setVis(m.ring, false); continue; }
      let sc = MOL_SC * popE(c01(age / 0.45));
      const gone = t - m.tGone;
      if (gone > 0) sc *= 1 - goneE(c01(gone / 0.26));
      const dp = driftE(c01(age / 1.3));
      const x = lerp(m.p.x, m.qx, dp) + 2.5 * Math.sin(t * 1.3 + m.ph);
      const y = lerp(m.p.y, m.qy, dp) + 3 * Math.sin(t * 1.9 + m.ph * 1.7) - 4 * c01(age / 3);
      setVis(m.g, sc > 0.004);
      setAttr(m.g, "transform", `translate(${f2(x)} ${f2(y)}) rotate(${f2(m.rot0 + m.sw * Math.sin(t * 0.9 + m.ph))}) scale(${sc.toFixed(4)})`);
      // dissolve: a tiny, faint ring
      const rp = c01((gone - 0.12) / 0.32);
      const ringOn = gone > 0.12 && rp < 1;
      setVis(m.ring, ringOn);
      if (ringOn) {
        setAttr(m.ring, "cx", f2(x));
        setAttr(m.ring, "cy", f2(y));
        setAttr(m.ring, "r", f2(6 + 10 * ringE(rp)));
        setAttr(m.ring, "opacity", f2(0.35 * (1 - rp)));
      }
    }
  });

  tl.fromTo(skyEnter, { y: -160 }, { y: 0, duration: 0.9, ease: "expo.out" }, 5.72);
  tl.fromTo(skyEnter, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: "power1.inOut" }, T_SKY_IN);
  tl.to(skyEnter, { autoAlpha: 0, duration: 0.35, ease: "power1.inOut", immediateRender: false }, T_SKY_OUT);

  // =================================================================
  // BEAT A — hero plane (enters lower-left, drifts, takes off at 8.9)
  // =================================================================
  const PLS = 0.78;
  const PL = { x: 350, y: 574, w: 1183 * PLS, h: 316 * PLS };
  const planeExit = div(layer);
  const planeEnter = div(planeExit);
  const plane = K.img(planeEnter, "assets/plane_fly.png", { x: PL.x, y: PL.y, scale: PLS });
  const T_PLANE = 5.98;
  // enters along its own climb heading; the shallow rise keeps the belly
  // above the layer guard (872) from the first visible frame — no flat clip
  tl.fromTo(planeEnter, { x: -300, y: 50 }, { x: 0, y: 0, duration: 1.25, ease: "expo.out" }, T_PLANE);
  tl.fromTo(planeEnter, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power1.out" }, T_PLANE);
  K.onFrame((t) => {
    const p = K.prog(t, T_PLANE, 3.2, "sine.inOut");
    const b = Math.sin((TAU * t) / 4.6);
    plane.style.translate = `${f2(44 * p + 1.5 * Math.sin((TAU * t) / 6.1))}px ${f2(-20 * p + 3.5 * b)}px`;
    plane.style.rotate = `${(0.35 * Math.sin((TAU * t) / 5.3 + 0.8)).toFixed(3)}deg`;
  });
  // take-off: a soft, early climb (power1.in) so the plane moves into the
  // emptied right half before the KPI morph, and is clear of column 1
  tl.fromTo(planeExit, { x: 0, y: 0, rotation: 0 },
    { x: 1380, y: -300, rotation: -4, transformOrigin: `${PL.x + PL.w / 2}px ${PL.y + PL.h / 2}px`, duration: 1.4, ease: "power1.in", immediateRender: false }, 8.4);
  tl.to(planeExit, { autoAlpha: 0, duration: 0.35, ease: "power1.in", immediateRender: false }, 9.45);

  // =================================================================
  // BEAT A — KPI C 「減少 CO₂ / 57.9 噸」
  // =================================================================
  const KX = 96, KY = 232;
  const LBL = 46; // KPI label (34 × 1.35, broadcast legibility)
  const NUM_SIZE = 170, UNIT_SIZE = 52;
  const NUM_Y = KY + LBL * 1.2 + 18;
  const kpiEnter = div(layer);
  const kpiFloat = div(kpiEnter);
  const label = K.text(kpiFloat, "", { x: KX + 4, y: KY, size: LBL, weight: 500, color: C.teal });
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
  // accent bar rides inside numWrap (same resting spot: KX+4, NUM_Y+NUM_BASE+22)
  // so the descending KPI→column morph carries it along while it retracts,
  // instead of the number sliding over the stub left in place
  const bar = K.accentBar(numWrap, 4, NUM_BASE + 22);

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

  // 「CO2」 emphasis: thin terracotta underline draws, tiny pulse; the 「2」
  // swells from its bottom edge so it always reads as a subscript
  const co2Mark = K.el("div", { cls: "abs", style: {
    left: co2.offsetLeft + 1, top: Math.round(LBL * 1.385), width: co2.offsetWidth - 2, height: 4,
    background: C.terra, borderRadius: "2px", transformOrigin: "0% 50%" } }, label);
  tl.fromTo(co2Mark, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "expo.out" }, W.co2);
  tl.fromTo(co2, { scale: 1 }, { scale: 1.12, duration: 0.22, ease: "power2.out" }, W.co2 - 0.02);
  tl.to(co2, { scale: 1, duration: 0.55, ease: "sine.inOut", immediateRender: false }, W.co2 + 0.2);
  tl.fromTo(sub, { scale: 1 }, { scale: 1.22, transformOrigin: "50% 100%", duration: 0.2, ease: "power2.out" }, W.co2 + 0.04);
  tl.to(sub, { scale: 1, duration: 0.5, ease: "sine.inOut", immediateRender: false }, W.co2 + 0.24);

  // =================================================================
  // BEAT B — columns
  // =================================================================
  const COLX = [356, 960, 1564];
  const ICON_Y = 368, DISC_R = 96, BOX = 330;
  const BASE = ICON_Y + 212; // ink bottom line of the column headline (pulse ring clears 「57.9」 by ≥ 18 px)
  const MAIN = 70, CAP = 41;  // caption 30 × 1.35; heads nudged up to keep the hierarchy
  const CAP_Y = BASE + 27;
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

  // morph KPI number → column-1 headline (centred, 92 px number + 48 px
  // unit, optically matched to the 70 px words of columns 2/3)
  const MS = 92 / NUM_SIZE, US = 48 / (UNIT_SIZE * MS);
  const totalW = unitLeft + unitW * US;
  const morphX = c1.cx - (totalW * MS) / 2 - KX;
  const morphY = BASE - NUM_BASE * MS - NUM_Y;
  const MDUR = 0.64;
  tl.to(label, { y: -16, autoAlpha: 0, duration: 0.4, ease: "power2.in", immediateRender: false }, T_MORPH);
  tl.to(bar, { scaleX: 0, transformOrigin: "100% 50%", duration: 0.35, ease: "power2.in", immediateRender: false }, T_MORPH);
  tl.fromTo(numWrap, { x: 0, y: 0, scale: 1 }, { x: morphX, y: morphY, scale: MS, duration: MDUR, ease: "power3.inOut", immediateRender: false }, T_MORPH + 0.04);
  tl.fromTo(unitMask, { scale: 1 }, { scale: US, transformOrigin: `${PADM}px ${PADM + baseOff(UNIT_SIZE, 1.0) + 0.075 * UNIT_SIZE}px`, duration: MDUR, ease: "power3.inOut", immediateRender: false }, T_MORPH + 0.04);
  tl.fromTo(c1.pop, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.75, ease: "expo.out" }, 9.36);
  tl.fromTo(molArt, { scale: 0.35, rotation: -40, transformOrigin: "50% 50%" }, { scale: 1, rotation: 0, duration: 0.7, ease: "back.out(1.4)" }, 9.42);
  K.fadeIn(tl, cap1, 9.52, { y: 14, dur: 0.7 });

  // ---- column 2: 燃油成本 ---------------------------------------------
  const c2 = cols[1];
  // starts at the bottom centre (smooth point) so the tip is a real join
  const D_DROP = "M0 60 C-23 60 -42 42 -42 18 C-42 -12 -12 -42 0 -62 C12 -42 42 -12 42 18 C42 42 23 60 0 60 Z";
  c2.art.setAttribute("transform", "scale(1.1)");
  const c2defs = S("defs", {}, c2.svg);
  const fuelClip = S("clipPath", { id: "s2-fuel-clip" }, c2defs);
  const fuelWave = S("path", { d: "" }, fuelClip);
  S("path", { d: D_DROP }, S("clipPath", { id: "s2-drop-clip" }, c2defs));
  const dropEmpty = S("path", { d: D_DROP, fill: C.peach, "fill-opacity": 0.45 }, c2.art);
  const dropLiquid = S("g", { "clip-path": "url(#s2-fuel-clip)" }, c2.art);
  S("path", { d: D_DROP, fill: C.orange }, dropLiquid);
  S("path", { d: "M-27 26 C-27 36 -21 44 -10 48", fill: "none", stroke: "#fff", "stroke-opacity": 0.85, "stroke-width": 5.5, "stroke-linecap": "round" }, dropLiquid);
  const LV_FULL = -30, LV_LOW = 16;
  const prevLevel = S("path", { d: `M-40 ${LV_FULL} L40 ${LV_FULL}`, fill: "none", stroke: C.terra, "stroke-width": 2.4, "stroke-dasharray": "5 5", opacity: 0, "clip-path": "url(#s2-drop-clip)" }, c2.art);
  const dropLine = S("path", { d: D_DROP, fill: "none", stroke: C.orange, "stroke-width": 5, "stroke-linejoin": "round", "stroke-linecap": "round" }, c2.art);
  const fillE = ez("power2.out"), drainE = ez("power2.inOut");
  const T_FUEL = W.fuel;
  const T_FILL = T_FUEL + 0.33, T_DRAIN = T_FUEL + 0.8;
  K.onFrame((t) => {
    if (t < 9.6 || t > T_END) return;
    // fill once the outline is ~80 % drawn, then drain to show the saving
    let lv = lerp(66, LV_FULL, fillE(c01((t - T_FILL) / 0.45)));
    lv = lerp(lv, LV_LOW, drainE(c01((t - T_DRAIN) / 0.55)));
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
  tl.fromTo(dropEmpty, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power1.out" }, T_FILL);
  tl.fromTo(prevLevel, { opacity: 0 }, { opacity: 0.9, duration: 0.3, ease: "power1.out" }, T_DRAIN + 0.06);
  const main2 = textC(c2.lift, "燃油成本", c2.cx, BASE - 0.02 * MAIN - baseOff(MAIN, 1.2), { size: MAIN, weight: 700, color: C.teal, ls: 0.02 });
  const cap2 = textC(c2.lift, "地面等待，不在空中耗油", c2.cx, CAP_Y, { size: CAP, weight: 400, color: C.gray, ls: 0.02 });
  K.textIn(tl, main2, T_FUEL - 0.04, { dur: 0.85, stagger: 0.045 });
  K.fadeIn(tl, cap2, T_FUEL + 0.3, { y: 14, dur: 0.7 });

  // ---- column 3: 盤旋風險 ----------------------------------------------
  // A small plane circles, its trail forming a ⟳ loop (plane = arrow head).
  // On 「縮減」 the trail uncurls (curvature → 0) into a straight line and the
  // plane ends up heading right: holding → direct.
  const c3 = cols[2];
  const R3 = 50, GS3 = 0.95;  // glyph ≈ 65 px, stroke ≈ 3.5 px: same weight family as cols 1-2
  const NOSE3 = 34 * GS3;     // nose ahead of the head point
  const COV = 0.8, LEN_LOOP = COV * TAU * R3, LEN_STR = 104;
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
    const ox = (x0 + x1) / 2 + (NOSE3 / 2) * m * m, oy = (y0 + y1) / 2; // straight: centre tail→nose
    for (const p of pts) { p.x -= ox; p.y -= oy; }
    return pts;
  }
  function at3(pts, u) {
    const f = c01(u) * N3, k = Math.min(N3 - 1, Math.floor(f)), r = f - k;
    const p = pts[k], q = pts[k + 1];
    return { x: lerp(p.x, q.x, r), y: lerp(p.y, q.y, r), a: lerp(p.a, q.a, r) };
  }
  // ghost of the old holding loop, left behind (dotted) as it uncurls
  const ghost3 = S("path", { d: "", fill: "none", stroke: C.tealDim, "stroke-width": 3, "stroke-linecap": "round", "stroke-dasharray": "2 9", opacity: 0 }, c3.art);
  {
    const pts = curve3(0, 0);
    ghost3.setAttribute("d", pts.map((q, k) => (k ? "L" : "M") + f2(q.x) + " " + f2(q.y)).join(""));
  }
  const loopLine = S("path", { d: "", fill: "none", stroke: C.teal, "stroke-width": 4.5, "stroke-linecap": "round", "stroke-linejoin": "round" }, c3.art);
  const g3 = S("g", {}, c3.art);
  makeGlyph(g3, 3.7);
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
    g3.setAttribute("transform", `translate(${f2(hp.x)} ${f2(hp.y + bob)}) rotate(${f2(((h.a + psi) * 180) / PI)}) scale(${(GS3 * gs).toFixed(4)})`);
    setAttr(ghost3, "opacity", f2(0.9 * K.prog(t, T_CUT + 0.1, 0.6, "power1.out")));
  });
  tl.fromTo(c3.pop, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.75, ease: "expo.out" }, T_HOLD - 0.07);
  const main3 = textC(c3.lift, "盤旋風險", c3.cx, BASE - 0.02 * MAIN - baseOff(MAIN, 1.2), { size: MAIN, weight: 700, color: C.teal, ls: 0.02 });
  const cap3 = textC(c3.lift, "減少空中等待與盤旋", c3.cx, CAP_Y, { size: CAP, weight: 400, color: C.gray, ls: 0.02 });
  K.textIn(tl, main3, T_HOLD, { dur: 0.85, stagger: 0.045 });
  K.fadeIn(tl, cap3, T_HOLD + 0.32, { y: 14, dur: 0.7 });

  // reduction badges
  [[c1, 9.8], [c2, T_DRAIN + 0.1], [c3, T_CUT + 0.08]].forEach(([c, at]) => {
    tl.fromTo(c.badge, { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.55, ease: "back.out(1.6)" }, at);
  });

  // =================================================================
  // BEAT C — sum-line, ATFM pill, tree connectors, payoff
  // =================================================================
  const RISER_TOP = CAP_Y + 63, SUM_Y = RISER_TOP + 68;
  const PILL_W = 252, PILL_H = 76, PILL_Y = SUM_Y + 36;
  const conWrap = div(layer);
  const con = K.svgCanvas(conWrap);

  // sum-line: spans the column content (not the full margin), drawn from the
  // centre outwards and finished with small upturned end ticks — a bracket
  // that "sums" the three columns before the ATFM pill names the cause.
  const SUM_X0 = COLX[0] - 190, SUM_X1 = COLX[2] + 190, TICK = 14; // ticks frame the widest caption
  const T_SUM = 12.45;
  const sumAttrs = { fill: "none", stroke: C.terra, "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" };
  const sumG = S("g", {}, con);
  const sumL = S("path", Object.assign({ d: `M960 ${SUM_Y} L${SUM_X0} ${SUM_Y} L${SUM_X0} ${SUM_Y - TICK}` }, sumAttrs), sumG);
  const sumR = S("path", Object.assign({ d: `M960 ${SUM_Y} L${SUM_X1} ${SUM_Y} L${SUM_X1} ${SUM_Y - TICK}` }, sumAttrs), sumG);
  K.onFrame((t) => setVis(sumG, t >= T_SUM + 0.01 && t <= 16.55 + 0.62));
  K.drawIn(tl, sumL, T_SUM, 0.8, "power3.out");
  K.drawIn(tl, sumR, T_SUM, 0.8, "power3.out");
  const lineAttrs = { fill: "none", stroke: C.teal, "stroke-width": 3, "stroke-linecap": "round" };
  const stem = S("path", Object.assign({ d: `M960 ${PILL_Y} L960 ${SUM_Y}` }, lineAttrs), con);
  const risers = COLX.map((cx) => S("path", Object.assign({ d: `M${cx} ${SUM_Y} L${cx} ${RISER_TOP}` }, lineAttrs), con));
  const nodes = COLX.map((cx) => S("circle", { cx, cy: SUM_Y, r: 6, fill: C.teal, stroke: "#fff", "stroke-width": 2.5 }, con));
  const dots = [0, 1, 2].map(() => S("circle", { r: 6, fill: C.teal, stroke: "#fff", "stroke-width": 2 }, con));

  const pillWrap = div(layer);
  const pillBg = div(pillWrap, { left: 960 - PILL_W / 2, top: PILL_Y, width: PILL_W, height: PILL_H, background: C.teal, borderRadius: PILL_H / 2 + "px" });
  const PT = 48;
  const pillText = textC(pillWrap, "ATFM", 960, PILL_Y + PILL_H / 2 - (baseOff(PT, 1.2) - 0.37 * PT), { size: PT, weight: 700, color: "#fff", ls: 0.14 });
  tl.fromTo(pillBg, { autoAlpha: 0, scaleX: 0.25, scaleY: 0.7 }, { autoAlpha: 1, scaleX: 1, scaleY: 1, duration: 0.7, ease: "expo.out" }, W.atfm - 0.17);
  K.textIn(tl, pillText, W.atfm, { dur: 0.5, stagger: 0.12, ease: "expo.out" });

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
      c.ring.setAttribute("r", f2(DISC_R + 28 * ringOut(p))); // stays ≥ 18 px clear of the heads
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
  tl.to(numInner, { yPercent: -116, duration: 0.38, ease: "power2.in", immediateRender: false }, T_X + 0.02);
  tl.to(unitInner, { yPercent: -140, duration: 0.38, ease: "power2.in", immediateRender: false }, T_X + 0.06);
  // sum-line wipes out L→R: left half collapses into the centre, then the
  // right half runs out to its end tick
  tl.to(sumL, { drawSVG: "0% 0%", duration: 0.24, ease: "power2.in", immediateRender: false }, T_X + 0.06);
  tl.to(sumR, { drawSVG: "100% 100%", duration: 0.26, ease: "power2.out", immediateRender: false }, T_X + 0.3);
  tl.to(sumG, { opacity: 0, duration: 0.1, ease: "power1.in", immediateRender: false }, T_X + 0.44); // no round-cap dot left on the tick
  tl.to(stem, { opacity: 0, duration: 0.3, ease: "power1.in", immediateRender: false }, T_X + 0.2);
  K.textOut(tl, pillText, T_X + 0.17, { dur: 0.32, stagger: 0.02 });
  tl.to(pillBg, { autoAlpha: 0, scaleX: 0.3, duration: 0.34, ease: "power2.in", immediateRender: false }, T_X + 0.21);
  // hard guarantee: nothing of S2 survives its window
  tl.set([kpiEnter, conWrap, pillWrap, ...cols.map((c) => c.lift)], { autoAlpha: 0 }, T_X + 0.62);
});
