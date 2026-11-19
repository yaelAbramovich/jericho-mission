// חנות השברים: בעיות מילוליות עם כפל שלם בשבר ובמספר מעורב. התשובה בשלושה תאים (שלם, מונה, מכנה), עם רמז ושני ניסיונות.
import { sfx } from '../audio.js';
import { tally } from './common.js';
import { reactor } from '../react.js';
import { askFraction } from './fnumpad.js';
import { problemFor } from '../subjects/fractions/fword.js';

export const __test = { q: null };
const ROUNDS = 8;
const levelOf = n => (n < 3 ? 1 : n < 6 ? 2 : 3);

export async function run(el, { chapter = 0 }, sc) {
  const R = reactor(el, sc), T = tally(ROUNDS), seen = new Set();
  let xp = 0, correct = 0, clean = 0;
  for (let n = 0; n < ROUNDS; n++) {
    let q, guard = 0; do { q = problemFor(chapter, levelOf(n)); } while (seen.has(q.text) && guard++ < 50);
    seen.add(q.text); __test.q = q;
    const r = await askFraction(el, sc, { head: 'חנות השברים', T, story: q.text, unit: q.unit, ans: q.ans, hint: q.hint, why: q.why, R, last: n === ROUNDS - 1 });
    if (r.ok) { correct++; const first = r.tries === 0 && !r.hinted; if (first) clean++; xp += first ? 6 : 3; sfx.goal(); R.hit({ light: true }); }
    T.mark(n, r.ok);
    await r.finish();
  }
  const perfect = clean === ROUNDS;
  return { xp: Math.min(70, xp + (perfect ? 8 : 0) + 5), correct, total: ROUNDS, run: R.best, completed: true, allPerfect: perfect,
    title: perfect ? 'חנות השברים סגורה – בלי טעויות!' : 'חנות השברים סגורה!', big: `${correct} / ${ROUNDS}`, lines: [`${clean} מתוך ${ROUNDS} בניסיון ראשון, בלי רמז`] };
}
