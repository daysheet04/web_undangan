import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cinematicDir = path.join(root, 'public', 'assets', 'images', 'templates', 'verdant-vow', 'cinematic');
const bouquetPath = path.join(cinematicDir, 'aisle-bouquet-indonesian-v1.webp');

const W = 900;
const H = 1400;

// Perspective coordinates
// Top: y = 240, left = 350, right = 550 (width 200)
// Bottom: y = 1400, left = 80, right = 820 (width 740)
const topY = 240;
const botY = 1400;
const topLeft = 350;
const topRight = 550;
const botLeft = 80;
const botRight = 820;

const borderThicknessTop = 14;
const borderThicknessBot = 48;
const inlayThicknessTop = 4;
const inlayThicknessBot = 12;

// Runner polygon points
const runnerPoints = `${botLeft},${botY} ${topLeft},${topY} ${topRight},${topY} ${botRight},${botY}`;

// Left border polygon
const leftBorderPoints = `${botLeft - borderThicknessBot},${botY} ${topLeft - borderThicknessTop},${topY} ${topLeft},${topY} ${botLeft},${botY}`;
// Right border polygon
const rightBorderPoints = `${botRight},${botY} ${topRight},${topY} ${topRight + borderThicknessTop},${topY} ${botRight + borderThicknessBot},${botY}`;

// Left inlay polygon
const leftInlayPoints = `${botLeft - borderThicknessBot + inlayThicknessBot},${botY} ${topLeft - borderThicknessTop + inlayThicknessTop},${topY} ${botLeft - borderThicknessBot + inlayThicknessBot * 2},${botY} ${topLeft - borderThicknessTop + inlayThicknessTop * 2},${topY}`;

// Circular mandala pattern along the runner in perspective
const mandalas = [];
const steps = 14;
for (let i = 0; i < steps; i++) {
  const t = i / (steps - 1); // 0 at bottom, 1 at top
  const y = botY - (botY - topY) * (Math.pow(t, 0.78));
  const scale = 1 - t * 0.72;
  const rx = 180 * scale;
  const ry = 65 * scale;
  mandalas.push(`
    <g transform="translate(450, ${y})">
      <ellipse rx="${rx}" ry="${ry}" fill="none" stroke="rgba(164,126,69,0.32)" stroke-width="${Math.max(1, 3 * scale)}" />
      <ellipse rx="${rx * 0.7}" ry="${ry * 0.7}" fill="none" stroke="rgba(164,126,69,0.22)" stroke-width="${Math.max(1, 2 * scale)}" />
      <ellipse rx="${rx * 0.38}" ry="${ry * 0.38}" fill="none" stroke="rgba(164,126,69,0.28)" stroke-width="${Math.max(1, 2 * scale)}" stroke-dasharray="${4 * scale},${4 * scale}" />
      <circle r="${8 * scale}" fill="rgba(132,89,42,0.35)" />
    </g>
  `);
}

const svgString = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="runnerGrad" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#eddcb6" />
      <stop offset="45%" stop-color="#e4cf9f" />
      <stop offset="85%" stop-color="#dac08c" />
      <stop offset="100%" stop-color="#d0b37c" />
    </linearGradient>
    <linearGradient id="woodBorder" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#5a3318" />
      <stop offset="50%" stop-color="#804e27" />
      <stop offset="100%" stop-color="#4e2a14" />
    </linearGradient>
    <linearGradient id="goldInlay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffe8a3" />
      <stop offset="50%" stop-color="#cba04d" />
      <stop offset="100%" stop-color="#a4772e" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="rgba(18,36,22,0.4)" />
    </filter>
  </defs>

  <!-- Ground shadow under borders -->
  <polygon points="${botLeft - borderThicknessBot - 18},${botY} ${topLeft - borderThicknessTop - 8},${topY} ${topRight + borderThicknessTop + 8},${topY} ${botRight + borderThicknessBot + 18},${botY}" fill="rgba(12,28,16,0.35)" filter="url(#shadow)" />

  <!-- Main stone runner -->
  <polygon points="${runnerPoints}" fill="url(#runnerGrad)" />

  <!-- Mandalas -->
  ${mandalas.join('')}

  <!-- Teak Borders -->
  <polygon points="${leftBorderPoints}" fill="url(#woodBorder)" />
  <polygon points="${rightBorderPoints}" fill="url(#woodBorder)" />

  <!-- Gold Inlay Highlights -->
  <polygon points="${botLeft - 18},${botY} ${topLeft - 5},${topY} ${topLeft - 1},${topY} ${botLeft - 10},${botY}" fill="url(#goldInlay)" />
  <polygon points="${botRight + 10},${botY} ${topRight + 1},${topY} ${topRight + 5},${topY} ${botRight + 18},${botY}" fill="url(#goldInlay)" />
</svg>
`;

// Now create the base image from SVG
const baseImage = sharp(Buffer.from(svgString));

// Composite bouquets in perspective on left and right
// Bouquet positions along the aisle: 4 pairs
const bouquetZ = [0.1, 0.35, 0.62, 0.88]; // 0 is bottom, 1 is top
const composites = [];

for (const bz of bouquetZ) {
  const y = Math.round(botY - (botY - topY) * (Math.pow(bz, 0.82)));
  const scale = 1 - bz * 0.68;
  const bw = Math.round(180 * scale);
  const bh = Math.round(120 * scale);

  const leftX = Math.round(botLeft + (topLeft - botLeft) * bz - borderThicknessBot * (1 - bz) - bw * 0.65);
  const rightX = Math.round(botRight + (topRight - botRight) * bz + borderThicknessBot * (1 - bz) - bw * 0.35);

  const resizedBouquetLeft = await sharp(bouquetPath)
    .resize(bw, bh)
    .toBuffer();

  const resizedBouquetRight = await sharp(bouquetPath)
    .resize(bw, bh)
    .flop() // mirror for right side
    .toBuffer();

  composites.push({
    input: resizedBouquetLeft,
    left: Math.max(0, leftX),
    top: Math.max(0, y - Math.round(bh * 0.7)),
  });

  composites.push({
    input: resizedBouquetRight,
    left: Math.min(W - bw, rightX),
    top: Math.max(0, y - Math.round(bh * 0.7)),
  });
}

const outputPath = path.join(cinematicDir, 'garden-aisle-indonesian-v1.webp');

await baseImage
  .composite(composites)
  .webp({ quality: 86, alphaQuality: 90, effort: 5 })
  .toFile(outputPath);

console.log(`Generated Indonesian aisle runner at: ${outputPath}`);
