import { createContext, useContext, useMemo, useState } from 'react';
import { UserInfo } from '../types';
import * as api from '../services/api';

interface AuthState {
  user: UserInfo | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string, captchaToken: string) => Promise<void>;
  register: (name: string, email: string, password: string, captchaToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = 'airdrop_auth';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : { user: null, token: null };
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return { user: null, token: null };
    }
  });

  const login = async (email: string, password: string, captchaToken: string) => {
    const response = await api.login(email, password, captchaToken);
    const newState = { user: response.user, token: response.token };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newState));
    setState(newState);
  };

  const register = async (name: string, email: string, password: string, captchaToken: string) => {
    const response = await api.register(name, email, password, captchaToken);
    const newState = { user: response.user, token: response.token };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newState));
    setState(newState);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setState({ user: null, token: null });
  };

  const value = useMemo(
    () => ({ ...state, login, register, logout }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  }
  return context;
};
