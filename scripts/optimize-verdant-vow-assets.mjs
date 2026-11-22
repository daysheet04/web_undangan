import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseDir = path.join(root, 'public', 'assets', 'images', 'templates', 'verdant-vow');

async function generatePortraitStoryFrame() {
  const srcPath = path.join(baseDir, 'story', 'story-photo-frame-indonesian-v1.webp');
  const outPath = path.join(baseDir, 'story', 'story-photo-frame-indonesian-portrait-v1.webp');

  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info; // 1254 x 1254 x 4

  // Two full batik diamond periods between dark inter-diamond valleys: y = 504..670 (period = 166px)
  const yStart = 504;
  const period = 166;
  const repeatCount = 2;
  const extraHeight = period * repeatCount; // +332px -> 1254 x 1586
  const outHeight = height + extraHeight;
  const overlap = 10; // smooth 10px vertical crossfade across each splice seam

  const outBuf = Buffer.alloc(width * outHeight * channels);

  const copyRow = (dstY, srcY) => {
    const srcOff = srcY * width * channels;
    const dstOff = dstY * width * channels;
    data.copy(outBuf, dstOff, srcOff, srcOff + width * channels);
  };

  const blendRow = (dstY, srcY_A, srcY_B, alphaB) => {
    const offA = srcY_A * width * channels;
    const offB = srcY_B * width * channels;
    const offD = dstY * width * channels;
    const alphaA = 1 - alphaB;
    for (let x = 0; x < width * channels; x++) {
      outBuf[offD + x] = Math.round(data[offA + x] * alphaA + data[offB + x] * alphaB);
    }
  };

  let curY = 0;
  // 1. Top portion up to yStart + period (inclusive of 1st original period)
  const firstSplit = yStart + period; // 670
  for (let y = 0; y < firstSplit; y++) {
    copyRow(curY++, y);
  }

  // 2. Insert `repeatCount` periods of [yStart .. yStart + period), with crossfade on boundaries
  for (let r = 0; r < repeatCount; r++) {
    for (let dy = 0; dy < period; dy++) {
      const sy = yStart + dy;
      if (dy < overlap) {
        // Blend tail of [yStart+period .. yStart+period+overlap] into [yStart .. yStart+overlap]
        const tailY = Math.min(height - 1, firstSplit + dy);
        const t = (dy + 1) / (overlap + 1);
        blendRow(curY++, tailY, sy, t);
      } else {
        copyRow(curY++, sy);
      }
    }
  }

  // 3. Bottom portion from firstSplit to height, crossfading top overlap into repeated end
  for (let y = firstSplit; y < height; y++) {
    const dy = y - firstSplit;
    if (dy < overlap) {
      const repeatTailY = Math.max(0, yStart + dy);
      const t = (dy + 1) / (overlap + 1);
      blendRow(curY++, repeatTailY, y, t);
    } else {
      copyRow(curY++, y);
    }
  }

  // Resize down cleanly to 900px wide portrait (preserves exact ratio: 900 x 1138)
  const targetWidth = 900;
  const targetHeight = Math.round((outHeight / width) * targetWidth);

  const webpBuf = await sharp(outBuf, { raw: { width, height: outHeight, channels } })
    .resize({ width: targetWidth, height: targetHeight, kernel: 'lanczos3' })
    .webp({ quality: 84, alphaQuality: 92, effort: 6 })
    .toBuffer();

  fs.writeFileSync(outPath, webpBuf);

  // Measure transparent opening bounds of generated file
  const check = await sharp(outPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cw = check.info.width;
  const ch = check.info.height;
  const cch = check.info.channels;
  const cd = check.data;
  const cx = Math.floor(cw / 2);
  const cy = Math.floor(ch / 2);
  const aAt = (x, y) => cd[(y * cw + x) * cch + 3];
  let topOpen = cy, bottomOpen = cy, leftOpen = cx, rightOpen = cx;
  while (topOpen > 0 && aAt(cx, topOpen) < 30) topOpen--;
  while (bottomOpen < ch - 1 && aAt(cx, bottomOpen) < 30) bottomOpen++;
  while (leftOpen > 0 && aAt(leftOpen, cy) < 30) leftOpen--;
  while (rightOpen < cw - 1 && aAt(rightOpen, cy) < 30) rightOpen++;

  console.log('\n=== GENERATED PORTRAIT STORY FRAME ===');
  console.log({
    file: path.relative(root, outPath),
    kb: +(webpBuf.length / 1024).toFixed(1),
    width: cw,
    height: ch,
    frameAspect: +(cw / ch).toFixed(4),
    topOpen,
    bottomOpen,
    leftOpen,
    rightOpen,
    openingAspect: +((rightOpen - leftOpen) / (bottomOpen - topOpen)).toFixed(4),
    topPct: +((topOpen / ch) * 100).toFixed(2),
    leftPct: +((leftOpen / cw) * 100).toFixed(2),
    wPct: +(((rightOpen - leftOpen) / cw) * 100).toFixed(2),
    hPct: +(((bottomOpen - topOpen) / ch) * 100).toFixed(2),
  });
}

async function optimizeWebp(relPath, { width = null, height = null, fit = 'inside', quality = 78, alphaQuality = 88, effort = 5, outputRelPath = null }) {
  const srcPath = path.join(baseDir, relPath);
  const dstPath = path.join(baseDir, outputRelPath || relPath);
  if (!fs.existsSync(srcPath)) {
    console.warn('SKIP missing:', relPath);
    return { before: 0, after: 0 };
  }
  const beforeSize = fs.statSync(srcPath).size;
  const inputBuf = fs.readFileSync(srcPath);
  const meta = await sharp(inputBuf).metadata();
  const isSameFile = !outputRelPath || outputRelPath === relPath;
  const needsResize = fit === 'fill'
    ? ((width && meta.width !== width) || (height && meta.height !== height))
    : ((width && meta.width > width) || (height && meta.height > height));

  if (isSameFile && !needsResize) {
    console.log(`${relPath.padEnd(56)} already target size (${meta.width}x${meta.height}, ${(beforeSize / 1024).toFixed(1)} KB)`);
    return { before: beforeSize, after: beforeSize };
  }

  let pipeline = sharp(inputBuf, { limitInputPixels: 40_000_000 });
  if (width || height) {
    pipeline = pipeline.resize({
      width: width || undefined,
      height: height || undefined,
      fit,
      withoutEnlargement: fit !== 'fill',
    });
  }
  const outBuf = await pipeline
    .webp({ quality, alphaQuality, effort, smartSubsample: true })
    .toBuffer();

  if (!isSameFile || needsResize || outBuf.length < beforeSize) {
    fs.writeFileSync(dstPath, outBuf);
    const outMeta = await sharp(outBuf).metadata();
    console.log(
      `${relPath.padEnd(56)} ${(beforeSize / 1024).toFixed(1).padStart(7)} KB (${meta.width}x${meta.height}) -> ${(outBuf.length / 1024).toFixed(1).padStart(6)} KB (${outMeta.width}x${outMeta.height})${outputRelPath ? ' -> ' + outputRelPath : ''}`
    );
    return { before: isSameFile ? beforeSize : 0, after: outBuf.length };
  }
  console.log(`${relPath.padEnd(56)} already optimal (${(beforeSize / 1024).toFixed(1)} KB)`);
  return { before: beforeSize, after: beforeSize };
}

await generatePortraitStoryFrame();

const jobs = [
  // 1. Desktop section backgrounds (3072px -> 1920px wide)
  ['section-wedding-indonesian-bg-v2.webp', { width: 1920, quality: 78 }],
  ['section-couple-indonesian-pendopo-bg-v2.webp', { width: 1920, quality: 78 }],
  ['story/story-heirloom-bg-desktop-v1.webp', { width: 1920, quality: 78 }],
  ['gallery/gallery-heirloom-bg-desktop-v1.webp', { width: 1920, quality: 78 }],
  ['gift/gift-heirloom-bg-desktop-v1.webp', { width: 1920, quality: 78 }],
  ['rsvp/rsvp-guestbook-bg-desktop-v1.webp', { width: 1920, quality: 78 }],
  ['closing/closing-pendopo-night-bg-desktop-v1.webp', { width: 1920, quality: 78 }],
  ['events/events-pendopo-bg-mobile-v2.webp', { width: 800, quality: 76 }],

  // 1B. Trim excessively tall mobile-perf backgrounds down to crisp 2x Retina proportions (zero blur)
  ['gallery/gallery-heirloom-bg-mobile-perf-v1.webp', { width: 780, height: 1680, fit: 'fill', quality: 82 }],
  ['rsvp/rsvp-guestbook-bg-mobile-perf-v1.webp', { width: 780, height: 1920, fit: 'fill', quality: 82 }],
  ['gift/gift-heirloom-bg-mobile-perf-v1.webp', { width: 780, height: 1440, fit: 'fill', quality: 82 }],
  ['closing/closing-pendopo-night-bg-mobile-perf-v2.webp', { width: 780, height: 1440, fit: 'inside', quality: 82 }],

  // 2. Oversized section ornaments (down to <= 720-1200px wide)
  ['layers/section-wedding-edge-ornament-indonesian-v2.webp', { width: 720, quality: 80, alphaQuality: 88 }],
  ['layers/section-wedding-mobile-bottom-ornament-indonesian-v2.webp', { width: 960, quality: 80, alphaQuality: 88 }],
  ['layers/section-couple-janur-orbit-ornament-v2.webp', { width: 720, quality: 80, alphaQuality: 88 }],
  ['layers/events-janur-melati-corner-v2.webp', { width: 760, quality: 80, alphaQuality: 88 }],
  ['story/story-side-ornament-indonesian-v1.webp', { width: 720, quality: 80, alphaQuality: 88 }],
  ['gallery/gallery-corner-ornament-indonesian-v1.webp', { width: 720, quality: 80, alphaQuality: 88 }],
  ['gift/gift-seserahan-ornament-indonesian-v1.webp', { width: 840, quality: 80, alphaQuality: 88 }],
  ['rsvp/rsvp-guestbook-ornament-v1.webp', { width: 840, quality: 80, alphaQuality: 88 }],
  ['closing/closing-pendopo-canopy-ornament-v1.webp', { width: 1200, quality: 80, alphaQuality: 88 }],

  // 3. Oversized WebGL cinematic textures
  ['cinematic/distant-indonesian-highland-panorama-garden-v4.webp', { width: 1440, quality: 76, outputRelPath: 'cinematic/distant-indonesian-highland-panorama-garden-mobile-v4.webp' }],
  ['cinematic/distant-indonesian-highland-panorama-garden-v4.webp', { width: 2048, quality: 80 }],
  ['cinematic/short-grass-texture-v1.webp', { width: 512, height: 512, quality: 78 }],
  ['cinematic/altar-floral-garland-indonesian-v1.webp', { width: 1024, quality: 80, alphaQuality: 88 }],
  ['cinematic/altar-pedestal-left-indonesian-v1.webp', { width: 640, quality: 80, alphaQuality: 88 }],
  ['cinematic/altar-pedestal-right-indonesian-v1.webp', { width: 640, quality: 80, alphaQuality: 88 }],
  ['cinematic/guests-seated-left-inward-v2.webp', { width: 860, quality: 80, alphaQuality: 88 }],
  ['cinematic/guests-standing-right-inward-v2.webp', { width: 860, quality: 80, alphaQuality: 88 }],
  ['cinematic/seated-guest-sage-chair-v1.webp', { height: 768, quality: 80, alphaQuality: 88 }],
  ['cinematic/seated-guest-navy-chair-look-right-v2.webp', { height: 768, quality: 80, alphaQuality: 88 }],
  ['cinematic/seated-guest-rose-chair-v1.webp', { height: 768, quality: 80, alphaQuality: 88 }],
  ['cinematic/seated-guest-taupe-chair-look-right-v2.webp', { height: 768, quality: 80, alphaQuality: 88 }],
  ['cinematic/seated-guest-sage-chair-look-left-inward-v3.webp', { height: 768, quality: 80, alphaQuality: 88 }],
  ['cinematic/seated-guest-navy-chair-look-left-inward-v3.webp', { height: 768, quality: 80, alphaQuality: 88 }],
  ['cinematic/seated-guest-rose-chair-look-left-inward-v3.webp', { height: 768, quality: 80, alphaQuality: 88 }],
  ['cinematic/seated-guest-taupe-chair-look-left-inward-v3.webp', { height: 768, quality: 80, alphaQuality: 88 }],
];

console.log('\n=== OPTIMIZING VERDANT-VOW ACTIVE ASSETS ===');
let totalBefore = 0;
let totalAfter = 0;
for (const [rel, opts] of jobs) {
  const { before, after } = await optimizeWebp(rel, opts);
  totalBefore += before;
  totalAfter += after;
}
console.log(`\nTotal in-place assets before: ${(totalBefore / 1024 / 1024).toFixed(2)} MB -> after: ${(totalAfter / 1024 / 1024).toFixed(2)} MB`);
