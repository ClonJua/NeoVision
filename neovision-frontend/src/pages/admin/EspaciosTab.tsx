import { useState, useEffect } from 'react';
import { espacioService, type EspacioResponse, type EspacioRequest, type SalonRequest } from '../../api/espacioService';

export default function EspaciosTab() {
  const [espacios, setEspacios] = useState<EspacioResponse[]>([]);
  const [showEspacioForm, setShowEspacioForm] = useState(false);
  const [showSalonForm, setShowSalonForm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [editandoEspacioId, setEditandoEspacioId] = useState<number | null>(null);
  const [editandoSalonId, setEditandoSalonId] = useState<number | null>(null);
  const [espacioForm, setEspacioForm] = useState<EspacioRequest>({ nombre: '', descripcion: '' });
  const [salonForm, setSalonForm] = useState<Omit<SalonRequest, 'idEspacio'>>({ nombre: '', capacidad: 1 });

  const cargar = async () => {
    try {
      const res = await espacioService.listar();
      setEspacios(res.data.data);
    } catch {
      setError('Error al cargar espacios');
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleSubmitEspacio = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (editandoEspacioId) {
        await espacioService.editar(editandoEspacioId, espacioForm);
        setSuccess('Espacio actualizado');
      } else {
        await espacioService.crear(espacioForm);
        setSuccess('Espacio creado');
      }
      setEspacioForm({ nombre: '', descripcion: '' });
      setShowEspacioForm(false);
      setEditandoEspacioId(null);
      await cargar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar espacio');
    } finally {
      setLoading(false);
    }
  };

  const handleEditarEspacio = (esp: EspacioResponse) => {
    setEspacioForm({ nombre: esp.nombre, descripcion: esp.descripcion || '' });
    setEditandoEspacioId(esp.idEspacio);
    setShowEspacioForm(true);
  };

  const handleSubmitSalon = async (e: React.FormEvent, idEspacio: number) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (editandoSalonId) {
        await espacioService.editarSalon(editandoSalonId, { ...salonForm, idEspacio });
        setSuccess('Salon actualizado');
      } else {
        await espacioService.crearSalon({ ...salonForm, idEspacio });
        setSuccess('Salon creado');
      }
      setSalonForm({ nombre: '', capacidad: 1 });
      setShowSalonForm(null);
      setEditandoSalonId(null);
      await cargar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar salon');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEspacio = async (id: number, activo: boolean) => {
    try {
      if (activo) await espacioService.desactivar(id);
      else await espacioService.activar(id);
      await cargar();
    } catch { setError(`Error al ${activo ? 'desactivar' : 'activar'} espacio`); }
  };

  const handleToggleSalon = async (id: number, activo: boolean) => {
    try {
      if (activo) await espacioService.desactivarSalon(id);
      else await espacioService.activarSalon(id);
      await cargar();
    } catch { setError(`Error al ${activo ? 'desactivar' : 'activar'} salon`); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-700">Espacios y Salones</h3>
        <button onClick={() => { if (showEspacioForm) { setShowEspacioForm(false); setEditandoEspacioId(null); setEspacioForm({ nombre: '', descripcion: '' }); } else setShowEspacioForm(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          {showEspacioForm ? 'Cancelar' : '+ Nuevo espacio'}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}

      {showEspacioForm && (
        <form onSubmit={handleSubmitEspacio} className="bg-white border border-slate-200 rounded-lg p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del espacio</label>
              <input type="text" value={espacioForm.nombre} onChange={e => setEspacioForm({...espacioForm, nombre: e.target.value})} required
                placeholder="Ej: Clinica de Optometria"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripcion</label>
              <input type="text" value={espacioForm.descripcion} onChange={e => setEspacioForm({...espacioForm, descripcion: e.target.value})}
                placeholder="Descripcion opcional"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition disabled:opacity-50">
            {loading ? 'Guardando...' : editandoEspacioId ? 'Guardar cambios' : 'Crear espacio'}
          </button>
        </form>
      )}

      <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre..."
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-400 mb-4" />

      {(() => {
        const filtrados = espacios.filter(e => {
          if (!busqueda) return true;
          const q = busqueda.toLowerCase();
          return e.nombre.toLowerCase().includes(q) || e.salones.some(s => s.nombre.toLowerCase().includes(q));
        });
        return filtrados.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400">
          No hay espacios registrados
        </div>
      ) : (
        <div className="space-y-4">
          {filtrados.map(esp => (
            <div key={esp.idEspacio} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              {/* Header del espacio */}
              <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                <div>
                  <h4 className="font-semibold text-slate-800">{esp.nombre}</h4>
                  {esp.descripcion && <p className="text-sm text-slate-500">{esp.descripcion}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${esp.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {esp.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <button onClick={() => handleEditarEspacio(esp)}
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium">Editar</button>
                  {esp.activo && (
                    <button onClick={() => { setShowSalonForm(showSalonForm === esp.idEspacio ? null : esp.idEspacio); setSalonForm({ nombre: '', capacidad: 1 }); setEditandoSalonId(null); }}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                      + Salon
                    </button>
                  )}
                  <button onClick={() => handleToggleEspacio(esp.idEspacio, esp.activo)}
                    className={`text-xs font-medium ${esp.activo ? 'text-red-600 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'}`}>
                    {esp.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={async () => { if (confirm('¿Eliminar permanentemente este espacio y todos sus salones? Esta accion no se puede deshacer.')) { try { await espacioService.eliminar(esp.idEspacio); await cargar(); } catch (err: any) { setError(err.response?.data?.message || 'Error al eliminar'); } } }}
                    className="text-red-400 hover:text-red-600 text-xs font-medium">Eliminar</button>
                </div>
              </div>

              {/* Form para agregar salon */}
              {showSalonForm === esp.idEspacio && (
                <form onSubmit={e => handleSubmitSalon(e, esp.idEspacio)} className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nombre del salon</label>
                    <input type="text" value={salonForm.nombre} onChange={e => setSalonForm({...salonForm, nombre: e.target.value})} required
                      placeholder="Ej: Consultorio 1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Capacidad</label>
                    <input type="number" min={1} value={salonForm.capacidad} onChange={e => setSalonForm({...salonForm, capacidad: parseInt(e.target.value)})} required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50">
                    {editandoSalonId ? 'Guardar' : 'Crear'}
                  </button>
                </form>
              )}

              {/* Lista de salones */}
              {esp.salones.length > 0 && (
                <div className="divide-y divide-slate-100">
                  {esp.salones.map(s => (
                    <div key={s.idSalon} className="px-5 py-3 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-xs">&#9656;</span>
                        <span className="text-slate-700">{s.nombre}</span>
                        <span className="text-slate-400 text-xs">Capacidad: {s.capacidad}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => { setSalonForm({ nombre: s.nombre, capacidad: s.capacidad }); setEditandoSalonId(s.idSalon); setShowSalonForm(esp.idEspacio); }}
                          className="text-blue-600 hover:text-blue-700 text-xs font-medium">Editar</button>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {s.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <button onClick={() => handleToggleSalon(s.idSalon, s.activo)}
                          className={`text-xs font-medium ${s.activo ? 'text-red-600 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'}`}>
                          {s.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button onClick={async () => { if (confirm('¿Eliminar permanentemente este salon? Esta accion no se puede deshacer.')) { try { await espacioService.eliminarSalon(s.idSalon); await cargar(); } catch (err: any) { setError(err.response?.data?.message || 'Error al eliminar'); } } }}
                          className="text-red-400 hover:text-red-600 text-xs font-medium">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {esp.salones.length === 0 && (
                <div className="px-5 py-4 text-sm text-slate-400">Sin salones</div>
              )}
            </div>
          ))}
        </div>
      );
      })()}
    </div>
  );
}
