# Nacho art pipeline

Generate in Pixellab, export, and ask Claude to wire it in.

    art/pixellab/<pose>/       still rotations (8 directions) from Pixellab
    art/pixellab/anim/<name>/  animation frames pulled from the Pixellab GIFs (01.png, 02.png, ...)
    art/frames/code/           the talking-to-the-laptop loop (frame 9 of the export was broken, so it is dropped)

Build a sheet. `--canvas 72` centres every frame in a 72x72 cell, so sheets that swap in the same spot
(breathing and walking) line up. Pixels are never resampled.

    python3 tools/build_sheet.py stand  art/pixellab/anim/breathe --ms 200 --canvas 72
    python3 tools/build_sheet.py walk   art/pixellab/anim/walk    --ms 200 --canvas 72
    python3 tools/build_sheet.py guitar art/pixellab/anim/guitar  --ms 200 --canvas 72
    python3 tools/build_sheet.py code   art/frames/code           --ms 200 --canvas 72

`python3 tools/build_family.py` draws Nacho's pixel contact shadow for the Barcelona scene. The wife and
daughter stills are kept in art/pixellab/ but are not on the page for now.

The Barcelona backdrop for the family scene is built from the old scene app's art:

    python3 tools/build_barcelona.py   # -> assets/barcelona.png (416x100 pixel art), sky and sea masks, barcelona.json

This writes `assets/<name>.png` and `assets/<name>.json` (frame size, frame count, loop length).

## Intro Nacho (high-detail)

The opening scene uses Pixellab's high-detail Nacho (148x256 stills, 256x256 walk frames) in
art/pixellab/hd/. Pixellab only gave a still for standing, so the breathing loop is made from it:

    python3 tools/breathe_from_still.py art/pixellab/hd/rotations/south.png art/frames/hd-breathe
    python3 tools/build_sheet.py hero-stand art/frames/hd-breathe --ms 200 --canvas 256
    python3 tools/build_sheet.py hero-walk  art/pixellab/hd/walk  --ms 200 --canvas 256
