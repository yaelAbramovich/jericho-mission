// צלילים שנוצרים ב-Web Audio (בלי קבצים חיצוניים) + השמעת הקלטות הסיפור.
import * as State from './state.js';

let ctx = null, master = null;
export function unlock() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) {}
}

function tone(f, dur, { type = 'sine', vol = 0.3, at = 0, slide = null } = {}) {
  if (!ctx || State.get().muted) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, { vol = 0.2, at = 0, from = 800, to = 800, q = 0.8 } = {}) {
  if (!ctx || State.get().muted) return;
  const t = ctx.currentTime + at;
  const n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource(); s.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q;
  f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t);
}

export const sfx = {
  tap() { tone(520, 0.06, { type: 'triangle', vol: 0.15 }); },
  pick() { tone(660, 0.07, { type: 'triangle', vol: 0.18 }); },
  correct() { [523, 659, 784].forEach((f, i) => tone(f, 0.16, { type: 'triangle', vol: 0.25, at: i * 0.07 })); },
  wrong() { tone(280, 0.25, { type: 'sine', vol: 0.22, slide: 180 }); },
  swipe() { noise(0.16, { vol: 0.18, from: 400, to: 2200 }); },
  tick() { tone(900, 0.03, { type: 'square', vol: 0.06 }); },
  whistle() { tone(2300, 0.28, { type: 'sine', vol: 0.18, slide: 2100 }); tone(2350, 0.2, { type: 'sine', vol: 0.12, at: 0.32 }); },
  kick() { noise(0.09, { vol: 0.35, from: 200, to: 90, q: 0.5 }); tone(130, 0.12, { type: 'sine', vol: 0.4, slide: 60 }); },
  goal() { sfx.kick(); noise(1.2, { vol: 0.28, at: 0.25, from: 700, to: 1500, q: 0.4 }); [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { type: 'triangle', vol: 0.22, at: 0.3 + i * 0.09 })); },
  almost() { sfx.kick(); noise(0.5, { vol: 0.18, at: 0.25, from: 500, to: 300 }); tone(420, 0.2, { type: 'triangle', vol: 0.2, at: 0.35 }); tone(630, 0.25, { type: 'triangle', vol: 0.2, at: 0.5 }); },
  save() { sfx.kick(); noise(0.15, { vol: 0.35, at: 0.25, from: 300, to: 150 }); tone(200, 0.3, { type: 'sine', vol: 0.25, at: 0.3, slide: 120 }); },
  combo() { tone(880, 0.1, { type: 'square', vol: 0.1 }); tone(1320, 0.12, { type: 'square', vol: 0.1, at: 0.08 }); },
  tierUp() { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, { type: 'sawtooth', vol: 0.12, at: i * 0.1 })); },
  storm() { noise(0.9, { vol: 0.25, from: 200, to: 80, q: 0.3 }); },
  capture() { [330, 440, 554, 659, 880].forEach((f, i) => tone(f, 0.35, { type: 'triangle', vol: 0.25, at: i * 0.12 })); },

  // ---- צלילי חגיגה "אפיים" (לתצוגות המסך המלא, לאימוג׳י המונפש ולפרסים) ----
  // תקיעה בשופר: ציוץ קצר עולה ואז תקיעה ארוכה עם רטט, ובתוכה נשימה
  shofar() {
    tone(150, 0.35, { type: 'sawtooth', vol: 0.2, slide: 235 }); tone(300, 0.35, { type: 'square', vol: 0.05, slide: 470 });
    tone(235, 1.4, { type: 'sawtooth', vol: 0.24, at: 0.38, slide: 250 }); tone(470, 1.4, { type: 'square', vol: 0.06, at: 0.38, slide: 500 });
    tone(118, 1.4, { type: 'sine', vol: 0.2, at: 0.38 }); noise(1.6, { vol: 0.1, at: 0.3, from: 700, to: 1400, q: 0.3 });
  },
  fanfare() { [392, 392, 392, 523, 659, 784].forEach((f, i) => tone(f, i === 5 ? 0.7 : 0.16, { type: 'sawtooth', vol: 0.13, at: i * 0.13 })); tone(1047, 0.9, { type: 'triangle', vol: 0.1, at: 0.78 }); },
  crowd() { noise(2, { vol: 0.32, from: 450, to: 1100, q: 0.35 }); noise(1.8, { vol: 0.2, at: 0.15, from: 1300, to: 700, q: 0.4 }); [0.2, 0.5, 0.75, 1.0, 1.2, 1.45].forEach(t => noise(0.05, { vol: 0.25, at: t, from: 2500, to: 1500, q: 0.6 })); },
  // חומות נופלות: חבטה עמוקה, שאגת אבנים, ופירורים
  crash() {
    tone(85, 0.9, { type: 'sine', vol: 0.55, slide: 38 }); noise(1, { vol: 0.5, from: 1600, to: 180, q: 0.3 }); noise(1.6, { vol: 0.32, at: 0.2, from: 320, to: 80, q: 0.2 });
    [0.5, 0.7, 0.85, 1.1, 1.3].forEach(t => noise(0.07, { vol: 0.22, at: t, from: 1200, to: 500, q: 0.7 }));
  },
  thunder() { noise(0.14, { vol: 0.5, from: 4200, to: 900, q: 0.6 }); noise(2, { vol: 0.42, at: 0.1, from: 260, to: 55, q: 0.25 }); tone(60, 1.4, { type: 'sine', vol: 0.4, at: 0.1, slide: 32 }); },
  march() { [0, 0.32, 0.64, 0.96, 1.28, 1.6].forEach((t, i) => { tone(i % 2 ? 80 : 100, 0.14, { type: 'sine', vol: 0.5, at: t, slide: 45 }); noise(0.06, { vol: 0.18, at: t + 0.16, from: 1800, to: 900, q: 0.6 }); }); },
  boom() { tone(70, 0.55, { type: 'sine', vol: 0.6, slide: 32 }); noise(0.35, { vol: 0.4, from: 900, to: 120, q: 0.3 }); },
  whoosh() { noise(0.6, { vol: 0.28, from: 250, to: 3200, q: 0.5 }); },
  sparkle() { [1319, 1568, 1976, 2349, 2637].forEach((f, i) => tone(f, 0.16, { type: 'triangle', vol: 0.13, at: i * 0.06 })); },
  roar() { tone(105, 1, { type: 'sawtooth', vol: 0.3, slide: 62 }); tone(160, 1, { type: 'square', vol: 0.09, slide: 90 }); noise(1, { vol: 0.28, from: 300, to: 900, q: 0.4 }); },
  ding() { tone(1568, 0.5, { type: 'sine', vol: 0.2 }); tone(2093, 0.6, { type: 'sine', vol: 0.14, at: 0.08 }); },
  coin() { tone(1319, 0.07, { type: 'square', vol: 0.1 }); tone(1760, 0.2, { type: 'square', vol: 0.1, at: 0.07 }); },
  flame() { noise(1.1, { vol: 0.28, from: 700, to: 220, q: 0.3 }); [0.2, 0.45, 0.7].forEach(t => noise(0.05, { vol: 0.2, at: t, from: 2000, to: 1000, q: 0.7 })); },
  fireworks() { [0, 0.55, 1.1, 1.6].forEach(t => { tone(300, 0.35, { type: 'sine', vol: 0.12, at: t, slide: 1400 }); tone(70, 0.5, { type: 'sine', vol: 0.5, at: t + 0.32, slide: 32 }); noise(0.5, { vol: 0.3, at: t + 0.32, from: 3000, to: 800, q: 0.4 }); }); },
};

// ---- השמעת הקלטות סיפור: אלמנט Audio יחיד (כדי ש-iOS ישאיר אותו "פתוח" אחרי נגיעה ראשונה) ----
const player = new Audio();
player.preload = 'auto';
let curUrl = null;
export function playBlob(blob, onend) {
  stopPlayback();
  curUrl = URL.createObjectURL(blob);
  player.src = curUrl;
  player.onended = () => { onend && onend(); };
  const p = player.play();
  if (p && p.catch) p.catch(() => { onend && onend(); });
}
export function stopPlayback() {
  try { player.pause(); player.onended = null; } catch (e) {}
  if (curUrl) { URL.revokeObjectURL(curUrl); curUrl = null; }
}
export const isPlaying = () => !player.paused && !player.ended;
