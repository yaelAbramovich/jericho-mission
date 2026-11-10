// דו-קרב משפחתי: ילד נגד הורה על טלפון אחד. תור ההורה: הילד שואל, שומע את התשובה ושופט.
import * as State from '../state.js';
import { DUELS } from '../duel-content.js';
import { h, shuffle, sample, floatText, burst } from '../ui.js';
import { sfx } from '../audio.js';
import { waitClick } from './common.js';

const LET = ['א', 'ב', 'ג', 'ד'];

export async function run(el, { topic = 'j1' }, sc) {
  const D = DUELS[topic];
  const S = State.get();
  const names = (S.names = S.names || { kid: '', parent: '' });

  // ---- הגדרה ----
  const kidIn = h('input', { class: 'inp', placeholder: 'שם הילד', value: names.kid || '', maxlength: 14 });
  const parIn = h('input', { class: 'inp', placeholder: 'שם ההורה', value: names.parent || '', maxlength: 14 });
  const go = h('button', { class: 'btn primary glow' }, 'מתחילים! ⚔️');
  el.append(h('div', { class: 'duel-setup' },
    h('h2', {}, '⚔️ דו-קרב משפחתי'), h('p', { class: 'sub' }, D.title),
    h('div', { class: 'rules' },
      h('p', {}, '🎯 ', h('b', {}, `${D.ideas.length} נושאים.`), ' בכל נושא כרטיס קצר, ואחריו שאלה לכל אחד.'),
      h('p', {}, '🎮 בתור של הילד – הוא לוחץ על התשובה.'),
      h('p', {}, '🧑‍⚖️ בתור של ההורה – הילד קורא את השאלה בקול, שומע את התשובה ולוחץ עליה.'),
      h('p', {}, '⚽ כל תשובה נכונה = גול. טעות לא מורידה כלום.')),
    kidIn, parIn, go));
  await waitClick(go, sc);
  const kid = (kidIn.value.trim() || 'אלוף').slice(0, 14), par = (parIn.value.trim() || 'הורה').slice(0, 14);
  names.kid = kidIn.value.trim(); names.parent = parIn.value.trim(); State.save();

  // ---- משחק ----
  let kg = 0, pg = 0, xp = 10, kidRight = 0;
  const missed = [];
  const sb = h('div', { class: 'duel-score' });
  const paintScore = () => { sb.replaceChildren(h('div', { class: 'ds kid' }, h('small', {}, kid), h('b', {}, String(kg))), h('div', { class: 'dvs' }, '⚽'), h('div', { class: 'ds par' }, h('small', {}, par), h('b', {}, String(pg)))); };
  const stage = h('div', { class: 'duel-stage' });
  el.replaceChildren(sb, stage); paintScore();

  for (let i = 0; i < D.ideas.length; i++) {
    const idea = D.ideas[i];
    // כרטיס נושא
    stage.innerHTML = '';
    const ok = h('button', { class: 'btn primary glow' }, 'הבנו – מתחילים ▶');
    sfx.whistle();
    stage.append(h('div', { class: 'idea-card' },
      h('small', {}, `נושא ${i + 1} מתוך ${D.ideas.length}`),
      h('h2', {}, `${idea.icon} ${idea.title}`),
      h('p', { class: 'idea-text' }, idea.text),
      idea.verse && h('blockquote', { class: 'verse-box' }, h('q', {}, idea.verse.t), h('cite', {}, idea.verse.ref)),
      h('p', { class: 'tip' }, `🎤 ${kid}, הקרא את הכרטיס ל${par} בקול`)), ok);
    await waitClick(ok, sc);

    // שתי שאלות: הפותח מתחלף בין נושאים
    const qs = sample(idea.qs, 2);
    const order = i % 2 === 0 ? ['kid', 'par'] : ['par', 'kid'];
    for (let k = 0; k < 2; k++) {
      const who = order[k], q = qs[k];
      stage.innerHTML = '';
      const isKid = who === 'kid';
      const opts = shuffle([q.a, ...q.w]);
      const btns = opts.map((t, n) => h('button', { class: 'opt', 'data-t': t }, h('span', { class: 'let' }, LET[n]), h('span', {}, t)));
      stage.append(
        h('div', { class: 'turn ' + who }, isKid ? `🎮 תור של ${kid}` : `🧑‍⚖️ תור של ${par}`),
        !isKid && h('p', { class: 'tip big' }, `${kid}: קרא את השאלה ואת התשובות ל${par}, ואז לחץ על מה ש${par} ענה/ענתה`),
        h('div', { class: 'quote-card' }, h('small', {}, idea.title), h('p', { class: 'meaning' }, q.q)),
        h('div', { class: 'opts' }, btns));
      const picked = await new Promise(res => btns.forEach(b => b.addEventListener('click', () => res(b.dataset.t), { once: true })));
      const right = picked === q.a;
      btns.forEach(b => { b.disabled = true; if (b.dataset.t === q.a) b.classList.add('right'); else if (b.dataset.t === picked) b.classList.add('wrong'); });
      if (right) { isKid ? kg++ : pg++; if (isKid) { kidRight++; xp += 8; } sfx.goal(); burst(stage, 16); floatText(stage, 'גוווול!', 'good'); }
      else { sfx.wrong(); missed.push(q); }
      if (!isKid) xp += 3;
      paintScore();
      const next = h('button', { class: 'btn primary' }, 'הבא ▶');
      stage.append(h('div', { class: 'fb ' + (right ? 'good' : 'bad') },
        h('p', {}, right ? `נכון! גול ל${isKid ? kid : par} ⚽` : 'לא נכון. התשובה הנכונה:'),
        !right && h('div', { class: 'loc small' }, q.a),
        h('small', { class: 'why' }, q.why),
        h('p', { class: 'tip' }, isKid ? '' : `🎤 ${kid}, הקרא את ההסבר ל${par}`)), next);
      await waitClick(next, sc);
    }
  }

  // ---- סיום ----
  const win = kg > pg ? kid : pg > kg ? par : null;
  const uniq = [...new Map(missed.map(q => [q.q, q])).values()].slice(0, 4);
  return {
    xp, correct: kidRight, total: D.ideas.length * 2, completed: true,
    title: win ? `ניצחון ל${win}! 🏆` : 'תיקו! 🤝',
    big: `${kg} – ${pg}`,
    lines: [`${kid}: ${kg} גולים · ${par}: ${pg} גולים`, ...(uniq.length ? ['כדאי לחזור על:'] : ['אף טעות! מושלם 🔥']), ...uniq.map(q => `${q.q} ← ${q.a}`)],
  };
}
