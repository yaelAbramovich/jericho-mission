// מפת המשימה של "חשבון": מעבדת מספרים – רשת זוהרת וספרות צפות. המנוע מצייר מעל הרקע את האזורים ואת המסלול.
export const MAP = {
  positions: { 1: [96, 96], 2: [264, 240], 3: [110, 392] },
  background: `
    <defs>
      <pattern id="mgrid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#2b3f86" stroke-width=".7" opacity=".55"/></pattern>
      <radialGradient id="mglow" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#6d7bff" stop-opacity=".35"/><stop offset="1" stop-color="#6d7bff" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="360" height="520" fill="#080d24"/>
    <rect width="360" height="520" fill="url(#mgrid)"/>
    <circle cx="260" cy="120" r="130" fill="url(#mglow)"/><circle cx="90" cy="430" r="120" fill="url(#mglow)"/>
    <g font-family="Rubik, Arial" font-weight="800" fill="#7f93ff" opacity=".35" font-size="30">
      <text x="250" y="70">0.1</text><text x="28" y="200">×10</text><text x="270" y="360">:100</text><text x="215" y="470">0.05</text><text x="30" y="300">1,000</text><text x="150" y="30">.</text>
    </g>
    <text x="40" y="500" class="cmp">מעבדת המספרים</text>
  `,
};
