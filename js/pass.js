// פס הקרב: לוגיקה (איסוף, כרטיס זהב, קופסאות) וממשק – מסלול אנכי עם טור חינם וטור זהב.
import * as State from './state.js';
import { h, modal, toast, burst } from './ui.js';
import { sfx } from './audio.js';
import { art, itemById, MAX_TIER, TIER_XP } from './rewards.js';
import { isOpen, equipped, howText } from './locker.js';
import { cellRewards, POWER, RARITY, TYPE_HELP, rewardRarity, rarityOf, MILESTONES, BOX_POOL } from './pass-data.js';
import { TEST_DATE } from './content.js';
import * as Quests from './quests.js';
import { achName } from './achievements.js';
import { renderTop } from './app.js';
import { demo } from './effects.js';

const TYPE_ONE = { avatar: 'דמות', jersey: 'חולצה', banner: 'באנר', emote: 'אימוג׳י', ball: 'כדור', fx: 'חגיגת גול', pitch: 'מגרש', keeper: 'שוער', trail: 'זנב לכדור', title: 'תואר' };
const key = (track, t) => (track === 'gold' ? 'g' : 'f') + t;

// ================= לוגיקה =================
export const isClaimed = (track, t) => !!State.get().pass.claimed[key(track, t)];
export const goldActive = () => State.get().pass.gold;
export const goldReady = () => State.allCaptured() && !goldActive();
export const canClaim = (track, t) => t <= State.tierOf() && !isClaimed(track, t) && (track === 'free' || goldActive()) && cellRewards(track, t).length > 0;
export function claimable() {
  const out = [];
  for (let t = 1; t <= MAX_TIER; t++) for (const tr of ['free', 'gold']) if (canClaim(tr, t)) out.push([tr, t]);
  return out;
}
// כמה דברים מחכים לשחקן (לנקודה האדומה בלשונית)
export const pending = () => claimable().length + (goldReady() ? 1 : 0) + State.get().pass.boxes;

export function claim(track, t) {
  if (!canClaim(track, t)) return null;
  const P = State.get().pass, rs = cellRewards(track, t);
  P.claimed[key(track, t)] = true;
  for (const r of rs) {
    if (r.power) P.power[r.power] += r.n;
    if (r.box) P.boxes += r.box;
  }
  State.save();
  return rs;
}
export function activateGold() {
  if (!goldReady()) return false;
  State.get().pass.gold = true; State.save(); return true;
}
// פותח קופסה: פריט שעוד אין לשחקן (בהסתברות לפי נדירות). אם הכול כבר אצלו – מקבל כוחות במקום.
const WEIGHT = { common: 60, rare: 28, epic: 10, legendary: 2 };
export function openBox() {
  const P = State.get().pass;
  if (P.boxes < 1) return null;
  P.boxes--;
  const pool = BOX_POOL().filter(i => !P.owned[i.id]);
  if (!pool.length) { P.power.fifty += 2; P.power.time += 2; State.save(); return { power: [['fifty', 2], ['time', 2]] }; }
  let r = Math.random() * pool.reduce((a, i) => a + WEIGHT[rarityOf(i)], 0), pick = pool[0];
  for (const i of pool) { r -= WEIGHT[rarityOf(i)]; if (r <= 0) { pick = i; break; } }
  P.owned[pick.id] = true; State.save();
  return { item: pick };
}

// ================= ממשק =================
const EXAM_R = { item: 'ax' };
let preview = null;       // פרס שנבחר לתצוגה מקדימה (לחיצה על אריח)
const daysLeft = () => { const [y, m, d] = TEST_DATE.split('-').map(Number), n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((new Date(y, m - 1, d) - n) / 864e5); };
const rarClass = r => 'rar-' + rewardRarity(r);

export function rewardArt(r, size = 56) {
  if (r.item) return art(itemById(r.item), size);
  if (r.power) return `<span class="pw-art ${r.power}" style="font-size:${size * 0.7}px">${POWER[r.power].icon}</span>`;
  return `<span class="pw-art" style="font-size:${size * 0.75}px">🎁</span>`;
}
export const rewardKind = r => r.item ? TYPE_ONE[itemById(r.item).type] : r.power ? 'כוח' : 'קופסה';
export function rewardName(r) {
  if (r.item) return itemById(r.item).name;
  if (r.power) return `${POWER[r.power].name} ×${r.n}`;
  return `קופסת מסתורין${r.box > 1 ? ' ×' + r.box : ''}`;
}
const wear = it => { State.get().eq[it.type] = it.id; State.save(); sfx.pick(); };

// הטבלה מחולקת לדפים של 5 דרגות (במקום גלילה ארוכה): נפתחת על הדף שיש בו מה לאסוף, אחרת על הדרגה הנוכחית.
const PAGES = [[1, 5], [6, 10], [11, 15], [16, 20]];
const pageOf = t => Math.min(PAGES.length - 1, Math.floor((Math.max(1, t) - 1) / 5));
let passPage = null;

export function renderTrack(v, sc) {
  const root = h('div', { class: 'passv' });
  v.append(root);
  const scroller = document.getElementById('screen');
  const refresh = () => { const y = scroller.scrollTop; paint(); scroller.scrollTop = y; renderTop(); dot(); };
  passPage = null;   // בכל כניסה למסך – בוחרים מחדש את הדף הרלוונטי

  function paint() {
    const S = State.get(), tier = State.tierOf(), P = S.pass, inTier = S.xp % TIER_XP;
    if (passPage === null) { const c = claimable(); passPage = c.length ? pageOf(c[0][1]) : pageOf(Math.min(tier, MAX_TIER)); }
    root.replaceChildren(season(), progress(), ticket(), inventory(), pageTabs(), trackHead(), ...rows(), ...(passPage === PAGES.length - 1 ? [examRow()] : []));

    function season() {
      const d = daysLeft();
      return h('div', { class: 'season' },
        h('div', {}, h('small', {}, 'עונה 1'), h('b', {}, 'מבצע יריחו')),
        h('div', { class: 'se-d' }, d > 0 ? [h('b', {}, String(d)), ' ימים לסוף העונה'] : d === 0 ? 'העונה מסתיימת היום! 💪' : 'העונה הסתיימה – אפשר להמשיך לאסוף'),
        h('button', { class: 'helplink', 'aria-label': 'איך פס הקרב עובד', onclick: showHelp }, '❓'));
    }
    function progress() {
      const all = claimable();
      return h('div', { class: 'pprog' },
        h('div', { class: 'tier-badge' }, h('small', {}, 'דרגה'), h('b', {}, String(Math.min(tier, MAX_TIER)))),
        h('div', { class: 'xpwrap' }, h('div', { class: 'xpbar' }, h('i', { style: { width: (tier >= MAX_TIER ? 100 : inTier / TIER_XP * 100) + '%' } })),
          h('small', {}, tier >= MAX_TIER ? 'דרגה מקסימלית!' : `${inTier}/${TIER_XP} XP לדרגה ${tier + 1}`)),
        h('button', { class: 'btn claimall' + (all.length ? ' primary glow' : ''), disabled: !all.length, onclick: claimAll }, all.length ? `קבל הכול (${all.length})` : 'אין מה לקבל'));
    }
    function ticket() {
      const caps = State.capturedCount();
      if (P.gold) return h('div', { class: 'ticket on slim' }, h('span', { class: 'tk-i' }, '🎫'), h('div', {}, h('b', {}, 'כרטיס הזהב פעיל')));
      if (goldReady()) return h('div', { class: 'ticket ready' }, h('span', { class: 'tk-i' }, '🎫'), h('div', {}, h('b', {}, 'כבשת את כל האזורים!'), h('small', {}, 'הפעל את כרטיס הזהב וקבל את כל פרסי הזהב')),
        h('button', { class: 'btn primary glow', onclick: onActivate }, 'הפעל!'));
      return h('div', { class: 'ticket slim' }, h('span', { class: 'tk-i' }, '🎫'), h('div', {}, h('b', {}, 'כרטיס הזהב'), h('small', {}, `כבוש את כל 5 האזורים כדי להפעיל (${caps}/5)`)),
        h('div', { class: 'tk-bar' }, h('i', { style: { width: caps * 20 + '%' } })));
    }
    function inventory() {
      const chips = Object.entries(POWER).map(([k, p]) => h('button', { class: 'pwchip' + (State.power(k) ? '' : ' zero'), onclick: () => { sfx.tap(); toast(`${p.icon} ${p.name}: ${p.desc}`, 5000); } },
        h('span', { class: 'pwi' }, p.icon), h('span', { class: 'pwt' }, p.short), h('b', {}, String(State.power(k)))));
      // כפתור הקופסאות מופיע רק כשיש קופסה לפתוח (חוסך שורה במסך)
      return h('div', { class: 'inv' }, h('div', { class: 'pwchips' }, chips),
        P.boxes > 0 && h('button', { class: 'btn boxbtn primary', onclick: () => openBoxUI(refresh) }, `🎁 קופסאות: ${P.boxes} – פתח!`));
    }
    function pageTabs() {
      const cl = claimable();
      return h('div', { class: 'ptabs' }, PAGES.map(([a, z], i) => h('button', { class: 'ptab' + (passPage === i ? ' on' : '') + (tier >= a && tier <= z ? ' here' : ''), onclick: () => { sfx.tap(); passPage = i; refresh(); } },
        `\u200E${a}–${z}`, cl.some(([, t]) => t >= a && t <= z) && h('i', { class: 'pdot' }))));
    }
    function trackHead() { return h('div', { class: 'thead' }, h('span', { class: 'free' }, 'חינם'), h('span', {}), h('span', { class: 'gold' }, 'זהב ✨')); }
    function examRow() { return h('div', { class: 'exam-row' + (S.examDone ? ' done' : '') },
      h('button', { class: 'rtile rar-legendary', onclick: () => { sfx.tap(); openPreview(EXAM_R); } }, h('span', { class: 'rt-kind' }, rewardKind(EXAM_R)), h('span', { class: 'ra', html: rewardArt(EXAM_R, 56) }), h('small', {}, itemById('ax').name)),
      h('div', {}, h('b', {}, '🏆 פרס מבחן הסיכום'), h('small', {}, S.examDone ? 'נפתח! אפשר ללבוש בארון' : 'משחקים את מבחן הסיכום אחרי כיבוש כל האזורים'))); }
    function rows() {
      const [from, to] = PAGES[passPage], out = [];
      for (let t = from; t <= to; t++) {
        out.push(h('div', { class: 'prow2' + (t <= tier ? ' reached' : '') + (t === tier + 1 ? ' next' : '') + (MILESTONES.includes(t) ? ' ms' : '') },
          cell('free', t), h('div', { class: 'dia' }, String(t)), cell('gold', t)));
      }
      return out;
    }
    function cell(track, t) {
      const rs = cellRewards(track, t), claimed = isClaimed(track, t), can = canClaim(track, t);
      const lockedGold = track === 'gold' && !P.gold;
      const ms = MILESTONES.includes(t);
      return h('div', { class: `cell ${track}` + (claimed ? ' claimed' : '') + (can ? ' can' : '') + (t > tier ? ' future' : '') + (lockedGold ? ' glock' : '') },
        h('div', { class: 'rtiles' }, rs.map(r => h('button', { class: 'rtile ' + rarClass(r), onclick: () => { sfx.tap(); openPreview(r); } },
          h('span', { class: 'rt-kind' }, rewardKind(r)), h('span', { class: 'ra', html: rewardArt(r, ms ? 64 : 52) }), h('small', {}, rewardName(r))))),
        ms && !claimed && h('div', { class: 'ribbon' }, track === 'gold' ? 'אבן דרך זהב!' : 'אבן דרך!'),
        can ? h('button', { class: 'btn claim', onclick: () => doClaim(track, t) }, 'קבל')
          : claimed ? h('span', { class: 'chk' }, '✓')
            : (lockedGold ? h('span', { class: 'lk' }, '🔒 צריך כרטיס זהב') : t > tier ? h('span', { class: 'lk dim' }, `🔒 דרגה ${t}`) : null));
    }
  }

  // תצוגה מקדימה: חלון מעל המסך (לא צריך לגלול למעלה כדי לראות מה נבחר)
  function openPreview(r) {
    const S = State.get(), pv = r.item ? itemById(r.item) : null, rc = RARITY[rewardRarity(r)];
    const slot = type => (pv && pv.type === type) ? pv : equipped(type);
    const hero = h('div', { class: 'hero' },
      h('div', { class: 'hero-bg', html: art(slot('banner'), 360) }),
      h('div', { class: 'hero-chars' }, h('div', { class: 'hav', html: art(slot('avatar'), 88) }), h('div', { class: 'hjr', html: art(slot('jersey'), 88) })));
    const what = pv ? TYPE_HELP[pv.type] : r.power ? POWER[r.power].desc : 'נפתחת בכפתור „קופסאות" ומגלה פריט חדש שעוד אין לך.';
    const showsArt = !pv || !['avatar', 'jersey', 'banner'].includes(pv.type);
    const btns = [];
    if (pv && ['fx', 'emote', 'trail'].includes(pv.type)) btns.push(h('button', { class: 'btn demo-btn', onclick: () => { sfx.pick(); demo(pv, hero, equipped('avatar')); } }, '▶ נסה עכשיו'));
    if (pv && isOpen(pv)) {
      const on = S.eq[pv.type] === pv.id;
      btns.push(h('button', { class: 'btn primary', disabled: on, onclick: () => { wear(pv); toast(`${pv.name} – עודכן`); m.close(); } }, on ? 'לבוש ✓' : 'ללבוש'));
    }
    const m = modal([hero,
      h('div', { class: 'pv-info' }, showsArt && h('div', { class: 'pv-art', html: rewardArt(r, 64) }),
        h('div', {}, h('b', { style: { color: rc.color } }, rewardName(r)), h('small', { class: 'pv-kind' }, `${rewardKind(r)} · ${rc.name}`), h('small', {}, what),
          pv && !isOpen(pv) && h('small', { class: 'hero-lock' }, '🔒 ' + howText(pv, achName)))),
      h('div', { class: 'pv-btns' }, ...btns, h('button', { class: 'btn ghost', onclick: () => m.close() }, 'סגור'))], { cls: 'preview', onClose: refresh });
  }

  function showHelp() {
    const row = (icon, title, text) => h('div', { class: 'hrow' }, h('span', { class: 'hi' }, icon), h('div', {}, h('b', {}, title), h('small', {}, text)));
    const m = modal([h('div', { class: 'tag' }, 'איך זה עובד'), h('h3', {}, 'פס הקרב'), h('div', { class: 'helplist' },
      row('⭐', 'דרגות', 'כל סבב נותן XP. כל 60 XP = דרגה חדשה, ובכל דרגה מחכה לך פרס.'),
      row('✅', 'לאסוף פרסים', 'כשפרס זוהר בירוק – לוחצים „קבל". רק פרס שנאסף אפשר ללבוש.'),
      row('📄', 'דפים', 'הדרגות מחולקות לדפים של 5. הנקודה האדומה מראה באיזה דף מחכה לך פרס.'),
      row('🎫', 'כרטיס זהב', 'כובשים את כל 5 האזורים ומפעילים אותו – ואז נפתחים גם פרסי הזהב (הטור השמאלי).'),
      row('🎁', 'קופסת מסתורין', 'נפתחת ומגלה פריט שעוד אין לך.'),
      ...Object.values(POWER).map(p => row(p.icon, `כוח: ${p.name}`, p.desc)),
      row('😀', 'אימוג׳י, חולצה, כדור...', 'פריטים לעיצוב. לוחצים על אריח כדי לראות מה זה ואיך הוא נראה.')),
      h('button', { class: 'btn primary', onclick: () => m.close() }, 'הבנתי')]);
  }
  function showGain(title, lists) {
    const tiles = lists.flat().map(r => h('div', { class: 'gain ' + rarClass(r) }, h('span', { html: rewardArt(r, 56) }), h('small', {}, rewardName(r))));
    const m = modal([h('div', { class: 'tag' }, 'פרס חדש'), h('h3', {}, title), h('div', { class: 'gains' }, tiles), h('button', { class: 'btn primary', onclick: () => m.close() }, 'מדהים')], { cls: 'celebrate', onClose: refresh });
    burst(m.box, 28); sfx.tierUp();
  }
  function doClaim(track, t) {
    const rs = claim(track, t); if (!rs) return;
    const big = rs.some(r => r.item || r.box) || MILESTONES.includes(t);
    if (big) showGain(`דרגה ${t}`, [rs]); else { sfx.correct(); toast(rs.map(rewardName).join(' · ') + ' ✓'); refresh(); }
  }
  function claimAll() {
    const got = [];
    for (const [tr, t] of claimable()) { const rs = claim(tr, t); if (rs) got.push(rs); }
    if (got.length) showGain('כל הפרסים שלך', got);
  }
  function onActivate() {
    if (!activateGold()) return;
    sfx.capture();
    const m = modal([h('div', { class: 'cap-big' }, '🎫'), h('h3', {}, 'כרטיס הזהב הופעל!'), h('p', {}, 'עכשיו אפשר לאסוף את פרסי הזהב של כל הדרגות שכבר עברת.'),
      h('button', { class: 'btn primary', onclick: () => m.close() }, 'יאללה')], { cls: 'celebrate', onClose: refresh });
    burst(m.box, 36);
  }
  paint(); dot();
}

// פתיחת קופסת מסתורין: רעידה, ואז חשיפה
export function openBoxUI(done) {
  const res = openBox(); if (!res) return;
  const box = h('div', { class: 'mbox' }, '🎁');
  const body = h('div', { class: 'boxreveal' }, h('div', { class: 'tag' }, 'קופסת מסתורין'), box, h('p', { class: 'sub' }, 'פותחים...'));
  const m = modal(body, { cls: 'celebrate', onClose: () => { done && done(); renderTop(); dot(); } });
  sfx.pick();
  setTimeout(() => {
    sfx.capture();
    if (res.item) {
      const it = res.item, rar = RARITY[rarityOf(it)];
      body.replaceChildren(h('div', { class: 'tag', style: { color: rar.color } }, rar.name), h('div', { class: 'boxitem rar-' + rarityOf(it), html: art(it, 110) }),
        h('h3', {}, it.name), h('p', { class: 'sub' }, `${TYPE_ONE[it.type]} חדש בארון!`),
        h('button', { class: 'btn primary', onclick: () => { wear(it); m.close(); } }, 'ללבוש עכשיו'), h('button', { class: 'btn ghost', onclick: () => m.close() }, 'אחר כך'));
    } else {
      body.replaceChildren(h('h3', {}, 'כבר יש לך הכול! 🏆'), h('p', { class: 'sub' }, 'קיבלת במקום זה כוחות: ' + res.power.map(([k, n]) => `${POWER[k].icon} ×${n}`).join('  ')), h('button', { class: 'btn primary', onclick: () => m.close() }, 'מעולה'));
    }
    burst(m.box, 36);
  }, 1300);
}

// נקודה אדומה על לשונית פס הקרב כשיש מה לאסוף
export function dot() {
  const b = document.querySelector('#nav button[data-go="pass"]');
  if (b) b.classList.toggle('dot', pending() > 0);
}

// לשונית האתגרים: המשימות היומיות
export function renderChallenges(v) {
  const list = Quests.todays(), nd = list.filter(q => q.done).length;
  v.append(h('p', { class: 'sub' }, 'משימות חדשות כל יום. כל משימה נותנת XP לפס הקרב, ושלוש יחד נותנות בונוס.'));
  const box = h('div', { class: 'chal' });
  list.forEach(q => box.append(h('div', { class: 'chrow' + (q.done ? ' ok' : '') },
    h('span', { class: 'chm' }, q.done ? '✓' : '○'),
    h('div', { class: 'cht' }, h('b', {}, q.text), h('div', { class: 'abar' }, h('i', { style: { width: (q.cur / q.goal * 100) + '%' } })), h('small', {}, `${q.cur}/${q.goal}`)),
    h('em', {}, '‎+' + q.xp + ' XP'))));
  box.append(h('div', { class: 'chrow bonus' + (nd === 3 ? ' ok' : '') }, h('span', { class: 'chm' }, nd === 3 ? '✓' : '🎁'),
    h('div', { class: 'cht' }, h('b', {}, 'כל 3 המשימות'), h('small', {}, `${nd}/3`)), h('em', {}, '‎+' + Quests.DAILY_BONUS + ' XP')));
  v.append(box);
}
