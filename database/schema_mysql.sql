-- StockTrade: paper-trading platform schema (MySQL 8+ / MariaDB 10.5+)
-- Optional: the backend creates these tables by itself on first start.
-- Run this file only if you want to create/inspect the tables yourself:
--     mysql -u root -p < database/schema_mysql.sql
--     mysql -u root -p stocktrade < database/seed.sql

CREATE DATABASE IF NOT EXISTS stocktrade;
USE stocktrade;

DROP TABLE IF EXISTS watchlist, holdings, orders, price_history, stocks, users;

CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    balance       DECIMAL(14,2) NOT NULL DEFAULT 100000.00,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_users_balance_nonneg CHECK (balance >= 0)
) ENGINE=InnoDB;

CREATE TABLE stocks (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    symbol        VARCHAR(20)   NOT NULL UNIQUE,
    name          VARCHAR(150)  NOT NULL,
    sector        VARCHAR(80),
    current_price DECIMAL(12,2) NOT NULL,
    prev_close    DECIMAL(12,2) NOT NULL,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_stocks_price_positive CHECK (current_price > 0 AND prev_close > 0)
) ENGINE=InnoDB;

CREATE TABLE price_history (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    stock_id    INT           NOT NULL,
    price       DECIMAL(12,2) NOT NULL,
    recorded_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_price_history_stock FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,
    INDEX ix_price_history_stock_time (stock_id, recorded_at)
) ENGINE=InnoDB;

CREATE TABLE orders (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT           NOT NULL,
    stock_id   INT           NOT NULL,
    side       VARCHAR(4)    NOT NULL,
    quantity   INT           NOT NULL,
    price      DECIMAL(12,2) NOT NULL,
    total      DECIMAL(14,2) NOT NULL,
    created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_stock FOREIGN KEY (stock_id) REFERENCES stocks(id),
    CONSTRAINT ck_orders_side CHECK (side IN ('BUY', 'SELL')),
    CONSTRAINT ck_orders_qty_positive CHECK (quantity > 0),
    INDEX ix_orders_user_time (user_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE holdings (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    user_id   INT           NOT NULL,
    stock_id  INT           NOT NULL,
    quantity  INT           NOT NULL,
    avg_price DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_holdings_user  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_holdings_stock FOREIGN KEY (stock_id) REFERENCES stocks(id),
    CONSTRAINT uq_holdings_user_stock UNIQUE (user_id, stock_id),
    CONSTRAINT ck_holdings_qty_positive CHECK (quantity > 0)
) ENGINE=InnoDB;

CREATE TABLE watchlist (
    user_id  INT      NOT NULL,
    stock_id INT      NOT NULL,
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, stock_id),
    CONSTRAINT fk_watchlist_user  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_watchlist_stock FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE
) ENGINE=InnoDB;
