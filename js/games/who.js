// מי אמר? ציטוט + 4 דוברים לבחירה.
import { QUOTES, WHO, refText } from '../content.js';
import { h, shuffle, sample } from '../ui.js';
import { sfx } from '../audio.js';
import { pickRound, waitClick, tally } from './common.js';
import { reactor } from '../react.js';
import { powerBar, fiftyButton } from '../powerups.js';

const POOL = QUOTES.filter(q => q.who);
const ALL = Object.keys(WHO);

export async function run(el, { chapter = 0, count = 5 }, sc) {
  const items = pickRound(POOL, chapter, count);
  const tl = tally(items.length);
  const head = h('div', { class: 'h-head' }, h('b', {}), tl.el);
  const stage = h('div', { class: 'who' });
  el.append(head, stage);
  const R = reactor(el, sc);
  let right = 0, xp = 5, wrongs = [];
  for (let i = 0; i < items.length; i++) {
    const q = items[i];
    head.querySelector('b').textContent = `שאלה ${i + 1} מתוך ${items.length}`;
    // דוברים מהפרק קודם; משלימים משאר הדוברים רק אם אין מספיק בפרק
    const here = ALL.filter(k => k !== q.who && POOL.some(x => x.who === k && (!chapter || x.c === chapter)));
    const fill = sample(ALL.filter(k => k !== q.who && !here.includes(k)), 3);
    const opts = shuffle([q.who, ...[...sample(here, 3), ...fill].slice(0, 3)]);
    const btns = opts.map(k => h('button', { class: 'opt', 'data-k': k }, WHO[k]));
    stage.innerHTML = '';
    stage.append(h('div', { class: 'quote-card big' }, h('small', {}, 'מי אמר?'), h('q', {}, q.t)),
      ...powerBar(fiftyButton(btns, b => b.dataset.k === q.who)), h('div', { class: 'opts' }, btns));
    const k = await new Promise(res => btns.forEach(b => b.addEventListener('click', () => res(b.dataset.k), { once: true })));
    const ok = k === q.who;
    btns.forEach(b => { b.disabled = true; if (b.dataset.k === q.who) b.classList.add('right'); else if (b.dataset.k === k) b.classList.add('wrong'); });
    tl.mark(i, ok);
    if (ok) { right++; xp += 9; sfx.correct(); R.hit(); } else { xp += 2; wrongs.push(q); sfx.wrong(); R.miss(); }
    const next = h('button', { class: 'btn primary' }, i === items.length - 1 ? 'לתוצאות' : 'הבא ▶');
    stage.append(h('div', { class: 'fb ' + (ok ? 'good' : 'bad') }, h('p', {}, ok ? 'נכון! 🎯' : `זה היה: ${WHO[q.who]}`), h('div', { class: 'loc small' }, refText(q.c, q.v))), next);
    await Promise.race([waitClick(next, sc), sc.sleep(ok ? 1800 : 3600)]);
  }
  return { xp, correct: right, total: items.length, run: R.best, title: right >= 4 ? 'זיהוי מושלם!' : 'סבב הסתיים', big: `${right} / ${items.length}`,
    lines: wrongs.slice(0, 3).map(q => `„${q.t}" – ${WHO[q.who]}`) };
}
