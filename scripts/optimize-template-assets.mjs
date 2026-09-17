import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = path.join(root, 'public', 'assets', 'images', 'templates', 'puspa-jawi');

const jobs = [
  ['jawi-landscape.png', 'jawi-landscape.webp', null, 78],
  ['floral-frame-v2.png', 'floral-frame-v2.webp', null, 80],
  ['janur-arch-v2.png', 'janur-arch-v2.webp', null, 80],
  ['jawi-landscape.png', 'jawi-landscape-mobile.webp', 900, 74],
  ['floral-frame-v2.png', 'floral-frame-v2-mobile.webp', 900, 76],
  ['janur-arch-v2.png', 'janur-arch-v2-mobile.webp', 900, 76],
];

await Promise.all(jobs.map(async ([source, output, width, quality]) => {
  let pipeline = sharp(path.join(assets, source), { limitInputPixels: 40_000_000 });
  if (width) pipeline = pipeline.resize({ width, withoutEnlargement: true });
  await pipeline
    .webp({ quality, alphaQuality: 88, effort: 6, smartSubsample: true })
    .toFile(path.join(assets, output));
}));

console.log(`Optimized ${jobs.length} Puspa Jawi image assets.`);
