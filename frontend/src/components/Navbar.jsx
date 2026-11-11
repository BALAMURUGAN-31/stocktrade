import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { money } from '../utils.js';

const links = [
  { to: '/', label: 'Explore', end: true },
  { to: '/watchlist', label: 'Watchlist' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/orders', label: 'Orders' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">
          <span className="brand-mark">S</span> StockTrade
        </NavLink>

        <nav className="nav-links">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-user">
          <div className="nav-balance" title="Virtual cash available">
            <small>Available</small>
            <strong>{money(user.balance)}</strong>
          </div>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
