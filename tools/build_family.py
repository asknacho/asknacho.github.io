"""Draw the pixel-art contact shadow for Nacho in the Barcelona scene.

    python3 tools/build_family.py

A flat pixel ellipse on Nacho's grid (no anti-aliasing, like a 16-bit sprite shadow), so he stands on
the backdrop's grass instead of floating. The wife and daughter stills from Pixellab are kept in
art/pixellab/ for later; they are not on the page for now.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SHADOW = (20, 15, 28, 110)  # dark violet, ~43% opaque; the scene lighting tints it further

def shadow(width, height):
    img = Image.new('RGBA', (width, height))
    cx, cy = (width - 1) / 2, (height - 1) / 2
    for y in range(height):
        for x in range(width):
            if ((x - cx) / (width / 2)) ** 2 + ((y - cy) / (height / 2)) ** 2 <= 1:
                img.putpixel((x, y), SHADOW)
    return img

shadow(24, 4).save(ROOT / 'assets' / 'shadow-nacho.png')
print('shadow-nacho.png 24x4')
