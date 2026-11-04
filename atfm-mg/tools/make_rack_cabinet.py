#!/usr/bin/env python3
"""Build assets/rack_cabinet.png from assets/rack.png (client revision S3).

The reference raster shows the server cabinet plus a side table carrying a
small switch, with the patch cables leaving the cabinet to that switch.  The
client wants ONE tidy cabinet with no cable leaving it, so this script:

  * crops to the cabinet (x 0-323) and drops the side table, the gap and the
    ragged extracted floor (the scene draws its own floor band);
  * straightens the cable bundle in the gutter below y 290 (it used to bend
    out to the table) by tiling a clean straight section of the same gutter,
    and adds a third cable tie at y 327-343 to keep the tie rhythm;
  * fills the two empty blank panels at the bottom (y 418-527) with a mirror
    image of the top "switch + cable fan" band (y 35-144): the four patch
    leads now run down the gutter and fan into a second 1U unit (patch
    panel) inside the cabinet, so the cabling reads as a closed, complete
    system;
  * writes a two-panel sprite (width 2 x 324): left = the assembled cabinet,
    right = the same cabinet empty (no units, no cables, clean gutter), which
    the scene uses to assemble the rack.

PNG coordinates of everything above x 322 / y 418 stay identical to
rack.png, so the scene's unit and LED coordinates still apply.  Mirrored
rows map y -> 562 - y (pixel rows) / 563 - y (continuous coordinates).

Usage: python3 tools/make_rack_cabinet.py   (writes assets/rack_cabinet.png)
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = os.path.join(ROOT, "assets", "rack.png")
OUT = os.path.join(ROOT, "assets", "rack_cabinet.png")

W = 324          # cabinet outline ends at x 321
H = 561
UX0, UX1 = 40, 292  # unit slot incl. mounting ears (rails sit inside it)
GX0 = 292           # gutter + side panel: x 292 .. 321


def tile_rows(dst, src, x0, x1, sy0, sy1, dy0, dy1):
    """Fill dst[dy0:dy1, x0:x1] by repeating src[sy0:sy1, x0:x1]."""
    sh = sy1 - sy0
    y = dy0
    while y < dy1:
        h = min(sh, dy1 - y)
        dst[y:y + h, x0:x1] = src[sy0:sy0 + h, x0:x1]
        y += h


def main():
    orig = np.array(Image.open(SRC).convert("RGBA"))
    full = orig[:, :W].copy()

    # -- crop: nothing right of the cabinet outline
    full[:, 322:] = 0

    # -- floor: the extracted floor/shadow goes, the two feet stay
    full[528:, :11] = 0
    full[559:, :] = 0
    feet = np.zeros((H, W), bool)
    feet[546:559, 17:51] = True
    feet[546:559, 282:317] = True
    rows = np.zeros((H, W), bool)
    rows[548:559, :] = True
    light = full[:, :, :3].astype(int).mean(axis=2) > 150
    full[(rows & ~feet) | (rows & feet & light)] = 0

    # -- gutter: the bundle used to bend out to the table from y ~296; carry
    #    the straight section (y 160-232, between the ties) down to y 418
    tile_rows(full, orig, GX0, 322, 160, 232, 290, 418)
    # third cable tie (copy of the one at y 237-247)
    full[327:344, GX0:310] = orig[234:251, GX0:310]

    # -- bottom: mirror the top band (y 35-144: interior, switch, cable fan,
    #    top of the bundle) into y 418-527
    band = orig[35:145, UX0:322][::-1]
    full[418:528, UX0:322] = band

    # -- empty cabinet: units, plugs and cables painted out
    empty = full.copy()
    BAND = (26, 55)  # clean interior rows above the top switch
    for y0, y1 in [(55, 145), (145, 201), (211, 267), (277, 349), (362, 418), (418, 508)]:
        tile_rows(empty, full, UX0, UX1, BAND[0], BAND[1], y0, y1)
    # clean gutter: per-column median of the original's lower gutter (no
    #    cables ran there), repeated, so the empty channel has no tile seams
    clean = np.median(orig[436:524, GX0:322].astype(float), axis=0).round().astype(np.uint8)
    empty[120:442, GX0:322] = clean[None, :, :]

    sprite = np.zeros((H, 2 * W, 4), np.uint8)
    sprite[:, :W] = full
    sprite[:, W:] = empty
    Image.fromarray(sprite, "RGBA").save(OUT, optimize=True)
    print("wrote", OUT, sprite.shape[1], "x", sprite.shape[0])


if __name__ == "__main__":
    main()
