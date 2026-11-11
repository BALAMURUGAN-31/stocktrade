import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => setUser(await api.login(credentials));
  const register = async (details) => setUser(await api.register(details));
  const logout = () => {
    api.logout();
    setUser(null);
  };
  // Call after a trade so the navbar balance updates
  const refreshUser = useCallback(async () => {
    try {
      setUser(await api.me());
    } catch {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
