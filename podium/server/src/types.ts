export type GameTransaction = {
  payer: string;
  receiver: string;
  amount: number;
  raw?: string;
};

export type GameEntry = {
  player: string;
  buyIn: number;
  cashOut: number;
};

export type GameRecord = {
  id: string;
  date: string;
  rawMessage: string;
  sender: string;
  entries?: GameEntry[];
  transactions: GameTransaction[];
  results: Record<string, number>;
};

export type Dataset = {
  games: GameRecord[];
  players: string[];
};

export type CreateGameInput = {
  date: string;
  rawMessage: string;
  sender: string;
  entries?: GameEntry[];
  transactions: GameTransaction[];
};
