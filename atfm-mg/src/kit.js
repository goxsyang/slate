/* Shared MG kit: design tokens, DOM/SVG builders, and time-pure animation
 * helpers.  Everything must be deterministic under timeline.seek(t): no
 * CSS transitions/animations, no Date/Math.random, no rAF-driven state.
 */
(function () {
  const SVGNS = "http://www.w3.org/2000/svg";

  // Palette sampled from the v4 reference frames.
  const C = {
    white: "#ffffff",
    teal: "#1e6e65",        // titles, KPI numbers
    tealDim: "#b4cfca",     // de-emphasised KPI (reference dims to ~30%)
    tealSoft: "#e1eeec",    // stopwatch face, soft fills
    tealLine: "#cfe3df",    // faint guide lines / holding loop
    gray: "#565e5d",        // eyebrow, footnote
    grayLight: "#a3abaa",
    hair: "#e4e9e8",
    terra: "#c47259",       // accent underline, frames, connectors
    terraSoft: "#ecd1ca",
    peach: "#fcd4c0",       // ticket square
    orange: "#ee8b43",      // fuel drop, tail stripe
    blue: "#3280c1",        // tail blue
    navy: "#1f3f6e",        // outlines
    navyMid: "#275787",     // molecule core
    sky: "#bed9f1",         // molecule atoms, light fills
    skyPale: "#e6eff8",
    ticketLine: "#aebcc9",
  };

  const FONT = '"Noto Sans TC", sans-serif';

  // Layout grid (1920x1080), matches the reference slides.
  const L = {
    marginX: 96,
    eyebrowY: 50,
    titleY: 99,
    contentTop: 215,
    contentBottom: 930,
    footY: 963,
  };

  const stage = () => document.getElementById("stage");
  const scenesRoot = () => document.getElementById("scenes");

  function applyStyle(node, style) {
    if (!style) return node;
    for (const k in style) {
      const v = style[k];
      node.style[k] = typeof v === "number" && !/opacity|zIndex|fontWeight|lineHeight|flex/.test(k) ? v + "px" : v;
    }
    return node;
  }

  function el(tag, opts = {}, parent) {
    const n = document.createElement(tag);
    if (opts.cls) n.className = opts.cls;
    if (opts.id) n.id = opts.id;
    if (opts.text != null) n.textContent = opts.text;
    if (opts.html != null) n.innerHTML = opts.html;
    if (opts.attrs) for (const k in opts.attrs) n.setAttribute(k, opts.attrs[k]);
    applyStyle(n, opts.style);
    (parent || stage()).appendChild(n);
    return n;
  }

  function svg(tag, attrs = {}, parent) {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) {
      if (k === "text") n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(n);
    return n;
  }

  /** Full-stage SVG canvas (viewBox 0 0 1920 1080). */
  function svgCanvas(parent, cls = "") {
    return svg("svg", { class: "svg-full " + cls, viewBox: "0 0 1920 1080", width: 1920, height: 1080 }, parent);
  }

  /** A scene layer under #scenes. */
  function layer(name, z = 1) {
    return el("div", { cls: "layer layer-" + name, style: { zIndex: z } }, scenesRoot());
  }

  /** Absolutely-positioned single-line text. x/y = top-left of the line box. */
  function text(parent, str, o = {}) {
    const n = el("div", {
      cls: "txt " + (o.cls || ""),
      text: str,
      style: {
        left: o.x || 0,
        top: o.y || 0,
        fontSize: (o.size || 40) + "px",
        fontWeight: o.weight || 700,
        color: o.color || C.teal,
        letterSpacing: o.ls != null ? o.ls + "em" : "0.02em",
        lineHeight: o.lh || 1.2,
      },
    }, parent);
    if (o.html) n.innerHTML = o.html;
    return n;
  }

  /** <img> asset, natural size scaled by o.scale (or o.w). */
  function img(parent, src, o = {}) {
    const n = el("img", { cls: "asset " + (o.cls || ""), attrs: { src: src, draggable: "false" } }, parent);
    const im = MG.images[src];
    const w = o.w || (im ? im.naturalWidth * (o.scale || 1) : undefined);
    const h = o.h || (im ? im.naturalHeight * (o.scale || 1) : undefined);
    applyStyle(n, { left: o.x || 0, top: o.y || 0, width: w, height: h });
    return n;
  }

  // ---------------------------------------------------------------- splits
  function split(node, type = "chars") {
    if (node._split && node._splitType === type) return node._split;
    node._split = SplitText.create(node, { type: type, mask: type, charsClass: "ch", linesClass: "ln" });
    node._splitType = type;
    return node._split;
  }
  const charsOf = (node) => split(node, "chars").chars;

  /** Masked rise-in per character (the house text reveal). */
  function textIn(tl, node, at, o = {}) {
    const chars = charsOf(node);
    tl.fromTo(chars, { yPercent: o.fromY != null ? o.fromY : 108 }, {
      yPercent: 0,
      duration: o.dur || 0.9,
      ease: o.ease || "expo.out",
      stagger: o.stagger != null ? o.stagger : 0.028,
    }, at);
    return chars;
  }

  /** Masked exit per character (up and away). */
  function textOut(tl, node, at, o = {}) {
    const chars = charsOf(node);
    tl.to(chars, {
      yPercent: o.toY != null ? o.toY : -108,
      duration: o.dur || 0.45,
      ease: o.ease || "power2.in",
      stagger: o.stagger != null ? o.stagger : 0.012,
      immediateRender: false,
    }, at);
    return chars;
  }

  function fadeIn(tl, node, at, o = {}) {
    tl.fromTo(node, { autoAlpha: 0, y: o.y != null ? o.y : 18, x: o.x || 0, scale: o.scale || 1 },
      { autoAlpha: 1, y: 0, x: 0, scale: 1, duration: o.dur || 0.7, ease: o.ease || "power3.out" }, at);
  }

  function fadeOut(tl, node, at, o = {}) {
    tl.to(node, { autoAlpha: 0, y: o.y || 0, x: o.x || 0, duration: o.dur || 0.4, ease: o.ease || "power2.in", immediateRender: false }, at);
  }

  /** Stroke draw-on via DrawSVG. */
  function drawIn(tl, node, at, dur = 0.8, ease = "power2.inOut", from = "0% 0%") {
    tl.fromTo(node, { drawSVG: from }, { drawSVG: "0% 100%", duration: dur, ease: ease }, at);
  }

  // ------------------------------------------------- time-pure frame hooks
  const frameHooks = [];
  /** fn(t) runs after every seek with the absolute time in seconds. */
  function onFrame(fn) { frameHooks.push(fn); }
  function runFrame(t) { for (const f of frameHooks) f(t); }

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const easeFn = (e) => (typeof e === "function" ? e : gsap.parseEase(e || "power3.out"));

  /** Progress of a window [at, at+dur] eased, as a pure function of t. */
  function prog(t, at, dur, ease) { return easeFn(ease)(clamp01((t - at) / dur)); }

  const fmtThousands = (v) => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  /** Number counter, pure function of time (safe under arbitrary seeks). */
  function counter(node, o) {
    const ease = easeFn(o.ease || "power3.out");
    const dec = o.decimals || 0;
    const fmt = o.format || ((v) => (o.thousands ? fmtThousands(v.toFixed(dec)) : v.toFixed(dec)));
    onFrame((t) => {
      const p = ease(clamp01((t - o.at) / o.dur));
      const v = o.from + (o.to - o.from) * p;
      const s = fmt(dec === 0 ? Math.round(v) : Math.round(v * 10 ** dec) / 10 ** dec);
      if (node.textContent !== s) node.textContent = s;
    });
  }

  /** Gentle continuous drift using the CSS `translate` property, so it
   *  composes with GSAP's `transform` on the same node. */
  function float(node, o = {}) {
    const ax = o.ax || 0, ay = o.ay != null ? o.ay : 6, period = o.period || 5, ph = o.phase || 0;
    const rot = o.rot || 0;
    onFrame((t) => {
      const a = (2 * Math.PI * t) / period + ph;
      node.style.translate = `${(ax * Math.sin(a * 0.83 + 1.3)).toFixed(2)}px ${(ay * Math.sin(a)).toFixed(2)}px`;
      if (rot) node.style.rotate = `${(rot * Math.sin(a * 0.71 + 0.4)).toFixed(3)}deg`;
    });
  }

  /** Deterministic pseudo-random (mulberry32). */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let r = Math.imul(a ^ (a >>> 15), 1 | a);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Short terracotta accent bar under a KPI (reference: 100x6). */
  function accentBar(parent, x, y, w = 100, h = 6, color = C.terra) {
    return el("div", { cls: "abs accent", style: { left: x, top: y, width: w, height: h, background: color, borderRadius: h / 2 + "px", transformOrigin: "0% 50%" } }, parent);
  }
  function barIn(tl, node, at, dur = 0.7) {
    tl.fromTo(node, { scaleX: 0 }, { scaleX: 1, duration: dur, ease: "expo.out" }, at);
  }

  /** KPI block: optional label, big number, unit; returns nodes. */
  function kpi(parent, o) {
    const g = el("div", { cls: "abs kpi", style: { left: o.x, top: o.y } }, parent);
    const out = { g };
    let y = 0;
    if (o.label) {
      out.label = text(g, o.label, { x: 4, y: 0, size: o.labelSize || 34, weight: 500, color: o.labelColor || C.teal });
      if (o.labelHtml) out.label.innerHTML = o.labelHtml;
      y = (o.labelSize || 34) * 1.2 + (o.labelGap || 18);
    }
    const size = o.size || 170;
    out.num = text(g, o.value, { x: 0, y: y, size: size, weight: 700, color: o.color || C.teal, ls: -0.01, lh: 1.0, cls: "num" });
    out.unit = text(g, o.unit || "", { x: 0, y: 0, size: o.unitSize || 52, weight: 700, color: o.color || C.teal, lh: 1.0 });
    out.size = size;
    out.numTop = y;
    // unit sits on the number baseline, right of the (final) number width
    out.placeUnit = function (finalText) {
      const keep = out.num.textContent;
      if (finalText != null) out.num.textContent = finalText;
      const w = out.num.getBoundingClientRect().width / MG.stageScale;
      out.num.textContent = keep;
      out.unit.style.left = w + (o.unitGap || 18) + "px";
      out.unit.style.top = y + size * 0.86 - (o.unitSize || 52) * 0.86 + "px";
      return w;
    };
    return out;
  }

  window.K = {
    C, FONT, L, SVGNS,
    el, svg, svgCanvas, layer, text, img,
    split, charsOf, textIn, textOut, fadeIn, fadeOut, drawIn,
    onFrame, runFrame, prog, clamp01, easeFn, counter, float, rng,
    accentBar, barIn, kpi,
  };

  // Global namespace for scenes.
  window.MG = window.MG || { scenes: [], images: {}, stageScale: 1 };
  MG.scene = function (name, build) { MG.scenes.push({ name, build }); };
})();
