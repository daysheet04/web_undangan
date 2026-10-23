/**
 * Generates and downloads a branded PDF report for Affiliate Partner income & commissions.
 */
export async function downloadAffiliateIncomeReport({
  affiliate,
  items = [],
  periodLabel = 'Semua waktu',
  summary = {},
}) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth(); // 210
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182

  const formatRupiah = (val) =>
    `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(iso));
    } catch {
      return String(iso).slice(0, 10);
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso));
    } catch {
      return String(iso);
    }
  };

  const totalTransactions = items.length;
  const paidItems = items.filter((it) => it.payment_status === 'paid');
  const pendingItems = items.filter((it) => it.payment_status !== 'paid');
  const totalCommissionEarned = paidItems.reduce(
    (sum, it) => sum + Number(it.affiliate_commission_amount || 0),
    0
  );
  const totalCommissionPending = pendingItems.reduce(
    (sum, it) => sum + Number(it.affiliate_commission_amount || 0),
    0
  );

  const drawHeader = () => {
    // Emerald banner
    pdf.setFillColor(18, 62, 52); // #123e34 (affiliate deep forest green)
    pdf.rect(0, 0, pageWidth, 28, 'F');

    // Accent line in warm gold
    pdf.setFillColor(201, 164, 106); // #c9a46a
    pdf.rect(0, 28, pageWidth, 1.5, 'F');

    // Header branding
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('DAYMOMENT PARTNER', margin, 9);

    pdf.setFontSize(16);
    pdf.text('Laporan Pemasukan & Komisi', margin, 18);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(220, 235, 230);
    pdf.text(`Periode: ${periodLabel}`, pageWidth - margin, 12, { align: 'right' });
    pdf.text(`Dicetak: ${formatDateTime(new Date().toISOString())}`, pageWidth - margin, 18, { align: 'right' });

    pdf.setTextColor(21, 42, 34);
  };

  const drawFooter = () => {
    const pageNum = pdf.getCurrentPageInfo().pageNumber;
    pdf.setDrawColor(220, 230, 225);
    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(110, 130, 120);
    pdf.text('Daymoment Affiliate · Laporan Resmi Penghasilan Partner', margin, pageHeight - 7);
    pdf.text(`Halaman ${pageNum}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    pdf.setTextColor(21, 42, 34);
  };

  // Draw Page 1 header
  drawHeader();

  // Partner Info Box
  let currentY = 36;
  pdf.setFillColor(248, 250, 249);
  pdf.setDrawColor(225, 235, 230);
  pdf.roundedRect(margin, currentY, contentWidth, 22, 2.5, 2.5, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(18, 62, 52);
  pdf.text('Informasi Partner', margin + 4, currentY + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(70, 85, 78);
  pdf.text(`Nama: ${affiliate?.full_name || 'Partner'}`, margin + 4, currentY + 12);
  pdf.text(`Kode Referral: ${affiliate?.referral_code || '-'}`, margin + 4, currentY + 17);

  pdf.text(`Email: ${affiliate?.email || '-'}`, margin + 85, currentY + 12);
  if (summary.available !== undefined) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(20, 110, 75);
    pdf.text(`Saldo Tersedia: ${formatRupiah(summary.available)}`, margin + 85, currentY + 17);
  }

  // Summary Metrics Cards
  currentY += 26;
  const cardWidth = (contentWidth - 6) / 3;
  const cardHeight = 18;

  // Card 1: Komisi Lunas
  pdf.setFillColor(238, 248, 242);
  pdf.setDrawColor(185, 225, 205);
  pdf.roundedRect(margin, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(25, 95, 65);
  pdf.text('Total Komisi Lunas', margin + 3.5, currentY + 5.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(formatRupiah(totalCommissionEarned), margin + 3.5, currentY + 13.5);

  // Card 2: Komisi Tertunda
  pdf.setFillColor(254, 250, 240);
  pdf.setDrawColor(240, 225, 185);
  pdf.roundedRect(margin + cardWidth + 3, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(140, 105, 30);
  pdf.text('Komisi Tertunda / Menunggu', margin + cardWidth + 6.5, currentY + 5.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(formatRupiah(totalCommissionPending), margin + cardWidth + 6.5, currentY + 13.5);

  // Card 3: Total Transaksi
  pdf.setFillColor(246, 249, 252);
  pdf.setDrawColor(215, 228, 240);
  pdf.roundedRect(margin + (cardWidth + 3) * 2, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(40, 80, 120);
  pdf.text('Total Pesanan Referral', margin + (cardWidth + 3) * 2 + 3.5, currentY + 5.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(`${totalTransactions} Pesanan (${paidItems.length} lunas)`, margin + (cardWidth + 3) * 2 + 3.5, currentY + 13.5);

  // Table Column Definitions
  currentY += 24;
  const colX = {
    no: margin + 2,
    date: margin + 11,
    invoice: margin + 36,
    product: margin + 74,
    status: margin + 125,
    percent: margin + 148,
    amount: pageWidth - margin - 3,
  };

  const drawTableHeader = (y) => {
    pdf.setFillColor(235, 244, 239);
    pdf.setDrawColor(205, 225, 215);
    pdf.roundedRect(margin, y - 5, contentWidth, 8.5, 1.5, 1.5, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(18, 62, 52);
    pdf.text('No', colX.no, y);
    pdf.text('Tanggal', colX.date, y);
    pdf.text('Invoice', colX.invoice, y);
    pdf.text('Produk / Paket', colX.product, y);
    pdf.text('Status', colX.status, y);
    pdf.text('Komisi (%)', colX.percent, y);
    pdf.text('Nominal (Rp)', colX.amount, y, { align: 'right' });
    pdf.setTextColor(21, 42, 34);
    return y + 7.5;
  };

  currentY = drawTableHeader(currentY);

  if (items.length === 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(120, 135, 128);
    pdf.text('Tidak ada transaksi referral pada periode ini.', margin + 4, currentY + 6);
  } else {
    items.forEach((item, index) => {
      // Check page overflow
      if (currentY > pageHeight - 24) {
        drawFooter();
        pdf.addPage();
        drawHeader();
        currentY = drawTableHeader(38);
      }

      const isEven = index % 2 === 0;
      if (isEven) {
        pdf.setFillColor(252, 254, 253);
        pdf.rect(margin, currentY - 4.5, contentWidth, 7.5, 'F');
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(50, 65, 58);

      // No
      pdf.text(String(index + 1), colX.no, currentY);

      // Date
      pdf.text(formatDate(item.created_at), colX.date, currentY);

      // Invoice
      pdf.setFont('helvetica', 'bold');
      pdf.text(item.order_code || '-', colX.invoice, currentY);

      // Product (Template · Package)
      pdf.setFont('helvetica', 'normal');
      const prodName = [item.template_name || item.template?.name, item.product_name || item.product?.name]
        .filter(Boolean)
        .join(' · ') || 'Paket Undangan';
      pdf.text(pdf.splitTextToSize(prodName, 48)[0], colX.product, currentY);

      // Status
      const isPaid = item.payment_status === 'paid';
      pdf.setFont('helvetica', 'bold');
      if (isPaid) {
        pdf.setTextColor(22, 108, 72);
        pdf.text('Lunas', colX.status, currentY);
      } else {
        pdf.setTextColor(170, 115, 20);
        pdf.text('Menunggu', colX.status, currentY);
      }

      // Percent
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 75, 68);
      const pct = Number(item.affiliate_commission_percent || 0);
      pdf.text(`${pct}%`, colX.percent, currentY);

      // Amount
      pdf.setFont('helvetica', 'bold');
      const amt = Number(item.affiliate_commission_amount || 0);
      if (isPaid) {
        pdf.setTextColor(18, 90, 60);
      } else {
        pdf.setTextColor(140, 100, 30);
      }
      pdf.text(formatRupiah(amt), colX.amount, currentY, { align: 'right' });

      currentY += 7.5;
    });

    // Total row
    if (currentY > pageHeight - 20) {
      drawFooter();
      pdf.addPage();
      drawHeader();
      currentY = 38;
    }
    pdf.setFillColor(235, 244, 239);
    pdf.setDrawColor(205, 225, 215);
    pdf.roundedRect(margin, currentY - 4, contentWidth, 8, 1, 1, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(18, 62, 52);
    pdf.text('Total Komisi Lunas Diterima', margin + 4, currentY + 1.2);
    pdf.text(formatRupiah(totalCommissionEarned), colX.amount, currentY + 1.2, { align: 'right' });
  }

  // Draw final footer
  drawFooter();

  // Save file
  const sanitize = (str) =>
    (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'partner';
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Laporan-Pemasukan-Daymoment-${sanitize(affiliate?.referral_code)}-${dateStr}.pdf`;
  pdf.save(filename);
}

/**
 * Downloads income report as a CSV spreadsheet.
 */
export function downloadAffiliateIncomeCsv({
  affiliate,
  items = [],
  periodLabel = 'Semua waktu',
}) {
  const sanitize = (str) =>
    (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'partner';

  const rows = [
    ['DAYMOMENT AFFILIATE PARTNER - LAPORAN PEMASUKAN & KOMISI'],
    [`Nama Partner: ${affiliate?.full_name || 'Partner'}`],
    [`Kode Referral: ${affiliate?.referral_code || '-'}`],
    [`Email: ${affiliate?.email || '-'}`],
    [`Periode: ${periodLabel}`],
    [`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`],
    [],
    ['No', 'Tanggal', 'Invoice', 'Customer', 'Template', 'Paket', 'Status', 'Komisi (%)', 'Nominal Komisi (IDR)'],
  ];

  items.forEach((item, index) => {
    rows.push([
      index + 1,
      item.created_at ? new Date(item.created_at).toISOString().slice(0, 10) : '-',
      item.order_code || '-',
      item.customer_name || '-',
      item.template_name || item.template?.name || '-',
      item.product_name || item.product?.name || '-',
      item.payment_status === 'paid' ? 'Lunas' : 'Menunggu',
      Number(item.affiliate_commission_percent || 0),
      Number(item.affiliate_commission_amount || 0),
    ]);
  });

  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          const val = String(cell ?? '').replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(',')
    )
    .join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `Laporan-Pemasukan-Daymoment-${sanitize(affiliate?.referral_code)}-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
