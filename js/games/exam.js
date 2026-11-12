// מבחן הסיכום: סבב מעורב מכל המשחקים. נפתח אחרי כיבוש כל 5 האזורים.
import { h } from '../ui.js';
import { sfx } from '../audio.js';
import { waitClick } from './common.js';
import * as hunter from './hunter.js';
import * as who from './who.js';
import * as swipe from './swipe.js';
import * as order from './order.js';

const STAGES = [
  ['⚽ פנדלים', hunter, { mode: 'find', count: 3 }],
  ['🎙️ מי אמר?', who, { count: 3 }],
  ['🌀 הסערה (30 שניות)', swipe, { duration: 30 }],
  ['🧩 בונים את הקו', order, { ids: ['sx'] }],
];
export async function run(el, _o, sc) {
  let xp = 30, correct = 0, total = 0, run = 0;
  for (let i = 0; i < STAGES.length; i++) {
    const [name, mod, opts] = STAGES[i];
    el.innerHTML = '';
    const go = h('button', { class: 'btn primary glow' }, 'יוצאים!');
    el.append(h('div', { class: 'stage-splash' }, h('small', {}, `שלב ${i + 1} מתוך ${STAGES.length}`), h('h2', {}, name), go));
    await waitClick(go, sc); sfx.whistle();
    el.innerHTML = '';
    const r = await mod.run(el, { chapter: 0, ...opts }, sc);
    xp += r.xp; correct += r.correct; total += r.total; run = Math.max(run, r.run || 0);
  }
  el.innerHTML = '';
  const { get, save } = await import('../state.js');
  get().examDone = true; save();
  return { xp, correct, total, run, title: 'מבחן הסיכום הושלם! 🏆', big: `${correct} / ${total}`, lines: ['נפתח פריט מיוחד בפס הקרב: אלוף יריחו'] };
}
