-- StockTrade: paper-trading platform schema (PostgreSQL)

DROP TABLE IF EXISTS watchlist, holdings, orders, price_history, stocks, users CASCADE;

CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    balance       NUMERIC(14,2) NOT NULL DEFAULT 100000.00 CHECK (balance >= 0),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stocks (
    id            SERIAL PRIMARY KEY,
    symbol        VARCHAR(20) NOT NULL UNIQUE,
    name          VARCHAR(150) NOT NULL,
    sector        VARCHAR(80),
    current_price NUMERIC(12,2) NOT NULL CHECK (current_price > 0),
    prev_close    NUMERIC(12,2) NOT NULL CHECK (prev_close > 0),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE price_history (
    id          BIGSERIAL PRIMARY KEY,
    stock_id    INT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    price       NUMERIC(12,2) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_price_history_stock_time ON price_history (stock_id, recorded_at DESC);

CREATE TABLE orders (
    id         BIGSERIAL PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_id   INT NOT NULL REFERENCES stocks(id),
    side       VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    quantity   INT NOT NULL CHECK (quantity > 0),
    price      NUMERIC(12,2) NOT NULL,
    total      NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_user_time ON orders (user_id, created_at DESC);

CREATE TABLE holdings (
    id        SERIAL PRIMARY KEY,
    user_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_id  INT NOT NULL REFERENCES stocks(id),
    quantity  INT NOT NULL CHECK (quantity > 0),
    avg_price NUMERIC(12,2) NOT NULL,
    UNIQUE (user_id, stock_id)
);

CREATE TABLE watchlist (
    user_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_id INT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, stock_id)
);
