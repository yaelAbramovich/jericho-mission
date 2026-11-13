// מצב האפליקציה: XP, רצף, התקדמות באזורים. נשמר ב-localStorage (עטוף ב-try/catch).
import { TIER_XP } from './rewards.js';

const KEY = 'jericho.v1';
const fresh = () => ({
  xp: 0, rounds: 0,
  streak: { last: null, count: 0 },
  zone: {},               // { "1": {story:true, hunter:true, other:true} }
  storySeen: {},          // { "1": [0,1,2] }
  best: { swipe: 0 },
  eq: { avatar: 'a0', banner: 'b0', jersey: 'j0', emote: null, ball: 'ba0', fx: 'fx0', pitch: 'pt0', keeper: 'kp0', trail: 'tr0', title: 'tt0' },
  custom: { c1: '#1b4bd6', c2: '#ffe14a', pat: 'stripes', n: '7', name: '' },   // החולצה שלי
  ach: {},                // הישגים שנפתחו: { id: timestamp }
  stats: { bestRun: 0, bestCombo: 0, perfectPen: 0, perfectLine: 0, perfectWho: 0, perfectDuel: 0, questDays: 0 },
  seen: {},               // שאלות שנראו לאחרונה לכל משחק (כדי שסבב חדש יעדיף שאלות שלא ראה)
  daily: null,            // מונים יומיים למשימות
  pass: { claimed: {}, gold: false, power: { fifty: 0, time: 0, retry: 0 }, boxes: 0, owned: {} },   // פס הקרב: מה נאסף, כרטיס זהב, כוחות, קופסאות
  trophy: { w: 0, l: 0, t: 0, hist: [] },   // גביע המשפחה
  muted: false, pinHash: null, examDone: false, overviewDone: false, names: { kid: '', parent: '' },
});

let S = fresh();
let memoryOnly = false;

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      S = Object.assign(fresh(), saved);
      // שדות מקוננים: משלימים מה שחסר בשמירות ישנות (base נפרד – אחרת הערכים ששמורים דורסים את ברירות המחדל)
      const base = fresh();
      for (const k of ['eq', 'custom', 'stats', 'trophy', 'ach']) S[k] = Object.assign({}, base[k], saved[k]);
      S.pass = Object.assign({}, base.pass, saved.pass);
      S.pass.power = Object.assign({}, base.pass.power, (saved.pass || {}).power);
      // שמירה מלפני פס הקרב עם איסוף: כל פרסי החינם שכבר נפתחו נחשבים כנאספו (שלא יאבד כלום)
      if (!saved.pass) { S.pass.claimed = {}; for (let t = 1; t <= tierOf(S.xp); t++) S.pass.claimed['f' + t] = true; }
    }
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
// ---------- מונים יומיים (למשימות היום) ----------
export function daily() {
  const d = dayStr();
  if (!S.daily || S.daily.day !== d) S.daily = { day: d, rounds: 0, goals: 0, swipeRight: 0, whoRight: 0, perfectLines: 0, duels: 0, chapters: [], bestRun: 0, claimed: [], bonus: false };
  return S.daily;
}
// ---------- כוחות (power-ups) וקופסאות ----------
export const power = k => S.pass.power[k] || 0;
export function usePower(k) { if (power(k) < 1) return false; S.pass.power[k]--; save(); return true; }
// ---------- זיכרון שאלות אחרונות ----------
export const seenList = k => (S.seen && S.seen[k]) || [];
export function markSeen(k, ids, max = 80) {
  S.seen = S.seen || {};
  const keep = seenList(k).filter(x => !ids.includes(x));
  S.seen[k] = [...keep, ...ids].slice(-max); save();
}
export function maxStat(k, v) { if (v > (S.stats[k] || 0)) S.stats[k] = v; }

// ---------- גביע המשפחה ----------
export function recordDuel(kg, pg, topic) {
  const t = S.trophy;
  if (kg > pg) t.w++; else if (pg > kg) t.l++; else t.t++;
  t.hist.unshift({ d: dayStr(), kg, pg, topic });
  t.hist.length = Math.min(t.hist.length, 8);
  save();
}
export function setMuted(m) { S.muted = m; save(); }
export function resetAll() { S = fresh(); save(); }
