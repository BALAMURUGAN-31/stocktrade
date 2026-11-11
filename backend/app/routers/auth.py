from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import START_BALANCE
from ..database import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import LoginIn, RegisterIn, user_out
from ..security import create_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=201)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        name=body.name.strip(),
        email=email,
        password_hash=hash_password(body.password),
        balance=Decimal(START_BALANCE),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:  # two sign-ups with the same email at the same moment
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")

    return {"token": create_token(user.id, user.email), "user": user_out(user)}


@router.post("/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower().strip()))
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"token": create_token(user.id, user.email), "user": user_out(user)}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return user_out(user)
