// פס קרב: כל TIER_XP נקודות פותחות פריט קוסמטי מקורי (הכול SVG/CSS שנוצר בקוד).
export const TIER_XP = 60;

// type: avatar | banner | jersey | emote
export const ITEMS = [
  { id: 'a0', type: 'avatar', name: 'טירון', tier: 0, p: { c1: '#3a4a63', c2: '#6df0ff', shape: 'round' } },
  { id: 'b0', type: 'banner', name: 'בסיס', tier: 0, p: { g: ['#1b2540', '#2a3a63'] } },
  { id: 'j0', type: 'jersey', name: 'אימון', tier: 0, p: { c1: '#46536f', c2: '#6c7ca0', pat: 'plain', n: '0' } },

  { id: 'e1', type: 'emote', name: 'להבה', tier: 1, p: { ch: '🔥' } },
  { id: 'b1', type: 'banner', name: 'זריחה בירדן', tier: 2, p: { g: ['#ff7a18', '#ff2e7e'] } },
  { id: 'a1', type: 'avatar', name: 'צל', tier: 3, p: { c1: '#1c3b43', c2: '#37ffb0', shape: 'hex' } },
  { id: 'j1', type: 'jersey', name: 'פסי ניאון', tier: 4, p: { c1: '#0e1a2b', c2: '#2effd2', pat: 'stripes', n: '7' } },
  { id: 'e2', type: 'emote', name: 'בום', tier: 5, p: { ch: '💥' } },
  { id: 'a2', type: 'avatar', name: 'ברק', tier: 6, p: { c1: '#4a3b10', c2: '#ffe14a', shape: 'horn' } },
  { id: 'b2', type: 'banner', name: 'סערה', tier: 7, p: { g: ['#3a1c71', '#8e2de2', '#00e5ff'] } },
  { id: 'j2', type: 'jersey', name: 'יהלום', tier: 8, p: { c1: '#10243d', c2: '#35b8ff', pat: 'diag', n: '10' } },
  { id: 'e3', type: 'emote', name: 'בול', tier: 9, p: { ch: '🎯' } },
  { id: 'a3', type: 'avatar', name: 'חותך', tier: 10, p: { c1: '#4a1620', c2: '#ff4d6d', shape: 'mask' } },
  { id: 'b3', type: 'banner', name: 'מפת זהב', tier: 11, p: { g: ['#3b2a05', '#c99a1f', '#ffe27a'] } },
  { id: 'j3', type: 'jersey', name: 'חצויים', tier: 12, p: { c1: '#ff2e63', c2: '#12121f', pat: 'halves', n: '9' } },
  { id: 'e4', type: 'emote', name: 'קור רוח', tier: 13, p: { ch: '🧊' } },
  { id: 'a4', type: 'avatar', name: 'רוח רפאים', tier: 14, p: { c1: '#d7e2f2', c2: '#7a5cff', shape: 'round' } },
  { id: 'b4', type: 'banner', name: 'גל קריסטל', tier: 15, p: { g: ['#031b34', '#0aa3c2', '#9efcff'] } },
  { id: 'j4', type: 'jersey', name: 'חץ', tier: 16, p: { c1: '#1a0f33', c2: '#b47cff', pat: 'chevron', n: '11' } },
  { id: 'e5', type: 'emote', name: 'כתר', tier: 17, p: { ch: '👑' } },
  { id: 'a5', type: 'avatar', name: 'קומנדו', tier: 18, p: { c1: '#27401d', c2: '#b6ff3c', shape: 'hex' } },
  { id: 'b5', type: 'banner', name: 'אש וקרח', tier: 19, p: { g: ['#ff3d00', '#7a1fa2', '#00c2ff'] } },
  { id: 'j5', type: 'jersey', name: 'אלוף העונה', tier: 20, p: { c1: '#17120a', c2: '#ffcf33', pat: 'sash', n: '1' } },
  // נפתח במבחן הסיכום
  { id: 'ax', type: 'avatar', name: 'אלוף יריחו', tier: 'exam', p: { c1: '#3d2a00', c2: '#ffe27a', shape: 'horn' } },
];
export const MAX_TIER = 20;
export const itemById = id => ITEMS.find(i => i.id === id);
export const itemsByType = t => ITEMS.filter(i => i.type === t);
export const unlockedAt = tier => ITEMS.filter(i => i.tier === tier);
export function isUnlocked(item, xpTier, examDone) {
  if (item.tier === 'exam') return !!examDone;
  return item.tier <= xpTier;
}

// ---------- ציור ----------
export function art(item, size = 64) {
  const p = item.p;
  if (item.type === 'emote') return `<span class="emote-art" style="font-size:${size * 0.7}px">${p.ch}</span>`;
  if (item.type === 'banner') {
    return `<div class="banner-art" style="background:linear-gradient(110deg,${p.g.join(',')});height:${size * 0.6}px"><i></i></div>`;
  }
  if (item.type === 'jersey') return jersey(p, size);
  return avatar(p, size);
}

function avatar({ c1, c2, shape }, s) {
  const head = {
    round: `<circle cx="32" cy="28" r="15" fill="${c1}"/>`,
    hex: `<path d="M32 11l15 8v18l-15 8-15-8V19z" fill="${c1}"/>`,
    horn: `<circle cx="32" cy="29" r="14" fill="${c1}"/><path d="M19 22l-6-12 12 7zM45 22l6-12-12 7z" fill="${c2}"/>`,
    mask: `<path d="M17 24q0-14 15-14t15 14v12q0 9-15 9t-15-9z" fill="${c1}"/><path d="M20 40h24v8H20z" fill="${c2}" opacity=".35"/>`,
  }[shape];
  return `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><rect width="64" height="64" rx="14" fill="#0c1220"/>
  <path d="M8 64q0-17 24-17t24 17z" fill="${c1}"/>${head}
  <rect x="20" y="24" width="24" height="9" rx="4.5" fill="${c2}"/><rect x="20" y="24" width="24" height="9" rx="4.5" fill="none" stroke="#fff" stroke-opacity=".35"/></svg>`;
}
let jid = 0;
function jersey({ c1, c2, pat, n }, s) {
  const id = 'jc' + (jid++);
  const shirt = 'M30 8L10 22l10 16 8-6v60h44V32l8 6 10-16L70 8Q50 24 30 8z';
  const shirtFix = 'M30 8L10 22l10 16 8-6v58h44V32l8 6 10-16L70 8Q50 24 30 8z';
  const pats = {
    plain: '',
    stripes: [0, 1, 2, 3, 4].map(i => `<rect x="${24 + i * 14}" y="0" width="7" height="100" fill="${c2}"/>`).join(''),
    diag: [0, 1, 2, 3].map(i => `<rect x="${-20 + i * 28}" y="0" width="10" height="140" fill="${c2}" transform="skewX(-20)"/>`).join(''),
    halves: `<rect x="50" y="0" width="60" height="100" fill="${c2}"/>`,
    chevron: [0, 1, 2].map(i => `<path d="M20 ${40 + i * 16}l30 14 30-14v8L50 62 20 48z" fill="${c2}"/>`).join(''),
    sash: `<path d="M20 30L80 90v-18L28 20z" fill="${c2}"/>`,
  }[pat];
  const numFill = pat === 'halves' || pat === 'sash' ? '#fff' : c2;
  return `<svg viewBox="0 0 100 100" width="${s}" height="${s}"><defs><clipPath id="${id}"><path d="${shirtFix}"/></clipPath></defs>
  <path d="${shirtFix}" fill="${c1}"/><g clip-path="url(#${id})">${pats}</g>
  <path d="${shirtFix}" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.5"/>
  <text x="50" y="68" text-anchor="middle" font-size="26" font-weight="900" fill="${numFill}" stroke="#000" stroke-opacity=".4" stroke-width=".8" font-family="Rubik,sans-serif">${n}</text></svg>`;
}
