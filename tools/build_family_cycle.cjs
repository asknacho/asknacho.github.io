// Four family sprites: original, Nacho blink, wife blink, daughter blink.
// Only the six eye rectangles are replaced; all other artwork stays still.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

module.exports = async function buildFamily(sharp, { root, output }) {
  const { data: base, info } = await sharp(path.join(root, 'assets/family-reading.png'))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const eyes = [
    { member: 1, x: 437, y: 183, width: 37, height: 21, skinY: 207, line: [440,194,31,5], ink: [450,191] },
    { member: 1, x: 521, y: 184, width: 36, height: 24, skinY: 211, line: [524,196,29,5], ink: [535,192] },
    { member: 2, x: 755, y: 239, width: 33, height: 25, skinY: 267, line: [759,251,26,5], ink: [770,249] },
    { member: 2, x: 823, y: 222, width: 46, height: 31, skinY: 257, line: [827,238,36,5], ink: [840,232] },
    { member: 3, x: 955, y: 707, width: 30, height: 24, skinY: 735, line: [959,720,22,5], ink: [973,719] },
    { member: 3, x: 1016, y: 709, width: 38, height: 27, skinY: 738, line: [1020,724,30,5], ink: [1030,720] },
  ];
  const regions = eyes.map(({ x,y,width,height }) => ({ x,y,width,height }));
  const offset = (x, y) => (y * width + x) * 4;
  const frames = [], hashes = [];
  for (let frame = 0; frame < 4; frame++) {
    const pixels = Buffer.alloc(base.length);
    for (const eye of eyes) {
      for (let y = eye.y; y < eye.y + eye.height; y++) for (let x = eye.x; x < eye.x + eye.width; x++) {
        const p = offset(x, y);
        base.copy(pixels, p, p, p + 4);
        if (frame === eye.member && base[p] < 200 && base[p + 1] < 150 && base[p + 2] < 140) {
          const skin = offset(x, eye.skinY);
          base.copy(pixels, p, skin, skin + 3);
        }
      }
      if (frame !== eye.member) continue;
      const [left, top, w, h] = eye.line, ink = offset(...eye.ink);
      for (let y = top; y < top + h; y++) for (let x = left; x < left + w; x++) {
        base.copy(pixels, offset(x, y), ink, ink + 3);
      }
    }
    hashes.push(crypto.createHash('sha256').update(pixels).digest('hex'));
    frames.push(await sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer());
  }
  if (new Set(hashes).size !== 4) throw new Error('Family must have four distinct blink states');
  await sharp({ create: { width: width * 4, height, channels: 4, background: '#00000000' } })
    .composite(frames.map((input, i) => ({ input, left: i * width, top: 0 })))
    .webp({ lossless: true }).toFile(path.join(output, 'family.webp'));
  fs.writeFileSync(path.join(output, 'family.json'), JSON.stringify({
    image: 'family.webp?v=short-curls', frames: 4, columns: 4, frameWidth: width, frameHeight: height,
    frameMs: 130, base: '../family-reading.webp?v=short-curls', clear: regions,
    sequence: [
      { frame: 0, durationMs: 3200 }, { frame: 1, durationMs: 130 },
      { frame: 0, durationMs: 1900 }, { frame: 2, durationMs: 130 },
      { frame: 0, durationMs: 2700 }, { frame: 3, durationMs: 130 },
    ],
  }, null, 2) + '\n');
  console.log('family: four blink states; three staggered 130ms blinks; all other artwork still');
};
