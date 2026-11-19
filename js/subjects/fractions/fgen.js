// מחוללי תרגילים לשברים: כפל שלם בשבר, וכפל שלם במספר מעורב. הכול מדויק (frac.js), והתשובה נבנית יחד עם התרגיל.
// פריט: { topic, q (ביטוי), a (תשובה כטקסט: מספר מעורב/שבר), res (שבר), why (הסבר עם משוואות), n, f }.
import * as Fr from './frac.js';

export const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export const TOPICS = { wf: { name: 'כפל שלם בשבר' }, wm: { name: 'כפל שלם במספר מעורב' } };
// אזור 1 = שלם × שבר; אזור 2 = שלם × מספר מעורב (גם שלם × שבר קטן, כהכנה); בלי אזור – שניהם
export const CHAPTER_TOPICS = { 1: ['wf'], 2: ['wm'] };
export const topicsFor = ch => (ch && CHAPTER_TOPICS[ch]) || ['wf', 'wm'];

const DEN = { 1: [2, 3, 4, 5, 6, 8, 10], 2: [2, 3, 4, 5, 6, 8, 10, 12, 7, 9], 3: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16] };
// שלם × שבר. רמה 1: שבר קטן מ-1 והמכפלה קטנה מ-1 או קצת מעליו; רמה 2: מכפלה מדומה; רמה 3: גם שבר מדומה כגורם
export function wf(level) {
  const b = pick(DEN[level]), a = level === 3 && Math.random() < 0.3 ? R(b + 1, 2 * b - 1) : R(1, b - 1), n = level === 1 ? R(2, 6) : level === 2 ? R(3, 9) : R(3, 12);
  const f = Fr.F(a, b), res = Fr.mulInt(n, f), mixed = Fr.mixedStr(res), improper = res.n >= res.d;
  const why = `${n} × ${a} = ${n * a}, והמכנה ${b} נשאר: ${n} × ${a}⁄${b} = ${n * a}⁄${b}` + (improper ? (res.n % res.d ? ` = ${mixed}` : ` = ${res.n / res.d}`) : '') + '.';
  return { topic: 'wf', q: `${n} × ${a}⁄${b}`, a: mixed, res, why, n, f, w: 0 };
}
// שלם × מספר מעורב: כופלים שלמים לחוד ושברים לחוד
export function wm(level) {
  const b = pick(DEN[level]), a = R(1, b - 1), w = level === 1 ? R(1, 3) : R(1, 5), n = level === 1 ? R(2, 4) : level === 2 ? R(2, 8) : R(3, 9);
  const mixed = Fr.fromMixed(w, a, b), res = Fr.mulInt(n, mixed), whole = n * w, part = Fr.F(n * a, b), m = Fr.toMixed(part);
  const total = Fr.F(whole * b + n * a, b);
  const why = part.n >= part.d
    ? `${n} × ${w} + ${n} × ${a}⁄${b} = ${whole} + ${part.n}⁄${b} = ${whole} + ${Fr.mixedStr(part)} = ${Fr.mixedStr(total)}.`
    : `${n} × ${w} + ${n} × ${a}⁄${b} = ${whole} + ${part.n}⁄${b} = ${Fr.mixedStr(total)}.`;
  return { topic: 'wm', q: `${n} × ${w} ${a}⁄${b}`, a: Fr.mixedStr(res), res, why, n, f: mixed, w };
}
export const GEN = { wf, wm };

// פריטים עם ערך ייחודי: אף שני תרגילים לא שווים בערך ובטקסט (אחרת התאמה בזיכרון לא חד-משמעית)
export function items(count, topics, level) {
  const out = [], vals = [], qs = new Set();
  for (let guard = 0; out.length < count && guard < 4000; guard++) {
    const it = GEN[pick(topics)](level);
    if (qs.has(it.q) || vals.some(v => Fr.eq(v, it.res))) continue;
    qs.add(it.q); vals.push(it.res); out.push(it);
  }
  return out;
}

// "גדול או קטן?": השלם n כפול גורם f – התוצאה גדולה, קטנה או שווה ל-n?
export function bigSmall(level, chapter = 0) {
  const kinds = chapter === 2 ? ['mixed', 'improper', 'one', 'mixed'] : chapter === 1 ? ['proper', 'proper', 'improper', 'one'] : ['proper', 'mixed', 'improper', 'one'];
  const kind = level === 1 ? pick(kinds.filter(k => k !== 'one')) : pick(kinds);
  const n = R(2, 12), b = pick(level === 1 ? [2, 3, 4, 5] : [3, 4, 5, 6, 7, 8, 9, 10, 12]);
  let f, text;
  if (kind === 'proper') { f = Fr.F(R(1, b - 1), b); text = Fr.imp(f); }
  else if (kind === 'improper') { f = Fr.F(R(b + 1, 2 * b), b); text = Fr.imp(f); }
  else if (kind === 'one') { f = Fr.F(b, b); text = Fr.imp(f); }
  else { const w = R(1, 3), a = R(1, b - 1); f = Fr.fromMixed(w, a, b); text = Fr.mixedOf(w, a, b); }
  const c = Fr.cmp(f, Fr.F(1, 1)), ans = c === 0 ? 'same' : c > 0 ? 'bigger' : 'smaller';
  const why = c === 0 ? `${text} שווה ל-1, ולכן כפל בו לא משנה את ${n}.` : c > 0 ? `${text} גדול מ-1, ולכן המכפלה גדולה מ-${n}.` : `${text} קטן מ-1, ולכן המכפלה קטנה מ-${n}.`;
  return { n, f, b: text, ans, why };
}
