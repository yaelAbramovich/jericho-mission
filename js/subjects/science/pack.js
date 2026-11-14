// חבילת המקצוע "מדעים" (דוגמה – מחליפים בתוכן האמיתי כשיגיע). שימו לב: אין פסוקים, אין "מי אמר", ויש 3 יחידות במקום 5.
import * as C from './content.js';
import { MAP } from './map.js';
import { hebNum } from '../../hebrew.js';

export default {
  id: 'science', name: 'מדעים (דוגמה)', icon: '🔬', appTitle: 'מבצע מדעים', sample: true,
  testDate: C.TEST_DATE,
  units: C.UNITS, overview: null, glossary: C.GLOSSARY,
  topics: C.TOPICS, duels: C.DUELS, duelUnits: { s1: [1, 2, 3] },
  statements: C.STATEMENTS, sequences: C.SEQUENCES, boss: null, quotes: [], who: {}, refText: () => '',
  map: MAP,
  games: { hunter: { modes: ['trivia'] }, swipe: {}, order: {}, duel: {} },
  labels: {
    unit: n => `יחידה ${hebNum(n)}׳`, unitShort: n => hebNum(n) + '׳', nodeLabel: n => hebNum(n),
    zoneHead: n => `אזור ${hebNum(n)}׳ · יחידה ${hebNum(n)}`, allUnits: 'כל היחידות', pickUnit: 'איזו יחידה?', unitsWord: 'יחידות',
    briefing: { name: 'תדריך משימה', desc: 'הסבר קצר על היחידה' },
    overviewCard: null,
    triviaDesc: 'שאלות על היחידה – עונים נכון וכובשים',
    studyHint: 'כל מה שחשוב לדעת למבחן. לוחצים על נושא וקוראים.',
  },
};
