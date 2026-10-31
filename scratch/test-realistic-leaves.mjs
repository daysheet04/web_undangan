import fs from 'node:fs';
import sharp from 'sharp';

/**
 * Test script for hyper-realistic botanical leaves
 */

function renderRealisticLeaf(cx, cy, len, w, curve = 0.1, rot = 0, hlGradId, shGradId, stemColor, veinColor) {
  const tipX = curve * len * 0.55;
  const tipY = -len;
  const midX = tipX * 0.45;
  const midY = -len * 0.50;

  // Left & right belly widths (slightly asymmetric for natural look)
  const lWidth = w * 1.05;
  const rWidth = w * 0.95;

  const leftPath = `M 0,0 ` +
    `C ${-lWidth * 0.6},${-len * 0.14} ${-lWidth + midX * 0.25},${-len * 0.40} ${midX - lWidth * 0.1},${midY} ` +
    `C ${midX - lWidth * 0.5},${-len * 0.72} ${tipX - w * 0.25},${-len * 0.92} ${tipX},${tipY} ` +
    `Q ${midX * 0.8},${midY * 0.8} 0,0 Z`;

  const rightPath = `M 0,0 ` +
    `Q ${midX * 0.8},${midY * 0.8} ${tipX},${tipY} ` +
    `C ${tipX + w * 0.25},${-len * 0.92} ${midX + rWidth * 0.5},${-len * 0.72} ${midX + rWidth * 0.1},${midY} ` +
    `C ${rWidth + midX * 0.25},${-len * 0.40} ${rWidth * 0.6},${-len * 0.14} 0,0 Z`;

  // Secondary veins branching from midrib
  let veins = '';
  const veinCount = 4;
  for (let i = 1; i <= veinCount; i++) {
    const t = i / (veinCount + 1);
    const vx = midX * t * 1.2;
    const vy = -len * t;
    const factor = Math.sin(t * Math.PI);
    const lx = vx - lWidth * 0.7 * factor;
    const ly = vy - len * 0.08;
    const rx = vx + rWidth * 0.7 * factor;
    const ry = vy - len * 0.08;
    veins += `<path d="M ${vx.toFixed(1)},${vy.toFixed(1)} Q ${(vx - 2).toFixed(1)},${(vy - 3).toFixed(1)} ${lx.toFixed(1)},${ly.toFixed(1)}" fill="none" stroke="${veinColor}" stroke-width="0.65" opacity="0.65"/>`;
    veins += `<path d="M ${vx.toFixed(1)},${vy.toFixed(1)} Q ${(vx + 2).toFixed(1)},${(vy - 3).toFixed(1)} ${rx.toFixed(1)},${ry.toFixed(1)}" fill="none" stroke="${veinColor}" stroke-width="0.65" opacity="0.65"/>`;
  }

  return `
  <g transform="translate(${cx}, ${cy}) rotate(${rot})">
    <!-- Petiole / small stem base -->
    <path d="M 0,${len * 0.08} Q 0,${len * 0.04} 0,0" fill="none" stroke="${stemColor}" stroke-width="1.8" stroke-linecap="round"/>
    <!-- Left Leaf Blade (Highlight side) -->
    <path d="${leftPath}" fill="url(#${hlGradId})" stroke="${stemColor}" stroke-width="0.5" opacity="0.96"/>
    <!-- Right Leaf Blade (Shadow side) -->
    <path d="${rightPath}" fill="url(#${shGradId})" stroke="${stemColor}" stroke-width="0.5" opacity="0.96"/>
    <!-- Central Midrib Vein -->
    <path d="M 0,0 Q ${midX.toFixed(1)},${midY.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)}" fill="none" stroke="${stemColor}" stroke-width="1.2" stroke-linecap="round" opacity="0.85"/>
    <!-- Lateral Veins -->
    ${veins}
  </g>
  `;
}

// Realistic Leaf Trio (Signature botanical rose leaf sprig: terminal leaflet + 2 lateral leaflets)
function renderRealisticLeafTrio(cx, cy, len, rot = 0, hlGradId, shGradId, stemColor, veinColor) {
  const lateralLen = len * 0.72;
  const lateralW = lateralLen * 0.36;
  const mainW = len * 0.36;

  return `
  <g transform="translate(${cx}, ${cy}) rotate(${rot})">
    <!-- Branch stem -->
    <path d="M 0,${len * 0.25} Q 2,${len * 0.10} 0,0" fill="none" stroke="${stemColor}" stroke-width="2.0" stroke-linecap="round"/>
    
    <!-- Left lateral leaflet -->
    <g transform="translate(0, ${-len * 0.12})">
      <path d="M 0,0 Q -8,-3 -14,-7" fill="none" stroke="${stemColor}" stroke-width="1.4" stroke-linecap="round"/>
      ${renderRealisticLeaf(-14, -7, lateralLen, lateralW, -0.15, -42, hlGradId, shGradId, stemColor, veinColor)}
    </g>

    <!-- Right lateral leaflet -->
    <g transform="translate(0, ${-len * 0.20})">
      <path d="M 0,0 Q 8,-3 14,-7" fill="none" stroke="${stemColor}" stroke-width="1.4" stroke-linecap="round"/>
      ${renderRealisticLeaf(14, -7, lateralLen, lateralW, 0.15, 38, hlGradId, shGradId, stemColor, veinColor)}
    </g>

    <!-- Terminal main leaflet -->
    ${renderRealisticLeaf(0, 0, len, mainW, 0.08, 0, hlGradId, shGradId, stemColor, veinColor)}
  </g>
  `;
}

// Realistic Lush Foliage Branch (Lush, layered branch with alternating realistic pointed leaves)
function renderRealisticLeafBranch(cx, cy, len, rot = 0, hlGradId, shGradId, stemColor, veinColor) {
  let s = `<g transform="translate(${cx}, ${cy}) rotate(${rot})">`;
  
  // Arching central branch stem
  s += `<path d="M 0,0 Q 22,${-len * 0.45} 8,${-len}" fill="none" stroke="${stemColor}" stroke-width="2.2" stroke-linecap="round"/>`;

  // Nodes along branch with alternating realistic leaves
  const nodes = [
    { t: 0.14, side: -1, l: len * 0.35, w: len * 0.13, curve: -0.16, rot: -46 },
    { t: 0.26, side:  1, l: len * 0.36, w: len * 0.13, curve:  0.15, rot:  42 },
    { t: 0.38, side: -1, l: len * 0.38, w: len * 0.14, curve: -0.14, rot: -38 },
    { t: 0.50, side:  1, l: len * 0.37, w: len * 0.13, curve:  0.14, rot:  35 },
    { t: 0.63, side: -1, l: len * 0.34, w: len * 0.12, curve: -0.12, rot: -30 },
    { t: 0.76, side:  1, l: len * 0.30, w: len * 0.11, curve:  0.12, rot:  26 },
    { t: 0.88, side: -1, l: len * 0.26, w: len * 0.10, curve: -0.10, rot: -22 },
  ];

  for (const n of nodes) {
    const y = -len * n.t;
    const x = 22 * Math.sin(n.t * Math.PI * 0.85);
    const petioleLen = 10;
    const px = x + n.side * petioleLen * 0.8;
    const py = y - petioleLen * 0.4;

    s += `
      <path d="M ${x.toFixed(1)},${y.toFixed(1)} Q ${(x + n.side * 5).toFixed(1)},${(y - 2).toFixed(1)} ${px.toFixed(1)},${py.toFixed(1)}" 
            fill="none" stroke="${stemColor}" stroke-width="1.4" stroke-linecap="round"/>
      ${renderRealisticLeaf(px, py, n.l, n.w, n.curve, n.rot, hlGradId, shGradId, stemColor, veinColor)}
    `;
  }

  // Terminal leaf at tip
  s += `${renderRealisticLeaf(8, -len, len * 0.28, len * 0.10, 0.05, 6, hlGradId, shGradId, stemColor, veinColor)}`;
  s += `</g>`;
  return s;
}

// Test individual leaf render
async function testSingle() {
  const svg = `
  <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hl" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#b2d6b6"/>
        <stop offset="50%" stop-color="#6ea374"/>
        <stop offset="100%" stop-color="#3d6c44"/>
      </linearGradient>
      <linearGradient id="sh" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#55885c"/>
        <stop offset="65%" stop-color="#2d5233"/>
        <stop offset="100%" stop-color="#19331e"/>
      </linearGradient>
    </defs>
    <rect width="600" height="600" fill="#fdfbf7"/>
    ${renderRealisticLeaf(150, 450, 180, 56, 0.14, 0, 'hl', 'sh', '#19331e', '#19331e')}
    ${renderRealisticLeafTrio(350, 450, 150, 0, 'hl', 'sh', '#19331e', '#19331e')}
  </svg>
  `;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync('scratch/test_single_realistic_leaf.png', buf);
  console.log('Saved scratch/test_single_realistic_leaf.png');
}

testSingle().catch(console.error);

