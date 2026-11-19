// יותר או פחות? בלי לספור: לגוף אחד יש יותר, פחות או אותו מספר פאות / צלעות / קודקודים מאשר לגוף אחר?
// הקושי עולה בתוך הסבב: אותו בסיס וסוג גוף אחר → אותו סוג גוף ובסיס אחר → כל צירוף (גם "אותו מספר").
import { h } from '../ui.js';
import { sfx } from '../audio.js';
import { waitClick, tally } from './common.js';
import { reactor } from '../react.js';
import * as Geo from '../subjects/math/geo.js';
import * as S from '../subjects/geometry/solids.js';
import { ltrText } from '../subjects/math/gen.js';

export const __test = { q: null };
const ROUNDS = 10;
const levelOf = n => (n < 3 ? 1 : n < 7 ? 2 : 3);
const CHOICES = [['more', '▲', 'יותר'], ['same', '＝', 'אותו מספר'], ['less', '▼', 'פחות']];

export async function run(el, { chapter = 0 }, sc) {
  const R = reactor(el, sc), T = tally(ROUNDS);
  let correct = 0, prev = '';
  for (let n = 0; n < ROUNDS; n++) {
    let q; do { q = S.compareQuestion(levelOf(n), chapter); } while (`${q.A.name}|${q.B.name}|${q.prop}` === prev);
    prev = `${q.A.name}|${q.B.name}|${q.prop}`; __test.q = q;
    const cell = f => h('div', { class: 'gm-cell' }, h('div', { html: Geo.shapeSVG({ shape: f.type, n: f.n }, 130) }), h('b', {}, f.name));
    const btns = CHOICES.map(([k, sym, label]) => h('button', { class: 'opt bs-opt', 'data-a': k }, h('span', { class: 'let' }, sym), label));
    const fb = h('div', { class: 'bs-fb' });
    el.innerHTML = '';
    el.append(h('div', { class: 'h-head' }, h('b', {}, ltrText(`${n + 1} / ${ROUNDS}`)), T.el), h('div', { class: 'gm-pair' }, cell(q.A), cell(q.B)),
      h('p', { class: 'bs-q' }, `ל${q.A.name} יש … ${q.propWord} בהשוואה ל${q.B.name}`), h('div', { class: 'bs-opts' }, btns), fb);
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
  return { xp: Math.min(70, correct * 5 + 5 + (perfect ? 8 : 0)), correct, total: ROUNDS, run: R.best, completed: true, allPerfect: perfect,
    title: perfect ? 'בלי לספור – ובלי טעויות!' : 'סיימתם!', big: `${correct} / ${ROUNDS}`, lines: [`רצף שיא: ${R.best}`] };
}
