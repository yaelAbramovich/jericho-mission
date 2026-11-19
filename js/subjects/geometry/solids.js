// תוכן למשחקי הגיאומטריה (זיכרון גיאומטרי, יותר או פחות?, הסדנה): גופים, שמות, ספירת פאות/צלעות/קודקודים, ובעיות.
// הספירות מגיעות מ-geo.counts (מנסרה n-צלעית: n+2 פאות, 3n צלעות, 2n קודקודים; פירמידה: n+1 פאות, 2n צלעות, n+1 קודקודים),
// ונבדקות בבדיקות האוטומטיות מול ספירה ישירה מהמודל התלת-ממדי (geo.model).
import * as Geo from '../math/geo.js';
import * as G from '../math/gen.js';

export const NS = [3, 4, 5, 6, 7, 8];
export const ROUND = { cylinder: 'גליל', cone: 'חרוט', sphere: 'כדור' };
export const nameOf = (type, n) => (type === 'prism' ? Geo.prismName(n) : Geo.pyramidName(n));
export const countsOf = (type, n) => Geo.counts(type, n);
export const PROP = { faces: 'פאות', edges: 'צלעות', verts: 'קודקודים' };
export const countsText = c => `${c.faces} פאות\n${c.edges} צלעות\n${c.verts} קודקודים`;
export const POLYS = ['prism', 'pyramid'].flatMap(type => NS.map(n => ({ type, n })));      // 12 פאונים
// אזור 1 = פאונים בכלל, אזור 2 = פירמידות, אזור 3 = מנסרות (ופריסות); בלי אזור – הכול
export const typesFor = ch => (ch === 2 ? ['pyramid'] : ch === 3 ? ['prism'] : ['prism', 'pyramid']);
const R = G.R, pick = G.pick, D = n => G.D(n, 0);

export const whyOf = (type, n) => {
  const c = countsOf(type, n), nm = nameOf(type, n);
  return type === 'prism'
    ? `${nm}: שני בסיסים ו־${n} פאות צדדיות, ${n} + 2 = ${c.faces} פאות. צלעות: ${n} + ${n} + ${n} = ${c.edges}. קודקודים: ${n} + ${n} = ${c.verts}.`
    : `${nm}: בסיס אחד ו־${n} פאות משולשות, ${n} + 1 = ${c.faces} פאות. צלעות: ${n} + ${n} = ${c.edges}. קודקודים: ${n} + 1 = ${c.verts}.`;
};

// ---------- זיכרון: קבוצות קלפים ----------
// קלף: { t (מזהה/טקסט ייחודי), svg? , he? }. meta – לבדיקות: איזה גוף וסוג ההתאמה.
const draw = (type, n) => ({ t: `draw:${type}:${n}`, svg: Geo.shapeSVG({ shape: type, n }, 120) });
const net = (type, n) => ({ t: `net:${type}:${n}`, svg: Geo.shapeSVG({ net: type, n }, 120) });
const name = (type, n) => ({ t: nameOf(type, n), he: true });
const cnt = (type, n) => ({ t: countsText(countsOf(type, n)), he: true });
// mode 'triples': ציור · שם · ספירה (רק פאונים). mode 'pairs': רמה 1 = ציור↔שם; 2 = + שם↔ספירה; 3 = + פריסה↔ציור.
export function memorySets({ mode = 'pairs', count, level = 2, chapter = 0 }) {
  const pref = new Set(typesFor(chapter));
  const polys = G.shuffle(POLYS), ordered = [...polys.filter(p => pref.has(p.type)), ...polys.filter(p => !pref.has(p.type))];
  if (mode === 'triples') return ordered.slice(0, count).map(({ type, n }) => ({ meta: { kind: 'tri', type, n }, cards: [draw(type, n), name(type, n), cnt(type, n)], why: whyOf(type, n) }));
  const kinds = level === 1 ? ['dn'] : level === 2 ? ['dn', 'nc'] : ['dn', 'nc', 'net'];
  const rounds = Object.keys(ROUND).map(shape => ({ shape }));
  const pool = [...ordered, ...G.shuffle(rounds)];                // הגופים העגולים אחרונים (נכנסים רק אם הלוח גדול)
  return pool.slice(0, count).map(s => {
    if (s.shape) return { meta: { kind: 'dn', shape: s.shape }, cards: [{ t: `draw:${s.shape}`, svg: Geo.shapeSVG({ shape: s.shape }, 120) }, { t: ROUND[s.shape], he: true }],
      why: `${ROUND[s.shape]} הוא גוף עגול – אין לו פאות שטוחות כמו לפאון.` };
    const kind = pick(kinds), { type, n } = s;
    const cards = kind === 'dn' ? [draw(type, n), name(type, n)] : kind === 'nc' ? [name(type, n), cnt(type, n)] : [net(type, n), draw(type, n)];
    return { meta: { kind, type, n }, cards, why: whyOf(type, n) };
  });
}

// ---------- יותר או פחות? ----------
export function compareQuestion(level, chapter = 0) {
  const types = typesFor(chapter), tA = pick(types), nA = pick(NS);
  let tB, nB;
  if (level === 1) { tB = tA === 'prism' ? 'pyramid' : 'prism'; nB = nA; }                       // אותו בסיס, סוג גוף אחר
  else if (level === 2) { tB = tA; do { nB = pick(NS); } while (nB === nA); }                    // אותו סוג, בסיס אחר
  else { tB = pick(['prism', 'pyramid']); nB = pick(NS); if (tB === tA && nB === nA) nB = nA === 8 ? 3 : nA + 1; }
  const prop = pick(Object.keys(PROP)), a = countsOf(tA, nA)[prop], b = countsOf(tB, nB)[prop];
  const ans = a > b ? 'more' : a < b ? 'less' : 'same';
  const A = nameOf(tA, nA), B = nameOf(tB, nB);
  const why = ans === 'same' ? `ל${A} יש ${a} ${PROP[prop]}, ול${B} יש ${b} ${PROP[prop]} – אותו מספר.` : `ל${A} יש ${a} ${PROP[prop]}, ול${B} יש ${b} ${PROP[prop]} – ${a} ${ans === 'more' ? 'יותר מ' : 'פחות מ'}־${b}.`;
  return { A: { type: tA, n: nA, name: A }, B: { type: tB, n: nB, name: B }, prop, propWord: PROP[prop], a, b, ans, why };
}

// ---------- הסדנה: בעיות מספריות ----------
export function workProblem(level, chapter = 0) {
  const type = pick(typesFor(chapter)), n = level === 1 ? R(3, 5) : level === 2 ? R(3, 8) : R(5, 8), nm = nameOf(type, n), c = countsOf(type, n);
  const ofLevel = level === 1 ? ['edges', 'verts'] : level === 2 ? ['edges', 'verts', 'faces', 'lat'] : (type === 'prism' ? ['revE', 'revF', 'euler', 'edges'] : ['revV', 'euler', 'edges']);
  const kind = pick(ofLevel), meta = { kind, type, n };
  const P = (text, ans, unit, hint, why) => ({ meta, kind, text, ans: D(ans), unit, hint, why });
  switch (kind) {
    case 'edges': return P(`בונים שלד של ${nm} ממקלות וכדורי פלסטלינה: מקל לכל צלע. כמה מקלות צריך?`, c.edges, 'מקלות',
      type === 'prism' ? 'סופרים את הצלעות של שני הבסיסים, ועוד הצלעות הצדדיות.' : 'סופרים את צלעות הבסיס, ועוד הצלעות שעולות אל הקודקוד העליון.',
      type === 'prism' ? `${n} + ${n} + ${n} = ${c.edges}` : `${n} + ${n} = ${c.edges}`);
    case 'verts': return P(`בונים שלד של ${nm} ממקלות וכדורי פלסטלינה: כדור לכל קודקוד. כמה כדורים צריך?`, c.verts, 'כדורים',
      type === 'prism' ? 'בכל בסיס יש קודקוד לכל צלע של הבסיס.' : 'קודקודי הבסיס, ועוד קודקוד אחד למעלה.',
      type === 'prism' ? `${n} + ${n} = ${c.verts}` : `${n} + 1 = ${c.verts}`);
    case 'faces': return P(`רוצים לצבוע כל פאה של ${nm} בצבע אחר. כמה צבעים צריך?`, c.faces, 'צבעים',
      type === 'prism' ? 'הפאות הצדדיות, ועוד שני הבסיסים.' : 'הפאות הצדדיות (משולשים), ועוד הבסיס.', type === 'prism' ? `${n} + 2 = ${c.faces}` : `${n} + 1 = ${c.faces}`);
    case 'lat': return P(`כמה פאות צדדיות יש ל${nm}?`, n, 'פאות', 'מספר הפאות הצדדיות שווה למספר הצלעות של הבסיס.', `בסיס עם ${n} צלעות ⇒ ${n} פאות צדדיות.`);
    case 'revE': return P(`למנסרה יש ${c.edges} צלעות. כמה צלעות יש בכל אחד מהבסיסים שלה?`, n, 'צלעות', 'במנסרה יש שלוש קבוצות שוות של צלעות: בסיס עליון, בסיס תחתון וצלעות צדדיות.', `${c.edges} : 3 = ${n}`);
    case 'revF': return P(`למנסרה יש ${c.faces} פאות. כמה מהן פאות צדדיות?`, n, 'פאות', 'שתי פאות הן הבסיסים, כל השאר צדדיות.', `${c.faces} − 2 = ${n}`);
    case 'revV': return P(`לפירמידה יש ${c.verts} קודקודים. כמה צלעות יש בבסיס שלה?`, n, 'צלעות', 'קודקוד אחד הוא הקודקוד העליון, כל השאר בבסיס.', `${c.verts} − 1 = ${n}`);
    default: return P(`לפאון יש ${c.faces} פאות ו־${c.verts} קודקודים. כמה צלעות יש לו?`, c.edges, 'צלעות',
      'משפט אוילר: קודקודים + פאות − 2 = צלעות.', `${c.verts} + ${c.faces} − 2 = ${c.edges}`);
  }
}
