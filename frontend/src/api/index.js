// Single entry point for all data calls.
// Default: the real Python backend (realApi.js).
// Set VITE_USE_MOCK=true in frontend/.env to run without a backend (mockApi.js).
import * as mock from './mockApi.js';
import * as real from './realApi.js';

const api = import.meta.env.VITE_USE_MOCK === 'true' ? mock : real;

export const {
  register,
  login,
  me,
  logout,
  getStocks,
  getStock,
  trade,
  getPortfolio,
  getOrders,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} = api;
