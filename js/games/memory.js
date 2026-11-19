// זיכרון עשרוני: מוצאים זוגות (תרגיל ↔ תוצאה) או שלישיות (תרגיל ↔ כלל/הערכה ↔ תוצאה). שחקן אחד, או שניים בתורות.
// התרגילים נוצרים אוטומטית מהאזור שנבחר (opts.chapter; 0 = כל האזורים). opts.cfg – דילוג על מסך ההגדרות (בדיקות / "עוד סבב").
import { h } from '../ui.js';
import { sfx } from '../audio.js';
import { waitClick } from './common.js';
import { reactor } from '../react.js';
import * as G from '../subjects/math/gen.js';

const KEY = 'jericho.memcfg';
const dim = s => G.ltrText(s.replace('x', '×'));                 // "4×8" – מבודד, אחרת בתוך עברית מוצג הפוך ("8×4")
const SIZES = { pairs: [['4x4', 'קטן'], ['4x6', 'בינוני'], ['4x8', 'גדול'], ['5x8', 'ענק']], triples: [['3x4', 'קטן'], ['3x6', 'בינוני'], ['3x8', 'גדול'], ['4x9', 'ענק']] };
const LEVELS = [['1', 'קל'], ['2', 'בינוני'], ['3', 'מאתגר']];
const DEFAULTS = { mode: 'pairs', size: '4x6', level: '2', players: '1' };
const loadCfg = () => { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...DEFAULTS }; } };
const saveCfg = c => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* מצב פרטי */ } };
const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// ---------- מסך הגדרות ----------
async function setup(el, chapter, sc) {
  const cfg = loadCfg(), canTriples = G.tripleTopicsFor(chapter).length > 0;
  if (!canTriples) cfg.mode = 'pairs';
  if (!SIZES[cfg.mode].some(([k]) => k === cfg.size)) cfg.size = SIZES[cfg.mode][1][0];
  const box = h('div', { class: 'mem-setup' });
  const go = h('button', { class: 'btn primary glow' }, 'התחלה ▶');
  const row = (title, key, opts) => h('div', {}, h('h3', { class: 'mem-h' }, title), h('div', { class: 'chips' }, opts.map(([k, l]) =>
    h('button', { class: 'chip' + (cfg[key] === k ? ' on' : ''), 'data-k': key, 'data-v': k, onclick: () => { sfx.tap(); cfg[key] = k; if (key === 'mode') cfg.size = SIZES[k][1][0]; draw(); } }, key === 'size' ? `${l} · ${dim(k)}` : l))));
  function draw() {
    box.innerHTML = '';
    box.append(h('p', { class: 'sub' }, 'הופכים קלפים ומוצאים את מה שמתאים זה לזה. אחרי כל התאמה מופיע הסבר קצר.'),
      canTriples && row('סוג משחק', 'mode', [['pairs', 'זוגות'], ['triples', 'שלישיות']]),
      row('גודל הלוח', 'size', SIZES[cfg.mode]), row('רמה', 'level', LEVELS), row('שחקנים', 'players', [['1', 'שחקן אחד'], ['2', 'שניים (בתורות)']]));
  }
  draw();
  el.append(h('div', { class: 'h-head' }, h('b', {}, 'זיכרון עשרוני')), box, go);
  await waitClick(go, sc);
  saveCfg(cfg);
  return cfg;
}

// ---------- בניית הלוח ----------
function build(cfg, chapter) {
  const [cols, rows0] = cfg.size.split('x').map(Number), k = cfg.mode === 'triples' ? 3 : 2, want = (cols * rows0) / k;
  const topics = k === 3 ? G.tripleTopicsFor(chapter) : G.topicsFor(chapter), level = +cfg.level;
  const sets = [], seen = new Set();
  for (let guard = 0; sets.length < want && guard < 4000; guard++) {
    let cards, why;
    if (k === 3) { const t = G.triple(G.pick(topics), level); cards = t.cards; why = t.it.why; }
    else { const it = G.items(1, topics, level)[0]; cards = [{ t: it.q, he: !!it.hebrew }, { t: it.a }]; why = it.why; }
    if (cards.some(c => seen.has(c.t)) || new Set(cards.map(c => c.t)).size < k) continue;   // כל טקסט על הלוח מופיע פעם אחת בלבד
    cards.forEach(c => seen.add(c.t)); sets.push({ cards, why });
  }
  const deck = [];
  sets.forEach((s, si) => s.cards.forEach(c => deck.push({ set: si, t: c.t, he: !!c.he, why: s.why })));
  return { cols, rows: Math.ceil(deck.length / cols), k, deck: G.shuffle(deck), nSets: sets.length };
}

export async function run(el, { chapter = 0, cfg: preset = null }, sc) {
  const cfg = preset ? { ...DEFAULTS, ...preset } : await setup(el, chapter, sc);
  const B = build(cfg, chapter), two = cfg.players === '2', R = reactor(el, sc);
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
    const longest = Math.max(...c.t.split(' ').map(x => x.length));
    return Math.round(Math.max(9, Math.min(base * (c.t.length > 13 ? 0.88 : 1), (w - 8) / (0.62 * longest))) * 10) / 10;
  };
  cards.forEach((c, i) => board.append(h('button', { class: 'mcard', 'data-i': i, 'data-set': c.set, 'aria-label': 'קלף' },
    h('span', { class: 'min' }, h('span', { class: 'mf front' }, '?'), h('span', { class: 'mf back' + (c.he ? ' he' : '') }, c.he ? c.t : G.ltrText(c.t))))));
  fit();
  board.querySelectorAll('.mcard').forEach((b, i) => {
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
        why.textContent = G.rich(c.why); why.hidden = false;
        sc.later(() => { why.hidden = true; }, 3800);
        refresh();
        if (st.found === B.nSets) sc.later(end, 900);
      }
    }
    board.addEventListener('click', e => { const b = e.target.closest('.mcard'); if (b) flip(+b.dataset.i); });

    function end() {
      st.done = true; why.hidden = true;
      const n = B.nSets, size = dim(cfg.size);
      if (two) {
        const [a, b] = st.score, tie = a === b;
        return resolve({ xp: Math.min(50, 6 + n * 2), correct: n, total: st.moves, run: R.best, completed: true,
          title: tie ? 'תיקו!' : `שחקן ${a > b ? 1 : 2} ניצח!`, big: `${a} : ${b}`, lines: [`${n} ${B.k === 3 ? 'שלישיות' : 'זוגות'} · לוח ${size}`, `${st.moves} מהלכים בסך הכול`] });
      }
      const ratio = st.moves / n, bonus = ratio <= (B.k === 3 ? 2.2 : 1.7) ? 10 : ratio <= (B.k === 3 ? 3.6 : 2.6) ? 5 : 0;
      resolve({ xp: Math.min(70, 6 + n * 3 + bonus), correct: n, total: st.moves, run: R.best, completed: true,
        title: bonus === 10 ? 'זיכרון מושלם!' : 'מצאתם את כולם!', big: `${st.moves} מהלכים`,
        lines: [`${fmtTime(st.secs)} · לוח ${size}`, `${n} ${B.k === 3 ? 'שלישיות' : 'זוגות'}${bonus === 10 ? ' · בונוס יעילות' : ''}`] });
    }
  });
}
