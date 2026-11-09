"""Repair the high-detail front-facing Nacho still where Pixellab's background removal ate pixels.

    python3 tools/fix_hd_still.py   # -> art/pixellab/hd/south-fixed.png

- Left shoe: most of its upper was missing. It is rebuilt as a mirror image of the complete right shoe
  (canvas upper, laces, white toe cap, sole, dark underside), aligned to the same ground line, so its
  fill, shading and outline weight match. The left sock cuff above it is kept.
- Shoe toes: their outer outline was missing; it is redrawn 2 px thick in the art's outline colour.
- Hair top, right hand and left jeans cuff: their outline was missing. It is painted inward (the shape
  does not change) with the colour gradient and thickness of the nearest outline the art does have:
  4 px from the neighbouring hair, 4 px from the sleeve above the hand, 2 px from the other cuff.
- Left jeans cuff: a notch was cut out of the rolled hem; it is filled so the fold is solid.
- Both soles: gaps in the 3-row dark underside are closed.
- 4 px of room on the left (for the left shoe's toe) and below the feet.
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
src = np.array(Image.open(ROOT / 'art' / 'pixellab' / 'hd' / 'rotations' / 'south.png').convert('RGBA'))
H, W = src.shape[:2]
PAD_L, PAD_B = 4, 4
a = np.zeros((H + PAD_B, W + PAD_L, 4), np.uint8)
a[:H, PAD_L:] = src
X = lambda x: x + PAD_L  # original x -> padded x
lum = lambda p: p[..., :3].astype(int) @ [.3, .59, .11]
OUTLINE = tuple(np.median(src[253:256, 88:130][src[253:256, 88:130, 3] > 0][:, :3], axis=0).astype(np.uint8)) + (255,)

# Left shoe: mirror the right shoe (original x 86-141, rows 226-255). Its heel outline (x 86-88) lands on
# the left leg's outline at x 54; rows stay the same, so both soles share the ground line.
right = src[226:256, 86:142]
mirror = right[:, ::-1]
x1 = X(55)
x0 = x1 - mirror.shape[1]
zone = a[226:256, x0:x1]
use = mirror[..., 3] > 0
# Keep the original sock cuff (light pixels in the top rows) where the left leg has one.
cuff = (zone[..., 3] > 0) & (lum(zone) > 110)
cuff[5:] = False
zone[use & ~cuff] = mirror[use & ~cuff]
# Anything of the old broken shoe left outside the new shape goes.
stale = (zone[..., 3] > 0) & ~use & ~cuff
stale[:5] = False
zone[stale] = 0

# Soles: close gaps in the dark underside (rows 253-255) under each shoe.
for xa, xb in ((0, X(56)), (X(84), a.shape[1])):
    for y in range(253, 256):
        xs = np.nonzero(a[252, xa:xb, 3])[0]
        if len(xs):
            seg = a[y, xa + xs[0]:xa + xs[-1] + 1]
            seg[seg[..., 3] == 0] = OUTLINE

def outline(ys, xs, width=2):
    """Grow a dark outline `width` px outward from light pixels that touch transparency, inside a box."""
    for _ in range(width):
        op = a[..., 3] > 0
        edge = op & ((lum(a) >= 45) | (a[..., :3].astype(int) == OUTLINE[:3]).all(-1))
        near = np.zeros_like(op)
        near[1:] |= edge[:-1]; near[:-1] |= edge[1:]; near[:, 1:] |= edge[:, :-1]; near[:, :-1] |= edge[:, 1:]
        box = np.zeros_like(op); box[ys, xs] = True
        a[box & near & ~op] = OUTLINE

outline(slice(226, 253), slice(X(112), a.shape[1]))   # right shoe toe and sole edge
outline(slice(226, 253), slice(0, X(26)))            # left shoe toe, matching the right one

# Left jeans cuff: the rolled hem had a notch cut out of its lower left (rows 223-225), leaving a loose
# strip above it. Fill the notch by continuing the hem's bottom row downward, so it is one solid fold.
for y in range(223, 226):
    for x in range(X(29), X(45)):
        if a[y, x, 3] == 0 and a[222, x, 3] > 0:
            a[y, x] = a[222, x]

from scipy import ndimage as ndi

def depth_map():
    """Distance (in pixels) of every opaque pixel from transparency or the image edge."""
    op = np.pad(a[..., 3] > 0, 1, constant_values=False)
    return ndi.distance_transform_cdt(op, metric='taxicab')[1:-1, 1:-1]

def profile(ys, xs, depth):
    """The art's own outline in a reference spot: mean colour at each depth 1..depth from the edge."""
    d = depth_map()
    box = np.zeros(d.shape, bool); box[ys, xs] = True
    return [a[box & (d == k)][:, :3].mean(0).round().astype(np.uint8) for k in range(1, depth + 1)]

def graded_outline(ys, xs, prof):
    """Repaint the edge band of a region inward with a reference outline profile (no change in shape).
    Pixels that are already outline-dark are kept."""
    d = depth_map()
    box = np.zeros(d.shape, bool); box[ys, xs] = True
    for k, colour in enumerate(prof, start=1):
        sel = box & (d == k) & (lum(a) >= 45)
        a[sel, :3] = colour

# Hair top: the bare tufts get the 4 px profile of the outlined hair right next to them.
graded_outline(slice(0, 30), slice(X(26), X(122)), profile(slice(0, 20), slice(X(44), X(68)), 4))
# Right hand: the 4 px profile of the sleeve outline just above it.
graded_outline(slice(138, 165), slice(X(117), a.shape[1]), profile(slice(112, 136), slice(X(128), a.shape[1]), 4))
# Left cuff's outer edge: the 2 px profile of the right cuff's inner edge.
graded_outline(slice(213, 226), slice(X(27), X(46)), profile(slice(213, 231), slice(X(84), X(96)), 2))

out = ROOT / 'art' / 'pixellab' / 'hd' / 'south-fixed.png'
Image.fromarray(a).save(out)
print('saved', out, a.shape[1], 'x', a.shape[0])
