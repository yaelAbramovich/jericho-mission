// קו השברים: גוררים סמן למקום של שבר או מספר מעורב על קו מספרים, או קוראים לאיזה מספר מצביע החץ.
// כל שלם מחולק לחלקים שווים (למשל רבעים); הקושי עולה בתוך הסבב: קו מ-0 עד 1, עד 2, עד 3 (מספרים מעורבים).
import { h } from '../ui.js';
import { sfx } from '../audio.js';
import { waitClick, tally } from './common.js';
import { reactor } from '../react.js';
import * as FG from '../subjects/fractions/fgen.js';
import * as Fr from '../subjects/fractions/frac.js';

export const __test = { cur: null };
const ROUNDS = 8;
const levelOf = n => (n < 3 ? 1 : n < 6 ? 2 : 3);
const ltr = s => `⁦${s}⁩`;
const txt = (k, d) => Fr.mixedOf(Math.floor(k / d), k % d, d);          // k חלקים של 1/d → "2 3⁄4"

function makeRound(level, n) {
  const M = level, d = FG.pick(level === 1 ? [2, 3, 4, 5] : level === 2 ? [2, 3, 4, 5, 6, 8] : [2, 3, 4, 5]), steps = M * d;
  let k; do { k = FG.R(1, steps - 1); } while (k % d === 0);              // לא מספר שלם: מחפשים חלק
  const cand = Array.from({ length: steps - 1 }, (_, i) => i + 1).filter(c => c % d !== 0);       // מקומות אפשריים על הקו (לא שלמים)
  // קריאת חץ דורשת 4 תשובות שונות; על קו קטן (למשל חצאים בין 0 ל-1) אין מספיק מקומות, ולכן הסבב הוא גרירה
  return { M, d, steps, k, cand, kind: n % 2 && cand.length >= 4 ? 'read' : 'drag', target: txt(k, d) };
}

function lineEl(r, mark) {
  const ticks = Array.from({ length: r.steps + 1 }, (_, i) => h('div', { class: 'nl-tk' + (i % r.d === 0 ? ' big' : ''), style: { left: (i / r.steps) * 100 + '%' } }, h('i'), i % r.d === 0 && h('span', {}, String(i / r.d))));
  const trk = h('div', { class: 'nl-track' }, h('div', { class: 'nl-axis' }), ticks);
  const pin = h('div', { class: 'nl-pin' }, '▼'); pin.hidden = true;
  const okMark = h('div', { class: 'nl-ok' }, '✓'); okMark.hidden = true;
  trk.append(...[mark === 'arrow' && h('div', { class: 'nl-arrow', style: { left: (r.k / r.steps) * 100 + '%' } }, '▼'), mark === 'pin' && pin, okMark].filter(Boolean));
  return { el: h('div', { class: 'nl', dir: 'ltr' }, trk), trk, pin, okMark };
}

export async function run(el, opts, sc) {
  const R = reactor(el, sc), T = tally(ROUNDS);
  let correct = 0;
  for (let n = 0; n < ROUNDS; n++) {
    const r = makeRound(levelOf(n), n + 1), read = r.kind === 'read';
    const L = lineEl(r, read ? 'arrow' : 'pin');
    el.innerHTML = '';
    el.append(h('div', { class: 'h-head' }, h('b', {}, 'קו השברים'), T.el), h('p', { class: 'nl-q' }, read ? 'לאיזה מספר מצביע החץ?' : ['גררו את הסמן למקום של ', h('b', {}, ltr(r.target))]), L.el);
    __test.cur = { kind: r.kind, target: r.target, k: r.k, steps: r.steps, d: r.d };
    let good, text;
    if (read) {
      const near = r.cand.filter(c => c !== r.k).sort((a, b) => Math.abs(a - r.k) - Math.abs(b - r.k) || FG.R(-1, 1)).slice(0, 5);   // הקרובים אל התשובה: הכי מבלבלים
      const choices = FG.shuffle([r.k, ...FG.shuffle(near).slice(0, 3)]).map(k => txt(k, r.d));
      const btns = choices.map(v => h('button', { class: 'opt', 'data-v': v }, ltr(v)));
      el.append(h('div', { class: 'nl-mc' }, btns));
      const picked = await new Promise(res => btns.forEach(b => b.addEventListener('click', () => res(b.dataset.v), { once: true })));
      btns.forEach(b => { b.disabled = true; if (b.dataset.v === r.target) b.classList.add('right'); else if (b.dataset.v === picked) b.classList.add('wrong'); });
      good = picked === r.target;
    } else {
      const check = h('button', { class: 'btn primary nl-check' }, 'בדיקה ✓'); check.disabled = true;
      el.append(h('p', { class: 'nl-hint' }, 'גררו על הקו עם האצבע (אפשר לתקן) ואז לחצו "בדיקה"'), check);
      let x = null, drag = false;
      const setX = e => { const b = L.trk.getBoundingClientRect(); x = Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)); L.pin.hidden = false; L.pin.style.left = x * 100 + '%'; check.disabled = false; };
      L.el.addEventListener('pointerdown', e => { drag = true; L.el.setPointerCapture(e.pointerId); setX(e); });
      L.el.addEventListener('pointermove', e => { if (drag) setX(e); });
      L.el.addEventListener('pointerup', () => { drag = false; }); L.el.addEventListener('pointercancel', () => { drag = false; });
      await waitClick(check, sc);
      check.remove(); el.querySelector('.nl-hint').remove();
      good = Math.abs(x * r.steps - r.k) <= 0.45;                          // בתוך חצי חלק מהמקום הנכון
      L.okMark.hidden = false; L.okMark.style.left = (r.k / r.steps) * 100 + '%';
    }
    text = good ? `${ltr(r.target)} נמצא בדיוק שם.` : `כל שלם מחולק ל-${r.d} חלקים שווים. ${ltr(r.target)} נמצא אחרי ${r.k} חלקים של 1⁄${r.d} מהאפס.`;
    if (good) { correct++; sfx.correct(); R.hit({ light: true }); } else { sfx.wrong(); R.miss(); }
    T.mark(n, good);
    el.append(h('div', { class: 'fb ' + (good ? 'good' : 'bad') }, h('p', {}, good ? '✓ מדויק!' : '✗ לא בדיוק'), h('div', { class: 'nl-why' }, text)));
    const next = h('button', { class: 'btn primary' }, n === ROUNDS - 1 ? 'לתוצאות' : 'הבא ▶');
    el.append(next);
    await waitClick(next, sc);
  }
  const perfect = correct === ROUNDS;
  return { xp: Math.min(70, correct * 6 + 5 + (perfect ? 8 : 0)), correct, total: ROUNDS, run: R.best, completed: true, allPerfect: perfect,
    title: perfect ? 'קו השברים אצלך!' : 'סיימת את הקו', big: `${correct} / ${ROUNDS}`, lines: [`רצף שיא: ${R.best}`] };
}
