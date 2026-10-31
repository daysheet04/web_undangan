import fs from 'node:fs';
import sharp from 'sharp';

function renderPerfectLeaf(cx, cy, len, w, curve = 0.1, rot = 0, hlGradId, shGradId, stemColor, veinColor) {
  const tipX = curve * len * 0.45;
  const tipY = -len;
  const midX = tipX * 0.42;
  const midY = -len * 0.50;

  // Single smooth cubic bezier for outer margins = 100% natural, elegant leaf!
  // Left half (highlight side)
  const lPath = `M 0,0 ` +
    `C ${-w * 0.75},${-len * 0.16} ${-w + tipX * 0.25},${-len * 0.52} ${tipX},${tipY} ` +
    `Q ${midX},${midY} 0,0 Z`;

  // Right half (shadow side)
  const rPath = `M 0,0 ` +
    `Q ${midX},${midY} ${tipX},${tipY} ` +
    `C ${w + tipX * 0.25},${-len * 0.52} ${w * 0.75},${-len * 0.16} 0,0 Z`;

  // Secondary veins branching gently at 40 degrees inside the leaf
  let veins = '';
  const veinCount = 5;
  for (let i = 1; i <= veinCount; i++) {
    const t = i / (veinCount + 1);
    const vx = tipX * Math.pow(t, 1.2);
    const vy = -len * t;
    const span = Math.sin(t * Math.PI) * w * 0.72;
    // Left vein: angle upwards towards tip
    const lx = vx - span;
    const ly = vy - len * 0.08;
    // Right vein: angle upwards towards tip
    const rx = vx + span;
    const ry = vy - len * 0.08;

    veins += `<path d="M ${vx.toFixed(1)},${vy.toFixed(1)} Q ${(vx - span * 0.4).toFixed(1)},${(vy - len * 0.05).toFixed(1)} ${lx.toFixed(1)},${ly.toFixed(1)}" fill="none" stroke="${veinColor}" stroke-width="0.7" opacity="0.45"/>`;
    veins += `<path d="M ${vx.toFixed(1)},${vy.toFixed(1)} Q ${(vx + span * 0.4).toFixed(1)},${(vy - len * 0.05).toFixed(1)} ${rx.toFixed(1)},${ry.toFixed(1)}" fill="none" stroke="${veinColor}" stroke-width="0.7" opacity="0.45"/>`;
  }

  return `
  <g transform="translate(${cx}, ${cy}) rotate(${rot})">
    <!-- Petiole (leaf stem) -->
    <path d="M 0,${len * 0.12} Q 0,${len * 0.05} 0,0" fill="none" stroke="${stemColor}" stroke-width="2.2" stroke-linecap="round"/>
    <!-- Leaf Blade Highlight Half -->
    <path d="${lPath}" fill="url(#${hlGradId})" stroke="${stemColor}" stroke-width="0.5" opacity="0.96"/>
    <!-- Leaf Blade Shadow Half -->
    <path d="${rPath}" fill="url(#${shGradId})" stroke="${stemColor}" stroke-width="0.5" opacity="0.96"/>
    <!-- Midrib Center Vein -->
    <path d="M 0,0 Q ${midX.toFixed(1)},${midY.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)}" fill="none" stroke="${stemColor}" stroke-width="1.3" stroke-linecap="round" opacity="0.85"/>
    <!-- Veins -->
    ${veins}
  </g>
  `;
}

// Foliage Branch
function renderPerfectBranch(cx, cy, len, rot = 0, hlGradId, shGradId, stemColor, veinColor) {
  let s = `<g transform="translate(${cx}, ${cy}) rotate(${rot})">`;
  s += `<path d="M 0,0 Q 24,${-len * 0.5} 8,${-len}" fill="none" stroke="${stemColor}" stroke-width="2.2" stroke-linecap="round"/>`;

  // Alternating realistic leaves along branch
  const nodes = [
    { t: 0.16, side: -1, l: len * 0.32, w: len * 0.12, rot: -44 },
    { t: 0.28, side:  1, l: len * 0.34, w: len * 0.13, rot:  42 },
    { t: 0.42, side: -1, l: len * 0.35, w: len * 0.13, rot: -38 },
    { t: 0.56, side:  1, l: len * 0.33, w: len * 0.12, rot:  36 },
    { t: 0.70, side: -1, l: len * 0.30, w: len * 0.11, rot: -30 },
    { t: 0.84, side:  1, l: len * 0.26, w: len * 0.09, rot:  26 },
  ];

  for (const n of nodes) {
    const y = -len * n.t;
    const x = 24 * Math.sin(n.t * Math.PI * 0.85);
    const petioleLen = 8;
    const px = x + n.side * petioleLen;
    const py = y - 4;

    s += `
      <path d="M ${x.toFixed(1)},${y.toFixed(1)} Q ${(x + n.side * 4).toFixed(1)},${(y - 2).toFixed(1)} ${px.toFixed(1)},${py.toFixed(1)}" fill="none" stroke="${stemColor}" stroke-width="1.4" stroke-linecap="round"/>
      ${renderPerfectLeaf(px, py, n.l, n.w, n.side * 0.12, n.rot, hlGradId, shGradId, stemColor, veinColor)}
    `;
  }
  // Tip leaf
  s += `${renderPerfectLeaf(8, -len, len * 0.26, len * 0.09, 0.04, 6, hlGradId, shGradId, stemColor, veinColor)}`;
  s += `</g>`;
  return s;
}

async function test() {
  const svg = `
  <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hl" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a8d4ad"/>
        <stop offset="50%" stop-color="#6ea375"/>
        <stop offset="100%" stop-color="#3d6c44"/>
      </linearGradient>
      <linearGradient id="sh" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#55885c"/>
        <stop offset="65%" stop-color="#2d5233"/>
        <stop offset="100%" stop-color="#19331e"/>
      </linearGradient>
    </defs>
    <rect width="800" height="800" fill="#fcfbf7"/>
    ${renderPerfectLeaf(200, 600, 220, 75, 0.15, -15, 'hl', 'sh', '#19331e', '#19331e')}
    ${renderPerfectBranch(500, 700, 500, -10, 'hl', 'sh', '#19331e', '#19331e')}
  </svg>
  `;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync('scratch/test_perfect_leaf.png', buf);
  console.log('Saved scratch/test_perfect_leaf.png');
}

test().catch(console.error);

