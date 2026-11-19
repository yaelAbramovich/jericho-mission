// תצוגת שברים "בנויים" (מונה מעל מכנה, כמו בספר). בטקסט: שבר = "2⁄5" ומספר מעורב = "1 1⁄5" (קו שבר U+2044, לא "/" רגיל – כדי שמונים כמו 0/60 לא יהפכו לשברים).
// ui.js מפעיל את זה אוטומטית על כל טקסט כשהמקצוע הפעיל הוא שברים – לכן משחקים ושיעורים כותבים "3 × 2/5 = 6/5" ומקבלים שברים בנויים.
const FR = /(?:(\d+) )?(\d+)\u2044(\d+)/g;
const NUM = '\\d+(?: \\d+\\u2044\\d+|\\u2044\\d+)?';
const EQ = new RegExp(`${NUM}(?:\\s*[×=≈+−]\\s*${NUM})+`, 'g');
export const hasFrac = s => /\d\u2044\d/.test(s);

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// ---- מחרוזת HTML (לקלפים ולמקומות שבהם בונים innerHTML) ----
export const fracHTML = text => esc(text).replace(FR, (_, w, n, d) =>
  `<span class="fr">${w ? `<span class="fw">${w}</span>` : ''}<span class="fq"><i>${n}</i><i>${d}</i></span></span>`);
export const fracMath = text => {
  const t = String(text); let out = '', last = 0, m; EQ.lastIndex = 0;
  while ((m = EQ.exec(t))) { out += fracHTML(t.slice(last, m.index)) + `<span class="fm">${fracHTML(m[0])}</span>`; last = m.index + m[0].length; }
  return out + fracHTML(t.slice(last));
};

// ---- צמתי DOM (ui.js) ----
function fracEl(w, n, d) {
  const q = document.createElement('span'); q.className = 'fq';
  for (const x of [n, d]) { const i = document.createElement('i'); i.textContent = x; q.append(i); }
  const e = document.createElement('span'); e.className = 'fr';
  if (w) { const f = document.createElement('span'); f.className = 'fw'; f.textContent = w; e.append(f); }
  e.append(q); return e;
}
function inline(text, into) {                              // טקסט עם שברים (בלי משוואות) → צמתים
  let last = 0, m; FR.lastIndex = 0;
  while ((m = FR.exec(text))) { if (m.index > last) into.append(document.createTextNode(text.slice(last, m.index))); into.append(fracEl(m[1], m[2], m[3])); last = m.index + m[0].length; }
  if (last < text.length) into.append(document.createTextNode(text.slice(last)));
}
export function fracFragment(text) {
  const frag = document.createDocumentFragment(); let last = 0, m; EQ.lastIndex = 0;
  const t = String(text);
  while ((m = EQ.exec(t))) {
    if (m.index > last) inline(t.slice(last, m.index), frag);
    const s = document.createElement('span'); s.className = 'fm'; inline(m[0], s); frag.append(s); last = m.index + m[0].length;
  }
  if (last < t.length) inline(t.slice(last), frag);
  return frag;
}
