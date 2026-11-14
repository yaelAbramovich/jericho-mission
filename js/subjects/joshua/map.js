// מפת המשימה של מקצוע "יהושע": מיקומי האזורים ואיור הרקע (נהר הירדן). המנוע מצייר מעליהם את האזורים ואת המסלול.
// כל מקצוע מגדיר מפה משלו: positions = מיקום כל אזור (x, y ב-viewBox של 360×520), background = קוד SVG לרקע.
export const MAP = {
  positions: { 1: [292, 92], 2: [72, 165], 3: [186, 262], 4: [92, 362], 5: [82, 458] },
  background: `
    <defs>
      <pattern id="hex" width="28" height="48.5" patternUnits="userSpaceOnUse" patternTransform="scale(.9)"><path d="M14 0l14 8v16l-14 8-14-8V8zM14 32l14 8v8.5M14 32L0 40v8.5" fill="none" stroke="#7df" stroke-opacity=".08"/></pattern>
      <linearGradient id="land" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16301f"/><stop offset="1" stop-color="#0d1c2a"/></linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="360" height="520" fill="#070c18"/>
    <path d="M0 0H190C150 90 230 150 185 230S140 380 190 520H0z" fill="url(#land)"/>
    <path d="M360 0H190C150 90 230 150 185 230S140 380 190 520H360z" fill="#1a2a20"/>
    <path d="M190 0C150 90 230 150 185 230S140 380 190 520" fill="none" stroke="#0b4f7c" stroke-width="46" opacity=".9"/>
    <path d="M190 0C150 90 230 150 185 230S140 380 190 520" fill="none" stroke="#35c9ff" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round" opacity=".7" class="flow"/>
    <rect width="360" height="520" fill="url(#hex)"/>
    <circle cx="170" cy="290" r="250" fill="none" stroke="#a24bff" stroke-width="3" stroke-dasharray="6 10" opacity=".55" class="stormring"/>
    <circle cx="170" cy="290" r="330" fill="none" stroke="#a24bff" stroke-width="40" opacity=".08"/>
    <text x="330" y="22" class="cmp">מזרח</text><text x="30" y="22" class="cmp">מערב</text>
    <text x="196" y="500" class="cmp river">הירדן</text>
  `,
};
