// Family poses use the approved artwork itself, never pixel differences from
// a separately generated scene. Each dirty rectangle is a complete replacement.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

module.exports = async function buildFamily(sharp, { root, output, frameMs }) {
  const { data: base, info } = await sharp(path.join(root, 'assets/family-reading.png'))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const regions = [
    { x: 368, y: 348, width: 280, height: 124 }, // book and the space above its pages
    { x: 800, y: 432, width: 104, height: 64 },  // blanket folds, below the baby's face
    { x: 880, y: 800, width: 104, height: 112 }, // hand and yellow block
  ];
  const pageLift = [0,4,8,12,16,20,24,20,16,12,8,4];
  const breaths = [0,0,1,2,3,4,4,3,2,1,0,0];
  const nudges = [0,0,0,0,0,0,1,2,3,2,1,0];
  const frames = [], hashes = [];
  const offset = (x, y) => (y * width + x) * 4;

  function copyRegion(target, region, movement = 0) {
    for (let y = region.y; y < region.y + region.height; y++) {
      for (let x = region.x; x < region.x + region.width; x++) {
        // Discrete nearest-pixel fold poses, anchored at every rectangle edge.
        const edge = Math.sin((x - region.x) / (region.width - 1) * Math.PI) *
          Math.sin((y - region.y) / (region.height - 1) * Math.PI);
        const sourceY = y + Math.round(movement * edge);
        const from = offset(x, sourceY), to = offset(x, y);
        base.copy(target, to, from, from + 4);
      }
    }
  }
  function stairPolygon(points) {
    const snap = value => Math.round(value / 4) * 4;
    let d = `M${snap(points[0][0])},${snap(points[0][1])}`;
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) / 4));
      for (let j = 1; j <= steps; j++) {
        const x = snap(a[0] + (b[0] - a[0]) * j / steps);
        const y = snap(a[1] + (b[1] - a[1]) * j / steps);
        d += `H${x}V${y}`;
      }
    }
    return d + 'Z';
  }
  for (let i = 0; i < 12; i++) {
    const pixels = Buffer.alloc(base.length);
    copyRegion(pixels, regions[0]);
    copyRegion(pixels, regions[1], breaths[i]);
    copyRegion(pixels, regions[2], nudges[i]);
    let image = sharp(pixels, { raw: { width, height, channels: 4 } });
    if (pageLift[i]) {
      const lift = pageLift[i], corner = i > 6 ? 620 : 624;
      const d = stairPolygon([[512,432], [corner,400], [corner,400 - lift], [512,432 - Math.round(lift / 2)]]);
      const leaf = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" shape-rendering="crispEdges"><path d="${d}" fill="#f4e2b3" stroke="#b79762" stroke-width="4" stroke-linejoin="miter"/></svg>`);
      image = image.composite([{ input: leaf }]);
    }
    const cell = await image.png().toBuffer();
    const raw = await sharp(cell).raw().toBuffer();
    hashes.push(crypto.createHash('sha256').update(raw).digest('hex'));
    frames.push(cell);
  }
  if (new Set(hashes).size !== 12) throw new Error('Family must have twelve distinct poses');
  await sharp({ create: { width: width * 4, height: height * 3, channels: 4, background: '#00000000' } })
    .composite(frames.map((input, i) => ({ input, left: i % 4 * width, top: Math.floor(i / 4) * height })))
    .webp({ lossless: true }).toFile(path.join(output, 'family.webp'));
  fs.writeFileSync(path.join(output, 'family.json'), JSON.stringify({
    image: 'family.webp', frames: 12, columns: 4, frameWidth: width, frameHeight: height,
    frameMs, base: '../family-reading.webp', clear: regions,
  }, null, 2) + '\n');
  console.log('family: twelve coherent replacement poses from the approved original');
};
