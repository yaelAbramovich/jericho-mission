// טריוויה לפנדלים: שאלות רב-ברירה על היחידה, מתוך מאגר שאלות הדו-קרב (בלי שאלות "באיזה פסוק כתוב").
// היחידה של שאלה: idea.unit אם הוגדר, אחרת היחידה היחידה של הנושא (pack.duelUnits).
import { PACK } from './subjects/index.js';

export const TRIVIA = [];
for (const [topic, D] of Object.entries(PACK.duels)) {
  const units = (PACK.duelUnits || {})[topic] || [];
  D.ideas.forEach((idea, ii) => {
    const unit = idea.unit || (units.length === 1 ? units[0] : 0);
    idea.qs.forEach((q, qi) => {
      if (q.q.startsWith('באיזה פסוק')) return;   // שאלות "איפה כתוב" לא נכללות: זו לא טריוויה
      TRIVIA.push({ id: `${topic}:${ii}:${qi}`, c: unit, q: q.q, a: q.a, w: q.w, why: q.why, idea: idea.title });
    });
  });
}
