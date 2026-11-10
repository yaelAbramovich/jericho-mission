// עזר לבניית שאלות דו-קרב: שאלת "איפה כתוב?" עם מיקומים לא נכונים.
import { refText } from './content.js';
export const loc = (quote, c, v, wrong) => ({
  q: `באיזה פסוק כתוב: "${quote}"?`, a: refText(c, v), w: wrong.map(([c2, v2]) => refText(c2, v2)), why: `${refText(c, v)} – ${quote}`,
});
