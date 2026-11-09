// Run with Node and sharp installed: node tools/build_share_assets.cjs [path-to-sharp]
const path = require('node:path');
const sharp = require(process.argv[2] || 'sharp');
const assets = path.resolve(__dirname, '../assets');

async function build() {
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="#f6f1e7"/>
    <path d="M64 82h36v6H64z" fill="#7c3646"/>
    <g font-family="monospace" fill="#211d1b">
      <text x="64" y="185" font-size="52" font-weight="700">Hi! I’m Nacho.</text>
      <text x="64" y="247" font-size="25">Engineering manager</text>
      <text x="64" y="285" font-size="25">in Barcelona.</text>
      <text x="64" y="355" font-size="21" fill="#5c584e">Building teams</text>
      <text x="64" y="389" font-size="21" fill="#5c584e">and useful things.</text>
      <text x="64" y="553" font-size="21">asknacho.to</text>
    </g>
    <text x="1136" y="553" text-anchor="end" font-family="sans-serif" font-size="18" fill="#5c584e">Ignacio Morales</text>
  </svg>`);
  const family = await sharp(path.join(assets, 'family-reading.png'))
    .resize(580, 430, { fit: 'contain', background: '#00000000' }).png().toBuffer();
  await sharp(svg).composite([{ input: family, left: 570, top: 76 }])
    .png().toFile(path.join(assets, 'social-card.png'));
  // Keep the original pixel face rather than inventing a second identity.
  const head = await sharp(path.resolve(__dirname, '../art/pixellab/stand/south.png'))
    .extract({ left: 14, top: 0, width: 24, height: 21 }).png().toBuffer();
  for (const [name, size] of [['favicon', 32], ['apple-touch-icon', 180]]) {
    const face = await sharp(head).resize(Math.round(size * .75), Math.round(size * .65625), { kernel: 'nearest' }).png().toBuffer();
    const { width, height } = await sharp(face).metadata();
    await sharp({ create: { width: size, height: size, channels: 4, background: '#f6f1e7' } })
      .composite([{ input: face, left: Math.floor((size - width) / 2), top: Math.floor((size - height) / 2) }])
      .png().toFile(path.join(assets, `${name}.png`));
  }
  console.log('Built social-card.png, favicon.png and apple-touch-icon.png');
}
build().catch(error => { console.error(error); process.exitCode = 1; });
