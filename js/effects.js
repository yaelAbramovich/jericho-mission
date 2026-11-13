// אפקטים: חגיגות מסך מלא עם צליל ("הצגות"), בועת אימוג׳י מונפש, וזנב לכדור.
// הכול נבנה ב-DOM/CSS וב-Web Audio – בלי קבצים. כל הצגה מחזירה את משך ההצגה במילישניות.
import { h } from './ui.js';
import { sfx } from './audio.js';
import { art } from './rewards.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pct = (a, b) => rnd(a, b).toFixed(1) + '%';

// חלקיקים שנופלים מלמעלה / עולים מלמטה
function drift(l, glyphs, n, cls, { dur = [1.6, 2.6], delay = [0, 0.7], size = [16, 30] } = {}) {
  for (let i = 0; i < n; i++) {
    l.append(h('i', { class: cls, style: { left: pct(2, 96), animationDuration: rnd(...dur) + 's', animationDelay: rnd(...delay) + 's', fontSize: rnd(...size) + 'px' } }, glyphs[i % glyphs.length]));
  }
}
// חלקיקים שמתפזרים ממרכז (או מנקודה נתונה)
function spray(l, glyphs, n, { x = 50, y = 45, dist = [80, 190], size = [16, 30], delay = 0 } = {}) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, d = rnd(...dist);
    l.append(h('i', { class: 'pop', style: { left: x + '%', top: y + '%', '--dx': Math.cos(a) * d + 'px', '--dy': Math.sin(a) * d + 'px', fontSize: rnd(...size) + 'px', animationDelay: delay + rnd(0, 0.12) + 's' } }, glyphs[i % glyphs.length]));
  }
}
const SHOFAR = `<svg viewBox="0 0 160 110" class="shofar-svg"><defs><linearGradient id="shg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2c75c"/><stop offset="1" stop-color="#8a5a12"/></linearGradient></defs>
<path d="M14 78 C 40 96 84 86 112 52 C 124 36 140 28 152 32 C 146 42 138 46 130 56 C 100 100 44 112 14 92 Z" fill="url(#shg)" stroke="#5a3a08" stroke-width="3" stroke-linejoin="round"/>
<ellipse cx="18" cy="85" rx="7" ry="10" fill="#3a2406" transform="rotate(-18 18 85)"/><path d="M60 92 C 84 86 104 70 118 52" fill="none" stroke="#fff3b0" stroke-width="3" opacity=".55" stroke-linecap="round"/></svg>`;

// ---- ההצגות ----
export const SHOWS = {
  // קונפטי רגיל (ברירת מחדל): גשם צבעוני קצר, בלי צליל נוסף
  confetti(l, p) {
    drift(l, [''], 34, 'fall sq', { dur: [1.2, 2], delay: [0, 0.5], size: [10, 16] });
    [...l.children].forEach((e, i) => { e.style.background = (p.colors || ['#2effd2', '#ffe14a'])[i % (p.colors || [1, 2]).length]; });
    return 2400;
  },
  goldrain(l) { drift(l, ['🪙', '✨', '🪙'], 30, 'fall'); [0, 0.25, 0.5, 0.8, 1.1].forEach(t => setTimeout(sfx.coin, t * 1000)); return 3000; },
  flames(l) { drift(l, ['🔥', '🔥', '✨'], 22, 'rise', { size: [22, 44] }); sfx.flame(); return 2800; },
  stars(l) { spray(l, ['⭐', '🌟', '✨'], 26, { dist: [90, 230], size: [20, 40] }); spray(l, ['⭐'], 14, { dist: [60, 150], size: [14, 24], delay: 0.35 }); sfx.sparkle(); return 2200; },
  hearts(l) { drift(l, ['💜', '💖', '💜'], 20, 'rise', { size: [20, 40] }); sfx.sparkle(); return 2800; },
  lightning(l) {
    l.append(h('div', { class: 'flash' }));
    [18, 48, 78].forEach((x, i) => l.append(h('div', { class: 'bolt', style: { left: x + '%', animationDelay: i * 0.18 + 's' },
      html: `<svg viewBox="0 0 60 300" preserveAspectRatio="none"><polyline points="34,0 18,90 38,100 12,200 30,210 6,300" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round"/><polyline points="34,0 18,90 38,100 12,200 30,210 6,300" fill="none" stroke="#9ad4ff" stroke-width="14" opacity=".5" stroke-linejoin="round"/></svg>` })));
    sfx.thunder(); return 1900;
  },
  fireworks(l) {
    const cols = ['#ff3d8b', '#ffe14a', '#35e08a', '#35b8ff', '#ff7a18'];
    [[25, 32], [72, 24], [50, 48], [18, 60], [80, 55]].forEach(([x, y], i) => {
      const c = cols[i % cols.length];
      for (let k = 0; k < 22; k++) { const a = (k / 22) * Math.PI * 2, d = rnd(80, 150); l.append(h('i', { class: 'pop spark', style: { left: x + '%', top: y + '%', background: c, '--dx': Math.cos(a) * d + 'px', '--dy': Math.sin(a) * d + 'px', animationDelay: i * 0.4 + 0.25 + 's' } })); }
      l.append(h('i', { class: 'rise-up', style: { left: x + '%', animationDelay: i * 0.4 + 's' } }));
    });
    sfx.fireworks(); return 3000;
  },
  shofar(l) {
    l.append(h('div', { class: 'shofar-wrap', html: SHOFAR }));
    [0, 0.35, 0.7, 1.05].forEach(d => l.append(h('div', { class: 'ring', style: { animationDelay: 0.3 + d + 's' } })));
    drift(l, ['♪', '♫', '✨'], 12, 'rise', { size: [20, 34], delay: [0.4, 1.4] });
    sfx.shofar(); return 3000;
  },
  // חומות יריחו נופלות: חומת לבנים עומדת... ואז קורסת עם אבק ורעידת מסך
  walls(l) {
    // חומת לבנים "בקשר חצי-לבנה": כל שורה שנייה מוזזת בחצי לבנה, וכל החומה מכסה את כל רוחב המסך
    const COLS = 7, ROWS = 4, W = 100 / COLS;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS + 1; c++) {
      const x = c * W - (r % 2 ? W / 2 : 0) - (r % 2 ? 0 : 0);
      l.append(h('i', { class: 'brick', style: { left: x + '%', top: 26 + r * 9 + '%', width: W + '%', '--rot': rnd(-70, 70) + 'deg', '--fall': rnd(40, 75) + 'vh', '--x': rnd(-30, 30) + 'px', animationDelay: 0.55 + c * 0.07 + (ROWS - r) * 0.03 + 's' } }));
    }
    for (let i = 0; i < 9; i++) l.append(h('i', { class: 'dust', style: { left: pct(5, 90), animationDelay: 0.9 + rnd(0, 0.6) + 's' } }, '💨'));
    document.body.classList.add('quake'); setTimeout(() => document.body.classList.remove('quake'), 1700);
    sfx.crash(); return 3000;
  },
  army(l) {
    const troop = ['🛡️', '⚔️', '🏹', '🛡️', '⚔️', '🛡️', '⚔️', '🏹'];
    l.append(h('i', { class: 'march flag', style: { animationDelay: '0s', bottom: '24%' } }, '🚩'));
    troop.forEach((g, i) => l.append(h('i', { class: 'march', style: { animationDelay: 0.22 + i * 0.16 + 's', bottom: 18 + (i % 3) * 5 + '%' } }, g)));
    l.append(h('div', { class: 'army-dust' }));
    sfx.march(); return 3200;
  },
  crowd(l) {
    drift(l, [''], 30, 'fall sq', { dur: [1.4, 2.4], delay: [0, 0.8], size: [10, 16] });
    [...l.children].forEach((e, i) => { e.style.background = ['#ff3d8b', '#ffe14a', '#2effd2', '#6d7bff'][i % 4]; });
    drift(l, ['👏', '🎉', '👏'], 12, 'rise', { size: [26, 40], delay: [0.1, 1] });
    l.append(h('div', { class: 'beam b1' }), h('div', { class: 'beam b2' }));
    sfx.crowd(); return 3000;
  },
};

// הצגה במסך מלא. לא יותר מפעם ב-3.5 שניות (אחרת זה מציק), אלא אם force.
let lastShow = 0;
export function playShow(key, p = {}, { force = false } = {}) {
  const now = Date.now();
  if (!force && now - lastShow < 3500) return false;
  lastShow = now;
  const l = h('div', { class: 'fxshow' });
  document.body.append(l);
  const ms = (SHOWS[key] || SHOWS.confetti)(l, p);
  setTimeout(() => l.remove(), ms + 200);
  return true;
}

// ---- בועת אימוג׳י מונפש (דמות + אימוג׳י + צליל) ----
let lastEmoteSnd = 0;
export function emoteBubble(host, item, { avatarItem = null, inline = false } = {}) {
  const p = item.p;
  const bubble = h('div', { class: 'react-bubble' + (inline ? ' inline' : '') },
    avatarItem && h('div', { class: 'rb-av', html: art(avatarItem, 44) }),
    h('div', { class: 'rb-msg' }, h('span', { class: 'em em-' + (p.anim || 'pop'), html: art(item, 34) })));
  host.append(bubble);
  const now = Date.now();
  if (p.snd && sfx[p.snd] && now - lastEmoteSnd > 900) { lastEmoteSnd = now; sfx[p.snd](); }
  setTimeout(() => bubble.remove(), 1700);
  return bubble;
}

// ---- זנב לכדור ----
// מחזיר פונקציית עצירה. host = אלמנט שממוקם בו (position: relative), ball = הכדור.
export function startTrail(host, ball, item) {
  const p = item && item.p;
  if (!p || !p.colors) return () => {};
  let n = 0;
  const id = setInterval(() => {
    const b = ball.getBoundingClientRect(), r = host.getBoundingClientRect();
    const dot = h('i', { class: 'trail-p' + (p.glyph ? ' gl' : ''), style: { left: b.left + b.width / 2 - r.left + 'px', top: b.top + b.height / 2 - r.top + 'px', background: p.glyph ? 'none' : p.colors[n % p.colors.length] } }, p.glyph || '');
    host.append(dot); n++;
    setTimeout(() => dot.remove(), 750);
  }, 40);
  return () => clearInterval(id);
}

// ---- הדגמה (בתצוגה המקדימה בפס הקרב): מנסים פריט לפני שמרוויחים אותו ----
export function demo(item, host, avatarItem) {
  if (item.type === 'fx') return playShow(item.p.show || 'confetti', item.p, { force: true });
  if (item.type === 'emote') return emoteBubble(host, item, { avatarItem, inline: true });
  if (item.type === 'trail') {
    const ball = h('div', { class: 'demo-ball' }, '⚽');
    host.append(ball);
    const stop = startTrail(host, ball, item);
    requestAnimationFrame(() => { ball.classList.add('go'); });
    setTimeout(() => { stop(); ball.remove(); }, 1300);
    return true;
  }
  return false;
}
