// זיכרון שברים: תרגיל ↔ תוצאה (זוגות), או תרגיל · שלב ביניים · תוצאה (שלישיות). שחקן אחד או שניים.
// הלוח עצמו ב-memory-core.js (משותף לכל משחקי הזיכרון). opts.cfg – דילוג על ההגדרות (בדיקות). אין שתי תוצאות שוות בערך על אותו לוח.
import { memorySetup, playMemory } from './memory-core.js';
import * as FG from '../subjects/fractions/fgen.js';
import * as Fr from '../subjects/fractions/frac.js';

export const __test = { sets: null };
const SIZES = { pairs: [['4x4', 'קטן'], ['4x6', 'בינוני'], ['4x8', 'גדול'], ['5x8', 'ענק']], triples: [['3x4', 'קטן'], ['3x6', 'בינוני'], ['3x8', 'גדול'], ['4x9', 'ענק']] };
const LEVELS = [['1', 'קל'], ['2', 'בינוני'], ['3', 'מאתגר']];
const DEFAULTS = { mode: 'pairs', size: '4x6', level: '2', players: '1' };

// שלישייה: תרגיל · שלב ביניים · תוצאה. שלם×שבר: בשלב הביניים מכפילים רק את המונה (שבר מדומה); שלם×מעורב: שלמים לחוד ושברים לחוד
function tripleSet(topic, level) {
  for (let g = 0; g < 200; g++) {
    const it = FG.GEN[topic](level);
    if (topic === 'wf') { if (it.res.n < it.res.d) continue; return { it, cards: [it.q, `${it.n * it.f.n}⁄${it.f.d}`, it.a] }; }
    const part = it.n * (it.f.n - it.w * it.f.d);                      // n × (חלק שברי של המספר המעורב)
    return { it, cards: [it.q, `${it.n} × ${it.w} + ${it.n} × ${it.f.n - it.w * it.f.d}⁄${it.f.d}`, it.a], part };
  }
}

export function buildSets({ mode, count, level, chapter }) {
  const topics = FG.topicsFor(chapter), sets = [];
  if (mode === 'triples') {
    const vals = [], seen = new Set();
    for (let guard = 0; sets.length < count && guard < 3000; guard++) {
      const t = tripleSet(FG.pick(topics), level);
      if (vals.some(v => Fr.eq(v, t.it.res)) || t.cards.some(c => seen.has(c)) || new Set(t.cards).size < 3) continue;
      vals.push(t.it.res); t.cards.forEach(c => seen.add(c)); sets.push({ meta: { kind: 'tri', topic: t.it.topic, n: t.it.n, f: t.it.f }, cards: t.cards.map(c => ({ t: c })), why: t.it.why });
    }
    return sets;
  }
  return FG.items(count, topics, level).map(it => ({ meta: { kind: 'pair', topic: it.topic, n: it.n, f: it.f }, cards: [{ t: it.q }, { t: it.a }], why: it.why }));
}

export async function run(el, { chapter = 0, cfg: preset = null }, sc) {
  const cfg = preset ? { ...DEFAULTS, ...preset } : await memorySetup(el, sc, { key: 'jericho.fmemcfg', title: 'זיכרון שברים', defaults: DEFAULTS, sizes: SIZES, levels: LEVELS, canTriples: true, minHeight: { '4x8': 640, '5x8': 640, '3x8': 640, '4x9': 700 },
    intro: 'הופכים קלפים ומוצאים תרגיל והתוצאה שלו. בשלישיות מתאימים גם את שלב הביניים. אחרי כל התאמה מופיע הסבר.' });
  const [cols, rows0] = cfg.size.split('x').map(Number), k = cfg.mode === 'triples' ? 3 : 2;
  const sets = buildSets({ mode: cfg.mode, count: (cols * rows0) / k, level: +cfg.level, chapter });
  __test.sets = sets;
  const deck = []; sets.forEach((s, si) => s.cards.forEach(c => deck.push({ set: si, t: c.t, he: false, why: s.why })));
  return playMemory(el, sc, { cols, rows: Math.ceil(deck.length / cols), k, deck: FG.shuffle(deck), nSets: sets.length }, cfg);
}
