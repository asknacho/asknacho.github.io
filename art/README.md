# Nacho art pipeline

Generate in Pixellab, export, and ask Claude to wire it in.

    art/pixellab/<pose>/       still rotations (8 directions) from Pixellab
    art/pixellab/anim/<name>/  animation frames pulled from the Pixellab GIFs (01.png, 02.png, ...)
    art/frames/code/           the talking-to-the-laptop loop (frame 9 of the export was broken, so it is dropped)

Build a sheet. `--canvas 72` centres every frame in a 72x72 cell, so sheets that swap in the same spot
(breathing and walking) line up. Pixels are never resampled.

Nacho is now drawn on a 64x64 Pixellab canvas; his sheets use 96x96 cells:

    python3 tools/build_sheet.py stand  art/pixellab/anim/breathe64 --ms 200 --canvas 96
    python3 tools/build_sheet.py code   art/pixellab/anim/code64    --ms 200 --canvas 96
    python3 tools/build_sheet.py guitar art/pixellab/anim/guitar64  --ms 200 --canvas 96

The older 48-pixel animations (breathe, walk, guitar, art/frames/code) are kept for reference. A 64-pixel
walking animation is still to come; until then the intro breathes while it scrolls.

Wife and daughter are single stills for now (`wife`, `girl`, 1 frame each); swap in their
animations the same way when they exist.

`python3 tools/build_family.py` removes the grass mats from the wife and daughter stills, puts them in
72x72 cells and draws the pixel contact shadows.

The Barcelona backdrop for the family scene is built from the old scene app's art:

    python3 tools/build_barcelona.py   # -> assets/barcelona.png (416x100 pixel art), sky and sea masks, barcelona.json

This writes `assets/<name>.png` and `assets/<name>.json` (frame size, frame count, loop length).
