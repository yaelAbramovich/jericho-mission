// חבילת המקצוע "יהושע א׳–ה׳". זו התבנית לכל מקצוע חדש: כל מה שהמנוע צריך לדעת על המבחן נמצא כאן.
import * as C from './content.js';
import { TOPICS } from './focus-content.js';
import { DUELS } from './duel-content.js';
import { MAP } from './map.js';
import { hebNum } from '../../hebrew.js';

export default {
  id: 'joshua', name: 'יהושע א׳–ה׳', icon: '📖', appTitle: 'מבצע יריחו',
  testDate: C.TEST_DATE,

  // יחידות הלימוד (אזורי המפה). לכל יחידה: n, zone (שם האזור), title, leading?, story (שקופיות "תדריך")
  units: C.CHAPTERS,
  overview: C.OVERVIEW,                // "הסיפור בקצרה" (שקופיות פתיחה), או null
  glossary: C.GLOSSARY,                // מושגים שלוחצים עליהם לקבלת הסבר
  topics: TOPICS,                      // חומר הלימוד ("למבחן")
  duels: DUELS,                        // דו-קרב משפחתי: נושאים → רעיונות → שאלות
  duelUnits: { j1: [1], j2: [2], j34: [3, 4], j5: [5] },   // אילו יחידות כל נושא דו-קרב מכסה
  statements: C.STATEMENTS,            // אמת/שקר
  sequences: C.SEQUENCES,              // סידור אירועים
  examSequences: ['sx'],               // סדרה (מכל היחידות) שמשתמשים בה בשלב "בונים את הקו" של מבחן הסיכום
  boss: C.BOSS,                        // שאלה פתוחה (ליחידה אחת)
  quotes: C.QUOTES, who: C.WHO,        // ציטוטי פסוקים ודוברים (למשחקי "מצא בתנ״ך" / "מי אמר")
  refText: C.refText,                  // "יהושע ב׳:ו׳"
  map: MAP,

  // אילו משחקים פעילים במקצוע הזה, ובאילו אופנים
  games: { hunter: { modes: ['trivia', 'find', 'match'] }, swipe: {}, who: {}, order: {}, boss: { unit: 2 }, duel: {} },

  // טקסטים שמותאמים למקצוע
  labels: {
    unit: n => `פרק ${hebNum(n)}׳`, unitShort: n => hebNum(n) + '׳', nodeLabel: n => hebNum(n),
    zoneHead: n => `אזור ${hebNum(n)}׳ · פרק ${hebNum(n)}`, allUnits: 'כל הפרקים', pickUnit: 'איזה פרק?', unitsWord: 'פרקים',
    briefing: { name: 'תדריך משימה', desc: 'הסיפור של הפרק' },
    overviewCard: { icon: '📖', title: 'הסיפור בקצרה', again: 'לקרוא שוב את כל הסיפור', first: 'לא מכירים את הסיפור? מתחילים כאן', cta: 'התחל כאן' },
    mapEast: 'מזרח', mapWest: 'מערב',
    triviaDesc: 'שאלות על הפרק – עונים נכון וכובשים', findDesc: 'מוצאים את הפרק והפסוק של ציטוט', matchDesc: 'בוחרים את הציטוט שמתאים לפירוש', findName: 'מצא בתנ״ך', matchName: 'התאמת ציטוט',
    studyHint: 'כל מה שחשוב לדעת למבחן. לוחצים על נושא וקוראים.',
  },
};
