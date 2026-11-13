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
async function withPage(fn, { storage, permissions, init } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', permissions });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('חריגה: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url().replace(BASE, '')}`); });
  try {
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
const jsFiles = [...fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f), ...fs.readdirSync(path.join(ROOT, 'js/games')).filter(f => f.endsWith('.js')).map(f => 'js/games/' + f)];

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
      if (hq.length < 5) out.push(`פרק ${c}: רק ${hq.length} ציטוטים לפנדלים (צריך 5+)`);
      if (wq.length < 4) out.push(`פרק ${c}: רק ${wq.length} ציטוטים ל"מי אמר" (צריך 4+)`);
      if (st.length < 10) out.push(`פרק ${c}: רק ${st.length} משפטי אמת/שקר (צריך 10+)`);
      if (!st.some(s => s[2]) || !st.some(s => !s[2])) out.push(`פרק ${c}: חייבים גם אמת וגם שקר`);
      if (sq.length < 2) out.push(`פרק ${c}: רק ${sq.length} סדרות לסידור (צריך 2+)`);
      const locs = hq.map(q => q.v); if (new Set(locs).size !== locs.length) out.push(`פרק ${c}: שני ציטוטים עם אותו פסוק`);
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
await test('כרטיס זהב: נעול עד שכובשים את כל האזורים, מופעל בלחיצה, ואז פרסי הזהב נאספים', () => withPage(async page => {
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
await test('לחיצה על כל אריח בפס הקרב לא מציגה "null" / "undefined" / "NaN" / "false" על המסך', () => withPage(async page => {
  await page.evaluate(() => import('/js/app.js').then(m => m.go('pass'))); await page.waitForSelector('.passv');
  const n = await page.locator('.rtile').count(); ok(n >= 40, 'מעט מדי אריחים בטבלה: ' + n);
  for (let i = 0; i < n; i++) {
    await page.locator('.rtile').nth(i).click();
    const txt = await page.locator('.view').innerText();
    const bad = ['null', 'undefined', 'NaN', 'false'].find(w => txt.includes(w));
    ok(!bad, `אחרי לחיצה על אריח ${i} מופיע "${bad}" על המסך`);
  }
}, { storage: seed({ xp: 650, zone: ALLZ, pass: { claimed: {}, gold: true, power: { fifty: 1, time: 1, retry: 1 }, boxes: 1, owned: {} } }) }));
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
  await page.click(`.opt[data-id="${wrongId}"]`); await page.waitForSelector('.retry-box');
  await page.click('.retry-box .btn.primary'); await page.waitForTimeout(500);
  eq((await page.locator('.h-head b').innerText()).includes('בעיטה 1 מתוך 2'), true, 'חזרנו לשאלה הראשונה');
  eq(await page.evaluate(() => JSON.parse(localStorage.getItem('jericho.v1')).pass.power.retry), 0, 'כוחות שנשארו');
}, { storage: seed({ pass: { claimed: {}, gold: false, power: { fifty: 0, time: 0, retry: 1 }, boxes: 0, owned: {} } }) }));

// ===== סיכום =====

await browser.close(); server.close();
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} בדיקות עברו${failed.length ? ' – ' + failed.length + ' נכשלו' : ' ✓'}\n`);
process.exit(failed.length ? 1 : 0);
