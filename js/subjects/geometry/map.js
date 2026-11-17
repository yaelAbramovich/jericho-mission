// מפת המשימה של "גיאומטריה": חלל כחול-סגול עם גופים צפים. המנוע מצייר מעל הרקע את האזורים ואת המסלול.
export const MAP = {
  positions: { 1: [100, 100], 2: [260, 230], 3: [110, 370] },
  background: `
    <defs><radialGradient id="gglow" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#b47cff" stop-opacity=".35"/><stop offset="1" stop-color="#b47cff" stop-opacity="0"/></radialGradient></defs>
    <rect width="360" height="520" fill="#0a0a26"/>
    <circle cx="270" cy="110" r="130" fill="url(#gglow)"/><circle cx="90" cy="400" r="130" fill="url(#gglow)"/>
    <g fill="none" stroke="#8e7bff" stroke-width="2" opacity=".35" stroke-linejoin="round">
      <path d="M250 40 l30 -14 l30 14 v34 l-30 14 l-30 -14z M250 40 l30 14 l30 -14 M280 54 v34"/>
      <path d="M40 160 l36 -40 l36 40z M40 160 l36 14 l36 -14 M76 120 v54"/>
      <path d="M230 400 h70 v50 h-70z M230 400 l22 -16 h70 l-22 16 M322 384 l-22 16 M322 384 v50 l-22 16"/>
      <path d="M30 470 l28 -18 l28 18 v28 h-56z"/>
    </g>
    <text x="180" y="505" class="cmp">מעבדת הגופים</text>
  `,
};
