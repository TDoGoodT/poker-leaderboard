import { parseMessage, normalizePlayerName } from './bot/parser.js';

const cases = [
    "סבוראי 200 לבוסקילה",
    "ירדן 150 לבוסקילה",
    "בן ארצי  114 לבוסקילה",
    "בן ארצי 47 לשמאי",
    "בנארצי 16 למסיקה", // Alias test
    "בנארצ 15 לנוה",    // Alias test
    "עמרן 100 וייס",    // No 'to' prefix test
    "דניאלי 50 לוויס",   // Alias for Weiss
    "בוסקילה 100 מעביר לירדן", // 'transfers to' test
    "Unknown 50 to Unknown" // Should fail
];

console.log("Testing Normalization:");
console.log("בנארצי ->", normalizePlayerName("בנארצי"));
console.log("לבוסקילה ->", normalizePlayerName("לבוסקילה"));
console.log("וויס ->", normalizePlayerName("וויס"));
console.log("X ->", normalizePlayerName("X"));

console.log("\nTesting Parser:");
const result = parseMessage(cases.join('\n'));
console.log(JSON.stringify(result, null, 2));
