// מחוללי תרגילים למשחקי החשבון (זיכרון, הנקודה זזה): חשבון עשרוני מדויק בלבד (מספרים שלמים, בלי שגיאות עיגול).
// {u, d} = u / 10^d. כל תרגיל: { topic, q (ביטוי), a (תשובה), why (הסבר), ... }.
// נבדק אוטומטית בקובץ tests/run.mjs (כל תרגיל מחושב מחדש בחישוב עצמאי).
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const P10 = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9];

const D = (u, d) => ({ u, d: d || 0 });
function norm(x) { let { u, d } = x; while (d > 0 && u % 10 === 0) { u /= 10; d--; } return { u, d }; }
function fmt(x) {                                   // 2.50 -> "2.5", 1200 -> "1200"
  x = norm(x);
  const neg = x.u < 0, s = String(Math.abs(x.u));
  if (x.d === 0) return (neg ? '-' : '') + s;
  const p = s.padStart(x.d + 1, '0');
  return (neg ? '-' : '') + p.slice(0, p.length - x.d) + '.' + p.slice(p.length - x.d);
}
function parse(s) {                                 // "12.50" / "12,5" -> {u,d}; null when invalid
  s = String(s).trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const [i, f = ''] = s.split('.');
  if (f.length > 8) return null;
  return D(+(i + f), f.length);
}
const mul = (a, b) => D(a.u * b.u, a.d + b.d);
const eq = (a, b) => { const d = Math.max(a.d, b.d); return a.u * P10[d - a.d] === b.u * P10[d - b.d]; };
const cmp = (a, b) => { const d = Math.max(a.d, b.d), x = a.u * P10[d - a.d], y = b.u * P10[d - b.d]; return x < y ? -1 : x > y ? 1 : 0; };
const num = (x) => x.u / P10[x.d];
// x * 10^k (k may be negative = division). exact.
function shift(x, k) { return k >= 0 ? (x.d >= k ? D(x.u, x.d - k) : D(x.u * P10[k - x.d], 0)) : D(x.u, x.d - k); }

// random decimal with `d` decimals, `digits` significant digits, no trailing zero (so the point matters)
function rdec(d, digits) {
  let u; do { u = R(P10[digits - 1], P10[digits] - 1); } while (u % 10 === 0);
  return D(u, d);
}
const fac = (k) => (k === 10 ? '10' : k === 100 ? '100' : '1000');
const places = (k) => (k === 10 ? 1 : k === 100 ? 2 : 3);
const ordHe = (k) => (k === 10 ? 'מקום אחד' : k === 100 ? 'שני מקומות' : 'שלושה מקומות');

const TOPICS = {
  mul10: { name: 'כפל ב־10, 100, 1000' },
  div10: { name: 'חילוק ב־10, 100, 1000' },
  place: { name: 'עשיריות, מאיות, אלפיות' },
  mulDec: { name: 'כפל עשרוני' },
  divDec: { name: 'חילוק עשרוני' },
  estimate: { name: 'הערכה' },
};

// ---- generators: each returns {topic,q,a,why,[hebrew]} ----
function gMul10(level) {
  const k = level === 1 ? pick([10, 10, 100]) : level === 2 ? pick([10, 100, 100, 1000]) : pick([100, 1000, 1000]);
  const d = level === 1 ? 1 : level === 2 ? R(1, 2) : R(2, 3);
  const x = rdec(d, level === 1 ? R(1, 2) : level === 2 ? 3 : R(3, 4));
  const r = shift(x, places(k));
  return { topic: 'mul10', q: `${fmt(x)} × ${fac(k)}`, a: fmt(r), x, k, op: '×', rule: `הנקודה זזה ${ordHe(k)} ימינה`, ruleShort: `זזה ${ordHe(k)} ימינה`,
    why: `כפל ב־${fac(k)}: כל ספרה גדלה פי ${fac(k)}, ולכן הנקודה זזה ${ordHe(k)} ימינה (ומשלימים אפסים אם צריך).` };
}
function gDiv10(level) {
  const k = level === 1 ? pick([10, 10, 100]) : level === 2 ? pick([10, 100, 100, 1000]) : pick([100, 1000, 1000]);
  const d = level === 1 ? R(0, 1) : R(0, 2);
  const x = d === 0 ? D(R(level === 1 ? 12 : 100, level === 1 ? 99 : 9999), 0) : rdec(d, level === 1 ? R(2, 3) : R(3, 5));
  const r = shift(x, -places(k));
  return { topic: 'div10', q: `${fmt(x)} : ${fac(k)}`, a: fmt(r), x, k, op: ':', rule: `הנקודה זזה ${ordHe(k)} שמאלה`, ruleShort: `זזה ${ordHe(k)} שמאלה`,
    why: `חילוק ב־${fac(k)}: כל ספרה קטנה פי ${fac(k)}, ולכן הנקודה זזה ${ordHe(k)} שמאלה.` };
}
function gPlace(level) {
  const k = level === 1 ? 1 : level === 2 ? pick([1, 2]) : pick([2, 3]);
  const unit = ['', 'עשיריות', 'מאיות', 'אלפיות'][k];
  const n = level === 1 ? R(11, 99) : level === 2 ? R(11, 199) : R(101, 999);
  if (n % 10 === 0) return gPlace(level);
  const r = D(n, k);
  return { topic: 'place', q: `${n} ${unit}`, hebrew: true, a: fmt(r),
    why: `${n} ${unit} = ${n} : ${P10[k]} = ${fmt(r)}.` };
}
function gMulDec(level) {
  let a, b;
  if (level === 1) { a = D(R(2, 9), 1); b = D(R(2, 9), 0); }
  else if (level === 2) {
    if (Math.random() < 0.5) { a = rdec(R(1, 2), 2); b = D(R(2, 12), 0); } else { a = D(R(2, 12), 0); b = rdec(R(1, 2), pick([1, 2])); }
  } else { a = rdec(R(1, 2), 2); b = rdec(R(1, 2), 2); }
  if (a.u % 10 === 0 && a.d > 0) return gMulDec(level);
  if (Math.random() < 0.5 && a.d === 0) [a, b] = [b, a];
  const r = mul(a, b);
  const sd = a.d + b.d;
  return { topic: 'mulDec', q: `${fmt(a)} × ${fmt(b)}`, a: fmt(r), x: a, y: b, op: '×',
    why: `מכפילים כאילו אין נקודה: ${a.u}×${b.u}=${a.u * b.u}. בגורמים יש ${sd} ספרות אחרי הנקודה, ולכן גם במכפלה: ${fmt(r)}.` };
}
function gDivDec(level) {
  let a, b, q;
  if (level === 1) { b = D(R(2, 9), 0); q = rdec(1, 2); }
  else if (level === 2) { b = D(R(2, 9), 1); q = D(R(2, 60), 0); }
  else { b = D(R(2, 9), pick([1, 1, 2])); q = pick([D(R(2, 50), 0), rdec(1, 2)]); }
  a = mul(q, b);
  let why;
  if (b.d === 0) why = `מחלקים כרגיל, והנקודה במנה נשארת במקום שבו היא במחולק: ${fmt(a)} : ${fmt(b)} = ${fmt(q)}.`;
  else why = `מגדילים את המחולק והמחלק פי ${P10[b.d]} עד שהמחלק שלם: ${fmt(a)} : ${fmt(b)} = ${fmt(shift(a, b.d))} : ${fmt(shift(b, b.d))} = ${fmt(q)}.`;
  return { topic: 'divDec', q: `${fmt(a)} : ${fmt(b)}`, a: fmt(q), x: a, y: b, op: ':', why };
}
const sig1 = (v) => { const e = Math.pow(10, Math.floor(Math.log10(v))); return Math.round(v / e) * e; };
function gEstimate(level) {
  let a, b;
  if (Math.random() < 0.5) { a = rdec(2, 2); a = D(a.u % 90 + 10, 2); b = D(R(level === 1 ? 5 : 8, level === 3 ? 60 : 30), 0); }
  else { a = D(R(level === 1 ? 5 : 8, level === 3 ? 90 : 40), 0); b = D(R(11, 99), 2); }
  if (a.u % 10 === 0 && a.d > 0) return gEstimate(level);
  const r = mul(a, b), v = num(r);
  const est = v < 10 ? Math.round(v) : sig1(v);
  if (est === v || est === 0 || v < 2 || Math.abs(est - v) / v > 0.3) return gEstimate(level);   // a useful estimate must be close
  return { topic: 'estimate', q: `${fmt(a)} × ${fmt(b)}`, a: fmt(r), est: String(est), x: a, y: b, op: '×',
    why: `אחד הגורמים קרוב ל־½, ולכן המכפלה בערך חצי מהגורם השני. המכפלה המדויקת: ${fmt(r)}, והערכה טובה: ${est}.` };
}
const GEN = { mul10: gMul10, div10: gDiv10, place: gPlace, mulDec: gMulDec, divDec: gDivDec, estimate: gEstimate };

// distinct items: no two share a question or an answer
function items(n, topics, level) {
  const out = [], qs = new Set(), as = new Set();
  let guard = 0;
  while (out.length < n && guard++ < 5000) {
    const it = GEN[pick(topics)](level);
    if (qs.has(it.q) || as.has(it.a)) continue;
    if (it.est && (as.has(it.est) || qs.has(it.est))) continue;
    qs.add(it.q); as.add(it.a); if (it.est) as.add(it.est);
    out.push(it);
  }
  return out;
}

// triples for memory: [question, helper, answer]; topics: mul10 / div10 / estimate
function triple(topic, level) {
  const it = GEN[topic](level);
  if (topic === 'estimate') return { it, cards: [{ t: it.q }, { t: '≈ ' + it.est }, { t: it.a }] };
  return { it, cards: [{ t: it.q }, { t: it.ruleShort, he: true }, { t: it.a }] };
}

// משפט בעברית שמכיל משוואות: כל משוואה (36×2=72, 13.5 : 0.3 = 135 : 3) נשארת משמאל לימין, אחרת היא מודפסת הפוך ("72=2×36")
export const rich = t => String(t).replace(/\d+(?:[.,]\d+)?(?:(?:\s*[×=≈÷+−]\s*|\s+[:-]\s+)\d+(?:[.,]\d+)?)+/g, s => `\u2066${s}\u2069`);
export const ltrText = s => `\u2066${s}\u2069`;

// "bigger or smaller than where we started?" questions
export function bigSmall(level, ops = ['×', ':']) {
  const BIG = level === 1 ? ['2', '3', '10', '100', '1.5', '5'] : ['1.1', '1.01', '1.5', '2.3', '10', '1.25', '100'];
  const SMALL = level === 1 ? ['0.5', '0.1', '0.2', '0.25', '0.01'] : ['0.9', '0.99', '0.5', '0.75', '0.01', '0.1', '0.25'];
  const kinds = level === 3 ? ['big', 'small', 'one', 'big', 'small'] : ['big', 'small'];
  const kind = pick(kinds), op = pick(ops);
  const b = kind === 'one' ? pick(['1', '1.0', '1.00']) : kind === 'big' ? pick(BIG) : pick(SMALL);
  const a = fmt(level === 1 ? D(R(2, 9), 0) : rdec(R(0, 2), R(2, 3)));
  const bv = num(parse(b));
  let ans;
  if (bv === 1) ans = 'same';
  else if (op === '×') ans = bv > 1 ? 'bigger' : 'smaller';
  else ans = bv > 1 ? 'smaller' : 'bigger';
  const word = ans === 'same' ? 'שווה למספר' : ans === 'bigger' ? 'גדולה מהמספר' : 'קטנה מהמספר';
  const why = bv === 1 ? `${op === '×' ? 'כפל' : 'חילוק'} ב־1 לא משנה את המספר.`
    : op === '×' ? (bv > 1 ? `כפל במספר גדול מ־1 ⇒ התוצאה גדולה מ־${a}.` : `כפל במספר קטן מ־1 ⇒ התוצאה קטנה מ־${a}.`)
      : (bv > 1 ? `חילוק במספר גדול מ־1 ⇒ התוצאה קטנה מ־${a}.` : `חילוק במספר קטן מ־1 ⇒ התוצאה גדולה מ־${a}.`);
  return { a, b, op, ans, why, word };
}

// ---- אילו נושאים שייכים לאיזה אזור (נושא) של המקצוע ----
export const CHAPTER_TOPICS = { 1: ['mul10', 'place'], 2: ['div10', 'place'], 3: ['mulDec'], 4: ['mulDec', 'estimate'], 5: ['divDec'] };
export const topicsFor = ch => (ch && CHAPTER_TOPICS[ch]) || Object.keys(GEN);          // ch = 0 → כל האזורים
// אזור 4 = כפל (כפל בקטן/גדול מ-1), אזור 5 = חילוק; בלי אזור – שניהם
export const bigSmallOps = ch => (ch === 4 ? ['×'] : ch === 5 ? [':'] : ['×', ':']);
export const TRIPLE_TOPICS = ['mul10', 'div10', 'estimate'];                              // נושאים שיש להם "שלישייה": תרגיל · כלל/הערכה · תוצאה
export const tripleTopicsFor = ch => topicsFor(ch).filter(t => TRIPLE_TOPICS.includes(t));

export { R, pick, shuffle, D, fmt, parse, norm, mul, eq, cmp, num, shift, rdec, P10, TOPICS, GEN, items, triple, places, ordHe };
