# Podium

Podium is a full-stack poker leaderboard and session archive built with Bun, Hono, SQLite, React, and Vite. The frontend is a mobile-first single-page app, and the backend is the source of truth for players, games, and settlement transactions.

## What the app does

- Shows a leaderboard with all-time, last-year, and last-month filters.
- Tracks player rankings, total profit/loss, win rate, average session result, and recent games.
- Provides a searchable players directory.
- Includes per-player analytics with cumulative performance history charts.
- Stores session history and detailed settlement transactions.
- Allows authenticated users to add, edit, and delete games from the History page.
- Supports copying a session's settlements into a WhatsApp-friendly text block.
- Uses pull-to-refresh in the main views to reload the latest backend data.

## Tech stack

- Bun for runtime, package management, and SQLite access
- Hono for the HTTP API
- SQLite for persistence
- React 19 for the frontend
- React Router for client-side routing
- Vite for frontend development and builds
- Recharts for charts
- Framer Motion for route transitions
- Zod for request validation

## App structure

```text
server/
  data/
    seed.json          Initial dataset used to seed an empty database
    podium.sqlite      Local SQLite database created at runtime
  src/
    db.ts              Schema creation and migration helpers
    index.ts           Hono API and static file serving
    repository.ts      Data access and write operations
    seed.ts            One-time bootstrap seeding from seed.json
    types.ts           Shared backend data types

web/
  src/
    App.tsx            Route setup
    hooks/useAppData.js
    lib/api.ts         API client and dataset processing
    pages/
      Leaderboard.jsx
      History.jsx
      Players.jsx
      Player.jsx
      Settings.jsx
```

## Frontend routes

- `/` - leaderboard, quick stats, podium, and chart view
- `/history` - session archive with add, edit, delete, and detailed transaction views
- `/players` - searchable player directory
- `/player/:name` - player analytics and recent games
- `/settings` - operational overview plus a simple game registration form

The richer game creation and editing flow is currently wired through the History page, where a bottom sheet opens the shared game form.

## Local development

### Requirements

- Bun 1.3+

### Install dependencies

```bash
bun install
```

### Run the API

```bash
bun run dev:api
```

The API runs on `http://localhost:3001` by default.

### Run the frontend

```bash
bun run dev:web
```

The Vite dev server runs on `http://localhost:5173` and proxies `/api` requests to `http://localhost:3001`.

## Environment variables

The backend reads these optional environment variables:

- `PORT` - API port. Defaults to `3001`.
- `ADMIN_PASSWORD` - enables auth for state-changing endpoints when set.
- `JWT_SECRET` - secret used to sign admin tokens. Falls back to `ADMIN_PASSWORD`, then to `fallback-secret`.

If `ADMIN_PASSWORD` is not set, write operations are allowed without authentication.

## Data storage and seeding

- SQLite database path: `server/data/podium.sqlite`
- Seed file: `server/data/seed.json`
- Schema creation happens automatically on server startup.
- Seed import runs automatically on startup only when the database has no games.
- Existing databases are not overwritten.
- The backend also backfills `game_entries` from stored JSON when needed during startup.

To trigger the seed logic manually:

```bash
bun run db:seed
```

## Build and production-style run

Build both frontend and backend:

```bash
bun run build
```

This outputs:

- `dist/web` - built frontend assets
- `dist/server.js` - bundled backend entry point

After building, run the bundled server:

```bash
bun dist/server.js
```

The server serves API routes under `/api` and serves the built SPA from `dist/web`, including client-side route fallback.

## Available scripts

```bash
bun run dev:web
bun run dev:api
bun run build:web
bun run build:api
bun run build
bun run start
bun run db:seed
bun run lint
```

## Authentication model

- `POST`, `PUT`, `DELETE`, and `PATCH` requests under `/api/*` are protected only when `ADMIN_PASSWORD` is configured.
- Login happens through `POST /api/auth/login`.
- The frontend stores the returned token in `localStorage` as `adminToken`.
- The History page prompts for the admin password before opening add/edit flows or allowing deletes.

## API

### `GET /api/health`

Returns a basic health response plus entity counts.

Example response:

```json
{
  "ok": true,
  "games": 42,
  "players": 11
}
```

### `POST /api/auth/login`

Request:

```json
{
  "password": "your-admin-password"
}
```

If `ADMIN_PASSWORD` is not set, the endpoint returns a success response without enforcing a password.

### `GET /api/data`

Returns the full dataset used by the frontend.

Response shape:

```json
{
  "games": [
    {
      "id": "GAME_ID",
      "date": "2026-03-25T18:30:00.000Z",
      "rawMessage": "optional original text",
      "sender": "manual-web",
      "entries": [
        { "player": "Alice", "buyIn": 200, "cashOut": 350 }
      ],
      "transactions": [
        { "payer": "Bob", "receiver": "Alice", "amount": 150, "raw": "optional raw line" }
      ],
      "results": {
        "Alice": 150,
        "Bob": -150
      }
    }
  ],
  "players": ["Alice", "Bob"]
}
```

### `POST /api/players`

Creates a player if the name does not already exist.

Request:

```json
{
  "name": "Alice"
}
```

### `POST /api/games`

Creates a game.

Request:

```json
{
  "date": "2026-03-25T18:30:00.000Z",
  "rawMessage": "optional source text",
  "sender": "manual-web",
  "entries": [
    { "player": "Alice", "buyIn": 200, "cashOut": 350 },
    { "player": "Bob", "buyIn": 200, "cashOut": 50 }
  ],
  "transactions": [
    { "payer": "Bob", "receiver": "Alice", "amount": 150 }
  ]
}
```

Validation rules enforced by the backend:

- `transactions` must be present, but may be an empty array.
- At least one of `entries` or `transactions` must contain data.
- If `sender` is `manual-web` or omitted, `entries` must be present.
- `payer` and `receiver` must be different.

### `PUT /api/games/:id`

Updates an existing game using the same payload shape as `POST /api/games`.

### `DELETE /api/games/:id`

Deletes a game and its related entries and transactions.

## Notes on game creation

There are two write paths in the UI:

- The History page uses the main game editor, where users enter buy-in and cash-out per player. The frontend derives settlement transactions automatically before submitting the game.
- The Settings page exposes a simpler transaction-based registration form.

Both paths write into the same backend dataset, so leaderboard, history, and player analytics remain consistent.
