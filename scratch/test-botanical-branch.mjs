import fs from 'node:fs';
import sharp from 'sharp';

/**
 * Botanical Leaf System matching user reference media_1793416224799_ca603bf6.png
 */

// Single Realistic Botanical Leaf
function renderBotanicalLeaf(cx, cy, len, w, curve = 0.1, rot = 0, hlGradId, shGradId, stemColor, veinColor) {
  const tipX = curve * len * 0.45;
  const tipY = -len;
  const midX = tipX * 0.42;
  const midY = -len * 0.50;

  // Smooth natural leaf blade
  const lPath = `M 0,0 ` +
    `C ${-w * 0.75},${-len * 0.16} ${-w + tipX * 0.25},${-len * 0.52} ${tipX},${tipY} ` +
    `Q ${midX},${midY} 0,0 Z`;

  const rPath = `M 0,0 ` +
    `Q ${midX},${midY} ${tipX},${tipY} ` +
    `C ${w + tipX * 0.25},${-len * 0.52} ${w * 0.75},${-len * 0.16} 0,0 Z`;

  // Soft internal veins that terminate safely inside the leaf (0.50 of width)
  let veins = '';
  const veinCount = 4;
  for (let i = 1; i <= veinCount; i++) {
    const t = i / (veinCount + 1);
    const vx = midX * (t * 1.5);
    const vy = -len * t;
    const span = Math.sin(t * Math.PI) * w * 0.45;
    const lx = vx - span;
    const ly = vy - len * 0.09;
    const rx = vx + span;
    const ry = vy - len * 0.09;

    veins += `<path d="M ${vx.toFixed(1)},${vy.toFixed(1)} Q ${(vx - span * 0.3).toFixed(1)},${(vy - len * 0.05).toFixed(1)} ${lx.toFixed(1)},${ly.toFixed(1)}" fill="none" stroke="${veinColor}" stroke-width="0.65" opacity="0.45"/>`;
    veins += `<path d="M ${vx.toFixed(1)},${vy.toFixed(1)} Q ${(vx + span * 0.3).toFixed(1)},${(vy - len * 0.05).toFixed(1)} ${rx.toFixed(1)},${ry.toFixed(1)}" fill="none" stroke="${veinColor}" stroke-width="0.65" opacity="0.45"/>`;
  }

  return `
  <g transform="translate(${cx}, ${cy}) rotate(${rot})">
    <!-- Short natural petiole stem -->
    <path d="M 0,${len * 0.10} Q 0,${len * 0.04} 0,0" fill="none" stroke="${stemColor}" stroke-width="1.8" stroke-linecap="round"/>
    <!-- Left Blade (highlight) -->
    <path d="${lPath}" fill="url(#${hlGradId})" stroke="${stemColor}" stroke-width="0.4" opacity="0.95"/>
    <!-- Right Blade (shadow) -->
    <path d="${rPath}" fill="url(#${shGradId})" stroke="${stemColor}" stroke-width="0.4" opacity="0.95"/>
    <!-- Central Midrib Vein -->
    <path d="M 0,0 Q ${midX.toFixed(1)},${midY.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)}" fill="none" stroke="${stemColor}" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>
    <!-- Soft internal veins -->
    ${veins}
  </g>
  `;
}

// 3-Leaf Sprig (Classic wedding foliage accent)
function renderBotanicalSprig(cx, cy, len, rot = 0, hlGradId, shGradId, stemColor, veinColor) {
  const lateralLen = len * 0.72;
  const lateralW = lateralLen * 0.36;
  const mainW = len * 0.36;

  return `
  <g transform="translate(${cx}, ${cy}) rotate(${rot})">
    <path d="M 0,${len * 0.22} Q 2,${len * 0.08} 0,0" fill="none" stroke="${stemColor}" stroke-width="1.8" stroke-linecap="round"/>
    
    <g transform="translate(0, ${-len * 0.10})">
      <path d="M 0,0 Q -6,-3 -12,-6" fill="none" stroke="${stemColor}" stroke-width="1.2" stroke-linecap="round"/>
      ${renderBotanicalLeaf(-12, -6, lateralLen, lateralW, -0.14, -42, hlGradId, shGradId, stemColor, veinColor)}
    </g>

    <g transform="translate(0, ${-len * 0.18})">
      <path d="M 0,0 Q 6,-3 12,-6" fill="none" stroke="${stemColor}" stroke-width="1.2" stroke-linecap="round"/>
      ${renderBotanicalLeaf(12, -6, lateralLen, lateralW, 0.14, 38, hlGradId, shGradId, stemColor, veinColor)}
    </g>

    ${renderBotanicalLeaf(0, 0, len, mainW, 0.06, 0, hlGradId, shGradId, stemColor, veinColor)}
  </g>
  `;
}

// Long Cascading Garland Branch with Lush Realistic Foliage
function renderBotanicalBranch(cx, cy, len, rot = 0, hlGradId, shGradId, stemColor, veinColor) {
  let s = `<g transform="translate(${cx}, ${cy}) rotate(${rot})">`;
  
  // Arching central stem
  s += `<path d="M 0,0 Q 24,${-len * 0.45} 8,${-len}" fill="none" stroke="${stemColor}" stroke-width="2.2" stroke-linecap="round"/>`;

  // Natural alternating nodes
  const nodes = [
    { t: 0.15, side: -1, l: len * 0.35, w: len * 0.12, curve: -0.15, rot: -46 },
    { t: 0.28, side:  1, l: len * 0.37, w: len * 0.13, curve:  0.14, rot:  42 },
    { t: 0.42, side: -1, l: len * 0.38, w: len * 0.13, curve: -0.14, rot: -38 },
    { t: 0.56, side:  1, l: len * 0.36, w: len * 0.12, curve:  0.12, rot:  35 },
    { t: 0.70, side: -1, l: len * 0.32, w: len * 0.11, curve: -0.10, rot: -28 },
    { t: 0.84, side:  1, l: len * 0.28, w: len * 0.10, curve:  0.10, rot:  24 },
  ];

  for (const n of nodes) {
    const y = -len * n.t;
    const x = 24 * Math.sin(n.t * Math.PI * 0.85);
    const petioleLen = 8;
    const px = x + n.side * petioleLen;
    const py = y - 3;

    s += `
      <path d="M ${x.toFixed(1)},${y.toFixed(1)} Q ${(x + n.side * 4).toFixed(1)},${(y - 2).toFixed(1)} ${px.toFixed(1)},${py.toFixed(1)}" 
            fill="none" stroke="${stemColor}" stroke-width="1.3" stroke-linecap="round"/>
      ${renderBotanicalLeaf(px, py, n.l, n.w, n.curve, n.rot, hlGradId, shGradId, stemColor, veinColor)}
    `;
  }

  // Tip leaf
  s += `${renderBotanicalLeaf(8, -len, len * 0.28, len * 0.09, 0.04, 6, hlGradId, shGradId, stemColor, veinColor)}`;
  s += `</g>`;
  return s;
}

async function testBranch() {
  const svg = `
  <svg width="600" height="700" viewBox="0 0 600 700" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hl" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#b6d9b8"/>
        <stop offset="50%" stop-color="#72a877"/>
        <stop offset="100%" stop-color="#3d6c44"/>
      </linearGradient>
      <linearGradient id="sh" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#55885c"/>
        <stop offset="65%" stop-color="#2d5233"/>
        <stop offset="100%" stop-color="#18331d"/>
      </linearGradient>
    </defs>
    <rect width="600" height="700" fill="#fcfbf7"/>
    ${renderBotanicalBranch(300, 620, 520, 0, 'hl', 'sh', '#18331d', '#18331d')}
  </svg>
  `;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync('scratch/test_botanical_branch.png', buf);
  console.log('Saved scratch/test_botanical_branch.png');
}

testBranch().catch(console.error);

