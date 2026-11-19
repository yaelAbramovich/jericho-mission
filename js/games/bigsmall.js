// גדול או קטן? בלי לחשב: התוצאה של הכפלה/חילוק גדולה, קטנה או שווה למספר שהתחלנו ממנו?
// אזור 4 = כפל, אזור 5 = חילוק, "כל האזורים" = שניהם. הקושי עולה בתוך הסבב (מספרים רחוקים מ-1 → קרובים ל-1 → גם "שווה").
import { h } from '../ui.js';
import { sfx } from '../audio.js';
import { waitClick, tally } from './common.js';
import { reactor } from '../react.js';
import * as G from '../subjects/math/gen.js';

export const __test = { q: null };                     // לבדיקות אוטומטיות: השאלה הנוכחית (התשובה לא מוצגת על המסך)
const ROUNDS = 12;
const levelOf = n => (n < 4 ? 1 : n < 9 ? 2 : 3);
const CHOICES = [['bigger', '▲', 'גדולה יותר'], ['same', '＝', 'שווה'], ['smaller', '▼', 'קטנה יותר']];

export async function run(el, { chapter = 0 }, sc) {
  const ops = G.bigSmallOps(chapter), R = reactor(el, sc), T = tally(ROUNDS);
  let correct = 0, prev = '';

  for (let n = 0; n < ROUNDS; n++) {
    let q; do { q = G.bigSmall(levelOf(n), ops); } while (q.a + q.op + q.b === prev);
    prev = q.a + q.op + q.b; __test.q = q;
    const btns = CHOICES.map(([k, sym, label]) => h('button', { class: 'opt bs-opt', 'data-a': k }, h('span', { class: 'let' }, sym), label));
    const fb = h('div', { class: 'bs-fb' });
    el.innerHTML = '';
    el.append(h('div', { class: 'h-head' }, h('b', {}, `${n + 1} / ${ROUNDS}`), T.el),
      h('div', { class: 'bs-card' },
        h('p', { class: 'sub' }, 'התחלנו מהמספר'), h('div', { class: 'bs-a' }, G.ltrText(q.a)),
        h('p', { class: 'sub' }, q.op === '×' ? 'הכפלנו ב־' : 'חילקנו ב־', h('b', { class: 'bs-b' }, G.ltrText(q.b))),
        h('p', { class: 'bs-q' }, 'התוצאה תהיה…')),
      h('div', { class: 'bs-opts' }, btns), fb);

    const choice = await new Promise(res => btns.forEach(b => b.addEventListener('click', () => res(b.dataset.a), { once: true })));
    const ok = choice === q.ans;
    btns.forEach(b => { b.disabled = true; if (b.dataset.a === q.ans) b.classList.add('right'); else if (b.dataset.a === choice) b.classList.add('wrong'); });
    if (ok) { correct++; sfx.correct(); R.hit({ light: true }); } else { sfx.wrong(); R.miss(); }
    T.mark(n, ok);
    fb.className = 'bs-fb fb ' + (ok ? 'good' : 'bad');
    fb.append(h('p', {}, ok ? '✓ נכון!' : '✗ לא בדיוק'), h('div', { class: 'bs-why' }, G.rich(q.why)));
    const next = h('button', { class: 'btn primary' }, n === ROUNDS - 1 ? 'לתוצאות' : 'הבא ▶');
    el.append(next);
    await waitClick(next, sc);
  }
  const perfect = correct === ROUNDS;
  return { xp: Math.min(70, correct * 4 + 5 + (perfect ? 8 : 0)), correct, total: ROUNDS, run: R.best, completed: true, allPerfect: perfect,
    title: perfect ? 'בלי מחשבון – ובלי טעויות!' : 'בלי מחשבון!', big: `${correct} / ${ROUNDS}`, lines: [`רצף שיא: ${R.best}`] };
}
