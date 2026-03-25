import { db } from './db';
import type { CreateGameInput, Dataset, GameRecord, GameTransaction } from './types';

function buildResults(transactions: GameTransaction[]): Record<string, number> {
  const results: Record<string, number> = {};

  for (const transaction of transactions) {
    results[transaction.payer] = (results[transaction.payer] ?? 0) - transaction.amount;
    results[transaction.receiver] = (results[transaction.receiver] ?? 0) + transaction.amount;
  }

  return results;
}

function upsertPlayer(name: string): number {
  db.query('INSERT OR IGNORE INTO players (name) VALUES (?)').run(name);
  const row = db.query('SELECT id FROM players WHERE name = ?').get(name) as { id: number } | null;

  if (!row) {
    throw new Error(`Failed to resolve player '${name}'`);
  }

  return row.id;
}

function gameExists(gameId: string): boolean {
  const row = db.query('SELECT 1 as ok FROM games WHERE id = ?').get(gameId) as { ok: number } | null;
  return Boolean(row?.ok);
}

export function saveGame(input: CreateGameInput & { id?: string }): string {
  const gameId = input.id ?? crypto.randomUUID().replace(/-/g, '').toUpperCase();

  if (gameExists(gameId)) {
    return gameId;
  }

  const insertInTransaction = db.transaction(() => {
    db.query('INSERT INTO games (id, date, raw_message, sender) VALUES (?, ?, ?, ?)').run(
      gameId,
      input.date,
      input.rawMessage,
      input.sender,
    );

    for (const transaction of input.transactions) {
      const payerId = upsertPlayer(transaction.payer);
      const receiverId = upsertPlayer(transaction.receiver);

      db.query(
        'INSERT INTO transactions (game_id, payer_player_id, receiver_player_id, amount, raw) VALUES (?, ?, ?, ?, ?)',
      ).run(gameId, payerId, receiverId, transaction.amount, transaction.raw ?? null);
    }
  });

  insertInTransaction();
  return gameId;
}

export function getDataset(): Dataset {
  const players = db
    .query('SELECT name FROM players ORDER BY name COLLATE NOCASE ASC')
    .all() as Array<{ name: string }>;

  const games = db
    .query('SELECT id, date, raw_message as rawMessage, sender FROM games ORDER BY date DESC')
    .all() as Array<{ id: string; date: string; rawMessage: string | null; sender: string | null }>;

  const allTransactions = db
    .query(
      `SELECT
         t.game_id as gameId,
         payer.name as payer,
         receiver.name as receiver,
         t.amount as amount,
         t.raw as raw
       FROM transactions t
       JOIN players payer ON payer.id = t.payer_player_id
       JOIN players receiver ON receiver.id = t.receiver_player_id
       ORDER BY t.id ASC`,
    )
    .all() as Array<{
    gameId: string;
    payer: string;
    receiver: string;
    amount: number;
    raw: string | null;
  }>;

  const txByGame = new Map<string, GameTransaction[]>();

  for (const transaction of allTransactions) {
    const list = txByGame.get(transaction.gameId) ?? [];
    list.push({
      payer: transaction.payer,
      receiver: transaction.receiver,
      amount: Number(transaction.amount),
      raw: transaction.raw ?? undefined,
    });
    txByGame.set(transaction.gameId, list);
  }

  const normalizedGames: GameRecord[] = games.map((game) => {
    const transactions = txByGame.get(game.id) ?? [];

    return {
      id: game.id,
      date: game.date,
      rawMessage: game.rawMessage ?? '',
      sender: game.sender ?? 'manual',
      transactions,
      results: buildResults(transactions),
    };
  });

  return {
    games: normalizedGames,
    players: players.map((entry) => entry.name),
  };
}

export function getCounts() {
  const gameCount = db.query('SELECT COUNT(*) as value FROM games').get() as { value: number };
  const playerCount = db.query('SELECT COUNT(*) as value FROM players').get() as { value: number };

  return {
    games: Number(gameCount.value),
    players: Number(playerCount.value),
  };
}
