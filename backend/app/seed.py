"""Creates the demo stocks (with a little fake price history so charts aren't empty)."""
import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select

from .database import SessionLocal
from .models import PriceHistory, Stock

# Prices are approximate placeholders for a simulator, not live quotes.
STOCKS = [
    ("RELIANCE", "Reliance Industries", "Energy", 2900),
    ("TCS", "Tata Consultancy Services", "IT", 3900),
    ("INFY", "Infosys", "IT", 1550),
    ("HDFCBANK", "HDFC Bank", "Banking", 1650),
    ("ICICIBANK", "ICICI Bank", "Banking", 1200),
    ("SBIN", "State Bank of India", "Banking", 800),
    ("ITC", "ITC Limited", "FMCG", 450),
    ("LT", "Larsen & Toubro", "Infrastructure", 3600),
    ("BHARTIARTL", "Bharti Airtel", "Telecom", 1500),
    ("TATAMOTORS", "Tata Motors", "Automobile", 950),
    ("WIPRO", "Wipro", "IT", 480),
    ("ASIANPAINT", "Asian Paints", "Consumer", 2900),
]

HISTORY_POINTS = 80
HISTORY_STEP_SECONDS = 5


def seed_if_empty() -> None:
    with SessionLocal() as db:
        if db.scalar(select(Stock.id).limit(1)) is not None:
            return

        now = datetime.now(timezone.utc)
        for symbol, name, sector, base in STOCKS:
            # random walk that ends at "now"
            prices = [float(base)]
            for _ in range(HISTORY_POINTS - 1):
                prices.insert(0, prices[0] * (1 + random.uniform(-0.006, 0.006)))
            prices = [Decimal(str(round(p, 2))) for p in prices]

            stock = Stock(
                symbol=symbol,
                name=name,
                sector=sector,
                current_price=prices[-1],
                prev_close=Decimal(base),
            )
            db.add(stock)
            db.flush()  # get stock.id

            for i, price in enumerate(prices):
                age = (HISTORY_POINTS - 1 - i) * HISTORY_STEP_SECONDS
                db.add(PriceHistory(stock_id=stock.id, price=price, recorded_at=now - timedelta(seconds=age)))

        db.commit()
        print(f"Seeded {len(STOCKS)} stocks.")
