// ערכת הרכיבים האינטראקטיביים לשיעורי החשבון: טבלת מקום מונפשת, גרירת ספרות, עשיריות, שרשרת פעולות ושאלות.
// כל רכיב: (step, api) => אלמנט. api = { done(), host, sc, win(), lose() }. לבדיקות אוטומטיות: לאלמנט יש __solve() שפותר אותו.
import { h, shuffle } from '../../ui.js';
import { sfx } from '../../audio.js';
import { celebrate } from '../../react.js';
import { shiftStr, ltr, powName, mulStr, divStr, decimals } from './numbers.js';
import { GEO_KINDS, figure, shapeSVG } from './geo.js';

const bold = s => { const f = document.createDocumentFragment(); String(s).split('**').forEach((p, i) => { if (p) f.append(i % 2 ? h('b', {}, p) : p); }); return f; };
const wait = ms => new Promise(r => setTimeout(r, ms));

// ---------- פעולות: '×10' / ':100' ----------
export const parseOp = s => { const sym = s[0], n = Number(s.slice(1).replace(',', '')); return { sym, n, k: (sym === '×' ? 1 : -1) * Math.round(Math.log10(n)), label: `${sym} ${powName(n)}` }; };
const PLACES = k => (Math.abs(k) === 1 ? 'מקום אחד' : Math.abs(k) === 2 ? 'שני מקומות' : 'שלושה מקומות');

// ---------- טבלת מקום ----------
const INT = 4, FRAC = 3, TW = 38, GAP = 16, WIDTH = (INT + FRAC) * TW + GAP;
const NAMES = { 3: 'אלפים', 2: 'מאות', 1: 'עשרות', 0: 'יחידות', '-1': 'עשיריות', '-2': 'מאיות', '-3': 'אלפיות' };
const xOf = c => (INT - 1 - c) * TW + (c < 0 ? GAP : 0);
const COLS = [3, 2, 1, 0, -1, -2, -3];
export function parseCols(s) {
  const [i, f = ''] = String(s).split('.'), out = {};
  [...i].forEach((d, ix) => { out[i.length - 1 - ix] = d; });
  [...f].forEach((d, j) => { out[-(j + 1)] = d; });
  return out;
}
const inRange = cols => Object.keys(cols).every(c => +c <= INT - 1 && +c >= -FRAC);

// לוח: מספר עם ספרות שמחליקות בין עמודות. empty = לוח ריק עם משבצות לגרירה.
export function makeBoard({ num = null, empty = false, onTile = null, small = false } = {}) {
  const el = h('div', { class: 'pv' + (small ? ' small' : ''), dir: 'ltr', style: { width: WIDTH + 'px' } });
  const caps = h('div', { class: 'pv-caps' }, h('span', { class: 'int', style: { width: INT * TW + 'px' } }, 'שלמים'), h('span', { class: 'frac', style: { width: FRAC * TW + 'px', marginInlineStart: GAP + 'px' } }, 'שברים'));
  const row = h('div', { class: 'pv-row' });
  const names = h('div', { class: 'pv-names' });
  for (const c of COLS) {
    row.append(h('i', { class: 'pv-col ' + (c < 0 ? 'frac' : 'int'), style: { left: xOf(c) + 'px' } }));
    names.append(h('span', { style: { left: xOf(c) + 'px' } }, NAMES[c]));
  }
  row.append(h('b', { class: 'pv-point', style: { left: INT * TW + GAP / 2 - 6 + 'px' } }, '.'));
  el.append(caps, row, names);
  const B = { el, row, tiles: [], slots: [], val: num, busy: false };

  const mk = (d, col, cls = '') => {
    const t = { d, col, el: h('span', { class: 'pv-t ' + cls, style: { transform: `translateX(${xOf(col)}px)` } }, d) };
    if (onTile) t.el.addEventListener('click', () => onTile(t));
    row.append(t.el); return t;
  };
  B.render = () => {
    B.tiles.forEach(t => t.el.remove()); B.tiles = [];
    const cols = parseCols(B.val);
    for (const [c, d] of Object.entries(cols)) B.tiles.push(mk(d, +c));
  };
  if (empty) {
    for (const c of COLS) { const s = { col: c, chip: null, el: h('div', { class: 'pv-slot', 'data-col': c, style: { left: xOf(c) + 'px' } }) }; row.append(s.el); B.slots.push(s); }
  } else if (num != null) B.render();

  B.canShift = k => inRange(parseCols(shiftStr(B.val, k)));
  // הזזה: k>0 כפל, k<0 חילוק. מחזיר הבטחה שמסתיימת אחרי האנימציה
  B.shift = async k => {
    if (B.busy || !B.canShift(k)) return false;
    B.busy = true;
    const val = shiftStr(B.val, k), exp = parseCols(val);
    B.tiles.forEach(t => { t.col += k; t.el.style.transform = `translateX(${xOf(t.col)}px)`; });
    el.classList.add('moving'); el.dataset.dir = k > 0 ? 'l' : 'r';
    await wait(700);
    // ספרות שנעלמו (אפסים מובילים / סופיים) מתפוגגות, ואפסים חדשים מתמלאים בחגיגיות
    for (const t of [...B.tiles]) if (exp[t.col] === undefined || +t.col > INT - 1 || +t.col < -FRAC) { t.el.classList.add('gone'); B.tiles.splice(B.tiles.indexOf(t), 1); setTimeout(() => t.el.remove(), 400); }
    for (const [c, d] of Object.entries(exp)) if (!B.tiles.some(t => t.col === +c)) B.tiles.push(mk(d, +c, 'fill'));
    B.val = val; el.classList.remove('moving');
    await wait(350); B.busy = false; return true;
  };
  B.reset = n => { B.val = n; B.render(); };
  return B;
}

// ---------- שלב: טבלת המקום (חקר / הפעלת כפתורים) ----------
export function board(step, api) {
  const { num, ops = [], explain = false } = step, parsed = ops.map(parseOp);
  const touched = new Set(), used = new Set();
  const cap = h('p', { class: 'pv-cap' }, bold(step.hint || (ops.length ? 'לחצו על הכפתורים וצפו מה קורה לספרות' : 'לחצו על ספרות כדי לגלות מה הערך שלהן')));
  const eq = h('div', { class: 'pv-eq', dir: 'ltr' }, ltr(num));
  const B = makeBoard({ num, onTile: explain ? t => {
    if (B.busy) return; sfx.pick(); touched.add(t.col);
    B.tiles.forEach(x => x.el.classList.toggle('sel', x === t));
    const name = NAMES[t.col], val = shiftStr(t.d, t.col);
    cap.replaceChildren(bold(`הספרה **${t.d}** נמצאת בעמודת ה**${name}**, לכן היא שווה ${t.d} ${name} = ${ltr(val)}`));
    if (touched.size >= (step.need || 3)) api.done();
  } : null });
  const okFrom = k => inRange(parseCols(shiftStr(num, k)));
  const btns = parsed.map(p => h('button', { class: 'pv-op ' + (p.k > 0 ? 'mul' : 'div'), onclick: () => run(p) }, p.label));
  async function run(p) {
    if (B.busy || !okFrom(p.k)) return;
    sfx.swipe(); btns.forEach(b => b.disabled = true);
    if (B.val !== num) { B.reset(num); await wait(150); }   // כל פעולה מתחילה מהמספר המקורי
    const before = B.val; await B.shift(p.k); used.add(p.label);
    eq.replaceChildren(ltr(`${before} ${p.sym} ${powName(p.n)} = ${B.val}`)); eq.classList.remove('pop'); void eq.offsetWidth; eq.classList.add('pop');
    cap.replaceChildren(bold(`הספרות זזו **${PLACES(p.k)}** ${p.k > 0 ? 'שמאלה' : 'ימינה'} – כל ספרה ${p.k > 0 ? 'גדלה' : 'קטנה'} פי ${powName(p.n)}. **הנקודה נשארה במקומה.**`));
    refresh();
    if (parsed.every(x => used.has(x.label))) api.done();
  }
  const refresh = () => btns.forEach((b, i) => { b.disabled = !okFrom(parsed[i].k); b.classList.toggle('used', used.has(parsed[i].label)); });
  const reset = h('button', { class: 'pv-reset', onclick: () => { if (B.busy) return; sfx.tap(); B.reset(num); eq.replaceChildren(ltr(num)); refresh(); } }, '↺ מההתחלה');
  const el = h('div', { class: 'step board-step' }, step.title && h('h3', {}, step.title), step.text && h('p', { class: 'say' }, bold(step.text)), eq, B.el, cap, parsed.length ? h('div', { class: 'pv-ops' }, btns, reset) : null);
  refresh();
  el.__solve = async () => {
    if (explain) { for (const t of B.tiles.slice(0, step.need || 3)) t.el.click(); return; }
    for (const p of parsed) { await run(p); await wait(30); }
  };
  return el;
}

// ---------- שלב: גוררים ספרות למקומן ----------
export function place(step, api) {
  const probs = step.problems; let idx = 0;
  const stage = h('div', { class: 'step place-step' });
  if (step.title) stage.append(h('h3', {}, step.title));
  const body = h('div', { class: 'pl-body' });
  stage.append(body);
  let cur = null;

  function start() {
    const p = probs[idx], op = parseOp(p.op), res = shiftStr(p.num, op.k), exp = parseCols(res);
    const before = makeBoard({ num: p.num, small: true });
    const after = makeBoard({ empty: true });
    const tray = h('div', { class: 'pl-tray' });
    const msg = h('p', { class: 'pv-cap' }, bold(`סדרו את התוצאה: גררו כל ספרה למקום שלה (או לחצו על ספרה ואז על עמודה).`));
    const check = h('button', { class: 'btn primary', disabled: true }, 'בדוק ✓');
    const digits = Object.entries(exp).sort((a, b) => b[0] - a[0]).map(e => e[1]);
    const chips = shuffle(digits).map(d => ({ d, slot: null, locked: false, el: h('span', { class: 'pv-t dchip', 'data-d': d }, d) }));
    let selected = null;
    const sync = () => { check.disabled = !chips.every(c => c.slot); chips.forEach(c => c.el.classList.toggle('sel', c === selected)); };
    const toTray = c => { if (c.slot) { c.slot.chip = null; c.slot = null; } tray.append(c.el); c.el.classList.remove('placed'); };
    const put = (c, s) => {
      if (c.locked || s.chip && s.chip.locked) return;
      if (s.chip) toTray(s.chip);
      if (c.slot) c.slot.chip = null;
      c.slot = s; s.chip = c; s.el.append(c.el); c.el.classList.add('placed'); selected = null; sfx.pick(); sync();
    };
    after.slots.forEach(s => s.el.addEventListener('click', () => { if (selected) put(selected, s); }));
    chips.forEach(c => {
      tray.append(c.el);
      c.el.addEventListener('pointerdown', e => {
        if (c.locked) return; e.preventDefault(); c.el.setPointerCapture(e.pointerId);
        const sx = e.clientX, sy = e.clientY, r = c.el.getBoundingClientRect(); let ghost = null, moved = false;
        const slotAt = (x, y) => { const el2 = document.elementsFromPoint(x, y).find(n => n.classList && n.classList.contains('pv-slot') && after.el.contains(n)); return el2 && after.slots.find(s => s.el === el2); };
        const mv = ev => {
          if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) { moved = true; ghost = c.el.cloneNode(true); ghost.classList.add('ghost'); ghost.style.width = r.width + 'px'; ghost.style.height = r.height + 'px'; document.body.append(ghost); c.el.classList.add('lifting'); }
          if (ghost) { ghost.style.left = ev.clientX - r.width / 2 + 'px'; ghost.style.top = ev.clientY - r.height / 2 + 'px'; const s = slotAt(ev.clientX, ev.clientY); after.slots.forEach(x => x.el.classList.toggle('hot', x === s)); }
        };
        const up = ev => {
          c.el.removeEventListener('pointermove', mv); c.el.removeEventListener('pointercancel', up);
          if (ghost) ghost.remove(); c.el.classList.remove('lifting'); after.slots.forEach(x => x.el.classList.remove('hot'));
          if (moved) { const s = slotAt(ev.clientX, ev.clientY); if (s) put(c, s); }
          else if (c.slot) { toTray(c); sync(); } else { selected = selected === c ? null : c; sfx.tap(); sync(); }
        };
        c.el.addEventListener('pointermove', mv); c.el.addEventListener('pointerup', up, { once: true }); c.el.addEventListener('pointercancel', up, { once: true });
      });
    });
    check.addEventListener('click', async () => {
      let bad = 0;
      for (const s of after.slots) {
        const want = exp[s.col];
        if (s.chip && s.chip.d === want) { s.chip.locked = true; s.chip.el.classList.add('ok'); }
        else if (s.chip) { bad++; s.chip.el.classList.add('no'); }
      }
      // ספרה במקום שאין בו ספרה בתוצאה הנכונה – גם היא שגויה (נבדק למעלה: want === undefined)
      if (bad) {
        sfx.wrong(); api.lose();
        msg.replaceChildren(bold(`כמעט! ${op.sym === '×' ? 'בכפל' : 'בחילוק'} ב-${powName(op.n)} הספרות זזות **${PLACES(op.k)}** ${op.k > 0 ? 'שמאלה' : 'ימינה'}, והנקודה נשארת במקומה.`));
        await wait(650);
        chips.forEach(c => { if (!c.locked) { c.el.classList.remove('no'); toTray(c); } });
        sync(); return;
      }
      sfx.goal(); celebrate(api.host, 22, false); api.win();
      msg.replaceChildren(bold(`נכון! ${ltr(`${p.num} ${op.sym} ${powName(op.n)} = ${res}`)}`));
      check.disabled = true; await wait(1100);
      idx++; if (idx < probs.length) start(); else api.done();
    });
    body.replaceChildren(
      h('div', { class: 'pl-eq', dir: 'ltr' }, ltr(`${p.num} ${op.sym} ${powName(op.n)} = ?`)),
      h('small', { class: 'pl-lab' }, `לפני · תרגיל ${idx + 1} מתוך ${probs.length}`), before.el,
      h('small', { class: 'pl-lab' }, 'אחרי · כאן מניחים את התוצאה'), after.el, tray, msg, check);
    cur = { chips, after, exp, put, check };
  }
  start();
  stage.__solve = async () => {
    for (let i = idx; i < probs.length; i++) {
      const { chips, after, exp, put, check } = cur; const pool = [...chips];
      for (const s of after.slots) { const want = exp[s.col]; if (want === undefined) continue; const c = pool.find(x => x.d === want); pool.splice(pool.indexOf(c), 1); put(c, s); }
      check.click(); await wait(1500);
    }
  };
  return stage;
}

// ---------- שלב: שאלות (גם גורם חסר □) ----------
export function quiz(step, api) {
  const qs = step.qs; let i = 0, wrong = 0;
  const el = h('div', { class: 'step quiz-step' }, step.title && h('h3', {}, step.title));
  const body = h('div', { class: 'qz' }); el.append(body);
  function show() {
    const q = qs[i], opts = q.fixed ? q.opts : shuffle(q.opts);
    const blank = h('span', { class: 'blank' }, '?');
    const eqEl = q.eq ? h('div', { class: 'qz-eq', dir: 'ltr' }, ...q.eq.split('□').flatMap((part, k, a) => k < a.length - 1 ? [part, blank] : [part])) : null;
    const fb = h('div', { class: 'qz-fb' });
    const next = h('button', { class: 'btn primary glow', style: { display: 'none' } }, i === qs.length - 1 ? 'סיימתי ✓' : 'השאלה הבאה ◀');
    const btns = opts.map(o => h('button', { class: 'qz-opt' + (q.optFig ? ' withfig' : ''), onclick: () => pick(o, btns[opts.indexOf(o)]) }, q.optFig && q.optFig[o] && h('span', { class: 'qz-fig', html: shapeSVG(q.optFig[o], 110) }), o));
    function pick(o, b) {
      if (b.disabled) return;
      if (o === q.a) {
        sfx.correct(); celebrate(api.host, 18, false); api.win();
        btns.forEach(x => x.disabled = true); b.classList.add('right'); blank.textContent = o; blank.classList.add('filled');
        fb.replaceChildren(bold(`✅ ${q.why}`)); fb.className = 'qz-fb good'; next.style.display = '';
      } else {
        sfx.wrong(); api.lose(); wrong++; b.disabled = true; b.classList.add('no');
        fb.replaceChildren(bold(q.hint ? `❌ ${q.hint}` : '❌ לא בדיוק. נסו שוב!')); fb.className = 'qz-fb bad';
      }
    }
    next.addEventListener('click', () => { sfx.tap(); if (++i < qs.length) show(); else api.done(); });
    body.replaceChildren(
      ...[h('small', { class: 'qz-n' }, `שאלה ${i + 1} מתוך ${qs.length}`), q.q && h('p', { class: 'qz-q' }, bold(q.q)), q.fig && figure(q.fig), eqEl,
        h('div', { class: 'qz-opts' + (q.opts.length > 3 ? ' grid' : ''), dir: q.fixed ? 'ltr' : null }, btns), fb, next].filter(Boolean));
    body.__btns = btns;
  }
  show();
  el.__solve = async () => {
    for (let k = i; k < qs.length; k++) { const q = qs[i]; const btn = body.__btns.find(b => b.textContent === q.a); btn.click(); await wait(30); body.querySelector('.btn.primary').click(); await wait(30); }
  };
  return el;
}

// ---------- שלב: מכסים עשיריות ----------
export function tenths(step, api) {
  const probs = step.problems; let idx = 0;
  const el = h('div', { class: 'step tenths-step' }, step.title && h('h3', {}, step.title), step.text && h('p', { class: 'say' }, bold(step.text)));
  const body = h('div', { class: 'tnth' }); el.append(body);
  let cur = null;
  function start() {
    const p = probs[idx], total = p.a * p.times, nBars = Math.ceil(total / 10);
    const bars = Array.from({ length: nBars }, () => h('div', { class: 'tn-bar', dir: 'ltr' }, Array.from({ length: 10 }, () => h('i', {}))));
    const cells = bars.flatMap(b => [...b.children]);
    const line = h('div', { class: 'tn-line', dir: 'ltr' }, ltr(`${shiftStr(String(p.a), -1)} × ${p.times} = ?`));
    const cap = h('p', { class: 'pv-cap' }, bold(`כל פס הוא **שלם אחד** מחולק ל-10 עשיריות. לחצו כדי להוסיף קבוצה של **${p.a} עשיריות**, ${p.times} פעמים.`));
    let groups = 0, merged = false;
    const btn = h('button', { class: 'btn primary glow' }, `➕ קבוצה של ${p.a} עשיריות`);
    async function add() {
      if (groups < p.times) {
        sfx.pick(); const from = groups * p.a; for (let j = 0; j < p.a; j++) { cells[from + j].className = 'on g' + (groups % 4); }
        groups++; line.replaceChildren(ltr(`${groups} × ${p.a} עשיריות = ${groups * p.a} עשיריות`));
        if (groups === p.times) { btn.textContent = total >= 10 ? '📦 אגדו עשר עשיריות לשלם' : '✨ מה זה כמספר עשרוני?'; cap.replaceChildren(bold(`קיבלנו **${total} עשיריות**. עכשיו נהפוך אותן למספר עשרוני.`)); }
      } else if (!merged) {
        merged = true; sfx.capture();
        const wholes = Math.floor(total / 10), rem = total % 10, res = shiftStr(String(total), -1);
        bars.slice(0, wholes).forEach(b => b.classList.add('whole'));
        line.replaceChildren(ltr(`${total} עשיריות = ${wholes ? `${wholes} שלם ו-${rem}` : rem} עשיריות = ${res}`));
        cap.replaceChildren(bold(wholes ? `עשר עשיריות הן **שלם אחד**! נשארו ${rem} עשיריות. לכן ${ltr(`${shiftStr(String(p.a), -1)} × ${p.times} = ${res}`)}.` : `${total} עשיריות הן ${ltr(res)}.`));
        celebrate(api.host, 22, false); api.win();
        btn.textContent = idx < probs.length - 1 ? 'התרגיל הבא ◀' : 'מעולה! ✓';
      } else { idx++; if (idx < probs.length) start(); else { btn.disabled = true; api.done(); } }
    }
    btn.addEventListener('click', add);
    body.replaceChildren(h('small', { class: 'pl-lab' }, `תרגיל ${idx + 1} מתוך ${probs.length}`), line, h('div', { class: 'tn-bars' }, bars), cap, btn);
    cur = { add, p, total };
  }
  start();
  el.__solve = async () => { for (let k = idx; k < probs.length; k++) { const n = cur.p.times + 2; for (let j = 0; j < n; j++) { cur.add(); await wait(20); } await wait(30); } };
  return el;
}

// ---------- שלב: שרשרת פעולות (מוצאים את הפעולה החסרה) ----------
const ALL_OPS = ['×10', '×100', '×1,000', ':10', ':100', ':1,000'];
export function chain(step, api) {
  const probs = step.puzzles; let idx = 0;
  const el = h('div', { class: 'step chain-step' }, step.title && h('h3', {}, step.title), step.text && h('p', { class: 'say' }, bold(step.text)));
  const body = h('div', { class: 'ch' }); el.append(body);
  let cur = null;
  function start() {
    const pz = probs[idx], ops = pz.ops.map(parseOp), hiddenAt = pz.hide;
    const vals = [pz.start]; ops.forEach(o => vals.push(shiftStr(vals.at(-1), o.k)));
    const nodes = vals.map((v, i) => h('div', { class: 'ch-node' + (i === 0 ? ' first' : i === vals.length - 1 ? ' last' : '') + (i > hiddenAt && i < vals.length - 1 ? ' q' : '') }, i > hiddenAt && i < vals.length - 1 ? '?' : v));
    const arrows = ops.map((o, i) => h('div', { class: 'ch-arrow' + (i === hiddenAt ? ' q' : '') }, h('b', {}, i === hiddenAt ? '?' : o.label), h('s', {}, '→')));
    const row = h('div', { class: 'ch-row', dir: 'ltr' }, nodes.flatMap((n, i) => i < arrows.length ? [n, arrows[i]] : [n]));
    const cap = h('p', { class: 'pv-cap' }, bold('איזו פעולה חסרה כדי שנגיע לתוצאה שבסוף?'));
    const opts = h('div', { class: 'ch-opts', dir: 'ltr' }, ALL_OPS.map(s => h('button', { class: 'pv-op ' + (s[0] === '×' ? 'mul' : 'div'), onclick: e => pick(s, e.currentTarget) }, s.replace('×', '× ').replace(':', ': '))));
    function pick(s, b) {
      if (b.disabled) return;
      if (parseOp(s).k === ops[hiddenAt].k) {
        sfx.goal(); celebrate(api.host, 22, false); api.win();
        arrows[hiddenAt].classList.remove('q'); arrows[hiddenAt].firstChild.textContent = ops[hiddenAt].label;
        nodes.forEach((n, i) => { n.classList.remove('q'); n.textContent = vals[i]; n.classList.add('pop'); });
        opts.querySelectorAll('button').forEach(x => x.disabled = true);
        cap.replaceChildren(bold(`נכון! ${ltr(`${vals[hiddenAt]} ${ops[hiddenAt].sym} ${powName(ops[hiddenAt].n)} = ${vals[hiddenAt + 1]}`)}`));
        setTimeout(() => { idx++; if (idx < probs.length) start(); else api.done(); }, 1500);
      } else { sfx.wrong(); api.lose(); b.disabled = true; b.classList.add('no'); cap.replaceChildren(bold('לא בדיוק. חשבו כמה מקומות זזו הספרות בין שני המספרים.')); }
    }
    body.replaceChildren(h('small', { class: 'pl-lab' }, `חידה ${idx + 1} מתוך ${probs.length}`), row, cap, opts);
    cur = { ops, hiddenAt, opts };
  }
  start();
  el.__solve = async () => { for (let k = idx; k < probs.length; k++) { const { ops, hiddenAt, opts } = cur; [...opts.querySelectorAll('button')].find(b => parseOp(b.textContent.replace(/\s/g, '')).k === ops[hiddenAt].k).click(); await wait(1700); } };
  return el;
}

// ---------- שלב: הסבר (כרטיס עם כללים מונפשים) ----------
export function say(step, api) {
  const el = h('div', { class: 'step say-step' },
    step.hero && h('div', { class: 'lhero' }, step.hero), step.title && h('h3', {}, step.title),
    step.text && h('p', { class: 'say' }, bold(step.text)), step.fig && figure(step.fig),
    step.rules && h('div', { class: 'lrules' }, step.rules.map(([a, b], i) => h('div', { class: 'lrule', style: { animationDelay: i * 0.35 + 's' } }, h('b', { dir: 'ltr' }, a), h('span', {}, bold(b))))),
    step.ex && h('div', { class: 'ex-card' }, step.ex.map(x => h('div', { dir: 'ltr' }, ltr(x)))),
    step.note && h('div', { class: 'doc-note' }, bold(step.note)));
  api.done(); el.__solve = async () => {};
  return el;
}

// ---------- שלב: מגדילים את שני המספרים בחילוק (המחלק הופך לשלם) ----------
export function scale(step, api) {
  const probs = step.puzzles; let idx = 0;
  const el = h('div', { class: 'step scale-step' }, step.title && h('h3', {}, step.title), step.text && h('p', { class: 'say' }, bold(step.text)));
  const body = h('div', { class: 'sc' }); el.append(body);
  let cur = null;
  function start() {
    const p = probs[idx], ans = divStr(p.a, p.b), need = decimals(p.b);
    const num = (v, cls = '') => h('div', { class: 'sc-n ' + cls }, v);
    const ma = h('div', { class: 'sc-mul' }), mb = h('div', { class: 'sc-mul' });
    const na = num(p.a), nb = num(p.b);
    const row = h('div', { class: 'sc-row', dir: 'ltr' }, h('div', { class: 'sc-col' }, ma, na), h('div', { class: 'sc-op' }, ':'), h('div', { class: 'sc-col' }, mb, nb));
    const cap = h('p', { class: 'pv-cap' }, bold(`המחלק **${p.b}** הוא עשרוני. הגדילו את **שני** המספרים באותו מספר, עד שהמחלק יהיה שלם.`));
    const res = h('div', { class: 'tn-line', dir: 'ltr' }, ltr(`${p.a} : ${p.b} = ?`));
    let done = false;
    const btns = [10, 100, 1000].map(n => h('button', { class: 'pv-op mul', onclick: () => apply(n) }, `× ${powName(n)}`));
    function apply(n) {
      if (done) return; const k = Math.round(Math.log10(n)), a2 = shiftStr(p.a, k), b2 = shiftStr(p.b, k);
      sfx.swipe(); na.textContent = a2; nb.textContent = b2; ma.textContent = ma.dataset.t = `× ${powName(n)}`; mb.textContent = `× ${powName(n)}`;
      [na, nb].forEach(x => { x.classList.remove('pop'); void x.offsetWidth; x.classList.add('pop'); });
      if (decimals(b2) === 0) {
        done = true; sfx.goal(); celebrate(api.host, 22, false); api.win(); nb.classList.add('ok');
        res.replaceChildren(ltr(`${p.a} : ${p.b} = ${a2} : ${b2} = ${ans}`));
        cap.replaceChildren(bold(k > need ? `נכון! אפשר גם כך, אבל ×${powName(10 ** need)} כבר הספיק. **המנה לא השתנתה: ${ans}**` : `מעולה! המחלק הוא שלם, ו**המנה לא השתנתה: ${ans}**`));
        btns.forEach(b => b.disabled = true); setTimeout(() => { idx++; if (idx < probs.length) start(); else api.done(); }, 1700);
      } else { sfx.wrong(); api.lose(); cap.replaceChildren(bold(`המחלק עדיין עשרוני (${b2}). נסו להגדיל יותר.`)); }
    }
    body.replaceChildren(h('small', { class: 'pl-lab' }, `תרגיל ${idx + 1} מתוך ${probs.length}`), row, res, cap, h('div', { class: 'pv-ops' }, btns));
    cur = { apply, need };
  }
  start();
  el.__solve = async () => { for (let k = idx; k < probs.length; k++) { cur.apply(10 ** cur.need); await wait(1900); } };
  return el;
}

// ---------- שלב: מסך חושף (שלבי חילוק ארוך וכו') ----------
export function reveal(step, api) {
  const F = step.frames; let i = 0;
  const pre = h('pre', { class: 'rv-pre', dir: 'ltr' }), cap = h('p', { class: 'say rv-cap' });
  const btn = h('button', { class: 'btn primary glow' }, 'השלב הבא ◀');
  const show = () => { pre.textContent = F[i].rows.join('\n'); pre.classList.remove('pop'); void pre.offsetWidth; pre.classList.add('pop'); cap.replaceChildren(bold(F[i].cap)); btn.style.display = i < F.length - 1 ? '' : 'none'; if (i === F.length - 1) { api.done(); } };
  btn.addEventListener('click', () => { sfx.pick(); i++; show(); });
  const el = h('div', { class: 'step reveal-step' }, step.title && h('h3', {}, step.title), step.text && h('p', { class: 'say' }, bold(step.text)), pre, cap, btn);
  show(); el.__solve = async () => { i = F.length - 1; show(); };
  return el;
}

// ---------- שלב: גורם קטן/שווה/גדול מ-1 – משווים את המכפלה למספר ----------
export function factor(step, api) {
  const a = step.a, A = Number(a), seen = new Set();
  const bar = (cls, lab) => { const fill = h('i', { style: { width: '0%' } }), val = h('b', {}); return { fill, val, el: h('div', { class: 'fc-bar ' + cls }, h('small', {}, lab), h('div', { class: 'fc-track', dir: 'ltr' }, fill), val) }; };
  const b0 = bar('base', 'המספר'), b1 = bar('prod', 'המכפלה');
  const w = v => Math.min(100, Number(v) / (A * 2.2) * 100) + '%';
  b0.fill.style.width = w(a); b0.val.textContent = a;
  const cap = h('p', { class: 'pv-cap' }, bold(`בחרו גורם והשוו את המכפלה אל **${a}**.`));
  const eq = h('div', { class: 'pv-eq', dir: 'ltr' }, ltr(`${a} × ? = ?`));
  const chips = step.stops.map(s => h('button', { class: 'pv-op fc-chip', onclick: () => pickB(s) }, s));
  function pickB(s) {
    sfx.pick(); const prod = mulStr(a, s), cat = Number(s) < 1 ? 'lt' : Number(s) === 1 ? 'eq' : 'gt'; seen.add(cat);
    b1.fill.style.width = w(prod); b1.val.textContent = prod; b1.el.dataset.cat = cat;
    eq.replaceChildren(ltr(`${a} × ${s} = ${prod}`)); eq.classList.remove('pop'); void eq.offsetWidth; eq.classList.add('pop');
    chips.forEach(c => c.classList.toggle('used', c.textContent === s));
    cap.replaceChildren(bold(cat === 'lt' ? `${s} **קטן מ-1** ← המכפלה **קטנה** מ-${a}` : cat === 'eq' ? `כפל ב-1 ← המכפלה **שווה** ל-${a}` : `${s} **גדול מ-1** ← המכפלה **גדולה** מ-${a}`));
    if (seen.size === 3) api.done();
  }
  const el = h('div', { class: 'step factor-step' }, step.title && h('h3', {}, step.title), step.text && h('p', { class: 'say' }, bold(step.text)), eq, b0.el, b1.el, cap, h('div', { class: 'pv-ops' }, chips));
  el.__solve = async () => { for (const s of [step.stops[0], step.stops.find(x => Number(x) === 1), step.stops.at(-1)]) { pickB(s); await wait(20); } };
  return el;
}

export const KINDS = { say, board, place, quiz, tenths, chain, scale, reveal, factor, ...GEO_KINDS };

