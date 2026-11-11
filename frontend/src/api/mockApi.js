// Mock API that mirrors the Express backend endpoints, backed by localStorage.
// It lets the frontend run on its own. To connect the real backend later,
// replace the functions in this file with fetch() calls to /api/... (same names
// and same return shapes), and nothing else in the app needs to change.
//
// NOTE: passwords are stored in plain text here ONLY because this is a mock.
// The real backend hashes them with bcrypt.

const DB_KEY = 'stocktrade_db_v1';
const SESSION_KEY = 'stocktrade_session_v1';
const START_BALANCE = 100000;

const SEED = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', price: 2900 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', price: 3900 },
  { symbol: 'INFY', name: 'Infosys', sector: 'IT', price: 1550 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking', price: 1650 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking', price: 1200 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', price: 800 },
  { symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG', price: 450 },
  { symbol: 'LT', name: 'Larsen & Toubro', sector: 'Infrastructure', price: 3600 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom', price: 1500 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Automobile', price: 950 },
  { symbol: 'WIPRO', name: 'Wipro', sector: 'IT', price: 480 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints', sector: 'Consumer', price: 2900 },
];

const round2 = (n) => Math.round(n * 100) / 100;
const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));

// ---------- Market simulation (in memory) ----------

function makeHistory(price, points = 80) {
  const out = [price];
  for (let i = 1; i < points; i++) {
    out.unshift(out[0] * (1 + (Math.random() - 0.5) * 0.012));
  }
  const now = Date.now();
  return out.map((p, i) => ({ t: now - (points - 1 - i) * 3000, price: round2(p) }));
}

const market = SEED.map((s) => {
  const history = makeHistory(s.price);
  return {
    symbol: s.symbol,
    name: s.name,
    sector: s.sector,
    prevClose: s.price,
    current: history[history.length - 1].price,
    history,
  };
});

// Only simulate prices when the mock is actually in use
if (import.meta.env.VITE_USE_MOCK === 'true') {
  setInterval(() => {
    const now = Date.now();
    for (const s of market) {
      const next = Math.max(1, s.current * (1 + (Math.random() * 2 - 1) * 0.004));
      s.current = round2(next);
      s.history.push({ t: now, price: s.current });
      if (s.history.length > 200) s.history.shift();
    }
  }, 3000);
}

function publicStock(s) {
  const change = round2(s.current - s.prevClose);
  return {
    symbol: s.symbol,
    name: s.name,
    sector: s.sector,
    current_price: s.current,
    prev_close: s.prevClose,
    change,
    change_percent: round2((change / s.prevClose) * 100),
  };
}

const findStock = (symbol) => market.find((s) => s.symbol === String(symbol).toUpperCase());

// ---------- Persistence ----------

function loadDb() {
  try {
    const raw = JSON.parse(localStorage.getItem(DB_KEY));
    if (raw) return raw;
  } catch {
    /* fall through */
  }
  return { users: [], orders: [], holdings: [], watchlist: [], nextId: 1 };
}

const saveDb = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db));

function currentUser(db) {
  const id = Number(localStorage.getItem(SESSION_KEY));
  const user = db.users.find((u) => u.id === id);
  if (!user) throw new Error('Not authenticated');
  return user;
}

const safeUser = (u) => ({ id: u.id, name: u.name, email: u.email, balance: u.balance });

// ---------- Auth ----------

export async function register({ name, email, password }) {
  await wait();
  if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
    throw new Error('Name, email and a password of 6+ characters are required');
  }
  const db = loadDb();
  const mail = email.toLowerCase().trim();
  if (db.users.some((u) => u.email === mail)) throw new Error('Email already registered');
  const user = {
    id: db.nextId++,
    name: name.trim(),
    email: mail,
    password,
    balance: START_BALANCE,
  };
  db.users.push(user);
  saveDb(db);
  localStorage.setItem(SESSION_KEY, String(user.id));
  return safeUser(user);
}

export async function login({ email, password }) {
  await wait();
  const db = loadDb();
  const user = db.users.find((u) => u.email === String(email).toLowerCase().trim());
  if (!user || user.password !== password) throw new Error('Invalid email or password');
  localStorage.setItem(SESSION_KEY, String(user.id));
  return safeUser(user);
}

export async function me() {
  await wait(40);
  return safeUser(currentUser(loadDb()));
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

// ---------- Stocks ----------

export async function getStocks(q = '') {
  await wait(60);
  const term = q.trim().toLowerCase();
  return market
    .filter((s) => !term || s.symbol.toLowerCase().includes(term) || s.name.toLowerCase().includes(term))
    .map(publicStock)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export async function getStock(symbol) {
  await wait(40);
  const s = findStock(symbol);
  if (!s) throw new Error('Stock not found');
  return { ...publicStock(s), history: s.history.map((h) => ({ price: h.price, recorded_at: h.t })) };
}

// ---------- Trading ----------

export async function trade({ symbol, side, quantity }) {
  await wait(200);
  const db = loadDb();
  const user = currentUser(db);
  const stock = findStock(symbol);
  const qty = Number(quantity);
  const sideU = String(side).toUpperCase();

  if (!stock) throw new Error('Stock not found');
  if (!['BUY', 'SELL'].includes(sideU) || !Number.isInteger(qty) || qty <= 0) {
    throw new Error('Enter a valid whole-number quantity');
  }

  const price = stock.current;
  const total = round2(price * qty);
  const holding = db.holdings.find((h) => h.userId === user.id && h.symbol === stock.symbol);

  if (sideU === 'BUY') {
    if (user.balance < total) throw new Error('Insufficient balance');
    user.balance = round2(user.balance - total);
    if (holding) {
      holding.avgPrice = round2((holding.avgPrice * holding.quantity + price * qty) / (holding.quantity + qty));
      holding.quantity += qty;
    } else {
      db.holdings.push({ userId: user.id, symbol: stock.symbol, quantity: qty, avgPrice: price });
    }
  } else {
    const owned = holding ? holding.quantity : 0;
    if (owned < qty) throw new Error(`You only hold ${owned} share(s) of ${stock.symbol}`);
    user.balance = round2(user.balance + total);
    holding.quantity -= qty;
    if (holding.quantity === 0) {
      db.holdings = db.holdings.filter((h) => h !== holding);
    }
  }

  const order = {
    id: db.nextId++,
    userId: user.id,
    symbol: stock.symbol,
    side: sideU,
    quantity: qty,
    price,
    total,
    created_at: new Date().toISOString(),
  };
  db.orders.push(order);
  saveDb(db);
  return { order, balance: user.balance };
}

// ---------- Portfolio ----------

export async function getPortfolio() {
  await wait(60);
  const db = loadDb();
  const user = currentUser(db);

  const holdings = db.holdings
    .filter((h) => h.userId === user.id)
    .map((h) => {
      const s = findStock(h.symbol);
      const invested = round2(h.quantity * h.avgPrice);
      const currentValue = round2(h.quantity * s.current);
      return {
        symbol: h.symbol,
        name: s.name,
        quantity: h.quantity,
        avg_price: h.avgPrice,
        current_price: s.current,
        invested,
        current_value: currentValue,
        pnl: round2(currentValue - invested),
        pnl_percent: round2(((s.current - h.avgPrice) / h.avgPrice) * 100),
      };
    })
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  const invested = holdings.reduce((sum, h) => sum + h.invested, 0);
  const currentValue = holdings.reduce((sum, h) => sum + h.current_value, 0);

  return {
    balance: user.balance,
    summary: {
      invested: round2(invested),
      current_value: round2(currentValue),
      pnl: round2(currentValue - invested),
      pnl_percent: invested ? round2(((currentValue - invested) / invested) * 100) : 0,
    },
    holdings,
  };
}

export async function getOrders() {
  await wait(60);
  const db = loadDb();
  const user = currentUser(db);
  return db.orders
    .filter((o) => o.userId === user.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 100);
}

// ---------- Watchlist ----------

export async function getWatchlist() {
  await wait(60);
  const db = loadDb();
  const user = currentUser(db);
  return db.watchlist
    .filter((w) => w.userId === user.id)
    .map((w) => publicStock(findStock(w.symbol)))
    .filter(Boolean);
}

export async function addToWatchlist(symbol) {
  await wait(40);
  const db = loadDb();
  const user = currentUser(db);
  const s = findStock(symbol);
  if (!s) throw new Error('Stock not found');
  if (!db.watchlist.some((w) => w.userId === user.id && w.symbol === s.symbol)) {
    db.watchlist.push({ userId: user.id, symbol: s.symbol });
    saveDb(db);
  }
  return { added: true };
}

export async function removeFromWatchlist(symbol) {
  await wait(40);
  const db = loadDb();
  const user = currentUser(db);
  const sym = String(symbol).toUpperCase();
  db.watchlist = db.watchlist.filter((w) => !(w.userId === user.id && w.symbol === sym));
  saveDb(db);
  return { removed: true };
}
