import fs from 'node:fs';
import sharp from 'sharp';
import { getRealisticCoverSvg } from './test-full-botanical-cover.mjs';
import { getSpaciousCenterFrameSvg } from './test-inside-frame.mjs';

function getThemeBgPalette(themeKey = 'verdant_vow') {
  if (themeKey.includes('jawi') || themeKey.includes('java')) {
    return {
      baseLight: '#fdfbf9',
      baseWarm: '#faefe9',
      washMain: 'rgba(238, 178, 188, 0.42)', // soft dusty rose
      washSoft: 'rgba(248, 212, 218, 0.35)', // blush mist
      washWarm: 'rgba(245, 205, 175, 0.32)', // warm peach glow
      washDeep: 'rgba(215, 145, 160, 0.28)', // deeper rose accent
      leafWatermark: 'rgba(165, 185, 160, 0.22)', // sage leaf silhouette
      goldLine: 'rgba(194, 150, 62, 0.55)',
      goldStar: '#c2963e',
      titleColor: '#3a121a',
      nameColor: '#94384d',
      goldColor: '#c2963e',
      dateColor: '#ab5b6d',
      cardStroke: '#e8c4cc',
      cardDash: '#f2d8dd',
    };
  } else if (themeKey.includes('lunara') || themeKey.includes('azure')) {
    return {
      baseLight: '#fbfcfd',
      baseWarm: '#edf4fb',
      washMain: 'rgba(168, 202, 238, 0.45)', // soft dusty azure
      washSoft: 'rgba(202, 224, 248, 0.36)', // airy sky mist
      washWarm: 'rgba(185, 215, 235, 0.30)', // soft aqua glow
      washDeep: 'rgba(130, 172, 215, 0.28)', // slate blue accent
      leafWatermark: 'rgba(145, 180, 205, 0.22)',
      goldLine: 'rgba(120, 149, 184, 0.55)',
      goldStar: '#7895b8',
      titleColor: '#102233',
      nameColor: '#3d6c96',
      goldColor: '#7895b8',
      dateColor: '#618eb8',
      cardStroke: '#c4d8e8',
      cardDash: '#dae7f2',
    };
  } else if (themeKey.includes('aurelia') || themeKey.includes('grande')) {
    return {
      baseLight: '#fdfbf7',
      baseWarm: '#f6ede0',
      washMain: 'rgba(238, 202, 145, 0.45)', // warm honey champagne
      washSoft: 'rgba(248, 226, 185, 0.36)', // candlelight amber mist
      washWarm: 'rgba(240, 215, 165, 0.32)', // warm gold glow
      washDeep: 'rgba(210, 168, 105, 0.28)', // imperial bronze accent
      leafWatermark: 'rgba(190, 175, 135, 0.22)',
      goldLine: 'rgba(197, 154, 48, 0.55)',
      goldStar: '#c59a30',
      titleColor: '#2b210e',
      nameColor: '#8c672b',
      goldColor: '#c59a30',
      dateColor: '#ad8949',
      cardStroke: '#e8d9bd',
      cardDash: '#f2e8d3',
    };
  } else {
    // Verdant Vow
    return {
      baseLight: '#fcfbf8',
      baseWarm: '#edf4ec',
      washMain: 'rgba(175, 212, 170, 0.45)', // fresh eucalyptus sage
      washSoft: 'rgba(205, 230, 200, 0.36)', // pale spring mist
      washWarm: 'rgba(238, 220, 195, 0.32)', // warm champagne glow
      washDeep: 'rgba(140, 185, 135, 0.28)', // deeper sage accent
      leafWatermark: 'rgba(125, 170, 125, 0.22)',
      goldLine: 'rgba(184, 148, 77, 0.55)',
      goldStar: '#b8944d',
      titleColor: '#16221a',
      nameColor: '#4a6c52',
      goldColor: '#b8944d',
      dateColor: '#6c8e74',
      cardStroke: '#cde0ca',
      cardDash: '#dceadc',
    };
  }
}

// RICH LUXURY WATERCOLOR BACKGROUND SVG FOR COVER (800 x 1131)
export function getRichCoverBackgroundSvg(themeKey = 'verdant_vow') {
  const b = getThemeBgPalette(themeKey);

  return `
  <svg width="800" height="1131" viewBox="0 0 800 1131" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Base Paper Gradient -->
      <linearGradient id="rc-base-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${b.baseLight}"/>
        <stop offset="45%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="${b.baseWarm}"/>
      </linearGradient>

      <!-- Soft Radial Glow Behind Central Frame -->
      <radialGradient id="rc-centerGlow-${themeKey}" cx="50%" cy="33%" r="42%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/>
        <stop offset="60%" stop-color="${b.baseLight}" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>

      <!-- Organic Top-Right Pastel Wash Arch -->
      <radialGradient id="rc-trWash-${themeKey}" cx="85%" cy="18%" r="48%">
        <stop offset="0%" stop-color="${b.washMain}"/>
        <stop offset="50%" stop-color="${b.washSoft}"/>
        <stop offset="85%" stop-color="${b.washWarm}" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>

      <!-- Organic Bottom-Left Pastel Wash Arch -->
      <radialGradient id="rc-blWash-${themeKey}" cx="15%" cy="80%" r="48%">
        <stop offset="0%" stop-color="${b.washMain}"/>
        <stop offset="50%" stop-color="${b.washSoft}"/>
        <stop offset="85%" stop-color="${b.washWarm}" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>

      <!-- Mid-Left Floating Watercolor Aura -->
      <radialGradient id="rc-mlWash-${themeKey}" cx="8%" cy="45%" r="32%">
        <stop offset="0%" stop-color="${b.washSoft}"/>
        <stop offset="65%" stop-color="${b.washWarm}" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>

      <!-- Mid-Right Floating Watercolor Aura -->
      <radialGradient id="rc-mrWash-${themeKey}" cx="92%" cy="58%" r="32%">
        <stop offset="0%" stop-color="${b.washSoft}"/>
        <stop offset="65%" stop-color="${b.washWarm}" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <!-- 1. BASE PAPER -->
    <rect width="800" height="1131" fill="url(#rc-base-${themeKey})"/>

    <!-- 2. ORGANIC WATERCOLOR WASHES & AURA POOLS -->
    <!-- Top-Right Watercolor Cloud -->
    <path d="M 450,0 C 580,20 740,60 800,180 L 800,0 Z" fill="${b.washSoft}"/>
    <ellipse cx="680" cy="190" rx="220" ry="160" fill="url(#rc-trWash-${themeKey})"/>

    <!-- Bottom-Left Watercolor Cloud -->
    <path d="M 0,950 C 60,1050 200,1110 350,1131 L 0,1131 Z" fill="${b.washSoft}"/>
    <ellipse cx="130" cy="910" rx="220" ry="170" fill="url(#rc-blWash-${themeKey})"/>

    <!-- Floating Mid-Side Soft Auras -->
    <ellipse cx="60" cy="500" rx="140" ry="180" fill="url(#rc-mlWash-${themeKey})"/>
    <ellipse cx="740" cy="620" rx="140" ry="180" fill="url(#rc-mrWash-${themeKey})"/>

    <!-- Soft Central Illumination Behind Frame -->
    <ellipse cx="400" cy="370" rx="320" ry="260" fill="url(#rc-centerGlow-${themeKey})"/>

    <!-- 3. ABSTRACT CONTINUOUS GOLD CONTOUR LINES (Luxury Modern Stationery Art) -->
    <!-- Gentle wavy abstract line 1 (Top right flowing across) -->
    <path d="M 520,30 C 620,80 730,130 760,260 C 780,340 730,420 790,490" 
          fill="none" stroke="${b.goldLine}" stroke-width="0.9" stroke-linecap="round" stroke-dasharray="4,2"/>
    <path d="M 560,20 C 650,90 710,180 720,290 C 728,370 690,440 740,510" 
          fill="none" stroke="${b.goldLine}" stroke-width="0.75" stroke-linecap="round"/>

    <!-- Gentle wavy abstract line 2 (Bottom left flowing up) -->
    <path d="M 280,1100 C 180,1050 70,1000 40,870 C 20,790 70,710 10,640" 
          fill="none" stroke="${b.goldLine}" stroke-width="0.9" stroke-linecap="round" stroke-dasharray="4,2"/>
    <path d="M 240,1110 C 150,1040 90,950 80,840 C 72,760 110,690 60,620" 
          fill="none" stroke="${b.goldLine}" stroke-width="0.75" stroke-linecap="round"/>

    <!-- Delicate concentric framing arcs in background corners -->
    <path d="M 680,60 A 180,180 0 0 1 780,240" fill="none" stroke="${b.goldLine}" stroke-width="0.8" opacity="0.7"/>
    <path d="M 120,1070 A 180,180 0 0 1 20,890" fill="none" stroke="${b.goldLine}" stroke-width="0.8" opacity="0.7"/>

    <!-- 4. GHOST BOTANICAL SILHOUETTES (Soft Watermark Leaves Drifting in Open Space) -->
    <!-- Upper right open zone watermark leaf branch -->
    <g transform="translate(640, 320) rotate(-35) scale(0.85)" opacity="0.65">
      <path d="M 0,0 Q 30,-50 20,-110" fill="none" stroke="${b.leafWatermark}" stroke-width="1.2"/>
      <path d="M 5,-25 C 25,-35 40,-30 45,-15 C 35,-5 20,-10 5,-25 Z" fill="${b.leafWatermark}"/>
      <path d="M 12,-55 C -5,-65 -20,-60 -25,-45 C -15,-35 0,-40 12,-55 Z" fill="${b.leafWatermark}"/>
      <path d="M 18,-85 C 38,-95 50,-85 55,-70 C 45,-60 30,-68 18,-85 Z" fill="${b.leafWatermark}"/>
      <path d="M 20,-110 C 15,-128 30,-135 35,-120 C 32,-110 22,-105 20,-110 Z" fill="${b.leafWatermark}"/>
    </g>

    <!-- Lower left open zone watermark leaf branch -->
    <g transform="translate(160, 680) rotate(145) scale(0.85)" opacity="0.65">
      <path d="M 0,0 Q 30,-50 20,-110" fill="none" stroke="${b.leafWatermark}" stroke-width="1.2"/>
      <path d="M 5,-25 C 25,-35 40,-30 45,-15 C 35,-5 20,-10 5,-25 Z" fill="${b.leafWatermark}"/>
      <path d="M 12,-55 C -5,-65 -20,-60 -25,-45 C -15,-35 0,-40 12,-55 Z" fill="${b.leafWatermark}"/>
      <path d="M 18,-85 C 38,-95 50,-85 55,-70 C 45,-60 30,-68 18,-85 Z" fill="${b.leafWatermark}"/>
      <path d="M 20,-110 C 15,-128 30,-135 35,-120 C 32,-110 22,-105 20,-110 Z" fill="${b.leafWatermark}"/>
    </g>

    <!-- 5. SPARKLING GOLD STARDUST & 4-POINT DIAMOND STARS -->
    <!-- Helper 4-point star macro: cx, cy, size -->
    <!-- Top-Right constellation -->
    <polygon points="690,130 692,136 698,138 692,140 690,146 688,140 682,138 688,136" fill="${b.goldStar}" opacity="0.85"/>
    <circle cx="650" cy="180" r="1.8" fill="${b.goldStar}" opacity="0.7"/>
    <circle cx="730" cy="220" r="2.4" fill="${b.goldStar}" opacity="0.8"/>
    <circle cx="680" cy="260" r="1.5" fill="${b.goldStar}" opacity="0.6"/>
    <polygon points="610,240 611,244 615,245 611,246 610,250 609,246 605,245 609,244" fill="${b.goldStar}" opacity="0.75"/>

    <!-- Bottom-Left constellation -->
    <polygon points="110,880 112,886 118,888 112,890 110,896 108,890 102,888 108,886" fill="${b.goldStar}" opacity="0.85"/>
    <circle cx="150" cy="830" r="1.8" fill="${b.goldStar}" opacity="0.7"/>
    <circle cx="70" cy="790" r="2.4" fill="${b.goldStar}" opacity="0.8"/>
    <circle cx="120" cy="750" r="1.5" fill="${b.goldStar}" opacity="0.6"/>
    <polygon points="190,770 191,774 195,775 191,776 190,780 189,776 185,775 189,774" fill="${b.goldStar}" opacity="0.75"/>

    <!-- Mid-space ambient sparkles around frame perimeter -->
    <circle cx="210" cy="230" r="1.6" fill="${b.goldStar}" opacity="0.65"/>
    <circle cx="590" cy="230" r="1.6" fill="${b.goldStar}" opacity="0.65"/>
    <circle cx="200" cy="510" r="1.8" fill="${b.goldStar}" opacity="0.65"/>
    <circle cx="600" cy="510" r="1.8" fill="${b.goldStar}" opacity="0.65"/>
    <polygon points="400,90 401.5,94 406,95.5 401.5,97 400,101 398.5,97 394,95.5 398.5,94" fill="${b.goldStar}" opacity="0.75"/>

    <!-- 6. SUBTLE LUXURY INSET BORDER (Handmade Paper Edge Margin) -->
    <rect x="20" y="20" width="760" height="1091" rx="8" fill="none" stroke="${b.goldLine}" stroke-width="0.5" opacity="0.35"/>
  </svg>
  `;
}

async function testRichCover() {
  const themes = ['verdant_vow', 'puspa_jawi', 'lunara_azure', 'aurelia_grande'];

  for (const themeKey of themes) {
    const bgSvg = getRichCoverBackgroundSvg(themeKey);
    const tlSvg = getRealisticCoverSvg(themeKey, 'tl');
    const brSvg = getRealisticCoverSvg(themeKey, 'br');
    const centerFrameSvg = getSpaciousCenterFrameSvg(themeKey);
    const b = getThemeBgPalette(themeKey);

    const fullSvg = `
    <svg width="800" height="1131" viewBox="0 0 800 1131" xmlns="http://www.w3.org/2000/svg">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&amp;family=Montserrat:wght@400;600;700&amp;family=Playfair+Display:ital,wght@1,500&amp;display=swap');
        .title-caps { font-family: 'Montserrat', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 5px; fill: ${b.titleColor}; }
        .name-groom { font-family: 'Great Vibes', cursive, 'Brush Script MT', serif; font-size: 48px; fill: ${b.nameColor}; }
        .name-ampersand { font-family: 'Playfair Display', serif; font-style: italic; font-size: 26px; fill: ${b.goldColor}; }
        .name-bride { font-family: 'Great Vibes', cursive, 'Brush Script MT', serif; font-size: 48px; fill: ${b.nameColor}; }
        .meta-date { font-family: 'Montserrat', sans-serif; font-size: 12.5px; font-weight: 600; letter-spacing: 2.2px; fill: ${b.dateColor}; }
        .rec-title { font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 500; fill: ${b.titleColor}; }
        .rec-sub { font-family: 'Playfair Display', serif; font-style: italic; font-size: 14.5px; fill: ${b.nameColor}; }
        .apology-note { font-family: 'Montserrat', sans-serif; font-size: 11px; font-style: italic; fill: #c0392b; }
      </style>

      <!-- 1. Rich Luxury Background Layer -->
      <g transform="translate(0, 0)">
        ${bgSvg.replace(/<svg[^>]*>|<\/svg>/g, '')}
      </g>

      <!-- 2. Floral Corners -->
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

      <!-- 3. Center Luxury Spacious Crystal Frame -->
      <g transform="translate(140, 150)">
        ${centerFrameSvg}
      </g>

      <!-- 4. Typography 100% Inside Frame -->
      <text x="400" y="222" text-anchor="middle" class="title-caps">THE WEDDING</text>
      <text x="400" y="285" text-anchor="middle" class="name-groom">Baskara</text>
      <text x="400" y="330" text-anchor="middle" class="name-ampersand">&amp;</text>
      <text x="400" y="395" text-anchor="middle" class="name-bride">Anindya</text>
      <text x="400" y="475" text-anchor="middle" class="meta-date">SABTU, 31 OKTOBER 2026</text>

      <!-- 5. Recipient Section -->
      <text x="400" y="650" text-anchor="middle" class="rec-title">Kepada Yth.</text>
      <text x="400" y="674" text-anchor="middle" class="rec-sub">Bapak / Ibu / Saudara / i</text>

      <g transform="translate(180, 700)">
        <rect width="440" height="155" rx="16" fill="#ffffff" stroke="${b.cardStroke}" stroke-width="1.4"/>
        <rect x="6" y="6" width="428" height="143" rx="12" fill="none" stroke="${b.cardDash}" stroke-width="0.9" stroke-dasharray="6,4"/>
      </g>

      <text x="400" y="885" text-anchor="middle" class="apology-note">Mohon maaf apabila ada kesalahan dalam penulisan nama / gelar</text>
    </svg>
    `;

    const buf = await sharp(Buffer.from(fullSvg)).png().toBuffer();
    const outPath = `scratch/rich_bg_${themeKey}.png`;
    fs.writeFileSync(outPath, buf);
    console.log(`Saved ${outPath}`);

    // Sync to artifacts directory
    const artPath = `C:/Users/dandi120502/.gemini/antigravity/brain/d7e868e7-6d37-4a0e-9209-fdd022e77915/cover_preview_${themeKey}.png`;
    fs.copyFileSync(outPath, artPath);
    console.log(`Updated artifact ${artPath}`);
  }
}

testRichCover().catch(console.error);
