# מבצע יריחו – PWA ללימוד יהושע א׳–ה׳
קבצים סטטיים בלבד, בלי build. להרצה מקומית: `python3 -m http.server 8765` והכתובת http://localhost:8765. הוראות בעברית להורה: `הוראות.html`.

מבנה: `js/content.js` – כל התוכן (פרקים, ציטוטים, משפטים, רצפים, בוס). כדי להוסיף פרק: מוסיפים אובייקט ל-CHAPTERS, ציטוטים ל-QUOTES, משפטים ל-STATEMENTS ורצף ל-SEQUENCES.
כל משחק ב-`js/games/*.js` מייצא `run(el, opts, scope) → Promise<תוצאה>`; רושמים אותו ב-GAMES ב-`js/app.js`. אחרי שינוי קבצים מעלים את VERSION ב-`sw.js`.

בדיקות: `npm install && npx playwright install chromium && npm test` (או `npm run test:fast` – רק פרק ב׳). הבדיקות טוענות כל קובץ JS בדפדפן אמיתי, פותחות כל מסך, משחקות כל משחק מההתחלה עד הסוף בכל פרק, ובודקות את התוכן, התגמולים וההעתקה. **להריץ לפני כל commit** – `node --check` לא מספיק לקבצי ES-module (הוא לא תופס הגדרה כפולה של משתנה).
