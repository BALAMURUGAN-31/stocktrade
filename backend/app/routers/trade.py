from decimal import ROUND_HALF_UP, Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import Holding, Order, Stock, User
from ..schemas import TradeIn, iso, money

router = APIRouter(prefix="/api/trade", tags=["trade"])

CENT = Decimal("0.01")


def q2(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


@router.post("", status_code=201)
def place_order(body: TradeIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Buy or sell at the current market price.

    Everything below happens in ONE database transaction: the wallet, the holding and
    the order record are saved together by a single commit() or not at all. The user
    row is locked first (SELECT ... FOR UPDATE on PostgreSQL) so two simultaneous
    orders cannot spend the same money twice.
    """
    symbol = body.symbol.upper().strip()
    stock = db.scalar(select(Stock).where(Stock.symbol == symbol))
    if stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")

    wallet = db.scalar(
        select(User).where(User.id == user.id).with_for_update().execution_options(populate_existing=True)
    )
    price = Decimal(stock.current_price)
    qty = body.quantity
    total = q2(price * qty)

    holding = db.scalar(
        select(Holding)
        .where(Holding.user_id == user.id, Holding.stock_id == stock.id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )

    if body.side == "BUY":
        if Decimal(wallet.balance) < total:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        wallet.balance = Decimal(wallet.balance) - total

        if holding is None:
            db.add(Holding(user_id=user.id, stock_id=stock.id, quantity=qty, avg_price=price))
        else:
            old_cost = Decimal(holding.avg_price) * holding.quantity
            holding.avg_price = q2((old_cost + price * qty) / (holding.quantity + qty))
            holding.quantity += qty
    else:  # SELL
        owned = holding.quantity if holding else 0
        if owned < qty:
            raise HTTPException(status_code=400, detail=f"You only hold {owned} share(s) of {symbol}")
        wallet.balance = Decimal(wallet.balance) + total

        if owned == qty:
            db.delete(holding)
        else:
            holding.quantity -= qty

    order = Order(user_id=user.id, stock_id=stock.id, side=body.side, quantity=qty, price=price, total=total)
    db.add(order)
    db.commit()  # all-or-nothing

    return {
        "order": {
            "id": order.id,
            "symbol": symbol,
            "side": order.side,
            "quantity": order.quantity,
            "price": money(order.price),
            "total": money(order.total),
            "created_at": iso(order.created_at),
        },
        "balance": money(wallet.balance),
    }
