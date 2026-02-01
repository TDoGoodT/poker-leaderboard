import { parseMessage, normalizePlayerName } from './bot/parser.js';

const testMsg = `טיטו 110 לירדן
וויס 110 לירדן
שמאי מעביר לדניאלי 110
בן ארצי מעביר 40 למסיקה
בן ארצי מעביר 20 לסבוראי`;

console.log("Testing Parser with user example:");
const result = parseMessage(testMsg);
console.log(JSON.stringify(result, null, 2));

console.log("\nDebug Normalization:");
console.log("'בן ארצי מעביר' ->", normalizePlayerName('בן ארצי מעביר'));
console.log("'למסיקה' ->", normalizePlayerName('למסיקה'));
console.log("'טיטו' ->", normalizePlayerName('טיטו'));
