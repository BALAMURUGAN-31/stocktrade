import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import CLIENT_ORIGIN, JWT_SECRET
from .database import Base, engine
from .routers import auth, portfolio, stocks, trade, watchlist
from .seed import seed_if_empty
from .simulator import price_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    if JWT_SECRET == "dev-only-secret-change-me":
        print("WARNING: using the default JWT_SECRET. Set a real one in .env before deploying.")
    Base.metadata.create_all(bind=engine)
    seed_if_empty()
    task = asyncio.create_task(price_loop())
    yield
    task.cancel()
    with suppress(asyncio.CancelledError):
        await task


app = FastAPI(title="StockTrade API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CLIENT_ORIGIN.split(",")],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Return errors as {"error": "..."} so the frontend has one simple format to read.
@app.exception_handler(StarletteHTTPException)
async def http_error(_: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": str(exc.detail)})


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, exc: RequestValidationError):
    first = exc.errors()[0]
    field = str(first["loc"][-1]) if first.get("loc") else "input"
    return JSONResponse(status_code=422, content={"error": f"Invalid {field}: {first['msg']}"})


@app.get("/api/health")
def health():
    return {"status": "ok"}


for module in (auth, stocks, trade, portfolio, watchlist):
    app.include_router(module.router)
