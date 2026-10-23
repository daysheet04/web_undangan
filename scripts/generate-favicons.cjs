const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const svgFavicon = fs.readFileSync(path.join(publicDir, 'favicon.svg'), 'utf8');

async function syncAll() {
  fs.writeFileSync(path.join(publicDir, 'assets/images/brand/daymoment-mark.svg'), svgFavicon, 'utf8');

  const svgBuf = Buffer.from(svgFavicon);

  await sharp(svgBuf).resize(16, 16).png().toFile(path.join(publicDir, 'favicon-16x16.png'));
  await sharp(svgBuf).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));
  await sharp(svgBuf).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.png'));
  await sharp(svgBuf).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));

  const distDirs = [
    path.join(__dirname, '../dist'),
    path.join(__dirname, '../dist-admin'),
    path.join(__dirname, '../dist-affiliate'),
  ];

  for (const dir of distDirs) {
    if (fs.existsSync(dir)) {
      fs.copyFileSync(path.join(publicDir, 'favicon.svg'), path.join(dir, 'favicon.svg'));
      fs.copyFileSync(path.join(publicDir, 'favicon.png'), path.join(dir, 'favicon.png'));
      fs.copyFileSync(path.join(publicDir, 'favicon-32x32.png'), path.join(dir, 'favicon-32x32.png'));
      fs.copyFileSync(path.join(publicDir, 'favicon-16x16.png'), path.join(dir, 'favicon-16x16.png'));
      fs.copyFileSync(path.join(publicDir, 'apple-touch-icon.png'), path.join(dir, 'apple-touch-icon.png'));
      const brandDir = path.join(dir, 'assets/images/brand');
      if (fs.existsSync(brandDir)) {
        fs.copyFileSync(path.join(publicDir, 'assets/images/brand/daymoment-mark.svg'), path.join(brandDir, 'daymoment-mark.svg'));
        fs.copyFileSync(path.join(publicDir, 'assets/images/brand/daymoment-logo-white.webp'), path.join(brandDir, 'daymoment-logo-white.webp'));
      }
    }
  }

  console.log('Synchronized white favicons and brand assets successfully!');
}

syncAll().catch(console.error);
