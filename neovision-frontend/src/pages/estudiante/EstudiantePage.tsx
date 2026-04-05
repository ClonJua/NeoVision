import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { citaService, type CitaResponse } from '../../api/citaService';
import { estudianteService } from '../../api/estudianteService';
import type { PacienteResponse, CrearPacienteRequest } from '../../api/adminService';

const estadoColor: Record<string, string> = {
  DISPONIBLE: 'bg-emerald-100 text-emerald-700',
  RESERVADO: 'bg-blue-100 text-blue-700',
  COMPLETADO: 'bg-slate-100 text-slate-500',
  CANCELADO: 'bg-red-100 text-red-700',
  VENCIDA: 'bg-amber-100 text-amber-700',
};

const TIPOS_DOCUMENTO = ['CC', 'TI', 'RC', 'CE', 'PA'];

export default function EstudiantePage() {
  const { correo, logout } = useAuth();
  const { instance } = useMsal();
  const navigate = useNavigate();

  const [bloques, setBloques] = useState<CitaResponse[]>([]);
  const [pacientes, setPacientes] = useState<PacienteResponse[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState<'disponibles' | 'agendadas' | 'historial'>('disponibles');

  // Asignar paciente
  const [asignandoId, setAsignandoId] = useState<number | null>(null);
  const [idPacienteSeleccionado, setIdPacienteSeleccionado] = useState<number | ''>('');

  // Confirmar asistencia
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);

  // Crear paciente inline
  const [showNuevoPac, setShowNuevoPac] = useState(false);
  const [creandoPac, setCreandoPac] = useState(false);
  const [nuevoPac, setNuevoPac] = useState<CrearPacienteRequest>({
    nombre: '', apellido: '', correo: '', contrasena: '',
    tipoDocumento: 'CC', numeroDocumento: '', fechaNacimiento: '', telefono: '',
  });

  const handleLogout = () => { logout(instance); navigate('/login'); };

  const cargar = async () => {
    try {
      const [bloquesRes, pacRes] = await Promise.all([
        citaService.misBloques(),
        estudianteService.listarPacientes(),
      ]);
      setBloques(bloquesRes.data.data);
      setPacientes(pacRes.data.data.filter(p => p.activo));
    } catch { setError('Error al cargar datos'); }
  };

  useEffect(() => { cargar(); }, []);

  const bloquesDisponibles = bloques.filter(b => b.estado === 'DISPONIBLE');
  const bloquesAgendados = bloques.filter(b => b.estado === 'RESERVADO');
  const bloquesHistorial = bloques.filter(b => b.estado === 'COMPLETADO' || b.estado === 'CANCELADO' || b.estado === 'VENCIDA');

  const handleConfirmarAsistencia = async (idCita: number) => {
    setError('');
    setConfirmandoId(idCita);
    try {
      await citaService.confirmarAsistencia(idCita);
      setSuccess('Asistencia confirmada');
      setConfirmandoId(null);
      await cargar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al confirmar asistencia');
      setConfirmandoId(null);
    }
  };

  const handleAsignar = async (idCita: number) => {
    if (!idPacienteSeleccionado) {
      setError('Seleccione un paciente');
      return;
    }
    setError('');
    try {
      await citaService.asignarPaciente(idCita, idPacienteSeleccionado as number);
      setSuccess('Paciente asignado exitosamente');
      setAsignandoId(null);
      setIdPacienteSeleccionado('');
      await cargar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al asignar paciente');
    }
  };

  const handleCrearPaciente = async () => {
    const { nombre, apellido, correo: c, contrasena, numeroDocumento, fechaNacimiento, telefono } = nuevoPac;
    if (!nombre || !apellido || !c || !contrasena || !numeroDocumento || !fechaNacimiento || !telefono) {
      setError('Todos los campos del paciente son obligatorios');
      return;
    }
    setCreandoPac(true);
    try {
      const res = await estudianteService.crearPaciente(nuevoPac);
      const nuevo = res.data.data;
      const pacRes = await estudianteService.listarPacientes();
      setPacientes(pacRes.data.data.filter(p => p.activo));
      setIdPacienteSeleccionado(nuevo.idPaciente);
      setShowNuevoPac(false);
      setNuevoPac({ nombre: '', apellido: '', correo: '', contrasena: '', tipoDocumento: 'CC', numeroDocumento: '', fechaNacimiento: '', telefono: '' });
      setSuccess('Paciente creado y seleccionado');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear paciente');
    } finally {
      setCreandoPac(false);
    }
  };

  const renderBloqueCard = (c: CitaResponse, acciones: React.ReactNode) => (
    <div key={c.idCita} className="bg-white border border-slate-200 rounded-lg p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor[c.estado] || ''}`}>
              {c.estado}
            </span>
            <span className="font-medium text-slate-800">{c.fechaSesion} | {c.horaInicio} - {c.horaFin}</span>
          </div>
          <div className="text-sm text-slate-500">{c.nombreEspacio} / {c.nombreSalon} | Docente: {c.nombreDocente}</div>
          <div className="text-sm text-slate-500">
            Paciente: {c.nombrePaciente || <span className="italic text-slate-400">Sin asignar</span>}
          </div>
          {c.observaciones && <div className="text-sm text-slate-400 italic">"{c.observaciones}"</div>}
          {c.fechaReserva && <div className="text-xs text-slate-400">Reservada: {c.fechaReserva.replace('T', ' ').substring(0, 16)}</div>}
        </div>
        <div className="flex flex-col items-end gap-2">{acciones}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">NeoVision</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{correo}</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">ESTUDIANTE</span>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700 font-medium">Cerrar sesion</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold text-slate-800 mb-6">Mis Bloques de Citas</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}<button onClick={() => setError('')} className="ml-2 font-bold">&times;</button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {success}<button onClick={() => setSuccess('')} className="ml-2 font-bold">&times;</button>
          </div>
        )}

        <div className="flex border-b border-slate-200 mb-6">
          {([['disponibles', 'Disponibles', bloquesDisponibles.length],
             ['agendadas', 'Agendadas', bloquesAgendados.length],
             ['historial', 'Historial', bloquesHistorial.length]] as const).map(([key, label, count]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition ${tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
              {label} ({count})
            </button>
          ))}
        </div>

        {/* DISPONIBLES — asignar paciente */}
        {tab === 'disponibles' && (
          <div className="space-y-3">
            {bloquesDisponibles.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400">
                No tienes bloques disponibles para asignar.
              </div>
            ) : bloquesDisponibles.map(c => renderBloqueCard(c,
              asignandoId === c.idCita ? (
                <div className="space-y-2 w-64">
                  <div className="flex items-center gap-2">
                    <select value={idPacienteSeleccionado}
                      onChange={e => setIdPacienteSeleccionado(parseInt(e.target.value) || '')}
                      className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg text-xs outline-none">
                      <option value="">Seleccionar paciente...</option>
                      {pacientes.map(p => (
                        <option key={p.idPaciente} value={p.idPaciente}>{p.nombre} {p.apellido} — {p.numeroDocumento}</option>
                      ))}
                    </select>
                  </div>
                  {!showNuevoPac && (
                    <button onClick={() => setShowNuevoPac(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Nuevo paciente</button>
                  )}
                  {showNuevoPac && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="Nombre *" value={nuevoPac.nombre}
                          onChange={e => setNuevoPac({...nuevoPac, nombre: e.target.value})}
                          className="px-2 py-1.5 border border-slate-300 rounded text-xs outline-none" />
                        <input placeholder="Apellido *" value={nuevoPac.apellido}
                          onChange={e => setNuevoPac({...nuevoPac, apellido: e.target.value})}
                          className="px-2 py-1.5 border border-slate-300 rounded text-xs outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="Correo *" type="email" value={nuevoPac.correo}
                          onChange={e => setNuevoPac({...nuevoPac, correo: e.target.value})}
                          className="px-2 py-1.5 border border-slate-300 rounded text-xs outline-none" />
                        <input placeholder="Contrasena *" type="password" value={nuevoPac.contrasena}
                          onChange={e => setNuevoPac({...nuevoPac, contrasena: e.target.value})}
                          className="px-2 py-1.5 border border-slate-300 rounded text-xs outline-none" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <select value={nuevoPac.tipoDocumento}
                          onChange={e => setNuevoPac({...nuevoPac, tipoDocumento: e.target.value})}
                          className="px-2 py-1.5 border border-slate-300 rounded text-xs outline-none">
                          {TIPOS_DOCUMENTO.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input placeholder="No. documento *" value={nuevoPac.numeroDocumento}
                          onChange={e => setNuevoPac({...nuevoPac, numeroDocumento: e.target.value})}
                          className="col-span-2 px-2 py-1.5 border border-slate-300 rounded text-xs outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={nuevoPac.fechaNacimiento}
                          onChange={e => setNuevoPac({...nuevoPac, fechaNacimiento: e.target.value})}
                          className="px-2 py-1.5 border border-slate-300 rounded text-xs outline-none" />
                        <input placeholder="Telefono *" value={nuevoPac.telefono}
                          onChange={e => setNuevoPac({...nuevoPac, telefono: e.target.value})}
                          className="px-2 py-1.5 border border-slate-300 rounded text-xs outline-none" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleCrearPaciente} disabled={creandoPac}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-50">
                          {creandoPac ? 'Creando...' : 'Crear y seleccionar'}
                        </button>
                        <button onClick={() => setShowNuevoPac(false)} className="text-xs text-slate-500">Cancelar</button>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => handleAsignar(c.idCita)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                      Asignar
                    </button>
                    <button onClick={() => { setAsignandoId(null); setShowNuevoPac(false); }}
                      className="text-xs text-slate-500 hover:text-slate-700">Cancelar</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAsignandoId(c.idCita)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                  Asignar paciente
                </button>
              )
            ))}
          </div>
        )}

        {/* AGENDADAS */}
        {tab === 'agendadas' && (
          <div className="space-y-3">
            {bloquesAgendados.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400">
                No tienes citas agendadas.
              </div>
            ) : bloquesAgendados.map(c => renderBloqueCard(c,
              confirmandoId === c.idCita ? (
                <span className="text-xs text-slate-400">Confirmando...</span>
              ) : (
                <button onClick={() => handleConfirmarAsistencia(c.idCita)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                  Confirmar asistencia
                </button>
              )
            ))}
          </div>
        )}

        {/* HISTORIAL */}
        {tab === 'historial' && (
          <div className="space-y-3">
            {bloquesHistorial.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400">
                No tienes citas en el historial.
              </div>
            ) : bloquesHistorial.map(c => renderBloqueCard(c, null))}
          </div>
        )}
      </main>
    </div>
  );
}
