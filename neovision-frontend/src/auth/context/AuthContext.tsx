import { createContext, useContext, useState, type ReactNode } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';

interface AuthState {
  token: string | null;
  rol: string | null;
  correo: string | null;
}

interface AuthContextType extends AuthState {
  login: (token: string, rol: string, correo: string) => void;
  logout: (msalInstance?: PublicClientApplication) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: localStorage.getItem('token'),
    rol: localStorage.getItem('rol'),
    correo: localStorage.getItem('correo'),
  });

  const login = (token: string, rol: string, correo: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('rol', rol);
    localStorage.setItem('correo', correo);
    setAuth({ token, rol, correo });
  };

  const logout = (msalInstance?: PublicClientApplication) => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('correo');
    setAuth({ token: null, rol: null, correo: null });

    // Limpiar cache de MSAL sin abrir popup
    if (msalInstance) {
      msalInstance.clearCache();
    }
  };

  return (
    <AuthContext.Provider
      value={{ ...auth, login, logout, isAuthenticated: !!auth.token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
