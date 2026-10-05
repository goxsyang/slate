#!/usr/bin/env node
/* Frame-accurate renderer for the composition in index.html.
 *
 *   node tools/render.mjs stills --times 0.5,3.2,7 [--review] [--out stills/]
 *   node tools/render.mjs video  [--out out/atfm.mp4] [--workers 3] [--review]
 *                                [--from 0] [--to 1800] [--crf 14] [--keep]
 *
 * Every frame N is captured at t = N / (60000/1001) via window.__seek(t), so
 * output frames line up 1:1 with a 59.94 fps edit timeline.
 */
import { createRequire } from "module";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import url from "url";

const require = createRequire(import.meta.url);
let pw;
try { pw = require("playwright"); } catch { pw = require("/opt/node-tools/node_modules/playwright"); }

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const FPS_NUM = 60000, FPS_DEN = 1001, FPS = FPS_NUM / FPS_DEN;

const argv = process.argv.slice(2);
const mode = argv[0] || "video";
const opt = (name, def) => {
  const i = argv.indexOf("--" + name);
  if (i < 0) return def;
  const v = argv[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
};

async function openPage(browser, review) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error("[pageerror]", e.message));
  page.on("console", (m) => { if (m.type() === "error") console.error("[console]", m.text()); });
  const q = "render=1" + (review ? "&review=1" : "");
  await page.goto(url.pathToFileURL(path.join(ROOT, "index.html")).href + "?" + q);
  await page.waitForFunction(() => window.__ready === true || window.__error, null, { timeout: 120000 });
  const err = await page.evaluate(() => window.__error || null);
  if (err) throw new Error("composition error:\n" + err);
  return page;
}

async function launch() {
  return pw.chromium.launch({
    args: ["--font-render-hinting=none", "--force-color-profile=srgb", "--hide-scrollbars", "--disable-lcd-text"],
  });
}

async function capture(page, t, file) {
  await page.evaluate((tt) => window.__seek(tt), t);
  await page.screenshot({ path: file, type: "png", clip: { x: 0, y: 0, width: 1920, height: 1080 }, animations: "disabled", caret: "hide" });
}

async function stills() {
  const times = String(opt("times", "0,5,10,15,20,25,29.9")).split(",").map(Number);
  const out = path.resolve(opt("out", path.join(ROOT, "stills")));
  fs.mkdirSync(out, { recursive: true });
  const browser = await launch();
  const page = await openPage(browser, !!opt("review", false));
  for (const t of times) {
    // snap to the frame grid so stills match video frames exactly
    const f = Math.round(t * FPS);
    const file = path.join(out, `t_${(f / FPS).toFixed(2).padStart(5, "0")}.png`);
    await capture(page, f / FPS, file);
    console.log(file);
  }
  await browser.close();
}

function run(cmd, args) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "inherit", "inherit"] });
    p.on("exit", (c) => (c === 0 ? res() : rej(new Error(cmd + " exited " + c))));
  });
}

async function video() {
  const outFile = path.resolve(opt("out", path.join(ROOT, "out", "atfm_benefits_5994.mp4")));
  const review = !!opt("review", false);
  const workers = parseInt(opt("workers", "3"), 10);
  const from = parseInt(opt("from", "0"), 10);
  const total = parseInt(opt("to", "1800"), 10);
  const crf = String(opt("crf", "14"));
  const framesDir = path.resolve(opt("frames", path.join(ROOT, "frames", review ? "review" : "master")));
  fs.mkdirSync(framesDir, { recursive: true });
  fs.mkdirSync(path.dirname(outFile), { recursive: true });

  const browser = await launch();
  const t0 = Date.now();
  let done = 0;
  const jobs = [];
  for (let w = 0; w < workers; w++) {
    jobs.push((async () => {
      const page = await openPage(browser, review);
      // contiguous chunks keep seeks monotonic within a worker
      const per = Math.ceil((total - from) / workers);
      const a = from + w * per, b = Math.min(total, a + per);
      for (let f = a; f < b; f++) {
        await capture(page, f / FPS, path.join(framesDir, `f_${String(f).padStart(5, "0")}.png`));
        done++;
        if (done % 60 === 0) {
          const el = (Date.now() - t0) / 1000;
          console.log(`  ${done}/${total - from} frames  ${(done / el).toFixed(1)} fps`);
        }
      }
      await page.close();
    })());
  }
  await Promise.all(jobs);
  await browser.close();

  await run("ffmpeg", [
    "-v", "error", "-y",
    "-framerate", `${FPS_NUM}/${FPS_DEN}`, "-start_number", String(from),
    "-i", path.join(framesDir, "f_%05d.png"),
    "-frames:v", String(total - from),
    "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-tune", "animation", "-crf", crf,
    "-profile:v", "high", "-level", "4.2",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
    "-timecode", "00:08:40;00",
    "-movflags", "+faststart",
    outFile,
  ]);
  console.log("wrote", outFile, `in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  if (!opt("keep", false)) fs.rmSync(framesDir, { recursive: true, force: true });
}

(mode === "stills" ? stills() : video()).catch((e) => { console.error(e); process.exit(1); });
