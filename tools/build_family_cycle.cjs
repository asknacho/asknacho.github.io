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
    { member: 1, x: 439, y: 186, width: 42, height: 25, skinY: 208, line: [443,196,32,6], ink: [450,195] },
    { member: 1, x: 523, y: 186, width: 42, height: 29, skinY: 214, line: [527,199,32,6], ink: [535,197] },
    { member: 2, x: 763, y: 245, width: 34, height: 27, skinY: 241, line: [766,257,27,6], ink: [783,255] },
    { member: 2, x: 829, y: 231, width: 49, height: 34, skinY: 227, line: [833,245,39,6], ink: [847,246] },
    { member: 3, x: 963, y: 718, width: 34, height: 28, skinY: 714, line: [969,731,23,5], ink: [982,730] },
    { member: 3, x: 1021, y: 721, width: 45, height: 30, skinY: 716, line: [1026,739,33,5], ink: [1040,735] },
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
    image: 'family.webp', frames: 4, columns: 4, frameWidth: width, frameHeight: height,
    frameMs: 130, base: '../family-reading.webp', clear: regions,
    sequence: [
      { frame: 0, durationMs: 3200 }, { frame: 1, durationMs: 130 },
      { frame: 0, durationMs: 1900 }, { frame: 2, durationMs: 130 },
      { frame: 0, durationMs: 2700 }, { frame: 3, durationMs: 130 },
    ],
  }, null, 2) + '\n');
  console.log('family: four blink states; three staggered 130ms blinks; all other artwork still');
};
