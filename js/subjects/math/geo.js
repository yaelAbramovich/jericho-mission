// גיאומטריה: ציור גופים ופריסות ב-SVG (פאונים, פירמידות, מנסרות, גליל, חרוט, כדור) ושלבי שיעור: explore, builder, sort.
// ספרייה ללא תלות ב-ui.js/subjects: נטענת רק מ-kit.js (שנטען בעצלות), לכן אין מעגל טעינה.
import { h, shuffle } from '../../ui.js';
import { sfx } from '../../audio.js';
import { celebrate } from '../../react.js';

const bold = s => { const f = document.createDocumentFragment(); String(s).split('**').forEach((p, i) => { if (p) f.append(i % 2 ? h('b', {}, p) : p); }); return f; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const f1 = x => Math.round(x * 10) / 10;

export const BASE = { 3: 'משולש', 4: 'מרובע', 5: 'מחומש', 6: 'משושה', 7: 'משובע', 8: 'מתומן' };
export const ADJ = { 3: 'משולשת', 4: 'מרובעת', 5: 'מחומשת', 6: 'משושה', 7: 'משובעת', 8: 'מתומנת' };
export const prismName = n => `מנסרה ${ADJ[n]}`;
export const pyramidName = n => `פירמידה ${ADJ[n]}`;
const COLORS = ['#ffd24a', '#35b8ff', '#ff6fa8', '#35e08a', '#b47cff', '#ff9a4a', '#7be0ff', '#e8ff6b', '#ff7a7a', '#6bffb0'];

// ---------- מודל תלת-ממדי ----------
// גוף = { v: [[x,y,z]...], f: [[אינדקסי קודקודים]...] }
export function model(type, n = 4) {
  const v = [], f = [], ring = (y, off = 0) => Array.from({ length: n }, (_, i) => { const a = off + 2 * Math.PI * i / n; return [Math.cos(a), y, Math.sin(a)]; });
  if (type === 'prism') {
    const H = 0.8; v.push(...ring(-H), ...ring(H));
    f.push(Array.from({ length: n }, (_, i) => i), Array.from({ length: n }, (_, i) => n + i));
    for (let i = 0; i < n; i++) f.push([i, (i + 1) % n, n + (i + 1) % n, n + i]);
  } else if (type === 'pyramid') {
    v.push(...ring(-0.75), [0, 1.05, 0]);
    f.push(Array.from({ length: n }, (_, i) => i));
    for (let i = 0; i < n; i++) f.push([i, (i + 1) % n, n]);
  } else if (type === 'box') {   // תיבה (מנסרה שבסיסה מלבן)
    const X = 1.1, Y = 0.7, Z = 0.75;
    for (const y of [-Y, Y]) for (const [x, z] of [[-X, -Z], [X, -Z], [X, Z], [-X, Z]]) v.push([x, y, z]);
    f.push([0, 1, 2, 3], [4, 5, 6, 7]);
    for (let i = 0; i < 4; i++) f.push([i, (i + 1) % 4, 4 + (i + 1) % 4, 4 + i]);
  }
  return { v, f };
}
export const counts = (type, n) => type === 'prism' ? { lat: n, faces: n + 2, edges: 3 * n, verts: 2 * n } : type === 'pyramid' ? { lat: n, faces: n + 1, edges: 2 * n, verts: n + 1 } : { lat: 4, faces: 6, edges: 12, verts: 8 };

const YAW = 0.62, PITCH = 0.5;
function project(p) {
  const x1 = p[0] * Math.cos(YAW) + p[2] * Math.sin(YAW), z1 = -p[0] * Math.sin(YAW) + p[2] * Math.cos(YAW);
  const y2 = p[1] * Math.cos(PITCH) - z1 * Math.sin(PITCH), z2 = p[1] * Math.sin(PITCH) + z1 * Math.cos(PITCH);
  return [x1, -y2, z2];
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// SVG של גוף. ברירת מחדל: קווים בלבד (הנסתרים מקווקווים), עם אלמנטים שאפשר להדגיש: .gf פאה, .ge צלע, .gv קודקוד
export function solidSVG(type, n = 4, { size = 200 } = {}) {
  const M = model(type, n), P = M.v.map(project), S = size * 0.36, cx = size / 2, cy = size / 2;
  const C = M.v.reduce((a, p) => [a[0] + p[0] / M.v.length, a[1] + p[1] / M.v.length, a[2] + p[2] / M.v.length], [0, 0, 0]);
  const X = P.map(p => [cx + p[0] * S, cy + p[1] * S + (type === 'pyramid' ? 4 : 0)]);
  const faceVis = M.f.map(face => {
    let nrm = [0, 0, 0]; for (let i = 0; i < face.length; i++) { const a = M.v[face[i]], b = M.v[face[(i + 1) % face.length]]; nrm = [nrm[0] + (a[1] - b[1]) * (a[2] + b[2]), nrm[1] + (a[2] - b[2]) * (a[0] + b[0]), nrm[2] + (a[0] - b[0]) * (a[1] + b[1])]; }
    const fc = face.reduce((a, i) => [a[0] + M.v[i][0] / face.length, a[1] + M.v[i][1] / face.length, a[2] + M.v[i][2] / face.length], [0, 0, 0]);
    if (dot(nrm, sub(fc, C)) < 0) nrm = nrm.map(x => -x);
    const t = project(nrm), o = project([0, 0, 0]);   // מסובבים את הנורמל באותה סיבוב
    return t[2] - o[2] > 1e-6;
  });
  const edges = new Map();
  M.f.forEach((face, fi) => face.forEach((a, i) => { const b = face[(i + 1) % face.length], k = Math.min(a, b) + '-' + Math.max(a, b); (edges.get(k) || edges.set(k, { a: Math.min(a, b), b: Math.max(a, b), fs: [] }).get(k)).fs.push(fi); }));
  const pts = idx => idx.map(i => X[i][0].toFixed(1) + ',' + X[i][1].toFixed(1)).join(' ');
  let faces = '', hid = '', vis = '', verts = '';
  M.f.forEach((face, i) => { faces += `<polygon class="gf${faceVis[i] ? '' : ' gback'}" data-i="${i}" style="--fc:${COLORS[i % COLORS.length]}" points="${pts(face)}"/>`; });
  [...edges.values()].forEach((e, i) => { const visible = e.fs.some(fi => faceVis[fi]), l = `<line class="ge${visible ? '' : ' hid'}" data-i="${i}" x1="${X[e.a][0].toFixed(1)}" y1="${X[e.a][1].toFixed(1)}" x2="${X[e.b][0].toFixed(1)}" y2="${X[e.b][1].toFixed(1)}"/>`; if (visible) vis += l; else hid += l; });
  X.forEach((p, i) => { verts += `<circle class="gv" data-i="${i}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5.5"/>`; });
  return `<svg class="geo-svg" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img">${faces}${hid}${vis}${verts}</svg>`;
}

// גופים עגולים (לא פאונים)
export function roundSVG(type, size = 200) {
  const c = size / 2, e = (cx, cy, rx, ry, cls = '') => `<ellipse class="gr ${cls}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
  let body = '';
  if (type === 'cylinder') body = `${e(c, 150, 52, 16, 'hid')}<path class="gr" d="M${c - 52} 50 V150 A52 16 0 0 0 ${c + 52} 150 V50"/>${e(c, 50, 52, 16)}`;
  else if (type === 'cone') body = `${e(c, 150, 62, 18, 'hid')}<path class="gr" d="M${c - 62} 150 L${c} 28 L${c + 62} 150 A62 18 0 0 1 ${c - 62} 150"/>`;
  else body = `<circle class="gr" cx="${c}" cy="${c}" r="62"/><ellipse class="gr hid" cx="${c}" cy="${c}" rx="62" ry="18"/>`;
  return `<svg class="geo-svg round" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img">${body}</svg>`;
}

// ---------- פריסות ----------
const polyPts = (cx, cy, R, n, a0) => Array.from({ length: n }, (_, k) => [cx + R * Math.cos(a0 + 2 * Math.PI * k / n), cy + R * Math.sin(a0 + 2 * Math.PI * k / n)]);
export function netSVG(type, n = 4, { size = 260 } = {}) {
  const polys = [], W = 40, H = 62;   // W = אורך צלע הבסיס
  const R = W / (2 * Math.sin(Math.PI / n)), apo = R * Math.cos(Math.PI / n);
  let circles = [];
  if (type === 'prism') {
    for (let i = 0; i < n; i++) polys.push({ p: [[i * W, 0], [(i + 1) * W, 0], [(i + 1) * W, H], [i * W, H]], c: 'lat' });
    const k0 = 0, k1 = Math.min(n - 1, 2);
    polys.push({ p: polyPts(k0 * W + W / 2, -apo, R, n, Math.PI / 2 + Math.PI / n), c: 'base' });
    polys.push({ p: polyPts(k1 * W + W / 2, H + apo, R, n, -Math.PI / 2 + Math.PI / n), c: 'base' });
  } else if (type === 'pyramid') {
    const base = polyPts(0, 0, R, n, Math.PI / 2 + Math.PI / n), hs = Math.max(W * 1.15, apo * 1.15);
    polys.push({ p: base, c: 'base' });
    for (let k = 0; k < n; k++) { const a = base[k], b = base[(k + 1) % n], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], l = Math.hypot(m[0], m[1]), t = [m[0] + m[0] / l * hs, m[1] + m[1] / l * hs]; polys.push({ p: [a, b, t], c: 'lat' }); }
  } else if (type === 'cylinder') {
    const r = 22, w = 2 * Math.PI * r;
    polys.push({ p: [[0, 0], [w, 0], [w, 70], [0, 70]], c: 'lat' }); circles = [{ cx: w * 0.3, cy: -r, r, c: 'base' }, { cx: w * 0.7, cy: 70 + r, r, c: 'base' }];
  }
  const xs = [...polys.flatMap(q => q.p.map(p => p[0])), ...circles.flatMap(c => [c.cx - c.r, c.cx + c.r])], ys = [...polys.flatMap(q => q.p.map(p => p[1])), ...circles.flatMap(c => [c.cy - c.r, c.cy + c.r])];
  const x0 = Math.min(...xs) - 6, x1 = Math.max(...xs) + 6, y0 = Math.min(...ys) - 6, y1 = Math.max(...ys) + 6, w = x1 - x0, hh = y1 - y0;
  const body = polys.map((q, i) => `<polygon class="nf ${q.c}" style="animation-delay:${i * 0.06}s" points="${q.p.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ')}"/>`).join('') + circles.map(c => `<circle class="nf ${c.c}" cx="${f1(c.cx)}" cy="${f1(c.cy)}" r="${c.r}"/>`).join('');
  return `<svg class="geo-svg geo-netsvg" viewBox="${f1(x0)} ${f1(y0)} ${f1(w)} ${f1(hh)}" xmlns="http://www.w3.org/2000/svg" role="img" style="aspect-ratio:${f1(w)}/${f1(hh)}">${body}</svg>`;
}

// spec: {shape:'prism'|'pyramid'|'box'|'cylinder'|'cone'|'sphere', n} או {net:'prism'|'pyramid'|'cylinder', n}
export function shapeSVG(spec, size) {
  if (spec.net) return netSVG(spec.net, spec.n, { size });
  return ['cylinder', 'cone', 'sphere'].includes(spec.shape) ? roundSVG(spec.shape, size) : solidSVG(spec.shape, spec.n, { size });
}
export const figure = spec => {
  const list = Array.isArray(spec) ? spec : [spec];
  return h('div', { class: 'geo-fig' + (list.length > 1 ? ' multi' : '') }, list.map(s => h('div', { class: 'geo-cell' + (s.net ? ' isnet' : ''), html: shapeSVG(s, s.net ? 220 : 170) })));
};

// ---------- שלב: גילוי – פאות, צלעות, קודקודים ----------
export function explore(step, api) {
  const sp = step.shape, C = counts(sp.shape, sp.n), seen = new Set();
  const stage = h('div', { class: 'geo-stage', 'data-mode': 'none', html: shapeSVG(sp, 230) });
  const cnt = h('div', { class: 'geo-count' }, bold('בחרו מה לספור 👇'));
  const MODES = [['faces', 'פאות', C.faces, 'gf', '**פאה** היא מצולע שטוח שהוא אחד מ"צדדי" הגוף. חלק מהפאות מוסתרות מאחור!'], ['edges', 'צלעות', C.edges, 'ge', '**צלע** היא הקו שבו נפגשות **שתי פאות**. הקווים המקווקווים הם צלעות שמסתתרות מאחור.'], ['verts', 'קודקודים', C.verts, 'gv', '**קודקוד** הוא הנקודה שבה נפגשות **צלעות**.']];
  let run = 0;
  const chips = MODES.map(([k, name, total, cls, txt]) => h('button', { class: 'pv-op geo-chip', onclick: async () => {
    sfx.pick(); chips.forEach(c => c.classList.toggle('used', c === chip(k))); stage.dataset.mode = k; const my = ++run;
    stage.querySelectorAll('.lit').forEach(e => e.classList.remove('lit'));
    const els = [...stage.querySelectorAll('.' + cls)];
    for (let i = 1; i <= total; i++) { if (my !== run) return; cnt.replaceChildren(bold(`**${i}** ${name}`)); const e = els[i - 1]; e && e.classList.add('lit'); sfx.tap && sfx.tap(); await wait(total > 9 ? 90 : 150); }
    if (my !== run) return; cnt.replaceChildren(bold(`סך הכול **${total}** ${name}`), h('small', {}, bold(txt))); seen.add(k); if (seen.size === 3) api.done();
  } }, name));
  const chip = k => chips[MODES.findIndex(m => m[0] === k)];
  const el = h('div', { class: 'step explore-step' }, step.title && h('h3', {}, step.title), step.text && h('p', { class: 'say' }, bold(step.text)), stage, h('div', { class: 'pv-ops' }, chips), cnt);
  el.__solve = async () => { for (const k of ['faces', 'edges', 'verts']) { seen.add(k); } api.done(); };
  return el;
}

// ---------- שלב: בונה גופים – מספר צלעות בסיס משתנה ----------
export function builder(step, api) {
  const type = step.shape, [lo, hi] = step.range || [3, 8]; let n = step.start || lo, net = false; const vis = new Set([n]); let netSeen = !step.net;
  const stage = h('div', { class: 'geo-stage big' }), nbox = h('div', { class: 'bd-n' }), tbl = h('div', { class: 'bd-tbl' });
  const info = h('p', { class: 'say bd-name' });
  const check = () => { if (vis.size >= (step.need || 3) && netSeen) api.done(); };
  function draw() {
    stage.innerHTML = net ? netSVG(type, n, { size: 230 }) : solidSVG(type, n, { size: 230 }); stage.classList.remove('gpop'); void stage.offsetWidth; stage.classList.add('gpop');
    const C = counts(type, n);
    nbox.replaceChildren(h('b', {}, String(n)), h('small', {}, 'צלעות בבסיס'));
    info.replaceChildren(bold(`**${type === 'prism' ? prismName(n) : pyramidName(n)}** · בסיס ${BASE[n]}`));
    const rows = type === 'prism' ? [['בסיסים', '2'], ['פאות צדדיות', C.lat], ['סך הפאות', C.faces], ['צלעות', C.edges], ['קודקודים', C.verts]] : [['בסיס', '1'], ['פאות צדדיות (משולשים)', C.lat], ['סך הפאות', C.faces], ['צלעות', C.edges], ['קודקודים', C.verts]];
    tbl.replaceChildren(...rows.map(([a, b]) => h('div', { class: 'bd-row' }, h('span', {}, a), h('b', {}, String(b)))));
    $dec.disabled = n <= lo; $inc.disabled = n >= hi;
  }
  const set = m => { sfx.pick(); n = Math.max(lo, Math.min(hi, m)); vis.add(n); draw(); check(); };
  const $dec = h('button', { class: 'pv-op bd-step', onclick: () => set(n - 1), 'aria-label': 'פחות צלעות' }, '−'), $inc = h('button', { class: 'pv-op bd-step', onclick: () => set(n + 1), 'aria-label': 'יותר צלעות' }, '+');
  const $net = step.net && h('button', { class: 'btn ghost bd-net', onclick: () => { sfx.pick(); net = !net; netSeen = true; $net.textContent = net ? '🧊 חזרה לגוף' : '🎁 פרוס אותי!'; draw(); check(); } }, '🎁 פרוס אותי!');
  const el = h('div', { class: 'step builder-step' }, step.title && h('h3', {}, step.title), step.text && h('p', { class: 'say' }, bold(step.text)),
    h('div', { class: 'bd-ctl', dir: 'ltr' }, $dec, nbox, $inc), stage, info, $net, tbl);
  draw();
  el.__solve = async () => { for (let m = lo; m < lo + (step.need || 3); m++) set(m); if (step.net && !net) $net.click(); netSeen = true; check(); api.done(); };
  return el;
}

// ---------- שלב: מיון גופים – גוררים (או לוחצים) כל גוף לקבוצה הנכונה ----------
export function sort(step, api) {
  const items = shuffle(step.items.map((it, i) => ({ ...it, id: i }))); let left = items.length, sel = null, busy = false;
  const fb = h('div', { class: 'qz-fb' }), tray = h('div', { class: 'so-tray' });
  const bk = step.buckets.map(b => ({ ...b, el: h('div', { class: 'so-bucket', 'data-b': b.id }, h('b', {}, b.label), h('div', { class: 'so-in' })) }));
  const card = it => { const e = h('button', { class: 'so-card', type: 'button', 'data-id': it.id, 'aria-label': 'גוף', html: shapeSVG(it, 110) }); it.el = e; return e; };
  items.forEach(it => tray.append(card(it)));
  function drop(it, b) {
    if (it.done) return;
    if (it.to === b.id) {
      sfx.correct(); it.done = true; it.el.classList.remove('sel'); it.el.classList.add('placed'); it.el.style.transform = ''; b.el.querySelector('.so-in').append(it.el); left--; sel = null;
      fb.replaceChildren(bold(`✅ ${it.why}`)); fb.className = 'qz-fb good'; celebrate(api.host, 8, false); api.win(); if (!left) api.done();
    } else {
      sfx.wrong(); api.lose(); it.el.classList.add('shake'); setTimeout(() => it.el.classList.remove('shake'), 450); sel = null; it.el.classList.remove('sel');
      fb.replaceChildren(bold(`❌ ${it.hint || 'לא בדיוק. חשבו שוב ונסו קבוצה אחרת!'}`)); fb.className = 'qz-fb bad';
    }
  }
  const bucketAt = (x, y) => { const e = document.elementsFromPoint(x, y).find(n => n.closest && n.closest('.so-bucket')); const c = e && e.closest('.so-bucket'); return c && bk.find(b => b.el === c); };
  items.forEach(it => {
    const e = it.el; let sx = 0, sy = 0, drag = false, pid = null;
    e.addEventListener('pointerdown', ev => { if (it.done) return; pid = ev.pointerId; sx = ev.clientX; sy = ev.clientY; drag = false; try { e.setPointerCapture(pid); } catch {} });
    e.addEventListener('pointermove', ev => { if (pid !== ev.pointerId || it.done) return; const dx = ev.clientX - sx, dy = ev.clientY - sy; if (!drag && Math.hypot(dx, dy) > 8) { drag = true; e.classList.add('drag'); } if (drag) e.style.transform = `translate(${dx}px,${dy}px) scale(1.08)`; });
    e.addEventListener('pointerup', ev => {
      if (pid !== ev.pointerId) return; pid = null; if (it.done) return;
      if (drag) { e.classList.remove('drag'); e.style.transform = ''; const b = bucketAt(ev.clientX, ev.clientY); if (b) drop(it, b); }
      else { sel = sel === it ? null : it; items.forEach(x => x.el.classList.toggle('sel', x === sel)); sfx.tap && sfx.tap(); }
    });
    e.addEventListener('pointercancel', () => { pid = null; e.classList.remove('drag'); e.style.transform = ''; });
  });
  bk.forEach(b => b.el.addEventListener('click', ev => { if (ev.target.closest('.so-card')) return; if (sel) drop(sel, b); }));
  const el = h('div', { class: 'step sort-step' }, step.title && h('h3', {}, step.title), step.text && h('p', { class: 'say' }, bold(step.text)), tray, h('div', { class: 'so-buckets' }, bk.map(b => b.el)), fb);
  el.__solve = async () => { for (const it of items) { if (!it.done) drop(it, bk.find(b => b.id === it.to)); await wait(10); } };
  return el;
}

export const GEO_KINDS = { explore, builder, sort };
