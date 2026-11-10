// Restore detail from the original artwork, never upscale the compressed assets.
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sourceRevision = '354210a42e497284a65057e6c8e5f4d0868c8b82';
const directory = 'public/assets/images/templates/lunara-azure';
const files = (await readdir(resolve(root, directory))).filter(name => /^lunara-.*-v1\.webp$/.test(name)).sort();
const report = [];
for (const file of files) {
  const source = execFileSync('git', ['show', `${sourceRevision}:${directory}/${file}`], { cwd: root, maxBuffer: 20 * 1024 * 1024 });
  const metadata = await sharp(source).metadata();
  if (metadata.width !== 1920 || metadata.height !== 1080) throw new Error(`Unexpected source dimensions: ${file}`);
  // Match the existing mobile compositions, including the two offset crops.
  const left = file.includes('hero-aurora') ? 672 : file.includes('wedding-aurora') ? 816 : 600;
  for (const mobile of [false, true]) {
    const previous = file.replace('.webp', mobile ? '-mobile.webp' : '.webp');
    const output = file.replace('.webp', mobile ? '-mobile-hd-v2.webp' : '-hd-v2.webp');
    // Desktop already has a compressed original: copy it without a lossy re-encode.
    const { data, info } = mobile
      ? await sharp(source).extract({ left, top: 0, width: 720, height: 1080 })
        .webp({ quality: 86, effort: 6, smartSubsample: true }).toBuffer({ resolveWithObject: true })
      : { data: source, info: metadata };
    // Keep predictable per-image download and decode sizes; no 4K textures.
    if (data.length > (mobile ? 140_000 : 350_000)) throw new Error(`Background exceeds byte budget: ${output}`);
    await writeFile(resolve(root, directory, output), data);
    report.push({ file: output, width: info.width, height: info.height, bytes: data.length, previousBytes: (await readFile(resolve(root, directory, previous))).length });
  }
}
await mkdir(resolve(root, 'scratch/lunara-backgrounds'), { recursive: true });
await writeFile(resolve(root, 'scratch/lunara-backgrounds/report.json'), JSON.stringify({ sourceRevision, images: report }, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
