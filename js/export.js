// העתקה ושיתוף של חומר הלימוד ("למבחן") כטקסט נקי: אפשר להדביק בוואטסאפ, במסמך או להדפיס.
import { TOPICS } from './focus-content.js';

const clean = s => String(s).replace(/\*\*/g, '');
const HR = '\n\n━━━━━━━━━━━━\n\n';

// נושא אחד -> טקסט רגיל (בלי סימוני **מודגש**)
export function topicToText(t) {
  const out = [`${t.label} – ${t.title}`];
  for (const b of t.blocks) {
    if (b.h) out.push('', `== ${clean(b.h)} ==`);
    else if (b.sh) out.push('', `— ${clean(b.sh)}`);
    else if (b.p) out.push(clean(b.p));
    else if (b.q) out.push(`„${clean(b.q).replace(/^"|"$/g, '')}"`);
    else if (b.say) out.push(clean(b.say));
    else if (b.big) out.push(`★ ${clean(b.big)}`);
    else if (b.note) out.push(`💡 ${clean(b.note)}`);
    else if (b.answer) out.push(`✅ התשובה למבחן: ${clean(b.answer)}`);
    else if (b.table) b.table.forEach(([k, v]) => out.push(`• ${clean(k)}: ${clean(v)}`));
    else if (b.ul) b.ul.forEach(x => out.push(`• ${clean(x)}`));
    else if (b.ol) b.ol.forEach((x, i) => out.push(`${i + 1}. ${clean(x)}`));
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
export const allToText = () => TOPICS.map(topicToText).join(HR);

// העתקה ללוח. קודם הדרך המודרנית; אם היא לא זמינה (אתר לא מאובטח, דפדפן ישן) – דרך גיבוי.
export async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch (e) { /* ממשיכים לדרך הגיבוי */ }
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
  document.body.append(ta); ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  return ok;
}

export const canShare = () => typeof navigator.share === 'function';
export async function shareText(title, text) {
  try { await navigator.share({ title, text }); return true; } catch (e) { return false; }   // ביטול על ידי המשתמש = לא שגיאה
}
