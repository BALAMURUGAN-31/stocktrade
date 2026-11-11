import { Link } from 'react-router-dom';
import * as api from '../api';
import { money, usePolling } from '../utils.js';

export default function Orders() {
  const [orders, error] = usePolling(() => api.getOrders(), [], 0);

  return (
    <>
      <div className="page-head"><h1>Order history</h1></div>
      {error && <div className="alert error">{error}</div>}
      {!orders && <div className="center-note">Loading…</div>}
      {orders && orders.length === 0 && (
        <div className="card center-note">
          No orders yet. <Link to="/">Explore stocks</Link> to place your first one.
        </div>
      )}
      {orders && orders.length > 0 && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Stock</th><th>Type</th>
                <th className="r">Qty</th><th className="r">Price</th><th className="r">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td><Link to={`/stock/${o.symbol}`}><strong>{o.symbol}</strong></Link></td>
                  <td><span className={`pill ${o.side === 'BUY' ? 'buy' : 'sell'}`}>{o.side}</span></td>
                  <td className="r">{o.quantity}</td>
                  <td className="r">{money(o.price)}</td>
                  <td className="r">{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
