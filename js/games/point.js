// הנקודה זזה: כפל וחילוק ב-10, 100, 1,000 – מזיזים את הנקודה העשרונית על פס ספרות עד שהתוצאה נכונה.
// אזור 1 = כפל (ימינה), אזור 2 = חילוק (שמאלה), "כל האזורים" = שניהם. הקושי עולה בתוך הסבב (10 → 100 → 1,000).
import { h } from '../ui.js';
import { sfx } from '../audio.js';
import { waitClick, tally } from './common.js';
import { reactor } from '../react.js';
import * as G from '../subjects/math/gen.js';

const ROUNDS = 8, MAX_MOVES = 7;
const INT = ['יחידות', 'עשרות', 'מאות', 'אלפים', 'עשרות אלפים', 'מאות אלפים', 'מיליונים'];
const FRAC = ['עשיריות', 'מאיות', 'אלפיות', 'עשרות אלפיות', 'מאות אלפיות', 'מיליוניות'];

const toDigits = s => { const [i, f = ''] = s.split('.'); return { digits: (i + f).split(''), pp: i.length }; };
const valueOf = (digits, pp) => {                          // ספרות + מקום הנקודה → מספר מנורמל ("060" → "60", "0.600" → "0.6")
  const i = digits.slice(0, pp).join('').replace(/^0+(?=\d)/, '') || '0', f = digits.slice(pp).join('').replace(/0+$/, '');
  return f ? `${i}.${f}` : i;
};
const levelOf = n => (n < 3 ? 1 : n < 6 ? 2 : 3);
function question(level, ops) {
  for (;;) {
    const it = G.pick(ops) === 'mul' ? G.GEN.mul10(level) : G.GEN.div10(level);
    if (it.a !== it.q.split(' ')[0]) return it;             // התוצאה שונה מההתחלה (אחרת אין מה להזיז)
  }
}

export async function run(el, { chapter = 0 }, sc) {
  const ops = chapter === 1 ? ['mul'] : chapter === 2 ? ['div'] : ['mul', 'div'];
  const R = reactor(el, sc), T = tally(ROUNDS);
  let xp = 0, correct = 0, firstTry = 0;

  for (let n = 0; n < ROUNDS; n++) {
    const q = question(levelOf(n), ops), isMul = q.op === '×';
    const st = { ...toDigits(q.q.split(' ')[0]), moves: 0, tries: 0 };
    const orig = { digits: [...st.digits], pp: st.pp };
    const strip = h('div', { class: 'pt-strip', dir: 'ltr' });
    const counter = h('b', {}, '0');
    const fb = h('div', { class: 'pt-fb' });
    const left = h('button', { class: 'btn pt-mv', 'aria-label': 'הנקודה שמאלה' }, '◀'), right = h('button', { class: 'btn pt-mv', 'aria-label': 'הנקודה ימינה' }, '▶');
    const reset = h('button', { class: 'btn ghost' }, '↺ איפוס'), check = h('button', { class: 'btn primary' }, 'בדיקה ✓');
    const actions = h('div', { class: 'pt-actions' }, reset, check);
    el.innerHTML = '';
    el.append(h('div', { class: 'h-head' }, h('b', {}, 'הנקודה זזה'), T.el),
      h('div', { class: 'pt-task' }, G.ltrText(q.q)),
      h('p', { class: 'sub pt-how' }, isMul ? 'כפל: המספר גדל – הזיזו את הנקודה למקום הנכון' : 'חילוק: המספר קטן – הזיזו את הנקודה למקום הנכון'),
      strip, h('div', { class: 'pt-moves', dir: 'ltr' }, left, h('div', { class: 'pt-count' }, counter, h('small', {}, 'צעדים')), right), fb, actions);

    const draw = () => {
      strip.innerHTML = '';
      if (st.pp === 0) strip.append(h('div', { class: 'pt-dot' }, '●'));
      st.digits.forEach((d, j) => {
        const lead = j < st.pp - 1 && st.digits.slice(0, j + 1).every(x => x === '0');
        strip.append(h('div', { class: 'pt-dg' + (lead ? ' lead' : '') }, h('span', { class: 'pt-n' }, d), h('small', {}, j < st.pp ? INT[st.pp - 1 - j] : FRAC[j - st.pp])));
        if (j === st.pp - 1) strip.append(h('div', { class: 'pt-dot' }, '●'));
      });
      counter.textContent = st.moves;
    };
    const move = dir => {
      if (st.moves >= MAX_MOVES) return;
      if (dir > 0) { if (st.pp === st.digits.length) st.digits.push('0'); st.pp++; }
      else if (st.pp === 0) st.digits.unshift('0'); else st.pp--;
      st.moves++; sfx.tap(); draw();
    };
    left.addEventListener('click', () => move(-1)); right.addEventListener('click', () => move(1));
    reset.addEventListener('click', () => { st.digits = [...orig.digits]; st.pp = orig.pp; st.moves = 0; sfx.pick(); draw(); });
    draw();

    // בדיקה: נכון בניסיון ראשון / שני, או חושפים אחרי שתי טעויות
    const ok = await new Promise(res => {
      check.addEventListener('click', () => {
        if (valueOf(st.digits, st.pp) === q.a) return res(true);
        sfx.wrong(); R.miss();
        if (++st.tries >= 2) return res(false);
        fb.className = 'pt-fb bad'; fb.textContent = 'כמעט – בדקו לאיזה כיוון הנקודה צריכה לזוז'; st.tries === 1 && reset.classList.add('hint');
      });
    });
    left.disabled = right.disabled = reset.disabled = true;
    if (ok) { correct++; if (st.tries === 0) firstTry++; xp += st.tries === 0 ? 6 : 3; sfx.goal(); R.hit({}); } else { sfx.wrong(); }
    T.mark(n, ok);
    fb.className = 'pt-fb ' + (ok ? 'good' : 'bad');
    fb.textContent = '';
    fb.append(h('b', {}, ok ? '✓ נכון!' : `✗ התשובה: ${q.a}`), h('span', {}, ` ${q.rule}. ${G.rich(q.why)}`));
    check.remove(); reset.remove();
    const next = h('button', { class: 'btn primary' }, n === ROUNDS - 1 ? 'לתוצאות' : 'הבא ▶');
    actions.append(next);
    await waitClick(next, sc);
  }
  const perfect = firstTry === ROUNDS;
  return { xp: xp + (perfect ? 8 : 0) + 5, correct, total: ROUNDS, run: R.best, completed: true, allPerfect: perfect,
    title: perfect ? 'הנקודה תמיד במקום הנכון!' : 'הנקודה זזה!', big: `${correct} / ${ROUNDS}`, lines: [`${firstTry} מתוך ${ROUNDS} בניסיון ראשון`] };
}
