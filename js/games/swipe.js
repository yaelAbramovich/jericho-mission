// הסערה מתקרבת: אמת/שקר במהירות, 60 שניות, מעגל סערה נסגר, קומבו ושיא אישי.
import { STATEMENTS } from '../content.js';
import * as State from '../state.js';
import { h, shuffle, floatText } from '../ui.js';
import { sfx } from '../audio.js';
import { reactor } from '../react.js';
import { powerBar, timeButton } from '../powerups.js';

const mult = c => Math.min(5, 1 + Math.floor(c / 3));

export function run(el, { chapter = 0, duration = 60 }, sc) {
  return new Promise(resolve => {
    // נבחר פרק – רק משפטים מהפרק הזה
    const base = STATEMENTS.filter(s => !chapter || s[0] === chapter);
    const react = reactor(el, sc);   // (לא R – זה כבר רדיוס טבעת הסערה למטה)
    // חבילת קלפים: כל משפט מוצג פעם אחת לפני שמשפט כלשהו חוזר; אחרי ערבוב מחדש אף פעם לא אותו כרטיס פעמיים ברצף.
    // משפטים שהשחקן ראה לאחרונה (בסבבים קודמים) מוצגים אחרונים.
    const seen = new Set(State.seenList('stm')), shown = [];
    let queue = [], last = null;
    const nextStatement = () => {
      if (!queue.length) {
        queue = [...shuffle(base.filter(s => seen.has(s[1]))), ...shuffle(base.filter(s => !seen.has(s[1])))];   // pop() לוקח מהסוף = החדשים קודם
        if (queue.length > 1 && queue[queue.length - 1] === last) [queue[0], queue[queue.length - 1]] = [queue[queue.length - 1], queue[0]];
        seen.clear();   // אחרי הסיבוב הראשון בחבילה כל המשפטים שווים
      }
      last = queue.pop(); shown.push(last[1]);
      return last;
    };

    let score = 0, combo = 0, bestCombo = 0, answered = 0, right = 0, over = false, cur = null;
    const t0 = Date.now(), best = State.get().best.swipe;

    const R = 54;
    const storm = h('div', { class: 'storm', html: `<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="${R}" class="s-bg"/><circle id="sr" cx="60" cy="60" r="${R}" class="s-ring"/></svg>` });
    const secEl = h('b', {}, String(duration));
    storm.append(secEl);
    const scoreEl = h('b', {}, '0'), multEl = h('span', { class: 'mult' }, 'x1');
    const info = h('div', { class: 'sw-info' }, h('div', {}, h('small', {}, 'ניקוד'), scoreEl), multEl, h('div', {}, h('small', {}, 'שיא'), h('b', {}, String(best))));
    const stage = h('div', { class: 'sw-stage' });
    const hint = h('div', { class: 'sw-hint' });
    const bT = h('button', { class: 'btn sw-true', onclick: () => answer(true) }, 'אמת ✓');
    const bF = h('button', { class: 'btn sw-false', onclick: () => answer(false) }, '✗ שקר');
    const btns = h('div', { class: 'sw-btns' }, bF, bT);
    el.append(h('div', { class: 'sw-top' }, storm, info), ...powerBar(timeButton(el, sec => { duration += sec; })), hint, stage, btns,
      h('p', { class: 'sw-tip' }, 'החלק ימינה = אמת · שמאלה = שקר'));

    function showCard() {
      cur = nextStatement();
      const card = h('div', { class: 'sw-card' }, h('p', {}, cur[1]), h('span', { class: 'stamp t' }, 'אמת'), h('span', { class: 'stamp f' }, 'שקר'));
      stage.innerHTML = ''; stage.append(card);
      let sx = 0, dx = 0, drag = false;
      card.addEventListener('pointerdown', e => { if (over) return; drag = true; sx = e.clientX; card.setPointerCapture(e.pointerId); card.style.transition = 'none'; });
      card.addEventListener('pointermove', e => {
        if (!drag) return; dx = e.clientX - sx;
        card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
        card.classList.toggle('lt', dx > 30); card.classList.toggle('lf', dx < -30);
      });
      const end = () => {
        if (!drag) return; drag = false; card.style.transition = '';
        if (Math.abs(dx) > 90) answer(dx > 0, card, dx);
        else { card.style.transform = ''; card.classList.remove('lt', 'lf'); }
        dx = 0;
      };
      card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
    }

    function answer(val, card = stage.firstChild, dx = null) {
      if (over || !cur || !card) return;
      const st = cur; cur = null; answered++;
      const ok = val === st[2];
      const dir = val ? 1 : -1;
      card.style.transform = `translateX(${dir * 140}%) rotate(${dir * 18}deg)`; card.style.opacity = '0';
      sfx.swipe();
      if (ok) {
        right++; combo++; bestCombo = Math.max(bestCombo, combo);
        const m = mult(combo), gain = 10 * m; score += gain;
        sfx.correct(); if (combo >= 3 && combo % 3 === 0) sfx.combo();
        react.hit({ light: true });
        floatText(el, `+${gain}`, 'good');
        hint.className = 'sw-hint good'; hint.textContent = combo >= 3 ? `קומבו ${combo}! 🔥` : 'נכון!';
      } else {
        combo = 0; sfx.wrong(); react.miss();
        hint.className = 'sw-hint bad'; hint.textContent = (st[2] ? 'זה היה אמת. ' : 'זה היה שקר. ') + st[3];
      }
      scoreEl.textContent = score; multEl.textContent = 'x' + mult(combo);
      multEl.classList.toggle('hot', mult(combo) > 1);
      sc.later(showCard, 140);
    }

    // סערה
    let lastSec = duration;
    const ring = el.querySelector('#sr');
    const C = 2 * Math.PI * R;
    sc.every(() => {
      if (over) return;
      const left = Math.max(0, duration - (Date.now() - t0) / 1000);
      ring.style.strokeDasharray = `${C * left / duration} ${C}`;
      el.classList.toggle('danger', left <= 10);
      const s = Math.ceil(left);
      if (s !== lastSec) { lastSec = s; secEl.textContent = s; if (s <= 5 && s > 0) sfx.tick(); }
      if (left <= 0) finish();
    }, 100);

    function finish() {
      if (over) return; over = true;
      State.markSeen('stm', shown, 120);
      sfx.storm();
      stage.innerHTML = ''; btns.remove(); hint.textContent = '';
      stage.append(h('div', { class: 'storm-over' }, 'הסערה סגרה!'));
      el.classList.add('closed');
      const isBest = score > best && score > 0;
      sc.later(() => resolve({
        xp: Math.min(70, 8 + Math.round(score / 10)), score, answered, correct: right, total: answered, run: react.best, bestCombo,
        completed: answered >= 5,
        title: isBest ? 'שיא אישי חדש! 🏅' : 'הסערה סגרה',
        big: `${score} נקודות`,
        lines: [`${right} תשובות נכונות מתוך ${answered}`, `קומבו הכי ארוך: ${bestCombo}`, !isBest && best ? `השיא שלך: ${best}` : null].filter(Boolean),
      }), 1200);
    }
    showCard();
  });
}
