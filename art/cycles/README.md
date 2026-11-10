# Twelve-frame sprite cycles

Typing, guitar, piano, greeting, walking, family and sleeping each have twelve distinct raster frames. Playback copies one complete atlas cell at a time, with no tweening, whole-image rotation, scaling, morphing or interpolation.

| Cycle | Frame duration | Full cycle |
| --- | --- | --- |
| Typing | 140 ms | 1.68 s |
| Guitar | 120 ms | 1.44 s |
| Piano | 140 ms | 1.68 s |
| Wave | 160 ms | 1.92 s |
| Walk | 100 ms | 1.20 s |
| Family | 350 ms | 4.20 s |
| Sleep | 360 ms | 4.32 s |

The greeting plays one complete cycle on arrival, then rests. Walking runs while scrolling and returns to the resting pose when scrolling stops. Typing, instruments, family and sleeping loop while visible. Reduced motion shows the still artwork; scrolling away or hiding the tab pauses playback. The caption follows the walking sprite's scroll position.

Walking, typing, instrument, greeting and sleeping source poses were generated with the built-in imagegen tool from the approved new-style stills. Family poses are authored directly from the approved artwork by `tools/build_family_cycle.cjs`. `source/` retains the twelve-pose input atlases. `tools/build_sprite_cycles.cjs` registers each pose using the head and pins the static image to frame 1, admitting redraws only inside the action regions (hands, wrists and sleeves). This keeps faces and the rest of the body stable rather than letting generated frames drift.

Run `node tools/build_sprite_cycles.cjs [path-to-sharp]` to rebuild. The script verifies twelve unique frames for every action, preserves native pixel samples, adds consistent transparent margins and writes lossless 4×3 WebP atlases, first-frame stills and JSON timing metadata to `assets/cycles/`. `assets/sprite-cycles.js` validates dimensions and frame counts before enabling playback; the still image remains available if loading fails.

The family cycle keeps the exact approved 1388×999 artwork as its base. `tools/build_family_cycle.cjs` authors a small page flutter and discrete blanket/hand poses directly from that image. Each cell stores complete replacement rectangles, including their original pixels and transparency. The player clears each old rectangle before drawing its replacement, preventing mixed edges, accumulated layers and patchy pixel noise. Faces, bodies and sofa remain unchanged. The original image remains the still fallback.

`intro-preview.gif` shows the walking, family and sleeping cycles at their individual playback timings. The family and sleeping sheets are loaded only for the active time-of-day scene.

`family-preview.gif` shows the corrected family loop at a closer scale. Run `node tools/check_family_cycle.cjs [path-to-sharp]` to verify twelve distinct poses, original palettes, exact opaque rest-frame pixels, complete replacement rectangles and protected faces. Family frame parameters and pixel-art page geometry are editable in `tools/build_family_cycle.cjs`.

## Generation prompts

### sleep

Use case: precise-object-edit sprite animation.
Reference edit target: the burgundy pixel-art sleeping bag in the supplied image. Preserve exactly its silhouette, dark outlines, zipper on the left, colors, folds, profile and orientation.
Make a TWELVE-FRAME subtle sleeping/breathing animation sprite sheet, 4 columns × 3 rows, 12 equal SQUARE cells in row-major order. Transparent background.
The person remains entirely inside the closed bag. Small motion only: frames 1–6 the chest cloth near the upper middle rises by 1–2 logical pixel steps and the fold highlights gently change; frames 7–12 the cloth settles back, returning smoothly to frame 1. The bag's base, foot end, left zipper pull and the overall location remain EXACTLY fixed in every frame. Redraw the little cloth contours and fold pixels separately per frame. No entire-bag scaling, stretching, rocking, rotation, sliding, warping or blur. No Z symbols, person sticking out, text, pillows or new objects.
Crisp warm burgundy square pixel clusters with dark brown outlines matching the source. Same size in all 12 cells. Center each whole bag at the same coordinates, with identical generous transparent padding. Target 2048×1536, cells512×512. No cell borders or numbers.

### walk

Use case: identity-preserve sprite animation.
Reference: the exact new-style standing Nacho sprite. Preserve face, hair, beard, jacket, colors and small adult proportions.
Create a TWELVE-FRAME classic RPG WALK CYCLE, 4 columns × 3 rows, exactly 12 equal SQUARE cells in row-major order, transparent background. Full-body FRONT view walking toward the viewer in place, matching the reference's standing orientation. Never turn sideways.
Frame 1 left foot contact, right arm forward; 2 left weight transfer; 3 right foot passing; 4 right knee forward; 5 right foot extends; 6 right foot approaches ground; 7 right foot contact, left arm forward; 8 right weight transfer; 9 left foot passing; 10 left knee forward; 11 left foot extends; 12 left foot approaches contact for a clean loop to 1.
Legs, knees, shoe silhouettes and opposing arms must be separately redrawn in EVERY frame; clear contact/passing poses. No whole-image sliding, rotating, warping, zooming, motion blur or AI video interpolation. Head/face stay at the SAME coordinates and the character scale is IDENTICAL in every cell. Feet touch a consistent floor baseline, no drawn floor or shadows.
Burgundy open jacket, olive straps, black V shirt, blue jeans and gray sneakers, same warm earthy square pixel clusters and dark outlines as reference. Leave equal generous transparent padding around all poses. Source style is authoritative. Target 2048×1536 with 512×512 cells. No numbering, dividers, text or extraneous props.

### piano

Use case: identity-preserve sprite animation. Edit target: supplied Nacho playing digital piano sprite. Preserve exact face, character, outfit, instrument and seat.
Create a traditional 12-frame game pixel-art animation sprite sheet in EXACTLY FOUR COLUMNS by THREE ROWS, 12 equal SQUARE cells in row-major order. Target total 2048x1536 with 512px cells. Background genuinely transparent. No text, numbering, dividers or panel borders.
Action: a seamless 12-frame piano-playing cycle. Redraw hands and fingers pressing successive keys, left and right hands alternate, slight wrist lifts for each note. 1 neutral keys; 2 left wrist rises; 3 left fingers press; 4 left releases as right rises; 5 right fingers press; 6 right releases; 7 left moves one key left; 8 left presses; 9 right moves one key right; 10 right presses; 11 hands return; 12 settles to frame1.
CRITICAL: no whole-character sway/rotation/scaling, no camera move, no warping or blur. FIXED head, torso, keyboard, stool, stand, legs and feet aligned identically across frames. Only hands/forearms are redrawn with distinct changing contours. Keep full keyboard, stand, feet and character inside each cell with consistent transparent margins. Same warm earthy palette, dark brown outlines and crisp square pixel clusters as supplied reference. Brown side-swept hair, short beard, burgundy jacket, olive straps, dark V shirt, blue jeans, gray sneakers. Frame 12 loops smoothly to frame1.

### wave

Use case: identity-preserve sprite animation. Reference: supplied standing Nacho sprite, preserve his exact identity, size, face, hairstyle, outfit, proportions and palette.
Draw a traditional TWELVE-FRAME pixel-art WAVE animation in a uniform sprite sheet of EXACTLY FOUR COLUMNS and THREE ROWS, 12 square equal cells in row-major order. Target 2048x1536 pixels with 512px cells, transparent background, no grid lines, numbers, captions or shadows.
Frame actions:
1 standing relaxed arm down
2 elbow bends, forearm lifts
3 open hand at shoulder height
4 hand reaches beside head
5 wrist tilts outward slightly
6 wrist reaches outermost wave pose
7 wrist returns vertical
8 wrist tilts inward
9 wrist reaches innermost pose
10 wrist returns vertical
11 arm lowers toward shoulder
12 arm returns almost to rest for seamless loop to frame 1.
This is 12 separately DRAWN SPRITE POSES, not a video or a globally warped still image. ONLY right arm, sleeve, hand contours change; head, face, body, left arm, legs and shoes must remain registered identically at the same exact coordinates in all frames. No character sliding, resizing, turning, squash/stretch, no blur or interpolation. Small adult head, brown side-swept hair, short beard, burgundy jacket, olive straps, dark V shirt, blue jeans and gray sneakers; match source's visible square pixel clusters. Entire body and raised hand inside each cell with identical generous transparent padding.

### guitar

Use case: identity-preserve sprite animation. Edit target: supplied Nacho acoustic guitar sprite. Preserve exact character, face, outfit, guitar and seated composition.
Create a traditional 12-frame pixel-art animation sprite sheet, exactly FOUR COLUMNS by THREE ROWS with 12 equal SQUARE cells, row-major order. Target 2048x1536, 512x512 each cell. Transparent background throughout, no border, labels, numbers or lines.
Action: genuine loop of playing acoustic guitar. Redraw the strumming forearm, wrist and fingers through a downstroke then upstroke while the other hand changes a chord on the neck. Frame 1 strumming hand above strings; 2 starts downstroke; 3 reaches middle strings; 4 reaches bottom; 5 overshoot; 6 reversal; 7 starts upstroke; 8 passes strings; 9 above strings; 10 chord-hand fingers shift; 11 settles; 12 returns to initial. Use 12 different hand poses with a smooth cyclic sequence.
CRITICAL: separate drawn sprite frames, NOT whole-sprite rotation/rocking/zoom/morph. Guitar body, neck, head, torso, crossed legs and feet remain FIXED and aligned across all 12 cells. Keep identity and palette exactly from source: small adult head, brown side-swept hair, short beard, burgundy jacket with olive straps, black shirt with white V, blue jeans, gray sneakers. Solid crisp square pixel clusters, dark outlines, no blur. Only the strumming arm/hand and fretting fingers change pixel shapes. All cells same scale and generous transparent padding; entire guitar headstock and shoes inside each cell. Frame 12 loops cleanly to 1.

### code

Use case: identity-preserve sprite animation. Edit target: the supplied Nacho coding sprite. Preserve EXACT character identity, face, hair, outfit, palette, pixel size, seated pose and laptop.
Deliver a traditional 12-frame pixel-art animation sprite sheet, exactly FOUR COLUMNS and THREE ROWS, 12 equal square cells in row-major order. Each cell about 512x512; total sheet 2048x1536. No labels or separators. Genuine transparent background.
Action: a seamless typing cycle: fingers press alternating keys, wrists and forearms change their drawn pixel contours. Frame 1: both hands resting on keyboard. 2 left fingers rise; 3 left fingers press; 4 left hand releases; 5 right fingers rise; 6 right fingers press; 7 right hand releases; 8 both hands type; 9 short left tap; 10 short right tap; 11 hands relax; 12 returns toward frame 1. Subtle blink only on frames 7-8.
CRITICAL: This is a hand-drawn game sprite workflow with separate redraws of hands in each frame. No whole-image rotation, tilting, scaling, camera movement, motion blur, morphing, extra fingers, repeated identical stills. Head, hair, torso, crossed legs, laptop and feet must stay identically registered to the pixel grid in every cell. Feet on same baseline. Same face and small adult head/body ratio as source. Keep burgundy jacket, olive straps, black V shirt, blue jeans and gray sneakers.
Keep the laptop lid completely fixed, move the visible typing fingers at either side of it. Entire sprite centered with equal generous transparent padding; no part crosses its cell boundary. Dark outlines, warm earthy pixel clusters exactly like source. Make frames 12 and 1 join smoothly.
