// מסכי "למבחן": רשימת נושאים, ודף קריאה לנושא (טקסט ממוקד למבחן).
import { TOPICS } from './focus-content.js';
import { h } from './ui.js';
import { sfx } from './audio.js';
import { go } from './app.js';

const bold = s => {           // **מודגש** -> <b>
  const frag = document.createDocumentFragment();
  s.split('**').forEach((part, i) => { if (part) frag.append(i % 2 ? h('b', {}, part) : part); });
  return frag;
};

export function list(v) {
  v.append(
    h('h2', { class: 'sec' }, '🎯 למבחן'),
    h('p', { class: 'sub' }, 'כל מה שחשוב לדעת למבחן. לוחצים על נושא וקוראים.'));
  const box = h('div', { class: 'topics' });
  TOPICS.forEach(t => box.append(
    h('button', { class: 'topic-btn', onclick: () => { sfx.pick(); go('topic', { id: t.id }); } },
      h('small', {}, t.label), h('b', {}, t.title), h('span', {}, '◀'))));
  v.append(box);
}

export function topic(v, { id }) {
  const t = TOPICS.find(x => x.id === id);
  if (!t) return go('focus');
  const toc = h('div', { class: 'chips toc' });
  const doc = h('div', { class: 'doc' });
  v.append(
    h('button', { class: 'back', onclick: () => go('focus') }, '→ חזרה לנושאים'),
    h('div', { class: 'doc-head' }, h('small', {}, t.label), h('h2', {}, t.title)),
    toc, doc);
  let list = null;
  t.blocks.forEach((b, i) => {
    if (b.h) {
      const el = h('h3', { class: 'doc-h' }, b.h.replace(/^(\d+)\./, '$1\u200E.'));
      doc.append(el);
      toc.append(h('button', { class: 'chip', onclick: () => { sfx.tap(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, b.h.replace(/^\d+\.\s*/, '').replace(/[🎯📜🤝🔍🗺️🎬]/gu, '').trim().slice(0, 22)));
    }
    else if (b.sh) doc.append(h('h4', { class: 'doc-sh' }, b.sh));
    else if (b.p) doc.append(h('p', { class: 'doc-p' }, bold(b.p)));
    else if (b.q) doc.append(h('blockquote', { class: 'verse-box doc-q' }, h('q', {}, b.q.replace(/^"|"$/g, ''))));
    else if (b.say) doc.append(h('p', { class: 'doc-say' }, bold(b.say)));
    else if (b.big) doc.append(h('div', { class: 'doc-big' }, b.big));
    else if (b.note) doc.append(h('div', { class: 'doc-note' }, bold(b.note)));
    else if (b.answer) doc.append(h('div', { class: 'doc-answer' }, h('b', {}, '✅ התשובה למבחן:'), h('span', {}, b.answer)));
    else if (b.ul || b.ol) doc.append(h(b.ul ? 'ul' : 'ol', { class: 'doc-list' }, (b.ul || b.ol).map(x => h('li', {}, bold(x)))));
  });
}
