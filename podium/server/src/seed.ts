import { resolve } from 'node:path';
import { getCounts, saveGame } from './repository';
import type { Dataset } from './types';

async function seedFromFile() {
  const before = getCounts();
  if (before.games > 0) {
    console.log(`Seed skipped: database already has ${before.games} game(s).`);
    return;
  }

  const seedPath = resolve(process.cwd(), 'server/data/seed.json');
  const seedFile = Bun.file(seedPath);

  if (!(await seedFile.exists())) {
    console.log(`Seed file not found at ${seedPath}.`);
    return;
  }

  const payload = (await seedFile.json()) as Dataset;

  for (const game of payload.games ?? []) {
    const transactions = (game.transactions ?? []).map((transaction) => ({
      payer: transaction.payer,
      receiver: transaction.receiver,
      amount: Number(transaction.amount),
      raw: transaction.raw,
    }));

    if (!transactions.length) {
      continue;
    }

    saveGame({
      id: game.id,
      date: game.date,
      rawMessage: game.rawMessage ?? '',
      sender: game.sender ?? 'seed',
      transactions,
    });
  }

  const after = getCounts();
  console.log(`Seed complete: ${after.games} games and ${after.players} players.`);
}

void seedFromFile();
