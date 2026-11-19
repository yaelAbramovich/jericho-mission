// גדול או קטן? (שברים): בלי לחשב – המכפלה של שלם בשבר או במספר מעורב גדולה, קטנה או שווה לשלם? שבר קטן מ-1 מקטין, גדול מ-1 מגדיל, ושווה ל-1 לא משנה.
// אזור 1: בעיקר שברים קטנים מ-1, אזור 2: מספרים מעורבים (תמיד גדולים מ-1). הקושי עולה בתוך הסבב.
import { h } from '../ui.js';
import { sfx } from '../audio.js';
import { waitClick, tally } from './common.js';
import { reactor } from '../react.js';
import * as FG from '../subjects/fractions/fgen.js';

export const __test = { q: null };
const ROUNDS = 12;
const levelOf = n => (n < 4 ? 1 : n < 9 ? 2 : 3);
const CHOICES = [['bigger', '▲', 'גדולה יותר'], ['same', '＝', 'שווה'], ['smaller', '▼', 'קטנה יותר']];
const ltr = s => `⁦${s}⁩`;

export async function run(el, { chapter = 0 }, sc) {
  const R = reactor(el, sc), T = tally(ROUNDS);
  let correct = 0, prev = '';
  for (let n = 0; n < ROUNDS; n++) {
    let q; do { q = FG.bigSmall(levelOf(n), chapter); } while (`${q.n}|${q.b}` === prev);
    prev = `${q.n}|${q.b}`; __test.q = q;
    const btns = CHOICES.map(([k, sym, label]) => h('button', { class: 'opt bs-opt', 'data-a': k }, h('span', { class: 'let' }, sym), label));
    const fb = h('div', { class: 'bs-fb' });
    el.innerHTML = '';
    el.append(h('div', { class: 'h-head' }, h('b', {}, ltr(`${n + 1} / ${ROUNDS}`)), T.el),
      h('div', { class: 'bs-card' }, h('p', { class: 'sub' }, 'התחלנו מהשלם'), h('div', { class: 'bs-a' }, ltr(String(q.n))),
        h('p', { class: 'sub' }, 'וכפלנו ב־', h('b', { class: 'bs-b' }, ltr(q.b))), h('p', { class: 'bs-q' }, 'המכפלה תהיה…')),
      h('div', { class: 'bs-opts' }, btns), fb);
    const choice = await new Promise(res => btns.forEach(b => b.addEventListener('click', () => res(b.dataset.a), { once: true })));
    const ok = choice === q.ans;
    btns.forEach(b => { b.disabled = true; if (b.dataset.a === q.ans) b.classList.add('right'); else if (b.dataset.a === choice) b.classList.add('wrong'); });
    if (ok) { correct++; sfx.correct(); R.hit({ light: true }); } else { sfx.wrong(); R.miss(); }
    T.mark(n, ok);
    fb.className = 'bs-fb fb ' + (ok ? 'good' : 'bad');
    fb.append(h('p', {}, ok ? '✓ נכון!' : '✗ לא בדיוק'), h('div', { class: 'bs-why' }, q.why));
    const next = h('button', { class: 'btn primary' }, n === ROUNDS - 1 ? 'לתוצאות' : 'הבא ▶');
    el.append(next);
    await waitClick(next, sc);
  }
  const perfect = correct === ROUNDS;
  return { xp: Math.min(70, correct * 4 + 5 + (perfect ? 8 : 0)), correct, total: ROUNDS, run: R.best, completed: true, allPerfect: perfect,
    title: perfect ? 'בלי לחשב – ובלי טעויות!' : 'בלי לחשב!', big: `${correct} / ${ROUNDS}`, lines: [`רצף שיא: ${R.best}`] };
}
