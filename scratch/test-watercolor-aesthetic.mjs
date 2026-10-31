import fs from 'node:fs';
import sharp from 'sharp';

/**
 * High-Aesthetic Watercolor & Botanical Floral System
 * Organic, soft-edged, hand-crafted vector shapes without rigid math radial symmetry.
 */

// Palette configuration per theme
export function getAestheticPalette(themeKey = 'verdant_vow') {
  if (themeKey.includes('jawi') || themeKey.includes('java')) {
    return {
      // Puspa Jawi: Soft blush roses, dusty rose, warm marsala, soft sage & eucalyptus
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
      goldTrans: 'rgba(212, 175, 55, 0.45)',
    };
  } else if (themeKey.includes('lunara') || themeKey.includes('azure')) {
    return {
      // Lunara Azure: Soft misty blue, dusty slate, ice blue, eucalyptus blue-green
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
      goldTrans: 'rgba(176, 196, 222, 0.45)',
    };
  } else if (themeKey.includes('aurelia') || themeKey.includes('grande')) {
    return {
      // Aurelia Grande: Warm ivory, champagne, honey gold, warm bronze, olive foliage
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
      goldTrans: 'rgba(229, 184, 66, 0.45)',
    };
  } else {
    // Verdant Vow: Soft champagne-white & ivory blush roses, fresh sage & silver eucalyptus
    return {
      roseOuter1: '#ffffff',
      roseOuter2: '#fbf4eb',
      roseMid1: '#f4e4d3',
      roseMid2: '#e6cbb4',
      roseDeep1: '#bf9b7e',
      roseDeep2: '#8c6b4e',
      floretPetal: '#fffaf4',
      floretCenter: '#c5a059',
      leafHl: '#b8dcba',
      leafMid: '#74a87b',
      leafDeep: '#3d6e46',
      leafShadow: '#1e4024',
      stem: '#264a2c',
      goldLeaf: '#d4af37',
      goldAccent: '#c5a059',
      goldTrans: 'rgba(212, 175, 55, 0.45)',
    };
  }
}

// ORGANIC ENGLISH GARDEN ROSE (Painterly watercolor look)
export function renderWatercolorGardenRose(cx, cy, scale, rotDeg, prefix, p) {
  return `
  <g transform="translate(${cx}, ${cy}) rotate(${rotDeg}) scale(${scale})">
    <!-- Outer Soft Watercolor Shadow Wash -->
    <path d="M -55,-40 C -80,-10 -75,45 -35,65 C 5,80 55,65 70,30 C 85,-5 65,-55 20,-68 C -15,-75 -40,-60 -55,-40 Z"
          fill="url(#${prefix}-outer)" opacity="0.45" filter="url(#soft-blur)"/>

    <!-- Layer 1: Outer Organic Petals (Curling and cupping naturally) -->
    <!-- Top-left outer petal -->
    <path d="M -15,-35 C -45,-65 -75,-30 -60,10 C -48,22 -25,25 -10,0 Z" 
          fill="url(#${prefix}-outer)" stroke="rgba(255,255,255,0.6)" stroke-width="0.75" opacity="0.95"/>
    <!-- Top outer petal -->
    <path d="M -25,-30 C -20,-75 35,-78 45,-38 C 48,-20 20,-10 0,-15 Z" 
          fill="url(#${prefix}-outer)" stroke="rgba(255,255,255,0.6)" stroke-width="0.75" opacity="0.95"/>
    <!-- Top-right outer petal -->
    <path d="M 20,-30 C 65,-60 85,-15 70,25 C 60,35 30,20 15,0 Z" 
          fill="url(#${prefix}-outer)" stroke="rgba(255,255,255,0.6)" stroke-width="0.75" opacity="0.95"/>
    <!-- Bottom-right outer petal -->
    <path d="M 25,10 C 75,25 65,75 15,70 C -10,65 5,35 0,15 Z" 
          fill="url(#${prefix}-outer)" stroke="rgba(255,255,255,0.6)" stroke-width="0.75" opacity="0.95"/>
    <!-- Bottom outer petal -->
    <path d="M -20,20 C -15,72 40,78 30,35 C 25,15 -5,10 -15,20 Z" 
          fill="url(#${prefix}-outer)" stroke="rgba(255,255,255,0.6)" stroke-width="0.75" opacity="0.95"/>
    <!-- Bottom-left outer petal -->
    <path d="M -15,15 C -65,45 -70,-5 -35,-15 C -20,-5 -10,5 -15,15 Z" 
          fill="url(#${prefix}-outer)" stroke="rgba(255,255,255,0.6)" stroke-width="0.75" opacity="0.95"/>

    <!-- Layer 2: Mid Ruffled Petals (overlapping organically with subtle curls) -->
    <path d="M -28,-18 C -52,-42 -40,-60 -8,-45 C 5,-35 -5,-15 -28,-18 Z" 
          fill="url(#${prefix}-mid)" stroke="rgba(255,255,255,0.5)" stroke-width="0.6" opacity="0.96"/>
    <path d="M 5,-32 C 38,-55 58,-32 40,-8 C 30,2 10,-10 5,-32 Z" 
          fill="url(#${prefix}-mid)" stroke="rgba(255,255,255,0.5)" stroke-width="0.6" opacity="0.96"/>
    <path d="M 22,-8 C 55,2 52,42 18,36 C 5,30 10,10 22,-8 Z" 
          fill="url(#${prefix}-mid)" stroke="rgba(255,255,255,0.5)" stroke-width="0.6" opacity="0.96"/>
    <path d="M -10,18 C 15,50 38,38 20,12 C 5,2 -5,5 -10,18 Z" 
          fill="url(#${prefix}-mid)" stroke="rgba(255,255,255,0.5)" stroke-width="0.6" opacity="0.96"/>
    <path d="M -30,5 C -55,28 -32,48 -5,22 C 2,12 -12,2 -30,5 Z" 
          fill="url(#${prefix}-mid)" stroke="rgba(255,255,255,0.5)" stroke-width="0.6" opacity="0.96"/>

    <!-- Layer 3: Inner Cupped Petals (nesting inward) -->
    <path d="M -18,-12 C -30,-32 -10,-40 8,-26 C 15,-18 -2,-8 -18,-12 Z" 
          fill="url(#${prefix}-inner)" opacity="0.97"/>
    <path d="M 10,-20 C 32,-18 35,10 14,14 C 2,16 2,-5 10,-20 Z" 
          fill="url(#${prefix}-inner)" opacity="0.97"/>
    <path d="M -12,8 C 2,28 24,20 10,2 C 2,-5 -8,0 -12,8 Z" 
          fill="url(#${prefix}-inner)" opacity="0.97"/>
    <path d="M -22,-2 C -28,15 -10,20 -4,5 C 0,-4 -12,-8 -22,-2 Z" 
          fill="url(#${prefix}-inner)" opacity="0.97"/>

    <!-- Layer 4: Deep Rose Center (Spiral C-cups of the rose heart) -->
    <path d="M -10,-6 C -16,-18 8,-20 12,-8 C 14,0 -2,6 -10,-6 Z" 
          fill="url(#${prefix}-deep)" opacity="0.98"/>
    <path d="M -6,-2 C -10,10 12,12 8,-2 C 5,-8 -2,-6 -6,-2 Z" 
          fill="url(#${prefix}-deep)" opacity="0.98"/>
    
    <!-- Heart curls (delicate center swirl lines) -->
    <path d="M -5,-3 C -2,-9 6,-7 5,-1 C 4,4 -3,4 -2,-1 C -1,-4 3,-3 2,-1" 
          fill="none" stroke="${p.roseDeep2}" stroke-width="1.2" stroke-linecap="round"/>
    
    <!-- Subtle Golden stamen dust in the folds -->
    <circle cx="2" cy="-2" r="1.4" fill="${p.goldAccent}" opacity="0.85"/>
    <circle cx="-3" cy="1" r="1.1" fill="${p.goldAccent}" opacity="0.85"/>
    <circle cx="4" cy="2" r="1.0" fill="${p.goldAccent}" opacity="0.75"/>
    <circle cx="-1" cy="-5" r="1.2" fill="${p.goldAccent}" opacity="0.8"/>
  </g>
  `;
}

// SECONDARY SEMI-OPEN ROSE (Tilted 3/4 perspective, delicate petal layers)
export function renderWatercolorRoseSide(cx, cy, scale, rotDeg, prefix, p) {
  return `
  <g transform="translate(${cx}, ${cy}) rotate(${rotDeg}) scale(${scale})">
    <!-- Back outer petals -->
    <path d="M -25,-10 C -45,-45 10,-55 25,-25 C 20,-10 -5,-5 -25,-10 Z" 
          fill="url(#${prefix}-outer)" opacity="0.9"/>
    <path d="M 15,-20 C 45,-40 60,-5 35,15 C 20,10 10,-5 15,-20 Z" 
          fill="url(#${prefix}-outer)" opacity="0.9"/>

    <!-- Main cupping body -->
    <path d="M -35,5 C -50,40 10,65 35,35 C 45,20 15,10 -35,5 Z" 
          fill="url(#${prefix}-mid)" stroke="rgba(255,255,255,0.5)" stroke-width="0.6" opacity="0.95"/>
    <path d="M -20,15 C -15,55 30,50 30,22 C 15,12 -5,10 -20,15 Z" 
          fill="url(#${prefix}-inner)" opacity="0.96"/>

    <!-- Center bud spiral -->
    <path d="M -15,-5 C -22,-25 15,-28 18,-6 C 20,8 -5,12 -15,-5 Z" 
          fill="url(#${prefix}-deep)" opacity="0.98"/>
    <path d="M -8,-2 C -12,-14 10,-15 10,-2 C 8,6 -4,7 -8,-2 Z" 
          fill="none" stroke="${p.roseDeep2}" stroke-width="1.3" stroke-linecap="round"/>
    
    <!-- Delicate Green Sepals at the base -->
    <path d="M -25,25 C -45,35 -50,20 -42,10 C -32,15 -25,20 -25,25 Z" 
          fill="${p.leafMid}" opacity="0.85"/>
    <path d="M -10,45 C -15,62 -2,65 5,50 C 2,42 -4,40 -10,45 Z" 
          fill="${p.leafDeep}" opacity="0.85"/>
  </g>
  `;
}

// DELICATE ROSE BUD
export function renderWatercolorBud(cx, cy, scale, rotDeg, prefix, p) {
  return `
  <g transform="translate(${cx}, ${cy}) rotate(${rotDeg}) scale(${scale})">
    <!-- Stem connection -->
    <path d="M 0,18 C 0,30 5,42 8,50" fill="none" stroke="${p.stem}" stroke-width="2.0" stroke-linecap="round"/>
    
    <!-- Rosebud Petals emerging -->
    <path d="M -10,10 C -18,-15 0,-32 0,-32 C 0,-32 18,-15 10,10 Z" 
          fill="url(#${prefix}-mid)" stroke="rgba(255,255,255,0.6)" stroke-width="0.5"/>
    <path d="M -6,5 C -10,-12 0,-25 0,-25 C 0,-25 10,-12 6,5 Z" 
          fill="url(#${prefix}-deep)" opacity="0.95"/>

    <!-- Sepal wings cradling the bud -->
    <path d="M -10,14 C -22,0 -20,-20 -15,-26 C -12,-12 -6,5 -2,12 Z" 
          fill="${p.leafDeep}" opacity="0.92"/>
    <path d="M 8,14 C 20,2 22,-18 16,-28 C 12,-14 6,5 2,12 Z" 
          fill="${p.leafMid}" opacity="0.92"/>
    <!-- Central receptacle -->
    <ellipse cx="0" cy="14" rx="7" ry="5" fill="${p.leafDeep}"/>
  </g>
  `;
}

// DELICATE 5-PETAL JASMINE / HYDRANGEA BLOSSOM
export function renderWatercolorFloret(cx, cy, scale, rotDeg, p) {
  return `
  <g transform="translate(${cx}, ${cy}) rotate(${rotDeg}) scale(${scale})">
    <!-- 5 Soft rounded translucent petals -->
    <path d="M 0,0 C -8,-15 -2,-25 0,-25 C 2,-25 8,-15 0,0 Z" fill="${p.floretPetal}" stroke="rgba(255,255,255,0.7)" stroke-width="0.4" opacity="0.92"/>
    <path d="M 0,0 C 15,-8 25,-2 25,0 C 25,2 15,8 0,0 Z" transform="rotate(72)" fill="${p.floretPetal}" stroke="rgba(255,255,255,0.7)" stroke-width="0.4" opacity="0.92"/>
    <path d="M 0,0 C 15,-8 25,-2 25,0 C 25,2 15,8 0,0 Z" transform="rotate(144)" fill="${p.floretPetal}" stroke="rgba(255,255,255,0.7)" stroke-width="0.4" opacity="0.92"/>
    <path d="M 0,0 C 15,-8 25,-2 25,0 C 25,2 15,8 0,0 Z" transform="rotate(216)" fill="${p.floretPetal}" stroke="rgba(255,255,255,0.7)" stroke-width="0.4" opacity="0.92"/>
    <path d="M 0,0 C 15,-8 25,-2 25,0 C 25,2 15,8 0,0 Z" transform="rotate(288)" fill="${p.floretPetal}" stroke="rgba(255,255,255,0.7)" stroke-width="0.4" opacity="0.92"/>
    <!-- Golden Center Pearl -->
    <circle cx="0" cy="0" r="2.8" fill="${p.floretCenter}"/>
    <circle cx="-0.6" cy="-0.6" r="1.0" fill="#ffffff" opacity="0.8"/>
  </g>
  `;
}

// ORGANIC EUCALYPTUS BRANCH (Round, soft silver-dollar leaves with subtle veins)
export function renderWatercolorEucalyptusBranch(cx, cy, len, rotDeg, p) {
  let s = `<g transform="translate(${cx}, ${cy}) rotate(${rotDeg})">`;
  // Soft arching stem
  s += `<path d="M 0,0 Q -10,${-len * 0.45} 5,${-len}" fill="none" stroke="${p.stem}" stroke-width="1.6" stroke-linecap="round"/>`;

  const pairs = [
    { pos: 0.18, rx: 16, ry: 13, angleL: -52, angleR: 48 },
    { pos: 0.38, rx: 18, ry: 14, angleL: -58, angleR: 54 },
    { pos: 0.58, rx: 17, ry: 13, angleL: -50, angleR: 52 },
    { pos: 0.78, rx: 14, ry: 11, angleL: -45, angleR: 46 },
    { pos: 0.94, rx: 11, ry: 9, angleL: -35, angleR: 38 },
  ];

  for (const pair of pairs) {
    const y = -len * pair.pos;
    const x = -10 * Math.sin(pair.pos * Math.PI);

    // Left leaf
    s += `
      <g transform="translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${pair.angleL})">
        <path d="M 0,0 L -5,0" stroke="${p.stem}" stroke-width="1.0"/>
        <ellipse cx="${-5 - pair.rx * 0.9}" cy="0" rx="${pair.rx}" ry="${pair.ry}" 
                 fill="url(#aes-euc-hl)" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" opacity="0.92"/>
        <path d="M -5,0 Q ${-5 - pair.rx * 0.8},0 ${-5 - pair.rx * 1.7},0" stroke="${p.leafDeep}" stroke-width="0.6" opacity="0.4"/>
      </g>
    `;
    // Right leaf
    s += `
      <g transform="translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${pair.angleR})">
        <path d="M 0,0 L 5,0" stroke="${p.stem}" stroke-width="1.0"/>
        <ellipse cx="${5 + pair.rx * 0.9}" cy="0" rx="${pair.rx}" ry="${pair.ry}" 
                 fill="url(#aes-euc-sh)" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" opacity="0.92"/>
        <path d="M 5,0 Q ${5 + pair.rx * 0.8},0 ${5 + pair.rx * 1.7},0" stroke="${p.leafShadow}" stroke-width="0.6" opacity="0.4"/>
      </g>
    `;
    // Small golden seeded berry dot
    s += `<circle cx="${(x + 1).toFixed(1)}" cy="${(y - 5).toFixed(1)}" r="2.2" fill="${p.goldAccent}"/>`;
  }
  // Terminal leaf at the very tip
  s += `
    <g transform="translate(5, ${-len}) rotate(5)">
      <ellipse cx="0" cy="-10" rx="9" ry="12" fill="url(#aes-euc-hl)" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" opacity="0.92"/>
      <circle cx="2" cy="-22" r="1.8" fill="${p.goldAccent}"/>
    </g>
  `;
  s += `</g>`;
  return s;
}

// CASCADING WILLOW / OLIVE BRANCH (Slender lanceolate leaves in soft watercolor)
export function renderWatercolorWillowBranch(cx, cy, len, rotDeg, p) {
  let s = `<g transform="translate(${cx}, ${cy}) rotate(${rotDeg})">`;
  s += `<path d="M 0,0 Q 20,${-len * 0.5} 8,${-len}" fill="none" stroke="${p.stem}" stroke-width="1.8" stroke-linecap="round"/>`;

  const leaves = [
    { t: 0.15, side: -1, l: 38, w: 10, rot: -42 },
    { t: 0.28, side:  1, l: 42, w: 11, rot:  38 },
    { t: 0.42, side: -1, l: 45, w: 12, rot: -36 },
    { t: 0.56, side:  1, l: 44, w: 11, rot:  32 },
    { t: 0.70, side: -1, l: 38, w: 10, rot: -28 },
    { t: 0.84, side:  1, l: 32, w: 8,  rot:  24 },
  ];

  for (const lf of leaves) {
    const y = -len * lf.t;
    const x = 20 * Math.sin(lf.t * Math.PI * 0.8);
    const grad = lf.side === 1 ? 'url(#aes-leaf-hl)' : 'url(#aes-leaf-sh)';

    s += `
      <g transform="translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${lf.rot})">
        <path d="M 0,0 Q ${lf.side * 4},-2 ${lf.side * 8},-4" fill="none" stroke="${p.stem}" stroke-width="1.2"/>
        <g transform="translate(${lf.side * 8}, -4)">
          <path d="M 0,0 C ${-lf.w * 0.5},${-lf.l * 0.3} ${-lf.w * 0.6},${-lf.l * 0.7} 0,${-lf.l} C ${lf.w * 0.6},${-lf.l * 0.7} ${lf.w * 0.5},${-lf.l * 0.3} 0,0 Z"
                fill="${grad}" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" opacity="0.94"/>
          <path d="M 0,0 Q ${lf.side * 1.5},${-lf.l * 0.5} 0,${-lf.l}" fill="none" stroke="${p.leafShadow}" stroke-width="0.6" opacity="0.5"/>
        </g>
      </g>
    `;
  }
  // Tip leaf
  s += `
    <g transform="translate(8, ${-len}) rotate(6)">
      <path d="M 0,0 C -5,-10 -5,-25 0,-34 C 5,-25 5,-10 0,0 Z" fill="url(#aes-leaf-hl)" opacity="0.94"/>
    </g>
  `;
  s += `</g>`;
  return s;
}

// DELICATE GOLD FOIL BRANCH ACCENT
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

// FULL AESTHETIC HALF-FRAME SVG GENERATOR (700x1000)
export function getWatercolorHalfFrameSvg(themeKey = 'verdant_vow', corner = 'tl') {
  const p = getAestheticPalette(themeKey);
  const rot = corner === 'tl' ? 0 : 180;

  return `
  <svg width="700" height="1000" viewBox="0 0 700 1000" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Soft blur filter for watercolor washes -->
      <filter id="soft-blur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8"/>
      </filter>

      <!-- Main Rose Watercolor Gradients -->
      <radialGradient id="r1-outer" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.roseOuter1}"/>
        <stop offset="70%" stop-color="${p.roseOuter2}"/>
        <stop offset="100%" stop-color="${p.roseMid1}"/>
      </radialGradient>
      <radialGradient id="r1-mid" cx="42%" cy="42%" r="65%">
        <stop offset="0%" stop-color="${p.roseOuter2}"/>
        <stop offset="60%" stop-color="${p.roseMid1}"/>
        <stop offset="100%" stop-color="${p.roseMid2}"/>
      </radialGradient>
      <radialGradient id="r1-inner" cx="40%" cy="40%" r="65%">
        <stop offset="0%" stop-color="${p.roseMid1}"/>
        <stop offset="65%" stop-color="${p.roseMid2}"/>
        <stop offset="100%" stop-color="${p.roseDeep1}"/>
      </radialGradient>
      <radialGradient id="r1-deep" cx="38%" cy="38%" r="65%">
        <stop offset="0%" stop-color="${p.roseMid2}"/>
        <stop offset="70%" stop-color="${p.roseDeep1}"/>
        <stop offset="100%" stop-color="${p.roseDeep2}"/>
      </radialGradient>

      <!-- Secondary Rose Gradients (Soft blush/tint) -->
      <radialGradient id="r2-outer" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.roseOuter1}"/>
        <stop offset="75%" stop-color="${p.roseOuter2}"/>
        <stop offset="100%" stop-color="${p.roseMid1}"/>
      </radialGradient>
      <radialGradient id="r2-mid" cx="42%" cy="42%" r="65%">
        <stop offset="0%" stop-color="${p.roseOuter1}"/>
        <stop offset="60%" stop-color="${p.roseOuter2}"/>
        <stop offset="100%" stop-color="${p.roseMid1}"/>
      </radialGradient>
      <radialGradient id="r2-inner" cx="40%" cy="40%" r="65%">
        <stop offset="0%" stop-color="${p.roseOuter2}"/>
        <stop offset="65%" stop-color="${p.roseMid1}"/>
        <stop offset="100%" stop-color="${p.roseDeep1}"/>
      </radialGradient>
      <radialGradient id="r2-deep" cx="38%" cy="38%" r="65%">
        <stop offset="0%" stop-color="${p.roseMid1}"/>
        <stop offset="70%" stop-color="${p.roseMid2}"/>
        <stop offset="100%" stop-color="${p.roseDeep1}"/>
      </radialGradient>

      <!-- Foliage Gradients -->
      <linearGradient id="aes-leaf-hl" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafHl}"/>
        <stop offset="70%" stop-color="${p.leafMid}"/>
        <stop offset="100%" stop-color="${p.leafDeep}"/>
      </linearGradient>
      <linearGradient id="aes-leaf-sh" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafMid}"/>
        <stop offset="65%" stop-color="${p.leafDeep}"/>
        <stop offset="100%" stop-color="${p.leafShadow}"/>
      </linearGradient>

      <!-- Eucalyptus Gradients -->
      <radialGradient id="aes-euc-hl" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stop-color="${p.leafHl}"/>
        <stop offset="65%" stop-color="${p.leafMid}"/>
        <stop offset="100%" stop-color="${p.leafDeep}"/>
      </radialGradient>
      <radialGradient id="aes-euc-sh" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stop-color="${p.leafMid}"/>
        <stop offset="70%" stop-color="${p.leafDeep}"/>
        <stop offset="100%" stop-color="${p.leafShadow}"/>
      </radialGradient>
    </defs>

    <g transform="rotate(${rot} 350 500)">
      <!-- ============================================================== -->
      <!-- 1. BACKGROUND BOTANICAL WASHES & SILHOUETTES                   -->
      <!-- ============================================================== -->
      <!-- Soft translucent watercolor eucalyptus silhouettes in the background -->
      <path d="M 0,0 Q 280,30 520,35 Q 260,85 0,0 Z" fill="${p.leafHl}" opacity="0.22" filter="url(#soft-blur)"/>
      <path d="M 0,0 Q 30,300 35,680 Q 85,320 0,0 Z" fill="${p.leafHl}" opacity="0.22" filter="url(#soft-blur)"/>

      <!-- ============================================================== -->
      <!-- 2. TOP ARM (Extends along top margin from X: 220 to X: 690)    -->
      <!-- ============================================================== -->
      <!-- Graceful weeping willow reaching horizontally -->
      ${renderWatercolorWillowBranch(290, 85, 270, 84, p)}
      ${renderWatercolorEucalyptusBranch(340, 70, 240, 78, p)}
      ${renderGoldTwig(390, 50, 190, 82, p)}

      <!-- Mid bloom cluster on top arm -->
      ${renderWatercolorRoseSide(460, 85, 0.88, 15, 'r2', p)}
      ${renderWatercolorBud(405, 42, 0.85, 75, 'r1', p)}
      ${renderWatercolorFloret(420, 115, 1.1, 20, p)}
      ${renderWatercolorFloret(510, 95, 0.95, -15, p)}

      <!-- Outer horizontal extension (reaching past X: 650) -->
      ${renderWatercolorWillowBranch(480, 70, 230, 88, p)}
      ${renderWatercolorEucalyptusBranch(530, 50, 180, 82, p)}
      ${renderGoldTwig(560, 40, 130, 86, p)}
      ${renderWatercolorBud(580, 35, 0.75, 85, 'r2', p)}
      ${renderWatercolorFloret(610, 45, 0.9, 35, p)}
      ${renderWatercolorFloret(665, 30, 0.8, -10, p)}

      <!-- ============================================================== -->
      <!-- 3. LEFT ARM (Extends down left margin from Y: 220 to Y: 980)   -->
      <!-- ============================================================== -->
      <!-- Upper section of left garland -->
      ${renderWatercolorWillowBranch(85, 290, 270, -6, p)}
      ${renderWatercolorEucalyptusBranch(70, 340, 250, 8, p)}
      ${renderGoldTwig(50, 390, 190, 2, p)}

      <!-- Mid bloom cluster on left arm -->
      ${renderWatercolorGardenRose(85, 470, 0.90, -25, 'r2', p)}
      ${renderWatercolorBud(45, 410, 0.85, -25, 'r1', p)}
      ${renderWatercolorFloret(115, 405, 1.1, 10, p)}
      ${renderWatercolorFloret(95, 535, 1.0, 45, p)}

      <!-- Mid-lower extension of left arm -->
      ${renderWatercolorWillowBranch(75, 540, 260, -4, p)}
      ${renderWatercolorEucalyptusBranch(65, 580, 230, 6, p)}
      ${renderWatercolorRoseSide(80, 680, 0.82, -35, 'r1', p)}
      ${renderGoldTwig(45, 660, 180, -2, p)}
      ${renderWatercolorBud(50, 735, 0.75, -10, 'r2', p)}
      ${renderWatercolorFloret(105, 630, 0.95, -20, p)}

      <!-- Bottom tail reaching Y: 980 -->
      ${renderWatercolorWillowBranch(60, 720, 260, -2, p)}
      ${renderWatercolorEucalyptusBranch(55, 760, 220, 4, p)}
      ${renderGoldTwig(40, 820, 150, 0, p)}
      ${renderWatercolorFloret(80, 830, 0.9, 15, p)}
      ${renderWatercolorBud(45, 910, 0.75, 5, 'r1', p)}
      ${renderWatercolorFloret(55, 955, 0.8, -10, p)}

      <!-- ============================================================== -->
      <!-- 4. CORNER CENTERPIECE (Grand Majestic Blooms)                  -->
      <!-- ============================================================== -->
      <!-- Diagonal foliage sprays bursting outward -->
      ${renderWatercolorWillowBranch(210, 210, 220, 42, p)}
      ${renderWatercolorEucalyptusBranch(230, 230, 200, 48, p)}
      ${renderGoldTwig(240, 200, 160, 45, p)}

      <!-- Companion Rose Upper Right -->
      ${renderWatercolorRoseSide(240, 130, 0.95, 40, 'r2', p)}
      ${renderWatercolorBud(310, 150, 0.85, 60, 'r1', p)}

      <!-- Companion Rose Lower Left -->
      ${renderWatercolorGardenRose(130, 240, 0.92, -30, 'r2', p)}
      ${renderWatercolorBud(150, 310, 0.85, -45, 'r1', p)}

      <!-- Deep Diagonal Rose -->
      ${renderWatercolorRoseSide(255, 230, 0.88, 75, 'r1', p)}

      <!-- GRAND HERO AESTHETIC WATERCOLOR ROSE (Centerpiece at 170, 170) -->
      ${renderWatercolorGardenRose(175, 175, 1.35, 12, 'r1', p)}

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

// TEST FUNCTION TO RENDER PREVIEWS FOR ALL 4 THEMES
async function generateAllPreviews() {
  const themes = ['verdant_vow', 'puspa_jawi', 'lunara_azure', 'aurelia_grande'];

  for (const themeKey of themes) {
    const tlSvg = getWatercolorHalfFrameSvg(themeKey, 'tl');
    const brSvg = getWatercolorHalfFrameSvg(themeKey, 'br');

    // Title / text colors matching theme
    let titleColor = '#16221a';
    let nameColor = '#4a6c52';
    let dateColor = '#6c8e74';
    let cardStroke = '#cde0ca';
    let cardDash = '#dceadc';

    if (themeKey.includes('jawi')) {
      titleColor = '#3a121a';
      nameColor = '#94384d';
      dateColor = '#ab5b6d';
      cardStroke = '#e8c4cc';
      cardDash = '#f2d8dd';
    } else if (themeKey.includes('lunara')) {
      titleColor = '#102233';
      nameColor = '#3d6c96';
      dateColor = '#618eb8';
      cardStroke = '#c4d8e8';
      cardDash = '#dae7f2';
    } else if (themeKey.includes('aurelia')) {
      titleColor = '#2b210e';
      nameColor = '#8c672b';
      dateColor = '#ad8949';
      cardStroke = '#e8d9bd';
      cardDash = '#f2e8d3';
    }

    const fullSvg = `
    <svg width="800" height="1131" viewBox="0 0 800 1131" xmlns="http://www.w3.org/2000/svg">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sofia&amp;family=Montserrat:wght@400;600;700&amp;family=Playfair+Display:ital,wght@1,500&amp;display=swap');
        .title-caps { font-family: 'Montserrat', sans-serif; font-size: 24px; font-weight: 700; letter-spacing: 7px; fill: ${titleColor}; }
        .cursive-names { font-family: 'Sofia', cursive; font-size: 58px; fill: ${nameColor}; }
        .meta-date { font-family: 'Montserrat', sans-serif; font-size: 14.5px; font-weight: 600; letter-spacing: 3px; fill: ${dateColor}; }
        .rec-title { font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 500; fill: ${titleColor}; }
        .rec-sub { font-family: 'Playfair Display', serif; font-style: italic; font-size: 14.5px; fill: ${nameColor}; }
        .apology-note { font-family: 'Montserrat', sans-serif; font-size: 11px; font-style: italic; fill: #c0392b; }
      </style>

      <!-- Clean White Base -->
      <rect width="800" height="1131" fill="#ffffff"/>

      <!-- Half-frame Top-Left -->
      <g transform="translate(0, 0)">
        <svg width="400" height="565.5" viewBox="0 0 700 1000">
          ${tlSvg.replace(/<svg[^>]*>|<\/svg>/g, '')}
        </svg>
      </g>

      <!-- Half-frame Bottom-Right -->
      <g transform="translate(400, 565.5)">
        <svg width="400" height="565.5" viewBox="0 0 700 1000">
          ${brSvg.replace(/<svg[^>]*>|<\/svg>/g, '')}
        </svg>
      </g>

      <!-- Typography -->
      <text x="400" y="270" text-anchor="middle" class="title-caps">THE WEDDING</text>
      <text x="400" y="348" text-anchor="middle" class="cursive-names">Baskara &amp; Anindya</text>
      <text x="400" y="415" text-anchor="middle" class="meta-date">SABTU, 31 OKTOBER 2026</text>

      <!-- Empty Recipient Card (NO "Tamu Undangan" text) -->
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
    const outPath = `scratch/watercolor_cover_${themeKey}.png`;
    fs.writeFileSync(outPath, buf);
    console.log(`Saved ${outPath}`);
    
    // Also copy to artifacts dir
    const artPath = `C:/Users/dandi120502/.gemini/antigravity/brain/d7e868e7-6d37-4a0e-9209-fdd022e77915/watercolor_cover_${themeKey}.png`;
    fs.copyFileSync(outPath, artPath);
  }
}

generateAllPreviews().catch(console.error);

