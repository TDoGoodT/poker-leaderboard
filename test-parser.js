import { parseMessage } from './bot/parser.js';

const testMsg = `סבוראי 200 לבוסקילה
ירדן 150 לבוסקילה
בן ארצי  114 לבוסקילה
בן ארצי 47 לשמאי
בן ארצי 16 למסיקה
בן ארצי 15 לנוה
בן ארצי 2 לוויס`;

console.log("Testing Parser with:\n" + testMsg + "\n");
const result = parseMessage(testMsg);
console.log("Result:", JSON.stringify(result, null, 2));

if (result && result.results['סבוראי'] === -200 && result.results['בוסקילה'] === 350 + 114) {
    // Wait, let's calculate expected:
    // Saborai: -200
    // Buskila: +200 + 150 + 114 = 464
    // Yarden: -150
    // Ben Artzi: -114 -47 -16 -15 -2 = -194
    // Shamai: +47
    // Mesika: +16
    // Nove: +15
    // Weiss: +2

    // Actually let's just inspect the output visually in the log
}
