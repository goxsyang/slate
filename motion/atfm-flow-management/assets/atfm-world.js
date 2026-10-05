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
  window.ATFM_WORLD = {
    PT: {
      RCTP: [7.7, -50.2], RCKH: [-21.6, 40.5],
      BPW: [-116.1, 47.0],          // boundary point on the FIR west edge, 117.5°E 22.4°N (open sea)
      TWC: [1, 3], FIR_SE: [99.5, 14.5],
      X_N: [23.8, -112.2], X_E1: [99.5, -59.45], X_E2: [99.5, -17.6], X_S: [-29.9, 96.8],
    },
    ROUTE_PTS: ROUTE_PTS,
    ROUTE: ROUTE,
    // reference fractions (assert with K.fracAt at build time, ±0.002)
    FRAC: { R02_BPW: 0.3611, R01_FIR: 0.8985, R02_FIR_EXIT: 0.5019, RH_BPW: 0.7854 },
    CAM: {
      F0: { cx: -20, cy: -40, z: 1.0 }, F0d: { cx: -14, cy: -42, z: 1.04 }, F1: { cx: -8, cy: -50, z: 1.9 },
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
