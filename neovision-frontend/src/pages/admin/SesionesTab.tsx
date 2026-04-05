import { useState, useEffect } from 'react';
import { sesionService, type SesionResponse, type SesionRequest } from '../../api/sesionService';
import { espacioService, type EspacioResponse } from '../../api/espacioService';
import { adminService, type DocenteResponse, type EstudianteResponse } from '../../api/adminService';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export default function SesionesTab() {
  const [sesiones, setSesiones] = useState<SesionResponse[]>([]);
  const [espacios, setEspacios] = useState<EspacioResponse[]>([]);
  const [docentes, setDocentes] = useState<DocenteResponse[]>([]);
  const [estudiantes, setEstudiantes] = useState<EstudianteResponse[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Semana actual
  const [lunes, setLunes] = useState(() => getMonday(new Date()));

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<SesionRequest>({
    idSalon: 0, idDocente: 0, fecha: '', cuposTotales: 1, idsEstudiantes: [],
  });
  const [selectedEspacio, setSelectedEspacio] = useState<number | null>(null);

  const semanaLabel = `${formatDate(lunes)} al ${formatDate(addDays(lunes, 4))}`;
  const diasSemana = Array.from({ length: 5 }, (_, i) => addDays(lunes, i)); // Lun-Vie

  const cargar = async () => {
    try {
      const [sesRes, espRes, docRes, estRes] = await Promise.all([
        sesionService.listar(),
        espacioService.listar(),
        adminService.listarDocentes(),
        adminService.listarEstudiantes(),
      ]);
      setSesiones(sesRes.data.data);
      setEspacios(espRes.data.data.filter(e => e.activo));
      setDocentes(docRes.data.data.filter(d => d.activo));
      setEstudiantes(estRes.data.data.filter(e => e.activo));
    } catch {
      setError('Error al cargar datos');
    }
  };

  useEffect(() => { cargar(); }, []);

  // Agrupar sesiones por fecha
  const sesionesPorFecha = (fecha: string) =>
    sesiones.filter(s => s.fecha === fecha && s.activo).filter(s => {
      if (!busqueda) return true;
      const q = busqueda.toLowerCase();
      return s.nombreDocente.toLowerCase().includes(q) || s.nombreEspacio.toLowerCase().includes(q) || s.nombreSalon.toLowerCase().includes(q)
        || s.estudiantes.some(e => e.nombre.toLowerCase().includes(q));
    });

  // Agrupar por espacio dentro de un dia
  const sesionesPorEspacio = (fecha: string) => {
    const del_dia = sesionesPorFecha(fecha);
    const grupos: Record<string, SesionResponse[]> = {};
    del_dia.forEach(s => {
      const key = s.nombreEspacio;
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(s);
    });
    return grupos;
  };

  const salonesDelEspacio = selectedEspacio
    ? espacios.find(e => e.idEspacio === selectedEspacio)?.salones.filter(s => s.activo) || []
    : [];

  const toggleEstudiante = (id: number) => {
    setForm(prev => ({
      ...prev,
      idsEstudiantes: prev.idsEstudiantes.includes(id)
        ? prev.idsEstudiantes.filter(x => x !== id)
        : [...prev.idsEstudiantes, id],
    }));
  };

  const resetForm = () => {
    setForm({ idSalon: 0, idDocente: 0, fecha: '', horaInicio: '', horaFin: '', cuposTotales: 1, idsEstudiantes: [] });
    setSelectedEspacio(null);
    setShowForm(false);
    setEditandoId(null);
  };

  const handleEditarSesion = (s: SesionResponse) => {
    const esp = espacios.find(e => e.salones.some(sl => sl.idSalon === s.idSalon));
    setSelectedEspacio(esp?.idEspacio ?? null);
    setForm({ idSalon: s.idSalon, idDocente: s.idDocente, fecha: s.fecha, horaInicio: s.horaInicio || '', horaFin: s.horaFin || '', cuposTotales: s.cuposTotales, idsEstudiantes: s.estudiantes.map(e => e.idEstudiante) });
    setEditandoId(s.idSesion);
    setShowForm(true);
    setError('');
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.idSalon || !form.idDocente || !form.fecha) { setError('Completa salon, docente y fecha'); return; }
    setError(''); setLoading(true);
    try {
      if (editandoId) {
        await sesionService.editar(editandoId, form);
        setSuccess('Sesion actualizada');
      } else {
        await sesionService.crear(form);
        setSuccess('Sesion creada');
      }
      resetForm();
      await cargar();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDesactivar = async (id: number) => {
    try { await sesionService.desactivar(id); await cargar(); }
    catch { setError('Error al desactivar'); }
  };

  // Crear sesion rapida: pre-llenar fecha al hacer click en un dia
  const crearEnDia = (fecha: string) => {
    setForm({ ...form, fecha });
    setShowForm(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-700">Sesiones de Practica</h3>
        <button type="button" onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          {showForm ? 'Cancelar' : '+ Nueva sesion'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}<button onClick={() => setError('')} className="ml-2 font-bold">&times;</button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>
      )}

      {/* Formulario crear */}
      {showForm && (
        <form onSubmit={handleCrear} className="bg-white border border-slate-200 rounded-lg p-5 mb-5 space-y-3">
          <h4 className="font-semibold text-slate-700">{editandoId ? 'Editar sesion' : 'Crear sesion'}</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Espacio</label>
              <select value={selectedEspacio ?? ''} onChange={e => { setSelectedEspacio(parseInt(e.target.value) || null); setForm({...form, idSalon: 0}); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none">
                <option value="">Seleccionar...</option>
                {espacios.map(e => <option key={e.idEspacio} value={e.idEspacio}>{e.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Salon</label>
              <select value={form.idSalon || ''} onChange={e => setForm({...form, idSalon: parseInt(e.target.value)})}
                disabled={!selectedEspacio}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none disabled:bg-slate-100">
                <option value="">Seleccionar...</option>
                {salonesDelEspacio.map(s => <option key={s.idSalon} value={s.idSalon}>{s.nombre} (Cap: {s.capacidad})</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Docente</label>
              <select value={form.idDocente || ''} onChange={e => setForm({...form, idDocente: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none">
                <option value="">Seleccionar...</option>
                {docentes.map(d => <option key={d.idDocente} value={d.idDocente}>{d.nombre} {d.apellido}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha</label>
              <input type="date" value={form.fecha} min={formatDate(new Date())}
                onChange={e => setForm({...form, fecha: e.target.value})} required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cupos</label>
              <input type="number" min={1} value={form.cuposTotales} onChange={e => setForm({...form, cuposTotales: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Estudiantes</label>
            <div className="flex flex-wrap gap-1.5">
              {estudiantes.map(e => (
                <button type="button" key={e.idEstudiante} onClick={() => toggleEstudiante(e.idEstudiante)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                    form.idsEstudiantes.includes(e.idEstudiante)
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                  {e.nombre} {e.apellido}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-50">
              {loading ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear sesion'}
            </button>
            {editandoId && <button type="button" onClick={resetForm} className="text-sm text-slate-500 hover:text-slate-700">Cancelar</button>}
          </div>
        </form>
      )}

      {/* Navegacion semanal */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3 mb-4">
        <button type="button" onClick={() => setLunes(addDays(lunes, -7))}
          className="text-slate-600 hover:text-slate-800 font-medium text-sm px-3 py-1 rounded hover:bg-slate-100">
          &larr; Anterior
        </button>
        <div className="text-center">
          <span className="font-semibold text-slate-700">Semana: {semanaLabel}</span>
          <button type="button" onClick={() => setLunes(getMonday(new Date()))}
            className="ml-3 text-xs text-blue-600 hover:text-blue-700">Hoy</button>
        </div>
        <button type="button" onClick={() => setLunes(addDays(lunes, 7))}
          className="text-slate-600 hover:text-slate-800 font-medium text-sm px-3 py-1 rounded hover:bg-slate-100">
          Siguiente &rarr;
        </button>
      </div>

      <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar por docente, espacio, salon o estudiante..."
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-400 mb-4" />

      {/* Grilla semanal */}
      <div className="space-y-3">
        {diasSemana.map(dia => {
          const fechaStr = formatDate(dia);
          const porEspacio = sesionesPorEspacio(fechaStr);
          const espacioKeys = Object.keys(porEspacio);
          const esHoy = fechaStr === formatDate(new Date());

          return (
            <div key={fechaStr} className={`bg-white border rounded-lg overflow-hidden ${esHoy ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200'}`}>
              {/* Dia header */}
              <div className={`flex items-center justify-between px-4 py-2.5 ${esHoy ? 'bg-blue-50' : 'bg-slate-50'} border-b border-slate-200`}>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${esHoy ? 'text-blue-700' : 'text-slate-700'}`}>
                    {DIAS[dia.getDay()]} {dia.getDate()}/{dia.getMonth() + 1}
                  </span>
                  {esHoy && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Hoy</span>}
                  {espacioKeys.length === 0 && <span className="text-xs text-slate-400 ml-2">Sin sesiones</span>}
                </div>
                <button onClick={() => crearEnDia(fechaStr)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Agregar</button>
              </div>

              {/* Sesiones del dia agrupadas por espacio */}
              {espacioKeys.length > 0 && (
                <div className="divide-y divide-slate-100">
                  {espacioKeys.map(espacio => (
                    <div key={espacio} className="px-4 py-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{espacio}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {porEspacio[espacio].sort((a, b) => (a.horaInicio ?? '').localeCompare(b.horaInicio ?? '')).map(s => (
                          <div key={s.idSesion} className="border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition group">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-semibold text-slate-800">
                                {s.nombreSalon}
                              </span>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                <button type="button" onClick={() => handleEditarSesion(s)}
                                  className="text-blue-500 hover:text-blue-700 text-xs">Editar</button>
                                <button type="button" onClick={() => handleDesactivar(s.idSesion)}
                                  className="text-red-400 hover:text-red-600 text-xs">Cancelar</button>
                                <button type="button" onClick={async () => { if (confirm('¿Eliminar permanentemente esta sesion? Esta accion no se puede deshacer.')) { try { await sesionService.eliminar(s.idSesion); await cargar(); } catch (err: any) { setError(err.response?.data?.message || 'Error al eliminar'); } } }}
                                  className="text-red-400 hover:text-red-600 text-xs">Eliminar</button>
                              </div>
                            </div>
                            <div className="text-xs text-slate-500 mb-1">
                              Doc: {s.nombreDocente} | Cupos: {s.cuposDisponibles}/{s.cuposTotales}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {s.estudiantes.map(e => (
                                <span key={e.idEstudiante}
                                  className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full border border-blue-100">
                                  {e.nombre}
                                </span>
                              ))}
                              {s.estudiantes.length === 0 && (
                                <span className="text-[10px] text-slate-400">Sin estudiantes</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
