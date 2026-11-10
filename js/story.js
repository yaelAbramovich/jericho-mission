// "תדריך משימה": מסכי סיפור עם החלקה, מילים קשות, והקלטות משפחתיות.
import * as State from './state.js';
import { CHAPTERS, OVERVIEW, refText, hebNum } from './content.js';
import { h, richText, termPopup, toast } from './ui.js';
import { sfx, playBlob, stopPlayback } from './audio.js';
import { getRec } from './db.js';
import { go } from './app.js';

export const recKey = (ch, i) => `ch${ch}-${i}`;

export async function render(v, { ch, start = 0 }, sc) {
  const c = ch === 0 ? OVERVIEW : CHAPTERS[ch - 1], total = c.story.length;
  let i = Math.min(start, total - 1), dir = 1, userTapped = false, playing = false;
  sc.onDispose(stopPlayback);

  const top = h('div', { class: 'story-top' },
    h('button', { class: 'back', onclick: () => back() }, '✕'),
    h('div', { class: 'dots' }),
    c.leading && h('button', { class: 'lead-chip', onclick: () => termPopup('leading') }, 'מילה מנחה: ', h('b', {}, c.leading)));
  const stage = h('div', { class: 'story-stage' });
  const ctrl = h('div', { class: 'story-ctrl' });
  v.append(h('div', { class: 'story-head' }, h('small', {}, ch === 0 ? 'התחילו כאן' : `פרק ${hebNum(ch)}׳ · ${c.zone}`), h('h2', {}, c.title)), top, stage, ctrl);

  // swipe: אצבע שזזה שמאלה→ימינה = הבא (כיוון קריאה בעברית)
  let sx = null, sy = null;
  stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) (dx > 0 ? next : prev)();
  }, { passive: true });

  function next() { userTapped = true; if (i < total - 1) { dir = 1; i++; show(); } else finish(); }
  function prev() { userTapped = true; if (i > 0) { dir = -1; i--; show(); } }
  function finish() {
    sfx.correct();
    back();
  }
  function back() { go(ch === 0 ? 'map' : 'zone', { ch }); }

  async function show() {
    stopPlayback(); playing = false;
    const s = c.story[i];
    sfx.swipe();
    const card = h('div', { class: 'story-card ' + (dir > 0 ? 'in-next' : 'in-prev') },
      h('p', { class: 'story-text' }, richText(s.text)),
      s.cast && h('div', { class: 'cast' }, s.cast.map(([n, d]) => h('div', { class: 'cast-row' }, h('b', {}, n), h('span', {}, d)))),
      s.verse && h('blockquote', { class: 'verse-box' }, h('q', {}, s.verse.t), h('cite', {}, refText(s.verse.c, s.verse.v))));
    stage.innerHTML = ''; stage.append(card);
    top.querySelector('.dots').replaceChildren(...c.story.map((_, k) => h('i', { class: k === i ? 'on' : k < i ? 'done' : '' })));

    // התקדמות ו-XP פעם ראשונה
    const first = State.markStoryScreen(ch, i, total);
    if (first) { State.addXP(20); toast('תדריך הושלם! קיבלת 20 XP', 2600); sfx.capture(); }

    // הקלטה
    let rec = null;
    try { rec = await getRec(recKey(ch, i)); } catch (e) {}
    if (sc.dead) return;
    ctrl.innerHTML = '';
    const nextBtn = h('button', { class: 'btn primary nav', onclick: () => { sfx.tap(); next(); } }, i === total - 1 ? 'סיימתי ✓' : 'הבא ◀');
    const prevBtn = h('button', { class: 'btn ghost nav', disabled: i === 0, onclick: () => { sfx.tap(); prev(); } }, '▶ הקודם');
    let playBtn = null;
    if (rec) {
      playBtn = h('button', { class: 'btn play', 'aria-label': 'השמע הקראה' }, '🔊 הקראה');
      const setP = p => { playing = p; playBtn.textContent = p ? '⏹ עצור' : '🔊 הקראה'; playBtn.classList.toggle('on', p); };
      const start = () => { setP(true); playBlob(rec.blob, () => setP(false)); };
      playBtn.onclick = () => { userTapped = true; if (playing) { stopPlayback(); setP(false); } else start(); };
      if (userTapped) start();   // אוטומטי רק אחרי נגיעה ראשונה של המשתמש
    }
    ctrl.append(...[prevBtn, playBtn, nextBtn].filter(Boolean));
  }
  show();
}
