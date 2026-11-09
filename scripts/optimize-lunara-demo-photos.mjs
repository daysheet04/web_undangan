// Refresh static responsive copies of the public Lunara demo photos.
// Original R2 objects are read only; unknown/new uploads keep their original URL.
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const origin = 'https://daymoment.id';
const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'public/assets/images/templates/lunara-azure/demo');
const assetUrl = '/assets/images/templates/lunara-azure/demo/';
const response = await fetch(`${origin}/api/templates/butterfly-blum`);
if (!response.ok) throw new Error(`Demo metadata: HTTP ${response.status}`);
const demo = await response.json();
const invitation = demo.invitation || {};
const paths = [...new Set([
  invitation.cover_image, invitation.bride_photo, invitation.groom_photo,
  ...Object.values(demo.covers || invitation.covers || {}),
  ...Object.values(demo.demo_gallery || {}).flat().map(photo => photo?.file_path),
].filter(Boolean))].sort();
await mkdir(output, { recursive: true });
const manifest = {};
const report = [];
for (const path of paths) {
  if (!/^template-(photos|gallery)\/lunara_azure\/[a-zA-Z0-9_./-]+$/.test(path) || path.includes('..')) {
    throw new Error(`Unexpected demo image path: ${path}`);
  }
  const result = await fetch(`${origin}/media/${path}`);
  if (!result.ok) throw new Error(`Photo: HTTP ${result.status} ${path}`);
  const input = Buffer.from(await result.arrayBuffer());
  if (input.length > 12 * 1024 * 1024) throw new Error(`Photo exceeds processing budget: ${path}`);
  const options = { limitInputPixels: 40_000_000 };
  const meta = await sharp(input, options).metadata();
  const hash = createHash('sha256').update(input).update('webp-q84-v1').digest('hex').slice(0, 20);
  const variants = [];
  for (const width of [480, 800, 1200]) {
    const { data, info } = await sharp(input, options).rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 84, effort: 6, smartSubsample: true })
      .toBuffer({ resolveWithObject: true });
    if (variants.some(variant => variant.width === info.width)) continue;
    const filename = `${hash}-${info.width}.webp`;
    await writeFile(resolve(output, filename), data);
    variants.push({ src: assetUrl + filename, width: info.width, height: info.height, bytes: data.length });
  }
  manifest[path] = variants;
  report.push({ path, originalBytes: input.length, originalWidth: meta.width, originalHeight: meta.height, variants });
}
await writeFile(resolve(root, 'src/templates/lunara-demo-images.json'), JSON.stringify(manifest, null, 2) + '\n');
await mkdir(resolve(root, 'scratch/lunara-profile'), { recursive: true });
await writeFile(resolve(root, 'scratch/lunara-profile/v20-image-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ photos: report.length, originalBytes: report.reduce((sum, photo) => sum + photo.originalBytes, 0), at800Bytes: report.reduce((sum, photo) => sum + (photo.variants.find(v => v.width === 800) || photo.variants[photo.variants.length - 1]).bytes, 0) }));
