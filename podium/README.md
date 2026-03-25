# Podium Full-Stack Leaderboard

This recreates the poker leaderboard as a Bun + TypeScript full-stack app.

## Stack

- Bun runtime and package manager
- TypeScript for API and build config
- Hono API server
- SQLite (via `bun:sqlite`) for persistence
- React + Vite frontend (same UI/UX as the original app)

## What changed from static version

- Removed dependency on the WhatsApp bot as the runtime data source.
- Leaderboard/history/player views now read from `GET /api/data`.
- New game registration flow in Settings writes to `POST /api/games`.
- Initial data is seeded from `server/data/seed.json`.

## Run locally

Install:

```bash
bun install
```

Start API:

```bash
bun run dev:api
```

Start frontend (new terminal):

```bash
bun run dev:web
```

Frontend runs at `http://localhost:5173` and proxies `/api` to `http://localhost:3001`.

## Build

```bash
bun run build
```

## API

- `GET /api/health`
- `GET /api/data`
- `POST /api/games`

`POST /api/games` payload:

```json
{
  "date": "2026-03-25T18:30:00.000Z",
  "rawMessage": "optional source text",
  "sender": "web-form",
  "transactions": [
    { "payer": "Alice", "receiver": "Bob", "amount": 50 }
  ]
}
```
