# Sharing and motion assets

New poses were generated with the built-in imagegen tool, using the existing Nacho sprites and the approved family scene as references. Lossless WebP keeps the generated detail while reducing download size; originals in `assets/` remain unchanged.

Outputs: `assets/stand-polished.webp`, `assets/wave.webp`, `assets/code-polished.webp`, `assets/guitar-polished.webp`, and `assets/piano.webp`.

The original still poses above are retained as art references. Runtime typing, guitar, piano, waving, walking and sleeping use twelve-frame sheets; family time uses four blink states in `assets/cycles/`; see `art/cycles/README.md`. Still artwork supplies the reduced-motion fallback. The earlier four-frame greeting and whole-image music/coding sway are no longer used.

The full-resolution family scene has four raster states: eyes open, Nacho blinking, his wife blinking, and their older daughter blinking. Only six eye rectangles change. Blinks last 130 ms and are staggered with long pauses. The baby and all other artwork remain still. The original image is the reduced-motion and no-JavaScript fallback. The sleeping bag uses a separate twelve-frame cloth-breathing cycle. Motion stops when the scene leaves the viewport or the tab is hidden.

The social card and icons are composed from existing art by `tools/build_share_assets.cjs`, using Node and sharp. Run `node tools/build_share_assets.cjs [path-to-sharp]` to regenerate them. No generation API is needed for these composed assets.

## Generation prompts

### guitar

Use case: illustration-story. Asset type: transparent pixel-art sprite for a personal website.
Reference 1 is Nacho's current guitar pose and composition. Reference 2 is the approved detailed family sprite style and face. Make a polished single sprite of the SAME Nacho sitting on the floor playing a warm brown acoustic guitar. Preserve pose and composition from reference 1, bring detail and dark brown outlines closer to reference 2. Slim adult proportions, small head, side swept tousled brown hair, subtle short beard, burgundy open jacket, olive straps, black T-shirt with white V, blue jeans, gray sneakers. Limited earthy warm palette, visible sharp square pixel clusters, restrained shading. Whole character, full guitar and feet visible, isolated on transparent background. No room, floor plane, patch of grass, glow, decorative notes, text or logos. One pose only, not a sprite sheet.

### code

Use case: illustration-story. Asset type: transparent pixel-art sprite for a personal website.
Reference 1 is Nacho's current coding pose and composition. Reference 2 is the approved detailed family sprite style and face. Make a polished single sprite of the SAME Nacho sitting on the floor with a laptop on his knees, looking at the screen and typing. Preserve composition from reference 1, bring pixel detail and brown outlines closer to reference 2. Slim adult proportions, small head, side swept tousled brown hair, subtle short beard, burgundy open jacket, olive straps, black T-shirt with white V, blue jeans, gray sneakers. Small laptop with blank dark lid, no text or logos. Limited earthy warm palette, visible sharp square pixel clusters, restrained shading. Whole character, laptop and feet visible, isolated on transparent background. No room, floor plane, glow, decorative icons or text. One pose only, not a sprite sheet.

### wave

Use case: illustration-story. Asset type: transparent animated sprite sheet.
Input references: first is the exact small standing Nacho sprite to preserve. Second shows his face/outfit in the approved detailed pixel art style.
Create ONE 2x2 sprite sheet with FOUR aligned frames of Nacho greeting the visitor with a small friendly hand wave. Frame top left: relaxed standing, hands down. Top right: his right forearm raised in greeting. Bottom left: raised open hand tilts outward a little. Bottom right: raised open hand tilts inward a little. SAME character scale, head position, feet baseline and canvas margins in all 4 equal square cells. No borders, no labels.
Match the reference precisely: slim adult with SMALL HEAD, side swept brown hair, short beard, burgundy open jacket, olive straps, black T-shirt with white V, blue jeans, gray sneakers. Head is one quarter of body height, not chibi. Pixel clusters, brown outlines, earthy palette, same family scene artist style. Straight-on full body, feet visible. Actual transparent background, no floor, no circles, no scenery, no text, no grid lines. Every cell needs generous identical transparent padding.

### piano

Use case: illustration-story. Asset type: transparent pixel art game sprite.
Reference 1 is the authoritative Nacho identity, clothes, pixel treatment, adult proportions. Reference 2 shows his original guitar pose as context. Create Nacho seated at a compact digital piano on a simple stand, practising with both hands on the keys, three-quarter side view facing left. His whole body, seat, full keyboard, stand, feet visible. EXACT character: brown side-swept tousled hair, short beard/stubble, burgundy open jacket, olive straps, black shirt with small white V, blue jeans and gray sneakers. Adult slim proportions and small expressive face. Warm earthy limited palette, dark outlines, crisp square pixel clusters, same detailed pixel sprite style as family reference. This is a single sprite, not a sheet. Transparent background, no floor, no room, no musical symbols, no text, no glow, no shadows extending beyond sprite. Keep all image detail at generated resolution; intended display 240px wide.
