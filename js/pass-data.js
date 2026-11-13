// פס הקרב: טבלת הפרסים (נתונים בלבד, בלי DOM). כל דרגה = שורה עם פרס חינם (מימין) ופרס זהב (משמאל).
// פרס: { item: id } | { power: 'fifty' | 'time' | 'retry', n } | { box: n }
import { ITEMS, itemById, MAX_TIER } from './rewards.js';

export const POWER = {
  fifty: { icon: '½', name: 'מחק 2 תשובות', short: 'מחיקת תשובות', desc: 'בשאלה עם 4 תשובות – מוחק 2 תשובות שגויות. עוזר ב„מי אמר?", בפנדלים (התאמה) ובדו-קרב.' },
  time: { icon: '⏱️', name: 'עוד 10 שניות', short: 'עוד זמן', desc: 'במשחק „הסערה המתקרבת" – מוסיף 10 שניות לשעון.' },
  retry: { icon: '🔁', name: 'ניסיון נוסף', short: 'ניסיון נוסף', desc: 'בפנדלים – אחרי טעות אפשר לנסות את אותה שאלה שוב.' },
};
// הסבר קצר לכל סוג פריט (מופיע כשלוחצים על אריח)
export const TYPE_HELP = {
  avatar: 'הדמות שלך – מופיעה בפרופיל ובתגובות ההצלחה.', jersey: 'החולצה של הדמות שלך – נראית גם על מגרש הפנדלים.',
  banner: 'הרקע של הפרופיל שלך.', emote: 'אימוג׳י מונפש עם צליל – קופץ ליד הדמות שלך בכל תשובה נכונה. לחץ „נסה עכשיו" לראות ולשמוע.',
  ball: 'הכדור שלך במשחק הפנדלים.', fx: 'חגיגה על כל המסך, עם צליל, כשאתה כובש גול או עונה נכון כמה פעמים ברצף. לחץ „נסה עכשיו" לראות ולשמוע.',
  pitch: 'המגרש במשחק הפנדלים.', keeper: 'השוער שמולך במשחק הפנדלים.',
  trail: 'הכדור משאיר אחריו זנב צבעוני כשהוא עף לשער, והרשת נדלקת כשיש גול. לחץ „נסה עכשיו" לראות.', title: 'התואר שלך – מוצג מתחת לשם שלך בפרופיל ובדו-קרב.',
};
export const RARITY = {
  common: { name: 'רגיל', color: '#cfd9f5' }, rare: { name: 'נדיר', color: '#35b8ff' },
  epic: { name: 'אפי', color: '#b47cff' }, legendary: { name: 'אגדי', color: '#ffcf33' },
};

// פרסים נוספים בטור החינם (בנוסף לפריטים של ITEMS עם tier מספרי)
const FREE_EXTRA = {
  2: [{ power: 'fifty', n: 1 }], 7: [{ power: 'time', n: 1 }], 8: [{ box: 1 }], 11: [{ power: 'retry', n: 1 }],
  13: [{ box: 1 }], 17: [{ power: 'fifty', n: 2 }], 19: [{ box: 1 }],
};
// טור הזהב: דרגות 5/10/15/20 הן אבני דרך גדולות
export const GOLD = {
  1: [{ power: 'fifty', n: 3 }], 2: [{ box: 1 }], 3: [{ item: 'ge3' }], 4: [{ power: 'time', n: 3 }],
  5: [{ item: 'gj5' }], 6: [{ box: 1 }], 7: [{ power: 'retry', n: 2 }], 8: [{ item: 'ge8' }, { item: 'tg8' }],
  9: [{ power: 'fifty', n: 5 }], 10: [{ item: 'ga10' }, { box: 1 }], 11: [{ box: 1 }], 12: [{ item: 'gf12' }, { power: 'time', n: 3 }],
  13: [{ item: 'ge13' }], 14: [{ power: 'retry', n: 3 }], 15: [{ item: 'gb15' }], 16: [{ box: 2 }],
  17: [{ power: 'fifty', n: 5 }], 18: [{ item: 'gf18' }], 19: [{ power: 'time', n: 5 }, { power: 'retry', n: 2 }],
  20: [{ item: 'ga20' }, { item: 'tg20' }, { box: 2 }],
};
export const MILESTONES = [5, 10, 15, 20];

export const cellRewards = (track, tier) => track === 'gold'
  ? (GOLD[tier] || [])
  : [...ITEMS.filter(i => i.tier === tier).map(i => ({ item: i.id })), ...(FREE_EXTRA[tier] || [])];

// נדירות: מפורשת בפריט, ואחרת לפי הדרגה / מקור הפתיחה
export function rarityOf(item) {
  if (item.rarity) return item.rarity;
  if (item.tier === 'exam') return 'legendary';
  if (item.how) return 'rare';
  const t = typeof item.tier === 'number' ? item.tier : 0;
  return t >= 17 ? 'legendary' : t >= 11 ? 'epic' : t >= 6 ? 'rare' : 'common';
}
export const rewardRarity = r => r.item ? rarityOf(itemById(r.item)) : r.box ? 'epic' : 'common';
export const BOX_POOL = () => ITEMS.filter(i => i.how && i.how.box);
export { MAX_TIER };
