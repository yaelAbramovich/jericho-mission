// קו מספרים: גוררים סמן למקום של מספר עשרוני, או קוראים לאיזה מספר מצביע החץ.
// הקושי עולה בתוך הסבב: עשיריות → מאיות → זום (קודם מקרבים בעשיריות, ואז מדייקים במאיות). מתאים לאזורים 1–2.
import { h } from '../ui.js';
import { sfx } from '../audio.js';
import { waitClick, tally } from './common.js';
import { reactor } from '../react.js';
import * as G from '../subjects/math/gen.js';

export const __test = { cur: null };                  // לבדיקות: { kind, target, k, coarse } של השלב הנוכחי
const ROUNDS = 8;
const levelOf = n => (n < 3 ? 1 : n < 6 ? 2 : 3);
// קו = 10 רווחים; סימון i הוא (L+i)/10^t
const tickVal = (L, t, i) => G.fmt(G.D(L + i, t));

function makeRound(level, n) {
  const a = G.R(0, 8), b = G.R(0, 9), k = G.R(1, 9), kind = n % 2 ? 'read' : 'drag';
  if (level === 1) return { kind, stages: [{ L: a * 10, t: 1, k }], target: tickVal(a * 10, 1, k) };
  if (level === 2) return { kind, stages: [{ L: (a * 10 + b) * 10, t: 2, k }], target: tickVal((a * 10 + b) * 10, 2, k) };
  const L2 = (a * 10 + b) * 10;
  return { kind: 'zoom', stages: [{ L: a * 10, t: 1, k: b, coarse: true }, { L: L2, t: 2, k }], target: tickVal(L2, 2, k) };
}

function lineEl(s, mark) {
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const lab = s.t === 1 || i === 0 || i === 5 || i === 10;
    return h('div', { class: 'nl-tk' + (i % 5 === 0 ? ' big' : ''), style: { left: i * 10 + '%' } }, h('i'), lab && h('span', {}, tickVal(s.L, s.t, i)));
  });
  const trk = h('div', { class: 'nl-track' }, h('div', { class: 'nl-axis' }), ticks);
  const pin = h('div', { class: 'nl-pin' }, '▼'); pin.hidden = true;
  const okMark = h('div', { class: 'nl-ok' }, '✓'); okMark.hidden = true;
  trk.append(...[mark === 'arrow' && h('div', { class: 'nl-arrow', style: { left: s.k * 10 + '%' } }, '▼'), mark === 'pin' && pin, okMark].filter(Boolean));
  return { el: h('div', { class: 'nl', dir: 'ltr' }, trk), trk, pin, okMark };
}

export async function run(el, opts, sc) {
  const R = reactor(el, sc), T = tally(ROUNDS);
  let correct = 0;

  for (let n = 0; n < ROUNDS; n++) {
    const r = makeRound(levelOf(n), n + 1);
    let ok = true, text = '';
    el.innerHTML = '';
    for (let si = 0; si < r.stages.length && ok; si++) {
      const s = r.stages[si], read = r.kind === 'read', last = si === r.stages.length - 1;
      const prompt = read ? 'לאיזה מספר מצביע החץ?' : r.kind === 'zoom' ? (si === 0 ? `גררו את הסמן למקום של ${G.ltrText(r.target)} – קודם בערך` : `🔍 זום! עכשיו בדיוק: ${G.ltrText(r.target)}`) : `גררו את הסמן למקום של ${G.ltrText(r.target)}`;
      const L = lineEl(s, read ? 'arrow' : 'pin');
      el.innerHTML = '';
      el.append(h('div', { class: 'h-head' }, h('b', {}, 'קו מספרים'), T.el), h('p', { class: 'nl-q' }, prompt), L.el);
      __test.cur = { kind: r.kind, target: r.target, k: s.k, coarse: !!s.coarse };
      let st;                                                       // תוצאת השלב: { good, x? }
      if (read) {
        const set = new Set([s.k]); while (set.size < 4) set.add(G.R(1, 9));
        const choices = G.shuffle([...set]).map(k => tickVal(s.L, s.t, k));
        const btns = choices.map(v => h('button', { class: 'opt', 'data-v': v }, G.ltrText(v)));
        el.append(h('div', { class: 'nl-mc' }, btns));
        const picked = await new Promise(res => btns.forEach(b => b.addEventListener('click', () => res(b.dataset.v), { once: true })));
        btns.forEach(b => { b.disabled = true; if (b.dataset.v === r.target) b.classList.add('right'); else if (b.dataset.v === picked) b.classList.add('wrong'); });
        st = { good: picked === r.target };
        text = st.good ? `החץ מצביע על ${G.ltrText(r.target)}.` : `החץ מצביע על ${G.ltrText(r.target)}. סופרים את הרווחים מהמספר השמאלי.`;
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
        const pos = x * 10;                                          // המקום בקו, ביחידות של רווח
        const good = s.coarse ? pos >= s.k - 0.15 && pos <= s.k + 1.15 : Math.abs(pos - s.k) <= 0.45;
        L.okMark.hidden = false; L.okMark.style.left = ((s.coarse ? s.k + 0.5 : s.k) * 10) + '%';
        st = { good };
        if (s.coarse && good) { sfx.pick(); continue; }              // זום: ממשיכים לשלב המדויק
        text = good ? `${G.ltrText(r.target)} נמצא בדיוק שם.` : s.coarse ? `${G.ltrText(r.target)} נמצא בין ${tickVal(s.L, 1, s.k)} ל־${tickVal(s.L, 1, s.k + 1)}.` : `${G.ltrText(r.target)} נמצא במקום המסומן ב־✓.`;
      }
      ok = st.good;
    }
    if (ok) { correct++; sfx.correct(); R.hit({ light: true }); } else { sfx.wrong(); R.miss(); }
    T.mark(n, ok);
    el.append(h('div', { class: 'fb ' + (ok ? 'good' : 'bad') }, h('p', {}, ok ? '✓ מדויק!' : '✗ לא בדיוק'), h('div', { class: 'nl-why' }, text)));
    const next = h('button', { class: 'btn primary' }, n === ROUNDS - 1 ? 'לתוצאות' : 'הבא ▶');
    el.append(next);
    await waitClick(next, sc);
  }
  const perfect = correct === ROUNDS;
  return { xp: Math.min(70, correct * 6 + 5 + (perfect ? 8 : 0)), correct, total: ROUNDS, run: R.best, completed: true, allPerfect: perfect,
    title: perfect ? 'קו המספרים אצלך!' : 'סיימת את הקו', big: `${correct} / ${ROUNDS}`, lines: [`רצף שיא: ${R.best}`] };
}
