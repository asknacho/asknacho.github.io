"""Make a breathing loop from a single standing still: rows above the belt lift by 0-2 px and the
belt row stretches to fill the gap. Pixels are moved, never resampled.

    python3 tools/breathe_from_still.py <still.png> <out_dir> [--cut 162]
"""
import argparse
from pathlib import Path
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('still'); ap.add_argument('out_dir')
ap.add_argument('--cut', type=int, default=162, help='belt row: everything above it rises')
a = ap.parse_args()

LIFT = [0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0, 0]  # quick inhale, hold, slower exhale, rest (13 frames)
src = np.array(Image.open(a.still).convert('RGBA'))
out = Path(a.out_dir); out.mkdir(parents=True, exist_ok=True)
for i, k in enumerate(LIFT):
    f = src.copy()
    if k:
        f[:a.cut - k] = src[k:a.cut]
        f[a.cut - k:a.cut] = src[a.cut]
    Image.fromarray(f).save(out / f'{i + 1:02d}.png')
print(f'{len(LIFT)} frames -> {out}')
