// חשבון שברים מדויק (מספרים שלמים בלבד) ותצוגה: שבר = {n, d} (מונה / מכנה). אין עיגול ואין נקודה צפה.
// בטקסט: שבר = "2/5", מספר מעורב = "1 1/5". התצוגה כשבר "בנוי" (מונה מעל מכנה) נעשית ב-js/frac-dom.js.
export const SL = '\u2044';                                              // קו שבר (U+2044)
export const fx = s => String(s).replace(/(\d)\/(\d)/g, '$1\u2044$2');       // "2/5" → "2⁄5" (בתוכן כותבים "/" ומחליפים פעם אחת)
export const deepFx = o => (typeof o === 'string' ? fx(o) : Array.isArray(o) ? o.map(deepFx) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, deepFx(v)])) : o);
export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export const F = (n, d = 1) => ({ n, d });
export const fromMixed = (w, n, d) => F(w * d + n, d);
export const simplify = f => { const g = gcd(f.n, f.d) || 1; return F(f.n / g, f.d / g); };
export const mulInt = (k, f) => F(k * f.n, f.d);                  // k × a/b = (k×a)/b – המכנה נשאר (כך עושים בספר)
export const add = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
export const eq = (a, b) => a.n * b.d === b.n * a.d;
export const cmp = (a, b) => { const x = a.n * b.d, y = b.n * a.d; return x < y ? -1 : x > y ? 1 : 0; };
export const num = f => f.n / f.d;
export const toMixed = f => { const w = Math.floor(f.n / f.d); return { w, n: f.n - w * f.d, d: f.d }; };   // 14/5 → 2 ושארית 4/5 (בלי צמצום)
export const imp = f => `${f.n}${SL}${f.d}`;                           // שבר מדומה: "14/5"
export const mixedStr = f => { const m = toMixed(f); return m.n === 0 ? String(m.w) : m.w === 0 ? `${m.n}${SL}${m.d}` : `${m.w} ${m.n}${SL}${m.d}`; };   // "2 4/5"
export const mixedOf = (w, n, d) => (n === 0 ? String(w) : w === 0 ? `${n}${SL}${d}` : `${w} ${n}${SL}${d}`);
// קורא קלט של תלמיד: "2 4/5", "14/5", "3" → שבר, או null
export function parse(s) {
  const m = String(s).trim().replace(/\s+/g, ' ').replace(/\u2044/g, '/').match(/^(?:(\d+) (\d+)\/(\d+)|(\d+)\/(\d+)|(\d+))$/);
  if (!m) return null;
  if (m[1] != null) return +m[3] ? fromMixed(+m[1], +m[2], +m[3]) : null;
  if (m[4] != null) return +m[5] ? F(+m[4], +m[5]) : null;
  return F(+m[6], 1);
}
