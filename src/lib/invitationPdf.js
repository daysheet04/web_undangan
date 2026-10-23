const THEMES = {
  puspa_jawi: {
    paper: [250, 247, 239],
    ink: [31, 54, 67],
    accent: [174, 132, 76],
    soft: [230, 223, 207],
    style: 'jawi',
  },
  lunara_azure: {
    paper: [246, 249, 252],
    ink: [34, 57, 88],
    accent: [112, 146, 181],
    soft: [218, 230, 241],
    style: 'moon',
  },
  verdant_vow: {
    paper: [247, 249, 244],
    ink: [31, 67, 55],
    accent: [105, 132, 99],
    soft: [220, 230, 216],
    style: 'botanical',
  },
  aurelia_grande: {
    paper: [252, 249, 242],
    ink: [71, 51, 40],
    accent: [173, 136, 82],
    soft: [235, 224, 204],
    style: 'classic',
  },
};

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
  if (from && to) return `${from} - ${to} WIB`;
  if (from) return `${from} WIB`;
  return 'Waktu menyusul';
}

function drawDiamondRow(pdf, centerX, y, color) {
  pdf.setDrawColor(...color);
  pdf.setLineWidth(0.35);
  [-12, -6, 0, 6, 12].forEach((offset, index) => {
    const size = index === 2 ? 2.2 : 1.5;
    pdf.lines([[size, size], [-size, size], [-size, -size], [size, -size]], centerX + offset, y - size, [1, 1], 'S', true);
  });
}

function drawSprig(pdf, x, y, direction, color) {
  pdf.setDrawColor(...color);
  pdf.setLineWidth(0.35);
  pdf.line(x, y, x + (18 * direction), y + 17);
  for (let step = 4; step <= 15; step += 5) {
    const stemX = x + (step * direction);
    const stemY = y + step;
    pdf.ellipse(stemX + (2.2 * direction), stemY - 1.3, 2.7, 1.1, 'S');
    pdf.ellipse(stemX - (1.1 * direction), stemY + 2.1, 2.5, 1, 'S');
  }
}

function mixColor(first, second, firstWeight = 0.5) {
  return first.map((value, index) => Math.round((value * firstWeight) + (second[index] * (1 - firstWeight))));
}

function drawClassicFloralBand(pdf, theme, pageWidth, y, height) {
  const petal = mixColor(theme.soft, theme.paper, 0.72);
  const leaf = mixColor(theme.accent, theme.paper, 0.62);
  pdf.setFillColor(...petal);
  pdf.rect(8, y, pageWidth - 16, height, 'F');
  pdf.setDrawColor(...theme.accent);
  pdf.setLineWidth(0.45);
  pdf.line(8, y + 1.2, pageWidth - 8, y + 1.2);
  pdf.line(8, y + height - 1.2, pageWidth - 8, y + height - 1.2);

  for (let x = 17; x <= pageWidth - 17; x += 18) {
    const centerY = y + height / 2;
    pdf.setFillColor(...leaf);
    pdf.ellipse(x - 4.2, centerY, 3.6, 1.35, 'F');
    pdf.ellipse(x + 4.2, centerY, 3.6, 1.35, 'F');
    pdf.setFillColor(...theme.paper);
    pdf.ellipse(x, centerY - 3.1, 1.7, 3.1, 'F');
    pdf.ellipse(x, centerY + 3.1, 1.7, 3.1, 'F');
    pdf.setFillColor(...theme.accent);
    pdf.circle(x, centerY, 1.25, 'F');
  }
}

function drawPaperPattern(pdf, theme, pageWidth, pageHeight) {
  const pattern = mixColor(theme.soft, theme.paper, 0.48);
  pdf.setDrawColor(...pattern);
  pdf.setLineWidth(0.18);
  let row = 0;
  for (let y = 39; y < pageHeight - 31; y += 25) {
    const offset = row % 2 ? 14 : 0;
    for (let x = 20 + offset; x < pageWidth - 15; x += 28) {
      pdf.lines([[3.2, 3.2], [-3.2, 3.2], [-3.2, -3.2], [3.2, -3.2]], x, y - 3.2, [1, 1], 'S', true);
      pdf.circle(x, y, 0.65, 'S');
    }
    row += 1;
  }
}

function drawOrnateDivider(pdf, theme, centerX, y, width = 58) {
  pdf.setDrawColor(...theme.accent);
  pdf.setLineWidth(0.38);
  pdf.line(centerX - width / 2, y, centerX - 7, y);
  pdf.line(centerX + 7, y, centerX + width / 2, y);
  pdf.lines([[3, 3], [-3, 3], [-3, -3], [3, -3]], centerX, y - 3, [1, 1], 'S', true);
  pdf.circle(centerX - 10, y, 0.75, 'F');
  pdf.circle(centerX + 10, y, 0.75, 'F');
}

function drawDecoration(pdf, theme, pageWidth, pageHeight) {
  drawPaperPattern(pdf, theme, pageWidth, pageHeight);
  drawClassicFloralBand(pdf, theme, pageWidth, 7, 19);
  drawClassicFloralBand(pdf, theme, pageWidth, pageHeight - 22, 15);
  pdf.setDrawColor(...theme.accent);
  pdf.setLineWidth(0.7);
  pdf.roundedRect(8, 7, pageWidth - 16, pageHeight - 14, 2, 2, 'S');
  pdf.setDrawColor(...theme.soft);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(11, 29, pageWidth - 22, pageHeight - 58, 1.5, 1.5, 'S');

  if (theme.style === 'jawi') {
    drawDiamondRow(pdf, pageWidth / 2, 16.5, theme.accent);
    drawDiamondRow(pdf, pageWidth / 2, pageHeight - 16.5, theme.accent);
  } else if (theme.style === 'moon') {
    pdf.setDrawColor(...theme.accent);
    pdf.setLineWidth(0.45);
    pdf.circle(21, 16.5, 5, 'S');
    pdf.setFillColor(...theme.paper);
    pdf.circle(23.2, 14.7, 4.5, 'F');
    pdf.circle(pageWidth - 21, pageHeight - 16.5, 2.1, 'S');
  } else if (theme.style === 'botanical') {
    drawSprig(pdf, 11, 8, 1, theme.accent);
    drawSprig(pdf, pageWidth - 11, pageHeight - 25, -1, theme.accent);
  } else {
    pdf.setDrawColor(...theme.accent);
    pdf.setLineWidth(0.4);
    pdf.line(13, 31, 35, 31);
    pdf.line(13, 31, 13, 49);
    pdf.line(pageWidth - 13, pageHeight - 31, pageWidth - 35, pageHeight - 31);
    pdf.line(pageWidth - 13, pageHeight - 31, pageWidth - 13, pageHeight - 49);
    pdf.setFillColor(...theme.accent);
    pdf.circle(13, 31, 1.2, 'F');
    pdf.circle(pageWidth - 13, pageHeight - 31, 1.2, 'F');
  }
}

function centeredWrappedText(pdf, text, y, maxWidth, lineHeight = 5, maxLines = Infinity) {
  const wrapped = pdf.splitTextToSize(safeText(text), maxWidth);
  const lines = wrapped.slice(0, maxLines);
  if (wrapped.length > maxLines && lines.length) lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.,;:]?$/, '')}...`;
  pdf.text(lines, pdf.internal.pageSize.getWidth() / 2, y, { align: 'center', lineHeightFactor: lineHeight / 4.2 });
  return y + (lines.length * lineHeight);
}

function centeredTrackedText(pdf, text, centerX, y, tracking = 1) {
  const characters = [...safeText(text, '')];
  const glyphWidth = characters.reduce((total, character) => total + pdf.getTextWidth(character), 0);
  const totalWidth = glyphWidth + Math.max(0, characters.length - 1) * tracking;
  let cursorX = centerX - totalWidth / 2;
  characters.forEach((character) => {
    pdf.text(character, cursorX, y);
    cursorX += pdf.getTextWidth(character) + tracking;
  });
}

function fitCenteredText(pdf, text, y, { maxWidth = 150, maxSize = 28, minSize = 13, font = 'times', style = 'bold', color } = {}) {
  pdf.setFont(font, style);
  let size = maxSize;
  pdf.setFontSize(size);
  while (size > minSize && pdf.getTextWidth(safeText(text)) > maxWidth) {
    size -= 0.5;
    pdf.setFontSize(size);
  }
  if (color) pdf.setTextColor(...color);
  pdf.text(safeText(text), pdf.internal.pageSize.getWidth() / 2, y, { align: 'center' });
}

function drawPageBase(pdf, theme, pageWidth, pageHeight, pageNumber, templateName) {
  pdf.setFillColor(...theme.paper);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  drawDecoration(pdf, theme, pageWidth, pageHeight);
  pdf.setFillColor(...mixColor(theme.paper, [255, 255, 255], 0.9));
  pdf.roundedRect(14, pageHeight - 18, pageWidth - 28, 10, 2.5, 2.5, 'F');
  pdf.setTextColor(...theme.accent);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.3);
  pdf.text(`DAYMOMENT | ${safeText(templateName, 'WEDDING INVITATION').toUpperCase()}`, 19, pageHeight - 11.5);
  pdf.text(`${pageNumber} / 4`, pageWidth - 19, pageHeight - 11.5, { align: 'right' });
}

function drawSectionHeading(pdf, theme, title, subtitle, y = 37, decorativeFont = 'times') {
  const centerX = pdf.internal.pageSize.getWidth() / 2;
  pdf.setFillColor(...mixColor(theme.paper, [255, 255, 255], 0.88));
  pdf.setDrawColor(...theme.soft);
  pdf.setLineWidth(0.35);
  pdf.roundedRect(27, y - 12, pdf.internal.pageSize.getWidth() - 54, subtitle ? 31 : 22, 4, 4, 'FD');
  pdf.setTextColor(...theme.accent);
  pdf.setFont(decorativeFont, decorativeFont === 'Sofia' ? 'normal' : 'italic');
  pdf.setFontSize(18);
  pdf.text(title, centerX, y, { align: 'center' });
  drawOrnateDivider(pdf, theme, centerX, y + 5, 52);
  if (subtitle) {
    pdf.setTextColor(...theme.ink);
    pdf.setFont('times', 'italic');
    pdf.setFontSize(10.5);
    centeredWrappedText(pdf, subtitle, y + 13, 150, 5.2, 2);
  }
}

function drawEvent(pdf, theme, title, data, x, y, width) {
  pdf.setFillColor(...mixColor(theme.soft, theme.paper, 0.76));
  pdf.setDrawColor(...theme.accent);
  pdf.setLineWidth(0.45);
  pdf.roundedRect(x, y, width, 48, 3, 3, 'FD');
  pdf.setDrawColor(...theme.soft);
  pdf.roundedRect(x + 3, y + 3, width - 6, 42, 2, 2, 'S');
  pdf.setTextColor(...theme.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  centeredTrackedText(pdf, title.toUpperCase(), x + width / 2, y + 10, 1.1);
  drawOrnateDivider(pdf, theme, x + width / 2, y + 15, 44);
  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(13.5);
  const dateLines = pdf.splitTextToSize(formatDate(data.date), width - 18).slice(0, 2);
  pdf.text(dateLines, x + width / 2, y + 27, { align: 'center', lineHeightFactor: 1.05 });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.text(formatTime(data.start, data.end), x + width / 2, y + 41, { align: 'center' });
}

function drawRouteMap(pdf, theme, invitation, x, y, width, height) {
  const hasLandmark = Boolean(String(invitation.nearest_landmark || '').trim());
  const startX = x + 24;
  const startY = y + height - 24;
  const endX = x + width - 25;
  const endY = y + 28;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...theme.soft);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(x, y, width, height, 3, 3, 'FD');

  pdf.setDrawColor(...theme.soft);
  pdf.setLineWidth(0.22);
  [0.25, 0.5, 0.75].forEach((ratio) => {
    pdf.line(x + width * ratio, y + 9, x + width * ratio, y + height - 9);
    pdf.line(x + 9, y + height * ratio, x + width - 9, y + height * ratio);
  });

  pdf.setDrawColor(...theme.accent);
  pdf.setLineWidth(1.15);
  pdf.setLineCap('round');
  const turnOneX = x + width * 0.36;
  const turnTwoX = x + width * 0.64;
  pdf.line(startX, startY, turnOneX, startY);
  pdf.line(turnOneX, startY, turnOneX, y + height * 0.56);
  pdf.line(turnOneX, y + height * 0.56, turnTwoX, y + height * 0.56);
  pdf.line(turnTwoX, y + height * 0.56, turnTwoX, endY);
  pdf.line(turnTwoX, endY, endX, endY);

  pdf.setFillColor(...theme.paper);
  pdf.setDrawColor(...theme.accent);
  pdf.setLineWidth(0.6);
  pdf.circle(startX, startY, 4.2, 'FD');
  pdf.setFillColor(...theme.accent);
  pdf.circle(startX, startY, 1.5, 'F');
  pdf.circle(endX, endY, 5, 'F');
  pdf.setFillColor(...theme.paper);
  pdf.circle(endX, endY, 1.7, 'F');

  pdf.setTextColor(...theme.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text(hasLandmark ? 'PATOKAN' : 'MULAI', startX, startY + 9, { align: 'center' });
  pdf.text('LOKASI', endX, endY + 10, { align: 'center' });
  pdf.setTextColor(...theme.ink);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.2);
  const landmarkLines = pdf.splitTextToSize(hasLandmark ? safeText(invitation.nearest_landmark) : 'Lokasi tamu saat membuka Maps', 52).slice(0, 2);
  const venueLines = pdf.splitTextToSize(safeText(invitation.venue_name, 'Lokasi acara'), 52).slice(0, 2);
  pdf.text(landmarkLines, startX, startY + 14, { align: 'center', lineHeightFactor: 1.15 });
  pdf.text(venueLines, endX, endY + 15, { align: 'center', lineHeightFactor: 1.15 });
}

function drawTravelCard(pdf, theme, title, text, x, y, width, height) {
  pdf.setFillColor(...mixColor(theme.soft, theme.paper, 0.76));
  pdf.setDrawColor(...theme.accent);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(x, y, width, height, 3, 3, 'FD');
  pdf.setDrawColor(...theme.soft);
  pdf.roundedRect(x + 3, y + 3, width - 6, height - 6, 2, 2, 'S');
  pdf.setTextColor(...theme.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text(title.toUpperCase(), x + 7, y + 11);
  pdf.setTextColor(...theme.ink);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.4);
  const lines = pdf.splitTextToSize(safeText(text, 'Belum ada informasi tambahan.'), width - 14).slice(0, 7);
  pdf.text(lines, x + 7, y + 22, { lineHeightFactor: 1.3 });
}

export async function createInvitationPdf({ invitation, templateCode, templateName, orderCode }) {
  const [{ jsPDF }, qrModule] = await Promise.all([import('jspdf'), import('qrcode')]);
  const QRCode = qrModule.default || qrModule;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const decorativeFont = await registerSofiaFont(pdf);
  const theme = THEMES[templateCode] || THEMES.puspa_jawi;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;
  const groomName = safeText(invitation.groom_nickname || invitation.groom_full_name, 'Mempelai Pria');
  const brideName = safeText(invitation.bride_nickname || invitation.bride_full_name, 'Mempelai Wanita');
  const groomFullName = safeText(invitation.groom_full_name, groomName);
  const brideFullName = safeText(invitation.bride_full_name, brideName);
  const mainDate = invitation.reception_date || invitation.akad_date;
  const destination = [invitation.venue_name, invitation.venue_address].map((value) => String(value || '').trim()).filter(Boolean).join(', ');
  const suppliedMapsUrl = /^https?:\/\//i.test(String(invitation.maps_url || '')) ? String(invitation.maps_url).trim() : '';
  const mapsUrl = suppliedMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination || 'Lokasi acara')}`;
  const groomFamily = `Keluarga Bapak ${safeText(invitation.groom_father, '...')} & Ibu ${safeText(invitation.groom_mother, '...')}`;
  const brideFamily = `Keluarga Bapak ${safeText(invitation.bride_father, '...')} & Ibu ${safeText(invitation.bride_mother, '...')}`;

  // Halaman 1: cover
  drawPageBase(pdf, theme, pageWidth, pageHeight, 1, templateName);
  pdf.setFillColor(...mixColor(theme.paper, [255, 255, 255], 0.88));
  pdf.setDrawColor(...theme.accent);
  pdf.setLineWidth(0.55);
  pdf.roundedRect(19, 33, pageWidth - 38, 230, 5, 5, 'FD');
  pdf.setDrawColor(...theme.soft);
  pdf.roundedRect(23, 37, pageWidth - 46, 222, 4, 4, 'S');
  pdf.setTextColor(...theme.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  centeredTrackedText(pdf, 'UNDANGAN PERNIKAHAN', centerX, 48, 1.8);
  drawOrnateDivider(pdf, theme, centerX, 55, 68);
  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(11.2);
  centeredWrappedText(pdf, 'Hamparan kasih Ilahi Rabbi terbentang seraya kami menengadahkan jemari, memohon limpahan rahmat dan karunia-Nya. Dengan penuh rasa syukur, kami mengundang Bapak/Ibu/Saudara/i untuk menyaksikan bersatunya putra-putri kami dalam ikatan suci pernikahan.', 67, 158, 6.1, 6);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10.5);
  pdf.text('Pernikahan putra-putri kami', centerX, 108, { align: 'center' });
  fitCenteredText(pdf, groomName, 130, { maxWidth: 155, maxSize: 38, minSize: 22, font: decorativeFont, style: decorativeFont === 'Sofia' ? 'normal' : 'italic', color: theme.ink });
  pdf.setTextColor(...theme.accent);
  pdf.setFont(decorativeFont, decorativeFont === 'Sofia' ? 'normal' : 'italic');
  pdf.setFontSize(21);
  pdf.text('&', centerX, 146, { align: 'center' });
  fitCenteredText(pdf, brideName, 164, { maxWidth: 155, maxSize: 38, minSize: 22, font: decorativeFont, style: decorativeFont === 'Sofia' ? 'normal' : 'italic', color: theme.ink });
  drawOrnateDivider(pdf, theme, centerX, 176, 62);
  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10.5);
  pdf.text('Insya Allah akan diselenggarakan pada', centerX, 188, { align: 'center' });
  pdf.setFontSize(15);
  pdf.text(formatDate(mainDate), centerX, 201, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10.2);
  pdf.setTextColor(82, 91, 87);
  centeredWrappedText(pdf, invitation.venue_name || 'Lokasi acara', 213, 150, 5.4, 2);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(10.8);
  pdf.setTextColor(...theme.ink);
  centeredWrappedText(pdf, 'Tiada kebahagiaan yang lebih sempurna bagi kami selain kehadiran serta doa restu Bapak/Ibu/Saudara/i pada hari bahagia tersebut.', 235, 153, 5.8, 4);

  // Halaman 2: profil mempelai
  pdf.addPage('a4', 'portrait');
  drawPageBase(pdf, theme, pageWidth, pageHeight, 2, templateName);
  drawSectionHeading(pdf, theme, 'Kedua Mempelai', 'Dua hati yang dipertemukan dalam kasih, disatukan dalam ikatan suci.', 42, decorativeFont);
  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10.8);
  centeredWrappedText(pdf, 'Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami:', 69, 158, 5.7, 4);

  pdf.setFillColor(...mixColor(theme.soft, theme.paper, 0.78));
  pdf.setDrawColor(...theme.accent);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(23, 96, pageWidth - 46, 51, 4, 4, 'FD');
  pdf.setDrawColor(...theme.soft);
  pdf.roundedRect(27, 100, pageWidth - 54, 43, 3, 3, 'S');
  pdf.setTextColor(...theme.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  centeredTrackedText(pdf, 'MEMPELAI PRIA', centerX, 106, 1.2);
  fitCenteredText(pdf, groomFullName, 122, { maxWidth: 142, maxSize: 23, minSize: 14, font: decorativeFont, style: decorativeFont === 'Sofia' ? 'normal' : 'italic', color: theme.ink });
  pdf.setTextColor(82, 91, 87);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.text('Putra dari', centerX, 131, { align: 'center' });
  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10.8);
  centeredWrappedText(pdf, `${safeText(invitation.groom_father, 'Bapak ...')} & ${safeText(invitation.groom_mother, 'Ibu ...')}`, 140, 140, 4.8, 1);

  pdf.setFillColor(...mixColor(theme.soft, theme.paper, 0.78));
  pdf.setDrawColor(...theme.accent);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(23, 154, pageWidth - 46, 51, 4, 4, 'FD');
  pdf.setDrawColor(...theme.soft);
  pdf.roundedRect(27, 158, pageWidth - 54, 43, 3, 3, 'S');
  pdf.setTextColor(...theme.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  centeredTrackedText(pdf, 'MEMPELAI WANITA', centerX, 164, 1.2);
  fitCenteredText(pdf, brideFullName, 180, { maxWidth: 142, maxSize: 23, minSize: 14, font: decorativeFont, style: decorativeFont === 'Sofia' ? 'normal' : 'italic', color: theme.ink });
  pdf.setTextColor(82, 91, 87);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.text('Putri dari', centerX, 189, { align: 'center' });
  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10.8);
  centeredWrappedText(pdf, `${safeText(invitation.bride_father, 'Bapak ...')} & ${safeText(invitation.bride_mother, 'Ibu ...')}`, 198, 140, 4.8, 1);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(10.8);
  pdf.setTextColor(...theme.ink);
  centeredWrappedText(pdf, 'Untuk melaksanakan sunnah Rasul-Nya dalam membentuk keluarga yang sakinah, mawaddah, dan warahmah, dengan segala kerendahan hati kami memohon doa restu Bapak/Ibu/Saudara/i.', 217, 157, 5.6, 4);
  pdf.setTextColor(...theme.accent);
  pdf.setFont(decorativeFont, decorativeFont === 'Sofia' ? 'normal' : 'italic');
  pdf.setFontSize(16);
  pdf.text('Turut Mengundang', centerX, 244, { align: 'center' });
  drawOrnateDivider(pdf, theme, centerX, 249, 48);
  fitCenteredText(pdf, groomFamily, 257, { maxWidth: 162, maxSize: 9.5, minSize: 8, font: 'helvetica', style: 'bold', color: theme.ink });
  fitCenteredText(pdf, brideFamily, 264, { maxWidth: 162, maxSize: 9.5, minSize: 8, font: 'helvetica', style: 'bold', color: theme.ink });

  // Halaman 3: rangkaian acara dan alamat
  pdf.addPage('a4', 'portrait');
  drawPageBase(pdf, theme, pageWidth, pageHeight, 3, templateName);
  drawSectionHeading(pdf, theme, 'Rangkaian Acara', 'Dengan penuh hormat dan sukacita, kami mengundang Anda untuk hadir.', 41, decorativeFont);
  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10.8);
  centeredWrappedText(pdf, 'Insya Allah akad nikah dan resepsi pernikahan putra-putri kami akan dilaksanakan pada:', 69, 158, 5.6, 3);
  drawEvent(pdf, theme, 'Akad Nikah', {
    date: invitation.akad_date,
    start: invitation.akad_start_time,
    end: invitation.akad_end_time,
  }, 25, 86, pageWidth - 50);
  drawEvent(pdf, theme, 'Resepsi', {
    date: invitation.reception_date,
    start: invitation.reception_start_time,
    end: invitation.reception_end_time,
  }, 25, 140, pageWidth - 50);

  pdf.setTextColor(...theme.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  centeredTrackedText(pdf, 'BERTEMPAT DI', centerX, 198, 1.2);
  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(14);
  let y = centeredWrappedText(pdf, invitation.venue_name || 'Lokasi acara', 210, 150, 5.5, 2);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.8);
  pdf.setTextColor(82, 91, 87);
  y = centeredWrappedText(pdf, invitation.venue_address || 'Alamat akan diinformasikan kemudian.', y + 3, 154, 5.1, 2);

  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(10.4);
  centeredWrappedText(pdf, 'Suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir pada acara tersebut serta memberikan doa restu kepada kedua mempelai.', Math.max(y + 7, 231), 158, 5.3, 4);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10.2);
  pdf.text("Wassalamu'alaikum Warahmatullahi Wabarakatuh", centerX, 253, { align: 'center' });
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('KAMI YANG BERBAHAGIA', centerX, 259, { align: 'center' });
  fitCenteredText(pdf, `${groomName} & ${brideName}`, 267, { maxWidth: 150, maxSize: 16, minSize: 11, font: decorativeFont, style: decorativeFont === 'Sofia' ? 'normal' : 'italic', color: theme.ink });

  // Halaman 4: skema arah, petunjuk perjalanan, dan Google Maps
  pdf.addPage('a4', 'portrait');
  drawPageBase(pdf, theme, pageWidth, pageHeight, 4, templateName);
  drawSectionHeading(pdf, theme, 'Petunjuk Lokasi', 'Gunakan patokan berikut atau pindai Google Maps untuk navigasi langsung.', 36, decorativeFont);
  drawRouteMap(pdf, theme, invitation, 22, 61, pageWidth - 44, 87);
  pdf.setTextColor(105, 115, 110);
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(7.5);
  pdf.text('Skema arah sederhana - bukan peta berskala', centerX, 155, { align: 'center' });

  drawTravelCard(
    pdf,
    theme,
    'Petunjuk arah',
    invitation.route_directions || `Pindai QR Google Maps untuk membuat rute otomatis dari lokasi Anda menuju ${safeText(invitation.venue_name, 'lokasi acara')}. Petunjuk belokan akan menyesuaikan posisi saat navigasi dibuka.`,
    22,
    164,
    80,
    65,
  );
  drawTravelCard(
    pdf,
    theme,
    'Akses transportasi',
    invitation.transportation_guide || 'Setelah Google Maps terbuka, pilih kendaraan pribadi, jalan kaki, atau transportasi umum untuk melihat rute dan perkiraan perjalanan yang tersedia.',
    108,
    164,
    80,
    65,
  );

  if (mapsUrl) {
    try {
      const qrData = await QRCode.toDataURL(mapsUrl, { width: 420, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#173f36', light: '#ffffff' } });
      pdf.addImage(qrData, 'PNG', 68, 236, 25, 25, undefined, 'FAST');
      pdf.setTextColor(...theme.ink);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('PINDAI GOOGLE MAPS', 99, 244);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(82, 91, 87);
      pdf.text('Buka lokasi dan mulai navigasi', 99, 250);
      pdf.setDrawColor(...theme.accent);
      pdf.roundedRect(97, 254, 42, 8, 2, 2, 'S');
      pdf.setTextColor(...theme.accent);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.text('BUKA PETA', 118, 259.2, { align: 'center' });
      pdf.link(97, 254, 42, 8, { url: mapsUrl });
    } catch {
      pdf.setTextColor(...theme.ink);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      centeredWrappedText(pdf, mapsUrl, 246, 140, 4.4, 3);
    }
  }

  const fileBase = `${groomName}-${brideName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || safeText(orderCode, 'undangan');
  return { pdf, fileName: `undangan-${fileBase}.pdf` };
}

export async function downloadInvitationPdf(options) {
  const { pdf, fileName } = await createInvitationPdf(options);
  pdf.save(fileName);
}
