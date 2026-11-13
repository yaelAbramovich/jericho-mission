// הארון: מה פתוח, מה לבוש, ואיך פותחים כל פריט (דרגה / אזור / הישג / מבחן).
import * as State from './state.js';
import { ITEMS, itemById, DEFAULT_ID } from './rewards.js';
import { hebNum } from './content.js';

export function isOpen(item, S = State.get()) {
  if (item.how && item.how.ch) return State.captured(item.how.ch);
  if (item.how && item.how.ach) return !!S.ach[item.how.ach];
  if (item.how && item.how.gold) return !!S.pass.claimed['g' + item.how.gold];   // פס זהב: נפתח באיסוף
  if (item.how && item.how.box) return !!S.pass.owned[item.id];                  // קופסת מסתורין
  if (item.tier === 'exam') return !!S.examDone;
  if (item.tier === 'custom' || item.tier === 0) return true;
  return item.tier <= State.tierOf() && !!S.pass.claimed['f' + item.tier];       // פס חינם: צריך לאסוף
}
export const openIds = () => new Set(ITEMS.filter(i => isOpen(i)).map(i => i.id));

// הפריט הלבוש מסוג מסוים; אם לא לבוש או נעול – ברירת המחדל
export function equipped(type) {
  const id = State.get().eq[type];
  const it = id && itemById(id);
  if (it && isOpen(it)) return it;
  return DEFAULT_ID[type] ? itemById(DEFAULT_ID[type]) : null;
}

export function howText(item, achName = id => id) {
  if (item.how && item.how.ch) return `כבוש את אזור ${hebNum(item.how.ch)}׳`;
  if (item.how && item.how.ach) return `הישג: ${achName(item.how.ach)}`;
  if (item.how && item.how.gold) return `פס זהב · דרגה ${item.how.gold}`;
  if (item.how && item.how.box) return 'קופסת מסתורין 🎁';
  if (item.tier === 'exam') return 'נפתח במבחן הסיכום';
  return `דרגה ${item.tier}`;
}
