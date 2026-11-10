// הקלטות קול ב-IndexedDB + ייצוא/ייבוא לקובץ אחד לגיבוי.
const DB = 'jericho-rec', STORE = 'rec';
let dbp = null;
function open() {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    try {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    } catch (e) { rej(e); }
  });
  return dbp;
}
const tx = async (mode, fn) => {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode), s = t.objectStore(STORE), r = fn(s);
    t.oncomplete = () => res(r && r.result);
    t.onerror = () => rej(t.error);
  });
};
export const putRec = (id, blob) => tx('readwrite', s => s.put({ id, blob, type: blob.type, ts: Date.now() }));
export const getRec = id => tx('readonly', s => s.get(id)).then(r => r || null);
export const delRec = id => tx('readwrite', s => s.delete(id));
export const allRecs = () => tx('readonly', s => s.getAll()).then(r => r || []);
export const recIds = () => allRecs().then(a => new Set(a.map(r => r.id)));

const toB64 = blob => new Promise((res, rej) => {
  const fr = new FileReader();
  fr.onload = () => res(String(fr.result).split(',')[1]);
  fr.onerror = rej; fr.readAsDataURL(blob);
});
const fromB64 = (b64, type) => {
  const bin = atob(b64), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return new Blob([u], { type });
};
export async function exportAll() {
  const recs = await allRecs();
  const out = { app: 'jericho-mission', v: 1, recs: [] };
  for (const r of recs) out.recs.push({ id: r.id, type: r.type, ts: r.ts, b64: await toB64(r.blob) });
  return new Blob([JSON.stringify(out)], { type: 'application/json' });
}
export async function importAll(file) {
  const data = JSON.parse(await file.text());
  if (data.app !== 'jericho-mission' || !Array.isArray(data.recs)) throw new Error('bad file');
  for (const r of data.recs) await putRec(r.id, fromB64(r.b64, r.type));
  return data.recs.length;
}
