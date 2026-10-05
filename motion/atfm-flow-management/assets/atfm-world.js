/* ATFM v5 — shared map constants for c1 (intro) and c5 (outro), so the recap is the same map pixel for pixel.
 * World units = ATFM_MAP Mercator (origin lon 121 / lat 23.7). See STORYBOARD.md §0.4. Loaded after atfm-kit.js.
 */
(function () {
  var K = window.ATFM_KIT;
  var ROUTE_PTS = {
    R01: [[900, -215], [520, -140], [240, -85], [90, -58], [7.7, -50.2]],                                   // arrival into RCTP from ENE
    R02: [[-560, 420], [-380, 235], [-230, 118], [-116.1, 47], [-55, 16], [10, -2], [120, -20], [400, -45], [900, -95]], // transit SW → BPW → E
    SN: [[330, -640], [170, -360], [48, -160], [18, -95], [7.7, -50.2]],                                      // arrival from N
    SS: [[-21.6, 40.5], [-30, 100], [-26, 240], [0, 420]],                                                    // departure from RCKH southbound
    RH: [[-560, 420], [-380, 235], [-230, 118], [-116.1, 47], [-84, 13], [-44, -22], [7.7, -50.2]],          // hero (c5): BPW → strait → RCTP
  };
  var ROUTE = {};
  Object.keys(ROUTE_PTS).forEach(function (k) { ROUTE[k] = K.smooth(ROUTE_PTS[k]); });

  // ---------- REAL ATS routes (client-supplied; coordinates from CAA eAIP ENR 3.1 / OurAirports navaids) ----------
  // Both run SW → NE across the Taipei FIR. Boundary points (邊境點) sit on the FIR edges: ELATO/ENVAR on 117°30′E, BULAN/MOLKA on 124°E.
  // A1  : ELATO (邊境點) → MKG MAGONG VOR → APU ANBU VOR → BULAN (邊境點)   (BULAN–ELATO FL280+ is westbound-only → use A1 for arrivals/departures via APU)
  // M750: ENVAR (邊境點) → ANLOT → SANAS → MOLKA (邊境點)                   (eastbound transit; Y751 is the westbound pair)
  var dms = function (d, m, s) { return d + m / 60 + (s || 0) / 3600; };
  var FIX_LL = {
    ELATO: [117.5, dms(22, 20, 0)],        // 222000N 1173000E — Hong Kong/Taipei FIR boundary, compulsory reporting point
    MKG:   [119.637, 23.5954],              // Magong VOR-DME 115.2
    APU:   [121.522, 25.1769],              // Anbu (Anpu) VOR-DME 112.5
    BULAN: [124.0, dms(27, 5, 30)],         // 270530N 1240000E — Taipei/Fukuoka FIR boundary
    ENVAR: [117.5, dms(21, 59, 30)],        // 215930N 1173000E
    ANLOT: [dms(120, 29, 13), dms(23, 54, 26)], // 235426N 1202913E
    SANAS: [dms(121, 41, 32), dms(24, 53, 49)], // 245349N 1214132E
    MOLKA: [124.0, dms(26, 39, 31)],        // 263931N 1240000E
    RCTP:  [121.233, 25.078],
  };
  var FIX = {};
  Object.keys(FIX_LL).forEach(function (k) { FIX[k] = K.ll(FIX_LL[k][0], FIX_LL[k][1]); });
  /** Straight airway segments between fixes (how airways are charted). ext: world units to extend beyond each end (into neighbouring FIRs). */
  function airwayD(names, extStart, extEnd) {
    var pts = names.map(function (n) { return FIX[n]; });
    function ext(a, b, len) { var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); return [b[0] + (dx / L) * len, b[1] + (dy / L) * len]; }
    var out = pts.slice();
    if (extStart) out.unshift(ext(pts[1], pts[0], extStart));
    if (extEnd) out.push(ext(pts[pts.length - 2], pts[pts.length - 1], extEnd));
    return "M" + out.map(function (p) { return (Math.round(p[0] * 10) / 10) + " " + (Math.round(p[1] * 10) / 10); }).join("L");
  }
  var AIRWAY = {
    A1:   { fixes: ["ELATO", "MKG", "APU", "BULAN"], d: airwayD(["ELATO", "MKG", "APU", "BULAN"], 0, 0), dExt: airwayD(["ELATO", "MKG", "APU", "BULAN"], 260, 260), boundary: ["ELATO", "BULAN"] },
    M750: { fixes: ["ENVAR", "ANLOT", "SANAS", "MOLKA"], d: airwayD(["ENVAR", "ANLOT", "SANAS", "MOLKA"], 0, 0), dExt: airwayD(["ENVAR", "ANLOT", "SANAS", "MOLKA"], 260, 260), boundary: ["ENVAR", "MOLKA"] },
    // arrival into Taoyuan along A1 from the SW (ELATO → MKG → APU) then the short final to RCTP; and from the NE (BULAN → APU → RCTP)
    A1_ARR_SW: { fixes: ["ELATO", "MKG", "APU", "RCTP"], d: airwayD(["ELATO", "MKG", "APU", "RCTP"], 260, 0) },
    A1_ARR_NE: { fixes: ["BULAN", "APU", "RCTP"], d: airwayD(["BULAN", "APU", "RCTP"], 260, 0) },
  };
  // CTOT (計算起飛時間) cooperation partners named by the client — for the relay / outro copy:
  var CTOT_PARTNERS = ["日本", "香港", "韓國", "菲律賓", "泰國", "新加坡", "越南"];
  window.ATFM_WORLD = {
    FIX_LL: FIX_LL, FIX: FIX, AIRWAY: AIRWAY, CTOT_PARTNERS: CTOT_PARTNERS,
    PT: {
      RCTP: [7.7, -50.2], RCKH: [-21.6, 40.5],
      BPW: [-116.1, 47.0],          // boundary point on the FIR west edge, 117.5°E 22.4°N (open sea)
      // FIR = official CAA eAIP ENR 2.1 polygon: west x −116.06, east x 99.48, north y −196.24, south y 96.82,
      // SE cut from (16.58, 96.82) to (99.48, 7.24). X_* are where the routes cross it.
      TWC: [1, 3], FIR_SE: [99.48, 7.24],
      X_N: [69.67, -196.24], X_E1: [99.5, -59.45], X_E2: [99.5, -17.6], X_S: [-29.9, 96.8],
    },
    ROUTE_PTS: ROUTE_PTS,
    ROUTE: ROUTE,
    // reference fractions (assert with K.fracAt at build time, ±0.002)
    FRAC: { R02_BPW: 0.3611, R01_FIR: 0.8985, R02_FIR_EXIT: 0.5019, RH_BPW: 0.7854 },
    CAM: {
      F0: { cx: -20, cy: -40, z: 1.0 }, F0d: { cx: -14, cy: -42, z: 1.04 }, F1: { cx: -8, cy: -50, z: 1.9 },
      // v2 (real-airway rework): tighter opening so the FIR + both airways read at once (FIR x 817–1108, y 336–731)
      F0_v2: { cx: -10, cy: -45, z: 1.35 }, F0d_v2: { cx: -6, cy: -47, z: 1.4 },
      F2: { cx: -120.87, cy: -75.91, z: 4.2 }, F2z: { cx: -102.5, cy: -72.24, z: 4.9 },
      S: { cx: 0, cy: 39.7, z: 3.0 }, B: { cx: -5, cy: -45, z: 1.6 }, FB: { cx: -2, cy: -46, z: 1.72 }, FBp: { cx: 0, cy: -47, z: 1.78 },
    },
    STYLE: {
      R01: { stroke: "#1F6B62", width: 5 }, R02: { stroke: "#1F6B62", width: 5 },
      SN: { stroke: "#3E8C80", width: 3 }, SS: { stroke: "#3E8C80", width: 3 },
      RH: { stroke: "#1F6B62", width: 4 }, HERO: { stroke: "#3E8C80", width: 7, opacity: 0.5 },
    },
    /** Build a route <path> (non-scaling stroke, round caps) for key in ROUTE. */
    routePath: function (key, id, styleKey) {
      var st = this.STYLE[styleKey || key];
      return K.s("path", { id: id, d: ROUTE[key], fill: "none", stroke: st.stroke, "stroke-width": String(st.width), "stroke-linecap": "round", "stroke-linejoin": "round", "vector-effect": "non-scaling-stroke", opacity: st.opacity == null ? null : String(st.opacity) });
    },
  };
})();
