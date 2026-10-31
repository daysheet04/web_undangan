import fs from 'node:fs';
import { createInvitationPdf, THEMES } from '../src/lib/invitationPdf.js';

async function testPdf() {
  const sampleInvitation = {
    groom_nickname: 'Baskara',
    groom_full_name: 'Baskara Raditya Pratama',
    bride_nickname: 'Anindya',
    bride_full_name: 'Anindya Kirana Putri',
    groom_father: 'Bambang Pratama',
    groom_mother: 'Sri Wahyuni',
    bride_father: 'Hendra Gunawan',
    bride_mother: 'Rina Marlina',
    reception_date: '2026-10-31T09:00:00Z',
    reception_start_time: '11:00',
    reception_end_time: '13:00',
    akad_date: '2026-10-31T08:00:00Z',
    akad_start_time: '08:00',
    akad_end_time: '10:00',
    venue_name: 'Grand Ballroom Hotel Majapahit',
    venue_address: 'Jl. Tunjungan No. 65, Surabaya',
    maps_url: 'https://maps.google.com',
    guest_name: '', // Empty guest name to test clean box
  };

  for (const themeKey of Object.keys(THEMES)) {
    console.log(`Generating PDF for ${themeKey}...`);
    const { pdf } = await createInvitationPdf({
      invitation: sampleInvitation,
      templateCode: themeKey,
      templateName: 'Template Test',
      orderCode: 'ORD-12345',
    });
    const pdfBuf = Buffer.from(pdf.output('arraybuffer'));
    const outName = `scratch/invitation_test_${themeKey}.pdf`;
    fs.writeFileSync(outName, pdfBuf);
    console.log(`Saved ${outName} (${pdfBuf.length} bytes)`);
  }
  console.log('All 4 PDFs generated successfully!');
}

testPdf().catch((err) => {
  console.error('PDF Generation Error:', err);
  process.exit(1);
});
