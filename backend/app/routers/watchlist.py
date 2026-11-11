from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..deps import get_current_user
from ..models import Stock, User, Watchlist
from ..schemas import stock_out

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


def _find_stock(db: Session, symbol: str) -> Stock:
    stock = db.scalar(select(Stock).where(Stock.symbol == symbol.upper()))
    if stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")
    return stock


@router.get("")
def get_watchlist(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Watchlist)
        .options(joinedload(Watchlist.stock))
        .where(Watchlist.user_id == user.id)
        .order_by(Watchlist.added_at.desc())
    ).all()
    return [stock_out(w.stock) for w in rows]


@router.post("/{symbol}", status_code=201)
def add_to_watchlist(symbol: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stock = _find_stock(db, symbol)
    exists = db.get(Watchlist, (user.id, stock.id))
    if exists is None:
        db.add(Watchlist(user_id=user.id, stock_id=stock.id))
        db.commit()
    return {"added": exists is None}


@router.delete("/{symbol}")
def remove_from_watchlist(symbol: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stock = _find_stock(db, symbol)
    db.execute(delete(Watchlist).where(Watchlist.user_id == user.id, Watchlist.stock_id == stock.id))
    db.commit()
    return {"removed": True}
