# Mini E-Commerce

Monorepo for a small coffee equipment shop. The API is Express and the client is React, installed together with npm workspaces.

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Setup

From a fresh clone:

```bash
npm run setup
npm run dev
```

`npm run setup` installs both workspaces and seeds the SQLite database.

## Running

`npm run dev` starts both processes:

- API on port 3001
- Vite on port 5173

Requests to `/api` from the Vite server are proxied to the API. Open `http://localhost:5173`.

The login screen shows the seeded demo email and password. The seed script prints the same pair.

## Scripts

- `npm run dev` starts the API and the client.
- `npm run seed` deletes the SQLite file, recreates the schema, and loads the catalog. Stop the API first if the database file is locked.
- `npm run setup` installs dependencies, then seeds.
- `npm run test:e2e` seeds a temporary database, boots the API, and checks login, cart, checkout, and a stock conflict. It does not use the dev database.
