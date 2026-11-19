// החנות: בעיות מילוליות עם עשרוניים (מחירים, עודף, מסלולים), עם מקלדת מספרים על המסך, רמז ושני ניסיונות.
// הסוגים נקבעים לפי האזור (3 = כפל עשרוני א, 4 = כפל עשרוני ב, 5 = חילוק עשרוני), והקושי עולה בתוך הסבב.
import { h, toast } from '../ui.js';
import { sfx } from '../audio.js';
import { waitClick, tally } from './common.js';
import { reactor } from '../react.js';
import * as G from '../subjects/math/gen.js';
import * as W from '../subjects/math/word.js';

export const __test = { q: null };                     // לבדיקות: הבעיה הנוכחית (התשובה לא מוצגת על המסך)
const ROUNDS = 8, KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫'];
const levelOf = n => (n < 3 ? 1 : n < 6 ? 2 : 3);

export async function run(el, { chapter = 0 }, sc) {
  const types = W.shopTypesFor(chapter), R = reactor(el, sc), T = tally(ROUNDS), seen = new Set();
  let xp = 0, correct = 0, clean = 0;

  for (let n = 0; n < ROUNDS; n++) {
    let q, guard = 0; do { q = W.shopProblem(G.pick(types), levelOf(n)); } while (seen.has(q.text) && guard++ < 50);
    seen.add(q.text); __test.q = q;
    let entry = '', tries = 0, hinted = false;
    const val = h('span', { class: 'val' }, ' '), box = h('div', { class: 'shop-entry' }, val, h('span', { class: 'unit' }, q.unit));
    const fb = h('div', { class: 'shop-fb' });
    const keys = h('div', { class: 'shop-keys' }, KEYS.map(k => h('button', { class: 'skey' + (k === '⌫' ? ' del' : ''), 'data-k': k }, k)));
    const hint = h('button', { class: 'btn ghost' }, '💡 רמז'), check = h('button', { class: 'btn primary' }, 'בדיקה ✓');
    const actions = h('div', { class: 'shop-actions' }, hint, check);
    el.innerHTML = '';
    el.append(h('div', { class: 'h-head' }, h('b', {}, 'החנות'), T.el), h('div', { class: 'shop-story' }, q.text), box, fb, keys, actions);

    keys.addEventListener('click', e => {
      const b = e.target.closest('.skey'); if (!b) return; sfx.tap();
      const k = b.dataset.k;
      if (k === '⌫') entry = entry.slice(0, -1);
      else if (k === '.') { if (!entry.includes('.')) entry = (entry || '0') + '.'; }
      else if (entry.length < 9) entry += k;
      val.textContent = entry || ' ';
    });
    hint.addEventListener('click', () => { hinted = true; sfx.pick(); fb.className = 'shop-fb fb hint'; fb.textContent = ''; fb.append(h('p', {}, '💡 ' + G.rich(q.hint))); });

    const ok = await new Promise(res => check.addEventListener('click', () => {
      const got = G.parse(entry);
      if (!got) { toast('הקלידו מספר'); return; }
      if (G.eq(got, q.ans)) return res(true);
      sfx.wrong(); R.miss();
      if (++tries >= 2) return res(false);
      entry = ''; val.textContent = ' '; box.classList.add('bad'); fb.className = 'shop-fb fb bad'; fb.textContent = 'לא בדיוק – נסו שוב (אפשר לקבל רמז)';
      setTimeout(() => box.classList.remove('bad'), 600);
    }));
    keys.remove(); hint.remove(); check.remove();
    box.classList.add(ok ? 'good' : 'bad');
    if (ok) { correct++; const first = tries === 0 && !hinted; if (first) clean++; xp += first ? 6 : 3; sfx.goal(); R.hit({ light: true }); }
    T.mark(n, ok);
    fb.className = 'shop-fb fb ' + (ok ? 'good' : 'bad'); fb.textContent = '';
    fb.append(h('p', {}, ok ? '✓ נכון!' : `✗ התשובה: ${G.fmt(q.ans)}`), h('div', { class: 'shop-why' }, G.rich(q.why)));
    const next = h('button', { class: 'btn primary' }, n === ROUNDS - 1 ? 'לתוצאות' : 'הבא ▶');
    actions.append(next);
    await waitClick(next, sc);
  }
  const perfect = clean === ROUNDS;
  return { xp: Math.min(70, xp + (perfect ? 8 : 0) + 5), correct, total: ROUNDS, run: R.best, completed: true, allPerfect: perfect,
    title: perfect ? 'הקופה סגורה – בלי טעויות!' : 'הקופה סגורה!', big: `${correct} / ${ROUNDS}`, lines: [`${clean} מתוך ${ROUNDS} בניסיון ראשון, בלי רמז`] };
}
