// Real API: talks to the Python (FastAPI) backend over HTTP.
// Same function names and return shapes as mockApi.js, so no page needs to change.

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const TOKEN_KEY = 'stocktrade_token_v1';

const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running on ' + BASE + '?');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (!res.ok) {
    if (res.status === 401 && auth) localStorage.removeItem(TOKEN_KEY); // expired / invalid token
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

// ---------- Auth ----------

export async function register({ name, email, password }) {
  const { token, user } = await request('/api/auth/register', {
    method: 'POST',
    auth: false,
    body: { name, email, password },
  });
  setToken(token);
  return user;
}

export async function login({ email, password }) {
  const { token, user } = await request('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });
  setToken(token);
  return user;
}

export async function me() {
  if (!getToken()) throw new Error('Not authenticated');
  return request('/api/auth/me');
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

// ---------- Stocks ----------

export const getStocks = (q = '') => request(`/api/stocks?q=${encodeURIComponent(q.trim())}`, { auth: false });

export const getStock = (symbol) => request(`/api/stocks/${encodeURIComponent(symbol)}`, { auth: false });

// ---------- Trading ----------

export const trade = ({ symbol, side, quantity }) =>
  request('/api/trade', { method: 'POST', body: { symbol, side, quantity: Number(quantity) } });

// ---------- Portfolio ----------

export const getPortfolio = () => request('/api/portfolio');

export const getOrders = () => request('/api/portfolio/orders');

// ---------- Watchlist ----------

export const getWatchlist = () => request('/api/watchlist');

export const addToWatchlist = (symbol) =>
  request(`/api/watchlist/${encodeURIComponent(symbol)}`, { method: 'POST' });

export const removeFromWatchlist = (symbol) =>
  request(`/api/watchlist/${encodeURIComponent(symbol)}`, { method: 'DELETE' });
