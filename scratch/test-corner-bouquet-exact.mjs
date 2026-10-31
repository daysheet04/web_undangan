import fs from 'node:fs';
import sharp from 'sharp';
import { getLushThemePalette, getRichGradientBackgroundSvg, getLushSoftFrameSvg } from './test-soft-frame-and-lush-flowers.mjs';
import { getRealisticCoverSvg, renderWatercolorGardenRose, renderWatercolorRoseSide, renderWatercolorBud, renderWatercolorFloret, renderGoldTwig } from './test-full-botanical-cover.mjs';

function renderPetiteBranch(cx, cy, len, rot, p, themeKey) {
  return `
    <g transform="translate(${cx}, ${cy}) rotate(${rot})">
      <path d="M 0,0 Q 15,${-len * 0.45} 5,${-len}" fill="none" stroke="${p.stem}" stroke-width="1.8" stroke-linecap="round"/>
      <g transform="translate(8, ${-len * 0.25}) rotate(38) scale(0.65)">
        <path d="M 0,0 C -8,-15 -14,-32 0,-44 C 14,-32 8,-15 0,0 Z" fill="url(#cov-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
      </g>
      <g transform="translate(-5, ${-len * 0.45}) rotate(-35) scale(0.65)">
        <path d="M 0,0 C -8,-15 -14,-32 0,-44 C 14,-32 8,-15 0,0 Z" fill="url(#cov-leaf-sh-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
      </g>
      <g transform="translate(10, ${-len * 0.68}) rotate(32) scale(0.60)">
        <path d="M 0,0 C -8,-15 -14,-32 0,-44 C 14,-32 8,-15 0,0 Z" fill="url(#cov-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
      </g>
      <g transform="translate(-4, ${-len * 0.85}) rotate(-28) scale(0.55)">
        <path d="M 0,0 C -8,-15 -14,-32 0,-44 C 14,-32 8,-15 0,0 Z" fill="url(#cov-leaf-sh-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
      </g>
      <g transform="translate(5, ${-len}) scale(0.50)">
        <path d="M 0,0 C -8,-15 -14,-32 0,-44 C 14,-32 8,-15 0,0 Z" fill="url(#cov-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
      </g>
    </g>
  `;
}

export function getCoverPetiteCornerSvg(themeKey = 'verdant_vow', corner = 'tr') {
  const p = getLushThemePalette(themeKey);

  const innerContent = `
    <!-- Foliage Branch extending Horizontally (towards center top) -->
    ${renderPetiteBranch(280, 28, 170, -96, p, themeKey)}
    ${renderPetiteBranch(230, 22, 110, -92, p, themeKey)}
    ${renderGoldTwig(275, 20, 135, -94, p)}

    <!-- Foliage Branch extending Vertically (down right margin) -->
    ${renderPetiteBranch(325, 75, 170, 4, p, themeKey)}
    ${renderPetiteBranch(328, 125, 110, 8, p, themeKey)}
    ${renderGoldTwig(330, 70, 135, 6, p)}

    <!-- Diagonal leaves backing the rose -->
    <g transform="translate(290, 55) rotate(-45) scale(0.7)">
      <path d="M 0,0 C -8,-15 -14,-34 0,-48 C 14,-34 8,-15 0,0 Z" fill="url(#cov-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
    </g>
    <g transform="translate(305, 70) rotate(135) scale(0.65)">
      <path d="M 0,0 C -8,-15 -14,-34 0,-48 C 14,-34 8,-15 0,0 Z" fill="url(#cov-leaf-sh-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
    </g>

    <!-- Companion Rosebuds -->
    ${renderWatercolorBud(205, 34, 0.65, -82, 'r1', p, themeKey)}
    ${renderWatercolorBud(320, 150, 0.65, 18, 'r2', p, themeKey)}

    <!-- Companion Side Rose -->
    ${renderWatercolorRoseSide(255, 70, 0.65, -35, 'r2', p, themeKey)}

    <!-- Main Blooming Watercolor Rose in Corner -->
    ${renderWatercolorGardenRose(295, 52, 0.78, -12, 'r1', p, themeKey)}

    <!-- Delicate Starry White Jasmine Florets with Gold Centers -->
    ${renderWatercolorFloret(285, 16, 0.85, 15, p)}
    ${renderWatercolorFloret(335, 50, 0.80, -25, p)}
    ${renderWatercolorFloret(245, 92, 0.75, 35, p)}
    ${renderWatercolorFloret(282, 105, 0.70, -10, p)}

    <!-- Gold Stardust Beads -->
    <circle cx="135" cy="24" r="2.2" fill="${p.goldMain}"/>
    <circle cx="328" cy="225" r="2.2" fill="${p.goldMain}"/>
    <circle cx="210" cy="18" r="1.8" fill="${p.goldLight}"/>
    <circle cx="334" cy="155" r="1.8" fill="${p.goldLight}"/>
  `;

  const wrapTransform = corner === 'bl' 
    ? 'transform="translate(350, 350) scale(-1, -1)"' 
    : '';

  return `
  <svg width="350" height="350" viewBox="0 0 350 350" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Rose Gradients -->
      <radialGradient id="cov-r1-outer-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="60%" stop-color="${p.roseOuter1}"/>
        <stop offset="100%" stop-color="${p.roseOuter2}"/>
      </radialGradient>
      <radialGradient id="cov-r1-mid-${themeKey}" cx="42%" cy="42%" r="65%">
        <stop offset="0%" stop-color="${p.roseOuter2}"/>
        <stop offset="60%" stop-color="${p.roseMid1}"/>
        <stop offset="100%" stop-color="${p.roseMid2}"/>
      </radialGradient>
      <radialGradient id="cov-r1-inner-${themeKey}" cx="40%" cy="40%" r="65%">
        <stop offset="0%" stop-color="${p.roseMid2}"/>
        <stop offset="70%" stop-color="${p.roseDeep1}"/>
        <stop offset="100%" stop-color="${p.roseDeep2}"/>
      </radialGradient>

      <radialGradient id="cov-r2-outer-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="65%" stop-color="${p.roseOuter1}"/>
        <stop offset="100%" stop-color="${p.roseOuter2}"/>
      </radialGradient>
      <radialGradient id="cov-r2-mid-${themeKey}" cx="42%" cy="42%" r="65%">
        <stop offset="0%" stop-color="${p.roseOuter1}"/>
        <stop offset="60%" stop-color="${p.roseMid1}"/>
        <stop offset="100%" stop-color="${p.roseMid2}"/>
      </radialGradient>
      <radialGradient id="cov-r2-inner-${themeKey}" cx="40%" cy="40%" r="65%">
        <stop offset="0%" stop-color="${p.roseMid1}"/>
        <stop offset="70%" stop-color="${p.roseDeep1}"/>
        <stop offset="100%" stop-color="${p.roseDeep2}"/>
      </radialGradient>

      <!-- Leaf Gradients -->
      <linearGradient id="cov-leaf-hl-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafHl}"/>
        <stop offset="60%" stop-color="${p.leafMid}"/>
        <stop offset="100%" stop-color="${p.leafDeep}"/>
      </linearGradient>
      <linearGradient id="cov-leaf-sh-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafMid}"/>
        <stop offset="70%" stop-color="${p.leafDeep}"/>
        <stop offset="100%" stop-color="${p.leafShadow}"/>
      </linearGradient>
    </defs>

    <g ${wrapTransform}>
      ${innerContent}
    </g>
  </svg>
  `;
}

async function run() {
  const themes = ['verdant_vow', 'puspa_jawi', 'lunara_azure', 'aurelia_grande'];

  for (const themeKey of themes) {
    const p = getLushThemePalette(themeKey);
    const bgSvg = getRichGradientBackgroundSvg(themeKey);
    const tlSvg = getRealisticCoverSvg(themeKey, 'tl');
    const brSvg = getRealisticCoverSvg(themeKey, 'br');
    const frameSvg = getLushSoftFrameSvg(themeKey);
    const trCornerSvg = getCoverPetiteCornerSvg(themeKey, 'tr');
    const blCornerSvg = getCoverPetiteCornerSvg(themeKey, 'bl');

    const fullSvg = `
    <svg width="800" height="1131" viewBox="0 0 800 1131" xmlns="http://www.w3.org/2000/svg">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&amp;family=Montserrat:wght@400;600;700&amp;family=Playfair+Display:ital,wght@1,500&amp;display=swap');
        .title-caps { font-family: 'Montserrat', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 5.5px; fill: ${p.titleColor}; }
        .name-groom { font-family: 'Great Vibes', cursive, 'Brush Script MT', serif; font-size: 48px; fill: ${p.nameColor}; }
        .name-ampersand { font-family: 'Playfair Display', serif; font-style: italic; font-size: 26px; fill: ${p.goldMain}; }
        .name-bride { font-family: 'Great Vibes', cursive, 'Brush Script MT', serif; font-size: 48px; fill: ${p.nameColor}; }
        .meta-date { font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2.4px; fill: ${p.dateColor}; }
        .rec-title { font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 500; fill: ${p.recTitle}; }
        .rec-sub { font-family: 'Playfair Display', serif; font-style: italic; font-size: 14.5px; fill: ${p.recSub}; }
        .apology-note { font-family: 'Montserrat', sans-serif; font-size: 11px; font-style: italic; fill: #c0392b; }
      </style>

      <!-- 1. Rich Visible Gradient Background with Watercolor Clouds & Waves -->
      <g transform="translate(0, 0)">
        ${bgSvg.replace(/<svg[^>]*>|<\/svg>/g, '')}
      </g>

      <!-- 2. Main Large Floral Corners (TL & BR Cascades - 50% width & 50% height) -->
      <g transform="translate(0, 0)">
        <svg width="400" height="565.5" viewBox="0 0 700 1000">
          ${tlSvg.replace(/<svg[^>]*>|<\/svg>/g, '')}
        </svg>
      </g>

      <g transform="translate(400, 565.5)">
        <svg width="400" height="565.5" viewBox="0 0 700 1000">
          ${brSvg.replace(/<svg[^>]*>|<\/svg>/g, '')}
        </svg>
      </g>

      <!-- 3. TOP-RIGHT CORNER BOUQUET (Hugs TR corner) -->
      <g transform="translate(600, 0)">
        <svg width="200" height="200" viewBox="0 0 350 350">
          ${trCornerSvg.replace(/<svg[^>]*>|<\/svg>/g, '')}
        </svg>
      </g>

      <!-- 4. BOTTOM-LEFT CORNER BOUQUET (Hugs BL corner) -->
      <g transform="translate(0, 931)">
        <svg width="200" height="200" viewBox="0 0 350 350">
          ${blCornerSvg.replace(/<svg[^>]*>|<\/svg>/g, '')}
        </svg>
      </g>

      <!-- 5. "THE WEDDING" - OUTSIDE AND ABOVE THE FRAME WITH PROPER FULL UNDERLINE -->
      <g transform="translate(400, 185)">
        <text x="0" y="0" text-anchor="middle" class="title-caps">THE WEDDING</text>
        <line x1="-95" y1="10" x2="95" y2="10" stroke="${p.goldMain}" stroke-width="1.2" stroke-linecap="round" opacity="0.85"/>
      </g>

      <!-- 6. SOFT ROUNDED DOUBLE-LINE FRAME WITH LUSH ROSES -->
      <g transform="translate(140, 205)">
        ${frameSvg.replace(/<svg[^>]*>|<\/svg>/g, '')}
      </g>

      <!-- 7. STACKED NAMES ONLY INSIDE THE FRAME -->
      <text x="400" y="325" text-anchor="middle" class="name-groom">Baskara</text>
      <text x="400" y="375" text-anchor="middle" class="name-ampersand">&amp;</text>
      <text x="400" y="440" text-anchor="middle" class="name-bride">Anindya</text>

      <!-- 8. DATE - OUTSIDE AND BELOW THE FRAME (CLEAN WITHOUT ANY STRIKE LINES) -->
      <g transform="translate(400, 574)">
        <text x="0" y="0" text-anchor="middle" class="meta-date">SABTU, 31 OKTOBER 2026</text>
      </g>

      <!-- 9. RECIPIENT SECTION -->
      <g transform="translate(400, 642)">
        <text x="0" y="0" text-anchor="middle" class="rec-title">Kepada Yth.</text>
        <text x="0" y="22" text-anchor="middle" class="rec-sub">Bapak / Ibu / Saudara / i</text>
      </g>

      <!-- Recipient Card -->
      <g transform="translate(180, 700)">
        <rect x="0" y="0" width="440" height="155" rx="16" ry="16" fill="#ffffff" fill-opacity="0.88" stroke="${p.cardStroke}" stroke-width="1.2"/>
        <rect x="6" y="6" width="428" height="143" rx="12" ry="12" fill="none" stroke="${p.cardDash}" stroke-width="0.8" stroke-dasharray="4 3"/>
      </g>

      <text x="400" y="880" text-anchor="middle" class="apology-note">Mohon maaf apabila ada kesalahan dalam penulisan nama / gelar</text>
    </svg>
    `;

    const outPng = `scratch/exact_corner_cover_${themeKey}.png`;
    await sharp(Buffer.from(fullSvg)).png().toFile(outPng);
    console.log(`Saved ${outPng}`);

    const artifactPath = `C:/Users/dandi120502/.gemini/antigravity/brain/d7e868e7-6d37-4a0e-9209-fdd022e77915/cover_preview_${themeKey}.png`;
    fs.copyFileSync(outPng, artifactPath);
    console.log(`Updated artifact: ${artifactPath}`);
  }
}

run();

