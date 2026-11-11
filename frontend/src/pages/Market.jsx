import { useMemo, useState } from 'react';
import * as api from '../api';
import StockRow from '../components/StockRow.jsx';
import { usePolling } from '../utils.js';

export default function Market() {
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('All');

  const [stocks, error] = usePolling(() => api.getStocks(query), [query]);
  const [watchlist, , reloadWatch] = usePolling(() => api.getWatchlist(), [], 0);

  const watched = useMemo(() => new Set((watchlist || []).map((w) => w.symbol)), [watchlist]);
  const sectors = useMemo(() => ['All', ...new Set((stocks || []).map((s) => s.sector))], [stocks]);

  const list = (stocks || []).filter((s) => sector === 'All' || s.sector === sector);

  const toggleWatch = async (symbol, isWatched) => {
    if (isWatched) await api.removeFromWatchlist(symbol);
    else await api.addToWatchlist(symbol);
    reloadWatch();
  };

  const movers = [...(stocks || [])].sort((a, b) => b.change_percent - a.change_percent);
  const gainers = movers.slice(0, 3);
  const losers = movers.slice(-3).reverse();

  return (
    <>
      <div className="page-head">
        <h1>Explore stocks</h1>
        <input
          className="search"
          placeholder="Search by name or symbol…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {!query && stocks && (
        <div className="grid-2">
          <MoverCard title="Top gainers" items={gainers} />
          <MoverCard title="Top losers" items={losers} />
        </div>
      )}

      <div className="chips">
        {sectors.map((s) => (
          <button key={s} className={`chip ${sector === s ? 'on' : ''}`} onClick={() => setSector(s)}>
            {s}
          </button>
        ))}
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="card list">
        {!stocks && <div className="center-note">Loading stocks…</div>}
        {stocks && list.length === 0 && <div className="center-note">No stocks match your search.</div>}
        {list.map((s) => (
          <StockRow key={s.symbol} stock={s} watched={watched.has(s.symbol)} onToggleWatch={toggleWatch} />
        ))}
      </div>
    </>
  );
}

function MoverCard({ title, items }) {
  return (
    <div className="card mover">
      <h3>{title}</h3>
      {items.map((s) => (
        <StockRow key={s.symbol} stock={s} />
      ))}
    </div>
  );
}
