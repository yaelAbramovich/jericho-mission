// תגובות להצלחה בתוך המשחק: חגיגת הגול שנבחרה, בועת אימוג׳י עם הדמות, והודעות על רצף.
// שימוש: const R = reactor(el, sc); R.hit() / R.hit({ light: true }) / R.miss(); R.best = הרצף הארוך בסבב.
import * as State from './state.js';
import { equipped } from './locker.js';
import { art } from './rewards.js';
import { h, burst, floatText } from './ui.js';
import { sfx } from './audio.js';

const MILESTONES = { 3: ['שלוש ברצף! 🔥', 'combo'], 5: ['חמש ברצף! ⚡', 'combo'], 7: ['שבע ברצף! 🚀', 'combo'], 10: ['עשר ברצף! אגדה 👑', 'tierUp'] };

export function celebrate(host, n = 24) {
  const fx = equipped('fx');
  burst(host, n, fx.p.colors, fx.p.glyph);
}

export function reactor(host, sc) {
  let run = 0, best = 0, bubble = null;
  const emoteItem = (() => { const id = State.get().eq.emote; return id ? equipped('emote') : null; })();

  function showBubble(glyph) {
    if (bubble) bubble.remove();
    bubble = h('div', { class: 'react-bubble' },
      h('div', { class: 'rb-av', html: art(equipped('avatar'), 44) }),
      h('div', { class: 'rb-msg' }, glyph));
    host.append(bubble);
    const mine = bubble;
    sc.later(() => { if (bubble === mine) bubble = null; mine.remove(); }, 1500);
  }

  return {
    get best() { return best; },
    get run() { return run; },
    // opts.light – משחקים מהירים (הסערה): חגיגה ובועה רק בפסגות רצף
    // opts.noBurst – אם האפקט כבר מופעל במקום אחר (למשל בבעיטה)
    hit({ light = false, noBurst = false } = {}) {
      run++; best = Math.max(best, run);
      const ms = MILESTONES[run] || (run > 10 && run % 5 === 0 ? [`${run} ברצף! 👑`, 'tierUp'] : null);
      if (ms) { floatText(host, ms[0], 'good'); sfx[ms[1]] && sfx[ms[1]](); }
      if (!light || ms) {
        if (!noBurst) celebrate(host, ms ? 34 : 22);
        if (emoteItem) showBubble(art(emoteItem, 30));
        else if (ms) showBubble('🔥');
      }
      return run;
    },
    miss() { run = 0; },
  };
}
