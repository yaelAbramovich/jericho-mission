// תגובות להצלחה בתוך המשחק: חגיגת הגול שנבחרה (קטנה, ובאבני דרך – הצגה במסך מלא עם צליל),
// בועת אימוג׳י מונפש עם הדמות, והודעות על רצף.
// שימוש: const R = reactor(el, sc); R.hit() / R.hit({ light: true, big: true }) / R.miss(); R.best = הרצף הארוך בסבב.
import * as State from './state.js';
import { equipped } from './locker.js';
import { h, burst, floatText } from './ui.js';
import { sfx } from './audio.js';
import { playShow, emoteBubble } from './effects.js';

const MILESTONES = { 3: ['שלוש ברצף! 🔥', 'combo'], 5: ['חמש ברצף! ⚡', 'combo'], 7: ['שבע ברצף! 🚀', 'combo'], 10: ['עשר ברצף! אגדה 👑', 'tierUp'] };
const FALLBACK_EMOTE = { type: 'emote', p: { ch: '🔥', anim: 'pulse', snd: 'flame' } };

// חגיגה: תמיד התזה קטנה בצבעי החגיגה שנבחרה; ואם big – גם ההצגה במסך מלא (עם צליל)
export function celebrate(host, n = 24, big = false) {
  const fx = equipped('fx');
  burst(host, n, fx.p.colors, fx.p.glyph);
  if (big) playShow(fx.p.show || 'confetti', fx.p);
}

export function reactor(host, sc) {
  let run = 0, best = 0, bubble = null;
  const emoteItem = (() => { const id = State.get().eq.emote; return id ? equipped('emote') : null; })();

  function showBubble(item) {
    if (bubble) bubble.remove();
    bubble = emoteBubble(host, item, { avatarItem: equipped('avatar') });
  }

  return {
    get best() { return best; },
    get run() { return run; },
    // opts.light – משחקים מהירים (הסערה): חגיגה ובועה רק בפסגות רצף
    // opts.noBurst – אם האפקט כבר מופעל במקום אחר (למשל בבעיטה)
    // opts.big – אירוע גדול (דו-קרב, קו מושלם...): מפעיל גם הצגה במסך מלא
    hit({ light = false, noBurst = false, big = false } = {}) {
      run++; best = Math.max(best, run);
      const ms = MILESTONES[run] || (run > 10 && run % 5 === 0 ? [`${run} ברצף! 👑`, 'tierUp'] : null);
      if (ms) { floatText(host, ms[0], 'good'); sfx[ms[1]] && sfx[ms[1]](); }
      if (!light || ms) {
        if (!noBurst) celebrate(host, ms ? 34 : 22, !!ms || big);
        else if (ms || big) playShow(equipped('fx').p.show || 'confetti', equipped('fx').p);
        if (emoteItem) showBubble(emoteItem);
        else if (ms) showBubble(FALLBACK_EMOTE);
      }
      return run;
    },
    miss() { run = 0; },
  };
}
