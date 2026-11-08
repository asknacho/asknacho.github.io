"""Build a 4-frame front walk cycle from the single south-facing Pixellab walking still.

    python3 tools/animate_walk.py   # writes art/frames/walk/01..04.png, then run build_sheet.py

Like the other loops, whole pixel rows and columns move and nothing is resampled:
  01 contact: the still as drawn (his right foot forward)
  02 passing: forward foot lifts, back foot drops, body rises 1 px
  03 contact: legs mirrored (left foot forward)
  04 passing: mirrored passing pose
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
HIP = 32       # first row of the legs
SPLIT = 24     # column of the seam between the legs; mirroring about it keeps the seam in place
BAND = 37      # plain denim row that stretches or shrinks when a leg changes length

def move_leg(a, x0, x1, k):
    """Lengthen (k > 0) or shorten (k < 0) the leg in columns x0..x1 by repeating or dropping denim rows."""
    leg = a[HIP:, x0:x1]
    rows = list(range(leg.shape[0]))
    band = BAND - HIP
    if k > 0: rows = rows[:band] + [band] * k + rows[band:]
    if k < 0: rows = rows[:band] + rows[band - k:]
    rows = (rows + [None] * leg.shape[0])[:leg.shape[0]]
    out = np.zeros_like(leg)
    for i, r in enumerate(rows):
        if r is not None: out[i] = leg[r]
    a[HIP:, x0:x1] = out

def mirror_legs(a):
    a[HIP:, 1:2 * SPLIT] = a[HIP:, 1:2 * SPLIT][:, ::-1]

def lift_body(a, k):
    a[:HIP - k] = a[k:HIP].copy()
    a[HIP - k:HIP] = a[HIP]
    a[:k] = 0

base = np.array(Image.open(ROOT / 'art' / 'pixellab' / 'walk' / 'south.png').convert('RGBA'))
passing = base.copy()
move_leg(passing, SPLIT, 48, -2)   # forward (right) foot comes up
move_leg(passing, 0, SPLIT, 1)     # back (left) foot comes down
lift_body(passing, 1)
mirrored, mirrored_passing = base.copy(), passing.copy()
mirror_legs(mirrored); mirror_legs(mirrored_passing)

out = ROOT / 'art' / 'frames' / 'walk'
out.mkdir(parents=True, exist_ok=True)
for i, f in enumerate([base, passing, mirrored, mirrored_passing]):
    Image.fromarray(f).save(out / f'{i + 1:02d}.png')
print('walk: 4 frames')
