// המעגל האחרון: שאלה פתוחה – בוחרים עמדה, בונים תשובה מכרטיסי טיעון, ורואים תשובה לדוגמה.
import { BOSS } from '../content.js';
import { h, shuffle } from '../ui.js';
import { sfx } from '../audio.js';
import { waitClick } from './common.js';

export async function run(el, _opts, sc) {
  el.append(h('div', { class: 'boss-title' }, h('small', {}, 'שאלה פתוחה · מבחן אמיתי'), h('h2', {}, BOSS.title)));
  const area = h('div', { class: 'boss' }); el.append(area);

  // 1. בחירת עמדה
  area.append(h('p', { class: 'sub' }, 'מה העמדה שלך?'));
  const side = await new Promise(res => {
    area.append(h('div', { class: 'side-btns' },
      h('button', { class: 'btn side yes', onclick: () => res('yes') }, BOSS.sides.yes),
      h('button', { class: 'btn side no', onclick: () => res('no') }, BOSS.sides.no)));
  });
  sfx.pick();

  // 2. בחירת טיעונים
  area.innerHTML = '';
  const chosen = new Set();
  const cards = shuffle(BOSS.cards);
  const go = h('button', { class: 'btn primary glow', disabled: true }, 'זו התשובה שלי');
  const counter = h('small', {}, 'נבחרו 0 מתוך 3');
  area.append(h('p', { class: 'sub' }, 'בחר עד 3 טיעונים שתומכים בעמדה: ', h('b', {}, BOSS.sides[side])), counter);
  const deck = h('div', { class: 'deck' }, cards.map(c => h('button', { class: 'acard', onclick: e => {
    const b = e.currentTarget;
    if (chosen.has(c)) { chosen.delete(c); b.classList.remove('on'); }
    else if (chosen.size < 3) { chosen.add(c); b.classList.add('on'); sfx.pick(); }
    else sfx.wrong();
    counter.textContent = `נבחרו ${chosen.size} מתוך 3`; go.disabled = !chosen.size;
  } }, c.t)));
  area.append(deck, go);
  await waitClick(go, sc);

  // 3. משוב
  area.innerHTML = '';
  let xp = 10, strong = 0;
  const rows = [...chosen].map(c => {
    let cls, txt;
    if (c.side === side) { cls = 'good'; txt = 'טיעון חזק לעמדה שלך'; xp += 12; strong++; }
    else if (c.side) { cls = 'mid'; txt = 'זה טיעון לצד השני – כדאי להזכיר אותו בתשובה מלאה'; xp += 5; }
    else { cls = 'none'; txt = 'נכון, אבל לא קשור לשאלה אם רחב עשתה חסד'; }
    return h('div', { class: 'verdict ' + cls }, h('b', {}, c.t), h('small', {}, txt));
  });
  strong ? sfx.goal() : sfx.correct();
  area.append(h('p', { class: 'sub' }, 'התשובה שבנית:'), ...rows,
    h('div', { class: 'model' }, h('h3', {}, 'תשובה לדוגמה – מציגים שני צדדים'), BOSS.model.map(([t, p]) => h('p', {}, h('b', {}, t + ': '), p))));
  const done = h('button', { class: 'btn primary' }, 'סיום');
  area.append(done);
  await waitClick(done, sc);
  return { xp, correct: strong, total: chosen.size, completed: true, title: 'הבוס הובס!', big: `${strong} טיעונים חזקים`, lines: ['בבחינה: מציגים את שני הצדדים ומנמקים'] };
}
