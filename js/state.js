// מצב האפליקציה: XP, רצף, התקדמות באזורים. נשמר ב-localStorage (עטוף ב-try/catch).
import { TIER_XP } from './rewards.js';

const KEY = 'jericho.v1';
const fresh = () => ({
  xp: 0, rounds: 0,
  streak: { last: null, count: 0 },
  zone: {},               // { "1": {story:true, hunter:true, other:true} }
  storySeen: {},          // { "1": [0,1,2] }
  best: { swipe: 0 },
  eq: { avatar: 'a0', banner: 'b0', jersey: 'j0', emote: null },
  muted: false, pinHash: null, examDone: false, overviewDone: false, names: { kid: '', parent: '' },
});

let S = fresh();
let memoryOnly = false;

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) S = Object.assign(fresh(), JSON.parse(raw));
  } catch (e) { memoryOnly = true; }
}
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { memoryOnly = true; }
}
export const get = () => S;
export const isMemoryOnly = () => memoryOnly;

export const tierOf = (xp = S.xp) => Math.floor(xp / TIER_XP);

export function dayStr(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function touchStreak() {
  const today = dayStr();
  if (S.streak.last === today) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  S.streak.count = S.streak.last === dayStr(y) ? S.streak.count + 1 : 1;
  S.streak.last = today;
}
// אם לא שיחק אתמול ולא היום – הרצף מוצג כ-0 (בלי למחוק נתונים)
export function streakNow() {
  const today = dayStr();
  const y = new Date(); y.setDate(y.getDate() - 1);
  return (S.streak.last === today || S.streak.last === dayStr(y)) ? S.streak.count : 0;
}

export function addXP(n) {
  const before = tierOf();
  S.xp += Math.max(0, Math.round(n));
  touchStreak();
  save();
  return { before, after: tierOf() };
}

export function setObjective(ch, key) {
  if (!ch) return false;
  const z = (S.zone[ch] = S.zone[ch] || {});
  const was = !!z[key];
  z[key] = true;
  save();
  return !was;
}
export const objectives = ch => S.zone[ch] || {};
export const captured = ch => { const z = objectives(ch); return !!(z.story && z.hunter && z.other); };
export const allCaptured = () => [1, 2, 3, 4, 5].every(captured);
export const capturedCount = () => [1, 2, 3, 4, 5].filter(captured).length;

export function markStoryScreen(ch, i, total) {
  const a = (S.storySeen[ch] = S.storySeen[ch] || []);
  if (!a.includes(i)) a.push(i);
  let first = false;
  if (ch === 0) { if (a.length >= total && !S.overviewDone) { S.overviewDone = true; first = true; } }
  else if (a.length >= total) first = setObjective(ch, 'story');
  save();
  return first;
}
export function setMuted(m) { S.muted = m; save(); }
export function resetAll() { S = fresh(); save(); }
