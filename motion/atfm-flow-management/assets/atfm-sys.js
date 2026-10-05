/* ATFM v5 — "real system" panel component (K.sysPanel), modelled on the client's AAR Setting Tool recording:
 * dark slate UI, left nav (AIRPORT / FIXES / SECTOR), date-clock, yellow location badge, hourly capacity (AAR)
 * bar columns with pink restricted hours + red ATFM tags, and a flight timeline strip with flight chips.
 * Loaded by index.html after atfm-kit.js. All text ≥ 30 px. Everything is plain DOM so scenes can tween it with GSAP.
 *
 *   var P = K.sysPanel({ x, y, w: 1000, h: 340, active: "AIRPORT", badge: "RCTP", clock: "10:01",
 *                        hours: [{ h: "1000", aar: 25, fill: 0.9, state: "normal" }, ...],   // 6 columns fit in w 1000 (min w 1000 for the full bar: title+3 tabs+badge+clock+pill)
 *                        ruler: { start: 0, minutes: 60, step: 10, label: "10" },          // minute ruler of one hour
 *                        flights: [{ id: "A", min: 5, tone: "pink" }, ...] });
 *   root.appendChild(P.el);
 *   P.cols[i]  → { el, aar (box), bar, stripes[], hour, tag }   P.chips[i] → { el, id }   P.minToX(min) → px inside the ruler
 *   P.pill.set(tl, "S1", t)  (S0 監控中 · S1 已偵測 · S2 計算中 · S3 ✓ 已派發)   P.setAAR(tl, i, value, restricted, t)
 */
(function () {
  "use strict";
  var K = window.ATFM_KIT;
  var C = {
    bg: "#2B313B", inner: "#343B46", line: "#414957", text: "#E8ECF1", muted: "#9AA3AE",
    blue: "#3A8DDE", pink: "#E6399B", red: "#C8323C", yellow: "#FFE600", grey: "#AEB6C0", cyan: "#2CB1D8", amber: "#E8B400",
    mint: "#9FE0C9", terra: "#F08A6B",
  };
  var PILL = {
    S0: { text: "監控中", bg: "#2F5F57", fg: "#9FE0C9" },
    S1: { text: "已偵測", bg: "#5A2A2E", fg: "#F0A08F" },
    S2: { text: "計算中", bg: "#2F4A6B", fg: "#9CC9F5" },
    S3: { text: "✓ 已派發", bg: "#2F5F57", fg: "#9FE0C9" },
  };

  K.sysPanel = function (o) {
    o = o || {};
    var w = o.w || 1000, h = o.h || 340, pad = 14;
    var el = K.el("div", { class: "ks-panel", style: { left: o.x + "px", top: o.y + "px", width: w + "px", height: h + "px" } });

    // ---- top bar: title · nav tabs · badge · clock · status pill ----
    var bar = K.el("div", { class: "ks-bar" });
    var title = K.el("div", { class: "ks-title" }, [K.el("span", { class: "ks-led" }), o.title || "ATFM 流量管理系統"]);
    var tabs = {}, tabWrap = K.el("div", { class: "ks-tabs" });
    (o.nav || ["AIRPORT", "FIXES", "SECTOR"]).forEach(function (n) {
      var t = K.el("div", { class: "ks-tab" + (n === (o.active || "AIRPORT") ? " is-active" : ""), text: n });
      tabs[n] = t; tabWrap.appendChild(t);
    });
    var badge = K.el("div", { class: "ks-badge", text: o.badge || "RCTP" });
    var clock = K.el("div", { class: "ks-clock k-num", text: o.clock || "10:00" });
    var pillEl = K.el("div", { class: "ks-pill" });
    var pillStates = {};
    Object.keys(PILL).forEach(function (k) {
      var s = K.el("div", { class: "ks-pill-s", text: PILL[k].text, style: { background: PILL[k].bg, color: PILL[k].fg, opacity: k === "S0" ? "1" : "0" } });
      pillStates[k] = s; pillEl.appendChild(s);
    });
    bar.appendChild(title);
    if (o.pill !== false) bar.appendChild(pillEl);
    el.appendChild(bar);
    // left nav column (stacked like the real AAR Setting Tool) + clock box + location badge
    var nav = K.el("div", { class: "ks-nav" });
    nav.appendChild(tabWrap);
    var clockBox = K.el("div", { class: "ks-clockbox" }, [clock]);
    nav.appendChild(clockBox); nav.appendChild(badge);
    var main = K.el("div", { class: "ks-main" });
    var row = K.el("div", { class: "ks-row" }, [nav, main]);
    el.appendChild(row);

    // ---- capacity columns (AAR per hour) ----
    var hours = o.hours || [];
    var body = K.el("div", { class: "ks-body" });
    var capLabel = K.el("div", { class: "ks-caplabel", text: o.capLabel || (o.active === "FIXES" ? "通過容量 / 時" : "到場容量 / 時") });
    var colsWrap = K.el("div", { class: "ks-cols" });
    var cols = hours.map(function (hd) {
      var col = K.el("div", { class: "ks-col" });
      var restricted = hd.state === "restricted";
      var aar = K.el("div", { class: "ks-aar k-num" + (restricted ? " is-restricted" : ""), text: String(hd.aar) });
      var barEl = K.el("div", { class: "ks-bar-col" });
      var n = 8, stripes = [];
      for (var i = 0; i < n; i++) {
        var on = i >= Math.round((1 - (hd.fill == null ? 0.85 : hd.fill)) * n);
        var st = K.el("span", { class: "ks-stripe" + (restricted ? " is-restricted" : hd.state === "planned" ? " is-planned" : ""), style: { opacity: on ? "1" : "0.18" } });
        barEl.appendChild(st); stripes.push(st);
      }
      var hour = K.el("div", { class: "ks-hour k-num", text: hd.h });
      var tag = K.el("div", { class: "ks-tag" + (restricted ? " is-active" : ""), text: "ATFM" });
      [aar, barEl, hour, tag].forEach(function (c) { col.appendChild(c); });
      colsWrap.appendChild(col);
      return { el: col, aar: aar, bar: barEl, stripes: stripes, hour: hour, tag: tag };
    });
    body.appendChild(capLabel); body.appendChild(colsWrap);
    main.appendChild(body);

    // ---- timeline strip (one hour, minute ruler, flight chips above it) ----
    var r = o.ruler || { start: 0, minutes: 60, step: 10, label: "10" };
    var strip = K.el("div", { class: "ks-strip" });
    var lane = K.el("div", { class: "ks-lane" });
    var ruler = K.el("div", { class: "ks-ruler" });
    var rulerW = w - 2 * pad - 150 - 12 - 2 * 16; // ruler inner width: panel − padding − nav column − gap − strip padding
    var inset = 46; // keeps the end labels ("HH:00") inside the ruler
    function minToX(min) { return inset + ((min - r.start) / r.minutes) * (rulerW - 2 * inset); }
    var ticks = [];
    var hourBase = parseInt(r.label || "10", 10);
    for (var m = r.start; m <= r.start + r.minutes; m += r.step) {
      var isHour = m % 60 === 0, txt;
      if (isHour) { var hh = hourBase + Math.floor((m - r.start) / 60); txt = ("0" + hh).slice(-2) + ":00"; } else txt = ("0" + (m % 60)).slice(-2);
      var tk = K.el("div", { class: "ks-tick k-num" + (isHour ? " is-hour" : ""), text: txt, style: { left: minToX(m) + "px" } });
      ruler.appendChild(tk); ticks.push(tk);
    }
    var chips = (o.flights || []).map(function (f) {
      var c = K.el("div", { class: "ks-chip is-" + (f.tone || "pink"), text: f.id, style: { left: minToX(f.min) + "px" } });
      lane.appendChild(c);
      return { el: c, id: f.id, min: f.min };
    });
    strip.appendChild(lane); strip.appendChild(ruler);
    main.appendChild(strip);

    var P = { el: el, bar: bar, title: title, tabs: tabs, badge: badge, clock: clock, nav: nav, main: main, clockBox: clockBox, cols: cols, chips: chips, ruler: ruler, ticks: ticks, lane: lane, strip: strip, minToX: minToX, body: body, capLabel: capLabel };
    P.pill = {
      el: pillEl, states: pillStates,
      /** crossfade to state k at time t (0.25 s) */
      set: function (tl, k, t) {
        Object.keys(pillStates).forEach(function (s) { tl.to(pillStates[s], { opacity: s === k ? 1 : 0, duration: 0.25, ease: "power2.inOut" }, t); });
        var ledCol = k === "S1" || k === "S2" ? C.terra : C.mint;
        tl.to(title.firstChild, { backgroundColor: ledCol, duration: 0.25 }, t);
      },
    };
    /** Change column i's capacity: value text via count plugin, restricted colouring (pink) and the red ATFM tag. */
    P.setAAR = function (tl, i, value, restricted, t, dur) {
      var c = cols[i]; dur = dur || 0.45;
      tl.to(c.aar, { count: { from: parseInt(c.aar.textContent, 10), to: value, fmt: "int" }, duration: dur, ease: "power2.inOut" }, t);
      tl.to(c.aar, { color: restricted ? C.pink : C.text, backgroundColor: restricted ? "#3D2A3A" : "#3C4350", duration: dur }, t);
      c.stripes.forEach(function (s, j) { tl.to(s, { backgroundColor: restricted ? C.pink : C.grey, duration: dur, delay: j * 0.02 }, t); });
      tl.to(c.tag, { backgroundColor: restricted ? C.red : "#4A525E", duration: dur }, t);
      return tl;
    };
    /** Slide chip i to a new minute (CTOT) over dur seconds and optionally relabel. */
    P.moveChip = function (tl, i, min, t, dur, label) {
      var c = chips[i];
      tl.to(c.el, { left: minToX(min) + "px", duration: dur || 0.6, ease: "power3.inOut" }, t);
      if (label) { tl.set(c.el, { textContent: label }, t + (dur || 0.6) / 2); }
      c.min = min;
      return tl;
    };
    return P;
  };
})();
