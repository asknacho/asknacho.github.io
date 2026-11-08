"""Pack a folder of animation frames into one horizontal sprite sheet plus a JSON descriptor.

    python3 tools/build_sheet.py <name> <frames_dir> [--ms 120] [--out assets]

Frames are sorted by filename. Every frame is padded to the largest frame's size and anchored
bottom-centre, so the feet stay on one line and nothing is cropped. Pixels are never resampled.
"""
import argparse, json
from pathlib import Path
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('name'); ap.add_argument('frames_dir')
ap.add_argument('--ms', type=int, default=120, help='milliseconds per frame')
ap.add_argument('--out', default='assets')
ap.add_argument('--pad', type=int, default=2, help='transparent pixels around the largest frame')
ap.add_argument('--canvas', type=int, help='square frame size; frames are centred in it (overrides --pad), so sheets that swap in one spot line up')
a = ap.parse_args()

files = sorted(p for p in Path(a.frames_dir).iterdir() if p.suffix.lower() == '.png')
if not files: raise SystemExit(f'no PNG frames in {a.frames_dir}')
frames = [Image.open(p).convert('RGBA') for p in files]
# Trim each frame to its pixels, then keep one shared box so the character does not jitter.
boxes = [f.getbbox() or (0, 0, f.width, f.height) for f in frames]
cw, ch = max(f.width for f in frames), max(f.height for f in frames)
if a.canvas:
    if a.canvas < max(cw, ch): raise SystemExit(f'--canvas {a.canvas} is smaller than the frames ({cw}x{ch})')
    W = H = a.canvas
    place = lambda f: ((W - f.width) // 2, (H - f.height) // 2)
else:
    W, H = cw + 2 * a.pad, ch + 2 * a.pad
    place = lambda f: (a.pad + (cw - f.width) // 2, a.pad + (ch - f.height))
sheet = Image.new('RGBA', (W * len(frames), H))
for i, f in enumerate(frames):
    x, y = place(f)
    sheet.alpha_composite(f, (i * W + x, y))
out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
sheet.save(out / f'{a.name}.png')
meta = {'id': a.name, 'image': f'{a.name}.png', 'frameWidth': W, 'frameHeight': H,
        'frames': len(frames), 'durationMs': a.ms * len(frames)}
(out / f'{a.name}.json').write_text(json.dumps(meta, indent=2) + '\n')
print(f'{a.name}: {len(frames)} frames of {W}x{H}, loop {meta["durationMs"]} ms -> {out}/{a.name}.png')
