#!/usr/bin/env python3
"""Subset Noto Sans TC to the glyphs used by the composition -> fonts/subset/*.woff2.

Scans index.html and src/**/*.js for every character, adds printable ASCII
and common CJK punctuation, and writes WOFF2 subsets next to the full TTFs.
Run after changing any on-screen text:  python3 tools/subset_fonts.py
"""
import glob
import os

from fontTools import subset

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
chars = set(chr(c) for c in range(0x20, 0x7F))
chars |= set("，。、；：「」『』（）！？・·—–…％＋－×÷≈→←↑↓₂²³　")
for path in [os.path.join(ROOT, "index.html")] + glob.glob(os.path.join(ROOT, "src", "**", "*.js"), recursive=True):
    with open(path, encoding="utf-8") as f:
        chars |= set(f.read())
text = "".join(sorted(c for c in chars if c.isprintable() or c == "　"))

out_dir = os.path.join(ROOT, "fonts", "subset")
os.makedirs(out_dir, exist_ok=True)
for w in (300, 400, 500, 700, 900):
    src = os.path.join(ROOT, "fonts", f"NotoSansTC-{w}.ttf")
    dst = os.path.join(out_dir, f"NotoSansTC-{w}.woff2")
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    font = subset.load_font(src, opts)
    sub = subset.Subsetter(opts)
    sub.populate(text=text)
    sub.subset(font)
    subset.save_font(font, dst, opts)
    print(dst, os.path.getsize(dst) // 1024, "KB")
print(len(text), "characters")
