"""Prepare the family sprites for the Barcelona scene.

    python3 tools/build_family.py

- Removes the grass mats Pixellab drew under the wife and daughter (Nacho has none), so everyone stands
  on the backdrop's own grass instead of floating mats.
- Places each still in the same 72x72 cell the animation sheets use.
- Draws a pixel-art contact shadow for each character on Nacho's pixel grid, so all three are grounded
  the same way.
Prints each sprite's art box inside its cell; index.html positions the family from these numbers.
"""
import colorsys, json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets'
SHADOW = (20, 15, 28, 110)  # dark violet, ~43% opaque; the scene lighting tints it further

def without_grass(img):
    a = np.array(img.convert('RGBA')).astype(float)
    hsv = np.array([[colorsys.rgb_to_hsv(*(p / 255)) for p in row] for row in a[..., :3]])
    opaque = a[..., 3] > 0
    bottom = np.nonzero(opaque.any(1))[0].max()
    rows = np.arange(a.shape[0])[:, None]
    grass = opaque & (hsv[..., 0] * 360 > 50) & (hsv[..., 0] * 360 < 160) & (hsv[..., 1] > 0.3) & (hsv[..., 2] > 0.25)
    grass &= rows >= bottom - 12  # only the ground mat, never green clothes higher up
    a[grass] = 0
    # Dark specks of the mat's outline left with almost no neighbours.
    alive = a[..., 3] > 0
    for y in range(bottom - 12, a.shape[0]):
        for x in range(a.shape[1]):
            if alive[y, x] and a[y, x, :3].sum() < 160 and alive[max(0, y - 1):y + 2, max(0, x - 1):x + 2].sum() - 1 <= 2:
                a[y, x, 3] = 0
    return Image.fromarray(a.astype(np.uint8))

def shadow(width, height):
    """A flat pixel ellipse, no anti-aliasing, like a 16-bit sprite shadow."""
    img = Image.new('RGBA', (width, height))
    cx, cy = (width - 1) / 2, (height - 1) / 2
    for y in range(height):
        for x in range(width):
            if ((x - cx) / (width / 2)) ** 2 + ((y - cy) / (height / 2)) ** 2 <= 1:
                img.putpixel((x, y), SHADOW)
    return img

boxes = {}
for name in ('wife', 'girl'):
    still = without_grass(Image.open(ROOT / 'art' / 'pixellab' / name / 'south.png'))
    cell = Image.new('RGBA', (72, 72))
    cell.alpha_composite(still, (12, 12))
    cell.save(OUT / f'{name}.png')
    boxes[name] = cell.getbbox()
nacho = Image.open(OUT / 'stand.png').convert('RGBA')
boxes['nacho'] = nacho.crop((0, 0, 96, 96)).getbbox()  # 64-canvas Nacho in a 96 cell

# Shadow sizes in Nacho's pixels: a bit wider than each figure's footprint at its scale in the scene
# (wife at full scale, daughter at half until she is regenerated on a 32x32 canvas).
for name, (w, h) in {'nacho': (30, 5), 'wife': (30, 5), 'girl': (20, 3)}.items():
    shadow(w, h).save(OUT / f'shadow-{name}.png')
print(json.dumps(boxes))
