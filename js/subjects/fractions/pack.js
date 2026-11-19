// חבילת המקצוע "שברים": כפל שלם בשבר, וכפל שלם במספר מעורב. השיעורים משתמשים ברכיבי fractions/kit.js (פסי שברים).
import * as C from './content.js';
import { MAP } from './map.js';
import { LESSONS } from './lessons.js';
import { hebNum } from '../../hebrew.js';
import { deepFx } from './frac.js';

export default {
  id: 'fractions', name: 'שברים', icon: '🍕', appTitle: 'מבצע השברים',
  testDate: C.TEST_DATE,
  units: deepFx(C.UNITS), overview: null, glossary: deepFx(C.GLOSSARY),
  topics: deepFx(C.TOPICS), duels: { f1: deepFx(C.DUEL_F) }, duelUnits: { f1: [1, 2] },
  statements: deepFx(C.STATEMENTS), sequences: deepFx(C.SEQUENCES), boss: null, quotes: [], who: {}, refText: () => '',
  lessons: deepFx(LESSONS), lessonKit: 'fractions/kit.js',
  map: MAP,
  games: { hunter: { modes: ['trivia'] }, swipe: {}, order: {}, fmemory: {}, fmore: {}, fshop: {}, fline: {}, duel: {} },
  labels: {
    unit: n => `נושא ${hebNum(n)}׳`, unitShort: n => hebNum(n) + '׳', nodeLabel: n => hebNum(n),
    zoneHead: n => `אזור ${hebNum(n)}׳ · נושא ${hebNum(n)}`, allUnits: 'כל הנושאים', pickUnit: 'איזה נושא?', unitsWord: 'נושאים',
    briefing: { name: 'תדריך משימה', desc: 'הסבר קצר על הנושא' },
    overviewCard: null,
    triviaDesc: 'תרגילים על הנושא – עונים נכון וכובשים',
    studyHint: 'בכל נושא יש שיעור אינטראקטיבי עם פסי שברים: אוספים, מפרקים ועונים, ואחריו סיכום. מתחילים מהשיעור 🎬',
  },
};
