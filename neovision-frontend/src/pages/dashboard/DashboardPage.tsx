import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { citaService, type CitaResponse } from '../../api/citaService';

const estadoColor: Record<string, string> = {
  DISPONIBLE: 'bg-emerald-100 text-emerald-700',
  RESERVADO: 'bg-blue-100 text-blue-700',
  COMPLETADO: 'bg-slate-100 text-slate-500',
  CANCELADO: 'bg-red-100 text-red-700',
  VENCIDA: 'bg-amber-100 text-amber-700',
};

export default function DashboardPage() {
  const { correo, rol, logout } = useAuth();
  const { instance } = useMsal();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'activas' | 'historial' | 'agendar'>('activas');
  const [misCitas, setMisCitas] = useState<CitaResponse[]>([]);
  const [disponibles, setDisponibles] = useState<CitaResponse[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Cancelar
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);
  const [obsCancelar, setObsCancelar] = useState('');

  // Reprogramar
  const [reprogramandoId, setReprogramandoId] = useState<number | null>(null);
  const [bloquesReprogramar, setBloquesReprogramar] = useState<CitaResponse[]>([]);

  const handleLogout = () => {
    logout(instance);
    navigate('/login');
  };

  const cargarMisCitas = async () => {
    try {
      const res = await citaService.misCitas();
      setMisCitas(res.data.data);
    } catch { setError('Error al cargar citas'); }
  };

  const cargarDisponibles = async () => {
    try {
      const res = await citaService.bloquesDisponibles();
      setDisponibles(res.data.data);
    } catch { setError('Error al cargar bloques disponibles'); }
  };

  useEffect(() => {
    if (rol === 'ROLE_PACIENTE') cargarMisCitas();
  }, []);

  useEffect(() => {
    if (tab === 'agendar') cargarDisponibles();
  }, [tab]);

  const handleReservar = async (idCita: number) => {
    setError(''); setSuccess(''); setLoading(true);
    try {
      await citaService.reservarBloque(idCita);
      setSuccess('Bloque reservado exitosamente.');
      await cargarMisCitas();
      setTab('activas');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al reservar bloque');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (idCita: number) => {
    if (!obsCancelar.trim()) {
      setError('Debe ingresar un motivo para cancelar');
      return;
    }
    setError(''); setLoading(true);
    try {
      await citaService.cancelarPaciente(idCita, obsCancelar);
      setSuccess('Cita cancelada.');
      setCancelandoId(null);
      setObsCancelar('');
      await cargarMisCitas();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cancelar cita');
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarReprogramar = async (idCita: number) => {
    setReprogramandoId(idCita);
    setCancelandoId(null);
    setError('');
    try {
      const res = await citaService.bloquesDisponibles();
      setBloquesReprogramar(res.data.data);
    } catch { setError('Error al cargar bloques disponibles'); }
  };

  const handleReprogramar = async (idCitaNueva: number) => {
    if (!reprogramandoId) return;
    setError(''); setLoading(true);
    try {
      await citaService.reprogramarPaciente(reprogramandoId, idCitaNueva);
      setSuccess('Cita reprogramada exitosamente.');
      setReprogramandoId(null);
      setBloquesReprogramar([]);
      await cargarMisCitas();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al reprogramar');
    } finally {
      setLoading(false);
    }
  };

  const citasActivas = misCitas.filter(c => c.estado === 'RESERVADO');
  const citasHistorial = misCitas.filter(c => c.estado === 'COMPLETADO' || c.estado === 'CANCELADO' || c.estado === 'VENCIDA');
  const esPaciente = rol === 'ROLE_PACIENTE';

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">NeoVision</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{correo}</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
              {rol?.replace('ROLE_', '')}
            </span>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700 font-medium">
              Cerrar sesion
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!esPaciente ? (
          <>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Bienvenido al sistema</h2>
            <p className="text-slate-600">Has iniciado sesion como {rol?.replace('ROLE_', '')}.</p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-slate-800 mb-6">Mis Citas</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
                <button onClick={() => setError('')} className="ml-2 font-bold">&times;</button>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {success}
                <button onClick={() => setSuccess('')} className="ml-2 font-bold">&times;</button>
              </div>
            )}

            <div className="flex border-b border-slate-200 mb-6">
              <button onClick={() => setTab('activas')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition ${tab === 'activas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
                Citas activas ({citasActivas.length})
              </button>
              <button onClick={() => setTab('agendar')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition ${tab === 'agendar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
                Agendar cita
              </button>
              <button onClick={() => setTab('historial')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition ${tab === 'historial' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
                Historial ({citasHistorial.length})
              </button>
            </div>

            {/* CITAS ACTIVAS */}
            {tab === 'activas' && (
              <div className="space-y-3">
                {citasActivas.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400">
                    No tienes citas activas. Ve a "Agendar cita" para reservar un horario.
                  </div>
                ) : citasActivas.map(c => (
                  <div key={c.idCita} className="bg-white border border-slate-200 rounded-lg p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor[c.estado]}`}>
                            {c.estado}
                          </span>
                          <span className="text-sm font-medium text-slate-800">{c.fechaSesion}</span>
                          <span className="text-sm text-slate-500">{c.horaInicio} - {c.horaFin}</span>
                        </div>
                        <div className="text-sm text-slate-500">
                          {c.nombreEspacio} / {c.nombreSalon} | Docente: {c.nombreDocente}
                        </div>
                        <div className="text-sm text-slate-500">Estudiante: {c.nombreEstudiante}</div>
                        {c.fechaReserva && (
                          <div className="text-xs text-slate-400 mt-1">Reservada: {c.fechaReserva.replace('T', ' ').substring(0, 16)}</div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {cancelandoId === c.idCita ? (
                          <div className="flex flex-col gap-2 items-end">
                            <input placeholder="Motivo de cancelacion *" value={obsCancelar}
                              onChange={e => setObsCancelar(e.target.value)}
                              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none w-56" />
                            <div className="flex gap-2">
                              <button onClick={() => handleCancelar(c.idCita)} disabled={loading}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50">
                                Confirmar
                              </button>
                              <button onClick={() => { setCancelandoId(null); setObsCancelar(''); }}
                                className="text-xs text-slate-500 hover:text-slate-700">Volver</button>
                            </div>
                          </div>
                        ) : reprogramandoId === c.idCita ? (
                          <div className="flex flex-col gap-2 items-end w-72">
                            <span className="text-xs font-medium text-slate-600">Seleccionar nuevo horario:</span>
                            {bloquesReprogramar.length === 0 ? (
                              <span className="text-xs text-slate-400">No hay bloques disponibles</span>
                            ) : (
                              <div className="max-h-40 overflow-y-auto w-full space-y-1">
                                {bloquesReprogramar.map(b => (
                                  <button key={b.idCita} onClick={() => handleReprogramar(b.idCita)} disabled={loading}
                                    className="w-full text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg px-3 py-2 text-xs transition disabled:opacity-50">
                                    <div className="font-medium text-slate-800">{b.fechaSesion} | {b.horaInicio} - {b.horaFin}</div>
                                    <div className="text-slate-500">{b.nombreEspacio} / {b.nombreSalon}</div>
                                  </button>
                                ))}
                              </div>
                            )}
                            <button onClick={() => { setReprogramandoId(null); setBloquesReprogramar([]); }}
                              className="text-xs text-slate-500 hover:text-slate-700">Volver</button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => handleIniciarReprogramar(c.idCita)}
                              className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                              Reprogramar
                            </button>
                            <button onClick={() => { setCancelandoId(c.idCita); setReprogramandoId(null); }}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                              Cancelar cita
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AGENDAR */}
            {tab === 'agendar' && (
              <div className="space-y-3">
                {disponibles.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400">
                    No hay horarios disponibles en este momento.
                  </div>
                ) : disponibles.map(c => (
                  <div key={c.idCita} className="bg-white border border-slate-200 rounded-lg p-5 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-800">{c.fechaSesion} | {c.horaInicio} - {c.horaFin}</div>
                      <div className="text-sm text-slate-500">{c.nombreEspacio} / {c.nombreSalon}</div>
                      <div className="text-sm text-slate-500">Docente: {c.nombreDocente} | Estudiante: {c.nombreEstudiante}</div>
                    </div>
                    <button onClick={() => handleReservar(c.idCita)} disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50">
                      Reservar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* HISTORIAL */}
            {tab === 'historial' && (
              <div className="space-y-3">
                {citasHistorial.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400">
                    No tienes citas en el historial.
                  </div>
                ) : citasHistorial.map(c => (
                  <div key={c.idCita} className="bg-white border border-slate-200 rounded-lg p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor[c.estado] || ''}`}>
                        {c.estado}
                      </span>
                      <span className="text-sm font-medium text-slate-800">{c.fechaSesion}</span>
                      <span className="text-sm text-slate-500">{c.horaInicio} - {c.horaFin}</span>
                    </div>
                    <div className="text-sm text-slate-500">
                      {c.nombreEspacio} / {c.nombreSalon} | Docente: {c.nombreDocente}
                    </div>
                    <div className="text-sm text-slate-500">Estudiante: {c.nombreEstudiante}</div>
                    {c.observaciones && <div className="text-sm text-slate-400 italic mt-1">"{c.observaciones}"</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
