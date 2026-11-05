"""Cut the woman, girl, baby, heart bubble and Z symbols out, continuing from the plate extract_male.py left."""
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
rgb = ref.astype(np.float32)
lum = rgb.dot([.3, .59, .11])
dark = lum < 52

def poly(pts):
    m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [np.array(pts, np.int32)], 1); return m == 1

def lines(pts):
    m = np.zeros((H, W), np.uint8); cv2.polylines(m, [np.array(pts, np.int32)], False, 1, 3); return m == 1

def cut(roi_pts, wall_pts, seed, carve=()):
    """Everything inside the outline: flood in from outside, stopping at the art's dark outline and any wall."""
    roi = poly(roi_pts)
    stop = dark | (lines(wall_pts) if wall_pts else False)
    outside = ~roi | (roi & ~stop)
    lab, _ = ndi.label(outside)
    fig = roi & (lab != lab[0, 0])
    fig = ndi.binary_opening(fig, iterations=1)
    lab, _ = ndi.label(fig)
    fig = ndi.binary_fill_holes(lab == lab[seed[1], seed[0]])
    for c in carve:
        fig &= ~poly(c)
    fig = ndi.binary_dilation(fig, iterations=1) & roi
    lab, _ = ndi.label(fig)
    return lab == lab[seed[1], seed[0]]

woman = cut(
    [(486, 318), (652, 318), (652, 416), (668, 440), (668, 468), (608, 480), (606, 505), (588, 506), (586, 524), (552, 524), (552, 506), (499, 506), (499, 456), (486, 440)],
    [(606, 472), (606, 504), (586, 504), (586, 522), (552, 522), (552, 504), (500, 504)],
    (590, 400), carve=[[(598, 476), (614, 476), (614, 512), (598, 512)]])
heart = cut([(655, 322), (730, 322), (730, 392), (655, 392)], None, (690, 345))
girl = cut(
    [(664, 392), (806, 392), (806, 470), (800, 522), (725, 522), (664, 508)],
    [(666, 506), (725, 518), (800, 518)],
    (760, 420), carve=[[(676, 466), (706, 462), (708, 480), (706, 505), (725, 505), (725, 516), (806, 516), (806, 524), (660, 524), (660, 500), (676, 498)]])
baby = cut(
    [(800, 426), (896, 426), (960, 470), (960, 522), (830, 522), (800, 480)],
    [(830, 518), (950, 518)],
    (860, 460), carve=[[(945, 470), (964, 470), (964, 524), (945, 524)], [(820, 516), (964, 516), (964, 524), (820, 524)]])

box = np.zeros((H, W), bool); box[398:458, 905:985] = True
cream = box & (lum > 170)
lab, n = ndi.label(ndi.binary_opening(cream, iterations=1))
sizes = ndi.sum(lab > 0, lab, range(1, n + 1))
keep = 1 + np.argsort(sizes)[-3:]
cent = sorted(ndi.center_of_mass(lab > 0, lab, list(keep)), key=lambda c: c[1])
print('z centres', cent)
glyph = box & ndi.binary_dilation(np.isin(lab, keep), iterations=6) & ((lum > 150) | (lum < 66))
glyph = ndi.binary_fill_holes(glyph)
yy, xx = np.indices((H, W))
owner = np.argmin([(yy - c[0]) ** 2 + (xx - c[1]) ** 2 for c in cent], 0)
def tidy(m):
    m = ndi.binary_opening(m, structure=np.ones((3, 3)))
    lab, n = ndi.label(m)
    return lab == 1 + int(np.argmax(ndi.sum(m, lab, range(1, n + 1))))
zs = [ndi.binary_dilation(tidy(glyph & (owner == i)), iterations=1) & box for i in range(3)]

layers = {'woman': woman, 'heart': heart, 'girl': girl, 'baby': baby, 'z1': zs[0], 'z2': zs[1], 'z3': zs[2]}
np.savez_compressed(DBG / 'family_masks.npz', **layers)
for name, m in layers.items():
    ys, xs = np.where(m); print(name, xs.min(), ys.min(), xs.max() + 1, ys.max() + 1, m.sum())

# Rebuild what they hide. Only pixels that can ever be uncovered get the outer ring treatment.
MOVES_ABOVE = {'woman': 472, 'girl': 464, 'baby': 502}
plate = np.array(Image.open(DBG / 'bg_male.png').convert('RGB')).astype(np.float32)
hole = np.zeros((H, W), bool)
ring = np.zeros((H, W), bool)
for name, m in layers.items():
    hole |= m
    moving = m.copy(); moving[MOVES_ABOVE.get(name, H):] = False
    if name == 'woman': moving[472:506, 500:590] = m[472:506, 500:590]  # her arms
    if name == 'girl': moving[464:506, 726:806] = m[464:506, 726:806]  # her hands
    ring |= ndi.binary_dilation(moving, iterations=4)
keyboard = poly([(392, 392), (462, 372), (505, 525), (440, 535), (405, 470)])
ring &= ~keyboard
fill = hole | ring

# Sky and sea run in horizontal bands, so colours diffuse sideways far more than up and down.
known = ~ndi.binary_dilation(fill, iterations=2) & (rgb[..., 2] > rgb[..., 0] + 2) & (lum > 42) & (lum < 178)
known[:300] = False; known[480:] = False
smooth = np.zeros_like(rgb)
smooth_k = lambda w: np.clip(w * 5, 0, 1)[..., None]
for sx, sy, floor in ((220, 40, True), (90, 10, False), (45, 3, False), (14, 2, False)):
    w = cv2.GaussianBlur(known.astype(np.float32), (0, 0), sigmaX=sx, sigmaY=sy)
    v = cv2.GaussianBlur(plate * known[..., None], (0, 0), sigmaX=sx, sigmaY=sy) / np.maximum(w, 1e-4)[..., None]
    k = np.ones_like(w)[..., None] if floor else smooth_k(w)
    smooth = v * k + smooth * (1 - k)
tile = ref[145:260, 472:572].astype(np.float32)
tile -= cv2.GaussianBlur(tile, (0, 0), 9)
tile = np.clip(tile, -6, 6)
tile = np.concatenate([tile, tile[:, ::-1]], 1); tile = np.concatenate([tile, tile[::-1]], 0)
work = smooth + tile[np.arange(H)[:, None] % tile.shape[0], np.arange(W)[None] % tile.shape[1]]

# Bushes at the foot of it, quilted from real foliage the same way as behind Nacho.
BS, STEP = 16, 11
rng = np.random.default_rng(9)
def clean_block(x, y):
    c, l = plate[y:y + BS, x:x + BS], lum[y:y + BS, x:x + BS]
    return not fill[y:y + BS, x:x + BS].any() and ((c[..., 2] > c[..., 0] + 4) & (l > 45)).mean() < .01 \
        and (l < 22).mean() < .25 and (c[..., 0] > c[..., 1] + 12).mean() < .08 and l.mean() < 88
pool = [(x, y) for rx, ry, rw, rh in [(205, 392, 30, 100), (100, 345, 85, 60), (640, 425, 26, 50), (790, 450, 26, 50), (945, 450, 40, 60)]
        for y in range(ry, ry + rh - BS) for x in range(rx, rx + rw - BS) if clean_block(x, y)]
print('foliage blocks', len(pool))
done = ~fill
work[done] = plate[done]
horizon = lambda x: 462 + 7 * np.sin(x / 19.) + 4 * np.sin(x / 8. + 2)
ys, xs = np.where(fill)
for by in range(440, ys.max() + 1, STEP):
    for bx in range(xs.min(), xs.max() + 1, STEP):
        if not fill[by:by + STEP, bx:bx + STEP].any() or by + STEP < horizon(bx + 5): continue
        tgt = work[by:by + BS, bx:bx + BS]; m = done[by:by + BS, bx:bx + BS].astype(np.float32)
        best, score = pool[0], 1e18
        for k in rng.choice(len(pool), min(600, len(pool)), replace=False):
            i, j = pool[k]
            e = (((plate[j:j + BS, i:i + BS] - tgt) ** 2).sum(2) * m).sum() / max(m.sum(), 1) + rng.random()
            if e < score: score, best = e, (i, j)
        i, j = best
        r = fill[by:by + STEP, bx:bx + STEP]
        work[by:by + STEP, bx:bx + STEP][r] = plate[j:j + STEP, i:i + STEP][r]
        done[by:by + STEP, bx:bx + STEP] = True

dist = ndi.distance_transform_edt(fill)
alpha = np.clip(dist / 3.5, 0, 1)[..., None]
alpha[hole] = 1
bg = (work * alpha + plate * (1 - alpha)).clip(0, 255).astype(np.uint8)
Image.fromarray(bg).save(OUT / 'background.png', optimize=True)

for name, m in layers.items():
    ys, xs = np.where(m)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    Image.fromarray(np.dstack([ref, m.astype(np.uint8) * 255])[y0:y1, x0:x1]).save(DBG / f'{name}_base.png')
    (DBG / f'{name}_bbox.txt').write_text(f'{x0} {y0} {x1} {y1}')

ck = np.indices((H, W)).sum(0) % 16 < 8
board = np.where(ck[..., None], [255, 0, 255], [0, 255, 255]).astype(np.uint8)
allm = np.zeros((H, W), bool)
for m in layers.values(): allm |= m
view = np.where(allm[..., None], ref, board)[318:530, 484:985]
Image.fromarray(view.astype(np.uint8)).resize((view.shape[1] * 2, view.shape[0] * 2), Image.NEAREST).save(DBG / 'family_cut.png')
Image.fromarray(bg[300:540, 470:1000]).resize((1060, 480), Image.NEAREST).save(DBG / 'family_bg.png')
