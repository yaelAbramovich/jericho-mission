// עונות פס הקרב. עונה 1 כתובה ביד (rewards.js + pass-data.js). עונה 2 ואילך נוצרות כאן מתבנית וערכת נושא
// (מדבר / ים / חלל / יער, וחוזר חלילה) – כך תמיד יש עונה הבאה. כל עונה: 20 דרגות עם פרס חינם ופרס זהב, ~31 פריטים חדשים,
// ו"הפתעת סוף עונה" שמקבלים כשמסיימים. הפריטים נוצרים בצורה דטרמיניסטית (אותם מזהים בכל טעינה) ומתווספים ל-ITEMS.
import { ITEMS } from './rewards.js';

export const THEMES = [
  { id: 'desert', name: 'מסע במדבר', icon: '🏜️', glyph: '🌵', words: ['המדבר', 'הדיונות', 'הנווה', 'השרב', 'החולות', 'הקרוואן'],
    pal: [['#c8793a', '#ffd27a'], ['#7a3b12', '#ffb347'], ['#2b8a8a', '#9ef0e8'], ['#b5651d', '#f2e2b0']], emotes: [['🐪', 'גמל'], ['🌵', 'קקטוס'], ['☀️', 'שמש לוהטת'], ['🦂', 'עקרב']] },
  { id: 'sea', name: 'עומק הים', icon: '🌊', glyph: '🌊', words: ['הים', 'השונית', 'הגלים', 'המצולות', 'הלגונה', 'האוקיינוס'],
    pal: [['#0a4a8a', '#6fe6ff'], ['#0b6b6b', '#9efcff'], ['#1b2a8a', '#7aa7ff'], ['#0aa3c2', '#e0fbff']], emotes: [['🐠', 'דג'], ['🐙', 'תמנון'], ['🦈', 'כריש'], ['🐳', 'לוויתן']] },
  { id: 'space', name: 'מסע בחלל', icon: '🚀', glyph: '⭐', words: ['החלל', 'הכוכבים', 'הירח', 'הגלקסיה', 'השביט', 'הקוסמוס'],
    pal: [['#2a1052', '#b47cff'], ['#0b0b2a', '#ffe14a'], ['#3a1c71', '#ff7ae0'], ['#10243d', '#35b8ff']], emotes: [['🚀', 'טיל חלל'], ['👽', 'חייזר'], ['🪐', 'כוכב לכת'], ['☄️', 'שביט']] },
  { id: 'forest', name: 'היער הקסום', icon: '🌲', glyph: '🍃', words: ['היער', 'העצים', 'הנחל', 'השביל', 'הצל', 'הקשת'],
    pal: [['#0f5a2a', '#b6ff3c'], ['#3d2a00', '#35e08a'], ['#1c3b43', '#8ef0a0'], ['#6b4a12', '#ffe27a']], emotes: [['🦊', 'שועל'], ['🍄', 'פטרייה'], ['🦉', 'ינשוף'], ['🌈', 'קשת בענן']] },
];
export const themeOf = n => THEMES[(n - 2 + THEMES.length * 100) % THEMES.length];

// שמות: בסיס לפי סוג + מילת נושא. (מעבר לעונה 5 הערכות חוזרות, ולכן מוסיפים מספר עונה כדי שהשמות יהיו שונים)
const BASE = {
  avatar: ['לוחם', 'שומר', 'צייד', 'אלוף'], title: ['נווד', 'מגן', 'מגלה', 'מלך', 'אגדת'], jersey: ['חולצת', 'מדי', 'חולצת קפטן', 'חולצת אלוף'],
  banner: ['אופק', 'סוד', 'קסם'], fx: ['חגיגת', 'סערת', 'מטר', 'זיקוקי'], trail: ['זנב', 'שובל'], ball: ['כדור', 'כדור קסם'], pitch: ['מגרש'], keeper: ['שוער', 'שוער-על'],
};
const SHAPES = ['round', 'hex', 'horn', 'mask'], ACCS = ['headband', 'ears', 'halo', 'antenna', 'crown'], PATS = ['stripes', 'diag', 'halves', 'chevron', 'sash', 'plain'];
const SHOWS = ['goldrain', 'flames', 'stars', 'hearts', 'lightning', 'fireworks', 'crowd', 'confetti'], TFX = ['plain', 'gold', 'fire', 'ice', 'rainbow'];
const ANIMS = ['bounce', 'spin', 'shake', 'drop', 'pulse', 'float', 'rocket'], SNDS = ['boom', 'sparkle', 'whoosh', 'ding', 'fanfare', 'roar', 'thunder', 'crash', 'flame'];

// פריסת הפרסים (זהה בכל עונה): [סוג, אינדקס] = פריט, {p:'fifty',n} = כוח, {box:n} = קופסה
const pw = (p, n) => ({ power: p, n }), box = n => ({ box: n });
const LAYOUT = {
  free: { 1: [['emote', 0]], 2: [pw('fifty', 1)], 3: [['title', 0]], 4: [['jersey', 0]], 5: [['avatar', 0]], 6: [box(1)], 7: [['trail', 0]], 8: [['banner', 0]], 9: [pw('time', 1)], 10: [['fx', 0]],
    11: [pw('retry', 1)], 12: [['ball', 0]], 13: [['emote', 1], box(1)], 14: [['jersey', 1]], 15: [['pitch', 0]], 16: [['keeper', 0]], 17: [pw('fifty', 2)], 18: [['banner', 1]], 19: [['title', 1], box(1)], 20: [['avatar', 1], box(1)] },
  gold: { 1: [pw('fifty', 3)], 2: [box(1)], 3: [['emote', 2]], 4: [pw('time', 3)], 5: [['jersey', 2]], 6: [box(1)], 7: [pw('retry', 2)], 8: [['title', 2], ['banner', 2]], 9: [pw('fifty', 5)], 10: [['avatar', 2], box(1)],
    11: [box(1)], 12: [['fx', 1], pw('time', 3)], 13: [['emote', 3]], 14: [['trail', 1], pw('retry', 3)], 15: [['ball', 1]], 16: [box(2)], 17: [['keeper', 1], pw('fifty', 5)], 18: [['fx', 2]], 19: [pw('time', 5), pw('retry', 2)], 20: [['jersey', 3], ['title', 3], box(2)] },
};
// הפתעת סוף עונה: פריטים אגדיים + קופסאות + כוחות
const FINALE = { items: [['avatar', 3], ['title', 4], ['fx', 3]], boxes: 2, power: { fifty: 3, time: 3, retry: 3 } };
const MS = [5, 10, 15, 20];
export const SEASON_TIERS = 20;

const cache = {};
function make(n, theme, type, k, track, tier, finale) {
  const pal = theme.pal, [c1, c2] = pal[(k + (type.length % 3)) % pal.length], [d1] = pal[(k + 1) % pal.length];
  const words = theme.words, word = words[(k * 2 + type.length) % words.length], suffix = n > THEMES.length + 1 ? ` ${n}` : '';
  const rarity = finale || (track === 'gold' && MS.includes(tier)) || MS.includes(tier) ? 'legendary' : track === 'gold' ? 'epic' : tier <= 5 ? 'common' : tier <= 10 ? 'rare' : 'epic';
  const id = `s${n}_${type}${k}`, how = finale ? { season: n, finale: true } : { season: n, track, tier };
  let name, p;
  if (type === 'emote') { const [ch, nm] = theme.emotes[k % theme.emotes.length]; name = nm + suffix; p = { ch, anim: ANIMS[(n + k) % ANIMS.length], snd: SNDS[(n * 2 + k) % SNDS.length] }; }
  else {
    name = `${BASE[type][k % BASE[type].length]} ${word}${suffix}`;
    if (type === 'avatar') p = { c1, c2, shape: SHAPES[(k + n) % SHAPES.length], acc: finale || k === 1 && tier === 20 ? 'crown' : ACCS[(k + n) % (ACCS.length - 1)] };
    else if (type === 'jersey') p = { c1, c2, pat: PATS[(k + n) % PATS.length], n: String(1 + ((k * 7 + n * 5) % 99)) };
    else if (type === 'banner') p = { g: [c1, c2, d1] };
    else if (type === 'ball') p = { c1: c2, c2: c1 };
    else if (type === 'trail') p = { colors: [c1, c2, '#ffffff'], glyph: theme.glyph, glow: c2 };
    else if (type === 'fx') p = { colors: [c1, c2, '#ffffff'], glyph: theme.glyph, show: SHOWS[(n + k * 2) % SHOWS.length] };
    else if (type === 'pitch') p = { sky: c1, g1: d1, g2: c1 };
    else if (type === 'keeper') p = { k1: c1, k2: c2, glove: '#ffffff' };
    else if (type === 'title') { name = `${BASE.title[k]} ${word}${suffix}`; p = { fx: finale ? 'rainbow' : TFX[(k + n) % TFX.length] }; }
  }
  return { id, type, name, how, rarity, p };
}

// בונה עונה: { items, free:{tier:[reward]}, gold:{tier:[reward]}, finale:{ items:[id], boxes, power } }
export function buildSeason(n) {
  if (cache[n]) return cache[n];
  const theme = themeOf(n), items = [], out = { n, theme, items, free: {}, gold: {}, finale: { items: [], boxes: FINALE.boxes, power: { ...FINALE.power } } };
  for (const track of ['free', 'gold']) for (let t = 1; t <= SEASON_TIERS; t++) {
    out[track][t] = LAYOUT[track][t].map(slot => {
      if (!Array.isArray(slot)) return slot;
      const it = make(n, theme, slot[0], slot[1], track, t, false); items.push(it); return { item: it.id };
    });
  }
  for (const [type, k] of FINALE.items) { const it = make(n, theme, type, k, 'gold', 20, true); items.push(it); out.finale.items.push(it.id); }
  // מאגר לקופסאות המסתורין של העונה: פריטים נוספים בנושא העונה (נפתחים רק מקופסה)
  ['avatar', 'jersey', 'banner', 'ball', 'trail', 'fx'].forEach((type, i) => {
    const it = make(n, theme, type, 4 + i, 'free', 0, false);
    it.id = `s${n}_box_${type}`; it.how = { box: true }; it.rarity = i % 3 === 2 ? 'epic' : 'rare'; items.push(it);
  });
  return (cache[n] = out);
}
// מוודא שכל פריטי העונות 2..n קיימים ב-ITEMS (לקריאה בעליית האפליקציה ובמעבר עונה)
export function ensureSeason(n) {
  const have = new Set(ITEMS.map(i => i.id));
  for (let s = 2; s <= n; s++) for (const it of buildSeason(s).items) if (!have.has(it.id)) { ITEMS.push(it); have.add(it.id); }
}
