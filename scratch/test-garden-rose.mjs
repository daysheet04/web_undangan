import fs from 'node:fs';
import sharp from 'sharp';

// Realistic watercolor garden rose matching user reference media_1793370052320_91cdf285.png
export function renderGardenRose(cx, cy, r, gradId, strokeColor, shadowGradId) {
  let s = `<g transform="translate(${cx}, ${cy})">`;

  // 1. SOLID BASE BODY (Eliminates any gaps, provides rich watercolor depth!)
  s += `<circle cx="0" cy="0" r="${r}" fill="url(#${gradId})"/>`;

  // 2. TIER 1 - OUTER BROAD PETALS (8 overlapping wide petals with wavy scallop rim)
  const tier1Count = 8;
  for (let i = 0; i < tier1Count; i++) {
    const a1 = (i * 45) * (Math.PI / 180);
    const a2 = ((i + 1) * 45 + 12) * (Math.PI / 180);
    const midA = (a1 + a2) / 2;

    const p1x = Math.cos(a1) * r * 0.96;
    const p1y = Math.sin(a1) * r * 0.96;
    const p2x = Math.cos(a2) * r * 0.96;
    const p2y = Math.sin(a2) * r * 0.96;

    const ctrlDist = r * 1.05;
    const c1x = Math.cos(midA) * ctrlDist;
    const c1y = Math.sin(midA) * ctrlDist;

    const inDist = r * 0.70;
    const in1x = Math.cos(a1 + 0.15) * inDist;
    const in1y = Math.sin(a1 + 0.15) * inDist;
    const in2x = Math.cos(a2 - 0.15) * inDist;
    const in2y = Math.sin(a2 - 0.15) * inDist;

    s += `
      <path d="M ${p1x.toFixed(1)},${p1y.toFixed(1)} 
               Q ${c1x.toFixed(1)},${c1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)} 
               C ${(p2x * 0.85).toFixed(1)},${(p2y * 0.85).toFixed(1)} ${in2x.toFixed(1)},${in2y.toFixed(1)} ${in2x.toFixed(1)},${in2y.toFixed(1)} 
               Q ${(Math.cos(midA) * inDist * 0.9).toFixed(1)},${(Math.sin(midA) * inDist * 0.9).toFixed(1)} ${in1x.toFixed(1)},${in1y.toFixed(1)} 
               Z" 
            fill="url(#${gradId})" stroke="${strokeColor}" stroke-width="0.75" opacity="0.95"/>
    `;
  }

  // 3. TIER 2 - MID CUPPED PETALS (7 overlapping petals, offset by 25 deg)
  const tier2Count = 7;
  const r2 = r * 0.78;
  for (let i = 0; i < tier2Count; i++) {
    const a1 = (i * (360 / tier2Count) + 22) * (Math.PI / 180);
    const a2 = ((i + 1) * (360 / tier2Count) + 36) * (Math.PI / 180);
    const midA = (a1 + a2) / 2;

    const p1x = Math.cos(a1) * r2;
    const p1y = Math.sin(a1) * r2;
    const p2x = Math.cos(a2) * r2;
    const p2y = Math.sin(a2) * r2;

    const c1x = Math.cos(midA) * (r2 * 1.08);
    const c1y = Math.sin(midA) * (r2 * 1.08);

    const inDist = r * 0.48;
    const in1x = Math.cos(a1 + 0.2) * inDist;
    const in1y = Math.sin(a1 + 0.2) * inDist;
    const in2x = Math.cos(a2 - 0.2) * inDist;
    const in2y = Math.sin(a2 - 0.2) * inDist;

    s += `
      <path d="M ${p1x.toFixed(1)},${p1y.toFixed(1)} 
               Q ${c1x.toFixed(1)},${c1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)} 
               C ${(p2x * 0.8).toFixed(1)},${(p2y * 0.8).toFixed(1)} ${in2x.toFixed(1)},${in2y.toFixed(1)} ${in2x.toFixed(1)},${in2y.toFixed(1)} 
               Q ${(Math.cos(midA) * inDist * 0.85).toFixed(1)},${(Math.sin(midA) * inDist * 0.85).toFixed(1)} ${in1x.toFixed(1)},${in1y.toFixed(1)} 
               Z" 
            fill="url(#${gradId})" stroke="${strokeColor}" stroke-width="0.7" opacity="0.96"/>
    `;
  }

  // 4. TIER 3 - INNER CUPPED PETALS (6 petals forming the inner cup)
  const tier3Count = 6;
  const r3 = r * 0.54;
  for (let i = 0; i < tier3Count; i++) {
    const a1 = (i * 60 + 10) * (Math.PI / 180);
    const a2 = ((i + 1) * 60 + 25) * (Math.PI / 180);
    const midA = (a1 + a2) / 2;

    const p1x = Math.cos(a1) * r3;
    const p1y = Math.sin(a1) * r3;
    const p2x = Math.cos(a2) * r3;
    const p2y = Math.sin(a2) * r3;

    const c1x = Math.cos(midA) * (r3 * 1.1);
    const c1y = Math.sin(midA) * (r3 * 1.1);

    const inDist = r * 0.28;
    const in1x = Math.cos(a1 + 0.25) * inDist;
    const in1y = Math.sin(a1 + 0.25) * inDist;
    const in2x = Math.cos(a2 - 0.25) * inDist;
    const in2y = Math.sin(a2 - 0.25) * inDist;

    s += `
      <path d="M ${p1x.toFixed(1)},${p1y.toFixed(1)} 
               Q ${c1x.toFixed(1)},${c1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)} 
               C ${(p2x * 0.75).toFixed(1)},${(p2y * 0.75).toFixed(1)} ${in2x.toFixed(1)},${in2y.toFixed(1)} ${in2x.toFixed(1)},${in2y.toFixed(1)} 
               Q ${(Math.cos(midA) * inDist * 0.8).toFixed(1)},${(Math.sin(midA) * inDist * 0.8).toFixed(1)} ${in1x.toFixed(1)},${in1y.toFixed(1)} 
               Z" 
            fill="url(#${shadowGradId || gradId})" stroke="${strokeColor}" stroke-width="0.65" opacity="0.97"/>
    `;
  }

  // 5. INNER ROSETTE SPIRAL (The signature spiral core of English roses)
  const cR = r * 0.32;
  s += `
    <g>
      <!-- Deep shadow center basin -->
      <circle cx="0" cy="0" r="${cR.toFixed(1)}" fill="url(#${shadowGradId || gradId})"/>

      <!-- Spiral Fold 1 -->
      <path d="M ${(-cR * 0.85).toFixed(1)},${(-cR * 0.2).toFixed(1)} 
               C ${(-cR * 0.7).toFixed(1)},${(-cR * 0.9).toFixed(1)} ${(cR * 0.5).toFixed(1)},${(-cR * 0.9).toFixed(1)} ${(cR * 0.85).toFixed(1)},${(-cR * 0.1).toFixed(1)} 
               C ${(cR * 0.4).toFixed(1)},${(-cR * 0.3).toFixed(1)} ${(-cR * 0.2).toFixed(1)},${(-cR * 0.3).toFixed(1)} ${(-cR * 0.85).toFixed(1)},${(-cR * 0.2).toFixed(1)} Z" 
            fill="url(#${gradId})" stroke="${strokeColor}" stroke-width="0.6" opacity="0.95"/>

      <!-- Spiral Fold 2 -->
      <path d="M ${(cR * 0.8).toFixed(1)},0 
               C ${(cR * 0.75).toFixed(1)},${(cR * 0.8).toFixed(1)} ${(-cR * 0.4).toFixed(1)},${(cR * 0.85).toFixed(1)} ${(-cR * 0.8).toFixed(1)},${(cR * 0.1).toFixed(1)} 
               C ${(-cR * 0.3).toFixed(1)},${(cR * 0.35).toFixed(1)} ${(cR * 0.3).toFixed(1)},${(cR * 0.3).toFixed(1)} ${(cR * 0.8).toFixed(1)},0 Z" 
            fill="url(#${gradId})" stroke="${strokeColor}" stroke-width="0.6" opacity="0.95"/>

      <!-- Inner tight curl -->
      <path d="M ${(-cR * 0.45).toFixed(1)},${(-cR * 0.05).toFixed(1)} 
               C ${(-cR * 0.3).toFixed(1)},${(-cR * 0.45).toFixed(1)} ${(cR * 0.25).toFixed(1)},${(-cR * 0.4).toFixed(1)} ${(cR * 0.4).toFixed(1)},0 
               C ${(cR * 0.25).toFixed(1)},${(cR * 0.35).toFixed(1)} ${(-cR * 0.15).toFixed(1)},${(cR * 0.25).toFixed(1)} 0,0" 
            fill="url(#${gradId})" stroke="${strokeColor}" stroke-width="0.75" stroke-linecap="round"/>
    </g>
  `;

  s += `</g>`;
  return s;
}

async function testGardenRose() {
  const svg = `
  <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Rich Velvety Crimson / Rose Gradient (Reference 1) -->
      <radialGradient id="rose-hero" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#f0889c"/>
        <stop offset="40%" stop-color="#c9324c"/>
        <stop offset="100%" stop-color="#6e1222"/>
      </radialGradient>
      <radialGradient id="rose-shadow" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="#b0263f"/>
        <stop offset="100%" stop-color="#4d0a16"/>
      </radialGradient>
      <!-- Soft Pink Baby Rose Gradient -->
      <radialGradient id="rose-blush" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#fde4eb"/>
        <stop offset="50%" stop-color="#f5a4b7"/>
        <stop offset="100%" stop-color="#ab3a53"/>
      </radialGradient>
      <!-- Botanical Champagne Rose (Verdant Vow) -->
      <radialGradient id="rose-champagne" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#fff8ed"/>
        <stop offset="45%" stop-color="#ebd8be"/>
        <stop offset="100%" stop-color="#a88e6e"/>
      </radialGradient>
      <radialGradient id="rose-champagne-sh" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="#d9bf9e"/>
        <stop offset="100%" stop-color="#7a6245"/>
      </radialGradient>
    </defs>

    <rect width="600" height="600" fill="#faf8f5"/>

    <!-- 1. Ruby Red Garden Rose (Hero) -->
    ${renderGardenRose(180, 200, 85, 'rose-hero', 'rgba(255, 255, 255, 0.7)', 'rose-shadow')}

    <!-- 2. Soft Pink Baby Rose -->
    ${renderGardenRose(360, 180, 65, 'rose-blush', 'rgba(255, 255, 255, 0.7)', 'rose-shadow')}

    <!-- 3. Botanical Champagne Rose (Verdant Vow) -->
    ${renderGardenRose(270, 390, 80, 'rose-champagne', 'rgba(255, 255, 255, 0.75)', 'rose-champagne-sh')}
  </svg>
  `;

  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync('scratch/test_garden_rose.png', buf);
  console.log('Saved scratch/test_garden_rose.png');
}

testGardenRose().catch(console.error);

