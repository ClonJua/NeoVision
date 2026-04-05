import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './auth/msalConfig';
import { AuthProvider } from './auth/context/AuthContext';
import { authService } from './api/authService';
import LoginPage from './pages/login/LoginPage';
import RegistroPage from './pages/registro/RegistroPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AdminPage from './pages/admin/AdminPage';
import EstudiantePage from './pages/estudiante/EstudiantePage';
import DocentePage from './pages/docente/DocentePage';
import ProtectedRoute from './routes/ProtectedRoute';

const msalInstance = new PublicClientApplication(msalConfig);

function App() {
  const [msalReady, setMsalReady] = useState(false);
  const [msalError, setMsalError] = useState<string | null>(null);

  useEffect(() => {
    msalInstance.initialize().then(() => {
      msalInstance.handleRedirectPromise().then(async (response) => {
        if (response && response.accessToken) {
          try {
            const res = await authService.loginMicrosoft({ accessToken: response.accessToken });
            const { token, rol, correo } = res.data.data;
            localStorage.setItem('token', token);
            localStorage.setItem('rol', rol);
            localStorage.setItem('correo', correo);
          } catch (err: any) {
            const msg = err.response?.data?.message || 'Error con login de Microsoft.';
            sessionStorage.setItem('msalError', msg);
            setMsalError(msg);
            await msalInstance.clearCache();
          }
        }
        setMsalReady(true);
      }).catch(async (err) => {
        console.error('MSAL redirect error:', err);
        setMsalError(err.message || 'Error en autenticacion de Microsoft');
        await msalInstance.clearCache();
        setMsalReady(true);
      });
    });
  }, []);

  if (!msalReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Cargando...</p>
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegistroPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/estudiante"
              element={
                <ProtectedRoute>
                  <EstudiantePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/docente"
              element={
                <ProtectedRoute>
                  <DocentePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </MsalProvider>
  );
}

export default App;
