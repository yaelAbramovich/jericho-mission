// מנוע שיעורים אינטראקטיביים (ללשונית "למבחן"): סדרת שלבים עם התקדמות, כפתור "הבא" שנפתח רק אחרי שמסיימים משימה,
// חגיגה בסוף ו-XP בפעם הראשונה. השלבים עצמם מגיעים מהחבילה: PACK.lessons[id].steps, ו-PACK.lessonKinds[kind](step, api).
import * as State from './state.js';
import { PACK } from './subjects/index.js';
import { h } from './ui.js';
import { sfx } from './audio.js';
import { celebrate } from './react.js';
import { go } from './app.js';

export const lessonDone = id => !!(State.sub().lessons || {})[id];
export function markLessonDone(id) { const s = State.sub(); s.lessons = s.lessons || {}; const first = !s.lessons[id]; s.lessons[id] = Date.now(); State.save(); return first; }

export async function render(v, { id, topic }, sc) {
  const L = PACK.lessons && PACK.lessons[id];
  if (!L) return go('focus');
  const KINDS = (await import(`./subjects/${PACK.lessonKit}`)).KINDS;   // טעינה בעצלות (kit.js תלוי ב-ui.js, ולכן לא נטען מתוך החבילה)
  if (sc.dead) return;
  const total = L.steps.length; let i = 0, ready = false, mistakes = 0;
  const back = () => go(topic ? 'topic' : 'focus', topic ? { id: topic } : {});
  const dots = h('div', { class: 'dots' });
  const stage = h('div', { class: 'lesson-stage' });
  const next = h('button', { class: 'btn primary nav', disabled: true, onclick: () => { if (ready) { sfx.tap(); go_(i + 1); } } }, 'הבא ◀');
  const prev = h('button', { class: 'btn ghost nav', onclick: () => { sfx.tap(); go_(i - 1); } }, '▶ הקודם');
  v.append(
    h('div', { class: 'story-head' }, h('small', {}, `${L.icon} שיעור אינטראקטיבי`), h('h2', {}, L.title)),
    h('div', { class: 'story-top' }, h('button', { class: 'back', onclick: back }, '✕'), dots),
    stage, h('div', { class: 'lesson-ctrl story-ctrl' }, prev, next));

  function go_(n) {
    if (n < 0) return;
    if (n >= total) return finish();
    i = n; ready = false; next.disabled = true; prev.disabled = i === 0;
    next.textContent = i === total - 1 ? 'סיום ✓' : 'הבא ◀';
    dots.replaceChildren(...L.steps.map((_, k) => h('i', { class: k === i ? 'on' : k < i ? 'done' : '' })));
    const api = {
      host: stage, sc,
      done: () => { if (ready) return; ready = true; next.disabled = false; next.classList.add('glow'); if (!stage.querySelector('.say-step')) sfx.capture(); },
      win: () => {}, lose: () => { mistakes++; },
    };
    next.classList.remove('glow');
    const el = KINDS[L.steps[i].kind](L.steps[i], api);
    stage.replaceChildren(el); stage.scrollTop = 0; stage.__solve = el.__solve;
    window.scrollTo && window.scrollTo(0, 0); const sc2 = document.getElementById('screen'); if (sc2) sc2.scrollTop = 0;
  }

  function finish() {
    const first = markLessonDone(id), xp = first ? (L.xp || 40) : 0;
    if (xp) State.addXP(xp);
    sfx.goal(); celebrate(stage, 40, true);
    document.querySelector('.lesson-ctrl').remove();
    stage.replaceChildren(h('div', { class: 'step lesson-end' },
      h('div', { class: 'lhero' }, '🏆'), h('h3', {}, 'סיימתם את השיעור!'),
      h('p', { class: 'say' }, mistakes ? `עשיתם ${mistakes} טעויות בדרך – ככה לומדים. הפעם אתם כבר מומחים!` : 'בלי אף טעות! אתם מומחים!'),
      xp ? h('div', { class: 'lesson-xp' }, `\u200E+${xp} XP`) : h('p', { class: 'sub' }, 'כבר קיבלתם XP על השיעור הזה – אפשר לחזור ולתרגל בכיף.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', onclick: () => go('games') }, '⚽ לתרגל במשחקים'),
        h('button', { class: 'btn', onclick: back }, 'חזרה לנושא'))));
    dots.replaceChildren(...L.steps.map(() => h('i', { class: 'done' })));
  }
  go_(0);
}
