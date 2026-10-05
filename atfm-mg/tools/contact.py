#!/usr/bin/env python3
"""Tile rendered stills into a labelled contact sheet.

Usage: python3 tools/contact.py <stills_dir> <out.png> [cols=3] [thumb_w=640]
Stills are expected to be named t_SS.SS.png (as written by render.mjs).
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

src, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 3
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 640
files = sorted(f for f in os.listdir(src) if f.endswith(".png"))
th = round(tw * 1080 / 1920)
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (tw + 8) + 8, rows * (th + 8) + 8), (40, 44, 44))
try:
    font = ImageFont.truetype(os.path.join(os.path.dirname(__file__), "..", "fonts", "NotoSansTC-700.ttf"), 22)
except OSError:
    font = ImageFont.load_default()
for i, f in enumerate(files):
    im = Image.open(os.path.join(src, f)).convert("RGB").resize((tw, th), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    label = f[2:-4] + "s"
    d.rectangle((0, 0, 92, 30), fill=(196, 114, 89))
    d.text((6, 2), label, fill="white", font=font)
    x, y = 8 + (i % cols) * (tw + 8), 8 + (i // cols) * (th + 8)
    sheet.paste(im, (x, y))
sheet.save(out)
print(out, sheet.size)
