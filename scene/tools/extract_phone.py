"""Phone-only extras: guitar and keyboard as static layers, and a sky patch hiding the whole headline."""
import json, sys
from pathlib import Path
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'sprites'
DBG = Path(sys.argv[1])
ref = np.array(Image.open(ROOT / 'public' / 'reference.webp').convert('RGB'))
H, W = ref.shape[:2]
lum = ref.astype(np.float32).dot([.3, .59, .11])
dark = lum < 52

def poly(pts):
    m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [np.array(pts, np.int32)], 1); return m == 1

def cut(roi_pts, seed, grow=3, many=False):
    roi = ndi.binary_dilation(poly(roi_pts), iterations=grow)
    outside = ~roi | (roi & ~dark)
    lab, _ = ndi.label(outside)
    fig = roi & (lab != lab[0, 0])
    fig = ndi.binary_opening(fig, iterations=1)
    lab, _ = ndi.label(fig)
    fig = ndi.binary_fill_holes(lab == lab[seed[1], seed[0]])
    fig = ndi.binary_dilation(fig, iterations=1) & roi
    lab, n = ndi.label(fig)
    if many:
        return np.isin(lab, [i for i in range(1, n + 1) if (lab == i).sum() >= 40])
    return lab == lab[seed[1], seed[0]]

def cloud(roi_pts):
    roi = poly(roi_pts)
    cream = roi & (lum > 165)
    lab, n = ndi.label(cream)
    keep = np.isin(lab, [i for i in range(1, n + 1) if (lab == i).sum() >= 40])
    keep = ndi.binary_fill_holes(keep)
    ring = ndi.binary_dilation(keep, iterations=3) & roi & (dark | keep)
    return ndi.binary_fill_holes(ring) & roi

items = {
    'guitar': cut([(191, 313), (218, 312), (223, 328), (208, 367), (225, 423), (221, 473), (208, 517), (151, 522), (118, 503), (111, 480), (128, 427), (158, 407), (185, 367), (188, 333)], (170, 480), grow=1),
    'bubble': cloud([(842, 330), (954, 330), (954, 408), (900, 408), (900, 426), (842, 426)]),
    'keyboard': cut([(402, 395), (462, 377), (465, 385), (487, 505), (485, 515), (437, 524), (422, 519), (403, 439)], (440, 450)),
}
g = items['guitar']
r_, g_, b_ = (ref[..., i].astype(int) for i in range(3))
g &= dark | ((r_ >= g_ - 2) & (r_ > b_ + 10))
g = ndi.binary_opening(g, structure=np.ones((2, 2)))
lab, n = ndi.label(g); items['guitar'] = lab == 1 + int(np.argmax(ndi.sum(g, lab, range(1, n + 1))))
manifest = {}
for name, m in items.items():
    ys, xs = np.where(m); x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgba = np.dstack([ref, m.astype(np.uint8) * 255])[y0:y1, x0:x1]
    Image.fromarray(rgba).save(OUT / f'{name}.png', optimize=True)
    manifest[name] = [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]
    print(name, manifest[name], m.sum())
    prev = np.full((y1 - y0, x1 - x0, 3), (255, 0, 255), np.uint8); mm = m[y0:y1, x0:x1]
    prev[mm] = ref[y0:y1, x0:x1][mm]
    Image.fromarray(prev).resize(((x1 - x0) * 3, (y1 - y0) * 3), Image.NEAREST).save(DBG / f'{name}_prev.png')
(OUT / 'phone.json').write_text(json.dumps({'shift': 532, **manifest}, indent=2) + '\n')

# Sky over the headline, for the wider phone window.
plate = np.array(Image.open(OUT / 'background.png').convert('RGB')).astype(np.float32)
plum = plate.dot([.3, .59, .11])
X, Y, RW, RH = 596, 165, 800, 142
area = plate[Y:Y + RH, X:X + RW]; l = plum[Y:Y + RH, X:X + RW]
ink = ndi.binary_dilation((l > 92) | (l < 30) | (area[..., 0] > area[..., 2] + 8), iterations=4)
ink[:, :4] = False
tall = plate[Y:Y + RH + 40, X:X + RW]
known = np.zeros(tall.shape[:2], bool)
known[:RH] = ~ink
known[RH:] = (plum[Y + RH:Y + RH + 40, X:X + RW] > 40) & (tall[RH:, :, 2] > tall[RH:, :, 0])
rows = np.arange(tall.shape[0]); base = np.zeros_like(area)
for c in range(RW):
    good = rows[known[:, c]]
    for ch in range(3):
        base[:, c, ch] = np.interp(rows[:RH], good, tall[good, c, ch])
base = cv2.GaussianBlur(base, (0, 0), sigmaX=14, sigmaY=4)
grain = plate[145:260, 472:572]; grain = np.clip(grain - cv2.GaussianBlur(grain, (0, 0), 9), -6, 6)
grain = cv2.resize(np.tile(grain, (2, 8, 1)), (RW, RH), interpolation=cv2.INTER_NEAREST)
alpha = np.clip(ndi.distance_transform_edt(ink) / 3, 0, 1)
patch = np.dstack([(base + grain).clip(0, 255), alpha * 255]).astype(np.uint8)
Image.fromarray(patch).save(OUT / 'no-title-wide.png', optimize=True)
c = plate.astype(np.uint8).copy(); a = alpha[..., None]
c[Y:Y + RH, X:X + RW] = (patch[..., :3] * a + c[Y:Y + RH, X:X + RW] * (1 - a)).astype(np.uint8)

# Where the baby's bubble sat: sky and horizon copied from the same rows further left.
bx, by, bw, bh = manifest['bubble']
PAD = 12
fx, fy, fw, fh = bx - PAD, by - PAD, bw + 2 * PAD, bh + 2 * PAD
fix = plate[fy:fy + fh, fx - 110:fx - 110 + fw].astype(np.uint8)
edge = np.minimum.reduce([np.indices((fh, fw))[0] + 1, fh - np.indices((fh, fw))[0], np.indices((fh, fw))[1] + 1, fw - np.indices((fh, fw))[1]])
fa = np.clip(edge / PAD, 0, 1)
Image.fromarray(np.dstack([fix, (fa * 255).astype(np.uint8)])).save(OUT / 'bubble-fix.png', optimize=True)
manifest['bubbleFix'] = [fx, fy, fw, fh]
(OUT / 'phone.json').write_text(json.dumps({'shift': 532, **manifest}, indent=2) + '\n')
reg = c[fy:fy + fh, fx:fx + fw]
c[fy:fy + fh, fx:fx + fw] = (fix * fa[..., None] + reg * (1 - fa[..., None])).astype(np.uint8)
Image.fromarray(c[170:565, 626:1586]).save(DBG / 'phone_plate.png')
