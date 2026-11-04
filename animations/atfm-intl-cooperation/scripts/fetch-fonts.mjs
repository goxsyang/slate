// Downloads Noto Sans TC (SIL OFL) static weights from Google Fonts into fonts/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEIGHTS = [500, 700, 900];
const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@${WEIGHTS.join(';')}`)).text();
const urls = [...css.matchAll(/font-weight: (\d+);[\s\S]*?url\((https:[^)]+\.ttf)\)/g)];
if (urls.length !== WEIGHTS.length) throw new Error('unexpected Google Fonts CSS:\n' + css);
for (const [, weight, url] of urls) {
  const file = path.join(root, 'fonts', `NotoSansTC-${weight}.ttf`);
  if (fs.existsSync(file)) { console.log('have', file); continue; }
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  fs.writeFileSync(file, buf);
  console.log(`wrote ${file} (${(buf.length / 1e6).toFixed(1)} MB)`);
}
