// Regression check for the recorded book/blanket/hand pixel flicker.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const sharp = require(process.argv[2] || 'sharp');
const root = path.resolve(__dirname, '..');
const key = (data, p) => `${data[p]},${data[p + 1]},${data[p + 2]}`;
(async () => {
  const meta = JSON.parse(fs.readFileSync(path.join(root, 'assets/cycles/family.json')));
  assert.equal(meta.frames, 12);
  assert.equal(meta.clear.length, 3, 'Every affected region must be replaced completely');
  const faces = [
    { x: 340, y: 0, width: 320, height: 310 },
    { x: 690, y: 0, width: 300, height: 330 },
    { x: 870, y: 330, width: 150, height: 95 },
    { x: 990, y: 650, width: 200, height: 145 },
  ];
  for (const region of meta.clear) for (const face of faces) {
    const overlaps = region.x < face.x + face.width && region.x + region.width > face.x &&
      region.y < face.y + face.height && region.y + region.height > face.y;
    assert.equal(overlaps, false, 'Animation regions must never touch a face');
  }
  const base = await sharp(path.join(root, 'assets/family-reading.webp')).ensureAlpha().raw().toBuffer();
  const { frameWidth: width, frameHeight: height } = meta;
  const palettes = meta.clear.map(region => {
    const colors = new Set(['244,226,179', '183,151,98']);
    for (let y = region.y; y < region.y + region.height; y++) for (let x = region.x; x < region.x + region.width; x++) {
      const p = (y * width + x) * 4;
      if (base[p + 3] === 255) colors.add(key(base, p));
    }
    return colors;
  });
  const hashes = new Set();
  for (let frame = 0; frame < 12; frame++) {
    const pixels = await sharp(path.join(root, 'assets/cycles/family.webp')).extract({
      left: frame % 4 * width, top: Math.floor(frame / 4) * height, width, height,
    }).ensureAlpha().raw().toBuffer();
    hashes.add(crypto.createHash('sha256').update(pixels).digest('hex'));
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      const region = meta.clear.findIndex(r => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height);
      if (region < 0) assert.equal(pixels[p + 3], 0, 'Faces and all other artwork must remain untouched');
      else if (pixels[p + 3] === 255) assert.ok(palettes[region].has(key(pixels, p)), 'No mismatched generated colors in action regions');
      if (frame === 0 && region >= 0) {
        assert.equal(pixels[p + 3], base[p + 3]);
        if (pixels[p + 3] === 255) assert.equal(key(pixels, p), key(base, p), 'Rest frame must match the approved image');
      }
    }
  }
  assert.equal(hashes.size, 12);
  console.log('Family: 12 distinct poses; exact rest frame; complete replacement regions; original palettes and untouched faces verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
