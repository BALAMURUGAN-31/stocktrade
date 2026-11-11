from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..deps import get_current_user
from ..models import Holding, Order, User
from ..schemas import iso, money

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


@router.get("")
def portfolio(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Holding).options(joinedload(Holding.stock)).where(Holding.user_id == user.id)
    ).all()

    holdings = []
    total_invested = Decimal(0)
    total_current = Decimal(0)

    for h in sorted(rows, key=lambda r: r.stock.symbol):
        avg = Decimal(h.avg_price)
        ltp = Decimal(h.stock.current_price)
        invested = avg * h.quantity
        current = ltp * h.quantity
        total_invested += invested
        total_current += current
        holdings.append(
            {
                "symbol": h.stock.symbol,
                "name": h.stock.name,
                "quantity": h.quantity,
                "avg_price": money(avg),
                "current_price": money(ltp),
                "invested": money(invested),
                "current_value": money(current),
                "pnl": money(current - invested),
                "pnl_percent": round(float((ltp - avg) / avg * 100), 2) if avg else 0.0,
            }
        )

    pnl = total_current - total_invested
    return {
        "balance": money(user.balance),
        "summary": {
            "invested": money(total_invested),
            "current_value": money(total_current),
            "pnl": money(pnl),
            "pnl_percent": round(float(pnl / total_invested * 100), 2) if total_invested else 0.0,
        },
        "holdings": holdings,
    }


@router.get("/orders")
def order_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = db.scalars(
        select(Order)
        .options(joinedload(Order.stock))
        .where(Order.user_id == user.id)
        .order_by(Order.created_at.desc(), Order.id.desc())
        .limit(100)
    ).all()
    return [
        {
            "id": o.id,
            "symbol": o.stock.symbol,
            "side": o.side,
            "quantity": o.quantity,
            "price": money(o.price),
            "total": money(o.total),
            "created_at": iso(o.created_at),
        }
        for o in orders
    ]
