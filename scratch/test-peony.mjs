import fs from 'node:fs';
import sharp from 'sharp';

// 1. AESTHETIC PEONY / GARDEN ROSE
// Multi-layered ruffled watercolor petals with delicate stamen core
function renderAestheticPeony(cx, cy, r, gradId, innerGradId, strokeColor, stamenColor, goldColor) {
  let s = `<g transform="translate(${cx}, ${cy})">`;

  // Layer 1: Outer Large Ruffled Petals (6 large undulating petals)
  const count1 = 6;
  for (let i = 0; i < count1; i++) {
    const rot = i * 60;
    const w = r * 0.75;
    const h = r * 0.95;
    s += `
      <g transform="rotate(${rot})">
        <path d="M 0,0 
                 C ${-w * 0.5},${-h * 0.2} ${-w * 0.9},${-h * 0.65} ${-w * 0.4},${-h * 0.95} 
                 Q 0,${-h * 1.05} ${w * 0.4},${-h * 0.95} 
                 C ${w * 0.9},${-h * 0.65} ${w * 0.5},${-h * 0.2} 0,0 Z" 
              fill="url(#${gradId})" stroke="${strokeColor}" stroke-width="0.6" opacity="0.90"/>
      </g>
    `;
  }

  // Layer 2: Mid Offset Petals (7 cupped petals, offset by 25 deg)
  const count2 = 7;
  for (let i = 0; i < count2; i++) {
    const rot = i * (360 / count2) + 25;
    const w = r * 0.60;
    const h = r * 0.78;
    s += `
      <g transform="rotate(${rot.toFixed(1)})">
        <path d="M 0,0 
                 C ${-w * 0.6},${-h * 0.25} ${-w * 0.85},${-h * 0.7} ${-w * 0.3},${-h * 0.96} 
                 C ${-w * 0.1},${-h * 1.04} ${w * 0.1},${-h * 1.04} ${w * 0.3},${-h * 0.96} 
                 C ${w * 0.85},${-h * 0.7} ${w * 0.6},${-h * 0.25} 0,0 Z" 
              fill="url(#${gradId})" stroke="${strokeColor}" stroke-width="0.55" opacity="0.94"/>
      </g>
    `;
  }

  // Layer 3: Inner Ruffled Petals (6 tighter cupped petals)
  const count3 = 6;
  for (let i = 0; i < count3; i++) {
    const rot = i * 60 + 12;
    const w = r * 0.45;
    const h = r * 0.58;
    s += `
      <g transform="rotate(${rot})">
        <path d="M 0,0 
                 C ${-w * 0.5},${-h * 0.2} ${-w * 0.8},${-h * 0.65} ${-w * 0.25},${-h * 0.95} 
                 Q 0,${-h * 1.02} ${w * 0.25},${-h * 0.95} 
                 C ${w * 0.8},${-h * 0.65} ${w * 0.5},${-h * 0.2} 0,0 Z" 
              fill="url(#${innerGradId || gradId})" stroke="${strokeColor}" stroke-width="0.5" opacity="0.96"/>
      </g>
    `;
  }

  // Layer 4: Innermost Cup Folds (5 petals enclosing stamen)
  const count4 = 5;
  for (let i = 0; i < count4; i++) {
    const rot = i * 72 + 36;
    const w = r * 0.32;
    const h = r * 0.40;
    s += `
      <g transform="rotate(${rot})">
        <path d="M 0,0 
                 C ${-w * 0.6},${-h * 0.2} ${-w * 0.7},${-h * 0.7} 0,${-h * 0.96} 
                 C ${w * 0.7},${-h * 0.7} ${w * 0.6},${-h * 0.2} 0,0 Z" 
              fill="url(#${innerGradId || gradId})" stroke="${strokeColor}" stroke-width="0.45" opacity="0.98"/>
      </g>
    `;
  }

  // Core: Soft Natural Stamen Center (Golden pollen beads & fine filaments)
  const coreR = r * 0.22;
  s += `<circle cx="0" cy="0" r="${coreR.toFixed(1)}" fill="url(#${innerGradId || gradId})"/>`;
  
  const stamenCount = 14;
  for (let i = 0; i < stamenCount; i++) {
    const a = (i * (360 / stamenCount) + 10) * (Math.PI / 180);
    const d1 = coreR * 0.3;
    const d2 = coreR * 1.15;
    const x1 = Math.cos(a) * d1;
    const y1 = Math.sin(a) * d1;
    const x2 = Math.cos(a) * d2;
    const y2 = Math.sin(a) * d2;

    s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stamenColor}" stroke-width="0.75" stroke-linecap="round" opacity="0.75"/>`;
    s += `<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="1.8" fill="${goldColor}"/>`;
    s += `<circle cx="${(x2 - 0.4).toFixed(1)}" cy="${(y2 - 0.4).toFixed(1)}" r="0.7" fill="#ffffff" opacity="0.8"/>`;
  }
  // Center seed pistil
  s += `<circle cx="0" cy="0" r="${(coreR * 0.38).toFixed(1)}" fill="${stamenColor}"/>`;
  s += `<circle cx="-0.6" cy="-0.6" r="${(coreR * 0.15).toFixed(1)}" fill="#ffffff" opacity="0.6"/>`;

  s += `</g>`;
  return s;
}

// 2. AESTHETIC OPEN RANUNCULUS / ENGLISH ROSE (Soft, layered, dense petals)
function renderAestheticRose(cx, cy, r, gradId, innerGradId, strokeColor) {
  let s = `<g transform="translate(${cx}, ${cy})">`;

  // Base background disk for solid depth
  s += `<circle cx="0" cy="0" r="${r}" fill="url(#${gradId})" opacity="0.3"/>`;

  // Outer ring of 8 broad round petals
  const ring1 = 8;
  for (let i = 0; i < ring1; i++) {
    const rot = i * 45;
    const rad = (rot - 90) * (Math.PI / 180);
    const px = Math.cos(rad) * (r * 0.65);
    const py = Math.sin(rad) * (r * 0.65);
    const pw = r * 0.50;
    const ph = r * 0.42;

    s += `
      <g transform="translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${rot})">
        <path d="M 0,0 
                 C ${-pw * 0.7},${-ph * 0.3} ${-pw * 0.9},${-ph * 0.8} 0,${-ph * 1.1} 
                 C ${pw * 0.9},${-ph * 0.8} ${pw * 0.7},${-ph * 0.3} 0,0 Z" 
              fill="url(#${gradId})" stroke="${strokeColor}" stroke-width="0.6" opacity="0.92"/>
      </g>
    `;
  }

  // Mid ring of 7 petals
  const ring2 = 7;
  for (let i = 0; i < ring2; i++) {
    const rot = i * (360 / ring2) + 22;
    const rad = (rot - 90) * (Math.PI / 180);
    const px = Math.cos(rad) * (r * 0.45);
    const py = Math.sin(rad) * (r * 0.45);
    const pw = r * 0.40;
    const ph = r * 0.36;

    s += `
      <g transform="translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${rot.toFixed(1)})">
        <path d="M 0,0 
                 C ${-pw * 0.7},${-ph * 0.3} ${-pw * 0.85},${-ph * 0.8} 0,${-ph * 1.08} 
                 C ${pw * 0.85},${-ph * 0.8} ${pw * 0.7},${-ph * 0.3} 0,0 Z" 
              fill="url(#${innerGradId || gradId})" stroke="${strokeColor}" stroke-width="0.55" opacity="0.94"/>
      </g>
    `;
  }

  // Inner ring of 6 petals
  const ring3 = 6;
  for (let i = 0; i < ring3; i++) {
    const rot = i * 60 + 10;
    const rad = (rot - 90) * (Math.PI / 180);
    const px = Math.cos(rad) * (r * 0.28);
    const py = Math.sin(rad) * (r * 0.28);
    const pw = r * 0.30;
    const ph = r * 0.28;

    s += `
      <g transform="translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${rot})">
        <path d="M 0,0 
                 C ${-pw * 0.65},${-ph * 0.3} ${-pw * 0.8},${-ph * 0.8} 0,${-ph * 1.05} 
                 C ${pw * 0.8},${-ph * 0.8} ${pw * 0.65},${-ph * 0.3} 0,0 Z" 
              fill="url(#${innerGradId || gradId})" stroke="${strokeColor}" stroke-width="0.5" opacity="0.96"/>
      </g>
    `;
  }

  // Tight spiral center cup
  const cR = r * 0.20;
  s += `
    <circle cx="0" cy="0" r="${cR.toFixed(1)}" fill="url(#${innerGradId || gradId})"/>
    <path d="M ${(-cR * 0.7).toFixed(1)},0 C ${(-cR * 0.5).toFixed(1)},${(-cR * 0.7).toFixed(1)} ${(cR * 0.4).toFixed(1)},${(-cR * 0.7).toFixed(1)} ${(cR * 0.7).toFixed(1)},0 C ${(cR * 0.4).toFixed(1)},${(cR * 0.6).toFixed(1)} ${(-cR * 0.3).toFixed(1)},${(cR * 0.5).toFixed(1)} 0,0" fill="none" stroke="${strokeColor}" stroke-width="0.8" stroke-linecap="round"/>
    <circle cx="0" cy="0" r="${(cR * 0.25).toFixed(1)}" fill="${strokeColor}" opacity="0.8"/>
  `;

  s += `</g>`;
  return s;
}

// 3. AESTHETIC DELICATE FLORET (Hydrangea / Cherry Blossom)
function renderAestheticFloret(cx, cy, r, gradId, strokeColor, goldColor) {
  let s = `<g transform="translate(${cx}, ${cy})">`;
  for (let i = 0; i < 5; i++) {
    const rot = i * 72;
    s += `
      <g transform="rotate(${rot})">
        <path d="M 0,0 C ${-r * 0.45},${-r * 0.3} ${-r * 0.55},${-r * 0.7} 0,${-r * 0.95} C ${r * 0.55},${-r * 0.7} ${r * 0.45},${-r * 0.3} 0,0 Z" 
              fill="url(#${gradId})" stroke="${strokeColor}" stroke-width="0.5" opacity="0.92"/>
      </g>
    `;
  }
  s += `<circle cx="0" cy="0" r="${(r * 0.22).toFixed(1)}" fill="${goldColor}"/>`;
  s += `<circle cx="-0.4" cy="-0.4" r="${(r * 0.08).toFixed(1)}" fill="#ffffff" opacity="0.8"/>`;
  s += `</g>`;
  return s;
}

// 4. AESTHETIC WATERCOLOR SAGE LEAF (Curved, soft organic shape)
function renderAestheticLeaf(cx, cy, len, w, curve = 0.18, rotDeg = 0, hlGradId, shGradId, stemColor) {
  const tipX = curve * len * 0.45;
  const tipY = -len;
  const midX = tipX * 0.4;
  const midY = -len * 0.52;

  const lPath = `M 0,0 ` +
    `C ${-w * 0.7},${-len * 0.16} ${-w * 1.0 + midX * 0.3},${-len * 0.46} ${midX},${midY} ` +
    `C ${midX - w * 0.55},${-len * 0.72} ${tipX - w * 0.2},${-len * 0.92} ${tipX},${tipY} ` +
    `Q ${midX * 0.75},${midY * 0.75} 0,0 Z`;

  const rPath = `M 0,0 ` +
    `Q ${midX * 0.75},${midY * 0.75} ${tipX},${tipY} ` +
    `C ${tipX + w * 0.2},${-len * 0.92} ${midX + w * 0.55},${-len * 0.72} ${midX},${midY} ` +
    `C ${w * 1.0 + midX * 0.3},${-len * 0.46} ${w * 0.7},${-len * 0.16} 0,0 Z`;

  return `
    <g transform="translate(${cx}, ${cy}) rotate(${rotDeg})">
      <path d="M 0,${len * 0.06} Q 0,${len * 0.03} 0,0" fill="none" stroke="${stemColor}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="${lPath}" fill="url(#${hlGradId})" stroke="${stemColor}" stroke-width="0.6" opacity="0.94"/>
      <path d="${rPath}" fill="url(#${shGradId})" stroke="${stemColor}" stroke-width="0.6" opacity="0.94"/>
      <path d="M 0,0 Q ${midX.toFixed(1)},${midY.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)}" fill="none" stroke="${stemColor}" stroke-width="1.0" stroke-linecap="round" opacity="0.8"/>
    </g>
  `;
}

// 5. AESTHETIC ROUND SILVER-DOLLAR EUCALYPTUS (Coin leaves on graceful stems)
function renderAestheticEucalyptus(cx, cy, len, rotDeg, hlGradId, shGradId, stemColor, goldColor) {
  let s = `<g transform="translate(${cx}, ${cy}) rotate(${rotDeg})">`;
  s += `<path d="M 0,0 Q -12,${-len * 0.5} 0,${-len}" fill="none" stroke="${stemColor}" stroke-width="1.5" stroke-linecap="round"/>`;

  const nodes = [0.20, 0.42, 0.64, 0.84, 0.96];
  for (const t of nodes) {
    const y = -len * t;
    const x = -12 * Math.sin(t * Math.PI);
    const r = len * 0.12 * (1.1 - t * 0.25);

    // Left leaf
    s += `
      <g transform="translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${-48 - t * 10})">
        <path d="M 0,0 L -5,0" stroke="${stemColor}" stroke-width="1.0"/>
        <ellipse cx="${-5 - r * 0.9}" cy="0" rx="${(r * 0.95).toFixed(1)}" ry="${(r * 0.75).toFixed(1)}" 
                 fill="url(#${hlGradId})" stroke="${stemColor}" stroke-width="0.5" opacity="0.90"/>
      </g>
    `;
    // Right leaf
    s += `
      <g transform="translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${48 + t * 10})">
        <path d="M 0,0 L 5,0" stroke="${stemColor}" stroke-width="1.0"/>
        <ellipse cx="${5 + r * 0.9}" cy="0" rx="${(r * 0.95).toFixed(1)}" ry="${(r * 0.75).toFixed(1)}" 
                 fill="url(#${shGradId})" stroke="${stemColor}" stroke-width="0.5" opacity="0.90"/>
      </g>
    `;

    // Gold berry dot
    s += `<circle cx="${(x + 2).toFixed(1)}" cy="${(y - 4).toFixed(1)}" r="2.0" fill="${goldColor}"/>`;
  }
  s += `</g>`;
  return s;
}

// 6. TEST RENDER PREVIEW
async function runTest() {
  const svg = `
  <svg width="700" height="700" viewBox="0 0 700 700" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Soft Botanical Champagne / Ivory (Verdant Vow Aesthetic!) -->
      <radialGradient id="peony-hero" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#fffbf5"/>
        <stop offset="50%" stop-color="#f5e8d5"/>
        <stop offset="100%" stop-color="#d6bfa3"/>
      </radialGradient>
      <radialGradient id="peony-inner" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#fceddb"/>
        <stop offset="60%" stop-color="#dfcaa8"/>
        <stop offset="100%" stop-color="#a88960"/>
      </radialGradient>

      <!-- Soft Blush Coral Peach Rose -->
      <radialGradient id="rose-blush" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#fdecef"/>
        <stop offset="55%" stop-color="#f5b8c6"/>
        <stop offset="100%" stop-color="#c45d74"/>
      </radialGradient>
      <radialGradient id="rose-blush-inner" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#f5a6b8"/>
        <stop offset="100%" stop-color="#942a42"/>
      </radialGradient>

      <!-- Delicate Hydrangea Floret -->
      <radialGradient id="floret-grad" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="70%" stop-color="#fdf4ea"/>
        <stop offset="100%" stop-color="#eed8c0"/>
      </radialGradient>

      <!-- Soft Watercolor Sage / Eucalyptus Leaves -->
      <linearGradient id="leaf-hl" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a8d4ad"/>
        <stop offset="60%" stop-color="#6ea375"/>
        <stop offset="100%" stop-color="#497550"/>
      </linearGradient>
      <linearGradient id="leaf-sh" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#5a8c62"/>
        <stop offset="70%" stop-color="#3c6343"/>
        <stop offset="100%" stop-color="#243f29"/>
      </linearGradient>
    </defs>

    <rect width="700" height="700" fill="#ffffff"/>

    <!-- Foliage Sprays in Background -->
    ${renderAestheticLeaf(200, 240, 160, 42, 0.2, -65, 'leaf-hl', 'leaf-sh', '#243f29')}
    ${renderAestheticLeaf(440, 240, 160, 42, -0.2, 60, 'leaf-hl', 'leaf-sh', '#243f29')}
    ${renderAestheticEucalyptus(320, 210, 220, 5, 'leaf-hl', 'leaf-sh', '#243f29', '#d4af37')}

    <!-- Secondary Blush Rose -->
    ${renderAestheticRose(210, 360, 68, 'rose-blush', 'rose-blush-inner', 'rgba(255,255,255,0.7)')}

    <!-- Hero Aesthetic Peony -->
    ${renderAestheticPeony(380, 350, 95, 'peony-hero', 'peony-inner', 'rgba(255,255,255,0.7)', '#6e4f2b', '#d4af37')}

    <!-- Small Florets & Buds -->
    ${renderAestheticFloret(170, 260, 18, 'floret-grad', 'rgba(255,255,255,0.8)', '#d4af37')}
    ${renderAestheticFloret(480, 260, 16, 'floret-grad', 'rgba(255,255,255,0.8)', '#d4af37')}
    ${renderAestheticFloret(290, 440, 15, 'floret-grad', 'rgba(255,255,255,0.8)', '#d4af37')}

    <!-- Gold Accent Leaf -->
    <path d="M 230,220 Q 150,160 120,150 Q 165,135 230,220 Z" fill="rgba(212, 175, 55, 0.6)"/>
    <path d="M 420,220 Q 500,160 530,150 Q 485,135 420,220 Z" fill="rgba(212, 175, 55, 0.6)"/>
  </svg>
  `;

  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync('scratch/test_aesthetic_peony.png', buf);
  console.log('Saved scratch/test_aesthetic_peony.png');
}

runTest().catch(console.error);

