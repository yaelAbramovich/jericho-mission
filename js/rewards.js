// פס קרב: כל TIER_XP נקודות פותחות פריט קוסמטי מקורי (הכול SVG/CSS שנוצר בקוד).
export const TIER_XP = 60;

// type: avatar | banner | jersey | emote | ball | fx (חגיגת גול) | pitch (מגרש) | keeper (שוער)
// פתיחה: tier מספרי = דרגה בפס הקרב, 'exam' = מבחן הסיכום, 'custom' = תמיד פתוח,
// ו-how:{ch:n} = כיבוש אזור, how:{ach:'id'} = הישג.
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
  // ברירות מחדל לסוגים החדשים
  { id: 'ba0', type: 'ball', name: 'כדור רגיל', tier: 0, p: { kind: 'classic' } },
  { id: 'fx0', type: 'fx', name: 'קונפטי', tier: 0, p: { colors: ['#2effd2', '#ffe14a', '#ff4d9d', '#6d7bff'] } },
  { id: 'pt0', type: 'pitch', name: 'מגרש לילה', tier: 0, p: { sky: '#0b1d2e', g1: '#0e4a32', g2: '#0a3a28' } },
  { id: 'kp0', type: 'keeper', name: 'שוער צהוב', tier: 0, p: { k1: '#ffe14a', k2: '#ff9d00', glove: '#2effd2' } },
  // פס הקרב – כדורים, חגיגות, מגרשים ושוערים (באותן דרגות, כפרס שני)
  { id: 'ba1', type: 'ball', name: 'כדור ניאון', tier: 3, p: { c1: '#2effd2', c2: '#032a24' } },
  { id: 'fx1', type: 'fx', name: 'גשם זהב', tier: 4, p: { colors: ['#ffe27a', '#ffcf33', '#fff3b0', '#c99a1f'] } },
  { id: 'kp1', type: 'keeper', name: 'שוער אדום', tier: 5, p: { k1: '#ff4d6d', k2: '#a3122e', glove: '#ffffff' } },
  { id: 'pt1', type: 'pitch', name: 'ערב סגול', tier: 6, p: { sky: '#2a1052', g1: '#136a4a', g2: '#0c5238' } },
  { id: 'ba2', type: 'ball', name: 'כדור אש', tier: 9, p: { c1: '#ff7a18', c2: '#7a1c00' } },
  { id: 'fx2', type: 'fx', name: 'להבות', tier: 10, p: { colors: ['#ff7a18', '#ff2e4d', '#ffe14a'], glyph: '🔥' } },
  { id: 'pt2', type: 'pitch', name: 'מדבר יריחו', tier: 12, p: { sky: '#7a3b12', g1: '#8a6a2a', g2: '#6e5220' } },
  { id: 'kp2', type: 'keeper', name: 'שוער קרח', tier: 14, p: { k1: '#9efcff', k2: '#0aa3c2', glove: '#ffffff' } },
  { id: 'ba3', type: 'ball', name: 'כדור קריסטל', tier: 15, p: { c1: '#9efcff', c2: '#0a4a6a' } },
  { id: 'fx3', type: 'fx', name: 'כוכבים', tier: 16, p: { colors: ['#ffe14a', '#ffffff', '#9efcff'], glyph: '⭐' } },
  { id: 'pt3', type: 'pitch', name: 'שקיעה', tier: 18, p: { sky: '#ff6a3d', g1: '#0f5a3a', g2: '#0a4430' } },
  // פרסים על כיבוש אזורים (קשורים לסיפור של הפרק)
  { id: 'ec1', type: 'emote', name: 'חזק ואמץ', how: { ch: 1 }, p: { ch: '💪' } },
  { id: 'bc2', type: 'banner', name: 'חוט השני', how: { ch: 2 }, p: { g: ['#3a0010', '#d4143a', '#ff6b81'] } },
  { id: 'ptc3', type: 'pitch', name: 'גדות הירדן', how: { ch: 3 }, p: { sky: '#06324d', g1: '#0f6b66', g2: '#0a5450' } },
  { id: 'ac4', type: 'avatar', name: 'שתים עשרה אבנים', how: { ch: 4 }, p: { c1: '#5a5f6b', c2: '#ffe27a', shape: 'hex' } },
  { id: 'jc5', type: 'jersey', name: 'שר צבא ה׳', how: { ch: 5 }, p: { c1: '#101a3a', c2: '#8e5bff', pat: 'sash', n: '5' } },
  // פרסים על הישגים
  { id: 'fxa1', type: 'fx', name: 'ברק', how: { ach: 'combo9' }, p: { colors: ['#b47cff', '#00e5ff', '#ffffff'], glyph: '⚡' } },
  { id: 'ba4', type: 'ball', name: 'כדור זהב', how: { ach: 'pen5' }, p: { c1: '#ffe27a', c2: '#6b4a00' } },
  { id: 'ea1', type: 'emote', name: 'גביע', how: { ach: 'duelw' }, p: { ch: '🏆' } },
  { id: 'ea2', type: 'emote', name: 'יהלום', how: { ach: 'run10' }, p: { ch: '💎' } },
  { id: 'ea3', type: 'emote', name: 'מוח', how: { ach: 'line' }, p: { ch: '🧠' } },
  { id: 'kpa', type: 'keeper', name: 'שוער סגול', how: { ach: 'duelp' }, p: { k1: '#b47cff', k2: '#4a1fa8', glove: '#ffe14a' } },
  { id: 'pta', type: 'pitch', name: 'אצטדיון זהב', how: { ach: 'streak7' }, p: { sky: '#3b2a05', g1: '#1c6b3a', g2: '#124e2a' } },
  { id: 'bac', type: 'ball', name: 'כדור כובש יריחו', how: { ach: 'allzones' }, p: { c1: '#ffe27a', c2: '#3d2a00' } },
  // פס הקרב הזהב (how.gold = הדרגה). נפתחים רק אחרי הפעלת כרטיס הזהב ואיסוף הפרס
  { id: 'ge3', type: 'emote', name: 'חצוצרה', how: { gold: 3 }, rarity: 'rare', p: { ch: '🎺' } },
  { id: 'gj5', type: 'jersey', name: 'זהב יריחו', how: { gold: 5 }, rarity: 'legendary', p: { c1: '#3d2a00', c2: '#ffe27a', pat: 'sash', n: '5' } },
  { id: 'ge8', type: 'emote', name: 'חומה', how: { gold: 8 }, rarity: 'rare', p: { ch: '🧱' } },
  { id: 'ga10', type: 'avatar', name: 'יהושע בן נון', how: { gold: 10 }, rarity: 'legendary', p: { c1: '#7a4a1a', c2: '#ffe27a', shape: 'round', acc: 'headband' } },
  { id: 'ge13', type: 'emote', name: 'יונה', how: { gold: 13 }, rarity: 'epic', p: { ch: '🕊️' } },
  { id: 'gb15', type: 'banner', name: 'החומות נופלות', how: { gold: 15 }, rarity: 'epic', p: { g: ['#3a1c71', '#d76d77', '#ffaf7b'] } },
  { id: 'gf18', type: 'fx', name: 'חצוצרות יריחו', how: { gold: 18 }, rarity: 'epic', p: { colors: ['#ffe27a', '#ffcf33', '#fff3b0'], glyph: '🎺' } },
  { id: 'ga20', type: 'avatar', name: 'מלך יריחו', how: { gold: 20 }, rarity: 'legendary', p: { c1: '#3d2a00', c2: '#ffe27a', shape: 'horn', acc: 'crown' } },
  // מאגר קופסאות המסתורין (how.box) – נפתחים רק מקופסה
  { id: 'x1', type: 'avatar', name: 'חתלתול', how: { box: true }, rarity: 'rare', p: { c1: '#2a2a3a', c2: '#ff9ad5', shape: 'round', acc: 'ears' } },
  { id: 'x2', type: 'avatar', name: 'מלאך', how: { box: true }, rarity: 'epic', p: { c1: '#e8f0ff', c2: '#ffe27a', shape: 'round', acc: 'halo' } },
  { id: 'x3', type: 'avatar', name: 'רובוט', how: { box: true }, rarity: 'rare', p: { c1: '#46536f', c2: '#35e08a', shape: 'hex', acc: 'antenna' } },
  { id: 'x4', type: 'avatar', name: 'נינג׳ה', how: { box: true }, rarity: 'epic', p: { c1: '#10131c', c2: '#ff4d6d', shape: 'mask', acc: 'headband' } },
  { id: 'x5', type: 'jersey', name: 'ירוק זוהר', how: { box: true }, rarity: 'rare', p: { c1: '#0b3d1c', c2: '#b6ff3c', pat: 'stripes', n: '8' } },
  { id: 'x6', type: 'jersey', name: 'שחור לבן', how: { box: true }, rarity: 'common', p: { c1: '#f2f2f2', c2: '#111827', pat: 'halves', n: '3' } },
  { id: 'x7', type: 'jersey', name: 'להבה', how: { box: true }, rarity: 'epic', p: { c1: '#ff3d00', c2: '#ffcf33', pat: 'diag', n: '99' } },
  { id: 'x8', type: 'banner', name: 'לילה כוכבים', how: { box: true }, rarity: 'rare', p: { g: ['#050b2a', '#26338f', '#7a5cff'] } },
  { id: 'x9', type: 'banner', name: 'גלי ים', how: { box: true }, rarity: 'common', p: { g: ['#0a3d62', '#1e90ff', '#9eeaff'] } },
  { id: 'x10', type: 'ball', name: 'כדור קשת', how: { box: true }, rarity: 'rare', p: { c1: '#ff3d8b', c2: '#2a0a3a' } },
  { id: 'x11', type: 'ball', name: 'כדור אבן', how: { box: true }, rarity: 'common', p: { c1: '#8a8f99', c2: '#3a3f4a' } },
  { id: 'x12', type: 'fx', name: 'לבבות', how: { box: true }, rarity: 'rare', p: { colors: ['#ff3d8b', '#ff9ad5', '#ffffff'], glyph: '💜' } },
  { id: 'x13', type: 'keeper', name: 'שוער ירוק', how: { box: true }, rarity: 'common', p: { k1: '#35e08a', k2: '#0f7a45', glove: '#ffffff' } },
  { id: 'x14', type: 'keeper', name: 'שוער זהב', how: { box: true }, rarity: 'epic', p: { k1: '#ffe27a', k2: '#c99a1f', glove: '#3d2a00' } },
  { id: 'x15', type: 'pitch', name: 'חוף ים', how: { box: true }, rarity: 'rare', p: { sky: '#2a8fd6', g1: '#d9c27a', g2: '#c8aa5a' } },
  { id: 'x16', type: 'emote', name: 'צחוק', how: { box: true }, rarity: 'common', p: { ch: '😂' } },
  // החולצה שלי – מעוצבת על ידי השחקן (p מתעדכן מ-setCustomJersey)
  { id: 'jmy', type: 'jersey', name: 'החולצה שלי', tier: 'custom', p: { c1: '#1b4bd6', c2: '#ffe14a', pat: 'stripes', n: '7', name: '' } },
  // נפתח במבחן הסיכום
  { id: 'ax', type: 'avatar', name: 'אלוף יריחו', tier: 'exam', p: { c1: '#3d2a00', c2: '#ffe27a', shape: 'horn' } },
];
export const MAX_TIER = 20;
export const TYPE_LABEL = { avatar: 'דמויות', jersey: 'חולצות', banner: 'באנרים', emote: 'אימוג׳י ניצחון', ball: 'כדורים', fx: 'חגיגות גול', pitch: 'מגרשים', keeper: 'שוערים' };
export const DEFAULT_ID = { avatar: 'a0', banner: 'b0', jersey: 'j0', emote: null, ball: 'ba0', fx: 'fx0', pitch: 'pt0', keeper: 'kp0' };
export function setCustomJersey(c) { if (c) Object.assign(ITEMS.find(i => i.id === 'jmy').p, c); }
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
  if (item.type === 'ball') return ball(p, size);
  if (item.type === 'fx') return fxArt(p, size);
  if (item.type === 'pitch') return pitchArt(p, size);
  if (item.type === 'keeper') return keeperArt(p, size);
  return avatar(p, size);
}

export function ball(p, s) {
  if (p.kind === 'classic') return `<span class="emote-art" style="font-size:${s * 0.8}px">⚽</span>`;
  const { c1, c2 } = p;
  return `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><circle cx="32" cy="32" r="28" fill="${c1}" stroke="${c2}" stroke-width="3"/>
  <path d="M32 21l10 7-4 12H26l-4-12z" fill="${c2}"/>
  <path d="M32 21V8M42 28l13-4M38 40l8 11M26 40l-8 11M22 28L9 24" stroke="${c2}" stroke-width="3" stroke-linecap="round" fill="none"/>
  <ellipse cx="22" cy="18" rx="7" ry="4" fill="#fff" opacity=".35" transform="rotate(-30 22 18)"/></svg>`;
}
function fxArt({ colors, glyph }, s) {
  const dots = colors.concat(colors).slice(0, 6).map((c, i) => `<i style="background:${c};left:${[10, 40, 70, 25, 55, 82][i]}%;top:${[18, 8, 22, 58, 52, 62][i]}%"></i>`).join('');
  return `<div class="fx-art" style="width:${s}px;height:${s}px">${dots}${glyph ? `<b style="font-size:${s * 0.42}px">${glyph}</b>` : ''}</div>`;
}
function pitchArt({ sky, g1, g2 }, s) {
  return `<div class="pitch-art" style="height:${s * 0.6}px;background:linear-gradient(180deg,${sky} 0 40%,${g1} 40%,${g2})"><i></i></div>`;
}
function keeperArt({ k1, k2, glove }, s) {
  return `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><rect width="64" height="64" rx="14" fill="#0c1220"/>
  <defs><linearGradient id="kg${k1.slice(1)}${k2.slice(1)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${k1}"/><stop offset="1" stop-color="${k2}"/></linearGradient></defs>
  <circle cx="32" cy="17" r="8" fill="#ffd9b0"/><rect x="21" y="26" width="22" height="26" rx="6" fill="url(#kg${k1.slice(1)}${k2.slice(1)})"/>
  <circle cx="14" cy="33" r="7" fill="${glove}"/><circle cx="50" cy="33" r="7" fill="${glove}"/></svg>`;
}

function avatar({ c1, c2, shape, acc }, s) {
  const head = {
    round: `<circle cx="32" cy="28" r="15" fill="${c1}"/>`,
    hex: `<path d="M32 11l15 8v18l-15 8-15-8V19z" fill="${c1}"/>`,
    horn: `<circle cx="32" cy="29" r="14" fill="${c1}"/><path d="M19 22l-6-12 12 7zM45 22l6-12-12 7z" fill="${c2}"/>`,
    mask: `<path d="M17 24q0-14 15-14t15 14v12q0 9-15 9t-15-9z" fill="${c1}"/><path d="M20 40h24v8H20z" fill="${c2}" opacity=".35"/>`,
  }[shape];
  const extra = {
    crown: `<path d="M19 15l4-9 5 6 4-8 4 8 5-6 4 9z" fill="${c2}" stroke="#0007" stroke-width=".8"/>`,
    ears: `<path d="M19 20l-3-13 11 7zM45 20l3-13-11 7z" fill="${c1}"/><path d="M20 17l-1-6 5 3zM44 17l1-6-5 3z" fill="${c2}"/>`,
    halo: `<ellipse cx="32" cy="8" rx="12" ry="3.5" fill="none" stroke="${c2}" stroke-width="2.5"/>`,
    headband: `<rect x="17" y="19" width="30" height="5" rx="2.5" fill="${c2}"/><path d="M46 21l8-3-2 8z" fill="${c2}"/>`,
    antenna: `<path d="M32 11V4" stroke="${c2}" stroke-width="2.5"/><circle cx="32" cy="4" r="3" fill="${c2}"/>`,
  }[acc] || '';
  return `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><rect width="64" height="64" rx="14" fill="#0c1220"/>
  <path d="M8 64q0-17 24-17t24 17z" fill="${c1}"/>${head}${extra}
  <rect x="20" y="24" width="24" height="9" rx="4.5" fill="${c2}"/><rect x="20" y="24" width="24" height="9" rx="4.5" fill="none" stroke="#fff" stroke-opacity=".35"/></svg>`;
}
let jid = 0;
function jersey({ c1, c2, pat, n, name }, s) {
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
 ${name ? `<text x="50" y="46" text-anchor="middle" font-size="${name.length > 7 ? 9 : 11}" font-weight="800" fill="${numFill}" stroke="#000" stroke-opacity=".4" stroke-width=".5" font-family="Rubik,sans-serif">${name.replace(/[<>&"]/g, '')}</text>` : ''}
  <text x="50" y="68" text-anchor="middle" font-size="26" font-weight="900" fill="${numFill}" stroke="#000" stroke-opacity=".4" stroke-width=".8" font-family="Rubik,sans-serif">${n}</text></svg>`;
}
