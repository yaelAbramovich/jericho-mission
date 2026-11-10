// רכיבים משותפים למשחקים: מגרש פנדלים, המתנה ללחיצה, בחירת פריטים לסבב.
import { h, shuffle, burst, floatText } from '../ui.js';
import { sfx } from '../audio.js';

export const waitClick = (btn, sc) => new Promise(res => btn.addEventListener('click', () => res(), { once: true }));

// פריטי סבב: קודם מהפרק שנבחר, ואם אין מספיק – משלימים מפרקים אחרים
export function pickRound(all, chapter, count, chOf = x => x.c) {
  const own = shuffle(all.filter(x => !chapter || chOf(x) === chapter));
  if (own.length >= count) return own.slice(0, count);
  const rest = shuffle(all.filter(x => !own.includes(x)));
  return shuffle([...own, ...rest.slice(0, count - own.length)]);
}

// מגרש + שוער + כדור. kick(outcome): 'goal' | 'almost' | 'save'
export function makePitch() {
  const keeper = h('div', { class: 'keeper' }, h('i', { class: 'k-head' }), h('i', { class: 'k-body' }), h('i', { class: 'k-glove l' }), h('i', { class: 'k-glove r' }));
  const net = h('div', { class: 'net' });
  const goal = h('div', { class: 'goal' }, net, keeper);
  const ball = h('div', { class: 'ball' }, '⚽');
  const el = h('div', { class: 'pitch' }, goal, ball, h('div', { class: 'spot' }));
  function reset() {
    el.classList.remove('shoot');
    goal.classList.remove('shake');
    ball.style.cssText = ''; keeper.style.cssText = '';
  }
  async function kick(outcome, sc) {
    reset();
    await sc.sleep(60);
    const side = Math.random() < 0.5 ? -1 : 1;
    el.classList.add('shoot');
    const keeperSide = outcome === 'goal' ? -side : side;
    keeper.style.left = (50 + keeperSide * 24) + '%';
    keeper.style.transform = `translateX(-50%) rotate(${-keeperSide * 62}deg)`;
    if (outcome === 'goal') { sfx.goal(); ball.style.left = (50 + side * 30) + '%'; ball.style.top = '24%'; }
    else if (outcome === 'almost') { sfx.almost(); ball.style.left = (50 + side * 33) + '%'; ball.style.top = '27%'; ball.style.transitionDuration = '.95s'; }
    else { sfx.save(); ball.style.left = (50 + side * 22) + '%'; ball.style.top = '31%'; }
    ball.style.transform = 'translate(-50%,-50%) scale(.55) rotate(540deg)';
    await sc.sleep(outcome === 'almost' ? 1000 : 700);
    if (outcome !== 'save') { goal.classList.add('shake'); burst(el, outcome === 'goal' ? 24 : 12); }
    else { ball.style.left = (50 + side * 40) + '%'; ball.style.top = '58%'; ball.style.transform = 'translate(-50%,-50%) scale(.7) rotate(-200deg)'; }
    floatText(el, outcome === 'goal' ? 'גוווול!' : outcome === 'almost' ? 'כמעט נעצר!' : 'נעצר!', outcome === 'save' ? 'bad' : 'good');
    await sc.sleep(550);
  }
  return { el, kick, reset };
}

export function tally(total) {
  const el = h('div', { class: 'tally' });
  const dots = Array.from({ length: total }, () => h('i'));
  el.append(...dots);
  return { el, mark(i, ok) { dots[i].className = ok ? 'g' : 'm'; } };
}
