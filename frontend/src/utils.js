import { useCallback, useEffect, useRef, useState } from 'react';

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const money = (n) => inr.format(Number(n) || 0);

export const signed = (n) => {
  const v = Number(n) || 0;
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}`;
};

export const tone = (n) => (Number(n) > 0 ? 'up' : Number(n) < 0 ? 'down' : '');

// Runs `fn` now and then every `ms` milliseconds. Returns [data, error, refresh].
export function usePolling(fn, deps = [], ms = 3000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async () => {
    try {
      const result = await fnRef.current();
      setData(result);
      setError('');
    } catch (e) {
      setError(e.message || 'Something went wrong');
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const safeRun = () => alive && run();
    safeRun();
    const id = ms ? setInterval(safeRun, ms) : null;
    return () => {
      alive = false;
      if (id) clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return [data, error, run];
}
