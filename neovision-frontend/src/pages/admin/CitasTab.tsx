import { useState, useEffect } from 'react';
import { citaService, type CitaResponse, type CitaRequest } from '../../api/citaService';
import { sesionService, type SesionResponse } from '../../api/sesionService';
import { adminService, type PacienteResponse, type CrearPacienteRequest } from '../../api/adminService';

const ESTADOS = ['TODAS', 'DISPONIBLE', 'RESERVADO', 'COMPLETADO', 'CANCELADO', 'VENCIDA'];
const estadoColor: Record<string, string> = {
  DISPONIBLE: 'bg-emerald-100 text-emerald-700',
  RESERVADO: 'bg-blue-100 text-blue-700',
  COMPLETADO: 'bg-slate-100 text-slate-500',
  CANCELADO: 'bg-red-100 text-red-700',
  VENCIDA: 'bg-amber-100 text-amber-700',
};

const TIPOS_DOCUMENTO = ['CC', 'TI', 'RC', 'CE', 'PA'];

export default function CitasTab() {
  const [citas, setCitas] = useState<CitaResponse[]>([]);
  const [sesiones, setSesiones] = useState<SesionResponse[]>([]);
  const [pacientes, setPacientes] = useState<PacienteResponse[]>([]);
  const [filtro, setFiltro] = useState('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  // Form state
  const [idSesion, setIdSesion] = useState<number | ''>('');
  const [idEstudiante, setIdEstudiante] = useState<number | ''>('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [idPaciente, setIdPaciente] = useState<number | ''>('');
  const [observaciones, setObservaciones] = useState('');

  // Nuevo paciente inline
  const [showNuevoPaciente, setShowNuevoPaciente] = useState(false);
  const [creandoPaciente, setCreandoPaciente] = useState(false);
  const [nuevoPac, setNuevoPac] = useState<CrearPacienteRequest>({
    nombre: '', apellido: '', correo: '', contrasena: '',
    tipoDocumento: 'CC', numeroDocumento: '', fechaNacimiento: '', telefono: '',
  });

  const sesionSeleccionada = sesiones.find(s => s.idSesion === idSesion);

  const cargar = async () => {
    try {
      const [citasRes, sesRes, pacRes] = await Promise.all([
        citaService.listarCitas(filtro === 'TODAS' ? undefined : filtro),
        sesionService.listar(),
        adminService.listarPacientes(),
      ]);
      setCitas(citasRes.data.data);
      setSesiones(sesRes.data.data.filter(s => s.activo));
      setPacientes(pacRes.data.data.filter(p => p.activo));
    } catch {
      setError('Error al cargar datos');
    }
  };

  useEffect(() => { cargar(); }, [filtro]);

  const resetNuevoPac = () => {
    setNuevoPac({ nombre: '', apellido: '', correo: '', contrasena: '', tipoDocumento: 'CC', numeroDocumento: '', fechaNacimiento: '', telefono: '' });
    setShowNuevoPaciente(false);
  };

  const resetForm = () => {
    setIdSesion('');
    setIdEstudiante('');
    setHoraInicio('');
    setHoraFin('');
    setIdPaciente('');
    setObservaciones('');
    setShowForm(false);
    setEditandoId(null);
    resetNuevoPac();
    setError('');
  };

  const handleEditarCita = (c: CitaResponse) => {
    setIdSesion(c.idSesion);
    setIdEstudiante(c.idEstudiante);
    setHoraInicio(c.horaInicio);
    setHoraFin(c.horaFin);
    setIdPaciente(c.idPaciente || '');
    setObservaciones(c.observaciones || '');
    setEditandoId(c.idCita);
    setShowForm(true);
    setError('');
  };

  const handleCrearPaciente = async () => {
    const { nombre, apellido, correo, contrasena, tipoDocumento, numeroDocumento, fechaNacimiento, telefono } = nuevoPac;
    if (!nombre || !apellido || !correo || !contrasena || !numeroDocumento || !fechaNacimiento || !telefono) {
      setError('Todos los campos del paciente son obligatorios');
      return;
    }
    setCreandoPaciente(true);
    try {
      const res = await adminService.crearPaciente({ nombre, apellido, correo, contrasena, tipoDocumento, numeroDocumento, fechaNacimiento, telefono });
      const nuevo = res.data.data;
      // Recargar lista de pacientes y seleccionar el nuevo
      const pacRes = await adminService.listarPacientes();
      setPacientes(pacRes.data.data.filter(p => p.activo));
      setIdPaciente(nuevo.idPaciente);
      resetNuevoPac();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear paciente');
    } finally {
      setCreandoPaciente(false);
    }
  };

  const handleCrear = async () => {
    if (!idSesion || !idEstudiante || !horaInicio || !horaFin) {
      setError('Sesion, estudiante, hora inicio y hora fin son obligatorios');
      return;
    }
    try {
      const data: CitaRequest = {
        idSesion: idSesion as number,
        idEstudiante: idEstudiante as number,
        horaInicio,
        horaFin,
        idPaciente: idPaciente ? (idPaciente as number) : undefined,
        observaciones: observaciones || undefined,
      };
      if (editandoId) {
        await citaService.editarCita(editandoId, data);
      } else {
        await citaService.crearBloque(data);
      }
      resetForm();
      await cargar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar cita');
    }
  };

  // Cancelar con observaciones
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);
  const [obsCancelar, setObsCancelar] = useState('');

  // Reprogramar
  const [reprogramandoId, setReprogramandoId] = useState<number | null>(null);
  const [bloquesReprogramar, setBloquesReprogramar] = useState<CitaResponse[]>([]);

  const handleCancelar = async (idCita: number) => {
    try {
      await citaService.cambiarEstado(idCita, 'CANCELADO', obsCancelar || undefined);
      setCancelandoId(null);
      setObsCancelar('');
      await cargar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cancelar');
    }
  };

  const handleIniciarReprogramar = async (idCita: number) => {
    setReprogramandoId(idCita);
    setCancelandoId(null);
    setError('');
    try {
      // Cargar bloques disponibles para seleccionar destino
      const res = await citaService.listarCitas('DISPONIBLE');
      setBloquesReprogramar(res.data.data);
    } catch { setError('Error al cargar bloques disponibles'); }
  };

  const handleReprogramar = async (idCitaNueva: number) => {
    if (!reprogramandoId) return;
    try {
      await citaService.reprogramarAdmin(reprogramandoId, idCitaNueva);
      setReprogramandoId(null);
      setBloquesReprogramar([]);
      await cargar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al reprogramar');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-700">Gestion de Citas</h3>
        <button type="button" onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          {showForm ? 'Cancelar' : '+ Crear bloque'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 font-bold">&times;</button>
        </div>
      )}

      {/* Formulario crear bloque */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 mb-5 space-y-4">
          <h4 className="font-semibold text-slate-700">{editandoId ? 'Editar cita' : 'Crear bloque de cita'}</h4>

          {/* Sesion */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Sesion *</label>
            <select value={idSesion} onChange={e => { setIdSesion(parseInt(e.target.value) || ''); setIdEstudiante(''); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-400">
              <option value="">Seleccionar sesion...</option>
              {sesiones.map(s => (
                <option key={s.idSesion} value={s.idSesion}>
                  {s.fecha} | {s.horaInicio}-{s.horaFin} | {s.nombreEspacio}/{s.nombreSalon} | Doc: {s.nombreDocente}
                </option>
              ))}
            </select>
          </div>

          {/* Estudiante (de la sesion seleccionada) */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Estudiante *</label>
            <select value={idEstudiante} onChange={e => setIdEstudiante(parseInt(e.target.value) || '')}
              disabled={!sesionSeleccionada}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-400 disabled:bg-slate-100">
              <option value="">Seleccionar estudiante...</option>
              {sesionSeleccionada?.estudiantes.map(e => (
                <option key={e.idEstudiante} value={e.idEstudiante}>{e.nombre}</option>
              ))}
            </select>
          </div>

          {/* Horario */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Hora inicio *</label>
              <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Hora fin *</label>
              <input type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-400" />
            </div>
          </div>

          {/* Paciente (opcional) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-600">
                Paciente <span className="text-slate-400 font-normal">(opcional — dejar vacio para bloque disponible)</span>
              </label>
              {!showNuevoPaciente && (
                <button type="button" onClick={() => setShowNuevoPaciente(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  + Nuevo paciente
                </button>
              )}
            </div>
            <select value={idPaciente} onChange={e => setIdPaciente(parseInt(e.target.value) || '')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-400">
              <option value="">Sin paciente (DISPONIBLE)</option>
              {pacientes.map(p => (
                <option key={p.idPaciente} value={p.idPaciente}>{p.nombre} {p.apellido} — {p.numeroDocumento}</option>
              ))}
            </select>

            {/* Mini-formulario nuevo paciente */}
            {showNuevoPaciente && (
              <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <h5 className="text-sm font-semibold text-slate-700">Registrar nuevo paciente</h5>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Nombre *" value={nuevoPac.nombre}
                    onChange={e => setNuevoPac({ ...nuevoPac, nombre: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-400" />
                  <input placeholder="Apellido *" value={nuevoPac.apellido}
                    onChange={e => setNuevoPac({ ...nuevoPac, apellido: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Correo *" type="email" value={nuevoPac.correo}
                    onChange={e => setNuevoPac({ ...nuevoPac, correo: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-400" />
                  <input placeholder="Contrasena *" type="password" value={nuevoPac.contrasena}
                    onChange={e => setNuevoPac({ ...nuevoPac, contrasena: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-400" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <select value={nuevoPac.tipoDocumento}
                    onChange={e => setNuevoPac({ ...nuevoPac, tipoDocumento: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-400">
                    {TIPOS_DOCUMENTO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input placeholder="Numero documento *" value={nuevoPac.numeroDocumento}
                    onChange={e => setNuevoPac({ ...nuevoPac, numeroDocumento: e.target.value })}
                    className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Fecha nacimiento *</label>
                    <input type="date" value={nuevoPac.fechaNacimiento}
                      onChange={e => setNuevoPac({ ...nuevoPac, fechaNacimiento: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-400" />
                  </div>
                  <input placeholder="Telefono *" value={nuevoPac.telefono}
                    onChange={e => setNuevoPac({ ...nuevoPac, telefono: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-400 mt-auto" />
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleCrearPaciente} disabled={creandoPaciente}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition disabled:opacity-50">
                    {creandoPaciente ? 'Creando...' : 'Crear y seleccionar'}
                  </button>
                  <button onClick={resetNuevoPac} className="text-xs text-slate-500 hover:text-slate-700">Cancelar</button>
                </div>
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Observaciones</label>
            <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-400 resize-none"
              placeholder="Notas opcionales..." />
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleCrear}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition">
              {editandoId ? 'Guardar cambios' : idPaciente ? 'Crear y asignar paciente' : 'Crear bloque disponible'}
            </button>
            <button onClick={resetForm} className="text-sm text-slate-500 hover:text-slate-700">Cancelar</button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {ESTADOS.map(e => (
          <button key={e} onClick={() => setFiltro(e)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              filtro === e ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}>
            {e === 'TODAS' ? 'Todas' : e.charAt(0) + e.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar por paciente o estudiante..."
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-400 mb-4" />

      {/* Lista de citas */}
      <div className="space-y-3">
        {(() => {
          const filtradas = citas.filter(c => {
            if (!busqueda) return true;
            const q = busqueda.toLowerCase();
            return (c.nombrePaciente || '').toLowerCase().includes(q) || c.nombreEstudiante.toLowerCase().includes(q);
          });
          return filtradas.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400">
            No hay citas {filtro !== 'TODAS' ? `con estado ${filtro.toLowerCase()}` : ''}
          </div>
        ) : filtradas.map(c => (
          <div key={c.idCita} className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-800">
                    {c.nombrePaciente || 'Sin paciente'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor[c.estado] || ''}`}>
                    {c.estado}
                  </span>
                </div>
                <div className="text-sm text-slate-500">
                  {c.fechaSesion} | {c.horaInicio} - {c.horaFin} | {c.nombreEspacio} / {c.nombreSalon}
                </div>
                <div className="text-sm text-slate-500">
                  Docente: {c.nombreDocente} | Estudiante: {c.nombreEstudiante}
                </div>
                {c.observaciones && <div className="text-sm text-slate-400 italic">"{c.observaciones}"</div>}
                {c.fechaReserva && (
                  <div className="text-xs text-slate-400">Reservada: {c.fechaReserva.replace('T', ' ').substring(0, 16)}</div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                {reprogramandoId === c.idCita ? (
                  <div className="flex flex-col gap-2 items-end w-72">
                    <span className="text-xs font-medium text-slate-600">Mover a bloque disponible:</span>
                    {bloquesReprogramar.length === 0 ? (
                      <span className="text-xs text-slate-400">No hay bloques disponibles</span>
                    ) : (
                      <div className="max-h-40 overflow-y-auto w-full space-y-1">
                        {bloquesReprogramar.map(b => (
                          <button key={b.idCita} onClick={() => handleReprogramar(b.idCita)}
                            className="w-full text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg px-3 py-2 text-xs transition">
                            <div className="font-medium text-slate-800">{b.fechaSesion} | {b.horaInicio} - {b.horaFin}</div>
                            <div className="text-slate-500">{b.nombreEspacio} / {b.nombreSalon} | Est: {b.nombreEstudiante}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    <button onClick={() => { setReprogramandoId(null); setBloquesReprogramar([]); }}
                      className="text-xs text-slate-500 hover:text-slate-700">Volver</button>
                  </div>
                ) : cancelandoId === c.idCita ? (
                  <div className="flex items-center gap-2">
                    <input placeholder="Motivo (opcional)" value={obsCancelar}
                      onChange={e => setObsCancelar(e.target.value)}
                      className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs outline-none w-48" />
                    <button onClick={() => handleCancelar(c.idCita)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                      Confirmar
                    </button>
                    <button onClick={() => { setCancelandoId(null); setObsCancelar(''); }}
                      className="text-xs text-slate-500">X</button>
                  </div>
                ) : (c.estado === 'RESERVADO' || c.estado === 'DISPONIBLE') ? (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleEditarCita(c)}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                      Editar
                    </button>
                    {c.estado === 'RESERVADO' && (
                      <button onClick={() => handleIniciarReprogramar(c.idCita)}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                        Reprogramar
                      </button>
                    )}
                    <button onClick={() => { setCancelandoId(c.idCita); setReprogramandoId(null); }}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                      Cancelar
                    </button>
                    <button onClick={async () => { if (confirm('¿Eliminar permanentemente esta cita? Esta accion no se puede deshacer.')) { try { await citaService.eliminarCita(c.idCita); await cargar(); } catch (err: any) { setError(err.response?.data?.message || 'Error al eliminar'); } } }}
                      className="bg-red-300 hover:bg-red-400 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <button onClick={async () => { if (confirm('¿Eliminar permanentemente esta cita? Esta accion no se puede deshacer.')) { try { await citaService.eliminarCita(c.idCita); await cargar(); } catch (err: any) { setError(err.response?.data?.message || 'Error al eliminar'); } } }}
                    className="bg-red-300 hover:bg-red-400 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>
        ));
        })()}
      </div>
    </div>
  );
}
