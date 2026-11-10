// node tools/build_standing_sprite.cjs [path-to-sharp]
const path = require('node:path');
const sharp = require(process.argv[2] || 'sharp');
const root = path.resolve(__dirname, '..');
(async () => {
  const { data, info } = await sharp(path.join(root, 'art/standing-source.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // Discard the faint generated halo while retaining native pixel detail.
  for (let p = 3; p < data.length; p += 4) if (data[p] < 128) data[p] = 0;
  const clean = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  const { data: sprite, info: bounds } = await sharp(clean).trim().toBuffer({ resolveWithObject: true });
  const side = Math.ceil(bounds.height * 812 / 493);
  const top = Math.round(side * 654 / 812) - bounds.height;
  await sharp({ create: { width: side, height: side, channels: 4, background: '#00000000' } })
    .composite([{ input: sprite, left: Math.floor((side - bounds.width) / 2), top }])
    .webp({ lossless: true }).toFile(path.join(root, 'assets/standing-hd.webp'));
  console.log({ canvas: side, originalCharacterHeight: bounds.height, resampled: false });
})().catch(error => { console.error(error); process.exitCode = 1; });
