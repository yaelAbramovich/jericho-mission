// בונים את הקו: גרירת כרטיסים (עובד במגע) או לחיצה על שני כרטיסים להחלפה.
import { SEQUENCES } from '../content.js';
import { h, shuffle } from '../ui.js';
import { sfx } from '../audio.js';
import { waitClick } from './common.js';

function pickSeqs(chapter, count, ids) {
  if (ids) return ids.map(id => SEQUENCES.find(s => s.id === id));
  const cross = SEQUENCES.find(s => s.id === 'sx');
  if (chapter) {
    const own = shuffle(SEQUENCES.filter(s => s.ch === chapter));
    return [own[0], cross].slice(0, count);
  }
  return shuffle(SEQUENCES).slice(0, count + 1);
}

export async function run(el, { chapter = 0, count = 2, ids = null }, sc) {
  const seqs = pickSeqs(chapter, count, ids);
  let xp = 0, perfect = 0, cards = 0, good = 0;
  for (let n = 0; n < seqs.length; n++) {
    const seq = seqs[n];
    el.innerHTML = '';
    const list = h('div', { class: 'olist' });
    let order = shuffle(seq.items.map((_, i) => i));
    while (order.length > 1 && order.every((v, i) => v === i)) order = shuffle(order);
    order.forEach(i => list.append(h('div', { class: 'ocard', 'data-i': i }, h('span', { class: 'grip' }, '⋮⋮'), h('span', { class: 'ot' }, seq.items[i]))));
    const check = h('button', { class: 'btn primary glow' }, 'בדוק ✓');
    el.append(h('div', { class: 'h-head' }, h('b', {}, `${seq.title}`), h('small', {}, `${n + 1}/${seqs.length}`)),
      h('p', { class: 'sub' }, 'סדר מלמעלה (ראשון) למטה (אחרון). גרור כרטיס, או לחץ על שניים כדי להחליף.'),
      list, check);
    sortable(list, sc);
    await waitClick(check, sc);

    const cs = [...list.children];
    let right = 0;
    cs.forEach((c, j) => { const ok = +c.dataset.i === j; c.classList.add(ok ? 'right' : 'wrong'); if (ok) right++; });
    cards += cs.length; good += right;
    const all = right === cs.length;
    if (all) { perfect++; sfx.goal(); } else { sfx.wrong(); }
    xp += right * 4 + (all ? 8 : 2);
    check.remove();
    const nxt = h('button', { class: 'btn primary' }, n === seqs.length - 1 ? 'לתוצאות' : 'הבא ▶');
    el.append(h('div', { class: 'fb ' + (all ? 'good' : 'bad') }, h('p', {}, all ? 'סדר מושלם! 🔥' : `${right} מתוך ${cs.length} במקום הנכון. הסדר הנכון:`),
      !all && h('ol', { class: 'correct-order' }, seq.items.map(t => h('li', {}, t)))), nxt);
    list.classList.add('locked');
    await waitClick(nxt, sc);
  }
  return { xp: xp + 5, correct: good, total: cards, title: perfect === seqs.length ? 'הקו מושלם!' : 'הקו נבנה', big: `${good} / ${cards}`,
    lines: [`${perfect} מתוך ${seqs.length} סדרות מושלמות`] };
}

function sortable(list, sc) {
  let sel = null, drag = null;
  const clearSel = () => { if (sel) sel.classList.remove('sel'); sel = null; };
  list.addEventListener('pointerdown', e => {
    if (list.classList.contains('locked')) return;
    const card = e.target.closest('.ocard'); if (!card) return;
    const r = card.getBoundingClientRect();
    drag = { card, sx: e.clientX, sy: e.clientY, offY: e.clientY - r.top, left: r.left, w: r.width, ghost: null, moved: false, id: e.pointerId };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
  });
  function move(e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 8) return;
    if (!drag.moved) {
      drag.moved = true; clearSel();
      const g = drag.card.cloneNode(true); g.classList.add('ghost');
      Object.assign(g.style, { position: 'fixed', width: drag.w + 'px', left: drag.left + 'px', zIndex: 50, pointerEvents: 'none' });
      document.body.append(g); drag.ghost = g; drag.card.classList.add('dragging'); sfx.pick();
    }
    drag.ghost.style.top = (e.clientY - drag.offY) + 'px';
    const cy = e.clientY;
    const sibs = [...list.children].filter(c => c !== drag.card);
    const before = sibs.find(c => { const r = c.getBoundingClientRect(); return cy < r.top + r.height / 2; });
    if (before) { if (drag.card.nextSibling !== before) list.insertBefore(drag.card, before); }
    else if (list.lastChild !== drag.card) list.append(drag.card);
  }
  function end(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end);
    if (d.ghost) { d.ghost.remove(); d.card.classList.remove('dragging'); sfx.tap(); return; }
    if (e.type === 'pointercancel') return;
    // לחיצה: בחירה והחלפה
    if (!sel) { sel = d.card; sel.classList.add('sel'); sfx.pick(); }
    else if (sel === d.card) clearSel();
    else {
      const a = sel, b = d.card, ph = document.createElement('div');
      list.replaceChild(ph, a); list.replaceChild(a, b); list.replaceChild(b, ph);
      clearSel(); sfx.tap();
    }
  }
  sc.onDispose(() => { if (drag && drag.ghost) drag.ghost.remove(); });
}
