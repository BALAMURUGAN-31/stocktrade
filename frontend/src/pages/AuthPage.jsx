import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login({ email: form.email, password: form.password });
      else await register(form);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <div className="brand big">
          <span className="brand-mark">S</span> StockTrade
        </div>
        <h1>Learn to invest without risking a rupee.</h1>
        <p>Practice buying and selling Indian stocks with ₹1,00,000 of virtual money. Track your portfolio and see your returns.</p>
        <ul className="hero-points">
          <li>Live simulated prices</li>
          <li>Buy &amp; sell with a virtual wallet</li>
          <li>Portfolio, P&amp;L and watchlist</li>
        </ul>
      </div>

      <form className="card auth-card" onSubmit={submit}>
        <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="muted small">
          {mode === 'login' ? 'Log in to continue trading.' : 'You will start with ₹1,00,000 virtual cash.'}
        </p>

        {mode === 'register' && (
          <label>
            Full name
            <input value={form.name} onChange={set('name')} placeholder="Rocky" required />
          </label>
        )}
        <label>
          Email
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" minLength={6} required />
        </label>

        {error && <div className="alert error">{error}</div>}

        <button className="btn btn-primary full" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>

        <p className="switch small">
          {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
          <button
            type="button"
            className="link"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
          >
            {mode === 'login' ? 'Create an account' : 'Log in'}
          </button>
        </p>
      </form>
    </div>
  );
}
