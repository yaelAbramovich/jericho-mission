// רכיבי השיעורים בשברים: אוספים פרוסות (כפל שלם בשבר), מפרקים שלמים (מספר מעורב ← שבר מדומה), ושאלות עם שברים בנויים.
// כל רכיב: (step, api) => אלמנט. api = { done(), host, win(), lose() }. לבדיקות אוטומטיות: לאלמנט יש __solve() שפותר אותו.
import { h, shuffle } from '../../ui.js';
import { sfx } from '../../audio.js';
import { celebrate } from '../../react.js';
import { say } from '../math/kit.js';
import { fracSVG, figure } from '../math/geo.js';
import { mixedStr } from './frac.js';

const bold = s => { const f = document.createDocumentFragment(); String(s).split('**').forEach((p, i) => { if (p) f.append(i % 2 ? h('b', {}, p) : p); }); return f; };
const wait = ms => new Promise(r => setTimeout(r, ms));

// ---------- אוספים פרוסות: n × a/b ----------
export function fbars(step, api) {
  const P = step.puzzles; let idx = 0, cur = null;
  const el = h('div', { class: 'step fbars-step' }, step.title && h('h3', {}, step.title), step.text && h('p', { class: 'say' }, bold(step.text)));
  const body = h('div', { class: 'fbs' }); el.append(body);
  function start() {
    const { n, a, b } = P[idx]; let got = 0, done = false;
    const tray = h('div', { class: 'fb-tray' }), eq = h('div', { class: 'fb-eq', dir: 'ltr' }, '?'), cap = h('p', { class: 'pv-cap' }, bold('**לחצו** על כל "פעם" כדי להוסיף את הפרוסות הצבועות שלה למגש.'));
    const btns = Array.from({ length: n }, (_, i) => h('button', { class: 'fb-bar', 'data-i': i, onclick: () => take(i) }, h('small', {}, `פעם ${i + 1}`), h('span', { html: fracSVG({ b, a }, 120) })));
    const render = () => {
      const total = got * a, bars = [];
      for (let k = 0; k < Math.floor(total / b); k++) bars.push({ b, a: b });
      if (total % b || !bars.length) bars.push({ b, a: total % b });
      tray.innerHTML = fracSVG({ bars }, 220);
      eq.replaceChildren(got ? `${got} × ${a}⁄${b} = ${total}⁄${b}` : '?');
    };
    function take(i) {
      if (done || btns[i].disabled) return;
      sfx.pick(); btns[i].disabled = true; btns[i].classList.add('used'); got++; render();
      if (got < n) return;
      done = true; sfx.goal(); celebrate(api.host, 22, false); api.win();
      const total = n * a, w = Math.floor(total / b), r = total % b;
      eq.replaceChildren(total >= b ? `${n} × ${a}⁄${b} = ${total}⁄${b} = ${mixedStr({ n: total, d: b })}` : `${n} × ${a}⁄${b} = ${total}⁄${b}`);
      const wTxt = w === 1 ? 'שלם אחד' : `${w} שלמים`, times = w === 1 ? 'פעם אחת' : `${w} פעמים`;
      cap.replaceChildren(bold(total >= b ? `המגש התמלא ${times}! ${total} חלקים של 1⁄${b}: **${wTxt}**${r === 0 ? '' : ` ועוד **${r}⁄${b}**`}. המכנה לא השתנה.` : `**${total}** חלקים של 1⁄${b}. הכפלנו רק את המונה – **המכנה נשאר ${b}**.`));
      setTimeout(() => { idx++; if (idx < P.length) start(); else api.done(); }, 2300);
    }
    body.replaceChildren(h('small', { class: 'pl-lab' }, `תרגיל ${idx + 1} מתוך ${P.length}`), h('div', { class: 'fb-bars' }, btns), h('div', { class: 'fb-arrow' }, '⬇'), tray, eq, cap);
    render(); cur = { btns, take };
  }
  start();
  el.__solve = async () => { for (let k = idx; k < P.length; k++) { for (const b of [...cur.btns]) { if (!b.disabled) { b.click(); await wait(40); } } await wait(2400); } };
  return el;
}

// ---------- מפרקים שלמים: w a/b = (w×b + a)/b ----------
export function fsplit(step, api) {
  const P = step.puzzles; let idx = 0, cur = null;
  const el = h('div', { class: 'step fsplit-step' }, step.title && h('h3', {}, step.title), step.text && h('p', { class: 'say' }, bold(step.text)));
  const body = h('div', { class: 'fbs' }); el.append(body);
  function start() {
    const { w, a, b } = P[idx]; const split = Array(w).fill(false); let done = false;
    const eq = h('div', { class: 'fb-eq', dir: 'ltr' }, `${w} ${a}⁄${b} = ?`), cap = h('p', { class: 'pv-cap' }, bold(`כל שלם אפשר לפרק ל-**${b}** חלקים של 1⁄${b}. **לחצו על כל שלם** כדי לפרק אותו.`));
    const count = h('div', { class: 'fb-count' }), svgOf = i => fracSVG({ bars: [{ b: split[i] ? b : 1, a: split[i] ? b : 1 }] }, 120);
    const btns = Array.from({ length: w }, (_, i) => h('button', { class: 'fb-bar', 'data-i': i, onclick: () => take(i) }, h('small', {}, 'שלם'), h('span', { html: svgOf(i) })));
    const part = h('div', { class: 'fb-bar static' }, h('small', {}, 'החלק'), h('span', { html: fracSVG({ b, a }, 120) }));
    const parts = () => split.filter(Boolean).length * b + a;
    function take(i) {
      if (done || split[i]) return; split[i] = true; sfx.pick(); btns[i].disabled = true; btns[i].classList.add('used'); btns[i].querySelector('span').innerHTML = svgOf(i);
      count.replaceChildren(`${parts()} חלקים של 1⁄${b}`);
      if (!split.every(Boolean)) return;
      done = true; sfx.goal(); celebrate(api.host, 22, false); api.win();
      eq.replaceChildren(`${w} ${a}⁄${b} = ${w * b + a}⁄${b}`);
      cap.replaceChildren(bold(`${w} שלמים הם ${w} × ${b} = **${w * b}** חלקים, ועוד ${a} חלקים: **${w * b + a}⁄${b}**.`));
      setTimeout(() => { idx++; if (idx < P.length) start(); else api.done(); }, 2300);
    }
    count.replaceChildren(`${a} חלקים של 1⁄${b}`);
    body.replaceChildren(h('small', { class: 'pl-lab' }, `תרגיל ${idx + 1} מתוך ${P.length}`), h('div', { class: 'fb-bars' }, btns, part), count, eq, cap);
    cur = { btns, take };
  }
  start();
  el.__solve = async () => { for (let k = idx; k < P.length; k++) { for (const b of [...cur.btns]) { if (!b.disabled) { b.click(); await wait(40); } } await wait(2400); } };
  return el;
}

// ---------- שאלות (כמו quiz של החשבון, אבל עם שברים בנויים: הכפתור מזוהה לפי data-o ולא לפי הטקסט) ----------
export function quiz(step, api) {
  const qs = step.qs; let i = 0;
  const el = h('div', { class: 'step quiz-step' }, step.title && h('h3', {}, step.title));
  const body = h('div', { class: 'qz' }); el.append(body);
  function show() {
    const q = qs[i], opts = q.fixed ? q.opts : shuffle(q.opts), blank = h('span', { class: 'blank' }, '?');
    const eqEl = q.eq ? h('div', { class: 'qz-eq', dir: 'ltr' }, ...q.eq.split('□').flatMap((part, k, a) => (k < a.length - 1 ? [part, blank] : [part]))) : null;
    const fb = h('div', { class: 'qz-fb' });
    const next = h('button', { class: 'btn primary glow', style: { display: 'none' } }, i === qs.length - 1 ? 'סיימתי ✓' : 'השאלה הבאה ◀');
    const btns = opts.map(o => h('button', { class: 'qz-opt', 'data-o': o, onclick: () => pick(o, btns[opts.indexOf(o)]) }, o));
    function pick(o, b) {
      if (b.disabled) return;
      if (o === q.a) {
        sfx.correct(); celebrate(api.host, 18, false); api.win(); btns.forEach(x => { x.disabled = true; }); b.classList.add('right'); blank.textContent = o; blank.classList.add('filled');
        fb.replaceChildren(bold(`✅ ${q.why}`)); fb.className = 'qz-fb good'; next.style.display = '';
      } else {
        sfx.wrong(); api.lose(); b.disabled = true; b.classList.add('no');
        fb.replaceChildren(bold(q.hint ? `❌ ${q.hint}` : '❌ לא בדיוק. נסו שוב!')); fb.className = 'qz-fb bad';
      }
    }
    next.addEventListener('click', () => { sfx.tap(); if (++i < qs.length) show(); else api.done(); });
    body.replaceChildren(...[h('small', { class: 'qz-n' }, `שאלה ${i + 1} מתוך ${qs.length}`), q.q && h('p', { class: 'qz-q' }, bold(q.q)), q.fig && figure(q.fig), eqEl,
      h('div', { class: 'qz-opts' + (q.opts.length > 3 ? ' grid' : ''), dir: q.fixed ? 'ltr' : null }, btns), fb, next].filter(Boolean));
    body.__btns = btns;
  }
  show();
  el.__solve = async () => {
    for (let k = i; k < qs.length; k++) { const q = qs[i]; body.__btns.find(b => b.dataset.o === q.a).click(); await wait(30); body.querySelector('.btn.primary').click(); await wait(30); }
  };
  return el;
}

export const KINDS = { say, quiz, fbars, fsplit };
