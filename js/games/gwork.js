// הסדנה: בונים שלדים של גופים ממקלות וכדורי פלסטלינה – כמה מקלות? כמה כדורים? וגם חידות הפוכות (מה הבסיס?) ומשפט אוילר.
// תשובה מספרית עם מקלדת על המסך (numpad.js, משותף ל"החנות"), רמז ושני ניסיונות.
import { sfx } from '../audio.js';
import { tally } from './common.js';
import { reactor } from '../react.js';
import { askNumber } from './numpad.js';
import * as S from '../subjects/geometry/solids.js';

export const __test = { q: null };
const ROUNDS = 8;
const levelOf = n => (n < 3 ? 1 : n < 6 ? 2 : 3);

export async function run(el, { chapter = 0 }, sc) {
  const R = reactor(el, sc), T = tally(ROUNDS), seen = new Set();
  let xp = 0, correct = 0, clean = 0;
  for (let n = 0; n < ROUNDS; n++) {
    let q, guard = 0; do { q = S.workProblem(levelOf(n), chapter); } while (seen.has(q.text) && guard++ < 50);
    seen.add(q.text); __test.q = q;
    const r = await askNumber(el, sc, { head: 'הסדנה', T, story: q.text, unit: q.unit, ans: q.ans, hint: q.hint, why: q.why, R, last: n === ROUNDS - 1, integer: true });
    if (r.ok) { correct++; const first = r.tries === 0 && !r.hinted; if (first) clean++; xp += first ? 6 : 3; sfx.goal(); R.hit({ light: true }); }
    T.mark(n, r.ok);
    await r.finish();
  }
  const perfect = clean === ROUNDS;
  return { xp: Math.min(70, xp + (perfect ? 8 : 0) + 5), correct, total: ROUNDS, run: R.best, completed: true, allPerfect: perfect,
    title: perfect ? 'הסדנה סגורה – בלי טעויות!' : 'הסדנה סגורה!', big: `${correct} / ${ROUNDS}`, lines: [`${clean} מתוך ${ROUNDS} בניסיון ראשון, בלי רמז`] };
}
