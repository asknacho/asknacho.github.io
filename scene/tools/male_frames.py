"""Author Nacho's breathing cycle: deliberate row and column moves of the real sprite, never resampled."""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'sprites'
DBG = Path(sys.argv[1])
base = np.array(Image.open(DBG / 'male_base.png'))
x0, y0, x1, y1 = map(int, (DBG / 'bbox.txt').read_text().split())
PAD_TOP, PAD_X = 8, 6
h, w = base.shape[:2]
canvas = np.zeros((h + PAD_TOP, w + 2 * PAD_X, 4), np.uint8)
canvas[PAD_TOP:, PAD_X:PAD_X + w] = base
ox, oy = x0 - PAD_X, y0 - PAD_TOP
H, W = canvas.shape[:2]

FRAMES = 16
MS = 120
LIFT_HEAD, LIFT_BODY, WIDEN = 5, 3, 3  # one art pixel at the head, a little less at the shoulders, 3 pixels of ribs
LAG_BODY, LAG_HEAD, LAG_HAIR = 1, 2, 3  # in frames: the chest starts the breath and the rest follows

def breath(t):
    """Quick inhale, slower exhale, then a short rest. Periodic, and at rest long enough to absorb every lag."""
    t %= 1
    if t < .34: return .5 - .5 * np.cos(np.pi * t / .34)
    if t < .78: return .5 + .5 * np.cos(np.pi * (t - .34) / .44)
    return 0.
at = lambda i, lag=0: breath((i - lag) / FRAMES)

CX = 350 - ox
SEAM_L, SEAM_R = 326 - ox, 376 - ox  # columns beside the logo, so it never ripples
Y = lambda sy: sy - oy
HAIR, FACE, NECK, CHEST, WAIST, HIPS = Y(195), Y(222), Y(300), Y(322), Y(383), Y(395)
RIB_TOP, RIB_END = Y(322), Y(380)

def frame(i):
    # Rigid blocks with the give kept in fixed low-detail bands (forehead hairline, neck, shirt hem),
    # so seams stay put from frame to frame instead of crawling across the face or the logo.
    head, body, hair = LIFT_HEAD * at(i, LAG_HEAD), LIFT_BODY * at(i, LAG_BODY), LIFT_HEAD * at(i, LAG_HAIR)
    ys = [0, HAIR, FACE, NECK, CHEST, WAIST, HIPS, H]
    ds = [hair, hair, head, head, body, body, 0, 0]
    dy = np.rint(np.interp(np.arange(H), ys, ds)).astype(int)
    out = canvas[np.clip(np.arange(H) + dy, 0, H - 1)]
    for y in range(RIB_TOP, RIB_END):
        t = np.sin(np.pi * (y - RIB_TOP) / (RIB_END - RIB_TOP))
        g = int(np.rint(WIDEN * at(i) * t))
        if not g: continue
        xs = np.arange(W)
        src = xs.copy()
        src[xs < SEAM_L] = np.minimum(xs[xs < SEAM_L] + g, SEAM_L)
        src[xs > SEAM_R] = np.maximum(xs[xs > SEAM_R] - g, SEAM_R)
        out[y] = out[y][src]
    return out

def clean(f):
    # Pixel cleanup: no stray specks, no pinholes, alpha stays strictly on or off.
    a = f[..., 3] > 0
    lab, n = ndi.label(a)
    if n > 1:
        a = lab == 1 + int(np.argmax(ndi.sum(a, lab, range(1, n + 1))))
    f = f.copy(); f[~a] = 0
    return f

frames = [clean(frame(i)) for i in range(FRAMES)]
assert (frames[0] == clean(canvas)).all(), 'frame 0 must be the untouched art'
feet = HIPS + 2
assert all((f[feet:] == frames[0][feet:]).all() for f in frames), 'feet must stay planted'
palette = {tuple(p) for p in canvas[canvas[..., 3] > 0][:, :3]}
lift = [round(LIFT_HEAD * at(i, LAG_HEAD)) for i in range(FRAMES)]
print('head', lift, 'largest step', max(abs(lift[i] - lift[i - 1]) for i in range(FRAMES)))
for f in frames:
    assert {tuple(p) for p in f[f[..., 3] > 0][:, :3]} <= palette, 'no new colours'
    assert set(np.unique(f[..., 3])) <= {0, 255}, 'alpha must be binary'

Image.fromarray(np.hstack(frames)).save(OUT / 'male.png', optimize=True)
(OUT / 'male.json').write_text(json.dumps({
    'id': 'male', 'image': 'sprites/male.png', 'frameWidth': W, 'frameHeight': H, 'frames': FRAMES,
    'durationMs': FRAMES * MS, 'x': int(ox), 'y': int(oy), 'sceneWidth': 1586, 'sceneHeight': 992,
}, indent=2) + '\n')
print('sheet', W * FRAMES, H, 'origin', ox, oy, 'colours', len(palette))
