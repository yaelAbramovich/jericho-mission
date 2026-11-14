// עזרי עברית כלליים (לא קשורים למקצוע): מספרים באותיות (א׳, ב׳, ... י״ד, טו, טז ...).
const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
export function hebNum(n) {
  if (n === 15) return 'טו';
  if (n === 16) return 'טז';
  const tens = { 10: 'י', 20: 'כ', 30: 'ל' };
  const t = Math.floor(n / 10) * 10;
  return (tens[t] || '') + ONES[n % 10];
}
