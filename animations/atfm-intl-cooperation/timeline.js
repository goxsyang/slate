// Shot choreography: "In -> Absorb -> Out -> Together", opening and closing on the Taipei FIR.
// Word onsets in the narration (s): 對外 0.05 · 我們 1.12 · 汲 1.65 · 歐 2.12 · 美 2.50 · ATFM 4.12 · 並 6.60 · 拓展 6.82
//   版圖 ends 8.35 · 與 9.72 · 日本 9.90 · 韓國 10.70 · 菲律賓 11.50 · 泰國 12.40 · 新加坡 13.22 · 等國家 13.88
//   一同 14.85 · 執行 15.22 · ATFM 15.78 · 措施 16.92
// Colours carry meaning: green = Europe/US (sources of ATFM know-how), gold = Taiwan / Taipei FIR,
// navy + periwinkle = cooperation partners. Mainland China is never labelled, filled or tinted.
(() => {
const { seg, env, bump, keyed, lerp, clamp01, ppd, toScreen } = E;
const DURATION = 17.4174;
const C = {
  gold: '#996a0c', goldLine: '#c2a76f', twFace: '#e3cc94', twFlash: '#d9b25e', twSide: '#b8933f', twShadow: '#5c4208', twGlow: '#e8c56a',
  green: '#1f6e5c', jade: '#93bfae', jadeFlash: '#6fae96',
  navy: '#354e99', peri: '#a4c0d9', periFlash: '#7fabdc', periSide: '#c9bdaa', periLine: '#5f7499', periShadow: '#5a4e3c',
};
const mix = (a, b, p) => d3.interpolateRgb(a, b)(p);

E.setProjection(d3.geoMercator().rotate([-135, 0]));
const K = [
  { t: 0.00, center: [121.3, 24.6], ppd: 74 },
  { t: 0.70, center: [121.3, 24.6], ppd: 77, ease: 'sineInOut' },      // 4% breath on the Taipei FIR
  { t: 2.30, center: [136.0, 19.35], ppd: 5.7, ease: 'sineInOut' },    // pull-out to the world (Europe..US whole)
  { t: 6.45, center: [136.0, 19.6], ppd: 5.86, ease: 'sineInOut' },    // slow world drift
  { t: 8.60, center: [122.0, 16.8], ppd: 14.5, ease: 'inOut' },        // dive to the Asia-Pacific (Hokkaido in frame)
  { t: 15.45, center: [122.0, 16.8], ppd: 14.75, ease: 'sineInOut' },   // slow push, at rest for the final ~2 s hold
];
E.setCamera(K);
const zf = () => Math.max(0.5, Math.min(1, ppd() / 30));

const TW = [120.95, 23.75], EU = [10.4, 50.6], US = [-98.5, 39.5];
const FIR = [[124, 23.5], [121.5, 21], [117.5, 21], [117.5, 29], [124, 29]];
const twS = () => toScreen(TW);

// FIR outline in screen space (dense) + crossing helper
const firDense = (() => { const r = [...FIR, FIR[0]], out = []; for (let i = 0; i < r.length - 1; i++) { const it = d3.geoInterpolate(r[i], r[i + 1]); for (let j = 0; j < 24; j++) out.push(it(j / 24)); } out.push(r[r.length - 1]); return out; })();
const firScreen = () => firDense.map(toScreen);
const inPoly = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
const bez = (a, c, b, u) => { const v = 1 - u; return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]]; };
// distance from the hub end of an arc to where it leaves the FIR (matches engine arc geometry)
function firExit(from, to, k, hubIsFrom) {
  const A = toScreen(from), B = toScreen(to), dx = B[0] - A[0], dy = B[1] - A[1];
  const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], Cc = [M[0] + dy * k, M[1] - dx * k];
  const poly = firScreen();
  for (let i = 0; i <= 400; i++) {
    const u = hubIsFrom ? i / 400 : 1 - i / 400, q = bez(A, Cc, B, u);
    if (!inPoly(q, poly)) { const H = hubIsFrom ? A : B; return { d: Math.hypot(q[0] - H[0], q[1] - H[1]), q, u }; }
  }
  return { d: 0, q: hubIsFrom ? A : B, u: hubIsFrom ? 0 : 1 };
}

// ---------- Europe + USA (knowledge sources, flat jade) ----------
E.defineGroup('EUR', ['040','056','100','191','196','203','208','233','246','250','276','300','348','372','380','428','440','442','470','528','616','620','642','703','705','724','752','826','578','756','352','008','070','499','807','688','n:Kosovo','crimea','n:N. Cyprus','498','804','438','020','492','674'],
  c => c[0] > -25 && c[0] < 45 && c[1] > 34.5 && c[1] < 72);
const srcOut = t => 1 - seg(t, 6.45, 6.80);
E.fill('EUR', t => ({ color: mix(C.jadeFlash, C.jade, seg(t, 2.12, 2.92)), opacity: t >= 2.10 ? 1 : 0, reveal: seg(t, 2.10, 2.55, 'inOut'), origin: EU, stroke: '#ffffff', strokeWidth: 1 }));
E.fill('840', t => ({ color: mix(C.jadeFlash, C.jade, seg(t, 2.50, 3.30)), opacity: t >= 2.48 ? 1 : 0, reveal: seg(t, 2.48, 2.98, 'inOut'), origin: US, stroke: '#ffffff', strokeWidth: 1 }));
E.pin({ at: EU, color: C.green, t0: 2.12, pulseR: 40, opacity: t => (t >= 2.12 ? 1 : 0) * (1 - seg(t, 6.45, 6.95)) });
E.pin({ at: US, color: C.green, t0: 2.50, pulseR: 40, opacity: t => (t >= 2.50 ? 1 : 0) * (1 - seg(t, 6.45, 6.95)) });
E.card({ zh: '歐洲', en: 'Europe', color: C.green, at: EU, t0: 2.18, enter: [0, -12], pos: q => [q[0] - 20, q[1] + 105],
  opacity: t => seg(t, 2.18, 2.53, 'out') * srcOut(t) });
E.card({ zh: '美國', en: 'United States', color: C.green, at: US, t0: 2.56, enter: [0, -12], pos: (q, w) => [q[0] + 20 - w, q[1] + 80],
  opacity: t => seg(t, 2.56, 2.91, 'out') * srcOut(t) });
const inOp = t => (t >= 2.85 ? 1 : 0) * (1 - seg(t, 6.45, 7.00));
const pEU = [0, 1, 2, 3].map(i => ({ t0: 4.40 + 0.40 * i, dur: 1.10, dir: 1, ease: 'linear', r: 5 }));
const pUS = [0, 1, 2, 3].map(i => ({ t0: 4.55 + 0.40 * i, dur: 1.20, dir: 1, ease: 'linear', r: 5 }));
E.arc({ from: EU, to: TW, color: C.green, width: 3, bulge: 0.22, draw: t => seg(t, 2.85, 4.35), opacity: inOp, maskFrom: 13, maskTo: () => firExit(EU, TW, 0.22, false).d, particles: pEU });
E.arc({ from: US, to: TW, color: C.green, width: 3, bulge: -0.22, draw: t => seg(t, 3.00, 4.45), opacity: inOp, maskFrom: 13, maskTo: () => firExit(US, TW, -0.22, false).d, particles: pUS });

// ---------- cooperation ellipse (sea-only wash) ----------
const ELL = { center: [118.31, 21.2], a: 525.1, b: 247.7, rot: -47.5 };
const ellDraw = t => seg(t, 7.35, 8.85, 'inOut');
// layer 'over': above the lifted slabs, so the ring is never broken; the wash stays sea-only under the land
E.ellipse({ ...ELL, layer: 'over', color: C.navy, width: 2.5, start: 180, draw: ellDraw, seaOnly: true,
  opacity: t => t >= 7.35 ? 1 : 0, scale: t => lerp(0.92, 1, seg(t, 7.35, 8.85, 'out')),
  fillOpacity: t => 0.08 * seg(t, 8.40, 9.00) + 0.05 * bump(t, 13.95, 14.60) + 0.02 * seg(t, 14.85, 15.30),
  outer: { d: 10, opacity: t => 0.45 * seg(t, 8.50, 9.00) },
  ticks: { n: 64, long: 8, lenLong: 13, lenShort: 7, gap: 15, opacity: 0.5,
    alpha: (i, t) => (i / 64 <= ellDraw(t) ? 1 : 0),
    boost: (i, t) => { const x = seg(t, 13.95, 14.75, 'linear'); if (x <= 0 || x >= 1) return 0; const d = Math.abs(((i / 64 - x) % 1 + 1.5) % 1 - 0.5); return d < 0.06 ? 8 * (1 - d / 0.06) : 0; } },
  ripples: [{ t0: 13.95, t1: 14.80, s1: 1.10, o0: 0.6 }] });

// ---------- Taiwan ----------
// gold glow around Taiwan, painted under the land so it only tints the sea (never the mainland coast)
E.underLandHooks.push((ctx, t) => {
  const op = 0.45 * Math.max(bump(t, 4.35, 5.15), bump(t, 6.75, 7.55));
  if (op <= 0.001) return;
  const q = toScreen(TW), r = 50 + 30 * seg(t, 6.75, 7.4);
  const g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], r);
  g.addColorStop(0, C.twGlow); g.addColorStop(1, 'rgba(232,197,106,0)');
  ctx.globalAlpha = op; ctx.fillStyle = g; ctx.fillRect(q[0] - r, q[1] - r, 2 * r, 2 * r);
});
E.lift('158', t => ({
  color: mix(C.twFlash, C.twFace, seg(t, 0.05, 0.85)), side: C.twSide, stroke: C.gold, strokeWidth: 1.4, shadowColor: C.twShadow, shadowAlpha: 0.3,
  minLevel: 3, // full detail, so Penghu, Green Island, Lanyu, Kinmen and Matsu never drop out
  opacity: seg(t, 0.05, 0.20, 'out'), reveal: seg(t, 0.05, 0.50, 'out'), origin: TW,
  lift: zf() * (keyed(t, [[0.05, 0], [0.55, 8, 'backOutSoft']]) + 5 * bump(t, 4.35, 4.95) + 6 * bump(t, 6.75, 7.30) + 6 * bump(t, 14.85, 15.40)),
}));
E.ripple({ at: TW, color: C.gold, t0: 0.15, t1: 1.25, r0: 14, r1: 240, o0: 0.45, width: 2 });
E.ripple({ at: TW, color: C.gold, t0: 4.38, t1: 5.15, r0: 12, r1: 70, o0: 0.6, width: 2 });
E.ripple({ at: TW, color: C.navy, t0: 6.85, t1: 7.85, r0: 12, r1: 420, o0: 0.6, width: 2.5 });
E.ripple({ at: TW, color: C.navy, t0: 7.10, t1: 8.10, r0: 12, r1: 420, o0: 0.4, width: 2.5 });
E.ripple({ at: TW, color: C.gold, t0: 14.85, t1: 15.55, r0: 10, r1: 46, o0: 0.6, width: 2 });

// FIR polygon (gold), drawn in the opening; diamonds = where partner arcs leave it
const P = [
  { id: '392', zh: '日本', en: 'Japan', at: [138.3, 36.3], on: 9.90, bulge: -0.12, glyph: { minFrac: 0.02, drop: [[122, 20, 132, 30.6], [139, 20, 155, 31]] } },
  { id: '410', zh: '韓國', en: 'Korea', at: [127.9, 36.4], on: 10.70, bulge: -0.10 },
  { id: '608', zh: '菲律賓', en: 'Philippines', at: [121.1, 15.9], on: 11.50, bulge: 0.25 },
  { id: '764', zh: '泰國', en: 'Thailand', at: [100.9, 15.6], on: 12.40, bulge: 0.12 },
  { id: '702', zh: '新加坡', en: 'Singapore', at: [103.82, 1.35], on: 13.22, bulge: 0.10 },
];
P.forEach(p => { p.a0 = p.on - 0.45; });
E.poly({ coords: FIR, closed: true, color: C.gold, width: t => lerp(2.5, 5.5, clamp01((ppd() - 6.5) / 35)), draw: t => seg(t, 0.15, 1.05, 'inOut'), opacity: t => t >= 0.15 ? 1 : 0, fillOpacity: 0,
  inner: { d: 6, color: C.goldLine, width: 1.6, opacity: t => clamp01((ppd() - 12) / 20) } }); // heavy gold rule + pale inner rule, as in episode 1
// handoff diamonds (custom: position recomputed per frame where each arc exits the FIR)
const dGroup = E.el('g', {}, document.getElementById('over'));
const dias = P.map(() => E.el('rect', { x: -5, y: -5, width: 10, height: 10, fill: C.gold, stroke: '#fff', 'stroke-width': 1.5 }, dGroup));
E.custom(t => P.forEach((p, i) => {
  const sc = seg(t, p.a0, p.a0 + 0.25, 'backOut') * (1 + 0.5 * bump(t, 14.85, 15.35));
  if (sc <= 0.01) { dias[i].setAttribute('opacity', 0); return; }
  const q = firExit(TW, p.at, p.bulge, true).q;
  E.setA(dias[i], { opacity: 1, transform: `translate(${q[0].toFixed(1)},${q[1].toFixed(1)}) rotate(45) scale(${sc})` });
}));
const twPinScale = t => lerp(1, 0.5, seg(t, 0.70, 2.30)); // small on the world map so the gold island still shows
E.pin({ at: TW, color: C.gold, t0: 0.10, pulseR: 46, pulseDur: 0.8, scale: twPinScale });

// Taiwan card: right of the FIR in the close-up, glides to its world and Asia spots
const twGlyph = { key: '158', fill: C.twFace, stroke: C.gold, bg: 'transparent', drop: [[117, 23.5, 120.2, 27]], pad: 3 };
const firE = () => toScreen([124, 23.5])[0];
const TWPOS = { close: [34, 0], world: [22, 50], asia: [24, 34] };
const twCard = E.card({ zh: '臺灣', en: 'Taiwan', color: C.gold, at: TW, t0: 0.25, glyph: twGlyph, leader: { t0: 0.20, t1: 0.35, pinR: t => 11 * twPinScale(t) },
  pos: (q, w, h, t) => {
    const a = seg(t, 0.70, 2.30, 'sineInOut'), b = seg(t, 6.45, 8.60, 'inOut');
    const gx = lerp(lerp(TWPOS.close[0], TWPOS.world[0], a), TWPOS.asia[0], b), gy = lerp(lerp(TWPOS.close[1], TWPOS.world[1], a), TWPOS.asia[1], b);
    return [firE() + gx, q[1] - h / 2 + gy];
  } });
twCard.style.zIndex = 3; // the green card flies into Taiwan underneath this card, never over its text

// green big card, stacked under Taiwan's card, absorbed into Taiwan
E.bigCard({ title: 'ATFM', lines: ['汲取歐美先進', '觀念與實務經驗'], color: C.green,
  pos: t => { const q = twS(); return [firE() + 22, q[1] + 128]; },
  enter: { t0: 4.15, t1: 4.65, dx: 0, dy: 24 }, panel: [4.40, 4.95], lineIn: [[4.55, 4.95], [4.95, 5.35]],
  absorb: { t0: 6.35, t1: 6.90, ease: 'inOut', fadeAt: 6.72, to: twS } }); // flies into Taiwan, fades only at the end

// PARTNERS card -> |PARTNERS wordmark
const SLOT = [1350, 652], SLOT_P = [1206, 652], MARK = [1310, 376];
E.bigCard({ title: 'PARTNERS', lines: ['拓展國際合作版圖'], color: C.navy, pos: () => SLOT_P,
  enter: { t0: 7.15, t1: 7.60, dx: 0, dy: 24 }, panel: [7.35, 7.80], lineIn: [[7.45, 8.05]],
  collapse: { t0: 9.00, t1: 9.60, to: MARK, size: 92, lineH: 100 } });
E.bigCard({ title: 'ATFM', lines: ['與各國一同執行', '飛航流量管理措施'], color: C.navy, pos: () => SLOT,
  enter: { t0: 14.95, t1: 15.45, dx: 0, dy: 24 }, panel: [15.15, 15.70], lineIn: [[15.25, 15.60], [15.55, 15.95]] });

// ---------- partners ----------
const PPOS = {
  '392': (q, w, h) => [q[0] + 76, q[1] + 22],
  '410': (q, w, h) => [q[0] - 40 - w, q[1] - h / 2],
  '608': (q, w, h) => [q[0] + 92, q[1] - 10],
  '764': (q, w, h) => [q[0] - 96 - w, q[1] - h / 2],
  '702': (q, w, h) => [q[0] - 64 - w, q[1] - h / 2],
};
P.forEach((p, j) => {
  const parts = [0, 1, 2, 3].map(m => ({ t0: 14.90 + 0.05 * j + 0.45 * m, dur: 0.9, dir: m % 2 ? -1 : 1, ease: 'sineInOut', r: 4.5, color: m % 2 ? C.gold : C.navy }));
  E.arc({ from: TW, to: p.at, color: C.navy, width: t => 2.5 + 1.0 * seg(t, 14.85, 15.25), bulge: p.bulge, draw: t => seg(t, p.a0, p.on, 'inOut'), opacity: t => t >= p.a0 ? 1 : 0,
    maskFrom: () => firExit(TW, p.at, p.bulge, true).d, maskTo: p.id === '702' ? 12 : 12, particles: parts });
  E.lift(p.id, t => ({
    color: mix(C.periFlash, C.peri, seg(t, p.on, p.on + 0.8)), side: C.periSide, stroke: C.periLine, strokeWidth: 1.0, shadowColor: C.periShadow, shadowAlpha: 0.3,
    opacity: t >= p.on ? 1 : 0, reveal: seg(t, p.on, p.on + 0.35, 'out'), origin: p.at,
    lift: keyed(t, [[p.on, 0], [p.on + 0.35, 10, 'backOutSoft'], [p.on + 0.95, 6]]) + 5 * bump(t, 14.85, 15.40),
  }));
  E.pin({ at: p.at, color: C.navy, t0: p.on, pulseR: 40, pulseDur: 0.7 });
  E.ripple({ at: p.at, color: C.navy, t0: 14.85, t1: 15.55, r0: 10, r1: 40, o0: 0.55, width: 2 });
  E.card({ zh: p.zh, en: p.en, color: C.navy, at: p.at, t0: p.on + 0.05, pos: PPOS[p.id], enter: ['410', '764', '702'].includes(p.id) ? [14, 0] : [-14, 0], leader: { pinR: p.id === '702' ? 28 : 11 },
    glyph: { key: p.id, fill: C.peri, stroke: C.navy, bg: 'transparent', pad: 3, ...(p.glyph || {}) } });
});
document.getElementById('over').appendChild(dGroup); // handoff diamonds sit on top of the arc ends
E.ring({ at: [103.82, 1.35], color: C.navy, r: 24, width: 2, draw: t => seg(t, 13.22, 13.57), opacity: t => t >= 13.22 ? 1 : 0,
  ticks: { n: 36, len: 4, gap: 3, opacity: t => 0.5 * seg(t, 13.42, 13.72) } });

window.boot(DURATION);
})();
