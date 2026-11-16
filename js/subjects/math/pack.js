// חבילת המקצוע "חשבון": מספרים עשרוניים – כפל וחילוק ב-10, ב-100 וב-1,000, וכפל עשרוני (א). טיוטה על פי עמודים 7–40 של הספר.
import * as C from './content.js';
import * as B from './content-b.js';
import { MAP } from './map.js';
import { LESSONS } from './lessons.js';
import { hebNum } from '../../hebrew.js';

export default {
  id: 'math', name: 'חשבון', icon: '🧮', appTitle: 'מבצע המספרים',
  testDate: C.TEST_DATE,
  units: [...C.UNITS, ...B.UNITS_B], overview: null, glossary: C.GLOSSARY,
  topics: [...C.TOPICS, ...B.TOPICS_B], duels: { ...C.DUELS, m2: B.DUEL_B }, duelUnits: { m1: [1, 2, 3], m2: [3, 4, 5] },
  statements: [...C.STATEMENTS, ...B.STATEMENTS_B], sequences: [...C.SEQUENCES, ...B.SEQUENCES_B], boss: null, quotes: [], who: {}, refText: () => '',
  lessons: LESSONS, lessonKit: 'math/kit.js',   // נתוני השיעורים; קובץ הרכיבים (kit.js) נטען רק כשפותחים שיעור
  map: MAP,
  games: { hunter: { modes: ['trivia'] }, swipe: {}, order: {}, duel: {} },
  labels: {
    unit: n => `נושא ${hebNum(n)}׳`, unitShort: n => hebNum(n) + '׳', nodeLabel: n => hebNum(n),
    zoneHead: n => `אזור ${hebNum(n)}׳ · נושא ${hebNum(n)}`, allUnits: 'כל הנושאים', pickUnit: 'איזה נושא?', unitsWord: 'נושאים',
    briefing: { name: 'תדריך משימה', desc: 'הסבר קצר על הנושא' },
    overviewCard: null,
    triviaDesc: 'תרגילים על הנושא – עונים נכון וכובשים',
    studyHint: 'בכל נושא יש שיעור אינטראקטיבי עם אנימציות וגרירה, ואחריו סיכום. מתחילים מהשיעור 🎬',
  },
};
