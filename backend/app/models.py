from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .config import START_BALANCE
from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("balance >= 0", name="ck_users_balance_nonneg"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal(START_BALANCE))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Stock(Base):
    __tablename__ = "stocks"

    id: Mapped[int] = mapped_column(primary_key=True)
    symbol: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(150))
    sector: Mapped[str | None] = mapped_column(String(80), nullable=True)
    current_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    prev_close: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class PriceHistory(Base):
    __tablename__ = "price_history"
    __table_args__ = (Index("ix_price_history_stock_time", "stock_id", "recorded_at"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    stock_id: Mapped[int] = mapped_column(ForeignKey("stocks.id", ondelete="CASCADE"))
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint("side IN ('BUY','SELL')", name="ck_orders_side"),
        CheckConstraint("quantity > 0", name="ck_orders_qty_positive"),
        Index("ix_orders_user_time", "user_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    stock_id: Mapped[int] = mapped_column(ForeignKey("stocks.id"))
    side: Mapped[str] = mapped_column(String(4))
    quantity: Mapped[int]
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    total: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    stock: Mapped[Stock] = relationship()


class Holding(Base):
    __tablename__ = "holdings"
    __table_args__ = (
        UniqueConstraint("user_id", "stock_id", name="uq_holdings_user_stock"),
        CheckConstraint("quantity > 0", name="ck_holdings_qty_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    stock_id: Mapped[int] = mapped_column(ForeignKey("stocks.id"))
    quantity: Mapped[int]
    avg_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))

    stock: Mapped[Stock] = relationship()


class Watchlist(Base):
    __tablename__ = "watchlist"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    stock_id: Mapped[int] = mapped_column(ForeignKey("stocks.id", ondelete="CASCADE"), primary_key=True)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    stock: Mapped[Stock] = relationship()
