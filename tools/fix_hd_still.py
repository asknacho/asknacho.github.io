"""Repair the high-detail front-facing Nacho still where Pixellab's background removal ate pixels.

    python3 tools/fix_hd_still.py   # -> art/pixellab/hd/south-fixed.png (148x260)

- Adds 4 rows below the feet: the soles touched the bottom edge and were cut flat.
- Left shoe: rebuilds the missing front of the canvas upper (a dark shape sloping down to the toe),
  keeping the existing laces and toe highlights.
- Both soles: closes holes in the white rubber and gaps in the dark underside.
- Outline: a 1 px dark outline where light pixels meet transparency, only around the right hand and
  the shoes, where the original outline is missing.
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
src = np.array(Image.open(ROOT / 'art' / 'pixellab' / 'hd' / 'rotations' / 'south.png').convert('RGBA'))
H, W = src.shape[:2]
a = np.zeros((H + 4, W, 4), np.uint8)
a[:H] = src
lum = lambda p: p[..., :3].astype(int) @ [.3, .59, .11]

opaque = a[..., 3] > 0
dark = opaque & (lum(a) < 45)
SHOE = tuple(np.median(a[226:245, 42:54][dark[226:245, 42:54]][:, :3], axis=0).astype(np.uint8)) + (255,)
OUTLINE = (20, 15, 18, 255)
SOLE = tuple(np.median(a[246:251, 15:45][opaque[246:251, 15:45]][:, :3], axis=0).astype(np.uint8)) + (255,)

# Left shoe upper: fill the empty area between a toe slope (x 40 at row 226 to x 12 at row 244) and the
# back of the shoe at x 54.
for y in range(226, 245):
    left = round(40 + (12 - 40) * (y - 226) / (244 - 226))
    row = a[y, left:55]
    row[row[..., 3] == 0] = SHOE

# Soles: fill holes between the first and last opaque pixel of each row (white rubber, then underside).
for x0, x1 in ((0, 60), (84, W)):
    for y in range(245, 253):
        xs = np.nonzero(a[y, x0:x1, 3])[0]
        if len(xs):
            seg = a[y, x0 + xs[0]:x0 + xs[-1] + 1]
            seg[seg[..., 3] == 0] = SOLE
    for y in range(253, 256):
        xs = np.nonzero(a[252, x0:x1, 3])[0]  # underside spans the sole above it
        seg = a[y, x0 + xs[0]:x0 + xs[-1] + 1]
        seg[seg[..., 3] == 0] = OUTLINE

# Outline pass in the damaged regions only.
regions = [(slice(115, 178), slice(104, W)),   # right hand
           (slice(205, H + 4), slice(0, W))]     # shoes, including the new rows
for _ in range(1):
    opaque = a[..., 3] > 0
    light = opaque & (lum(a) >= 45)
    near = np.zeros_like(opaque)
    near[1:] |= light[:-1]; near[:-1] |= light[1:]; near[:, 1:] |= light[:, :-1]; near[:, :-1] |= light[:, 1:]
    mask = np.zeros_like(opaque)
    for ys, xs in regions:
        mask[ys, xs] = True
    a[mask & near & ~opaque] = OUTLINE

out = ROOT / 'art' / 'pixellab' / 'hd' / 'south-fixed.png'
Image.fromarray(a).save(out)
print('saved', out, a.shape[1], 'x', a.shape[0])
