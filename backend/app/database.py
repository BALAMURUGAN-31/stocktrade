import warnings

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import DATABASE_URL

# SQLite stores Decimal as float internally; SQLAlchemy warns about it. Harmless here.
warnings.filterwarnings("ignore", message=".*does \\*not\\* support Decimal.*")

is_sqlite = DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False, "timeout": 30} if is_sqlite else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)

if is_sqlite:
    # WAL mode lets the price simulator write while API requests read.
    @event.listens_for(engine, "connect")
    def _sqlite_pragmas(dbapi_conn, _):
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA journal_mode=WAL")
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency: one DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
