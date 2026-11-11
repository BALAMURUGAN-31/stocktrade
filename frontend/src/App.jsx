import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Market from './pages/Market.jsx';
import StockDetail from './pages/StockDetail.jsx';
import Portfolio from './pages/Portfolio.jsx';
import Watchlist from './pages/Watchlist.jsx';
import Orders from './pages/Orders.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-note">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <>
      {user && <Navbar />}
      <main className="container">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
          <Route path="/" element={<Protected><Market /></Protected>} />
          <Route path="/stock/:symbol" element={<Protected><StockDetail /></Protected>} />
          <Route path="/watchlist" element={<Protected><Watchlist /></Protected>} />
          <Route path="/portfolio" element={<Protected><Portfolio /></Protected>} />
          <Route path="/orders" element={<Protected><Orders /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
