"""Cut Nacho out of the reference art and rebuild the background behind him by quilting real patches."""
import sys
from pathlib import Path
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'sprites'
DBG = Path(sys.argv[1])
ref = np.array(Image.open(ROOT / 'public' / 'reference.webp').convert('RGB'))
H, W = ref.shape[:2]
OX, OY = 90, 160
src = lambda pts: np.array([(OX + x / 3, OY + y / 3) for x, y in pts], np.int32)

def fill(pts):
    m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [src(pts)], 1); return m == 1

roi = fill([(395, 40), (945, 40), (945, 440), (1000, 560), (1000, 640), (978, 668), (930, 690), (912, 745), (890, 765), (896, 930),
            (970, 1040), (972, 1108), (428, 1108), (428, 1005), (486, 930), (520, 880), (486, 800), (408, 770), (408, 480)])
shoes = fill([(496, 936), (636, 958), (616, 1104), (428, 1104), (428, 1064), (496, 1000)]) | fill([(752, 958), (884, 948), (908, 1040), (968, 1058), (968, 1104), (750, 1104)])
gap = fill([(734, 836), (752, 836), (756, 950), (748, 1000), (746, 1108), (620, 1108), (640, 985), (644, 955), (690, 900)])

rgb = ref.astype(np.float32)
lum = rgb.dot([.3, .59, .11])
dark = lum < 52
skylike = (rgb[..., 2] >= rgb[..., 0] - 6) & (lum > 40) & ~dark
upper = np.arange(H)[:, None] < 330
warm = (rgb[..., 0] > rgb[..., 2] + 10) & upper

outside = ~roi | (~dark & roi)
lab, _ = ndi.label(outside)
keep = {lab[0, 0]} | {lab[y, x] for x, y in [(305, 335)] if outside[y, x]}
fig = roi & ~np.isin(lab, list(keep))
fig = ndi.binary_opening(fig, iterations=1)
lab, n = ndi.label(fig)
fig = lab == (1 + int(np.argmax(ndi.sum(fig, lab, range(1, n + 1)))))
fig = ndi.binary_fill_holes(fig | shoes) & ~gap
extra = roi & warm & ~fig
lab, n = ndi.label(extra | ndi.binary_dilation(fig, iterations=2))
fig |= extra & (lab == lab[300, 320])
fig = ndi.binary_dilation(fig, iterations=1) & roi & ~gap
fig |= gap & (lum < 62) & ndi.binary_dilation(fig, iterations=4)
fig[ndi.label(fig)[0] != ndi.label(fig)[0][350, 340]] = False

for poly in ([(224, 478), (262, 478), (258, 492), (234, 510), (224, 510)], [(393, 480), (422, 480), (422, 511), (411, 511), (393, 494)]):
    m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [np.array(poly, np.int32)], 1); fig &= m == 0
fig[526:] &= lum[526:] < 60
fig[529:] = False
lab, _ = ndi.label(fig); fig = lab == lab[350, 340]
ys, xs = np.where(fig)
x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
print('bbox', x0, y0, x1, y1, 'pixels', fig.sum())

hole = ndi.binary_dilation(fig, iterations=4)
keyboard = np.zeros((H, W), np.uint8); cv2.fillPoly(keyboard, [np.array([(392, 392), (462, 372), (505, 525), (440, 535), (405, 470)], np.int32)], 1)
hole &= ~(keyboard == 1)
hole |= fig
cv2.circle(speck := np.zeros((H, W), np.uint8), (385, 260), 12, 1, -1)
hole |= speck == 1

# Sky: diffuse the real sky colours across the gap, then lay grain lifted from an untouched patch of the same sky.
rows = np.arange(H)
sx0, sy0, sw, sh = 472, 145, 100, 115
tile = ref[sy0:sy0 + sh, sx0:sx0 + sw].astype(np.float32)
tile -= cv2.GaussianBlur(tile, (0, 0), 9)
tile = np.clip(tile, -9, 9)
tile = np.concatenate([tile, tile[:, ::-1]], 1); tile = np.concatenate([tile, tile[::-1]], 0)
clear = ~ndi.binary_dilation(hole, iterations=2) & (rgb[..., 2] > rgb[..., 0] + 4) & (lum > 45) & (lum < 125)
box = np.zeros((H, W), bool); box[118:405, 170:510] = True
clear &= box
smooth = np.zeros_like(rgb)
for sigma in (120, 60, 30, 14, 6):
    w = cv2.GaussianBlur(clear.astype(np.float32), (0, 0), sigma)
    v = cv2.GaussianBlur(rgb * clear[..., None], (0, 0), sigma) / np.maximum(w, 1e-4)[..., None]
    k = np.clip(w * 4, 0, 1)[..., None] if sigma < 120 else 1
    smooth = v * k + smooth * (1 - k)
sky = smooth + tile[np.arange(H)[:, None] % tile.shape[0], np.arange(W)[None] % tile.shape[1]]

# Bushes and grass: quilt two-art-pixel blocks from real foliage, matching what is already placed.
rng = np.random.default_rng(4)
BS, STEP = 16, 11
def rects(rs):
    pts = [(x, y) for rx, ry, rw, rh in rs for y in range(ry, ry + rh - BS) for x in range(rx, rx + rw - BS)]
    def good(x, y):
        c, l = rgb[y:y + BS, x:x + BS], lum[y:y + BS, x:x + BS]
        if hole[y:y + BS, x:x + BS].any(): return False
        return ((c[..., 2] > c[..., 0] + 4) & (l > 45)).mean() < .01 and (l < 22).mean() < .25 and (c[..., 0] > c[..., 1] + 12).mean() < .08
    return [p for p in pts if good(*p)]
BUSH = rects([(478, 415, 26, 85), (205, 392, 30, 100), (288, 440, 56, 60), (408, 462, 26, 42), (100, 345, 85, 60)])
BUSH = [p for p in BUSH if lum[p[1]:p[1] + BS, p[0]:p[0] + BS].mean() < 88]
GRASS = BUSH + rects([(296, 500, 44, 26), (405, 505, 26, 24)])
print('bush', len(BUSH), 'grass', len(GRASS))
top = lambda x: 396 + 8 * np.sin(x / 23.) + 5 * np.sin(x / 9. + 1)
work = sky.copy()
filled = ~hole
work[filled] = rgb[filled]
for by in range(360, y1 + 1, STEP):
    for bx in range(x0 - 6, x1 + 4, STEP):
        if not hole[by:by + STEP, bx:bx + STEP].any(): continue
        if by + STEP < top(bx + STEP / 2): continue
        pool = GRASS if by >= 505 else BUSH
        tgt = work[by:by + BS, bx:bx + BS]; m = filled[by:by + BS, bx:bx + BS].astype(np.float32)
        best, score = pool[0], 1e18
        for k in rng.choice(len(pool), min(800, len(pool)), replace=False):
            i, j = pool[k]
            e = (((rgb[j:j + BS, i:i + BS] - tgt) ** 2).sum(2) * m).sum() / max(m.sum(), 1) + rng.random()
            if pool is GRASS: e += abs(j - by) * 60
            if e < score: score, best = e, (i, j)
        i, j = best
        b = rgb[j:j + STEP, i:i + STEP]; r = hole[by:by + STEP, bx:bx + STEP]
        work[by:by + STEP, bx:bx + STEP][r] = b[r]
        filled[by:by + STEP, bx:bx + STEP] = True

# Feather the outer ring only, so the old outline leaves no halo; the art under the sprite stays crisp.
dist = ndi.distance_transform_edt(hole)
alpha = np.clip(dist / 3.5, 0, 1)[..., None]
alpha[397:] = 0  # he never moves below the hips, so that art can stay exactly as drawn
alpha[fig] = 1
bg = (work * alpha + rgb * (1 - alpha)).clip(0, 255).astype(np.uint8)

Image.fromarray(bg).save(OUT / 'background.png', optimize=True)
Image.fromarray(bg).save(DBG / 'bg_male.png')  # extract_family.py continues from here
np.save(DBG / 'fig.npy', fig)
rgba = np.dstack([ref, fig.astype(np.uint8) * 255])[y0:y1, x0:x1]
Image.fromarray(rgba).save(DBG / 'male_base.png')
(DBG / 'bbox.txt').write_text(f'{x0} {y0} {x1} {y1}')
ck = np.indices((y1 - y0, x1 - x0)).sum(0) % 16 < 8
board = np.where(ck[..., None], [255, 0, 255], [0, 255, 255]).astype(np.uint8)
a = rgba[..., 3:] / 255
preview = (rgba[..., :3] * a + board * (1 - a)).astype(np.uint8)
side = bg[y0:y1, max(x0 - 20, 0):x1 + 20]
Image.fromarray(preview).resize((preview.shape[1] * 3, preview.shape[0] * 3), Image.NEAREST).save(DBG / 'cut.png')
Image.fromarray(side).resize((side.shape[1] * 3, side.shape[0] * 3), Image.NEAREST).save(DBG / 'bg.png')
