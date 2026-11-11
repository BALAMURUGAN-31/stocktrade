# StockTrade — Paper Trading Platform

A Groww / Angel One–style stock trading web app that uses **virtual money** (₹1,00,000 per user).

**Stack:** React + Vite (frontend) · Python FastAPI + SQLAlchemy (backend) · SQLite by default, MySQL and PostgreSQL supported

> Educational project. Prices are simulated; no real trading or real money is involved.

## Features

- Sign up / log in with JWT authentication and bcrypt-hashed passwords
- Stock list with search, sector filters, top gainers / losers
- Live (simulated) prices and price charts
- Buy / sell orders executed in a single database transaction, so wallet, holdings and order history never get out of sync
- Portfolio with invested value, current value, P&L and an allocation chart
- Watchlist and order history

## Project structure

```
stocktrade/
  backend/    FastAPI app (app/main.py is the entry point)
  frontend/   React app
  database/   schema_mysql.sql, schema_postgres.sql, seed.sql (optional: the backend creates its own tables)
```

## Run it (two terminals)

You need **Python 3.10+** and **Node.js 18+**.

### Terminal 1: backend

```
cd backend
python -m venv venv
venv\Scripts\activate          # Windows   (Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at http://localhost:8000 and interactive docs are at http://localhost:8000/docs.
The first start creates `stocktrade.db` and seeds 12 stocks automatically.

### Terminal 2: frontend

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and create an account.

## Using MySQL instead of SQLite

1. Create the database in MySQL: `CREATE DATABASE stocktrade;`
2. In `backend/requirements.txt`, uncomment `pymysql` and `cryptography`, then run `pip install -r requirements.txt`
3. In `backend/`, copy `.env.example` to `.env` and set
   `DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/stocktrade`
   (if your password has special characters such as `@`, write them URL-encoded, e.g. `@` becomes `%40`)
4. Restart the backend. The tables are created and seeded automatically.

Optional: `database/schema_mysql.sql` and `database/seed.sql` create the same tables and stocks by hand, which is handy for practising SQL on them.

## Using PostgreSQL instead of SQLite

1. Create a database: `createdb stocktrade`
2. In `backend/`, copy `.env.example` to `.env` and set
   `DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/stocktrade`
3. Uncomment `psycopg2-binary` in `requirements.txt` and run `pip install -r requirements.txt`
4. Restart the backend. Tables are created automatically.

## API overview

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /api/auth/register | no | Create account |
| POST | /api/auth/login | no | Log in, get token |
| GET | /api/auth/me | yes | Current user |
| GET | /api/stocks?q= | no | List / search stocks |
| GET | /api/stocks/{symbol} | no | Stock detail + price history |
| POST | /api/trade | yes | Buy or sell `{symbol, side, quantity}` |
| GET | /api/portfolio | yes | Holdings and P&L |
| GET | /api/portfolio/orders | yes | Order history |
| GET / POST / DELETE | /api/watchlist | yes | Manage watchlist |

## Frontend without a backend

Copy `frontend/.env.example` to `frontend/.env` and set `VITE_USE_MOCK=true`. The frontend then uses fake in-browser data.

## Screenshots

![Explore stocks](docs/explore.png)
![Stock detail with buy and sell](docs/stock.png)
![Portfolio](docs/portfolio.png)
![Order history](docs/orders.png)