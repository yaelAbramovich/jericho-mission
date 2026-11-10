// מעטפת האפליקציה: ניווט, סרגל עליון, מפה, אזורים, פס קרב, פרופיל, וסיכום סבב.
import * as State from './state.js';
import { sfx, unlock } from './audio.js';
import { h, $, createScope, modal, toast, burst } from './ui.js';
import { CHAPTERS, OVERVIEW, TEST_DATE, hebNum } from './content.js';
import { TIER_XP, MAX_TIER, ITEMS, art, itemById, isUnlocked, unlockedAt } from './rewards.js';

const screenEl = () => $('#screen');
let scope = createScope();
let current = { name: null, params: null };

// ---------- הגדרות משחקים ----------
export const GAMES = {
  hunter: { name: 'דו-קרב פנדלים', icon: '⚽', desc: 'מצא את המקום בתנ״ך וכבוש גולים', modes: [['find', 'חיפוש בתנ״ך'], ['match', 'התאמת ציטוט']] },
  swipe: { name: 'הסערה מתקרבת', icon: '🌀', desc: '60 שניות של אמת או שקר' },
  who: { name: 'מי אמר?', icon: '🎙️', desc: 'מי אמר את הציטוט?' },
  order: { name: 'בונים את הקו', icon: '🧩', desc: 'סדר את האירועים' },
  boss: { name: 'המעגל האחרון', icon: '👑', desc: 'האם רחב עשתה חסד?', fixedChapter: 2 },
};

// ---------- ניווט ----------
export function go(name, params = {}) {
  scope.dispose(); scope = createScope();
  current = { name, params };
  const el = screenEl(); el.innerHTML = ''; el.scrollTop = 0;
  const inGame = ['play', 'story', 'parent', 'end'].includes(name);
  document.body.classList.toggle('immersive', inGame);
  setNav(name);
  renderTop();
  const view = h('div', { class: 'view' });
  el.append(view);
  const fn = ROUTES[name];
  if (fn) fn(view, params, scope);
}

function setNav(name) {
  const tab = { map: 'map', zone: 'map', focus: 'focus', topic: 'focus', games: 'games', pass: 'pass', profile: 'profile' }[name];
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.go === tab));
}

export function renderTop() {
  const s = State.get(), tier = State.tierOf(), inTier = s.xp % TIER_XP;
  const t = $('#topbar');
  t.innerHTML = '';
  t.append(
    h('div', { class: 'tier-badge' }, h('small', {}, 'דרגה'), h('b', {}, String(Math.min(tier, MAX_TIER)))),
    h('div', { class: 'xpwrap' },
      h('div', { class: 'xpbar' }, h('i', { style: { width: (tier >= MAX_TIER ? 100 : inTier / TIER_XP * 100) + '%' } })),
      h('small', {}, tier >= MAX_TIER ? 'דרגה מקסימלית!' : `${inTier}/${TIER_XP} XP לדרגה הבאה`)),
    h('div', { class: 'streak', title: 'רצף ימים' }, '🔥', h('b', {}, String(State.streakNow()))),
    h('button', { class: 'icon-btn', 'aria-label': 'שמע', onclick: () => { State.setMuted(!State.get().muted); unlock(); sfx.tap(); renderTop(); } }, State.get().muted ? '🔇' : '🔊'),
  );
}

const daysLeft = () => {
  const [y, m, d] = TEST_DATE.split('-').map(Number);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((new Date(y, m - 1, d) - now) / 864e5);
};

// ---------- מפה ----------
const ZONE_POS = { 1: [292, 92], 2: [72, 165], 3: [186, 262], 4: [92, 362], 5: [82, 458] };
function mapScreen(v) {
  const dl = daysLeft();
  v.append(h('div', { class: 'test-count' },
    dl > 0 ? [h('b', {}, String(dl)), ' ימים למבחן'] : dl === 0 ? 'המבחן היום! בהצלחה 💪' : 'המבחן עבר – כל הכבוד!'));
  const ovDone = State.get().overviewDone;
  v.append(h('button', { class: 'overview-card' + (ovDone ? '' : ' new'), onclick: () => { sfx.pick(); go('story', { ch: 0 }); } },
    h('span', { class: 'ti' }, '📖'),
    h('span', { class: 'ov-t' }, h('b', {}, 'הסיפור בקצרה'), h('small', {}, ovDone ? 'לקרוא שוב את כל הסיפור' : 'לא מכירים את הסיפור? מתחילים כאן')),
    !ovDone && h('em', {}, 'התחל כאן')));
  const cap = State.capturedCount();
  const zones = [1, 2, 3, 4, 5].map(n => {
    const [x, y] = ZONE_POS[n], o = State.objectives(n), c = State.captured(n);
    const cnt = ['story', 'hunter', 'other'].filter(k => o[k]).length;
    const R = 25, C = 2 * Math.PI * R;
    return `<g class="zone ${c ? 'cap' : ''}" data-ch="${n}" transform="translate(${x} ${y})" tabindex="0" role="button" aria-label="${CHAPTERS[n - 1].zone}">
      ${c ? '' : '<circle class="pulse" r="26"/>'}
      <circle r="${R}" class="zbg"/>
      <circle r="${R}" class="zring" stroke-dasharray="${C * cnt / 3} ${C}" transform="rotate(-90)"/>
      <text class="znum" y="9">${hebNum(n)}</text>
      ${c ? '<text class="zflag" y="-32">⚑</text>' : ''}
      <g transform="translate(0 44)"><rect class="zlab" x="-48" y="-13" width="96" height="22" rx="11"/><text class="ztxt" y="3">${CHAPTERS[n - 1].zone}</text></g>
    </g>`;
  }).join('');
  const svg = `<svg viewBox="0 0 360 520" class="map" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="hex" width="28" height="48.5" patternUnits="userSpaceOnUse" patternTransform="scale(.9)"><path d="M14 0l14 8v16l-14 8-14-8V8zM14 32l14 8v8.5M14 32L0 40v8.5" fill="none" stroke="#7df" stroke-opacity=".08"/></pattern>
      <linearGradient id="land" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16301f"/><stop offset="1" stop-color="#0d1c2a"/></linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="360" height="520" fill="#070c18"/>
    <path d="M0 0H190C150 90 230 150 185 230S140 380 190 520H0z" fill="url(#land)"/>
    <path d="M360 0H190C150 90 230 150 185 230S140 380 190 520H360z" fill="#1a2a20"/>
    <path d="M190 0C150 90 230 150 185 230S140 380 190 520" fill="none" stroke="#0b4f7c" stroke-width="46" opacity=".9"/>
    <path d="M190 0C150 90 230 150 185 230S140 380 190 520" fill="none" stroke="#35c9ff" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round" opacity=".7" class="flow"/>
    <rect width="360" height="520" fill="url(#hex)"/>
    <circle cx="170" cy="290" r="250" fill="none" stroke="#a24bff" stroke-width="3" stroke-dasharray="6 10" opacity=".55" class="stormring"/>
    <circle cx="170" cy="290" r="330" fill="none" stroke="#a24bff" stroke-width="40" opacity=".08"/>
    <text x="330" y="22" class="cmp">מזרח</text><text x="30" y="22" class="cmp">מערב</text>
    <text x="196" y="500" class="cmp river">הירדן</text>
    <path d="M292 92L72 165L186 262L92 362L82 458" fill="none" stroke="#2effd2" stroke-width="2" stroke-dasharray="3 7" stroke-linecap="round" opacity=".6"/>
    ${zones}</svg>`;
  const wrap = h('div', { class: 'map-wrap', html: svg });
  wrap.addEventListener('click', e => {
    const g = e.target.closest('.zone'); if (!g) return;
    sfx.pick(); go('zone', { ch: +g.dataset.ch });
  });
  v.append(wrap);
  const examOpen = State.allCaptured();
  v.append(h('div', { class: 'map-foot' },
    h('div', { class: 'cap-count' }, `אזורים שנכבשו: `, h('b', {}, `${cap}/5`)),
    h('button', { class: 'btn ' + (examOpen ? 'primary glow' : 'ghost'), disabled: !examOpen, onclick: () => startGame('exam', {}) },
      examOpen ? '🏆 מבחן הסיכום' : '🔒 מבחן הסיכום – כבוש את כל האזורים')));
}

// ---------- מסך אזור ----------
function zoneScreen(v, { ch }) {
  const c = CHAPTERS[ch - 1], o = State.objectives(ch);
  const mk = (ok, label) => h('li', { class: ok ? 'ok' : '' }, h('span', {}, ok ? '✓' : '○'), label);
  v.append(
    h('button', { class: 'back', onclick: () => go('map') }, '→ למפה'),
    h('div', { class: 'zone-head' }, h('small', {}, `אזור ${hebNum(ch)}׳ · פרק ${hebNum(ch)}`), h('h2', {}, c.zone), h('p', {}, c.title)),
    h('ul', { class: 'objs' },
      mk(o.story, 'לסיים את תדריך המשימה'),
      mk(o.hunter, 'סבב פנדלים עם 3 גולים לפחות'),
      mk(o.other, 'סבב במשחק נוסף (הסערה / מי אמר / בונים את הקו)')),
  );
  const next = !o.story ? 'story' : !o.hunter ? 'hunter' : 'other';
  const tile = (cls, icon, name, desc, fn, rec) => h('button', { class: 'tile ' + cls + (rec ? ' rec' : ''), onclick: () => { sfx.pick(); fn(); } },
    h('span', { class: 'ti' }, icon), h('span', { class: 'tn' }, name), h('small', {}, desc), rec && h('em', {}, 'מומלץ'));
  const grid = h('div', { class: 'tiles' },
    tile('', '📖', 'תדריך משימה', 'הסיפור של הפרק', () => go('story', { ch }), next === 'story'),
    tile('', '⚽', 'פנדלים – חיפוש', 'מצא בתנ״ך', () => startGame('hunter', { chapter: ch, mode: 'find' }), next === 'hunter'),
    tile('', '🎯', 'פנדלים – התאמה', 'בחר ציטוט', () => startGame('hunter', { chapter: ch, mode: 'match' })),
    tile('', '🌀', 'הסערה מתקרבת', 'אמת או שקר', () => startGame('swipe', { chapter: ch }), next === 'other'),
    tile('', '🎙️', 'מי אמר?', 'ציטוט ודובר', () => startGame('who', { chapter: ch })),
    tile('', '🧩', 'בונים את הקו', 'סדר אירועים', () => startGame('order', { chapter: ch })),
    ch === 2 && tile('boss', '👑', 'המעגל האחרון', 'האם רחב עשתה חסד?', () => startGame('boss', { chapter: 2 })),
  );
  v.append(grid);
}

// ---------- בחירת משחק ----------
function gamesScreen(v) {
  v.append(h('h2', { class: 'sec' }, 'מה משחקים?'));
  const grid = h('div', { class: 'tiles big' });
  Object.entries(GAMES).forEach(([k, g]) => grid.append(
    h('button', { class: 'tile', onclick: () => { sfx.pick(); pickScope(k); } }, h('span', { class: 'ti' }, g.icon), h('span', { class: 'tn' }, g.name), h('small', {}, g.desc))));
  const ex = State.allCaptured();
  grid.append(h('button', { class: 'tile ' + (ex ? 'rec' : 'locked'), disabled: !ex, onclick: () => startGame('exam', {}) },
    h('span', { class: 'ti' }, ex ? '🏆' : '🔒'), h('span', { class: 'tn' }, 'מבחן הסיכום'), h('small', {}, ex ? 'כל המשחקים יחד' : 'נפתח אחרי כיבוש 5 אזורים')));
  v.append(grid);
}
function pickScope(key) {
  const g = GAMES[key];
  if (g.fixedChapter) return startGame(key, { chapter: g.fixedChapter });
  let mode = g.modes ? g.modes[0][0] : null;
  const box = h('div', { class: 'chips' });
  const m = modal([h('h3', {}, g.name), g.modes && modeChips(g.modes, v => { mode = v; }), h('p', { class: 'sub' }, 'איזה פרק?'), box]);
  const chip = (label, ch) => h('button', { class: 'chip', onclick: () => { m.close(); startGame(key, { chapter: ch, mode }); } }, label);
  box.append(chip('הכול', 0), ...CHAPTERS.map(c => chip(`פרק ${hebNum(c.n)}׳`, c.n)));
}
function modeChips(modes, onSel) {
  const row = h('div', { class: 'chips mode' });
  modes.forEach(([k, l], i) => {
    const b = h('button', { class: 'chip' + (i ? '' : ' on'), onclick: () => { row.querySelectorAll('.chip').forEach(x => x.classList.remove('on')); b.classList.add('on'); onSel(k); } }, l);
    row.append(b);
  });
  return row;
}

// ---------- פס קרב ----------
function passScreen(v) {
  const s = State.get(), tier = State.tierOf();
  v.append(h('h2', { class: 'sec' }, 'פס קרב – העונה של יריחו'),
    h('p', { class: 'sub' }, tier >= MAX_TIER ? 'פתחת הכול! אלוף.' : `עוד ${TIER_XP - (s.xp % TIER_XP)} XP לדרגה ${tier + 1}`));
  const list = h('div', { class: 'pass' });
  for (let t = 1; t <= MAX_TIER; t++) {
    const its = unlockedAt(t), open = t <= tier;
    list.append(h('div', { class: 'ptier' + (open ? ' open' : '') + (t === tier + 1 ? ' next' : '') },
      h('div', { class: 'pn' }, String(t)),
      ...its.map(it => itemCard(it, open))));
  }
  const ex = itemById('ax');
  list.append(h('div', { class: 'ptier special' + (s.examDone ? ' open' : '') }, h('div', { class: 'pn' }, '🏆'), itemCard(ex, s.examDone, 'נפתח במבחן הסיכום')));
  v.append(list);
}
function itemCard(it, open, lockNote) {
  const eq = State.get().eq[it.type] === it.id;
  return h('button', { class: 'item ' + it.type + (open ? '' : ' locked') + (eq ? ' eq' : ''), onclick: () => equip(it, open) },
    h('div', { class: 'ia', html: art(it, 64) }),
    h('div', { class: 'iname' }, it.name),
    h('small', {}, open ? (eq ? 'לבוש' : 'לחץ ללבוש') : (lockNote || '🔒')));
}
function equip(it, open) {
  if (!open) { sfx.wrong(); return; }
  const s = State.get();
  s.eq[it.type] = (it.type === 'emote' && s.eq.emote === it.id) ? null : it.id;
  State.save(); sfx.pick(); toast(`${it.name} – עודכן`); go(current.name, current.params);
}

// ---------- פרופיל ----------
function profileScreen(v) {
  const s = State.get(), eq = s.eq;
  const av = itemById(eq.avatar), bn = itemById(eq.banner), jr = itemById(eq.jersey), em = eq.emote && itemById(eq.emote);
  v.append(
    h('div', { class: 'profile-card' },
      h('div', { class: 'pbanner', html: art(bn, 300) }),
      h('div', { class: 'prow' },
        h('div', { class: 'pav', html: art(av, 96) }),
        h('div', { class: 'pjr', html: art(jr, 96) }),
        em && h('div', { class: 'pem' }, h('span', { html: art(em, 60) })))),
    h('div', { class: 'stats' },
      stat('XP', s.xp), stat('דרגה', Math.min(State.tierOf(), MAX_TIER)), stat('רצף ימים', State.streakNow()),
      stat('סבבים', s.rounds), stat('שיא הסערה', s.best.swipe), stat('אזורים', State.capturedCount() + '/5')),
    h('p', { class: 'sub' }, 'אפשר להחליף פריטים בפס הקרב (לחיצה על פריט פתוח).'),
    State.isMemoryOnly() && h('p', { class: 'warn' }, 'שימו לב: ההתקדמות לא נשמרת במכשיר הזה.'),
    h('button', { class: 'btn ghost', onclick: () => go('parent') }, '🔒 מצב הורה'));
}
const stat = (l, n) => h('div', { class: 'stat' }, h('b', {}, String(n)), h('small', {}, l));

// ---------- סיפור / הורה ----------
async function storyScreen(v, p, sc) { (await import('./story.js')).render(v, p, sc); }
async function parentScreen(v, p, sc) { (await import('./parent.js')).render(v, p, sc); }

// ---------- הרצת משחק ----------
export function startGame(key, opts) {
  unlock();
  go('play', { key, opts });
}
async function playScreen(v, { key, opts }, sc) {
  const bar = h('div', { class: 'game-bar' },
    h('button', { class: 'back', onclick: () => { sfx.tap(); go(key === 'duel' ? 'focus' : opts.chapter ? 'zone' : 'games', { ch: opts.chapter }); } }, '✕ יציאה'),
    h('span', { class: 'gname' }, key === 'exam' ? 'מבחן הסיכום' : key === 'duel' ? 'דו-קרב משפחתי' : GAMES[key].name));
  const box = h('div', { class: 'game' });
  v.append(bar, box);
  try {
    const mod = await import(`./games/${key}.js`);
    const res = await mod.run(box, opts, sc);
    if (!sc.dead) await finishRound(key, opts, res);
  } catch (e) {
    console.error(e);
    box.append(h('p', { class: 'warn' }, 'משהו השתבש בטעינת המשחק. נסו שוב.'), h('button', { class: 'btn', onclick: () => go('games') }, 'חזרה'));
  }
}

async function finishRound(key, opts, res) {
  const s = State.get(), ch = opts.chapter || 0;
  const before = { cap: ch ? State.captured(ch) : false, all: State.allCaptured() };
  s.rounds++;
  if (key === 'swipe' && res.score > s.best.swipe) s.best.swipe = res.score;
  if (key === 'exam') s.examDone = true;
  if (ch && key === 'hunter' && res.correct >= 3) State.setObjective(ch, 'hunter');
  if (ch && key !== 'hunter' && key !== 'exam' && res.completed !== false) State.setObjective(ch, 'other');
  const { before: tb, after: ta } = State.addXP(res.xp);
  const justCaptured = ch && !before.cap && State.captured(ch);
  go('end', { key, opts, res, tb, ta, justCaptured, nowAll: !before.all && State.allCaptured() });
}

function endScreen(v, { key, opts, res, tb, ta, justCaptured, nowAll }, sc) {
  v.classList.add('end');
  const lines = res.lines || [];
  const xpEl = h('b', { class: 'xp-num' }, '+0');
  v.append(
    h('div', { class: 'end-card' },
      h('div', { class: 'end-title' }, res.title || 'סבב הסתיים!'),
      h('div', { class: 'end-big' }, res.big || ''),
      ...lines.map(l => h('p', {}, l)),
      h('div', { class: 'end-xp' }, xpEl, ' XP')),
    h('h3', { class: 'again' }, 'עוד סבב?'),
    h('div', { class: 'end-btns' },
      h('button', { class: 'btn primary glow', onclick: () => startGame(key, opts) }, 'עוד סבב ▶'),
      key === 'duel' ? h('button', { class: 'btn', onclick: () => go('focus') }, 'חזרה ללמבחן') : h('button', { class: 'btn', onclick: () => go('games') }, 'בחירת משחק'),
      key !== 'duel' && h('button', { class: 'btn ghost', onclick: () => go(opts.chapter ? 'zone' : 'map', { ch: opts.chapter }) }, opts.chapter ? 'לאזור' : 'למפה'),
    ));
  burst(v, 26);
  // ספירת XP
  let n = 0; const target = Math.round(res.xp), step = Math.max(1, Math.ceil(target / 20));
  sc.every(() => { if (n < target) { n = Math.min(target, n + step); xpEl.textContent = '+' + n; if (n % 3 === 0) sfx.tick(); } }, 40);
  sc.later(() => {
    if (justCaptured) { sfx.capture(); showCapture(opts.chapter, nowAll); }
    else if (ta > tb) showTierUp(tb, ta);
    if (justCaptured && ta > tb) setTimeout(() => showTierUp(tb, ta), 400);
  }, 900);
}
function showCapture(ch, nowAll) {
  const c = CHAPTERS[ch - 1];
  const m = modal([h('div', { class: 'cap-big' }, '⚑'), h('h3', {}, `${c.zone} נכבש!`),
    h('p', {}, nowAll ? 'כל 5 האזורים בידיים שלך. מבחן הסיכום נפתח!' : `אזורים שנכבשו: ${State.capturedCount()}/5`),
    h('button', { class: 'btn primary', onclick: () => m.close() }, 'יאללה')], { cls: 'celebrate' });
  burst(m.box, 30);
}
function showTierUp(from, to) {
  sfx.tierUp();
  const items = []; for (let t = from + 1; t <= Math.min(to, MAX_TIER); t++) items.push(...unlockedAt(t));
  const m = modal([h('div', { class: 'tag' }, 'דרגה חדשה'), h('h3', {}, `דרגה ${Math.min(to, MAX_TIER)}!`),
    h('div', { class: 'unlocks' }, items.map(it => h('div', { class: 'unlock' }, h('div', { html: art(it, 72) }), h('small', {}, it.name)))),
    h('button', { class: 'btn primary', onclick: () => { m.close(); } }, 'מדהים')], { cls: 'celebrate' });
  burst(m.box, 30);
  renderTop();
}

async function focusScreen(v, p, sc) { (await import('./focus.js')).list(v, p, sc); }
async function topicScreen(v, p, sc) { (await import('./focus.js')).topic(v, p, sc); }

const ROUTES = { focus: focusScreen, topic: topicScreen, map: mapScreen, zone: zoneScreen, games: gamesScreen, pass: passScreen, profile: profileScreen, story: storyScreen, parent: parentScreen, play: playScreen, end: endScreen };

// ---------- אתחול ----------
export function boot() {
  State.load();
  document.addEventListener('pointerdown', unlock, { passive: true });
  $('#nav').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    sfx.tap(); go(b.dataset.go);
  });
  go('map');
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
