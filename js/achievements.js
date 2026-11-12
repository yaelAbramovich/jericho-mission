// הישגים: תגים שנפתחים בעקבות הצלחות. חלקם נותנים גם XP בונוס ופריט בארון (itemById לפי how.ach).
import * as State from './state.js';

// prog(S) -> [נוכחי, יעד] להצגת התקדמות. test(S) -> האם הושג.
const need = (get, goal) => ({ prog: S => [Math.min(get(S), goal), goal], test: S => get(S) >= goal });

export const ACH = [
  { id: 'r1', icon: '🎬', name: 'סבב ראשון', desc: 'סיים סבב אחד', xp: 10, ...need(S => S.rounds, 1) },
  { id: 'r10', icon: '🔟', name: 'עשרה סבבים', desc: 'סיים 10 סבבים', xp: 25, ...need(S => S.rounds, 10) },
  { id: 'r30', icon: '💯', name: 'שלושים סבבים', desc: 'סיים 30 סבבים', xp: 50, ...need(S => S.rounds, 30) },
  { id: 'run5', icon: '🔥', name: 'חמש ברצף', desc: '5 תשובות נכונות ברצף בסבב אחד', xp: 20, ...need(S => S.stats.bestRun, 5) },
  { id: 'run10', icon: '💎', name: 'עשר ברצף', desc: '10 תשובות נכונות ברצף בסבב אחד', xp: 40, ...need(S => S.stats.bestRun, 10) },
  { id: 'pen5', icon: '⚽', name: 'פנדלים מושלמים', desc: 'סבב פנדלים בלי אף טעות', xp: 30, ...need(S => S.stats.perfectPen, 1) },
  { id: 'combo9', icon: '⚡', name: 'קומבו תשע', desc: 'קומבו של 9 בהסערה המתקרבת', xp: 30, ...need(S => S.stats.bestCombo, 9) },
  { id: 'line', icon: '🧩', name: 'קו מושלם', desc: 'סדר סדרה שלמה בלי טעות', xp: 20, ...need(S => S.stats.perfectLine, 1) },
  { id: 'who5', icon: '🎙️', name: 'אוזן מוסיקלית', desc: 'סבב „מי אמר?" בלי טעות', xp: 20, ...need(S => S.stats.perfectWho, 1) },
  { id: 'duelw', icon: '🏆', name: 'ניצחת את ההורה', desc: 'נצח בדו-קרב משפחתי', xp: 40, ...need(S => S.trophy.w, 1) },
  { id: 'duelp', icon: '🛡️', name: 'דו-קרב ללא רבב', desc: 'דו-קרב משפחתי בלי טעות שלך', xp: 40, ...need(S => S.stats.perfectDuel, 1) },
  { id: 'streak3', icon: '📅', name: 'שלושה ימים ברצף', desc: 'שחק 3 ימים רצופים', xp: 20, ...need(() => State.streakNow(), 3) },
  { id: 'streak7', icon: '🗓️', name: 'שבוע ברצף', desc: 'שחק 7 ימים רצופים', xp: 50, ...need(() => State.streakNow(), 7) },
  { id: 'zones3', icon: '⚑', name: 'שלושה אזורים', desc: 'כבוש 3 אזורים', xp: 30, ...need(() => State.capturedCount(), 3) },
  { id: 'allzones', icon: '👑', name: 'כובש יריחו', desc: 'כבוש את כל 5 האזורים', xp: 80, ...need(() => State.capturedCount(), 5) },
  { id: 'quests3', icon: '📋', name: 'משימות היום', desc: 'סיים את כל 3 המשימות של היום', xp: 20, ...need(S => S.stats.questDays, 1) },
];
export const achById = id => ACH.find(a => a.id === id);
export const achName = id => (achById(id) || {}).name || id;

// בודק אילו הישגים חדשים הושגו. מחזיר רשימה (ללא הוספת XP – הקורא מוסיף).
export function evaluate() {
  const S = State.get(), fresh = [];
  for (const a of ACH) {
    if (!S.ach[a.id] && a.test(S)) { S.ach[a.id] = Date.now(); fresh.push(a); }
  }
  if (fresh.length) State.save();
  return fresh;
}
