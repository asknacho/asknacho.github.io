"""Repair the high-detail front-facing Nacho still where Pixellab's background removal ate pixels.

    python3 tools/fix_hd_still.py   # -> art/pixellab/hd/south-fixed.png

- Left shoe: most of its upper was missing. It is rebuilt as a mirror image of the complete right shoe
  (canvas upper, laces, white toe cap, sole, dark underside), aligned to the same ground line, so its
  fill, shading and outline weight match. The left sock cuff above it is kept.
- Right shoe and right hand: their outer outline was missing; it is redrawn 2 px thick, the weight the
  art uses elsewhere, in the art's own outline colour. The rebuilt left shoe's toe gets the same.
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

outline(slice(118, 176), slice(X(108), a.shape[1]))   # right hand
outline(slice(226, 253), slice(X(112), a.shape[1]))   # right shoe toe and sole edge
outline(slice(226, 253), slice(0, X(26)))            # left shoe toe, matching the right one

out = ROOT / 'art' / 'pixellab' / 'hd' / 'south-fixed.png'
Image.fromarray(a).save(out)
print('saved', out, a.shape[1], 'x', a.shape[0])
