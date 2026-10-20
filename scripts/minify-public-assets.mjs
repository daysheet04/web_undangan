/**
 * minify-public-assets.mjs
 *
 * Minifies CSS and JS files inside /public/assets/ using esbuild (already a
 * devDependency via Vite's bundled esbuild). Output files replace the originals
 * in-place so Cloudflare Workers / Vite's static asset serving picks them up.
 *
 * Run: node scripts/minify-public-assets.mjs
 * Or via: npm run minify:public
 */

import { transform } from 'esbuild';
import { readFile, writeFile, readdir } from 'fs/promises';
import { resolve, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const PUBLIC_ASSETS = resolve(ROOT, 'public', 'assets');

async function getFiles(dir, ext) {
  const files = [];
  async function walk(d) {
    let entries;
    try { entries = await readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = resolve(d, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.name.endsWith(ext)) files.push(full);
    }
  }
  await walk(dir);
  return files;
}

async function minifyFile(filePath, loader, targets) {
  const src = await readFile(filePath, 'utf8');
  const result = await transform(src, {
    loader,
    minify: true,
    target: targets,
  });
  const saved = src.length - result.code.length;
  const pct = ((saved / src.length) * 100).toFixed(1);
  await writeFile(filePath, result.code, 'utf8');
  console.log(`✓ ${relative(ROOT, filePath)}  ${(src.length / 1024).toFixed(1)}KB → ${(result.code.length / 1024).toFixed(1)}KB  (-${pct}%)`);
}

async function run() {
  console.log('🔧 Minifying public/assets/ CSS and JS files...\n');

  const cssFiles = await getFiles(PUBLIC_ASSETS, '.css');
  const jsFiles = await getFiles(PUBLIC_ASSETS, '.js');

  // CSS: target doesn't matter for CSS minification
  const CSS_TARGETS = ['chrome90', 'firefox88', 'safari14'];
  // JS: use esnext to avoid esbuild trying to downgrade syntax it can't transform
  // These files already run in modern browsers (the invitation template pages),
  // so targeting esnext is safe and avoids destructuring transform errors.
  const JS_TARGETS = ['esnext'];

  let errors = 0;
  for (const f of cssFiles) {
    try { await minifyFile(f, 'css', CSS_TARGETS); }
    catch (e) { console.error(`✗ ${relative(ROOT, f)}:`, e.message); errors++; }
  }
  for (const f of jsFiles) {
    try { await minifyFile(f, 'js', JS_TARGETS); }
    catch (e) { console.error(`✗ ${relative(ROOT, f)}:`, e.message); errors++; }
  }

  console.log(`\n${errors === 0 ? '✅ All files minified successfully.' : `⚠️  ${errors} file(s) failed.`}`);
}

run();
