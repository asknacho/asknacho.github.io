"""Build the Barcelona backdrop for the family scene from the old scene app's art.

    python3 tools/build_barcelona.py

Takes scene/public/sprites/background.png (the whole mockup page), applies the scene app's patches
that hide the title and the baby's bubble, paints over the leftover sparkle and the yellow "excited"
ticks with clean sky from the same rows, and crops the landscape band. Also copies the sky and sea
masks used by the fireworks, birds and sea glints. The result is re-rendered as pixel art at
half the characters' pixel size (see below), so backdrop and sprites read as one picture, and the sky
is cut out (transparent) so the page's own day/night background becomes the sky.
"""
import json, shutil
from pathlib import Path
from PIL import Image, ImageFilter

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

# The sky. The page's own day/night background shows through it, so the city sits under whatever
# sky the page has. Start from the scene app's sky mask (made for the fireworks), then:
#  - fill everything it encloses (old title, sparkles, clouds), treating the top and right edges as open sky;
#  - the old bottle bubble at the horizon, and clouds touching the tree or the hill, by place and colour;
#  - the Tibidabo hill: traced per column (it is blue-grey, the sky purple) and kept with its tower;
#  - any leftover island that never reaches the ground.
from scipy import ndimage as ndi
HORIZON = 404
W, H = art.size
yy, xx = np.mgrid[0:H, 0:W]
mask = np.array(Image.open(SRC / 'sky-mask.png').convert('RGBA').split()[3].resize(art.size, Image.NEAREST)) > 127
sky = ndi.binary_fill_holes(np.pad(mask, ((1, 0), (0, 1)), constant_values=True))[1:, :-1]
sky |= (xx >= 836) & (xx < 960) & (yy >= 300) & (yy < HORIZON)
rgb = np.array(art)[..., :3].astype(int)
lum = rgb @ [.3, .59, .11]
hillish = (rgb[..., 2] - rgb[..., 1] < 14) & (lum < 120)
hill_top = np.full(W, HORIZON)
for x in range(1390, W):
    ys = np.nonzero(hillish[285:HORIZON, x])[0]
    if len(ys):
        hill_top[x] = 285 + ys[0]
hill_top[1390:] = ndi.median_filter(hill_top[1390:], size=25, mode='nearest')
tower = (xx >= 1480) & (xx < 1545) & (yy >= 270) & (yy < 350) & (rgb[..., 0] > 140) & (rgb[..., 1] > 110)
hill = (xx >= 1390) & (yy >= hill_top[None, :]) & (yy < HORIZON)
sky &= ~(hill | tower)
sky |= (xx >= 1390) & (yy < hill_top[None, :]) & ~tower
cloud = (rgb[..., 0] > 140) & (lum > 115) & (rgb[..., 0] >= rgb[..., 2])
sky |= cloud & (yy < HORIZON) & ((xx < 600) | ((xx > 1400) & (yy < 285)))
labels, _ = ndi.label(~sky)
grounded = np.unique(labels[HORIZON:][~sky[HORIZON:]])
sky |= ~sky & ~np.isin(labels, grounded)

OUT.mkdir(exist_ok=True)

# Re-render as real pixel art at a density that matches the characters. In the original art Nacho
# stands ~355 px tall and his sprite is 46 px, so one sprite pixel is ~7.6 art pixels. The backdrop is
# drawn at twice that density (one backdrop pixel = half a sprite pixel), as distant layers usually are:
# 416x100 pixels, a light sharpen before averaging, then a 48-colour palette with no dithering.
GRID = (416, 100)
band = art.crop(CROP).convert('RGB').filter(ImageFilter.UnsharpMask(2, 80, 2))
pixels = band.resize(GRID, Image.BOX).quantize(colors=48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)

# Cut the sky out at the backdrop's pixel size: a backdrop pixel is sky if most of its art pixels are.
sky_px = np.array(Image.fromarray((sky[CROP[1]:CROP[3], CROP[0]:CROP[2]] * 255).astype(np.uint8)).resize(GRID, Image.BOX)) >= 128
out = np.array(pixels.convert('RGBA'))
out[sky_px] = 0
# Edge pixels that averaged in some of the old purple sky (much bluer than green) would show as a fringe
# on the page's plain sky. Strip them where they touch the cut-out, twice to catch two-pixel fringes.
for _ in range(2):
    clear = out[..., 3] == 0
    touching = np.zeros_like(clear)
    touching[1:] |= clear[:-1]; touching[:-1] |= clear[1:]; touching[:, 1:] |= clear[:, :-1]; touching[:, :-1] |= clear[:, 1:]
    c = out[..., :3].astype(int)
    purple = (c[..., 2] - c[..., 1] >= 14) & (c[..., 0] >= c[..., 1])
    out[touching & ~clear & purple] = 0
Image.fromarray(out).save(OUT / 'barcelona.png', optimize=True)
scale = (CROP[2] - CROP[0]) / GRID[0]  # art pixels per backdrop pixel (3.8125)

# Masks for the effects, resampled to the same grid. The sky grid covers the whole original art.
sky_grid = (GRID[0], round(992 / scale))
Image.open(SRC / 'sky-mask.png').convert('RGBA').resize(sky_grid, Image.NEAREST).save(OUT / 'barcelona-sky-mask.png')
effects = json.loads((SRC / 'effects.json').read_text())
sea = effects['sea']
sea_box = [round(sea['x'] / scale), round((sea['y'] - CROP[1]) / scale), round(sea['width'] / scale), round(sea['height'] / scale)]
Image.open(SRC / 'sea-mask.png').convert('RGBA').resize(sea_box[2:], Image.NEAREST).save(OUT / 'barcelona-sea-mask.png')
meta = {'grid': GRID, 'artPerPixel': scale, 'crop': CROP, 'skyGrid': sky_grid, 'skyTop': -CROP[1] / scale,
        'seaBox': sea_box, 'transparentSky': True}
(OUT / 'barcelona.json').write_text(json.dumps(meta, indent=2) + '\n')
print(meta)
