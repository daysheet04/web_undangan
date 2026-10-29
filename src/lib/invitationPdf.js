import { jsPDF } from 'jspdf';

/* ==========================================================================
   THEME PALETTES & STYLES (LUXURY WEDDING STATIONERY)
   ========================================================================== */

export const THEMES = {
  java_vibes: {
    key: 'java_vibes',
    name: 'Java Vibes',
    paper: [254, 252, 246],
    paperCard: [248, 244, 233],
    ink: [26, 24, 22],
    muted: [102, 92, 84],
    gold: [194, 150, 62],
    goldLight: [230, 208, 156],
    border: [214, 186, 134],
    style: 'jawi',
  },
  puspa_jawi: {
    key: 'puspa_jawi',
    name: 'Java Vibes',
    paper: [254, 252, 246],          // Royal Ivory Silk
    paperCard: [248, 244, 233],      // Warm Sand Plaque
    ink: [26, 24, 22],              // Deep Heritage Charcoal Black
    muted: [102, 92, 84],           // Warm Umber Slate
    gold: [194, 150, 62],           // Antique Royal Javanese Gold
    goldLight: [230, 208, 156],     // Whisper Gold Hairline
    border: [214, 186, 134],        // Fine Royal Frame
    style: 'jawi',
  },
  lunara_azure: {
    key: 'lunara_azure',
    name: 'Lunara Azure',
    paper: [251, 253, 255],          // Soft Porcelain Mist
    paperCard: [243, 247, 252],      // Pale Azure Plaque
    ink: [16, 26, 44],              // Deep Midnight Navy Ink
    muted: [88, 104, 126],          // Soft Dusk Slate
    gold: [184, 150, 84],           // Starlight Gold
    goldLight: [204, 220, 238],     // Whisper Azure Hairline
    border: [178, 202, 228],        // Fine Silver-Azure Frame
    style: 'moon',
  },
  verdant_vow: {
    key: 'verdant_vow',
    name: 'Verdant Vow',
    paper: [252, 253, 250],          // Organic Linen Cream
    paperCard: [244, 248, 241],      // Pale Eucalyptus Plaque
    ink: [20, 32, 24],              // Deep Forest Charcoal
    muted: [84, 106, 94],           // Soft Eucalyptus
    gold: [180, 148, 86],           // Olive-Champagne Gold
    goldLight: [202, 222, 196],     // Whisper Sage Hairline
    border: [182, 210, 176],        // Fine Sage Frame
    style: 'botanical',
  },
  aurelia_grande: {
    key: 'aurelia_grande',
    name: 'Aurelia Grande',
    paper: [254, 252, 247],          // Imperial Champagne Ivory
    paperCard: [249, 244, 235],      // Soft Champagne Plaque
    ink: [30, 24, 20],              // Deep Bronze Espresso
    muted: [106, 92, 82],           // Warm Truffle
    gold: [198, 154, 72],           // Venetian Imperial Ballroom Gold
    goldLight: [236, 216, 170],     // Whisper Champagne Hairline
    border: [222, 194, 146],        // Fine Royal Gold Frame
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

const safeText = (value, fallback = '-') => String(value || '').trim() || fallback;

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

function formatTime(start, end) {
  const clean = (value) => String(value || '').slice(0, 5).replace(':', '.');
  const from = clean(start);
  const to = clean(end);
  if (from && to) return `Pukul ${from} - ${to} WIB`;
  if (from) return `Pukul ${from} WIB`;
  return 'Waktu menyusul';
}

function centeredWrappedText(pdf, text, y, maxWidth, lineHeight = 6, maxLines = Infinity) {
  const wrapped = pdf.splitTextToSize(safeText(text), maxWidth);
  const lines = wrapped.slice(0, maxLines);
  if (wrapped.length > maxLines && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.,;:]?$/, '')}...`;
  }
  pdf.text(lines, pdf.internal.pageSize.getWidth() / 2, y, { align: 'center', lineHeightFactor: lineHeight / 4.4 });
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
   BESPOKE LUXURY ORNAMENTS & ROYAL FRAMES
   ========================================================================== */

function drawLuxuryDivider(pdf, theme, centerX, y, width = 64) {
  const half = width / 2;
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.28);

  // Twin hairlines with tapered feel
  pdf.line(centerX - half, y, centerX - 7, y);
  pdf.line(centerX + 7, y, centerX + half, y);

  // Center 4-point faceted diamond
  pdf.setFillColor(...theme.gold);
  pdf.lines([[1.6, 0], [0, 2.0], [-1.6, 0], [0, -2.0]], centerX, y, [1, 1], 'F', true);

  // Flanking micro-pearls
  pdf.circle(centerX - 11, y, 0.5, 'F');
  pdf.circle(centerX + 11, y, 0.5, 'F');
}

function drawRoyalMonogramSeal(pdf, theme, centerX, y, initials, decorativeFont) {
  // Outer fine gold ring
  pdf.setDrawColor(...theme.gold);
  pdf.setLineWidth(0.32);
  pdf.circle(centerX, y, 14.5, 'S');

  // Inner whisper ring
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.2);
  pdf.circle(centerX, y, 13.2, 'S');

  // Botanical laurel branches curving on left & right
  pdf.setFillColor(...theme.gold);
  [-1, 1].forEach((dir) => {
    const angles = [-40, -18, 4, 26, 48];
    angles.forEach((deg) => {
      const rad = (deg * Math.PI) / 180;
      const lx = centerX + (dir * (14.5 * Math.cos(rad) + 0.8));
      const ly = y + (14.5 * Math.sin(rad));
      pdf.ellipse(lx, ly, 1.4, 0.7, 'F');
    });
  });

  // Top tiara / crownlet
  pdf.lines([[2.2, 0], [0, 2.6], [-2.2, 0], [0, -2.6]], centerX, y - 17.5, [1, 1], 'F', true);
  pdf.circle(centerX - 3.4, y - 16.5, 0.5, 'F');
  pdf.circle(centerX + 3.4, y - 16.5, 0.5, 'F');

  // Bottom delicate ribbon tie
  pdf.circle(centerX, y + 15.5, 0.8, 'F');
  pdf.ellipse(centerX - 3.2, y + 16.2, 2.2, 0.7, 'F');
  pdf.ellipse(centerX + 3.2, y + 16.2, 2.2, 0.7, 'F');

  // Monogram initials in center
  pdf.setTextColor(...theme.ink);
  pdf.setFont(decorativeFont, decorativeFont === 'Sofia' ? 'normal' : 'bold');
  pdf.setFontSize(16.5);
  pdf.text(initials, centerX, y + 5.2, { align: 'center' });
}

function drawCornerFlourish(pdf, theme, x, y, dx, dy) {
  pdf.setDrawColor(...theme.gold);
  pdf.setLineWidth(0.3);
  pdf.setFillColor(...theme.gold);

  // Stepped L-bracket
  pdf.line(x + (dx * 2), y, x + (dx * 12), y);
  pdf.line(x, y + (dy * 2), x, y + (dy * 12));

  // Corner faceted starlet at 4mm inside corner
  pdf.lines([[0.9, 0], [0, 0.9], [-0.9, 0], [0, -0.9]], x + (dx * 4), y + (dy * 4), [1, 1], 'F', true);

  // Micro pearl accents along the bracket
  pdf.circle(x + (dx * 8), y + (dy * 2), 0.45, 'F');
  pdf.circle(x + (dx * 2), y + (dy * 8), 0.45, 'F');
}

function drawLuxuryBorder(pdf, theme, pageWidth, pageHeight) {
  // 1. Outer hairline frame (10mm margin)
  const m1 = 10;
  pdf.setDrawColor(...theme.border);
  pdf.setLineWidth(0.32);
  pdf.rect(m1, m1, pageWidth - (m1 * 2), pageHeight - (m1 * 2), 'S');

  // 2. Inner whisper frame (13.5mm margin)
  const m2 = 13.5;
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.2);
  pdf.rect(m2, m2, pageWidth - (m2 * 2), pageHeight - (m2 * 2), 'S');

  // 3. Four regal corner flourishes
  drawCornerFlourish(pdf, theme, m2, m2, 1, 1);
  drawCornerFlourish(pdf, theme, pageWidth - m2, m2, -1, 1);
  drawCornerFlourish(pdf, theme, m2, pageHeight - m2, 1, -1);
  drawCornerFlourish(pdf, theme, pageWidth - m2, pageHeight - m2, -1, -1);
}

function drawModernFooter(pdf, theme, pageWidth, pageHeight, pageNumber, templateName) {
  pdf.setTextColor(...theme.muted);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.2);

  const leftLabel = `DAYMOMENT  •  ${safeText(templateName, theme.name).toUpperCase()}`;
  pdf.text(leftLabel, 18, pageHeight - 12);

  const rightLabel = `HALAMAN ${pageNumber} DARI 4`;
  pdf.text(rightLabel, pageWidth - 18, pageHeight - 12, { align: 'right' });

  // Whisper line above footer
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.2);
  pdf.line(18, pageHeight - 15.5, pageWidth - 18, pageHeight - 15.5);
}

function drawModernPageBase(pdf, theme, pageWidth, pageHeight, pageNumber, templateName) {
  // 1. Luxury paper background
  pdf.setFillColor(...theme.paper);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // 2. Royal luxury framing
  drawLuxuryBorder(pdf, theme, pageWidth, pageHeight);

  // 3. Running footer
  drawModernFooter(pdf, theme, pageWidth, pageHeight, pageNumber, templateName);
}

function drawLuxuryPlaque(pdf, theme, x, y, width, height, radius = 3.5) {
  pdf.setFillColor(...theme.paperCard);
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.26);
  pdf.roundedRect(x, y, width, height, radius, radius, 'FD');

  // Dainty corner points inside plaque
  pdf.setFillColor(...theme.gold);
  pdf.circle(x + 4, y + 4, 0.45, 'F');
  pdf.circle(x + width - 4, y + 4, 0.45, 'F');
  pdf.circle(x + 4, y + height - 4, 0.45, 'F');
  pdf.circle(x + width - 4, y + height - 4, 0.45, 'F');
}

function drawPageHeading(pdf, theme, title, subtitle, y = 30) {
  const centerX = pdf.internal.pageSize.getWidth() / 2;

  // Mini top starlet
  pdf.setFillColor(...theme.gold);
  pdf.lines([[1.4, 0], [0, 1.8], [-1.4, 0], [0, -1.8]], centerX, y - 6, [1, 1], 'F', true);

  // Section title in bold tracked uppercase
  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16.5);
  centeredTrackedText(pdf, title.toUpperCase(), centerX, y, 2.4);

  // Divider
  drawLuxuryDivider(pdf, theme, centerX, y + 5.5, 60);

  // Subtitle
  if (subtitle) {
    pdf.setTextColor(...theme.muted);
    pdf.setFont('times', 'italic');
    pdf.setFontSize(12);
    centeredWrappedText(pdf, subtitle, y + 14, 150, 5.8, 2);
  }
}

function drawArchEventCard(pdf, theme, title, data, x, y, width, height = 64) {
  drawLuxuryPlaque(pdf, theme, x, y, width, height, 4);
  const centerX = x + (width / 2);

  // Header kicker
  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13.5);
  centeredTrackedText(pdf, `✦  ${title.toUpperCase()}  ✦`, centerX, y + 12, 2.0);

  // Fine hairline
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.22);
  pdf.line(centerX - 35, y + 17, centerX + 35, y + 17);

  // Date (Prominent 18pt bold serif)
  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(18);
  pdf.text(formatDate(data.date), centerX, y + 29, { align: 'center' });

  // Time pill badge
  const timeText = formatTime(data.start, data.end);
  const pillWidth = Math.max(76, pdf.getTextWidth(timeText) + 24);
  pdf.setFillColor(...theme.paper);
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.24);
  pdf.roundedRect(centerX - (pillWidth / 2), y + 36, pillWidth, 10, 2.5, 2.5, 'FD');

  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(timeText, centerX, y + 43, { align: 'center' });

  // Venue preview line
  if (data.venue) {
    pdf.setTextColor(...theme.muted);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(safeText(data.venue), centerX, y + 55, { align: 'center' });
  }
}

function drawModernRouteMap(pdf, theme, invitation, x, y, width, height) {
  const hasLandmark = Boolean(String(invitation.nearest_landmark || '').trim());
  const startX = x + 30;
  const startY = y + height - 26;
  const endX = x + width - 32;
  const endY = y + 26;

  // Background map box
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.28);
  pdf.roundedRect(x, y, width, height, 4, 4, 'FD');

  // Compass Rose (North Arrow)
  const compassX = x + width - 16;
  const compassY = y + 14;
  pdf.setFillColor(...theme.gold);
  pdf.lines([[1.5, 3.5], [-1.5, 3.5]], compassX, compassY - 5, [1, 1], 'F', true);
  pdf.setDrawColor(...theme.goldLight);
  pdf.line(compassX, compassY - 5, compassX, compassY + 5);
  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('U', compassX, compassY - 6.5, { align: 'center' });

  // Street corridor (Jalan Utama)
  pdf.setFillColor(...theme.paperCard);
  pdf.rect(x + 10, startY - 4.5, width - 20, 9, 'F');
  pdf.rect(x + (width * 0.44) - 4.5, y + 12, 9, height - 24, 'F');
  pdf.rect(x + (width * 0.44), endY - 4.5, width * 0.5 - 10, 9, 'F');

  // Road labels
  pdf.setTextColor(...theme.muted);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('JL. PROTOKOL UTAMA', x + 16, startY - 6.5);
  pdf.text('JL. MENUJU LOKASI', endX - 12, endY - 6.5, { align: 'right' });

  // Gold Route Path
  pdf.setDrawColor(...theme.gold);
  pdf.setLineWidth(1.5);
  pdf.setLineCap('round');
  pdf.setLineJoin('round');

  const turnX = x + (width * 0.44);
  pdf.line(startX, startY, turnX, startY);
  pdf.line(turnX, startY, turnX, endY);
  pdf.line(turnX, endY, endX, endY);

  // Direction Arrows along route
  pdf.setFillColor(...theme.gold);
  pdf.lines([[2, 0], [0, 2], [-2, 0], [0, -2]], startX + 22, startY, [1, 1], 'F', true);
  pdf.lines([[0, 2], [2, 0], [0, -2], [-2, 0]], turnX, (startY + endY) / 2, [1, 1], 'F', true);
  pdf.lines([[2, 0], [0, 2], [-2, 0], [0, -2]], turnX + 24, endY, [1, 1], 'F', true);

  // Start pin (Landmark / Awal)
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...theme.gold);
  pdf.setLineWidth(0.8);
  pdf.circle(startX, startY, 5, 'FD');
  pdf.setFillColor(...theme.gold);
  pdf.circle(startX, startY, 2.2, 'F');

  // End pin (Venue)
  pdf.setFillColor(...theme.gold);
  pdf.circle(endX, endY, 6, 'F');
  pdf.setFillColor(255, 255, 255);
  pdf.lines([[1.5, 0], [0, 1.8], [-1.5, 0], [0, -1.8]], endX, endY, [1, 1], 'F', true);

  // Start Pin Badge
  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.text(hasLandmark ? 'TITIK PATOKAN' : 'TITIK AWAL', startX, startY + 10, { align: 'center' });

  pdf.setTextColor(...theme.ink);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const landmarkLines = pdf.splitTextToSize(hasLandmark ? safeText(invitation.nearest_landmark) : 'Buka Maps untuk titik live', 62).slice(0, 2);
  pdf.text(landmarkLines, startX, startY + 15.5, { align: 'center', lineHeightFactor: 1.2 });

  // End Pin Badge
  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('★ LOKASI ACARA', endX, endY + 11, { align: 'center' });

  pdf.setTextColor(...theme.ink);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  const venueLines = pdf.splitTextToSize(safeText(invitation.venue_name, 'Tempat Acara'), 64).slice(0, 2);
  pdf.text(venueLines, endX, endY + 16.5, { align: 'center', lineHeightFactor: 1.2 });
}

function drawModernInfoCard(pdf, theme, title, text, x, y, width, height) {
  drawLuxuryPlaque(pdf, theme, x, y, width, height, 3.5);

  // Title kicker
  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  centeredTrackedText(pdf, title.toUpperCase(), x + (width / 2), y + 11.5, 1.6);

  // Hairline
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.2);
  pdf.line(x + 12, y + 16, x + width - 12, y + 16);

  // Content
  pdf.setTextColor(...theme.ink);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10.5);
  const lines = pdf.splitTextToSize(safeText(text, 'Informasi menyusul.'), width - 18).slice(0, 6);
  pdf.text(lines, x + 9, y + 24, { lineHeightFactor: 1.35 });
}

/* ==========================================================================
   MAIN EXPORT FUNCTION
   ========================================================================== */

export async function createInvitationPdf({ invitation, templateCode, templateName, orderCode }) {
  const [{ jsPDF }, qrModule] = await Promise.all([import('jspdf'), import('qrcode')]);
  const QRCode = qrModule.default || qrModule;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

  const decorativeFont = await registerSofiaFont(pdf);
  const theme = resolveTheme(templateCode);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  const groomName = safeText(invitation.groom_nickname || invitation.groom_full_name, 'Mempelai Pria');
  const brideName = safeText(invitation.bride_nickname || invitation.bride_full_name, 'Mempelai Wanita');
  const groomFullName = safeText(invitation.groom_full_name, groomName);
  const brideFullName = safeText(invitation.bride_full_name, brideName);

  // Monogram initials
  const groomInitial = groomName.trim().charAt(0).toUpperCase() || 'P';
  const brideInitial = brideName.trim().charAt(0).toUpperCase() || 'W';
  const monogramInitials = `${groomInitial} & ${brideInitial}`;

  const mainDate = invitation.reception_date || invitation.akad_date;
  const destination = [invitation.venue_name, invitation.venue_address].map((v) => String(v || '').trim()).filter(Boolean).join(', ');
  const suppliedMapsUrl = /^https?:\/\//i.test(String(invitation.maps_url || '')) ? String(invitation.maps_url).trim() : '';
  const mapsUrl = suppliedMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination || 'Lokasi acara')}`;

  const groomFamily = `Keluarga Bapak ${safeText(invitation.groom_father, '...')} & Ibu ${safeText(invitation.groom_mother, '...')}`;
  const brideFamily = `Keluarga Bapak ${safeText(invitation.bride_father, '...')} & Ibu ${safeText(invitation.bride_mother, '...')}`;

  // ==========================================================================
  // HALAMAN 1: THE GRAND ANNOUNCEMENT (COVER & UNDANGAN UTAMA)
  // ==========================================================================
  drawModernPageBase(pdf, theme, pageWidth, pageHeight, 1, templateName);

  // Royal Monogram Crest Seal with Couple's Initials
  drawRoyalMonogramSeal(pdf, theme, centerX, 36, monogramInitials, decorativeFont);

  // Bismillah
  pdf.setTextColor(...theme.gold);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(14.5);
  pdf.text('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', centerX, 59, { align: 'center' });

  // Header Title
  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  centeredTrackedText(pdf, 'UNDANGAN PERNIKAHAN', centerX, 68, 2.6);

  // Divider
  drawLuxuryDivider(pdf, theme, centerX, 73, 62);

  // Opening Salam & Doa (Well-proportioned, 12pt)
  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(12);
  centeredWrappedText(
    pdf,
    'Hamparan kasih Ilahi Rabbi terbentang seraya kami menengadahkan jemari, memohon limpahan rahmat dan karunia-Nya. Dengan penuh rasa syukur, kami mengundang Bapak/Ibu/Saudara/i untuk menyaksikan bersatunya putra-putri kami dalam ikatan suci pernikahan.',
    81,
    148,
    6.0,
    3,
  );

  // Invitation Lead
  pdf.setTextColor(...theme.muted);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(12.5);
  pdf.text('Pernikahan Putra-Putri Tercinta Kami:', centerX, 106, { align: 'center' });

  // Groom Name (Magnificent Hero Calligraphy - 50pt!)
  fitCenteredText(pdf, groomName, 124, {
    maxWidth: 165,
    maxSize: 50,
    minSize: 28,
    font: decorativeFont,
    style: decorativeFont === 'Sofia' ? 'normal' : 'italic',
    color: theme.ink,
  });

  // Ampersand with twin elegant gold hairlines
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.26);
  pdf.line(centerX - 38, 137, centerX - 14, 137);
  pdf.line(centerX + 14, 137, centerX + 38, 137);

  pdf.setTextColor(...theme.gold);
  pdf.setFont(decorativeFont, decorativeFont === 'Sofia' ? 'normal' : 'italic');
  pdf.setFontSize(26);
  pdf.text('&', centerX, 140, { align: 'center' });

  // Bride Name (Magnificent Hero Calligraphy - 50pt!)
  fitCenteredText(pdf, brideName, 160, {
    maxWidth: 165,
    maxSize: 50,
    minSize: 28,
    font: decorativeFont,
    style: decorativeFont === 'Sofia' ? 'normal' : 'italic',
    color: theme.ink,
  });

  // Divider
  drawLuxuryDivider(pdf, theme, centerX, 170, 68);

  // Date & Venue Spotlight Plaque (Grand & Clear)
  const dateCardY = 177;
  const dateCardH = 55;
  drawLuxuryPlaque(pdf, theme, 22, dateCardY, pageWidth - 44, dateCardH, 4);

  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  centeredTrackedText(pdf, '✦  INSYA ALLAH AKAN DISELENGGARAKAN PADA  ✦', centerX, dateCardY + 11.5, 1.8);

  // Main Event Date (Grand 20pt)
  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(20);
  pdf.text(formatDate(mainDate), centerX, dateCardY + 25, { align: 'center' });

  // Venue Name (Bold 15.5pt)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15.5);
  pdf.text(safeText(invitation.venue_name, 'Lokasi Acara'), centerX, dateCardY + 37, { align: 'center' });

  // Venue Address (11.5pt)
  if (invitation.venue_address) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11.5);
    pdf.setTextColor(...theme.muted);
    centeredWrappedText(pdf, invitation.venue_address, dateCardY + 46, 150, 4.8, 1);
  }

  // Dedicated Invitation Recipient Plaque (Kepada Yth)
  const guestPlaqueY = 238;
  const guestPlaqueH = 22;
  const guestPlaqueW = 142;
  const guestPlaqueX = centerX - (guestPlaqueW / 2);
  pdf.setFillColor(...theme.paperCard);
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.24);
  pdf.roundedRect(guestPlaqueX, guestPlaqueY, guestPlaqueW, guestPlaqueH, 2.5, 2.5, 'FD');

  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  centeredTrackedText(pdf, 'KEPADA YTH. BAPAK / IBU / SAUDARA/I :', centerX, guestPlaqueY + 7.5, 1.4);

  pdf.setTextColor(...theme.muted);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(11);
  pdf.text('[ Nama Tamu Undangan ]', centerX, guestPlaqueY + 15, { align: 'center' });

  // Closing Salam & Family
  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(11.5);
  pdf.text("Wassalamu'alaikum Warahmatullahi Wabarakatuh", centerX, 268, { align: 'center' });

  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  centeredTrackedText(pdf, 'KAMI YANG BERBAHAGIA', centerX, 274, 1.6);

  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(12.5);
  pdf.text('Keluarga Besar Kedua Mempelai', centerX, 280, { align: 'center' });

  // ==========================================================================
  // HALAMAN 2: KEDUA MEMPELAI & KELUARGA
  // ==========================================================================
  pdf.addPage('a4', 'portrait');
  drawModernPageBase(pdf, theme, pageWidth, pageHeight, 2, templateName);
  drawPageHeading(pdf, theme, 'Kedua Mempelai', 'Dua hati yang dipertemukan dalam ikatan suci, melangkah bersama dalam kasih Ilahi.', 30);

  // Bismillah & Opening
  pdf.setTextColor(...theme.gold);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(14);
  pdf.text('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', centerX, 45, { align: 'center' });

  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(13);
  pdf.text("Assalamu'alaikum Warahmatullahi Wabarakatuh", centerX, 53, { align: 'center' });

  pdf.setFont('times', 'italic');
  pdf.setFontSize(11.8);
  centeredWrappedText(
    pdf,
    'Dengan memohon rahmat dan ridho Allah Subhanahu Wa Ta\'ala, kami bermaksud menyelenggarakan syukuran pernikahan putra-putri tercinta kami:',
    61,
    150,
    5.6,
    2,
  );

  // Groom Profile
  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11.5);
  centeredTrackedText(pdf, '✦  MEMPELAI PRIA  ✦', centerX, 77, 2.0);

  fitCenteredText(pdf, groomFullName, 91, {
    maxWidth: 160,
    maxSize: 26,
    minSize: 18,
    font: decorativeFont,
    style: decorativeFont === 'Sofia' ? 'normal' : 'bold',
    color: theme.ink,
  });

  pdf.setTextColor(...theme.muted);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(11.5);
  pdf.text('Putra tercinta dari pasangan:', centerX, 99, { align: 'center' });

  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(15);
  pdf.text(`${safeText(invitation.groom_father, 'Bapak ...')} & ${safeText(invitation.groom_mother, 'Ibu ...')}`, centerX, 108, { align: 'center' });

  // Ampersand Divider
  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.24);
  pdf.line(centerX - 35, 117, centerX - 12, 117);
  pdf.line(centerX + 12, 117, centerX + 35, 117);

  pdf.setTextColor(...theme.gold);
  pdf.setFont(decorativeFont, decorativeFont === 'Sofia' ? 'normal' : 'italic');
  pdf.setFontSize(22);
  pdf.text('&', centerX, 119.5, { align: 'center' });

  // Bride Profile
  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11.5);
  centeredTrackedText(pdf, '✦  MEMPELAI WANITA  ✦', centerX, 131, 2.0);

  fitCenteredText(pdf, brideFullName, 145, {
    maxWidth: 160,
    maxSize: 26,
    minSize: 18,
    font: decorativeFont,
    style: decorativeFont === 'Sofia' ? 'normal' : 'bold',
    color: theme.ink,
  });

  pdf.setTextColor(...theme.muted);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(11.5);
  pdf.text('Putri tercinta dari pasangan:', centerX, 153, { align: 'center' });

  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(15);
  pdf.text(`${safeText(invitation.bride_father, 'Bapak ...')} & ${safeText(invitation.bride_mother, 'Ibu ...')}`, centerX, 162, { align: 'center' });

  // Ayat Suci Plaque (QS. Ar-Rum: 21)
  const quranY = 175;
  const quranH = 36;
  drawLuxuryPlaque(pdf, theme, 22, quranY, pageWidth - 44, quranH, 3.5);

  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(11.5);
  centeredWrappedText(
    pdf,
    '“Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan untukmu pasangan-pasangan dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.”',
    quranY + 11,
    148,
    5.6,
    3,
  );

  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.text('(QS. Ar-Rum: 21)', centerX, quranY + 30, { align: 'center' });

  // Turut Mengundang Plaque
  const familyCardY = 218;
  const familyCardH = 54;
  drawLuxuryPlaque(pdf, theme, 22, familyCardY, pageWidth - 44, familyCardH, 4);

  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11.5);
  centeredTrackedText(pdf, 'TURUT MENGUNDANG', centerX, familyCardY + 11, 2.0);

  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.2);
  pdf.line(centerX - 35, familyCardY + 16, centerX + 35, familyCardY + 16);

  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(14);
  fitCenteredText(pdf, groomFamily, familyCardY + 28, { maxWidth: pageWidth - 60, maxSize: 14, minSize: 11, font: 'times', style: 'bold', color: theme.ink });
  fitCenteredText(pdf, brideFamily, familyCardY + 39, { maxWidth: pageWidth - 60, maxSize: 14, minSize: 11, font: 'times', style: 'bold', color: theme.ink });

  pdf.setTextColor(...theme.muted);
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(10.5);
  pdf.text('Serta segenap keluarga besar & handai taulan kedua mempelai', centerX, familyCardY + 48, { align: 'center' });

  // ==========================================================================
  // HALAMAN 3: RANGKAIAN ACARA
  // ==========================================================================
  pdf.addPage('a4', 'portrait');
  drawModernPageBase(pdf, theme, pageWidth, pageHeight, 3, templateName);
  drawPageHeading(pdf, theme, 'Rangkaian Acara', 'Dengan penuh rasa syukur dan sukacita, kami mengundang kehadiran Anda pada:', 30);

  const eventCardW = pageWidth - 44; // 166mm
  const eventCardX = 22;

  // Akad Nikah Card
  drawArchEventCard(
    pdf,
    theme,
    'Akad Nikah',
    {
      date: invitation.akad_date,
      start: invitation.akad_start_time,
      end: invitation.akad_end_time,
      venue: invitation.venue_name,
    },
    eventCardX,
    52,
    eventCardW,
    64,
  );

  // Resepsi Pernikahan Card
  drawArchEventCard(
    pdf,
    theme,
    'Resepsi Pernikahan',
    {
      date: invitation.reception_date,
      start: invitation.reception_start_time,
      end: invitation.reception_end_time,
      venue: invitation.venue_name,
    },
    eventCardX,
    124,
    eventCardW,
    64,
  );

  // Lokasi & Tempat Acara Plaque
  const venueCardY = 196;
  const venueCardH = 48;
  drawLuxuryPlaque(pdf, theme, eventCardX, venueCardY, eventCardW, venueCardH, 4);

  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  centeredTrackedText(pdf, 'BERTEMPAT DI', centerX, venueCardY + 11, 2.0);

  pdf.setDrawColor(...theme.goldLight);
  pdf.setLineWidth(0.2);
  pdf.line(centerX - 35, venueCardY + 16, centerX + 35, venueCardY + 16);

  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(17);
  pdf.text(safeText(invitation.venue_name, 'Lokasi Acara'), centerX, venueCardY + 28, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11.5);
  pdf.setTextColor(...theme.muted);
  centeredWrappedText(pdf, safeText(invitation.venue_address, 'Alamat akan diinformasikan kemudian.'), venueCardY + 38, eventCardW - 20, 5.0, 2);

  // Bottom Closing Note & Signatures
  pdf.setTextColor(...theme.muted);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(12);
  pdf.text('Doa restu Anda merupakan karunia terindah bagi kami.', centerX, 255, { align: 'center' });

  pdf.setTextColor(...theme.gold);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  centeredTrackedText(pdf, 'KAMI YANG BERBAHAGIA', centerX, 263, 1.6);

  fitCenteredText(pdf, `${groomName} & ${brideName}`, 275, {
    maxWidth: 160,
    maxSize: 24,
    minSize: 16,
    font: decorativeFont,
    style: decorativeFont === 'Sofia' ? 'normal' : 'italic',
    color: theme.ink,
  });

  // ==========================================================================
  // HALAMAN 4: PETUNJUK LOKASI & NAVIGASI GOOGLE MAPS
  // ==========================================================================
  pdf.addPage('a4', 'portrait');
  drawModernPageBase(pdf, theme, pageWidth, pageHeight, 4, templateName);
  drawPageHeading(pdf, theme, 'Petunjuk Lokasi', 'Gunakan denah rute berikut atau pindai kode QR untuk navigasi langsung.', 30);

  // Architectural Route Map
  const mapW = pageWidth - 44; // 166mm
  const mapX = 22;
  const mapY = 50;
  const mapH = 86;
  drawModernRouteMap(pdf, theme, invitation, mapX, mapY, mapW, mapH);

  pdf.setTextColor(...theme.muted);
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(9.5);
  pdf.text('Skema rute perjalanan — gunakan kode QR Google Maps di bawah untuk navigasi akurat', centerX, mapY + mapH + 7.5, { align: 'center' });

  // Two Side-by-Side Information Cards
  const travelCardW = (mapW - 10) / 2; // 78mm
  const travelCardY = 150;
  const travelCardH = 58;

  drawModernInfoCard(
    pdf,
    theme,
    'Panduan Rute',
    invitation.route_directions || `Pindai QR Google Maps untuk membuka rute navigasi otomatis dari lokasi Anda menuju ${safeText(invitation.venue_name, 'lokasi acara')}. Petunjuk arah akan menyesuaikan posisi secara real-time.`,
    mapX,
    travelCardY,
    travelCardW,
    travelCardH,
  );

  drawModernInfoCard(
    pdf,
    theme,
    'Akses & Parkir',
    invitation.transportation_guide || 'Lokasi menyediakan area parkir untuk kendaraan roda dua maupun roda empat. Tamu yang menggunakan transportasi umum atau taksi online dapat langsung diarahkan ke lobi utama gedung.',
    mapX + travelCardW + 10,
    travelCardY,
    travelCardW,
    travelCardH,
  );

  // Google Maps QR Section Plaque
  const qrCardY = 216;
  const qrCardH = 56;
  drawLuxuryPlaque(pdf, theme, mapX, qrCardY, mapW, qrCardH, 4);

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

      // QR Code container
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(...theme.goldLight);
      pdf.setLineWidth(0.24);
      pdf.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 2.5, 2.5, 'FD');

      pdf.addImage(qrData, 'PNG', qrX, qrY, qrSize, qrSize, undefined, 'FAST');

      // Right Text & Interactive Link Button
      const contentX = qrX + qrSize + 12;
      const contentW = mapW - qrSize - 30;

      pdf.setTextColor(...theme.gold);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      centeredTrackedText(pdf, 'PINDAI KODE QR GOOGLE MAPS', contentX + (contentW / 2), qrCardY + 15, 1.6);

      pdf.setTextColor(...theme.muted);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10.5);
      centeredWrappedText(
        pdf,
        'Arahkan kamera smartphone ke kode QR ini untuk membuka rute Google Maps secara instan menuju lokasi acara.',
        qrCardY + 24,
        contentW,
        5.2,
        2,
      );

      // Interactive Clickable Button
      const btnW = 68;
      const btnH = 11;
      const btnX = contentX + (contentW / 2) - (btnW / 2);
      const btnY = qrCardY + 37;

      pdf.setFillColor(...theme.gold);
      pdf.roundedRect(btnX, btnY, btnW, btnH, 3, 3, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10.5);
      pdf.text('Buka Google Maps ↗', btnX + (btnW / 2), btnY + 7.2, { align: 'center' });

      // Clickable PDF link
      pdf.link(btnX, btnY, btnW, btnH, { url: mapsUrl });
    } catch {
      pdf.setTextColor(...theme.ink);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      centeredWrappedText(pdf, mapsUrl, qrCardY + 24, mapW - 20, 5.5, 3);
    }
  }

  const fileBase = `${groomName}-${brideName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || safeText(orderCode, 'undangan');
  return { pdf, fileName: `undangan-${fileBase}.pdf` };
}

export async function downloadInvitationPdf(options) {
  const { pdf, fileName } = await createInvitationPdf(options);
  pdf.save(fileName);
}
