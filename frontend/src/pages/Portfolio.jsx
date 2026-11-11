import { Link } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import * as api from '../api';
import { money, signed, tone, usePolling } from '../utils.js';

const COLORS = ['#00a884', '#3b82f6', '#f59e0b', '#8b5cf6', '#e5533d', '#14b8a6', '#ec4899', '#64748b'];

export default function Portfolio() {
  const [data, error] = usePolling(() => api.getPortfolio(), []);

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="center-note">Loading portfolio…</div>;

  const { summary, holdings, balance } = data;
  const totalValue = summary.current_value + balance;
  const pie = holdings.map((h) => ({ name: h.symbol, value: h.current_value }));

  return (
    <>
      <div className="page-head"><h1>Your portfolio</h1></div>

      <div className="summary-grid">
        <Stat label="Total value" value={money(totalValue)} sub="Holdings + cash" />
        <Stat label="Invested" value={money(summary.invested)} />
        <Stat label="Current value" value={money(summary.current_value)} />
        <Stat
          label="Total returns"
          value={`${signed(summary.pnl)}`}
          sub={`${signed(summary.pnl_percent)}%`}
          cls={tone(summary.pnl)}
        />
        <Stat label="Cash balance" value={money(balance)} />
      </div>

      {holdings.length === 0 ? (
        <div className="card center-note">
          You don't own any stocks yet. <Link to="/">Explore stocks</Link> and place your first order.
        </div>
      ) : (
        <div className="portfolio-grid">
          <div className="card table-wrap">
            <h3>Holdings</h3>
            <table>
              <thead>
                <tr>
                  <th>Stock</th><th className="r">Qty</th><th className="r">Avg price</th>
                  <th className="r">LTP</th><th className="r">Current value</th><th className="r">P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.symbol}>
                    <td><Link to={`/stock/${h.symbol}`}><strong>{h.symbol}</strong></Link></td>
                    <td className="r">{h.quantity}</td>
                    <td className="r">{money(h.avg_price)}</td>
                    <td className="r">{money(h.current_price)}</td>
                    <td className="r">{money(h.current_value)}</td>
                    <td className={`r ${tone(h.pnl)}`}>{signed(h.pnl)}<br /><small>({signed(h.pnl_percent)}%)</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3>Allocation</h3>
            <div className="pie-box">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} isAnimationActive={false}>
                    {pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => money(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="legend">
              {pie.map((p, i) => (
                <li key={p.name}><i style={{ background: COLORS[i % COLORS.length] }} />{p.name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value, sub, cls = '' }) {
  return (
    <div className="card stat">
      <small>{label}</small>
      <strong className={cls}>{value}</strong>
      {sub && <span className={`small ${cls}`}>{sub}</span>}
    </div>
  );
}
