from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import PriceHistory, Stock
from ..schemas import iso, money, stock_out

router = APIRouter(prefix="/api/stocks", tags=["stocks"])


@router.get("")
def list_stocks(q: str = "", db: Session = Depends(get_db)):
    query = select(Stock).order_by(Stock.symbol)
    term = q.strip()
    if term:
        like = f"%{term}%"
        query = query.where(or_(Stock.symbol.ilike(like), Stock.name.ilike(like)))
    return [stock_out(s) for s in db.scalars(query)]


@router.get("/{symbol}")
def stock_detail(symbol: str, db: Session = Depends(get_db)):
    stock = db.scalar(select(Stock).where(Stock.symbol == symbol.upper()))
    if stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")

    rows = db.execute(
        select(PriceHistory.price, PriceHistory.recorded_at)
        .where(PriceHistory.stock_id == stock.id)
        .order_by(PriceHistory.recorded_at.desc())
        .limit(200)
    ).all()
    history = [{"price": money(p), "recorded_at": iso(t)} for p, t in reversed(rows)]
    return {**stock_out(stock), "history": history}
