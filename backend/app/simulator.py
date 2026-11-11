"""Random-walk price simulator. Swap for a real market-data API later if you want live quotes."""
import asyncio
import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import delete, select

from .config import MAX_MOVE, PRICE_TICK_SECONDS
from .database import SessionLocal
from .models import PriceHistory, Stock

HISTORY_KEEP = timedelta(days=1)


def tick(trim: bool = False) -> None:
    now = datetime.now(timezone.utc)
    with SessionLocal() as db:
        for stock in db.scalars(select(Stock)):
            move = random.uniform(-MAX_MOVE, MAX_MOVE)
            new_price = max(1.0, float(stock.current_price) * (1 + move))
            price = Decimal(str(round(new_price, 2)))
            stock.current_price = price
            stock.updated_at = now
            db.add(PriceHistory(stock_id=stock.id, price=price, recorded_at=now))
        if trim:
            db.execute(delete(PriceHistory).where(PriceHistory.recorded_at < now - HISTORY_KEEP))
        db.commit()


async def price_loop() -> None:
    count = 0
    while True:
        await asyncio.sleep(PRICE_TICK_SECONDS)
        count += 1
        try:
            # run the blocking DB work in a worker thread so the API stays responsive
            await asyncio.to_thread(tick, count % 120 == 0)
        except Exception as exc:  # keep the loop alive no matter what
            print("Price simulator error:", exc)
