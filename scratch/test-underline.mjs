import sharp from 'sharp';

const testSvg = (w) => `
<svg width="400" height="100" viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700&amp;display=swap');
    .title-caps { font-family: 'Montserrat', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 5.5px; fill: #102233; }
  </style>
  <rect width="400" height="100" fill="#ffffff"/>
  <g transform="translate(200, 45)">
    <text x="0" y="0" text-anchor="middle" class="title-caps">THE WEDDING</text>
    <line x1="${-w/2}" y1="10" x2="${w/2}" y2="10" stroke="#b8944d" stroke-width="1.2" stroke-linecap="round"/>
  </g>
</svg>
`;

async function main() {
  await sharp(Buffer.from(testSvg(180))).png().toFile('scratch/test_underline_180.png');
  await sharp(Buffer.from(testSvg(190))).png().toFile('scratch/test_underline_190.png');
  await sharp(Buffer.from(testSvg(200))).png().toFile('scratch/test_underline_200.png');
  console.log('Rendered test underlines');
}

main();

