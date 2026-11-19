// בעיות מילוליות למשחק "החנות": מחירים, עודף ומסלולים, עם עשרוניים. חשבון מדויק (gen.js), והתשובה {u,d} נבנית יחד עם הסיפור.
// כל בעיה: { type, text, ans, unit, hint, why }.  ans – התשובה הנכונה; why – החישוב (משוואה אחת או שתיים, מופרדות ב-' ; ').
import * as G from './gen.js';

// [יחיד, רבים, מין] – המין קובע "אחת"/"אחד" (מחברת אחת, אבל עט אחד)
const ITEMS = [['מחברת', 'מחברות', 'f'], ['עט', 'עטים', 'm'], ['מסטיק', 'מסטיקים', 'm'], ['סוכריה', 'סוכריות', 'f'], ['מדבקה', 'מדבקות', 'f'], ['לחמנייה', 'לחמניות', 'f'], ['בלון', 'בלונים', 'm'], ['ממחטה', 'ממחטות', 'f']];
const one1 = (one, g) => `${one} ${g === 'f' ? 'אחת' : 'אחד'}`;
const KG = ['עגבניות', 'תפוחים', 'גבינה', 'בננות', 'ענבים', 'אורז'];
const money = x => G.fmt(x) + ' ₪';
const DIV_HINT = 'מחלקים כרגיל, והנקודה במנה נשארת מתחת לנקודה במחולק.';

const BUILD = {
  total(level) {                                                   // מחיר × כמות
    const [one, many, g] = G.pick(ITEMS);
    const p = level === 1 ? G.D(G.R(2, 9) * 5, 2) : G.rdec(G.R(1, 2), 2);
    const n = level === 1 ? G.pick([10, 100]) : level === 2 ? G.pick([10, 100, 1000, 6, 8, 12]) : G.R(11, 40);
    const a = G.mul(p, G.D(n));
    return { type: 'total', text: `מחיר ${one1(one, g)}: ${money(p)}. כמה ₪ צריך לשלם על ${n} ${many}?`, ans: a, unit: '₪',
      hint: n % 10 === 0 ? `כפל ב־${n}: הנקודה זזה ימינה.` : 'כופלים כאילו אין נקודה, ואז סופרים ספרות אחרי הנקודה.', why: `${G.fmt(p)} × ${n} = ${G.fmt(a)}` };
  },
  unit(level) {                                                    // סך הכול : כמות
    const [one, many, g] = G.pick(ITEMS);
    const n = level === 1 ? G.pick([10, 100]) : G.R(2, 9);
    const price = level === 1 ? G.D(G.R(11, 99), 2) : G.rdec(G.R(1, 2), 2), tot = G.mul(price, G.D(n));
    return { type: 'unit', text: `שילמו ${money(tot)} על ${n} ${many}, כולן באותו מחיר. מה מחיר ${one1(one, g)}?`, ans: price, unit: '₪',
      hint: n % 10 === 0 ? `חילוק ב־${n}: הנקודה זזה שמאלה.` : DIV_HINT, why: `${G.fmt(tot)} : ${n} = ${G.fmt(price)}` };
  },
  route(level) {                                                   // אורך : קטעים
    const parts = level === 1 ? 10 : G.pick([10, 100, 5, 4, 8]), each = G.rdec(G.R(1, 2), 2), len = G.mul(each, G.D(parts));
    return { type: 'route', text: `מסלול באורך ${G.fmt(len)} ק״מ מחולק ל־${parts} קטעים שווים. מה אורך כל קטע (בק״מ)?`, ans: each, unit: 'ק״מ',
      hint: parts % 10 === 0 ? `חילוק ב־${parts}: הנקודה זזה שמאלה.` : DIV_HINT, why: `${G.fmt(len)} : ${parts} = ${G.fmt(each)}` };
  },
  kg(level) {                                                      // מחיר לק״ג × משקל עשרוני
    const what = G.pick(KG), w = G.D(G.pick([5, 25, 15, 4, 2, 8]), G.pick([1, 1, 2]));
    const price = level === 3 ? G.D(G.R(21, 99), 1) : G.D(G.R(3, 19), 1), a = G.mul(price, w);
    return { type: 'kg', text: `ק״ג ${what} עולה ${money(price)}. כמה ₪ צריך לשלם על ${G.fmt(w)} ק״ג?`, ans: a, unit: '₪',
      hint: 'כופלים כאילו אין נקודות, ואז סופרים כמה ספרות יש אחרי הנקודה בשני הגורמים יחד.', why: `${G.fmt(price)} × ${G.fmt(w)} = ${G.fmt(a)}` };
  },
  change() {                                                       // עודף משטר
    const [, many] = G.pick(ITEMS), n = G.R(2, 9), p = G.rdec(1, 2), bill = G.pick([20, 50, 100]), total = G.mul(p, G.D(n));
    if (G.num(total) >= bill) return BUILD.change();
    const ans = G.D(bill * G.P10[total.d] - total.u, total.d);
    return { type: 'change', text: `קנו ${n} ${many} במחיר ${money(p)} ליחידה, ושילמו בשטר של ${bill} ₪. כמה עודף מקבלים?`, ans, unit: '₪',
      hint: 'קודם מחשבים כמה עולות כל הקניות (כפל), ואז מחסרים מהשטר.', why: `${G.fmt(p)} × ${n} = ${G.fmt(total)} ; ${bill} − ${G.fmt(total)} = ${G.fmt(ans)}` };
  },
};
// אילו סוגי בעיות מתאימים לאיזה אזור: 3 כפל עשרוני (א), 4 כפל עשרוני (ב), 5 חילוק עשרוני; בלי אזור – הכול
export const SHOP_TYPES = { 3: ['total', 'change'], 4: ['total', 'kg', 'change'], 5: ['unit', 'route'] };
export const shopTypesFor = ch => (ch && SHOP_TYPES[ch]) || ['total', 'unit', 'route', 'kg', 'change'];
export const shopProblem = (type, level) => BUILD[type](level);
