// בונים תרשים: לכל מערכת טכנולוגית מסווגים את הרכיבים – קלט / תהליך / פלט – ובסוף רואים את תרשים המלבנים הנכון.
// הנתונים מגיעים מהחבילה (PACK.diagrams): { id, units, name, icon, purpose, inputs, process, outputs }.
import { PACK } from '../subjects/index.js';
import { h, shuffle } from '../ui.js';
import { sfx } from '../audio.js';
import { waitClick, tally } from './common.js';
import { reactor } from '../react.js';
import * as State from '../state.js';

const KINDS = [['in', 'קלט'], ['proc', 'תהליך'], ['out', 'פלט']];
const LABEL = Object.fromEntries(KINDS);

// תרשים מלבנים: חצי קלט נכנסים מימין, מלבן התהליך באמצע, חצי פלט יוצאים שמאלה
export function blockDiagram(d) {
  const arrows = (list, cls) => h('div', { class: 'bd-col' }, list.map(t => h('div', { class: 'bd-arrow ' + cls }, t)));
  return h('div', { class: 'bdia' }, arrows(d.inputs, 'in'), h('div', { class: 'bd-box' }, h('small', {}, 'פעולה / תהליך'), h('b', {}, d.process.join(' · '))), arrows(d.outputs, 'out'));
}

export async function run(el, { chapter = 0, count = 3 }, sc) {
  const all = (PACK.diagrams || []).filter(d => !chapter || d.units.includes(chapter));
  const seen = new Set(State.seenList('diagrams'));
  const systems = [...shuffle(all.filter(d => !seen.has(d.id))), ...shuffle(all.filter(d => seen.has(d.id)))].slice(0, count);
  State.markSeen('diagrams', systems.map(d => d.id), 30);
  const tl = tally(systems.length), head = h('div', { class: 'h-head' }, h('b', {}, ''), tl.el);
  const stage = h('div', { class: 'dg' });
  el.append(head, stage);
  const R = reactor(el, sc);
  let xp = 5, right = 0, total = 0, perfect = 0; const missed = [];

  for (let n = 0; n < systems.length; n++) {
    const d = systems[n];
    head.querySelector('b').textContent = `מערכת ${n + 1} מתוך ${systems.length}`;
    stage.innerHTML = '';
    const chips = shuffle([...d.inputs.map(t => ({ t, k: 'in' })), ...d.process.map(t => ({ t, k: 'proc' })), ...d.outputs.map(t => ({ t, k: 'out' }))]);
    const check = h('button', { class: 'btn primary glow', disabled: true }, 'בדוק ✓');
    const rows = chips.map(c => {
      const row = h('div', { class: 'dg-chip' }, h('span', { class: 'dg-t' }, c.t),
        h('div', { class: 'dg-btns' }, KINDS.map(([k, l]) => h('button', { class: 'dg-btn', 'data-k': k, onclick: e => {
          if (row.classList.contains('locked')) return;
          sfx.pick(); c.pick = k; row.classList.add('assigned');
          row.querySelectorAll('.dg-btn').forEach(b => b.classList.toggle('on', b === e.currentTarget));
          check.disabled = !chips.every(x => x.pick);
        } }, l))));
      return row;
    });
    stage.append(
      h('div', { class: 'quote-card' }, h('small', {}, `${d.icon} ${d.name}`), h('p', { class: 'meaning' }, `המטרה: ${d.purpose}`)),
      h('p', { class: 'sub' }, 'לכל רכיב בחרו: קלט, תהליך או פלט'), h('div', { class: 'dg-list' }, rows), check);
    await waitClick(check, sc);

    let ok = 0;
    chips.forEach((c, i) => {
      const good = c.pick === c.k, row = rows[i];
      row.classList.add('locked', good ? 'right' : 'wrong'); if (good) ok++;
      if (!good) { row.append(h('small', { class: 'dg-fix' }, `זה ${LABEL[c.k]}`)); missed.push(`${d.name}: ${c.t} ← ${LABEL[c.k]}`); }
    });
    right += ok; total += chips.length;
    const all = ok === chips.length;
    tl.mark(n, all);
    if (all) { perfect++; sfx.goal(); R.hit({ big: true }); } else { sfx.wrong(); R.miss(); }
    xp += ok * 4 + (all ? 8 : 2);
    check.remove();
    const next = h('button', { class: 'btn primary' }, n === systems.length - 1 ? 'לתוצאות' : 'הבא ▶');
    stage.append(h('div', { class: 'fb ' + (all ? 'good' : 'bad') }, h('p', {}, all ? 'תרשים מושלם! 🔥' : `${ok} מתוך ${chips.length} נכון. זה התרשים הנכון:`), blockDiagram(d)), next);
    await waitClick(next, sc);
  }
  return { xp, correct: right, total, run: R.best, perfectSeqs: perfect, allPerfect: perfect === systems.length,
    title: perfect === systems.length ? 'כל התרשימים מושלמים!' : 'התרשימים נבנו', big: `${right} / ${total}`, lines: [`${perfect} מתוך ${systems.length} תרשימים מושלמים`, ...missed.slice(0, 3)] };
}
