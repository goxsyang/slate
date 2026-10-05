/* Slide chrome: eyebrow + title (top-left) and footnote (bottom-left),
 * identical in placement/typography to the v4 reference slides.  Each state
 * swaps in with the masked character rise; the outgoing state lifts away.
 */
(function () {
  const { C, L } = K;
  const W = CUES.words;

  // [in-time, eyebrow, title]
  const HEADERS = [
    { at: 0.0, eyebrow: "單日案例 · 5 月 5 日", title: "把等待留在地面" },
    { at: 5.62, eyebrow: "協調帶來的效益", title: "減碳、燃油與空中盤旋" },
    { at: W.atfm - 0.55, eyebrow: "ATFM 航空交通流量管理", title: "為航空公司帶來的真實價值", mark: { chars: 4, at: W.value } },
    { at: 17.25, eyebrow: "03　投入範圍", title: "硬體投入，自主研發完成" },
    { at: 24.45, eyebrow: "04　公共價值", title: "為國家節省公帑" },
  ];
  // header 2 -> 3 keeps the gap silent; chrome clears during the VO pause
  const CLEAR_AT = 16.55;

  const FOOTS = [
    { at: 0.55, out: 5.5, text: "CTOT 為時段安排；528 分鐘是累計地面等待時間。" },
    { at: 5.85, out: CLEAR_AT, text: "57.9 噸為原稿案例數據，並非畫面中單架航機的排放量。" },
    { at: 17.6, out: 24.3, text: "645 萬元僅對應硬體費用；全案的人力、研發、建置與維護須另依口徑核算。" },
    { at: 24.75, out: null, text: "以 645 萬元為 1 格；約 4 億元 ≈ 62 格。" },
  ];

  // SplitText collapses U+3000 into a plain space; restore the full-width gap
  // of 「03　投入範圍」 (reference ≈ 1.1 em) on the character before it.
  function keepIdeographicSpace(node, str) {
    const idx = str.indexOf("\u3000");
    if (idx < 0) return;
    const before = str.slice(0, idx).replace(/\s/g, "").length;
    const chars = K.charsOf(node);
    if (before > 0) chars[before - 1].parentNode.style.marginRight = "0.74em";
  }

  MG.chrome = function (tl) {
    const root = document.getElementById("chrome");

    HEADERS.forEach((h, i) => {
      const next = HEADERS[i + 1];
      const eb = K.text(root, h.eyebrow, { x: L.marginX, y: L.eyebrowY, size: 26, weight: 500, color: C.gray, ls: 0.02, cls: "eyebrow" });
      keepIdeographicSpace(eb, h.eyebrow);
      const ti = K.text(root, h.title, { x: L.marginX, y: L.titleY, size: 57, weight: 700, color: C.teal, ls: 0, cls: "title" });
      K.textIn(tl, eb, h.at, { dur: 0.8, stagger: 0.018 });
      K.textIn(tl, ti, h.at + 0.12, { dur: 0.95, stagger: 0.032 });

      // VO emphasis: terracotta underline under the last N title characters
      let mark = null;
      if (h.mark) {
        const masks = K.charsOf(ti).map((c) => c.parentNode);
        const sel = masks.slice(-h.mark.chars);
        const r0 = root.getBoundingClientRect(), s = MG.stageScale;
        const a = sel[0].getBoundingClientRect(), b = sel[sel.length - 1].getBoundingClientRect();
        mark = K.el("div", { cls: "abs title-mark", style: {
          left: (a.left - r0.left) / s + 2, top: L.titleY + 74, width: (b.right - a.left) / s - 4, height: 6,
          background: C.terra, borderRadius: "3px", transformOrigin: "0% 50%" } }, root);
        tl.fromTo(mark, { scaleX: 0 }, { scaleX: 1, duration: 0.75, ease: "expo.out" }, h.mark.at);
      }

      // exit: either at the next header's in-time, or at the silent gap
      let outAt = null;
      if (next) outAt = next.at - 0.32;
      if (h.at < CLEAR_AT && next && next.at > CLEAR_AT) outAt = CLEAR_AT;
      if (outAt != null) {
        K.textOut(tl, eb, outAt, { dur: 0.4, stagger: 0.008 });
        K.textOut(tl, ti, outAt + 0.04, { dur: 0.42, stagger: 0.01 });
        if (mark) tl.to(mark, { scaleX: 0, transformOrigin: "100% 50%", duration: 0.4, ease: "power2.in", immediateRender: false }, outAt);
      }
    });

    FOOTS.forEach((f) => {
      const n = K.text(root, f.text, { x: L.marginX, y: L.footY, size: 26, weight: 400, color: C.gray, ls: 0, cls: "foot" });
      tl.fromTo(n, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" }, f.at);
      if (f.out != null) tl.to(n, { autoAlpha: 0, duration: 0.35, ease: "power1.in", immediateRender: false }, f.out);
    });
  };

  MG.HEADERS = HEADERS;
})();
