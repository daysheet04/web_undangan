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

function drawDecoration(pdf, theme, pageWidth, pageHeight) {
  pdf.setDrawColor(...theme.accent);
  pdf.setLineWidth(0.55);
  pdf.roundedRect(11, 11, pageWidth - 22, pageHeight - 22, 2, 2, 'S');
  pdf.setDrawColor(...theme.soft);
  pdf.setLineWidth(0.25);
  pdf.roundedRect(14, 14, pageWidth - 28, pageHeight - 28, 1.5, 1.5, 'S');

  if (theme.style === 'jawi') {
    drawDiamondRow(pdf, pageWidth / 2, 23, theme.accent);
    drawDiamondRow(pdf, pageWidth / 2, pageHeight - 23, theme.accent);
  } else if (theme.style === 'moon') {
    pdf.setDrawColor(...theme.accent);
    pdf.setLineWidth(0.45);
    pdf.circle(21, 22, 6, 'S');
    pdf.setFillColor(...theme.paper);
    pdf.circle(23.5, 20, 5.4, 'F');
    pdf.circle(pageWidth - 21, pageHeight - 22, 2.1, 'S');
  } else if (theme.style === 'botanical') {
    drawSprig(pdf, 15, 16, 1, theme.accent);
    drawSprig(pdf, pageWidth - 15, pageHeight - 16, -1, theme.accent);
  } else {
    pdf.setDrawColor(...theme.accent);
    pdf.setLineWidth(0.4);
    pdf.line(18, 18, 40, 18);
    pdf.line(18, 18, 18, 40);
    pdf.line(pageWidth - 18, pageHeight - 18, pageWidth - 40, pageHeight - 18);
    pdf.line(pageWidth - 18, pageHeight - 18, pageWidth - 18, pageHeight - 40);
    pdf.setFillColor(...theme.accent);
    pdf.circle(18, 18, 1.2, 'F');
    pdf.circle(pageWidth - 18, pageHeight - 18, 1.2, 'F');
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
  pdf.setTextColor(...theme.accent);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.3);
  pdf.text(`DAYMOMENT · ${safeText(templateName, 'WEDDING INVITATION').toUpperCase()}`, 19, pageHeight - 18);
  pdf.text(`${pageNumber} / 4`, pageWidth - 19, pageHeight - 18, { align: 'right' });
}

function drawSectionHeading(pdf, theme, title, subtitle, y = 37) {
  const centerX = pdf.internal.pageSize.getWidth() / 2;
  pdf.setTextColor(...theme.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.2);
  centeredTrackedText(pdf, title.toUpperCase(), centerX, y, 1.5);
  if (subtitle) {
    pdf.setTextColor(...theme.ink);
    pdf.setFont('times', 'italic');
    pdf.setFontSize(9);
    centeredWrappedText(pdf, subtitle, y + 11, 144, 4.5, 2);
  }
}

function drawEvent(pdf, theme, title, data, x, y, width) {
  pdf.setFillColor(...theme.soft);
  pdf.roundedRect(x, y, width, 48, 2.5, 2.5, 'F');
  pdf.setTextColor(...theme.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  centeredTrackedText(pdf, title.toUpperCase(), x + width / 2, y + 10, 1.1);
  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(12);
  const dateLines = pdf.splitTextToSize(formatDate(data.date), width - 18).slice(0, 2);
  pdf.text(dateLines, x + width / 2, y + 23, { align: 'center', lineHeightFactor: 1.08 });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.text(formatTime(data.start, data.end), x + width / 2, y + 39, { align: 'center' });
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
  pdf.setFontSize(6.5);
  pdf.text(hasLandmark ? 'PATOKAN' : 'MULAI', startX, startY + 9, { align: 'center' });
  pdf.text('LOKASI', endX, endY + 10, { align: 'center' });
  pdf.setTextColor(...theme.ink);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.2);
  const landmarkLines = pdf.splitTextToSize(hasLandmark ? safeText(invitation.nearest_landmark) : 'Lokasi tamu saat membuka Maps', 52).slice(0, 2);
  const venueLines = pdf.splitTextToSize(safeText(invitation.venue_name, 'Lokasi acara'), 52).slice(0, 2);
  pdf.text(landmarkLines, startX, startY + 14, { align: 'center', lineHeightFactor: 1.15 });
  pdf.text(venueLines, endX, endY + 15, { align: 'center', lineHeightFactor: 1.15 });
}

function drawTravelCard(pdf, theme, title, text, x, y, width, height) {
  pdf.setFillColor(...theme.soft);
  pdf.roundedRect(x, y, width, height, 3, 3, 'F');
  pdf.setTextColor(...theme.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text(title.toUpperCase(), x + 7, y + 11);
  pdf.setTextColor(...theme.ink);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.6);
  const lines = pdf.splitTextToSize(safeText(text, 'Belum ada informasi tambahan.'), width - 14).slice(0, 8);
  pdf.text(lines, x + 7, y + 22, { lineHeightFactor: 1.3 });
}

export async function createInvitationPdf({ invitation, templateCode, templateName, orderCode }) {
  const [{ jsPDF }, qrModule] = await Promise.all([import('jspdf'), import('qrcode')]);
  const QRCode = qrModule.default || qrModule;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
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

  // Halaman 1: cover
  drawPageBase(pdf, theme, pageWidth, pageHeight, 1, templateName);
  pdf.setTextColor(...theme.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.2);
  centeredTrackedText(pdf, 'UNDANGAN PERNIKAHAN', centerX, 39, 1.8);
  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(10);
  pdf.text('The wedding of', centerX, 65, { align: 'center' });
  fitCenteredText(pdf, groomName, 111, { maxWidth: 154, maxSize: 34, minSize: 18, color: theme.ink });
  pdf.setTextColor(...theme.accent);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(18);
  pdf.text('&', centerX, 128, { align: 'center' });
  fitCenteredText(pdf, brideName, 151, { maxWidth: 154, maxSize: 34, minSize: 18, color: theme.ink });
  pdf.setDrawColor(...theme.accent);
  pdf.setLineWidth(0.3);
  pdf.line(72, 174, 97, 174);
  pdf.circle(centerX, 174, 1.1, 'S');
  pdf.line(113, 174, 138, 174);
  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(13);
  pdf.text(formatDate(mainDate), centerX, 193, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.3);
  pdf.setTextColor(82, 91, 87);
  centeredWrappedText(pdf, invitation.venue_name || 'Lokasi acara', 207, 142, 4.6, 2);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(9);
  pdf.setTextColor(...theme.ink);
  centeredWrappedText(pdf, 'Dengan penuh kebahagiaan, kami mengundang Anda untuk hadir dan memberikan doa restu.', 235, 137, 4.8, 3);

  // Halaman 2: profil mempelai
  pdf.addPage('a4', 'portrait');
  drawPageBase(pdf, theme, pageWidth, pageHeight, 2, templateName);
  drawSectionHeading(pdf, theme, 'Mempelai', 'Dua hati yang dipertemukan dalam satu ikatan.', 38);
  pdf.setFillColor(...theme.soft);
  pdf.roundedRect(24, 65, pageWidth - 48, 72, 3, 3, 'F');
  pdf.setTextColor(...theme.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  centeredTrackedText(pdf, 'MEMPELAI PRIA', centerX, 79, 1.2);
  fitCenteredText(pdf, groomFullName, 99, { maxWidth: 142, maxSize: 20, minSize: 12, color: theme.ink });
  pdf.setTextColor(82, 91, 87);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.4);
  pdf.text('Putra dari', centerX, 110, { align: 'center' });
  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10.3);
  centeredWrappedText(pdf, `${safeText(invitation.groom_father, 'Bapak ...')} & ${safeText(invitation.groom_mother, 'Ibu ...')}`, 120, 137, 4.8, 2);

  pdf.setDrawColor(...theme.accent);
  pdf.setLineWidth(0.3);
  pdf.line(75, 148, 97, 148);
  pdf.circle(centerX, 148, 1.2, 'S');
  pdf.line(113, 148, 135, 148);

  pdf.setFillColor(...theme.soft);
  pdf.roundedRect(24, 159, pageWidth - 48, 72, 3, 3, 'F');
  pdf.setTextColor(...theme.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  centeredTrackedText(pdf, 'MEMPELAI WANITA', centerX, 173, 1.2);
  fitCenteredText(pdf, brideFullName, 193, { maxWidth: 142, maxSize: 20, minSize: 12, color: theme.ink });
  pdf.setTextColor(82, 91, 87);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.4);
  pdf.text('Putri dari', centerX, 204, { align: 'center' });
  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10.3);
  centeredWrappedText(pdf, `${safeText(invitation.bride_father, 'Bapak ...')} & ${safeText(invitation.bride_mother, 'Ibu ...')}`, 214, 137, 4.8, 2);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(9.2);
  pdf.setTextColor(...theme.ink);
  centeredWrappedText(pdf, 'Dengan memohon rahmat dan ridho Tuhan Yang Maha Esa, kami bermaksud melangsungkan pernikahan kami.', 250, 142, 4.8, 3);

  // Halaman 3: rangkaian acara dan alamat
  pdf.addPage('a4', 'portrait');
  drawPageBase(pdf, theme, pageWidth, pageHeight, 3, templateName);
  drawSectionHeading(pdf, theme, 'Rangkaian Acara', 'Kami berharap dapat berbagi hari bahagia ini bersama Anda.', 36);
  drawEvent(pdf, theme, 'Akad Nikah', {
    date: invitation.akad_date,
    start: invitation.akad_start_time,
    end: invitation.akad_end_time,
  }, 25, 61, pageWidth - 50);
  drawEvent(pdf, theme, 'Resepsi', {
    date: invitation.reception_date,
    start: invitation.reception_start_time,
    end: invitation.reception_end_time,
  }, 25, 118, pageWidth - 50);

  pdf.setTextColor(...theme.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  centeredTrackedText(pdf, 'LOKASI ACARA', centerX, 184, 1.2);
  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(13);
  let y = centeredWrappedText(pdf, invitation.venue_name || 'Lokasi acara', 197, 150, 5.3, 2);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(82, 91, 87);
  y = centeredWrappedText(pdf, invitation.venue_address || 'Alamat akan diinformasikan kemudian.', y + 3, 145, 4.6, 4);

  pdf.setTextColor(...theme.ink);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(8.8);
  centeredWrappedText(pdf, 'Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami mengucapkan terima kasih.', Math.max(y + 12, 238), 142, 4.7, 3);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(12);
  fitCenteredText(pdf, `${groomName} & ${brideName}`, 263, { maxWidth: 145, maxSize: 13, minSize: 9, color: theme.ink });

  // Halaman 4: skema arah, petunjuk perjalanan, dan Google Maps
  pdf.addPage('a4', 'portrait');
  drawPageBase(pdf, theme, pageWidth, pageHeight, 4, templateName);
  drawSectionHeading(pdf, theme, 'Petunjuk Lokasi', 'Gunakan patokan berikut atau pindai Google Maps untuk navigasi langsung.', 36);
  drawRouteMap(pdf, theme, invitation, 22, 61, pageWidth - 44, 87);
  pdf.setTextColor(105, 115, 110);
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(6.5);
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
      pdf.setFontSize(8);
      pdf.text('PINDAI GOOGLE MAPS', 99, 244);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.2);
      pdf.setTextColor(82, 91, 87);
      pdf.text('Buka lokasi dan mulai navigasi', 99, 250);
      pdf.setDrawColor(...theme.accent);
      pdf.roundedRect(97, 254, 42, 8, 2, 2, 'S');
      pdf.setTextColor(...theme.accent);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.4);
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
