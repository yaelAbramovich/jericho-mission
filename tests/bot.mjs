// "שחקן" אוטומטי: לוחץ על מה שמופיע במסך עד שהסבב נגמר (מופיע .end-card).
// לא מנסה לנצח – רק לעבור את כל המסכים של המשחק כדי לגלות קריסות.
const CLICKS = [
  '.retry-box .btn.ghost',                          // כוח "בעיטה חוזרת": מוותרים
  '.duel-setup .btn.primary',                       // דו-קרב: התחלה
  '.stage-splash .btn.primary',                     // מבחן הסיכום: מעבר בין שלבים
  '.idea-card ~ .btn.primary',                      // דו-קרב: כרטיס נושא
  '.side-btns .side.yes',                           // בוס: בחירת עמדה
  '.btn.primary:has-text("זו התשובה שלי")',         // בוס: אישור (לפני הבחירה, כדי לא לבטל טיעון שנבחר)
  '.deck .acard:not(.on)',                          // בוס: בחירת טיעון
  '.sw-btns .sw-true',                              // הסערה
  '.olist ~ .btn.primary:has-text("בדוק")',         // בונים את הקו
  '.opt:not([disabled])',                           // מי אמר / התאמה / דו-קרב
  '.btn.primary:has-text("הבא")', '.btn.primary:has-text("לתוצאות")', '.btn.primary:has-text("סיום")',
];

async function tryClick(page, sel) {
  const l = page.locator(sel).first();
  if (!(await l.count()) || !(await l.isVisible()) || !(await l.isEnabled())) return false;
  await l.click({ timeout: 2000 });
  return true;
}

export async function playToEnd(page, timeoutMs = 90000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (await page.locator('.end-card').count()) return;
    if (await page.locator('.game > .warn').count()) throw new Error('המשחק הציג הודעת שגיאה: ' + (await page.locator('.game > .warn').innerText()));
    // פנדלים – חיפוש: צריך לבחור פרק ופסוק לפני הבעיטה
    if (await page.locator('.kick-btn').count()) {
      if (await tryClick(page, '.pick-row.ch .pk')) { await tryClick(page, '.pick-grid .pk'); await tryClick(page, '.kick-btn:not([disabled])'); continue; }
    }
    let clicked = false;
    for (const sel of CLICKS) { if (await tryClick(page, sel).catch(() => false)) { clicked = true; break; } }
    if (!clicked) await page.waitForTimeout(120);
  }
  const visible = (await page.locator('.game').innerText().catch(() => '')).slice(0, 200).replace(/\s+/g, ' ');
  throw new Error(`הסבב לא הגיע לסיום תוך ${timeoutMs / 1000} שניות. על המסך: "${visible}"`);
}
