#!/usr/bin/env python3
"""Remove faint circular "ghost" marks baked into an extracted asset.

The reference frames carried two faint circles (wing root, engine exhaust)
on the parked plane. Each is replaced by a robust local estimate of the
surface (median of nearby non-outline pixels), blended in with a feathered
circular mask so no seams appear; dark outline pixels are never touched.

Usage: python3 tools/clean_asset.py assets/plane_side.png
"""
import sys

import numpy as np
from numpy.lib.stride_tricks import sliding_window_view as swv
from PIL import Image

# (cx, cy, r_inner, r_outer, window_h, window_w) in asset pixels
GHOSTS = {
    "plane_side": [
        (232.5, 243.0, 37, 48, 3, 181),   # wing-root disc: horizontal median keeps the vertical gradient
        (557.0, 291.0, 27, 36, 17, 17),   # engine exhaust arc
    ],
}


def clean(arr, cx, cy, r0, r1, wy, wx, hi=34.0, lum_min=165.0):
    h, w = arr.shape[:2]
    x0, x1 = int(max(cx - r1 - 2, 0)), int(min(cx + r1 + 3, w))
    y0, y1 = int(max(cy - r1 - 2, 0)), int(min(cy + r1 + 3, h))
    py, px = wy // 2, wx // 2
    pad = np.pad(arr, ((py, py), (px, px), (0, 0)), mode="edge")
    reg = pad[y0:y1 + 2 * py, x0:x1 + 2 * px]
    faint = (reg[..., :3].mean(axis=2) > lum_min) & (reg[..., 3] > 250)
    yy, xx = np.mgrid[y0:y1, x0:x1]
    d = np.hypot(xx - cx, yy - cy)
    wgt = np.clip((r1 - d) / (r1 - r0), 0, 1)
    f = faint[py:py + (y1 - y0), px:px + (x1 - x0)]
    out = arr.copy()
    # correct luminance only (the ghosts are neutral greys), so hue never shifts
    lum = reg[..., :3].mean(axis=2)
    with np.errstate(all="ignore"):
        med = np.nanmedian(swv(np.where(faint, lum, np.nan), (wy, wx)), axis=(2, 3))
    cur = arr[y0:y1, x0:x1, :3].mean(axis=2)
    ok = f & (np.abs(med - cur) < hi) & ~np.isnan(med)
    delta = np.where(ok, med - cur, 0.0) * wgt
    out[y0:y1, x0:x1, :3] = np.clip(arr[y0:y1, x0:x1, :3] + delta[..., None], 0, 255)
    return out


def main(path):
    name = path.rsplit("/", 1)[-1].rsplit(".", 1)[0]
    arr = np.asarray(Image.open(path).convert("RGBA")).astype(np.float32)
    for g in GHOSTS.get(name, []):
        arr = clean(arr, *g)
    Image.fromarray(np.clip(arr + 0.5, 0, 255).astype(np.uint8), "RGBA").save(path, optimize=True)
    print("cleaned", path)


if __name__ == "__main__":
    main(sys.argv[1])
