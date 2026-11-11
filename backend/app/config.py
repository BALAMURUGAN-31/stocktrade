import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./stocktrade.db")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-secret-change-me")
CLIENT_ORIGIN = os.getenv("CLIENT_ORIGIN", "http://localhost:5173")

START_BALANCE = 100000        # virtual cash given to every new user (INR)
PRICE_TICK_SECONDS = 5        # how often the simulator moves prices
MAX_MOVE = 0.005              # max price change per tick (+/- 0.5%)
