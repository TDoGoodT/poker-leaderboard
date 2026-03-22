import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import { parseMessage } from './parser.js';
import { addGame, readData } from './store.js';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_DIR = path.join(__dirname, '..');

const GROUP_NAME = 'ערב פוקר של השמחות 🎰';
const SYNC_LIMIT = 5000; // How many messages to look back

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox']
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan the QR code above to log in.');
});

client.on('ready', async () => {
    console.log('Client is ready!');
    await syncGroupHistory();
});

async function syncGroupHistory() {
    console.log(`Searching for group: "${GROUP_NAME}"...`);

    const chats = await client.getChats();
    const group = chats.find(chat => chat.isGroup && chat.name === GROUP_NAME);

    if (!group) {
        console.error(`Group "${GROUP_NAME}" not found!`);
        console.log('Available groups:', chats.filter(c => c.isGroup).map(c => c.name));
        return;
    }

    const existingData = readData();
    const lastRecordedDateMs = getLastRecordedGameDateMs(existingData.games);

    if (lastRecordedDateMs) {
        console.log(`Found group: ${group.name}. Searching for games after ${new Date(lastRecordedDateMs).toISOString()}...`);
    } else {
        console.log(`Found group: ${group.name}. No previous games found, fetching last ${SYNC_LIMIT} messages...`);
    }

    // Fetch messages
    const messages = await group.fetchMessages({ limit: SYNC_LIMIT });
    let candidateMessages = messages;

    if (lastRecordedDateMs) {
        candidateMessages = messages.filter((msg) => (msg.timestamp * 1000) > lastRecordedDateMs);
    }

    // Process oldest -> newest for deterministic imports
    candidateMessages.sort((a, b) => a.timestamp - b.timestamp);

    console.log(`Fetched ${messages.length} messages. Processing ${candidateMessages.length} new candidate messages...`);

    // Note: addGame() handles deduplication by checking existing IDs
    let importedCount = 0;

    for (const msg of candidateMessages) {
        if (!msg.body) continue;

        try {
            const parsed = parseMessage(msg.body);
            if (parsed) {
                // Use message timestamp for the game date
                const date = new Date(msg.timestamp * 1000).toISOString();

                addGame({
                    id: msg.id.id, // Use WhatsApp message ID as unique ID
                    date: date,
                    rawMessage: msg.body,
                    results: parsed.results,
                    transactions: parsed.transactions,
                    sender: msg.author || msg.from
                });
                importedCount++;
            }
        } catch (err) {
            console.error('Failed to parse message:', msg.body.substring(0, 50), err);
        }
    }

    console.log(`History sync complete. Imported ${importedCount} games.`);
    pushChanges();
}

function getLastRecordedGameDateMs(games = []) {
    if (!Array.isArray(games) || games.length === 0) return null;

    let latest = null;
    for (const game of games) {
        if (!game?.date) continue;
        const time = new Date(game.date).getTime();
        if (Number.isNaN(time)) continue;
        if (latest === null || time > latest) latest = time;
    }

    return latest;
}

client.on('message', async (message) => {
    const chat = await message.getChat();

    if (chat.isGroup && chat.name === GROUP_NAME) {
        try {
            const parsed = parseMessage(message.body);
            if (parsed) {
                console.log('New game results detected:', parsed);

                addGame({
                    id: message.id.id,
                    date: new Date(message.timestamp * 1000).toISOString(),
                    rawMessage: message.body,
                    results: parsed.results,
                    transactions: parsed.transactions,
                    sender: message.author || message.from
                });

                console.log('Game saved.');
                await message.react('✅'); // React to confirm
                // await message.reply('Leaderboard updated!');

                pushChanges();
            }
        } catch (err) {
            console.error('Error processing message:', err);
        }
    }
});

function pushChanges() {
    console.log('Pushing changes to Git...');
    const cmd = `cd ${REPO_DIR} && git add public/data.json && git commit -m "Update leaderboard from bot" && git push`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Git error: ${error.message}`);
            return;
        }
        if (stderr) console.error(`Git stderr: ${stderr}`);
        console.log(`Git stdout: ${stdout}`);
    });
}

client.initialize();
