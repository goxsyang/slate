// Time-driven map animation engine. Everything on screen is a pure function of t (seconds),
// so the page can be scrubbed in a browser and rendered frame-exactly by scripts/render.mjs.
//
// Layers, bottom to top:
//   #base   canvas  sea, land (embossed), flat country fills, borders, coast, paper grain
//   #under  svg     ellipses, glows, ripples (screen space, recomputed per frame)
//   #lift   canvas  lifted / extruded country silhouettes
//   #over   svg     arcs, particles, rings, pins, leader lines
//   #labels html    label cards and big title cards
(() => {
const W = 1920, H = 1080;
const svgNS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const DEG = 1000 * Math.PI / 180; // plane units per degree of longitude (projection scale 1000)

// ---------- easing / timing ----------
const EASE = {
  linear: x => x,
  in: d3.easeCubicIn, out: d3.easeCubicOut, inOut: d3.easeCubicInOut,
  sineInOut: d3.easeSinInOut, quartOut: d3.easePolyOut.exponent(4), quintInOut: d3.easePolyInOut.exponent(5),
  expOut: d3.easeExpOut, backOut: d3.easeBackOut.overshoot(1.4), backOutSoft: d3.easeBackOut.overshoot(1.1),
  hold: () => 0,
};
const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const easeFn = e => typeof e === 'function' ? e : EASE[e];
// eased 0..1 progress of t through [a, b]
function seg(t, a, b, e = 'inOut') {
  if (b <= a) return t >= a ? 1 : 0;
  return easeFn(e)(clamp01((t - a) / (b - a)));
}
// fade in over [a, a+din], hold, fade out over [b-dout, b]
function env(t, a, din, b = Infinity, dout = 0.4, e = 'out') {
  return Math.min(seg(t, a, a + din, e), b === Infinity ? 1 : 1 - seg(t, b - dout, b, 'in'));
}
// 0 -> peak -> 0 bump over [a, b]
const bump = (t, a, b) => (t <= a || t >= b) ? 0 : Math.sin(Math.PI * (t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const keyed = (t, keys, e = 'inOut') => { // piecewise [[t, v], ...]
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], seg(t, keys[i - 1][0], keys[i][0], keys[i][2] || e));
  return keys[keys.length - 1][1];
};

// ---------- geography ----------
// Several detail levels of the same countries (coarse -> fine); drawing picks one from the zoom.
const keyOf = g => g.id && g.id !== '-99' ? g.id : 'n:' + g.properties.name;
const LEVELS = window.WORLD_LEVELS.map(topo => ({
  topo,
  geoms: new Map(topo.objects.countries.geometries.map(g => [keyOf(g), g])),
  // keyed by ISO 3166 numeric id; features without one (e.g. Kosovo) by 'n:' + name
  features: new Map(topojson.feature(topo, topo.objects.countries).features.map(f => [keyOf(f), f])),
  land: topojson.merge(topo, topo.objects.countries.geometries),
  borders: topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b),
  coast: topojson.mesh(topo, topo.objects.countries, (a, b) => a === b),
}));
// Natural Earth 1:10m has no Matsu (馬祖). Add the ROC-administered islands to Taiwan (158) and to the
// base land and coastline at every level, so they light up gold with Kinmen and Penghu.
const MATSU = [
  [[119.905, 26.155], [119.930, 26.172], [119.962, 26.163], [119.955, 26.143], [119.920, 26.140], [119.905, 26.155]], // Nangan
  [[119.972, 26.222], [119.995, 26.240], [120.030, 26.232], [120.028, 26.212], [119.995, 26.205], [119.972, 26.222]], // Beigan
  [[120.472, 26.368], [120.490, 26.382], [120.512, 26.372], [120.497, 26.358], [120.472, 26.368]],                     // Dongyin
  [[119.925, 25.965], [119.945, 25.978], [119.990, 25.972], [119.985, 25.955], [119.940, 25.955], [119.925, 25.965]],  // Juguang
];
LEVELS.forEach(L => {
  const tw = L.features.get('158').geometry;
  if (tw.type === 'Polygon') { tw.type = 'MultiPolygon'; tw.coordinates = [tw.coordinates]; }
  tw.coordinates.push(...MATSU.map(r => [r]));
  L.land.coordinates.push(...MATSU.map(r => [r]));
  L.coast.coordinates.push(...MATSU);
  // Crimea as its own geometry (Natural Earth puts it in Russia), so it can be grouped with Ukraine
  const ru = L.geoms.get('643'), arcs = ru.type === 'MultiPolygon' ? ru.arcs : [ru.arcs];
  const polys = topojson.feature(L.topo, ru).geometry;
  const coords = polys.type === 'MultiPolygon' ? polys.coordinates : [polys.coordinates];
  const i = coords.findIndex(p => { const c = d3.geoCentroid({ type: 'Polygon', coordinates: p }); return c[0] > 32 && c[0] < 37 && c[1] > 44 && c[1] < 46.5; });
  if (i >= 0) L.geoms.set('crimea', { type: 'Polygon', arcs: arcs[i] });
});
const NL = LEVELS.length, FINE = NL - 1;
// pick the level by screen px per degree
const levelFor = k => { const ppd = k * DEG; return ppd < 9 ? 0 : ppd < 22 ? 1 : ppd < 55 ? 2 : 3; };

// Keep only polygons of a (Multi)Polygon feature that pass keep(polygonCoords).
function filterPolys(f, keep) {
  const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
  return { type: 'Feature', id: f.id, properties: f.properties, geometry: { type: 'MultiPolygon', coordinates: polys.filter(keep) } };
}
// Composite features: several countries merged (e.g. "Europe"), optionally dropping polygons (overseas territories).
const groups = new Map();
function defineGroup(key, ids, polyFilter) { groups.set(key, { ids, polyFilter }); }
const featureCache = new Map();
function feature(key, level = FINE) {
  const ck = key + '@' + level;
  if (featureCache.has(ck)) return featureCache.get(ck);
  let f = null;
  if (groups.has(key)) {
    const { ids, polyFilter } = groups.get(key), L = LEVELS[level];
    const geoms = ids.map(id => L.geoms.get(id)).filter(Boolean);
    f = { type: 'Feature', id: key, properties: { name: key }, geometry: topojson.merge(L.topo, geoms) };
    if (polyFilter) f = filterPolys(f, p => polyFilter(d3.geoCentroid({ type: 'Polygon', coordinates: p })));
  } else {
    for (let i = level; i < NL && !f; i++) f = LEVELS[i].features.get(key); // tiny islands only exist at finer levels
    if (!f) throw new Error('no country ' + key);
  }
  featureCache.set(ck, f);
  return f;
}

let projection, planePath;
const base = { land: [], borders: [], coast: [] };
function setProjection(proj) {
  projection = proj.scale(1000).translate([0, 0]).precision(0.05);
  planePath = d3.geoPath(projection).digits(2);
  LEVELS.forEach((L, i) => {
    base.land[i] = new Path2D(planePath(L.land));
    base.borders[i] = new Path2D(planePath(L.borders));
    base.coast[i] = new Path2D(planePath(L.coast));
  });
  pathCache.clear();
}
const pathCache = new Map();
// Path2Ds of a feature's main land masses (>= 2% of its largest polygon) and of its islets
function splitPaths(key, level) {
  const ck = 'split:' + key + '@' + level;
  if (!pathCache.has(ck)) {
    const f = feature(key, level);
    const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
    const areas = polys.map(p => d3.geoArea({ type: 'Polygon', coordinates: p })), maxA = Math.max(...areas);
    const part = keep => ({ type: 'MultiPolygon', coordinates: polys.filter((_, i) => keep(areas[i] >= maxA * 0.02)) });
    const small = part(b => !b);
    pathCache.set(ck, { big: new Path2D(planePath(part(b => b))), small: small.coordinates.length ? new Path2D(planePath(small)) : null });
  }
  return pathCache.get(ck);
}
function path2D(key, level) {
  const ck = key + '@' + level;
  if (!pathCache.has(ck)) pathCache.set(ck, new Path2D(planePath(feature(key, level))));
  return pathCache.get(ck);
}
// projected length (plane units) of a feature's rings, for stroke-trace dashes
const lengthCache = new Map();
function planeLength(key) {
  if (!lengthCache.has(key)) {
    let L = 0;
    const ctx = { moveTo(x, y) { this.p = [x, y]; }, lineTo(x, y) { L += Math.hypot(x - this.p[0], y - this.p[1]); this.p = [x, y]; }, closePath() {} };
    d3.geoPath(projection, ctx)(feature(key, 2));
    lengthCache.set(key, L);
  }
  return lengthCache.get(key);
}
// plane-space centroid of the largest polygon (so e.g. Japan's anchor is on Honshu, not the sea)
function mainCentroid(key) {
  const f = feature(key);
  if (f.geometry.type !== 'MultiPolygon') return planePath.centroid(f);
  let best = null, bestA = -1;
  for (const coords of f.geometry.coordinates) {
    const g = { type: 'Polygon', coordinates: coords }, a = planePath.area(g);
    if (a > bestA) { bestA = a; best = g; }
  }
  return planePath.centroid(best);
}

// ---------- camera ----------
// A view is [cx, cy, w] in plane units (w = visible plane width).
// Keyframes: {t, box:[lon0,lat0,lon1,lat1]} (fit) or {t, center:[lon,lat], ppd} (px per degree), plus ease.
let cam = { cx: 0, cy: 0, k: 1 };
function viewFromBox([lon0, lat0, lon1, lat1], pad = 0) {
  const pts = [];
  for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) pts.push(projection([lerp(lon0, lon1, i / 8), lerp(lat0, lat1, j / 8)]));
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const w = Math.max(x1 - x0, (y1 - y0) * W / H) * (1 + pad);
  return [(x0 + x1) / 2, (y0 + y1) / 2, w];
}
function viewFromCenter(center, ppd) { const c = projection(center); return [c[0], c[1], W / (ppd / DEG)]; }
let camKeys = [];
function setCamera(keys) {
  camKeys = keys.map(k => ({ ...k, view: k.view || (k.center ? viewFromCenter(k.center, k.ppd) : viewFromBox(k.box, k.pad || 0)) }));
}
function cameraAt(t) {
  let v;
  if (t <= camKeys[0].t) v = camKeys[0].view;
  else if (t >= camKeys[camKeys.length - 1].t) v = camKeys[camKeys.length - 1].view;
  else {
    let i = 0; while (camKeys[i + 1].t < t) i++;
    const a = camKeys[i], b = camKeys[i + 1];
    v = d3.interpolateZoom(a.view, b.view)(seg(t, a.t, b.t, b.ease || 'inOut'));
  }
  return { cx: v[0], cy: v[1], k: W / v[2] };
}
const planeToScreen = ([x, y]) => [(x - cam.cx) * cam.k + W / 2, (y - cam.cy) * cam.k + H / 2];
const toScreen = lonlat => planeToScreen(projection(lonlat));
const camMatrix = () => [cam.k, 0, 0, cam.k, W / 2 - cam.cx * cam.k, H / 2 - cam.cy * cam.k];
const ppd = () => cam.k * DEG;

// ---------- base map (canvas) ----------
const COLORS = { land: '#f3ede3', coast: '#b4ab9e', border: '#ddd4c4', halo: '#e3e9e4', wallTop: '#d6cbbb', wallBottom: '#bdb3a3', rim: 'rgba(255,252,246,0.9)' };
// The page is laid out at 1920x1080 CSS px; canvases get a device-pixel backing store so a render with
// deviceScaleFactor 2 is a native 3840x2160 frame (SVG and HTML layers scale on their own).
const DPR = window.devicePixelRatio || 1;
for (const id of ['base', 'lift']) { const c = $(id); c.width = W * DPR; c.height = H * DPR; c.style.width = W + 'px'; c.style.height = H + 'px'; }
const baseCtx = $('base').getContext('2d');
const liftCtx = $('lift').getContext('2d');
const half = new OffscreenCanvas(W * DPR / 2, H * DPR / 2), halfCtx = half.getContext('2d');
// setTransform in CSS px (scaled to the backing store)
const T = (ctx, a, b, c, d, e, f) => ctx.setTransform(a * DPR, b * DPR, c * DPR, d * DPR, e * DPR, f * DPR);
const TH = (a, b, c, d, e, f) => halfCtx.setTransform(a * DPR / 2, b * DPR / 2, c * DPR / 2, d * DPR / 2, e * DPR / 2, f * DPR / 2);
let seaImg, grainPattern;

function makeStatics() {
  // sea: pale sage with a warm light falloff from the top-left, like the reference
  const sea = new OffscreenCanvas(W * DPR, H * DPR), g = sea.getContext('2d');
  g.scale(DPR, DPR);
  const grad = g.createRadialGradient(W * 0.16, H * 0.12, 0, W * 0.16, H * 0.12, W * 1.1);
  grad.addColorStop(0, '#e6e5dd'); grad.addColorStop(0.42, '#d0d9d3'); grad.addColorStop(1, '#c4cfc9');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  seaImg = sea;
  // paper grain (seeded, so every render is identical)
  const c = new OffscreenCanvas(512, 512), gc = c.getContext('2d'), img = gc.createImageData(512, 512);
  let s = 1234567;
  const rnd = () => (s = (s * 1103515245 + 12345) >>> 0) / 4294967296;
  for (let i = 0; i < 512 * 512; i++) {
    const v = 243 + rnd() * 12;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
  }
  gc.putImageData(img, 0, 0);
  gc.globalAlpha = 0.05; gc.strokeStyle = '#7a776c';
  for (let i = 0; i < 260; i++) {
    const x = rnd() * 512, y = rnd() * 512, a = rnd() * Math.PI, l = 8 + rnd() * 30;
    gc.lineWidth = 0.5 + rnd(); gc.beginPath(); gc.moveTo(x, y); gc.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); gc.stroke();
  }
  grainPattern = baseCtx.createPattern(c, 'repeat');
}

const underLandHooks = []; // (ctx, t) => draw in screen space between the sea and the land
const fillLayers = [];   // flat country fills on the base canvas, in registration order
const liftLayers = [];   // lifted silhouettes on the lift canvas, in registration order

// circle clip that grows from `origin` until it covers the whole feature (radial "flood" reveal)
function revealClip(ctx, key, s) {
  if (s.reveal == null || s.reveal >= 1) return false;
  const o = toScreen(s.origin || d3.geoCentroid(feature(key)));
  const b = planePath.bounds(feature(key, 2)).map(planeToScreen);
  const R = Math.max(...[[b[0][0], b[0][1]], [b[1][0], b[0][1]], [b[0][0], b[1][1]], [b[1][0], b[1][1]]].map(p => Math.hypot(p[0] - o[0], p[1] - o[1]))) + 10;
  ctx.save();
  T(ctx, 1, 0, 0, 1, 0, 0);
  ctx.beginPath(); ctx.arc(o[0], o[1], Math.max(0.01, R * s.reveal), 0, 2 * Math.PI); ctx.clip();
  return true;
}

function drawBase(t) {
  // level 1 at least: level 0 would pop dozens of islands in and out at the switch
  const ctx = baseCtx, m = camMatrix(), L = Math.max(levelFor(cam.k), 1), k = cam.k;
  T(ctx, 1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.drawImage(seaImg, 0, 0, W, H);
  // pale shallow-water halo, blurred at half resolution (cheap) then upscaled
  halfCtx.setTransform(1, 0, 0, 1, 0, 0); halfCtx.clearRect(0, 0, half.width, half.height);
  halfCtx.filter = `blur(${3 * DPR}px)`; // 6 CSS px either way
  TH(...m);
  halfCtx.lineJoin = 'round';
  halfCtx.strokeStyle = COLORS.halo; halfCtx.lineWidth = 18 / k; halfCtx.stroke(base.coast[L]);
  halfCtx.filter = 'none';
  ctx.globalAlpha = 0.9; ctx.drawImage(half, 0, 0, W, H); ctx.globalAlpha = 1;
  // sea-only tints (e.g. an ellipse's wash) go under the land so they never colour a country
  for (const h of underLandHooks) { ctx.save(); T(ctx, 1, 0, 0, 1, 0, 0); h(ctx, t); ctx.restore(); }
  // raised paper: a tan wall under every coast (2 px at world scale, 6 px from the Asia view in)
  const wall = Math.max(2, Math.min(6, k * DEG / 3)); // continuous, so it never steps by 1 px on one frame
  for (let y = wall; y > 0.05; y -= 1) {
    T(ctx, m[0], 0, 0, m[3], m[4], m[5] + y);
    ctx.fillStyle = d3.interpolateRgb(COLORS.wallTop, COLORS.wallBottom)(y / wall); ctx.fill(base.land[L]);
  }
  // land with a light bevel rim just inside the coast, then highlighted countries, borders, coastline
  T(ctx, ...m);
  ctx.fillStyle = COLORS.land; ctx.fill(base.land[L]);
  ctx.save(); ctx.clip(base.land[L]); ctx.strokeStyle = COLORS.rim; ctx.lineWidth = 5 / k; ctx.stroke(base.coast[L]); ctx.restore();
  T(ctx, ...m);
  ctx.lineJoin = 'round';
  const styles = fillLayers.map(f => f.style(t));
  fillLayers.forEach((f, i) => {
    const s = styles[i], op = s.opacity ?? 1;
    if (op <= 0.001 || s.reveal === 0) return;
    const clipped = revealClip(ctx, f.key, s);
    T(ctx, ...m);
    ctx.globalAlpha = op; ctx.fillStyle = s.color; ctx.fill(path2D(f.key, L));
    if (clipped) ctx.restore();
  });
  T(ctx, ...m);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = COLORS.border; ctx.lineWidth = 0.9 / k; ctx.stroke(base.borders[L]);
  fillLayers.forEach((f, i) => {   // white hairlines between highlighted countries
    const s = styles[i], op = s.opacity ?? 1;
    if (op <= 0.001 || s.reveal === 0 || s.stroke === 'none') return;
    const clipped = revealClip(ctx, f.key, s);
    T(ctx, ...m);
    ctx.globalAlpha = op; ctx.strokeStyle = s.stroke || '#ffffff'; ctx.lineWidth = hairW(s.strokeWidth ?? 1) / k; ctx.stroke(path2D(f.key, L));
    if (clipped) ctx.restore();
  });
  T(ctx, ...m);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = COLORS.coast; ctx.lineWidth = 0.98 / k; ctx.stroke(base.coast[L]);
  // paper grain over the map
  T(ctx, 1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.5;
  ctx.fillStyle = grainPattern; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}

// A canvas stroke of exactly 1 device px flips between Skia's hairline and stroked-path rasterisers as
// (1/k)*k rounds either side of 1, darkening every coast for single frames. Keep strokes clear of 1 px.
const hairW = px => (Math.abs(px - 1) < 0.01 ? 0.98 : px);
const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

// Extruded silhouette: side-tone copies stacked from the map surface up to `lift` px, a soft
// shadow below, the top face in `color`, and an optional white coast trace.
function drawLifts(t) {
  const ctx = liftCtx;
  T(ctx, 1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
  for (const f of liftLayers) {
    const s = f.style(t), op = s.opacity ?? 1;
    if (op <= 0.001 || s.reveal === 0) continue;
    const { big: p, small } = splitPaths(f.key, Math.max(levelFor(cam.k), s.minLevel ?? 2));
    const lift = s.lift ?? 0, sc = s.scale ?? 1;
    const c = planeToScreen(f.cPlane), k = cam.k * sc;
    const X = sc * (W / 2 - cam.cx * cam.k) + c[0] * (1 - sc), Y = sc * (H / 2 - cam.cy * cam.k) + c[1] * (1 - sc);
    const clipped = revealClip(ctx, f.key, s);
    ctx.globalAlpha = op;
    // shadow cast by the slab
    const sa = s.shadowAlpha ?? 0.3;
    if (sa > 0.001 && lift > 0.2) {
      T(ctx, k, 0, 0, k, X, Y);
      ctx.shadowColor = hexA(s.shadowColor || '#24365e', sa);
      ctx.shadowBlur = Math.max(2, 1.6 * lift) * DPR; ctx.shadowOffsetY = lift * 0.9 * DPR; ctx.shadowOffsetX = 0; // shadows ignore the transform
      ctx.fillStyle = s.side || s.color; ctx.fill(p);
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    }
    // side walls
    ctx.fillStyle = s.side || s.color;
    for (let y = 0; y < lift; y += 1) { T(ctx, k, 0, 0, k, X, Y - y); ctx.fill(p); }
    // top face
    T(ctx, k, 0, 0, k, X, Y - lift);
    ctx.fillStyle = s.color; ctx.fill(p);
    const stroked = (s.strokeWidth ?? 1.25) > 0 && s.stroke !== 'none';
    if (stroked) {
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.strokeStyle = s.stroke || '#ffffff'; ctx.lineWidth = hairW(s.strokeWidth ?? 1.25) / k;
      const tr = s.strokeDraw ?? 1;
      if (tr < 1) { const len = planeLength(f.key); ctx.setLineDash([len * tr, len]); }
      if (tr > 0) ctx.stroke(p);
      ctx.setLineDash([]);
    }
    // islets stay flat on the map, highlighted but not extruded (they would read as pillars)
    if (small) {
      T(ctx, k, 0, 0, k, X, Y);
      ctx.fillStyle = s.color; ctx.fill(small);
      if (stroked) ctx.stroke(small);
    }
    if (clipped) ctx.restore();
  }
  ctx.globalAlpha = 1;
  T(ctx, 1, 0, 0, 1, 0, 0);
}

// ---------- SVG helpers ----------
function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(svgNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
const setA = (e, attrs) => { for (const k in attrs) e.setAttribute(k, attrs[k]); };
const show = (e, op) => { const vis = op > 0.001; e.style.display = vis ? '' : 'none'; if (vis) e.setAttribute('opacity', op); return vis; };
const updaters = [];
const onFrame = fn => updaters.push(fn);
const val = (v, t, d) => v == null ? d : typeof v === 'function' ? v(t) : v;
const pts2d = pts => 'M' + pts.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('L');
const layer = name => $(name || 'over');

// Flat country fill (base canvas). style(t) -> {color, opacity, reveal, origin, stroke, strokeWidth}
function fill(key, style) { feature(key); fillLayers.push({ key, style }); }
// Lifted silhouette (lift canvas). style(t) -> {color, side, lift, opacity, reveal, origin, shadowColor, shadowAlpha, stroke, strokeWidth, strokeDraw, scale}
function lift(key, style) { feature(key); liftLayers.push({ key, style, cPlane: mainCentroid(key) }); }

// ---------- arcs ----------
function bez(a, c, b, u) { const v = 1 - u; return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]]; }
// Quadratic arc between two lon/lat points (screen space).
// o: {from, to, color, width, opacity(t), draw(t) 0..1, bulge, bend:'left'|'up', maskFrom(t) px, maskTo(t) px,
//     head: bool, particles: [{t0, dur, dir: 1 (from->to) | -1, color, r, ease}]}
function arc(o) {
  const g = el('g', {}, layer(o.layer));
  const under = el('path', { fill: 'none', stroke: '#ffffff', 'stroke-linecap': 'round' }, g);
  const line = el('path', { fill: 'none', stroke: o.color, 'stroke-linecap': 'round' }, g);
  const head = el('circle', { fill: o.color, stroke: '#fff', 'stroke-width': 1.5 }, g);
  const dots = (o.particles || []).map(p => el('circle', { r: p.r || 4.5, fill: p.color || o.color, stroke: '#fff', 'stroke-width': 1.5 }, g));
  const N = 64;
  const geom = t => {
    const A = toScreen(o.from), B = toScreen(o.to);
    const dx = B[0] - A[0], dy = B[1] - A[1], Lc = Math.hypot(dx, dy) || 1, k = val(o.bulge, t, 0.2);
    const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    const C = o.bend === 'up' ? [M[0], M[1] - k * Lc] : [M[0] + dy / Lc * k * Lc, M[1] - dx / Lc * k * Lc];
    // trim the ends inside the masking discs (e.g. Taiwan's hub ring)
    const r0 = val(o.maskFrom, t, 0), r1 = val(o.maskTo, t, 0);
    // bisection keeps the trimmed ends continuous in r0/r1 (a fixed u-grid made them toggle on rounding noise)
    const dist = (u, P) => { const q = bez(A, C, B, u); return Math.hypot(q[0] - P[0], q[1] - P[1]); };
    let u0 = 0, u1 = 1;
    if (r0 > 0) { let lo = 0, hi = 1; for (let j = 0; j < 30; j++) { const m = (lo + hi) / 2; if (dist(m, A) < r0) lo = m; else hi = m; } u0 = hi; }
    if (r1 > 0) { let lo = u0, hi = 1; for (let j = 0; j < 30; j++) { const m = (lo + hi) / 2; if (dist(m, B) < r1) hi = m; else lo = m; } u1 = lo; }
    return { A, B, C, u0, u1 };
  };
  onFrame(t => {
    if (!show(g, val(o.opacity, t, 1))) return;
    const { A, B, C, u0, u1 } = geom(t);
    const p = clamp01(val(o.draw, t, 1)), w = val(o.width, t, 2.5);
    const uEnd = u0 + (u1 - u0) * p, pts = [];
    for (let i = 0; i <= N; i++) pts.push(bez(A, C, B, u0 + (uEnd - u0) * i / N));
    const d = p > 0 ? pts2d(pts) : '';
    setA(line, { d, 'stroke-width': w });
    setA(under, { d, 'stroke-width': w + 3, opacity: 0.45 });
    const tip = pts[pts.length - 1];
    setA(head, { cx: tip[0], cy: tip[1], r: o.headR || 4.5, opacity: o.head !== false && p > 0.02 && p < 0.995 ? 1 : 0 });
    (o.particles || []).forEach((pa, i) => {
      const x = (t - pa.t0) / pa.dur;
      if (x <= 0 || x >= 1) { dots[i].setAttribute('opacity', 0); return; }
      let u = easeFn(pa.ease || 'sineInOut')(x);
      if (pa.dir === -1) u = 1 - u;
      const q = bez(A, C, B, u0 + (u1 - u0) * u);
      const fade = Math.min(1, x * pa.dur / 0.1, (1 - x) * pa.dur / 0.12);
      setA(dots[i], { cx: q[0], cy: q[1], opacity: fade });
    });
  });
  return o;
}

// ---------- ellipse with ruler ticks ----------
// Map-space ellipse centred on a lon/lat: semi-axes a, b in plane units (projection scale 1000),
// rotation in screen degrees (y down). Param angle 0 = the +a end.
// o: {center, a, b, rot, color, width, scale(t), draw(t), start (deg), fillOpacity(t), opacity(t),
//     ticks: {n, long (every nth), lenLong, lenShort, gap, opacity, alpha(i,t), boost(i,t) -> extra len}, outer: {d (px), opacity(t)},
//     ripples: [{t0, t1, s1, o0}]}
function ellipse(o) {
  const rot = (o.rot || 0) * Math.PI / 180, a0 = (o.start || 0) * Math.PI / 180;
  const ptAt = (ang, s, c, extra = 0) => { // screen point; extra = px outward along the axes
    const ax = (o.a * s) * cam.k + extra, bx = (o.b * s) * cam.k + extra;
    const x = ax * Math.cos(ang), y = bx * Math.sin(ang);
    return [c[0] + x * Math.cos(rot) - y * Math.sin(rot), c[1] + x * Math.sin(rot) + y * Math.cos(rot)];
  };
  const loop = (s, c, extra, from, sweep, n = 240) => { const pts = []; for (let i = 0; i <= n; i++) pts.push(ptAt(from + sweep * i / n, s, c, extra)); return pts; };
  const host = layer(o.layer || 'under'), g = el('g', {}); host.insertBefore(g, host.firstChild); // bottom of its layer: arcs, pins, leaders and diamonds stay above
  const fillE = el('path', { fill: o.color, stroke: 'none' }, g);
  const outer = el('path', { fill: 'none', stroke: o.color, 'stroke-width': 1 }, g);
  const ticks = el('path', { fill: 'none', stroke: o.color, 'stroke-width': 1, 'stroke-linecap': 'round' }, g);
  const boosted = el('path', { fill: 'none', stroke: o.color, 'stroke-width': 1.3, 'stroke-linecap': 'round' }, g);
  const halo = el('path', { fill: 'none', stroke: '#ffffff', 'stroke-linecap': 'round' }, g);
  const line = el('path', { fill: 'none', stroke: o.color, 'stroke-linecap': 'round' }, g);
  const rip = (o.ripples || []).map(() => el('path', { fill: 'none', stroke: o.color, 'stroke-width': 2 }, g));
  if (o.seaOnly) underLandHooks.push((ctx, t) => {   // wash painted under the land layer: tints the sea only
    const op = val(o.opacity, t, 1) * val(o.fillOpacity, t, 0.06);
    if (op <= 0.001) return;
    const pts = loop(val(o.scale, t, 1), toScreen(o.center), 0, a0, 2 * Math.PI, 160);
    ctx.globalAlpha = op; ctx.fillStyle = o.color;
    ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill();
  });
  onFrame(t => {
    if (!show(g, val(o.opacity, t, 1))) return;
    const c = toScreen(o.center), s = val(o.scale, t, 1), p = clamp01(val(o.draw, t, 1)), w = val(o.width, t, 2.5);
    const full = loop(s, c, 0, a0, 2 * Math.PI);
    const d = p > 0 ? pts2d(loop(s, c, 0, a0, 2 * Math.PI * p)) : '';
    setA(line, { d, 'stroke-width': w }); setA(halo, { d, 'stroke-width': w + 3.5, opacity: 0.5 });
    if (o.seaOnly) fillE.setAttribute('d', ''); else setA(fillE, { d: pts2d(full) + 'Z', 'fill-opacity': val(o.fillOpacity, t, 0.06) });
    if (o.outer) setA(outer, { d: pts2d(loop(s, c, o.outer.d || 6, a0, 2 * Math.PI)) + 'Z', opacity: val(o.outer.opacity, t, 0.3) });
    if (o.ticks) {
      const T = o.ticks, n = T.n || 120;
      let td = '', bd = '';
      for (let i = 0; i < n; i++) {
        const al = T.alpha ? T.alpha(i, t) : 1;
        if (al <= 0.01) continue;
        const ang = a0 + 2 * Math.PI * i / n;
        const q = ptAt(ang, s, c, 0), q2 = ptAt(ang, s, c, 1); // outward direction
        let nx = q2[0] - q[0], ny = q2[1] - q[1]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
        const ext = T.boost ? T.boost(i, t) : 0;
        const len = (i % (T.long || 10) === 0 ? (T.lenLong || 11) : (T.lenShort || 6)) + ext, gap = (T.gap ?? 9);
        const seg_ = `M${(q[0] + nx * gap).toFixed(1)},${(q[1] + ny * gap).toFixed(1)}l${(nx * len).toFixed(1)},${(ny * len).toFixed(1)}`;
        if (ext > 0.3) bd += seg_; else if (al >= 0.99) td += seg_; else bd += seg_;
      }
      setA(ticks, { d: td, opacity: T.opacity ?? 0.45 });
      setA(boosted, { d: bd, opacity: Math.min(0.9, (T.opacity ?? 0.45) * 1.8) });
    }
    (o.ripples || []).forEach((r, i) => {
      const x = seg(t, r.t0, r.t1, 'out');
      if (t <= r.t0 || t >= r.t1) { rip[i].setAttribute('opacity', 0); return; }
      setA(rip[i], { d: pts2d(loop(s * lerp(1, r.s1 || 1.1, x), c, 0, a0, 2 * Math.PI)) + 'Z', opacity: (r.o0 ?? 0.55) * (1 - x) });
    });
  });
}

// Polygon / polyline in lon/lat (great-circle densified), drawn along its perimeter, with diamond nodes.
// o: {coords, closed, color, width, draw(t), opacity(t), fill, fillOpacity(t), nodes: [[lon,lat],...], nodeScale(i, t)}
function poly(o) {
  const g = el('g', {}, layer(o.layer));
  const fillP = el('path', { fill: o.fill || o.color, stroke: 'none' }, g);
  const halo = el('path', { fill: 'none', stroke: '#fff', 'stroke-linejoin': 'round', opacity: 0.55 }, g);
  const line = el('path', { fill: 'none', stroke: o.color, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);
  const inner = o.inner ? el('path', { fill: 'none', stroke: o.inner.color, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g) : null;
  const nodes = (o.nodes || []).map(() => el('rect', { x: -5, y: -5, width: 10, height: 10, fill: '#fff', stroke: o.color, 'stroke-width': 2 }, g));
  const ringC = o.closed ? [...o.coords, o.coords[0]] : o.coords, dense = [];
  for (let i = 0; i < ringC.length - 1; i++) { const it = d3.geoInterpolate(ringC[i], ringC[i + 1]); for (let j = 0; j < 24; j++) dense.push(it(j / 24)); }
  dense.push(ringC[ringC.length - 1]);
  onFrame(t => {
    if (!show(g, val(o.opacity, t, 1))) return;
    const pts = dense.map(toScreen), lens = [0];
    for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = lens[lens.length - 1], target = total * clamp01(val(o.draw, t, 1)), out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      if (lens[i] <= target) out.push(pts[i]);
      else { const u = (target - lens[i - 1]) / (lens[i] - lens[i - 1]); out.push([lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]); break; }
    }
    const d = target > 0 ? pts2d(out) : '', w = val(o.width, t, 3);
    setA(line, { d, 'stroke-width': w }); setA(halo, { d, 'stroke-width': w + 4 });
    if (inner) { // pale inner rule offset towards the centre, drawn on with the outline
      const cx = d3.mean(pts, q => q[0]), cy = d3.mean(pts, q => q[1]), off = val(o.inner.d, t, 6);
      const ip = out.map((q, i) => {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
        let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
        if ((cx - q[0]) * nx + (cy - q[1]) * ny < 0) { nx = -nx; ny = -ny; }
        return [q[0] + nx * off, q[1] + ny * off];
      });
      setA(inner, { d: target > 0 ? pts2d(ip) : '', 'stroke-width': val(o.inner.width, t, 1.6), opacity: val(o.inner.opacity, t, 1) });
    }
    setA(fillP, { d: pts2d(pts) + 'Z', 'fill-opacity': val(o.fillOpacity, t, 0) });
    (o.nodes || []).forEach((ll, i) => {
      const q = toScreen(ll), sc = o.nodeScale ? o.nodeScale(i, t) : 1;
      setA(nodes[i], { transform: `translate(${q[0].toFixed(1)},${q[1].toFixed(1)}) rotate(45) scale(${Math.max(0, sc)})`, opacity: sc > 0.01 ? 1 : 0 });
    });
  });
}

// ---------- rings, ripples, glows, pins ----------
// Screen-space ring around a lon/lat with optional ruler ticks and diamond nodes (Taiwan hub, Singapore locator).
// o: {at, r(t), color, width, draw(t), opacity(t), ticks: {n, len, gap, opacity(t)}, diamonds: {angles, size, scale(t)}}
function ring(o) {
  const g = el('g', {}, layer(o.layer));
  const halo = el('circle', { fill: 'none', stroke: '#fff' }, g);
  const c = el('circle', { fill: 'none', stroke: o.color, pathLength: 1, transform: 'rotate(-90)' }, g);
  const ticks = el('path', { fill: 'none', stroke: o.color, 'stroke-width': 1 }, g);
  const dia = (o.diamonds?.angles || []).map(() => el('rect', { x: -5, y: -5, width: 10, height: 10, fill: o.color, stroke: '#fff', 'stroke-width': 1.2 }, g));
  onFrame(t => {
    if (!show(g, val(o.opacity, t, 1))) return;
    const q = toScreen(o.at), r = val(o.r, t, 30), p = clamp01(val(o.draw, t, 1)), w = val(o.width, t, 2);
    g.setAttribute('transform', `translate(${q[0].toFixed(2)},${q[1].toFixed(2)})`);
    setA(c, { r, 'stroke-width': w, 'stroke-dasharray': `${p} 1`, opacity: p > 0 ? 1 : 0 });
    setA(halo, { r, 'stroke-width': w + 3, opacity: p >= 1 ? 0.45 : 0 });
    if (o.ticks) {
      const n = o.ticks.n || 72, len = o.ticks.len || 5, gap = o.ticks.gap ?? 4;
      let d = '';
      for (let i = 0; i < n; i++) { const a = 2 * Math.PI * i / n - Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a); d += `M${((r + gap) * ca).toFixed(1)},${((r + gap) * sa).toFixed(1)}l${(len * ca).toFixed(1)},${(len * sa).toFixed(1)}`; }
      setA(ticks, { d, opacity: val(o.ticks.opacity, t, 0.5) });
    }
    (o.diamonds?.angles || []).forEach((ang, i) => {
      const a = (ang - 90) * Math.PI / 180, sc = val(o.diamonds.scale, t, 1) * (o.diamonds.size || 7) / 10;
      setA(dia[i], { transform: `translate(${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}) rotate(45) scale(${Math.max(0, sc)})`, opacity: sc > 0.01 ? 1 : 0 });
    });
  });
}
// Expanding ring: radius r0(t) -> r1(t) over [t0, t1], fading from o0.
function ripple(o) {
  const c = el('circle', { fill: 'none', stroke: o.color, 'stroke-width': o.width || 2 }, layer(o.layer));
  onFrame(t => {
    if (t <= o.t0 || t >= o.t1) { c.style.display = 'none'; return; }
    c.style.display = '';
    const x = seg(t, o.t0, o.t1, o.ease || 'out'), q = toScreen(o.at);
    setA(c, { cx: q[0], cy: q[1], r: lerp(val(o.r0, t, 10), val(o.r1, t, 40), x), opacity: (o.o0 ?? 0.6) * (1 - x) });
  });
}
// Soft radial glow behind a point. o: {at, r(t), color, opacity(t)}
let glowN = 0;
function glow(o) {
  const id = 'glow' + (glowN++);
  const defs = el('defs', {}, layer(o.layer || 'under'));
  const rg = el('radialGradient', { id }, defs);
  el('stop', { offset: 0, 'stop-color': o.color, 'stop-opacity': 1 }, rg);
  el('stop', { offset: 1, 'stop-color': o.color, 'stop-opacity': 0 }, rg);
  const c = el('circle', { fill: `url(#${id})` }, layer(o.layer || 'under'));
  onFrame(t => { if (!show(c, val(o.opacity, t, 0.35))) return; const q = toScreen(o.at); setA(c, { cx: q[0], cy: q[1], r: val(o.r, t, 60) }); });
}
// Pin: white ring + dot (constant screen size); pops with overshoot at t0; optional one-shot pulse.
function pin(o) {
  const g = el('g', {}, layer(o.layer));
  const pulse = el('circle', { fill: 'none', stroke: o.color, 'stroke-width': 2 }, g);
  const ringC = el('circle', { r: 10, fill: '#fff', stroke: o.color, 'stroke-width': 3 }, g);
  el('circle', { r: 4.5, fill: o.color }, g);
  onFrame(t => {
    const op = val(o.opacity, t, t >= o.t0 ? 1 : 0);
    if (!show(g, op)) return;
    const q = toScreen(o.at), s = seg(t, o.t0, o.t0 + (o.popDur || 0.3), 'backOut') * val(o.scale, t, 1);
    g.setAttribute('transform', `translate(${q[0].toFixed(2)},${q[1].toFixed(2)})`);
    ringC.setAttribute('transform', `scale(${s})`);
    g.lastChild.setAttribute('transform', `scale(${s})`);
    const pt0 = o.pulseT0 ?? o.t0, pd = o.pulseDur ?? 0.7, x = (t - pt0) / pd;
    if (o.pulse !== false && x > 0 && x < 1) setA(pulse, { r: lerp(10, o.pulseR || 36, EASE.out(x)), opacity: 0.55 * (1 - x) });
    else pulse.setAttribute('opacity', 0);
  });
}

// ---------- HTML label cards ----------
const labelsRoot = $('labels');
function div(cls, parent, html) { const d = document.createElement('div'); d.className = cls; if (html != null) d.innerHTML = html; parent.appendChild(d); return d; }

// Country silhouette icon, fitted into size x size; keeps polygons >= minFrac of the largest.
function glyphSVG(key, size, { fill = '#a4c0d9', stroke = '#354e99', minFrac = 0.01, pad = 6, drop = [] } = {}) {
  let f = feature(key);
  const area = p => d3.geoArea({ type: 'Polygon', coordinates: p });
  const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
  const maxA = Math.max(...polys.map(area));
  f = filterPolys(f, p => area(p) >= maxA * minFrac && !drop.some(([x0, y0, x1, y1]) => { const c = d3.geoCentroid({ type: 'Polygon', coordinates: p }); return c[0] >= x0 && c[0] <= x1 && c[1] >= y0 && c[1] <= y1; }));
  const proj = d3.geoMercator().fitExtent([[pad, pad], [size - pad, size - pad]], f);
  const d = d3.geoPath(proj).digits(1)(f);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><path class="gfill" d="${d}" fill="${fill}"/><path class="gline" d="${d}" fill="none" stroke="${stroke}" stroke-width="1.25" stroke-linejoin="round" pathLength="1"/></svg>`;
}

// Bilingual card with coloured left bar, optional silhouette glyph, leader line to its pin.
// o: {zh, en, color, at, pos(q, w, h, t) -> [x, y] top-left, t0, inDur, enter: [dx, dy], opacity(t),
//     leader: {t0, t1, pinR} | false, glyph: {key, fill, stroke, bg, draw:[t0,t1], fillIn:[t0,t1], ...glyphSVG opts}}
function card(o) {
  const d = div('card' + (o.glyph ? ' has-glyph' : ''), labelsRoot,
    (o.glyph ? `<div class="glyph" style="background:${o.glyph.bg || '#eef1f4'}">${glyphSVG(o.glyph.key, 60, o.glyph)}</div>` : '')
    + `<div class="txt"><div class="zh">${o.zh}</div><div class="en">${o.en}</div></div>`);
  d.style.borderLeftColor = o.color;
  const gline = d.querySelector('.gline'), gfill = d.querySelector('.gfill');
  const leader = o.leader === false ? null : el('path', { fill: 'none', stroke: '#8c908c', 'stroke-width': 1.25 }, $('over'));
  let size = null;
  onFrame(t => {
    const inDur = o.inDur || 0.35;
    const op = val(o.opacity, t, seg(t, o.t0, o.t0 + inDur, 'out'));
    const vis = op > 0.001;
    d.style.display = vis ? '' : 'none';
    if (leader) leader.style.display = vis ? '' : 'none';
    if (!vis) return;
    if (!size) size = [d.offsetWidth, d.offsetHeight];
    const [w, h] = size, q = toScreen(o.at);
    const [x, y] = o.pos(q, w, h, t);
    const e = 1 - seg(t, o.t0, o.t0 + inDur, 'out'), en = o.enter || [-14, 0];
    // whole pixels: Chromium snaps text to the pixel grid, so a fractional box makes the text tick 1 px inside it
    d.style.transform = `translate(${Math.round(x + en[0] * e)}px,${Math.round(y + en[1] * e)}px)`;
    d.style.opacity = op;
    if (o.glyph) {
      const gd = o.glyph.draw || [o.t0 + 0.1, o.t0 + 0.45], gf = o.glyph.fillIn || [gd[1] - 0.1, gd[1] + 0.15];
      gline.setAttribute('stroke-dasharray', `${seg(t, gd[0], gd[1], 'inOut')} 1`);
      gfill.setAttribute('opacity', seg(t, gf[0], gf[1], 'out'));
    }
    if (leader) {
      // from the pin edge to the midpoint of the card edge facing the pin
      const cands = [[x, y + h / 2], [x + w, y + h / 2], [x + w / 2, y], [x + w / 2, y + h]];
      const tgt = cands.reduce((b, c) => Math.hypot(c[0] - q[0], c[1] - q[1]) < Math.hypot(b[0] - q[0], b[1] - q[1]) ? c : b);
      const L = o.leader || {}, lp = seg(t, L.t0 ?? o.t0 - 0.05, L.t1 ?? o.t0 + 0.12, 'out');
      const dx = tgt[0] - q[0], dy = tgt[1] - q[1], dl = Math.hypot(dx, dy) || 1, pr = val(L.pinR, t, 11);
      const s0 = [q[0] + dx / dl * pr, q[1] + dy / dl * pr], s1 = [lerp(s0[0], tgt[0], lp), lerp(s0[1], tgt[1], lp)];
      setA(leader, { d: `M${s0[0].toFixed(1)},${s0[1].toFixed(1)}L${s1[0].toFixed(1)},${s1[1].toFixed(1)}`, opacity: 0.7 * op * (lp > 0 ? 1 : 0) });
    }
  });
  return d;
}

// Big header card: coloured band with a large Latin title, white panel with Chinese lines.
// o: {title, lines[], color, width, pos(t) -> [x, y], enter: {t0, t1, dx, dy}, panel: [t0, t1], lineIn: [[t0,t1],...],
//     absorb: {t0, t1, to(t) -> [x, y]}, collapse: {t0, t1, to: [x, y], size}, opacity(t)}
function bigCard(o) {
  const d = div('big', labelsRoot, `<div class="band">${o.title}</div><div class="panel">${o.lines.map(l => `<div class="ln">${l}</div>`).join('')}</div>`);
  d.style.setProperty('--c', o.color);
  if (o.width) d.style.width = o.width + 'px';
  const band = d.querySelector('.band'), panel = d.querySelector('.panel'), lns = [...d.querySelectorAll('.ln')];
  let size = null;
  onFrame(t => {
    const E0 = o.enter, pe = seg(t, E0.t0, E0.t1, 'out');
    const A = o.absorb, ab = A ? seg(t, A.t0, A.t1, A.ease || 'inOut') : 0;
    const op = val(o.opacity, t, pe) * (A ? 1 - seg(t, A.fadeAt ?? A.t0, A.t1, 'in') : 1);
    d.style.display = op > 0.001 ? '' : 'none';
    if (op <= 0.001) return;
    if (!size) size = [d.offsetWidth, d.offsetHeight];
    let [x, y] = val(o.pos, t);
    x += (E0.dx || 0) * (1 - pe); y += (E0.dy || 0) * (1 - pe);
    let tr = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
    if (ab > 0) { // shrink toward the target point
      const to = o.absorb.to(t), s = lerp(1, 0.04, ab);
      tr = `translate(${lerp(x, to[0] - size[0] * s / 2, ab).toFixed(2)}px,${lerp(y, to[1] - size[1] * s / 2, ab).toFixed(2)}px) scale(${s})`;
    }
    d.style.transform = tr;
    d.style.opacity = op;
    const pp = seg(t, o.panel[0], o.panel[1], 'inOut');
    panel.style.clipPath = `inset(0 0 ${((1 - pp) * 100).toFixed(2)}% 0)`;
    panel.style.visibility = pp > 0 ? 'visible' : 'hidden';
    lns.forEach((ln, i) => { const lp = seg(t, o.lineIn[i][0], o.lineIn[i][1], 'out'); ln.style.opacity = lp; ln.style.transform = `translateY(${((1 - lp) * 8).toFixed(2)}px)`; });
    if (o.collapse) { // morph into "|TITLE": panel clips up, band fill fades, title recolours/shrinks, bar grows
      const C0 = o.collapse, cp = seg(t, C0.t0, C0.t1, 'inOut');
      const panelUp = seg(t, C0.t0, C0.t0 + 0.25 * (C0.t1 - C0.t0) / 0.6, 'in');
      if (cp > 0) {
        panel.style.clipPath = `inset(0 0 ${(Math.max(1 - pp, panelUp) * 100).toFixed(2)}% 0)`;
        d.style.filter = `drop-shadow(0 6px 8px rgba(40,50,60,${(0.22 * (1 - cp)).toFixed(3)}))`;
        d.style.borderRadius = lerp(8, 0, cp) + 'px';
        // band clears while the title switches white -> series colour at band alpha ~0.4 (never low contrast)
        const bandA = 1 - seg(cp, 0, 0.6, 'linear'), txtW = 1 - seg(cp, 0.33, 0.39, 'linear');
        band.style.background = `color-mix(in srgb, var(--c) ${(bandA * 100).toFixed(1)}%, transparent)`;
        band.style.color = `color-mix(in srgb, #ffffff ${(txtW * 100).toFixed(1)}%, var(--c))`;
        band.style.fontSize = lerp(104, C0.size || 80, cp) + 'px';
        band.style.height = band.style.lineHeight = lerp(112, C0.lineH || 104, cp) + 'px';
        // the |bar is an inset shadow, so it never changes layout (no jump on the first frame)
        band.style.boxShadow = `inset 6px 0 0 color-mix(in srgb, var(--c) ${(seg(t, C0.t0 + 0.2, C0.t1, 'out') * 100).toFixed(1)}%, transparent)`;
        band.style.paddingLeft = lerp(28, 22, cp) + 'px';
        const [x0, y0] = val(o.pos, t), to = C0.to;
        d.style.transform = `translate(${lerp(x0, to[0], cp).toFixed(2)}px,${lerp(y0, to[1], cp).toFixed(2)}px)`;
      } else {
        d.style.filter = ''; d.style.borderRadius = ''; band.style.background = ''; band.style.color = ''; band.style.fontSize = '';
        band.style.height = ''; band.style.lineHeight = ''; band.style.boxShadow = ''; band.style.paddingLeft = '';
      }
    }
  });
  return d;
}

function custom(fn) { onFrame(fn); }

// ---------- frame loop ----------
function renderAt(t) {
  cam = cameraAt(t);
  drawBase(t);
  for (const u of updaters) u(t);
  drawLifts(t);
}

window.E = { W, H, DEG, EASE, seg, env, bump, keyed, lerp, clamp01, setProjection, setCamera, cameraAt, toScreen, planeToScreen,
  feature, defineGroup, mainCentroid, fill, lift, arc, ellipse, poly, ring, ripple, glow, pin, card, bigCard, glyphSVG, custom, div, el, setA, underLandHooks,
  labelsRoot, onFrame, renderAt, levelFor, ppd,
  get cam() { return cam; }, get projection() { return projection; } };

// ---------- boot ----------
window.READY = false;
window.renderAt = t => { renderAt(t); return new Promise(r => requestAnimationFrame(() => r(true))); };
window.boot = async (duration) => {
  makeStatics();
  await Promise.all(['900', '700', '500'].map(w => document.fonts.load(`${w} 40px "Noto Sans TC"`)));
  await document.fonts.ready;
  const render = new URLSearchParams(location.search).has('render');
  document.body.classList.toggle('render', render);
  if (!render) {
    const stage = $('stage'), fit = () => { const s = Math.min(innerWidth / W, (innerHeight - 44) / H); stage.style.transform = `scale(${s})`; };
    fit(); addEventListener('resize', fit);
    const scrub = $('scrub'), tc = $('tc'), play = $('play');
    scrub.max = duration;
    let playing = false, t0 = 0, from = 0;
    const showT = t => { renderAt(t); scrub.value = t; tc.textContent = t.toFixed(2) + ' s'; };
    scrub.oninput = () => { playing = false; play.textContent = '▶'; showT(+scrub.value); };
    play.onclick = () => { playing = !playing; play.textContent = playing ? '❚❚' : '▶'; from = +scrub.value >= duration ? 0 : +scrub.value; t0 = performance.now(); };
    const tick = () => { if (playing) { const t = from + (performance.now() - t0) / 1000; showT(Math.min(t, duration)); if (t >= duration) { playing = false; play.textContent = '▶'; } } requestAnimationFrame(tick); };
    tick();
    const q = new URLSearchParams(location.search).get('t');
    showT(q ? +q : 0);
  } else {
    renderAt(0);
  }
  window.READY = true;
};
})();
