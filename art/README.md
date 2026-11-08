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

This writes `assets/<name>.png` and `assets/<name>.json` (frame size, frame count, loop length).
