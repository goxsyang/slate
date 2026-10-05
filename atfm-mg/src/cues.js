/* Voice-over cue sheet.
 *
 * The edit timeline is 59.94 fps drop-frame (timecodes use ";").  Every time
 * in this project is "seconds from T0", where T0 = 00;08;40;00 on the edit
 * timeline, i.e. the first frame of this animation clip.  Converting through
 * real drop-frame frame counts keeps frame N of the render aligned with
 * timeline frame (T0 + N) when the clip is dropped at 00;08;40;00.
 */
(function () {
  const FPS = 60000 / 1001;

  function tcToFrames(tc) {
    const [h, m, s, f] = tc.split(/[:;]/).map(Number);
    const totalMin = h * 60 + m;
    const dropped = 4 * (totalMin - Math.floor(totalMin / 10));
    return (h * 3600 + m * 60 + s) * 60 + f - dropped;
  }

  const T0 = "00;08;40;00";
  const T0_FRAMES = tcToFrames(T0);
  const t = (tc) => (tcToFrames(tc) - T0_FRAMES) / FPS;

  function framesToTc(frames) {
    // inverse of tcToFrames for 59.94 DF
    const D = 4, perMin = 3600 - D, per10 = 36000 - 9 * D;
    const tens = Math.floor(frames / per10);
    let rem = frames % per10;
    let adj = 9 * D * tens;
    if (rem > D) adj += D * Math.floor((rem - D) / perMin);
    const n = frames + adj;
    const ff = n % 60, ss = Math.floor(n / 60) % 60, mm = Math.floor(n / 3600) % 60, hh = Math.floor(n / 216000);
    const p = (v) => String(v).padStart(2, "0");
    return `${p(hh)};${p(mm)};${p(ss)};${p(ff)}`;
  }

  // Line 1 has no timecode in the brief; it ends where line 2 begins and is
  // assumed to start ~0.3 s into the clip.
  const lines = [
    { id: "L1", start: 0.3, end: t("00;08;43;13"), text: "以 5 月 5 日 38 個 CTOT" },
    { id: "L2", start: t("00;08;43;13"), end: t("00;08;48;40"), text: "累計 528 分鐘的地面等待　一口氣省下了 57.9 噸的 CO2" },
    { id: "L3", start: t("00;08;49;11"), end: t("00;08;52;14"), text: "同時也是燃油成本　與空中盤旋風險的縮減" },
    { id: "L4", start: t("00;08;52;14"), end: t("00;08;55;56"), text: "這就是 ATFM 為航空公司帶來的真實價值" },
    { id: "L5", start: t("00;08;58;32"), end: t("00;09;04;17"), text: "這套系統我們僅以 645 萬硬體費用　自主研發完成" },
    { id: "L6", start: t("00;09;05;05"), end: t("00;09;07;58"), text: "為國家節省了　約 4 億元的公帑" },
  ];

  // Estimated word anchors inside each line (seconds from T0).  These are
  // where the key words should land on screen; tune them against the real VO.
  const words = {
    date: 0.45,        // 「5 月 5 日」
    ctot38: 1.55,      // 「38 個 CTOT」
    min528: 3.75,      // 「528 分鐘」
    ground: 5.0,       // 「地面等待」
    co2Lead: 5.95,     // 「一口氣省下了」
    t579: 6.95,        // 「57.9 噸」
    co2: 8.1,          // 「CO2」
    fuel: 9.85,        // 「燃油成本」
    holding: 10.85,    // 「空中盤旋風險」
    cut: 11.75,        // 「縮減」
    atfm: 12.85,       // 「ATFM」
    airline: 13.75,    // 「為航空公司帶來的」
    value: 15.0,       // 「真實價值」
    system: 18.55,     // 「這套系統」
    w645: 19.9,        // 「645 萬」
    hardware: 20.85,   // 「硬體費用」
    selfDev: 22.4,     // 「自主研發完成」
    nation: 25.04,     // 「為國家節省了」
    yi4: 26.35,        // 「約 4 億元」
    publicFund: 27.2,  // 「的公帑」
  };

  const DURATION_FRAMES = 1800; // 30.03 s, ends 00;09;10;0x
  window.CUES = {
    FPS, T0, t, tcToFrames, framesToTc, lines, words,
    DURATION_FRAMES,
    DURATION: DURATION_FRAMES / FPS,
    tcAt: (sec) => framesToTc(T0_FRAMES + Math.round(sec * FPS)),
  };
})();
