// כוחות (power-ups) שמרוויחים בפס הקרב ומשתמשים בהם בתוך המשחקים. כל כוח נצרך בשימוש (State.usePower).
import * as State from './state.js';
import { h, shuffle, floatText, modal } from './ui.js';
import { sfx } from './audio.js';
import { POWER } from './pass-data.js';

// שורת כפתורי כוחות – או רשימה ריקה (לשימוש עם ...) אם אין מה להציג
export const powerBar = (...buttons) => { const bs = buttons.filter(Boolean); return bs.length ? [h('div', { class: 'powerbar' }, bs)] : []; };

// 50/50: מוחק שתי תשובות שגויות. btns = כפתורי האפשרויות, isRight(btn) = האם זו התשובה הנכונה.
export function fiftyButton(btns, isRight) {
  if (State.power('fifty') < 1 || btns.length < 4) return null;
  const b = h('button', { class: 'pwbtn' }, `${POWER.fifty.icon} ${POWER.fifty.name} (${State.power('fifty')})`);
  b.addEventListener('click', () => {
    if (!State.usePower('fifty')) return;
    shuffle(btns.filter(x => !isRight(x) && !x.disabled)).slice(0, 2).forEach(x => { x.classList.add('gone'); x.disabled = true; });
    sfx.combo(); b.remove();
  }, { once: true });
  return b;
}

// +10 שניות בהסערה: onUse מקבל את מספר השניות להוספה
export function timeButton(host, onUse) {
  if (State.power('time') < 1) return null;
  const b = h('button', { class: 'pwbtn' }, `${POWER.time.icon} ${POWER.time.name} (${State.power('time')})`);
  b.addEventListener('click', () => {
    if (!State.usePower('time')) return;
    onUse(10); sfx.combo(); floatText(host, 'עוד 10 שניות!', 'good'); b.remove();
  }, { once: true });
  return b;
}

// ניסיון נוסף: אחרי טעות בפנדל. חלון באמצע המסך – (פעם זה נוסף בתחתית מסך ארוך, ויצא מחוץ למסך: המשחק נראה "תקוע").
// מחזיר Promise<true אם השחקן בחר להשתמש>. סגירה בלחיצה בחוץ = "לא תודה".
export function offerRetry() {
  return new Promise(res => {
    let done = false;
    const finish = v => { if (done) return; done = true; m.close(); res(v); };
    const yes = h('button', { class: 'btn primary', onclick: () => { State.usePower('retry'); sfx.combo(); finish(true); } }, `${POWER.retry.icon} ${POWER.retry.name} (${State.power('retry')})`);
    const no = h('button', { class: 'btn ghost', onclick: () => finish(false) }, 'לא תודה');
    const m = modal([h('div', { class: 'tag' }, 'כוח'), h('h3', {}, 'אופס, טעות!'), h('p', { class: 'sub' }, 'אפשר להשתמש ב„ניסיון נוסף" ולנסות את אותה שאלה שוב.'), yes, no], { cls: 'celebrate', onClose: () => finish(false) });
  });
}
