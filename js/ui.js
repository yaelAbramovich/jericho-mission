// עזרים כלליים: בניית אלמנטים, תזמון עם ניקוי, חלוניות, אפקטים.
import { GLOSSARY } from './content.js';
import { sfx } from './audio.js';

export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') {
      // משתני CSS (--dx וכו') חייבים setProperty; השמה רגילה (Object.assign) מתעלמת מהם בשקט
      for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv; }
    }
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(kid));
  return el;
}
// רשת ביטחון: append(false / null / undefined) מדפיס את המילה "false" / "null" על המסך (קרה כבר כמה פעמים:
// למשל  append(!isKid && h(...))  בתור של הילד). כאן מתעלמים מערכים כאלה; בבדיקות האוטומטיות (window.__strictAppend)
// זורקים שגיאה, כדי שהטעות בקוד תתגלה ולא תוסתר.
if (typeof Element !== 'undefined') {
  const bad = k => k === false || k == null;
  for (const proto of [Element.prototype, DocumentFragment.prototype]) for (const fn of ['append', 'prepend', 'replaceChildren']) {
    const orig = proto[fn];
    proto[fn] = function (...kids) {
      if (kids.some(bad)) { if (window.__strictAppend) throw new Error(`${fn}() קיבל ${String(kids.find(bad))} במקום אלמנט`); kids = kids.filter(k => !bad(k)); }
      return orig.apply(this, kids);
    };
  }
}
export const $ = (s, r = document) => r.querySelector(s);
export const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const sample = (a, n) => shuffle(a).slice(0, n);

// scope: טיימרים ומאזינים שמתנקים כשעוברים מסך
export function createScope() {
  const timers = [], cleanups = [];
  let dead = false;
  return {
    get dead() { return dead; },
    later(fn, ms) { const t = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(t); return t; },
    every(fn, ms) { const t = setInterval(() => { if (!dead) fn(); }, ms); timers.push(t); return t; },
    sleep(ms) { return new Promise(r => this.later(r, ms)); },
    onDispose(fn) { cleanups.push(fn); },
    dispose() { dead = true; timers.forEach(t => { clearTimeout(t); clearInterval(t); }); cleanups.forEach(f => { try { f(); } catch (e) {} }); },
  };
}

// ---- חלוניות ----
const overlay = () => document.getElementById('overlay');
export function modal(content, { onClose, cls = '' } = {}) {
  const box = h('div', { class: 'modal ' + cls }, content);
  const wrap = h('div', { class: 'modal-wrap', onclick: e => { if (e.target === wrap) close(); } }, box);
  function close() { wrap.remove(); onClose && onClose(); }
  overlay().append(wrap);
  return { close, box };
}
export function termPopup(key) {
  const g = GLOSSARY[key]; if (!g) return;
  sfx.pick();
  const m = modal([
    h('div', { class: 'tag' }, 'מושג'),
    h('h3', {}, g.term),
    h('p', {}, g.text),
    h('button', { class: 'btn primary', onclick: () => m.close() }, 'הבנתי'),
  ]);
}
export function toast(msg, ms = 2200) {
  const t = h('div', { class: 'toast' }, msg);
  overlay().append(t);
  setTimeout(() => t.remove(), ms);
}

// ---- אפקטים ----
export function burst(parent, n = 22, colors = ['#2effd2', '#ffe14a', '#ff4d9d', '#6d7bff'], glyph = null) {
  const box = h('div', { class: 'burst' });
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 140;
    const st = { '--dx': Math.cos(a) * d + 'px', '--dy': Math.sin(a) * d + 'px', animationDelay: Math.random() * .1 + 's' };
    // חלק מהחלקיקים הם סמל (🔥 ⭐ ⚡), השאר קונפטי צבעוני
    if (glyph && i % 3 === 0) box.append(h('i', { class: 'gl', style: st }, glyph));
    else box.append(h('i', { style: { ...st, background: colors[i % colors.length] } }));
  }
  parent.append(box); setTimeout(() => box.remove(), 1400);
}
export function floatText(parent, text, cls = '') {
  const t = h('div', { class: 'float-text ' + cls }, text);
  parent.append(t); setTimeout(() => t.remove(), 1100);
}
// פרסור תגיות בטקסט: [[מילה|מפתח]] ו-{{מילה מנחה}}
export function richText(str) {
  const frag = document.createDocumentFragment();
  const re = /\[\[(.+?)\|(\w+)\]\]|\{\{(.+?)\}\}/g;
  let last = 0, m;
  while ((m = re.exec(str))) {
    if (m.index > last) frag.append(str.slice(last, m.index));
    if (m[1]) { const key = m[2]; frag.append(h('button', { class: 'hard', onclick: () => termPopup(key) }, m[1])); }
    else frag.append(h('span', { class: 'lead' }, m[3]));
    last = re.lastIndex;
  }
  if (last < str.length) frag.append(str.slice(last));
  return frag;
}
export const plain = s => s.replace(/\[\[(.+?)\|\w+\]\]/g, '$1').replace(/\{\{(.+?)\}\}/g, '$1');
