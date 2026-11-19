// מפת המשימה של "שברים": שולחן פיצות חם. המנוע מצייר מעל הרקע את האזורים ואת המסלול.
export const MAP = {
  positions: { 1: [110, 120], 2: [250, 300] },
  background: `
    <defs><radialGradient id="fglow" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#ffb347" stop-opacity=".35"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs>
    <rect width="360" height="520" fill="#1a0f12"/>
    <circle cx="100" cy="120" r="140" fill="url(#fglow)"/><circle cx="270" cy="320" r="140" fill="url(#fglow)"/>
    <g fill="none" stroke="#ffb347" stroke-width="2" opacity=".32" stroke-linejoin="round">
      <circle cx="290" cy="90" r="46"/><path d="M290 44 V136 M244 90 H336 M257 57 L323 123 M323 57 L257 123"/>
      <circle cx="60" cy="400" r="40"/><path d="M60 360 V440 M20 400 H100 M32 372 L88 428 M88 372 L32 428"/>
      <path d="M170 450 h120 v34 h-120z M200 450 v34 M230 450 v34 M260 450 v34"/>
    </g>
    <text x="180" y="505" class="cmp">מעבדת השברים</text>
  `,
};
