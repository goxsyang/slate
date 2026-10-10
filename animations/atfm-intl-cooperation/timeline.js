// Shot choreography, synced to the narration (seconds):
//   0.00 對外 · 1.20–3.90 我們汲取歐美國際先進的 · 4.20–6.00 ATFM 觀念與實務經驗 · 6.60–8.80 並拓展國際合作版圖
//   9.80 與日本 · 10.80 韓國 · 11.60 菲律賓 · 12.40 泰國 · 13.20 新加坡 · 14.20 等國家 · 14.80–17.10 一同執行 ATFM 措施
(() => {
const { seg, env, bump, keyed, lerp, clamp01, ppd, toScreen } = E;
const DURATION = 17.4174;

const C = {
  gold: '#996a0c', goldFill: '#e3cc94', goldSide: '#a8843a', goldShadow: '#5c4208', goldGlow: '#e8c77a', goldBg: '#f5eedc',
  green: '#1f6e5c', greenFill: '#a9cbbf', greenSide: '#6f9c8d', greenShadow: '#1f4a3e',
  navy: '#354e99', blue: '#a4c0d9', blueSide: '#8aa5c4', blueShadow: '#24365e', blueBg: '#eef1f4',
};

// Pacific-centred Mercator: Taiwan mid-frame, Europe left, the US right; the seam (40°W) is never on screen.
E.setProjection(d3.geoMercator().rotate([-140, 0]));
E.setCamera([
  { t: 0.0, center: [123.4, 23.7], ppd: 58 },                   // K0 Taiwan close-up
  { t: 0.4, center: [123.4, 23.7], ppd: 58 },
  { t: 2.4, center: [142.0, 20.0], ppd: 5.90, ease: 'inOut' },  // K1 world
  { t: 6.55, center: [141.5, 20.5], ppd: 6.05, ease: 'sineInOut' }, // K1b slow drift
  { t: 8.9, center: [123.5, 21.6], ppd: 16.0, ease: 'inOut' },  // K2 Asia-Pacific
  { t: DURATION, center: [123.3, 21.4], ppd: 16.3, ease: 'sineInOut' }, // K3 slow push, lands at rest
]);

const HUB = [120.96, 23.70];
const hubR = () => Math.max(30, 2.2 * ppd());

// ---------- Europe & the United States: where the ATFM know-how comes from ----------
E.defineGroup('EUROPE',
  ['008', '040', '056', '070', '100', '191', '196', '203', '208', '233', '246', '250', '276', '300', '348', '352', '372', '380', '428', '438', '440',
   '442', '470', '498', '499', '528', '578', '616', '620', '642', '688', '703', '705', '724', '752', '756', '807', '826', '804', '020', 'n:Kosovo'],
  ([lon, lat]) => lon > -25 && lon < 45 && lat > 34 && lat < 72); // drop overseas territories
const EU_PIN = [12.0, 49.0], US_PIN = [-98.5, 39.5];
const sourceOut = t => 1 - seg(t, 6.25, 6.60, 'in');
for (const [key, pinAt, T] of [['EUROPE', EU_PIN, 2.05], ['840', US_PIN, 2.40]]) {
  E.lift(key, t => ({
    color: C.greenFill, side: C.greenSide, shadowColor: C.greenShadow, shadowAlpha: 0.25 * seg(t, T, T + 0.45),
    lift: 2 * seg(t, T, T + 0.4, 'backOut'), reveal: seg(t, T, T + 0.45, 'out'), origin: pinAt, strokeWidth: 0.75,
  }));
}
E.pin({ at: EU_PIN, color: C.green, t0: 2.10, opacity: t => (t >= 2.10 ? 1 : 0) * sourceOut(t) });
E.pin({ at: US_PIN, color: C.green, t0: 2.45, opacity: t => (t >= 2.45 ? 1 : 0) * sourceOut(t) });
E.card({ zh: '歐洲', en: 'Europe', color: C.green, at: EU_PIN, t0: 2.20, enter: [0, -14],
  pos: (q) => [q[0] - 116, q[1] + 54], opacity: t => seg(t, 2.20, 2.55, 'out') * sourceOut(t), leader: { t0: 2.15, t1: 2.30 } });
E.card({ zh: '美國', en: 'United States', color: C.green, at: US_PIN, t0: 2.55, enter: [0, -14],
  pos: (q) => [q[0] - 126, q[1] + 49], opacity: t => seg(t, 2.55, 2.90, 'out') * sourceOut(t), leader: { t0: 2.50, t1: 2.65 } });

// knowledge arcs into Taiwan, with green particles arriving on "ATFM"
const arcsOut = t => 1 - seg(t, 6.25, 6.70, 'in');
const inbound = (t0) => Array.from({ length: 7 }, (_, i) => ({ t0: t0 + 0.4 * i, dur: 0.95, color: C.green }));
E.arc({ from: EU_PIN, to: HUB, color: C.green, width: 2.5, bend: 'up', bulge: 0.24, maskTo: hubR,
  draw: t => seg(t, 2.60, 3.50), opacity: arcsOut, particles: inbound(3.10) });
E.arc({ from: US_PIN, to: HUB, color: C.green, width: 2.5, bend: 'up', bulge: 0.24, maskTo: hubR,
  draw: t => seg(t, 2.85, 3.75), opacity: arcsOut, particles: inbound(3.25) });

// ---------- the cooperation ellipse, growing out of Taiwan ----------
const NT = 120;
E.ellipse({
  center: HUB, a: 567.23, b: 316.34, rot: -50.7, color: C.navy, start: 0, seaOnly: true,
  opacity: t => (t >= 6.85 ? 1 : 0),
  scale: t => lerp(0.15, 1, seg(t, 6.85, 8.75, 'out')),
  draw: t => seg(t, 6.85, 8.45, 'inOut'),
  width: 2.5,
  fillOpacity: t => 0.08 * seg(t, 6.85, 8.45) + 0.04 * seg(t, 13.95, 14.30),
  ticks: { n: NT, long: 10, lenLong: 11, lenShort: 6, gap: 9, opacity: 0.45,
    alpha: (i, t) => seg(t, 8.20 + 0.55 * i / NT, 8.35 + 0.55 * i / NT, 'out'),
    boost: (i, t) => 4 * bump(t, 13.95 + 0.5 * i / NT, 14.20 + 0.5 * i / NT) },
  outer: { d: 6, opacity: t => 0.3 * seg(t, 8.40, 8.90) },
  ripples: [{ t0: 13.92, t1: 14.72, s1: 1.10, o0: 0.55 }, { t0: 14.22, t1: 15.02, s1: 1.10, o0: 0.55 }],
});

// ---------- Taiwan: the hub everything connects to ----------
E.glow({ at: HUB, color: C.goldGlow, r: t => 1.15 * hubR(),
  opacity: t => 0.35 * seg(t, 0.10, 0.50) + 0.25 * bump(t, 6.85, 7.55) + 0.2 * bump(t, 15.20, 15.60) + 0.1 * seg(t, 15.4, 15.6) });
const twLift = t => {
  const settled = clamp01((0.17 * ppd() - 4) / 6) * 6 + 4; // 4..10 px with zoom
  return settled * seg(t, 0.05, 0.45, 'backOut') + finaleLift(t);
};
const finaleLift = t => t < 14.85 ? 0 : t < 15.15 ? 5 * seg(t, 14.85, 15.15, 'backOut') : lerp(5, 2, seg(t, 15.15, 15.35, 'sineInOut'));
E.lift('158', t => ({
  color: C.goldFill, side: C.goldSide, shadowColor: C.goldShadow, shadowAlpha: 0.30 * seg(t, 0.05, 0.45) + (t > 14.85 ? 0.08 : 0),
  lift: twLift(t), reveal: seg(t, 0.05, 0.50, 'out'), origin: HUB, stroke: C.gold, strokeWidth: 1.25,
}));
const diamondFlash = t => 1 + 0.4 * bump(t, 4.05, 4.35) + 0.4 * bump(t, 15.20, 15.60);
E.ring({ at: HUB, r: hubR, color: C.gold, width: 2, draw: t => seg(t, 0.10, 0.55),
  ticks: { n: 72, len: 5, gap: 4, opacity: t => 0.5 * seg(t, 0.30, 0.60) },
  diamonds: { angles: [45, 135, 225, 315], size: 7, scale: t => seg(t, 0.45, 0.60, 'backOut') * diamondFlash(t) } });
E.ripple({ at: HUB, color: C.gold, t0: 2.20, t1: 2.90, r0: hubR, r1: t => hubR() + 40, o0: 0.6 });
E.ripple({ at: HUB, color: C.gold, t0: 4.05, t1: 4.80, r0: hubR, r1: t => hubR() + 46, o0: 0.7 });
E.ripple({ at: HUB, color: C.gold, t0: 6.85, t1: 7.55, r0: hubR, r1: t => hubR() + 46, o0: 0.7 });
const twCardPos = (q) => [toScreen(HUB)[0] + hubR() + 55, toScreen(HUB)[1] - 16];
E.card({ zh: '臺灣', en: 'Taiwan', color: C.gold, at: HUB, t0: 0.20, inDur: 0.35, pos: twCardPos,
  leader: { t0: 0.15, t1: 0.30, pinR: hubR }, // drawn from the ring edge
  glyph: { key: '158', fill: C.goldFill, stroke: C.gold, bg: C.goldBg, draw: [0.30, 0.55], fillIn: [0.45, 0.65] } });

// green "learned from Europe & the US" card, stacked under Taiwan's card, then absorbed into Taiwan
E.bigCard({ title: 'ATFM', lines: ['汲取歐美先進', '觀念與實務經驗'], color: C.green, width: 480,
  pos: t => { const p = twCardPos(); return [p[0], p[1] + 122]; },
  enter: { t0: 3.95, t1: 4.30, dy: 20 }, panel: [4.30, 4.70], lineIn: [[4.40, 4.75], [4.55, 4.90]],
  absorb: { t0: 6.25, t1: 6.85, to: () => toScreen(HUB) } });

// ---------- partners: each silhouette is the hero on its spoken name ----------
const PARTNERS = [
  { key: '392', zh: '日本', en: 'Japan', pin: [138.0, 36.2], T: 9.90, arc: [9.45, 9.95], bulge: 0.12, lift: 7, settle: 4,
    pos: q => [q[0] + 98, q[1] - 50], enter: [-14, 0] },
  { key: '410', zh: '韓國', en: 'Korea', pin: [127.8, 36.3], T: 10.70, arc: [10.30, 10.72], bulge: 0.15, lift: 5, settle: 3,
    pos: q => [q[0] - 94, q[1] - 150], enter: [0, 14] },
  { key: '608', zh: '菲律賓', en: 'Philippines', pin: [121.2, 15.2], T: 11.50, arc: [11.20, 11.52], bulge: 0.20, lift: 7, settle: 4,
    pos: q => [q[0] + 127, q[1] - 8], enter: [-14, 0] },
  { key: '764', zh: '泰國', en: 'Thailand', pin: [101.0, 15.5], T: 12.38, arc: [11.95, 12.40], bulge: 0.15, lift: 7, settle: 4,
    pos: (q, w) => [q[0] - 78 - w, q[1] - 43], enter: [14, 0] },
  { key: '702', zh: '新加坡', en: 'Singapore', pin: [103.82, 1.35], T: 13.20, arc: [12.75, 13.22], bulge: 0.12, lift: 0, settle: 0,
    pos: (q, w) => [q[0] - 65 - w, q[1] - 72], enter: [14, 0] },
];
// arc lengths at the final framing set the finale particle travel times
const camAt16 = E.cameraAt(16);
const arcLen = (a, b, bulge) => {
  const pa = E.projection(a), pb = E.projection(b);
  const L = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) * camAt16.k;
  return L * (1 + 8 / 3 * bulge * bulge); // quadratic Bezier length, small-bulge approximation
};
PARTNERS.forEach((p, j) => {
  const T = p.T;
  const flow = [];
  const travel = Math.min(1.3, Math.max(0.45, arcLen(HUB, p.pin, p.bulge) / 380));
  for (let n = 0; 14.90 + 0.12 * j + 0.80 * n <= 16.40; n++) {
    const t0 = 14.90 + 0.12 * j + 0.80 * n;
    flow.push({ t0, dur: travel, dir: 1, color: C.navy });
    if (t0 + 0.4 + travel < 17.25) flow.push({ t0: t0 + 0.40, dur: travel, dir: -1, color: C.gold });
  }
  E.arc({ from: HUB, to: p.pin, color: C.navy, bulge: p.bulge, maskFrom: hubR, maskTo: p.key === '702' ? 0 : 11,
    width: t => lerp(2.25, 3, seg(t, 14.85, 15.05)), opacity: t => (t >= p.arc[0] ? 1 : 0) * lerp(0.9, 1, seg(t, 14.85, 15.05)),
    draw: t => seg(t, p.arc[0], p.arc[1], 'inOut'), particles: flow, headR: 4 });
  if (p.lift > 0) {
    E.lift(p.key, t => {
      const up = p.lift * seg(t, T, T + 0.40, 'backOut'), settle = (p.lift - p.settle) * seg(t, T + 0.40, T + 0.90, 'sineInOut');
      return {
        color: C.blue, side: C.blueSide, shadowColor: C.blueShadow,
        shadowAlpha: 0.32 * seg(t, T, T + 0.4) - 0.10 * seg(t, T + 0.4, T + 0.9) + (t > 14.85 ? 0.08 : 0),
        lift: up - settle + finaleLift(t), reveal: seg(t, T, T + 0.45, 'out'), origin: p.pin,
        stroke: '#ffffff', strokeWidth: 1.25, strokeDraw: seg(t, T + 0.05, T + 0.55, 'inOut'),
      };
    });
  } else {
    E.fill(p.key, t => ({ color: C.blue, reveal: seg(t, T, T + 0.20, 'out'), origin: p.pin }));
    E.ring({ at: p.pin, color: C.navy, width: 1.75, r: t => 26 * seg(t, T, T + 0.45, 'backOut'), opacity: t => (t >= T ? 1 : 0),
      ticks: { n: 36, len: 5, gap: 3, opacity: t => 0.5 * seg(t, T + 0.20, T + 0.50) } });
  }
  E.pin({ at: p.pin, color: C.navy, t0: T, pulse: p.key !== '702' });
  E.card({ zh: p.zh, en: p.en, color: C.navy, at: p.pin, t0: T + 0.15, pos: p.pos, enter: p.enter,
    leader: { t0: T + 0.10, t1: T + 0.25, pinR: p.key === '702' ? 28 : 11 },
    glyph: { key: p.key, fill: C.blue, stroke: C.navy, bg: C.blueBg, draw: [T + 0.25, T + 0.50], fillIn: [T + 0.40, T + 0.60] } });
});

// ---------- finale: carrying out ATFM measures together ----------
E.bigCard({ title: 'ATFM', lines: ['與各國一同執行', '飛航流量管理措施'], color: C.navy, width: 480,
  pos: () => [1380, 590], enter: { t0: 15.25, t1: 15.60, dx: 40 }, panel: [15.60, 16.05], lineIn: [[15.75, 16.10], [15.90, 16.25]] });

window.boot(DURATION);
})();
