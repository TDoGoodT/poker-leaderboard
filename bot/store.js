import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../public/data.json');

function initData() {
    if (!fs.existsSync(DATA_FILE)) {
        resetData();
    }
}

function resetData() {
    const initialData = {
        games: [],
        players: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
}

function readData() {
    if (!fs.existsSync(DATA_FILE)) initData();
    const raw = fs.readFileSync(DATA_FILE);
    return JSON.parse(raw);
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function addGame(gameData) {
    const data = readData();

    // Check if game already exists (by rawMessage content and date maybe? or just generate ID)
    // For history sync, we might parse the same message multiple times if we run it often.
    // We should probably deduplicate based on message ID if we have it.
    // The current addGame generates a random ID.
    // Let's allow passing an ID.

    const game = {
        id: gameData.id || Date.now().toString(),
        date: gameData.date || new Date().toISOString(),
        ...gameData
    };

    // Deduplication check: if id exists, update it?
    const existingIndex = data.games.findIndex(g => g.id === game.id);
    if (existingIndex >= 0) {
        data.games[existingIndex] = game;
    } else {
        data.games.push(game);
    }

    // Update players list
    const currentPlayers = new Set(data.players);
    if (gameData.results) {
        Object.keys(gameData.results).forEach(player => {
            currentPlayers.add(player);
        });
    }
    data.players = Array.from(currentPlayers);

    writeData(data);
    return game;
}

export { readData, addGame, resetData };
