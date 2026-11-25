// חבילת המקצוע "היסטוריה": יוון העתיקה (פרק א: העדים ותושביהם, פרק ב: חיי התרבות והחברה). המבוא להיסטוריה – TBD.
import * as C from './content.js';
import { MAP } from './map.js';
import { LESSONS } from './lessons.js';
import { hebNum } from '../../hebrew.js';

export default {
  id: 'history', name: 'היסטוריה', icon: '🏛️', appTitle: 'מבצע יוון',
  testDate: C.TEST_DATE,
  units: C.UNITS, overview: null, glossary: C.GLOSSARY,
  topics: C.TOPICS, duels: C.DUELS, duelUnits: { h1: [1, 2, 3], h2: [4, 5, 6] },
  statements: C.STATEMENTS, sequences: C.SEQUENCES, boss: null, quotes: [], who: {}, refText: () => '',
  lessons: LESSONS, lessonKit: 'history/kit.js',
  map: MAP,
  games: { hunter: { modes: ['trivia'] }, swipe: {}, order: {}, duel: {} },
  labels: {
    unit: n => `נושא ${hebNum(n)}׳`, unitShort: n => hebNum(n) + '׳', nodeLabel: n => hebNum(n),
    zoneHead: n => `אזור ${hebNum(n)}׳ · נושא ${hebNum(n)}`, allUnits: 'כל הנושאים', pickUnit: 'איזה נושא?', unitsWord: 'נושאים',
    briefing: { name: 'תדריך משימה', desc: 'הסבר קצר על הנושא' },
    overviewCard: null,
    triviaDesc: 'שאלות על יוון העתיקה – עונים נכון וכובשים',
    studyHint: 'בכל נושא יש שיעור אינטראקטיבי עם מיון וחידונים, ואחריו סיכום. מתחילים מהשיעור 🎬',
  },
};
