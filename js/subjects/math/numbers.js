// עזרים למספרים עשרוניים – חישוב מדויק על מחרוזות (בלי שגיאות עיגול של מספרים צפים).
export const ltr = s => `⁦${s}⁩`;                         // מבודד כיוון: ביטוי מתמטי נשאר משמאל לימין גם בתוך משפט בעברית
export const powName = n => (n === 1000 ? '1,000' : String(n));      // 10 / 100 / 1,000
const split = s => { const [i, f = ''] = String(s).split('.'); return [i, f]; };
const clean = (i, f) => { i = i.replace(/^0+(?=\d)/, '') || '0'; f = f.replace(/0+$/, ''); return f ? `${i}.${f}` : i; };

// הזזת הנקודה: k>0 = כפל ב-10^k (הספרות זזות שמאלה), k<0 = חילוק ב-10^|k|
export function shiftStr(s, k) {
  const [i, f] = split(s); let digits = i + f, p = i.length + k;
  if (p <= 0) { digits = '0'.repeat(1 - p) + digits; p = 1; }
  if (p > digits.length) digits += '0'.repeat(p - digits.length);
  return clean(digits.slice(0, p), digits.slice(p));
}
export const decimals = s => split(s)[1].length;
// מכפלה מדויקת של שני מספרים עשרוניים (כמחרוזות)
export function mulStr(a, b) {
  const da = decimals(a), db = decimals(b), prod = Number(String(a).replace('.', '')) * Number(String(b).replace('.', ''));
  return shiftStr(String(prod), -(da + db));
}
export const intOf = s => String(s).replace('.', '').replace(/^0+(?=\d)/, '');   // 0.07 -> "7"
export const kOf = n => ({ 10: 1, 100: 2, 1000: 3 })[n];
