// החנות: בעיות מילוליות עם עשרוניים (מחירים, עודף, מסלולים), עם מקלדת מספרים על המסך, רמז ושני ניסיונות.
// הסוגים נקבעים לפי האזור (3 = כפל עשרוני א, 4 = כפל עשרוני ב, 5 = חילוק עשרוני), והקושי עולה בתוך הסבב.
import { sfx } from '../audio.js';
import { tally } from './common.js';
import { reactor } from '../react.js';
import { askNumber } from './numpad.js';
import * as G from '../subjects/math/gen.js';
import * as W from '../subjects/math/word.js';

export const __test = { q: null };                     // לבדיקות: הבעיה הנוכחית (התשובה לא מוצגת על המסך)
const ROUNDS = 8;
const levelOf = n => (n < 3 ? 1 : n < 6 ? 2 : 3);

export async function run(el, { chapter = 0 }, sc) {
  const types = W.shopTypesFor(chapter), R = reactor(el, sc), T = tally(ROUNDS), seen = new Set();
  let xp = 0, correct = 0, clean = 0;

  for (let n = 0; n < ROUNDS; n++) {
    let q, guard = 0; do { q = W.shopProblem(G.pick(types), levelOf(n)); } while (seen.has(q.text) && guard++ < 50);
    seen.add(q.text); __test.q = q;
    const r = await askNumber(el, sc, { head: 'החנות', T, story: q.text, unit: q.unit, ans: q.ans, hint: q.hint, why: q.why, R, last: n === ROUNDS - 1 });
    if (r.ok) { correct++; const first = r.tries === 0 && !r.hinted; if (first) clean++; xp += first ? 6 : 3; sfx.goal(); R.hit({ light: true }); }
    T.mark(n, r.ok);
    await r.finish();
  }
  const perfect = clean === ROUNDS;
  return { xp: Math.min(70, xp + (perfect ? 8 : 0) + 5), correct, total: ROUNDS, run: R.best, completed: true, allPerfect: perfect,
    title: perfect ? 'הקופה סגורה – בלי טעויות!' : 'הקופה סגורה!', big: `${correct} / ${ROUNDS}`, lines: [`${clean} מתוך ${ROUNDS} בניסיון ראשון, בלי רמז`] };
}
