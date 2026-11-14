// מנהל המקצועות. כל מקצוע/מבחן הוא "חבילה" (pack) בתיקייה משלו: js/subjects/<id>/pack.js.
// החבילה הפעילה נקבעת לפי מה ששמור בהתקדמות (state.subject, ברירת מחדל joshua). החלפת מקצוע = שמירה + טעינה מחדש של הדף,
// ולכן שאר הקוד יכול לקרוא את PACK כקבוע (top-level await).
// להוספת מקצוע חדש: תיקייה חדשה + pack.js, ורישום ב-REGISTRY (וב-sw.js, ראו README).
export const REGISTRY = [
  { id: 'joshua', name: 'יהושע א׳–ה׳', icon: '📖' },
  { id: 'science', name: 'מדעים (דוגמה)', icon: '🔬', hidden: true },   // hidden: לא מופיע בבורר המקצועות עד שהתוכן האמיתי מוכן (אפשר לטעון אותו בבדיקות)
];
const KEY = 'jericho.v1';
function readSubject() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}');
    // מתג פיתוח: ‎?subject=science‎ בכתובת מחליף מקצוע (גם מקצוע מוסתר) ושומר אותו. ‎?subject=joshua‎ חוזר ליהושע.
    const q = new URLSearchParams(location.search).get('subject');
    if (q && REGISTRY.some(r => r.id === q)) { s.subject = q; localStorage.setItem(KEY, JSON.stringify(s)); return q; }
    return REGISTRY.some(r => r.id === s.subject) ? s.subject : REGISTRY[0].id;
  } catch (e) { return REGISTRY[0].id; }
}
export const SUBJECT_ID = readSubject();
export const PACK = (await import(`./${SUBJECT_ID}/pack.js`)).default;

// עזרים כלליים שנגזרים מהחבילה
export const UNITS = PACK.units;                       // היחידות (פרקים / נושאים): n, zone, title, story?
export const UNIT_NUMS = UNITS.map(u => u.n);
export const N_UNITS = UNITS.length;
export const unitLabel = n => PACK.labels.unit(n);     // "פרק ב׳"
export const unitZone = n => (UNITS.find(u => u.n === n) || {}).zone || '';
export const hasGame = (key, mode) => !!PACK.games[key] && (!mode || !PACK.games[key].modes || PACK.games[key].modes.includes(mode));
