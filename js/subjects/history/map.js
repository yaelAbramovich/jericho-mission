// מפת המשימה של "יוון העתיקה": הים האגאי, איים וקווי חוף. המנוע מצייר מעל הרקע את האזורים ואת המסלול.
export const MAP = {
  positions: { 1: [96, 45], 2: [264, 115], 3: [96, 185], 4: [264, 255], 5: [96, 325], 6: [264, 395], 7: [96, 465] },
  background: `
    <defs><linearGradient id="hsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a2a4a"/><stop offset="1" stop-color="#06162e"/></linearGradient>
      <radialGradient id="hglow" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#4fc3ff" stop-opacity=".3"/><stop offset="1" stop-color="#4fc3ff" stop-opacity="0"/></radialGradient></defs>
    <rect width="360" height="520" fill="url(#hsea)"/>
    <circle cx="260" cy="130" r="130" fill="url(#hglow)"/><circle cx="90" cy="400" r="120" fill="url(#hglow)"/>
    <g fill="#1d4f73" opacity=".55"><path d="M0 0h120c-20 40 10 70-15 110s-40 90-10 140-30 100-95 100z"/><path d="M300 460c20-30 50-20 60-40v100h-80z"/><ellipse cx="200" cy="250" rx="20" ry="9"/><ellipse cx="230" cy="350" rx="14" ry="7"/><ellipse cx="170" cy="480" rx="26" ry="9"/></g>
    <g fill="none" stroke="#7fb7e6" stroke-width="1.4" opacity=".3"><path d="M20 230q20-10 40 0t40 0t40 0"/><path d="M200 40q20-10 40 0t40 0"/><path d="M150 420q20-10 40 0t40 0"/></g>
    <g font-family="Rubik, Arial" font-weight="800" fill="#9fd3ff" opacity=".28" font-size="26"><text x="220" y="190">Ω</text><text x="30" y="330">Δ</text><text x="260" y="400">Φ</text><text x="140" y="110">Σ</text></g>
    <text x="180" y="508" class="cmp">יוון העתיקה</text>
  `,
};
