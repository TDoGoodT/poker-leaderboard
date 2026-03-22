# Poker Leaderboard

A poker session tracker and leaderboard dashboard. Game history is imported automatically from a WhatsApp group via a bot, or entered manually in-app. Stats are computed client-side and displayed across several views.

## Features

- **Leaderboard** — ranked standings with podium cards, net totals, and win rates
- **History** — per-session cards showing results, transactions, and raw source messages
- **Players** — searchable player list with rank, net, and win-rate badges
- **Player profile** — per-player KPIs, cumulative profit/loss chart, and recent games
- **New session** — manual entry form with balance validation, saved to browser localStorage
- **Settings** — clear locally-saved sessions

## Data flow

1. The bot (`bot/`) connects to WhatsApp Web, fetches messages from a configured group, parses game results (including Hebrew message variants), and writes structured data to `public/data.json`, then auto-commits and pushes.
2. The frontend (`src/lib/api.js`) fetches `data.json` at runtime and merges it with any locally-saved sessions stored in `localStorage` under `pokerpal.local-sessions.v1`.
3. `processData()` in `src/lib/api.js` derives all aggregates (rankings, win rates, biggest swings, recent form). Pages consume this via the `useAppData` hook.

## Development

This project uses **Bun** as its package manager.

```bash
bun install          # install dependencies
bun run dev          # start dev server (http://localhost:5173)
bun run build        # production build
bun run preview      # preview production build
bun run lint         # run ESLint
bun run bot          # run the WhatsApp import bot
```

The app is deployed under the `/poker-leaderboard/` subpath (configured in `vite.config.js`).

## Bot setup

The bot uses [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) with `LocalAuth`. On first run it prints a QR code to scan with WhatsApp. Once authenticated, it syncs up to 5000 messages from the configured group and parses any game result messages.

Player name aliases and fuzzy matching are configured in `bot/parser.js`.

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) for charts
- [React Router](https://reactrouter.com/) for client-side routing
- [date-fns](https://date-fns.org/) for date formatting
- [lucide-react](https://lucide.dev/) for icons
