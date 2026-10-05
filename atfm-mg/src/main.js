/* Boot: load fonts + images, build the master timeline, expose a seek API.
 *   ?render=1   frame-capture mode (no controls, no scaling)
 *   ?review=1   burn-in VO subtitle + edit-timeline timecode
 *   ?t=12.3     open paused at a time (seconds from T0)
 */
(function () {
  const qs = new URLSearchParams(location.search);
  const RENDER = qs.has("render");
  const REVIEW = qs.has("review");

  const ASSETS = [
    "assets/plane_side.png",
    "assets/plane_fly.png",
    "assets/rack.png",
    "assets/apron.png",
  ];

  function loadImage(src) {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => (im.decode ? im.decode().then(() => res(im), () => res(im)) : res(im));
      im.onerror = () => rej(new Error("image failed: " + src));
      im.src = src;
    });
  }

  async function loadFonts() {
    const sample = "把等待留在地面減碳燃油與空中盤旋 0123456789.CTOT萬億元";
    await Promise.all([300, 400, 500, 700, 900].map((w) => document.fonts.load(`${w} 40px "Noto Sans TC"`, sample)));
    await document.fonts.ready;
  }

  function fitStage() {
    const st = document.getElementById("stage");
    if (RENDER) { MG.stageScale = 1; st.style.transform = "none"; return; }
    const s = Math.min(window.innerWidth / 1920, (window.innerHeight - (REVIEW ? 0 : 60)) / 1080, 1);
    MG.stageScale = s;
    st.style.transform = `scale(${s})`;
  }

  function buildReview() {
    const r = document.getElementById("review");
    const sub = K.el("div", { cls: "sub" }, r);
    const tc = K.el("div", { cls: "tc" }, r);
    K.onFrame((t) => {
      const line = CUES.lines.find((l) => t >= l.start - 0.05 && t <= l.end + 0.15);
      const s = line ? line.text : "";
      if (sub.textContent !== s) sub.textContent = s;
      sub.style.display = s ? "block" : "none";
      tc.textContent = CUES.tcAt(t);
    });
  }

  async function boot() {
    if (RENDER) document.body.classList.add("render");
    if (REVIEW) document.body.classList.add("review");
    fitStage();
    window.addEventListener("resize", fitStage);

    await loadFonts();
    const ims = await Promise.all(ASSETS.map(loadImage));
    ASSETS.forEach((src, i) => (MG.images[src] = ims[i]));

    gsap.registerPlugin(CustomEase, DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin, SplitText);
    gsap.config({ force3D: false });
    gsap.ticker.lagSmoothing(0);

    const tl = gsap.timeline({ paused: true, defaults: { overwrite: false } });
    MG.tl = tl;
    MG.chrome(tl);
    for (const s of MG.scenes) {
      try {
        s.build(tl);
      } catch (e) {
        console.error("scene " + s.name + " failed", e);
        window.__error = (window.__error || "") + s.name + ": " + e.stack + "\n";
      }
    }
    if (REVIEW) buildReview();
    tl.set({}, {}, CUES.DURATION); // pin duration

    window.__duration = CUES.DURATION;
    window.__fps = CUES.FPS;
    window.__seek = function (t) {
      tl.seek(t, false);
      K.runFrame(t);
      return true;
    };
    // settle: seek to the end and back so every tween has rendered once
    window.__seek(CUES.DURATION);
    window.__seek(0);

    if (!RENDER) setupControls(tl);
    const t0 = parseFloat(qs.get("t"));
    if (!isNaN(t0)) window.__seek(t0);
    window.__ready = true;
  }

  function setupControls(tl) {
    const bar = document.getElementById("controls");
    bar.hidden = false;
    const scrub = document.getElementById("scrub");
    const tc = document.getElementById("tc");
    const btn = document.getElementById("play");
    let playing = false, startWall = 0, startT = 0, cur = 0;
    const show = (t) => { cur = t; window.__seek(t); scrub.value = t / CUES.DURATION; tc.textContent = CUES.tcAt(t) + "  (" + t.toFixed(2) + "s)"; };
    scrub.addEventListener("input", () => { playing = false; btn.textContent = "Play"; show(scrub.value * CUES.DURATION); });
    btn.addEventListener("click", () => {
      playing = !playing; btn.textContent = playing ? "Pause" : "Play";
      if (cur >= CUES.DURATION - 0.01) cur = 0;
      startWall = performance.now(); startT = cur;
    });
    window.addEventListener("keydown", (e) => { if (e.code === "Space") { e.preventDefault(); btn.click(); } });
    (function loop() {
      if (playing) {
        const t = startT + (performance.now() - startWall) / 1000;
        if (t >= CUES.DURATION) { playing = false; btn.textContent = "Play"; show(CUES.DURATION); } else show(t);
      }
      requestAnimationFrame(loop);
    })();
    show(0);
  }

  boot().catch((e) => { window.__error = String(e && e.stack || e); console.error(e); });
})();
