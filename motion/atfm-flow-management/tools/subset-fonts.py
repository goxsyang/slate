"""Subset the project fonts to the characters actually used.

Scans index.html, compositions/*.html, assets/*.js|css (except map-data/vendor) and
DESIGN.md/STORYBOARD.md, then writes assets/fonts/NotoSansTC.woff2 (variable wght) and
IBMPlexMono-{Medium,SemiBold}.woff2. Re-run after any copy change:
    python3 tools/subset-fonts.py
Sources live in tools/fonts-src/ (download: google/fonts ofl/notosanstc, ofl/ibmplexmono).
"""
import glob, os, subprocess, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = [os.path.join(root, p) for p in ["index.html", "DESIGN.md", "STORYBOARD.md"]]
files += glob.glob(os.path.join(root, "compositions", "*.html"))
files += [f for f in glob.glob(os.path.join(root, "assets", "*.js")) + glob.glob(os.path.join(root, "assets", "*.css")) if "map-data" not in f]
chars = set(chr(c) for c in range(0x20, 0x7F))
chars |= set("　，、。：；！？（）「」『』〈〉《》・—–…＋／｜％°→←↑↓✓×・")
for f in files:
    if os.path.exists(f):
        chars |= set(open(f, encoding="utf-8").read())
chars = {c for c in chars if c >= " "}
text = "".join(sorted(chars))
src = os.path.join(root, "tools", "fonts-src")
out = os.path.join(root, "assets", "fonts")
os.makedirs(out, exist_ok=True)
jobs = [("NotoSansTC-VF.ttf", "NotoSansTC.woff2"), ("IBMPlexMono-Medium.ttf", "IBMPlexMono-Medium.woff2"), ("IBMPlexMono-SemiBold.ttf", "IBMPlexMono-SemiBold.woff2")]
for s, o in jobs:
    subprocess.run([sys.executable, "-m", "fontTools.subset", os.path.join(src, s), "--text=" + text,
                    "--flavor=woff2", "--layout-features=*", "--output-file=" + os.path.join(out, o)], check=True)
    print(o, os.path.getsize(os.path.join(out, o)), "bytes;", len(chars), "chars")
