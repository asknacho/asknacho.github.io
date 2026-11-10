const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const sharp = require(process.argv[2] || 'sharp');
const root = path.resolve(__dirname, '..');
(async () => {
  const m = JSON.parse(fs.readFileSync(path.join(root, 'assets/cycles/wave-hd.json')));
  const base = await sharp(path.join(root, 'assets/standing-hd.webp')).ensureAlpha().raw().toBuffer();
  assert.equal(m.frames, 12);
  assert.equal(m.canvasWidth, 2446);
  assert.ok(m.patch.y >= 910, 'The animated arm must not touch the face');
  assert.ok(m.patch.y + m.frameHeight < 1970, 'Feet must stay outside the patch');
  assert.equal(m.base, '../standing-hd.webp');
  const hashes = new Set();
  let first;
  for (let f = 0; f < 12; f++) {
    const cell = await sharp(path.join(root, 'assets/cycles/wave-hd.webp')).extract({
      left: f % m.columns * m.frameWidth, top: Math.floor(f / m.columns) * m.frameHeight,
      width: m.frameWidth, height: m.frameHeight,
    }).ensureAlpha().raw().toBuffer();
    // RGB beneath fully transparent pixels is irrelevant and may vary in WebP.
    for (let p = 0; p < cell.length; p += 4) if (cell[p + 3] === 0) cell.fill(0, p, p + 3);
    hashes.add(crypto.createHash('sha256').update(cell).digest('hex'));
    if (f === 0) first = cell;
    if (f === 0 || f === 11) {
      for (let y = 0; y < m.frameHeight; y++) for (let x = 0; x < m.frameWidth; x++) {
        const p = (y * m.frameWidth + x) * 4;
        const b = ((m.patch.y + y) * m.canvasWidth + m.patch.x + x) * 4;
        assert.equal(cell[p + 3], base[b + 3], 'Rest endpoint alpha changed');
        if (base[b + 3] === 255) for (let c = 0; c < 3; c++) assert.equal(cell[p + c], base[b + c]);
      }
    }
    if (f === 11) assert.ok(cell.equals(first), 'Opening and closing rest frames must match exactly');
  }
  assert.equal(hashes.size, 11, 'Ten distinct action poses plus matching rest endpoints');
  console.log('Wave: 12 frames, exact matching rest endpoints, native-detail base and fixed face/feet');
})().catch(error => { console.error(error); process.exitCode = 1; });
