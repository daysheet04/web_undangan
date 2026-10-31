import fs from 'node:fs';
import sharp from 'sharp';

// ---------------------------------------------------------------------------
// 1. PALETTES PER THEME (Rich gradient hues, flowers, and typography)
// ---------------------------------------------------------------------------
export function getLushThemePalette(themeKey = 'verdant_vow') {
  if (themeKey.includes('jawi') || themeKey.includes('java')) {
    return {
      // Background Gradient
      bgGradStart: '#ffd1dc',      // Rich romantic blush pink
      bgGradMid1:  '#ffe6eb',      // Soft pastel blush
      bgGradCenter:'#fef9f7',      // Warm luminous ivory cream
      bgGradMid2:  '#ffe8ed',      // Delicate rose mist
      bgGradEnd:   '#fcc8d4',      // Deep dusty rose
      washColor1:  'rgba(245, 170, 185, 0.55)',
      washColor2:  'rgba(255, 195, 205, 0.45)',
      washColor3:  'rgba(235, 150, 170, 0.35)',
      goldContour: 'rgba(194, 150, 62, 0.65)',
      goldStar:    '#c2963e',
      leafWatermark: 'rgba(165, 185, 160, 0.28)',

      // Frame Gold
      goldLight:   '#f4dfaa',
      goldMain:    '#c2963e',
      goldDark:    '#8f6a20',

      // Floral Hues (Roses, florets, leaves)
      roseOuter1:  '#fff5f7',
      roseOuter2:  '#fcd3dc',
      roseMid1:    '#f8b4c4',
      roseMid2:    '#ea869e',
      roseDeep1:   '#c44d68',
      roseDeep2:   '#8c243a',
      floretPetal: '#fff2f5',
      floretCenter:'#c2963e',
      leafHl:      '#b3d4b6',
      leafMid:     '#6fa374',
      leafDeep:    '#335c39',
      leafShadow:  '#1c3821',
      stem:        '#2b472e',

      // Typography
      titleColor:  '#3a121a',
      nameColor:   '#94384d',
      goldText:    '#b88a32',
      dateColor:   '#94384d',
      recTitle:    '#3a121a',
      recSub:      '#94384d',
      cardStroke:  '#e8c4cc',
      cardDash:    '#f2d8dd',
    };
  } else if (themeKey.includes('lunara') || themeKey.includes('azure')) {
    return {
      // Background Gradient
      bgGradStart: '#cce2f7',      // Powdery sky azure
      bgGradMid1:  '#e2effa',      // Soft airy azure
      bgGradCenter:'#f7faff',      // Pearl ivory glow
      bgGradMid2:  '#e4f0fa',      // Gentle azure mist
      bgGradEnd:   '#c4def5',      // Deep azure pool
      washColor1:  'rgba(150, 195, 240, 0.55)',
      washColor2:  'rgba(180, 215, 250, 0.45)',
      washColor3:  'rgba(125, 175, 225, 0.35)',
      goldContour: 'rgba(120, 150, 185, 0.65)',
      goldStar:    '#7895b8',
      leafWatermark: 'rgba(145, 180, 205, 0.28)',

      // Frame Gold
      goldLight:   '#d0e2f5',
      goldMain:    '#7895b8',
      goldDark:    '#4a6c8e',

      // Floral Hues
      roseOuter1:  '#f4f8fd',
      roseOuter2:  '#d4e4f7',
      roseMid1:    '#acc8ea',
      roseMid2:    '#7fa8d6',
      roseDeep1:   '#4a7cb3',
      roseDeep2:   '#234a78',
      floretPetal: '#f0f6fc',
      floretCenter:'#8ca7c7',
      leafHl:      '#b0d1db',
      leafMid:     '#699fb0',
      leafDeep:    '#345e6d',
      leafShadow:  '#193640',
      stem:        '#20414d',

      // Typography
      titleColor:  '#102233',
      nameColor:   '#2e5b85',
      goldText:    '#5c82a8',
      dateColor:   '#2e5b85',
      recTitle:    '#102233',
      recSub:      '#2e5b85',
      cardStroke:  '#c4d8e8',
      cardDash:    '#dae7f2',
    };
  } else if (themeKey.includes('aurelia') || themeKey.includes('grande')) {
    return {
      // Background Gradient
      bgGradStart: '#fae2bc',      // Rich champagne gold
      bgGradMid1:  '#fdefd8',      // Soft warm honey
      bgGradCenter:'#fefaf3',      // Luminous warm pearl
      bgGradMid2:  '#fcf1dd',      // Golden mist
      bgGradEnd:   '#f8ddb0',      // Warm bronze amber
      washColor1:  'rgba(240, 195, 135, 0.55)',
      washColor2:  'rgba(250, 215, 165, 0.45)',
      washColor3:  'rgba(220, 175, 110, 0.35)',
      goldContour: 'rgba(197, 154, 48, 0.65)',
      goldStar:    '#c59a30',
      leafWatermark: 'rgba(190, 175, 135, 0.28)',

      // Frame Gold
      goldLight:   '#fae8b8',
      goldMain:    '#c59a30',
      goldDark:    '#8a6515',

      // Floral Hues
      roseOuter1:  '#fffdf8',
      roseOuter2:  '#faecd6',
      roseMid1:    '#f4d5a6',
      roseMid2:    '#e5b66d',
      roseDeep1:   '#bf8332',
      roseDeep2:   '#804f14',
      floretPetal: '#fffcf5',
      floretCenter:'#d4af37',
      leafHl:      '#c5dba8',
      leafMid:     '#86a867',
      leafDeep:    '#4d6934',
      leafShadow:  '#283b18',
      stem:        '#364d23',

      // Typography
      titleColor:  '#2b210e',
      nameColor:   '#876122',
      goldText:    '#a67e2a',
      dateColor:   '#876122',
      recTitle:    '#2b210e',
      recSub:      '#876122',
      cardStroke:  '#e8d9bd',
      cardDash:    '#f2e8d3',
    };
  } else {
    // Verdant Vow
    return {
      // Background Gradient
      bgGradStart: '#d0ead2',      // Fresh vibrant sage green tint
      bgGradMid1:  '#e4f3e6',      // Pale airy mint wash
      bgGradCenter:'#fcfbf7',      // Warm luminous ivory cream
      bgGradMid2:  '#e7f4e8',      // Soft eucalyptus mist
      bgGradEnd:   '#c8e6cb',      // Deep sage watercolor pool
      washColor1:  'rgba(160, 215, 165, 0.55)',
      washColor2:  'rgba(195, 235, 200, 0.45)',
      washColor3:  'rgba(135, 195, 140, 0.35)',
      goldContour: 'rgba(184, 148, 77, 0.65)',
      goldStar:    '#b8944d',
      leafWatermark: 'rgba(125, 175, 130, 0.28)',

      // Frame Gold
      goldLight:   '#f4e2b6',
      goldMain:    '#b8944d',
      goldDark:    '#7a5e23',

      // Floral Hues
      roseOuter1:  '#fffdf9',
      roseOuter2:  '#f7ebe1',
      roseMid1:    '#eed5c2',
      roseMid2:    '#dfb79e',
      roseDeep1:   '#bf8b6c',
      roseDeep2:   '#8c593b',
      floretPetal: '#fffaf4',
      floretCenter:'#b8944d',
      leafHl:      '#b8dcba',
      leafMid:     '#74a87b',
      leafDeep:    '#3d6e46',
      leafShadow:  '#1e4024',
      stem:        '#264a2c',

      // Typography
      titleColor:  '#16221a',
      nameColor:   '#3e6246',
      goldText:    '#a88235',
      dateColor:   '#3e6246',
      recTitle:    '#16221a',
      recSub:      '#3e6246',
      cardStroke:  '#cde0ca',
      cardDash:    '#dceadc',
    };
  }
}

// ---------------------------------------------------------------------------
// 2. VIBRANT MULTI-STOP BACKGROUND GRADIENT WITH WATERCOLOR WASHES & WAVES
// ---------------------------------------------------------------------------
export function getRichGradientBackgroundSvg(themeKey = 'verdant_vow') {
  const p = getLushThemePalette(themeKey);

  return `
  <svg width="800" height="1131" viewBox="0 0 800 1131" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Diagonal Multi-Stop Master Gradient -->
      <linearGradient id="bg-grad-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.bgGradStart}"/>
        <stop offset="22%" stop-color="${p.bgGradMid1}"/>
        <stop offset="50%" stop-color="${p.bgGradCenter}"/>
        <stop offset="78%" stop-color="${p.bgGradMid2}"/>
        <stop offset="100%" stop-color="${p.bgGradEnd}"/>
      </linearGradient>

      <!-- Horizontal Soft Wash Gradient (Top Area) -->
      <linearGradient id="wash-top-${themeKey}" x1="0%" y1="0%" x2="100%" y2="50%">
        <stop offset="0%" stop-color="${p.washColor1}"/>
        <stop offset="45%" stop-color="${p.washColor2}"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </linearGradient>

      <!-- Diagonal Soft Wash Gradient (Bottom Area) -->
      <linearGradient id="wash-bot-${themeKey}" x1="100%" y1="100%" x2="0%" y2="50%">
        <stop offset="0%" stop-color="${p.washColor1}"/>
        <stop offset="50%" stop-color="${p.washColor2}"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </linearGradient>

      <!-- Ambient Center Radial Halo (Clears the center behind frame for crisp text) -->
      <radialGradient id="center-halo-${themeKey}" cx="50%" cy="33%" r="42%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
        <stop offset="55%" stop-color="#ffffff" stop-opacity="0.75"/>
        <stop offset="85%" stop-color="#ffffff" stop-opacity="0.30"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>

      <!-- Soft Gaussian Blur Filter for Watercolor Pools -->
      <filter id="blur-wash" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="35"/>
      </filter>
      <filter id="blur-subtle" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
    </defs>

    <!-- 1. Master Base Gradient Canvas -->
    <rect width="800" height="1131" fill="url(#bg-grad-${themeKey})"/>

    <!-- 2. Watercolor Cloud Pools in Top-Left and Top-Right -->
    <g filter="url(#blur-wash)">
      <!-- Top-left deep watercolor pool -->
      <path d="M -50,-50 C 120,-30 280,40 320,180 C 350,300 240,420 100,450 C -20,470 -70,320 -50,-50 Z"
            fill="${p.washColor1}"/>
      <!-- Top-right delicate cloud -->
      <path d="M 850,-40 C 720,20 620,120 650,260 C 680,360 780,420 850,440 Z"
            fill="${p.washColor2}"/>
      <!-- Bottom-right deep watercolor pool -->
      <path d="M 850,1180 C 680,1160 520,1080 480,940 C 450,820 560,700 700,670 C 820,650 870,800 850,1180 Z"
            fill="${p.washColor1}"/>
      <!-- Bottom-left delicate cloud -->
      <path d="M -50,1170 C 80,1120 180,1020 150,880 C 120,780 20,720 -50,700 Z"
            fill="${p.washColor2}"/>
    </g>

    <!-- 3. Central Ambient Luminous Halo (Keeps frame & names radiant and readable) -->
    <rect width="800" height="1131" fill="url(#center-halo-${themeKey})"/>

    <!-- 4. Subtle Ghost Botanical Watermark Leaf Sprigs in Background -->
    <g opacity="0.32">
      <!-- Upper right ghost foliage -->
      <g transform="translate(640, 160) rotate(35) scale(0.95)">
        <path d="M 0,0 C -30,60 -60,140 -20,220" fill="none" stroke="${p.leafWatermark}" stroke-width="1.8"/>
        <path d="M -8,45 C -35,35 -50,15 -35,5 C -20,-5 -5,25 -8,45 Z" fill="${p.leafWatermark}"/>
        <path d="M -18,95 C -48,90 -62,70 -48,60 C -34,50 -16,75 -18,95 Z" fill="${p.leafWatermark}"/>
        <path d="M -26,145 C -55,145 -70,125 -55,115 C -40,105 -24,130 -26,145 Z" fill="${p.leafWatermark}"/>
        <path d="M -22,190 C -50,195 -65,180 -50,170 C -35,160 -20,180 -22,190 Z" fill="${p.leafWatermark}"/>
      </g>
      <!-- Lower left ghost foliage -->
      <g transform="translate(160, 960) rotate(-145) scale(0.95)">
        <path d="M 0,0 C -30,60 -60,140 -20,220" fill="none" stroke="${p.leafWatermark}" stroke-width="1.8"/>
        <path d="M -8,45 C -35,35 -50,15 -35,5 C -20,-5 -5,25 -8,45 Z" fill="${p.leafWatermark}"/>
        <path d="M -18,95 C -48,90 -62,70 -48,60 C -34,50 -16,75 -18,95 Z" fill="${p.leafWatermark}"/>
        <path d="M -26,145 C -55,145 -70,125 -55,115 C -40,105 -24,130 -26,145 Z" fill="${p.leafWatermark}"/>
      </g>
    </g>

    <!-- 5. Elegant Abstract Gold Contour Line Art & Sweeping Arcs -->
    <g opacity="0.75">
      <!-- Top-right sweeping curves -->
      <path d="M 520,30 C 620,70 700,160 720,270 C 740,380 690,470 740,560"
            fill="none" stroke="${p.goldContour}" stroke-width="0.9" stroke-linecap="round"/>
      <path d="M 560,25 C 655,75 730,175 745,295 C 760,400 720,490 760,575"
            fill="none" stroke="${p.goldContour}" stroke-width="0.55" stroke-dasharray="7,4"/>
      <!-- Bottom-left sweeping curves -->
      <path d="M 280,1100 C 180,1060 100,970 80,860 C 60,750 110,660 60,570"
            fill="none" stroke="${p.goldContour}" stroke-width="0.9" stroke-linecap="round"/>
      <path d="M 240,1105 C 145,1055 70,955 55,835 C 40,730 80,640 40,555"
            fill="none" stroke="${p.goldContour}" stroke-width="0.55" stroke-dasharray="7,4"/>
    </g>

    <!-- 6. Floating Gold Stardust Constellations & Diamond Stars -->
    <g fill="${p.goldStar}">
      <!-- 4-point Diamond Stars -->
      <path d="M 690,140 Q 690,148 698,148 Q 690,148 690,156 Q 690,148 682,148 Q 690,148 690,140 Z"/>
      <path d="M 110,980 Q 110,988 118,988 Q 110,988 110,996 Q 110,988 102,988 Q 110,988 110,980 Z"/>
      <path d="M 645,510 Q 645,516 651,516 Q 645,516 645,522 Q 645,516 639,516 Q 645,516 645,510 Z"/>
      <path d="M 155,615 Q 155,621 161,621 Q 155,621 155,627 Q 155,621 149,621 Q 155,621 155,615 Z"/>
      <!-- Stardust Beads -->
      <circle cx="650" cy="180" r="1.6" opacity="0.85"/>
      <circle cx="730" cy="220" r="2.0" opacity="0.9"/>
      <circle cx="710" cy="360" r="1.4" opacity="0.8"/>
      <circle cx="150" cy="940" r="1.6" opacity="0.85"/>
      <circle cx="70" cy="900" r="2.0" opacity="0.9"/>
      <circle cx="90" cy="760" r="1.4" opacity="0.8"/>
    </g>

    <!-- 7. Fine Inset Border Margin (Stationery Edge) -->
    <rect x="20" y="20" width="760" height="1091" rx="6" fill="none"
          stroke="${p.goldContour}" stroke-width="0.6" opacity="0.55"/>
  </svg>
  `;
}

// ---------------------------------------------------------------------------
// 3. SOFT ROUNDED DOUBLE-LINE FRAME WITH LUSH DIAGONAL ROSES & FLORETS
//    (Smooth corners rx="34", zero sharp pointy angles, lush flowers on both TR and BL!)
// ---------------------------------------------------------------------------
export function getLushSoftFrameSvg(themeKey = 'verdant_vow') {
  const p = getLushThemePalette(themeKey);

  // Soft Double-line Rounded Cartouche dimensions
  // Total canvas: 520 x 360
  // Outer rect: x=50, y=30, w=420, h=300, rx=34
  // Inner rect: x=62, y=42, w=396, h=276, rx=24

  return `
  <svg width="520" height="360" viewBox="0 0 520 360" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Gold Frame Gradient -->
      <linearGradient id="soft-gold-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.goldLight}"/>
        <stop offset="50%" stop-color="${p.goldMain}"/>
        <stop offset="100%" stop-color="${p.goldDark}"/>
      </linearGradient>

      <!-- Rose Radial Gradients -->
      <radialGradient id="sf-rose-out-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="60%" stop-color="${p.roseOuter1}"/>
        <stop offset="100%" stop-color="${p.roseOuter2}"/>
      </radialGradient>
      <radialGradient id="sf-rose-mid-${themeKey}" cx="42%" cy="42%" r="65%">
        <stop offset="0%" stop-color="${p.roseOuter2}"/>
        <stop offset="60%" stop-color="${p.roseMid1}"/>
        <stop offset="100%" stop-color="${p.roseMid2}"/>
      </radialGradient>
      <radialGradient id="sf-rose-deep-${themeKey}" cx="40%" cy="40%" r="65%">
        <stop offset="0%" stop-color="${p.roseMid2}"/>
        <stop offset="70%" stop-color="${p.roseDeep1}"/>
        <stop offset="100%" stop-color="${p.roseDeep2}"/>
      </radialGradient>

      <!-- Leaf Gradients -->
      <linearGradient id="sf-leaf-hl-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafHl}"/>
        <stop offset="60%" stop-color="${p.leafMid}"/>
        <stop offset="100%" stop-color="${p.leafDeep}"/>
      </linearGradient>
      <linearGradient id="sf-leaf-sh-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafMid}"/>
        <stop offset="70%" stop-color="${p.leafDeep}"/>
        <stop offset="100%" stop-color="${p.leafShadow}"/>
      </linearGradient>
    </defs>

    <!-- 1. SOFT ROUNDED LUXURY DOUBLE GOLD FRAME (No sharp lancip corners!) -->
    <!-- Outer Rounded Rectangle (Smooth continuous curve rx=34) -->
    <rect x="50" y="30" width="420" height="300" rx="34" ry="34"
          fill="none" stroke="url(#soft-gold-${themeKey})" stroke-width="1.8" opacity="0.95"/>

    <!-- Inner Concentric Rounded Rectangle (Smooth rx=24) -->
    <rect x="62" y="42" width="396" height="276" rx="24" ry="24"
          fill="none" stroke="url(#soft-gold-${themeKey})" stroke-width="0.9" opacity="0.75"/>

    <!-- Delicate Gold Diamond Beads at Center Top & Bottom -->
    <g fill="${p.goldMain}">
      <path d="M 260,26 Q 260,30 264,30 Q 260,30 260,34 Q 260,30 256,30 Q 260,30 260,26 Z"/>
      <path d="M 260,326 Q 260,330 264,330 Q 260,330 260,334 Q 260,330 256,330 Q 260,330 260,326 Z"/>
      <circle cx="260" cy="42" r="1.6"/>
      <circle cx="260" cy="318" r="1.6"/>
    </g>

    <!-- ============================================================== -->
    <!-- 2. LUSH BOTANICAL FLORAL CLUSTER: TOP-RIGHT SHOULDER (TR)      -->
    <!-- ============================================================== -->
    <g transform="translate(425, 55)">
      <!-- Spray of Eucalyptus leaves reaching outward and along frame -->
      <g transform="translate(10, -32) rotate(25)">
        <path d="M 0,0 C -10,-20 -18,-42 0,-58 C 18,-42 10,-20 0,0 Z" fill="url(#sf-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
        <path d="M 0,0 Q 0,-29 0,-58" stroke="${p.stem}" stroke-width="1.1" opacity="0.8"/>
      </g>
      <g transform="translate(35, -10) rotate(65)">
        <path d="M 0,0 C -9,-18 -16,-36 0,-52 C 16,-36 9,-18 0,0 Z" fill="url(#sf-leaf-sh-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
        <path d="M 0,0 Q 0,-26 0,-52" stroke="${p.stem}" stroke-width="1.0" opacity="0.8"/>
      </g>
      <g transform="translate(30, 30) rotate(115)">
        <path d="M 0,0 C -9,-18 -16,-38 0,-54 C 16,-38 9,-18 0,0 Z" fill="url(#sf-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
        <path d="M 0,0 Q 0,-27 0,-54" stroke="${p.stem}" stroke-width="1.0" opacity="0.8"/>
      </g>
      <g transform="translate(-25, -25) rotate(-25)">
        <path d="M 0,0 C -8,-15 -14,-32 0,-44 C 14,-32 8,-15 0,0 Z" fill="url(#sf-leaf-sh-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
      </g>
      <!-- Trailing gold wire with beads -->
      <path d="M 0,0 Q 40,-30 55,-55" fill="none" stroke="${p.goldMain}" stroke-width="0.9" opacity="0.85"/>
      <circle cx="55" cy="-55" r="2.2" fill="${p.goldLight}"/>
      <circle cx="35" cy="-28" r="1.8" fill="${p.goldLight}"/>
      <path d="M 0,0 Q 45,20 60,45" fill="none" stroke="${p.goldMain}" stroke-width="0.9" opacity="0.85"/>
      <circle cx="60" cy="45" r="2.2" fill="${p.goldLight}"/>

      <!-- Rosebud with green sepals -->
      <g transform="translate(42, -32) rotate(42)">
        <path d="M 0,10 C 0,20 3,28 5,35" fill="none" stroke="${p.stem}" stroke-width="1.8"/>
        <path d="M -8,6 C -14,-12 0,-26 0,-26 C 0,-26 14,-12 8,6 Z" fill="url(#sf-rose-mid-${themeKey})"/>
        <path d="M -8,10 C -16,0 -14,-14 -10,-20 C -8,-10 -3,2 0,8 Z" fill="${p.leafDeep}"/>
        <path d="M 6,10 C 14,0 12,-14 8,-20 C 6,-10 1,2 0,8 Z" fill="${p.leafMid}"/>
      </g>

      <!-- Main Blooming Watercolor Rose (Lush & prominent) -->
      <g transform="translate(0, 0) scale(0.92)">
        <!-- Outer petals -->
        <path d="M -15,-35 C -45,-65 -75,-30 -60,10 C -48,22 -25,25 -10,0 Z" fill="url(#sf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M -25,-30 C -20,-75 35,-78 45,-38 C 48,-20 20,-10 0,-15 Z" fill="url(#sf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M 20,-30 C 65,-60 85,-15 70,25 C 60,35 30,20 15,0 Z" fill="url(#sf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M 25,10 C 75,25 65,75 15,70 C -10,65 5,35 0,15 Z" fill="url(#sf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M -20,20 C -15,72 40,78 30,35 C 25,15 -5,10 -15,20 Z" fill="url(#sf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M -15,15 C -65,45 -70,-5 -35,-15 C -20,-5 -10,5 -15,15 Z" fill="url(#sf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <!-- Mid petals -->
        <path d="M -28,-18 C -52,-42 -40,-60 -8,-45 C 5,-35 -5,-15 -28,-18 Z" fill="url(#sf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <path d="M 5,-32 C 38,-55 58,-32 40,-8 C 30,2 10,-10 5,-32 Z" fill="url(#sf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <path d="M 22,-8 C 55,2 52,42 18,36 C 5,30 10,10 22,-8 Z" fill="url(#sf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <path d="M -10,18 C 15,50 38,38 20,12 C 5,2 -5,5 -10,18 Z" fill="url(#sf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <path d="M -30,5 C -55,28 -32,48 -5,22 C 2,12 -12,2 -30,5 Z" fill="url(#sf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <!-- Center heart -->
        <path d="M -18,-12 C -30,-32 -10,-40 8,-26 C 15,-18 -2,-8 -18,-12 Z" fill="url(#sf-rose-deep-${themeKey})"/>
        <path d="M 10,-20 C 32,-18 35,10 14,14 C 2,16 2,-5 10,-20 Z" fill="url(#sf-rose-deep-${themeKey})"/>
        <path d="M -10,-6 C -16,-18 8,-20 12,-8 C 14,0 -2,6 -10,-6 Z" fill="url(#sf-rose-deep-${themeKey})"/>
        <path d="M -5,-3 C -2,-9 6,-7 5,-1 C 4,4 -3,4 -2,-1" fill="none" stroke="${p.roseDeep2}" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="1" cy="-1" r="1.6" fill="${p.goldMain}"/>
      </g>

      <!-- Secondary Blooming Companion Rose (Open side bloom) -->
      <g transform="translate(-28, 28) scale(0.65) rotate(-20)">
        <path d="M -25,-10 C -45,-45 10,-55 25,-25 C 20,-10 -5,-5 -25,-10 Z" fill="url(#sf-rose-out-${themeKey})" opacity="0.9"/>
        <path d="M 15,-20 C 45,-40 60,-5 35,15 C 20,10 10,-5 15,-20 Z" fill="url(#sf-rose-out-${themeKey})" opacity="0.9"/>
        <path d="M -35,5 C -50,40 10,65 35,35 C 45,20 15,10 -35,5 Z" fill="url(#sf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.5)" stroke-width="0.6"/>
        <path d="M -20,15 C -15,55 30,50 30,22 C 15,12 -5,10 -20,15 Z" fill="url(#sf-rose-deep-${themeKey})" opacity="0.96"/>
        <path d="M -15,-5 C -22,-25 15,-28 18,-6 C 20,8 -5,12 -15,-5 Z" fill="url(#sf-rose-deep-${themeKey})"/>
        <circle cx="2" cy="0" r="1.5" fill="${p.goldMain}"/>
      </g>

      <!-- 3 Petite White Jasmine Florets -->
      <g transform="translate(-36, -12) scale(0.55)">
        <path d="M 0,-15 C -4,-8 -4,-4 0,0 C 4,-4 4,-8 0,-15 Z" fill="${p.floretPetal}"/>
        <path d="M 15,0 C 8,-4 4,-4 0,0 C 4,4 8,4 15,0 Z" fill="${p.floretPetal}"/>
        <path d="M 0,15 C 4,8 4,4 0,0 C -4,4 -4,8 0,15 Z" fill="${p.floretPetal}"/>
        <path d="M -15,0 C -8,4 -4,4 0,0 C -4,-4 -8,-4 -15,0 Z" fill="${p.floretPetal}"/>
        <circle cx="0" cy="0" r="2.8" fill="${p.goldMain}"/>
      </g>
      <g transform="translate(18, 48) scale(0.48) rotate(35)">
        <path d="M 0,-15 C -4,-8 -4,-4 0,0 C 4,-4 4,-8 0,-15 Z" fill="${p.floretPetal}"/>
        <path d="M 15,0 C 8,-4 4,-4 0,0 C 4,4 8,4 15,0 Z" fill="${p.floretPetal}"/>
        <path d="M 0,15 C 4,8 4,4 0,0 C -4,4 -4,8 0,15 Z" fill="${p.floretPetal}"/>
        <path d="M -15,0 C -8,4 -4,4 0,0 C -4,-4 -8,-4 -15,0 Z" fill="${p.floretPetal}"/>
        <circle cx="0" cy="0" r="2.8" fill="${p.goldMain}"/>
      </g>
      <g transform="translate(-12, 54) scale(0.44) rotate(-15)">
        <path d="M 0,-15 C -4,-8 -4,-4 0,0 C 4,-4 4,-8 0,-15 Z" fill="${p.floretPetal}"/>
        <path d="M 15,0 C 8,-4 4,-4 0,0 C 4,4 8,4 15,0 Z" fill="${p.floretPetal}"/>
        <path d="M 0,15 C 4,8 4,4 0,0 C -4,4 -4,8 0,15 Z" fill="${p.floretPetal}"/>
        <path d="M -15,0 C -8,4 -4,4 0,0 C -4,-4 -8,-4 -15,0 Z" fill="${p.floretPetal}"/>
        <circle cx="0" cy="0" r="2.8" fill="${p.goldMain}"/>
      </g>
    </g>

    <!-- ============================================================== -->
    <!-- 3. BALANCING FLORAL CLUSTER: BOTTOM-LEFT SHOULDER (BL)         -->
    <!-- ============================================================== -->
    <g transform="translate(95, 305)">
      <!-- Spray of Eucalyptus leaves reaching outward and along frame -->
      <g transform="translate(-10, 32) rotate(205)">
        <path d="M 0,0 C -10,-20 -18,-42 0,-58 C 18,-42 10,-20 0,0 Z" fill="url(#sf-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
        <path d="M 0,0 Q 0,-29 0,-58" stroke="${p.stem}" stroke-width="1.1" opacity="0.8"/>
      </g>
      <g transform="translate(-35, 10) rotate(245)">
        <path d="M 0,0 C -9,-18 -16,-36 0,-52 C 16,-36 9,-18 0,0 Z" fill="url(#sf-leaf-sh-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
        <path d="M 0,0 Q 0,-26 0,-52" stroke="${p.stem}" stroke-width="1.0" opacity="0.8"/>
      </g>
      <g transform="translate(-30, -30) rotate(295)">
        <path d="M 0,0 C -9,-18 -16,-38 0,-54 C 16,-38 9,-18 0,0 Z" fill="url(#sf-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
        <path d="M 0,0 Q 0,-27 0,-54" stroke="${p.stem}" stroke-width="1.0" opacity="0.8"/>
      </g>
      <g transform="translate(25, 25) rotate(155)">
        <path d="M 0,0 C -8,-15 -14,-32 0,-44 C 14,-32 8,-15 0,0 Z" fill="url(#sf-leaf-sh-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
      </g>
      <!-- Trailing gold wire with beads -->
      <path d="M 0,0 Q -40,30 -55,55" fill="none" stroke="${p.goldMain}" stroke-width="0.9" opacity="0.85"/>
      <circle cx="-55" cy="55" r="2.2" fill="${p.goldLight}"/>
      <circle cx="-35" cy="28" r="1.8" fill="${p.goldLight}"/>
      <path d="M 0,0 Q -45,-20 -60,-45" fill="none" stroke="${p.goldMain}" stroke-width="0.9" opacity="0.85"/>
      <circle cx="-60" cy="-45" r="2.2" fill="${p.goldLight}"/>

      <!-- Rosebud with green sepals -->
      <g transform="translate(-42, 32) rotate(222)">
        <path d="M 0,10 C 0,20 3,28 5,35" fill="none" stroke="${p.stem}" stroke-width="1.8"/>
        <path d="M -8,6 C -14,-12 0,-26 0,-26 C 0,-26 14,-12 8,6 Z" fill="url(#sf-rose-mid-${themeKey})"/>
        <path d="M -8,10 C -16,0 -14,-14 -10,-20 C -8,-10 -3,2 0,8 Z" fill="${p.leafDeep}"/>
        <path d="M 6,10 C 14,0 12,-14 8,-20 C 6,-10 1,2 0,8 Z" fill="${p.leafMid}"/>
      </g>

      <!-- Main Blooming Watercolor Rose on BL -->
      <g transform="translate(0, 0) scale(0.92) rotate(180)">
        <!-- Outer petals -->
        <path d="M -15,-35 C -45,-65 -75,-30 -60,10 C -48,22 -25,25 -10,0 Z" fill="url(#sf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M -25,-30 C -20,-75 35,-78 45,-38 C 48,-20 20,-10 0,-15 Z" fill="url(#sf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M 20,-30 C 65,-60 85,-15 70,25 C 60,35 30,20 15,0 Z" fill="url(#sf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M 25,10 C 75,25 65,75 15,70 C -10,65 5,35 0,15 Z" fill="url(#sf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M -20,20 C -15,72 40,78 30,35 C 25,15 -5,10 -15,20 Z" fill="url(#sf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M -15,15 C -65,45 -70,-5 -35,-15 C -20,-5 -10,5 -15,15 Z" fill="url(#sf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <!-- Mid petals -->
        <path d="M -28,-18 C -52,-42 -40,-60 -8,-45 C 5,-35 -5,-15 -28,-18 Z" fill="url(#sf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <path d="M 5,-32 C 38,-55 58,-32 40,-8 C 30,2 10,-10 5,-32 Z" fill="url(#sf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <path d="M 22,-8 C 55,2 52,42 18,36 C 5,30 10,10 22,-8 Z" fill="url(#sf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <path d="M -10,18 C 15,50 38,38 20,12 C 5,2 -5,5 -10,18 Z" fill="url(#sf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <path d="M -30,5 C -55,28 -32,48 -5,22 C 2,12 -12,2 -30,5 Z" fill="url(#sf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <!-- Center heart -->
        <path d="M -18,-12 C -30,-32 -10,-40 8,-26 C 15,-18 -2,-8 -18,-12 Z" fill="url(#sf-rose-deep-${themeKey})"/>
        <path d="M 10,-20 C 32,-18 35,10 14,14 C 2,16 2,-5 10,-20 Z" fill="url(#sf-rose-deep-${themeKey})"/>
        <path d="M -10,-6 C -16,-18 8,-20 12,-8 C 14,0 -2,6 -10,-6 Z" fill="url(#sf-rose-deep-${themeKey})"/>
        <path d="M -5,-3 C -2,-9 6,-7 5,-1 C 4,4 -3,4 -2,-1" fill="none" stroke="${p.roseDeep2}" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="1" cy="-1" r="1.6" fill="${p.goldMain}"/>
      </g>

      <!-- Secondary Blooming Companion Rose on BL -->
      <g transform="translate(28, -28) scale(0.65) rotate(160)">
        <path d="M -25,-10 C -45,-45 10,-55 25,-25 C 20,-10 -5,-5 -25,-10 Z" fill="url(#sf-rose-out-${themeKey})" opacity="0.9"/>
        <path d="M 15,-20 C 45,-40 60,-5 35,15 C 20,10 10,-5 15,-20 Z" fill="url(#sf-rose-out-${themeKey})" opacity="0.9"/>
        <path d="M -35,5 C -50,40 10,65 35,35 C 45,20 15,10 -35,5 Z" fill="url(#sf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.5)" stroke-width="0.6"/>
        <path d="M -20,15 C -15,55 30,50 30,22 C 15,12 -5,10 -20,15 Z" fill="url(#sf-rose-deep-${themeKey})" opacity="0.96"/>
        <path d="M -15,-5 C -22,-25 15,-28 18,-6 C 20,8 -5,12 -15,-5 Z" fill="url(#sf-rose-deep-${themeKey})"/>
        <circle cx="2" cy="0" r="1.5" fill="${p.goldMain}"/>
      </g>

      <!-- 3 Petite White Jasmine Florets on BL -->
      <g transform="translate(36, 12) scale(0.55)">
        <path d="M 0,-15 C -4,-8 -4,-4 0,0 C 4,-4 4,-8 0,-15 Z" fill="${p.floretPetal}"/>
        <path d="M 15,0 C 8,-4 4,-4 0,0 C 4,4 8,4 15,0 Z" fill="${p.floretPetal}"/>
        <path d="M 0,15 C 4,8 4,4 0,0 C -4,4 -4,8 0,15 Z" fill="${p.floretPetal}"/>
        <path d="M -15,0 C -8,4 -4,4 0,0 C -4,-4 -8,-4 -15,0 Z" fill="${p.floretPetal}"/>
        <circle cx="0" cy="0" r="2.8" fill="${p.goldMain}"/>
      </g>
      <g transform="translate(-18, -48) scale(0.48) rotate(35)">
        <path d="M 0,-15 C -4,-8 -4,-4 0,0 C 4,-4 4,-8 0,-15 Z" fill="${p.floretPetal}"/>
        <path d="M 15,0 C 8,-4 4,-4 0,0 C 4,4 8,4 15,0 Z" fill="${p.floretPetal}"/>
        <path d="M 0,15 C 4,8 4,4 0,0 C -4,4 -4,8 0,15 Z" fill="${p.floretPetal}"/>
        <path d="M -15,0 C -8,4 -4,4 0,0 C -4,-4 -8,-4 -15,0 Z" fill="${p.floretPetal}"/>
        <circle cx="0" cy="0" r="2.8" fill="${p.goldMain}"/>
      </g>
      <g transform="translate(12, -54) scale(0.44) rotate(-15)">
        <path d="M 0,-15 C -4,-8 -4,-4 0,0 C 4,-4 4,-8 0,-15 Z" fill="${p.floretPetal}"/>
        <path d="M 15,0 C 8,-4 4,-4 0,0 C 4,4 8,4 15,0 Z" fill="${p.floretPetal}"/>
        <path d="M 0,15 C 4,8 4,4 0,0 C -4,4 -4,8 0,15 Z" fill="${p.floretPetal}"/>
        <path d="M -15,0 C -8,4 -4,4 0,0 C -4,-4 -8,-4 -15,0 Z" fill="${p.floretPetal}"/>
        <circle cx="0" cy="0" r="2.8" fill="${p.goldMain}"/>
      </g>
    </g>

    <!-- 4. DELICATE ACCENT SPRIGS ON TOP-LEFT AND BOTTOM-RIGHT SHOULDERS -->
    <g transform="translate(80, 52) rotate(-35) scale(0.65)">
      <path d="M 0,0 C -8,-15 -14,-32 0,-44 C 14,-32 8,-15 0,0 Z" fill="url(#sf-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
      <path d="M 0,0 Q 0,-22 0,-44" stroke="${p.stem}" stroke-width="0.9" opacity="0.8"/>
      <circle cx="0" cy="-48" r="2.0" fill="${p.goldLight}"/>
      <!-- Tiny floret -->
      <g transform="translate(-8, -18) scale(0.65)">
        <circle cx="0" cy="0" r="4.0" fill="${p.floretPetal}"/>
        <circle cx="0" cy="0" r="1.6" fill="${p.goldMain}"/>
      </g>
    </g>
    <g transform="translate(440, 308) rotate(145) scale(0.65)">
      <path d="M 0,0 C -8,-15 -14,-32 0,-44 C 14,-32 8,-15 0,0 Z" fill="url(#sf-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
      <path d="M 0,0 Q 0,-22 0,-44" stroke="${p.stem}" stroke-width="0.9" opacity="0.8"/>
      <circle cx="0" cy="-48" r="2.0" fill="${p.goldLight}"/>
      <!-- Tiny floret -->
      <g transform="translate(-8, -18) scale(0.65)">
        <circle cx="0" cy="0" r="4.0" fill="${p.floretPetal}"/>
        <circle cx="0" cy="0" r="1.6" fill="${p.goldMain}"/>
      </g>
    </g>
  </svg>
  `;
}

// ---------------------------------------------------------------------------
// 4. PETITE CORNER BOUQUET (Lush botanical corner spray for TR and BL corners)
// ---------------------------------------------------------------------------
export function getPetiteCornerBouquetSvg(themeKey = 'verdant_vow') {
  const p = getLushThemePalette(themeKey);

  return `
  <svg width="320" height="320" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Rose Radial Gradients -->
      <radialGradient id="pc-rose-out-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="60%" stop-color="${p.roseOuter1}"/>
        <stop offset="100%" stop-color="${p.roseOuter2}"/>
      </radialGradient>
      <radialGradient id="pc-rose-mid-${themeKey}" cx="42%" cy="42%" r="65%">
        <stop offset="0%" stop-color="${p.roseOuter2}"/>
        <stop offset="60%" stop-color="${p.roseMid1}"/>
        <stop offset="100%" stop-color="${p.roseMid2}"/>
      </radialGradient>
      <radialGradient id="pc-rose-deep-${themeKey}" cx="40%" cy="40%" r="65%">
        <stop offset="0%" stop-color="${p.roseMid2}"/>
        <stop offset="70%" stop-color="${p.roseDeep1}"/>
        <stop offset="100%" stop-color="${p.roseDeep2}"/>
      </radialGradient>

      <!-- Leaf Gradients -->
      <linearGradient id="pc-leaf-hl-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafHl}"/>
        <stop offset="60%" stop-color="${p.leafMid}"/>
        <stop offset="100%" stop-color="${p.leafDeep}"/>
      </linearGradient>
      <linearGradient id="pc-leaf-sh-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafMid}"/>
        <stop offset="70%" stop-color="${p.leafDeep}"/>
        <stop offset="100%" stop-color="${p.leafShadow}"/>
      </linearGradient>
    </defs>

    <!-- Foliage Branch extending along horizontal margin (towards center) -->
    <g transform="translate(45, 30)">
      <!-- Main stem -->
      <path d="M 0,0 Q 80,-5 190,5" fill="none" stroke="${p.stem}" stroke-width="1.6" stroke-linecap="round"/>
      <!-- Leaves along horizontal branch -->
      <g transform="translate(50, -2) rotate(-25)">
        <path d="M 0,0 C -6,-12 -12,-28 0,-40 C 12,-28 6,-12 0,0 Z" fill="url(#pc-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.35"/>
        <path d="M 0,0 Q 0,-20 0,-40" stroke="${p.stem}" stroke-width="0.8" opacity="0.8"/>
      </g>
      <g transform="translate(90, 2) rotate(22)">
        <path d="M 0,0 C -6,-12 -12,-28 0,-40 C 12,-28 6,-12 0,0 Z" fill="url(#pc-leaf-sh-${themeKey})" stroke="${p.stem}" stroke-width="0.35"/>
        <path d="M 0,0 Q 0,-20 0,-40" stroke="${p.stem}" stroke-width="0.8" opacity="0.8"/>
      </g>
      <g transform="translate(135, 1) rotate(-18)">
        <path d="M 0,0 C -5,-10 -10,-24 0,-34 C 10,-24 5,-10 0,0 Z" fill="url(#pc-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.35"/>
      </g>
      <g transform="translate(175, 4) rotate(15)">
        <path d="M 0,0 C -4,-8 -8,-18 0,-26 C 8,-18 4,-8 0,0 Z" fill="url(#pc-leaf-sh-${themeKey})" stroke="${p.stem}" stroke-width="0.35"/>
      </g>
      <!-- Gold twig extension -->
      <path d="M 120,2 Q 170,-10 215,-6" fill="none" stroke="${p.goldMain}" stroke-width="0.9" opacity="0.85"/>
      <circle cx="215" cy="-6" r="2.2" fill="${p.goldLight}"/>
      <circle cx="170" cy="-8" r="1.8" fill="${p.goldLight}"/>
    </g>

    <!-- Foliage Branch extending along vertical margin (towards center) -->
    <g transform="translate(30, 45)">
      <!-- Main stem -->
      <path d="M 0,0 Q -5,80 5,190" fill="none" stroke="${p.stem}" stroke-width="1.6" stroke-linecap="round"/>
      <!-- Leaves along vertical branch -->
      <g transform="translate(-2, 50) rotate(115)">
        <path d="M 0,0 C -6,-12 -12,-28 0,-40 C 12,-28 6,-12 0,0 Z" fill="url(#pc-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.35"/>
        <path d="M 0,0 Q 0,-20 0,-40" stroke="${p.stem}" stroke-width="0.8" opacity="0.8"/>
      </g>
      <g transform="translate(2, 90) rotate(68)">
        <path d="M 0,0 C -6,-12 -12,-28 0,-40 C 12,-28 6,-12 0,0 Z" fill="url(#pc-leaf-sh-${themeKey})" stroke="${p.stem}" stroke-width="0.35"/>
        <path d="M 0,0 Q 0,-20 0,-40" stroke="${p.stem}" stroke-width="0.8" opacity="0.8"/>
      </g>
      <g transform="translate(1, 135) rotate(108)">
        <path d="M 0,0 C -5,-10 -10,-24 0,-34 C 10,-24 5,-10 0,0 Z" fill="url(#pc-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.35"/>
      </g>
      <g transform="translate(4, 175) rotate(75)">
        <path d="M 0,0 C -4,-8 -8,-18 0,-26 C 8,-18 4,-8 0,0 Z" fill="url(#pc-leaf-sh-${themeKey})" stroke="${p.stem}" stroke-width="0.35"/>
      </g>
      <!-- Gold twig extension -->
      <path d="M 2,120 Q -10,170 -6,215" fill="none" stroke="${p.goldMain}" stroke-width="0.9" opacity="0.85"/>
      <circle cx="-6" cy="215" r="2.2" fill="${p.goldLight}"/>
      <circle cx="-8" cy="170" r="1.8" fill="${p.goldLight}"/>
    </g>

    <!-- Centerpiece Diagonal Leaves -->
    <g transform="translate(38, 38) rotate(45)">
      <path d="M 0,0 C -8,-15 -14,-34 0,-48 C 14,-34 8,-15 0,0 Z" fill="url(#pc-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
      <path d="M 0,0 Q 0,-24 0,-48" stroke="${p.stem}" stroke-width="0.9" opacity="0.8"/>
    </g>
    <g transform="translate(22, 22) rotate(45)">
      <path d="M 0,0 C -6,-12 -10,-26 0,-36 C 10,-26 6,-12 0,0 Z" fill="url(#pc-leaf-sh-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
    </g>

    <!-- Rosebud with green sepals -->
    <g transform="translate(95, 32) rotate(48)">
      <path d="M 0,8 C 0,16 2,22 4,28" fill="none" stroke="${p.stem}" stroke-width="1.5"/>
      <path d="M -6,4 C -12,-10 0,-22 0,-22 C 0,-22 12,-10 6,4 Z" fill="url(#pc-rose-mid-${themeKey})"/>
      <path d="M -6,8 C -13,0 -11,-12 -8,-16 C -6,-8 -2,2 0,6 Z" fill="${p.leafDeep}"/>
      <path d="M 5,8 C 12,0 10,-12 7,-16 C 5,-8 1,2 0,6 Z" fill="${p.leafMid}"/>
    </g>
    <g transform="translate(32, 95) rotate(42)">
      <path d="M 0,8 C 0,16 2,22 4,28" fill="none" stroke="${p.stem}" stroke-width="1.5"/>
      <path d="M -6,4 C -12,-10 0,-22 0,-22 C 0,-22 12,-10 6,4 Z" fill="url(#pc-rose-mid-${themeKey})"/>
      <path d="M -6,8 C -13,0 -11,-12 -8,-16 C -6,-8 -2,2 0,6 Z" fill="${p.leafDeep}"/>
      <path d="M 5,8 C 12,0 10,-12 7,-16 C 5,-8 1,2 0,6 Z" fill="${p.leafMid}"/>
    </g>

    <!-- Main Watercolor Garden Rose at (55, 55) -->
    <g transform="translate(55, 55) scale(0.78)">
      <!-- Outer petals -->
      <path d="M -15,-35 C -45,-65 -75,-30 -60,10 C -48,22 -25,25 -10,0 Z" fill="url(#pc-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
      <path d="M -25,-30 C -20,-75 35,-78 45,-38 C 48,-20 20,-10 0,-15 Z" fill="url(#pc-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
      <path d="M 20,-30 C 65,-60 85,-15 70,25 C 60,35 30,20 15,0 Z" fill="url(#pc-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
      <path d="M 25,10 C 75,25 65,75 15,70 C -10,65 5,35 0,15 Z" fill="url(#pc-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
      <path d="M -20,20 C -15,72 40,78 30,35 C 25,15 -5,10 -15,20 Z" fill="url(#pc-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
      <path d="M -15,15 C -65,45 -70,-5 -35,-15 C -20,-5 -10,5 -15,15 Z" fill="url(#pc-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
      <!-- Mid petals -->
      <path d="M -28,-18 C -52,-42 -40,-60 -8,-45 C 5,-35 -5,-15 -28,-18 Z" fill="url(#pc-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
      <path d="M 5,-32 C 38,-55 58,-32 40,-8 C 30,2 10,-10 5,-32 Z" fill="url(#pc-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
      <path d="M 22,-8 C 55,2 52,42 18,36 C 5,30 10,10 22,-8 Z" fill="url(#pc-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
      <path d="M -10,18 C 15,50 38,38 20,12 C 5,2 -5,5 -10,18 Z" fill="url(#pc-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
      <path d="M -30,5 C -55,28 -32,48 -5,22 C 2,12 -12,2 -30,5 Z" fill="url(#pc-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
      <!-- Center heart -->
      <path d="M -18,-12 C -30,-32 -10,-40 8,-26 C 15,-18 -2,-8 -18,-12 Z" fill="url(#pc-rose-deep-${themeKey})"/>
      <path d="M 10,-20 C 32,-18 35,10 14,14 C 2,16 2,-5 10,-20 Z" fill="url(#pc-rose-deep-${themeKey})"/>
      <path d="M -10,-6 C -16,-18 8,-20 12,-8 C 14,0 -2,6 -10,-6 Z" fill="url(#pc-rose-deep-${themeKey})"/>
      <path d="M -5,-3 C -2,-9 6,-7 5,-1 C 4,4 -3,4 -2,-1" fill="none" stroke="${p.roseDeep2}" stroke-width="1.3" stroke-linecap="round"/>
      <circle cx="1" cy="-1" r="1.5" fill="${p.goldMain}"/>
    </g>

    <!-- Secondary companion rose -->
    <g transform="translate(82, 58) scale(0.48) rotate(-15)">
      <path d="M -35,5 C -50,40 10,65 35,35 C 45,20 15,10 -35,5 Z" fill="url(#pc-rose-mid-${themeKey})"/>
      <path d="M -15,-5 C -22,-25 15,-28 18,-6 C 20,8 -5,12 -15,-5 Z" fill="url(#pc-rose-deep-${themeKey})"/>
    </g>

    <!-- White Starry Jasmine Florets -->
    <g transform="translate(68, 22) scale(0.48)">
      <path d="M 0,-15 C -4,-8 -4,-4 0,0 C 4,-4 4,-8 0,-15 Z" fill="${p.floretPetal}"/>
      <path d="M 15,0 C 8,-4 4,-4 0,0 C 4,4 8,4 15,0 Z" fill="${p.floretPetal}"/>
      <path d="M 0,15 C 4,8 4,4 0,0 C -4,4 -4,8 0,15 Z" fill="${p.floretPetal}"/>
      <path d="M -15,0 C -8,4 -4,4 0,0 C -4,-4 -8,-4 -15,0 Z" fill="${p.floretPetal}"/>
      <circle cx="0" cy="0" r="2.5" fill="${p.goldMain}"/>
    </g>
    <g transform="translate(22, 68) scale(0.48)">
      <path d="M 0,-15 C -4,-8 -4,-4 0,0 C 4,-4 4,-8 0,-15 Z" fill="${p.floretPetal}"/>
      <path d="M 15,0 C 8,-4 4,-4 0,0 C 4,4 8,4 15,0 Z" fill="${p.floretPetal}"/>
      <path d="M 0,15 C 4,8 4,4 0,0 C -4,4 -4,8 0,15 Z" fill="${p.floretPetal}"/>
      <path d="M -15,0 C -8,4 -4,4 0,0 C -4,-4 -8,-4 -15,0 Z" fill="${p.floretPetal}"/>
      <circle cx="0" cy="0" r="2.5" fill="${p.goldMain}"/>
    </g>
    <g transform="translate(92, 85) scale(0.42) rotate(30)">
      <path d="M 0,-15 C -4,-8 -4,-4 0,0 C 4,-4 4,-8 0,-15 Z" fill="${p.floretPetal}"/>
      <path d="M 15,0 C 8,-4 4,-4 0,0 C 4,4 8,4 15,0 Z" fill="${p.floretPetal}"/>
      <path d="M 0,15 C 4,8 4,4 0,0 C -4,4 -4,8 0,15 Z" fill="${p.floretPetal}"/>
      <path d="M -15,0 C -8,4 -4,4 0,0 C -4,-4 -8,-4 -15,0 Z" fill="${p.floretPetal}"/>
      <circle cx="0" cy="0" r="2.5" fill="${p.goldMain}"/>
    </g>

    <!-- Gold stardust beads -->
    <circle cx="108" cy="18" r="2.0" fill="${p.goldMain}"/>
    <circle cx="18" cy="108" r="2.0" fill="${p.goldMain}"/>
  </svg>
  `;
}

import { getRealisticCoverSvg } from './test-full-botanical-cover.mjs';

export async function renderSoftLushCoverPreviews() {
  const themes = ['verdant_vow', 'puspa_jawi', 'lunara_azure', 'aurelia_grande'];

  for (const themeKey of themes) {
    const p = getLushThemePalette(themeKey);
    const bgSvg = getRichGradientBackgroundSvg(themeKey);
    const tlSvg = getRealisticCoverSvg(themeKey, 'tl');
    const brSvg = getRealisticCoverSvg(themeKey, 'br');
    const frameSvg = getLushSoftFrameSvg(themeKey);
    const petiteBouquetSvg = getPetiteCornerBouquetSvg(themeKey);

    const fullSvg = `
    <svg width="800" height="1131" viewBox="0 0 800 1131" xmlns="http://www.w3.org/2000/svg">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&amp;family=Montserrat:wght@400;600;700&amp;family=Playfair+Display:ital,wght@1,500&amp;display=swap');
        .title-caps { font-family: 'Montserrat', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 5.5px; fill: ${p.titleColor}; }
        .name-groom { font-family: 'Great Vibes', cursive, 'Brush Script MT', serif; font-size: 48px; fill: ${p.nameColor}; }
        .name-ampersand { font-family: 'Playfair Display', serif; font-style: italic; font-size: 26px; fill: ${p.goldMain}; }
        .name-bride { font-family: 'Great Vibes', cursive, 'Brush Script MT', serif; font-size: 48px; fill: ${p.nameColor}; }
        .meta-date { font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2.4px; fill: ${p.dateColor}; }
        .rec-title { font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 500; fill: ${p.recTitle}; }
        .rec-sub { font-family: 'Playfair Display', serif; font-style: italic; font-size: 14.5px; fill: ${p.recSub}; }
        .apology-note { font-family: 'Montserrat', sans-serif; font-size: 11px; font-style: italic; fill: #c0392b; }
      </style>

      <!-- 1. Rich Visible Gradient Background with Watercolor Clouds & Waves -->
      <g transform="translate(0, 0)">
        ${bgSvg.replace(/<svg[^>]*>|<\/svg>/g, '')}
      </g>

      <!-- 2. Main Large Floral Corners (TL & BR Cascades - 50% width & 50% height) -->
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

      <!-- 3. Matching Petite Botanical Corner Sprays (TOP-RIGHT & BOTTOM-LEFT CORNERS) -->
      <!-- Top-Right Corner Bouquet (Hugs TR corner) -->
      <g transform="translate(800, 0) scale(-0.95, 0.95)">
        ${petiteBouquetSvg.replace(/<svg[^>]*>|<\/svg>/g, '')}
      </g>

      <!-- Bottom-Left Corner Bouquet (Hugs BL corner) -->
      <g transform="translate(0, 1131) scale(0.95, -0.95)">
        ${petiteBouquetSvg.replace(/<svg[^>]*>|<\/svg>/g, '')}
      </g>

      <!-- 4. "THE WEDDING" - OUTSIDE AND ABOVE THE FRAME -->
      <g transform="translate(400, 185)">
        <text x="0" y="0" text-anchor="middle" class="title-caps">THE WEDDING</text>
        <line x1="-35" y1="9" x2="35" y2="9" stroke="${p.goldMain}" stroke-width="0.8" opacity="0.6"/>
        <circle cx="0" cy="9" r="1.8" fill="${p.goldMain}"/>
      </g>

      <!-- 5. SOFT ROUNDED DOUBLE-LINE FRAME WITH LUSH ROSES (No sharp corners) -->
      <g transform="translate(140, 205)">
        ${frameSvg.replace(/<svg[^>]*>|<\/svg>/g, '')}
      </g>

      <!-- 6. STACKED NAMES ONLY INSIDE THE FRAME -->
      <text x="400" y="325" text-anchor="middle" class="name-groom">Baskara</text>
      <text x="400" y="375" text-anchor="middle" class="name-ampersand">&amp;</text>
      <text x="400" y="440" text-anchor="middle" class="name-bride">Anindya</text>

      <!-- 7. DATE - OUTSIDE AND BELOW THE FRAME -->
      <g transform="translate(400, 574)">
        <line x1="-120" y1="-5" x2="-80" y2="-5" stroke="${p.goldMain}" stroke-width="0.8" opacity="0.6"/>
        <circle cx="-75" cy="-5" r="1.5" fill="${p.goldMain}"/>
        <text x="0" y="0" text-anchor="middle" class="meta-date">SABTU, 31 OKTOBER 2026</text>
        <circle cx="75" cy="-5" r="1.5" fill="${p.goldMain}"/>
        <line x1="80" y1="-5" x2="120" y2="-5" stroke="${p.goldMain}" stroke-width="0.8" opacity="0.6"/>
      </g>

      <!-- 8. RECIPIENT SECTION -->
      <text x="400" y="650" text-anchor="middle" class="rec-title">Kepada Yth.</text>
      <text x="400" y="674" text-anchor="middle" class="rec-sub">Bapak / Ibu / Saudara / i</text>

      <g transform="translate(180, 700)">
        <rect width="440" height="155" rx="16" fill="#ffffff" fill-opacity="0.92" stroke="${p.cardStroke}" stroke-width="1.4"/>
        <rect x="6" y="6" width="428" height="143" rx="12" fill="none" stroke="${p.cardDash}" stroke-width="0.9" stroke-dasharray="6,4"/>
      </g>

      <text x="400" y="885" text-anchor="middle" class="apology-note">Mohon maaf apabila ada kesalahan dalam penulisan nama / gelar</text>
    </svg>
    `;

    const buf = await sharp(Buffer.from(fullSvg)).png().toBuffer();
    const outPath = `scratch/soft_lush_cover_${themeKey}.png`;
    fs.writeFileSync(outPath, buf);
    console.log(`Saved ${outPath}`);

    // Copy to brain artifacts
    const artPath = `C:/Users/dandi120502/.gemini/antigravity/brain/d7e868e7-6d37-4a0e-9209-fdd022e77915/cover_preview_${themeKey}.png`;
    fs.copyFileSync(outPath, artPath);
    console.log(`Updated artifact: ${artPath}`);
  }
}

renderSoftLushCoverPreviews().catch(console.error);
