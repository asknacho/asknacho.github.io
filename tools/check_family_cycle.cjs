// The family may change only one person's eyes at a time.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const sharp = require(process.argv[2] || 'sharp');
const root = path.resolve(__dirname, '..');
(async () => {
  const meta = JSON.parse(fs.readFileSync(path.join(root, 'assets/cycles/family.json')));
  assert.equal(meta.frames, 4);
  assert.equal(meta.clear.length, 6);
  assert.deepEqual(meta.sequence.map(step => step.frame), [0,1,0,2,0,3]);
  for (const step of meta.sequence) assert.ok(step.frame === 0 ? step.durationMs >= 1900 : step.durationMs === 130);
  const base = await sharp(path.join(root, 'assets/family-reading.webp')).ensureAlpha().raw().toBuffer();
  const { frameWidth: width, frameHeight: height } = meta;
  const hashes = new Set();
  for (let frame = 0; frame < 4; frame++) {
    const pixels = await sharp(path.join(root, 'assets/cycles/family.webp')).extract({
      left: frame * width, top: 0, width, height,
    }).ensureAlpha().raw().toBuffer();
    hashes.add(crypto.createHash('sha256').update(pixels).digest('hex'));
    let eyeChanges = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      const eye = meta.clear.findIndex(r => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height);
      if (eye < 0) {
        assert.equal(pixels[p + 3], 0, 'No animation outside the eyes, including book, baby and hand');
        continue;
      }
      assert.equal(pixels[p + 3], base[p + 3], 'Blinking must not change transparency');
      const changed = pixels[p + 3] === 255 && [0,1,2].some(c => pixels[p + c] !== base[p + c]);
      if (frame === 0 || Math.floor(eye / 2) + 1 !== frame) assert.equal(changed, false, 'Only the blinking member may change');
      else if (changed) eyeChanges++;
    }
    // Artwork includes partial alpha, so compare all visible eye colors as well.
    if (frame > 0) {
      const regions = meta.clear.slice((frame - 1) * 2, frame * 2);
      for (const r of regions) for (let y=r.y;y<r.y+r.height;y++) for(let x=r.x;x<r.x+r.width;x++) {
        const p=(y*width+x)*4;
        if(pixels[p+3] && [0,1,2].some(c=>Math.abs(pixels[p+c]-base[p+c])>2))eyeChanges++;
      }
      assert.ok(eyeChanges > 0, 'Each blink frame must close its own eyes');
    }
  }
  assert.equal(hashes.size, 4);
  console.log('Family: four states; three staggered 130ms blinks; no changes outside the eyes');
})().catch(error => { console.error(error); process.exitCode = 1; });
