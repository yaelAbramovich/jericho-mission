// מאגר השאלות המורחב: כל פרק בקובץ משלו. content.js מצרף אותם ל-QUOTES / STATEMENTS / SEQUENCES.
import { BANK_J1 } from './j1.js';
import { BANK_J2 } from './j2.js';
import { BANK_J3 } from './j3.js';
import { BANK_J4 } from './j4.js';
import { BANK_J5 } from './j5.js';

const ALL = [BANK_J1, BANK_J2, BANK_J3, BANK_J4, BANK_J5];
export const BANK = {
  quotes: ALL.flatMap(b => b.quotes),
  statements: ALL.flatMap(b => b.statements),
  sequences: ALL.flatMap(b => b.sequences),
};
