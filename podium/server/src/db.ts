import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Database } from 'bun:sqlite';

const dbPath = resolve(process.cwd(), 'server/data/podium.sqlite');
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath, { create: true });

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

  CREATE INDEX IF NOT EXISTS idx_transactions_game_id ON transactions(game_id);
  CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);
`);
