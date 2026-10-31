import fs from 'node:fs';
import sharp from 'sharp';
import { getRealisticCoverSvg } from './test-full-botanical-cover.mjs';

function getThemeColors(themeKey = 'verdant_vow') {
  if (themeKey.includes('jawi') || themeKey.includes('java')) {
    return {
      gold: '#c2963e',
      goldLight: '#e6c888',
      roseOuter: '#fff5f7',
      roseMid: '#f8b4c4',
      roseDeep: '#c44d68',
      roseHeart: '#8c243a',
      leafHl: '#b3d4b6',
      leafMid: '#6fa374',
      leafDeep: '#335c39',
      leafShadow: '#1c3821',
      stem: '#2b472e',
      titleColor: '#3a121a',
      nameColor: '#94384d',
      dateColor: '#ab5b6d',
      cardStroke: '#e8c4cc',
      cardDash: '#f2d8dd',
    };
  } else if (themeKey.includes('lunara') || themeKey.includes('azure')) {
    return {
      gold: '#7895b8',
      goldLight: '#b0c4de',
      roseOuter: '#f4f8fd',
      roseMid: '#acc8ea',
      roseDeep: '#4a7cb3',
      roseHeart: '#234a78',
      leafHl: '#b0d1db',
      leafMid: '#699fb0',
      leafDeep: '#345e6d',
      leafShadow: '#193640',
      stem: '#20414d',
      titleColor: '#102233',
      nameColor: '#3d6c96',
      dateColor: '#618eb8',
      cardStroke: '#c4d8e8',
      cardDash: '#dae7f2',
    };
  } else if (themeKey.includes('aurelia') || themeKey.includes('grande')) {
    return {
      gold: '#c59a30',
      goldLight: '#e5b842',
      roseOuter: '#fffdf8',
      roseMid: '#f4d5a6',
      roseDeep: '#bf8332',
      roseHeart: '#804f14',
      leafHl: '#c5dba8',
      leafMid: '#86a867',
      leafDeep: '#4d6934',
      leafShadow: '#283b18',
      stem: '#364d23',
      titleColor: '#2b210e',
      nameColor: '#8c672b',
      dateColor: '#ad8949',
      cardStroke: '#e8d9bd',
      cardDash: '#f2e8d3',
    };
  } else {
    // Verdant Vow
    return {
      gold: '#b8944d',
      goldLight: '#d8b872',
      roseOuter: '#fffdf9',
      roseMid: '#eed5c2',
      roseDeep: '#bf8b6c',
      roseHeart: '#8c593b',
      leafHl: '#b8dcba',
      leafMid: '#74a87b',
      leafDeep: '#3d6e46',
      leafShadow: '#1e4024',
      stem: '#264a2c',
      titleColor: '#16221a',
      nameColor: '#4a6c52',
      dateColor: '#6c8e74',
      cardStroke: '#cde0ca',
      cardDash: '#dceadc',
    };
  }
}

// STACKED GEOMETRIC FRAME SVG (500 x 420 viewBox - Optimized for Stacked Groom & Bride Names)
export function getStackedFloralFrameSvg(themeKey = 'verdant_vow') {
  const c = getThemeColors(themeKey);

  // Faceted Polygon Coordinates: cx=250, cy=210
  // Wide & tall geometric faceted polygon (Width ~430px, Height ~380px)
  const outerPoly = "250,22 390,56 465,210 390,364 250,398 110,364 35,210 110,56";
  const innerPoly = "250,36 380,68 450,210 380,352 250,384 120,352 50,210 120,68";

  return `
  <svg width="500" height="420" viewBox="0 0 500 420" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="stk-gold-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c.goldLight}"/>
        <stop offset="50%" stop-color="${c.gold}"/>
        <stop offset="100%" stop-color="${c.goldLight}"/>
      </linearGradient>

      <!-- Center Frame Rose Gradients -->
      <radialGradient id="stk-rose-out-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="65%" stop-color="${c.roseOuter}"/>
        <stop offset="100%" stop-color="${c.roseMid}"/>
      </radialGradient>
      <radialGradient id="stk-rose-mid-${themeKey}" cx="42%" cy="42%" r="65%">
        <stop offset="0%" stop-color="${c.roseOuter}"/>
        <stop offset="60%" stop-color="${c.roseMid}"/>
        <stop offset="100%" stop-color="${c.roseDeep}"/>
      </radialGradient>
      <radialGradient id="stk-rose-deep-${themeKey}" cx="40%" cy="40%" r="65%">
        <stop offset="0%" stop-color="${c.roseMid}"/>
        <stop offset="70%" stop-color="${c.roseDeep}"/>
        <stop offset="100%" stop-color="${c.roseHeart}"/>
      </radialGradient>

      <!-- Leaf Gradients -->
      <linearGradient id="stk-leaf-hl-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c.leafHl}"/>
        <stop offset="60%" stop-color="${c.leafMid}"/>
        <stop offset="100%" stop-color="${c.leafDeep}"/>
      </linearGradient>
      <linearGradient id="stk-leaf-sh-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c.leafMid}"/>
        <stop offset="70%" stop-color="${c.leafDeep}"/>
        <stop offset="100%" stop-color="${c.leafShadow}"/>
      </linearGradient>
    </defs>

    <!-- 1. GILDED FACETED GEOMETRIC POLYGON FRAME -->
    <!-- Outer line -->
    <polygon points="${outerPoly}" fill="none" stroke="url(#stk-gold-${themeKey})" stroke-width="1.5" opacity="0.95"/>
    <!-- Inner line -->
    <polygon points="${innerPoly}" fill="none" stroke="url(#stk-gold-${themeKey})" stroke-width="0.85" opacity="0.75"/>

    <!-- Subtle faceted vertex connector lines -->
    <line x1="250" y1="22" x2="250" y2="36" stroke="url(#stk-gold-${themeKey})" stroke-width="0.8" opacity="0.6"/>
    <line x1="390" y1="56" x2="380" y2="68" stroke="url(#stk-gold-${themeKey})" stroke-width="0.8" opacity="0.6"/>
    <line x1="465" y1="210" x2="450" y2="210" stroke="url(#stk-gold-${themeKey})" stroke-width="0.8" opacity="0.6"/>
    <line x1="390" y1="364" x2="380" y2="352" stroke="url(#stk-gold-${themeKey})" stroke-width="0.8" opacity="0.6"/>
    <line x1="250" y1="398" x2="250" y2="384" stroke="url(#stk-gold-${themeKey})" stroke-width="0.8" opacity="0.6"/>
    <line x1="110" y1="364" x2="120" y2="352" stroke="url(#stk-gold-${themeKey})" stroke-width="0.8" opacity="0.6"/>
    <line x1="35" y1="210" x2="50" y2="210" stroke="url(#stk-gold-${themeKey})" stroke-width="0.8" opacity="0.6"/>
    <line x1="110" y1="56" x2="120" y2="68" stroke="url(#stk-gold-${themeKey})" stroke-width="0.8" opacity="0.6"/>

    <!-- Gold diamond beads at top and bottom apex -->
    <polygon points="250,19 253,22 250,25 247,22" fill="${c.gold}"/>
    <polygon points="250,395 253,398 250,401 247,398" fill="${c.gold}"/>

    <!-- ============================================================== -->
    <!-- 2. BOTANICAL WATERCOLOR ROSES CLUSTERED ON TOP-RIGHT SHOULDER  -->
    <!-- ============================================================== -->
    <g transform="translate(390, 70)">
      <!-- Foliage spray along frame line -->
      <!-- Leaf 1 pointing upward -->
      <g transform="translate(10, -25) rotate(22)">
        <path d="M 0,0 C -8,-15 -14,-35 0,-50 C 14,-35 8,-15 0,0 Z" fill="url(#stk-leaf-hl-${themeKey})" stroke="${c.stem}" stroke-width="0.4"/>
        <path d="M 0,0 Q 0,-25 0,-50" stroke="${c.stem}" stroke-width="1.0" opacity="0.8"/>
      </g>
      <!-- Leaf 2 pointing right -->
      <g transform="translate(25, -5) rotate(60)">
        <path d="M 0,0 C -7,-12 -12,-28 0,-42 C 12,-28 7,-12 0,0 Z" fill="url(#stk-leaf-sh-${themeKey})" stroke="${c.stem}" stroke-width="0.4"/>
        <path d="M 0,0 Q 0,-20 0,-42" stroke="${c.stem}" stroke-width="0.9" opacity="0.8"/>
      </g>
      <!-- Leaf 3 pointing downward along wire -->
      <g transform="translate(20, 25) rotate(115)">
        <path d="M 0,0 C -7,-14 -12,-30 0,-44 C 12,-30 7,-14 0,0 Z" fill="url(#stk-leaf-hl-${themeKey})" stroke="${c.stem}" stroke-width="0.4"/>
        <path d="M 0,0 Q 0,-22 0,-44" stroke="${c.stem}" stroke-width="0.9" opacity="0.8"/>
      </g>
      <!-- Leaf 4 small inner -->
      <g transform="translate(-15, -20) rotate(-15)">
        <path d="M 0,0 C -5,-10 -9,-22 0,-32 C 9,-22 5,-10 0,0 Z" fill="url(#stk-leaf-sh-${themeKey})" stroke="${c.stem}" stroke-width="0.4"/>
      </g>

      <!-- Rosebud with green sepals -->
      <g transform="translate(32, -28) rotate(38)">
        <path d="M 0,10 C 0,18 2,24 4,30" fill="none" stroke="${c.stem}" stroke-width="1.6"/>
        <path d="M -6,5 C -12,-10 0,-22 0,-22 C 0,-22 12,-10 6,5 Z" fill="url(#stk-rose-mid-${themeKey})"/>
        <path d="M -7,8 C -14,0 -12,-12 -9,-16 C -7,-8 -3,2 0,6 Z" fill="${c.leafDeep}"/>
        <path d="M 5,8 C 12,0 10,-12 7,-16 C 5,-8 1,2 0,6 Z" fill="${c.leafMid}"/>
      </g>

      <!-- MAIN BLOOMING WATERCOLOR ROSE on the frame joint -->
      <g transform="translate(0, 0) scale(0.74)">
        <!-- Outer petals -->
        <path d="M -15,-35 C -45,-65 -75,-30 -60,10 C -48,22 -25,25 -10,0 Z" fill="url(#stk-rose-out-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.8"/>
        <path d="M -25,-30 C -20,-75 35,-78 45,-38 C 48,-20 20,-10 0,-15 Z" fill="url(#stk-rose-out-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.8"/>
        <path d="M 20,-30 C 65,-60 85,-15 70,25 C 60,35 30,20 15,0 Z" fill="url(#stk-rose-out-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.8"/>
        <path d="M 25,10 C 75,25 65,75 15,70 C -10,65 5,35 0,15 Z" fill="url(#stk-rose-out-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.8"/>
        <path d="M -20,20 C -15,72 40,78 30,35 C 25,15 -5,10 -15,20 Z" fill="url(#stk-rose-out-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.8"/>
        <path d="M -15,15 C -65,45 -70,-5 -35,-15 C -20,-5 -10,5 -15,15 Z" fill="url(#stk-rose-out-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.8"/>
        <!-- Mid petals -->
        <path d="M -28,-18 C -52,-42 -40,-60 -8,-45 C 5,-35 -5,-15 -28,-18 Z" fill="url(#stk-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.5)" stroke-width="0.6"/>
        <path d="M 5,-32 C 38,-55 58,-32 40,-8 C 30,2 10,-10 5,-32 Z" fill="url(#stk-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.5)" stroke-width="0.6"/>
        <path d="M 22,-8 C 55,2 52,42 18,36 C 5,30 10,10 22,-8 Z" fill="url(#stk-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.5)" stroke-width="0.6"/>
        <path d="M -10,18 C 15,50 38,38 20,12 C 5,2 -5,5 -10,18 Z" fill="url(#stk-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.5)" stroke-width="0.6"/>
        <path d="M -30,5 C -55,28 -32,48 -5,22 C 2,12 -12,2 -30,5 Z" fill="url(#stk-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.5)" stroke-width="0.6"/>
        <!-- Center heart -->
        <path d="M -18,-12 C -30,-32 -10,-40 8,-26 C 15,-18 -2,-8 -18,-12 Z" fill="url(#stk-rose-deep-${themeKey})"/>
        <path d="M 10,-20 C 32,-18 35,10 14,14 C 2,16 2,-5 10,-20 Z" fill="url(#stk-rose-deep-${themeKey})"/>
        <path d="M -10,-6 C -16,-18 8,-20 12,-8 C 14,0 -2,6 -10,-6 Z" fill="url(#stk-rose-deep-${themeKey})"/>
        <path d="M -5,-3 C -2,-9 6,-7 5,-1 C 4,4 -3,4 -2,-1" fill="none" stroke="${c.roseHeart}" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="1" cy="-1" r="1.5" fill="${c.gold}"/>
      </g>

      <!-- Secondary petite rosebud / companion -->
      <g transform="translate(-18, 22) scale(0.44)">
        <path d="M -35,5 C -50,40 10,65 35,35 C 45,20 15,10 -35,5 Z" fill="url(#stk-rose-mid-${themeKey})"/>
        <path d="M -15,-5 C -22,-25 15,-28 18,-6 C 20,8 -5,12 -15,-5 Z" fill="url(#stk-rose-deep-${themeKey})"/>
      </g>

      <!-- Petite white floret -->
      <g transform="translate(18, -12) scale(0.68)">
        <path d="M 0,0 C -5,-10 -2,-18 0,-18 C 2,-18 5,-10 0,0 Z" fill="#ffffff" stroke="rgba(255,255,255,0.8)" stroke-width="0.4"/>
        <path d="M 0,0 C 10,-5 18,-2 18,0 C 18,2 10,5 0,0 Z" transform="rotate(72)" fill="#ffffff" stroke="rgba(255,255,255,0.8)" stroke-width="0.4"/>
        <path d="M 0,0 C 10,-5 18,-2 18,0 C 18,2 10,5 0,0 Z" transform="rotate(144)" fill="#ffffff" stroke="rgba(255,255,255,0.8)" stroke-width="0.4"/>
        <path d="M 0,0 C 10,-5 18,-2 18,0 C 18,2 10,5 0,0 Z" transform="rotate(216)" fill="#ffffff" stroke="rgba(255,255,255,0.8)" stroke-width="0.4"/>
        <path d="M 0,0 C 10,-5 18,-2 18,0 C 18,2 10,5 0,0 Z" transform="rotate(288)" fill="#ffffff" stroke="rgba(255,255,255,0.8)" stroke-width="0.4"/>
        <circle cx="0" cy="0" r="2.2" fill="${c.gold}"/>
      </g>

      <!-- Gold stardust accents -->
      <circle cx="-28" cy="-8" r="2.0" fill="${c.gold}"/>
      <circle cx="36" cy="18" r="1.8" fill="${c.gold}"/>
    </g>

    <!-- ============================================================== -->
    <!-- 3. PETITE BOTANICAL ACCENT ON BOTTOM-LEFT FRAME JOINT          -->
    <!-- ============================================================== -->
    <g transform="translate(110, 364)">
      <g transform="translate(-10, 10) rotate(145)">
        <path d="M 0,0 C -6,-12 -10,-26 0,-38 C 10,-26 6,-12 0,0 Z" fill="url(#stk-leaf-hl-${themeKey})" stroke="${c.stem}" stroke-width="0.4"/>
      </g>
      <g transform="translate(-18, -8) rotate(-110)">
        <path d="M 0,0 C -6,-12 -10,-26 0,-36 C 10,-26 6,-12 0,0 Z" fill="url(#stk-leaf-sh-${themeKey})" stroke="${c.stem}" stroke-width="0.4"/>
      </g>
      <g transform="translate(-8, 5) scale(0.42) rotate(-45)">
        <path d="M -35,5 C -50,40 10,65 35,35 C 45,20 15,10 -35,5 Z" fill="url(#stk-rose-mid-${themeKey})"/>
        <path d="M -15,-5 C -22,-25 15,-28 18,-6 C 20,8 -5,12 -15,-5 Z" fill="url(#stk-rose-deep-${themeKey})"/>
      </g>
      <circle cx="6" cy="8" r="2.2" fill="${c.gold}"/>
    </g>
  </svg>
  `;
}

async function renderStackedPreviews() {
  const themes = ['verdant_vow', 'puspa_jawi'];

  for (const themeKey of themes) {
    const tlSvg = getRealisticCoverSvg(themeKey, 'tl');
    const brSvg = getRealisticCoverSvg(themeKey, 'br');
    const frameSvg = getStackedFloralFrameSvg(themeKey);
    const c = getThemeColors(themeKey);

    const fullSvg = `
    <svg width="800" height="1131" viewBox="0 0 800 1131" xmlns="http://www.w3.org/2000/svg">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&amp;family=Montserrat:wght@400;600;700&amp;family=Playfair+Display:ital,wght@1,500&amp;display=swap');
        .title-caps { font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 700; letter-spacing: 6px; fill: ${c.titleColor}; }
        .name-groom { font-family: 'Great Vibes', cursive, 'Brush Script MT', serif; font-size: 52px; fill: ${c.nameColor}; }
        .name-ampersand { font-family: 'Playfair Display', serif; font-style: italic; font-size: 28px; fill: ${c.gold}; }
        .name-bride { font-family: 'Great Vibes', cursive, 'Brush Script MT', serif; font-size: 52px; fill: ${c.nameColor}; }
        .meta-date { font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2.5px; fill: ${c.dateColor}; }
        .rec-title { font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 500; fill: ${c.titleColor}; }
        .rec-sub { font-family: 'Playfair Display', serif; font-style: italic; font-size: 14.5px; fill: ${c.nameColor}; }
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

      <!-- Center Luxury Gilded Frame (Width 480, Height 403.2 => centered at X: 400, Y: 350) -->
      <!-- Frame placed at X: 160, Y: 155 with scale 0.96 -->
      <g transform="translate(160, 145) scale(0.96)">
        ${frameSvg}
      </g>

      <!-- STACKED TYPOGRAPHY CENTERED INSIDE FRAME -->
      <text x="400" y="240" text-anchor="middle" class="title-caps">THE WEDDING</text>
      <text x="400" y="305" text-anchor="middle" class="name-groom">Baskara</text>
      <text x="400" y="345" text-anchor="middle" class="name-ampersand">&amp;</text>
      <text x="400" y="405" text-anchor="middle" class="name-bride">Anindya</text>
      <text x="400" y="475" text-anchor="middle" class="meta-date">SABTU, 31 OKTOBER 2026</text>

      <!-- Recipient Section -->
      <text x="400" y="650" text-anchor="middle" class="rec-title">Kepada Yth.</text>
      <text x="400" y="674" text-anchor="middle" class="rec-sub">Bapak / Ibu / Saudara / i</text>

      <g transform="translate(180, 700)">
        <rect width="440" height="155" rx="16" fill="#ffffff" stroke="${c.cardStroke}" stroke-width="1.4"/>
        <rect x="6" y="6" width="428" height="143" rx="12" fill="none" stroke="${c.cardDash}" stroke-width="0.9" stroke-dasharray="6,4"/>
      </g>

      <text x="400" y="885" text-anchor="middle" class="apology-note">Mohon maaf apabila ada kesalahan dalam penulisan nama / gelar</text>
    </svg>
    `;

    const buf = await sharp(Buffer.from(fullSvg)).png().toBuffer();
    const outPath = `scratch/test_stacked_${themeKey}.png`;
    fs.writeFileSync(outPath, buf);
    console.log(`Saved ${outPath}`);
  }
}

renderStackedPreviews().catch(console.error);

