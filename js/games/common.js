// רכיבים משותפים למשחקים: מגרש פנדלים, המתנה ללחיצה, בחירת פריטים לסבב.
import { h, shuffle, floatText } from '../ui.js';
import { sfx } from '../audio.js';
import { equipped } from '../locker.js';
import { art } from '../rewards.js';
import { celebrate } from '../react.js';
import { startTrail } from '../effects.js';

export const waitClick = (btn, sc) => new Promise(res => btn.addEventListener('click', () => res(), { once: true }));

// פריטי סבב: אם נבחר פרק – רק מהפרק הזה (בלי להשלים מפרקים אחרים). בלי פרק – מכל הפרקים.
// opts.exclude – מזהים שאסור לבחור (למשל שאלות שכבר הופיעו בשלב אחר של אותו מבחן)
// opts.seen – קבוצת מזהים שנראו לאחרונה: מעדיפים שאלות שהשחקן עוד לא ראה
export function pickRound(all, chapter, count, { exclude = [], seen = null, chOf = x => x.c, idOf = x => x.id } = {}) {
  const ok = all.filter(x => (!chapter || chOf(x) === chapter) && !exclude.includes(idOf(x)));
  if (!seen) return shuffle(ok).slice(0, count);
  return [...shuffle(ok.filter(x => !seen.has(idOf(x)))), ...shuffle(ok.filter(x => seen.has(idOf(x))))].slice(0, count);
}

// מסיחים (תשובות שגויות): קודם מאותו פרק, ורק אם אין מספיק בפרק – משלימים מהשאר
export function pickDistractors(all, correct, n, chapter, chOf = x => x.c) {
  const others = all.filter(x => x !== correct);
  const own = shuffle(others.filter(x => !chapter || chOf(x) === chapter)).slice(0, n);
  if (own.length >= n) return own;
  return [...own, ...shuffle(others.filter(x => !own.includes(x))).slice(0, n - own.length)];
}

// מגרש + שוער + כדור. kick(outcome): 'goal' | 'almost' | 'save'
export function makePitch() {
  const keeper = h('div', { class: 'keeper' }, h('i', { class: 'k-head' }), h('i', { class: 'k-body' }), h('i', { class: 'k-glove l' }), h('i', { class: 'k-glove r' }));
  const net = h('div', { class: 'net' });
  const goal = h('div', { class: 'goal' }, net, keeper);
  // הפריטים שהשחקן לבש: כדור, מגרש, שוער וחולצה
  const bi = equipped('ball'), pi = equipped('pitch'), ki = equipped('keeper'), ji = equipped('jersey');
  const ball = h('div', { class: 'ball', html: bi.p.kind === 'classic' ? '⚽' : art(bi, 34) });
  const kicker = h('div', { class: 'kicker', html: art(ji, 50) });
  const el = h('div', { class: 'pitch' }, goal, ball, h('div', { class: 'spot' }), kicker);
  const tr = equipped('trail');
  el.style.setProperty('--sky', pi.p.sky); el.style.setProperty('--g1', pi.p.g1); el.style.setProperty('--g2', pi.p.g2);
  // על המגרש עצמו (ולא על השוער): reset() מנקה את הסגנון של השוער בכל בעיטה
  el.style.setProperty('--k1', ki.p.k1); el.style.setProperty('--k2', ki.p.k2); el.style.setProperty('--glove', ki.p.glove);
  function reset() {
    el.classList.remove('shoot');
    goal.classList.remove('shake', 'glow');
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
    const stopTrail = startTrail(el, ball, tr);   // זנב צבעוני בזמן שהכדור עף
    await sc.sleep(outcome === 'almost' ? 1000 : 700);
    stopTrail();
    if (outcome !== 'save') {
      goal.classList.add('shake'); if (tr.p.glow) { goal.style.setProperty('--glow', tr.p.glow); goal.classList.add('glow'); }   // הרשת נדלקת בצבע הזנב
      celebrate(el, outcome === 'goal' ? 28 : 12, outcome === 'goal');
    }
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
