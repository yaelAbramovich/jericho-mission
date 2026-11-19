// שאלה עם תשובה שהיא שבר או מספר מעורב (חנות השברים): שלושה תאים – שלם, מונה, מכנה – ומקלדת על המסך. רמז, שני ניסיונות, והסבר.
// askFraction(el, sc, { head, T, story, unit, ans, hint, why, R, last }) → { ok, tries, hinted, finish() }.  ans = {n, d} (frac.js).
// מקבלים כל ערך שווה (גם 4/8 במקום 1/2): בודקים שוויון ערכים.
import { h, toast } from '../ui.js';
import { sfx } from '../audio.js';
import { waitClick } from './common.js';
import * as G from '../subjects/math/gen.js';
import * as Fr from '../subjects/fractions/frac.js';

const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '⌫', '0', 'next'];

export async function askFraction(el, sc, { head, T, story, unit, ans, hint, why, R, last = false }) {
  const val = { w: '', n: '', d: '' }; let active = 'w', tries = 0, hinted = false;
  const mk = (k, cls, kids) => h('button', { class: `ff ${cls}`, 'data-f': k, onclick: () => { active = k; sfx.tap(); paint(); } }, kids);
  const wBox = mk('w', 'ff-w', h('span', { class: 'val' }, ' ')), nBox = mk('n', 'ff-n', ' '), dBox = mk('d', 'ff-d', ' ');
  const entry = h('div', { class: 'shop-entry ff-entry', dir: 'ltr' }, wBox, h('div', { class: 'ff-frac' }, nBox, h('i', { class: 'ff-bar' }), dBox), h('span', { class: 'unit' }, unit));
  const fb = h('div', { class: 'shop-fb' });
  const keys = h('div', { class: 'shop-keys' }, KEYS.map(k => h('button', { class: 'skey' + (k === '⌫' ? ' del' : k === 'next' ? ' nx' : ''), 'data-k': k }, k === 'next' ? '↦' : k)));
  const hintBtn = h('button', { class: 'btn ghost' }, '💡 רמז'), check = h('button', { class: 'btn primary' }, 'בדיקה ✓');
  const actions = h('div', { class: 'shop-actions' }, hintBtn, check);
  function paint() {
    [[wBox, 'w'], [nBox, 'n'], [dBox, 'd']].forEach(([b, k]) => { b.classList.toggle('on', active === k); const t = val[k] || ' '; if (k === 'w') b.querySelector('.val').textContent = t; else b.textContent = t; });
  }
  el.innerHTML = '';
  el.append(h('div', { class: 'h-head' }, h('b', {}, head), T.el), h('div', { class: 'shop-story' }, story), entry, fb, keys, actions);
  paint();

  keys.addEventListener('click', e => {
    const b = e.target.closest('.skey'); if (!b) return; sfx.tap(); const k = b.dataset.k;
    if (k === '⌫') val[active] = val[active].slice(0, -1);
    else if (k === 'next') active = active === 'w' ? 'n' : active === 'n' ? 'd' : 'w';
    else if (val[active].length < 3) val[active] += k;
    paint();
  });
  hintBtn.addEventListener('click', () => { hinted = true; sfx.pick(); fb.className = 'shop-fb fb hint'; fb.textContent = ''; fb.append(h('p', {}, '💡 ' + hint)); });

  const value = () => {                                         // → שבר, או null אם הקלט חסר
    const hasF = val.n !== '' || val.d !== '';
    if (hasF && (val.n === '' || val.d === '' || +val.d === 0)) return 'partial';
    if (!hasF && val.w === '') return null;
    return hasF ? Fr.fromMixed(+val.w || 0, +val.n, +val.d) : Fr.F(+val.w, 1);
  };
  const ok = await new Promise(res => check.addEventListener('click', () => {
    const got = value();
    if (got === null) { toast('הקלידו מספר'); return; }
    if (got === 'partial') { toast('השלימו גם מונה וגם מכנה'); return; }
    if (Fr.eq(got, ans)) return res(true);
    sfx.wrong(); R.miss();
    if (++tries >= 2) return res(false);
    val.w = val.n = val.d = ''; active = 'w'; paint(); entry.classList.add('bad'); fb.className = 'shop-fb fb bad'; fb.textContent = 'לא בדיוק – נסו שוב (אפשר לקבל רמז)';
    setTimeout(() => entry.classList.remove('bad'), 600);
  }));
  keys.remove(); hintBtn.remove(); check.remove();
  entry.classList.add(ok ? 'good' : 'bad');
  fb.className = 'shop-fb fb ' + (ok ? 'good' : 'bad'); fb.textContent = '';
  fb.append(h('p', {}, ok ? '✓ נכון!' : `✗ התשובה: ${Fr.mixedStr(ans)}`), h('div', { class: 'shop-why' }, why));
  return { ok, tries, hinted, finish: async () => { const next = h('button', { class: 'btn primary' }, last ? 'לתוצאות' : 'הבא ▶'); actions.append(next); await waitClick(next, sc); } };
}
