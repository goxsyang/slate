// Builds data/world.js from Natural Earth 1:10m countries (world-atlas) at three detail levels.
// The engine picks a level from the current zoom, so the world view stays cheap to redraw
// every frame while close-ups of East Asia keep full coastline detail.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as simplify from 'topojson-simplify';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEVELS = [1e-5, 2e-6, 4e-7, 4e-8]; // min spherical triangle area kept (steradians), coarse -> fine

function build(minWeight) {
  const src = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/world-atlas/countries-10m.json'), 'utf8'));
  src.objects.countries.geometries = src.objects.countries.geometries.filter(g => g.id !== '010'); // Antarctica
  let topo = simplify.presimplify(src, simplify.sphericalTriangleArea);
  topo = simplify.simplify(topo, minWeight);
  topo = simplify.filter(topo, simplify.filterWeight(topo, minWeight * 4, simplify.sphericalRingArea));
  // drop the simplification weights and round to ~10 m; this keeps the file small
  const r = x => Math.round(x * 1e4) / 1e4;
  topo.arcs = topo.arcs.map(arc => arc.map(([x, y]) => [r(x), r(y)]));
  return topo;
}

const levels = LEVELS.map(build);
const out = path.join(root, 'data/world.js');
fs.writeFileSync(out, '// Natural Earth 1:10m admin-0 countries via world-atlas@2.0.2 (public domain), simplified at '
  + LEVELS.length + ' levels (coarse -> fine).\nwindow.WORLD_LEVELS = ' + JSON.stringify(levels) + ';\n');
levels.forEach((t, i) => console.log(`level ${i}: ${t.arcs.reduce((n, a) => n + a.length, 0)} arc points, ${t.objects.countries.geometries.length} countries`));
console.log(`wrote ${out} (${(fs.statSync(out).size / 1e6).toFixed(2)} MB)`);
