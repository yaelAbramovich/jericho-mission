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
