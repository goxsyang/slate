/* s3_cost — S3 投入範圍 → 公共價值   (window 17.0 → 30.03 s)
 *
 * Beat A  (17.2 → 24.2)  terracotta frame draws with the chrome header; the
 *                        floor wipes in and the server rack assembles (empty
 *                        cabinet rises, units slide out from behind the right
 *                        post, patch cables grow from the switch down the
 *                        gutter and plug into the side switch, status LEDs
 *                        boot unit by unit); connector → 「硬體費用 645 萬元」
 *                        (lands ~0.5 s after 「645 萬」), secondary line,
 *                        「自主研發完成」 badge with check, LEDs turn mint
 *                        together and a light sweep crosses the metal.
 * Beat B  (24.2 → 25.12) everything but the number leaves to the left; the
 *                        digits of 645 slide together, shrink and warm to
 *                        terracotta and become the unit square, which is
 *                        tagged 「645 萬」 and glides to its slot by the grid.
 * Beat C  (25.12 → 30.03) 62 copies ripple out of the unit square (each born
 *                        terracotta, turning teal); 「節省 約 4 億元」 with a
 *                        rolling digit, 「公帑」 completes the label on the VO,
 *                        caption 「約為硬體投入的 62 倍」; composed hold with a
 *                        diagonal shimmer, one breath of the unit square and a
 *                        slow push-in anchored on the left margin.
 *
 * The rack is the reference raster (assets/rack.png).  To assemble it, the
 * scene builds canvases from it once at build time: an "empty cabinet" (unit
 * slots and patch cables painted over with clean interior / gutter texture),
 * one canvas per unit, the side table (with a cable-free clean plate), a
 * per-frame cable reveal, and a cleaned full copy that takes over once
 * assembled.  Canvas reads are never needed (file:// tainting is fine):
 * the clean-up data below was prepared offline from rack.png —
 *   clear  : runs [x, y, w] of opaque near-white pixels (mean ≥ 0.95, y ≥ 300:
 *            table interior + cabinet/table gap) that are cleared to the page;
 *   patch  : RGBA clean plate of the side switch / table top (PNG x 334–422,
 *            y 355–392) with the patch cables retouched out (ports copied from
 *            their empty neighbours, beam and post from clean sections).
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
  // one shared float for the rack and the KPI column, so the connector that
  // joins them never shears; it settles to rest before the 645 condenses
  const aFloat = div(A);
  const aEnvIn = ramp(18.9, 1.5);
  floatEnv(aFloat, { ay: 2.4, ax: 0.8, period: 6.2, phase: 0.4 }, (t) => aEnvIn(t) * (1 - K.prog(t, 23.8, 0.5, "sine.inOut")));
  const rackExit = div(aFloat);

  const frameSvg = K.svgCanvas(rackExit);
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

  // the frame starts with the chrome header (17.25), right after S2 has gone;
  // frameB turns the bottom-left corner at ~17.33, where the floor picks up
  const T_FRAME = 17.12;
  tl.fromTo(frameSvg, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05, ease: "none" }, T_FRAME);
  K.drawIn(tl, frameA, T_FRAME, 1.0, "power3.out");
  K.drawIn(tl, frameB, T_FRAME, 1.0, "power3.out");
  // floor wipes in (left → right) ahead of the cabinet, so the base never floats
  tl.fromTo(floorG, { opacity: 0, scaleX: 0.0, svgOrigin: `${FR.x0} ${FLOOR_Y}` }, { opacity: 1, scaleX: 1, duration: 0.6, ease: "power3.out" }, 17.32);
  tl.fromTo(shadowG, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.out" }, 17.95);

  // ---- rack canvases ------------------------------------------------
  const rackBox = div(rackExit, { left: RX, top: RY, width: RW, height: RH });
  const IMG = MG.images["assets/rack.png"];
  function mkCanvas(parent, x, y, w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.className = "abs";
    Object.assign(c.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
    parent.appendChild(c);
    return c;
  }
  const RETOUCH = { clear: [323,364,1,323,365,5,323,366,11,323,367,27,323,368,34,323,369,22,347,369,1,350,369,4,355,369,2,323,370,20,351,370,2,355,370,2,324,371,18,352,371,1,326,372,3,330,372,10,328,373,11,329,374,9,332,375,5,334,376,3,323,380,1,323,381,3,323,382,5,323,383,8,323,384,11,323,385,13,323,386,13,323,387,13,323,388,14,323,389,14,323,390,14,323,391,14,323,392,14,323,393,14,323,394,14,360,394,1,364,394,155,323,395,13,360,395,159,323,396,14,360,396,159,323,397,13,360,397,159,323,398,14,360,398,159,323,399,14,360,399,159,323,400,14,360,400,159,323,401,14,360,401,159,323,402,14,360,402,159,323,403,14,360,403,159,323,404,14,360,404,159,323,405,14,360,405,159,323,406,14,360,406,159,323,407,14,360,407,159,323,408,13,360,408,159,323,409,13,360,409,159,323,410,13,360,410,159,323,411,13,360,411,159,323,412,13,360,412,1,362,412,157,323,413,13,360,413,159,323,414,14,360,414,159,323,415,14,360,415,159,323,416,13,360,416,159,323,417,13,360,417,159,323,418,13,360,418,159,323,419,13,360,419,159,323,420,13,360,420,159,323,421,14,360,421,1,362,421,157,323,422,14,360,422,159,323,423,14,360,423,159,323,424,14,360,424,159,323,425,14,360,425,159,323,426,14,360,426,159,323,427,14,360,427,159,323,428,14,360,428,159,323,429,14,360,429,159,323,430,14,360,430,159,323,431,14,360,431,159,323,432,14,360,432,159,323,433,14,360,433,159,323,434,14,360,434,159,323,435,14,360,435,159,323,436,14,360,436,159,323,437,14,360,437,159,323,438,14,360,438,159,323,439,14,360,439,159,323,440,14,360,440,159,323,441,14,360,441,159,323,442,14,360,442,159,323,443,14,360,443,159,323,444,14,360,444,159,323,445,14,360,445,159,323,446,14,360,446,159,323,447,14,360,447,159,323,448,14,360,448,159,323,449,14,360,449,159,323,450,14,360,450,159,323,451,14,360,451,159,323,452,14,360,452,159,323,453,14,360,453,159,323,454,14,360,454,159,323,455,14,360,455,159,323,456,14,360,456,159,323,457,14,360,457,159,323,458,14,360,458,159,323,459,14,360,459,159,323,460,14,360,460,159,323,461,14,360,461,159,323,462,14,360,462,159,323,463,14,360,463,159,323,464,14,360,464,159,323,465,14,360,465,159,323,466,14,360,466,159,323,467,14,360,467,159,323,468,14,360,468,159,323,469,14,360,469,159,323,470,14,360,470,159,323,471,14,360,471,159,323,472,14,360,472,159,323,473,14,360,473,159,323,474,14,360,474,159,323,475,14,360,475,159,323,476,14,360,476,159,323,477,14,360,477,159,323,478,14,360,478,159,323,479,14,360,479,159,323,480,14,360,480,159,323,481,14,360,481,159,323,482,14,360,482,159,323,483,14,360,483,159,323,484,14,360,484,159,323,485,14,360,485,156,517,485,2,323,486,14,323,487,14,323,488,14,323,489,14,323,490,14,323,491,14,323,492,14,323,493,14,323,494,14,323,495,14,323,496,14,323,497,14,323,498,14,323,499,14,323,500,14,323,501,14,323,502,14,323,503,14,323,504,14,323,505,14,323,506,14,323,507,14,323,508,14,360,508,159,323,509,14,360,509,3,364,509,155,323,510,14,360,510,159,323,511,13,360,511,159,323,512,13,360,512,158,323,513,14,360,513,159,323,514,14,360,514,159,323,515,14,360,515,159,323,516,14,360,516,159,323,517,14,360,517,159,323,518,14,360,518,159,323,519,14,360,519,159,323,520,14,360,520,159,323,521,14,360,521,159,323,522,14,360,522,159,323,523,14,360,523,1,362,523,157,323,524,14,360,524,159,323,525,14,360,525,159,323,526,14,360,526,159,323,527,14,360,527,159,323,528,14,323,529,14,531,544,1,321,547,1,531,549,1],
    patch: { x: 334, y: 355, w: 88, h: 37, b64: "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Q3OV/0Nzlf9Dc5X/Q3OV/0Nzlf9Dc5X/Q3OV/0Nzlf9Dc5f/RXWZ/0Nzmf9Dc5n/RXWb/0V1m/9Dc5n/Q3OZ/0Nzl/9Ccpb/QXGT/0Fxk/9BcZP/QXGT/0Fxk/9BcZP/QXGT/0Fxk/9AcJT/QHCU/0Fxlf9Ccpb/QnKW/0Jylv9FdZn/RXWZ/0V1mf9FdZn/Q3OX/0Nzl/8AAAAAAAAAAAAAAACLjI//EixE/zVQZ/82a5X/LmON/zJkhv8wYoT/L2KM/y9ijP8xY4f/NWeL/yQ4T/8FGS//Ej9g/yxZe/8kXIn/IlqH/yFWhP8hVoT/M2WJ/z1yoP89cqD/PXKg/zxxn/87cJ7/PXCe/zxvnf87bpz/O26c/ztunP87bpz/O26c/ztunP88b6D/PG+g/z1wof89cKH/PXCh/z1wof89cKH/PXCh/zxvnf88b53/PG+d/zxvnf88b53/PG+d/zxvnf88b53/PG+d/zxvnf88b53/PG+d/zxvnf88b53/PG+d/zxvnf87bpr/O26a/ztumP85bJb/O26Y/ztumP87bpj/O26Y/zlsmP85bJj/OWyY/zlsmP85bJj/OWyY/zlsmP85bJj/OWyY/zlsmP85bJj/O26a/ztumv87bpr/PG+b/zxvm/86b53/O3Ce/zpvnf86b53/AAAAAAAAAAAAAAAAio6S/wwpSf8yUG//NWqY/y1ikP8yYoj/MGCG/y5iif8uYon/LmSF/y5khf8fOlH/ByE5/xhDZP8uWXv/KViF/ytah/8tXIf/LFuG/zJigv88cZ//PHGf/zxxn/87cJ7/O3Ce/zxvnf88b53/O26c/ztunP87bpz/O26c/ztunP88b53/PG+g/z1wof89cKH/PXCh/z1wof89cKH/PXCh/z1wof89cJ7/PXCe/z1wnv89cJ7/PXCe/z1wnv89cJ7/PXCe/z1wnv89cJ7/PXCe/z1wnv89cJ7/PXCe/z1wnv8+cZ//P3Ke/z9ynv8/cpz/PXCa/ztumP87bpj/O26Y/ztumP87bpr/O26a/ztumv87bpr/O26a/ztumv87bpr/O26a/ztumv87bpr/O26a/ztumv89cJz/PXCc/z1wnP89cJz/O3Ce/zxxn/87cJ7/O3Ce/wAAAAAAAAAAAAAAAImNkf8MKUn/MlBv/zVqmP8tYpD/MmKI/zJiiP8wZIv/L2OK/y9lhv8wZof/ITxT/wgiOv8ZRGX/L1p8/yxbiP8rWof/K1qF/zFgi/81ZYX/N3Ga/zdxmv84cpv/OHKb/zdxmv85cZr/OHCZ/zhwmf84cJn/OHCZ/zhwmf84cJn/OXGa/zlxnP86cp3/OXGc/zlxnP85cZz/OXGc/zlxnP85cZz/OHCZ/zhwmf84cJn/OHCZ/zhwmf84cJn/OHCZ/zlxmv85cZr/OnKb/zpym/86cpv/OnKb/zpym/88cZv/PHGb/z1wmv89cJr/PXCa/z1wmv88b5n/PG+Z/zxvm/88b5v/OW6a/zlumv85bpz/OW6c/zlunP85bpz/OW6c/zlunP85bpz/OW6c/zlunP85bpz/O3Ce/ztwnv87cJ7/O3Ce/zpyn/86cp//OnKd/zpynf8AAAAAAAAAAAAAAACLjJX/DChE/zFOaf86Z5D/NGGK/zBQb/8jRGL/KElj/zJSbf8xZYj/NGiL/yk+X/8OIkT/Fklz/ypdh/8mYYX/KGOH/ydhjv8mYI3/NGeR/zZwmf82cJn/N3Ga/zdxmv83cZr/OHCZ/zhwmf83b5j/N2+Y/zdvmP83b5j/N2+Y/zdvmP84cJv/OHCb/zhwm/84cJv/OHCb/zhwm/84cJv/OHCb/zdvmP84cJn/OHCZ/zhwmf84cJn/OHCZ/zhwmf84cJn/OXGa/zlxmv85cZr/OXGa/zlxmv85cZr/O3Ca/ztwmv89cJr/PXCa/z1wmv89cJr/PG+Z/zxvmf88b5v/PG+b/zlumv85bpr/OW6c/zlunP85bpz/OW6c/zlunP85bpz/OW6c/zlunP85bpz/OW6c/ztwnv87cJ7/O3Ce/zpvnf85cZ7/OnKf/zpynf86cp3/AAAAAAAAAAAAAAAAi4yV/w8rR/8vTGf/PmuU/ydUfv8MLEv/BSA//wUjPv8gQVv/MWWI/zJmif8nPF3/ECRG/xpNd/8tYIr/JF+D/x5Yff8gWof/LGaT/zVokv88b5v/PG+b/z1wnP89cJz/PXCc/z5vnP8+b5z/PW6b/z1um/89bpv/PW6b/z1um/89bpv/Pm+e/z5vnv8+b57/Pm+e/z1unf89bp3/PW6d/z1unf89bpv/PW6b/z1um/89bpv/PW6b/z1um/89bpv/PW6b/z1um/89bpv/PW6b/z1um/89bpv/PW6b/z1um/89bpv/O3Ca/ztwmv87cJr/O3Ca/zpvm/86b5v/Om+Z/zpvmf87bpr/O26a/ztumv87bpr/O26a/ztumv88b5v/PG+b/zxvmf89cJr/PG+Z/zxvmf89cJr/PXCa/ztumP88b5n/OXGa/zpym/89c5r/PXOa/wAAAAAAAAAAAAAAAIyNlP8UJ0D/OU1l/z5ih/8YPGH/Cx0w/yI0SP8RIjb/FCU5/yNXf/83a5L/I0Rg/wgoRf8WSGz/KFp//zdig/9CbY7/PWWL/zdfhf8wYoT/O26a/ztumv88b5v/PG+b/zxvm/89bpv/Pm+c/z1um/89bpv/PW6b/z1um/89bpv/PW6b/z5vnv89bp3/PW6d/z1unf89bp3/PW6d/zxtnP88bZz/PW6b/z1um/89bpv/PW6b/z1um/89bpv/PW6b/z1um/89bpv/PW6b/z1um/89bpv/PW6b/z1um/89bpv/PW6b/ztwmv87cJr/Om+Z/ztwmv86b5v/Om+b/zpvmf87cJr/PXCc/z1wnP89cJz/PG+b/zxvm/88b5v/PG+b/zxvm/89cJr/PXCa/z1wmv89cJr/PXCa/z5xm/88b5n/PXCa/zlxmv86cpv/PXOa/z1zmv8AAAAAAAAAAAAAAACOj5b/GCtE/z5Rav88YIX/DDBV/xUmOv9LXHD/L0FU/w0eMv8dUHj/OW2U/yNEYP8KKkf/Gkxw/yhaf/9bhqj/oczt/3aexP84YIb/NmiK/zlsmP85bJj/O26a/ztumv88b5v/Om+Z/zpvmf87cJr/O3Ca/ztwmv87cJr/O3Ca/zpvmf86b5v/Om+b/zpvm/85bpr/OW6a/zlumv85bpr/OW6a/zhwm/84cJv/OHCb/zhwm/84cJv/OHCb/zhwm/84cJv/OXGc/zlxnP85cZz/OXGc/zlxnP85cZz/OXGc/zlxnP86b5v/Om+b/zpvm/86b5v/Om+Z/zpvmf86b5v/Om+b/zhwm/84cJv/OHCb/zhwm/83b5r/OHCb/zhwm/84cJv/OHCb/zlxnP85cZz/OnKd/zlxnP85cZz/OXGc/zhwm/85cZz/OXGc/zpynf86cp3/AAAAAAAAAAAAAAAAjo+W/xQsQv84UGb/P2eN/xM7Yf8GIDb/ITxR/xgwSP8NJT3/H1SC/zZrmf8jQWD/CidH/x1Oa/8qW3n/b5e0/8jw//+Sutf/N198/zZkgv87bpr/O26a/ztumv87bpr/PG+b/zpvmf87cJr/O3Ca/ztwmv87cJr/O3Ca/ztwmv86b5n/Om+b/zlumv85bpr/OW6a/zlumv85bpr/OW6a/zlumv84cJv/OHCb/zhwm/84cJv/OHCb/zhwm/84cJv/OHCb/zlxnP85cZz/OXGc/zlxnP85cZz/OXGc/zlxnP85cZz/Om+b/zpvm/85bpr/Om+b/zpvmf86b5n/Om+b/zpvm/84cJv/OHCb/zhwm/84cJv/N2+a/zhwm/84cJv/OHCb/zdvmv84cJv/OHCb/zhwm/83b5r/OHCb/zhwm/84cJv/OXGc/zlxnP86cp3/OnKd/wAAAAAAAAAAAAAAAIyNlP8WLkT/N1Bl/0JqkP8sVHv/EixC/wUeM/8GHjb/HjdP/zNolv83bJr/JUNi/w8sTP8bTGn/Klt5/1B5lf9xmbX/W4Og/y9XdP80YoH/PHCX/zxwl/88cJf/O2+W/zxwl/86cJX/O3GW/ztxlv87cZb/O3GW/ztxlv87cZb/O3GW/zpwl/86cJf/OnCX/zpwl/86cJf/OnCX/zpwl/87cZj/O3GY/zxymf88cpn/PHKZ/zxymf88cpn/PHKZ/ztxmP87cZj/OnCX/zpwl/86cJf/OnCX/zpwl/86cJf/OnCX/zlumP85bpj/OW6Y/zdslv85bpj/OW6Y/zpwl/86cJf/Om+Z/zpvmf86cJf/OnCX/zlvlv86cJf/OnCX/ztxmP88b5n/PG+Z/z1wmv89cJr/Om+Z/ztwmv87cJr/O3Ca/zxymf89c5r/PXOa/z1zmv8AAAAAAAAAAAAAAACNjJH/ES5K/zNQbP8/cJ3/OGmW/yVZf/8YTHH/Hk96/y9gi/84cJ3/OnKf/ydEX/8NKUX/Gkxu/y9hg/8mYor/HViB/yFdh/8iXoj/M2WF/z1xmP89cZj/PXGY/z5ymf8+cpn/PHKX/zxyl/88cpf/PHKX/zxyl/88cpf/PHKX/zxyl/88cpn/PHKZ/zxymf88cpn/PHKZ/zxymf88cpn/PHKZ/ztxmP87cZj/O3GY/ztxmP87cZj/O3GY/ztxmP88cpn/PHKZ/z1zmv89c5r/PXOa/z1zmv89c5r/PXOa/zxymf88cZv/O3Ca/ztwmv87cJr/Om+Z/zpvmf86cJf/O3GY/zxxm/88cZv/PHKZ/zxymf87cZj/O3GY/ztxmP87cZj/PG+Z/z1wmv8+cZv/PnGb/ztwmv88cZv/PHGb/zxxm/89c5r/PnSb/z50m/8+dJv/AAAAAAAAAAAAAAAAjYyR/w4rR/8yUGv/OWqX/zZnlP83a5D/OW2S/zprlv88bZj/OHCd/zpyn/8nRF//CydD/xpMbv8vYYP/KGSM/y1pkf8oZI7/JWGL/zBigv9EYX//RGF//0Zjgf9GY4H/RmOB/0VlgP9FZYD/RWWA/0VlgP9FZYD/RWWA/0VlgP9EZH//RGSB/0Jif/9CYn//QmJ//0Jif/9CYn//QWF+/0Fhfv9EYX//RGF//0Ngfv9DYH7/Ql99/0Jfff9DYH7/Q2B+/0Ngfv9DYH7/Q2B+/0Rhf/9DYH7/Q2B+/0Ngfv9DYH7/RGF//0Rhf/9EYX//RGF//0Rhf/9EYX//Q2B+/0Ngfv9DYH7/Ql99/0Jfff9DYH7/Q2B+/0Ngfv9CX33/Ql99/0Jeev9DX3v/Q197/0Jeev9DYHz/Q2B8/0NgfP9DYHz/RGB8/0Nfe/9DX3v/Q197/w==" } };
  // cleaned full rack: ragged extracted floor removed (we draw our own) and
  // the off-white table interior / gap cleared to the page
  const fullCv = document.createElement("canvas");
  fullCv.width = RW; fullCv.height = RH;
  const fctx = fullCv.getContext("2d");
  fctx.drawImage(IMG, 0, 0);
  [[0, 528, 10, 33], [0, 548, 17, 13], [50, 548, 233, 13], [323, 530, 15, 18], [316, 548, 22, 13], [352, 541, 178, 20],
    [358, 528, 162, 14], [546, 528, 16, 33]].forEach((q) => fctx.clearRect(q[0], q[1], q[2], q[3]));
  for (let i = 0; i < RETOUCH.clear.length; i += 3) fctx.clearRect(RETOUCH.clear[i], RETOUCH.clear[i + 1], RETOUCH.clear[i + 2], 1);

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

  // units: clipped at the right rail where the mounting ears end, so each one
  // slides out from behind the post and never crosses the side panel
  const unitsClip = div(rackBox, { left: 0, top: 0, width: RW, height: RH });
  unitsClip.style.clipPath = `inset(0px ${RW - UX1}px 0px 0px)`;
  const unitCv = UNITS.map((u) => {
    const c = mkCanvas(unitsClip, UX0, u.y0, UX1 - UX0, u.y1 - u.y0);
    c.getContext("2d").drawImage(fullCv, UX0, u.y0, UX1 - UX0, u.y1 - u.y0, 0, 0, UX1 - UX0, u.y1 - u.y0);
    return c;
  });
  // side table + small switch, with the cable-free clean plate on top
  const TB = { x: 334, y: 330 };
  const tableCv = mkCanvas(rackBox, TB.x, TB.y, RW - TB.x, RH - TB.y);
  const tctx = tableCv.getContext("2d");
  tctx.drawImage(fullCv, TB.x, TB.y, RW - TB.x, RH - TB.y, 0, 0, RW - TB.x, RH - TB.y);
  (function () {
    const P = RETOUCH.patch, bin = atob(P.b64), px = new Uint8ClampedArray(bin.length);
    for (let i = 0; i < bin.length; i++) px[i] = bin.charCodeAt(i);
    tctx.putImageData(new ImageData(px, P.w, P.h), P.x - TB.x, P.y - TB.y);
  })();

  // patch cables: the cleaned raster revealed through stroked masks that grow
  // along each cable (pure function of t, redrawn per frame in the window)
  const cblCv = mkCanvas(rackBox, 0, 0, RW, RH);
  const bctx = cblCv.getContext("2d");
  const T_CBL = 18.6;
  const CABLES = [
    // four patch leads fan out of the rack switch into the gutter
    { d: "M229 86 L229 96 C230 116 248 129 292 138", w: 12, at: T_CBL, dur: 0.26, ease: "power2.in" },
    { d: "M240 86 L240 96 C241 112 256 125 293 136", w: 12, at: T_CBL + 0.035, dur: 0.26, ease: "power2.in" },
    { d: "M251 86 L251 96 C252 109 265 121 294 134", w: 12, at: T_CBL + 0.07, dur: 0.26, ease: "power2.in" },
    { d: "M265 86 L265 96 C266 106 277 118 295 132", w: 12, at: T_CBL + 0.105, dur: 0.26, ease: "power2.in" },
    // bundle down the gutter (constant speed, continuing into the strands)
    { d: "M296 126 L299 140 L300 322", w: 22, at: T_CBL + 0.2, dur: 0.28, ease: "none" },
    // right strand → plug on the side switch's flank
    { d: "M303.5 300 L303.5 326 C305 345 311 357 325 361.5 L357 361.5", w: 13, at: T_CBL + 0.44, dur: 0.18, ease: "sine.out" },
    // left strand → under the table top → up into ports 1 and 3
    { d: "M297.5 300 L297.5 326 C299 350 309 368 326 377 C338 382.5 350 383.5 362 384", w: 17, at: T_CBL + 0.42, dur: 0.18, ease: "none" },
    { d: "M356 383.5 C368 383 377 381 381.5 376.5 C384.5 373 385.5 370 385.5 365", w: 10, at: T_CBL + 0.59, dur: 0.16, ease: "sine.out" },
    { d: "M356 385 C372 387 389 386.5 398 383 C405 380 410 374 412.5 365", w: 12, at: T_CBL + 0.59, dur: 0.22, ease: "sine.out" },
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

  // assembled rack (takes over once everything is in place)
  const fullView = mkCanvas(rackBox, 0, 0, RW, RH);
  fullView.getContext("2d").drawImage(fullCv, 0, 0);

  const T_CAB = 17.46;
  tl.fromTo(cab, { clipPath: "inset(100% 0% 0% 0%)", y: 10 }, { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.7, ease: "power3.inOut" }, T_CAB);
  tl.fromTo(cab, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: "none" }, T_CAB);
  tl.fromTo(tableCv, { y: 26 }, { y: 0, duration: 0.7, ease: "expo.out" }, 17.98);
  tl.fromTo(tableCv, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power1.out" }, 17.98);
  // units slide out from behind the right post, bottom → top
  const UNIT_AT = [18.4, 18.3, 18.2, 18.11, 18.02];
  const UNIT_TRAVEL = 96;
  unitCv.forEach((c, i) => {
    tl.fromTo(c, { x: UNIT_TRAVEL }, { x: 0, duration: 0.6, ease: "expo.out" }, UNIT_AT[i]);
    tl.fromTo(c, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04, ease: "none" }, UNIT_AT[i]);
  });
  tl.fromTo(fullView, { autoAlpha: 0 }, { autoAlpha: 1, duration: SWAP_D, ease: "none" }, T_SWAP);
  tl.set([cab, tableCv, ...unitCv], { autoAlpha: 0, immediateRender: false }, T_SWAP + SWAP_D + 0.02);

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
  const BOOT_AT = [18.72, 18.84, 18.95, 19.06, 19.17, CBL_END + 0.02]; // side switch boots as its cables plug in
  const T_READY = 22.9;
  const AMBER = { core: "#ffd29c", halo: "#ee8b43" };
  const MINT = { core: "#a6f3dd", halo: "#2fb999" };
  const lrng = K.rng(3317);
  const leds = LED_SPEC.map((s) => {
    const g = S("g", { transform: `translate(${s.x} ${s.y})` }, ledSvg);
    // halos stay tight; on the light switch faceplate they are dialled down
    const halo = S("circle", { r: s.rad ? s.rad * 1.85 : Math.max(s.w, s.h) * (s.u === 0 ? 0.8 : 1.0), fill: AMBER.halo, opacity: 0 }, g);
    const core = s.rad
      ? S("circle", { r: s.rad, fill: AMBER.core, opacity: 0 }, g)
      : S("rect", { x: -s.w / 2, y: -s.h / 2, width: s.w, height: s.h, rx: 1.4, fill: AMBER.core, opacity: 0 }, g);
    return {
      s, g, halo, core,
      on: BOOT_AT[s.u] + s.k * 0.035,
      per: s.drive ? 0.55 + lrng() * 0.6 : 1.6 + lrng() * 1.6,
      ph: lrng() * TAU,
      haloK: s.u === 0 ? 0.22 : 0.4,
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
      L.core.setAttribute("opacity", f2(Math.min(1, b)));
      L.halo.setAttribute("opacity", f2(L.haloK * b));
      setAttr(L.core, "fill", coreC);
      setAttr(L.halo, "fill", haloC);
    }
  });

  // ---- light sweep: only the navy metal catches it --------------------
  // mask = rack.png at 1:1 (no aspect scaling) through a colour matrix that
  // keeps dark opaque pixels (navy metal) and drops light fills, the off-white
  // interior and the floor band: A' = 2.2·A − 0.8·(R+G+B)
  const sweepSvg = S("svg", { width: RW, height: RH, viewBox: `0 0 ${RW} ${RH}`, style: "position:absolute;left:0;top:0;overflow:visible" }, rackBox);
  const sdefs = S("defs", {}, sweepSvg);
  const sgrad = S("linearGradient", { id: "s3-sweep-g", x1: 0, y1: 0, x2: 1, y2: 0 }, sdefs);
  [[0, 0], [0.5, 0.42], [1, 0]].forEach(([o, a]) => S("stop", { offset: o, "stop-color": "#ffffff", "stop-opacity": a }, sgrad));
  const darkF = S("filter", { id: "s3-sweep-dark", filterUnits: "userSpaceOnUse", x: 0, y: 0, width: RW, height: RH, "color-interpolation-filters": "sRGB" }, sdefs);
  S("feColorMatrix", { type: "matrix", values: "0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -0.8 -0.8 -0.8 2.2 0" }, darkF);
  const smask = S("mask", { id: "s3-sweep-mask", maskUnits: "userSpaceOnUse", x: 0, y: 0, width: RW, height: RH, "mask-type": "alpha", style: "mask-type:alpha" }, sdefs);
  S("image", { href: "assets/rack.png", x: 0, y: 0, width: RW, height: RH, preserveAspectRatio: "none", filter: "url(#s3-sweep-dark)" }, smask);
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
  const conSvg = K.svgCanvas(rackExit); // hangs from the frame, floats with it
  const conn = S("path", { d: `M${FR.x1} ${CONN_Y} L905 ${CONN_Y}`, fill: "none", stroke: C.terra, "stroke-width": 4, "stroke-linecap": "round" }, conSvg);
  K.drawIn(tl, conn, 19.56, 0.4, "power3.out");

  const right = div(aFloat);

  const LBL = 40;
  const LBL_Y = Math.round(CONN_Y - LBL * 0.6 - 2); // ink centred on the connector
  const hwLabel = K.text(right, "硬體費用", { x: TX, y: LBL_Y, size: LBL, weight: 500, color: C.teal, ls: 0.04 });
  K.textIn(tl, hwLabel, 19.66, { dur: 0.85, stagger: 0.04 });

  const NUM = 220, UNIT = 64;
  const NUM_TOP = LBL_Y + LBL * 1.2 + 16;
  const NUM_BASE = baseOff(NUM, 1.0);
  const NUM_X = TX - 10;
  const numWrap = div(right, { left: NUM_X, top: NUM_TOP });
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
  const UNIT_MH = UNIT + PADM * 2;
  Object.assign(unitMask.style, { left: unitLeft - PADM + "px", top: unitTop - PADM + "px", width: unitW + PADM * 2 + "px", height: UNIT_MH + "px" });
  const BASE_Y = NUM_TOP + NUM_BASE;
  const bar645 = K.accentBar(right, TX + 2, Math.round(BASE_Y + 28));

  // 「645 萬」 is spoken at W.w645: the readout passes 600 by ~20.05 and lands
  // ~0.55 s after the cue; 萬元 and the accent bar follow straight away
  const T_645 = W.w645 - 0.14;
  const T_645_LAND = T_645 + 0.02 + 0.68;
  tl.fromTo(numInner, { yPercent: 104, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: "expo.out" }, T_645);
  K.counter(numInner, { from: 0, to: 645, at: T_645 + 0.02, dur: 0.68, ease: "expo.out" });
  tl.fromTo(unitInner, { yPercent: 104, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.65, ease: "expo.out" }, 20.25);
  K.barIn(tl, bar645, T_645_LAND - 0.02, 0.7);

  const SEC = 32;
  const SEC_Y = Math.round(BASE_Y + 62);
  const secText = K.text(right, "伺服器與網路設備", { x: TX + 1, y: SEC_Y, size: SEC, weight: 400, color: C.gray, ls: 0.04 });
  // 「硬體費用」 (20.85): the label answers with a soft pulse, the scope line follows
  const T_HW = W.hardware;
  tl.fromTo(hwLabel, { scale: 1 }, { scale: 1.04, transformOrigin: "0% 55%", duration: 0.24, ease: "sine.out" }, T_HW);
  tl.to(hwLabel, { scale: 1, duration: 0.5, ease: "sine.inOut", immediateRender: false }, T_HW + 0.24);
  K.fadeIn(tl, secText, T_HW + 0.07, { y: 14, dur: 0.75 });

  // 「自主研發完成」 badge: check disc pops, pill unrolls, text rises, check draws
  const BH = 66, BY = SEC_Y + SEC * 1.2 + 34, BX = TX;
  const badge = div(right, { left: BX, top: BY });
  const badgeBg = div(badge, { left: 0, top: 0, width: BH, height: BH, background: C.teal, borderRadius: BH / 2 + "px" });
  const BT = 34;
  const badgeTxt = K.text(badge, "自主研發完成", { x: BH + 6, y: BH / 2 - (baseOff(BT, 1.2) - 0.38 * BT), size: BT, weight: 700, color: "#ffffff", ls: 0.08 });
  const BW = BH + 6 + badgeTxt.offsetWidth - 0.08 * BT + 30;
  const discSvg = S("svg", { width: BH, height: BH, viewBox: `${-BH / 2} ${-BH / 2} ${BH} ${BH}`, style: "position:absolute;left:0;top:0;overflow:visible" }, badge);
  const disc = S("g", {}, discSvg);
  S("circle", { r: 21, fill: "#ffffff" }, disc);
  const check = S("path", { d: "M-9.5 0.5 L-3 7 L9.5 -6.5", fill: "none", stroke: C.teal, "stroke-width": 4.6, "stroke-linecap": "round", "stroke-linejoin": "round" }, disc);
  const T_DEV = W.selfDev; // 22.4
  tl.fromTo(badgeBg, { autoAlpha: 0, scale: 0.6, transformOrigin: `${BH / 2}px ${BH / 2}px` }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.4)" }, T_DEV - 0.04);
  tl.fromTo(badgeBg, { width: BH }, { width: BW, duration: 0.8, ease: "expo.out", immediateRender: false }, T_DEV + 0.1);
  tl.fromTo(disc, { scale: 0, svgOrigin: "0 0" }, { scale: 1, duration: 0.5, ease: "back.out(1.6)" }, T_DEV + 0.02);
  K.textIn(tl, badgeTxt, T_DEV + 0.16, { dur: 0.75, stagger: 0.045 });
  K.drawIn(tl, check, T_READY - 0.06, 0.34, "power2.out");
  // one soft halo expands from the pill when the check lands
  const halo = div(badge, { left: 0, top: 0, width: BW, height: BH, border: "2px solid " + C.teal, borderRadius: BH / 2 + "px", boxSizing: "border-box" });
  K.onFrame((t) => {
    const p = (t - (T_READY + 0.2)) / 0.85;
    const on = p > 0 && p < 1;
    setVis(halo, on);
    if (!on) return;
    const g = 16 * (1 - Math.pow(1 - p, 2.2));
    Object.assign(halo.style, { left: f2(-g) + "px", top: f2(-g) + "px", width: f2(BW + 2 * g) + "px", height: f2(BH + 2 * g) + "px", borderRadius: f2(BH / 2 + g) + "px", opacity: f2(0.45 * (1 - p)) });
  });

  // =================================================================
  // BEAT B — everything but the number leaves left; 645 becomes the unit
  // =================================================================
  const T_X = 24.1;
  tl.to(conn, { drawSVG: "0% 0%", duration: 0.28, ease: "power2.in", immediateRender: false }, T_X);
  K.textOut(tl, hwLabel, T_X, { dur: 0.32, stagger: 0.015 });
  tl.to(hwLabel, { x: -20, duration: 0.36, ease: "power2.in", immediateRender: false }, T_X);
  tl.to(bar645, { scaleX: 0, transformOrigin: "0% 50%", duration: 0.26, ease: "power2.in", immediateRender: false }, T_X);
  tl.to(rackExit, { x: -40, autoAlpha: 0, duration: 0.36, ease: "power2.in", immediateRender: false }, T_X + 0.03);
  tl.to(unitInner, { y: -(UNIT_MH + 4), duration: 0.3, ease: "power2.in", immediateRender: false }, T_X + 0.03);
  tl.to(unitMask, { x: -20, duration: 0.32, ease: "power2.in", immediateRender: false }, T_X + 0.03);
  tl.to(secText, { x: -24, autoAlpha: 0, duration: 0.32, ease: "power2.in", immediateRender: false }, T_X + 0.05);
  tl.to(badge, { x: -28, autoAlpha: 0, duration: 0.32, ease: "power2.in", immediateRender: false }, T_X + 0.07);

  // Beat C layout (stage coords)
  const CELL = 50, GAP = 12, COLS = 10, NCELL = 62, PITCH = CELL + GAP;
  const GX = 1000, GY = 340;                       // grid top-left
  const GW = COLS * PITCH - GAP, GH = 7 * PITCH - GAP;
  // unit square: left of the grid, on its middle row
  const SQ_GAP = 72;
  const USQ = { x: GX - SQ_GAP - CELL, y: GY + 3 * PITCH };
  const usqCx = USQ.x + CELL / 2, usqCy = USQ.y + CELL / 2;
  const MIDY = GY + GH / 2;                        // vertical centre of the content

  // the landed number is pressed into a unit-sized block about its ink centre
  // (width collapses faster than height), then snaps to the terracotta square
  const inkCyL = NUM_BASE - NUM * 0.365;           // digit ink centre (local)
  const inkCx = NUM_X + numW / 2, inkCy = NUM_TOP + inkCyL; // (stage)
  const T_CV = 24.44, T_SQ = 24.66;
  tl.fromTo(numInner, { scaleX: 1, scaleY: 1 }, { scaleX: 0.15, scaleY: 0.36, transformOrigin: `${numW / 2}px ${inkCyL}px`, duration: T_SQ - T_CV, ease: "power2.in" }, T_CV);
  tl.fromTo(numInner, { color: C.teal }, { color: C.terra, duration: 0.11, ease: "power2.in" }, T_SQ - 0.11);
  tl.to(numInner, { autoAlpha: 0, duration: 0.01, ease: "none", immediateRender: false }, T_SQ);

  const push = div(layer);
  const usqFloat = div(push);
  const usqMove = div(usqFloat, { left: USQ.x, top: USQ.y, width: CELL, height: CELL });
  const usqPop = div(usqMove, { left: 0, top: 0, width: CELL, height: CELL });
  const usq = div(usqPop, { left: 0, top: 0, width: CELL, height: CELL, background: C.terra, borderRadius: "8px" });
  // its label travels with it and stays in the final composition
  const TAG = 26;
  const usqTag = K.text(usqMove, "645 萬", { x: 0, y: CELL + 12, size: TAG, weight: 500, color: C.terra, ls: 0.02 });
  usqTag.style.left = f2((CELL - (usqTag.offsetWidth - 0.02 * TAG)) / 2) + "px";

  tl.fromTo(usqPop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, ease: "none" }, T_SQ);
  tl.fromTo(usqPop, { scale: 1.2 }, { scale: 1, duration: 0.4, ease: "power3.out" }, T_SQ);
  K.textIn(tl, usqTag, T_SQ + 0.06, { dur: 0.6, stagger: 0.035 });
  // a beat in place, then one purposeful glide to its slot by the grid,
  // landing exactly as the copies start
  const T_SPAWN = 25.12, T_GLIDE = 24.85;
  tl.fromTo(usqMove, { x: inkCx - usqCx, y: inkCy - usqCy }, { x: 0, y: 0, duration: T_SPAWN - T_GLIDE, ease: "power3.inOut" }, T_GLIDE);
  // hard guarantee: Beat A gone
  tl.set(A, { autoAlpha: 0, immediateRender: false }, 24.9);

  // =================================================================
  // BEAT C — 62 squares, 「節省公帑 約 4 億元」, hold
  // =================================================================
  // push-in anchored on the left content margin, so the KPI column keeps its
  // x = 96 alignment with the chrome title and footnote
  push.style.transformOrigin = `${K.L.marginX}px ${MIDY}px`;
  const gridG = div(push);
  // grid and unit square share one drift so they never shear apart
  [gridG, usqFloat].forEach((n) => floatEnv(n, { ay: 2.5, ax: 1, period: 6.2, phase: 2.2 }, ramp(26.6, 1.4)));
  const TILE = "#2a7d73";
  const cells = [];
  for (let i = 0; i < NCELL; i++) {
    const col = i % COLS, row = Math.floor(i / COLS);
    const x = GX + col * PITCH, y = GY + row * PITCH;
    const n = div(gridG, { left: x, top: y, width: CELL, height: CELL, background: C.terra, borderRadius: "8px" });
    // teal fill that wipes across each terracotta copy, in the direction the
    // ripple travels (no muddy RGB blend between the two hues)
    const core = div(n, { left: 0, top: 0, width: CELL, height: CELL, background: TILE, borderRadius: "8px", visibility: "hidden" });
    cells.push({ n, core, x, y, cx: x + CELL / 2, cy: y + CELL / 2, col, row, bg: null, cs: null });
  }
  // radial ripple out of the unit square: delay ∝ distance.  The nearest
  // column is stamped straight out of the square; every other copy starts one
  // pitch back toward it (out of its neighbour), small, and settles in its slot
  const WAVE = 0.98, FLY = 0.62;
  const dist = (c) => Math.hypot(c.cx - usqCx, c.cy - usqCy);
  const dMin = Math.min(...cells.map(dist)), dMax = Math.max(...cells.map(dist));
  const waveE = ez("sine.in");
  cells.forEach((c) => {
    const d = dist(c), n = (d - dMin) / (dMax - dMin);
    c.at = T_SPAWN + WAVE * (0.6 * waveE(n) + 0.4 * n);
    const back = c.col === 0 ? d : PITCH;
    const ux = (usqCx - c.cx) / d, uy = (usqCy - c.cy) / d;
    tl.fromTo(c.n, { x: ux * back, y: uy * back, scale: c.col === 0 ? 0.5 : 0.3 },
      { x: 0, y: 0, scale: 1, duration: FLY, ease: "expo.out" }, c.at);
    tl.fromTo(c.n, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: "power1.out" }, c.at);
  });
  // a quiet chevron between the unit and its copies: 「645 萬 → ×62」 reads in place
  const chevSvg = K.svgCanvas(gridG);
  const chevX = GX - SQ_GAP / 2;
  const chev = S("path", { d: `M${chevX - 5} ${usqCy - 10} L${chevX + 5} ${usqCy} L${chevX - 5} ${usqCy + 10}`, fill: "none", stroke: C.tealDim, "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }, chevSvg);
  tl.fromTo(chevSvg, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, ease: "none" }, T_SPAWN + 0.05);
  K.drawIn(tl, chev, T_SPAWN + 0.05, 0.4, "power2.out");

  // the unit square recoils a little with each of the first emissions
  const EMIT = [...new Set(cells.filter((c) => c.col === 0).map((c) => c.at.toFixed(3)))].map(Number).sort((a, b) => a - b).slice(0, 4);
  K.onFrame((t) => {
    let k = 0;
    for (const e of EMIT) {
      const u = (t - e) / 0.2;
      if (u > 0 && u < 1) k = Math.max(k, Math.sin(Math.PI * u));
    }
    const s = k > 0.001 ? (1 + 0.06 * k).toFixed(4) : "";
    if (usq.style.scale !== s) usq.style.scale = s;
  });

  // left: KPI 「節省公帑 / 約 4 億元」, block centred on the grid
  const LX = K.L.marginX;
  const leftC = div(push);
  floatEnv(leftC, { ay: 3, ax: 1, period: 5.6, phase: 0.3 }, ramp(27.0, 1.2));
  const LBL2_Y = Math.round(MIDY - 196);
  const natLabel = K.text(leftC, "節省公帑", { x: LX + 4, y: LBL2_Y, size: 34, weight: 500, color: C.teal, ls: 0.04 });
  // 「節省」 on 「為國家節省了」, 「公帑」 completes the label on 「的公帑」
  const natChars = K.charsOf(natLabel);
  tl.fromTo(natChars.slice(0, 2), { yPercent: 108 }, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.045 }, W.nation + 0.06);
  tl.fromTo(natChars.slice(2), { yPercent: 108 }, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.045 }, W.publicFund - 0.04);

  const N4 = 270, YUE = 64, YI = 84;
  const N4_TOP = LBL2_Y + 30;
  const B4 = N4_TOP + baseOff(N4, 1.0); // baseline (stage y)
  const yue = K.text(leftC, "約", { x: LX + 2, y: B4 - CJK_LIFT * YUE - baseOff(YUE, 1.2), size: YUE, weight: 700, color: C.teal, lh: 1.2, ls: 0 });
  const yueW = yue.offsetWidth;
  // rolling digit: digit strip inside a soft-edged mask; pitch > mask so
  // neighbouring digits never peek in at rest
  const D_X = LX + 2 + yueW + 8;
  const probe = K.text(leftC, "4", { x: 0, y: 0, size: N4, weight: 700, lh: 1.0, ls: -0.01, cls: "num" });
  const dW = probe.offsetWidth;
  probe.remove();
  // mask spans the digit ink only (cap top ≈ 0.19em below the line top,
  // baseline at 0.936em); its top edge sits ~25 px under the label so passing
  // digits never touch it
  const INK_T = Math.round(0.19 * N4), INK_B = Math.round(baseOff(N4, 1.0));
  const M_T = INK_T - 20, M_H = INK_B + 30 - M_T, DP = N4 + 24;
  const rollMask = div(leftC, { left: D_X - 8, top: N4_TOP + M_T, width: dW + 16, height: M_H, overflow: "hidden" });
  const FADE = "linear-gradient(to bottom, transparent 0px, #000 18px, #000 " + (M_H - 27) + "px, transparent " + M_H + "px)";
  rollMask.style.webkitMaskImage = FADE;
  rollMask.style.maskImage = FADE;
  const stripIn = div(rollMask, { left: 8, top: -M_T });
  const strip = div(stripIn, { left: 0, top: 0 });
  ["0", "1", "2", "3", "4"].forEach((d, k) => {
    const n = K.text(strip, d, { x: 0, y: k * DP, size: N4, weight: 700, color: C.teal, lh: 1.0, ls: -0.01, cls: "num" });
    if (k < 4) n.style.opacity = 0.28;
  });
  const YI_X = D_X + dW + 16;
  const yi = K.text(leftC, "億元", { x: YI_X, y: B4 - CJK_LIFT * YI - baseOff(YI, 1.2), size: YI, weight: 700, color: C.teal, lh: 1.2, ls: 0.02 });
  const bar4 = K.accentBar(leftC, LX + 4, Math.round(B4 + 32));
  const capY = Math.round(B4 + 70);
  const cap4 = K.text(leftC, "約為硬體投入的 62 倍", { x: LX + 3, y: capY, size: 32, weight: 400, color: C.gray, ls: 0.03 });

  const T_YI = W.yi4; // 26.35
  K.textIn(tl, yue, T_YI - 0.08, { dur: 0.7 });
  // one fast upward roll 2 → 3 → 4: the passing digits are faint (28 %) and on
  // screen a frame or two each; only the 4 arrives at full strength
  const ROLL_AT = T_YI - 0.03, ROLL_D = 0.55;
  tl.fromTo(stripIn, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06, ease: "none" }, ROLL_AT);
  tl.fromTo(strip, { y: -1.1 * DP }, { y: -4 * DP, duration: ROLL_D, ease: "expo.out" }, ROLL_AT);
  K.textIn(tl, yi, T_YI + 0.38, { dur: 0.75, stagger: 0.06 });
  K.barIn(tl, bar4, 27.0, 0.7);
  K.fadeIn(tl, cap4, 27.25, { y: 14, dur: 0.75 });

  // ---- cell colour: born terracotta (a copy of the unit), then a teal fill
  //      wipes across it; one slow diagonal shimmer in the hold -------------
  const T_SHIM = 28.25, SHIM_D = 1.25;
  const shimE = ez("sine.inOut"), bornE = ez("power2.inOut");
  const sMin = Math.min(...cells.map((c) => c.cx + 0.7 * c.cy)), sMax = Math.max(...cells.map((c) => c.cx + 0.7 * c.cy));
  const TEAL_HI = "#4aa596";
  K.onFrame((t) => {
    const p = (t - T_SHIM) / SHIM_D;
    const live = p > -0.05 && p < 1.05;
    for (const c of cells) {
      const born = c01((t - c.at - 0.12) / 0.3);
      const cs = born <= 0 || born >= 1 ? "" : f2(100 * (1 - bornE(born)));
      if (c.cs !== cs) {
        c.cs = cs;
        c.core.style.clipPath = cs ? `inset(0px ${cs}% 0px 0px)` : "";
        c.core.style.visibility = cs ? "visible" : "hidden";
      }
      let bg = born >= 1 ? TILE : C.terra;
      let k = 0;
      if (live) {
        const s = (c.cx + 0.7 * c.cy - sMin) / (sMax - sMin);
        const f = lerp(-0.25, 1.25, shimE(c01(p)));
        k = Math.exp(-Math.pow((s - f) / 0.11, 2));
        if (k > 0.004) bg = mix(TILE, TEAL_HI, k);
      }
      if (c.bg !== bg) { c.bg = bg; c.n.style.background = bg; }
      const sc = k > 0.004 ? (1 + 0.05 * k).toFixed(4) : "";
      if (c.n.style.scale !== sc) c.n.style.scale = sc;
    }
  });
  // one breath of the unit square, finished well before the last frame
  tl.fromTo(usqPop, { scale: 1 }, { scale: 1.12, duration: 0.45, ease: "sine.inOut", immediateRender: false }, 28.8);
  tl.to(usqPop, { scale: 1, duration: 0.65, ease: "sine.inOut", immediateRender: false }, 29.25);
  tl.fromTo(push, { scale: 1 }, { scale: 1.015, duration: CUES.DURATION - 27.9, ease: "sine.inOut" }, 27.9);
});
