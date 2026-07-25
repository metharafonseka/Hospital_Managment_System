import { createContext, useContext, useState, type ReactNode } from 'react';
import { apiClient, TOKEN_STORAGE_KEY } from '../api/client';
import type { AuthResponse, Role } from '../api/types';

const USER_STORAGE_KEY = 'hms.user';

interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  roles: Role[];
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser());

  const login = async (email: string, password: string) => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem(TOKEN_STORAGE_KEY, data.accessToken);
    const authUser: AuthUser = {
      userId: data.userId,
      email: data.email,
      fullName: data.fullName,
      roles: data.roles,
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
    }
  };

  const hasRole = (...roles: Role[]) => !!user && roles.some((r) => user.roles.includes(r));

  return <AuthContext.Provider value={{ user, login, logout, hasRole }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
