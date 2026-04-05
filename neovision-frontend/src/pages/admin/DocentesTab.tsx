import { useState, useEffect } from 'react';
import { adminService, type DocenteResponse, type CrearDocenteRequest } from '../../api/adminService';

export default function DocentesTab() {
  const [docentes, setDocentes] = useState<DocenteResponse[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [form, setForm] = useState<CrearDocenteRequest>({
    nombre: '', apellido: '', correo: '', cedula: '', telefono: '',
  });

  const resetForm = () => {
    setForm({ nombre: '', apellido: '', correo: '', cedula: '', telefono: '' });
    setShowForm(false);
    setEditandoId(null);
  };

  const cargar = async () => {
    try {
      const res = await adminService.listarDocentes();
      setDocentes(res.data.data);
    } catch {
      setError('Error al cargar docentes');
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleEditar = (d: DocenteResponse) => {
    setForm({ nombre: d.nombre, apellido: d.apellido, correo: d.correo, cedula: d.cedula || '', telefono: d.telefono || '' });
    setEditandoId(d.idDocente);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (editandoId) {
        await adminService.editarDocente(editandoId, form);
        setSuccess('Docente actualizado');
      } else {
        await adminService.crearDocente(form);
        setSuccess('Docente creado exitosamente');
      }
      resetForm();
      await cargar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar docente');
    } finally {
      setLoading(false);
    }
  };

  const handleDesactivar = async (id: number) => {
    try { await adminService.desactivarDocente(id); await cargar(); }
    catch { setError('Error al desactivar docente'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-700">Docentes</h3>
        <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          {showForm ? 'Cancelar' : '+ Agregar docente'}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError('')} className="ml-2 font-bold">&times;</button></div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 mb-6 space-y-4">
          <h4 className="font-semibold text-slate-700">{editandoId ? 'Editar docente' : 'Crear docente'}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
              <input type="text" value={form.apellido} onChange={e => setForm({...form, apellido: e.target.value})} required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo institucional</label>
            <input type="email" value={form.correo} onChange={e => setForm({...form, correo: e.target.value})} required
              disabled={!!editandoId} placeholder="docente@unbosque.edu.co"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:bg-slate-100" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cedula</label>
              <input type="text" value={form.cedula}
                onChange={e => { if (/^\d{0,15}$/.test(e.target.value)) setForm({...form, cedula: e.target.value}); }}
                placeholder="1234567890"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefono</label>
              <input type="tel" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition disabled:opacity-50">
              {loading ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear docente'}
            </button>
            {editandoId && <button type="button" onClick={resetForm} className="text-sm text-slate-500 hover:text-slate-700">Cancelar</button>}
          </div>
        </form>
      )}

      <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre o cedula..."
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-400 mb-4" />

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Correo</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Cedula</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const filtrados = docentes.filter(d => {
                if (!busqueda) return true;
                const q = busqueda.toLowerCase();
                return `${d.nombre} ${d.apellido}`.toLowerCase().includes(q) || (d.cedula || '').includes(q);
              });
              return filtrados.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-400">No hay docentes registrados</td></tr>
            ) : filtrados.map(d => (
              <tr key={d.idDocente} className="border-b border-slate-100">
                <td className="px-4 py-3">{d.nombre} {d.apellido}</td>
                <td className="px-4 py-3 text-slate-500">{d.correo}</td>
                <td className="px-4 py-3 text-slate-500">{d.cedula || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${d.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {d.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEditar(d)}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium">Editar</button>
                    {d.activo ? (
                      <button onClick={() => handleDesactivar(d.idDocente)}
                        className="text-red-600 hover:text-red-700 text-xs font-medium">Desactivar</button>
                    ) : (
                      <button onClick={async () => { await adminService.reactivarDocente(d.idDocente); await cargar(); }}
                        className="text-emerald-600 hover:text-emerald-700 text-xs font-medium">Reactivar</button>
                    )}
                    <button onClick={async () => { if (confirm('¿Eliminar permanentemente este docente? Esta accion no se puede deshacer.')) { try { await adminService.eliminarDocente(d.idDocente); await cargar(); } catch (err: any) { setError(err.response?.data?.message || 'Error al eliminar'); } } }}
                      className="text-red-400 hover:text-red-600 text-xs font-medium">Eliminar</button>
                  </div>
                </td>
              </tr>
            ));
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
