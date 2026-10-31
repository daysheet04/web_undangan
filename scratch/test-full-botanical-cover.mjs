import fs from 'node:fs';
import sharp from 'sharp';
import { getSpaciousCenterFrameSvg } from './test-inside-frame.mjs';

// Palette configuration per theme
function getAestheticCoverPalette(themeKey = 'verdant_vow') {
  if (themeKey.includes('jawi') || themeKey.includes('java')) {
    return {
      roseOuter1: '#fff5f7',
      roseOuter2: '#fcd3dc',
      roseMid1: '#f8b4c4',
      roseMid2: '#ea869e',
      roseDeep1: '#c44d68',
      roseDeep2: '#8c243a',
      floretPetal: '#fff2f5',
      floretCenter: '#c2963e',
      leafHl: '#b3d4b6',
      leafMid: '#6fa374',
      leafDeep: '#335c39',
      leafShadow: '#1c3821',
      stem: '#2b472e',
      goldLeaf: '#d4af37',
      goldAccent: '#c2963e',
    };
  } else if (themeKey.includes('lunara') || themeKey.includes('azure')) {
    return {
      roseOuter1: '#f4f8fd',
      roseOuter2: '#d4e4f7',
      roseMid1: '#acc8ea',
      roseMid2: '#7fa8d6',
      roseDeep1: '#4a7cb3',
      roseDeep2: '#234a78',
      floretPetal: '#f0f6fc',
      floretCenter: '#8ca7c7',
      leafHl: '#b0d1db',
      leafMid: '#699fb0',
      leafDeep: '#345e6d',
      leafShadow: '#193640',
      stem: '#20414d',
      goldLeaf: '#b0c4de',
      goldAccent: '#7a96b8',
    };
  } else if (themeKey.includes('aurelia') || themeKey.includes('grande')) {
    return {
      roseOuter1: '#fffdf8',
      roseOuter2: '#faecd6',
      roseMid1: '#f4d5a6',
      roseMid2: '#e5b66d',
      roseDeep1: '#bf8332',
      roseDeep2: '#804f14',
      floretPetal: '#fffcf5',
      floretCenter: '#d4af37',
      leafHl: '#c5dba8',
      leafMid: '#86a867',
      leafDeep: '#4d6934',
      leafShadow: '#283b18',
      stem: '#364d23',
      goldLeaf: '#e5b842',
      goldAccent: '#c59a30',
    };
  } else {
    // Verdant Vow: Soft champagne-blush & ivory roses, rich botanical sage foliage
    return {
      roseOuter1: '#fffdf9',
      roseOuter2: '#f7ebe1',
      roseMid1: '#eed5c2',
      roseMid2: '#dfb79e',
      roseDeep1: '#bf8b6c',
      roseDeep2: '#8c593b',
      floretPetal: '#fffaf4',
      floretCenter: '#c5a059',
      leafHl: '#b8dcba',
      leafMid: '#74a87b',
      leafDeep: '#3d6e46',
      leafShadow: '#1e4024',
      stem: '#264a2c',
      goldLeaf: '#d4af37',
      goldAccent: '#c5a059',
    };
  }
}

// 1. Organic Garden Rose
export function renderWatercolorGardenRose(cx, cy, scale, rotDeg, prefix, p, themeKey) {
  return `
  <g transform="translate(${cx}, ${cy}) rotate(${rotDeg}) scale(${scale})">
    <path d="M -15,-35 C -45,-65 -75,-30 -60,10 C -48,22 -25,25 -10,0 Z" 
          fill="url(#cov-${prefix}-outer-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.75" opacity="0.95"/>
    <path d="M -25,-30 C -20,-75 35,-78 45,-38 C 48,-20 20,-10 0,-15 Z" 
          fill="url(#cov-${prefix}-outer-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.75" opacity="0.95"/>
    <path d="M 20,-30 C 65,-60 85,-15 70,25 C 60,35 30,20 15,0 Z" 
          fill="url(#cov-${prefix}-outer-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.75" opacity="0.95"/>
    <path d="M 25,10 C 75,25 65,75 15,70 C -10,65 5,35 0,15 Z" 
          fill="url(#cov-${prefix}-outer-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.75" opacity="0.95"/>
    <path d="M -20,20 C -15,72 40,78 30,35 C 25,15 -5,10 -15,20 Z" 
          fill="url(#cov-${prefix}-outer-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.75" opacity="0.95"/>
    <path d="M -15,15 C -65,45 -70,-5 -35,-15 C -20,-5 -10,5 -15,15 Z" 
          fill="url(#cov-${prefix}-outer-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.75" opacity="0.95"/>

    <path d="M -28,-18 C -52,-42 -40,-60 -8,-45 C 5,-35 -5,-15 -28,-18 Z" 
          fill="url(#cov-${prefix}-mid-${themeKey})" stroke="rgba(255,255,255,0.5)" stroke-width="0.6" opacity="0.96"/>
    <path d="M 5,-32 C 38,-55 58,-32 40,-8 C 30,2 10,-10 5,-32 Z" 
          fill="url(#cov-${prefix}-mid-${themeKey})" stroke="rgba(255,255,255,0.5)" stroke-width="0.6" opacity="0.96"/>
    <path d="M 22,-8 C 55,2 52,42 18,36 C 5,30 10,10 22,-8 Z" 
          fill="url(#cov-${prefix}-mid-${themeKey})" stroke="rgba(255,255,255,0.5)" stroke-width="0.6" opacity="0.96"/>
    <path d="M -10,18 C 15,50 38,38 20,12 C 5,2 -5,5 -10,18 Z" 
          fill="url(#cov-${prefix}-mid-${themeKey})" stroke="rgba(255,255,255,0.5)" stroke-width="0.6" opacity="0.96"/>
    <path d="M -30,5 C -55,28 -32,48 -5,22 C 2,12 -12,2 -30,5 Z" 
          fill="url(#cov-${prefix}-mid-${themeKey})" stroke="rgba(255,255,255,0.5)" stroke-width="0.6" opacity="0.96"/>

    <path d="M -18,-12 C -30,-32 -10,-40 8,-26 C 15,-18 -2,-8 -18,-12 Z" 
          fill="url(#cov-${prefix}-inner-${themeKey})" opacity="0.97"/>
    <path d="M 10,-20 C 32,-18 35,10 14,14 C 2,16 2,-5 10,-20 Z" 
          fill="url(#cov-${prefix}-inner-${themeKey})" opacity="0.97"/>
    <path d="M -12,8 C 2,28 24,20 10,2 C 2,-5 -8,0 -12,8 Z" 
          fill="url(#cov-${prefix}-inner-${themeKey})" opacity="0.97"/>
    <path d="M -22,-2 C -28,15 -10,20 -4,5 C 0,-4 -12,-8 -22,-2 Z" 
          fill="url(#cov-${prefix}-inner-${themeKey})" opacity="0.97"/>

    <path d="M -10,-6 C -16,-18 8,-20 12,-8 C 14,0 -2,6 -10,-6 Z" 
          fill="url(#cov-${prefix}-deep-${themeKey})" opacity="0.98"/>
    <path d="M -6,-2 C -10,10 12,12 8,-2 C 5,-8 -2,-6 -6,-2 Z" 
          fill="url(#cov-${prefix}-deep-${themeKey})" opacity="0.98"/>
    
    <path d="M -5,-3 C -2,-9 6,-7 5,-1 C 4,4 -3,4 -2,-1 C -1,-4 3,-3 2,-1" 
          fill="none" stroke="${p.roseDeep2}" stroke-width="1.2" stroke-linecap="round"/>
    
    <circle cx="2" cy="-2" r="1.4" fill="${p.goldAccent}" opacity="0.85"/>
    <circle cx="-3" cy="1" r="1.1" fill="${p.goldAccent}" opacity="0.85"/>
    <circle cx="4" cy="2" r="1.0" fill="${p.goldAccent}" opacity="0.75"/>
    <circle cx="-1" cy="-5" r="1.2" fill="${p.goldAccent}" opacity="0.8"/>
  </g>
  `;
}

// 2. Semi-open Rose
export function renderWatercolorRoseSide(cx, cy, scale, rotDeg, prefix, p, themeKey) {
  return `
  <g transform="translate(${cx}, ${cy}) rotate(${rotDeg}) scale(${scale})">
    <path d="M -25,-10 C -45,-45 10,-55 25,-25 C 20,-10 -5,-5 -25,-10 Z" 
          fill="url(#cov-${prefix}-outer-${themeKey})" opacity="0.9"/>
    <path d="M 15,-20 C 45,-40 60,-5 35,15 C 20,10 10,-5 15,-20 Z" 
          fill="url(#cov-${prefix}-outer-${themeKey})" opacity="0.9"/>

    <path d="M -35,5 C -50,40 10,65 35,35 C 45,20 15,10 -35,5 Z" 
          fill="url(#cov-${prefix}-mid-${themeKey})" stroke="rgba(255,255,255,0.5)" stroke-width="0.6" opacity="0.95"/>
    <path d="M -20,15 C -15,55 30,50 30,22 C 15,12 -5,10 -20,15 Z" 
          fill="url(#cov-${prefix}-inner-${themeKey})" opacity="0.96"/>

    <path d="M -15,-5 C -22,-25 15,-28 18,-6 C 20,8 -5,12 -15,-5 Z" 
          fill="url(#cov-${prefix}-deep-${themeKey})" opacity="0.98"/>
    <path d="M -8,-2 C -12,-14 10,-15 10,-2 C 8,6 -4,7 -8,-2 Z" 
          fill="none" stroke="${p.roseDeep2}" stroke-width="1.3" stroke-linecap="round"/>
    
    <path d="M -25,25 C -45,35 -50,20 -42,10 C -32,15 -25,20 -25,25 Z" 
          fill="${p.leafMid}" opacity="0.85"/>
    <path d="M -10,45 C -15,62 -2,65 5,50 C 2,42 -4,40 -10,45 Z" 
          fill="${p.leafDeep}" opacity="0.85"/>
  </g>
  `;
}

// 3. Rosebud
export function renderWatercolorBud(cx, cy, scale, rotDeg, prefix, p, themeKey) {
  return `
  <g transform="translate(${cx}, ${cy}) rotate(${rotDeg}) scale(${scale})">
    <path d="M 0,18 C 0,30 5,42 8,50" fill="none" stroke="${p.stem}" stroke-width="2.0" stroke-linecap="round"/>
    <path d="M -10,10 C -18,-15 0,-32 0,-32 C 0,-32 18,-15 10,10 Z" 
          fill="url(#cov-${prefix}-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.5"/>
    <path d="M -6,5 C -10,-12 0,-25 0,-25 C 0,-25 10,-12 6,5 Z" 
          fill="url(#cov-${prefix}-deep-${themeKey})" opacity="0.95"/>
    <path d="M -10,14 C -22,0 -20,-20 -15,-26 C -12,-12 -6,5 -2,12 Z" 
          fill="${p.leafDeep}" opacity="0.92"/>
    <path d="M 8,14 C 20,2 22,-18 16,-28 C 12,-14 6,5 2,12 Z" 
          fill="${p.leafMid}" opacity="0.92"/>
    <ellipse cx="0" cy="14" rx="7" ry="5" fill="${p.leafDeep}"/>
  </g>
  `;
}

// 4. Floret
export function renderWatercolorFloret(cx, cy, scale, rotDeg, p) {
  return `
  <g transform="translate(${cx}, ${cy}) rotate(${rotDeg}) scale(${scale})">
    <path d="M 0,0 C -8,-15 -2,-25 0,-25 C 2,-25 8,-15 0,0 Z" fill="${p.floretPetal}" stroke="rgba(255,255,255,0.7)" stroke-width="0.4" opacity="0.92"/>
    <path d="M 0,0 C 15,-8 25,-2 25,0 C 25,2 15,8 0,0 Z" transform="rotate(72)" fill="${p.floretPetal}" stroke="rgba(255,255,255,0.7)" stroke-width="0.4" opacity="0.92"/>
    <path d="M 0,0 C 15,-8 25,-2 25,0 C 25,2 15,8 0,0 Z" transform="rotate(144)" fill="${p.floretPetal}" stroke="rgba(255,255,255,0.7)" stroke-width="0.4" opacity="0.92"/>
    <path d="M 0,0 C 15,-8 25,-2 25,0 C 25,2 15,8 0,0 Z" transform="rotate(216)" fill="${p.floretPetal}" stroke="rgba(255,255,255,0.7)" stroke-width="0.4" opacity="0.92"/>
    <path d="M 0,0 C 15,-8 25,-2 25,0 C 25,2 15,8 0,0 Z" transform="rotate(288)" fill="${p.floretPetal}" stroke="rgba(255,255,255,0.7)" stroke-width="0.4" opacity="0.92"/>
    <circle cx="0" cy="0" r="2.8" fill="${p.floretCenter}"/>
    <circle cx="-0.6" cy="-0.6" r="1.0" fill="#ffffff" opacity="0.8"/>
  </g>
  `;
}

// 5. Gold Twig
export function renderGoldTwig(cx, cy, len, rotDeg, p) {
  let s = `<g transform="translate(${cx}, ${cy}) rotate(${rotDeg})">`;
  s += `<path d="M 0,0 Q 15,${-len * 0.5} 0,${-len}" fill="none" stroke="${p.goldAccent}" stroke-width="1.2" stroke-linecap="round" opacity="0.85"/>`;

  const twigs = [0.25, 0.50, 0.75, 0.95];
  for (const t of twigs) {
    const y = -len * t;
    const x = 15 * Math.sin(t * Math.PI);
    s += `
      <path d="M ${x.toFixed(1)},${y.toFixed(1)} Q ${(x - 12).toFixed(1)},${(y - 8).toFixed(1)} ${(x - 18).toFixed(1)},${(y - 12).toFixed(1)}" 
            fill="none" stroke="${p.goldAccent}" stroke-width="1.0" opacity="0.8"/>
      <circle cx="${(x - 18).toFixed(1)}" cy="${(y - 12).toFixed(1)}" r="2.2" fill="${p.goldLeaf}"/>
      <path d="M ${x.toFixed(1)},${(y - 5).toFixed(1)} Q ${(x + 12).toFixed(1)},${(y - 14).toFixed(1)} ${(x + 16).toFixed(1)},${(y - 18).toFixed(1)}" 
            fill="none" stroke="${p.goldAccent}" stroke-width="1.0" opacity="0.8"/>
      <circle cx="${(x + 16).toFixed(1)}" cy="${(y - 18).toFixed(1)}" r="2.2" fill="${p.goldLeaf}"/>
    `;
  }
  s += `<circle cx="0" cy="${-len - 3}" r="2.6" fill="${p.goldLeaf}"/>`;
  s += `</g>`;
  return s;
}

// 6. REALISTIC BOTANICAL LEAF (Convex natural leaf blade with midrib vein)
export function renderBotanicalLeaf(cx, cy, len, w, curve = 0.1, rot = 0, hlGradId, shGradId, stemColor) {
  const tipX = curve * len * 0.45;
  const tipY = -len;
  const midX = tipX * 0.42;
  const midY = -len * 0.50;

  const lPath = `M 0,0 ` +
    `C ${-w * 0.75},${-len * 0.16} ${-w + tipX * 0.25},${-len * 0.52} ${tipX},${tipY} ` +
    `Q ${midX},${midY} 0,0 Z`;

  const rPath = `M 0,0 ` +
    `Q ${midX},${midY} ${tipX},${tipY} ` +
    `C ${w + tipX * 0.25},${-len * 0.52} ${w * 0.75},${-len * 0.16} 0,0 Z`;

  return `
  <g transform="translate(${cx}, ${cy}) rotate(${rot})">
    <path d="M 0,${len * 0.10} Q 0,${len * 0.04} 0,0" fill="none" stroke="${stemColor}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="${lPath}" fill="url(#${hlGradId})" stroke="${stemColor}" stroke-width="0.35" opacity="0.96"/>
    <path d="${rPath}" fill="url(#${shGradId})" stroke="${stemColor}" stroke-width="0.35" opacity="0.96"/>
    <path d="M 0,0 Q ${midX.toFixed(1)},${midY.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)}" fill="none" stroke="${stemColor}" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>
  </g>
  `;
}

// 7. Realistic 3-Leaf Sprig
export function renderBotanicalSprig(cx, cy, len, rot = 0, hlGradId, shGradId, stemColor) {
  const lateralLen = len * 0.72;
  const lateralW = lateralLen * 0.35;
  const mainW = len * 0.35;

  return `
  <g transform="translate(${cx}, ${cy}) rotate(${rot})">
    <path d="M 0,${len * 0.22} Q 2,${len * 0.08} 0,0" fill="none" stroke="${stemColor}" stroke-width="1.8" stroke-linecap="round"/>
    
    <g transform="translate(0, ${-len * 0.10})">
      <path d="M 0,0 Q -6,-3 -12,-6" fill="none" stroke="${stemColor}" stroke-width="1.2" stroke-linecap="round"/>
      ${renderBotanicalLeaf(-12, -6, lateralLen, lateralW, -0.14, -44, hlGradId, shGradId, stemColor)}
    </g>

    <g transform="translate(0, ${-len * 0.18})">
      <path d="M 0,0 Q 6,-3 12,-6" fill="none" stroke="${stemColor}" stroke-width="1.2" stroke-linecap="round"/>
      ${renderBotanicalLeaf(12, -6, lateralLen, lateralW, 0.14, 40, hlGradId, shGradId, stemColor)}
    </g>

    ${renderBotanicalLeaf(0, 0, len, mainW, 0.06, 0, hlGradId, shGradId, stemColor)}
  </g>
  `;
}

// 8. Long Realistic Botanical Branch
function renderBotanicalBranch(cx, cy, len, rot = 0, hlGradId, shGradId, stemColor) {
  let s = `<g transform="translate(${cx}, ${cy}) rotate(${rot})">`;
  s += `<path d="M 0,0 Q 22,${-len * 0.45} 8,${-len}" fill="none" stroke="${stemColor}" stroke-width="2.2" stroke-linecap="round"/>`;

  const nodes = [
    { t: 0.14, side: -1, l: len * 0.36, w: len * 0.13, curve: -0.15, rot: -46 },
    { t: 0.27, side:  1, l: len * 0.38, w: len * 0.14, curve:  0.14, rot:  42 },
    { t: 0.41, side: -1, l: len * 0.40, w: len * 0.14, curve: -0.14, rot: -38 },
    { t: 0.55, side:  1, l: len * 0.37, w: len * 0.13, curve:  0.12, rot:  35 },
    { t: 0.69, side: -1, l: len * 0.33, w: len * 0.12, curve: -0.10, rot: -28 },
    { t: 0.83, side:  1, l: len * 0.28, w: len * 0.10, curve:  0.10, rot:  24 },
  ];

  for (const n of nodes) {
    const y = -len * n.t;
    const x = 22 * Math.sin(n.t * Math.PI * 0.85);
    const petioleLen = 8;
    const px = x + n.side * petioleLen;
    const py = y - 3;

    s += `
      <path d="M ${x.toFixed(1)},${y.toFixed(1)} Q ${(x + n.side * 4).toFixed(1)},${(y - 2).toFixed(1)} ${px.toFixed(1)},${py.toFixed(1)}" 
            fill="none" stroke="${stemColor}" stroke-width="1.3" stroke-linecap="round"/>
      ${renderBotanicalLeaf(px, py, n.l, n.w, n.curve, n.rot, hlGradId, shGradId, stemColor)}
    `;
  }

  s += `${renderBotanicalLeaf(8, -len, len * 0.28, len * 0.09, 0.04, 6, hlGradId, shGradId, stemColor)}`;
  s += `</g>`;
  return s;
}

// 9. Slender Olive Branch
function renderOliveBranch(cx, cy, len, rot = 0, hlGradId, shGradId, stemColor) {
  let s = `<g transform="translate(${cx}, ${cy}) rotate(${rot})">`;
  s += `<path d="M 0,0 Q -18,${-len * 0.5} -5,${-len}" fill="none" stroke="${stemColor}" stroke-width="1.8" stroke-linecap="round"/>`;

  const nodes = [
    { t: 0.18, side:  1, l: len * 0.34, w: len * 0.09, curve:  0.10, rot:  36 },
    { t: 0.34, side: -1, l: len * 0.36, w: len * 0.10, curve: -0.10, rot: -34 },
    { t: 0.52, side:  1, l: len * 0.35, w: len * 0.09, curve:  0.08, rot:  30 },
    { t: 0.70, side: -1, l: len * 0.30, w: len * 0.08, curve: -0.08, rot: -26 },
    { t: 0.86, side:  1, l: len * 0.25, w: len * 0.07, curve:  0.06, rot:  20 },
  ];

  for (const n of nodes) {
    const y = -len * n.t;
    const x = -18 * Math.sin(n.t * Math.PI * 0.8);
    const px = x + n.side * 6;
    const py = y - 2;

    s += `
      <path d="M ${x.toFixed(1)},${y.toFixed(1)} Q ${(x + n.side * 3).toFixed(1)},${(y - 1).toFixed(1)} ${px.toFixed(1)},${py.toFixed(1)}" 
            fill="none" stroke="${stemColor}" stroke-width="1.2" stroke-linecap="round"/>
      ${renderBotanicalLeaf(px, py, n.l, n.w, n.curve, n.rot, hlGradId, shGradId, stemColor)}
    `;
  }
  s += `${renderBotanicalLeaf(-5, -len, len * 0.25, len * 0.07, 0.04, -4, hlGradId, shGradId, stemColor)}`;
  s += `</g>`;
  return s;
}

// Complete Half-Frame SVG (700x1000)
export function getRealisticCoverSvg(themeKey = 'verdant_vow', corner = 'tl') {
  const p = getAestheticCoverPalette(themeKey);
  const rot = corner === 'tl' ? 0 : 180;

  return `
  <svg width="700" height="1000" viewBox="0 0 700 1000" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Main Rose Watercolor Gradients -->
      <radialGradient id="cov-r1-outer-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.roseOuter1}"/>
        <stop offset="70%" stop-color="${p.roseOuter2}"/>
        <stop offset="100%" stop-color="${p.roseMid1}"/>
      </radialGradient>
      <radialGradient id="cov-r1-mid-${themeKey}" cx="42%" cy="42%" r="65%">
        <stop offset="0%" stop-color="${p.roseOuter2}"/>
        <stop offset="60%" stop-color="${p.roseMid1}"/>
        <stop offset="100%" stop-color="${p.roseMid2}"/>
      </radialGradient>
      <radialGradient id="cov-r1-inner-${themeKey}" cx="40%" cy="40%" r="65%">
        <stop offset="0%" stop-color="${p.roseMid1}"/>
        <stop offset="65%" stop-color="${p.roseMid2}"/>
        <stop offset="100%" stop-color="${p.roseDeep1}"/>
      </radialGradient>
      <radialGradient id="cov-r1-deep-${themeKey}" cx="38%" cy="38%" r="65%">
        <stop offset="0%" stop-color="${p.roseMid2}"/>
        <stop offset="70%" stop-color="${p.roseDeep1}"/>
        <stop offset="100%" stop-color="${p.roseDeep2}"/>
      </radialGradient>

      <!-- Secondary Rose Gradients -->
      <radialGradient id="cov-r2-outer-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.roseOuter1}"/>
        <stop offset="75%" stop-color="${p.roseOuter2}"/>
        <stop offset="100%" stop-color="${p.roseMid1}"/>
      </radialGradient>
      <radialGradient id="cov-r2-mid-${themeKey}" cx="42%" cy="42%" r="65%">
        <stop offset="0%" stop-color="${p.roseOuter1}"/>
        <stop offset="60%" stop-color="${p.roseOuter2}"/>
        <stop offset="100%" stop-color="${p.roseMid1}"/>
      </radialGradient>
      <radialGradient id="cov-r2-inner-${themeKey}" cx="40%" cy="40%" r="65%">
        <stop offset="0%" stop-color="${p.roseOuter2}"/>
        <stop offset="65%" stop-color="${p.roseMid1}"/>
        <stop offset="100%" stop-color="${p.roseDeep1}"/>
      </radialGradient>
      <radialGradient id="cov-r2-deep-${themeKey}" cx="38%" cy="38%" r="65%">
        <stop offset="0%" stop-color="${p.roseMid1}"/>
        <stop offset="70%" stop-color="${p.roseDeep1}"/>
        <stop offset="100%" stop-color="${p.roseDeep1}"/>
      </radialGradient>

      <!-- Realistic Leaf Gradients (Sage & Olive two-tone) -->
      <linearGradient id="cov-leaf-hl-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafHl}"/>
        <stop offset="60%" stop-color="${p.leafMid}"/>
        <stop offset="100%" stop-color="${p.leafDeep}"/>
      </linearGradient>
      <linearGradient id="cov-leaf-sh-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafMid}"/>
        <stop offset="65%" stop-color="${p.leafDeep}"/>
        <stop offset="100%" stop-color="${p.leafShadow}"/>
      </linearGradient>

      <!-- Corner Mists -->
      <radialGradient id="cov-mist-h-${themeKey}" cx="0%" cy="0%" r="60%">
        <stop offset="0%" stop-color="${p.leafHl}" stop-opacity="0.20"/>
        <stop offset="100%" stop-color="${p.leafHl}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="cov-mist-v-${themeKey}" cx="0%" cy="0%" r="60%">
        <stop offset="0%" stop-color="${p.leafHl}" stop-opacity="0.20"/>
        <stop offset="100%" stop-color="${p.leafHl}" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <g transform="rotate(${rot} 350 500)">
      <!-- Soft background glow -->
      <rect x="0" y="0" width="600" height="150" fill="url(#cov-mist-h-${themeKey})"/>
      <rect x="0" y="0" width="150" height="900" fill="url(#cov-mist-v-${themeKey})"/>

      <!-- ============================================================== -->
      <!-- 1. TOP ARM (Reaches from X: 220 to X: 690 along top margin)   -->
      <!-- ============================================================== -->
      <!-- Main lush botanical branch -->
      ${renderBotanicalBranch(280, 85, 270, 84, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      <!-- Slender olive branch intertwining -->
      ${renderOliveBranch(330, 75, 250, 78, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      <!-- Sprig accents -->
      ${renderBotanicalSprig(420, 65, 120, 82, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderGoldTwig(380, 55, 190, 82, p)}

      <!-- Mid bloom cluster on top arm -->
      ${renderWatercolorRoseSide(460, 85, 0.88, 15, 'r2', p, themeKey)}
      ${renderWatercolorBud(405, 42, 0.85, 75, 'r1', p, themeKey)}
      ${renderWatercolorFloret(420, 115, 1.1, 20, p)}
      ${renderWatercolorFloret(510, 95, 0.95, -15, p)}

      <!-- Outer horizontal extension (reaching past X: 660) -->
      ${renderBotanicalBranch(470, 70, 240, 86, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderOliveBranch(520, 55, 190, 80, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderBotanicalSprig(570, 48, 110, 86, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderGoldTwig(550, 42, 140, 86, p)}
      ${renderWatercolorBud(580, 35, 0.75, 85, 'r2', p, themeKey)}
      ${renderWatercolorFloret(610, 45, 0.9, 35, p)}
      ${renderWatercolorFloret(665, 30, 0.8, -10, p)}

      <!-- ============================================================== -->
      <!-- 2. LEFT ARM (Reaches from Y: 220 to Y: 980 down left margin)   -->
      <!-- ============================================================== -->
      <!-- Upper section of left garland -->
      ${renderBotanicalBranch(85, 280, 270, -6, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderOliveBranch(75, 330, 250, 8, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderBotanicalSprig(65, 420, 120, 2, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderGoldTwig(50, 380, 190, 2, p)}

      <!-- Mid bloom cluster on left arm -->
      ${renderWatercolorGardenRose(85, 470, 0.90, -25, 'r2', p, themeKey)}
      ${renderWatercolorBud(45, 410, 0.85, -25, 'r1', p, themeKey)}
      ${renderWatercolorFloret(115, 405, 1.1, 10, p)}
      ${renderWatercolorFloret(95, 535, 1.0, 45, p)}

      <!-- Mid-lower extension of left arm -->
      ${renderBotanicalBranch(75, 530, 260, -4, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderOliveBranch(65, 570, 230, 6, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderBotanicalSprig(58, 650, 115, -2, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderWatercolorRoseSide(80, 680, 0.82, -35, 'r1', p, themeKey)}
      ${renderGoldTwig(45, 660, 180, -2, p)}
      ${renderWatercolorBud(50, 735, 0.75, -10, 'r2', p, themeKey)}
      ${renderWatercolorFloret(105, 630, 0.95, -20, p)}

      <!-- Bottom tail reaching Y: 980 -->
      ${renderBotanicalBranch(60, 710, 270, -2, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderOliveBranch(55, 750, 230, 4, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderBotanicalSprig(48, 830, 110, 0, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderGoldTwig(40, 810, 150, 0, p)}
      ${renderWatercolorFloret(80, 830, 0.9, 15, p)}
      ${renderWatercolorBud(45, 910, 0.75, 5, 'r1', p, themeKey)}
      ${renderWatercolorFloret(55, 955, 0.8, -10, p)}

      <!-- ============================================================== -->
      <!-- 3. CORNER CENTERPIECE (Grand Majestic Watercolor Blooms)       -->
      <!-- ============================================================== -->
      <!-- Lush diagonal botanical backing -->
      ${renderBotanicalBranch(200, 200, 220, 42, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderOliveBranch(220, 220, 200, 48, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderBotanicalSprig(240, 230, 130, 45, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderGoldTwig(240, 190, 160, 45, p)}

      <!-- Companion Rose Upper Right -->
      ${renderWatercolorRoseSide(240, 130, 0.95, 40, 'r2', p, themeKey)}
      ${renderWatercolorBud(310, 150, 0.85, 60, 'r1', p, themeKey)}

      <!-- Companion Rose Lower Left -->
      ${renderWatercolorGardenRose(130, 240, 0.92, -30, 'r2', p, themeKey)}
      ${renderWatercolorBud(150, 310, 0.85, -45, 'r1', p, themeKey)}

      <!-- Deep Diagonal Rose -->
      ${renderWatercolorRoseSide(255, 230, 0.88, 75, 'r1', p, themeKey)}

      <!-- GRAND HERO AESTHETIC WATERCOLOR ROSE (Centerpiece at 175, 175) -->
      ${renderWatercolorGardenRose(175, 175, 1.35, 12, 'r1', p, themeKey)}

      <!-- Filler Florets & Pearl Clusters around the center -->
      ${renderWatercolorFloret(105, 115, 1.25, 15, p)}
      ${renderWatercolorFloret(305, 115, 1.15, -25, p)}
      ${renderWatercolorFloret(115, 305, 1.15, 35, p)}
      ${renderWatercolorFloret(280, 285, 1.1, -15, p)}
      ${renderWatercolorFloret(190, 265, 1.05, 45, p)}
      ${renderWatercolorFloret(265, 190, 1.05, -30, p)}

      <!-- Floating Gold Stardust Beads along the garland -->
      <circle cx="370" cy="55" r="3.0" fill="${p.goldAccent}"/>
      <circle cx="55" cy="370" r="3.0" fill="${p.goldAccent}"/>
      <circle cx="480" cy="40" r="2.6" fill="${p.goldAccent}"/>
      <circle cx="40" cy="480" r="2.6" fill="${p.goldAccent}"/>
      <circle cx="650" cy="25" r="2.4" fill="${p.goldAccent}"/>
      <circle cx="25" cy="650" r="2.4" fill="${p.goldAccent}"/>
      <circle cx="30" cy="860" r="2.4" fill="${p.goldAccent}"/>
      <circle cx="310" cy="290" r="2.8" fill="${p.goldAccent}"/>
    </g>
  </svg>
  `;
}

async function renderAllThemePreviews() {
  const themes = ['verdant_vow', 'puspa_jawi', 'lunara_azure', 'aurelia_grande'];

  for (const themeKey of themes) {
    const tlSvg = getRealisticCoverSvg(themeKey, 'tl');
    const brSvg = getRealisticCoverSvg(themeKey, 'br');
    const centerFrameSvg = getSpaciousCenterFrameSvg(themeKey);

    let titleColor = '#16221a';
    let nameColor = '#4a6c52';
    let goldColor = '#b8944d';
    let dateColor = '#6c8e74';
    let cardStroke = '#cde0ca';
    let cardDash = '#dceadc';

    if (themeKey.includes('jawi')) {
      titleColor = '#3a121a';
      nameColor = '#94384d';
      goldColor = '#c2963e';
      dateColor = '#ab5b6d';
      cardStroke = '#e8c4cc';
      cardDash = '#f2d8dd';
    } else if (themeKey.includes('lunara')) {
      titleColor = '#102233';
      nameColor = '#3d6c96';
      goldColor = '#7895b8';
      dateColor = '#618eb8';
      cardStroke = '#c4d8e8';
      cardDash = '#dae7f2';
    } else if (themeKey.includes('aurelia')) {
      titleColor = '#2b210e';
      nameColor = '#8c672b';
      goldColor = '#c59a30';
      dateColor = '#ad8949';
      cardStroke = '#e8d9bd';
      cardDash = '#f2e8d3';
    }

    const fullSvg = `
    <svg width="800" height="1131" viewBox="0 0 800 1131" xmlns="http://www.w3.org/2000/svg">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&amp;family=Montserrat:wght@400;600;700&amp;family=Playfair+Display:ital,wght@1,500&amp;display=swap');
        .title-caps { font-family: 'Montserrat', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 5px; fill: ${titleColor}; }
        .name-groom { font-family: 'Great Vibes', cursive, 'Brush Script MT', serif; font-size: 48px; fill: ${nameColor}; }
        .name-ampersand { font-family: 'Playfair Display', serif; font-style: italic; font-size: 26px; fill: ${goldColor}; }
        .name-bride { font-family: 'Great Vibes', cursive, 'Brush Script MT', serif; font-size: 48px; fill: ${nameColor}; }
        .meta-date { font-family: 'Montserrat', sans-serif; font-size: 12.5px; font-weight: 600; letter-spacing: 2.2px; fill: ${dateColor}; }
        .rec-title { font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 500; fill: ${titleColor}; }
        .rec-sub { font-family: 'Playfair Display', serif; font-style: italic; font-size: 14.5px; fill: ${nameColor}; }
        .apology-note { font-family: 'Montserrat', sans-serif; font-size: 11px; font-style: italic; fill: #c0392b; }
      </style>

      <rect width="800" height="1131" fill="#ffffff"/>

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

      <!-- Center Luxury Spacious Crystal Frame (100% Inside) -->
      <g transform="translate(140, 150)">
        ${centerFrameSvg}
      </g>

      <text x="400" y="222" text-anchor="middle" class="title-caps">THE WEDDING</text>
      <text x="400" y="285" text-anchor="middle" class="name-groom">Baskara</text>
      <text x="400" y="330" text-anchor="middle" class="name-ampersand">&amp;</text>
      <text x="400" y="395" text-anchor="middle" class="name-bride">Anindya</text>
      <text x="400" y="475" text-anchor="middle" class="meta-date">SABTU, 31 OKTOBER 2026</text>

      <text x="400" y="650" text-anchor="middle" class="rec-title">Kepada Yth.</text>
      <text x="400" y="674" text-anchor="middle" class="rec-sub">Bapak / Ibu / Saudara / i</text>

      <g transform="translate(180, 700)">
        <rect width="440" height="155" rx="16" fill="#ffffff" stroke="${cardStroke}" stroke-width="1.4"/>
        <rect x="6" y="6" width="428" height="143" rx="12" fill="none" stroke="${cardDash}" stroke-width="0.9" stroke-dasharray="6,4"/>
      </g>

      <text x="400" y="885" text-anchor="middle" class="apology-note">Mohon maaf apabila ada kesalahan dalam penulisan nama / gelar</text>
    </svg>
    `;

    const buf = await sharp(Buffer.from(fullSvg)).png().toBuffer();
    const outPath = `scratch/realistic_cover_${themeKey}.png`;
    fs.writeFileSync(outPath, buf);
    console.log(`Saved ${outPath}`);

    // Update artifacts dir
    const artPath = `C:/Users/dandi120502/.gemini/antigravity/brain/d7e868e7-6d37-4a0e-9209-fdd022e77915/cover_preview_${themeKey}.png`;
    fs.copyFileSync(outPath, artPath);
  }
}

renderAllThemePreviews().catch(console.error);
