// חבילת המקצוע "גיאומטריה": פאון, פירמידה ומנסרה (כולל פריסות). השיעורים משתמשים ברכיבי math/kit.js (ציורי גופים).
import * as C from './content.js';
import { MAP } from './map.js';
import { LESSONS } from './lessons.js';
import { hebNum } from '../../hebrew.js';

export default {
  id: 'geometry', name: 'גיאומטריה', icon: '📐', appTitle: 'מבצע הגופים',
  testDate: C.TEST_DATE,
  units: C.UNITS, overview: null, glossary: {},
  topics: C.TOPICS, duels: { g1: C.DUEL_G }, duelUnits: { g1: [1, 2, 3] },
  statements: C.STATEMENTS, sequences: C.SEQUENCES, boss: null, quotes: [], who: {}, refText: () => '',
  lessons: LESSONS, lessonKit: 'math/kit.js',
  map: MAP,
  games: { hunter: { modes: ['trivia'] }, swipe: {}, order: {}, duel: {} },
  labels: {
    unit: n => `נושא ${hebNum(n)}׳`, unitShort: n => hebNum(n) + '׳', nodeLabel: n => hebNum(n),
    zoneHead: n => `אזור ${hebNum(n)}׳ · נושא ${hebNum(n)}`, allUnits: 'כל הנושאים', pickUnit: 'איזה נושא?', unitsWord: 'נושאים',
    briefing: { name: 'תדריך משימה', desc: 'הסבר קצר על הנושא' },
    overviewCard: null,
    triviaDesc: 'תרגילים על הנושא – עונים נכון וכובשים',
    studyHint: 'בכל נושא יש שיעור אינטראקטיבי עם ציורי גופים, מיון וספירה, ואחריו סיכום. מתחילים מהשיעור 🎬',
  },
};
