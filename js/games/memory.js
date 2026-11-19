// זיכרון עשרוני: מוצאים זוגות (תרגיל ↔ תוצאה) או שלישיות (תרגיל ↔ כלל/הערכה ↔ תוצאה). שחקן אחד, או שניים בתורות.
// התרגילים נוצרים אוטומטית מהאזור שנבחר (opts.chapter; 0 = כל האזורים). opts.cfg – דילוג על מסך ההגדרות (בדיקות / "עוד סבב").
// הלוח עצמו (קלפים, תורות, הסבר, סיכום) נמצא ב-memory-core.js ומשותף לזיכרון גיאומטרי.
import { memorySetup, playMemory } from './memory-core.js';
import * as G from '../subjects/math/gen.js';

const SIZES = { pairs: [['4x4', 'קטן'], ['4x6', 'בינוני'], ['4x8', 'גדול'], ['5x8', 'ענק']], triples: [['3x4', 'קטן'], ['3x6', 'בינוני'], ['3x8', 'גדול'], ['4x9', 'ענק']] };
const LEVELS = [['1', 'קל'], ['2', 'בינוני'], ['3', 'מאתגר']];
const DEFAULTS = { mode: 'pairs', size: '4x6', level: '2', players: '1' };

function build(cfg, chapter) {
  const [cols, rows0] = cfg.size.split('x').map(Number), k = cfg.mode === 'triples' ? 3 : 2, want = (cols * rows0) / k;
  const topics = k === 3 ? G.tripleTopicsFor(chapter) : G.topicsFor(chapter), level = +cfg.level;
  const sets = [], seen = new Set();
  for (let guard = 0; sets.length < want && guard < 4000; guard++) {
    let cards, why;
    if (k === 3) { const t = G.triple(G.pick(topics), level); cards = t.cards; why = t.it.why; }
    else { const it = G.items(1, topics, level)[0]; cards = [{ t: it.q, he: !!it.hebrew }, { t: it.a }]; why = it.why; }
    if (cards.some(c => seen.has(c.t)) || new Set(cards.map(c => c.t)).size < k) continue;   // כל טקסט על הלוח מופיע פעם אחת בלבד
    cards.forEach(c => seen.add(c.t)); sets.push({ cards, why });
  }
  const deck = [];
  sets.forEach((s, si) => s.cards.forEach(c => deck.push({ set: si, t: c.t, he: !!c.he, why: s.why })));
  return { cols, rows: Math.ceil(deck.length / cols), k, deck: G.shuffle(deck), nSets: sets.length };
}

export async function run(el, { chapter = 0, cfg: preset = null }, sc) {
  const cfg = preset ? { ...DEFAULTS, ...preset } : await memorySetup(el, sc, { key: 'jericho.memcfg', title: 'זיכרון עשרוני', defaults: DEFAULTS, sizes: SIZES, levels: LEVELS, canTriples: G.tripleTopicsFor(chapter).length > 0 });
  return playMemory(el, sc, build(cfg, chapter), cfg);
}
