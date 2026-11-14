// מפת המשימה של "מדעים": תחנת מחקר בחלל. המנוע מצייר מעל הרקע את האזורים ואת המסלול ביניהם.
export const MAP = {
  positions: { 1: [92, 92], 2: [268, 172], 3: [92, 266], 4: [268, 358], 5: [112, 448] },
  background: `
    <defs>
      <radialGradient id="planet" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#3a7bd5"/><stop offset="1" stop-color="#0b1f4a"/></radialGradient>
      <pattern id="stars" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="8" cy="12" r="1" fill="#cfe"/><circle cx="40" cy="30" r="1.4" fill="#fff"/><circle cx="22" cy="50" r=".8" fill="#9df"/></pattern>
    </defs>
    <rect width="360" height="520" fill="#060a1c"/>
    <rect width="360" height="520" fill="url(#stars)" opacity=".7"/>
    <circle cx="300" cy="470" r="120" fill="url(#planet)" opacity=".85"/>
    <circle cx="300" cy="470" r="120" fill="none" stroke="#6fe6ff" stroke-width="2" opacity=".4"/>
    <ellipse cx="60" cy="40" rx="70" ry="22" fill="none" stroke="#b47cff" stroke-width="2" stroke-dasharray="4 8" opacity=".5" class="stormring"/>
    <text x="40" y="500" class="cmp">תחנת המחקר</text>
  `,
};
