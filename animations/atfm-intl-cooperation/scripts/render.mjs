// Deterministic frame-by-frame render of index.html to MP4.
//   node scripts/render.mjs                         full render -> out/atfm-intl-cooperation.mp4
//   node scripts/render.mjs --stills 1,4.5,10       PNG stills only -> out/stills/
//   node scripts/render.mjs --audio narration.mp4   also mux a preview copy with that file's audio
// Each frame calls window.renderAt(t) and screenshots the page; no wall-clock timing is involved.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : def; };

const FPS_NUM = 60000, FPS_DEN = 1001;            // 59.94 fps, same as the narration master
const FPS = FPS_NUM / FPS_DEN;
const DURATION = Number(opt('duration', 17.4174)); // narration length in seconds
const WORKERS = Number(opt('workers', 3));
const OUT = path.resolve(root, opt('out', 'out/atfm-intl-cooperation.mp4'));
const AUDIO = opt('audio', null);
const STILLS = opt('stills', null);
const FRAMES_DIR = path.join(root, 'out/frames');
const pageUrl = pathToFileURL(path.join(root, 'index.html')).href + '?render=1';

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('pageerror:', e); process.exitCode = 1; });
  await page.goto(pageUrl);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  // Raw CDP capture: Playwright's page.screenshot() spends ~1 s per 1080p frame on PNG compression.
  page.cdp = await page.context().newCDPSession(page);
  return page;
}

async function shoot(page, t, file) {
  await page.evaluate(t => window.renderAt(t), t);
  const { data } = await page.cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
}

const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
try {
  if (STILLS) {
    const dir = path.join(root, 'out/stills');
    fs.mkdirSync(dir, { recursive: true });
    const page = await openPage(browser);
    for (const t of STILLS.split(',').map(Number)) {
      const file = path.join(dir, `t_${t.toFixed(2).padStart(5, '0')}.png`);
      await shoot(page, t, file);
      console.log(file);
    }
  } else {
    const total = Math.round(DURATION * FPS);
    fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
    const started = performance.now();
    let done = 0;
    await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
      const page = await openPage(browser);
      for (let i = w; i < total; i += WORKERS) {
        await shoot(page, i / FPS, path.join(FRAMES_DIR, `f_${String(i).padStart(5, '0')}.png`));
        if (++done % 60 === 0) console.log(`${done}/${total} frames (${((performance.now() - started) / 1000).toFixed(0)} s)`);
      }
    }));
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    const ff = (args) => { const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' }); if (r.status) throw new Error('ffmpeg failed'); };
    ff(['-framerate', `${FPS_NUM}/${FPS_DEN}`, '-i', path.join(FRAMES_DIR, 'f_%05d.png'),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709',
      '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', OUT]);
    console.log('wrote', OUT);
    if (AUDIO) {
      const withVo = OUT.replace(/\.mp4$/, '_with-narration.mp4');
      ff(['-i', OUT, '-i', AUDIO, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', withVo]);
      console.log('wrote', withVo);
    }
  }
} finally {
  await browser.close();
}
