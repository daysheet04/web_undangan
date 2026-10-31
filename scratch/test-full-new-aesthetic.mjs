import fs from 'node:fs';
import sharp from 'sharp';

// Aesthetic Peony with golden stamen
function renderAestheticPeony(cx, cy, r, gradId, innerGradId, strokeColor, stamenColor, goldColor) {
  let s = `<g transform="translate(${cx}, ${cy})">`;

  // Layer 1: Outer Large Petals (6 large undulating petals)
  const count1 = 6;
  for (let i = 0; i < count1; i++) {
    const rot = i * 60;
    const w = r * 0.72;
    const h = r * 0.95;
    s += `
      <g transform="rotate(${rot})">
        <path d="M 0,0 
                 C ${-w * 0.5},${-h * 0.2} ${-w * 0.9},${-h * 0.65} ${-w * 0.4},${-h * 0.95} 
                 Q 0,${-h * 1.05} ${w * 0.4},${-h * 0.95} 
                 C ${w * 0.9},${-h * 0.65} ${w * 0.5},${-h * 0.2} 0,0 Z" 
              fill="url(#${gradId})" stroke="${strokeColor}" stroke-width="0.55" opacity="0.92"/>
      </g>
    `;
  }

  // Layer 2: Mid Petals (7 cupped petals, offset by 25 deg)
  const count2 = 7;
  for (let i = 0; i < count2; i++) {
    const rot = i * (360 / count2) + 25;
    const w = r * 0.58;
    const h = r * 0.78;
    s += `
      <g transform="rotate(${rot.toFixed(1)})">
        <path d="M 0,0 
                 C ${-w * 0.6},${-h * 0.25} ${-w * 0.85},${-h * 0.7} ${-w * 0.3},${-h * 0.96} 
                 C ${-w * 0.1},${-h * 1.04} ${w * 0.1},${-h * 1.04} ${w * 0.3},${-h * 0.96} 
                 C ${w * 0.85},${-h * 0.7} ${w * 0.6},${-h * 0.25} 0,0 Z" 
              fill="url(#${gradId})" stroke="${strokeColor}" stroke-width="0.5" opacity="0.94"/>
      </g>
    `;
  }

  // Layer 3: Inner Petals (6 cupped petals)
  const count3 = 6;
  for (let i = 0; i < count3; i++) {
    const rot = i * 60 + 12;
    const w = r * 0.44;
    const h = r * 0.58;
    s += `
      <g transform="rotate(${rot})">
        <path d="M 0,0 
                 C ${-w * 0.5},${-h * 0.2} ${-w * 0.8},${-h * 0.65} ${-w * 0.25},${-h * 0.95} 
                 Q 0,${-h * 1.02} ${w * 0.25},${-h * 0.95} 
                 C ${w * 0.8},${-h * 0.65} ${w * 0.5},${-h * 0.2} 0,0 Z" 
              fill="url(#${innerGradId || gradId})" stroke="${strokeColor}" stroke-width="0.45" opacity="0.96"/>
      </g>
    `;
  }

  // Layer 4: Innermost Cup (5 petals)
  const count4 = 5;
  for (let i = 0; i < count4; i++) {
    const rot = i * 72 + 36;
    const w = r * 0.30;
    const h = r * 0.40;
    s += `
      <g transform="rotate(${rot})">
        <path d="M 0,0 
                 C ${-w * 0.6},${-h * 0.2} ${-w * 0.7},${-h * 0.7} 0,${-h * 0.96} 
                 C ${w * 0.7},${-h * 0.7} ${w * 0.6},${-h * 0.2} 0,0 Z" 
              fill="url(#${innerGradId || gradId})" stroke="${strokeColor}" stroke-width="0.4" opacity="0.98"/>
      </g>
    `;
  }

  // Core: Soft Stamen Center (Golden pollen beads & fine filaments)
  const coreR = r * 0.20;
  s += `<circle cx="0" cy="0" r="${coreR.toFixed(1)}" fill="url(#${innerGradId || gradId})"/>`;
  
  const stamenCount = 14;
  for (let i = 0; i < stamenCount; i++) {
    const a = (i * (360 / stamenCount) + 12) * (Math.PI / 180);
    const d1 = coreR * 0.25;
    const d2 = coreR * 1.15;
    const x1 = Math.cos(a) * d1;
    const y1 = Math.sin(a) * d1;
    const x2 = Math.cos(a) * d2;
    const y2 = Math.sin(a) * d2;

    s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stamenColor}" stroke-width="0.7" stroke-linecap="round" opacity="0.7"/>`;
    s += `<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="1.7" fill="${goldColor}"/>`;
    s += `<circle cx="${(x2 - 0.4).toFixed(1)}" cy="${(y2 - 0.4).toFixed(1)}" r="0.6" fill="#ffffff" opacity="0.75"/>`;
  }
  s += `<circle cx="0" cy="0" r="${(coreR * 0.35).toFixed(1)}" fill="${stamenColor}"/>`;

  s += `</g>`;
  return s;
}

// Aesthetic Rose (Layered ruffled petals)
function renderAestheticRose(cx, cy, r, gradId, innerGradId, strokeColor, stamenColor, goldColor) {
  return renderAestheticPeony(cx, cy, r, gradId, innerGradId, strokeColor, stamenColor, goldColor);
}

// Aesthetic Floret (5-petal cherry/jasmine blossom)
function renderAestheticFloret(cx, cy, r, gradId, strokeColor, goldColor) {
  let s = `<g transform="translate(${cx}, ${cy})">`;
  for (let i = 0; i < 5; i++) {
    const rot = i * 72;
    s += `
      <g transform="rotate(${rot})">
        <path d="M 0,0 C ${-r * 0.45},${-r * 0.3} ${-r * 0.55},${-r * 0.7} 0,${-r * 0.95} C ${r * 0.55},${-r * 0.7} ${r * 0.45},${-r * 0.3} 0,0 Z" 
              fill="url(#${gradId})" stroke="${strokeColor}" stroke-width="0.45" opacity="0.94"/>
      </g>
    `;
  }
  s += `<circle cx="0" cy="0" r="${(r * 0.22).toFixed(1)}" fill="${goldColor}"/>`;
  s += `<circle cx="-0.4" cy="-0.4" r="${(r * 0.08).toFixed(1)}" fill="#ffffff" opacity="0.8"/>`;
  s += `</g>`;
  return s;
}

// Aesthetic Leaf (Curved, soft organic shape)
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
      <path d="${lPath}" fill="url(#${hlGradId})" stroke="${stemColor}" stroke-width="0.55" opacity="0.94"/>
      <path d="${rPath}" fill="url(#${shGradId})" stroke="${stemColor}" stroke-width="0.55" opacity="0.94"/>
      <path d="M 0,0 Q ${midX.toFixed(1)},${midY.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)}" fill="none" stroke="${stemColor}" stroke-width="1.0" stroke-linecap="round" opacity="0.75"/>
    </g>
  `;
}

// Aesthetic Leaf Trio Sprig
function renderAestheticLeafTrio(cx, cy, len, rotDeg, hlGradId, shGradId, stemColor) {
  return `
    <g transform="translate(${cx}, ${cy}) rotate(${rotDeg})">
      <path d="M 0,${len * 0.20} Q 2,${len * 0.08} 0,0" fill="none" stroke="${stemColor}" stroke-width="1.8" stroke-linecap="round"/>
      <g transform="translate(0, ${-len * 0.06})">
        <path d="M 0,0 Q -6,-3 -12,-6" fill="none" stroke="${stemColor}" stroke-width="1.2" stroke-linecap="round"/>
        ${renderAestheticLeaf(-12, -6, len * 0.68, len * 0.24, -0.16, -42, hlGradId, shGradId, stemColor)}
      </g>
      <g transform="translate(0, ${-len * 0.14})">
        <path d="M 0,0 Q 6,-3 12,-6" fill="none" stroke="${stemColor}" stroke-width="1.2" stroke-linecap="round"/>
        ${renderAestheticLeaf(12, -6, len * 0.65, len * 0.23, 0.16, 38, hlGradId, shGradId, stemColor)}
      </g>
      ${renderAestheticLeaf(0, 0, len, len * 0.30, 0.08, 0, hlGradId, shGradId, stemColor)}
    </g>
  `;
}

// Aesthetic Willow Branch with cascading slender leaves
function renderAestheticWillow(cx, cy, len, rotDeg, hlGradId, shGradId, stemColor) {
  let s = `<g transform="translate(${cx}, ${cy}) rotate(${rotDeg})">`;
  s += `<path d="M 0,0 Q 18,${-len * 0.5} 6,${-len}" fill="none" stroke="${stemColor}" stroke-width="1.6" stroke-linecap="round"/>`;
  
  const nodes = [
    { t: 0.22, side: -1, l: len * 0.38, w: len * 0.11, rot: -36 },
    { t: 0.42, side:  1, l: len * 0.40, w: len * 0.12, rot:  34 },
    { t: 0.62, side: -1, l: len * 0.36, w: len * 0.10, rot: -30 },
    { t: 0.80, side:  1, l: len * 0.32, w: len * 0.09, rot:  26 },
  ];

  for (const n of nodes) {
    const stemY = -len * n.t;
    const stemX = 18 * Math.sin(n.t * Math.PI * 0.75);
    s += `
      <g transform="translate(${stemX.toFixed(1)}, ${stemY.toFixed(1)})">
        <path d="M 0,0 Q ${n.side * 4},-2 ${n.side * 7},-3" fill="none" stroke="${stemColor}" stroke-width="1.2" stroke-linecap="round"/>
        ${renderAestheticLeaf(n.side * 7, -3, n.l, n.w, n.side * 0.12, n.rot, hlGradId, shGradId, stemColor)}
      </g>
    `;
  }
  s += `${renderAestheticLeaf(6, -len, len * 0.32, len * 0.08, 0.05, 5, hlGradId, shGradId, stemColor)}`;
  s += `</g>`;
  return s;
}

// Aesthetic Round Silver-Dollar Eucalyptus
function renderAestheticEucalyptus(cx, cy, len, rotDeg, hlGradId, shGradId, stemColor, goldColor) {
  let s = `<g transform="translate(${cx}, ${cy}) rotate(${rotDeg})">`;
  s += `<path d="M 0,0 Q -12,${-len * 0.5} 0,${-len}" fill="none" stroke="${stemColor}" stroke-width="1.5" stroke-linecap="round"/>`;

  const nodes = [0.18, 0.38, 0.58, 0.78, 0.94];
  for (const t of nodes) {
    const y = -len * t;
    const x = -12 * Math.sin(t * Math.PI);
    const r = len * 0.11 * (1.1 - t * 0.25);

    s += `
      <g transform="translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${-48 - t * 8})">
        <path d="M 0,0 L -5,0" stroke="${stemColor}" stroke-width="1.0"/>
        <ellipse cx="${-5 - r * 0.9}" cy="0" rx="${(r * 0.95).toFixed(1)}" ry="${(r * 0.75).toFixed(1)}" 
                 fill="url(#${hlGradId})" stroke="${stemColor}" stroke-width="0.5" opacity="0.90"/>
      </g>
    `;
    s += `
      <g transform="translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${48 + t * 8})">
        <path d="M 0,0 L 5,0" stroke="${stemColor}" stroke-width="1.0"/>
        <ellipse cx="${5 + r * 0.9}" cy="0" rx="${(r * 0.95).toFixed(1)}" ry="${(r * 0.75).toFixed(1)}" 
                 fill="url(#${shGradId})" stroke="${stemColor}" stroke-width="0.5" opacity="0.90"/>
      </g>
    `;
    s += `<circle cx="${(x + 2).toFixed(1)}" cy="${(y - 4).toFixed(1)}" r="2.0" fill="${goldColor}"/>`;
  }
  s += `</g>`;
  return s;
}

// Rose Bud with soft calyx
function renderAestheticBud(cx, cy, r, rotDeg, gradId, stemColor) {
  return `
    <g transform="translate(${cx}, ${cy}) rotate(${rotDeg})">
      <path d="M 0,${-r * 1.1} C ${r * 0.6},${-r * 0.6} ${r * 0.5},${r * 0.3} 0,${r * 0.6} C ${-r * 0.5},${r * 0.3} ${-r * 0.6},${-r * 0.6} 0,${-r * 1.1} Z"
            fill="url(#${gradId})" stroke="rgba(255, 255, 255, 0.7)" stroke-width="0.6"/>
      <path d="M 0,${r * 0.6} Q ${-r * 0.6},${-r * 0.1} ${-r * 0.3},${-r * 0.8}" fill="none" stroke="${stemColor}" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M 0,${r * 0.6} Q ${r * 0.6},${-r * 0.1} ${r * 0.3},${-r * 0.8}" fill="none" stroke="${stemColor}" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="0" cy="${r * 0.55}" r="${r * 0.22}" fill="${stemColor}"/>
    </g>
  `;
}

// COMPLETE AESTHETIC HALF-FRAME SVG
export function getNewAestheticHalfFrameSvg(themeKey = 'verdant_vow', corner = 'tl') {
  const rot = corner === 'tl' ? 0 : 180;

  // Aesthetic theme palettes
  let p = {
    hero1: '#fffbf5',
    hero2: '#f5e8d5',
    heroDeep: '#d6bfa3',
    inner1: '#fceddb',
    innerDeep: '#a88960',
    sec1: '#fdf3ed',
    sec2: '#f6d8ca',
    secDeep: '#c99a85',
    leafHl1: '#a8d4ad',
    leafHl2: '#6ea375',
    leafSh1: '#5a8c62',
    leafSh2: '#243f29',
    stemColor: '#243f29',
    goldColor: '#b49456',
    goldLeaf: 'rgba(195, 168, 105, 0.7)',
    stamen: '#6e4f2b',
    floret: '#fffaf4',
  };

  if (themeKey.includes('jawi') || themeKey.includes('java')) {
    p = {
      hero1: '#fdecef',
      hero2: '#f598ab',
      heroDeep: '#c23b56',
      inner1: '#ea788e',
      innerDeep: '#7a1a2e',
      sec1: '#fef0f2',
      sec2: '#fbd0d9',
      secDeep: '#d96e85',
      leafHl1: '#a4cca6',
      leafHl2: '#5f9967',
      leafSh1: '#4a7d52',
      leafSh2: '#203d24',
      stemColor: '#203d24',
      goldColor: '#c2963e',
      goldLeaf: 'rgba(214, 175, 78, 0.7)',
      stamen: '#591220',
      floret: '#fff2f5',
    };
  } else if (themeKey.includes('lunara') || themeKey.includes('azure')) {
    p = {
      hero1: '#f3f8fd',
      hero2: '#a4c9ed',
      heroDeep: '#4a7bb0',
      inner1: '#82b0de',
      innerDeep: '#234975',
      sec1: '#f7faff',
      sec2: '#c9e0f7',
      secDeep: '#6c9ecc',
      leafHl1: '#a8ccdc',
      leafHl2: '#629cb2',
      leafSh1: '#4a7e94',
      leafSh2: '#1d3e4d',
      stemColor: '#1d3e4d',
      goldColor: '#7895b8',
      goldLeaf: 'rgba(148, 185, 218, 0.7)',
      stamen: '#1b3859',
      floret: '#f2f8fc',
    };
  } else if (themeKey.includes('aurelia') || themeKey.includes('grande')) {
    p = {
      hero1: '#fefaf2',
      hero2: '#fadba8',
      heroDeep: '#d99841',
      inner1: '#f0bf6c',
      innerDeep: '#8f5517',
      sec1: '#fffdf8',
      sec2: '#fae7cb',
      secDeep: '#c7924c',
      leafHl1: '#bad1a5',
      leafHl2: '#7f9e67',
      leafSh1: '#63804d',
      leafSh2: '#2b3d1f',
      stemColor: '#2b3d1f',
      goldColor: '#c59d45',
      goldLeaf: 'rgba(215, 175, 80, 0.75)',
      stamen: '#63390c',
      floret: '#fffdf6',
    };
  }

  return `
  <svg width="700" height="1000" viewBox="0 0 700 1000" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Hero Bloom Gradients -->
      <radialGradient id="aes-hero-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.hero1}"/>
        <stop offset="55%" stop-color="${p.hero2}"/>
        <stop offset="100%" stop-color="${p.heroDeep}"/>
      </radialGradient>
      <radialGradient id="aes-inner-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.inner1}"/>
        <stop offset="100%" stop-color="${p.innerDeep}"/>
      </radialGradient>

      <!-- Secondary Bloom Gradients -->
      <radialGradient id="aes-sec-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.sec1}"/>
        <stop offset="55%" stop-color="${p.sec2}"/>
        <stop offset="100%" stop-color="${p.secDeep}"/>
      </radialGradient>

      <!-- Floret Gradient -->
      <radialGradient id="aes-floret-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="80%" stop-color="${p.floret}"/>
        <stop offset="100%" stop-color="${p.sec2}"/>
      </radialGradient>

      <!-- Leaf Gradients -->
      <linearGradient id="aes-leaf-hl-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafHl1}"/>
        <stop offset="60%" stop-color="${p.leafHl2}"/>
        <stop offset="100%" stop-color="${p.leafSh1}"/>
      </linearGradient>
      <linearGradient id="aes-leaf-sh-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafSh1}"/>
        <stop offset="70%" stop-color="${p.leafSh2}"/>
        <stop offset="100%" stop-color="${p.stemColor}"/>
      </linearGradient>
    </defs>

    <g transform="rotate(${rot} 350 500)">
      <!-- ============================================================== -->
      <!-- 1. TOP ARM (Cascading along top edge from X: 200 to X: 690)   -->
      <!-- ============================================================== -->
      ${renderAestheticWillow(320, 100, 280, 84, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor)}
      ${renderAestheticEucalyptus(340, 80, 240, 78, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor, p.goldColor)}
      ${renderAestheticLeafTrio(430, 65, 140, 88, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor)}

      <!-- Mid bloom on top arm -->
      ${renderAestheticRose(460, 95, 52, `aes-sec-${themeKey}`, `aes-hero-${themeKey}`, 'rgba(255,255,255,0.7)', p.stamen, p.goldColor)}
      ${renderAestheticBud(410, 50, 16, 75, `aes-hero-${themeKey}`, p.stemColor)}
      ${renderAestheticFloret(400, 120, 14, `aes-floret-${themeKey}`, 'rgba(255,255,255,0.8)', p.goldColor)}

      <!-- Outer reach on top arm (reaching X: 685) -->
      ${renderAestheticWillow(490, 80, 240, 86, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor)}
      ${renderAestheticEucalyptus(520, 60, 200, 82, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor, p.goldColor)}
      ${renderAestheticLeafTrio(560, 50, 120, 88, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor)}
      ${renderAestheticLeaf(630, 42, 90, 24, 0.15, 88, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor)}
      ${renderAestheticLeaf(680, 36, 68, 20, 0.12, 92, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor)}
      ${renderAestheticBud(580, 40, 15, 85, `aes-sec-${themeKey}`, p.stemColor)}
      ${renderAestheticFloret(520, 100, 13, `aes-floret-${themeKey}`, 'rgba(255,255,255,0.8)', p.goldColor)}
      ${renderAestheticFloret(610, 50, 12, `aes-floret-${themeKey}`, 'rgba(255,255,255,0.8)', p.goldColor)}

      <!-- Gold foil accents on top arm -->
      <path d="M 330,85 Q 460,35 520,38 Q 450,75 330,85 Z" fill="${p.goldLeaf}"/>
      <path d="M 490,55 Q 590,25 640,30 Q 580,60 490,55 Z" fill="${p.goldLeaf}"/>

      <!-- ============================================================== -->
      <!-- 2. LEFT ARM (Cascading down left edge from Y: 200 to Y: 980)  -->
      <!-- ============================================================== -->
      ${renderAestheticWillow(100, 320, 280, -6, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor)}
      ${renderAestheticEucalyptus(80, 340, 250, 8, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor, p.goldColor)}
      ${renderAestheticLeafTrio(65, 430, 140, -2, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor)}

      <!-- Upper-mid bloom on left arm -->
      ${renderAestheticRose(95, 460, 54, `aes-sec-${themeKey}`, `aes-hero-${themeKey}`, 'rgba(255,255,255,0.7)', p.stamen, p.goldColor)}
      ${renderAestheticBud(50, 410, 16, -25, `aes-hero-${themeKey}`, p.stemColor)}
      ${renderAestheticFloret(120, 400, 14, `aes-floret-${themeKey}`, 'rgba(255,255,255,0.8)', p.goldColor)}

      <!-- Mid section of left arm -->
      ${renderAestheticWillow(80, 530, 260, -4, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor)}
      ${renderAestheticEucalyptus(70, 550, 220, 6, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor, p.goldColor)}
      ${renderAestheticPeony(90, 620, 52, `aes-hero-${themeKey}`, `aes-inner-${themeKey}`, 'rgba(255,255,255,0.7)', p.stamen, p.goldColor)}
      ${renderAestheticFloret(115, 560, 13, `aes-floret-${themeKey}`, 'rgba(255,255,255,0.8)', p.goldColor)}
      ${renderAestheticBud(55, 680, 15, -15, `aes-sec-${themeKey}`, p.stemColor)}

      <!-- Lower reach on left arm (reaching down to Y: 980) -->
      ${renderAestheticWillow(70, 700, 260, -2, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor)}
      ${renderAestheticEucalyptus(60, 730, 220, 4, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor, p.goldColor)}
      ${renderAestheticLeafTrio(55, 820, 130, 2, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor)}
      ${renderAestheticRose(80, 770, 44, `aes-sec-${themeKey}`, `aes-hero-${themeKey}`, 'rgba(255,255,255,0.7)', p.stamen, p.goldColor)}
      ${renderAestheticLeaf(48, 890, 95, 25, -0.14, 5, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor)}
      ${renderAestheticLeaf(40, 950, 75, 20, -0.10, 0, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor)}
      ${renderAestheticFloret(90, 840, 12, `aes-floret-${themeKey}`, 'rgba(255,255,255,0.8)', p.goldColor)}
      ${renderAestheticBud(50, 920, 14, -5, `aes-hero-${themeKey}`, p.stemColor)}

      <!-- Gold foil accents on left arm -->
      <path d="M 85,330 Q 35,460 38,520 Q 75,450 85,330 Z" fill="${p.goldLeaf}"/>
      <path d="M 55,620 Q 25,740 28,800 Q 60,730 55,620 Z" fill="${p.goldLeaf}"/>

      <!-- ============================================================== -->
      <!-- 3. CORNER CORE (Grand Majestic Centerpiece Blooms)           -->
      <!-- ============================================================== -->
      ${renderAestheticLeafTrio(230, 220, 150, 45, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor)}
      ${renderAestheticLeaf(290, 270, 100, 30, 0.16, 48, `aes-leaf-hl-${themeKey}`, `aes-leaf-sh-${themeKey}`, p.stemColor)}
      ${renderAestheticBud(320, 160, 20, 60, `aes-hero-${themeKey}`, p.stemColor)}
      ${renderAestheticBud(160, 320, 20, -30, `aes-sec-${themeKey}`, p.stemColor)}

      <!-- Diagonal gold leaf -->
      <path d="M 220,150 Q 350,90 390,85 Q 340,130 220,150 Z" fill="${p.goldLeaf}"/>
      <path d="M 150,220 Q 90,350 85,390 Q 130,340 150,220 Z" fill="${p.goldLeaf}"/>

      <!-- Secondary Soft Blush Rose (Lower-left) -->
      ${renderAestheticRose(130, 240, 65, `aes-sec-${themeKey}`, `aes-hero-${themeKey}`, 'rgba(255,255,255,0.7)', p.stamen, p.goldColor)}

      <!-- Secondary Soft Rose (Upper-right) -->
      ${renderAestheticRose(245, 130, 62, `aes-sec-${themeKey}`, `aes-hero-${themeKey}`, 'rgba(255,255,255,0.7)', p.stamen, p.goldColor)}

      <!-- Companion Rose (Diagonal) -->
      ${renderAestheticRose(260, 220, 60, `aes-sec-${themeKey}`, `aes-hero-${themeKey}`, 'rgba(255,255,255,0.7)', p.stamen, p.goldColor)}

      <!-- HERO GRAND AESTHETIC PEONY (Majestic centerpiece of the corner!) -->
      ${renderAestheticPeony(175, 175, 84, `aes-hero-${themeKey}`, `aes-inner-${themeKey}`, 'rgba(255,255,255,0.75)', p.stamen, p.goldColor)}

      <!-- Accent Florets around the core -->
      ${renderAestheticFloret(100, 105, 16, `aes-floret-${themeKey}`, 'rgba(255,255,255,0.8)', p.goldColor)}
      ${renderAestheticFloret(320, 120, 15, `aes-floret-${themeKey}`, 'rgba(255,255,255,0.8)', p.goldColor)}
      ${renderAestheticFloret(120, 320, 15, `aes-floret-${themeKey}`, 'rgba(255,255,255,0.8)', p.goldColor)}
      ${renderAestheticFloret(280, 290, 14, `aes-floret-${themeKey}`, 'rgba(255,255,255,0.8)', p.goldColor)}
      ${renderAestheticFloret(190, 270, 14, `aes-floret-${themeKey}`, 'rgba(255,255,255,0.8)', p.goldColor)}
      ${renderAestheticFloret(270, 190, 14, `aes-floret-${themeKey}`, 'rgba(255,255,255,0.8)', p.goldColor)}

      <!-- Stardust Gold Beads sprinkling along the garland -->
      <circle cx="370" cy="55" r="3.0" fill="${p.goldColor}"/>
      <circle cx="55" cy="370" r="3.0" fill="${p.goldColor}"/>
      <circle cx="480" cy="40" r="2.6" fill="${p.goldColor}"/>
      <circle cx="40" cy="480" r="2.6" fill="${p.goldColor}"/>
      <circle cx="650" cy="25" r="2.4" fill="${p.goldColor}"/>
      <circle cx="25" cy="650" r="2.4" fill="${p.goldColor}"/>
      <circle cx="30" cy="860" r="2.4" fill="${p.goldColor}"/>
      <circle cx="310" cy="290" r="2.8" fill="${p.goldColor}"/>
    </g>
  </svg>
  `;
}

// TEST RENDER FULL COVER WITH THIS NEW AESTHETIC HALF-FRAME
async function testFullAestheticCover() {
  const tlSvg = getNewAestheticHalfFrameSvg('verdant_vow', 'tl');
  const brSvg = getNewAestheticHalfFrameSvg('verdant_vow', 'br');

  const fullSvg = `
  <svg width="800" height="1131" viewBox="0 0 800 1131" xmlns="http://www.w3.org/2000/svg">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Sofia&amp;family=Montserrat:wght@400;600;700&amp;family=Playfair+Display:ital,wght@1,500&amp;display=swap');
      .title-caps { font-family: 'Montserrat', sans-serif; font-size: 24px; font-weight: 700; letter-spacing: 7px; fill: #16221a; }
      .cursive-names { font-family: 'Sofia', cursive; font-size: 58px; fill: #4a6c52; }
      .meta-date { font-family: 'Montserrat', sans-serif; font-size: 14.5px; font-weight: 600; letter-spacing: 3px; fill: #6c8e74; }
      .rec-title { font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 500; fill: #16221a; }
      .rec-sub { font-family: 'Playfair Display', serif; font-style: italic; font-size: 14.5px; fill: #4a6c52; }
      .apology-note { font-family: 'Montserrat', sans-serif; font-size: 11px; font-style: italic; fill: #c0392b; }
    </style>

    <rect width="800" height="1131" fill="#ffffff"/>

    <radialGradient id="mist-tl" cx="0%" cy="0%" r="58%">
      <stop offset="0%" stop-color="#d6e8d2" stop-opacity="0.55"/>
      <stop offset="50%" stop-color="#ebf4e8" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <rect width="800" height="1131" fill="url(#mist-tl)"/>

    <radialGradient id="mist-br" cx="100%" cy="100%" r="58%">
      <stop offset="0%" stop-color="#d6e8d2" stop-opacity="0.55"/>
      <stop offset="50%" stop-color="#ebf4e8" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <rect width="800" height="1131" fill="url(#mist-br)"/>

    <circle cx="340" cy="140" r="2.2" fill="#6c8e74" opacity="0.6"/>
    <circle cx="140" cy="340" r="2.2" fill="#6c8e74" opacity="0.6"/>
    <circle cx="460" cy="990" r="2.2" fill="#6c8e74" opacity="0.6"/>
    <circle cx="660" cy="790" r="2.2" fill="#6c8e74" opacity="0.6"/>

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

    <text x="400" y="270" text-anchor="middle" class="title-caps">THE WEDDING</text>
    <text x="400" y="348" text-anchor="middle" class="cursive-names">Baskara &amp; Anindya</text>
    <text x="400" y="415" text-anchor="middle" class="meta-date">SABTU, 31 OKTOBER 2026</text>

    <text x="400" y="650" text-anchor="middle" class="rec-title">Kepada Yth.</text>
    <text x="400" y="674" text-anchor="middle" class="rec-sub">Bapak / Ibu / Saudara / i</text>

    <g transform="translate(180, 700)">
      <rect width="440" height="155" rx="16" fill="#ffffff" stroke="#cde0ca" stroke-width="1.4"/>
      <rect x="6" y="6" width="428" height="143" rx="12" fill="none" stroke="#dceadc" stroke-width="0.9" stroke-dasharray="6,4"/>
    </g>

    <text x="400" y="885" text-anchor="middle" class="apology-note">Mohon maaf apabila ada kesalahan dalam penulisan nama / gelar</text>
  </svg>
  `;

  const buf = await sharp(Buffer.from(fullSvg)).png().toBuffer();
  fs.writeFileSync('scratch/full_new_aesthetic_verdant.png', buf);
  console.log('Saved scratch/full_new_aesthetic_verdant.png');
}

testFullAestheticCover().catch(console.error);

