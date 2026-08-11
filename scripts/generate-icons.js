const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = path.resolve(__dirname, '..', 'public', 'icons', 'icon.svg');
const outDir = path.resolve(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

(async () => {
  for (const size of sizes) {
    const png = await sharp(svgPath)
      .resize(size, size)
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(outDir, `icon-${size}x${size}.png`), png);
    console.log(`✓ icon-${size}x${size}.png`);
  }
  console.log('Done');
})();
