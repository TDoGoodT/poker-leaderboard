import { compareTwoStrings } from 'string-similarity';

// Normalized player names
const PLAYERS = {
    'סבוראי': ['סבוראי'],
    'עמרן': ['עמרן'],
    'בוסקילה': ['בוסקילה'],
    'מסיקה': ['מסיקה'],
    'שמאי': ['שמאי'],
    'נוה': ['נוה', 'נווה'],
    'וייס': ['וייס', 'וויס'],
    'דניאלי': ['דניאלי'],
    'ירדן': ['ירדן'],
    'בן ארצי': ['בן ארצי', 'בנארצ', 'בנארצי', 'בן-ארצי'] // Added hyphen just in case
};

// Flatten aliases for search
const ALIAS_MAP = {};
Object.entries(PLAYERS).forEach(([name, aliases]) => {
    aliases.forEach(alias => {
        ALIAS_MAP[alias] = name;
    });
});

/**
 * Normalizes a name string to a known player.
 * Checks exact match, then 'to' prefix (ל), then fuzzy match.
 */
function normalizePlayerName(rawName) {
    if (!rawName) return null;
    let name = rawName.trim();

    // Check 1: Exact alias match
    if (ALIAS_MAP[name]) return ALIAS_MAP[name];

    // Check 2: Remove prefixes (Longest first)
    // 'מעביר ל' (transfers to), 'מעביר' (transfers), 'ל' (to)
    const prefixes = ['מעביר ל', 'מעביר', 'ל'];
    for (const prefix of prefixes) {
        if (name.startsWith(prefix)) {
            const withoutPrefix = name.substring(prefix.length).trim();
            if (ALIAS_MAP[withoutPrefix]) return ALIAS_MAP[withoutPrefix];
            name = withoutPrefix;
            break;
        }
    }

    // Check 3: Remove suffixes
    const suffixes = ['מעביר'];
    for (const suffix of suffixes) {
        if (name.endsWith(suffix)) {
            const withoutSuffix = name.substring(0, name.length - suffix.length).trim();
            if (ALIAS_MAP[withoutSuffix]) return ALIAS_MAP[withoutSuffix];
            name = withoutSuffix;
            break;
        }
    }

    // Check 4: Levenshtein / Fuzzy match against known aliases
    let bestMatch = null;
    let maxScore = 0;

    Object.keys(ALIAS_MAP).forEach(alias => {
        const score = compareTwoStrings(name, alias);
        // Lower threshold slightly for Hebrew but keep it safe
        if (score > 0.7 && score > maxScore) {
            maxScore = score;
            bestMatch = ALIAS_MAP[alias];
        }
    });

    return bestMatch;
}

/**
 * Parses a poker game result message.
 */
function parseMessage(text) {
    if (!text) return null;

    const lines = text.split('\n');
    const transactions = [];
    const results = {};

    // Defined patterns (Order matters: specific -> generic)
    const patterns = [
        // 1. Name transfers to Name Amount: "שמאי מעביר לדניאלי 110"
        {
            regex: /^(.+?)\s+מעביר\s+(?:ל)?(.+?)\s+(\d+)$/,
            map: { payer: 1, receiver: 2, amount: 3 }
        },
        // 2. Name transfers Amount to Name: "בן ארצי מעביר 40 למסיקה"
        {
            regex: /^(.+?)\s+מעביר\s+(\d+)\s+(?:ל)?(.+)$/,
            map: { payer: 1, amount: 2, receiver: 3 }
        },
        // 3. Name Amount to Name (Generic): "סבוראי 200 לבוסקילה"
        {
            regex: /^(.+?)\s+(\d+)\s+(?:ל)?(.+)$/,
            map: { payer: 1, amount: 2, receiver: 3 }
        }
    ];

    for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;

        let matchFound = false;

        for (const { regex, map } of patterns) {
            const match = cleanLine.match(regex);
            if (match) {
                const rawPayer = match[map.payer];
                const rawReceiver = match[map.receiver];
                const amount = parseInt(match[map.amount], 10);

                const payer = normalizePlayerName(rawPayer);
                const receiver = normalizePlayerName(rawReceiver);

                if (payer && receiver && payer !== receiver) {
                    transactions.push({
                        payer,
                        receiver,
                        amount,
                        raw: cleanLine
                    });

                    results[payer] = (results[payer] || 0) - amount;
                    results[receiver] = (results[receiver] || 0) + amount;
                    matchFound = true;
                }

                // If matched successfully, stop trying other patterns for this line
                if (matchFound) break;
            }
        }

        if (!matchFound) {
            // Optional: Log unmatched lines for debugging?
            // console.log('Unmatched line:', cleanLine);
        }
    }

    if (transactions.length === 0) {
        return null;
    }

    return {
        transactions,
        results
    };
}

// Simple implementation of Dice coefficient for string similarity if library not available
// Or we can install 'string-similarity'.
// For now, I'll include a simple helper to avoid extra deps if possible, or just install it.
// I'll install it to be safe and robust.

export { parseMessage, normalizePlayerName };
