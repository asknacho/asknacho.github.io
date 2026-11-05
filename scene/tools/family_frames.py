"""Author the family's idle loops: integer pixel moves of the real sprites, so no colour is ever invented."""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'sprites'
DBG = Path(sys.argv[1])
TAU = 2 * np.pi

def smooth(v):
    v = np.clip(v, 0, 1)
    return v * v * (3 - 2 * v)

def load(name, top, right, bottom=0, left=None):
    base = np.array(Image.open(DBG / f'{name}_base.png'))
    x0, y0, _, _ = map(int, (DBG / f'{name}_bbox.txt').read_text().split())
    left = right if left is None else left
    h, w = base.shape[:2]
    canvas = np.zeros((h + top + bottom, w + left + right, 4), np.uint8)
    canvas[top:top + h, left:left + w] = base * (base[..., 3:] > 0)
    ox, oy = x0 - left, y0 - top
    yy, xx = np.indices(canvas.shape[:2])
    return canvas, ox, oy, xx + ox, yy + oy  # xx, yy are scene coordinates, which the art was mapped in

def warp(canvas, dx, dy):
    h, w = canvas.shape[:2]
    yy, xx = np.indices((h, w))
    sy, sx = yy + np.rint(dy).astype(int), xx + np.rint(dx).astype(int)
    out = canvas[np.clip(sy, 0, h - 1), np.clip(sx, 0, w - 1)]
    out[(sy < 0) | (sy >= h) | (sx < 0) | (sx >= w)] = 0  # never smear the edge row into the frame
    return out

def clean(f):
    a = f[..., 3] > 0
    lab, n = ndi.label(a)
    if n > 1:
        a = lab == 1 + int(np.argmax(ndi.sum(a, lab, range(1, n + 1))))
    f = f.copy(); f[~a] = 0
    return f

def check(name, frames, canvas, extra=()):
    assert (frames[0] == canvas).all(), f'{name}: first frame must be the untouched art'
    palette = {tuple(p) for p in canvas[canvas[..., 3] > 0][:, :3]} | set(extra)
    for f in frames:
        assert {tuple(p) for p in f[f[..., 3] > 0][:, :3]} <= palette, f'{name}: no new colours'
        assert set(np.unique(f[..., 3])) <= {0, 255}, f'{name}: alpha must be binary'

def save(name, rows, ox, oy, duration, **extra):
    Image.fromarray(np.vstack([np.hstack(r) for r in rows])).save(OUT / f'{name}.png', optimize=True)
    h, w = rows[0][0].shape[:2]
    (OUT / f'{name}.json').write_text(json.dumps({
        'id': name, 'image': f'sprites/{name}.png', 'frameWidth': w, 'frameHeight': h, 'frames': len(rows[0]),
        'durationMs': duration, 'x': int(ox), 'y': int(oy), 'sceneWidth': 1586, 'sceneHeight': 992, **extra,
    }, indent=2) + '\n')
    print(name, 'frame', w, h, 'frames', len(rows[0]), 'rows', len(rows))

# Woman: rocks from the hips, head and shoulders as one, hair a beat behind, nothing moves below the waist.
canvas, ox, oy, xx, yy = load('woman', 6, 10)
F = 16
ROCK, DIP, LAG, PHI = 5, 2, 2, .9
ARMS = 3  # shoulders and arms swing a little further than the spine, a beat late
ramp = smooth((472 - yy) / 52)
hair = np.maximum(smooth((362 - yy) / 26), smooth((556 - xx) / 14) * smooth((414 - yy) / 12))
arms = smooth((yy - 408) / 22) * smooth((505 - yy) / 38) * smooth((592 - xx) / 16)
frames = []
for i in range(F):
    r = np.sin(TAU * i / F)
    lag = np.sin(TAU * i / F - PHI) + np.sin(PHI)
    frames.append(clean(warp(canvas, ramp * ROCK * r + hair * LAG * lag + arms * ARMS * lag, -ramp * DIP * r * r)))
check('woman', frames, canvas)
assert all((f[506 - oy:] == canvas[506 - oy:]).all() for f in frames), 'planted hand must stay anchored'
save('woman', [frames], ox, oy, 3000)

# Heart: its own vertical float, peaking a quarter-cycle after her rock.
canvas, ox, oy, _, _ = load('heart', 8, 0)
frames = [warp(canvas, np.zeros(canvas.shape[:2]), np.full(canvas.shape[:2], 3 * (1 - np.cos(TAU * i / F)))) for i in range(F)]
check('heart', frames, canvas)
save('heart', [frames], ox, oy, 3000)

# Girl: an inverted pendulum about her chin. Hands, body and the long hair stay still.
canvas, ox, oy, xx, yy = load('girl', 6, 6)
ALPHA = np.radians(4)
PX, PY = 768, 464
weight = smooth((466 - yy) / 14) * smooth((xx - 694) / 40)
PONY, HAND, PHI_G = 4, 3, .7
pony = smooth((738 - xx) / 28) * smooth((yy - 402) / 34) * smooth((506 - yy) / 34)  # swings from the bow, resting at the ground
pony *= 1 - smooth((yy - 455) / 10) * smooth((xx - 698) / 8)  # the sleeve stays with her arm
hand = smooth((xx - 724) / 10) * smooth((yy - 446) / 14) * smooth((513 - yy) / 42)  # pivots on the elbows
def tilt(art, i):
    a = ALPHA * np.sin(TAU * i / F) * weight
    rx, ry = xx - PX, yy - PY
    late = np.sin(TAU * i / F - PHI_G) + np.sin(PHI_G)
    sway = pony * PONY * late + hand * HAND * np.sin(TAU * i / F)
    return warp(art, rx * np.cos(a) - ry * np.sin(a) - rx + sway, rx * np.sin(a) + ry * np.cos(a) - ry)

# The eyes are drawn as happy arcs, so a blink squeezes each arc flat: her own rows, half as tall.
closed = canvas.copy()
for x0, y0, x1, y1 in [(743, 430, 762, 446), (771, 427, 788, 441)]:
    box = canvas[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    above = canvas[y0 - oy - 1, x0 - ox:x1 - ox]
    h = box.shape[0]
    squeezed = box[np.arange(0, h, 3)]
    out = np.repeat(above[None], h, 0)
    out[h - squeezed.shape[0] - 1:h - 1] = squeezed
    out[-1] = box[-1]
    closed[y0 - oy:y1 - oy, x0 - ox:x1 - ox] = out
open_row = [clean(tilt(canvas, i)) for i in range(F)]
blink_row = [clean(tilt(closed, i)) for i in range(F)]
check('girl', open_row, canvas)
check('girl blink', blink_row, closed)
save('girl', [open_row, blink_row], ox, oy, 3400, blink={'row': 1, 'minGapMs': 3000, 'maxGapMs': 6000, 'closedMs': 140})

# Baby: same breath as Nacho's, slower. The swaddle swells up and out; the face rides along rigid.
canvas, ox, oy, xx, yy = load('baby', 6, 6)
def breath(t):
    t %= 1
    if t < .36: return .5 - .5 * np.cos(np.pi * t / .36)
    if t < .86: return .5 + .5 * np.cos(np.pi * (t - .36) / .5)
    return 0.
lift = (.34 + .66 * smooth((xx - 885) / 20)) * smooth((504 - yy) / 32)
side = smooth((xx - 900) / 44) * smooth((yy - 462) / 12) * smooth((512 - yy) / 12)
frames = [clean(warp(canvas, -2 * breath(i / F) * side, 3 * breath(i / F) * lift)) for i in range(F)]
check('baby', frames, canvas)
save('baby', [frames], ox, oy, 3000)

# Zs: each drifts up on its own clock, dissolves in checkered art pixels and fades back in at home.
for n, (dur, phase) in enumerate([(3600, 0), (3900, 1100), (4200, 2300)], 1):
    name = f'z{n}'
    canvas, ox, oy, _, _ = load(name, 34, 12, left=2)
    F_Z, LIVE = 24, 18
    h, w = canvas.shape[:2]
    cell = (np.indices((h, w)) // 3).sum(0) % 2 == 0
    frames = []
    for i in range(F_Z):
        if i < LIVE:
            p = i / LIVE
            f = warp(canvas, np.full((h, w), -np.rint(7 * p + 2 * np.sin(TAU * p))), np.full((h, w), 30 * p)).copy()
            if i >= LIVE - 2:
                f[cell if i == LIVE - 1 else (cell & (np.indices((h, w))[0] % 2 == 0))] = 0
        elif i >= F_Z - 2:
            f = canvas.copy()
            f[~cell if i == F_Z - 2 else (~cell & (np.indices((h, w))[0] % 2 == 0))] = 0
        else:
            f = np.zeros_like(canvas)
        frames.append(f)
    check(name, frames, canvas)
    save(name, [frames], ox, oy, dur, phaseMs=phase)
