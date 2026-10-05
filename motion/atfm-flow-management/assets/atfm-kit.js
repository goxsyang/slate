/* ATFM v5 — shared, seek-safe building blocks for every sub-composition.
 * Loaded once by index.html (after GSAP + plugins). Exposes window.ATFM_KIT.
 * Everything here is deterministic: no clocks, no Math.random, no callbacks —
 * all motion is expressed as GSAP property tweens or the custom plugins below,
 * because the HyperFrames runtime seeks with suppressEvents=true (onUpdate never fires).
 */
(function () {
  "use strict";
  var SVGNS = "http://www.w3.org/2000/svg";
  var K = {};

  // ---------- DOM helpers ----------
  function setAttrs(n, attrs) {
    if (!attrs) return n;
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null) return;
      if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v;
      else if (k === "style" && typeof v === "object") Object.assign(n.style, v);
      else if (k === "class") n.setAttribute("class", v);
      else n.setAttribute(k, v);
    });
    return n;
  }
  function append(n, kids) {
    (kids || []).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }
  /** HTML element: K.el("div", {class:"k-card", style:{left:"10px"}}, [children]) */
  K.el = function (tag, attrs, kids) { return append(setAttrs(document.createElement(tag), attrs), kids); };
  /** SVG element: K.s("path", {d:"M0 0L10 10", stroke:"#000"}) */
  K.s = function (tag, attrs, kids) { return append(setAttrs(document.createElementNS(SVGNS, tag), attrs), kids); };

  /** Seeded PRNG (mulberry32). var r = K.rng(7); r() -> [0,1) */
  K.rng = function (seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // ---------- geometry ----------
  /** Quadratic arc from (x0,y0) to (x1,y1). bulge>0 bends to the LEFT of travel (screen up for L→R). */
  K.arc = function (x0, y0, x1, y1, bulge) {
    var mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    var nx = dy / L, ny = -dx / L; // left normal (screen coords, y down)
    var cx = mx + nx * bulge * 2, cy = my + ny * bulge * 2;
    return "M" + r1(x0) + " " + r1(y0) + "Q" + r1(cx) + " " + r1(cy) + " " + r1(x1) + " " + r1(y1);
  };
  /** Smooth path through points (Catmull-Rom → cubic Bézier). */
  K.smooth = function (pts, tension) {
    var t = tension == null ? 0.5 : tension, d = "M" + r1(pts[0][0]) + " " + r1(pts[0][1]);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + ((p2[0] - p0[0]) / 6) * t * 2, c1y = p1[1] + ((p2[1] - p0[1]) / 6) * t * 2;
      var c2x = p2[0] - ((p3[0] - p1[0]) / 6) * t * 2, c2y = p2[1] - ((p3[1] - p1[1]) / 6) * t * 2;
      d += "C" + r1(c1x) + " " + r1(c1y) + " " + r1(c2x) + " " + r1(c2y) + " " + r1(p2[0]) + " " + r1(p2[1]);
    }
    return d;
  };
  function r1(v) { return Math.round(v * 10) / 10; }
  K.lerp = function (a, b, t) { return a + (b - a) * t; };

  // ---------- aircraft ----------
  var PLANE_BODY = "M50 0C50-3.4 46.4-5.2 40.5-5.4L-36-5.4C-42.5-5.2-47.2-3-50-1.1L-50 1.1C-47.2 3-42.5 5.2-36 5.4L40.5 5.4C46.4 5.2 50 3.4 50 0Z";
  var PLANE_WING = "M13-5L-9.5-44.5C-10.4-46-12.6-46.6-14.4-46.2L-17.4-45.4L-14.5-5Z";
  var PLANE_STAB = "M-32.5-4.6L-44.6-17.6C-45.4-18.4-46.6-18.6-47.6-18.4L-49.4-18L-46.4-4.6Z";
  function mirror(d) { return d.replace(/(-?\d*\.?\d+)\s*(-?\d*\.?\d+)/g, function (m, x, y) { return x + " " + (-parseFloat(y)); }); }
  /**
   * Top-view airliner pointing +x, centred on origin, `len` px long.
   * Returns <g class="k-plane"> with .body/.shadow children; animate with the `along` plugin
   * (or K.placePlane for static placement). opts: {len=64, shadow=true, tone:"teal"|"terra", x, y, angle, alt=1 (0=on ground), squash=1 (K.AIRPORT.squash when parked on an iso apron)}
   */
  K.plane = function (opts) {
    opts = opts || {};
    var len = opts.len || 64, s = len / 100;
    var tail = opts.tone === "terra" ? "#B25135" : "#1F6B62";
    var g = K.s("g", { class: "k-plane" });
    var sh = K.s("g", { class: "k-plane-shadow", opacity: "0.16" });
    [PLANE_WING, mirror(PLANE_WING), PLANE_STAB, mirror(PLANE_STAB), PLANE_BODY].forEach(function (d) {
      sh.appendChild(K.s("path", { d: d, fill: "#3a3226" }));
    });
    var body = K.s("g", { class: "k-plane-body" });
    var wingFill = "#F2F4F1", line = "#AFC0B9";
    [PLANE_WING, mirror(PLANE_WING)].forEach(function (d) { body.appendChild(K.s("path", { d: d, fill: wingFill, stroke: line, "stroke-width": "0.9", "stroke-linejoin": "round" })); });
    // engines
    [-18, 18].forEach(function (y) { body.appendChild(K.s("rect", { x: "1.5", y: y - 2.9, width: "13", height: "5.8", rx: "2.6", fill: "#E4E9E6", stroke: line, "stroke-width": "0.8" })); });
    [PLANE_STAB, mirror(PLANE_STAB)].forEach(function (d) { body.appendChild(K.s("path", { d: d, fill: wingFill, stroke: line, "stroke-width": "0.9", "stroke-linejoin": "round" })); });
    body.appendChild(K.s("path", { d: PLANE_BODY, fill: "#FFFFFF", stroke: line, "stroke-width": "0.9" }));
    // fuselage shading + tail fin + wingtips
    body.appendChild(K.s("path", { d: "M44 2.6C40 4.6 36 4.8 30 4.9L-36 4.9C-41 4.8-45 3.4-48.4 1.2L-48.4 2.2C-45 4.2-41 5 -36 5.2L40.5 5.2C44 5 46.5 4 47.6 2.6Z", fill: "#D9E2DE", opacity: "0.8" }));
    body.appendChild(K.s("path", { d: "M-50-1.5L-33-1.5C-31.6-1.5-31.6 1.5-33 1.5L-50 1.5Z", fill: tail }));
    body.appendChild(K.s("path", { d: "M-14.4-46.2L-17.4-45.4L-16.9-40.2L-12.8-40.6Z", fill: tail, opacity: "0.9" }));
    body.appendChild(K.s("path", { d: "M-14.4 46.2L-17.4 45.4L-16.9 40.2L-12.8 40.6Z", fill: tail, opacity: "0.9" }));
    body.appendChild(K.s("path", { d: "M43.2-2.7Q46.8 0 43.2 2.7", fill: "none", stroke: "#2C4B45", "stroke-width": "1.7", "stroke-linecap": "round" }));
    if (opts.shadow !== false) g.appendChild(sh);
    g.appendChild(body);
    g.__body = body; g.__shadow = opts.shadow !== false ? sh : null; g.__scale = s;
    g.__alt = opts.alt == null ? 1 : opts.alt;
    g.__squash = opts.squash == null ? 1 : opts.squash;
    K.placePlane(g, opts.x || 0, opts.y || 0, opts.angle || 0, g.__alt, g.__squash);
    return g;
  };
  /** Static placement for a K.plane group (world-space shadow offset grows with alt 0..1). */
  K.placePlane = function (g, x, y, angle, alt, squash) {
    var s = g.__scale || 1, a = alt == null ? g.__alt : alt, q = squash == null ? (g.__squash == null ? 1 : g.__squash) : squash;
    g.__x = x; g.__y = y; g.__ang = angle; g.__alt = a; g.__squash = q;
    g.setAttribute("transform", "translate(" + r2(x) + " " + r2(y) + ")");
    g.__body.setAttribute("transform", "rotate(" + r2(angle) + ") scale(" + r5(s) + " " + r5(s * q) + ")");
    if (g.__shadow) {
      // offset is proportional to the plane scale, so it stays constant on screen under a map camera
      var off = s * (4.5 + a * 22), k = 1 - a * 0.08;
      g.__shadow.setAttribute("transform", "translate(" + r2(off * 0.55) + " " + r2(off) + ") rotate(" + r2(angle) + ") scale(" + r5(s * k) + " " + r5(s * q * k) + ")");
      g.__shadow.setAttribute("opacity", String(Math.round((0.2 - a * 0.08) * 1000) / 1000));
    }
  };
  function r2(v) { return Math.round(v * 100) / 100; }
  function r5(v) { return Math.round(v * 100000) / 100000; }

  function resolvePath(p) { return typeof p === "string" ? document.querySelector(p) : p; }

  // ---------- custom GSAP plugins (seek-safe) ----------
  function registerPlugins() {
    if (!window.gsap || K._plugins) return;
    K._plugins = true;
    registerCam();
    /**
     * along: move a K.plane group (or any SVG element) along an SVG path in the SAME coordinate space.
     * tl.to(plane, {along:{path:"#r1", from:0, to:1, alt0:1, alt1:1, trail:"#r1-trail", trailLen:120, angleOffset:0}, duration:3, ease:"power1.inOut"}, t)
     */
    gsap.registerPlugin({
      name: "along",
      init: function (target, v) {
        var path = resolvePath(v.path);
        this.t = target; this.path = path; this.L = path.getTotalLength();
        this.a = v.from == null ? 0 : v.from; this.b = v.to == null ? 1 : v.to;
        this.alt0 = v.alt0 == null ? (target.__alt == null ? 1 : target.__alt) : v.alt0;
        this.alt1 = v.alt1 == null ? this.alt0 : v.alt1;
        this.off = v.angleOffset || 0; this.rot = v.rotate !== false;
        this.trail = v.trail ? resolvePath(v.trail) : null; this.trailLen = v.trailLen || 110;
        this.fixedAngle = v.angle;
        this.q0 = v.squash0 == null ? (target.__squash == null ? 1 : target.__squash) : v.squash0;
        this.q1 = v.squash1 == null ? this.q0 : v.squash1;
      },
      render: function (ratio, d) {
        var p = d.a + (d.b - d.a) * ratio, L = d.L, s = Math.max(0, Math.min(L, p * L));
        var pt = d.path.getPointAtLength(s);
        var e = Math.min(L, s + 0.8), b = Math.max(0, s - 0.8);
        var p1 = d.path.getPointAtLength(b), p2 = d.path.getPointAtLength(e);
        var ang = d.fixedAngle != null ? d.fixedAngle : (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
        if (d.b < d.a && d.fixedAngle == null) ang += 180;
        ang += d.off;
        var alt = d.alt0 + (d.alt1 - d.alt0) * ratio;
        var q = d.q0 + (d.q1 - d.q0) * ratio;
        if (d.t.__body) { d.t.__squash = q; d.t.__alt = alt; K.placePlane(d.t, pt.x, pt.y, ang, alt, q); }
        else d.t.setAttribute("transform", "translate(" + r1(pt.x) + " " + r1(pt.y) + ")" + (d.rot ? " rotate(" + r1(ang) + ")" : ""));
        if (d.trail) {
          var s0 = Math.max(0, s - d.trailLen);
          d.trail.style.strokeDasharray = r1(s - s0) + " " + r1(L * 2 + 10);
          d.trail.style.strokeDashoffset = String(r1(-s0));
        }
      },
    });
    /** (along also accepts squash0/squash1 to un-flatten a plane as it lifts off the iso ground.) */
    /** count: tl.to(el, {count:{from:40, to:24, fmt:"int"|"time"|"fixed1", suffix:""}, duration:1}, t) */
    gsap.registerPlugin({
      name: "count",
      init: function (target, v) { this.t = target; this.a = v.from; this.b = v.to; this.fmt = v.fmt || "int"; this.pre = v.prefix || ""; this.suf = v.suffix || ""; },
      render: function (ratio, d) {
        var x = d.a + (d.b - d.a) * ratio, txt;
        if (d.fmt === "time") { var m = Math.round(x); txt = pad2(Math.floor(m / 60) % 24) + ":" + pad2(m % 60); }
        else if (d.fmt === "fixed1") txt = x.toFixed(1);
        else txt = String(Math.round(x));
        d.t.textContent = d.pre + txt + d.suf;
      },
    });
  }
  function registerCam() {
    gsap.registerPlugin({
      name: "cam",
      init: function (target, v) { this.m = v.map; this.f = v.from; this.t2 = v.to; },
      render: function (r, d) {
        var f = d.f, e = d.t2, z = Math.exp(Math.log(f.z) + (Math.log(e.z) - Math.log(f.z)) * r);
        applyCamProxy(d.m, f.cx + (e.cx - f.cx) * r, f.cy + (e.cy - f.cy) * r, z);
      },
    });
  }
  function applyCamProxy(m, cx, cy, z) { K.__applyCam(m, cx, cy, z); }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  K.registerPlugins = function () { registerPlugins(); };

  // ---------- animation helpers (all take a timeline + absolute local time) ----------
  /** Fade + rise in. opts: {y=16, x=0, dur=0.7, ease="power3.out", scale} */
  K.inUp = function (tl, el, t, o) {
    o = o || {};
    var from = { opacity: 0, y: o.y == null ? 16 : o.y, x: o.x || 0 }, to = { opacity: 1, y: 0, x: 0, duration: o.dur || 0.7, ease: o.ease || "power3.out" };
    if (o.scale != null) { from.scale = o.scale; to.scale = 1; }
    return tl.fromTo(el, from, to, t);
  };
  /** Fade out (optionally drift). opts {dur=0.4, y=-8} */
  K.out = function (tl, el, t, o) {
    o = o || {};
    return tl.to(el, { opacity: 0, y: o.y == null ? -8 : o.y, x: o.x || 0, duration: o.dur || 0.4, ease: o.ease || "power2.in" }, t);
  };
  /** Pop (chips/dots). */
  K.pop = function (tl, el, t, o) {
    o = o || {};
    return tl.fromTo(el, { opacity: 0, scale: o.from || 0.6, transformOrigin: o.origin || "50% 50%" }, { opacity: 1, scale: 1, duration: o.dur || 0.55, ease: o.ease || "back.out(1.5)" }, t);
  };
  /** Draw an SVG stroke 0→100% (DrawSVGPlugin). */
  K.draw = function (tl, path, t, dur, ease, fromPct) {
    return tl.fromTo(path, { drawSVG: (fromPct || 0) + "% " + (fromPct || 0) + "%" }, { drawSVG: (fromPct || 0) + "% 100%", duration: dur || 1, ease: ease || "expo.inOut" }, t);
  };

  /**
   * Zoom-proof line reveal. DrawSVG measures dash lengths once, so it breaks on vector-effect=non-scaling-stroke
   * paths while a camera zooms (and it cannot draw dashed lines). K.reveal hides `path` behind a userSpace mask
   * whose white copy of the same geometry is drawn with DrawSVG — works for dashed, non-scaling, zooming lines.
   * K.reveal(tl, path, t, dur, {id (unique!), width (mask stroke in the path's user units, default 40), ease, from:0, to:100})
   * Call once per path; for a second animation (e.g. un-draw) use the returned mask copy: tl.to(copy, {drawSVG:"100% 100%"}, t)
   */
  K.reveal = function (tl, path, t, dur, o) {
    o = o || {};
    var svg = path.ownerSVGElement, id = o.id || ("k-rv-" + (++K._rv));
    var defs = svg.querySelector("defs") || svg.insertBefore(K.s("defs"), svg.firstChild);
    var mask = K.s("mask", { id: id, maskUnits: "userSpaceOnUse", maskContentUnits: "userSpaceOnUse", x: "-200000", y: "-200000", width: "400000", height: "400000" });
    var copy = K.s("path", { d: path.getAttribute("d"), fill: "none", stroke: "#fff", "stroke-width": String(o.width || 40), "stroke-linecap": "round", "stroke-linejoin": "round" });
    var tr = path.getAttribute("transform"); if (tr) copy.setAttribute("transform", tr);
    mask.appendChild(copy); defs.appendChild(mask);
    path.setAttribute("mask", "url(#" + id + ")");
    tl.fromTo(copy, { drawSVG: (o.from || 0) + "% " + (o.from || 0) + "%" }, { drawSVG: (o.from || 0) + "% " + (o.to == null ? 100 : o.to) + "%", duration: dur || 1, ease: o.ease || "expo.inOut" }, t);
    return copy;
  };
  K._rv = 0;
  /** Un-draw from the start (line retracts toward its end). */
  K.undraw = function (tl, path, t, dur, ease) {
    return tl.to(path, { drawSVG: "100% 100%", duration: dur || 0.6, ease: ease || "power2.in" }, t);
  };
  /** Marching dashes on a dashed path from t0 to t1 (signal / data flow). speed px/s */
  K.flow = function (tl, path, t0, t1, speed, dir) {
    var dist = (speed || 60) * (t1 - t0) * (dir === -1 ? 1 : -1);
    return tl.fromTo(path, { strokeDashoffset: 0 }, { strokeDashoffset: dist, duration: t1 - t0, ease: "none" }, t0);
  };
  /** Expanding ring pulse on an SVG <circle>. opts {r0, r1, dur=1.2, opacity=0.5, repeat=0, gap=0.4} */
  K.pulse = function (tl, circle, t, o) {
    o = o || {};
    var n = (o.repeat || 0) + 1;
    for (var i = 0; i < n; i++) {
      var ti = t + i * ((o.dur || 1.2) + (o.gap == null ? 0.4 : o.gap));
      tl.fromTo(circle, { attr: { r: o.r0 || 10 }, opacity: o.opacity == null ? 0.5 : o.opacity }, { attr: { r: o.r1 || 40 }, opacity: 0, duration: o.dur || 1.2, ease: "power2.out", immediateRender: i === 0 }, ti);
    }
    return tl;
  };
  /** Fly a K.plane along a path. o: {from,to,alt0,alt1,trail,trailLen,ease,angle} */
  K.fly = function (tl, plane, path, t, dur, o) {
    o = o || {};
    var v = { path: path, from: o.from, to: o.to, alt0: o.alt0, alt1: o.alt1, squash0: o.squash0, squash1: o.squash1, trail: o.trail, trailLen: o.trailLen, angle: o.angle, angleOffset: o.angleOffset };
    return tl.to(plane, { along: v, duration: dur, ease: o.ease || "power1.inOut", immediateRender: o.immediateRender !== false }, t);
  };

  /**
   * Chain K.fly legs with no gaps. legs: [{to, dur, ease, alt0, alt1, squash0, squash1}], leg 0 may carry `from`.
   * Leg 0 renders immediately (places the plane at build time); later legs don't. Returns end time.
   */
  K.legs = function (tl, plane, path, t0, legs) {
    var t = t0, from = legs[0].from == null ? 0 : legs[0].from;
    legs.forEach(function (lg, i) {
      K.fly(tl, plane, path, t, lg.dur, { from: from, to: lg.to, ease: lg.ease || "none", alt0: lg.alt0, alt1: lg.alt1, squash0: lg.squash0, squash1: lg.squash1, angle: lg.angle, immediateRender: i === 0 });
      t += lg.dur; from = lg.to;
    });
    return t;
  };
  /** Fraction (0..1, by arc length) of the point on `path` nearest to (x,y); 800 samples + local refine. */
  K.fracAt = function (path, x, y) {
    path = resolvePath(path);
    var L = path.getTotalLength(), N = 800, best = 0, bd = Infinity, i, p, d;
    for (i = 0; i <= N; i++) { p = path.getPointAtLength((L * i) / N); d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y); if (d < bd) { bd = d; best = i / N; } }
    var lo = Math.max(0, best - 1 / N), hi = Math.min(1, best + 1 / N);
    for (i = 0; i <= 40; i++) { var f = lo + ((hi - lo) * i) / 40; p = path.getPointAtLength(L * f); d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y); if (d < bd) { bd = d; best = f; } }
    return best;
  };

  // ---------- UI primitives ----------
  /** Card. o: {x,y,w,h,title,body,note,cls} → .k-card with children .k-card-title/.k-card-body/.k-card-note */
  K.card = function (o) {
    var kids = [];
    if (o.title) kids.push(K.el("div", { class: "k-card-title", text: o.title }));
    if (o.body) kids.push(K.el("div", { class: "k-card-body", text: o.body }));
    if (o.note) kids.push(K.el("div", { class: "k-card-note", text: o.note }));
    var st = { left: o.x + "px", top: o.y + "px" };
    if (o.w) st.width = o.w + "px";
    if (o.h) st.height = o.h + "px";
    return K.el("div", { class: "k-card " + (o.cls || ""), style: st }, kids);
  };
  /** Chip. o: {x,y,warn,card} */
  K.chip = function (text, o) {
    o = o || {};
    return K.el("div", { class: "k-chip" + (o.warn ? " is-warn" : "") + (o.card ? " is-card" : ""), style: { left: o.x + "px", top: o.y + "px" } }, [text]);
  };
  /** Slot row: states array of "on"|"off"|"empty". Returns the .k-slots element; slots at el.__slots */
  K.slots = function (states) {
    var row = K.el("div", { class: "k-slots" });
    row.__slots = states.map(function (s) { var e = K.el("span", { class: "k-slot" + (s === "off" ? " is-off" : s === "empty" ? " is-empty" : "") }); row.appendChild(e); return e; });
    return row;
  };
  /** Tween one slot's state colour. state: "on"|"off"|"teal2" */
  K.slotTo = function (tl, slot, state, t, dur) {
    var c = state === "off" ? "#D8C4B9" : state === "teal2" ? "#3E8C80" : "#1F6B62";
    return tl.to(slot, { backgroundColor: c, boxShadow: "inset 0 0 0 0px rgba(169,199,189,0)", duration: dur || 0.35, ease: "power2.inOut" }, t);
  };
  /** Isometric airport. o: {x,y,w=560} (x,y = top-left of image box). */
  K.airport = function (o) {
    var w = o.w || 560;
    var d = K.el("div", { class: "k-airport", style: { left: o.x + "px", top: o.y + "px", width: w + "px" } }, [
      K.el("div", { class: "k-airport-shadow" }),
      K.el("img", { src: o.src || "assets/img/airport.png", alt: "", draggable: "false" }),
    ]);
    return d;
  };
  /**
   * Airport asset geometry in source pixels (assets/img/airport.png is 1600×864).
   * Multiply by (displayWidth/1600) to get on-screen offsets from the .k-airport box's top-left.
   * runway: centreline from left threshold (x0,y0) to right end (x1,y1) — screen angle ≈ -12.5°.
   * stands: good parking spots on the apron (planes parked parallel to the runway).
   * squash: wing foreshortening (scaleY) that makes a top-view plane sit on the iso ground plane.
   */
  K.AIRPORT = { w: 1600, h: 864, aspect: 0.54, runway: { x0: 110, y0: 335, x1: 1330, y1: 64 }, runwayAngle: -12.5,
    stands: [[560, 432], [835, 372], [1105, 312]], squash: 0.55 };
  /** Convert an airport-asset point to stage coords for an airport placed at (ax,ay) with width aw. */
  K.airportPt = function (ax, ay, aw, px, py) { var k = aw / 1600; return [ax + px * k, ay + py * k]; };

  /**
   * Rolling digits. K.roll("10:05", {h:34}) → inline-flex element; K.rollTo(tl, el, "10:25", t, dur)
   * Only digit characters roll; others are static. Text length must stay constant.
   */
  K.roll = function (text, o) {
    o = o || {};
    var h = o.h || 34, wrap = K.el("span", { class: "k-roll", style: { height: h + "px", lineHeight: h + "px" } });
    wrap.__cols = [];
    wrap.__h = h;
    text.split("").forEach(function (ch) {
      var col = K.el("span", { class: "k-roll-col", style: { height: h + "px" } });
      if (/\d/.test(ch)) {
        var strip = K.el("span", { class: "k-roll-strip" });
        for (var i = 0; i < 10; i++) strip.appendChild(K.el("span", { text: String(i), style: { height: h + "px" } }));
        col.appendChild(strip);
        gsap.set(strip, { y: -parseInt(ch, 10) * h });
        col.__strip = strip;
      } else col.appendChild(K.el("span", { text: ch, style: { height: h + "px", display: "block" } }));
      wrap.appendChild(col);
      wrap.__cols.push(col);
    });
    return wrap;
  };
  K.rollTo = function (tl, wrap, text, t, dur, stagger) {
    var h = wrap.__h, k = 0;
    text.split("").forEach(function (ch, i) {
      var col = wrap.__cols[i];
      if (!col || !col.__strip || !/\d/.test(ch)) return;
      tl.to(col.__strip, { y: -parseInt(ch, 10) * h, duration: dur || 0.6, ease: "power3.inOut" }, t + (stagger == null ? 0.05 : stagger) * k++);
    });
    return tl;
  };

  /**
   * ATFM system panel. o: {x,y,w,title,clock,cols:"grid-template-columns", head:[...], rows:[[cells...]]}
   * Cell may be a string or a Node. Returns panel; rows at panel.__rows (each row.__cells, row.__hl).
   */
  K.panel = function (o) {
    var p = K.el("div", { class: "k-panel", style: { left: o.x + "px", top: o.y + "px", width: o.w + "px" } });
    var bar = K.el("div", { class: "k-panel-bar" }, [K.el("span", { class: "k-led" }), o.title || "ATFM 流量管理系統"]);
    if (o.clock) bar.appendChild(K.el("span", { class: "k-bar-right", text: o.clock }));
    p.appendChild(bar);
    p.__bar = bar;
    if (o.head) p.appendChild(K.el("div", { class: "k-panel-head", style: { gridTemplateColumns: o.cols } }, o.head.map(function (h) { return K.el("span", { text: h }); })));
    p.__rows = (o.rows || []).map(function (cells) {
      var hl = K.el("div", { class: "k-row-hl" });
      var row = K.el("div", { class: "k-row", style: { gridTemplateColumns: o.cols } }, [hl]);
      row.__hl = hl;
      row.__cells = cells.map(function (c) { var cell = typeof c === "string" ? K.el("span", { text: c }) : c; row.appendChild(cell); return cell; });
      p.appendChild(row);
      return row;
    });
    return p;
  };
  K.tag = function (text, ok) { return K.el("span", { class: "k-tag " + (ok ? "is-ok" : "is-hold"), text: text }); };

  /** Standard SVG node: teal dot with cream ring (+ optional pulse ring). Returns g with .__dot/.__ring/.__pulse */
  K.node = function (x, y, o) {
    o = o || {};
    var col = o.color || "#1F6B62", r = o.r || 9;
    var g = K.s("g", { class: "k-node", transform: "translate(" + x + " " + y + ")" });
    var pulse = K.s("circle", { r: r, fill: "none", stroke: col, "stroke-width": "2", opacity: "0" });
    var ring = K.s("circle", { r: r + 4, fill: "#FBF7F2" });
    var dot = K.s("circle", { r: r, fill: col });
    g.appendChild(pulse); g.appendChild(ring); g.appendChild(dot);
    g.__pulse = pulse; g.__ring = ring; g.__dot = dot;
    return g;
  };



  // ---------- props ----------
  /** Raster prop (assets/img/cloud.png 900×468, truck.png 560×379, airport.png 1600×864). o:{src,x,y,w,cls} */
  K.img = function (o) {
    return K.el("div", { class: "k-prop " + (o.cls || ""), style: { position: "absolute", left: o.x + "px", top: o.y + "px", width: o.w + "px" } }, [
      K.el("img", { src: o.src, alt: "", draggable: "false", style: { display: "block", width: "100%", height: "auto" } }),
    ]);
  };
  K.PROPS = { cloud: { src: "assets/img/cloud.png", aspect: 468 / 900 }, truck: { src: "assets/img/truck.png", aspect: 379 / 560 } };
  /** Flat traffic cone(s) as inline SVG (terracotta + cream bands, matches v4). o:{n=2,h=64,gap=18} → <svg> */
  K.cones = function (o) {
    o = o || {};
    var n = o.n || 2, h = o.h || 64, w = h * 0.78, gap = o.gap == null ? h * 0.28 : o.gap;
    var svg = K.s("svg", { width: String(n * w + (n - 1) * gap), height: String(h), viewBox: "0 0 " + (n * w + (n - 1) * gap) + " " + h, style: { display: "block", overflow: "visible" } });
    for (var i = 0; i < n; i++) {
      var x = i * (w + gap), g = K.s("g", { class: "k-cone", transform: "translate(" + r1(x) + " 0)" });
      g.appendChild(K.s("rect", { x: "0", y: String(h * 0.86), width: String(w), height: String(h * 0.14), rx: String(h * 0.03), fill: "#B25135" }));
      g.appendChild(K.s("path", { d: "M" + r1(w * 0.42) + " 0L" + r1(w * 0.58) + " 0L" + r1(w * 0.86) + " " + r1(h * 0.86) + "L" + r1(w * 0.14) + " " + r1(h * 0.86) + "Z", fill: "#B25135" }));
      g.appendChild(K.s("path", { d: "M" + r1(w * 0.3) + " " + r1(h * 0.38) + "L" + r1(w * 0.7) + " " + r1(h * 0.38) + "L" + r1(w * 0.75) + " " + r1(h * 0.54) + "L" + r1(w * 0.25) + " " + r1(h * 0.54) + "Z", fill: "#FBF7F2" }));
      svg.appendChild(g);
    }
    svg.__cones = Array.prototype.slice.call(svg.querySelectorAll(".k-cone"));
    return svg;
  };
  /**
   * Rain streaks inside an <svg> (pass the svg element), animated seek-safely between t0 and t1.
   * K.rain(tl, svg, {id:"c2-rain", x,y,w,h, n=14, t0, t1, seed=3, len=26, color:"#7FA29A", cycle=0.65})
   * Streaks fall through a vertically feathered mask; group fades in at t0 and out at t1.
   */
  K.rain = function (tl, svg, o) {
    var rnd = K.rng(o.seed || 3), n = o.n || 14, len = o.len || 26, cyc = o.cycle || 0.65, id = o.id || "k-rain";
    var defs = svg.querySelector("defs") || svg.insertBefore(K.s("defs"), svg.firstChild);
    var gid = id + "-grad", mid = id + "-mask";
    var grad = K.s("linearGradient", { id: gid, x1: "0", y1: "0", x2: "0", y2: "1" });
    [["0", "0"], ["0.22", "1"], ["0.72", "1"], ["1", "0"]].forEach(function (st) { grad.appendChild(K.s("stop", { offset: st[0], "stop-color": "#fff", "stop-opacity": st[1] })); });
    var mask = K.s("mask", { id: mid, maskUnits: "userSpaceOnUse", x: String(o.x - 40), y: String(o.y), width: String(o.w + 80), height: String(o.h) });
    mask.appendChild(K.s("rect", { x: String(o.x - 40), y: String(o.y), width: String(o.w + 80), height: String(o.h), fill: "url(#" + gid + ")" }));
    defs.appendChild(grad); defs.appendChild(mask);
    var g = K.s("g", { class: "k-rain", mask: "url(#" + mid + ")" });
    svg.appendChild(g);
    var dur = o.t1 - o.t0;
    for (var i = 0; i < n; i++) {
      var x = o.x + (o.w * (i + 0.5)) / n + (rnd() - 0.5) * (o.w / n) * 0.8;
      var ln = K.s("line", { x1: r1(x), y1: "0", x2: r1(x - len * 0.3), y2: String(len), stroke: o.color || "#7FA29A", "stroke-width": "3.2", "stroke-linecap": "round" });
      g.appendChild(ln);
      var off = rnd() * cyc, c = cyc * (0.85 + rnd() * 0.3), reps = Math.max(0, Math.floor((dur - off) / c) - 1);
      tl.fromTo(ln, { y: o.y - len, x: 0 }, { y: o.y + o.h, x: -o.h * 0.3, duration: c, ease: "none", repeat: reps }, o.t0 + off);
    }
    tl.fromTo(g, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power1.out" }, o.t0);
    tl.to(g, { opacity: 0, duration: 0.35, ease: "power1.in" }, o.t1 - 0.35);
    return g;
  };
  // ---------- map (Mercator world units from ATFM_MAP) ----------
  /**
   * Build the shared map. K.map(parentEl, {band:[220,860]|null, feather:36, sx:960, sy:540, cam:{cx,cy,z}, id:"c1"})
   * Returns m = {wrap, svg, cam, under, world, top, pinLayer, L:{sea,grat,halo1,halo2,land,coast,taiwan,firFill,firLine}, proj}
   * - put routes/nodes/planes (world coords) in m.world; screen-sized things via K.mapFixed / K.mapPlane / K.pin.
   * - move the camera ONLY with K.camTo (explicit from→to states).
   */
  K.map = function (parent, o) {
    o = o || {};
    var M = window.ATFM_MAP, id = o.id || "map";
    var m = { sx: o.sx == null ? 960 : o.sx, sy: o.sy == null ? 540 : o.sy, fixed: [], planes: [], pins: [], proj: M.project };
    var wrap = K.el("div", { class: "k-map", style: { position: "absolute", left: "0", top: "0", width: "1920px", height: "1080px", overflow: "hidden" } });
    if (o.band) {
      var f = o.feather == null ? 36 : o.feather, y0 = o.band[0], y1 = o.band[1];
      var g = "linear-gradient(to bottom, transparent " + (y0 - f / 2) + "px, #000 " + (y0 + f / 2) + "px, #000 " + (y1 - f / 2) + "px, transparent " + (y1 + f / 2) + "px)";
      wrap.style.webkitMaskImage = g; wrap.style.maskImage = g;
    }
    var svg = K.s("svg", { width: "1920", height: "1080", viewBox: "0 0 1920 1080", style: { position: "absolute", left: "0", top: "0", display: "block" } });
    var defs = K.s("defs");
    defs.innerHTML = '<radialGradient id="' + id + '-seaGrad" cx="50%" cy="46%" r="70%"><stop offset="0" stop-color="#D3DDD6"/><stop offset="0.65" stop-color="#C9D4CD"/><stop offset="1" stop-color="#BCC9C1"/></radialGradient>';
    svg.appendChild(defs);
    var NS = { "vector-effect": "non-scaling-stroke", fill: "none", "stroke-linejoin": "round", "stroke-linecap": "round" };
    function P(d, a) { var at = Object.assign({ d: d }, a); return K.s("path", at); }
    var L = {};
    L.sea = K.s("rect", { x: "0", y: "0", width: "1920", height: "1080", fill: "url(#" + id + "-seaGrad)" });
    svg.appendChild(L.sea);
    var cam = K.s("g", { class: "k-cam" });
    L.grat = P(M.graticule, Object.assign({}, NS, { stroke: "#8FA79B", "stroke-width": "1", opacity: "0.32", "stroke-dasharray": "2 7" }));
    L.halo2 = P(M.land, Object.assign({}, NS, { stroke: "#D7E1DA", "stroke-width": "26", opacity: "0.38" }));
    L.halo1 = P(M.land, Object.assign({}, NS, { stroke: "#DCE6E0", "stroke-width": "10", opacity: "0.75" }));
    L.land = P(M.land, { fill: "#EEE8DD" });
    L.coast = P(M.land, Object.assign({}, NS, { stroke: "#CBC2B3", "stroke-width": "1.1" }));
    L.taiwan = P(M.taiwan, { fill: "#EEE8DD", stroke: "#B9A57A", "stroke-width": "1.2", "vector-effect": "non-scaling-stroke", "stroke-linejoin": "round" });
    L.firFill = P(M.fir.RCAA.d, { fill: "#1F6B62", opacity: "0" });
    L.firLine = P(M.fir.RCAA.d, Object.assign({}, NS, { stroke: "#1F6B62", "stroke-width": "2.4", "stroke-dasharray": "12 9", opacity: "0" }));
    var under = K.s("g", { class: "k-map-under" });
    var world = K.s("g", { class: "k-map-world" });
    var top = K.s("g", { class: "k-map-top" });
    [L.grat, L.halo2, L.halo1, L.land, L.coast, L.taiwan, under, L.firFill, L.firLine, world, top].forEach(function (n) { cam.appendChild(n); });
    svg.appendChild(cam);
    var pinLayer = K.el("div", { class: "k-map-pins", style: { position: "absolute", left: "0", top: "0", width: "1920px", height: "1080px" } });
    wrap.appendChild(svg); wrap.appendChild(pinLayer);
    parent.appendChild(wrap);
    Object.assign(m, { wrap: wrap, svg: svg, defs: defs, cam: cam, under: under, world: world, top: top, pinLayer: pinLayer, L: L });
    K.camSet(m, o.cam || { cx: 0, cy: 0, z: 1 });
    return m;
  };
  /** world point for [lon,lat] */
  K.ll = function (lon, lat) { return window.ATFM_MAP.project([lon, lat]); };
  function applyCam(m, cx, cy, z) {
    m.state = { cx: cx, cy: cy, z: z };
    m.cam.setAttribute("transform", "translate(" + (Math.round((m.sx - cx * z) * 100) / 100) + " " + (Math.round((m.sy - cy * z) * 100) / 100) + ") scale(" + Math.round(z * 10000) / 10000 + ")");
    m.fixed.forEach(function (f) { f.el.setAttribute("transform", "translate(" + r2(f.x) + " " + r2(f.y) + ") scale(" + Math.round((f.k / z) * 10000) / 10000 + ")"); });
    m.planes.forEach(function (p) { p.__scale = p.__base / z; if (p.__x != null) K.placePlane(p, p.__x, p.__y, p.__ang, p.__alt, p.__squash); });
    m.pins.forEach(function (p) {
      var x = m.sx + (p.x - cx) * z + (p.dx || 0), y = m.sy + (p.y - cy) * z + (p.dy || 0);
      p.el.style.transform = "translate(" + r1(x) + "px," + r1(y) + "px)";
    });
  }
  K.__applyCam = applyCam;
  /** Set camera immediately (build time). state {cx,cy,z} in world units. */
  K.camSet = function (m, st) { applyCam(m, st.cx, st.cy, st.z); };
  /** Camera move with explicit from/to (keeps seeking deterministic). Zoom interpolates in log space. */
  K.camTo = function (tl, m, t, dur, from, to, ease) {
    return tl.to(m.cam, { cam: { map: m, from: from, to: to }, duration: dur, ease: ease || "sine.inOut", immediateRender: false }, t);
  };
  /** Keep an SVG element (in m.world/m.top) at world (x,y) with a constant on-screen scale k. */
  K.mapFixed = function (m, el, x, y, k) { m.fixed.push({ el: el, x: x, y: y, k: k == null ? 1 : k }); el.setAttribute("transform", "translate(" + r2(x) + " " + r2(y) + ") scale(" + r5((k == null ? 1 : k) / m.state.z) + ")"); return el; };
  /** Register a K.plane living in m.world so it keeps a constant screen size while the camera zooms. */
  K.mapPlane = function (m, plane) { plane.__base = plane.__scale; m.planes.push(plane); plane.__scale = plane.__base / m.state.z; if (plane.__x != null) K.placePlane(plane, plane.__x, plane.__y, plane.__ang, plane.__alt, plane.__squash); return plane; };
  /** Pin an HTML element to world (x,y) + screen offset (dx,dy): its top-left corner sits there (offset it yourself to centre). */
  K.pin = function (m, el, x, y, dx, dy) {
    // the camera positions an outer wrapper; tween `el` itself (opacity / y / scale) without conflicts
    var w = K.el("div", { class: "k-pin", style: { position: "absolute", left: "0px", top: "0px" } });
    if (!el.style.position) el.style.position = "relative";
    w.appendChild(el); m.pinLayer.appendChild(w);
    m.pins.push({ el: w, x: x, y: y, dx: dx || 0, dy: dy || 0 });
    applyCam(m, m.state.cx, m.state.cy, m.state.z);
    return el;
  };

  window.ATFM_KIT = K;
  registerPlugins();
})();
