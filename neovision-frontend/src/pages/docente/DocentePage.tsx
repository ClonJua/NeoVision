import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { docenteService } from '../../api/docenteService';
import type { SesionResponse } from '../../api/sesionService';

export default function DocentePage() {
  const { correo, logout } = useAuth();
  const { instance } = useMsal();
  const navigate = useNavigate();

  const [sesiones, setSesiones] = useState<SesionResponse[]>([]);
  const [error, setError] = useState('');

  const handleLogout = () => { logout(instance); navigate('/login'); };

  useEffect(() => {
    docenteService.misSesiones()
      .then(res => setSesiones(res.data.data))
      .catch(() => setError('Error al cargar sesiones'));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">NeoVision</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{correo}</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">DOCENTE</span>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700 font-medium">Cerrar sesion</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold text-slate-800 mb-6">Mis Sesiones Asignadas</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        {sesiones.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400">
            No tienes sesiones asignadas.
          </div>
        ) : (
          <div className="space-y-4">
            {sesiones.map(s => (
              <div key={s.idSesion} className="bg-white border border-slate-200 rounded-lg p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-slate-800 text-lg">{s.fecha}</div>
                    <div className="text-sm text-slate-500">{s.horaInicio} - {s.horaFin}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-700">{s.nombreEspacio} / {s.nombreSalon}</div>
                    <div className="text-xs text-slate-400">Cupos: {s.cuposTotales}</div>
                  </div>
                </div>

                {s.estudiantes.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-slate-600 mb-2">Estudiantes asignados:</div>
                    <div className="flex flex-wrap gap-2">
                      {s.estudiantes.map(e => (
                        <span key={e.idEstudiante}
                          className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-200">
                          {e.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
