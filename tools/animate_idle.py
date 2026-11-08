"""Build simple idle loops from the still Pixellab poses: whole pixel rows move, nothing is resampled.

    python3 tools/animate_idle.py            # writes frames to art/frames/<pose>/ then run build_sheet.py

stand : breathing. Head and shoulders rise 1 px; the gap is filled by repeating the row at the cut.
guitar: singing and strumming beat. Upper body bobs 1 px on the beat and the head leans a pixel.
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

def lift(img, cut, k, head_cut=None, dx=0):
    """Shift rows above `cut` up by k pixels (feet stay put), repeating row `cut` to fill the gap."""
    a = np.array(img.convert('RGBA'))
    out = a.copy()
    if k:
        out[:cut - k] = a[k:cut]
        out[cut - k:cut] = a[cut]
        # Rows above the cut came from k rows lower, so the top k rows fall off the canvas: keep them blank.
    if dx and head_cut:
        src = out[:head_cut].copy()
        out[:head_cut] = 0
        if dx > 0: out[:head_cut, dx:] = src[:, :-dx]
        else: out[:head_cut, :dx] = src[:, -dx:]
    return Image.fromarray(out)

POSES = {
    # pose: (cut row, per-frame lift, head cut row, per-frame head dx, ms per frame)
    'stand':  (20, [0, 0, 1, 1, 1, 1, 0, 0], None, [0] * 8, 240),
    'guitar': (23, [0, 1, 1, 0, 0, 1, 1, 0], 17,   [0, 0, 1, 1, 0, 0, -1, -1], 150),
}

for pose, (cut, ks, hcut, dxs, ms) in POSES.items():
    src = Image.open(ROOT / 'art' / 'pixellab' / pose / 'south.png')
    out = ROOT / 'art' / 'frames' / pose
    out.mkdir(parents=True, exist_ok=True)
    for i, (k, dx) in enumerate(zip(ks, dxs)):
        lift(src, cut, k, hcut, dx).save(out / f'{i + 1:02d}.png')
    print(f'{pose}: {len(ks)} frames, {ms} ms each')
