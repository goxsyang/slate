// Time-driven map animation engine. Everything on screen is a pure function of t (seconds),
// so the page can be scrubbed in a browser and rendered frame-exactly by scripts/render.mjs.
(() => {
const W = 1920, H = 1080;
const svgNS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);

// ---------- easing / timing ----------
const EASE = {
  linear: x => x,
  in: d3.easeCubicIn, out: d3.easeCubicOut, inOut: d3.easeCubicInOut,
  sineInOut: d3.easeSinInOut, quartOut: d3.easePolyOut.exponent(4), quintInOut: d3.easePolyInOut.exponent(5),
  expOut: d3.easeExpOut, backOut: d3.easeBackOut.overshoot(1.25),
};
const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
// eased 0..1 progress of t through [a, b]
function seg(t, a, b, e = 'inOut') {
  if (b <= a) return t >= a ? 1 : 0;
  const f = typeof e === 'function' ? e : EASE[e];
  return f(clamp01((t - a) / (b - a)));
}
// fade in over [a, a+din], hold, fade out over [b-dout, b]
function env(t, a, din, b = Infinity, dout = 0.4, e = 'out') {
  return Math.min(seg(t, a, a + din, e), b === Infinity ? 1 : 1 - seg(t, b - dout, b, 'in'));
}
const lerp = (a, b, p) => a + (b - a) * p;

// ---------- geography ----------
// Three detail levels of the same countries (coarse -> fine); drawing picks one from the zoom.
const LEVELS = window.WORLD_LEVELS.map(topo => ({
  topo,
  // keyed by ISO 3166 numeric id; features without one (e.g. Kosovo) by 'n:' + name
  features: new Map(topojson.feature(topo, topo.objects.countries).features.map(f => [f.id && f.id !== '-99' ? f.id : 'n:' + f.properties.name, f])),
  land: topojson.merge(topo, topo.objects.countries.geometries),
  borders: topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b),
  coast: topojson.mesh(topo, topo.objects.countries, (a, b) => a === b),
}));
const FINE = LEVELS[LEVELS.length - 1];
// plane units per degree are ~17.45 at scale 1000; pick the level by screen px per degree
const levelFor = k => { const ppd = k * 17.45; return ppd < 9 ? 0 : ppd < 22 ? 1 : ppd < 55 ? 2 : 3; };

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
  featurePathCache.clear();
}
const featurePathCache = new Map();
// SVG path string (plane units) of a country at the finest level
function featurePath(id) {
  const f = FINE.features.get(id);
  if (!f) throw new Error('no country ' + id);
  return planePath(f);
}
// Path2D of a country at a given level (falls back to finer levels for tiny islands)
function featurePath2D(id, level) {
  const key = id + '@' + level;
  if (!featurePathCache.has(key)) {
    let f = null;
    for (let i = level; i < LEVELS.length && !f; i++) f = LEVELS[i].features.get(id);
    if (!f) throw new Error('no country ' + id);
    featurePathCache.set(key, new Path2D(planePath(f)));
  }
  return featurePathCache.get(key);
}
// plane-space centroid of the largest polygon (so e.g. Japan's anchor is on Honshu, not the sea)
function mainCentroid(id) {
  const f = FINE.features.get(id);
  if (f.geometry.type !== 'MultiPolygon') return planePath.centroid(f);
  let best = null, bestA = -1;
  for (const coords of f.geometry.coordinates) {
    const g = { type: 'Polygon', coordinates: coords }, a = planePath.area(g);
    if (a > bestA) { bestA = a; best = g; }
  }
  return planePath.centroid(best);
}

// ---------- camera ----------
// A view is [cx, cy, w] in plane units (w = visible plane width). Keyframes come as lon/lat boxes.
let cam = { cx: 0, cy: 0, k: 1 };
function viewFromBox([lon0, lat0, lon1, lat1], pad = 0) {
  const pts = [];
  for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) pts.push(projection([lerp(lon0, lon1, i / 8), lerp(lat0, lat1, j / 8)]));
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const w = Math.max(x1 - x0, (y1 - y0) * W / H) * (1 + pad);
  return [(x0 + x1) / 2, (y0 + y1) / 2, w];
}
let camKeys = [];
function setCamera(keys) {
  camKeys = keys.map(k => ({ ...k, view: k.view || viewFromBox(k.box, k.pad || 0) }));
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

// ---------- base map (canvas) ----------
const COLORS = { land: '#f3ede3', coast: '#cbc2b1', border: '#ddd4c4', halo: '#e2e8e2', shadow: 'rgba(96,112,104,0.42)' };
const baseCtx = $('base').getContext('2d');
const liftCtx = $('lift').getContext('2d');
const half = new OffscreenCanvas(W / 2, H / 2), halfCtx = half.getContext('2d');
let seaImg, grainPattern;

function makeStatics() {
  // sea: pale sage with a warm light falloff from the top-left, like the reference
  const sea = new OffscreenCanvas(W, H), g = sea.getContext('2d');
  const grad = g.createRadialGradient(W * 0.22, H * 0.1, 0, W * 0.22, H * 0.1, W * 1.15);
  grad.addColorStop(0, '#e3e4dc'); grad.addColorStop(0.45, '#cfd9d3'); grad.addColorStop(1, '#c3cec8');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  seaImg = sea;
  // paper grain (seeded, so every render is identical)
  const c = new OffscreenCanvas(512, 512), gc = c.getContext('2d'), img = gc.createImageData(512, 512);
  let s = 1234567;
  const rnd = () => (s = (s * 1103515245 + 12345) >>> 0) / 4294967296;
  for (let i = 0; i < 512 * 512; i++) {
    const v = 242 + rnd() * 13;
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

const fillLayers = [];   // country fills drawn on the base canvas, in registration order
const liftLayers = [];   // lifted silhouettes drawn on the lift canvas

function drawBase(t) {
  const ctx = baseCtx, m = camMatrix(), L = levelFor(cam.k), k = cam.k;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.drawImage(seaImg, 0, 0);
  // shallow-water halo and soft land shadow, blurred at half resolution (cheap) then upscaled
  halfCtx.setTransform(1, 0, 0, 1, 0, 0); halfCtx.clearRect(0, 0, W / 2, H / 2);
  halfCtx.filter = 'blur(3px)';
  halfCtx.setTransform(m[0] / 2, 0, 0, m[3] / 2, m[4] / 2, m[5] / 2);
  halfCtx.lineJoin = 'round';
  halfCtx.strokeStyle = COLORS.halo; halfCtx.lineWidth = 9 / k; halfCtx.stroke(base.coast[L]);
  halfCtx.filter = 'none';
  ctx.globalAlpha = 0.9; ctx.drawImage(half, 0, 0, W, H); ctx.globalAlpha = 1;
  halfCtx.setTransform(1, 0, 0, 1, 0, 0); halfCtx.clearRect(0, 0, W / 2, H / 2);
  halfCtx.filter = 'blur(1.5px)';
  halfCtx.setTransform(m[0] / 2, 0, 0, m[3] / 2, m[4] / 2, m[5] / 2 + 1.25);
  halfCtx.fillStyle = COLORS.shadow; halfCtx.fill(base.land[L]);
  halfCtx.filter = 'none';
  ctx.drawImage(half, 0, 0, W, H);
  // land, highlighted countries, borders, coastline
  ctx.setTransform(...m);
  ctx.fillStyle = COLORS.land; ctx.fill(base.land[L]);
  ctx.lineJoin = 'round';
  for (const f of fillLayers) {
    const s = f.style(t), op = s.opacity ?? 1;
    if (op <= 0.001) continue;
    const p = featurePath2D(f.id, L);
    ctx.globalAlpha = op; ctx.fillStyle = s.color; ctx.fill(p);
    f.lastStyle = s;
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = COLORS.border; ctx.lineWidth = 0.9 / k; ctx.stroke(base.borders[L]);
  for (const f of fillLayers) {   // white hairlines between highlighted countries
    const s = f.style(t), op = s.opacity ?? 1;
    if (op <= 0.001 || s.stroke === 'none') continue;
    ctx.globalAlpha = op; ctx.strokeStyle = s.stroke || '#ffffff'; ctx.lineWidth = (s.strokeWidth ?? 1.2) / k; ctx.stroke(featurePath2D(f.id, L));
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = COLORS.coast; ctx.lineWidth = 1 / k; ctx.stroke(base.coast[L]);
  // paper grain over everything on the map
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.5;
  ctx.fillStyle = grainPattern; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}

function drawLifts(t) {
  const ctx = liftCtx;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
  const L = levelFor(cam.k);
  for (const f of liftLayers) {
    const s = f.style(t), op = s.opacity ?? 1;
    if (op <= 0.001) continue;
    const c = planeToScreen(f.cPlane), sc = s.scale ?? 1, k = cam.k * sc;
    const X = sc * (W / 2 - cam.cx * cam.k) + c[0] * (1 - sc), Y = sc * (H / 2 - cam.cy * cam.k) + c[1] * (1 - sc) - (s.lift ?? 0);
    const p = featurePath2D(f.id, Math.max(L, 2));
    ctx.setTransform(k, 0, 0, k, X, Y);
    ctx.globalAlpha = op;
    const sh = (s.shadow ?? 1);
    if (sh > 0.001) {
      ctx.shadowColor = `rgba(51,67,60,${0.38 * sh})`; ctx.shadowBlur = 18 * sh; ctx.shadowOffsetY = (4 + (s.lift ?? 0) * 0.6) * sh;
    }
    ctx.fillStyle = s.color; ctx.fill(p);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.lineJoin = 'round'; ctx.strokeStyle = s.stroke || '#ffffff'; ctx.lineWidth = (s.strokeWidth ?? 1.5) / k; ctx.stroke(p);
  }
  ctx.globalAlpha = 1;
}

// ---------- element pools (created once, updated every frame) ----------
function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(svgNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
const setA = (e, attrs) => { for (const k in attrs) e.setAttribute(k, attrs[k]); };
const updaters = [];
const onFrame = fn => updaters.push(fn);

// Country fill in map space (base canvas). style(t) -> {color, opacity, stroke, strokeWidth}
function fill(id, style) { featurePath2D(id, 2); fillLayers.push({ id, style }); }

// Lifted silhouette (lift canvas): the country rises off the map with a soft shadow.
// style(t) -> {lift: px, scale, opacity, color, stroke, strokeWidth, shadow}
function lift(id, style) { featurePath2D(id, 2); liftLayers.push({ id, style, cPlane: mainCentroid(id) }); }

// Quadratic arc between two lon/lat points, drawn on over [t0, t1]. Screen space.
function bez(a, c, b, u) { const v = 1 - u; return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]]; }
function arc(o) {
  const g = el('g', {}, $(o.layer || 'over'));
  const glow = el('path', { fill: 'none', stroke: o.glow || '#ffffff', 'stroke-width': (o.width || 3) + 5, 'stroke-linecap': 'round', opacity: 0.55 }, g);
  const line = el('path', { fill: 'none', stroke: o.color, 'stroke-width': o.width || 3, 'stroke-linecap': 'round' }, g);
  const head = el('circle', { r: o.headR || 6, fill: o.color, stroke: '#fff', 'stroke-width': 2 }, g);
  const dots = Array.from({ length: o.particles || 0 }, () => el('circle', { r: o.particleR || 3.5, fill: '#fff', stroke: o.color, 'stroke-width': 1.5 }, g));
  onFrame(t => {
    const op = o.opacity ? o.opacity(t) : env(t, o.t0, 0.15, o.tOut ?? Infinity, 0.5);
    g.style.display = op <= 0.001 ? 'none' : '';
    if (op <= 0.001) return;
    g.setAttribute('opacity', op);
    let A = toScreen(o.from), B = toScreen(o.to);
    if (o.reverse) [A, B] = [B, A];
    const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy);
    const C = [(A[0] + B[0]) / 2 - dy / d * d * (o.bulge ?? 0.25), (A[1] + B[1]) / 2 + dx / d * d * (o.bulge ?? 0.25)];
    const p = seg(t, o.t0, o.t1, o.ease || 'inOut');
    const n = 48, pts = [];
    for (let i = 0; i <= n; i++) pts.push(bez(A, C, B, (i / n) * p));
    const dStr = 'M' + pts.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('L');
    line.setAttribute('d', dStr); glow.setAttribute('d', dStr);
    if (o.dash) { line.setAttribute('stroke-dasharray', o.dash); line.setAttribute('stroke-dashoffset', -(t * (o.dashSpeed ?? 40))); }
    const tip = pts[pts.length - 1];
    setA(head, { cx: tip[0], cy: tip[1], opacity: p > 0 && p < 1 ? 1 : (o.keepHead && p >= 1 ? 1 : 0) });
    dots.forEach((dot, i) => {
      const u = ((t * (o.particleSpeed ?? 0.45) + i / dots.length) % 1);
      const q = bez(A, C, B, u), vis = p >= 1 ? env(t, o.t1, 0.3) * Math.sin(Math.PI * u) : 0;
      setA(dot, { cx: q[0], cy: q[1], opacity: vis });
    });
  });
}

// Ellipse in map space with outer ruler ticks, drawn on as a sweep. Centre lon/lat, semi-axes in degrees.
function ruler(o) {
  const g = el('g', {}, $(o.layer || 'under'));
  const fillE = el('path', { fill: o.fill || o.color, 'fill-opacity': o.fillOpacity ?? 0.12, stroke: 'none' }, g);
  const ticks = el('path', { fill: 'none', stroke: o.color, 'stroke-width': 1.2, opacity: 0.55 }, g);
  const halo = el('path', { fill: 'none', stroke: '#ffffff', 'stroke-width': (o.width || 2.5) + 4, opacity: 0.5 }, g);
  const line = el('path', { fill: 'none', stroke: o.color, 'stroke-width': o.width || 2.5 }, g);
  const c = projection(o.center);
  const rx = Math.abs(projection([o.center[0] + o.rx, o.center[1]])[0] - c[0]);
  const ry = Math.abs(projection([o.center[0], o.center[1] + o.ry])[1] - c[1]);
  const rot = (o.rotate || 0) * Math.PI / 180;
  const ptAt = a => { const x = rx * Math.cos(a), y = ry * Math.sin(a); return [c[0] + x * Math.cos(rot) - y * Math.sin(rot), c[1] + x * Math.sin(rot) + y * Math.cos(rot)]; };
  onFrame(t => {
    const op = o.opacity ? o.opacity(t) : env(t, o.t0, 0.2, o.tOut ?? Infinity, 0.6);
    g.style.display = op <= 0.001 ? 'none' : '';
    if (op <= 0.001) return;
    g.setAttribute('opacity', op);
    const p = seg(t, o.t0, o.t1, o.ease || 'inOut');
    const a0 = (o.startAngle ?? -90) * Math.PI / 180, sweep = 2 * Math.PI * p * (o.dir ?? 1);
    const N = 220, pts = [];
    for (let i = 0; i <= N; i++) pts.push(planeToScreen(ptAt(a0 + sweep * i / N)));
    const d = 'M' + pts.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('L');
    line.setAttribute('d', d); halo.setAttribute('d', d);
    fillE.setAttribute('d', p >= 1 ? d + 'Z' : '');
    fillE.setAttribute('fill-opacity', (o.fillOpacity ?? 0.12) * seg(t, o.t1 - 0.2, o.t1 + 0.6, 'out'));
    // ruler ticks just outside the line, every 2.5 deg of parameter, every 4th one longer
    let td = '';
    const nT = Math.floor(144 * p);
    for (let i = 0; i < nT; i++) {
      const a = a0 + (o.dir ?? 1) * i * 2 * Math.PI / 144;
      const q = planeToScreen(ptAt(a)), q2 = planeToScreen(ptAt(a + 0.001 * (o.dir ?? 1)));
      let nx = q2[1] - q[1], ny = -(q2[0] - q[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      // make normal point outward
      const cs = planeToScreen(c); if ((q[0] - cs[0]) * nx + (q[1] - cs[1]) * ny < 0) { nx = -nx; ny = -ny; }
      const len = i % 4 === 0 ? 11 : 6;
      td += `M${(q[0] + nx * 5).toFixed(1)},${(q[1] + ny * 5).toFixed(1)}l${(nx * len).toFixed(1)},${(ny * len).toFixed(1)}`;
    }
    ticks.setAttribute('d', td);
  });
}

// Polyline / polygon in lon/lat drawn along its perimeter, with diamond nodes at vertices.
function poly(o) {
  const g = el('g', {}, $(o.layer || 'over'));
  const halo = el('path', { fill: 'none', stroke: '#fff', 'stroke-width': (o.width || 3) + 4, opacity: 0.55, 'stroke-linejoin': 'round' }, g);
  const fillP = el('path', { fill: o.fill || 'none', 'fill-opacity': o.fillOpacity ?? 0, stroke: 'none' }, g);
  const line = el('path', { fill: 'none', stroke: o.color, 'stroke-width': o.width || 3, 'stroke-linejoin': 'round' }, g);
  const nodes = (o.nodes || []).map(() => el('rect', { width: 10, height: 10, fill: o.nodeFill || '#fff', stroke: o.color, 'stroke-width': 2 }, g));
  // densify along great circles so edges bend correctly
  const ring = o.closed ? [...o.coords, o.coords[0]] : o.coords;
  const dense = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const it = d3.geoInterpolate(ring[i], ring[i + 1]);
    for (let j = 0; j < 20; j++) dense.push(it(j / 20));
  }
  dense.push(ring[ring.length - 1]);
  onFrame(t => {
    const op = o.opacity ? o.opacity(t) : env(t, o.t0, 0.2, o.tOut ?? Infinity, 0.5);
    g.style.display = op <= 0.001 ? 'none' : '';
    if (op <= 0.001) return;
    g.setAttribute('opacity', op);
    const pts = dense.map(toScreen);
    const lens = [0]; for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = lens[lens.length - 1], target = total * seg(t, o.t0, o.t1, o.ease || 'inOut');
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      if (lens[i] <= target) out.push(pts[i]);
      else { const u = (target - lens[i - 1]) / (lens[i] - lens[i - 1]); out.push([lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]); break; }
    }
    const d = 'M' + out.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('L');
    line.setAttribute('d', d); halo.setAttribute('d', d);
    fillP.setAttribute('d', target >= total ? d + 'Z' : '');
    if (o.fillOpacity) fillP.setAttribute('fill-opacity', o.fillOpacity * seg(t, o.t1, o.t1 + 0.5, 'out'));
    (o.nodes || []).forEach((ll, i) => {
      const q = toScreen(ll), vis = seg(t, o.t0 + (o.t1 - o.t0) * (o.nodeAt?.[i] ?? 1), o.t0 + (o.t1 - o.t0) * (o.nodeAt?.[i] ?? 1) + 0.25, 'backOut');
      setA(nodes[i], { x: -5, y: -5, transform: `translate(${q[0]},${q[1]}) rotate(45) scale(${vis})`, opacity: vis > 0 ? 1 : 0 });
    });
  });
}

// Pin: ring + dot at a lon/lat (screen space, constant size), pops in at t0.
function pin(o) {
  const g = el('g', {}, $(o.layer || 'over'));
  const pulse = el('circle', { fill: 'none', stroke: o.color, 'stroke-width': 2 }, g);
  const ring = el('circle', { r: 11, fill: '#fff', stroke: o.color, 'stroke-width': 2.5 }, g);
  const dot = el('circle', { r: 4.5, fill: o.color }, g);
  onFrame(t => {
    const op = o.opacity ? o.opacity(t) : env(t, o.t0, 0.25, o.tOut ?? Infinity, 0.4);
    g.style.display = op <= 0.001 ? 'none' : '';
    if (op <= 0.001) return;
    const q = toScreen(o.at), s = seg(t, o.t0, o.t0 + 0.4, 'backOut');
    g.setAttribute('transform', `translate(${q[0]},${q[1]}) scale(${(o.scale || 1) * s})`);
    g.setAttribute('opacity', op);
    // repeating sonar pulse
    const period = o.pulsePeriod || 1.6, u = ((t - o.t0) % period) / period;
    if (o.pulse && t > o.t0) setA(pulse, { r: 11 + u * (o.pulseR || 34), opacity: (1 - u) * 0.8 });
    else pulse.setAttribute('opacity', 0);
  });
}

// ---------- HTML label cards ----------
const labelsRoot = $('labels');
function div(cls, parent, html) { const d = document.createElement('div'); d.className = cls; if (html != null) d.innerHTML = html; parent.appendChild(d); return d; }

// Bilingual country card with a coloured left bar and an optional leader line to its pin.
// o: {zh, en, color, at:[lon,lat], dx, dy, t0, tOut, anchor:'left'|'right', size}
function card(o) {
  const d = div('card', labelsRoot, `<div class="zh">${o.zh}</div><div class="en">${o.en}</div>`);
  d.style.borderLeftColor = o.color;
  if (o.size) d.style.fontSize = o.size + 'px';
  const leader = o.leader === false ? null : el('path', { fill: 'none', stroke: '#7d847f', 'stroke-width': 1.3, opacity: 0.8 }, $('over'));
  onFrame(t => {
    const op = o.opacity ? o.opacity(t) : env(t, o.t0, 0.45, o.tOut ?? Infinity, 0.4);
    d.style.display = op <= 0.001 ? 'none' : '';
    if (leader) leader.style.display = d.style.display;
    if (op <= 0.001) return;
    const q = toScreen(o.at);
    const slide = (1 - seg(t, o.t0, o.t0 + 0.55, 'quartOut')) * 18;
    const w = d.offsetWidth, h = d.offsetHeight;
    let x = q[0] + (o.dx ?? 24), y = q[1] + (o.dy ?? 0) - h / 2;
    if (o.anchor === 'right') x = q[0] + (o.dx ?? -24) - w;
    d.style.transform = `translate(${x - slide * (o.anchor === 'right' ? -1 : 1)}px,${y}px)`;
    d.style.opacity = op;
    if (leader) {
      const ex = o.anchor === 'right' ? x + w : x, ey = y + h / 2;
      leader.setAttribute('d', `M${q[0]},${q[1]}L${ex},${ey}`);
      leader.setAttribute('opacity', 0.8 * op * seg(t, o.t0 + 0.1, o.t0 + 0.4));
    }
  });
  return d;
}

// Big header card (coloured band + white panel) that can collapse into a "|WORD" wordmark.
// o: {title, sub (html), color, x, y (screen px, top-left), t0, tOut, collapseAt, collapseTo:[x,y], scale}
function bigCard(o) {
  const d = div('big', labelsRoot, `<div class="band">${o.title}</div><div class="panel">${o.sub || ''}</div>`);
  d.style.setProperty('--c', o.color);
  const mark = div('mark', labelsRoot, o.title);
  mark.style.setProperty('--c', o.color);
  onFrame(t => {
    const op = o.opacity ? o.opacity(t) : env(t, o.t0, 0.5, o.tOut ?? Infinity, 0.5);
    const pos = typeof o.pos === 'function' ? o.pos(t) : [o.x, o.y];
    const coll = o.collapseAt != null ? seg(t, o.collapseAt, o.collapseAt + 0.6, 'inOut') : 0;
    const bandIn = seg(t, o.t0, o.t0 + 0.55, 'quartOut'), panelIn = seg(t, o.t0 + 0.2, o.t0 + 0.8, 'quartOut');
    d.style.display = op * (1 - coll) <= 0.001 ? 'none' : '';
    d.style.opacity = op * (1 - coll);
    d.style.transform = `translate(${pos[0]}px,${pos[1] + (1 - bandIn) * 24}px) scale(${(o.scale || 1) * (1 - 0.15 * coll)})`;
    d.firstChild.style.clipPath = `inset(0 ${(1 - bandIn) * 100}% 0 0)`;
    d.lastChild.style.clipPath = `inset(0 0 ${(1 - panelIn) * 100}% 0)`;
    const mOp = op * coll;
    mark.style.display = mOp <= 0.001 ? 'none' : '';
    if (mOp > 0.001) {
      const mp = typeof o.collapseTo === 'function' ? o.collapseTo(t) : o.collapseTo;
      mark.style.opacity = mOp;
      mark.style.transform = `translate(${mp[0]}px,${mp[1] + (1 - coll) * 16}px) scale(${o.markScale || 1})`;
    }
  });
  return d;
}

// Free text / custom DOM driven by a callback.
function custom(fn) { onFrame(fn); }

// ---------- frame loop ----------
function renderAt(t) {
  cam = cameraAt(t);
  drawBase(t);
  drawLifts(t);
  for (const u of updaters) u(t);
}

window.E = { W, H, EASE, seg, env, lerp, clamp01, setProjection, setCamera, cameraAt, toScreen, planeToScreen, featurePath, mainCentroid,
  fill, lift, arc, ruler, poly, pin, card, bigCard, custom, div, el, setA, labelsRoot, onFrame, renderAt, levelFor,
  get cam() { return cam; }, get projection() { return projection; } };

// ---------- boot ----------
window.READY = false;
window.renderAt = t => { renderAt(t); return new Promise(r => requestAnimationFrame(() => r(true))); };
window.boot = async (duration) => {
  makeStatics();
  await document.fonts.load('900 40px "Noto Sans TC"');
  await document.fonts.load('700 40px "Noto Sans TC"');
  await document.fonts.load('500 40px "Noto Sans TC"');
  await document.fonts.ready;
  const render = new URLSearchParams(location.search).has('render');
  document.body.classList.toggle('render', render);
  if (!render) {
    const stage = $('stage'), fit = () => { const s = Math.min(innerWidth / W, (innerHeight - 44) / H); stage.style.transform = `scale(${s})`; };
    fit(); addEventListener('resize', fit);
    const scrub = $('scrub'), tc = $('tc'), play = $('play');
    scrub.max = duration;
    let playing = false, t0 = 0, base = 0;
    const show = t => { renderAt(t); scrub.value = t; tc.textContent = t.toFixed(2) + ' s'; };
    scrub.oninput = () => { playing = false; play.textContent = '▶'; show(+scrub.value); };
    play.onclick = () => { playing = !playing; play.textContent = playing ? '❚❚' : '▶'; base = +scrub.value >= duration ? 0 : +scrub.value; t0 = performance.now(); };
    const tick = () => { if (playing) { const t = base + (performance.now() - t0) / 1000; show(Math.min(t, duration)); if (t >= duration) { playing = false; play.textContent = '▶'; } } requestAnimationFrame(tick); };
    tick();
    const q = new URLSearchParams(location.search).get('t');
    show(q ? +q : 0);
  } else {
    renderAt(0);
  }
  window.READY = true;
};
})();
