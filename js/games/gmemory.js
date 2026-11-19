// זיכרון גיאומטרי: ציורי גופים, פריסות, שמות וספירות (פאות/צלעות/קודקודים). זוגות או שלישיות, שחקן אחד או שניים.
// התוכן ב-subjects/geometry/solids.js, והלוח ב-memory-core.js (משותף לזיכרון עשרוני). opts.cfg – דילוג על ההגדרות (בדיקות).
import { memorySetup, playMemory } from './memory-core.js';
import * as S from '../subjects/geometry/solids.js';
import { shuffle } from '../ui.js';

export const __test = { sets: null };                // לבדיקות: הקבוצות שנבנו (עם meta על הגוף והסוג)
const SIZES = { pairs: [['4x4', 'קטן'], ['4x5', 'בינוני'], ['4x6', 'גדול'], ['4x7', 'ענק']], triples: [['3x4', 'קטן'], ['3x6', 'בינוני'], ['3x8', 'גדול'], ['4x9', 'ענק']] };
const LEVELS = [['1', 'קל'], ['2', 'בינוני'], ['3', 'מאתגר']];
const DEFAULTS = { mode: 'pairs', size: '4x5', level: '2', players: '1' };

export async function run(el, { chapter = 0, cfg: preset = null }, sc) {
  const cfg = preset ? { ...DEFAULTS, ...preset } : await memorySetup(el, sc, {
    key: 'jericho.gmemcfg', title: 'זיכרון גיאומטרי', defaults: DEFAULTS, sizes: SIZES, levels: LEVELS, levelModes: ['pairs'], canTriples: true, minHeight: { '4x9': 700 },
    intro: 'מצאו התאמות בין ציור של גוף, הפריסה שלו, השם שלו ומספר הפאות, הצלעות והקודקודים. ברמה קלה מתאימים ציור לשם, בבינונית גם שם לספירה, ובמאתגרת גם פריסות. אחרי כל התאמה מופיע הסבר.' });
  const [cols, rows0] = cfg.size.split('x').map(Number), k = cfg.mode === 'triples' ? 3 : 2;
  const sets = S.memorySets({ mode: cfg.mode, count: (cols * rows0) / k, level: +cfg.level, chapter });
  __test.sets = sets;
  const deck = [];
  sets.forEach((s, si) => s.cards.forEach(c => deck.push({ set: si, t: c.t, he: !!c.he, svg: c.svg, why: s.why })));
  return playMemory(el, sc, { cols, rows: Math.ceil(deck.length / cols), k, deck: shuffle(deck), nSets: sets.length }, cfg);
}
