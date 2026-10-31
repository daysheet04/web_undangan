import fs from 'node:fs';
import sharp from 'sharp';

// 1. AESTHETIC ENGLISH GARDEN ROSE (Realistic petal folds & spiral heart, matching reference!)
export function renderAestheticRose(cx, cy, r, gradId, strokeColor, shadowGradId) {
  let s = `<g transform="translate(${cx}, ${cy})">`;

  // Outer Petals Layer 1 (Broad cupped petals wrapping the base)
  const outerCount = 7;
  for (let i = 0; i < outerCount; i++) {
    const angle = (i * (360 / outerCount) - 20) * (Math.PI / 180);
    const dist = r * 0.72;
    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;
    const rot = (i * (360 / outerCount) + 70);
    const pw = r * 0.58;
    const ph = r * 0.50;

    // Heart-shaped cupped petal with subtle wavy edge
    s += `
      <g transform="translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${rot.toFixed(1)})">
        <path d="M 0,0 
                 C ${-pw * 0.6},${-ph * 0.3} ${-pw * 0.8},${-ph * 0.7} ${-pw * 0.3},${-ph * 1.0} 
                 C ${-pw * 0.1},${-ph * 1.1} 0,${-ph * 0.95} 0,${-ph * 0.95} 
                 C 0,${-ph * 0.95} ${pw * 0.1},${-ph * 1.1} ${pw * 0.3},${-ph * 1.0} 
                 C ${pw * 0.8},${-ph * 0.7} ${pw * 0.6},${-ph * 0.3} 0,0 Z" 
              fill="url(#${gradId})" stroke="${strokeColor}" stroke-width="0.75" opacity="0.96"/>
      </g>
    `;
  }

  // Mid Petals Layer 2 (Overlapping cupped petals)
  const midCount = 6;
  for (let i = 0; i < midCount; i++) {
    const angle = (i * (360 / midCount) + 18) * (Math.PI / 180);
    const dist = r * 0.50;
    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;
    const rot = (i * (360 / midCount) + 105);
    const pw = r * 0.48;
    const ph = r * 0.44;

    s += `
      <g transform="translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${rot.toFixed(1)})">
        <path d="M 0,0 
                 C ${-pw * 0.6},${-ph * 0.25} ${-pw * 0.75},${-ph * 0.7} ${-pw * 0.25},${-ph * 0.98} 
                 C ${-pw * 0.05},${-ph * 1.05} 0,${-ph * 0.92} 0,${-ph * 0.92} 
                 C 0,${-ph * 0.92} ${pw * 0.05},${-ph * 1.05} ${pw * 0.25},${-ph * 0.98} 
                 C ${pw * 0.75},${-ph * 0.7} ${pw * 0.6},${-ph * 0.25} 0,0 Z" 
              fill="url(#${gradId})" stroke="${strokeColor}" stroke-width="0.7" opacity="0.95"/>
      </g>
    `;
  }

  // Inner Petals Layer 3 (Tighter wrap around heart)
  const innerCount = 5;
  for (let i = 0; i < innerCount; i++) {
    const angle = (i * (360 / innerCount) + 42) * (Math.PI / 180);
    const dist = r * 0.30;
    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;
    const rot = (i * (360 / innerCount) + 130);
    const pw = r * 0.38;
    const ph = r * 0.35;

    s += `
      <g transform="translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${rot.toFixed(1)})">
        <path d="M 0,0 
                 C ${-pw * 0.6},${-ph * 0.2} ${-pw * 0.7},${-ph * 0.65} ${-pw * 0.2},${-ph * 0.95} 
                 Q 0,${-ph * 1.0} ${pw * 0.2},${-ph * 0.95} 
                 C ${pw * 0.7},${-ph * 0.65} ${pw * 0.6},${-ph * 0.2} 0,0 Z" 
              fill="url(#${shadowGradId || gradId})" stroke="${strokeColor}" stroke-width="0.65" opacity="0.98"/>
      </g>
    `;
  }

  // Heart Center Spiral (Overlapping crescent folds - the signature of a real rose!)
  const cR = r * 0.24;
  s += `
    <g>
      <!-- Deep shadow center cup -->
      <ellipse cx="0" cy="0" rx="${(cR * 1.1).toFixed(1)}" ry="${(cR * 0.9).toFixed(1)}" fill="url(#${shadowGradId || gradId})"/>

      <!-- Crescent petal swirl 1 -->
      <path d="M ${(-cR * 0.9).toFixed(1)},${(-cR * 0.1).toFixed(1)} 
               C ${(-cR * 0.8).toFixed(1)},${(-cR * 0.8).toFixed(1)} ${(cR * 0.4).toFixed(1)},${(-cR * 0.9).toFixed(1)} ${(cR * 0.9).toFixed(1)},${(-cR * 0.2).toFixed(1)} 
               C ${(cR * 0.5).toFixed(1)},${(-cR * 0.4).toFixed(1)} ${(-cR * 0.3).toFixed(1)},${(-cR * 0.4).toFixed(1)} ${(-cR * 0.9).toFixed(1)},${(-cR * 0.1).toFixed(1)} Z" 
            fill="url(#${gradId})" stroke="${strokeColor}" stroke-width="0.65" opacity="0.95"/>

      <!-- Crescent petal swirl 2 (wrapping from bottom) -->
      <path d="M ${(cR * 0.85).toFixed(1)},${(cR * 0.1).toFixed(1)} 
               C ${(cR * 0.7).toFixed(1)},${(cR * 0.8).toFixed(1)} ${(-cR * 0.4).toFixed(1)},${(cR * 0.85).toFixed(1)} ${(-cR * 0.85).toFixed(1)},${(cR * 0.2).toFixed(1)} 
               C ${(-cR * 0.4).toFixed(1)},${(cR * 0.4).toFixed(1)} ${(cR * 0.3).toFixed(1)},${(cR * 0.35).toFixed(1)} ${(cR * 0.85).toFixed(1)},${(cR * 0.1).toFixed(1)} Z" 
            fill="url(#${gradId})" stroke="${strokeColor}" stroke-width="0.65" opacity="0.95"/>

      <!-- Inner tight spiral fold -->
      <path d="M ${(-cR * 0.5).toFixed(1)},${(-cR * 0.1).toFixed(1)} 
               C ${(-cR * 0.4).toFixed(1)},${(-cR * 0.5).toFixed(1)} ${(cR * 0.3).toFixed(1)},${(-cR * 0.5).toFixed(1)} ${(cR * 0.5).toFixed(1)},0 
               C ${(cR * 0.3).toFixed(1)},${(cR * 0.4).toFixed(1)} ${(-cR * 0.2).toFixed(1)},${(cR * 0.3).toFixed(1)} 0,0" 
            fill="none" stroke="${strokeColor}" stroke-width="0.85" stroke-linecap="round" opacity="0.9"/>

      <circle cx="${(cR * 0.1).toFixed(1)}" cy="${(-cR * 0.05).toFixed(1)}" r="${(cR * 0.25).toFixed(1)}" fill="url(#${shadowGradId || gradId})"/>
    </g>
  `;

  s += `</g>`;
  return s;
}

// 2. AESTHETIC WATERCOLOR LEAF (Fluid botanical curve with delicate veins)
export function renderAestheticLeaf(cx, cy, len, w, curve = 0.18, rotDeg = 0, hlGradId, shGradId, stemColor) {
  const tipX = curve * len * 0.5;
  const tipY = -len;
  const midX = tipX * 0.45;
  const midY = -len * 0.52;

  // Gracefully curved left lobe
  const lPath = `M 0,0 ` +
    `C ${-w * 0.65},${-len * 0.15} ${-w * 1.05 + midX * 0.3},${-len * 0.45} ${midX},${midY} ` +
    `C ${midX - w * 0.6},${-len * 0.72} ${tipX - w * 0.25},${-len * 0.92} ${tipX},${tipY} ` +
    `Q ${midX * 0.75},${midY * 0.78} 0,0 Z`;

  // Gracefully curved right lobe
  const rPath = `M 0,0 ` +
    `Q ${midX * 0.75},${midY * 0.78} ${tipX},${tipY} ` +
    `C ${tipX + w * 0.25},${-len * 0.92} ${midX + w * 0.6},${-len * 0.72} ${midX},${midY} ` +
    `C ${w * 1.05 + midX * 0.3},${-len * 0.45} ${w * 0.65},${-len * 0.15} 0,0 Z`;

  // Soft delicate internal veins
  const veins = [];
  const vCount = 4;
  for (let i = 1; i <= vCount; i++) {
    const t = i / (vCount + 1);
    const startY = -len * t;
    const startX = midX * Math.sin(t * Math.PI * 0.9);
    const bW = w * Math.sin(t * Math.PI) * 0.7;

    veins.push(`<path d="M ${startX.toFixed(1)},${startY.toFixed(1)} Q ${(startX - bW * 0.4).toFixed(1)},${(startY - len * 0.05).toFixed(1)} ${(startX - bW * 0.8).toFixed(1)},${(startY - len * 0.1).toFixed(1)}" fill="none" stroke="rgba(255, 255, 255, 0.4)" stroke-width="0.6"/>`);
    veins.push(`<path d="M ${startX.toFixed(1)},${startY.toFixed(1)} Q ${(startX + bW * 0.4).toFixed(1)},${(startY - len * 0.05).toFixed(1)} ${(startX + bW * 0.8).toFixed(1)},${(startY - len * 0.1).toFixed(1)}" fill="none" stroke="${stemColor}" stroke-width="0.6" opacity="0.45"/>`);
  }

  return `
    <g transform="translate(${cx}, ${cy}) rotate(${rotDeg})">
      <!-- Petiole -->
      <path d="M 0,${len * 0.08} Q 0,${len * 0.04} 0,0" fill="none" stroke="${stemColor}" stroke-width="1.6" stroke-linecap="round"/>
      <!-- Left blade (highlighted) -->
      <path d="${lPath}" fill="url(#${hlGradId})" stroke="${stemColor}" stroke-width="0.65" opacity="0.95"/>
      <!-- Right blade (shaded) -->
      <path d="${rPath}" fill="url(#${shGradId})" stroke="${stemColor}" stroke-width="0.65" opacity="0.95"/>
      <!-- Midrib -->
      <path d="M 0,0 Q ${midX.toFixed(1)},${midY.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)}" fill="none" stroke="${stemColor}" stroke-width="1.2" stroke-linecap="round"/>
      ${veins.join('\n')}
    </g>
  `;
}

// 3. AESTHETIC SEEDED EUCALYPTUS BRANCH (Round, soft, coin-like watercolor leaves)
export function renderAestheticEucalyptus(cx, cy, len, rotDeg, hlGradId, shGradId, stemColor, goldColor) {
  let s = `<g transform="translate(${cx}, ${cy}) rotate(${rotDeg})">`;
  s += `<path d="M 0,0 Q -15,${-len * 0.5} 0,${-len}" fill="none" stroke="${stemColor}" stroke-width="1.6" stroke-linecap="round"/>`;

  const nodes = [0.18, 0.38, 0.58, 0.78, 0.94];
  for (const t of nodes) {
    const y = -len * t;
    const x = -15 * Math.sin(t * Math.PI);
    const r = len * 0.11 * (1.1 - t * 0.3);

    // Left leaf
    s += `
      <g transform="translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${-50 - t * 8})">
        <path d="M 0,0 L -5,0" stroke="${stemColor}" stroke-width="1.0"/>
        <ellipse cx="${-5 - r * 0.9}" cy="0" rx="${(r * 0.95).toFixed(1)}" ry="${(r * 0.75).toFixed(1)}" 
                 fill="url(#${hlGradId})" stroke="${stemColor}" stroke-width="0.6" opacity="0.92"/>
        <circle cx="${-5 - r * 0.9}" cy="0" r="1.0" fill="${stemColor}" opacity="0.4"/>
      </g>
    `;
    // Right leaf
    s += `
      <g transform="translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${48 + t * 8})">
        <path d="M 0,0 L 5,0" stroke="${stemColor}" stroke-width="1.0"/>
        <ellipse cx="${5 + r * 0.9}" cy="0" rx="${(r * 0.95).toFixed(1)}" ry="${(r * 0.75).toFixed(1)}" 
                 fill="url(#${shGradId})" stroke="${stemColor}" stroke-width="0.6" opacity="0.92"/>
        <circle cx="${5 + r * 0.9}" cy="0" r="1.0" fill="${stemColor}" opacity="0.4"/>
      </g>
    `;

    // Seeded berry sprig
    s += `<circle cx="${(x + 2).toFixed(1)}" cy="${(y - 4).toFixed(1)}" r="2.2" fill="${goldColor}"/>`;
    s += `<circle cx="${(x - 2).toFixed(1)}" cy="${(y - 6).toFixed(1)}" r="1.8" fill="${goldColor}"/>`;
  }

  s += `</g>`;
  return s;
}

// 4. TEST RENDER SINGLE FLOWER & SPRAY
async function testSingleFlower() {
  const svg = `
  <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Rich Velvety Crimson / Rose Gradient -->
      <radialGradient id="rose-hero" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ea7a8f"/>
        <stop offset="45%" stop-color="#c8344e"/>
        <stop offset="100%" stop-color="#731424"/>
      </radialGradient>
      <radialGradient id="rose-shadow" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="#b0263f"/>
        <stop offset="100%" stop-color="#550c18"/>
      </radialGradient>
      <!-- Soft Pink Baby Rose Gradient -->
      <radialGradient id="rose-blush" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#fde4eb"/>
        <stop offset="55%" stop-color="#f5a4b7"/>
        <stop offset="100%" stop-color="#b8455e"/>
      </radialGradient>
      <!-- Soft Watercolor Sage Leaf -->
      <linearGradient id="leaf-hl" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a4cca6"/>
        <stop offset="60%" stop-color="#699b70"/>
        <stop offset="100%" stop-color="#47734e"/>
      </linearGradient>
      <linearGradient id="leaf-sh" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#528258"/>
        <stop offset="70%" stop-color="#345939"/>
        <stop offset="100%" stop-color="#1e3621"/>
      </linearGradient>
    </defs>

    <rect width="600" height="600" fill="#faf8f5"/>

    <!-- Leaves around flower -->
    ${renderAestheticLeaf(240, 260, 150, 45, 0.2, -60, 'leaf-hl', 'leaf-sh', '#1e3621')}
    ${renderAestheticLeaf(360, 260, 150, 45, -0.2, 55, 'leaf-hl', 'leaf-sh', '#1e3621')}
    ${renderAestheticEucalyptus(300, 240, 180, 0, 'leaf-hl', 'leaf-sh', '#1e3621', '#d4af37')}

    <!-- Secondary Blush Rose -->
    ${renderAestheticRose(200, 340, 60, 'rose-blush', 'rgba(255,255,255,0.7)', 'rose-hero')}

    <!-- Hero Rose -->
    ${renderAestheticRose(330, 330, 95, 'rose-hero', 'rgba(255,255,255,0.7)', 'rose-shadow')}
  </svg>
  `;

  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync('scratch/test_aesthetic_rose.png', buf);
  console.log('Saved scratch/test_aesthetic_rose.png');
}

testSingleFlower().catch(console.error);

