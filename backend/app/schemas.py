from datetime import datetime, timezone
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class LoginIn(BaseModel):
    email: str
    password: str


class TradeIn(BaseModel):
    symbol: str = Field(min_length=1, max_length=20)
    side: Literal["BUY", "SELL"]
    quantity: int = Field(gt=0, le=1_000_000)

    @field_validator("side", mode="before")
    @classmethod
    def upper_side(cls, v):
        return v.upper() if isinstance(v, str) else v


# ---------- helpers to turn DB rows into JSON-friendly dicts ----------

def money(value) -> float:
    """Decimal/None -> float rounded to 2 places (what the frontend expects)."""
    return round(float(value or 0), 2)


def iso(dt: datetime) -> str:
    if dt.tzinfo is None:  # SQLite returns naive datetimes; they are stored as UTC
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def user_out(user) -> dict:
    return {"id": user.id, "name": user.name, "email": user.email, "balance": money(user.balance)}


def stock_out(stock) -> dict:
    current = Decimal(stock.current_price)
    prev = Decimal(stock.prev_close)
    change = current - prev
    return {
        "symbol": stock.symbol,
        "name": stock.name,
        "sector": stock.sector,
        "current_price": money(current),
        "prev_close": money(prev),
        "change": money(change),
        "change_percent": round(float(change / prev * 100), 2) if prev else 0.0,
    }
