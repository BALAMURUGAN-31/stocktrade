import { Link } from 'react-router-dom';
import * as api from '../api';
import StockRow from '../components/StockRow.jsx';
import { usePolling } from '../utils.js';

export default function Watchlist() {
  const [items, error, reload] = usePolling(() => api.getWatchlist(), []);

  const remove = async (symbol) => {
    await api.removeFromWatchlist(symbol);
    reload();
  };

  return (
    <>
      <div className="page-head"><h1>Your watchlist</h1></div>
      {error && <div className="alert error">{error}</div>}
      {!items && <div className="center-note">Loading…</div>}
      {items && items.length === 0 && (
        <div className="card center-note">
          Nothing here yet. Tap the ☆ next to a stock on <Link to="/">Explore</Link> to track it.
        </div>
      )}
      {items && items.length > 0 && (
        <div className="card list">
          {items.map((s) => (
            <StockRow key={s.symbol} stock={s} watched onToggleWatch={(sym) => remove(sym)} />
          ))}
        </div>
      )}
    </>
  );
}
