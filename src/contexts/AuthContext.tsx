import { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Credenciales desde variables de entorno
const AUTH_EMAIL = import.meta.env.VITE_AUTH_EMAIL || 'prisma@oneorigyn.com';
const AUTH_PASSWORD = import.meta.env.VITE_AUTH_PASSWORD || '';
const AUTH_STORAGE_KEY = '@prisma_dashboard_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Verificar si hay sesión guardada en localStorage
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    return saved === 'true';
  });

  const login = (email: string, password: string): boolean => {
    if (!AUTH_PASSWORD) {
      console.error('VITE_AUTH_PASSWORD no está configurada en .env');
      return false;
    }
    
    if (email === AUTH_EMAIL && password === AUTH_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
