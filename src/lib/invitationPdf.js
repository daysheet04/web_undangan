import { jsPDF } from 'jspdf';

/* ==========================================================================
   THEME PALETTES & LUXURY WEDDING STATIONERY STYLES
   ========================================================================== */

export const THEMES = {
  java_vibes: {
    key: 'java_vibes',
    name: 'Java Vibes',
    paper: [254, 252, 246],          // Royal Ivory Silk
    paperCard: [248, 244, 233],      // Warm Sand Plaque
    ink: [34, 28, 24],              // Deep Heritage Charcoal Black
    accent: [142, 86, 56],          // Warm Terracotta Rose
    muted: [102, 92, 84],           // Warm Umber Slate
    gold: [194, 150, 62],           // Antique Royal Javanese Gold
    goldLight: [230, 208, 156],     // Whisper Gold Hairline
    border: [214, 186, 134],        // Fine Royal Frame
    sage: [172, 184, 156],          // Soft Botanical Sage
    capsuleBg: [58, 46, 38],        // Deep Mocha Capsule
    style: 'jawi',
  },
  puspa_jawi: {
    key: 'puspa_jawi',
    name: 'Java Vibes',
    paper: [254, 252, 246],
    paperCard: [248, 244, 233],
    ink: [34, 28, 24],
    accent: [142, 86, 56],
    muted: [102, 92, 84],
    gold: [194, 150, 62],
    goldLight: [230, 208, 156],
    border: [214, 186, 134],
    sage: [172, 184, 156],
    capsuleBg: [58, 46, 38],
    style: 'jawi',
  },
  lunara_azure: {
    key: 'lunara_azure',
    name: 'Lunara Azure',
    paper: [251, 253, 255],          // Soft Porcelain Mist
    paperCard: [243, 247, 252],      // Pale Azure Plaque
    ink: [18, 30, 48],              // Deep Midnight Navy Ink
    accent: [68, 105, 148],          // Dusty French Blue
    muted: [88, 104, 126],          // Soft Dusk Slate
    gold: [184, 150, 84],           // Starlight Gold
    goldLight: [204, 220, 238],     // Whisper Azure Hairline
    border: [178, 202, 228],        // Fine Silver-Azure Frame
    sage: [150, 180, 195],          // Pastel Blue-Gray Foliage
    capsuleBg: [45, 72, 102],       // Classic Slate Blue Capsule
    style: 'moon',
  },
  verdant_vow: {
    key: 'verdant_vow',
    name: 'Verdant Vow',
    paper: [252, 253, 250],          // Organic Linen Cream
    paperCard: [244, 248, 241],      // Pale Eucalyptus Plaque
    ink: [22, 34, 26],              // Deep Forest Charcoal
    accent: [74, 108, 82],          // Lush Eucalyptus
    muted: [84, 106, 94],           // Soft Eucalyptus
    gold: [180, 148, 86],           // Olive-Champagne Gold
    goldLight: [202, 222, 196],     // Whisper Sage Hairline
    border: [182, 210, 176],        // Fine Sage Frame
    sage: [165, 190, 165],          // Botanical Leaf
    capsuleBg: [38, 58, 44],        // Deep Forest Sage Capsule
    style: 'botanical',
  },
  aurelia_grande: {
    key: 'aurelia_grande',
    name: 'Aurelia Grande',
    paper: [254, 252, 247],          // Imperial Champagne Ivory
    paperCard: [249, 244, 235],      // Soft Champagne Plaque
    ink: [34, 26, 22],              // Deep Bronze Espresso
    accent: [148, 98, 62],          // Venetian Amber
    muted: [106, 92, 82],           // Warm Truffle
    gold: [198, 154, 72],           // Venetian Imperial Ballroom Gold
    goldLight: [236, 216, 170],     // Whisper Champagne Hairline
    border: [222, 194, 146],        // Fine Royal Gold Frame
    sage: [182, 178, 158],          // Champagne Olive
    capsuleBg: [62, 46, 36],        // Deep Bronze Capsule
    style: 'classic',
  },
};

export function resolveTheme(templateCode) {
  const code = String(templateCode || '').toLowerCase().trim();
  if (code.includes('jawi') || code.includes('java')) return THEMES.puspa_jawi;
  if (code.includes('lunara') || code.includes('azure') || code.includes('moon')) return THEMES.lunara_azure;
  if (code.includes('verdant') || code.includes('vow') || code.includes('sage') || code.includes('garden')) return THEMES.verdant_vow;
  if (code.includes('aurelia') || code.includes('grande') || code.includes('ballroom')) return THEMES.aurelia_grande;
  return THEMES[code] || THEMES.puspa_jawi;
}

function cleanPdfText(str) {
  if (str == null) return '';
  return String(str)
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2015]/g, '-')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-')
    .replace(/[\u2192\u2197]/g, '>')
    .replace(/[\u2190\u2196]/g, '<')
    .replace(/[✦★☆◆◇■□●○]/g, '')
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/[\u2600-\u27BF]/g, '')
    .trim();
}

const safeText = (value, fallback = '-') => cleanPdfText(value) || fallback;

const bismillahCache = new Map();

function renderBismillahPng(colorRgb = [194, 150, 62]) {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    const width = 1400;
    const height = 220;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, width, height);
    const [r, g, b] = colorRgb;
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 54px "Amiri", "Traditional Arabic", "Arabic Typesetting", "Geeza Pro", "Noto Naskh Arabic", "Times New Roman", serif';
    ctx.direction = 'rtl';
    ctx.fillText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', width / 2, height / 2);

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

function getBismillahPng(colorRgb) {
  const key = Array.isArray(colorRgb) ? colorRgb.join(',') : 'default';
  if (!bismillahCache.has(key)) {
    bismillahCache.set(key, renderBismillahPng(colorRgb));
  }
  return bismillahCache.get(key);
}

function drawBismillah(pdf, theme, centerX, y, width = 58, height = 11) {
  const pngData = getBismillahPng(theme.gold);
  if (pngData) {
    try {
      pdf.addImage(pngData, 'PNG', centerX - (width / 2), y - (height / 2), width, height, undefined, 'FAST');
      return;
    } catch {
      // Fallback below
    }
  }

  pdf.setTextColor(...theme.gold);
  pdf.setFont('times', 'bolditalic');
  pdf.setFontSize(12.5);
  pdf.text('Bismillahir-Rahmanir-Rahim', centerX, y + 2, { align: 'center' });
}

/* ==========================================================================
   WATERCOLOR FLORAL & BOTANICAL SVG GENERATORS
   ========================================================================== */

function getBouquetColors(themeKey) {
  let flowerColor = 'rgb(240, 196, 172)';
  let flowerShadow = 'rgb(212, 154, 126)';
  let flowerHighlight = 'rgb(255, 245, 238)';
  let flowerDeep = 'rgb(148, 88, 64)';
  let flowerSec = 'rgb(248, 224, 210)';
  let goldColor = 'rgb(194, 150, 62)';
  let goldLeaf = 'rgba(214, 175, 95, 0.85)';
  let sageColor = 'rgb(142, 174, 138)';
  let sageDark = 'rgb(102, 138, 98)';
  let sageStem = 'rgb(92, 124, 88)';

  if (themeKey.includes('lunara') || themeKey.includes('azure')) {
    flowerColor = 'rgb(172, 202, 234)';
    flowerShadow = 'rgb(130, 168, 210)';
    flowerHighlight = 'rgb(238, 246, 255)';
    flowerDeep = 'rgb(62, 98, 142)';
    flowerSec = 'rgb(210, 228, 248)';
    goldColor = 'rgb(184, 150, 84)';
    goldLeaf = 'rgba(200, 172, 110, 0.85)';
    sageColor = 'rgb(138, 170, 188)';
    sageDark = 'rgb(98, 134, 154)';
    sageStem = 'rgb(88, 120, 138)';
  } else if (themeKey.includes('verdant') || themeKey.includes('vow')) {
    flowerColor = 'rgb(238, 230, 210)';
    flowerShadow = 'rgb(208, 196, 168)';
    flowerHighlight = 'rgb(255, 252, 244)';
    flowerDeep = 'rgb(108, 98, 76)';
    flowerSec = 'rgb(248, 244, 232)';
    goldColor = 'rgb(180, 148, 86)';
    goldLeaf = 'rgba(195, 168, 105, 0.85)';
    sageColor = 'rgb(136, 172, 136)';
    sageDark = 'rgb(96, 136, 96)';
    sageStem = 'rgb(84, 120, 84)';
  } else if (themeKey.includes('aurelia') || themeKey.includes('grande')) {
    flowerColor = 'rgb(242, 218, 182)';
    flowerShadow = 'rgb(214, 182, 138)';
    flowerHighlight = 'rgb(255, 248, 235)';
    flowerDeep = 'rgb(142, 105, 58)';
    flowerSec = 'rgb(250, 234, 208)';
    goldColor = 'rgb(198, 154, 72)';
    goldLeaf = 'rgba(218, 178, 88, 0.88)';
    sageColor = 'rgb(162, 168, 142)';
    sageDark = 'rgb(124, 132, 102)';
    sageStem = 'rgb(110, 118, 90)';
  }
  return { flowerColor, flowerShadow, flowerHighlight, flowerDeep, flowerSec, goldColor, goldLeaf, sageColor, sageDark, sageStem };
}

function getPageBackgroundSvg(themeKey = 'puspa_jawi', pageNum = 1) {
  // Visible, rich pastel watercolor hues tailored to each theme
  let baseColor = '#faf5ee';
  let wash1 = 'rgba(235, 175, 140, 0.72)'; // rich, visible warm peach/blush watercolor
  let wash2 = 'rgba(242, 200, 150, 0.65)'; // warm honey gold
  let wash3 = 'rgba(215, 168, 138, 0.50)'; // dusty terracotta rose
  let washDark = 'rgba(190, 135, 100, 0.38)'; // watercolor pool edge
  let leafSilhouette = 'rgba(165, 188, 155, 0.36)'; // visible botanical watermark
  let goldFoil = 'rgba(194, 150, 62, 0.85)'; // sparkling gold stardust

  if (themeKey.includes('lunara') || themeKey.includes('azure')) {
    baseColor = '#eef4fa';
    wash1 = 'rgba(155, 192, 235, 0.75)'; // vibrant soft sky blue watercolor
    wash2 = 'rgba(175, 212, 248, 0.68)'; // airy azure mist
    wash3 = 'rgba(132, 168, 210, 0.52)'; // dusty slate pool
    washDark = 'rgba(98, 135, 180, 0.40)';
    leafSilhouette = 'rgba(140, 178, 205, 0.36)';
    goldFoil = 'rgba(184, 150, 84, 0.85)';
  } else if (themeKey.includes('verdant') || themeKey.includes('vow')) {
    baseColor = '#f0f5ee';
    wash1 = 'rgba(170, 210, 165, 0.75)'; // vibrant eucalyptus sage watercolor
    wash2 = 'rgba(195, 225, 185, 0.68)'; // pale spring meadow
    wash3 = 'rgba(142, 182, 136, 0.52)'; // deep forest shade
    washDark = 'rgba(112, 148, 105, 0.40)';
    leafSilhouette = 'rgba(130, 172, 130, 0.36)';
    goldFoil = 'rgba(180, 148, 86, 0.85)';
  } else if (themeKey.includes('aurelia') || themeKey.includes('grande')) {
    baseColor = '#faf3e8';
    wash1 = 'rgba(235, 198, 145, 0.75)'; // regal champagne amber
    wash2 = 'rgba(248, 218, 168, 0.68)'; // warm candlelight gold
    wash3 = 'rgba(212, 175, 120, 0.52)'; // imperial bronze mist
    washDark = 'rgba(178, 138, 88, 0.40)';
    leafSilhouette = 'rgba(192, 178, 142, 0.36)';
    goldFoil = 'rgba(198, 154, 72, 0.85)';
  }

  // =========================================================================
  // HALAMAN 1: MODERN LUXURY BOTANICAL STATIONERY (RICH WATERCOLOR BACKGROUND)
  // Layered pastel watercolor clouds, ambient halo, gold line art & stardust
  // =========================================================================
  if (pageNum === 1) {
    let bgGradStart = '#d0ead2';
    let bgGradMid1 = '#e4f3e6';
    let bgGradCenter = '#fcfbf7';
    let bgGradMid2 = '#e7f4e8';
    let bgGradEnd = '#c8e6cb';
    let washColor1 = 'rgba(160, 215, 165, 0.55)';
    let washColor2 = 'rgba(195, 235, 200, 0.45)';
    let goldContour = 'rgba(184, 148, 77, 0.65)';
    let goldStar = '#b8944d';
    let leafWatermark = 'rgba(125, 175, 130, 0.28)';

    if (themeKey.includes('jawi') || themeKey.includes('java')) {
      bgGradStart = '#ffd1dc';
      bgGradMid1 = '#ffe6eb';
      bgGradCenter = '#fef9f7';
      bgGradMid2 = '#ffe8ed';
      bgGradEnd = '#fcc8d4';
      washColor1 = 'rgba(245, 170, 185, 0.55)';
      washColor2 = 'rgba(255, 195, 205, 0.45)';
      goldContour = 'rgba(194, 150, 62, 0.65)';
      goldStar = '#c2963e';
      leafWatermark = 'rgba(165, 185, 160, 0.28)';
    } else if (themeKey.includes('lunara') || themeKey.includes('azure')) {
      bgGradStart = '#cce2f7';
      bgGradMid1 = '#e2effa';
      bgGradCenter = '#f7faff';
      bgGradMid2 = '#e4f0fa';
      bgGradEnd = '#c4def5';
      washColor1 = 'rgba(150, 195, 240, 0.55)';
      washColor2 = 'rgba(180, 215, 250, 0.45)';
      goldContour = 'rgba(120, 150, 185, 0.65)';
      goldStar = '#7895b8';
      leafWatermark = 'rgba(145, 180, 205, 0.28)';
    } else if (themeKey.includes('aurelia') || themeKey.includes('grande')) {
      bgGradStart = '#fae2bc';
      bgGradMid1 = '#fdefd8';
      bgGradCenter = '#fefaf3';
      bgGradMid2 = '#fcf1dd';
      bgGradEnd = '#f8ddb0';
      washColor1 = 'rgba(240, 195, 135, 0.55)';
      washColor2 = 'rgba(250, 215, 165, 0.45)';
      goldContour = 'rgba(197, 154, 48, 0.65)';
      goldStar = '#c59a30';
      leafWatermark = 'rgba(190, 175, 135, 0.28)';
    }

    return `
    <svg width="800" height="1131" viewBox="0 0 800 1131" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Diagonal Multi-Stop Master Gradient -->
        <linearGradient id="p1-bg-grad-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgGradStart}"/>
          <stop offset="22%" stop-color="${bgGradMid1}"/>
          <stop offset="50%" stop-color="${bgGradCenter}"/>
          <stop offset="78%" stop-color="${bgGradMid2}"/>
          <stop offset="100%" stop-color="${bgGradEnd}"/>
        </linearGradient>

        <!-- Ambient Center Radial Halo (Clears center behind frame for crisp text) -->
        <radialGradient id="p1-center-halo-${themeKey}" cx="50%" cy="33%" r="42%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
          <stop offset="55%" stop-color="#ffffff" stop-opacity="0.75"/>
          <stop offset="85%" stop-color="#ffffff" stop-opacity="0.30"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>

        <!-- Soft Gaussian Blur Filter for Watercolor Pools -->
        <filter id="p1-blur-wash-${themeKey}" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="35"/>
        </filter>
      </defs>

      <!-- 1. Master Base Gradient Canvas -->
      <rect width="800" height="1131" fill="url(#p1-bg-grad-${themeKey})"/>

      <!-- 2. Watercolor Cloud Pools in Corners -->
      <g filter="url(#p1-blur-wash-${themeKey})">
        <!-- Top-left deep watercolor pool -->
        <path d="M -50,-50 C 120,-30 280,40 320,180 C 350,300 240,420 100,450 C -20,470 -70,320 -50,-50 Z"
              fill="${washColor1}"/>
        <!-- Top-right delicate cloud -->
        <path d="M 850,-40 C 720,20 620,120 650,260 C 680,360 780,420 850,440 Z"
              fill="${washColor2}"/>
        <!-- Bottom-right deep watercolor pool -->
        <path d="M 850,1180 C 680,1160 520,1080 480,940 C 450,820 560,700 700,670 C 820,650 870,800 850,1180 Z"
              fill="${washColor1}"/>
        <!-- Bottom-left delicate cloud -->
        <path d="M -50,1170 C 80,1120 180,1020 150,880 C 120,780 20,720 -50,700 Z"
              fill="${washColor2}"/>
      </g>

      <!-- 3. Central Ambient Luminous Halo (Keeps frame & names radiant and readable) -->
      <rect width="800" height="1131" fill="url(#p1-center-halo-${themeKey})"/>

      <!-- 4. Subtle Ghost Botanical Watermark Leaf Sprigs in Background -->
      <g opacity="0.32">
        <!-- Upper right ghost foliage -->
        <g transform="translate(640, 160) rotate(35) scale(0.95)">
          <path d="M 0,0 C -30,60 -60,140 -20,220" fill="none" stroke="${leafWatermark}" stroke-width="1.8"/>
          <path d="M -8,45 C -35,35 -50,15 -35,5 C -20,-5 -5,25 -8,45 Z" fill="${leafWatermark}"/>
          <path d="M -18,95 C -48,90 -62,70 -48,60 C -34,50 -16,75 -18,95 Z" fill="${leafWatermark}"/>
          <path d="M -26,145 C -55,145 -70,125 -55,115 C -40,105 -24,130 -26,145 Z" fill="${leafWatermark}"/>
          <path d="M -22,190 C -50,195 -65,180 -50,170 C -35,160 -20,180 -22,190 Z" fill="${leafWatermark}"/>
        </g>
        <!-- Lower left ghost foliage -->
        <g transform="translate(160, 960) rotate(-145) scale(0.95)">
          <path d="M 0,0 C -30,60 -60,140 -20,220" fill="none" stroke="${leafWatermark}" stroke-width="1.8"/>
          <path d="M -8,45 C -35,35 -50,15 -35,5 C -20,-5 -5,25 -8,45 Z" fill="${leafWatermark}"/>
          <path d="M -18,95 C -48,90 -62,70 -48,60 C -34,50 -16,75 -18,95 Z" fill="${leafWatermark}"/>
          <path d="M -26,145 C -55,145 -70,125 -55,115 C -40,105 -24,130 -26,145 Z" fill="${leafWatermark}"/>
        </g>
      </g>

      <!-- 5. Elegant Abstract Gold Contour Line Art & Sweeping Arcs -->
      <g opacity="0.75">
        <!-- Top-right sweeping curves -->
        <path d="M 520,30 C 620,70 700,160 720,270 C 740,380 690,470 740,560"
              fill="none" stroke="${goldContour}" stroke-width="0.9" stroke-linecap="round"/>
        <path d="M 560,25 C 655,75 730,175 745,295 C 760,400 720,490 760,575"
              fill="none" stroke="${goldContour}" stroke-width="0.55" stroke-dasharray="7,4"/>
        <!-- Bottom-left sweeping curves -->
        <path d="M 280,1100 C 180,1060 100,970 80,860 C 60,750 110,660 60,570"
              fill="none" stroke="${goldContour}" stroke-width="0.9" stroke-linecap="round"/>
        <path d="M 240,1105 C 145,1055 70,955 55,835 C 40,730 80,640 40,555"
              fill="none" stroke="${goldContour}" stroke-width="0.55" stroke-dasharray="7,4"/>
      </g>

      <!-- 6. Floating Gold Stardust Constellations & Diamond Stars -->
      <g fill="${goldStar}">
        <path d="M 690,140 Q 690,148 698,148 Q 690,148 690,156 Q 690,148 682,148 Q 690,148 690,140 Z"/>
        <path d="M 110,980 Q 110,988 118,988 Q 110,988 110,996 Q 110,988 102,988 Q 110,988 110,980 Z"/>
        <path d="M 645,510 Q 645,516 651,516 Q 645,516 645,522 Q 645,516 639,516 Q 645,516 645,510 Z"/>
        <path d="M 155,615 Q 155,621 161,621 Q 155,621 155,627 Q 155,621 149,621 Q 155,621 155,615 Z"/>
        <circle cx="650" cy="180" r="1.6" opacity="0.85"/>
        <circle cx="730" cy="220" r="2.0" opacity="0.9"/>
        <circle cx="710" cy="360" r="1.4" opacity="0.8"/>
        <circle cx="150" cy="940" r="1.6" opacity="0.85"/>
        <circle cx="70" cy="900" r="2.0" opacity="0.9"/>
        <circle cx="90" cy="760" r="1.4" opacity="0.8"/>
      </g>

      <!-- 7. Fine Inset Border Margin (Stationery Edge) -->
      <rect x="20" y="20" width="760" height="1091" rx="6" fill="none"
            stroke="${goldContour}" stroke-width="0.6" opacity="0.55"/>
    </svg>
    `;
  }

  // =========================================================================
  // HALAMAN 2: CELESTIAL INVITATION FLOW (Top Arch Wash + Left/Right Side Margin Blooms)
  // =========================================================================
  if (pageNum === 2) {
    return `
    <svg width="800" height="1131" viewBox="0 0 800 1131" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="p2-paperGrad-${themeKey}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${baseColor}" />
          <stop offset="35%" stop-color="#ffffff" stop-opacity="0.45" />
          <stop offset="65%" stop-color="#ffffff" stop-opacity="0.45" />
          <stop offset="100%" stop-color="${baseColor}" />
        </linearGradient>
        <!-- Top Canopy Watercolor Arch -->
        <radialGradient id="p2-topArch-${themeKey}" cx="50%" cy="0%" r="65%">
          <stop offset="0%" stop-color="${wash1}" />
          <stop offset="45%" stop-color="${wash2}" stop-opacity="0.75" />
          <stop offset="80%" stop-color="${wash3}" stop-opacity="0.30" />
          <stop offset="100%" stop-color="${wash1}" stop-opacity="0" />
        </radialGradient>
        <!-- Left Side Bloom Pool (Where Left Sprig Emerges) -->
        <radialGradient id="p2-sideL-${themeKey}" cx="0%" cy="38%" r="48%">
          <stop offset="0%" stop-color="${wash2}" />
          <stop offset="50%" stop-color="${wash1}" stop-opacity="0.70" />
          <stop offset="100%" stop-color="${wash2}" stop-opacity="0" />
        </radialGradient>
        <!-- Right Side Bloom Pool (Where Right Sprig Emerges) -->
        <radialGradient id="p2-sideR-${themeKey}" cx="100%" cy="38%" r="48%">
          <stop offset="0%" stop-color="${wash1}" />
          <stop offset="50%" stop-color="${wash2}" stop-opacity="0.70" />
          <stop offset="100%" stop-color="${wash1}" stop-opacity="0" />
        </radialGradient>
        <!-- Bottom Grounding Wash -->
        <linearGradient id="p2-botWash-${themeKey}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="70%" stop-color="#ffffff" stop-opacity="0" />
          <stop offset="86%" stop-color="${wash2}" stop-opacity="0.55" />
          <stop offset="100%" stop-color="${wash1}" stop-opacity="0.80" />
        </linearGradient>
        <!-- Soft Central Illumination -->
        <radialGradient id="p2-centerCol-${themeKey}" cx="50%" cy="48%" r="46%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.60" />
          <stop offset="70%" stop-color="#ffffff" stop-opacity="0.20" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
      </defs>

      <rect width="800" height="1131" fill="url(#p2-paperGrad-${themeKey})" />
      <rect width="800" height="1131" fill="url(#p2-topArch-${themeKey})" />
      <rect width="800" height="1131" fill="url(#p2-sideL-${themeKey})" />
      <rect width="800" height="1131" fill="url(#p2-sideR-${themeKey})" />
      <rect width="800" height="1131" fill="url(#p2-botWash-${themeKey})" />

      <!-- Side Watercolor Swirls -->
      <path d="M -30,340 Q 90,390 70,470 Q 50,550 -30,590 Z" fill="${wash1}" />
      <path d="M 830,340 Q 710,390 730,470 Q 750,550 830,590 Z" fill="${wash2}" />

      <!-- Drifting Petal Watermarks along the Flanks -->
      <g transform="translate(75, 290) rotate(25)">
        <ellipse cx="0" cy="0" rx="24" ry="11" fill="${leafSilhouette}" />
        <ellipse cx="16" cy="18" rx="20" ry="9" fill="${leafSilhouette}" />
      </g>
      <g transform="translate(725, 290) rotate(-25)">
        <ellipse cx="0" cy="0" rx="24" ry="11" fill="${leafSilhouette}" />
        <ellipse cx="-16" cy="18" rx="20" ry="9" fill="${leafSilhouette}" />
      </g>
      <g transform="translate(85, 710) rotate(-15)">
        <ellipse cx="0" cy="0" rx="26" ry="12" fill="${leafSilhouette}" />
      </g>
      <g transform="translate(715, 710) rotate(15)">
        <ellipse cx="0" cy="0" rx="26" ry="12" fill="${leafSilhouette}" />
      </g>

      <rect width="800" height="1131" fill="url(#p2-centerCol-${themeKey})" />

      <!-- Delicate Stardust Dots flanking names -->
      <circle cx="110" cy="380" r="3.0" fill="${goldFoil}" />
      <circle cx="690" cy="380" r="3.0" fill="${goldFoil}" />
      <circle cx="130" cy="480" r="2.8" fill="${goldFoil}" />
      <circle cx="670" cy="480" r="2.8" fill="${goldFoil}" />
    </svg>
    `;
  }

  // =========================================================================
  // HALAMAN 3: WARM SPIRITUAL SERENADE (Diagonal Olive Sunrise & Laurel Watermarks)
  // =========================================================================
  if (pageNum === 3) {
    return `
    <svg width="800" height="1131" viewBox="0 0 800 1131" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="p3-paperGrad-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${baseColor}" />
          <stop offset="35%" stop-color="#ffffff" stop-opacity="0.45" />
          <stop offset="70%" stop-color="#ffffff" stop-opacity="0.45" />
          <stop offset="100%" stop-color="${baseColor}" />
        </linearGradient>
        <!-- Top-Left Sunrise Watercolor Glow -->
        <radialGradient id="p3-wcTL-${themeKey}" cx="10%" cy="10%" r="60%">
          <stop offset="0%" stop-color="${wash2}" />
          <stop offset="45%" stop-color="${wash1}" stop-opacity="0.75" />
          <stop offset="100%" stop-color="${wash2}" stop-opacity="0" />
        </radialGradient>
        <!-- Bottom-Right Sunset Watercolor Pool -->
        <radialGradient id="p3-wcBR-${themeKey}" cx="90%" cy="90%" r="70%">
          <stop offset="0%" stop-color="${wash1}" />
          <stop offset="50%" stop-color="${wash2}" stop-opacity="0.75" />
          <stop offset="85%" stop-color="${wash3}" stop-opacity="0.35" />
          <stop offset="100%" stop-color="${wash1}" stop-opacity="0" />
        </radialGradient>
        <!-- Central Card Illumination Glow -->
        <radialGradient id="p3-centerGlow-${themeKey}" cx="50%" cy="50%" r="48%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55" />
          <stop offset="75%" stop-color="#ffffff" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
      </defs>

      <rect width="800" height="1131" fill="url(#p3-paperGrad-${themeKey})" />
      <rect width="800" height="1131" fill="url(#p3-wcTL-${themeKey})" />
      <rect width="800" height="1131" fill="url(#p3-wcBR-${themeKey})" />

      <!-- Horizontal Soft Watercolor Ripple between plaques -->
      <path d="M -20,490 Q 220,530 420,490 Q 620,450 820,500 L 820,535 Q 600,495 400,530 L -20,520 Z" fill="${wash3}" opacity="0.45" />

      <!-- Watermark Olive Branch Silhouettes (Peace & Blessing motif) -->
      <g transform="translate(720, 360) rotate(-45)">
        <ellipse cx="0" cy="0" rx="38" ry="15" fill="${leafSilhouette}" />
        <ellipse cx="40" cy="-15" rx="32" ry="13" fill="${leafSilhouette}" />
        <ellipse cx="-36" cy="15" rx="30" ry="12" fill="${leafSilhouette}" />
      </g>
      <g transform="translate(90, 800) rotate(35)">
        <ellipse cx="0" cy="0" rx="40" ry="16" fill="${leafSilhouette}" />
        <ellipse cx="42" cy="19" rx="34" ry="13" fill="${leafSilhouette}" />
      </g>

      <rect width="800" height="1131" fill="url(#p3-centerGlow-${themeKey})" />

      <!-- Gilded Stardust Accents around Quran & Family sections -->
      <path d="M 680,180 Q 680,187 687,187 Q 680,187 680,194 Q 680,187 673,187 Q 680,187 680,180" fill="${goldFoil}" />
      <path d="M 120,680 Q 120,687 127,687 Q 120,687 120,694 Q 120,687 113,687 Q 120,687 120,680" fill="${goldFoil}" />
      <circle cx="150" cy="220" r="3.0" fill="${goldFoil}" />
      <circle cx="650" cy="740" r="3.0" fill="${goldFoil}" />
      <circle cx="710" cy="880" r="3.4" fill="${goldFoil}" />
    </svg>
    `;
  }

  // =========================================================================
  // HALAMAN 4: MODERN ARCHITECTURAL & BOTANICAL GARDEN (Grounding Bottom Horizon Wash)
  // =========================================================================
  return `
  <svg width="800" height="1131" viewBox="0 0 800 1131" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="p4-paperGrad-${themeKey}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${baseColor}" />
        <stop offset="25%" stop-color="#ffffff" stop-opacity="0.45" />
        <stop offset="68%" stop-color="#ffffff" stop-opacity="0.45" />
        <stop offset="100%" stop-color="${baseColor}" />
      </linearGradient>
      <!-- Top Header Sky Mist -->
      <radialGradient id="p4-topMist-${themeKey}" cx="50%" cy="0%" r="50%">
        <stop offset="0%" stop-color="${wash2}" />
        <stop offset="50%" stop-color="${wash1}" stop-opacity="0.60" />
        <stop offset="100%" stop-color="${wash2}" stop-opacity="0" />
      </radialGradient>
      <!-- Grounding Bottom Horizon Wash (Behind QR & Bottom Vine Garland) -->
      <linearGradient id="p4-botHorizon-${themeKey}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="68%" stop-color="#ffffff" stop-opacity="0" />
        <stop offset="84%" stop-color="${wash2}" stop-opacity="0.65" />
        <stop offset="100%" stop-color="${wash1}" stop-opacity="0.85" />
      </linearGradient>
      <!-- Deep Watercolor Pool (Bottom Left & Right corners) -->
      <radialGradient id="p4-botCornerL-${themeKey}" cx="0%" cy="100%" r="58%">
        <stop offset="0%" stop-color="${wash1}" />
        <stop offset="60%" stop-color="${washDark}" stop-opacity="0.40" />
        <stop offset="100%" stop-color="${wash1}" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="p4-botCornerR-${themeKey}" cx="100%" cy="100%" r="58%">
        <stop offset="0%" stop-color="${wash2}" />
        <stop offset="60%" stop-color="${washDark}" stop-opacity="0.40" />
        <stop offset="100%" stop-color="${wash2}" stop-opacity="0" />
      </radialGradient>
    </defs>

    <rect width="800" height="1131" fill="url(#p4-paperGrad-${themeKey})" />
    <rect width="800" height="1131" fill="url(#p4-topMist-${themeKey})" />
    <rect width="800" height="1131" fill="url(#p4-botHorizon-${themeKey})" />
    <rect width="800" height="1131" fill="url(#p4-botCornerL-${themeKey})" />
    <rect width="800" height="1131" fill="url(#p4-botCornerR-${themeKey})" />

    <!-- Trailing Vine Silhouettes along Bottom Margin -->
    <g transform="translate(130, 1040) rotate(-12)">
      <ellipse cx="0" cy="0" rx="36" ry="15" fill="${leafSilhouette}" />
      <ellipse cx="42" cy="15" rx="30" ry="12" fill="${leafSilhouette}" />
    </g>
    <g transform="translate(670, 1040) rotate(12)">
      <ellipse cx="0" cy="0" rx="36" ry="15" fill="${leafSilhouette}" />
      <ellipse cx="-42" cy="15" rx="30" ry="12" fill="${leafSilhouette}" />
    </g>

    <!-- Navigational Compass Sparkle at Top -->
    <path d="M 400,28 Q 400,36 408,36 Q 400,36 400,44 Q 400,36 392,36 Q 400,36 400,28" fill="${goldFoil}" />
    <circle cx="160" cy="80" r="3.0" fill="${goldFoil}" />
    <circle cx="640" cy="80" r="3.0" fill="${goldFoil}" />
    <circle cx="210" cy="1070" r="3.4" fill="${goldFoil}" />
    <circle cx="590" cy="1070" r="3.4" fill="${goldFoil}" />
  </svg>
  `;
}

function getThemePalette(themeKey = 'puspa_jawi') {
  if (themeKey.includes('lunara') || themeKey.includes('azure')) {
    return {
      rosePrimary: '#4a7bb0',
      rosePrimaryLight: '#94bde6',
      rosePrimaryDeep: '#234975',
      roseSec: '#a5c8ed',
      roseSecLight: '#dcedfc',
      roseSecDeep: '#6594c7',
      ivoryPetal: '#f5f9fc',
      ivoryShadow: '#cadbee',
      goldColor: '#b89654',
      goldLeaf: 'rgba(200, 172, 110, 0.85)',
      leafHl1: '#9ec2cb',
      leafHl2: '#5f8f9b',
      leafSh1: '#4a7580',
      leafSh2: '#274b54',
      stemColor: '#1d3940',
      floretColor: '#dbe8f5',
      janurHl1: '#fbee9d',
      janurHl2: '#ddbe4b',
      janurSh1: '#b89428',
      janurSh2: '#75580f',
    };
  }
  if (themeKey.includes('verdant') || themeKey.includes('vow')) {
    return {
      rosePrimary: '#a88658',
      rosePrimaryLight: '#dbcaab',
      rosePrimaryDeep: '#6b4e28',
      roseSec: '#cfbca0',
      roseSecLight: '#f2eae0',
      roseSecDeep: '#9c815c',
      ivoryPetal: '#faf8f2',
      ivoryShadow: '#d9d0be',
      goldColor: '#b49456',
      goldLeaf: 'rgba(195, 168, 105, 0.85)',
      leafHl1: '#a4cca6',
      leafHl2: '#699b70',
      leafSh1: '#528258',
      leafSh2: '#254a2a',
      stemColor: '#1e3c22',
      floretColor: '#ede4d3',
      janurHl1: '#f7ed97',
      janurHl2: '#d8be42',
      janurSh1: '#ad9125',
      janurSh2: '#68560e',
    };
  }
  if (themeKey.includes('aurelia') || themeKey.includes('grande')) {
    return {
      rosePrimary: '#b87c35',
      rosePrimaryLight: '#eec28d',
      rosePrimaryDeep: '#7a4a15',
      roseSec: '#d4aa72',
      roseSecLight: '#fae8ce',
      roseSecDeep: '#9c6f33',
      ivoryPetal: '#fdfbf7',
      ivoryShadow: '#e0d5be',
      goldColor: '#c59d45',
      goldLeaf: 'rgba(215, 175, 80, 0.9)',
      leafHl1: '#a8bfa0',
      leafHl2: '#688c5e',
      leafSh1: '#507346',
      leafSh2: '#2b4724',
      stemColor: '#203d19',
      floretColor: '#f7edd8',
      janurHl1: '#fdec9a',
      janurHl2: '#e2be4a',
      janurSh1: '#ba9425',
      janurSh2: '#73580d',
    };
  }
  return {
    rosePrimary: '#b84458',
    rosePrimaryLight: '#ec9ba9',
    rosePrimaryDeep: '#721929',
    roseSec: '#dfa6b2',
    roseSecLight: '#fdedf0',
    roseSecDeep: '#9c4d5d',
    ivoryPetal: '#fcfaf6',
    ivoryShadow: '#ddd4c5',
    goldColor: '#c8a45d',
    goldLeaf: 'rgba(212, 175, 55, 0.85)',
    leafHl1: '#a6cfa0',
    leafHl2: '#5f9659',
    leafSh1: '#4a7d45',
    leafSh2: '#244820',
    stemColor: '#1a3818',
    floretColor: '#f7f2eb',
    janurHl1: '#f8e595',
    janurHl2: '#dfbe4a',
    janurSh1: '#b08d24',
    janurSh2: '#6e5614',
  };
}

// 3D REALISTIC BOTANICAL LEAF (Two-Tone Fold, Luminous Highlight, Soft Velvet Shadow, Organic Veins)
function renderBotanicalLeaf(cx, cy, len, w, curve = 0.12, rotDeg = 0, p, themeKey = 'puspa_jawi') {
  const tipX = curve * len * 0.4;
  const tipY = -len;
  const midCtrlX = tipX * 0.35;
  const midCtrlY = -len * 0.5;

  const lPath = `M 0,0 ` +
    `C ${-w * 0.6},${-len * 0.1} ${-w * 1.05},${-len * 0.35} ${-w * 0.95},${-len * 0.5} ` +
    `C ${-w * 0.7 + tipX * 0.3},${-len * 0.75} ${tipX * 0.8 - w * 0.2},${-len * 0.92} ${tipX},${tipY} ` +
    `Q ${midCtrlX},${midCtrlY} 0,0 Z`;

  const rPath = `M 0,0 ` +
    `Q ${midCtrlX},${midCtrlY} ${tipX},${tipY} ` +
    `C ${tipX * 0.8 + w * 0.2},${-len * 0.92} ${w * 0.7 + tipX * 0.3},${-len * 0.75} ${w * 0.95},${-len * 0.5} ` +
    `C ${w * 1.05},${-len * 0.35} ${w * 0.6},${-len * 0.1} 0,0 Z`;

  const veins = [];
  const count = 4;
  for (let i = 1; i <= count; i++) {
    const t = (i + 0.2) / (count + 1.5);
    const startY = -len * t;
    const startX = midCtrlX * Math.sin(t * Math.PI);
    const bladeW = w * Math.pow(Math.sin(t * Math.PI), 0.75);

    const lvxEnd = startX - bladeW * 0.68;
    const lvyEnd = startY - len * 0.10;
    veins.push(`<path d="M ${startX.toFixed(1)},${startY.toFixed(1)} Q ${(startX - bladeW * 0.35).toFixed(1)},${(startY - len * 0.04).toFixed(1)} ${lvxEnd.toFixed(1)},${lvyEnd.toFixed(1)}" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.4"/>`);

    const rvxEnd = startX + bladeW * 0.68;
    const rvyEnd = startY - len * 0.10;
    veins.push(`<path d="M ${startX.toFixed(1)},${startY.toFixed(1)} Q ${(startX + bladeW * 0.35).toFixed(1)},${(startY - len * 0.04).toFixed(1)} ${rvxEnd.toFixed(1)},${rvyEnd.toFixed(1)}" fill="none" stroke="${p.stemColor}" stroke-width="0.8" opacity="0.45"/>`);
  }

  return `
    <g transform="translate(${cx}, ${cy}) rotate(${rotDeg})">
      <path d="M 0,${len * 0.08} Q 0,${len * 0.04} 0,0" fill="none" stroke="${p.stemColor}" stroke-width="2.0" stroke-linecap="round"/>
      <path d="${lPath}" fill="url(#leaf-hl-${themeKey})" stroke="${p.leafSh1}" stroke-width="0.8"/>
      <path d="${rPath}" fill="url(#leaf-sh-${themeKey})" stroke="${p.leafSh2}" stroke-width="0.8"/>
      <path d="M 0,0 Q ${midCtrlX},${midCtrlY} ${tipX},${tipY}" fill="none" stroke="${p.stemColor}" stroke-width="1.4" stroke-linecap="round"/>
      ${veins.join('\n')}
    </g>
  `;
}

// BOTANICAL TRIO SPRIG
function renderLeafTrio(cx, cy, len, rotDeg, p, themeKey = 'puspa_jawi') {
  return `
    <g transform="translate(${cx}, ${cy}) rotate(${rotDeg})">
      <path d="M 0,${len * 0.25} Q 2,${len * 0.1} 0,0" fill="none" stroke="${p.stemColor}" stroke-width="2.2" stroke-linecap="round"/>
      <g transform="translate(0, ${-len * 0.06})">
        <path d="M 0,0 Q -6,-3 -14,-7" fill="none" stroke="${p.stemColor}" stroke-width="1.6" stroke-linecap="round"/>
        ${renderBotanicalLeaf(-14, -7, len * 0.72, len * 0.26, -0.16, -45, p, themeKey)}
      </g>
      <g transform="translate(0, ${-len * 0.14})">
        <path d="M 0,0 Q 6,-3 14,-7" fill="none" stroke="${p.stemColor}" stroke-width="1.6" stroke-linecap="round"/>
        ${renderBotanicalLeaf(14, -7, len * 0.70, len * 0.25, 0.16, 40, p, themeKey)}
      </g>
      ${renderBotanicalLeaf(0, 0, len, len * 0.32, 0.08, 0, p, themeKey)}
    </g>
  `;
}

// CASCADING WILLOW / SAGE BRANCH
function renderWillowBranch(cx, cy, len, rotDeg, p, themeKey = 'puspa_jawi') {
  let s = `<g transform="translate(${cx}, ${cy}) rotate(${rotDeg})">`;
  s += `<path d="M 0,0 Q 20,${-len * 0.5} 8,${-len}" fill="none" stroke="${p.stemColor}" stroke-width="2.0" stroke-linecap="round"/>`;
  
  const nodes = [
    { t: 0.22, side: -1, l: len * 0.40, w: len * 0.12, rot: -38 },
    { t: 0.40, side:  1, l: len * 0.42, w: len * 0.13, rot:  35 },
    { t: 0.58, side: -1, l: len * 0.38, w: len * 0.11, rot: -32 },
    { t: 0.76, side:  1, l: len * 0.34, w: len * 0.10, rot:  28 },
    { t: 0.92, side: -1, l: len * 0.28, w: len * 0.08, rot: -22 },
  ];

  for (const n of nodes) {
    const stemY = -len * n.t;
    const stemX = 20 * Math.sin(n.t * Math.PI * 0.75);
    s += `
      <g transform="translate(${stemX.toFixed(1)}, ${stemY.toFixed(1)})">
        <path d="M 0,0 Q ${n.side * 4},-2 ${n.side * 8},-4" fill="none" stroke="${p.stemColor}" stroke-width="1.4" stroke-linecap="round"/>
        ${renderBotanicalLeaf(n.side * 8, -4, n.l, n.w, n.side * 0.12, n.rot, p, themeKey)}
      </g>
    `;
  }
  s += `${renderBotanicalLeaf(8, -len, len * 0.34, len * 0.09, 0.05, 6, p, themeKey)}`;
  s += `</g>`;
  return s;
}

// SEEDED EUCALYPTUS SPRAY
function renderEucalyptusSpray(cx, cy, len, rotDeg, p, themeKey = 'puspa_jawi') {
  let s = `<g transform="translate(${cx}, ${cy}) rotate(${rotDeg})">`;
  s += `<path d="M 0,0 Q -14,${-len * 0.5} -3,${-len}" fill="none" stroke="${p.stemColor}" stroke-width="1.8" stroke-linecap="round"/>`;
  
  const nodes = [0.20, 0.42, 0.64, 0.84];
  for (const t of nodes) {
    const y = -len * t;
    const x = -14 * Math.sin(t * Math.PI * 0.85);
    const r = len * 0.12 * (1 - t * 0.25);
    s += `
      <g transform="translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${-48 - t * 10})">
        <path d="M 0,0 L -6,0" stroke="${p.stemColor}" stroke-width="1.2"/>
        <ellipse cx="${-6 - r * 0.9}" cy="0" rx="${r * 0.95}" ry="${r * 0.75}" fill="url(#leaf-hl-${themeKey})" stroke="${p.leafSh1}" stroke-width="0.8"/>
        <circle cx="${-6 - r * 0.9}" cy="0" r="1.2" fill="${p.leafSh2}" opacity="0.6"/>
      </g>
    `;
    s += `
      <g transform="translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${45 + t * 10})">
        <path d="M 0,0 L 6,0" stroke="${p.stemColor}" stroke-width="1.2"/>
        <ellipse cx="${6 + r * 0.9}" cy="0" rx="${r * 0.95}" ry="${r * 0.75}" fill="url(#leaf-sh-${themeKey})" stroke="${p.leafSh2}" stroke-width="0.8"/>
        <circle cx="${6 + r * 0.9}" cy="0" r="1.2" fill="${p.stemColor}" opacity="0.6"/>
      </g>
    `;
    s += `<circle cx="${(x + 2).toFixed(1)}" cy="${(y - 4).toFixed(1)}" r="2.0" fill="${p.goldColor}"/>`;
  }
  s += `</g>`;
  return s;
}

// ROSE BUD WITH CALYX
function renderRoseBud(cx, cy, r, rotDeg, p) {
  return `
    <g transform="translate(${cx}, ${cy}) rotate(${rotDeg})">
      <path d="M 0,${-r*1.1} C ${r*0.6},${-r*0.6} ${r*0.5},${r*0.3} 0,${r*0.6} C ${-r*0.5},${r*0.3} ${-r*0.6},${-r*0.6} 0,${-r*1.1} Z"
            fill="${p.rosePrimary}" stroke="#fff" stroke-width="0.8"/>
      <path d="M 0,${r*0.7} Q ${-r*0.7},${-r*0.1} ${-r*0.3},${-r*0.9}" fill="none" stroke="${p.leafSh2}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M 0,${r*0.7} Q ${r*0.7},${-r*0.1} ${r*0.3},${-r*0.9}" fill="none" stroke="${p.leafSh2}" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="0" cy="${r*0.65}" r="${r*0.28}" fill="${p.leafSh2}"/>
    </g>
  `;
}

// CHERRY FLORET
function renderCherryFloret(cx, cy, r, p) {
  let s = `<g transform="translate(${cx}, ${cy})">`;
  for (let i = 0; i < 5; i++) {
    const rot = i * 72;
    s += `<ellipse cx="0" cy="${-r*0.6}" rx="${r*0.42}" ry="${r*0.55}" transform="rotate(${rot})" fill="${p.floretColor}" stroke="${p.roseSecLight}" stroke-width="0.6"/>`;
  }
  s += `<circle cx="0" cy="0" r="${r*0.24}" fill="${p.goldColor}"/>`;
  s += `<circle cx="-0.4" cy="-0.4" r="${r*0.09}" fill="#ffffff"/>`;
  s += `</g>`;
  return s;
}

// FLOWERS
function renderMasterRose(cx, cy, r, p, themeKey, idPrefix = 'r', isHero = true) {
  const gradId = `rp-grad-${idPrefix}-${themeKey}`;
  const midGradId = `rp-mid-${idPrefix}-${themeKey}`;
  const strokeColor = '#ffffff';

  const layers = [
    { count: 8, dist: r * 0.72, rx: r * 0.36, ry: r * 0.44, rotOffset: 0, fill: `url(#${gradId})`, strokeW: 0.9 },
    { count: 7, dist: r * 0.54, rx: r * 0.32, ry: r * 0.38, rotOffset: 25, fill: `url(#${gradId})`, strokeW: 0.8 },
    { count: 6, dist: r * 0.38, rx: r * 0.28, ry: r * 0.32, rotOffset: 12, fill: `url(#${midGradId})`, strokeW: 0.8 },
    { count: 5, dist: r * 0.22, rx: r * 0.22, ry: r * 0.25, rotOffset: 36, fill: `url(#${midGradId})`, strokeW: 0.7 },
  ];

  let s = `<g transform="translate(${cx}, ${cy})">`;
  for (const layer of layers) {
    const angleStep = 360 / layer.count;
    for (let i = 0; i < layer.count; i++) {
      const rot = i * angleStep + layer.rotOffset;
      const rad = (rot - 90) * (Math.PI / 180);
      const px = Math.cos(rad) * layer.dist;
      const py = Math.sin(rad) * layer.dist;
      s += `
        <g transform="translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${rot})">
          <path d="M 0,${-layer.ry} C ${layer.rx*1.1},${-layer.ry*0.7} ${layer.rx*1.1},${layer.ry*0.5} 0,${layer.ry} C ${-layer.rx*1.1},${layer.ry*0.5} ${-layer.rx*1.1},${-layer.ry*0.7} 0,${-layer.ry} Z"
                fill="${layer.fill}" stroke="${strokeColor}" stroke-width="${layer.strokeW}" opacity="0.96"/>
        </g>
      `;
    }
  }
  const coreR = r * 0.22;
  s += `
    <circle cx="0" cy="0" r="${coreR}" fill="${p.rosePrimaryDeep}"/>
    <path d="M ${-coreR*0.7},0 A ${coreR*0.7} ${coreR*0.65} 0 0 1 ${coreR*0.7},0 A ${coreR*0.6} ${coreR*0.55} 0 0 0 ${-coreR*0.6},0" fill="none" stroke="${p.rosePrimaryLight}" stroke-width="1.3"/>
    <path d="M 0,${-coreR*0.6} A ${coreR*0.6} ${coreR*0.6} 0 0 1 0,${coreR*0.6} A ${coreR*0.5} ${coreR*0.5} 0 0 0 0,${-coreR*0.5}" fill="none" stroke="#fff" stroke-width="1.1"/>
    <circle cx="0" cy="0" r="${coreR*0.25}" fill="${p.rosePrimaryLight}"/>
  `;
  s += `</g>`;
  return s;
}

function renderMasterAnemone(cx, cy, r, p, themeKey, idPrefix = 'an', isWhite = true) {
  const strokeColor = '#b8a698';
  let s = `<g transform="translate(${cx}, ${cy})">`;
  const count = 6;
  for (let i = 0; i < count; i++) {
    const rot = i * 60;
    const w = r * 0.58;
    s += `
      <g transform="rotate(${rot})">
        <path d="M 0,0 C ${-w*0.5},${-r*0.2} ${-w*0.75},${-r*0.75} ${-w*0.3},${-r*0.96} Q 0,${-r*1.04} ${w*0.3},${-r*0.96} C ${w*0.75},${-r*0.75} ${w*0.5},${-r*0.2} 0,0 Z"
              fill="url(#an-grad-${idPrefix}-${themeKey})" stroke="${strokeColor}" stroke-width="0.8" opacity="0.95"/>
        <path d="M 0,${-r*0.25} L 0,${-r*0.82}" stroke="${strokeColor}" stroke-width="0.6" opacity="0.45"/>
        <path d="M 0,${-r*0.35} Q ${w*0.25},${-r*0.5} ${w*0.35},${-r*0.75}" fill="none" stroke="${strokeColor}" stroke-width="0.5" opacity="0.35"/>
        <path d="M 0,${-r*0.35} Q ${-w*0.25},${-r*0.5} ${-w*0.35},${-r*0.75}" fill="none" stroke="${strokeColor}" stroke-width="0.5" opacity="0.35"/>
      </g>
    `;
  }
  const coreR = r * 0.28;
  s += `
    <circle cx="0" cy="0" r="${coreR}" fill="#2a1f18"/>
    <circle cx="0" cy="0" r="${coreR * 0.7}" fill="#423024"/>
    <circle cx="0" cy="0" r="${coreR * 0.4}" fill="#1a120c"/>
  `;
  for (let i = 0; i < 16; i++) {
    const a = (i * 22.5) * (Math.PI / 180);
    const d1 = coreR * 0.85;
    const d2 = coreR * 1.35;
    const x1 = d1 * Math.cos(a);
    const y1 = d1 * Math.sin(a);
    const x2 = d2 * Math.cos(a);
    const y2 = d2 * Math.sin(a);
    s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#3d2a1c" stroke-width="0.8"/>`;
    s += `<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="2.2" fill="${p.goldColor}"/>`;
    s += `<circle cx="${(x2 - 0.4).toFixed(1)}" cy="${(y2 - 0.4).toFixed(1)}" r="0.8" fill="#ffffff"/>`;
  }
  s += `</g>`;
  return s;
}

// 1. REFINED CORNER BOUQUET
function getCornerBouquetSvgByCorner(themeKey = 'puspa_jawi', corner = 'tr') {
  const p = getThemePalette(themeKey);
  const rotMap = { tr: 0, br: 90, bl: 180, tl: 270 };
  const deg = rotMap[corner] || 0;

  return `
  <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="rp-grad-cb-hero-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.rosePrimaryLight}"/>
        <stop offset="60%" stop-color="${p.rosePrimary}"/>
        <stop offset="100%" stop-color="${p.rosePrimaryDeep}"/>
      </radialGradient>
      <radialGradient id="rp-mid-cb-hero-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.rosePrimaryLight}"/>
        <stop offset="70%" stop-color="${p.rosePrimary}"/>
        <stop offset="100%" stop-color="${p.rosePrimaryDeep}"/>
      </radialGradient>
      <radialGradient id="rp-grad-cb-sec-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.roseSecLight}"/>
        <stop offset="65%" stop-color="${p.roseSec}"/>
        <stop offset="100%" stop-color="${p.roseSecDeep}"/>
      </radialGradient>
      <radialGradient id="rp-mid-cb-sec-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.roseSecLight}"/>
        <stop offset="70%" stop-color="${p.roseSec}"/>
        <stop offset="100%" stop-color="${p.roseSecDeep}"/>
      </radialGradient>
      <radialGradient id="an-grad-cb-anemone-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#fff8f2"/>
        <stop offset="60%" stop-color="${p.ivoryPetal}"/>
        <stop offset="100%" stop-color="${p.ivoryShadow}"/>
      </radialGradient>
      <linearGradient id="leaf-hl-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafHl1}"/>
        <stop offset="60%" stop-color="${p.leafHl2}"/>
        <stop offset="100%" stop-color="${p.leafSh1}"/>
      </linearGradient>
      <linearGradient id="leaf-sh-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafSh1}"/>
        <stop offset="70%" stop-color="${p.leafSh2}"/>
        <stop offset="100%" stop-color="${p.stemColor}"/>
      </linearGradient>
    </defs>

    <g transform="rotate(${deg} 300 300)">
      ${renderWillowBranch(430, 200, 230, -100, p, themeKey)}
      ${renderEucalyptusSpray(440, 210, 190, -78, p, themeKey)}
      ${renderLeafTrio(390, 170, 130, -112, p, themeKey)}

      ${renderWillowBranch(460, 260, 240, -8, p, themeKey)}
      ${renderEucalyptusSpray(470, 250, 190, 15, p, themeKey)}
      ${renderLeafTrio(490, 310, 135, 12, p, themeKey)}

      ${renderBotanicalLeaf(430, 160, 95, 30, 0.15, -60, p, themeKey)}
      ${renderBotanicalLeaf(515, 235, 95, 30, -0.15, 45, p, themeKey)}

      <path d="M 440,210 Q 350,150 330,135 Q 365,120 440,210 Z" fill="${p.goldLeaf}" opacity="0.6"/>
      <path d="M 460,250 Q 530,340 545,360 Q 515,365 460,250 Z" fill="${p.goldLeaf}" opacity="0.6"/>

      ${renderRoseBud(365, 145, 16, -45, p)}
      ${renderRoseBud(515, 245, 15, 35, p)}

      ${renderMasterAnemone(375, 230, 56, p, themeKey, 'cb-anemone', false)}
      ${renderMasterRose(465, 305, 52, p, themeKey, 'cb-sec', false)}
      ${renderMasterRose(445, 180, 72, p, themeKey, 'cb-hero', true)}

      ${renderCherryFloret(360, 150, 14, p)}
      ${renderCherryFloret(440, 350, 14, p)}
      ${renderCherryFloret(345, 290, 12, p)}

      <circle cx="490" cy="380" r="3.5" fill="${p.goldColor}"/>
      <circle cx="310" cy="130" r="3.5" fill="${p.goldColor}"/>
    </g>
  </svg>
  `;
}

// 2. REFINED SIDE SPRIG
function getSideSprigSvg(themeKey = 'puspa_jawi', side = 'left') {
  const p = getThemePalette(themeKey);
  const isLeft = side === 'left';
  const flip = isLeft ? 1 : -1;
  const xOffset = isLeft ? 0 : 320;

  return `
  <svg width="320" height="460" viewBox="0 0 320 460" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="rp-grad-sprig-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.rosePrimaryLight}"/>
        <stop offset="60%" stop-color="${p.rosePrimary}"/>
        <stop offset="100%" stop-color="${p.rosePrimaryDeep}"/>
      </radialGradient>
      <radialGradient id="rp-mid-sprig-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.rosePrimaryLight}"/>
        <stop offset="70%" stop-color="${p.rosePrimary}"/>
        <stop offset="100%" stop-color="${p.rosePrimaryDeep}"/>
      </radialGradient>
      <radialGradient id="an-grad-sprig-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="65%" stop-color="${p.ivoryPetal}"/>
        <stop offset="100%" stop-color="${p.ivoryShadow}"/>
      </radialGradient>
      <linearGradient id="leaf-hl-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafHl1}"/>
        <stop offset="60%" stop-color="${p.leafHl2}"/>
        <stop offset="100%" stop-color="${p.leafSh1}"/>
      </linearGradient>
      <linearGradient id="leaf-sh-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafSh1}"/>
        <stop offset="70%" stop-color="${p.leafSh2}"/>
        <stop offset="100%" stop-color="${p.stemColor}"/>
      </linearGradient>
    </defs>

    <g transform="translate(${xOffset}, 0) scale(${flip}, 1)">
      ${renderWillowBranch(90, 230, 190, -22, p, themeKey)}
      ${renderEucalyptusSpray(100, 240, 150, 28, p, themeKey)}
      ${renderWillowBranch(90, 230, 180, 155, p, themeKey)}
      ${renderLeafTrio(80, 220, 105, -5, p, themeKey)}

      ${renderRoseBud(95, 175, 13, -25, p)}
      ${renderRoseBud(140, 395, 13, 160, p)}

      ${renderMasterAnemone(75, 230, 42, p, themeKey, 'sprig', false)}
      ${renderCherryFloret(105, 170, 12, p)}
      ${renderCherryFloret(100, 290, 12, p)}
    </g>
  </svg>
  `;
}

// 3. REFINED HEXAGON FOLIAGE
function getHexagonFoliageSvg(themeKey = 'puspa_jawi') {
  const p = getThemePalette(themeKey);

  return `
  <svg width="260" height="420" viewBox="0 0 260 420" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="rp-grad-hex-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.rosePrimaryLight}"/>
        <stop offset="60%" stop-color="${p.rosePrimary}"/>
        <stop offset="100%" stop-color="${p.rosePrimaryDeep}"/>
      </radialGradient>
      <radialGradient id="rp-mid-hex-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.rosePrimaryLight}"/>
        <stop offset="70%" stop-color="${p.rosePrimary}"/>
        <stop offset="100%" stop-color="${p.rosePrimaryDeep}"/>
      </radialGradient>
      <radialGradient id="an-grad-hex-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="65%" stop-color="${p.ivoryPetal}"/>
        <stop offset="100%" stop-color="${p.ivoryShadow}"/>
      </radialGradient>
      <linearGradient id="leaf-hl-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafHl1}"/>
        <stop offset="60%" stop-color="${p.leafHl2}"/>
        <stop offset="100%" stop-color="${p.leafSh1}"/>
      </linearGradient>
      <linearGradient id="leaf-sh-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafSh1}"/>
        <stop offset="70%" stop-color="${p.leafSh2}"/>
        <stop offset="100%" stop-color="${p.stemColor}"/>
      </linearGradient>
    </defs>

    ${renderWillowBranch(110, 200, 180, -35, p, themeKey)}
    ${renderWillowBranch(125, 230, 180, 145, p, themeKey)}
    ${renderEucalyptusSpray(115, 210, 130, 20, p, themeKey)}
    ${renderLeafTrio(105, 210, 95, 50, p, themeKey)}

    ${renderRoseBud(125, 125, 13, -20, p)}
    ${renderRoseBud(160, 310, 13, 140, p)}

    ${renderMasterAnemone(90, 160, 38, p, themeKey, 'hex', false)}
    ${renderMasterRose(115, 225, 46, p, themeKey, 'hex', true)}

    ${renderCherryFloret(140, 150, 11, p)}
    ${renderCherryFloret(135, 280, 11, p)}
  </svg>
  `;
}

// 4. REFINED HEADER GARLAND
function getHeaderGarlandSvg(themeKey = 'puspa_jawi') {
  const p = getThemePalette(themeKey);

  return `
  <svg width="800" height="200" viewBox="0 0 800 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="rp-grad-garland-c-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.rosePrimaryLight}"/>
        <stop offset="60%" stop-color="${p.rosePrimary}"/>
        <stop offset="100%" stop-color="${p.rosePrimaryDeep}"/>
      </radialGradient>
      <radialGradient id="rp-mid-garland-c-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.rosePrimaryLight}"/>
        <stop offset="70%" stop-color="${p.rosePrimary}"/>
        <stop offset="100%" stop-color="${p.rosePrimaryDeep}"/>
      </radialGradient>
      <radialGradient id="an-grad-garland-l-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="65%" stop-color="${p.ivoryPetal}"/>
        <stop offset="100%" stop-color="${p.ivoryShadow}"/>
      </radialGradient>
      <radialGradient id="an-grad-garland-r-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="65%" stop-color="${p.ivoryPetal}"/>
        <stop offset="100%" stop-color="${p.ivoryShadow}"/>
      </radialGradient>
      <linearGradient id="leaf-hl-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafHl1}"/>
        <stop offset="60%" stop-color="${p.leafHl2}"/>
        <stop offset="100%" stop-color="${p.leafSh1}"/>
      </linearGradient>
      <linearGradient id="leaf-sh-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafSh1}"/>
        <stop offset="70%" stop-color="${p.leafSh2}"/>
        <stop offset="100%" stop-color="${p.stemColor}"/>
      </linearGradient>
    </defs>

    ${renderWillowBranch(330, 95, 180, -85, p, themeKey)}
    ${renderEucalyptusSpray(340, 100, 150, -75, p, themeKey)}
    ${renderLeafTrio(260, 98, 90, -80, p, themeKey)}

    ${renderWillowBranch(470, 95, 180, 85, p, themeKey)}
    ${renderEucalyptusSpray(460, 100, 150, 75, p, themeKey)}
    ${renderLeafTrio(540, 98, 90, 80, p, themeKey)}

    ${renderBotanicalLeaf(380, 80, 70, 22, -0.15, -25, p, themeKey)}
    ${renderBotanicalLeaf(420, 80, 70, 22, 0.15, 25, p, themeKey)}

    ${renderRoseBud(155, 95, 14, -90, p)}
    ${renderRoseBud(645, 95, 14, 90, p)}

    <path d="M 320,95 Q 260,80 230,85 Q 270,98 320,95 Z" fill="${p.goldLeaf}" opacity="0.6"/>
    <path d="M 480,95 Q 540,80 570,85 Q 530,98 480,95 Z" fill="${p.goldLeaf}" opacity="0.6"/>

    ${renderMasterAnemone(315, 95, 42, p, themeKey, 'garland-l', false)}
    ${renderMasterAnemone(485, 95, 42, p, themeKey, 'garland-r', false)}
    ${renderMasterRose(400, 95, 58, p, themeKey, 'garland-c', true)}

    ${renderCherryFloret(225, 98, 12, p)}
    ${renderCherryFloret(575, 98, 12, p)}
    <circle cx="190" cy="92" r="3.0" fill="${p.goldColor}"/>
    <circle cx="610" cy="92" r="3.0" fill="${p.goldColor}"/>
  </svg>
  `;
}

// 5. REFINED OLIVE WREATH CORNER
function getOliveWreathCornerSvg(themeKey = 'puspa_jawi', corner = 'tr') {
  const p = getThemePalette(themeKey);
  const rotMap = { tr: 0, br: 90, bl: 180, tl: 270 };
  const deg = rotMap[corner] || 0;

  return `
  <svg width="500" height="500" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="rp-grad-olive-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.rosePrimaryLight}"/>
        <stop offset="60%" stop-color="${p.rosePrimary}"/>
        <stop offset="100%" stop-color="${p.rosePrimaryDeep}"/>
      </radialGradient>
      <radialGradient id="rp-mid-olive-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.rosePrimaryLight}"/>
        <stop offset="70%" stop-color="${p.rosePrimary}"/>
        <stop offset="100%" stop-color="${p.rosePrimaryDeep}"/>
      </radialGradient>
      <radialGradient id="an-grad-olive-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="65%" stop-color="${p.ivoryPetal}"/>
        <stop offset="100%" stop-color="${p.ivoryShadow}"/>
      </radialGradient>
      <linearGradient id="leaf-hl-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafHl1}"/>
        <stop offset="60%" stop-color="${p.leafHl2}"/>
        <stop offset="100%" stop-color="${p.leafSh1}"/>
      </linearGradient>
      <linearGradient id="leaf-sh-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafSh1}"/>
        <stop offset="70%" stop-color="${p.leafSh2}"/>
        <stop offset="100%" stop-color="${p.stemColor}"/>
      </linearGradient>
    </defs>

    <g transform="rotate(${deg} 250 250)">
      ${renderWillowBranch(360, 160, 210, -95, p, themeKey)}
      ${renderWillowBranch(380, 190, 160, 165, p, themeKey)}
      ${renderEucalyptusSpray(380, 200, 160, 0, p, themeKey)}
      ${renderLeafTrio(340, 140, 110, -80, p, themeKey)}

      ${renderRoseBud(395, 345, 14, 25, p)}

      ${renderMasterAnemone(315, 175, 46, p, themeKey, 'olive', false)}
      ${renderMasterRose(375, 140, 56, p, themeKey, 'olive', true)}

      ${renderCherryFloret(290, 115, 12, p)}
      ${renderCherryFloret(395, 275, 12, p)}
    </g>
  </svg>
  `;
}

// ============================================================================
// REALISTIC BOTANICAL & GEOMETRIC SUITE (EXACT REFERENCE 1 & 2 AESTHETIC)
// ============================================================================

// 1. REALISTIC SLENDER OLIVE LEAF (Reference 1: Natural organic curve, two-tone fold, central vein)
function renderRealisticLeaf(cx, cy, len, w, curve = 0.2, rotDeg = 0, p, themeKey = 'puspa_jawi') {
  const tipX = curve * len * 0.4;
  const tipY = -len;
  const midX = tipX * 0.4;
  const midY = -len * 0.52;

  // Left Blade (Sunlit Olive Gradient)
  const lBlade = 'M 0,0 ' +
    `C ${-w * 0.65},${-len * 0.18} ${-w * 0.95 + midX * 0.35},${-len * 0.45} ${midX},${midY} ` +
    `C ${midX - w * 0.5},${-len * 0.72} ${tipX - w * 0.2},${-len * 0.93} ${tipX},${tipY} ` +
    `Q ${midX * 0.8},${midY * 0.8} 0,0 Z`;

  // Right Blade (Velvet Shade Gradient)
  const rBlade = 'M 0,0 ' +
    `Q ${midX * 0.8},${midY * 0.8} ${tipX},${tipY} ` +
    `C ${tipX + w * 0.2},${-len * 0.93} ${midX + w * 0.5},${-len * 0.72} ${midX},${midY} ` +
    `C ${w * 0.95 + midX * 0.35},${-len * 0.45} ${w * 0.65},${-len * 0.18} 0,0 Z`;

  // Organic side veins
  let veins = '';
  for (let i = 1; i <= 3; i++) {
    const t = i * 0.23;
    const vy = -len * (0.22 + t * 0.52);
    const vx = midX * t * 1.1;
    veins += `<line x1="${vx.toFixed(1)}" y1="${vy.toFixed(1)}" x2="${(vx - w * 0.28).toFixed(1)}" y2="${(vy - 2.8).toFixed(1)}" stroke="${p.leafHl1}" stroke-width="0.5" opacity="0.6"/>`;
    veins += `<line x1="${vx.toFixed(1)}" y1="${vy.toFixed(1)}" x2="${(vx + w * 0.28).toFixed(1)}" y2="${(vy - 2.8).toFixed(1)}" stroke="${p.leafSh1}" stroke-width="0.5" opacity="0.6"/>`;
  }

  return `
    <g transform="translate(${cx}, ${cy}) rotate(${rotDeg})">
      <path d="${lBlade}" fill="url(#ref-leaf-hl-${themeKey})" stroke="${p.stemColor}" stroke-width="0.5"/>
      <path d="${rBlade}" fill="url(#ref-leaf-sh-${themeKey})" stroke="${p.leafSh2}" stroke-width="0.5"/>
      ${veins}
      <!-- Central Midrib -->
      <path d="M 0,0 Q ${midX.toFixed(1)},${midY.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)}" fill="none" stroke="${p.stemColor}" stroke-width="1.1" stroke-linecap="round"/>
    </g>
  `;
}

// 2. WHITE CHAMOMILE / BABY'S BREATH FLORET (Reference 1: Delicate white petals with warm orange-gold center)
function renderWhiteFloret(cx, cy, r, p) {
  let s = `<g transform="translate(${cx}, ${cy})">`;
  const petalCount = 6;
  const pRad = r * 0.62;
  const rx = r * 0.42;
  const ry = r * 0.28;
  for (let i = 0; i < petalCount; i++) {
    const a = (i * 60) * (Math.PI / 180);
    const px = pRad * Math.cos(a);
    const py = pRad * Math.sin(a);
    s += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" transform="rotate(${i * 60} ${px.toFixed(1)} ${py.toFixed(1)})" fill="${p.floretPetal}" stroke="#dedbd2" stroke-width="0.4"/>`;
  }
  // Warm golden-orange center
  s += `<circle cx="0" cy="0" r="${(r * 0.32).toFixed(1)}" fill="${p.floretCenter}" stroke="${p.goldColor}" stroke-width="0.4"/>`;
  s += `<circle cx="-0.3" cy="-0.3" r="${(r * 0.12).toFixed(1)}" fill="#ffffff"/>`;
  s += `</g>`;
  return s;
}

// 3. CURVING BOTANICAL SPRAY (Hugging the polygon frame like Reference 1)
function renderCurvedOliveSpray(p, themeKey, isTopLeft = true) {
  let s = `<g>`;

  if (isTopLeft) {
    // Top-Left: Arching smoothly from vertex (380, 80) down to (130, 320)
    // Main curving organic stem
    s += `<path d="M 410,75 C 330,75 220,110 165,190 C 130,240 120,310 125,370" fill="none" stroke="${p.stemColor}" stroke-width="2.0" stroke-linecap="round"/>`;
    s += `<path d="M 330,85 C 260,115 190,175 155,255" fill="none" stroke="${p.stemColor}" stroke-width="1.2" stroke-linecap="round"/>`;

    // Slender leaves hugging the path
    const leaves = [
      { x: 385, y: 76, len: 68, w: 14, curve: -0.15, rot: 75 },
      { x: 350, y: 80, len: 62, w: 13, curve: -0.18, rot: 65 },
      { x: 320, y: 92, len: 65, w: 14, curve: -0.22, rot: 50 },
      { x: 285, y: 108, len: 72, w: 15, curve: -0.25, rot: 40 },
      { x: 260, y: 125, len: 64, w: 14, curve: -0.20, rot: 25 },
      { x: 228, y: 145, len: 70, w: 15, curve: -0.24, rot: 15 },
      { x: 200, y: 172, len: 66, w: 14, curve: -0.26, rot: 0 },
      { x: 178, y: 205, len: 68, w: 15, curve: -0.22, rot: -15 },
      { x: 160, y: 242, len: 64, w: 14, curve: -0.20, rot: -28 },
      { x: 145, y: 280, len: 62, w: 13, curve: -0.18, rot: -38 },
      { x: 135, y: 320, len: 58, w: 12, curve: -0.15, rot: -45 },
      { x: 130, y: 360, len: 52, w: 11, curve: -0.12, rot: -52 },
      // Inner accent leaves
      { x: 300, y: 112, len: 52, w: 12, curve: 0.18, rot: 95 },
      { x: 245, y: 148, len: 55, w: 12, curve: 0.20, rot: 70 },
      { x: 195, y: 198, len: 54, w: 12, curve: 0.18, rot: 45 },
      { x: 165, y: 260, len: 50, w: 11, curve: 0.15, rot: 25 },
    ];

    for (const lf of leaves) {
      s += renderRealisticLeaf(lf.x, lf.y, lf.len, lf.w, lf.curve, lf.rot, p, themeKey);
    }

    // White baby's breath florets nestled in foliage
    const florets = [
      { x: 365, y: 68, r: 10.0 },
      { x: 310, y: 82, r: 9.5 },
      { x: 255, y: 115, r: 10.5 },
      { x: 212, y: 152, r: 9.0 },
      { x: 175, y: 192, r: 11.0 },
      { x: 150, y: 240, r: 9.5 },
      { x: 132, y: 295, r: 10.0 },
      { x: 128, y: 345, r: 8.5 },
      // Secondary sprig florets
      { x: 280, y: 95, r: 7.5 },
      { x: 190, y: 170, r: 8.0 },
      { x: 142, y: 265, r: 8.0 },
    ];
    for (const f of florets) {
      s += renderWhiteFloret(f.x, f.y, f.r, p);
    }

  } else {
    // Bottom-Right: Rising smoothly from vertex (450, 715) up along right edge to (680, 420)
    s += `<path d="M 430,720 C 510,720 600,680 645,610 C 678,560 685,490 680,420" fill="none" stroke="${p.stemColor}" stroke-width="2.0" stroke-linecap="round"/>`;
    s += `<path d="M 500,705 C 570,670 635,615 660,545" fill="none" stroke="${p.stemColor}" stroke-width="1.2" stroke-linecap="round"/>`;

    const leaves = [
      { x: 455, y: 720, len: 68, w: 14, curve: 0.15, rot: -105 },
      { x: 490, y: 712, len: 62, w: 13, curve: 0.18, rot: -115 },
      { x: 525, y: 698, len: 65, w: 14, curve: 0.22, rot: -130 },
      { x: 560, y: 678, len: 72, w: 15, curve: 0.25, rot: -140 },
      { x: 590, y: 655, len: 64, w: 14, curve: 0.20, rot: -155 },
      { x: 620, y: 625, len: 70, w: 15, curve: 0.24, rot: -165 },
      { x: 645, y: 590, len: 66, w: 14, curve: 0.26, rot: 180 },
      { x: 662, y: 550, len: 68, w: 15, curve: 0.22, rot: 165 },
      { x: 672, y: 510, len: 64, w: 14, curve: 0.20, rot: 152 },
      { x: 678, y: 470, len: 62, w: 13, curve: 0.18, rot: 142 },
      { x: 680, y: 430, len: 58, w: 12, curve: 0.15, rot: 135 },
      // Inner accent leaves
      { x: 540, y: 682, len: 52, w: 12, curve: -0.18, rot: -85 },
      { x: 595, y: 645, len: 55, w: 12, curve: -0.20, rot: -110 },
      { x: 635, y: 595, len: 54, w: 12, curve: -0.18, rot: -135 },
      { x: 655, y: 535, len: 50, w: 11, curve: -0.15, rot: -155 },
    ];

    for (const lf of leaves) {
      s += renderRealisticLeaf(lf.x, lf.y, lf.len, lf.w, lf.curve, lf.rot, p, themeKey);
    }

    const florets = [
      { x: 475, y: 725, r: 10.0 },
      { x: 530, y: 705, r: 9.5 },
      { x: 580, y: 675, r: 10.5 },
      { x: 625, y: 635, r: 9.0 },
      { x: 655, y: 595, r: 11.0 },
      { x: 670, y: 545, r: 9.5 },
      { x: 678, y: 495, r: 10.0 },
      { x: 680, y: 445, r: 8.5 },
      // Secondary sprig florets
      { x: 555, y: 692, r: 7.5 },
      { x: 640, y: 615, r: 8.0 },
      { x: 665, y: 520, r: 8.0 },
    ];
    for (const f of florets) {
      s += renderWhiteFloret(f.x, f.y, f.r, p);
    }
  }

  s += `</g>`;
  return s;
}

// =========================================================================
// AESTHETIC WATERCOLOR BOTANICAL SYSTEM (COVER DEPAN SPECIAL EDITION)
// Organic, soft-edged, painterly vector shapes without rigid math radial symmetry
// =========================================================================

function getAestheticCoverPalette(themeKey = 'verdant_vow') {
  if (themeKey.includes('jawi') || themeKey.includes('java')) {
    // Puspa Jawi: Romantic blush pink & dusty rose garden roses, deep emerald sage foliage
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
    // Lunara Azure: Serene ice blue & dusty slate garden roses, eucalyptus blue-green leaves
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
    // Aurelia Grande: Warm ivory, champagne, honey-bronze garden roses, warm olive foliage
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
    // Verdant Vow: Soft champagne-blush & ivory garden roses, fresh sage & silver eucalyptus
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

// Organic English Garden Rose (Painterly watercolor look)
function renderWatercolorGardenRose(cx, cy, scale, rotDeg, prefix, p, themeKey) {
  return `
  <g transform="translate(${cx}, ${cy}) rotate(${rotDeg}) scale(${scale})">
    <!-- Layer 1: Outer Organic Petals (Curling and cupping naturally) -->
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

    <!-- Layer 2: Mid Ruffled Petals (overlapping organically with subtle curls) -->
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

    <!-- Layer 3: Inner Cupped Petals (nesting inward) -->
    <path d="M -18,-12 C -30,-32 -10,-40 8,-26 C 15,-18 -2,-8 -18,-12 Z" 
          fill="url(#cov-${prefix}-inner-${themeKey})" opacity="0.97"/>
    <path d="M 10,-20 C 32,-18 35,10 14,14 C 2,16 2,-5 10,-20 Z" 
          fill="url(#cov-${prefix}-inner-${themeKey})" opacity="0.97"/>
    <path d="M -12,8 C 2,28 24,20 10,2 C 2,-5 -8,0 -12,8 Z" 
          fill="url(#cov-${prefix}-inner-${themeKey})" opacity="0.97"/>
    <path d="M -22,-2 C -28,15 -10,20 -4,5 C 0,-4 -12,-8 -22,-2 Z" 
          fill="url(#cov-${prefix}-inner-${themeKey})" opacity="0.97"/>

    <!-- Layer 4: Deep Rose Center (Spiral C-cups of the rose heart) -->
    <path d="M -10,-6 C -16,-18 8,-20 12,-8 C 14,0 -2,6 -10,-6 Z" 
          fill="url(#cov-${prefix}-deep-${themeKey})" opacity="0.98"/>
    <path d="M -6,-2 C -10,10 12,12 8,-2 C 5,-8 -2,-6 -6,-2 Z" 
          fill="url(#cov-${prefix}-deep-${themeKey})" opacity="0.98"/>
    
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

// Secondary Semi-Open Rose (Tilted 3/4 perspective, delicate petal layers)
function renderWatercolorRoseSide(cx, cy, scale, rotDeg, prefix, p, themeKey) {
  return `
  <g transform="translate(${cx}, ${cy}) rotate(${rotDeg}) scale(${scale})">
    <!-- Back outer petals -->
    <path d="M -25,-10 C -45,-45 10,-55 25,-25 C 20,-10 -5,-5 -25,-10 Z" 
          fill="url(#cov-${prefix}-outer-${themeKey})" opacity="0.9"/>
    <path d="M 15,-20 C 45,-40 60,-5 35,15 C 20,10 10,-5 15,-20 Z" 
          fill="url(#cov-${prefix}-outer-${themeKey})" opacity="0.9"/>

    <!-- Main cupping body -->
    <path d="M -35,5 C -50,40 10,65 35,35 C 45,20 15,10 -35,5 Z" 
          fill="url(#cov-${prefix}-mid-${themeKey})" stroke="rgba(255,255,255,0.5)" stroke-width="0.6" opacity="0.95"/>
    <path d="M -20,15 C -15,55 30,50 30,22 C 15,12 -5,10 -20,15 Z" 
          fill="url(#cov-${prefix}-inner-${themeKey})" opacity="0.96"/>

    <!-- Center bud spiral -->
    <path d="M -15,-5 C -22,-25 15,-28 18,-6 C 20,8 -5,12 -15,-5 Z" 
          fill="url(#cov-${prefix}-deep-${themeKey})" opacity="0.98"/>
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

// Delicate Rose Bud
function renderWatercolorBud(cx, cy, scale, rotDeg, prefix, p, themeKey) {
  return `
  <g transform="translate(${cx}, ${cy}) rotate(${rotDeg}) scale(${scale})">
    <!-- Stem connection -->
    <path d="M 0,18 C 0,30 5,42 8,50" fill="none" stroke="${p.stem}" stroke-width="2.0" stroke-linecap="round"/>
    
    <!-- Rosebud Petals emerging -->
    <path d="M -10,10 C -18,-15 0,-32 0,-32 C 0,-32 18,-15 10,10 Z" 
          fill="url(#cov-${prefix}-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.5"/>
    <path d="M -6,5 C -10,-12 0,-25 0,-25 C 0,-25 10,-12 6,5 Z" 
          fill="url(#cov-${prefix}-deep-${themeKey})" opacity="0.95"/>

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

// Delicate 5-Petal Floret
function renderWatercolorFloret(cx, cy, scale, rotDeg, p) {
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

// REALISTIC BOTANICAL LEAF (Smooth convex almond-tapered shape with curved midrib)
function renderRealisticCoverLeaf(cx, cy, len, w, curve = 0.1, rot = 0, hlGradId, shGradId, stemColor) {
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

// Realistic 3-Leaf Sprig
function renderRealisticCoverSprig(cx, cy, len, rot = 0, hlGradId, shGradId, stemColor) {
  const lateralLen = len * 0.72;
  const lateralW = lateralLen * 0.35;
  const mainW = len * 0.35;

  return `
  <g transform="translate(${cx}, ${cy}) rotate(${rot})">
    <path d="M 0,${len * 0.22} Q 2,${len * 0.08} 0,0" fill="none" stroke="${stemColor}" stroke-width="1.8" stroke-linecap="round"/>
    
    <g transform="translate(0, ${-len * 0.10})">
      <path d="M 0,0 Q -6,-3 -12,-6" fill="none" stroke="${stemColor}" stroke-width="1.2" stroke-linecap="round"/>
      ${renderRealisticCoverLeaf(-12, -6, lateralLen, lateralW, -0.14, -44, hlGradId, shGradId, stemColor)}
    </g>

    <g transform="translate(0, ${-len * 0.18})">
      <path d="M 0,0 Q 6,-3 12,-6" fill="none" stroke="${stemColor}" stroke-width="1.2" stroke-linecap="round"/>
      ${renderRealisticCoverLeaf(12, -6, lateralLen, lateralW, 0.14, 40, hlGradId, shGradId, stemColor)}
    </g>

    ${renderRealisticCoverLeaf(0, 0, len, mainW, 0.06, 0, hlGradId, shGradId, stemColor)}
  </g>
  `;
}

// Long Realistic Botanical Branch
function renderRealisticCoverBranch(cx, cy, len, rot = 0, hlGradId, shGradId, stemColor) {
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
      ${renderRealisticCoverLeaf(px, py, n.l, n.w, n.curve, n.rot, hlGradId, shGradId, stemColor)}
    `;
  }

  s += `${renderRealisticCoverLeaf(8, -len, len * 0.28, len * 0.09, 0.04, 6, hlGradId, shGradId, stemColor)}`;
  s += `</g>`;
  return s;
}

// Slender Olive Branch
function renderRealisticCoverOlive(cx, cy, len, rot = 0, hlGradId, shGradId, stemColor) {
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
      ${renderRealisticCoverLeaf(px, py, n.l, n.w, n.curve, n.rot, hlGradId, shGradId, stemColor)}
    `;
  }
  s += `${renderRealisticCoverLeaf(-5, -len, len * 0.25, len * 0.07, 0.04, -4, hlGradId, shGradId, stemColor)}`;
  s += `</g>`;
  return s;
}

// Delicate Gold Foil Branch Accent
function renderGoldTwig(cx, cy, len, rotDeg, p) {
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

// CENTER FLORAL FRAME SVG (SOFT ROUNDED DOUBLE-LINE WITH LUSH DIAGONAL WATERCOLOR ROSES & FLORETS)
function getCenterFloralFrameSvg(themeKey = 'verdant_vow') {
  const p = getAestheticCoverPalette(themeKey);

  return `
  <svg width="520" height="360" viewBox="0 0 520 360" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Gold Frame Gradient -->
      <linearGradient id="cf-gold-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.goldLeaf}"/>
        <stop offset="50%" stop-color="${p.goldAccent}"/>
        <stop offset="100%" stop-color="${p.goldLeaf}"/>
      </linearGradient>

      <!-- Center Frame Rose Gradients -->
      <radialGradient id="cf-rose-out-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="60%" stop-color="${p.roseOuter1}"/>
        <stop offset="100%" stop-color="${p.roseOuter2}"/>
      </radialGradient>
      <radialGradient id="cf-rose-mid-${themeKey}" cx="42%" cy="42%" r="65%">
        <stop offset="0%" stop-color="${p.roseOuter2}"/>
        <stop offset="60%" stop-color="${p.roseMid1}"/>
        <stop offset="100%" stop-color="${p.roseMid2}"/>
      </radialGradient>
      <radialGradient id="cf-rose-deep-${themeKey}" cx="40%" cy="40%" r="65%">
        <stop offset="0%" stop-color="${p.roseMid2}"/>
        <stop offset="70%" stop-color="${p.roseDeep1}"/>
        <stop offset="100%" stop-color="${p.roseDeep2}"/>
      </radialGradient>

      <!-- Leaf Gradients -->
      <linearGradient id="cf-leaf-hl-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafHl}"/>
        <stop offset="60%" stop-color="${p.leafMid}"/>
        <stop offset="100%" stop-color="${p.leafDeep}"/>
      </linearGradient>
      <linearGradient id="cf-leaf-sh-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafMid}"/>
        <stop offset="70%" stop-color="${p.leafDeep}"/>
        <stop offset="100%" stop-color="${p.leafShadow}"/>
      </linearGradient>
    </defs>

    <!-- 1. SOFT ROUNDED LUXURY DOUBLE GOLD FRAME (No sharp lancip corners!) -->
    <!-- Outer Rounded Rectangle (Smooth continuous curve rx=34) -->
    <rect x="50" y="30" width="420" height="300" rx="34" ry="34"
          fill="none" stroke="url(#cf-gold-${themeKey})" stroke-width="1.8" opacity="0.95"/>

    <!-- Inner Concentric Rounded Rectangle (Smooth rx=24) -->
    <rect x="62" y="42" width="396" height="276" rx="24" ry="24"
          fill="none" stroke="url(#cf-gold-${themeKey})" stroke-width="0.9" opacity="0.75"/>

    <!-- Delicate Gold Diamond Beads at Center Top & Bottom -->
    <g fill="${p.goldAccent}">
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
        <path d="M 0,0 C -10,-20 -18,-42 0,-58 C 18,-42 10,-20 0,0 Z" fill="url(#cf-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
        <path d="M 0,0 Q 0,-29 0,-58" stroke="${p.stem}" stroke-width="1.1" opacity="0.8"/>
      </g>
      <g transform="translate(35, -10) rotate(65)">
        <path d="M 0,0 C -9,-18 -16,-36 0,-52 C 16,-36 9,-18 0,0 Z" fill="url(#cf-leaf-sh-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
        <path d="M 0,0 Q 0,-26 0,-52" stroke="${p.stem}" stroke-width="1.0" opacity="0.8"/>
      </g>
      <g transform="translate(30, 30) rotate(115)">
        <path d="M 0,0 C -9,-18 -16,-38 0,-54 C 16,-38 9,-18 0,0 Z" fill="url(#cf-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
        <path d="M 0,0 Q 0,-27 0,-54" stroke="${p.stem}" stroke-width="1.0" opacity="0.8"/>
      </g>
      <g transform="translate(-25, -25) rotate(-25)">
        <path d="M 0,0 C -8,-15 -14,-32 0,-44 C 14,-32 8,-15 0,0 Z" fill="url(#cf-leaf-sh-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
      </g>
      <!-- Trailing gold wire with beads -->
      <path d="M 0,0 Q 40,-30 55,-55" fill="none" stroke="${p.goldAccent}" stroke-width="0.9" opacity="0.85"/>
      <circle cx="55" cy="-55" r="2.2" fill="${p.goldLeaf}"/>
      <circle cx="35" cy="-28" r="1.8" fill="${p.goldLeaf}"/>
      <path d="M 0,0 Q 45,20 60,45" fill="none" stroke="${p.goldAccent}" stroke-width="0.9" opacity="0.85"/>
      <circle cx="60" cy="45" r="2.2" fill="${p.goldLeaf}"/>

      <!-- Rosebud with green sepals -->
      <g transform="translate(42, -32) rotate(42)">
        <path d="M 0,10 C 0,20 3,28 5,35" fill="none" stroke="${p.stem}" stroke-width="1.8"/>
        <path d="M -8,6 C -14,-12 0,-26 0,-26 C 0,-26 14,-12 8,6 Z" fill="url(#cf-rose-mid-${themeKey})"/>
        <path d="M -8,10 C -16,0 -14,-14 -10,-20 C -8,-10 -3,2 0,8 Z" fill="${p.leafDeep}"/>
        <path d="M 6,10 C 14,0 12,-14 8,-20 C 6,-10 1,2 0,8 Z" fill="${p.leafMid}"/>
      </g>

      <!-- Main Blooming Watercolor Rose -->
      <g transform="translate(0, 0) scale(0.92)">
        <!-- Outer petals -->
        <path d="M -15,-35 C -45,-65 -75,-30 -60,10 C -48,22 -25,25 -10,0 Z" fill="url(#cf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M -25,-30 C -20,-75 35,-78 45,-38 C 48,-20 20,-10 0,-15 Z" fill="url(#cf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M 20,-30 C 65,-60 85,-15 70,25 C 60,35 30,20 15,0 Z" fill="url(#cf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M 25,10 C 75,25 65,75 15,70 C -10,65 5,35 0,15 Z" fill="url(#cf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M -20,20 C -15,72 40,78 30,35 C 25,15 -5,10 -15,20 Z" fill="url(#cf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M -15,15 C -65,45 -70,-5 -35,-15 C -20,-5 -10,5 -15,15 Z" fill="url(#cf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <!-- Mid petals -->
        <path d="M -28,-18 C -52,-42 -40,-60 -8,-45 C 5,-35 -5,-15 -28,-18 Z" fill="url(#cf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <path d="M 5,-32 C 38,-55 58,-32 40,-8 C 30,2 10,-10 5,-32 Z" fill="url(#cf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <path d="M 22,-8 C 55,2 52,42 18,36 C 5,30 10,10 22,-8 Z" fill="url(#cf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <path d="M -10,18 C 15,50 38,38 20,12 C 5,2 -5,5 -10,18 Z" fill="url(#cf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <path d="M -30,5 C -55,28 -32,48 -5,22 C 2,12 -12,2 -30,5 Z" fill="url(#cf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <!-- Center heart -->
        <path d="M -18,-12 C -30,-32 -10,-40 8,-26 C 15,-18 -2,-8 -18,-12 Z" fill="url(#cf-rose-deep-${themeKey})"/>
        <path d="M 10,-20 C 32,-18 35,10 14,14 C 2,16 2,-5 10,-20 Z" fill="url(#cf-rose-deep-${themeKey})"/>
        <path d="M -10,-6 C -16,-18 8,-20 12,-8 C 14,0 -2,6 -10,-6 Z" fill="url(#cf-rose-deep-${themeKey})"/>
        <path d="M -5,-3 C -2,-9 6,-7 5,-1 C 4,4 -3,4 -2,-1" fill="none" stroke="${p.roseDeep2}" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="1" cy="-1" r="1.6" fill="${p.goldAccent}"/>
      </g>

      <!-- Secondary Blooming Companion Rose -->
      <g transform="translate(-28, 28) scale(0.65) rotate(-20)">
        <path d="M -25,-10 C -45,-45 10,-55 25,-25 C 20,-10 -5,-5 -25,-10 Z" fill="url(#cf-rose-out-${themeKey})" opacity="0.9"/>
        <path d="M 15,-20 C 45,-40 60,-5 35,15 C 20,10 10,-5 15,-20 Z" fill="url(#cf-rose-out-${themeKey})" opacity="0.9"/>
        <path d="M -35,5 C -50,40 10,65 35,35 C 45,20 15,10 -35,5 Z" fill="url(#cf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.5)" stroke-width="0.6"/>
        <path d="M -20,15 C -15,55 30,50 30,22 C 15,12 -5,10 -20,15 Z" fill="url(#cf-rose-deep-${themeKey})" opacity="0.96"/>
        <path d="M -15,-5 C -22,-25 15,-28 18,-6 C 20,8 -5,12 -15,-5 Z" fill="url(#cf-rose-deep-${themeKey})"/>
        <circle cx="2" cy="0" r="1.5" fill="${p.goldAccent}"/>
      </g>

      <!-- 3 Petite White Jasmine Florets -->
      <g transform="translate(-36, -12) scale(0.55)">
        <path d="M 0,-15 C -4,-8 -4,-4 0,0 C 4,-4 4,-8 0,-15 Z" fill="${p.floretPetal}"/>
        <path d="M 15,0 C 8,-4 4,-4 0,0 C 4,4 8,4 15,0 Z" fill="${p.floretPetal}"/>
        <path d="M 0,15 C 4,8 4,4 0,0 C -4,4 -4,8 0,15 Z" fill="${p.floretPetal}"/>
        <path d="M -15,0 C -8,4 -4,4 0,0 C -4,-4 -8,-4 -15,0 Z" fill="${p.floretPetal}"/>
        <circle cx="0" cy="0" r="2.8" fill="${p.floretCenter}"/>
      </g>
      <g transform="translate(18, 48) scale(0.48) rotate(35)">
        <path d="M 0,-15 C -4,-8 -4,-4 0,0 C 4,-4 4,-8 0,-15 Z" fill="${p.floretPetal}"/>
        <path d="M 15,0 C 8,-4 4,-4 0,0 C 4,4 8,4 15,0 Z" fill="${p.floretPetal}"/>
        <path d="M 0,15 C 4,8 4,4 0,0 C -4,4 -4,8 0,15 Z" fill="${p.floretPetal}"/>
        <path d="M -15,0 C -8,4 -4,4 0,0 C -4,-4 -8,-4 -15,0 Z" fill="${p.floretPetal}"/>
        <circle cx="0" cy="0" r="2.8" fill="${p.floretCenter}"/>
      </g>
      <g transform="translate(-12, 54) scale(0.44) rotate(-15)">
        <path d="M 0,-15 C -4,-8 -4,-4 0,0 C 4,-4 4,-8 0,-15 Z" fill="${p.floretPetal}"/>
        <path d="M 15,0 C 8,-4 4,-4 0,0 C 4,4 8,4 15,0 Z" fill="${p.floretPetal}"/>
        <path d="M 0,15 C 4,8 4,4 0,0 C -4,4 -4,8 0,15 Z" fill="${p.floretPetal}"/>
        <path d="M -15,0 C -8,4 -4,4 0,0 C -4,-4 -8,-4 -15,0 Z" fill="${p.floretPetal}"/>
        <circle cx="0" cy="0" r="2.8" fill="${p.floretCenter}"/>
      </g>
    </g>

    <!-- ============================================================== -->
    <!-- 3. BALANCING FLORAL CLUSTER: BOTTOM-LEFT SHOULDER (BL)         -->
    <!-- ============================================================== -->
    <g transform="translate(95, 305)">
      <!-- Spray of Eucalyptus leaves reaching outward and along frame -->
      <g transform="translate(-10, 32) rotate(205)">
        <path d="M 0,0 C -10,-20 -18,-42 0,-58 C 18,-42 10,-20 0,0 Z" fill="url(#cf-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
        <path d="M 0,0 Q 0,-29 0,-58" stroke="${p.stem}" stroke-width="1.1" opacity="0.8"/>
      </g>
      <g transform="translate(-35, 10) rotate(245)">
        <path d="M 0,0 C -9,-18 -16,-36 0,-52 C 16,-36 9,-18 0,0 Z" fill="url(#cf-leaf-sh-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
        <path d="M 0,0 Q 0,-26 0,-52" stroke="${p.stem}" stroke-width="1.0" opacity="0.8"/>
      </g>
      <g transform="translate(-30, -30) rotate(295)">
        <path d="M 0,0 C -9,-18 -16,-38 0,-54 C 16,-38 9,-18 0,0 Z" fill="url(#cf-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
        <path d="M 0,0 Q 0,-27 0,-54" stroke="${p.stem}" stroke-width="1.0" opacity="0.8"/>
      </g>
      <g transform="translate(25, 25) rotate(155)">
        <path d="M 0,0 C -8,-15 -14,-32 0,-44 C 14,-32 8,-15 0,0 Z" fill="url(#cf-leaf-sh-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
      </g>
      <!-- Trailing gold wire with beads -->
      <path d="M 0,0 Q -40,30 -55,55" fill="none" stroke="${p.goldAccent}" stroke-width="0.9" opacity="0.85"/>
      <circle cx="-55" cy="55" r="2.2" fill="${p.goldLeaf}"/>
      <circle cx="-35" cy="28" r="1.8" fill="${p.goldLeaf}"/>
      <path d="M 0,0 Q -45,-20 -60,-45" fill="none" stroke="${p.goldAccent}" stroke-width="0.9" opacity="0.85"/>
      <circle cx="-60" cy="-45" r="2.2" fill="${p.goldLeaf}"/>

      <!-- Rosebud with green sepals -->
      <g transform="translate(-42, 32) rotate(222)">
        <path d="M 0,10 C 0,20 3,28 5,35" fill="none" stroke="${p.stem}" stroke-width="1.8"/>
        <path d="M -8,6 C -14,-12 0,-26 0,-26 C 0,-26 14,-12 8,6 Z" fill="url(#cf-rose-mid-${themeKey})"/>
        <path d="M -8,10 C -16,0 -14,-14 -10,-20 C -8,-10 -3,2 0,8 Z" fill="${p.leafDeep}"/>
        <path d="M 6,10 C 14,0 12,-14 8,-20 C 6,-10 1,2 0,8 Z" fill="${p.leafMid}"/>
      </g>

      <!-- Main Blooming Watercolor Rose on BL -->
      <g transform="translate(0, 0) scale(0.92) rotate(180)">
        <!-- Outer petals -->
        <path d="M -15,-35 C -45,-65 -75,-30 -60,10 C -48,22 -25,25 -10,0 Z" fill="url(#cf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M -25,-30 C -20,-75 35,-78 45,-38 C 48,-20 20,-10 0,-15 Z" fill="url(#cf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M 20,-30 C 65,-60 85,-15 70,25 C 60,35 30,20 15,0 Z" fill="url(#cf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M 25,10 C 75,25 65,75 15,70 C -10,65 5,35 0,15 Z" fill="url(#cf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M -20,20 C -15,72 40,78 30,35 C 25,15 -5,10 -15,20 Z" fill="url(#cf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <path d="M -15,15 C -65,45 -70,-5 -35,-15 C -20,-5 -10,5 -15,15 Z" fill="url(#cf-rose-out-${themeKey})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
        <!-- Mid petals -->
        <path d="M -28,-18 C -52,-42 -40,-60 -8,-45 C 5,-35 -5,-15 -28,-18 Z" fill="url(#cf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <path d="M 5,-32 C 38,-55 58,-32 40,-8 C 30,2 10,-10 5,-32 Z" fill="url(#cf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <path d="M 22,-8 C 55,2 52,42 18,36 C 5,30 10,10 22,-8 Z" fill="url(#cf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <path d="M -10,18 C 15,50 38,38 20,12 C 5,2 -5,5 -10,18 Z" fill="url(#cf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <path d="M -30,5 C -55,28 -32,48 -5,22 C 2,12 -12,2 -30,5 Z" fill="url(#cf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.6)" stroke-width="0.6"/>
        <!-- Center heart -->
        <path d="M -18,-12 C -30,-32 -10,-40 8,-26 C 15,-18 -2,-8 -18,-12 Z" fill="url(#cf-rose-deep-${themeKey})"/>
        <path d="M 10,-20 C 32,-18 35,10 14,14 C 2,16 2,-5 10,-20 Z" fill="url(#cf-rose-deep-${themeKey})"/>
        <path d="M -10,-6 C -16,-18 8,-20 12,-8 C 14,0 -2,6 -10,-6 Z" fill="url(#cf-rose-deep-${themeKey})"/>
        <path d="M -5,-3 C -2,-9 6,-7 5,-1 C 4,4 -3,4 -2,-1" fill="none" stroke="${p.roseDeep2}" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="1" cy="-1" r="1.6" fill="${p.goldAccent}"/>
      </g>

      <!-- Secondary Blooming Companion Rose on BL -->
      <g transform="translate(28, -28) scale(0.65) rotate(160)">
        <path d="M -25,-10 C -45,-45 10,-55 25,-25 C 20,-10 -5,-5 -25,-10 Z" fill="url(#cf-rose-out-${themeKey})" opacity="0.9"/>
        <path d="M 15,-20 C 45,-40 60,-5 35,15 C 20,10 10,-5 15,-20 Z" fill="url(#cf-rose-out-${themeKey})" opacity="0.9"/>
        <path d="M -35,5 C -50,40 10,65 35,35 C 45,20 15,10 -35,5 Z" fill="url(#cf-rose-mid-${themeKey})" stroke="rgba(255,255,255,0.5)" stroke-width="0.6"/>
        <path d="M -20,15 C -15,55 30,50 30,22 C 15,12 -5,10 -20,15 Z" fill="url(#cf-rose-deep-${themeKey})" opacity="0.96"/>
        <path d="M -15,-5 C -22,-25 15,-28 18,-6 C 20,8 -5,12 -15,-5 Z" fill="url(#cf-rose-deep-${themeKey})"/>
        <circle cx="2" cy="0" r="1.5" fill="${p.goldAccent}"/>
      </g>

      <!-- 3 Petite White Jasmine Florets on BL -->
      <g transform="translate(36, 12) scale(0.55)">
        <path d="M 0,-15 C -4,-8 -4,-4 0,0 C 4,-4 4,-8 0,-15 Z" fill="${p.floretPetal}"/>
        <path d="M 15,0 C 8,-4 4,-4 0,0 C 4,4 8,4 15,0 Z" fill="${p.floretPetal}"/>
        <path d="M 0,15 C 4,8 4,4 0,0 C -4,4 -4,8 0,15 Z" fill="${p.floretPetal}"/>
        <path d="M -15,0 C -8,4 -4,4 0,0 C -4,-4 -8,-4 -15,0 Z" fill="${p.floretPetal}"/>
        <circle cx="0" cy="0" r="2.8" fill="${p.floretCenter}"/>
      </g>
      <g transform="translate(-18, -48) scale(0.48) rotate(35)">
        <path d="M 0,-15 C -4,-8 -4,-4 0,0 C 4,-4 4,-8 0,-15 Z" fill="${p.floretPetal}"/>
        <path d="M 15,0 C 8,-4 4,-4 0,0 C 4,4 8,4 15,0 Z" fill="${p.floretPetal}"/>
        <path d="M 0,15 C 4,8 4,4 0,0 C -4,4 -4,8 0,15 Z" fill="${p.floretPetal}"/>
        <path d="M -15,0 C -8,4 -4,4 0,0 C -4,-4 -8,-4 -15,0 Z" fill="${p.floretPetal}"/>
        <circle cx="0" cy="0" r="2.8" fill="${p.floretCenter}"/>
      </g>
      <g transform="translate(12, -54) scale(0.44) rotate(-15)">
        <path d="M 0,-15 C -4,-8 -4,-4 0,0 C 4,-4 4,-8 0,-15 Z" fill="${p.floretPetal}"/>
        <path d="M 15,0 C 8,-4 4,-4 0,0 C 4,4 8,4 15,0 Z" fill="${p.floretPetal}"/>
        <path d="M 0,15 C 4,8 4,4 0,0 C -4,4 -4,8 0,15 Z" fill="${p.floretPetal}"/>
        <path d="M -15,0 C -8,4 -4,4 0,0 C -4,-4 -8,-4 -15,0 Z" fill="${p.floretPetal}"/>
        <circle cx="0" cy="0" r="2.8" fill="${p.floretCenter}"/>
      </g>
    </g>

    <!-- 4. DELICATE ACCENT SPRIGS ON TOP-LEFT AND BOTTOM-RIGHT SHOULDERS -->
    <g transform="translate(80, 52) rotate(-35) scale(0.65)">
      <path d="M 0,0 C -8,-15 -14,-32 0,-44 C 14,-32 8,-15 0,0 Z" fill="url(#cf-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
      <path d="M 0,0 Q 0,-22 0,-44" stroke="${p.stem}" stroke-width="0.9" opacity="0.8"/>
      <circle cx="0" cy="-48" r="2.0" fill="${p.goldLeaf}"/>
      <g transform="translate(-8, -18) scale(0.65)">
        <circle cx="0" cy="0" r="4.0" fill="${p.floretPetal}"/>
        <circle cx="0" cy="0" r="1.6" fill="${p.goldAccent}"/>
      </g>
    </g>
    <g transform="translate(440, 308) rotate(145) scale(0.65)">
      <path d="M 0,0 C -8,-15 -14,-32 0,-44 C 14,-32 8,-15 0,0 Z" fill="url(#cf-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
      <path d="M 0,0 Q 0,-22 0,-44" stroke="${p.stem}" stroke-width="0.9" opacity="0.8"/>
      <circle cx="0" cy="-48" r="2.0" fill="${p.goldLeaf}"/>
      <g transform="translate(-8, -18) scale(0.65)">
        <circle cx="0" cy="0" r="4.0" fill="${p.floretPetal}"/>
        <circle cx="0" cy="0" r="1.6" fill="${p.goldAccent}"/>
      </g>
    </g>
  </svg>
  `;
}

// COVER HALF-FRAME BOUQUET (LUSH BOTANICAL FRAMING COVERING EXACTLY 50% OF EACH BORDER - REALISTIC BOTANICAL LEAVES)
function getCoverCornerBouquetSvg(themeKey = 'puspa_jawi', corner = 'tl') {
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

      <!-- Secondary Rose Gradients (Soft blush/tint) -->
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
      ${renderRealisticCoverBranch(280, 85, 270, 84, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      <!-- Slender olive branch intertwining -->
      ${renderRealisticCoverOlive(330, 75, 250, 78, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      <!-- Sprig accents -->
      ${renderRealisticCoverSprig(420, 65, 120, 82, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderGoldTwig(380, 55, 190, 82, p)}

      <!-- Mid bloom cluster on top arm -->
      ${renderWatercolorRoseSide(460, 85, 0.88, 15, 'r2', p, themeKey)}
      ${renderWatercolorBud(405, 42, 0.85, 75, 'r1', p, themeKey)}
      ${renderWatercolorFloret(420, 115, 1.1, 20, p)}
      ${renderWatercolorFloret(510, 95, 0.95, -15, p)}

      <!-- Outer horizontal extension (reaching past X: 660) -->
      ${renderRealisticCoverBranch(470, 70, 240, 86, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderRealisticCoverOlive(520, 55, 190, 80, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderRealisticCoverSprig(570, 48, 110, 86, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderGoldTwig(550, 42, 140, 86, p)}
      ${renderWatercolorBud(580, 35, 0.75, 85, 'r2', p, themeKey)}
      ${renderWatercolorFloret(610, 45, 0.9, 35, p)}
      ${renderWatercolorFloret(665, 30, 0.8, -10, p)}

      <!-- ============================================================== -->
      <!-- 2. LEFT ARM (Reaches from Y: 220 to Y: 980 down left margin)   -->
      <!-- ============================================================== -->
      <!-- Upper section of left garland -->
      ${renderRealisticCoverBranch(85, 280, 270, -6, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderRealisticCoverOlive(75, 330, 250, 8, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderRealisticCoverSprig(65, 420, 120, 2, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderGoldTwig(50, 380, 190, 2, p)}

      <!-- Mid bloom cluster on left arm -->
      ${renderWatercolorGardenRose(85, 470, 0.90, -25, 'r2', p, themeKey)}
      ${renderWatercolorBud(45, 410, 0.85, -25, 'r1', p, themeKey)}
      ${renderWatercolorFloret(115, 405, 1.1, 10, p)}
      ${renderWatercolorFloret(95, 535, 1.0, 45, p)}

      <!-- Mid-lower extension of left arm -->
      ${renderRealisticCoverBranch(75, 530, 260, -4, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderRealisticCoverOlive(65, 570, 230, 6, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderRealisticCoverSprig(58, 650, 115, -2, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderWatercolorRoseSide(80, 680, 0.82, -35, 'r1', p, themeKey)}
      ${renderGoldTwig(45, 660, 180, -2, p)}
      ${renderWatercolorBud(50, 735, 0.75, -10, 'r2', p, themeKey)}
      ${renderWatercolorFloret(105, 630, 0.95, -20, p)}

      <!-- Bottom tail reaching Y: 980 -->
      ${renderRealisticCoverBranch(60, 710, 270, -2, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderRealisticCoverOlive(55, 750, 230, 4, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderRealisticCoverSprig(48, 830, 110, 0, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderGoldTwig(40, 810, 150, 0, p)}
      ${renderWatercolorFloret(80, 830, 0.9, 15, p)}
      ${renderWatercolorBud(45, 910, 0.75, 5, 'r1', p, themeKey)}
      ${renderWatercolorFloret(55, 955, 0.8, -10, p)}

      <!-- ============================================================== -->
      <!-- 3. CORNER CENTERPIECE (Grand Majestic Watercolor Blooms)       -->
      <!-- ============================================================== -->
      <!-- Lush diagonal botanical backing -->
      ${renderRealisticCoverBranch(200, 200, 220, 42, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderRealisticCoverOlive(220, 220, 200, 48, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
      ${renderRealisticCoverSprig(240, 230, 130, 45, `cov-leaf-hl-${themeKey}`, `cov-leaf-sh-${themeKey}`, p.stem)}
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

// ---------------------------------------------------------------------------
// 3b. PETITE BOTANICAL CORNER BOUQUET (LUSH CORNER ACCENTS FOR TR AND BL)
// ---------------------------------------------------------------------------
function renderPetiteBranch(cx, cy, len, rot, p, themeKey) {
  return `
    <g transform="translate(${cx}, ${cy}) rotate(${rot})">
      <path d="M 0,0 Q 15,${-len * 0.45} 5,${-len}" fill="none" stroke="${p.stem}" stroke-width="1.8" stroke-linecap="round"/>
      <g transform="translate(8, ${-len * 0.25}) rotate(38) scale(0.65)">
        <path d="M 0,0 C -8,-15 -14,-32 0,-44 C 14,-32 8,-15 0,0 Z" fill="url(#cov-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
      </g>
      <g transform="translate(-5, ${-len * 0.45}) rotate(-35) scale(0.65)">
        <path d="M 0,0 C -8,-15 -14,-32 0,-44 C 14,-32 8,-15 0,0 Z" fill="url(#cov-leaf-sh-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
      </g>
      <g transform="translate(10, ${-len * 0.68}) rotate(32) scale(0.60)">
        <path d="M 0,0 C -8,-15 -14,-32 0,-44 C 14,-32 8,-15 0,0 Z" fill="url(#cov-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
      </g>
      <g transform="translate(-4, ${-len * 0.85}) rotate(-28) scale(0.55)">
        <path d="M 0,0 C -8,-15 -14,-32 0,-44 C 14,-32 8,-15 0,0 Z" fill="url(#cov-leaf-sh-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
      </g>
      <g transform="translate(5, ${-len}) scale(0.50)">
        <path d="M 0,0 C -8,-15 -14,-32 0,-44 C 14,-32 8,-15 0,0 Z" fill="url(#cov-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
      </g>
    </g>
  `;
}

function getCoverPetiteCornerSvg(themeKey = 'verdant_vow', corner = 'tr') {
  const p = getAestheticCoverPalette(themeKey);

  const innerContent = `
    <!-- Foliage Branch extending Horizontally (towards center top) -->
    ${renderPetiteBranch(280, 28, 170, -96, p, themeKey)}
    ${renderPetiteBranch(230, 22, 110, -92, p, themeKey)}
    ${renderGoldTwig(275, 20, 135, -94, p)}

    <!-- Foliage Branch extending Vertically (down right margin) -->
    ${renderPetiteBranch(325, 75, 170, 4, p, themeKey)}
    ${renderPetiteBranch(328, 125, 110, 8, p, themeKey)}
    ${renderGoldTwig(330, 70, 135, 6, p)}

    <!-- Diagonal leaves backing the rose -->
    <g transform="translate(290, 55) rotate(-45) scale(0.7)">
      <path d="M 0,0 C -8,-15 -14,-34 0,-48 C 14,-34 8,-15 0,0 Z" fill="url(#cov-leaf-hl-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
    </g>
    <g transform="translate(305, 70) rotate(135) scale(0.65)">
      <path d="M 0,0 C -8,-15 -14,-34 0,-48 C 14,-34 8,-15 0,0 Z" fill="url(#cov-leaf-sh-${themeKey})" stroke="${p.stem}" stroke-width="0.4"/>
    </g>

    <!-- Companion Rosebuds -->
    ${renderWatercolorBud(205, 34, 0.65, -82, 'r1', p, themeKey)}
    ${renderWatercolorBud(320, 150, 0.65, 18, 'r2', p, themeKey)}

    <!-- Companion Side Rose -->
    ${renderWatercolorRoseSide(255, 70, 0.65, -35, 'r2', p, themeKey)}

    <!-- Main Blooming Watercolor Rose in Corner -->
    ${renderWatercolorGardenRose(295, 52, 0.78, -12, 'r1', p, themeKey)}

    <!-- Delicate Starry White Jasmine Florets with Gold Centers -->
    ${renderWatercolorFloret(285, 16, 0.85, 15, p)}
    ${renderWatercolorFloret(335, 50, 0.80, -25, p)}
    ${renderWatercolorFloret(245, 92, 0.75, 35, p)}
    ${renderWatercolorFloret(282, 105, 0.70, -10, p)}

    <!-- Gold Stardust Beads -->
    <circle cx="135" cy="24" r="2.2" fill="${p.goldAccent}"/>
    <circle cx="328" cy="225" r="2.2" fill="${p.goldAccent}"/>
    <circle cx="210" cy="18" r="1.8" fill="${p.goldLeaf}"/>
    <circle cx="334" cy="155" r="1.8" fill="${p.goldLeaf}"/>
  `;

  const wrapTransform = corner === 'bl' 
    ? 'transform="translate(350, 350) scale(-1, -1)"' 
    : '';

  return `
  <svg width="350" height="350" viewBox="0 0 350 350" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Rose Gradients -->
      <radialGradient id="cov-r1-outer-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="60%" stop-color="${p.roseOuter1}"/>
        <stop offset="100%" stop-color="${p.roseOuter2}"/>
      </radialGradient>
      <radialGradient id="cov-r1-mid-${themeKey}" cx="42%" cy="42%" r="65%">
        <stop offset="0%" stop-color="${p.roseOuter2}"/>
        <stop offset="60%" stop-color="${p.roseMid1}"/>
        <stop offset="100%" stop-color="${p.roseMid2}"/>
      </radialGradient>
      <radialGradient id="cov-r1-inner-${themeKey}" cx="40%" cy="40%" r="65%">
        <stop offset="0%" stop-color="${p.roseMid2}"/>
        <stop offset="70%" stop-color="${p.roseDeep1}"/>
        <stop offset="100%" stop-color="${p.roseDeep2}"/>
      </radialGradient>

      <radialGradient id="cov-r2-outer-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="65%" stop-color="${p.roseOuter1}"/>
        <stop offset="100%" stop-color="${p.roseOuter2}"/>
      </radialGradient>
      <radialGradient id="cov-r2-mid-${themeKey}" cx="42%" cy="42%" r="65%">
        <stop offset="0%" stop-color="${p.roseOuter1}"/>
        <stop offset="60%" stop-color="${p.roseOuter2}"/>
        <stop offset="100%" stop-color="${p.roseMid1}"/>
      </radialGradient>
      <radialGradient id="cov-r2-inner-${themeKey}" cx="40%" cy="40%" r="65%">
        <stop offset="0%" stop-color="${p.roseMid1}"/>
        <stop offset="70%" stop-color="${p.roseDeep1}"/>
        <stop offset="100%" stop-color="${p.roseDeep2}"/>
      </radialGradient>

      <!-- Leaf Gradients -->
      <linearGradient id="cov-leaf-hl-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafHl}"/>
        <stop offset="60%" stop-color="${p.leafMid}"/>
        <stop offset="100%" stop-color="${p.leafDeep}"/>
      </linearGradient>
      <linearGradient id="cov-leaf-sh-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafMid}"/>
        <stop offset="70%" stop-color="${p.leafDeep}"/>
        <stop offset="100%" stop-color="${p.leafShadow}"/>
      </linearGradient>
    </defs>

    <g ${wrapTransform}>
      ${innerContent}
    </g>
  </svg>
  `;
}

// 4. GOLD FACETED POLYGON WREATH (EXACT REFERENCE 1 DESIGN)
function getReferenceGeometricWreathSvg(themeKey = 'puspa_jawi') {
  const p = getThemePalette(themeKey);

  // Elongated Faceted Polygon Vertices (matching Reference 1 aspect ratio: slightly taller than wide)
  // Polygon dimensions: center at (400, 400), width ~560, height ~640
  const outerPoly = "400,80 570,145 660,320 650,545 525,690 380,720 230,645 145,465 155,250 265,115";
  const innerPoly = "395,102 552,162 638,325 628,535 512,670 382,698 245,630 168,462 176,262 274,134";
  const accentPoly = "412,92 578,155 668,312 655,532 532,678 388,708 238,638 152,472 164,258 278,124";

  return `
  <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ref-leaf-hl-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafHl1}"/>
        <stop offset="60%" stop-color="${p.leafHl2}"/>
        <stop offset="100%" stop-color="${p.leafSh1}"/>
      </linearGradient>
      <linearGradient id="ref-leaf-sh-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafSh1}"/>
        <stop offset="70%" stop-color="${p.leafSh2}"/>
        <stop offset="100%" stop-color="${p.stemColor}"/>
      </linearGradient>
      <linearGradient id="gold-wire-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.goldLight || '#e5c97b'}"/>
        <stop offset="50%" stop-color="${p.goldColor}"/>
        <stop offset="100%" stop-color="${p.goldLight || '#e5c97b'}"/>
      </linearGradient>
    </defs>

    <!-- 1. Geometric Faceted Wireframe Lines (Reference 1 Feature) -->
    <!-- Primary Bold Gold Polygon -->
    <polygon points="${outerPoly}" fill="none" stroke="url(#gold-wire-grad)" stroke-width="2.6" stroke-linejoin="round"/>
    <!-- Secondary Intersecting Fine Gold Polygon -->
    <polygon points="${innerPoly}" fill="none" stroke="${p.goldLight || '#e5c97b'}" stroke-width="1.3" stroke-linejoin="round"/>
    <!-- Third Delicate Accent Facet -->
    <polygon points="${accentPoly}" fill="none" stroke="${p.goldColor}" stroke-width="0.8" opacity="0.55" stroke-linejoin="round"/>

    <!-- Faceted Vertex Beads -->
    <circle cx="400" cy="80" r="2.8" fill="${p.goldColor}"/>
    <circle cx="570" cy="145" r="2.4" fill="${p.goldColor}"/>
    <circle cx="660" cy="320" r="2.4" fill="${p.goldColor}"/>
    <circle cx="650" cy="545" r="2.4" fill="${p.goldColor}"/>
    <circle cx="525" cy="690" r="2.8" fill="${p.goldColor}"/>
    <circle cx="230" cy="645" r="2.4" fill="${p.goldColor}"/>
    <circle cx="145" cy="465" r="2.4" fill="${p.goldColor}"/>
    <circle cx="265" cy="115" r="2.8" fill="${p.goldColor}"/>

    <!-- 2. TOP-LEFT BOTANICAL CLUSTER (Arching along the gold polygon) -->
    ${renderCurvedOliveSpray(p, themeKey, true)}

    <!-- 3. BOTTOM-RIGHT BOTANICAL CLUSTER (Arching along the gold polygon) -->
    ${renderCurvedOliveSpray(p, themeKey, false)}

    <!-- 4. Floating Gold Stardust Particles (Reference 1) -->
    <circle cx="360" cy="60" r="2.4" fill="${p.goldColor}"/>
    <circle cx="260" cy="75" r="1.8" fill="${p.goldColor}"/>
    <circle cx="160" cy="130" r="2.2" fill="${p.goldColor}"/>
    <circle cx="670" cy="370" r="2.2" fill="${p.goldColor}"/>
    <circle cx="600" cy="660" r="2.4" fill="${p.goldColor}"/>
    <circle cx="430" cy="735" r="1.8" fill="${p.goldColor}"/>
    <!-- Micro Starlets -->
    <path d="M 310,55 Q 310,60 315,60 Q 310,60 310,65 Q 310,60 305,60 Q 310,60 310,55" fill="${p.goldColor}"/>
    <path d="M 650,390 Q 650,395 655,395 Q 650,395 650,400 Q 650,395 645,395 Q 650,395 650,390" fill="${p.goldColor}"/>
    <path d="M 125,270 Q 125,274 129,274 Q 125,274 125,278 Q 125,274 121,274 Q 125,274 125,270" fill="${p.goldColor}"/>
  </svg>
  `;
}

// 5. BOTTOM CORNER GEOMETRIC CRYSTAL & FLORAL ACCENTS (EXACT REFERENCE 1 BOTTOM CORNERS)
function getReferenceBottomCornersSvg(themeKey = 'puspa_jawi') {
  const p = getThemePalette(themeKey);

  // Multi-layered realistic watercolor rose petals (Reference 1 feature on bottom-left)
  function renderCornerRose(cx, cy, r) {
    let s = `<g transform="translate(${cx}, ${cy})">`;
    const layers = [
      { count: 7, rad: r * 0.88, rx: r * 0.44, ry: r * 0.32, rotStep: 51.4 },
      { count: 6, rad: r * 0.62, rx: r * 0.38, ry: r * 0.26, rotStep: 60 },
      { count: 5, rad: r * 0.38, rx: r * 0.28, ry: r * 0.20, rotStep: 72 },
    ];
    for (const l of layers) {
      for (let i = 0; i < l.count; i++) {
        const a = (i * l.rotStep) * (Math.PI / 180);
        const px = l.rad * Math.cos(a);
        const py = l.rad * Math.sin(a);
        s += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="${l.rx.toFixed(1)}" ry="${l.ry.toFixed(1)}" transform="rotate(${((i * l.rotStep) + 90).toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)})" fill="url(#rose-velvet-grad)" stroke="${p.rosePrimaryDeep}" stroke-width="0.5"/>`;
      }
    }
    // Rose center
    const cR = r * 0.26;
    s += `<ellipse cx="0" cy="0" rx="${cR.toFixed(1)}" ry="${(cR * 0.75).toFixed(1)}" fill="${p.rosePrimaryDeep}"/>`;
    s += `<path d="M ${(-cR * 0.5).toFixed(1)},0 C ${(-cR * 0.2).toFixed(1)},${(-cR * 0.6).toFixed(1)} ${(cR * 0.4).toFixed(1)},${(-cR * 0.4).toFixed(1)} ${(cR * 0.5).toFixed(1)},0" fill="none" stroke="${p.goldColor}" stroke-width="0.9"/>`;
    s += `</g>`;
    return s;
  }

  return `
  <svg width="800" height="260" viewBox="0 0 800 260" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ref-leaf-hl-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafHl1}"/>
        <stop offset="60%" stop-color="${p.leafHl2}"/>
        <stop offset="100%" stop-color="${p.leafSh1}"/>
      </linearGradient>
      <linearGradient id="ref-leaf-sh-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafSh1}"/>
        <stop offset="70%" stop-color="${p.leafSh2}"/>
        <stop offset="100%" stop-color="${p.stemColor}"/>
      </linearGradient>
      <radialGradient id="rose-velvet-grad" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.rosePrimaryLight}"/>
        <stop offset="55%" stop-color="${p.rosePrimary}"/>
        <stop offset="100%" stop-color="${p.rosePrimaryDeep}"/>
      </radialGradient>
    </defs>

    <!-- ========================================== -->
    <!-- BOTTOM-LEFT: GEOMETRIC CRYSTALS + RED ROSE -->
    <!-- ========================================== -->
    <g transform="translate(10, 20)">
      <!-- Slender Faceted Gold Crystals (Reference 1) -->
      <polygon points="65,165 40,90 75,25 95,115" fill="none" stroke="${p.goldColor}" stroke-width="2.2" stroke-linejoin="round"/>
      <polygon points="65,165 75,25 85,165" fill="none" stroke="${p.goldLight || '#e5c97b'}" stroke-width="1.2" stroke-linejoin="round"/>

      <polygon points="95,165 115,70 140,15 152,120" fill="none" stroke="${p.goldColor}" stroke-width="2.0" stroke-linejoin="round"/>
      <polygon points="95,165 140,15 130,165" fill="none" stroke="${p.goldLight || '#e5c97b'}" stroke-width="1.0" stroke-linejoin="round"/>

      <polygon points="35,165 20,118 45,72 55,148" fill="none" stroke="${p.goldColor}" stroke-width="1.6" stroke-linejoin="round"/>

      <!-- Olive Foliage branches rising behind crystals -->
      ${renderRealisticLeaf(80, 105, 80, 16, 0.22, 32, p, themeKey)}
      ${renderRealisticLeaf(115, 95, 72, 15, -0.18, 52, p, themeKey)}
      ${renderRealisticLeaf(135, 115, 62, 14, 0.20, 72, p, themeKey)}
      ${renderRealisticLeaf(55, 115, 58, 13, -0.22, 15, p, themeKey)}

      <!-- White Florets on Left -->
      ${renderWhiteFloret(105, 70, 10.0, p)}
      ${renderWhiteFloret(155, 92, 9.0, p)}
      ${renderWhiteFloret(60, 92, 9.0, p)}
      ${renderWhiteFloret(125, 42, 8.0, p)}

      <!-- Rich Velvet Red Watercolor Rose (Reference 1 Bottom-Left Feature!) -->
      ${renderCornerRose(5, 135, 46)}

      <!-- Gold stardust -->
      <circle cx="165" cy="75" r="2.2" fill="${p.goldColor}"/>
      <circle cx="130" cy="35" r="1.8" fill="${p.goldColor}"/>
    </g>

    <!-- ============================================== -->
    <!-- BOTTOM-RIGHT: GEOMETRIC CRYSTALS + LUSH FOLIAGE -->
    <!-- ============================================== -->
    <g transform="translate(620, 20)">
      <!-- Slender Faceted Gold Crystals (Reference 1) -->
      <polygon points="95,165 120,90 85,25 65,115" fill="none" stroke="${p.goldColor}" stroke-width="2.2" stroke-linejoin="round"/>
      <polygon points="95,165 85,25 75,165" fill="none" stroke="${p.goldLight || '#e5c97b'}" stroke-width="1.2" stroke-linejoin="round"/>

      <polygon points="65,165 45,70 20,15 8,120" fill="none" stroke="${p.goldColor}" stroke-width="2.0" stroke-linejoin="round"/>
      <polygon points="65,165 20,15 30,165" fill="none" stroke="${p.goldLight || '#e5c97b'}" stroke-width="1.0" stroke-linejoin="round"/>

      <polygon points="125,165 140,118 115,72 105,148" fill="none" stroke="${p.goldColor}" stroke-width="1.6" stroke-linejoin="round"/>

      <!-- Olive Foliage branches rising behind crystals -->
      ${renderRealisticLeaf(80, 105, 80, 16, -0.22, -32, p, themeKey)}
      ${renderRealisticLeaf(45, 95, 72, 15, 0.18, -52, p, themeKey)}
      ${renderRealisticLeaf(25, 115, 62, 14, -0.20, -72, p, themeKey)}
      ${renderRealisticLeaf(105, 115, 58, 13, 0.22, -15, p, themeKey)}

      <!-- White Florets on Right -->
      ${renderWhiteFloret(55, 70, 10.0, p)}
      ${renderWhiteFloret(5, 92, 9.0, p)}
      ${renderWhiteFloret(100, 92, 9.0, p)}
      ${renderWhiteFloret(35, 42, 8.0, p)}

      <!-- Gold stardust -->
      <circle cx="-5" cy="75" r="2.2" fill="${p.goldColor}"/>
      <circle cx="30" cy="35" r="1.8" fill="${p.goldColor}"/>
    </g>
  </svg>
  `;
}

// 7. REFINED BOTTOM VINE GARLAND
function getBottomVineGarlandSvg(themeKey = 'puspa_jawi') {
  const p = getThemePalette(themeKey);

  return `
  <svg width="800" height="180" viewBox="0 0 800 180" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="rp-grad-vine-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.rosePrimaryLight}"/>
        <stop offset="60%" stop-color="${p.rosePrimary}"/>
        <stop offset="100%" stop-color="${p.rosePrimaryDeep}"/>
      </radialGradient>
      <radialGradient id="rp-mid-vine-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.rosePrimaryLight}"/>
        <stop offset="70%" stop-color="${p.rosePrimary}"/>
        <stop offset="100%" stop-color="${p.rosePrimaryDeep}"/>
      </radialGradient>
      <radialGradient id="an-grad-vine-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="65%" stop-color="${p.ivoryPetal}"/>
        <stop offset="100%" stop-color="${p.ivoryShadow}"/>
      </radialGradient>
      <linearGradient id="leaf-hl-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafHl1}"/>
        <stop offset="60%" stop-color="${p.leafHl2}"/>
        <stop offset="100%" stop-color="${p.leafSh1}"/>
      </linearGradient>
      <linearGradient id="leaf-sh-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafSh1}"/>
        <stop offset="70%" stop-color="${p.leafSh2}"/>
        <stop offset="100%" stop-color="${p.stemColor}"/>
      </linearGradient>
    </defs>

    ${renderWillowBranch(340, 90, 190, -90, p, themeKey)}
    ${renderEucalyptusSpray(350, 95, 140, -80, p, themeKey)}
    ${renderLeafTrio(270, 92, 85, -85, p, themeKey)}

    ${renderWillowBranch(460, 90, 190, 90, p, themeKey)}
    ${renderEucalyptusSpray(450, 95, 140, 80, p, themeKey)}
    ${renderLeafTrio(530, 92, 85, 85, p, themeKey)}

    ${renderRoseBud(145, 90, 13, -90, p)}
    ${renderRoseBud(655, 90, 13, 90, p)}

    ${renderMasterRose(400, 90, 48, p, themeKey, 'vine', true)}
    ${renderCherryFloret(340, 90, 12, p)}
    ${renderCherryFloret(460, 90, 12, p)}
    ${renderCherryFloret(250, 90, 10, p)}
    ${renderCherryFloret(550, 90, 10, p)}
  </svg>
  `;
}

// 7. REFINED HEADER FINIAL
function getHeaderFinialSvg(themeKey = 'puspa_jawi') {
  const p = getThemePalette(themeKey);

  return `
  <svg width="800" height="180" viewBox="0 0 800 180" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="rp-grad-finial-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.rosePrimaryLight}"/>
        <stop offset="60%" stop-color="${p.rosePrimary}"/>
        <stop offset="100%" stop-color="${p.rosePrimaryDeep}"/>
      </radialGradient>
      <radialGradient id="rp-mid-finial-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.rosePrimaryLight}"/>
        <stop offset="70%" stop-color="${p.rosePrimary}"/>
        <stop offset="100%" stop-color="${p.rosePrimaryDeep}"/>
      </radialGradient>
      <radialGradient id="an-grad-finial-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="65%" stop-color="${p.ivoryPetal}"/>
        <stop offset="100%" stop-color="${p.ivoryShadow}"/>
      </radialGradient>
      <linearGradient id="leaf-hl-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafHl1}"/>
        <stop offset="60%" stop-color="${p.leafHl2}"/>
        <stop offset="100%" stop-color="${p.leafSh1}"/>
      </linearGradient>
      <linearGradient id="leaf-sh-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafSh1}"/>
        <stop offset="70%" stop-color="${p.leafSh2}"/>
        <stop offset="100%" stop-color="${p.stemColor}"/>
      </linearGradient>
    </defs>

    ${renderWillowBranch(340, 85, 180, -88, p, themeKey)}
    ${renderEucalyptusSpray(350, 90, 140, -78, p, themeKey)}
    ${renderWillowBranch(460, 85, 180, 88, p, themeKey)}
    ${renderEucalyptusSpray(450, 90, 140, 78, p, themeKey)}

    ${renderMasterAnemone(400, 85, 44, p, themeKey, 'finial', false)}
    ${renderCherryFloret(335, 85, 12, p)}
    ${renderCherryFloret(465, 85, 12, p)}
  </svg>
  `;
}

// 8. REFINED GARDEN SPRIG
function getGardenSprigSvg(themeKey = 'puspa_jawi', corner = 'bl') {
  const p = getThemePalette(themeKey);
  const rotMap = { bl: 0, br: 90, tr: 180, tl: 270 };
  const deg = rotMap[corner] || 0;

  return `
  <svg width="500" height="500" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="rp-grad-garden-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.rosePrimaryLight}"/>
        <stop offset="60%" stop-color="${p.rosePrimary}"/>
        <stop offset="100%" stop-color="${p.rosePrimaryDeep}"/>
      </radialGradient>
      <radialGradient id="rp-mid-garden-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.rosePrimaryLight}"/>
        <stop offset="70%" stop-color="${p.rosePrimary}"/>
        <stop offset="100%" stop-color="${p.rosePrimaryDeep}"/>
      </radialGradient>
      <radialGradient id="an-grad-garden-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="65%" stop-color="${p.ivoryPetal}"/>
        <stop offset="100%" stop-color="${p.ivoryShadow}"/>
      </radialGradient>
      <linearGradient id="leaf-hl-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafHl1}"/>
        <stop offset="60%" stop-color="${p.leafHl2}"/>
        <stop offset="100%" stop-color="${p.leafSh1}"/>
      </linearGradient>
      <linearGradient id="leaf-sh-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafSh1}"/>
        <stop offset="70%" stop-color="${p.leafSh2}"/>
        <stop offset="100%" stop-color="${p.stemColor}"/>
      </linearGradient>
    </defs>

    <g transform="rotate(${deg} 250 250)">
      ${renderWillowBranch(160, 360, 220, 10, p, themeKey)}
      ${renderEucalyptusSpray(180, 340, 170, 95, p, themeKey)}
      ${renderLeafTrio(150, 340, 110, 25, p, themeKey)}

      ${renderRoseBud(120, 280, 14, -15, p)}

      ${renderMasterRose(160, 350, 52, p, themeKey, 'garden', true)}
      ${renderMasterAnemone(220, 360, 42, p, themeKey, 'garden', false)}

      ${renderCherryFloret(110, 370, 12, p)}
      ${renderCherryFloret(200, 300, 12, p)}
    </g>
  </svg>
  `;
}

// 9. REFINED PETITE SPRIG
function getPetiteSprigSvg(themeKey = 'puspa_jawi', corner = 'tl') {
  const p = getThemePalette(themeKey);
  const rotMap = { tl: 0, tr: 90, br: 180, bl: 270 };
  const deg = rotMap[corner] || 0;

  return `
  <svg width="360" height="360" viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="rp-grad-petite-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.rosePrimaryLight}"/>
        <stop offset="60%" stop-color="${p.rosePrimary}"/>
        <stop offset="100%" stop-color="${p.rosePrimaryDeep}"/>
      </radialGradient>
      <radialGradient id="rp-mid-petite-${themeKey}" cx="45%" cy="45%" r="65%">
        <stop offset="0%" stop-color="${p.rosePrimaryLight}"/>
        <stop offset="70%" stop-color="${p.rosePrimary}"/>
        <stop offset="100%" stop-color="${p.rosePrimaryDeep}"/>
      </radialGradient>
      <linearGradient id="leaf-hl-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafHl1}"/>
        <stop offset="60%" stop-color="${p.leafHl2}"/>
        <stop offset="100%" stop-color="${p.leafSh1}"/>
      </linearGradient>
      <linearGradient id="leaf-sh-${themeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.leafSh1}"/>
        <stop offset="70%" stop-color="${p.leafSh2}"/>
        <stop offset="100%" stop-color="${p.stemColor}"/>
      </linearGradient>
    </defs>

    <g transform="rotate(${deg} 180 180)">
      ${renderWillowBranch(130, 130, 150, 100, p, themeKey)}
      ${renderLeafTrio(130, 130, 95, 18, p, themeKey)}
      ${renderMasterRose(130, 130, 42, p, themeKey, 'petite', true)}
      ${renderCherryFloret(180, 140, 11, p)}
      ${renderCherryFloret(120, 190, 11, p)}
    </g>
  </svg>
  `;
}

const floralPngCache = new Map();

async function renderSvgToPngDataUrl(svgString, width = 600, height = 600) {
  if (typeof document === 'undefined') {
    try {
      const sharpMod = 'sharp';
      const sharp = (await import(/* @vite-ignore */ sharpMod)).default;
      const buf = await sharp(Buffer.from(svgString)).png().toBuffer();
      return `data:image/png;base64,${buf.toString('base64')}`;
    } catch {
      return null;
    }
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(blobURL);
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(blobURL);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          URL.revokeObjectURL(blobURL);
          resolve(null);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(blobURL);
        resolve(null);
      };
      img.src = blobURL;
    } catch {
      resolve(null);
    }
  });
}

async function getOrMakeFloralPng(key, svgGenerator, width = 600, height = 600) {
  if (!floralPngCache.has(key)) {
    floralPngCache.set(key, await renderSvgToPngDataUrl(svgGenerator(), width, height));
  }
  return floralPngCache.get(key);
}

let sofiaFontPromise;

function bytesToBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return window.btoa(binary);
}

async function registerSofiaFont(pdf) {
  try {
    if (typeof window === 'undefined') {
      const fsMod = 'node:fs';
      const pathMod = 'node:path';
      const fs = await import(/* @vite-ignore */ fsMod);
      const path = await import(/* @vite-ignore */ pathMod);
      const fontBuffer = fs.readFileSync(path.resolve('public/assets/fonts/Sofia-Regular.ttf'));
      pdf.addFileToVFS('Sofia-Regular.ttf', fontBuffer.toString('base64'));
      pdf.addFont('Sofia-Regular.ttf', 'Sofia', 'normal');
      return 'Sofia';
    }
    sofiaFontPromise ||= fetch('/assets/fonts/Sofia-Regular.ttf').then(async (response) => {
      if (!response.ok) throw new Error('Font Sofia tidak tersedia.');
      return bytesToBase64(new Uint8Array(await response.arrayBuffer()));
    });
    pdf.addFileToVFS('Sofia-Regular.ttf', await sofiaFontPromise);
    pdf.addFont('Sofia-Regular.ttf', 'Sofia', 'normal');
    return 'Sofia';
  } catch {
    return 'times';
  }
}

function formatDate(value) {
  if (!value) return 'Tanggal menyusul';
  const date = new Date(`${value}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return safeText(value);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatDatePill(value) {
  if (!value) return 'TANGGAL MENYUSUL';
  const date = new Date(`${value}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return safeText(value).toUpperCase();
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date).toUpperCase();
}

function formatTime(start, end) {
  const clean = (value) => String(value || '').slice(0, 5).replace(':', '.');
  const from = clean(start);
  const to = clean(end);
  if (from && to) return `Pukul ${from} - ${to} WIB`;
  if (from) return `Pukul ${from} WIB`;
  return 'Waktu menyusul';
}

function centeredWrappedText(pdf, text, y, maxWidth, lineHeight = 5.5, maxLines = Infinity, targetCenterX = null) {
  const centerX = targetCenterX != null ? targetCenterX : pdf.internal.pageSize.getWidth() / 2;
  const wrapped = pdf.splitTextToSize(safeText(text), maxWidth);
  const lines = wrapped.slice(0, maxLines);
  if (wrapped.length > maxLines && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.,;:]?$/, '')}...`;
  }
  pdf.text(lines, centerX, y, { align: 'center', lineHeightFactor: lineHeight / 4.4 });
  return y + (lines.length * lineHeight);
}

function centeredTrackedText(pdf, text, centerX, y, tracking = 2) {
  const characters = [...safeText(text, '')];
  const glyphWidth = characters.reduce((total, character) => total + pdf.getTextWidth(character), 0);
  const totalWidth = glyphWidth + Math.max(0, characters.length - 1) * tracking;
  let cursorX = centerX - totalWidth / 2;
  characters.forEach((character) => {
    pdf.text(character, cursorX, y);
    cursorX += pdf.getTextWidth(character) + tracking;
  });
}

function fitCenteredText(pdf, text, y, { maxWidth = 160, maxSize = 36, minSize = 16, font = 'times', style = 'bold', color } = {}) {
  const actualStyle = font === 'Sofia' ? 'normal' : style;
  pdf.setFont(font, actualStyle);
  let size = maxSize;
  pdf.setFontSize(size);
  while (size > minSize && pdf.getTextWidth(safeText(text)) > maxWidth) {
    size -= 0.5;
    pdf.setFontSize(size);
  }
  if (color) pdf.setTextColor(...color);
  pdf.text(safeText(text), pdf.internal.pageSize.getWidth() / 2, y, { align: 'center' });
}

/* ==========================================================================
   PAGE BASE & LUXURY CORNER FLOURISHES
   ========================================================================== */

function drawCornerFlourish(pdf, theme, x, y, dirX, dirY, style = 'diamond') {
  pdf.setDrawColor(...theme.gold);
  pdf.setLineWidth(0.3);

  // Delicate corner bracket hugging the frame
  pdf.line(x, y + (dirY * 11), x, y);
  pdf.line(x, y, x + (dirX * 11), y);

  pdf.setFillColor(...theme.gold);
  if (style === 'pearl') {
    pdf.circle(x + (dirX * 4.2), y + (dirY * 4.2), 0.9, 'F');
    pdf.circle(x + (dirX * 7.5), y + (dirY * 7.5), 0.55, 'F');
  } else if (style === 'leaf') {
    pdf.ellipse(x + (dirX * 4.2), y + (dirY * 4.2), 1.6, 0.85, 'F');
    pdf.circle(x + (dirX * 7.2), y + (dirY * 7.2), 0.5, 'F');
  } else {
    // Tiny corner faceted diamond
    pdf.lines([[0.8, 0], [0, 0.8], [-0.8, 0], [0, -0.8]], x + (dirX * 3.5), y + (dirY * 3.5), [1, 1], 'F', true);
    // Micro gold pearl
    pdf.circle(x + (dirX * 6.5), y + (dirY * 6.5), 0.65, 'F');
  }
}

function drawOrnateDivider(pdf, theme, centerX, y, width = 48) {
  const halfW = width / 2;
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.24);
  pdf.line(centerX - halfW, y, centerX - 7, y);
  pdf.line(centerX + 7, y, centerX + halfW, y);

  // Center faceted diamond
  pdf.setFillColor(...theme.gold);
  pdf.lines([[1.3, 0], [0, 1.3], [-1.3, 0], [0, -1.3]], centerX, y - 1.3, [1, 1], 'F', true);

  // Flanking pearls
  pdf.circle(centerX - 4.2, y, 0.6, 'F');
  pdf.circle(centerX + 4.2, y, 0.6, 'F');
  pdf.circle(centerX - halfW, y, 0.45, 'F');
  pdf.circle(centerX + halfW, y, 0.45, 'F');
}

function drawGoldSparkle(pdf, theme, x, y, size = 1.4) {
  pdf.setFillColor(...theme.gold);
  pdf.lines([[size, 0], [0, size], [-size, 0], [0, -size]], x, y - size, [1, 1], 'F', true);
  pdf.circle(x - (size * 1.3), y, 0.35, 'F');
  pdf.circle(x + (size * 1.3), y, 0.35, 'F');
  pdf.circle(x, y - (size * 1.3), 0.35, 'F');
  pdf.circle(x, y + (size * 1.3), 0.35, 'F');
}

function drawModernPageBase(pdf, theme, pageWidth, pageHeight, pageBgPng = null, frameStyle = 'frame', flourishStyle = 'diamond') {
  // 1. Luxury paper base
  pdf.setFillColor(...theme.paper);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Vibrant Watercolor Gradient Background tailored to page
  if (pageBgPng) {
    try {
      pdf.addImage(pageBgPng, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }

  // 2. Double Concentric Luxury Gold Frames (Only when frameStyle === 'frame')
  if (frameStyle === 'frame') {
    const outerInset = 9.5;
    pdf.setDrawColor(...theme.gold);
    pdf.setLineWidth(0.34);
    pdf.roundedRect(outerInset, outerInset, pageWidth - (outerInset * 2), pageHeight - (outerInset * 2), 4, 4, 'S');

    const innerInset = 12.5;
    pdf.setDrawColor(...theme.goldLight);
    pdf.setLineWidth(0.20);
    pdf.roundedRect(innerInset, innerInset, pageWidth - (innerInset * 2), pageHeight - (innerInset * 2), 2.5, 2.5, 'S');

    // 3. Corner fine gold brackets & decorative accents
    drawCornerFlourish(pdf, theme, innerInset, innerInset, 1, 1, flourishStyle);
    drawCornerFlourish(pdf, theme, pageWidth - innerInset, innerInset, -1, 1, flourishStyle);
    drawCornerFlourish(pdf, theme, innerInset, pageHeight - innerInset, 1, -1, flourishStyle);
    drawCornerFlourish(pdf, theme, pageWidth - innerInset, pageHeight - innerInset, -1, -1, flourishStyle);
  }
}

/* ==========================================================================
   GEOMETRIC HEXAGON MONOGRAM CREST & WEDDING RINGS (REFERENCE 2)
   ========================================================================== */

function drawGeometricMonogram(pdf, theme, centerX, centerY, radius, groomInitial, brideInitial, decorativeFont, hexagonWreathPng) {
  // Outer Pointy-Top Hexagon Frame
  pdf.setDrawColor(...theme.gold);
  pdf.setLineWidth(0.38);
  const p1 = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i + (Math.PI / 6);
    p1.push([centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle)]);
  }
  for (let i = 0; i < 6; i += 1) {
    const next = (i + 1) % 6;
    pdf.line(p1[i][0], p1[i][1], p1[next][0], p1[next][1]);
  }

  // Intersecting Rotated Secondary Hexagon Frame
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.22);
  const r2 = radius * 0.94;
  const p2 = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i + (Math.PI / 12);
    p2.push([centerX + r2 * Math.cos(angle), centerY + r2 * Math.sin(angle)]);
  }
  for (let i = 0; i < 6; i += 1) {
    const next = (i + 1) % 6;
    pdf.line(p2[i][0], p2[i][1], p2[next][0], p2[next][1]);
  }

  // Botanical Foliage & Flower Wreath wrapping the right side of the hexagon
  if (hexagonWreathPng) {
    try {
      pdf.addImage(hexagonWreathPng, 'PNG', centerX + 8, centerY - 19, 22, 38, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }

  // Intertwined Gold Wedding Rings in Center-Top of Crest
  pdf.setDrawColor(...theme.gold);
  pdf.setLineWidth(0.36);
  pdf.circle(centerX - 2.8, centerY - 6.2, 3.0, 'S');
  pdf.circle(centerX + 2.8, centerY - 6.2, 3.0, 'S');

  // Sparkling Faceted Diamond on top of the right ring
  pdf.setFillColor(...theme.gold);
  pdf.lines([[0.6, 0], [0, 0.8], [-0.6, 0], [0, -0.8]], centerX + 2.8, centerY - 9.3, [1, 1], 'F', true);

  // Couple's Royal Monogram Initials ("B & A")
  pdf.setTextColor(...theme.gold);
  pdf.setFont(decorativeFont, decorativeFont === 'Sofia' ? 'normal' : 'bolditalic');
  pdf.setFontSize(27);
  pdf.text(`${groomInitial} & ${brideInitial}`, centerX, centerY + 7.0, { align: 'center' });
}

function drawDateCapsule(pdf, theme, centerX, y, dateStr) {
  const fullDate = formatDate(dateStr);
  const label = (fullDate && fullDate !== 'Tanggal menyusul' ? fullDate : formatDatePill(dateStr)).toUpperCase();
  const pillW = Math.max(90, Math.min(130, label.length * 3.4 + 20));
  const pillH = 11.5;
  const pillX = centerX - (pillW / 2);

  // Solid Capsule Background with theme pill color
  pdf.setFillColor(...theme.capsuleBg);
  pdf.roundedRect(pillX, y, pillW, pillH, 5.75, 5.75, 'F');

  // Fine Gold Hairline Rim
  pdf.setDrawColor(...theme.gold);
  pdf.setLineWidth(0.26);
  pdf.roundedRect(pillX, y, pillW, pillH, 5.75, 5.75, 'S');

  // Flanking Gold Pearls
  pdf.setFillColor(255, 255, 255);
  pdf.circle(pillX + 4.8, y + (pillH / 2), 0.65, 'F');
  pdf.circle(pillX + pillW - 4.8, y + (pillH / 2), 0.65, 'F');

  // Date Text
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11.0);
  centeredTrackedText(pdf, label, centerX, y + 7.8, 1.2);
}

function drawRecipientPlaque(pdf, theme, centerX, y, guestName) {
  const boxW = 120;
  const boxH = 48;
  const boxX = centerX - (boxW / 2);
  const boxY = y;

  // 1. Pure Crisp White Royal Card
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...theme.gold);
  pdf.setLineWidth(0.36);
  pdf.roundedRect(boxX, boxY, boxW, boxH, 5, 5, 'FD');

  // 2. Inner Concentric Gold Hairline Frame
  const innerInset = 2.4;
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.18);
  pdf.roundedRect(boxX + innerInset, boxY + innerInset, boxW - (innerInset * 2), boxH - (innerInset * 2), 3.5, 3.5, 'S');

  // Inner corner micro gold pearls
  pdf.setFillColor(...theme.gold);
  pdf.circle(boxX + innerInset + 3.2, boxY + innerInset + 3.2, 0.55, 'F');
  pdf.circle(boxX + boxW - innerInset - 3.2, boxY + innerInset + 3.2, 0.55, 'F');
  pdf.circle(boxX + innerInset + 3.2, boxY + boxH - innerInset - 3.2, 0.55, 'F');
  pdf.circle(boxX + boxW - innerInset - 3.2, boxY + boxH - innerInset - 3.2, 0.55, 'F');

  // 3. Header: KEPADA YTH.
  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.8);
  centeredTrackedText(pdf, 'KEPADA YTH.', centerX, boxY + 9.5, 1.8);

  // 4. Subtitle: Bapak / Ibu / Saudara / i :
  pdf.setTextColor(...theme.muted);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(11.0);
  pdf.text('Bapak / Ibu / Saudara / i :', centerX, boxY + 16.0, { align: 'center' });

  // 5. Delicate Gold Hairline Divider
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.20);
  pdf.line(centerX - 32, boxY + 19.5, centerX + 32, boxY + 19.5);

  // 6. Guest Name or Elegant Write-In Calligraphy Line
  if (guestName && guestName.trim() && guestName !== '-') {
    fitCenteredText(pdf, guestName, boxY + 29.5, {
      maxWidth: boxW - 20,
      maxSize: 16.5,
      minSize: 11.5,
      font: 'times',
      style: 'bold',
      color: theme.ink,
    });
  } else {
    pdf.setDrawColor(...theme.gold);
    pdf.setLineWidth(0.28);
    pdf.line(boxX + 22, boxY + 29.5, boxX + boxW - 22, boxY + 29.5);
    // Center diamond flourish on the line
    pdf.setFillColor(...theme.gold);
    pdf.lines([[1.1, 0], [0, 1.1], [-1.1, 0], [0, -1.1]], centerX, boxY + 28.4, [1, 1], 'F', true);
  }

  // 7. Courtesy Note at bottom of the card
  pdf.setTextColor(...theme.muted);
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8.6);
  pdf.text('Mohon maaf apabila ada kesalahan dalam penulisan nama & gelar', centerX, boxY + boxH - 5.5, { align: 'center' });
}

/* ==========================================================================
   DUAL EVENT CAPSULES (AKAD NIKAH & RESEPSI) (REFERENCE 1)
   ========================================================================== */

function drawDualEventCapsules(pdf, theme, centerX, y, akadTitle, akadTime, receptionTitle, receptionTime) {
  const capW = 78;
  const capH = 21;
  const gap = 12;

  const leftX = centerX - capW - (gap / 2);
  const rightX = centerX + (gap / 2);

  // Left Capsule (Akad Nikah)
  pdf.setFillColor(...theme.capsuleBg);
  pdf.roundedRect(leftX, y, capW, capH, 10.5, 10.5, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12.0);
  centeredTrackedText(pdf, akadTitle.toUpperCase(), leftX + (capW / 2), y + 7.8, 1.2);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11.0);
  pdf.text(safeText(akadTime), leftX + (capW / 2), y + 15.0, { align: 'center' });

  // Right Capsule (Resepsi)
  pdf.setFillColor(...theme.capsuleBg);
  pdf.roundedRect(rightX, y, capW, capH, 10.5, 10.5, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12.0);
  centeredTrackedText(pdf, receptionTitle.toUpperCase(), rightX + (capW / 2), y + 7.8, 1.2);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11.0);
  pdf.text(safeText(receptionTime), rightX + (capW / 2), y + 15.0, { align: 'center' });

  // Center botanical blossom connecting the two capsules
  pdf.setFillColor(...theme.gold);
  pdf.circle(centerX, y + (capH / 2), 1.8, 'F');
  pdf.setFillColor(...theme.sage);
  pdf.ellipse(centerX - 3.4, y + (capH / 2), 2.4, 1.2, 'F');
  pdf.ellipse(centerX + 3.4, y + (capH / 2), 2.4, 1.2, 'F');
}

function drawModernInfoCard(pdf, theme, title, text, x, y, width, height) {
  // Pure floating white parchment plaque
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.24);
  pdf.roundedRect(x, y, width, height, 5, 5, 'FD');

  // Dynamic fitting so card title never overflows card boundaries
  const maxTitleWidth = width - 16;
  let titleFontSize = 9.5;
  let titleTracking = 0.8;
  pdf.setFont('helvetica', 'bold');

  const calcTrackedWidth = (str, sz, trk) => {
    pdf.setFontSize(sz);
    const chars = [...str];
    const glyphW = chars.reduce((total, c) => total + pdf.getTextWidth(c), 0);
    return glyphW + Math.max(0, chars.length - 1) * trk;
  };

  const titleText = safeText(title, '').toUpperCase();
  while (titleFontSize > 7.0 && calcTrackedWidth(titleText, titleFontSize, titleTracking) > maxTitleWidth) {
    if (titleTracking > 0.4) {
      titleTracking -= 0.1;
    } else {
      titleFontSize -= 0.5;
    }
  }

  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(titleFontSize);
  centeredTrackedText(pdf, titleText, x + (width / 2), y + 10.5, titleTracking);

  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.2);
  pdf.line(x + 12, y + 15.0, x + width - 12, y + 15.0);

  pdf.setTextColor(...theme.ink);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11.0);
  const lines = pdf.splitTextToSize(safeText(text, 'Informasi menyusul.'), width - 18).slice(0, 5);
  pdf.text(lines, x + 9, y + 23.5, { lineHeightFactor: 1.35 });
}

function drawModernRouteMap(pdf, theme, invitation, x, y, width, height) {
  // Pure floating white parchment plaque
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.26);
  pdf.roundedRect(x, y, width, height, 6, 6, 'FD');

  const startX = x + 24;
  const startY = y + 26;
  const endX = x + width - 26;
  const endY = y + height - 26;
  const hasLandmark = Boolean(invitation.nearest_landmark && invitation.nearest_landmark.trim());

  // Gold Route Path
  pdf.setDrawColor(...theme.gold);
  pdf.setLineWidth(1.4);
  pdf.setLineCap('round');
  pdf.setLineJoin('round');

  const turnX = x + (width * 0.44);
  pdf.line(startX, startY, turnX, startY);
  pdf.line(turnX, startY, turnX, endY);
  pdf.line(turnX, endY, endX, endY);

  // Direction Arrows
  pdf.setFillColor(...theme.gold);
  pdf.lines([[2, 0], [0, 2], [-2, 0], [0, -2]], startX + 22, startY, [1, 1], 'F', true);
  pdf.lines([[0, 2], [2, 0], [0, -2], [-2, 0]], turnX, (startY + endY) / 2, [1, 1], 'F', true);
  pdf.lines([[2, 0], [0, 2], [-2, 0], [0, -2]], turnX + 24, endY, [1, 1], 'F', true);

  // Start Pin (Landmark)
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...theme.gold);
  pdf.setLineWidth(0.8);
  pdf.circle(startX, startY, 4.5, 'FD');
  pdf.setFillColor(...theme.gold);
  pdf.circle(startX, startY, 2.0, 'F');

  // End Pin (Venue)
  pdf.setFillColor(...theme.gold);
  pdf.circle(endX, endY, 5.5, 'F');
  pdf.setFillColor(255, 255, 255);
  pdf.lines([[1.4, 0], [0, 1.6], [-1.4, 0], [0, -1.6]], endX, endY, [1, 1], 'F', true);

  // Start Label
  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11.5);
  pdf.text(hasLandmark ? 'TITIK PATOKAN' : 'TITIK AWAL', startX, startY + 9.5, { align: 'center' });

  pdf.setTextColor(...theme.ink);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10.8);
  const landmarkLines = pdf.splitTextToSize(hasLandmark ? safeText(invitation.nearest_landmark) : 'Buka Maps untuk titik live', 60).slice(0, 2);
  pdf.text(landmarkLines, startX, startY + 15.5, { align: 'center', lineHeightFactor: 1.2 });

  // End Label
  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12.0);
  pdf.text('LOKASI ACARA', endX, endY + 10.5, { align: 'center' });

  pdf.setTextColor(...theme.ink);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11.5);
  const venueLines = pdf.splitTextToSize(safeText(invitation.venue_name, 'Tempat Acara'), 62).slice(0, 2);
  pdf.text(venueLines, endX, endY + 16.5, { align: 'center', lineHeightFactor: 1.2 });
}

/* ==========================================================================
   MAIN EXPORT FUNCTION
   ========================================================================== */

export async function createInvitationPdf({ invitation, templateCode, templateName, orderCode }) {
  const [{ jsPDF }, qrModule] = await Promise.all([import('jspdf'), import('qrcode')]);
  const QRCode = qrModule.default || qrModule;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

  const theme = resolveTheme(templateCode);

  // Pre-load Sofia font, floral watercolor artworks, side sprigs and rich watercolor gradient background in parallel
  const [
    decorativeFont,
    trBouquetPng,
    tlBouquetPng,
    brBouquetPng,
    blBouquetPng,
    leftSprigPng,
    rightSprigPng,
    hexagonWreathPng,
    headerGarlandPng,
    bgPage1Png,
    bgPage2Png,
    bgPage3Png,
    bgPage4Png,
    oliveWreathTrPng,
    oliveWreathBrPng,
    gardenSprigBlPng,
    headerFinialPng,
    bottomVinePng,
    tlPetitePng,
    trPetitePng,
    covTlBouquetPng,
    covBrBouquetPng,
    covCenterFramePng,
    covTrBouquetPng,
    covBlBouquetPng,
  ] = await Promise.all([
    registerSofiaFont(pdf),
    getOrMakeFloralPng(`tr_${theme.key}`, () => getCornerBouquetSvgByCorner(theme.key, 'tr'), 600, 600),
    getOrMakeFloralPng(`tl_${theme.key}`, () => getCornerBouquetSvgByCorner(theme.key, 'tl'), 600, 600),
    getOrMakeFloralPng(`br_${theme.key}`, () => getCornerBouquetSvgByCorner(theme.key, 'br'), 600, 600),
    getOrMakeFloralPng(`bl_${theme.key}`, () => getCornerBouquetSvgByCorner(theme.key, 'bl'), 600, 600),
    getOrMakeFloralPng(`sprig_l_${theme.key}`, () => getSideSprigSvg(theme.key, 'left'), 320, 460),
    getOrMakeFloralPng(`sprig_r_${theme.key}`, () => getSideSprigSvg(theme.key, 'right'), 320, 460),
    getOrMakeFloralPng(`hex_${theme.key}`, () => getHexagonFoliageSvg(theme.key), 260, 420),
    getOrMakeFloralPng(`garland_${theme.key}`, () => getHeaderGarlandSvg(theme.key), 800, 200),
    getOrMakeFloralPng(`bg_p1_v4_${theme.key}`, () => getPageBackgroundSvg(theme.key, 1), 800, 1131),
    getOrMakeFloralPng(`bg_p2_${theme.key}`, () => getPageBackgroundSvg(theme.key, 2), 800, 1131),
    getOrMakeFloralPng(`bg_p3_${theme.key}`, () => getPageBackgroundSvg(theme.key, 3), 800, 1131),
    getOrMakeFloralPng(`bg_p4_${theme.key}`, () => getPageBackgroundSvg(theme.key, 4), 800, 1131),
    getOrMakeFloralPng(`olive_tr_${theme.key}`, () => getOliveWreathCornerSvg(theme.key, 'tr'), 500, 500),
    getOrMakeFloralPng(`olive_br_${theme.key}`, () => getOliveWreathCornerSvg(theme.key, 'br'), 500, 500),
    getOrMakeFloralPng(`garden_bl_${theme.key}`, () => getGardenSprigSvg(theme.key, 'bl'), 500, 500),
    getOrMakeFloralPng(`finial_${theme.key}`, () => getHeaderFinialSvg(theme.key), 800, 180),
    getOrMakeFloralPng(`vine_${theme.key}`, () => getBottomVineGarlandSvg(theme.key), 800, 180),
    getOrMakeFloralPng(`petite_tl_${theme.key}`, () => getPetiteSprigSvg(theme.key, 'tl'), 360, 360),
    getOrMakeFloralPng(`petite_tr_${theme.key}`, () => getPetiteSprigSvg(theme.key, 'tr'), 360, 360),
    getOrMakeFloralPng(`cov_tl_v4_${theme.key}`, () => getCoverCornerBouquetSvg(theme.key, 'tl'), 700, 1000),
    getOrMakeFloralPng(`cov_br_v4_${theme.key}`, () => getCoverCornerBouquetSvg(theme.key, 'br'), 700, 1000),
    getOrMakeFloralPng(`cov_center_frame_v4_${theme.key}`, () => getCenterFloralFrameSvg(theme.key), 520, 360),
    getOrMakeFloralPng(`cov_tr_v1_${theme.key}`, () => getCoverPetiteCornerSvg(theme.key, 'tr'), 400, 400),
    getOrMakeFloralPng(`cov_bl_v1_${theme.key}`, () => getCoverPetiteCornerSvg(theme.key, 'bl'), 400, 400),
  ]);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  const groomName = safeText(invitation.groom_nickname || invitation.groom_full_name, 'Mempelai Pria');
  const brideName = safeText(invitation.bride_nickname || invitation.bride_full_name, 'Mempelai Wanita');
  const groomFullName = safeText(invitation.groom_full_name, groomName);
  const brideFullName = safeText(invitation.bride_full_name, brideName);

  const groomInitial = groomName.trim().charAt(0).toUpperCase() || 'B';
  const brideInitial = brideName.trim().charAt(0).toUpperCase() || 'A';

  const mainDate = invitation.reception_date || invitation.akad_date;
  const destination = [invitation.venue_name, invitation.venue_address].map((v) => String(v || '').trim()).filter(Boolean).join(', ');
  const suppliedMapsUrl = /^https?:\/\//i.test(String(invitation.maps_url || '')) ? String(invitation.maps_url).trim() : '';
  const mapsUrl = suppliedMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination || 'Lokasi acara')}`;

  const groomFather = safeText(invitation.groom_father, '...');
  const groomMother = safeText(invitation.groom_mother, '...');
  const brideFather = safeText(invitation.bride_father, '...');
  const brideMother = safeText(invitation.bride_mother, '...');

  const guestName = safeText(invitation.guest_name || invitation.invitee_name, '');

  // ==========================================================================
  // HALAMAN 1: COVER DEPAN (LUSH DIAGONAL BOTANICAL FRAMING - USER REFERENCE)
  // ==========================================================================
  drawModernPageBase(pdf, theme, pageWidth, pageHeight, bgPage1Png, 'none');

  // 1. TOP-LEFT HALF-FRAME ORNAMENT (Cascades across top to 50% width and down left to 50% height)
  const hfWidth = 105; // mm (half of 210mm)
  const hfHeight = 148.5; // mm (half of 297mm)
  if (covTlBouquetPng) {
    try {
      pdf.addImage(covTlBouquetPng, 'PNG', 0, 0, hfWidth, hfHeight, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }

  // 2. BOTTOM-RIGHT HALF-FRAME ORNAMENT (Cascades across bottom to 50% width and up right to 50% height)
  if (covBrBouquetPng) {
    try {
      pdf.addImage(covBrBouquetPng, 'PNG', pageWidth - hfWidth, pageHeight - hfHeight, hfWidth, hfHeight, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }

  // 2b. TOP-RIGHT AND BOTTOM-LEFT MATCHING BOTANICAL CORNER ACCENTS (Lush roses and foliage)
  const cornerBouquetSize = 52; // mm (~25% of width, framing open corners without overcrowding)
  if (covTrBouquetPng) {
    try {
      pdf.addImage(covTrBouquetPng, 'PNG', pageWidth - cornerBouquetSize, 0, cornerBouquetSize, cornerBouquetSize, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }
  if (covBlBouquetPng) {
    try {
      pdf.addImage(covBlBouquetPng, 'PNG', 0, pageHeight - cornerBouquetSize, cornerBouquetSize, cornerBouquetSize, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }

  // Floating Stardust Gold Sparkles in Background
  drawGoldSparkle(pdf, theme, centerX - 58, 42, 1.3);
  drawGoldSparkle(pdf, theme, centerX + 58, 42, 1.3);
  drawGoldSparkle(pdf, theme, centerX - 65, 148, 1.2);
  drawGoldSparkle(pdf, theme, centerX + 65, 148, 1.2);

  // 3. "THE WEDDING" (OUTSIDE & ABOVE THE FRAME)
  pdf.setTextColor(...theme.ink);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  const weddingTracking = 3.5;
  centeredTrackedText(pdf, 'THE WEDDING', centerX, 47, weddingTracking);

  // Full elegant gold underline directly under "THE WEDDING"
  const weddingChars = [...'THE WEDDING'];
  const weddingGlyphW = weddingChars.reduce((total, c) => total + pdf.getTextWidth(c), 0);
  const weddingTotalW = weddingGlyphW + (weddingChars.length - 1) * weddingTracking;
  pdf.setDrawColor(...theme.gold);
  pdf.setLineWidth(0.35);
  pdf.line(centerX - (weddingTotalW / 2), 49.5, centerX + (weddingTotalW / 2), 49.5);

  // 4. SOFT ROUNDED DOUBLE-LINE GILDED FRAME WITH LUSH WATERCOLOR ROSES (NO SHARP CORNERS)
  const frameW = 110;
  const frameH = 76;
  const frameX = centerX - (frameW / 2);
  const frameY = 53;
  if (covCenterFramePng) {
    try {
      pdf.addImage(covCenterFramePng, 'PNG', frameX, frameY, frameW, frameH, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }

  // 5. STACKED COUPLE NAMES (INSIDE THE SOFT FRAME - SPACIOUS & ELEGANT)
  const calcNameFontSize = (name) => {
    const len = (name || '').trim().length;
    if (len > 24) return 18;
    if (len > 18) return 21;
    if (len > 13) return 25;
    return 28;
  };

  // Groom Name (Top inside)
  pdf.setTextColor(...theme.accent);
  pdf.setFont('Sofia', 'normal');
  pdf.setFontSize(calcNameFontSize(groomName));
  pdf.text(groomName, centerX, 79, { align: 'center' });

  // Elegant Ampersand (Middle inside)
  pdf.setTextColor(...theme.gold);
  pdf.setFont('Sofia', 'normal');
  pdf.setFontSize(18);
  pdf.text('&', centerX, 91, { align: 'center' });

  // Bride Name (Bottom inside)
  pdf.setTextColor(...theme.accent);
  pdf.setFont('Sofia', 'normal');
  pdf.setFontSize(calcNameFontSize(brideName));
  pdf.text(brideName, centerX, 106, { align: 'center' });

  // 6. WEDDING DATE (OUTSIDE & BELOW THE FRAME)
  let dateObj = mainDate ? new Date(mainDate) : null;
  if (dateObj && isNaN(dateObj.getTime())) dateObj = null;

  const monthNames = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
  const dayNames = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

  const badgeMonth = dateObj ? monthNames[dateObj.getMonth()] : 'OKTOBER';
  const badgeDay = dateObj ? dayNames[dateObj.getDay()] : 'SABTU';
  const badgeDate = dateObj ? String(dateObj.getDate()) : '31';
  const badgeYear = dateObj ? String(dateObj.getFullYear()) : '2026';
  const formattedDateLine = `${badgeDay}, ${badgeDate} ${badgeMonth} ${badgeYear}`;

  pdf.setTextColor(...theme.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  centeredTrackedText(pdf, formattedDateLine, centerX, 137, 2.0);

  // 7. Recipient Section (User Reference Style)
  pdf.setTextColor(...theme.ink);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.text('Kepada Yth.', centerX, 168, { align: 'center' });

  pdf.setTextColor(...theme.muted);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(9.0);
  pdf.text('Bapak / Ibu / Saudara / i', centerX, 173.5, { align: 'center' });

  // Recipient Box Card (White rounded card with dashed inner border)
  const boxW = 118;
  const boxH = 40;
  const boxX = centerX - (boxW / 2);
  const boxY = 179;

  // White base
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...theme.gold);
  pdf.setLineWidth(0.35);
  pdf.roundedRect(boxX, boxY, boxW, boxH, 4, 4, 'FD');

  // Inner dashed fine hairline
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.2);
  pdf.setLineDashPattern([1.5, 1.5], 0);
  pdf.roundedRect(boxX + 2, boxY + 2, boxW - 4, boxH - 4, 3, 3, 'S');
  pdf.setLineDashPattern([], 0); // reset dash

  // Guest name inside (rendered only if explicitly provided, otherwise left blank for handwriting)
  if (guestName) {
    pdf.setTextColor(...theme.ink);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11.5);
    pdf.text(guestName, centerX, boxY + 21, { align: 'center' });
  }

  // Fine print note below card in crimson red (signature Reference feature!)
  pdf.setTextColor(192, 57, 43);
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(7.5);
  pdf.text('Mohon maaf apabila ada kesalahan dalam penulisan nama / gelar', centerX, boxY + boxH + 6.5, { align: 'center' });

  // ==========================================================================
  // HALAMAN 2: ISI UNDANGAN UTAMA (REFERENCE 1 STYLE - OPEN & BOTANICAL)
  // ==========================================================================
  pdf.addPage();
  drawModernPageBase(pdf, theme, pageWidth, pageHeight, bgPage2Png, 'none');

  // Full Corner Bouquets (Lush framing matching Reference 1)
  if (tlBouquetPng) {
    try {
      pdf.addImage(tlBouquetPng, 'PNG', 0, 0, 50, 50, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }
  if (trBouquetPng) {
    try {
      pdf.addImage(trBouquetPng, 'PNG', pageWidth - 50, 0, 50, 50, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }

  // Top Garland Arch bridging the top bouquets
  if (headerGarlandPng) {
    try {
      pdf.addImage(headerGarlandPng, 'PNG', centerX - 42, 6, 84, 20, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }

  // Side Floral Sprigs blooming in beside the couple's names (Exact Reference Image 1 feature!)
  if (leftSprigPng) {
    try {
      pdf.addImage(leftSprigPng, 'PNG', 0, 92, 26, 36, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }
  if (rightSprigPng) {
    try {
      pdf.addImage(rightSprigPng, 'PNG', pageWidth - 26, 92, 26, 36, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }

  // Bottom Corner Bouquets (Lush & Symmetrical)
  if (blBouquetPng) {
    try {
      pdf.addImage(blBouquetPng, 'PNG', 0, pageHeight - 52, 52, 52, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }
  if (brBouquetPng) {
    try {
      pdf.addImage(brBouquetPng, 'PNG', pageWidth - 52, pageHeight - 52, 52, 52, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }

  // Gold Sparkles flanking Top Garland
  drawGoldSparkle(pdf, theme, centerX - 56, 35, 1.3);
  drawGoldSparkle(pdf, theme, centerX + 56, 35, 1.3);

  // 1. Gold Bismillah Calligraphy
  drawBismillah(pdf, theme, centerX, 36, 62, 13);

  // 2. Opening Greeting & Formal Invitation
  pdf.setTextColor(...theme.accent);
  pdf.setFont('times', 'bolditalic');
  pdf.setFontSize(14.5);
  pdf.text("Assalamu'alaikum Warahmatullahi Wabarakatuh", centerX, 51, { align: 'center' });

  pdf.setTextColor(...theme.muted);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11.2);
  centeredWrappedText(
    pdf,
    'Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada pernikahan putra dan putri kami:',
    59,
    152,
    5.8,
    3,
  );

  // 3. Groom Name & Parentage
  fitCenteredText(pdf, groomFullName, 82, {
    maxWidth: 165,
    maxSize: 36,
    minSize: 24,
    font: decorativeFont,
    style: decorativeFont === 'Sofia' ? 'normal' : 'italic',
    color: theme.accent,
  });

  pdf.setTextColor(...theme.muted);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11.2);
  const groomParentLabel = `Putra dari Bapak ${groomFather} & Ibu ${groomMother}`;
  pdf.text(groomParentLabel, centerX, 91, { align: 'center' });

  // Ampersand
  pdf.setTextColor(...theme.gold);
  pdf.setFont(decorativeFont, decorativeFont === 'Sofia' ? 'normal' : 'italic');
  pdf.setFontSize(26);
  pdf.text('&', centerX, 102, { align: 'center' });

  // 4. Bride Name & Parentage
  fitCenteredText(pdf, brideFullName, 116, {
    maxWidth: 165,
    maxSize: 36,
    minSize: 24,
    font: decorativeFont,
    style: decorativeFont === 'Sofia' ? 'normal' : 'italic',
    color: theme.accent,
  });

  pdf.setTextColor(...theme.muted);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11.2);
  const brideParentLabel = `Putri dari Bapak ${brideFather} & Ibu ${brideMother}`;
  pdf.text(brideParentLabel, centerX, 125, { align: 'center' });

  // Ornate Divider below names
  drawOrnateDivider(pdf, theme, centerX, 132, 50);

  // 5. Schedule Lead & Big Date
  pdf.setTextColor(...theme.muted);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(12.0);
  pdf.text('Yang Insya Allah akan dilaksanakan pada :', centerX, 139, { align: 'center' });

  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(18.0);
  pdf.text(formatDate(mainDate), centerX, 149, { align: 'center' });

  // 6. Dual Side-by-Side Capsules (Akad Nikah & Resepsi)
  const akadTimeStr = formatTime(invitation.akad_start_time, invitation.akad_end_time);
  const receptionTimeStr = formatTime(invitation.reception_start_time, invitation.reception_end_time);
  drawDualEventCapsules(pdf, theme, centerX, 156, 'Akad Nikah', akadTimeStr, 'Resepsi', receptionTimeStr);

  // 7. Venue Location
  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11.5);
  centeredTrackedText(pdf, 'BERTEMPAT DI :', centerX, 186, 1.5);

  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(15.5);
  pdf.text(safeText(invitation.venue_name, 'Lokasi Acara'), centerX, 195, { align: 'center' });

  pdf.setTextColor(...theme.muted);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11.2);
  centeredWrappedText(pdf, safeText(invitation.venue_address, 'Alamat lengkap lokasi acara'), 202, 148, 5.6, 2);

  // Ornate Divider between Address and Closing
  drawOrnateDivider(pdf, theme, centerX, 216, 46);

  // 8. Closing Courtesy Note & Signatures
  pdf.setTextColor(...theme.muted);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11.0);
  centeredWrappedText(
    pdf,
    'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada kedua mempelai.',
    224,
    152,
    5.5,
    2,
  );

  pdf.setTextColor(...theme.accent);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(12.0);
  pdf.text('Hormat kami yang berbahagia,', centerX, 242, { align: 'center' });

  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(14.5);
  pdf.text('Keluarga Besar Kedua Mempelai', centerX, 250, { align: 'center' });

  // ==========================================================================
  // HALAMAN 3: UNGKAPAN DOA, KISAH & KELUARGA TURUT MENGUNDANG (OPEN & ILLUMINATED)
  // ==========================================================================
  pdf.addPage();
  drawModernPageBase(pdf, theme, pageWidth, pageHeight, bgPage3Png, 'none');

  // Distinct Floral & Olive Accents for Page 3 (hugging corners, leaving center clear)
  if (oliveWreathTrPng) {
    try {
      pdf.addImage(oliveWreathTrPng, 'PNG', pageWidth - 40, 0, 40, 40, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }
  if (tlPetitePng) {
    try {
      pdf.addImage(tlPetitePng, 'PNG', 0, 0, 28, 28, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }
  if (gardenSprigBlPng) {
    try {
      pdf.addImage(gardenSprigBlPng, 'PNG', 0, pageHeight - 52, 52, 52, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }
  if (oliveWreathBrPng) {
    try {
      pdf.addImage(oliveWreathBrPng, 'PNG', pageWidth - 42, pageHeight - 42, 42, 42, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }

  // Floating Stardust Sparkles flanking title
  drawGoldSparkle(pdf, theme, 44, 33, 1.4);
  drawGoldSparkle(pdf, theme, pageWidth - 44, 33, 1.4);

  // Heading (Constrained width to guarantee generous clearance from corner wreath)
  fitCenteredText(pdf, 'Ungkapan Doa & Rangkaian Kasih', 33, {
    maxWidth: 130,
    maxSize: 26,
    minSize: 18,
    font: decorativeFont,
    style: decorativeFont === 'Sofia' ? 'normal' : 'italic',
    color: theme.accent,
  });

  // Delicate Ornate Divider below heading
  drawOrnateDivider(pdf, theme, centerX, 40, 48);

  // Quranic Ayat Plaque (Ar-Rum: 21) - Pure White Floating Parchment
  const quranY = 46;
  const quranH = 52;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.24);
  pdf.roundedRect(18, quranY, pageWidth - 36, quranH, 6, 6, 'FD');

  pdf.setTextColor(...theme.gold);
  pdf.setFont('times', 'bolditalic');
  pdf.setFontSize(13.0);
  pdf.text('QS. Ar-Rum : 21', centerX, quranY + 11.0, { align: 'center' });

  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(11.8);
  centeredWrappedText(
    pdf,
    '"Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan untukmu pasangan-pasangan dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang."',
    quranY + 20.5,
    pageWidth - 48,
    5.8,
    4,
  );

  // Love Story / Kisah Perjalanan Plaque (if present) - Pure White Floating Parchment
  let nextY = quranY + quranH + 11;
  const loveStory = safeText(invitation.love_story, '');
  if (loveStory && loveStory !== '-') {
    const storyH = 50;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(...theme.goldLight);
    pdf.setLineWidth(0.24);
    pdf.roundedRect(18, nextY, pageWidth - 36, storyH, 6, 6, 'FD');

    pdf.setTextColor(...theme.accent);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12.0);
    centeredTrackedText(pdf, 'SATU KISAH SATU TUJUAN', centerX, nextY + 11, 1.4);

    pdf.setTextColor(...theme.muted);
    pdf.setFont('times', 'italic');
    pdf.setFontSize(11.2);
    centeredWrappedText(pdf, loveStory, nextY + 20, pageWidth - 52, 5.6, 4);

    nextY += storyH + 11;
  }

  // Turut Mengundang Section - Pure White Floating Parchment
  const familyTurut = safeText(invitation.family_turut_mengundang, '');
  const familyBoxH = 76;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.24);
  pdf.roundedRect(18, nextY, pageWidth - 36, familyBoxH, 6, 6, 'FD');

  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13.0);
  centeredTrackedText(pdf, 'TURUT MENGUNDANG', centerX, nextY + 12, 2.0);

  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.2);
  pdf.line(centerX - 35, nextY + 16.5, centerX + 35, nextY + 16.5);

  pdf.setTextColor(...theme.ink);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11.2);

  const defaultFamilyList = [
    `1. Keluarga Besar Bapak ${groomFather} & Ibu ${groomMother}`,
    `2. Keluarga Besar Bapak ${brideFather} & Ibu ${brideMother}`,
    '3. Segenap Sahabat, Rekan Kerja, dan Kerabat Kedua Mempelai',
  ];
  const listToRender = familyTurut && familyTurut !== '-' ? familyTurut.split('\n').filter(Boolean) : defaultFamilyList;
  const slicedList = listToRender.slice(0, 6);
  let curY = nextY + 25.5;
  slicedList.forEach((line) => {
    pdf.text(cleanPdfText(line), centerX, curY, { align: 'center' });
    curY += 7.2;
  });

  // ==========================================================================
  // HALAMAN 4: PETUNJUK LOKASI, PETA RUTE & KODE QR GOOGLE MAPS (OPEN & MODERN)
  // ==========================================================================
  pdf.addPage();
  drawModernPageBase(pdf, theme, pageWidth, pageHeight, bgPage4Png, 'none');

  // Distinct Header Laurel Finial Crowning Title
  if (headerFinialPng) {
    try {
      pdf.addImage(headerFinialPng, 'PNG', centerX - 36, 12, 72, 16, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }

  // Top Corner Accents (delicate & airy)
  if (tlPetitePng) {
    try {
      pdf.addImage(tlPetitePng, 'PNG', 0, 0, 24, 24, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }
  if (trPetitePng) {
    try {
      pdf.addImage(trPetitePng, 'PNG', pageWidth - 24, 0, 24, 24, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }

  // Floating Stardust Sparkles flanking title
  drawGoldSparkle(pdf, theme, 42, 33, 1.4);
  drawGoldSparkle(pdf, theme, pageWidth - 42, 33, 1.4);

  // Heading
  fitCenteredText(pdf, 'Petunjuk Arah & Peta Lokasi', 33, {
    maxWidth: 135,
    maxSize: 26,
    minSize: 18,
    font: decorativeFont,
    style: decorativeFont === 'Sofia' ? 'normal' : 'italic',
    color: theme.accent,
  });

  // Delicate Ornate Divider below heading
  drawOrnateDivider(pdf, theme, centerX, 39, 48);

  pdf.setTextColor(...theme.muted);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(11.5);
  pdf.text('Scan kode QR atau klik tombol untuk navigasi langsung Google Maps', centerX, 44.5, { align: 'center' });

  // Modern Route Map Scheme (Pure White Floating Parchment)
  const mapX = 18;
  const mapY = 48;
  const mapW = pageWidth - 36;
  const mapH = 72;
  drawModernRouteMap(pdf, theme, invitation, mapX, mapY, mapW, mapH);

  // Two Side-by-Side Information Cards (Pure White Floating Parchment)
  const travelCardW = (mapW - 10) / 2;
  const travelCardY = mapY + mapH + 7;
  const travelCardH = 48;

  drawModernInfoCard(
    pdf,
    theme,
    'Titik Patokan Terdekat',
    invitation.route_directions || invitation.nearest_landmark || 'Lokasi gedung mudah dijangkau dari pusat kota. Gunakan petunjuk jalan dan landmark terdekat untuk memudahkan pencarian titik acara.',
    mapX,
    travelCardY,
    travelCardW,
    travelCardH,
  );

  drawModernInfoCard(
    pdf,
    theme,
    'Akses & Parkir',
    invitation.transportation_guide || 'Lokasi menyediakan area parkir untuk kendaraan roda dua maupun roda empat. Tamu yang menggunakan transportasi umum atau taksi online dapat langsung diarahkan ke lobi utama.',
    mapX + travelCardW + 10,
    travelCardY,
    travelCardW,
    travelCardH,
  );

  // Google Maps QR Section Plaque (Pure White Floating Parchment)
  const qrCardY = travelCardY + travelCardH + 7;
  const qrCardH = 56;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.26);
  pdf.roundedRect(mapX, qrCardY, mapW, qrCardH, 6, 6, 'FD');

  if (mapsUrl) {
    try {
      const qrData = await QRCode.toDataURL(mapsUrl, {
        width: 450,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: `#${theme.ink.map((c) => c.toString(16).padStart(2, '0')).join('')}`,
          light: '#ffffff',
        },
      });

      const qrSize = 40;
      const qrX = mapX + 10;
      const qrY = qrCardY + 8;

      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(...theme.goldLight);
      pdf.setLineWidth(0.24);
      pdf.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 3, 3, 'FD');

      pdf.addImage(qrData, 'PNG', qrX, qrY, qrSize, qrSize, undefined, 'FAST');

      const contentX = qrX + qrSize + 10;
      const contentW = mapW - (contentX - mapX) - 10;
      const rightColCenterX = contentX + (contentW / 2);

      pdf.setTextColor(...theme.gold);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11.0);
      centeredTrackedText(pdf, 'PINDAI KODE QR GOOGLE MAPS', rightColCenterX, qrCardY + 14, 0.8);

      pdf.setTextColor(...theme.muted);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10.8);
      centeredWrappedText(
        pdf,
        'Arahkan kamera smartphone ke kode QR ini untuk membuka rute Google Maps secara instan menuju lokasi acara.',
        qrCardY + 22.5,
        contentW - 4,
        5.2,
        2,
        rightColCenterX,
      );

      // Interactive Clickable Button
      const btnW = 72;
      const btnH = 11.5;
      const btnX = rightColCenterX - (btnW / 2);
      const btnY = qrCardY + 36.5;

      pdf.setFillColor(...theme.gold);
      pdf.roundedRect(btnX, btnY, btnW, btnH, 4, 4, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11.2);
      pdf.text('Buka Google Maps >', rightColCenterX, btnY + 7.5, { align: 'center' });

      pdf.link(btnX, btnY, btnW, btnH, { url: mapsUrl });
    } catch {
      pdf.setTextColor(...theme.ink);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11.0);
      centeredWrappedText(pdf, mapsUrl, qrCardY + 22, mapW - 20, 5.5, 3);
    }
  }

  // Botanical Vine Garland winding in the spacious bottom margin!
  if (bottomVinePng) {
    try {
      pdf.addImage(bottomVinePng, 'PNG', centerX - 65, pageHeight - 31, 130, 29, undefined, 'FAST');
    } catch {
      // Graceful fallback
    }
  }

  const fileBase = `${groomName}-${brideName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || safeText(orderCode, 'undangan');
  return { pdf, fileName: `undangan-${fileBase}-cetak.pdf` };
}

export async function downloadInvitationPdf(options) {
  const { pdf, fileName } = await createInvitationPdf(options);
  pdf.save(fileName);
}
