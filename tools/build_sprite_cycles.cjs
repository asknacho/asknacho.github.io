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
  walk: { frameMs: 100, standing: true, anchor: [.35, 0, .70, .30], masks: [
    [[0,.32],[1,.32],[1,1],[0,1]],
  ] },
  sleep: { frameMs: 360, bag: true, noRegistration: true, masks: [
    [[.32,.25],[.91,.25],[.91,.70],[.32,.70]],
  ] },
  family: { frameMs: 350, template: 'assets/family-reading.png', noRegistration: true, masks: [
    [[.27,.38],[.47,.38],[.47,.55],[.27,.55]],
    [[.56,.32],[.73,.32],[.73,.55],[.56,.55]],
    [[.635,.80],[.705,.80],[.705,.90],[.635,.90]],
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
  const cellWidth = Math.floor(metadata.width / 4), cellHeight = Math.floor(metadata.height / 3);
  const template = action.template ? await sharp(path.join(root, action.template)).ensureAlpha().raw().toBuffer({ resolveWithObject: true }) : null;
  const width = template ? template.info.width : cellWidth;
  const height = template ? template.info.height : cellHeight;
  const raw = [];
  for (let i = 0; i < 12; i++) {
    const cell = await sharp(source).extract({ left: i % 4 * cellWidth, top: Math.floor(i / 4) * cellHeight, width: cellWidth, height: cellHeight }).png().toBuffer();
    raw.push(await sharp(cell).resize(width, height, { kernel: 'nearest' }).ensureAlpha().raw().toBuffer());
  }
  const anchorRegion = action.anchor || (name === 'wave' ? [.39, 0, .67, .24] : [.28, 0, .75, .31]);
  const anchor = bounds(raw[0], width, height, anchorRegion);
  const content = bounds(raw[0], width, height);
  const standing = name === 'wave' || action.standing;
  const side = standing ? Math.ceil((content.bottom - content.top + 1) * 72 / 44)
    : action.bag ? Math.ceil((content.right - content.left + 1) * 72 / 44) : Math.max(width, height) + 16;
  const outWidth = template ? width : side, outHeight = template ? height : side;
  const left = template ? 0 : Math.round(side / 2 - (action.standing ? anchor.center : content.center));
  const top = template ? 0 : standing ? Math.round(side * 58 / 72 - content.bottom) : Math.round((side - height) / 2);
  const frames = [], hashes = [];
  for (let i = 0; i < 12; i++) {
    const current = bounds(raw[i], width, height, anchorRegion);
    const dx = action.noRegistration ? 0 : Math.round(current.center - anchor.center);
    const dy = action.noRegistration ? 0 : current.top - anchor.top;
    const pixels = template ? Buffer.alloc(template.data.length) : Buffer.from(raw[0]);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (!action.masks.some(mask => inside(x / width, y / height, mask))) continue;
      const sx = x + dx, sy = y + dy, destination = (y * width + x) * 4;
      if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
        if (template) {
          // Admit only actual pose changes; keep the approved high-resolution art intact.
          const change = Math.max(...[0, 1, 2, 3].map(c => Math.abs(raw[i][destination + c] - raw[0][destination + c])));
          if (change < 48 || i === 0) continue;
          if (template.data[destination + 3] < 128 || raw[0][destination + 3] < 128 || raw[i][destination + 3] < 128) continue;
          const match = Math.max(...[0, 1, 2].map(c => Math.abs(template.data[destination + c] - raw[0][destination + c])));
          if (match > 64) continue;
        }
        raw[i].copy(pixels, destination, (sy * width + sx) * 4, (sy * width + sx) * 4 + 4);
      } else pixels.fill(0, destination, destination + 4);
    }
    hashes.push(crypto.createHash('sha256').update(pixels).digest('hex'));
    const cell = await sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer();
    frames.push(await sharp({ create: { width: outWidth, height: outHeight, channels: 4, background: '#00000000' } })
      .composite([{ input: cell, left, top }]).png().toBuffer());
  }
  if (new Set(hashes).size !== 12) throw new Error(`${name}: not twelve distinct action frames`);
  await sharp({ create: { width: outWidth * 4, height: outHeight * 3, channels: 4, background: '#00000000' } })
    .composite(frames.map((input, i) => ({ input, left: i % 4 * outWidth, top: Math.floor(i / 4) * outHeight })))
    .webp({ lossless: true }).toFile(path.join(output, `${name}.webp`));
  if (!template) await sharp(frames[0]).webp({ lossless: true }).toFile(path.join(output, `${name}-still.webp`));
  fs.writeFileSync(path.join(output, `${name}.json`), JSON.stringify({
    image: `${name}.webp`, frames: 12, columns: 4, frameWidth: outWidth, frameHeight: outHeight, frameMs: action.frameMs,
    base: template ? '../family-reading.webp' : undefined,
  }, null, 2) + '\n');
  console.log(`${name}: twelve distinct frames, ${outWidth}×${outHeight}, ${12 * action.frameMs}ms cycle`);
}
fs.mkdirSync(output, { recursive: true });
(async () => { for (const [name, action] of Object.entries(actions)) await build(name, action); })()
  .catch(error => { console.error(error); process.exitCode = 1; });
