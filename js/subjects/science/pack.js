// חבילת המקצוע "מדע וטכנולוגיה": מערכות טכנולוגיות (קלט, תהליך, פלט). טיוטה על פי עמודים 30–39 של הספר.
import * as C from './content.js';
import { MAP } from './map.js';
import { hebNum } from '../../hebrew.js';

export default {
  id: 'science', name: 'מדע וטכנולוגיה', icon: '🔬', appTitle: 'מבצע טכנולוגיה',
  testDate: C.TEST_DATE,
  units: C.UNITS, overview: null, glossary: C.GLOSSARY,
  topics: C.TOPICS, duels: C.DUELS, duelUnits: { s1: [1, 2, 3, 4, 5] }, diagrams: C.DIAGRAMS,
  statements: C.STATEMENTS, sequences: C.SEQUENCES, boss: null, quotes: [], who: {}, refText: () => '',
  map: MAP,
  games: { hunter: { modes: ['trivia'] }, swipe: {}, order: {}, diagram: {}, duel: {} },
  labels: {
    unit: n => `יחידה ${hebNum(n)}׳`, unitShort: n => hebNum(n) + '׳', nodeLabel: n => hebNum(n),
    zoneHead: n => `אזור ${hebNum(n)}׳ · יחידה ${hebNum(n)}`, allUnits: 'כל היחידות', pickUnit: 'איזו יחידה?', unitsWord: 'יחידות',
    briefing: { name: 'תדריך משימה', desc: 'הסבר קצר על היחידה' },
    overviewCard: null,
    triviaDesc: 'שאלות על היחידה – עונים נכון וכובשים',
    studyHint: 'כל מה שחשוב לדעת למבחן. לוחצים על נושא וקוראים.',
  },
};
