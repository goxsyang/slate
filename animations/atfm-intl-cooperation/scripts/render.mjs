// Deterministic frame-by-frame render of index.html to MP4.
//   node scripts/render.mjs                         full render -> out/atfm-intl-cooperation.mp4
//   node scripts/render.mjs --stills 1,4.5,10       PNG stills only -> out/stills/
//   node scripts/render.mjs --audio narration.mp4   also mux a preview copy with that file's audio
//   node scripts/render.mjs --scale 2 --out out/atfm-intl-cooperation_4K.mp4   native 3840x2160 (same layout, 2x pixels)
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
const SCALE = Number(opt('scale', 1));   // device pixels per CSS px: 2 renders 3840x2160
const CRF = opt('crf', SCALE > 1 ? '17' : '14'); // 4K at CRF 17: PSNR ~50.9 dB vs lossless, ~28 MB
const FRAMES_DIR = path.join(root, SCALE > 1 ? `out/frames_x${SCALE}` : 'out/frames');
const pageUrl = pathToFileURL(path.join(root, 'index.html')).href + '?render=1';

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: SCALE });
  page.on('pageerror', e => { console.error('pageerror:', e); process.exitCode = 1; });
  await page.goto(pageUrl);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  // Raw CDP capture: Playwright's page.screenshot() spends ~1 s per 1080p frame on PNG compression.
  page.cdp = await page.context().newCDPSession(page);
  return page;
}

async function shoot(page, t, file) {
  await page.evaluate(t => window.renderAt(t), t);
  // clip.scale = device scale: without it CDP returns CSS-px size even when deviceScaleFactor > 1
  const { data } = await page.cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true,
    clip: { x: 0, y: 0, width: 1920, height: 1080, scale: SCALE } });
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
}

const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
try {
  if (STILLS) {
    const dir = path.join(root, SCALE > 1 ? `out/stills_x${SCALE}` : 'out/stills');
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
    // Determinism check: re-render a few frames on a fresh page and compare with the workers' output.
    // A fresh page's first raster can differ from a warm one by a few anti-aliasing levels on edge pixels,
    // so allow that, but fail on anything bigger (e.g. labels landing on different sub-pixel phases per worker).
    const chk = await openPage(browser);
    for (const i of [total - 1, Math.floor(total / 2), WORKERS + 1]) {
      const f = path.join(FRAMES_DIR, 'chk.png');
      await shoot(chk, (i - WORKERS) / FPS, f);
      await shoot(chk, i / FPS, f);
      const pair = [f, path.join(FRAMES_DIR, `f_${String(i).padStart(5, '0')}.png`)].map(p => fs.readFileSync(p).toString('base64'));
      const { any, big } = await chk.evaluate(async ([a, b]) => {
        const px = async b64 => {
          const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob());
          const c = new OffscreenCanvas(bmp.width, bmp.height).getContext('2d');
          c.drawImage(bmp, 0, 0); return c.getImageData(0, 0, bmp.width, bmp.height).data;
        };
        const [x, y] = await Promise.all([px(a), px(b)]);
        let any = 0, big = 0;
        for (let k = 0; k < x.length; k += 4) {
          const d = Math.max(Math.abs(x[k] - y[k]), Math.abs(x[k + 1] - y[k + 1]), Math.abs(x[k + 2] - y[k + 2]));
          if (d > 0) any++; if (d > 48) big++;
        }
        return { any, big };
      }, pair);
      fs.rmSync(f);
      if (any > 2000 || big > 200) throw new Error(`frame ${i} differs between renders: ${any} px changed, ${big} by more than 48 levels`);
    }
    console.log('determinism check passed');
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    const ff = (args) => { const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' }); if (r.status) throw new Error('ffmpeg failed'); };
    ff(['-framerate', `${FPS_NUM}/${FPS_DEN}`, '-i', path.join(FRAMES_DIR, 'f_%05d.png'),
      // convert RGB with the BT.709 matrix the stream is tagged with (swscale defaults to BT.601)
      '-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', CRF, '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709',
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
