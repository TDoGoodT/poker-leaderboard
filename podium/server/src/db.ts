import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Database } from 'bun:sqlite';

const dbPath = resolve(process.cwd(), 'server/data/podium.sqlite');
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath, { create: true });

type StoredEntry = {
  player: string;
  buyIn: number;
  cashOut: number;
};

function upsertPlayerId(name: string): number {
  db.query('INSERT OR IGNORE INTO players (name) VALUES (?)').run(name);
  const row = db.query('SELECT id FROM players WHERE name = ?').get(name) as { id: number } | null;

  if (!row) {
    throw new Error(`Failed to resolve player '${name}' during DB migration`);
  }

  return row.id;
}

function ensureGamesTableColumns() {
  const columns = db.query('PRAGMA table_info(games)').all() as Array<{ name: string }>;
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has('entries_json')) {
    db.exec('ALTER TABLE games ADD COLUMN entries_json TEXT');
  }
}

function parseStoredEntries(entriesJson: string | null, rawMessage: string | null): StoredEntry[] {
  const parseValue = (value: string | null): StoredEntry[] | null => {
    if (!value) {
      return null;
    }

    try {
      const parsed = JSON.parse(value) as Array<{ player?: string; buyIn?: number; cashOut?: number }> | { entries?: Array<{ player?: string; buyIn?: number; cashOut?: number }> };
      const entries = Array.isArray(parsed) ? parsed : parsed.entries;

      if (!Array.isArray(entries)) {
        return null;
      }

      const normalizedEntries = entries
        .filter((entry): entry is { player: string; buyIn?: number; cashOut?: number } => typeof entry.player === 'string' && entry.player.trim().length > 0)
        .map((entry) => ({
          player: entry.player.trim(),
          buyIn: Number(entry.buyIn ?? 0),
          cashOut: Number(entry.cashOut ?? 0),
        }));

      return normalizedEntries.length ? normalizedEntries : null;
    } catch {
      return null;
    }
  };

  return parseValue(entriesJson) ?? parseValue(rawMessage) ?? [];
}

function backfillGameEntries() {
  const rows = db.query(
    `SELECT g.id, g.raw_message as rawMessage, g.entries_json as entriesJson
     FROM games g
     LEFT JOIN game_entries ge ON ge.game_id = g.id
     WHERE ge.id IS NULL
       AND (
         (g.entries_json IS NOT NULL AND g.entries_json <> '')
         OR (g.raw_message IS NOT NULL AND g.raw_message <> '')
       )`,
  ).all() as Array<{ id: string; rawMessage: string | null; entriesJson: string | null }>;

  if (!rows.length) {
    return;
  }

  const insertEntry = db.query(
    'INSERT OR REPLACE INTO game_entries (game_id, player_id, buy_in, cash_out) VALUES (?, ?, ?, ?)',
  );

  for (const row of rows) {
    const entries = parseStoredEntries(row.entriesJson, row.rawMessage);
    for (const entry of entries) {
      const playerId = upsertPlayerId(entry.player);
      insertEntry.run(row.id, playerId, entry.buyIn, entry.cashOut);
    }
  }
}

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    raw_message TEXT,
    entries_json TEXT,
    sender TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    payer_player_id INTEGER NOT NULL,
    receiver_player_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    raw TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (payer_player_id) REFERENCES players(id),
    FOREIGN KEY (receiver_player_id) REFERENCES players(id)
  );

  CREATE TABLE IF NOT EXISTS game_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    player_id INTEGER NOT NULL,
    buy_in REAL NOT NULL,
    cash_out REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (game_id, player_id),
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id)
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_game_id ON transactions(game_id);
  CREATE INDEX IF NOT EXISTS idx_game_entries_game_id ON game_entries(game_id);
  CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);
`);

ensureGamesTableColumns();
backfillGameEntries();
