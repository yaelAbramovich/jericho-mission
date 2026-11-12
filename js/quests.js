// משימות יומיות: 3 משימות קבועות לכל יום (לפי התאריך), עם XP בונוס. מונים נשמרים ב-State.daily().
import * as State from './state.js';

const TEMPLATES = [
  { id: 'rounds2', text: 'שחק 2 סבבים', goal: 2, get: d => d.rounds, xp: 20 },
  { id: 'rounds3', text: 'שחק 3 סבבים', goal: 3, get: d => d.rounds, xp: 30 },
  { id: 'goals3', text: 'כבוש 3 גולים בפנדלים', goal: 3, get: d => d.goals, xp: 25 },
  { id: 'storm8', text: 'הסערה: 8 תשובות נכונות', goal: 8, get: d => d.swipeRight, xp: 25 },
  { id: 'who4', text: 'זהה 4 דוברים ב„מי אמר?"', goal: 4, get: d => d.whoRight, xp: 25 },
  { id: 'line1', text: 'בנה קו מושלם', goal: 1, get: d => d.perfectLines, xp: 25 },
  { id: 'duel1', text: 'שחק דו-קרב משפחתי', goal: 1, get: d => d.duels, xp: 30 },
  { id: 'run4', text: '4 תשובות נכונות ברצף', goal: 4, get: d => d.bestRun, xp: 25 },
  { id: 'chap2', text: 'שחק בשני פרקים שונים', goal: 2, get: d => d.chapters.length, xp: 30 },
];
export const DAILY_BONUS = 30;

// בחירה יציבה לפי התאריך (אותן משימות כל היום)
function seeded(str) { let x = 2166136261; for (const c of str) x = Math.imul(x ^ c.charCodeAt(0), 16777619) >>> 0; return () => (x = Math.imul(x ^ (x >>> 15), 2246822507) >>> 0) / 4294967296; }
export function todays() {
  const d = State.daily(), rnd = seeded(d.day), pool = [...TEMPLATES];
  const out = [];
  while (out.length < 3) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  return out.map(q => ({ ...q, cur: Math.min(q.get(d), q.goal), done: q.get(d) >= q.goal, claimed: d.claimed.includes(q.id) }));
}

// אחרי כל סבב: מעדכן מונים
export function record(key, opts, res) {
  const d = State.daily();
  d.rounds++;
  if (key === 'hunter') d.goals += res.correct || 0;
  if (key === 'swipe') d.swipeRight += res.correct || 0;
  if (key === 'who') d.whoRight += res.correct || 0;
  if (key === 'order') d.perfectLines += res.perfectSeqs || 0;
  if (key === 'duel') d.duels++;
  if (opts && opts.chapter && !d.chapters.includes(opts.chapter)) d.chapters.push(opts.chapter);
  d.bestRun = Math.max(d.bestRun, res.run || 0);
  State.save();
}

// מסמן משימות שהושלמו ומחזיר מה חדש: { done:[{text,xp}], bonus, xp }
export function claim() {
  const d = State.daily(), list = todays(), done = [];
  for (const q of list) if (q.done && !q.claimed) { d.claimed.push(q.id); done.push({ text: q.text, xp: q.xp }); }
  let bonus = 0;
  if (!d.bonus && list.every(q => q.done)) { d.bonus = true; bonus = DAILY_BONUS; State.get().stats.questDays++; }
  State.save();
  return { done, bonus, xp: done.reduce((a, q) => a + q.xp, 0) + bonus };
}
