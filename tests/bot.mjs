// "שחקן" אוטומטי: לוחץ על מה שמופיע במסך עד שהסבב נגמר (מופיע .end-card).
// לא מנסה לנצח – רק לעבור את כל המסכים של המשחק כדי לגלות קריסות.
const CLICKS = [
  '.modal .btn.ghost',                              // חלון "ניסיון נוסף": מוותרים
  '.dg-chip:not(.assigned) .dg-btn[data-k="in"]',  // בונים תרשים: מסווגים כל רכיב (ואז לוחצים "בדוק")
  '.duel-setup .btn.primary',                       // דו-קרב: התחלה
  '.mem-setup ~ .btn.primary',                      // זיכרון עשרוני: התחלה
  '.pt-actions .btn.primary',                       // הנקודה זזה: בדיקה (מסתיים אחרי שתי טעויות) / הבא
  '.shop-actions .btn.primary',                     // החנות: בדיקה (אחרי שתי טעויות נחשפת התשובה) / הבא
  '.stage-splash .btn.primary',                     // מבחן הסיכום: מעבר בין שלבים
  '.idea-card ~ .btn.primary',                      // דו-קרב: כרטיס נושא
  '.side-btns .side.yes',                           // בוס: בחירת עמדה
  '.btn.primary:has-text("זו התשובה שלי")',         // בוס: אישור (לפני הבחירה, כדי לא לבטל טיעון שנבחר)
  '.deck .acard:not(.on)',                          // בוס: בחירת טיעון
  '.sw-btns .sw-true',                              // הסערה
  '.olist ~ .btn.primary:has-text("בדוק")',         // בונים את הקו
  '.dg-list ~ .btn.primary:has-text("בדוק")',       // בונים תרשים
  '.opt:not([disabled])',                           // מי אמר / התאמה / דו-קרב
  '.btn.primary:has-text("הבא")', '.btn.primary:has-text("לתוצאות")', '.btn.primary:has-text("סיום")',
];

// המסך משתנה כל הזמן (אנימציות, מעבר שאלה) – אלמנט יכול להיעלם בין הבדיקה ללחיצה. זה לא כשלון, פשוט מנסים שוב.
async function tryClick(page, sel) {
  try {
    const l = page.locator(sel).first();
    if (!(await l.count()) || !(await l.isVisible({ timeout: 500 })) || !(await l.isEnabled({ timeout: 500 }))) return false;
    await l.click({ timeout: 2000 });
    return true;
  } catch { return false; }
}

export async function playToEnd(page, timeoutMs = 90000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    // מילים שלא אמורות להופיע אף פעם על המסך (ערך false/null שהודפס בטעות)
    // (בסוף הסבב .game נעלם – בלי בדיקת count הייתה כאן המתנה של 30 שניות בכל משחק)
    const txt = (await page.locator('.game').count()) ? await page.locator('.game').first().innerText({ timeout: 1000 }).catch(() => '') : '';
    const stray = /\b(false|null|undefined|NaN|\[object)/.exec(txt);
    if (stray) throw new Error(`על מסך המשחק מופיע "${stray[1]}": ${txt.slice(0, 120).replace(/\s+/g, ' ')}`);
    if (await page.locator('.end-card').count()) return;
    if (await page.locator('.game > .warn').count()) throw new Error('המשחק הציג הודעת שגיאה: ' + (await page.locator('.game > .warn').innerText()));
    // פנדלים – חיפוש: צריך לבחור פרק ופסוק לפני הבעיטה
    if (await page.locator('.kick-btn').count()) {
      if (await tryClick(page, '.pick-row.ch .pk')) { await tryClick(page, '.pick-grid .pk'); await tryClick(page, '.kick-btn:not([disabled])'); continue; }
    }
    // זיכרון עשרוני: מוצאים בלוח (לפי data-set) קבוצה שלמה ופותחים אותה, כדי שהסבב יסתיים בלי לנחש
    if (await page.locator('.mem-board').count()) {
      const idx = await page.evaluate(() => { const by = {}; document.querySelectorAll('.mcard:not(.done)').forEach(c => (by[c.dataset.set] = by[c.dataset.set] || []).push(+c.dataset.i)); return Object.values(by)[0] || []; });
      for (const i of idx) await tryClick(page, `.mcard[data-i="${i}"]`);
      await page.waitForTimeout(60);
      continue;
    }
    // החנות: בלי ספרה לא נבדק – מקלידים 1 (התשובה כנראה שגויה, ואחרי שני ניסיונות הסבב ממשיך)
    if (await page.locator('.shop-keys').count() && !(await page.locator('.shop-entry .val').innerText().catch(() => '')).trim()) await tryClick(page, '.skey[data-k="1"]');
    // קו מספרים (גרירה): נוגעים באמצע הקו כדי לפתוח את "בדיקה"
    if (await page.locator('.nl-check').count()) {
      const bb = await page.locator('.nl-track').first().boundingBox().catch(() => null);
      if (bb) await page.mouse.click(bb.x + bb.width * 0.5, bb.y + 10);
      await tryClick(page, '.nl-check'); continue;
    }
    let clicked = false;
    for (const sel of CLICKS) { if (await tryClick(page, sel).catch(() => false)) { clicked = true; break; } }
    if (!clicked) await page.waitForTimeout(120);
  }
  const visible = (await page.locator('.game').innerText().catch(() => '')).slice(0, 200).replace(/\s+/g, ' ');
  throw new Error(`הסבב לא הגיע לסיום תוך ${timeoutMs / 1000} שניות. על המסך: "${visible}"`);
}
