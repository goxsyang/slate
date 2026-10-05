#!/usr/bin/env python3
"""Extract illustration assets (with alpha) from the v4 reference video.

The reference illustrations sit on a pure-white canvas. For each asset we
average a run of static frames (to cancel H.264 noise), flood-fill the
near-white background from the crop border, and turn it into transparency
with an anti-aliased edge (white is un-premultiplied out of edge pixels).

Usage: python3 tools/extract_assets.py <reference.mp4> [out_dir]
"""
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image
from scipy import ndimage

REF = sys.argv[1] if len(sys.argv) > 1 else "ref.mp4"
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "..", "assets")

# name: (crop box x0,y0,x1,y1 in 1920x1080, first frame, last frame @30fps, mode, erase)
#   mode "cut"  -> flood-fill white background to alpha
#   mode "keep" -> keep opaque (used for photographic-ish backdrops)
#   erase: rectangles (frame coords) painted white first, to drop neighbouring
#          elements that share the crop (stopwatch above the parked plane, etc.)
ASSETS = {
    "plane_side": ((862, 492, 1798, 849), 767, 780, "cut", [(1310, 400, 1560, 668)]),
    "plane_fly": ((122, 476, 1340, 838), 830, 830, "cut", [(1225, 735, 1400, 940)]),
    "rack": ((150, 258, 712, 822), 1300, 1350, "cut", []),
    "apron": ((880, 120, 1920, 560), 1700, 1780, "keep", []),
}


def grab_frames(first, last, tmp):
    paths = []
    for i in range(first, last + 1):
        p = os.path.join(tmp, f"f{i:05d}.png")
        t = (i - 1) / 30.0
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.4f}", "-i", REF, "-frames:v", "1", p],
            check=True,
        )
        paths.append(p)
    return paths


def average(paths, box):
    acc = None
    for p in paths:
        a = np.asarray(Image.open(p).convert("RGB").crop(box), dtype=np.float32)
        acc = a if acc is None else acc + a
    return acc / len(paths)


def cut_white(rgb):
    """rgb float32 HxWx3 (0..255) -> RGBA uint8 with white background removed."""
    lo = rgb.min(axis=2)
    spread = rgb.max(axis=2) - lo
    near_white = (lo > 222) & (spread < 34)
    labels, _ = ndimage.label(near_white)
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    border = border[border > 0]
    bg = np.isin(labels, border)
    # grow background by 1px into the anti-aliased fringe, then soften
    fringe = ndimage.binary_dilation(bg, iterations=2) & ~bg
    alpha = np.where(bg, 0.0, 1.0)
    # fringe alpha from darkness relative to white
    dark = (255.0 - lo) / 255.0
    alpha = np.where(fringe, np.clip(dark * 2.2, 0, 1), alpha)
    alpha = ndimage.gaussian_filter(alpha, 0.6)
    alpha = np.where(bg & ~fringe, 0.0, alpha)
    a = np.clip(alpha, 0, 1)[..., None]
    # un-premultiply the white matte from semi-transparent edge pixels
    safe = np.maximum(a, 1e-3)
    col = np.where(a < 0.999, (rgb - (1 - a) * 255.0) / safe, rgb)
    col = np.clip(col, 0, 255)
    out = np.concatenate([col, a * 255.0], axis=2)
    return Image.fromarray((out + 0.5).astype(np.uint8), "RGBA")


def main():
    os.makedirs(OUT, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for name, (box, first, last, mode, erase) in ASSETS.items():
            rgb = average(grab_frames(first, last, tmp), box)
            for ex0, ey0, ex1, ey1 in erase:
                x0, y0 = max(ex0 - box[0], 0), max(ey0 - box[1], 0)
                x1, y1 = min(ex1 - box[0], rgb.shape[1]), min(ey1 - box[1], rgb.shape[0])
                if x1 > x0 and y1 > y0:
                    rgb[y0:y1, x0:x1] = 255.0
            if mode == "cut":
                img = cut_white(rgb)
                bbox = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
                img = img.crop(bbox)
            else:
                img = Image.fromarray((np.clip(rgb, 0, 255) + 0.5).astype(np.uint8), "RGB")
            path = os.path.join(OUT, f"{name}.png")
            img.save(path, optimize=True)
            print(f"{name}: {img.size} -> {path}")


if __name__ == "__main__":
    main()
