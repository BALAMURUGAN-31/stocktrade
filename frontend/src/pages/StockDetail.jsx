import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as api from '../api';
import PriceChart from '../components/PriceChart.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { money, signed, tone, usePolling } from '../utils.js';

export default function StockDetail() {
  const { symbol } = useParams();
  const { user, refreshUser } = useAuth();

  const [stock, error] = usePolling(() => api.getStock(symbol), [symbol]);
  const [portfolio, , reloadPortfolio] = usePolling(() => api.getPortfolio(), [symbol], 0);
  const [watchlist, , reloadWatch] = usePolling(() => api.getWatchlist(), [symbol], 0);

  const [side, setSide] = useState('BUY');
  const [qty, setQty] = useState('1');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  if (error) {
    return (
      <div className="card center-note">
        {error} <Link to="/">Back to Explore</Link>
      </div>
    );
  }
  if (!stock) return <div className="center-note">Loading…</div>;

  const owned = portfolio?.holdings.find((h) => h.symbol === stock.symbol);
  const watched = !!watchlist?.some((w) => w.symbol === stock.symbol);
  const quantity = Number(qty);
  const validQty = Number.isInteger(quantity) && quantity > 0;
  const estimate = validQty ? stock.current_price * quantity : 0;

  const placeOrder = async (e) => {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      const res = await api.trade({ symbol: stock.symbol, side, quantity });
      setMessage({
        type: 'success',
        text: `${side === 'BUY' ? 'Bought' : 'Sold'} ${res.order.quantity} × ${stock.symbol} at ${money(res.order.price)}`,
      });
      setQty('1');
      await Promise.all([refreshUser(), reloadPortfolio()]);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const toggleWatch = async () => {
    if (watched) await api.removeFromWatchlist(stock.symbol);
    else await api.addToWatchlist(stock.symbol);
    reloadWatch();
  };

  return (
    <>
      <Link to="/" className="back small">← Back</Link>

      <div className="detail-grid">
        <section className="card">
          <div className="detail-head">
            <div>
              <h1>{stock.name}</h1>
              <span className="muted small">{stock.symbol} · {stock.sector}</span>
            </div>
            <button className={`btn btn-ghost ${watched ? 'on' : ''}`} onClick={toggleWatch}>
              {watched ? '★ Watching' : '☆ Add to watchlist'}
            </button>
          </div>

          <div className="big-price">
            {money(stock.current_price)}
            <span className={`small ${tone(stock.change)}`}>
              {signed(stock.change)} ({signed(stock.change_percent)}%) today
            </span>
          </div>

          <PriceChart history={stock.history} up={stock.change >= 0} />

          <div className="stats">
            <div><small>Previous close</small><strong>{money(stock.prev_close)}</strong></div>
            <div><small>Sector</small><strong>{stock.sector}</strong></div>
            <div><small>You own</small><strong>{owned ? `${owned.quantity} shares` : '—'}</strong></div>
            <div>
              <small>Your P&amp;L</small>
              <strong className={owned ? tone(owned.pnl) : ''}>{owned ? `${signed(owned.pnl)} (${signed(owned.pnl_percent)}%)` : '—'}</strong>
            </div>
          </div>
        </section>

        <aside className="card trade-card">
          <div className="tabs">
            <button className={side === 'BUY' ? 'tab buy on' : 'tab'} onClick={() => setSide('BUY')}>Buy</button>
            <button className={side === 'SELL' ? 'tab sell on' : 'tab'} onClick={() => setSide('SELL')}>Sell</button>
          </div>

          <form onSubmit={placeOrder}>
            <label>
              Quantity
              <input type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} />
            </label>

            <div className="kv"><span>Market price</span><strong>{money(stock.current_price)}</strong></div>
            <div className="kv"><span>Estimated {side === 'BUY' ? 'cost' : 'proceeds'}</span><strong>{money(estimate)}</strong></div>
            <div className="kv"><span>Available cash</span><strong>{money(user.balance)}</strong></div>
            {side === 'SELL' && <div className="kv"><span>Shares you hold</span><strong>{owned ? owned.quantity : 0}</strong></div>}

            {message && <div className={`alert ${message.type}`}>{message.text}</div>}

            <button className={`btn full ${side === 'BUY' ? 'btn-primary' : 'btn-danger'}`} disabled={busy || !validQty}>
              {busy ? 'Placing order…' : `${side === 'BUY' ? 'Buy' : 'Sell'} ${stock.symbol}`}
            </button>
            <p className="muted small note">Virtual money · orders execute instantly at the market price.</p>
          </form>
        </aside>
      </div>
    </>
  );
}
