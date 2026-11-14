// בדיקות לאפליקציה (בלי build). הרצה: npm install && npx playwright install chromium && npm test
//   npm run test:fast  – רק פרק ב׳ (מהיר יותר)
// מה נבדק: כל קובץ JS נטען כמודול (תופס שגיאות תחביר/הגדרה כפולה), כל מסך נפתח, כל משחק
// משוחק מההתחלה עד הסוף בכל פרק, ושמירת התוכן והתגמולים תקינה. כל שגיאת JS בדפדפן = כשלון.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { playToEnd } from './bot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FAST = process.argv.includes('--fast');
const CHAPTERS = FAST ? [2] : [0, 1, 2, 3, 4, 5];

let chromium;
try { ({ chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')); }
catch { console.error('Playwright לא מותקן. הריצו: npm install && npx playwright install chromium'); process.exit(2); }

// ---- שרת סטטי קטן ----
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();

// ---- כלים ----
const results = [];
async function test(name, fn) {
  const t0 = Date.now();
  try { await fn(); results.push({ name, ok: true }); console.log(`  ✓ ${name} (${((Date.now() - t0) / 1000).toFixed(1)}s)`); }
  catch (e) { results.push({ name, ok: false, e }); console.log(`  ✗ ${name}\n      ${String(e.message || e).split('\n').join('\n      ')}`); }
}
// עמוד חדש (עם אחסון נקי) שאוסף כל שגיאה: חריגות, console.error ובקשות שנכשלו
async function withPage(fn, { storage, permissions, init, viewport = { width: 390, height: 844 } } = {}) {
  const ctx = await browser.newContext({ viewport, serviceWorkers: 'block', permissions });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('חריגה: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url().replace(BASE, '')}`); });
  try {
    await page.addInitScript(() => { window.__strictAppend = true; });   // append(false/null) = שגיאה בבדיקות (בייצור – מתעלמים)
    if (init) await page.addInitScript(init);
    if (storage) await page.addInitScript(s => { if (!localStorage.getItem('jericho.v1')) localStorage.setItem('jericho.v1', s); }, JSON.stringify(storage));
    await page.goto(BASE + '/'); await page.waitForSelector('.map');
    const out = await fn(page);
    if (errors.length) throw new Error('שגיאות בדפדפן:\n- ' + [...new Set(errors)].join('\n- '));
    return out;
  } finally { await ctx.close(); }
}
const eq = (a, b, msg) => { if (a !== b) throw new Error(`${msg}: ציפינו ל-${b}, קיבלנו ${a}`); };
const ok = (c, msg) => { if (!c) throw new Error(msg); };
async function pool(items, n, fn) { const q = [...items]; await Promise.all(Array.from({ length: n }, async () => { while (q.length) await fn(q.shift()); })); }
const jsFiles = ['js', 'js/games', 'js/bank'].flatMap(d => fs.readdirSync(path.join(ROOT, d)).filter(f => f.endsWith('.js')).map(f => d + '/' + f));

console.log(`\nבדיקות מבצע יריחו ${FAST ? '(מהיר)' : ''}\n`);

// ===== 1. קבצים =====
console.log('קבצים');
await test('כל קובץ JS נטען כמודול (שגיאת תחביר / הגדרה כפולה תיתפס כאן)', () => withPage(async page => {
  const bad = await page.evaluate(async files => {
    const out = [];
    for (const f of files) { try { await import('/' + f); } catch (e) { out.push(`${f}: ${e.message}`); } }
    return out;
  }, jsFiles);
  ok(!bad.length, 'מודולים שנכשלו בטעינה:\n- ' + bad.join('\n- '));
}));
await test('ה-Service Worker מכיל את כל הקבצים (אחרת האפליקציה לא תעבוד בלי אינטרנט)', () => {
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const listed = [...sw.matchAll(/'([^']+\.(?:js|css|html|json|png|woff2))'/g)].map(m => m[1]);
  const missingOnDisk = listed.filter(f => !fs.existsSync(path.join(ROOT, f)));
  ok(!missingOnDisk.length, 'קבצים ב-sw.js שלא קיימים: ' + missingOnDisk.join(', '));
  const notListed = jsFiles.filter(f => !listed.includes(f));
  ok(!notListed.length, 'קבצי JS שחסרים ב-FILES של sw.js: ' + notListed.join(', '));
});

// ===== 2. תוכן =====
console.log('תוכן');
await test('מספיק תוכן בכל פרק, ומבנה תקין', () => withPage(async page => {
  const problems = await page.evaluate(async () => {
    const { QUOTES, STATEMENTS, SEQUENCES, WHO } = await import('/js/content.js');
    const out = [];
    for (let c = 1; c <= 5; c++) {
      const hq = QUOTES.filter(q => q.c === c && !q.extra), wq = QUOTES.filter(q => q.c === c && q.who);
      const st = STATEMENTS.filter(s => s[0] === c), sq = SEQUENCES.filter(s => s.ch === c);
      if (hq.length < 12) out.push(`פרק ${c}: רק ${hq.length} ציטוטים לפנדלים (צריך 12+ כדי שסבבים לא יחזרו על עצמם)`);
      if (wq.length < 10) out.push(`פרק ${c}: רק ${wq.length} ציטוטים ל"מי אמר" (צריך 10+)`);
      if (st.length < 34) out.push(`פרק ${c}: רק ${st.length} משפטי אמת/שקר (צריך 34+: סבב הסערה של 60 שניות מציג ~30 כרטיסים בלי חזרה)`);
      const tr = st.filter(s => s[2]).length; if (tr / st.length < 0.35 || tr / st.length > 0.65) out.push(`פרק ${c}: חוסר איזון אמת/שקר (${tr} אמת מתוך ${st.length})`);
      if (sq.length < 4) out.push(`פרק ${c}: רק ${sq.length} סדרות לסידור (צריך 4+)`);
      const sid = SEQUENCES.filter(s => s.ch === c).flatMap(s => s.items); if (new Set(sid).size !== sid.length) out.push(`פרק ${c}: פריט זהה מופיע בשתי סדרות`);
      const locs = hq.map(q => q.v); if (new Set(locs).size !== locs.length) out.push(`פרק ${c}: שני ציטוטים עם אותו פסוק`);
      const { TRIVIA } = await import('/js/trivia.js'); const tv = TRIVIA.filter(x => x.c === c).length; if (tv < 15) out.push(`פרק ${c}: רק ${tv} שאלות טריוויה לפנדלים (צריך 15+)`);
    }
    for (const q of QUOTES) if (q.who && !WHO[q.who]) out.push(`ציטוט ${q.id}: דובר לא מוכר "${q.who}"`);
    for (const s of STATEMENTS) if (typeof s[1] !== 'string' || typeof s[2] !== 'boolean' || !s[3]) out.push('משפט לא תקין: ' + s[1]);
    return out;
  });
  ok(!problems.length, problems.join('\n'));
}));
await test('שאלות הדו-קרב: 4 תשובות שונות, והתשובה הנכונה לא "הארוכה" בכל פעם', () => withPage(async page => {
  const problems = await page.evaluate(async () => {
    const { DUELS } = await import('/js/duel-content.js');
    const out = [];
    for (const [k, D] of Object.entries(DUELS)) {
      let n = 0, longest = 0;
      for (const idea of D.ideas) {
        if (idea.qs.filter(q => !q.q.startsWith('באיזה פסוק')).length < 3) out.push(`${k} / ${idea.title}: פחות מ-3 שאלות רגילות`);
        for (const q of idea.qs) {
          n++;
          const opts = [q.a, ...q.w];
          if (q.w.length !== 3 || new Set(opts).size !== 4) out.push(`${k}: "${q.q}" – צריך 4 תשובות שונות`);
          if (!q.why) out.push(`${k}: "${q.q}" – חסר הסבר (why)`);
          if (q.a.length > Math.max(...q.w.map(x => x.length))) longest++;
          if (q.a.length > 1.4 * Math.max(...q.w.map(x => x.length))) out.push(`${k}: "${q.q}" – התשובה הנכונה ארוכה בהרבה מהשאר`);
        }
      }
      if (longest / n > 0.4) out.push(`${k}: התשובה הנכונה היא הארוכה ביותר ב-${Math.round(100 * longest / n)}% מהשאלות (מקסימום 40%)`);
    }
    return out;
  });
  ok(!problems.length, problems.join('\n'));
}));
await test('בחירת פרק: סבבים ומסיחים מגיעים רק מהפרק שנבחר', () => withPage(async page => {
  const problems = await page.evaluate(async () => {
    const { pickRound, pickDistractors } = await import('/js/games/common.js');
    const { QUOTES, STATEMENTS, SEQUENCES } = await import('/js/content.js');
    const hunter = QUOTES.filter(q => !q.extra), who = QUOTES.filter(q => q.who), out = [];
    for (let c = 1; c <= 5; c++) for (let t = 0; t < 50; t++) {
      for (const [name, pool] of [['פנדלים', hunter], ['מי אמר', who]]) {
        const items = pickRound(pool, c, 5);
        if (items.some(x => x.c !== c)) out.push(`${name}: פרק ${c} קיבל ציטוט מפרק אחר`);
      }
      const q = pickRound(hunter, c, 1)[0], d = pickDistractors(hunter, q, 3, c);
      if (d.length !== 3 || d.some(x => x.c !== c)) out.push(`התאמת ציטוט: מסיחים בפרק ${c} מפרק אחר`);
    }
    for (let c = 1; c <= 5; c++) {
      if (SEQUENCES.filter(s => s.ch === c).length === 0) out.push(`אין סדרות לפרק ${c}`);
      if (STATEMENTS.filter(s => s[0] === c).some(s => s[0] !== c)) out.push('משפט בפרק לא נכון');
    }
    return [...new Set(out)];
  });
  ok(!problems.length, problems.join('\n'));
}));

// ===== 3. מסכים =====
console.log('מסכים');
await test('כל המסכים נפתחים בלי שגיאות (מפה, אזורים, סיפור, למבחן, משחקים, פס קרב, ארון, הישגים, פרופיל)', () => withPage(async page => {
  const go = (name, params = {}) => page.evaluate(([n, p]) => import('/js/app.js').then(m => m.go(n, p)), [name, params]);
  // חלק מהמסכים נטענים אסינכרונית – ממתינים רגע שיתמלאו לפני שקובעים שהמסך ריק
  const filled = async what => {
    await page.waitForFunction(() => (document.querySelector('.view') || { innerText: '' }).innerText.trim().length > 5, null, { timeout: 4000 })
      .catch(() => { throw new Error(`מסך ריק: ${what}`); });
  };
  await go('map'); await filled('מפה');
  for (let ch = 1; ch <= 5; ch++) { await go('zone', { ch }); await filled('אזור ' + ch); }
  for (let ch = 0; ch <= 5; ch++) { await go('story', { ch }); await page.waitForTimeout(150); await filled('סיפור ' + ch); }
  await go('focus'); await filled('למבחן');
  const topics = await page.evaluate(() => import('/js/focus-content.js').then(m => m.TOPICS.map(t => t.id)));
  for (const id of topics) { await go('topic', { id }); await filled('נושא ' + id); }
  await go('games'); await filled('משחקים');
  for (const tab of ['פס קרב', 'אתגרים', 'הארון', 'הישגים']) { await go('pass'); await page.click(`.chips.tabs .chip:has-text("${tab}")`); await filled('לשונית ' + tab); }
  await go('profile'); await filled('פרופיל');
  await page.click('button:has-text("עיצוב החולצה שלי")'); await page.waitForSelector('.dz'); // סטודיו החולצה
}));

// ===== 4. משחקים: משחקים כל משחק עד הסוף =====
console.log('משחקים (שחקן אוטומטי מסיים כל סבב)');
const cases = [];
for (const ch of CHAPTERS) {
  const label = ch ? `פרק ${ch}` : 'כל הפרקים';
  cases.push([`פנדלים – טריוויה · ${label}`, 'hunter', { chapter: ch, mode: 'trivia', count: 2 }]);
  cases.push([`פנדלים – חיפוש · ${label}`, 'hunter', { chapter: ch, mode: 'find', count: 2 }]);
  cases.push([`פנדלים – התאמה · ${label}`, 'hunter', { chapter: ch, mode: 'match', count: 2 }]);
  cases.push([`הסערה המתקרבת · ${label}`, 'swipe', { chapter: ch, duration: 3 }]);
  cases.push([`מי אמר? · ${label}`, 'who', { chapter: ch, count: 2 }]);
  cases.push([`בונים את הקו · ${label}`, 'order', { chapter: ch, count: 1 }]);
}
cases.push(['המעגל האחרון (בוס) · פרק 2', 'boss', { chapter: 2 }]);
cases.push(['מבחן הסיכום', 'exam', { swipeSeconds: 3 }]);
for (const t of ['j1', 'j2', 'j34', 'j5']) cases.push([`דו-קרב משפחתי · ${t}`, 'duel', { topic: t }]);

const caseResults = new Map();
await pool(cases, 4, async ([name, key, opts]) => {
  const t0 = Date.now();
  try {
    await withPage(async page => {
      await page.evaluate(([k, o]) => import('/js/app.js').then(m => m.startGame(k, o)), [key, opts]);
      await playToEnd(page, key === 'exam' ? 120000 : 60000);
      const st = await page.evaluate(() => JSON.parse(localStorage.getItem('jericho.v1')));
      ok(st.rounds === 1, `אחרי סבב אחד rounds צריך להיות 1 (קיבלנו ${st.rounds})`);
    });
    caseResults.set(name, { ok: true, s: (Date.now() - t0) / 1000 });
  } catch (e) { caseResults.set(name, { ok: false, e }); }
});
for (const [name] of cases) {
  const r = caseResults.get(name);
  if (r.ok) { results.push({ name, ok: true }); console.log(`  ✓ ${name} (${r.s.toFixed(1)}s)`); }
  else { results.push({ name, ok: false, e: r.e }); console.log(`  ✗ ${name}\n      ${String(r.e.message).split('\n').join('\n      ')}`); }
}

// ===== 5. תגמולים ושמירה =====
console.log('תגמולים ושמירה');
await test('שמירה ישנה (בלי השדות החדשים) נטענת ומתמלאת בברירות מחדל', () => withPage(async page => {
  const st = await page.evaluate(async () => {
    const S = await import('/js/state.js'); S.load(); const s = S.get();
    return { eq: s.eq, trophy: s.trophy, custom: s.custom, ach: s.ach, names: s.names };
  });
  eq(st.eq.ball, 'ba0', 'כדור ברירת מחדל'); eq(st.eq.keeper, 'kp0', 'שוער ברירת מחדל');
  ok(st.trophy && st.custom && st.ach, 'שדות חדשים חסרים');
  eq(st.names.kid, 'דני', 'שם הילד נשמר');
}, { storage: { xp: 70, rounds: 2, eq: { avatar: 'a0', banner: 'b0', jersey: 'j0', emote: null }, zone: {}, best: { swipe: 5 }, streak: { last: null, count: 0 }, storySeen: {}, names: { kid: 'דני', parent: 'אבא' } } }));
await test('הפריטים שנלבשו מופיעים על המגרש, ותשובה נכונה מפעילה תגובה', () => withPage(async page => {
  await page.evaluate(() => import('/js/app.js').then(m => m.startGame('hunter', { chapter: 4, mode: 'match', count: 3 })));
  await page.waitForSelector('.pitch');
  const skin = await page.evaluate(() => { const p = document.querySelector('.pitch'); return { sky: p.style.getPropertyValue('--sky'), k1: p.style.getPropertyValue('--k1'), ball: !!document.querySelector('.ball svg'), kicker: !!document.querySelector('.kicker svg') }; });
  eq(skin.sky, '#7a3b12', 'צבע המגרש (מדבר יריחו)'); eq(skin.k1, '#ff4d6d', 'צבע השוער'); ok(skin.ball && skin.kicker, 'כדור/חולצה לא הוצגו');
  let bubble = false;
  for (let i = 0; i < 3; i++) {
    await page.waitForSelector('.opt:not([disabled])');
    const m = await page.locator('.meaning').innerText();
    const id = await page.evaluate(async mm => (await import('/js/content.js')).QUOTES.find(q => q.m === mm).id, m);
    await page.click(`.opt[data-id="${id}"]`); await page.waitForTimeout(1300);
    bubble = bubble || (await page.locator('.react-bubble').count()) > 0;
    await page.locator('.hunter .btn.primary').first().click().catch(() => {});
  }
  ok(bubble, 'בועת התגובה (דמות + אימוג׳י) לא הופיעה אחרי תשובה נכונה');
  await page.waitForSelector('.end-card');
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('jericho.v1')));
  ok(st.ach.r1 && st.ach.run5 === undefined, 'הישג "סבב ראשון" אמור להישמר');
  eq(st.stats.bestRun, 3, 'הרצף הארוך ביותר');
}, { storage: { xp: 1300, rounds: 0, zone: {}, eq: { avatar: 'a2', banner: 'b2', jersey: 'j3', emote: 'e5', ball: 'ba2', fx: 'fx2', pitch: 'pt2', keeper: 'kp1' }, best: { swipe: 0 }, streak: { last: null, count: 0 }, storySeen: {} } }));
await test('גביע המשפחה והישגים נרשמים אחרי דו-קרב; כל המשימות היומיות נשמרות פעם אחת', () => withPage(async page => {
  const r = await page.evaluate(async () => {
    const S = await import('/js/state.js'), Q = await import('/js/quests.js'), A = await import('/js/achievements.js');
    S.load(); S.recordDuel(7, 5, 'j2'); S.recordDuel(3, 6, 'j2'); S.recordDuel(4, 4, 'j2');
    const ach = A.evaluate().map(a => a.id);
    const q = Q.todays(); Q.record('hunter', { chapter: 2 }, { correct: 3, run: 4 }); Q.record('swipe', {}, { correct: 8, run: 4 }); Q.record('who', {}, { correct: 4, run: 4 });
    const c1 = Q.claim(), c2 = Q.claim();
    return { t: S.get().trophy, ach, distinct: new Set(q.map(x => x.id)).size, again: c2.xp, c1: c1.done.length };
  });
  eq(`${r.t.w}/${r.t.l}/${r.t.t}`, '1/1/1', 'נצחונות/הפסדים/תיקו'); ok(r.ach.includes('duelw'), 'הישג "ניצחת את ההורה" לא נפתח');
  eq(r.distinct, 3, 'משימות יומיות שונות'); eq(r.again, 0, 'XP של משימות לא אמור להיות משולם פעמיים');
}));

// ===== 6. העתקה ושיתוף של חומר הלימוד =====
console.log('העתקת חומר הלימוד');
const goTo = (page, name, params = {}) => page.evaluate(([n, p]) => import('/js/app.js').then(m => m.go(n, p)), [name, params]);
await test('הטקסט המועתק מכיל את כל החומר של כל נושא (ובלי סימוני **)', () => withPage(async page => {
  const problems = await page.evaluate(async () => {
    const { TOPICS } = await import('/js/focus-content.js'), { topicToText } = await import('/js/export.js');
    const KEYS = ['h', 'sh', 'p', 'q', 'say', 'big', 'note', 'answer'], out = [];
    for (const t of TOPICS) {
      const text = topicToText(t);
      if (text.includes('**')) out.push(`${t.id}: נשארו סימוני **`);
      if (/undefined|\[object/.test(text)) out.push(`${t.id}: "undefined" בטקסט`);
      for (const b of t.blocks) {
        const key = KEYS.find(k => b[k]);
        const strings = key ? [b[key]] : b.ul || b.ol || (b.table && b.table.flat());
        if (!strings) { out.push(`${t.id}: סוג בלוק שההעתקה לא מכירה: ${Object.keys(b).join(',')}`); continue; }
        for (const s of strings) { const plain = String(s).replace(/\*\*/g, '').replace(/^"|"$/g, ''); if (!text.includes(plain)) out.push(`${t.id}: חסר בהעתקה: "${plain.slice(0, 40)}"`); }
      }
    }
    return out;
  });
  ok(!problems.length, problems.slice(0, 8).join('\n'));
}));
const PERM = ['clipboard-read', 'clipboard-write'];
await test('כפתור "העתק" בנושא מעתיק ללוח בדיוק את הטקסט', () => withPage(async page => {
  const id = await page.evaluate(() => import('/js/focus-content.js').then(m => m.TOPICS[1].id));
  await goTo(page, 'topic', { id }); await page.waitForSelector('.doc-tools');
  await page.click('.doc-tools .tool >> nth=0');
  await page.waitForSelector('.toast');
  const [clip, expected] = await Promise.all([page.evaluate(() => navigator.clipboard.readText()),
    page.evaluate(id => import('/js/focus-content.js').then(async m => (await import('/js/export.js')).topicToText(m.TOPICS.find(t => t.id === id))), id)]);
  eq(clip, expected, 'תוכן הלוח'); ok(clip.length > 200, 'הטקסט המועתק קצר מדי');
}, { permissions: PERM }));
await test('"העתק את כל החומר" ברשימת הנושאים מעתיק את כל הנושאים', () => withPage(async page => {
  await goTo(page, 'focus'); await page.waitForSelector('.doc-tools');
  await page.click('.doc-tools .tool >> nth=0'); await page.waitForSelector('.toast');
  const r = await page.evaluate(async () => {
    const clip = await navigator.clipboard.readText(), { TOPICS } = await import('/js/focus-content.js');
    return { missing: TOPICS.filter(t => !clip.includes(t.title)).map(t => t.title), len: clip.length };
  });
  ok(!r.missing.length, 'נושאים שחסרים בהעתקה: ' + r.missing.join(', ')); ok(r.len > 10000, 'הטקסט המועתק קצר מדי: ' + r.len);
}, { permissions: PERM }));
await test('העתקה עובדת גם בלי ממשק הלוח המודרני (למשל אתר לא מאובטח בטלפון)', () => withPage(async page => {
  const id = await page.evaluate(() => import('/js/focus-content.js').then(m => m.TOPICS[0].id));
  await goTo(page, 'topic', { id }); await page.waitForSelector('.doc-tools');
  await page.click('.doc-tools .tool >> nth=0'); await page.waitForSelector('.toast');
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  ok(clip.length > 200, 'דרך הגיבוי (execCommand) לא העתיקה כלום');
}, { permissions: PERM, init: () => { Object.defineProperty(navigator.clipboard, 'writeText', { value: undefined }); } }));
await test('אם כל דרכי ההעתקה חסומות – נפתח חלון עם הטקסט מסומן להעתקה ידנית', () => withPage(async page => {
  const id = await page.evaluate(() => import('/js/focus-content.js').then(m => m.TOPICS[0].id));
  await goTo(page, 'topic', { id }); await page.waitForSelector('.doc-tools');
  await page.click('.doc-tools .tool >> nth=0'); await page.waitForSelector('.copy-fallback');
  const v = await page.locator('.copy-fallback').inputValue();
  ok(v.length > 200 && v.includes('=='), 'בחלון ההעתקה הידנית חסר הטקסט');
}, { init: () => { Object.defineProperty(navigator, 'clipboard', { value: undefined }); document.execCommand = () => false; } }));

// ===== 7. פס הקרב: איסוף, כרטיס זהב, קופסאות, כוחות =====
console.log('פס הקרב');
const ALLZ = Object.fromEntries([1, 2, 3, 4, 5].map(n => [n, { story: true, hunter: true, other: true }]));
const seed = (o = {}) => ({ xp: 0, rounds: 0, zone: {}, best: { swipe: 0 }, streak: { last: null, count: 0 }, storySeen: {}, eq: { avatar: 'a0', banner: 'b0', jersey: 'j0', emote: null },
  pass: { claimed: {}, gold: false, power: { fifty: 0, time: 0, retry: 0 }, boxes: 0, owned: {} }, ...o });
const passMod = page => page.evaluate(() => import('/js/pass.js').then(() => 0));

await test('טבלת הפרסים תקינה: בכל דרגה פרס חינם וזהב, וכל פריט קיים ומקושר נכון', () => withPage(async page => {
  const problems = await page.evaluate(async () => {
    const D = await import('/js/pass-data.js'), R = await import('/js/rewards.js'), out = [];
    const goldItems = R.ITEMS.filter(i => i.how && i.how.gold), used = [];
    for (let t = 1; t <= R.MAX_TIER; t++) for (const tr of ['free', 'gold']) {
      const rs = D.cellRewards(tr, t);
      if (!rs.length) out.push(`דרגה ${t} (${tr}): אין פרס`);
      for (const r of rs) {
        if (r.item) { const it = R.itemById(r.item); if (!it) out.push(`פריט חסר: ${r.item}`); else if (tr === 'gold') { used.push(r.item); if (it.how.gold !== t) out.push(`${r.item}: how.gold=${it.how && it.how.gold} אבל בדרגה ${t}`); } }
        else if (r.power) { if (!D.POWER[r.power] || !(r.n > 0)) out.push(`כוח לא תקין בדרגה ${t}`); }
        else if (!(r.box > 0)) out.push(`פרס לא מוכר בדרגה ${t}`);
      }
    }
    for (const g of goldItems) if (used.filter(x => x === g.id).length !== 1) out.push(`פריט זהב ${g.id} לא מופיע בטבלה בדיוק פעם אחת`);
    for (const i of D.BOX_POOL()) if (!D.RARITY[i.rarity]) out.push(`פריט קופסה ${i.id} בלי נדירות`);
    if (D.BOX_POOL().length < 10) out.push('מעט מדי פריטים במאגר הקופסאות');
    for (const m of D.MILESTONES) if (!D.GOLD[m].some(r => r.item)) out.push(`אבן דרך ${m} בזהב בלי פריט`);
    return out;
  });
  ok(!problems.length, problems.join('\n'));
}));
await test('שמירה ישנה: מה שכבר נפתח בפס נחשב כנאסף (לא הולך לאיבוד), ומה שלא – ממתין', () => withPage(async page => {
  const r = await page.evaluate(async () => {
    const S = await import('/js/state.js'); S.load(); const L = await import('/js/locker.js'), R = await import('/js/rewards.js'), P = await import('/js/pass.js');
    return { claimed: Object.keys(S.get().pass.claimed).sort().join(','), ba1: L.isOpen(R.itemById('ba1')), j2: L.isOpen(R.itemById('j2')), left: P.claimable().filter(([tr]) => tr === 'free').length };
  });
  eq(r.claimed, 'f1,f2,f3,f4,f5', 'דרגות שנאספו אוטומטית'); ok(r.ba1, 'כדור ניאון (דרגה 3) אמור להישאר פתוח'); ok(!r.j2, 'פריט מדרגה 8 לא אמור להיפתח'); eq(r.left, 0, 'פרסי חינם שממתינים');
}, { storage: { xp: 330, rounds: 3, eq: { avatar: 'a0', banner: 'b0', jersey: 'j0', emote: null }, zone: {}, best: { swipe: 0 }, streak: { last: null, count: 0 }, storySeen: {} } }));
await test('איסוף: פריט נפתח רק אחרי "קבל", כוחות מתווספים, ואי אפשר לאסוף פעמיים; נקודה אדומה כשיש מה לאסוף', () => withPage(async page => {
  ok(await page.locator('#nav button[data-go="pass"].dot').count() === 1, 'אין נקודה אדומה על פס הקרב');
  await page.evaluate(() => import('/js/app.js').then(m => m.go('pass'))); await page.waitForSelector('.passv');
  eq(await page.locator('.cell.free.can').count(), 5, 'תאי חינם מוכנים לאיסוף');
  const before = await page.evaluate(async () => { const L = await import('/js/locker.js'), R = await import('/js/rewards.js'); return L.isOpen(R.itemById('ba1')); });
  ok(!before, 'פריט נפתח לפני שנאסף');
  const r = await page.evaluate(async () => {
    const P = await import('/js/pass.js'), S = await import('/js/state.js'), L = await import('/js/locker.js'), R = await import('/js/rewards.js');
    const a = P.claim('free', 2), again = P.claim('free', 2), c3 = P.claim('free', 3), gold = P.claim('gold', 1);
    return { a: !!a, again, c3: !!c3, gold, fifty: S.power('fifty'), ba1: L.isOpen(R.itemById('ba1')), future: P.claim('free', 9) };
  });
  ok(r.a && r.again === null && r.c3, 'איסוף כפול / איסוף רגיל'); eq(r.fifty, 1, '50/50 מדרגה 2'); ok(r.ba1, 'כדור ניאון אחרי איסוף');
  eq(r.gold, null, 'פרס זהב לפני כרטיס זהב'); eq(r.future, null, 'דרגה שעוד לא הגיעו אליה');
  await page.evaluate(() => import('/js/app.js').then(m => m.go('pass'))); await page.waitForSelector('.cell.free.can');
  await page.locator('.cell.free.can .claim').first().click(); await page.waitForTimeout(300);
  await page.click('.modal .btn.primary').catch(() => {});   // חלון הפרס (אם נפתח)
}, { storage: seed({ xp: 330 }) }));
await test('כרטיס זהב: נפתח כשכובשים 60% מהאזורים (3 מתוך 5), לא לפני, ומופעל בלחיצה; ואז פרסי הזהב נאספים', () => withPage(async page => {
  await page.evaluate(() => import('/js/app.js').then(m => m.go('pass'))); await page.waitForSelector('.ticket');
  ok(await page.locator('.ticket.ready').count() === 1, 'כרטיס הזהב לא מוכן להפעלה אחרי כיבוש כל האזורים');
  await page.click('.ticket .btn.primary'); await page.waitForSelector('.modal .btn.primary'); await page.click('.modal .btn.primary');
  await page.waitForSelector('.ticket.on');
  await page.click('.claimall'); await page.waitForSelector('.gains');
  const r = await page.evaluate(async () => {
    const S = await import('/js/state.js'), L = await import('/js/locker.js'), R = await import('/js/rewards.js'), P = await import('/js/pass.js');
    return { gold: S.get().pass.gold, gj5: L.isOpen(R.itemById('gj5')), ge3: L.isOpen(R.itemById('ge3')), left: P.claimable().length, boxes: S.get().pass.boxes };
  });
  ok(r.gold && r.gj5 && r.ge3, 'פריטי זהב לא נפתחו אחרי "קבל הכול"'); eq(r.left, 0, 'פרסים שנשארו'); eq(r.boxes, 1, 'קופסאות מהזהב (דרגה 2 נותנת קופסה אחת; דרגה 10 עוד לא הושגה)');
}, { storage: seed({ xp: 330, zone: ALLZ }) }));
await test('כרטיס זהב: בדיוק בסף – 2 אזורים לא מספיקים, 3 מספיקים (ולא צריך את כולם)', async () => {
  const two = { 1: { story: true, hunter: true, other: true }, 2: { story: true, hunter: true, other: true } };
  await withPage(async page => {
    const r = await page.evaluate(async () => { const P = await import('/js/pass.js'), D = await import('/js/pass-data.js'); return { ready: P.goldReady(), act: P.activateGold(), need: D.GOLD_ZONES }; });
    eq(r.need, 3, 'סף כרטיס הזהב'); eq(r.ready, false, '2 אזורים: הכרטיס מוכן?'); eq(r.act, false, '2 אזורים: הצליח להפעיל?');
    await page.evaluate(() => import('/js/app.js').then(m => m.go('pass'))); await page.waitForSelector('.ticket');
    ok(await page.locator('.ticket.ready').count() === 0, 'כרטיס "מוכן" כבר עם 2 אזורים'); ok((await page.locator('.ticket').innerText()).includes('2/3'), 'ההתקדמות צריכה להראות 2/3');
  }, { storage: seed({ xp: 330, zone: two }) });
  await withPage(async page => {
    ok(await page.evaluate(() => import('/js/pass.js').then(P => P.goldReady())), '3 אזורים: הכרטיס אמור להיות מוכן');
    await page.evaluate(() => import('/js/app.js').then(m => m.go('pass'))); await page.waitForSelector('.ticket.ready');
    eq(await page.evaluate(() => import('/js/state.js').then(S => S.allCaptured())), false, 'לא כל האזורים נכבשו');
    ok(await page.locator('#nav button[data-go="pass"].dot').count() === 1, 'אין נקודה אדומה כשכרטיס הזהב מוכן');
    await page.click('.ticket .btn.primary'); await page.click('.modal .btn.primary'); await page.waitForSelector('.ticket.on');
    ok(await page.evaluate(() => import('/js/pass.js').then(P => P.canClaim('gold', 1))), 'אחרי ההפעלה פרס זהב אמור להיות זמין לאיסוף');
  }, { storage: seed({ xp: 330, zone: { ...two, 3: { story: true, hunter: true, other: true } } }) });
});
await test('קופסת מסתורין: נותנת פריט חדש (בלי כפילות), ואם הכול כבר אצלו – נותנת כוחות', () => withPage(async page => {
  await page.evaluate(() => import('/js/app.js').then(m => m.go('pass'))); await page.waitForSelector('.boxbtn');
  await page.click('.boxbtn'); await page.waitForSelector('.boxitem', { timeout: 5000 });
  const r = await page.evaluate(() => { const S = JSON.parse(localStorage.getItem('jericho.v1')); return { owned: Object.keys(S.pass.owned), boxes: S.pass.boxes }; });
  eq(r.owned.length, 1, 'פריטים שנפתחו'); eq(r.boxes, 0, 'קופסאות שנשארו');
  const dupes = await page.evaluate(async () => {   // פותחים את כל הקופסאות עד שהמאגר נגמר: אסור כפילות
    const S = await import('/js/state.js'), P = await import('/js/pass.js'), D = await import('/js/pass-data.js'); const seen = new Set(Object.keys(S.get().pass.owned));
    const n = D.BOX_POOL().length, remaining = n - seen.size; S.get().pass.boxes = remaining + 1; let dup = 0, power = 0;
    for (let i = 0; i < remaining + 1; i++) { const x = P.openBox(); if (x.item) { if (seen.has(x.item.id)) dup++; seen.add(x.item.id); } else power++; }
    return { dup, power, total: seen.size, n };
  });
  eq(dupes.dup, 0, 'כפילויות'); eq(dupes.power, 1, 'פעם אחת הקופסה נותנת כוחות כשהמאגר נגמר'); eq(dupes.total, dupes.n, 'כל המאגר נאסף');
}, { storage: seed({ xp: 60, pass: { claimed: { f1: true }, gold: false, power: { fifty: 0, time: 0, retry: 0 }, boxes: 1, owned: {} } }) }));
// עוברים על כל דפי הטבלה ועל כל אריח בכל דף (כל אריח נפתח בחלון תצוגה)
async function eachTile(page, fn) {
  const total = { n: 0 };
  for (let i = 0; i < 4; i++) {
    await page.locator('.ptab').nth(i).click();
    const n = await page.locator('.rtile').count();
    for (let k = 0; k < n; k++) { await page.locator('.rtile').nth(k).click(); await page.waitForSelector('.modal.preview'); await fn(page, total.n++); await page.click('.modal.preview .btn.ghost'); await page.waitForTimeout(80); }
  }
  return total.n;
}
await test('לחיצה על כל אריח בפס הקרב (בכל הדפים) לא מציגה "null" / "undefined" / "NaN" / "false"', () => withPage(async page => {
  await page.evaluate(() => import('/js/app.js').then(m => m.go('pass'))); await page.waitForSelector('.passv');
  const n = await eachTile(page, async (pg, i) => {
    const txt = await pg.locator('.modal.preview').innerText(); const bad = ['null', 'undefined', 'NaN', 'false'].find(w => txt.includes(w));
    ok(!bad, `אחרי לחיצה על אריח ${i} מופיע "${bad}" בחלון התצוגה`);
  });
  ok(n >= 60, 'מעט מדי אריחים בטבלה: ' + n);
}, { storage: seed({ xp: 650, zone: ALLZ, pass: { claimed: {}, gold: true, power: { fifty: 1, time: 1, retry: 1 }, boxes: 1, owned: {} } }) }));
await test('בהירות: לכל אריח תגית סוג ושם בעברית, לחיצה מסבירה מה זה, ויש עזרה', () => withPage(async page => {
  await page.evaluate(() => import('/js/app.js').then(m => m.go('pass'))); await page.waitForSelector('.passv');
  const problems = [];
  for (let i = 0; i < 4; i++) {
    await page.locator('.ptab').nth(i).click();
    const locks = await page.locator('.lk').allInnerTexts(); if (!locks.every(l => /[א-ת]/.test(l))) problems.push('מנעול בלי הסבר בדף ' + (i + 1));
  }
  const n = await eachTile(page, async (pg, i) => {
    const text = (await pg.locator('.modal.preview').innerText()).replace(/\s+/g, ' ');
    if (text.length < 40) problems.push(`אריח ${i}: אין הסבר ("${text}")`);
    if (!/(כוח|קופסה|דמות|חולצה|באנר|אימוג׳י|כדור|חגיגת גול|מגרש|שוער|זנב|תואר)/.test(text)) problems.push(`אריח ${i}: לא מצוין סוג הפריט ("${text.slice(0, 50)}")`);
  });
  ok(n >= 60, 'מעט מדי אריחים: ' + n); ok(!problems.length, problems.slice(0, 8).join('\n'));
  await page.locator('.ptab').nth(0).click(); const names = await page.locator('.rtile small').allInnerTexts(); ok(names.every(x => /[א-ת]/.test(x)), 'שם אריח לא בעברית: ' + names.filter(x => !/[א-ת]/.test(x)).join('|'));
  await page.click('.helplink'); await page.waitForSelector('.helplist');
  const help = await page.locator('.helplist').innerText();
  for (const w of ['כרטיס זהב', 'קופסת מסתורין', 'מחק 2 תשובות', 'עוד 10 שניות', 'ניסיון נוסף', 'דפים']) ok(help.includes(w), `בעזרה חסר: ${w}`);
  await page.click('.modal .btn.primary');
  const chips = await page.locator('.pwchip').allInnerTexts(); ok(chips.length === 3 && chips.every(c => /[א-ת]/.test(c)), 'כפתורי הכוחות צריכים טקסט בעברית: ' + chips.join('|'));
}, { storage: seed({ xp: 330, pass: { claimed: {}, gold: false, power: { fifty: 3, time: 2, retry: 1 }, boxes: 1, owned: {} } }) }));
await test('פס הקרב בדפים: 4 דפים של 5 דרגות, נפתח על הדף עם מה לאסוף, נקודה אדומה בדפים עם פרסים', () => withPage(async page => {
  await page.evaluate(() => import('/js/app.js').then(m => m.go('pass'))); await page.waitForSelector('.passv');
  eq(await page.locator('.ptab').count(), 4, 'לשוניות דפים');
  eq(await page.locator('.prow2').count(), 5, 'דרגות בדף');
  // שמורה: כבר אספו דרגות 1-10, הדרגה הנוכחית 11 => נפתח על הדף 11-15 (ולא על 1-5)
  const first = await page.locator('.prow2 .dia').first().innerText(); eq(first, '11', 'הדף שנפתח התחיל בדרגה');
  ok(await page.locator('.ptab.on').innerText().then(x => x.includes('11')), 'הלשונית הפעילה');
  ok(await page.locator('.ptab').nth(2).locator('.pdot').count() === 1, 'אין נקודה אדומה על הדף עם פרסים');
  ok(await page.locator('.ptab').nth(0).locator('.pdot').count() === 0, 'נקודה אדומה על דף בלי פרסים');
  await page.locator('.ptab').nth(0).click(); eq(await page.locator('.prow2 .dia').first().innerText(), '1', 'אחרי מעבר לדף 1-5');
  await page.locator('.ptab').nth(3).click(); eq(await page.locator('.prow2').count(), 5, 'דרגות בדף האחרון'); ok(await page.locator('.exam-row').count() === 1, 'פרס מבחן הסיכום בדף האחרון');
  const h1 = await page.evaluate(() => document.getElementById('screen').scrollHeight); ok(h1 < 2300, 'המסך עדיין ארוך מדי (' + h1 + 'px)');
}, { storage: seed({ xp: 700, pass: { claimed: Object.fromEntries([...Array(10)].map((_, i) => ['f' + (i + 1), true])), gold: false, power: { fifty: 0, time: 0, retry: 0 }, boxes: 0, owned: {} } }) }));
await test('הארון: לשונית לכל סוג פריט, מציגה רק פריטים מהסוג, ומאפשרת ללבוש', () => withPage(async page => {
  await page.evaluate(() => import('/js/app.js').then(m => m.go('pass'))); await page.click('.chips.tabs .chip:has-text("הארון")'); await page.waitForSelector('.typegrid');
  const types = await page.evaluate(() => import('/js/rewards.js').then(m => Object.keys(m.TYPE_LABEL)));
  eq(await page.locator('.typebtn').count(), types.length, 'לשוניות סוגי פריטים');
  for (let i = 0; i < types.length; i++) {
    await page.locator('.typebtn').nth(i).click(); await page.waitForSelector('.lgrid');
    const want = await page.evaluate(t => import('/js/rewards.js').then(m => m.ITEMS.filter(x => x.type === t).length), types[i]);
    eq(await page.locator('.lgrid .item').count(), want, `פריטים בלשונית ${types[i]}`);
    ok(await page.locator('.lgrid .item').evaluateAll((els, t) => els.every(e => e.classList.contains('t-' + t)), types[i]), `פריט מסוג אחר בלשונית ${types[i]}`);
  }
  await page.locator('.typebtn').nth(0).click(); await page.locator('.lgrid .item:not(.locked)').first().click();
}));
await test('כל משחק מציג בראשו באיזה פרק ובאיזה סוג משחקים (וגם בכרטיס הסיום)', async () => {
  const cases = [['hunter', { chapter: 2, mode: 'trivia', count: 1 }, ['פרק ב׳', 'חומת יריחו', 'טריוויה']], ['hunter', { chapter: 4, mode: 'find', count: 1 }, ['פרק ד׳', 'מצא בתנ״ך']], ['hunter', { chapter: 5, mode: 'match', count: 1 }, ['פרק ה׳', 'התאמת ציטוט']],
    ['hunter', { chapter: 0, mode: 'trivia', count: 1 }, ['כל הפרקים', 'טריוויה']], ['swipe', { chapter: 3, duration: 3 }, ['פרק ג׳']], ['who', { chapter: 1, count: 1 }, ['פרק א׳']], ['order', { chapter: 2, count: 1 }, ['פרק ב׳']],
    ['boss', { chapter: 2 }, ['פרק ב׳']], ['exam', { swipeSeconds: 2 }, ['כל הפרקים']], ['duel', { topic: 'j34' }, ['פרקים ג׳–ד׳']], ['duel', { topic: 'j5' }, ['פרק ה׳']]];
  for (const [key, opts, want] of cases) await withPage(async page => {
    await page.evaluate(([k, o]) => import('/js/app.js').then(m => m.startGame(k, o)), [key, opts]); await page.waitForSelector('.game');
    const head = await page.locator('.gctx').first().innerText(); for (const w of want) ok(head.includes(w), `[${key}] בראש המשחק חסר "${w}" (מוצג: "${head.replace(/\s+/g, ' ')}")`);
    if ((key === 'hunter' && opts.mode === 'trivia' && opts.chapter === 2) || (key === 'who' && opts.chapter === 1)) { await playToEnd(page, 60000); const end = await page.locator('.end-ctx').innerText(); for (const w of want) ok(end.includes(w), `[${key}] בכרטיס הסיום חסר "${w}"`); }
  });
});
await test('כרטיסי המשחקים לא זזים: אותו מיקום מהרגע הראשון, בכל פרק, בכל כניסה, ובאותו סדר', () => withPage(async page => {
  const rects = () => page.evaluate(() => [...document.querySelectorAll('.tiles .tile')].map(t => { const r = t.getBoundingClientRect(); return `${t.querySelector('.tn').innerText}@${Math.round(r.left)},${Math.round(r.top)}`; }).join(' | '));
  const visit = async (name, params) => { await page.evaluate(([n, p]) => import('/js/app.js').then(m => m.go(n, p)), [name, params]); return rects(); };   // מיד אחרי הציור
  const tops = new Set(), settled = {};
  for (const [name, params] of [['zone', { ch: 1 }], ['zone', { ch: 2 }], ['zone', { ch: 3 }], ['zone', { ch: 4 }], ['zone', { ch: 5 }], ['games', {}]]) {
    const first = await visit(name, params); await page.waitForTimeout(150); const mid = await rects(); await page.waitForTimeout(500); const late = await rects();
    eq(first, mid, `${name} ${JSON.stringify(params)}: הכרטיסים זזו בין הרגע הראשון ל-150ms`); eq(mid, late, `${name} ${JSON.stringify(params)}: הכרטיסים זזו אחרי 150ms`);
    const again = await visit(name, params); eq(again, first, `${name} ${JSON.stringify(params)}: מיקום שונה בכניסה חוזרת`);
    if (name === 'zone') tops.add(first.split(' | ')[0].split('@')[1].split(',')[1]);
  }
  eq(tops.size, 1, 'הכרטיס הראשון בגובה שונה בין הפרקים: ' + [...tops].join(','));
}));
await test('כוח 50/50: מסתיר שתי תשובות שגויות ולא את הנכונה, ונצרך', () => withPage(async page => {
  await page.evaluate(() => import('/js/app.js').then(m => m.startGame('who', { chapter: 2, count: 1 })));
  await page.waitForSelector('.pwbtn'); await page.click('.pwbtn');
  const r = await page.evaluate(async () => {
    const t = document.querySelector('.quote-card q').innerText, { QUOTES } = await import('/js/content.js'), who = QUOTES.find(q => q.t === t).who;
    return { gone: document.querySelectorAll('.opt.gone').length, rightHidden: document.querySelector(`.opt[data-k="${who}"]`).classList.contains('gone'), left: JSON.parse(localStorage.getItem('jericho.v1')).pass.power.fifty };
  });
  eq(r.gone, 2, 'תשובות שהוסתרו'); ok(!r.rightHidden, 'התשובה הנכונה הוסתרה!'); eq(r.left, 1, 'כוחות 50/50 שנשארו (היו 2)');
}, { storage: seed({ pass: { claimed: {}, gold: false, power: { fifty: 2, time: 0, retry: 0 }, boxes: 0, owned: {} } }) }));
await test('כוח +10 שניות: מוסיף זמן להסערה ונצרך', () => withPage(async page => {
  await page.evaluate(() => import('/js/app.js').then(m => m.startGame('swipe', { chapter: 2, duration: 20 })));
  await page.waitForSelector('.pwbtn'); await page.click('.pwbtn'); await page.waitForTimeout(400);
  const secs = Number(await page.locator('.storm b').innerText());
  ok(secs >= 27 && secs <= 30, `אחרי +10 שניות היו אמורים להיות ~29 שניות, יש ${secs}`);
  eq(await page.evaluate(() => JSON.parse(localStorage.getItem('jericho.v1')).pass.power.time), 0, 'כוחות שנשארו');
}, { storage: seed({ pass: { claimed: {}, gold: false, power: { fifty: 0, time: 1, retry: 0 }, boxes: 0, owned: {} } }) }));
await test('כוח בעיטה חוזרת: אחרי טעות אפשר לנסות שוב את אותה שאלה, ונצרך', () => withPage(async page => {
  await page.evaluate(() => import('/js/app.js').then(m => m.startGame('hunter', { chapter: 2, mode: 'match', count: 2 })));
  await page.waitForSelector('.opt:not([disabled])');
  const q1 = await page.locator('.meaning').innerText();
  const wrongId = await page.evaluate(async m => { const { QUOTES } = await import('/js/content.js'), right = QUOTES.find(q => q.m === m).id; return [...document.querySelectorAll('.opt')].map(b => b.dataset.id).find(id => id !== right); }, q1);
  await page.click(`.opt[data-id="${wrongId}"]`); await page.waitForSelector('.modal .btn.primary');
  await page.click('.modal .btn.primary'); await page.waitForTimeout(500);
  eq((await page.locator('.h-head b').innerText()).includes('בעיטה 1 מתוך 2'), true, 'חזרנו לשאלה הראשונה');
  eq(await page.evaluate(() => JSON.parse(localStorage.getItem('jericho.v1')).pass.power.retry), 0, 'כוחות שנשארו');
}, { storage: seed({ pass: { claimed: {}, gold: false, power: { fifty: 0, time: 0, retry: 1 }, boxes: 0, owned: {} } }) }));

// ===== 8. בלי שאלות שחוזרות באותו סבב =====
console.log('שאלות שונות בכל סבב');
await test('הסערה המתקרבת: כל משפט מוצג פעם אחת לפני שמשפט כלשהו חוזר, ואף פעם לא אותו כרטיס פעמיים ברצף', () => withPage(async page => {
  const pool = await page.evaluate(() => import('/js/content.js').then(m => m.STATEMENTS.filter(s => s[0] === 4).length));
  await page.evaluate(() => import('/js/app.js').then(m => m.startGame('swipe', { chapter: 4, duration: 240 })));
  const seq = [], want = pool + 6;
  for (let i = 0; i < want; i++) {
    await page.waitForSelector('.sw-card p');
    seq.push(await page.locator('.sw-card p').first().innerText());
    await page.click('.sw-true'); await page.waitForTimeout(230);
  }
  const first = seq.slice(0, pool);
  eq(new Set(first).size, pool, `מתוך ${pool} הכרטיסים הראשונים צריכים להיות ${pool} שונים (חזרו: ${first.filter((x, i) => first.indexOf(x) !== i).slice(0, 2).join(' | ')})`);
  const back = seq.findIndex((x, i) => i && x === seq[i - 1]); ok(back === -1, 'אותו כרטיס הופיע פעמיים ברצף במקום ' + back);
}));
await test('מבחן הסיכום: אותה שאלה לא חוזרת בשלבים שונים של אותו מבחן', () => withPage(async page => {
  await page.evaluate(() => { window.__seen = []; new MutationObserver(() => { const q = document.querySelector('.quote-card q, .quote-card .meaning'); if (q) { const t = q.innerText; if (window.__seen[window.__seen.length - 1] !== t) window.__seen.push(t); } }).observe(document.body, { subtree: true, childList: true, characterData: true }); });
  await page.evaluate(() => import('/js/app.js').then(m => m.startGame('exam', { swipeSeconds: 2 })));
  await playToEnd(page, 120000);
  const seen = await page.evaluate(() => window.__seen);
  ok(seen.length >= 6, 'צריך לראות לפחות 6 שאלות בפנדלים ובמי-אמר, ראינו ' + seen.length);
  eq(new Set(seen).size, seen.length, 'שאלות שחזרו במבחן: ' + seen.filter((x, i) => seen.indexOf(x) !== i).join(' | '));
}));
await test('בחירת שאלות: מעדיפים שאלות שלא נראו לאחרונה, ומכבדים רשימת החרגה', () => withPage(async page => {
  const r = await page.evaluate(async () => {
    const { pickRound } = await import('/js/games/common.js'), pool = Array.from({ length: 10 }, (_, i) => ({ id: 'q' + i, c: 1 })), out = {};
    const seen = new Set(['q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6']);
    out.fresh = [...Array(30)].every(() => pickRound(pool, 1, 3, { seen }).every(x => !seen.has(x.id)));
    out.fill = pickRound(pool, 1, 5, { seen }).filter(x => seen.has(x.id)).length;    // יש רק 3 חדשים: 2 נראים משלימים
    out.excl = [...Array(30)].every(() => pickRound(pool, 1, 5, { exclude: ['q0', 'q1'] }).every(x => x.id !== 'q0' && x.id !== 'q1'));
    const S = await import('/js/state.js'); S.load(); for (let i = 0; i < 5; i++) S.markSeen('t', ['a' + i, 'b' + i], 6); out.cap = S.seenList('t').length; out.dup = new Set(S.seenList('t')).size === S.seenList('t').length;
    return out;
  });
  ok(r.fresh, 'נבחרו שאלות שכבר נראו למרות שיש חדשות'); eq(r.fill, 2, 'השלמה משאלות שנראו'); ok(r.excl, 'שאלה מרשימת ההחרגה נבחרה'); eq(r.cap, 6, 'זיכרון השאלות לא נחתך'); ok(r.dup, 'כפילות בזיכרון');
}));

await test('באג שדווח: אחרי טעות עם "ניסיון נוסף" החלון מופיע במסך ואפשר ללחוץ עליו – גם בטלפון קטן, בכל סוגי הפנדלים', async () => {
  for (const [w, h, mode] of [[375, 667, 'find'], [375, 667, 'match'], [375, 667, 'trivia'], [390, 844, 'find']]) {
    await withPage(async page => {
      await page.evaluate(m => import('/js/app.js').then(a => a.startGame('hunter', { chapter: 2, mode: m, count: 2 })), mode);
      if (mode === 'find') { await page.waitForSelector('.kick-btn'); await page.click('.pick-row.ch .pk >> nth=4'); await page.click('.pick-grid .pk >> nth=22'); await page.click('.kick-btn'); }
      else if (mode === 'match') { await page.waitForSelector('.opt:not([disabled])'); const m = await page.locator('.meaning').innerText(); const id = await page.evaluate(async mm => { const r = (await import('/js/content.js')).QUOTES.find(q => q.m === mm).id; return [...document.querySelectorAll('.opt')].map(x => x.dataset.id).find(x => x !== r); }, m); await page.click(`.opt[data-id="${id}"]`); }
      else { await page.waitForSelector('.opt:not([disabled])'); const q = await page.locator('.meaning').innerText(); const wrong = await page.evaluate(async qq => { const T = (await import('/js/trivia.js')).TRIVIA.find(x => x.q === qq); return T.w[0]; }, q); await page.click(`.opt[data-t="${wrong.replace(/"/g, '\\"')}"]`); }
      await page.waitForSelector('.modal .btn.primary', { timeout: 5000 });
      const pos = await page.evaluate(() => { const r = document.querySelector('.modal .btn.primary').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, h: innerHeight }; });
      ok(pos.top >= 0 && pos.bottom <= pos.h, `[${mode} ${w}x${h}] כפתור "ניסיון נוסף" מחוץ למסך (${Math.round(pos.top)}-${Math.round(pos.bottom)} מתוך ${pos.h})`);
      await page.click('.modal .btn.primary', { timeout: 3000 });   // לחיצה אמיתית: נכשלת אם משהו מכסה את הכפתור
      await page.waitForTimeout(400);
      eq(await page.locator('.modal').count(), 0, `[${mode}] החלון לא נסגר אחרי הלחיצה`);
    }, { viewport: { width: w, height: h }, storage: seed({ xp: 300, pass: { claimed: { f1: true, f2: true, f3: true, f4: true, f5: true }, gold: false, power: { fifty: 0, time: 0, retry: 2 }, boxes: 0, owned: {} } }) });
  }
});
await test('פנדלים טריוויה: שאלות מהפרק שנבחר בלבד, בלי שאלות "באיזה פסוק", בלי חזרות בסבב', () => withPage(async page => {
  const r = await page.evaluate(async () => {
    const { TRIVIA } = await import('/js/trivia.js'), { pickRound } = await import('/js/games/common.js'), out = [];
    if (TRIVIA.some(q => q.q.startsWith('באיזה פסוק'))) out.push('שאלת "באיזה פסוק" בטריוויה');
    for (const q of TRIVIA) { if (new Set([q.a, ...q.w]).size !== 4) out.push('אפשרויות כפולות: ' + q.q); if (!q.c) out.push('שאלה בלי פרק: ' + q.q); }
    for (let c = 1; c <= 5; c++) for (let i = 0; i < 40; i++) { const it = pickRound(TRIVIA, c, 5); if (it.some(x => x.c !== c)) out.push('שאלה מפרק אחר בפרק ' + c); if (new Set(it.map(x => x.id)).size !== it.length) out.push('שאלה חזרה בסבב'); }
    return [...new Set(out)];
  });
  ok(!r.length, r.slice(0, 6).join('\n'));
}));

// ===== 9. עונות =====
console.log('עונות');
await test('עונות 2-8 נוצרות תקינות: פריטים קיימים, בלי כפילויות, פרס בכל דרגה, פתיחה לפי איסוף, עברית, ציור, אפקטים קיימים', () => withPage(async page => {
  const problems = await page.evaluate(async () => {
    const S = await import('/js/seasons.js'), R = await import('/js/rewards.js'), D = await import('/js/pass-data.js'), E = await import('/js/effects.js'), A = await import('/js/audio.js');
    const out = []; S.ensureSeason(8);
    const ids = R.ITEMS.map(i => i.id); const dup = ids.filter((x, i) => ids.indexOf(x) !== i); if (dup.length) out.push('מזהים כפולים: ' + dup.slice(0, 3));
    for (let n = 2; n <= 8; n++) {
      const s = S.buildSeason(n), s2 = S.buildSeason(n);
      if (JSON.stringify(s.free) !== JSON.stringify(s2.free)) out.push(`עונה ${n}: יצירה לא דטרמיניסטית`);
      if (s.items.length < 31) out.push(`עונה ${n}: רק ${s.items.length} פריטים`);
      for (const tr of ['free', 'gold']) for (let t = 1; t <= 20; t++) {
        const cell = D.cellRewards(tr, t, n); if (!cell.length) out.push(`עונה ${n} ${tr} דרגה ${t}: אין פרס`);
        for (const r of cell) if (r.item) { const it = R.itemById(r.item); if (!it) out.push('פריט חסר ' + r.item); else if (it.how.track !== tr || it.how.tier !== t || it.how.season !== n) out.push(`${r.item}: how לא תואם לתא`); }
        if ([5, 10, 15, 20].includes(t) && !cell.some(r => r.item)) out.push(`עונה ${n} ${tr} אבן דרך ${t} בלי פריט`);
      }
      for (const id of s.finale.items) { const it = R.itemById(id); if (!it || it.rarity !== 'legendary') out.push(`עונה ${n}: פריט הפתעה ${id} לא אגדי`); }
      for (const it of s.items) {
        if (!/[א-ת]/.test(it.name)) out.push(`${it.id}: שם לא בעברית "${it.name}"`);
        if (!R.TYPE_LABEL[it.type]) out.push(`${it.id}: סוג לא מוכר`); if (!D.RARITY[it.rarity]) out.push(`${it.id}: נדירות לא מוכרת`);
        if (!R.art(it, 40) || R.art(it, 40).length < 10) out.push(`${it.id}: ציור ריק`);
        if (it.type === 'fx' && !E.SHOWS[it.p.show]) out.push(`${it.id}: הצגה לא קיימת ${it.p.show}`);
        if (it.type === 'emote' && (!it.p.ch || (it.p.snd && !A.sfx[it.p.snd]))) out.push(`${it.id}: אימוג׳י/צליל לא תקין`);
      }
    }
    if (D.BOX_POOL().length < 23 + 6 * 7) out.push('מאגר הקופסאות לא גדל עם העונות');
    return out;
  });
  ok(!problems.length, problems.slice(0, 8).join('\n'));
}));
await test('סוף עונה: כרטיס "סיימת", הפתעה, מעבר לעונה 2 (עודף XP עובר), ומה שנאסף בעונה 1 נשאר פתוח', () => withPage(async page => {
  await page.evaluate(() => import('/js/app.js').then(m => m.go('pass'))); await page.waitForSelector('.passv');
  ok(await page.locator('.finale').count() === 1, 'כרטיס סיום העונה לא מופיע בדרגה 20');
  ok(await page.locator('#nav button[data-go="pass"].dot').count() === 1, 'אין נקודה אדומה כשהעונה הסתיימה');
  await page.click('.finale .btn.primary'); await page.waitForSelector('.mbox');
  await page.waitForSelector('.gains', { timeout: 6000 });
  const text = await page.locator('.modal').innerText(); ok(text.includes('עונה 2') && text.includes('מסע במדבר'), 'חלון ההפתעה לא מציין את העונה החדשה: ' + text.slice(0, 80));
  await page.click('.modal .btn.primary'); await page.waitForSelector('.season');
  const r = await page.evaluate(async () => {
    const S = await import('/js/state.js'), L = await import('/js/locker.js'), R = await import('/js/rewards.js'), P = await import('/js/pass.js');
    const s = S.get(); return { season: s.season, base: s.pass.base, tier: S.tierOf(), gold: s.pass.gold, boxes: s.pass.boxes, fin: ['fin1a', 'fin1t', 'fin1e'].map(i => L.isOpen(R.itemById(i))), old: ['j5', 'ga20', 'ba2'].map(i => L.isOpen(R.itemById(i))), power: s.pass.power, done: P.seasonDone(), xp: s.xp };
  });
  eq(r.season, 2, 'עונה'); eq(r.base, 1200, 'XP בתחילת העונה'); eq(r.tier, 1, 'דרגה בעונה החדשה (100 XP עודף = דרגה 1)'); eq(r.gold, false, 'כרטיס זהב מתאפס');
  ok(r.fin.every(Boolean), 'פריטי ההפתעה לא נפתחו'); ok(r.old.every(Boolean), 'פריטים מעונה 1 ננעלו בטעות: ' + r.old); ok(r.boxes >= 2 && r.power.fifty >= 3, 'קופסאות/כוחות מההפתעה'); ok(!r.done, 'העונה החדשה כבר "הסתיימה"');
  ok((await page.locator('.season').innerText()).includes('מסע במדבר'), 'כותרת העונה החדשה');
  eq(await page.locator('.cell.free.can').count(), 1, 'דרגה 1 בעונה 2 אמורה להיות מוכנה לאיסוף');
  await page.locator('.cell.free.can .claim').click(); await page.waitForTimeout(300);
  ok(await page.evaluate(() => import('/js/locker.js').then(async L => L.isOpen((await import('/js/rewards.js')).itemById('s2_emote0')))), 'אימוג׳י מעונה 2 לא נפתח אחרי איסוף');
}, { storage: seed({ xp: 1300, zone: ALLZ, pass: { claimed: Object.fromEntries([...Array(20)].flatMap((_, i) => [['f' + (i + 1), true], ['g' + (i + 1), true]])), gold: true, power: { fifty: 0, time: 0, retry: 0 }, boxes: 0, owned: {} } }) }));
await test('שמירה מעונה 3: פריטים מעונה 2 (שנוצרים מתבנית) נטענים ונלבשים, וכרטיס הזהב דורש סבבים', () => withPage(async page => {
  const r = await page.evaluate(async () => {
    const L = await import('/js/locker.js'), P = await import('/js/pass.js'), S = await import('/js/state.js');
    return { av: L.equipped('avatar').id, em: L.equipped('emote').id, season: P.season(), prog: P.goldProgress(), ready: P.goldReady(), tier: S.tierOf() };
  });
  eq(r.av, 's2_avatar0', 'דמות מעונה 2 לא נטענה'); eq(r.em, 's2_emote0', 'אימוג׳י מעונה 2'); eq(r.season, 3, 'עונה'); eq(r.prog.zones, false, 'סוג התקדמות'); eq(r.prog.need, 10, 'סבבים לכרטיס'); eq(r.ready, false, 'כרטיס זהב מוכן בלי סבבים'); eq(r.tier, 2, 'דרגה (XP 1380, base 1260)');
  await page.evaluate(() => import('/js/app.js').then(m => m.go('pass'))); await page.waitForSelector('.ticket');
  ok((await page.locator('.ticket').innerText()).includes('0/10'), 'הכרטיס אמור להראות 0/10 סבבים');
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('jericho.v1')); s.pass.seasonRounds = 10; localStorage.setItem('jericho.v1', JSON.stringify(s)); });
  await page.reload(); await page.waitForSelector('.map'); await page.evaluate(() => import('/js/app.js').then(m => m.go('pass'))); await page.waitForSelector('.ticket.ready');
}, { storage: seed({ season: 3, xp: 1380, zone: ALLZ, eq: { avatar: 's2_avatar0', banner: 'b0', jersey: 'j0', emote: 's2_emote0' }, pass: { claimed: { s2f5: true, s2f1: true }, gold: false, power: { fifty: 0, time: 0, retry: 0 }, boxes: 0, owned: {}, base: 1260, seasonRounds: 0 } }) }));
await test('מעבר דרך כמה עונות ברצף: בלי שגיאות, בלי כפילויות, והפריטים נשמרים', () => withPage(async page => {
  const r = await page.evaluate(async () => {
    const S = await import('/js/state.js'), P = await import('/js/pass.js'), R = await import('/js/rewards.js'), L = await import('/js/locker.js'), D = await import('/js/pass-data.js'); const s = S.get(), out = { seasons: [], errs: [] };
    for (let i = 0; i < 6; i++) {
      s.xp = s.pass.base + 20 * 60 + 30; if (!P.seasonDone()) out.errs.push('העונה לא הסתיימה אחרי 20 דרגות');
      const res = P.completeSeason(); if (!res) { out.errs.push('completeSeason החזיר null'); break; }
      out.seasons.push(res.next); if (S.get().season !== res.next || S.tierOf() !== 0) out.errs.push(`אחרי מעבר לעונה ${res.next}: דרגה ${S.tierOf()}`);
      for (const id of res.finale.items) if (!L.isOpen(R.itemById(id))) out.errs.push('פריט הפתעה נעול: ' + id);
    }
    const ids = R.ITEMS.map(i => i.id); if (new Set(ids).size !== ids.length) out.errs.push('מזהים כפולים אחרי מעברים');
    out.finalSeason = s.season; out.nullCompletion = P.completeSeason(); return out;
  });
  eq(r.errs.length, 0, r.errs.join('\n')); eq(r.seasons.join(','), '2,3,4,5,6,7', 'רצף העונות'); eq(r.nullCompletion, null, 'completeSeason בעונה שלא הסתיימה צריך להחזיר null');
}, { storage: seed({ xp: 0 }) }));

// ===== סיכום =====

await browser.close(); server.close();
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} בדיקות עברו${failed.length ? ' – ' + failed.length + ' נכשלו' : ' ✓'}\n`);
process.exit(failed.length ? 1 : 0);
