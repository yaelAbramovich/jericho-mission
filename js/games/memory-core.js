// ליבת משחק הזיכרון (משותפת לזיכרון עשרוני ולזיכרון גיאומטרי): מסך הגדרות, לוח קלפים מתהפכים, שחקן אחד או שניים, הסבר אחרי התאמה.
// קלף: { set, t, he?, svg?, why } – טקסט (he = עברית, אחרת ביטוי מתמטי משמאל לימין) או ציור SVG.
import { h } from '../ui.js';
import { sfx } from '../audio.js';
import { waitClick } from './common.js';
import { reactor } from '../react.js';
import { rich, ltrText } from '../subjects/math/gen.js';

export const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
export const dim = s => ltrText(s.replace('x', '×'));              // "4×8" – מבודד, אחרת בתוך עברית מוצג הפוך ("8×4")
const loadCfg = (key, defaults) => { try { return { ...defaults, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch { return { ...defaults }; } };
const saveCfg = (key, c) => { try { localStorage.setItem(key, JSON.stringify(c)); } catch { /* מצב פרטי */ } };

// ---------- מסך הגדרות ----------
// spec: { key, title, defaults, canTriples, sizes: { pairs: [[id, שם]], triples: [...] }, levels: [[id, שם]] | null, levelModes: ['pairs'],
//        minHeight: { '4x9': 700 } – לוח שמוצע רק במסך גבוה מספיק (אחרת הטקסט בקלפים קטן מדי) }
export async function memorySetup(el, sc, spec) {
  const cfg = loadCfg(spec.key, spec.defaults);
  const sizesOf = mode => spec.sizes[mode].filter(([k]) => !(spec.minHeight && spec.minHeight[k] > innerHeight));
  if (!spec.canTriples) cfg.mode = 'pairs';
  if (!sizesOf(cfg.mode).some(([k]) => k === cfg.size)) cfg.size = sizesOf(cfg.mode)[1][0];
  const box = h('div', { class: 'mem-setup' }), go = h('button', { class: 'btn primary glow' }, 'התחלה ▶');
  const row = (title, key, opts) => h('div', {}, h('h3', { class: 'mem-h' }, title), h('div', { class: 'chips' }, opts.map(([k, l]) =>
    h('button', { class: 'chip' + (cfg[key] === k ? ' on' : ''), 'data-k': key, 'data-v': k, onclick: () => { sfx.tap(); cfg[key] = k; if (key === 'mode') cfg.size = sizesOf(k)[1][0]; draw(); } }, key === 'size' ? `${l} · ${dim(k)}` : l))));
  function draw() {
    box.innerHTML = '';
    box.append(...[h('p', { class: 'sub' }, spec.intro || 'הופכים קלפים ומוצאים את מה שמתאים זה לזה. אחרי כל התאמה מופיע הסבר קצר.'),
      spec.canTriples && row('סוג משחק', 'mode', [['pairs', 'זוגות'], ['triples', 'שלישיות']]),
      row('גודל הלוח', 'size', sizesOf(cfg.mode)),
      spec.levels && (!spec.levelModes || spec.levelModes.includes(cfg.mode)) && row('רמה', 'level', spec.levels),
      row('שחקנים', 'players', [['1', 'שחקן אחד'], ['2', 'שניים (בתורות)']])].filter(Boolean));   // בלי false: במצב הבדיקות append(false) זורק שגיאה
  }
  draw();
  el.append(h('div', { class: 'h-head' }, h('b', {}, spec.title)), box, go);
  await waitClick(go, sc);
  saveCfg(spec.key, cfg);
  return cfg;
}

// ---------- המשחק ----------
// B = { cols, rows, k, deck: [קלפים], nSets }; cfg.players = '1' | '2'; cfg.size = "4x6" (לתצוגה בסיכום)
export function playMemory(el, sc, B, cfg) {
  const two = cfg.players === '2', R = reactor(el, sc);
  const st = { open: [], lock: false, moves: 0, found: 0, secs: 0, cur: 0, score: [0, 0], done: false };
  const cards = B.deck.map(c => ({ ...c, open: false, done: false }));
  el.innerHTML = '';

  const clock = h('b', {}, '0:00'), movesEl = h('b', {}, '0');
  const pl = [h('div', { class: 'mem-pl on' }), h('div', { class: 'mem-pl p2' })];
  const refresh = () => {
    movesEl.textContent = st.moves;
    if (two) pl.forEach((p, i) => { p.className = 'mem-pl' + (i ? ' p2' : '') + (st.cur === i ? ' on' : ''); p.textContent = `שחקן ${i + 1} · ${st.score[i]}`; });
  };
  const head = h('div', { class: 'mem-head' }, two ? pl : [h('div', { class: 'mem-pl on' }, 'מהלכים · ', movesEl), h('div', { class: 'mem-pl' }, '⏱ ', clock)]);
  const board = h('div', { class: 'mem-board', style: { gridTemplateColumns: `repeat(${B.cols}, 1fr)`, gridTemplateRows: `repeat(${B.rows}, 1fr)` } });
  const why = h('div', { class: 'fb good mem-why' }); why.hidden = true;
  el.append(head, board, why);
  refresh();
  if (!two) sc.every(() => { if (!st.done) { st.secs++; clock.textContent = fmtTime(st.secs); } }, 1000);

  // הלוח ממלא את שאר המסך (בלי גלילה)
  const fit = () => { const top = board.getBoundingClientRect().top; board.style.height = `calc(100dvh - ${Math.round(top) + 30}px - var(--sab))`; };
  const fontFor = c => {
    const w = (board.clientWidth - 7 * (B.cols - 1)) / B.cols, base = B.cols === 3 ? 17 : B.cols === 4 ? 15 : 12.5;
    const longest = Math.max(...c.t.split(/\s+/).map(x => x.length));
    return Math.round(Math.max(9, Math.min(base * (c.t.length > 13 ? 0.88 : 1), (w - 8) / (0.62 * longest))) * 10) / 10;
  };
  cards.forEach((c, i) => board.append(h('button', { class: 'mcard', 'data-i': i, 'data-set': c.set, 'aria-label': 'קלף' },
    h('span', { class: 'min' }, h('span', { class: 'mf front' }, '?'),
      c.svg ? h('span', { class: 'mf back svg', html: c.svg }) : h('span', { class: 'mf back' + (c.he ? ' he' : '') }, c.he ? c.t : ltrText(c.t))))));
  fit();
  board.querySelectorAll('.mcard').forEach((b, i) => {
    if (cards[i].svg) return;
    const f = b.querySelector('.back'); let px = fontFor(cards[i]); f.style.fontSize = px + 'px';
    while ((f.scrollHeight > f.clientHeight + 1 || f.scrollWidth > f.clientWidth + 1) && px > 8) { px -= 0.5; f.style.fontSize = px + 'px'; }   // רשת ביטחון: הטקסט תמיד נכנס בקלף
  });
  window.addEventListener('resize', fit); sc.onDispose(() => window.removeEventListener('resize', fit));

  const els = [...board.children];
  const setOpen = (i, v) => { cards[i].open = v; els[i].classList.toggle('open', v); };

  return new Promise(resolve => {
    function flip(i) {
      const c = cards[i];
      if (st.lock || c.done || c.open || st.done) return;
      sfx.tap(); setOpen(i, true); st.open.push(i);
      if (!st.open.every(j => cards[j].set === c.set)) {            // קלף שלא מתאים: רואים אותו רגע ומחזירים
        st.lock = true; st.moves++; sfx.wrong(); R.miss(); refresh();
        sc.later(() => { st.open.forEach(j => setOpen(j, false)); st.open = []; st.lock = false; if (two) st.cur = 1 - st.cur; refresh(); }, 1000);
        return;
      }
      if (st.open.length === B.k) {                                 // סט שלם
        st.moves++; st.found++; sfx.correct(); R.hit({ light: true });
        st.open.forEach(j => { cards[j].done = true; els[j].classList.add('done'); });
        if (two) st.score[st.cur]++;
        st.open = [];
        why.textContent = rich(c.why); why.hidden = false;
        sc.later(() => { why.hidden = true; }, 3800);
        refresh();
        if (st.found === B.nSets) sc.later(end, 900);
      }
    }
    board.addEventListener('click', e => { const b = e.target.closest('.mcard'); if (b) flip(+b.dataset.i); });

    function end() {
      st.done = true; why.hidden = true;
      const n = B.nSets, size = dim(cfg.size), word = B.k === 3 ? 'שלישיות' : 'זוגות';
      if (two) {
        const [a, b] = st.score, tie = a === b;
        return resolve({ xp: Math.min(50, 6 + n * 2), correct: n, total: st.moves, run: R.best, completed: true,
          title: tie ? 'תיקו!' : `שחקן ${a > b ? 1 : 2} ניצח!`, big: `${a} : ${b}`, lines: [`${n} ${word} · לוח ${size}`, `${st.moves} מהלכים בסך הכול`] });
      }
      const ratio = st.moves / n, bonus = ratio <= (B.k === 3 ? 2.2 : 1.7) ? 10 : ratio <= (B.k === 3 ? 3.6 : 2.6) ? 5 : 0;
      resolve({ xp: Math.min(70, 6 + n * 3 + bonus), correct: n, total: st.moves, run: R.best, completed: true,
        title: bonus === 10 ? 'זיכרון מושלם!' : 'מצאתם את כולם!', big: `${st.moves} מהלכים`,
        lines: [`${fmtTime(st.secs)} · לוח ${size}`, `${n} ${word}${bonus === 10 ? ' · בונוס יעילות' : ''}`] });
    }
  });
}
