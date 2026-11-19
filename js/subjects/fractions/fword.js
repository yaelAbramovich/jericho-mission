// בעיות מילוליות לשברים (חנות השברים): כמה צריך / כמה אכלו / מה השטח. כפל שלם בשבר (אזור 1) ושלם במספר מעורב (אזור 2).
// כל בעיה: { type, text, ans (שבר), unit, hint, why }. התשובה נבנית יחד עם הסיפור (frac.js), וכל מספר שבסיפור הוא זה שבחישוב.
import * as Fr from './frac.js';
import { R, pick } from './fgen.js';

const T1 = [
  { id: 'flour', f: (n, a, b) => `לכל עוגה צריך ${a}/${b} ק"ג קמח. כמה ק"ג קמח צריך ל-${n} עוגות?`, unit: 'ק"ג' },
  { id: 'ribbon', f: (n, a, b) => `כל ילד קיבל סרט שאורכו ${a}/${b} מטר. כמה מטרים של סרט צריך ל-${n} ילדים?`, unit: 'מטר' },
  { id: 'jump', f: (n, a, b) => `בכל קפיצה הדס קפצה ${a}/${b} מטר. כמה מטרים קפצה ב-${n} קפיצות?`, unit: 'מטר' },
  { id: 'bottle', f: (n, a, b) => `בכל בקבוק יש ${a}/${b} ליטר מים. כמה ליטרים יש ב-${n} בקבוקים?`, unit: 'ליטר' },
];
const T2 = [
  { id: 'cheese', f: (n, w, a, b) => `כל חבילת גבינה שוקלת ${w} ${a}/${b} ק"ג. כמה ק"ג שוקלות ${n} חבילות?`, unit: 'ק"ג' },
  { id: 'walk', f: (n, w, a, b) => `הדס צועדת ${w} ${a}/${b} ק"מ בכל יום. כמה ק"מ תצעד ב-${n} ימים?`, unit: 'ק"מ' },
  { id: 'area', f: (n, w, a, b) => `מלבן באורך ${n} מ׳ וברוחב ${w} ${a}/${b} מ׳. מה השטח שלו?`, unit: 'מ"ר' },
  { id: 'milk', f: (n, w, a, b) => `בכל שקית יש ${w} ${a}/${b} ליטר חלב. כמה ליטרים יש ב-${n} שקיות?`, unit: 'ליטר' },
];
const DEN = { 1: [2, 3, 4, 5], 2: [2, 3, 4, 5, 6, 8, 10], 3: [3, 4, 5, 6, 7, 8, 9, 10, 12] };

export function wfProblem(level) {
  const t = pick(T1), b = pick(DEN[level]), a = R(1, b - 1), n = level === 1 ? R(2, 5) : R(3, 9);
  const res = Fr.mulInt(n, Fr.F(a, b)), improper = res.n >= res.d;
  return { type: 'wf', text: t.f(n, a, b).replace(/(\d)\/(\d)/g, Fr.fx('$1/$2').slice(0, 0) + '$1⁄$2'), ans: res, unit: t.unit,
    hint: `כופלים את המונה בשלם: ${n} × ${a} = ${n * a}. המכנה ${b} נשאר.`,
    why: `${n} × ${a}⁄${b} = ${n * a}⁄${b}` + (improper ? ` = ${Fr.mixedStr(res)}` : '') + '.' };
}
export function wmProblem(level) {
  const t = pick(T2), b = pick(DEN[level]), a = R(1, b - 1), w = level === 1 ? R(1, 3) : R(1, 5), n = level === 1 ? R(2, 4) : R(2, 8);
  const mixed = Fr.fromMixed(w, a, b), res = Fr.mulInt(n, mixed), part = Fr.F(n * a, b);
  return { type: 'wm', text: Fr.fx(t.f(n, w, a, b)), ans: res, unit: t.unit,
    hint: `שלמים לחוד ושברים לחוד: ${n} × ${w} ועוד ${n} × ${a}⁄${b}.`,
    why: `${n} × ${w} + ${n} × ${a}⁄${b} = ${n * w} + ${part.n}⁄${b} = ${Fr.mixedStr(res)}.` };
}
export const problemFor = (chapter, level) => (chapter === 1 ? wfProblem(level) : chapter === 2 ? wmProblem(level) : pick([wfProblem, wmProblem])(level));
