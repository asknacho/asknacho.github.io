// node tools/build_sprite_cycles.cjs [path-to-sharp]
// Pin the face/body to frame 1 and admit redraws only in the action regions.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require(process.argv[2] || 'sharp');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'assets/cycles');
const actions = {
  code: { frameMs: 140, masks: [
    [[.18,.43],[.35,.43],[.43,.60],[.43,.72],[.22,.72]],
    [[.65,.57],[.77,.57],[.77,.72],[.65,.72]],
  ] },
  guitar: { frameMs: 120, masks: [
    [[.10,.36],[.32,.36],[.48,.55],[.48,.80],[.14,.80]],
    [[.60,.45],[.79,.45],[.79,.66],[.60,.66]],
  ] },
  piano: { frameMs: 140, masks: [
    [[.27,.40],[.44,.40],[.44,.54],[.27,.54]],
    [[.46,.44],[.64,.44],[.64,.57],[.46,.57]],
  ] },
  wave: { frameMs: 160, masks: [
    [[.20,.20],[.39,.20],[.39,.34],[.43,.36],[.45,.50],[.43,.65],[.32,.65],[.32,.45],[.22,.40]],
  ] },
};
function inside(x, y, polygon) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [a, b] = polygon[i], [c, d] = polygon[j];
    if ((b > y) !== (d > y) && x < (c - a) * (y - b) / (d - b) + a) result = !result;
  }
  return result;
}
function bounds(data, width, height, region = [0, 0, 1, 1]) {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = Math.floor(region[1] * height); y < region[3] * height; y++) {
    for (let x = Math.floor(region[0] * width); x < region[2] * width; x++) {
      if (data[(y * width + x) * 4 + 3] > 128) {
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
  }
  return { left, top, right, bottom, center: (left + right) / 2 };
}
async function build(name, action) {
  const source = path.join(root, 'art/cycles/source', `${name}.png`);
  const metadata = await sharp(source).metadata();
  const width = Math.floor(metadata.width / 4), height = Math.floor(metadata.height / 3);
  const raw = [];
  for (let i = 0; i < 12; i++) {
    raw.push(await sharp(source).extract({ left: i % 4 * width, top: Math.floor(i / 4) * height, width, height })
      .ensureAlpha().raw().toBuffer());
  }
  const anchorRegion = name === 'wave' ? [.39, 0, .67, .24] : [.28, 0, .75, .31];
  const anchor = bounds(raw[0], width, height, anchorRegion);
  const content = bounds(raw[0], width, height);
  const side = name === 'wave' ? Math.ceil((content.bottom - content.top + 1) * 72 / 44) : Math.max(width, height) + 16;
  const left = Math.round(side / 2 - content.center);
  const top = name === 'wave' ? Math.round(side * 58 / 72 - content.bottom) : Math.round((side - height) / 2);
  const frames = [], hashes = [];
  for (let i = 0; i < 12; i++) {
    const current = bounds(raw[i], width, height, anchorRegion);
    const dx = Math.round(current.center - anchor.center), dy = current.top - anchor.top;
    const pixels = Buffer.from(raw[0]);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (!action.masks.some(mask => inside(x / width, y / height, mask))) continue;
      const sx = x + dx, sy = y + dy, destination = (y * width + x) * 4;
      if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
        raw[i].copy(pixels, destination, (sy * width + sx) * 4, (sy * width + sx) * 4 + 4);
      } else pixels.fill(0, destination, destination + 4);
    }
    hashes.push(crypto.createHash('sha256').update(pixels).digest('hex'));
    const cell = await sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer();
    frames.push(await sharp({ create: { width: side, height: side, channels: 4, background: '#00000000' } })
      .composite([{ input: cell, left, top }]).png().toBuffer());
  }
  if (new Set(hashes).size !== 12) throw new Error(`${name}: not twelve distinct action frames`);
  await sharp({ create: { width: side * 4, height: side * 3, channels: 4, background: '#00000000' } })
    .composite(frames.map((input, i) => ({ input, left: i % 4 * side, top: Math.floor(i / 4) * side })))
    .webp({ lossless: true }).toFile(path.join(output, `${name}.webp`));
  await sharp(frames[0]).webp({ lossless: true }).toFile(path.join(output, `${name}-still.webp`));
  fs.writeFileSync(path.join(output, `${name}.json`), JSON.stringify({
    image: `${name}.webp`, frames: 12, columns: 4, frameWidth: side, frameHeight: side, frameMs: action.frameMs,
  }, null, 2) + '\n');
  console.log(`${name}: twelve distinct frames, ${side}×${side}, ${12 * action.frameMs}ms cycle`);
}
fs.mkdirSync(output, { recursive: true });
(async () => { for (const [name, action] of Object.entries(actions)) await build(name, action); })()
  .catch(error => { console.error(error); process.exitCode = 1; });
