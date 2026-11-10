# Standing sprite

`assets/standing-hd.webp` is a dedicated static standing pose generated with the built-in imagegen tool, referenced against the existing standing, laptop and family artwork. `art/standing-source.png` preserves its original output.

`node tools/build_standing_sprite.cjs [path-to-sharp]` removes a faint generated halo and pads the native 1485px-tall character onto a 2446px square canvas without resampling. Its feet line up with the existing intro floor. The page uses crisp pixel rendering and no daytime pose switching or scroll transform.

## Prompt

Use case: identity-preserve / pixel-art refinement.
Edit target: image1, the standing Nacho character. Style/detail references: image2 (Nacho coding) and image3 (family scene).
Create a SINGLE high-detail standing sprite of the same Nacho, full body, straight-on relaxed standing pose with arms at his sides. Preserve his exact identity and head-to-body proportions, burgundy open jacket, olive backpack straps, black T-shirt with a white V, blue jeans, gray sneakers, side-swept tousled brown hair and short beard. Match the face, hair, outlines and warm palette from the coding and family references.
IMPORTANT QUALITY FIX: image1 is too coarse and lacks the detailed pixel clusters seen in the other poses. Redraw at the finer, crisp pixel-art density of image2 and image3: clearly defined layered hair, eyes/brows, beard, hands, fabric folds and sneaker details, using smaller square pixel clusters. Keep it authentic RPG pixel art, not blurry upscaled pixels, not smooth vector or painting. No huge simple square facial features. No change to identity, clothes or composition. Friendly understated expression.
Output one large full-resolution sprite, at least 1000px tall character, with genuinely transparent background and no glow, floor, shadow, text, speech bubbles, props, animation sheet or extra character. Entire head and both feet fully visible with modest transparent padding.
