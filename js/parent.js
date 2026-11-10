// מצב הורה: קוד PIN, הקלטת קריינות לכל מסך סיפור, גיבוי וייבוא, ותסריט להדפסה.
import * as State from './state.js';
import { CHAPTERS, OVERVIEW, hebNum } from './content.js';
const ALL = [OVERVIEW, ...CHAPTERS];
const chapterOf = n => ALL.find(c => c.n === n);
const chLabel = n => n === 0 ? 'הסיפור בקצרה' : `פרק ${hebNum(n)}׳`;
import { h, modal, toast, plain } from './ui.js';
import { sfx, playBlob, stopPlayback } from './audio.js';
import { putRec, getRec, delRec, recIds, exportAll, importAll } from './db.js';
import { recKey } from './story.js';
import { go } from './app.js';

async function hash(pin) {
  const s = 'jericho|' + pin;
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) { let x = 5381; for (const c of s) x = ((x << 5) + x + c.charCodeAt(0)) >>> 0; return 'f' + x; }
}

export function render(v, _p, sc) {
  sc.onDispose(stopPlayback);
  v.append(h('button', { class: 'back', onclick: () => go('profile') }, '→ חזרה'));
  const body = h('div', { class: 'parent' });
  v.append(body);
  const s = State.get();
  if (!s.pinHash) pinPad(body, 'יצירת קוד הורה (4 ספרות)', async pin => {
    pinPad(body, 'הקלידו שוב לאישור', async pin2 => {
      if (pin !== pin2) { sfx.wrong(); toast('הקודים לא זהים'); return render0(); }
      s.pinHash = await hash(pin); State.save(); dash(body, sc);
    });
  });
  else pinPad(body, 'הקלידו קוד הורה', async pin => {
    if (await hash(pin) === s.pinHash) { sfx.correct(); dash(body, sc); }
    else { sfx.wrong(); toast('קוד שגוי'); render0(); }
  });
  function render0() { v.innerHTML = ''; render(v, _p, sc); }
}

function pinPad(root, title, onDone) {
  root.innerHTML = '';
  let val = '';
  const dots = h('div', { class: 'pin-dots' }, [0, 1, 2, 3].map(() => h('i')));
  const upd = () => dots.childNodes.forEach((d, i) => d.classList.toggle('on', i < val.length));
  const key = k => h('button', { class: 'key', onclick: () => {
    sfx.tap();
    if (k === '⌫') val = val.slice(0, -1); else if (val.length < 4) val += k;
    upd(); if (val.length === 4) setTimeout(() => onDone(val), 120);
  } }, k);
  root.append(h('div', { class: 'pin' }, h('h3', {}, '🔒 ' + title), dots,
    h('div', { class: 'keypad' }, ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(k => k ? key(k) : h('span')))));
}

async function dash(root, sc) {
  root.innerHTML = '';
  let ch = 0, ids = new Set();
  try { ids = await recIds(); } catch (e) { root.append(h('p', { class: 'warn' }, 'לא ניתן לגשת לאחסון ההקלטות במכשיר הזה.')); }
  let recording = null; // { stop }
  const total = ALL.reduce((a, c) => a + c.story.length, 0);

  const head = h('div', { class: 'p-head' });
  const tabs = h('div', { class: 'chips' });
  const list = h('div', { class: 'p-list' });
  root.append(h('h2', {}, 'מצב הורה'), head,
    h('p', { class: 'sub' }, 'ההקלטות נשמרות במכשיר הזה בלבד. חשוב להקליט בתוך האפליקציה המותקנת במסך הבית.'),
    tabs, list,
    h('div', { class: 'p-tools' },
      h('button', { class: 'btn', onclick: doExport }, '💾 ייצוא הקלטות (גיבוי)'),
      h('button', { class: 'btn', onclick: () => fileIn.click() }, '📥 ייבוא הקלטות'),
      h('button', { class: 'btn', onclick: printScript }, '🖨️ תסריט להדפסה'),
      h('button', { class: 'btn ghost', onclick: changePin }, 'שינוי קוד')));
  const fileIn = h('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' }, onchange: async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const n = await importAll(f); ids = await recIds(); toast(`יובאו ${n} הקלטות`); paint(); } catch (err) { toast('הקובץ לא תקין'); }
    e.target.value = '';
  } });
  root.append(fileIn);

  function paint() {
    head.innerHTML = '';
    const missing = total - [...ids].filter(id => /^ch\d-\d+$/.test(id)).length;
    head.append(h('div', { class: 'p-stat' }, missing ? `חסרות הקלטות ל-${missing} מסכים (מתוך ${total})` : '✓ כל המסכים מוקלטים!'));
    tabs.innerHTML = '';
    ALL.forEach(c => {
      const done = c.story.filter((_, i) => ids.has(recKey(c.n, i))).length;
      tabs.append(h('button', { class: 'chip' + (c.n === ch ? ' on' : ''), onclick: () => { ch = c.n; paint(); } }, chLabel(c.n) + ' ', h('small', {}, `${done}/${c.story.length}`)));
    });
    list.innerHTML = '';
    chapterOf(ch).story.forEach((s, i) => {
      const id = recKey(ch, i), has = ids.has(id), isRec = recording && recording.id === id;
      const row = h('div', { class: 'p-row' + (has ? ' has' : '') },
        h('div', { class: 'p-num' }, String(i + 1), h('small', {}, has ? '✓' : 'חסר')),
        h('p', { class: 'p-text' }, plain(s.text)),
        h('div', { class: 'p-btns' },
          isRec ? h('button', { class: 'btn rec-on', onclick: () => recording.stop() }, '⏹ סיים ', h('span', { class: 'rt' }, '0:00'))
            : h('button', { class: 'btn ' + (has ? '' : 'primary'), disabled: !!recording, onclick: () => startRec(id) }, has ? '↻ הקלט מחדש' : '🎙 הקלט'),
          has && !isRec && h('button', { class: 'btn', onclick: () => playRec(id) }, '▶'),
          has && !isRec && h('button', { class: 'btn ghost', onclick: () => delOne(id) }, '🗑')));
      list.append(row);
    });
  }

  async function playRec(id) { const r = await getRec(id); if (r) playBlob(r.blob); }
  async function delOne(id) {
    const m = modal([h('h3', {}, 'למחוק את ההקלטה?'), h('div', { class: 'row' },
      h('button', { class: 'btn primary', onclick: async () => { await delRec(id); ids.delete(id); m.close(); paint(); } }, 'מחק'),
      h('button', { class: 'btn ghost', onclick: () => m.close() }, 'ביטול'))]);
  }

  async function startRec(id) {
    stopPlayback();
    if (!navigator.mediaDevices || !window.MediaRecorder) { toast('ההקלטה לא נתמכת בדפדפן הזה'); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { toast('אין הרשאה למיקרופון. אשרו בהגדרות הדפדפן.', 3500); return; }
    const type = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(t => MediaRecorder.isTypeSupported(t)) || '';
    const mr = type ? new MediaRecorder(stream, { mimeType: type }) : new MediaRecorder(stream);
    const chunks = []; let t0 = Date.now(), timer;
    mr.ondataavailable = e => e.data.size && chunks.push(e.data);
    mr.onstop = async () => {
      clearInterval(timer);
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunks, { type: mr.mimeType || type || 'audio/mp4' });
      recording = null;
      if (blob.size < 800) { toast('ההקלטה ריקה, נסו שוב'); return paint(); }
      try { await putRec(id, blob); ids.add(id); sfx.correct(); toast('נשמר ✓'); } catch (e) { toast('שמירה נכשלה'); }
      paint();
      playBlob(blob);
    };
    recording = { id, stop: () => mr.stop() };
    mr.start();
    paint();
    timer = setInterval(() => {
      const el = list.querySelector('.rt'); if (!el) return;
      const s = Math.floor((Date.now() - t0) / 1000); el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }, 500);
    sc.onDispose(() => { try { if (mr.state !== 'inactive') mr.stop(); } catch (e) {} });
  }

  async function doExport() {
    try {
      const blob = await exportAll();
      const file = new File([blob], `jericho-recordings-${State.dayStr()}.json`, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'גיבוי הקלטות' }); }
      else {
        const a = h('a', { href: URL.createObjectURL(blob), download: file.name }); document.body.append(a); a.click(); a.remove();
      }
    } catch (e) { if (e && e.name !== 'AbortError') toast('הייצוא נכשל'); }
  }

  function printScript() {
    const area = document.getElementById('print-area');
    area.innerHTML = '';
    area.append(h('h1', {}, 'תסריט הקראה – מבצע יריחו'));
    ALL.forEach(c => {
      area.append(h('h2', {}, `${c.n === 0 ? '' : 'פרק ' + hebNum(c.n) + '׳ – '}${c.title}`));
      c.story.forEach((s, i) => area.append(h('p', {}, h('b', {}, `${i + 1}. `), plain(s.text), s.cast ? ' ' + s.cast.map(([n, d]) => `${n}: ${d}.`).join(' ') : '', s.verse ? ` (פסוק: ${s.verse.t})` : '')));
    });
    document.body.classList.add('printing');
    setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove('printing'), 500); }, 100);
  }

  function changePin() {
    const s = State.get(); s.pinHash = null; State.save();
    toast('הגדירו קוד חדש');
    go('parent');
  }
  paint();
}
