"""Build the Barcelona backdrop for the family scene from the old scene app's art.

    python3 tools/build_barcelona.py

Takes scene/public/sprites/background.png (the whole mockup page), applies the scene app's patches
that hide the title and the baby's bubble, paints over the leftover sparkle and the yellow "excited"
ticks with clean sky from the same rows, and crops the landscape band. Also copies the sky and sea
masks used by the fireworks, birds and sea glints.
"""
import json, shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'scene' / 'public' / 'sprites'
OUT = ROOT / 'assets'
CROP = (0, 172, 1586, 552)  # art pixels: below the old title, above the cards

import numpy as np

art = Image.open(SRC / 'background.png').convert('RGBA')
original = np.array(art).astype(float)
art.alpha_composite(Image.open(SRC / 'no-title-wide.png').convert('RGBA'), (596, 165))
# Soften the title patch: row 304 keeps a dark line from the old subtitle pill, and its side edges
# step in brightness against the sky. Interpolate the line and ramp each edge back to the original.
a = np.array(art).astype(float)
a[304, 596:1396] = (a[303, 596:1396] + a[305, 596:1396]) / 2
# The right ramp is shorter: the old pill ends at x 1384 and must stay covered.
for start, step, width in ((596, 1, 16), (1395, -1, 8)):
    for i in range(width):
        keep = (i + 0.5) / width  # share of the patch: 0 at the outer edge, 1 at the inner end
        x = start + step * i
        a[165:307, x] = a[165:307, x] * keep + original[165:307, x] * (1 - keep)
art = Image.fromarray(a.round().astype(np.uint8))
art.alpha_composite(Image.open(SRC / 'bubble-fix.png').convert('RGBA'), (836, 323))

# (box to clean, horizontal offset of the clean sky copied over it). Sky changes mostly with height,
# so copying from the same rows a little to the side hides the patch.
for (x0, y0, x1, y1), dx in [((572, 160, 608, 200), 44), ((408, 183, 474, 268), 72)]:
    art.paste(art.crop((x0 + dx, y0, x1 + dx, y1)), (x0, y0))

# Left of x 955 the sea is a smeared fill with green blobs (where the original characters were cut out).
# Rebuild it from the clean strip of water just before the houses (rows above the rooftops),
# mirroring every other tile.
a = np.array(art)
water = a[410:432, 955:1030]   # rows above the first rooftops: water only
src = water[np.arange(47) % water.shape[0]]  # repeat the water rows down to the shore
for x0 in range(955, 470, -75):
    tile = src if ((955 - x0) // 75) % 2 else src[:, ::-1]
    x1 = max(470, x0 - 75)
    piece = tile[:, tile.shape[1] - (x0 - x1):]
    region = a[410:457, x1:x0]
    rgb = region[..., :3].astype(int)
    # Full replacement down to row 448; below that only where the fill is still water-blue, so bushes stay.
    blue = (rgb[..., 2] > rgb[..., 1]) & (np.arange(410, 457)[:, None] >= 449)
    replace = (np.arange(410, 457)[:, None] < 449) | blue
    region[replace] = piece[replace]
art = Image.fromarray(a)

OUT.mkdir(exist_ok=True)
art.crop(CROP).convert('RGB').save(OUT / 'barcelona.webp', quality=92, method=6)  # painted art, lossy is invisible here
shutil.copy(SRC / 'sky-mask.png', OUT / 'barcelona-sky-mask.png')
shutil.copy(SRC / 'sea-mask.png', OUT / 'barcelona-sea-mask.png')
effects = json.loads((SRC / 'effects.json').read_text())
meta = {'art': [1586, 992], 'crop': CROP, 'skyGrid': [effects['grid']['width'], effects['grid']['height']], 'sea': effects['sea']}
(OUT / 'barcelona.json').write_text(json.dumps(meta, indent=2) + '\n')
print('barcelona.webp', art.crop(CROP).size, meta)
