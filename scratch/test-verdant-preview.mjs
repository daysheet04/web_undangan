import fs from 'node:fs';
import sharp from 'sharp';
import { getHalfFrameBouquetSvg } from './gen-test-hf.mjs';

async function testVerdant() {
  const tlSvg = getHalfFrameBouquetSvg('verdant_vow', 'tl');
  const brSvg = getHalfFrameBouquetSvg('verdant_vow', 'br');

  const fullSvg = `
  <svg width="800" height="1131" viewBox="0 0 800 1131" xmlns="http://www.w3.org/2000/svg">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Sofia&amp;family=Montserrat:wght@400;600;700&amp;family=Playfair+Display:ital,wght@1,500&amp;display=swap');
      .title-caps { font-family: 'Montserrat', sans-serif; font-size: 24px; font-weight: 700; letter-spacing: 7px; fill: #16221a; }
      .cursive-names { font-family: 'Sofia', cursive; font-size: 58px; fill: #4a6c52; }
      .meta-date { font-family: 'Montserrat', sans-serif; font-size: 14.5px; font-weight: 600; letter-spacing: 3px; fill: #6c8e74; }
      .rec-title { font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 500; fill: #16221a; }
      .rec-sub { font-family: 'Playfair Display', serif; font-style: italic; font-size: 14.5px; fill: #4a6c52; }
      .apology-note { font-family: 'Montserrat', sans-serif; font-size: 11px; font-style: italic; fill: #c0392b; }
    </style>

    <rect width="800" height="1131" fill="#ffffff"/>

    <radialGradient id="mist-tl" cx="0%" cy="0%" r="58%">
      <stop offset="0%" stop-color="#d6e8d2" stop-opacity="0.55"/>
      <stop offset="50%" stop-color="#ebf4e8" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <rect width="800" height="1131" fill="url(#mist-tl)"/>

    <radialGradient id="mist-br" cx="100%" cy="100%" r="58%">
      <stop offset="0%" stop-color="#d6e8d2" stop-opacity="0.55"/>
      <stop offset="50%" stop-color="#ebf4e8" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <rect width="800" height="1131" fill="url(#mist-br)"/>

    <circle cx="340" cy="140" r="2.2" fill="#6c8e74" opacity="0.6"/>
    <circle cx="140" cy="340" r="2.2" fill="#6c8e74" opacity="0.6"/>
    <circle cx="460" cy="990" r="2.2" fill="#6c8e74" opacity="0.6"/>
    <circle cx="660" cy="790" r="2.2" fill="#6c8e74" opacity="0.6"/>

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

    <text x="400" y="270" text-anchor="middle" class="title-caps">THE WEDDING</text>
    <text x="400" y="348" text-anchor="middle" class="cursive-names">Baskara &amp; Anindya</text>
    <text x="400" y="415" text-anchor="middle" class="meta-date">SABTU, 31 OKTOBER 2026</text>

    <text x="400" y="650" text-anchor="middle" class="rec-title">Kepada Yth.</text>
    <text x="400" y="674" text-anchor="middle" class="rec-sub">Bapak / Ibu / Saudara / i</text>

    <g transform="translate(180, 700)">
      <rect width="440" height="155" rx="16" fill="#ffffff" stroke="#cde0ca" stroke-width="1.4"/>
      <rect x="6" y="6" width="428" height="143" rx="12" fill="none" stroke="#dceadc" stroke-width="0.9" stroke-dasharray="6,4"/>
    </g>

    <text x="400" y="885" text-anchor="middle" class="apology-note">Mohon maaf apabila ada kesalahan dalam penulisan nama / gelar</text>
  </svg>
  `;

  const buf = await sharp(Buffer.from(fullSvg)).png().toBuffer();
  fs.writeFileSync('scratch/full_verdant_preview.png', buf);
  console.log('Saved scratch/full_verdant_preview.png');
}

testVerdant().catch(console.error);

