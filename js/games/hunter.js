// דו-קרב פנדלים: מוצאים ציטוט בתנ"ך (פרק+פסוק) או מתאימים משמעות לציטוט.
import { QUOTES, hebNum, refText } from '../content.js';
import { h, shuffle } from '../ui.js';
import { sfx } from '../audio.js';
import { makePitch, waitClick, pickRound, pickDistractors, tally } from './common.js';
import { reactor } from '../react.js';

const FAST_FIND = 35;   // שניות – מהר = גול נקי
const FAST_MATCH = 9;
const POOL = QUOTES.filter(q => !q.extra);

export async function run(el, { chapter = 0, mode = 'find', count = 5 }, sc) {
  const items = pickRound(POOL, chapter, count);
  const pitch = makePitch(), tl = tally(items.length);
  const stage = h('div', { class: 'hunter' });
  const head = h('div', { class: 'h-head' }, h('b', {}, ''), tl.el);
  el.append(head, pitch.el, stage);
  const R = reactor(el, sc);
  let goals = 0, xp = 5, missed = [];
  const counter = head.querySelector('b');

  for (let i = 0; i < items.length; i++) {
    const q = items[i];
    counter.textContent = `בעיטה ${i + 1} מתוך ${items.length}`;
    pitch.reset();
    stage.innerHTML = '';
    sfx.whistle();
    let ok, fast, t0 = Date.now();

    if (mode === 'find') {
      let ch = 0, vs = 0;
      const kickBtn = h('button', { class: 'btn primary glow kick-btn', disabled: true }, 'בעיטה! ⚽');
      const clock = h('span', { class: 'clock' }, '0');
      sc.every(() => { clock.textContent = Math.floor((Date.now() - t0) / 1000); }, 1000);
      const upd = () => { kickBtn.disabled = !(ch && vs); };
      const chRow = h('div', { class: 'pick-row ch' }, [1, 2, 3, 4, 5].map(n => h('button', { class: 'pk', onclick: e => { sfx.pick(); ch = n; mark(chRow, e.currentTarget); upd(); } }, hebNum(n))));
      const vGrid = h('div', { class: 'pick-grid' }, Array.from({ length: 24 }, (_, k) => h('button', { class: 'pk', onclick: e => { sfx.pick(); vs = k + 1; mark(vGrid, e.currentTarget); upd(); } }, hebNum(k + 1))));
      stage.append(
        h('div', { class: 'quote-card' }, h('small', {}, 'מצא בתנ״ך את המקום של:'), h('q', {}, q.t), clock),
        h('div', { class: 'pick-label' }, 'פרק'), chRow,
        h('div', { class: 'pick-label' }, 'פסוק'), vGrid, kickBtn);
      await waitClick(kickBtn, sc);
      const secs = (Date.now() - t0) / 1000;
      ok = ch === q.c && vs === q.v; fast = secs <= FAST_FIND;
      lock(stage);
    } else {
      const wrong = pickDistractors(POOL, q, 3, chapter);
      const opts = shuffle([q, ...wrong]);
      stage.append(h('div', { class: 'quote-card' }, h('small', {}, 'איזה ציטוט מתאים?'), h('p', { class: 'meaning' }, q.m)));
      const btns = opts.map(o => h('button', { class: 'opt', 'data-id': o.id }, o.t));
      stage.append(h('div', { class: 'opts' }, btns));
      const pickedId = await new Promise(res => btns.forEach(b => b.addEventListener('click', () => res(b.dataset.id), { once: true })));
      ok = pickedId === q.id; fast = (Date.now() - t0) / 1000 <= FAST_MATCH;
      btns.forEach(b => { b.disabled = true; if (b.dataset.id === q.id) b.classList.add('right'); else if (b.dataset.id === pickedId) b.classList.add('wrong'); });
    }

    await pitch.kick(ok ? (fast ? 'goal' : 'almost') : 'save', sc);
    tl.mark(i, ok);
    if (ok) { goals++; xp += fast ? 10 : 7; sfx.correct(); R.hit({ noBurst: true }); } else { xp += 2; missed.push(q); R.miss(); }
    stage.querySelectorAll('.pick-row,.pick-grid,.pick-label,.kick-btn,.clock,.opts').forEach(n => n.remove());
    const msg = ok ? (fast ? 'מהיר ונקי! 🔥' : 'גול! אבל השוער כמעט הציל – נסה מהר יותר') : 'נעצר – המקום הנכון:';
    const next = h('button', { class: 'btn primary', onclick: () => {} }, i === items.length - 1 ? 'לתוצאות' : 'הבא ▶');
    stage.append(h('div', { class: 'fb ' + (ok ? 'good' : 'bad') }, h('p', {}, msg), !ok && h('div', { class: 'loc' }, refText(q.c, q.v), h('small', {}, `„${q.t}"`)), ok && h('div', { class: 'loc small' }, refText(q.c, q.v))), next);
    await Promise.race([waitClick(next, sc), sc.sleep(ok ? 2600 : 4500)]);
  }

  return {
    xp, correct: goals, total: items.length, run: R.best,
    title: goals >= 4 ? 'שריקת סיום – ניצחון!' : goals >= 2 ? 'שריקת סיום' : 'סיבוב אימון',
    big: `${goals} / ${items.length} גולים`,
    lines: missed.slice(0, 3).map(q => `${refText(q.c, q.v)} – ${q.t}`),
  };
}
function mark(row, btn) { row.querySelectorAll('.pk').forEach(b => b.classList.remove('on')); btn.classList.add('on'); }
function lock(root) { root.querySelectorAll('button').forEach(b => { b.disabled = true; }); }
