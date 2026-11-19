// שאלה עם תשובה מספרית ומקלדת על המסך (משותף ל"החנות" ול"הסדנה"): סיפור, תיבת הקלדה, רמז, שני ניסיונות, והסבר בסוף.
// askNumber(el, sc, { head, T, story, unit, ans, hint, why, R, last }) → { ok, tries, hinted }.  ans = {u,d} (gen.js).
import { h, toast } from '../ui.js';
import { sfx } from '../audio.js';
import { waitClick } from './common.js';
import * as G from '../subjects/math/gen.js';

const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫'];

export async function askNumber(el, sc, { head, T, story, unit, ans, hint, why, R, last = false, integer = false }) {
  let entry = '', tries = 0, hinted = false;
  const val = h('span', { class: 'val' }, ' '), box = h('div', { class: 'shop-entry' }, val, h('span', { class: 'unit' }, unit));
  const fb = h('div', { class: 'shop-fb' });
  const keys = h('div', { class: 'shop-keys' }, KEYS.filter(k => !(integer && k === '.')).map(k => h('button', { class: 'skey' + (k === '⌫' ? ' del' : ''), 'data-k': k }, k)));
  const hintBtn = h('button', { class: 'btn ghost' }, '💡 רמז'), check = h('button', { class: 'btn primary' }, 'בדיקה ✓');
  const actions = h('div', { class: 'shop-actions' }, hintBtn, check);
  el.innerHTML = '';
  el.append(h('div', { class: 'h-head' }, h('b', {}, head), T.el), h('div', { class: 'shop-story' }, story), box, fb, keys, actions);

  keys.addEventListener('click', e => {
    const b = e.target.closest('.skey'); if (!b) return; sfx.tap();
    const k = b.dataset.k;
    if (k === '⌫') entry = entry.slice(0, -1);
    else if (k === '.') { if (!entry.includes('.')) entry = (entry || '0') + '.'; }
    else if (entry.length < 9) entry += k;
    val.textContent = entry || ' ';
  });
  hintBtn.addEventListener('click', () => { hinted = true; sfx.pick(); fb.className = 'shop-fb fb hint'; fb.textContent = ''; fb.append(h('p', {}, '💡 ' + G.rich(hint))); });

  const ok = await new Promise(res => check.addEventListener('click', () => {
    const got = G.parse(entry);
    if (!got) { toast('הקלידו מספר'); return; }
    if (G.eq(got, ans)) return res(true);
    sfx.wrong(); R.miss();
    if (++tries >= 2) return res(false);
    entry = ''; val.textContent = ' '; box.classList.add('bad'); fb.className = 'shop-fb fb bad'; fb.textContent = 'לא בדיוק – נסו שוב (אפשר לקבל רמז)';
    setTimeout(() => box.classList.remove('bad'), 600);
  }));
  keys.remove(); hintBtn.remove(); check.remove();
  box.classList.add(ok ? 'good' : 'bad');
  fb.className = 'shop-fb fb ' + (ok ? 'good' : 'bad'); fb.textContent = '';
  fb.append(h('p', {}, ok ? '✓ נכון!' : `✗ התשובה: ${G.fmt(ans)}`), h('div', { class: 'shop-why' }, G.rich(why)));
  return { ok, tries, hinted, finish: async () => { const next = h('button', { class: 'btn primary' }, last ? 'לתוצאות' : 'הבא ▶'); actions.append(next); await waitClick(next, sc); } };
}
