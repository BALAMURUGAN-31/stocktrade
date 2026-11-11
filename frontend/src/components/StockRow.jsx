import { Link } from 'react-router-dom';
import { money, signed, tone } from '../utils.js';

export default function StockRow({ stock, watched, onToggleWatch }) {
  return (
    <div className="stock-row">
      <Link to={`/stock/${stock.symbol}`} className="stock-main">
        <div className="avatar">{stock.symbol.slice(0, 2)}</div>
        <div>
          <div className="stock-symbol">{stock.symbol}</div>
          <div className="muted small">{stock.name}</div>
        </div>
      </Link>

      <div className="stock-price">
        <div className="price">{money(stock.current_price)}</div>
        <div className={`small ${tone(stock.change)}`}>
          {signed(stock.change)} ({signed(stock.change_percent)}%)
        </div>
      </div>

      {onToggleWatch && (
        <button
          className={`star ${watched ? 'on' : ''}`}
          onClick={() => onToggleWatch(stock.symbol, watched)}
          aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
          title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          {watched ? '★' : '☆'}
        </button>
      )}
    </div>
  );
}
