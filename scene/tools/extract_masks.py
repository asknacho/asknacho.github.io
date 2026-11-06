"""Masks for the background effects, plus a sky patch that hides the headline on the phone crop."""
import json, sys
from pathlib import Path
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'sprites'
DBG = Path(sys.argv[1])
plate = np.array(Image.open(OUT / 'background.png').convert('RGB')).astype(np.float32)
H, W = plate.shape[:2]
lum = plate.dot([.3, .59, .11])
r, g, b = plate[..., 0], plate[..., 1], plate[..., 2]
GRID_W, GRID_H = 576, 360  # half an art pixel per cell

# Sky: birds and fireworks only draw here, so they pass behind the title, tree, clouds, city and hill.
sky = (b > r - 2) & (b > g + 2) & (lum > 26) & (lum < 190)
sky[:100] = False; sky[408:] = False
sky = ndi.binary_opening(sky, iterations=1)
lab, _ = ndi.label(sky)
sky = lab == lab[310, 760]
sky = ndi.binary_erosion(ndi.binary_fill_holes(sky) & sky, iterations=1)
cells = cv2.resize(sky.astype(np.float32), (GRID_W, GRID_H), interpolation=cv2.INTER_AREA) > .75
Image.fromarray(np.dstack([np.full((GRID_H, GRID_W, 3), 255, np.uint8), cells.astype(np.uint8) * 255])).save(OUT / 'sky-mask.png', optimize=True)

# Sea: open water only.
sea = (b > r + 18) & (b > g + 8) & (lum > 44) & (lum < 130)
sea[:404] = False; sea[466:] = False; sea[:, :470] = False; sea[:, 1300:] = False
sea = ndi.binary_opening(sea, iterations=1)
ys, xs = np.where(sea)
x0, x1, y0, y1 = int(xs.min()), int(xs.max()) + 1, int(ys.min()), int(ys.max()) + 1
crop = sea[y0:y1, x0:x1]
Image.fromarray(np.dstack([np.full((*crop.shape, 3), 255, np.uint8), crop.astype(np.uint8) * 255])).save(OUT / 'sea-mask.png', optimize=True)

# Phone crop: paint sky over the headline, which the phone shows as its own strip instead.
X, Y, RW, RH = 596, 165, 372, 142
area = plate[Y:Y + RH, X:X + RW]
l = lum[Y:Y + RH, X:X + RW]
ink = ndi.binary_dilation((l > 92) | (l < 30) | (area[..., 0] > area[..., 2] + 8), iterations=4)
ink[:, :4] = False
# Sky darkens upward, so fill each column from the sky above and below the headline, then soften sideways.
tall = plate[Y:Y + RH + 40, X:X + RW]
known = np.zeros(tall.shape[:2], bool)
known[:RH] = ~ink
known[RH:] = (lum[Y + RH:Y + RH + 40, X:X + RW] > 40) & (tall[RH:, :, 2] > tall[RH:, :, 0])
rows = np.arange(tall.shape[0])
base = np.zeros_like(area)
for c in range(RW):
    good = rows[known[:, c]]
    for ch in range(3):
        base[:, c, ch] = np.interp(rows[:RH], good, tall[good, c, ch])
base = cv2.GaussianBlur(base, (0, 0), sigmaX=14, sigmaY=4)
grain = plate[145:260, 472:572]; grain = np.clip(grain - cv2.GaussianBlur(grain, (0, 0), 9), -6, 6)
grain = cv2.resize(np.tile(grain, (2, 4, 1)), (RW, RH), interpolation=cv2.INTER_NEAREST)
alpha = np.clip(ndi.distance_transform_edt(ink) / 3, 0, 1)
patch = np.dstack([(base + grain).clip(0, 255), alpha * 255]).astype(np.uint8)
Image.fromarray(patch).save(OUT / 'no-title.png', optimize=True)

(OUT / 'effects.json').write_text(json.dumps({
    'grid': {'width': GRID_W, 'height': GRID_H},
    'sea': {'x': x0, 'y': y0, 'width': x1 - x0, 'height': y1 - y0},
    'noTitle': {'x': X, 'y': Y, 'width': RW, 'height': RH},
}, indent=2) + '\n')
print('sky cells', cells.sum(), 'sea', x0, y0, x1, y1, sea.sum())

view = plate.copy().astype(np.uint8)
view[sky] = view[sky] // 2 + np.array([0, 110, 0], np.uint8)
view[sea] = view[sea] // 2 + np.array([120, 0, 0], np.uint8)
Image.fromarray(view[90:480]).save(DBG / 'masks.png')
c = plate.astype(np.uint8).copy()
region = c[Y:Y + RH, X:X + RW]; a = alpha[..., None]
c[Y:Y + RH, X:X + RW] = (patch[..., :3] * a + region * (1 - a)).astype(np.uint8)
Image.fromarray(c[165:565, :960]).save(DBG / 'phone.png')
