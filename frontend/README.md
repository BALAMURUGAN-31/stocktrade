# StockTrade Frontend

React + Vite frontend for the StockTrade paper-trading platform.

## Run

Start the Python backend first (see the main README), then:

```
npm install
npm run dev
```

Open http://localhost:5173.

## Configuration

Defaults work out of the box (backend at http://localhost:8000). To change them, copy `.env.example` to `.env`:

- `VITE_API_URL` — where the backend runs
- `VITE_USE_MOCK=true` — run without a backend using fake in-browser data

## Where the data comes from

All data calls go through `src/api/index.js`, which picks either:

- `src/api/realApi.js` — `fetch()` calls to the FastAPI backend (default)
- `src/api/mockApi.js` — fake data stored in localStorage

Both export the same function names and return shapes, so the pages don't care which one is active.

## Pages

- `/login` — sign up / log in
- `/` — Explore: search, sector filter, top gainers/losers, watchlist star
- `/stock/:symbol` — price chart, buy / sell panel
- `/portfolio` — holdings, P&L, allocation chart
- `/watchlist` — saved stocks
- `/orders` — order history
