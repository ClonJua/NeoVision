import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { authService } from '../../api/authService';
import { useAuth } from '../../auth/context/AuthContext';
import { loginRequest } from '../../auth/msalConfig';

export default function LoginPage() {
  const [modo, setModo] = useState<'paciente' | 'institucional'>('paciente');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, rol } = useAuth();
  const navigate = useNavigate();
  const { instance } = useMsal();

  const redirectByRole = (r: string) => {
    switch (r) {
      case 'ROLE_ADMIN':      navigate('/admin'); break;
      case 'ROLE_ESTUDIANTE': navigate('/estudiante'); break;
      case 'ROLE_DOCENTE':    navigate('/docente'); break;
      default:                navigate('/dashboard'); break;
    }
  };

  // Si ya esta autenticado (ej. regresando del redirect de Microsoft), redirigir
  useEffect(() => {
    if (isAuthenticated && rol) {
      redirectByRole(rol);
      return;
    }
    // Mostrar error de MSAL si hubo uno durante el redirect
    const msalErr = sessionStorage.getItem('msalError');
    if (msalErr) {
      setError(msalErr);
      setModo('institucional');
      sessionStorage.removeItem('msalError');
    }
  }, [isAuthenticated, rol]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login({ correo, contrasena });
      const { token, rol, correo: email } = res.data.data;
      login(token, rol, email);
      redirectByRole(rol);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesion.');
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await instance.loginRedirect(loginRequest);
    } catch (err: any) {
      setError('Error al iniciar con Microsoft: ' + (err.message || ''));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">NeoVision</h1>
          <p className="text-slate-500 mt-1">Sistema de Gestion Clinica</p>
        </div>

        {/* Selector de modo */}
        <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
          <button
            onClick={() => { setModo('paciente'); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
              modo === 'paciente'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Soy Paciente
          </button>
          <button
            onClick={() => { setModo('institucional'); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
              modo === 'institucional'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Personal Institucional
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center text-slate-500 mb-4">Procesando...</div>
        )}

        {modo === 'paciente' ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Correo electronico
                </label>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  placeholder="correo@ejemplo.com"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contrasena
                </label>
                <input
                  type="password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                  placeholder="********"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Ingresando...' : 'Iniciar Sesion'}
              </button>
            </form>
            <p className="text-center text-sm text-slate-500 mt-6">
              No tienes cuenta?{' '}
              <Link to="/registro" className="text-blue-600 hover:underline font-medium">
                Registrate aqui
              </Link>
            </p>
          </>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-sm text-slate-600">
              Docentes, estudiantes y personal administrativo inician sesion con su cuenta de Microsoft.
            </p>
            <button
              onClick={handleMicrosoftLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-[#2f2f2f] hover:bg-[#1a1a1a] text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="20" height="20" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              Iniciar con Microsoft
            </button>
            <p className="text-xs text-slate-400">
              Debes estar previamente registrado por la secretar\u00eda del programa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
