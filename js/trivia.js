// טריוויה לפנדלים: שאלות רב-ברירה על הפרק, מתוך מאגר שאלות הדו-קרב (בלי שאלות "באיזה פסוק כתוב").
import { DUELS } from './duel-content.js';

const NUM = { 'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5 };
const chOfRef = ref => { const m = /פרק\s+([א-ה])׳/.exec(ref || ''); return m ? NUM[m[1]] : 0; };
const FIXED = { j1: 1, j2: 2, j5: 5 };   // נושא אחד = פרק אחד. j34 מכיל שני פרקים, לכן קובעים לפי פסוק הרעיון

export const TRIVIA = [];
for (const [topic, D] of Object.entries(DUELS)) {
  let ch = FIXED[topic] || 0;
  D.ideas.forEach((idea, ii) => {
    if (!FIXED[topic]) ch = chOfRef(idea.verse && idea.verse.ref) || ch;   // רעיון בלי פסוק – יורש את הפרק של הקודם
    idea.qs.forEach((q, qi) => {
      if (q.q.startsWith('באיזה פסוק')) return;   // שאלות "איפה כתוב" לא נכללות: זו לא טריוויה
      TRIVIA.push({ id: `${topic}:${ii}:${qi}`, c: ch, q: q.q, a: q.a, w: q.w, why: q.why, idea: idea.title });
    });
  });
}
