# Nacho art pipeline

Generate in Pixellab, drop the frames here, and ask Claude to wire them in.

When Pixellab only gives stills, `tools/animate_idle.py` (breathing, guitar bob) and
`tools/animate_walk.py` (4-frame front walk from the south walking still) build loops from them.

    art/incoming/stand/   standing breathing frames  (01.png, 02.png, ...)
    art/incoming/guitar/  sitting, playing guitar and singing frames

Rules for the exports: one PNG per frame, transparent background, same canvas size for every frame
in a set, frame names that sort in playback order (01, 02, ...).

Build a sheet (the script pads every frame to the biggest, bottom-centre, so nothing is clipped):

    python3 tools/build_sheet.py stand  art/incoming/stand  --ms 120
    python3 tools/build_sheet.py guitar art/incoming/guitar --ms 140

This writes `assets/<name>.png` and `assets/<name>.json` (frame size, frame count, loop length).
