# High-resolution greeting

`assets/cycles/wave-hd.webp` stores twelve right-arm patches, built from `art/cycles/source/wave-hd-arm.png`. The source arm poses were generated with the built-in imagegen tool against the approved standing artwork. Face, hair, torso, legs and feet come from the unchanged `assets/standing-hd.webp` base.

Run `node tools/build_wave_hd.cjs [path-to-sharp]` to rebuild the lossless patch atlas and `wave-hd.json` metadata. The player draws into the native 2446×2446 canvas; the small atlas contains only the arm's replacement rectangle. First and last frames match the standing image exactly, with ten distinct action poses between them. Playback lasts 1.7 seconds and runs once on a daytime arrival, then returns to the still. Scrolling cancels the greeting; reduced motion skips its download and playback. Walking and scroll parallax remain disabled.

Run `node tools/check_wave_hd.cjs [path-to-sharp]` to check frame count, matching rest endpoints, native resolution and the protected face/feet. `wave-hd-preview.gif` repeats the one-shot greeting with an added rest pause for review.

## Arm pose prompt

Use case: precise-object-edit / sprite animation parts.
Reference: approved detailed standing Nacho. Produce ONLY his RIGHT ARM (the arm on the VIEWER'S LEFT), isolated from shoulder seam to fingertips. No head, body, legs, backpack or second arm.
Deliver a 12-frame sprite part sheet: EXACTLY FOUR COLUMNS and THREE ROWS, equal SQUARE cells, row-major. Transparent background, no labels, numbers, dividers, shadows or glow. Each cell about512×512, total2048×1536.
The shoulder attachment must stay fixed at the same coordinate near upper RIGHT of each cell, leaving space to the left for a raised hand. Match the source burgundy jacket's detailed pixel clusters, dark outlines, fabric folds, skin color and hand anatomy exactly.
A small friendly greeting cycle:
1 relaxed arm hanging down, hand relaxed
2 elbow bends and forearm starts lifting outward
3 elbow lifts slightly outward, hand reaches chest height
4 forearm nearly upright, open palm beside shoulder
5 hand at cheek-height, palm tilted outward
6 wrist tilts gently left
7 wrist straightens
8 wrist tilts gently right
9 wrist straightens again
10 forearm starts lowering
11 elbow settles and hand lowers
12 arm almost returns to rest, to join frame1.
All twelve poses must be separately drawn pixel-art shapes. No image rotation, morphing, motion blur or video interpolation. Keep arm lengths, shoulder anchor and the size of the hand consistent. Same side of the body in all frames; open palm faces the viewer during the greeting. This is an animation PART to composite onto the unmodified original character, so do not include any torso or face pixels. Entire limb and fingers must fit within each cell.
