import { useState, useEffect } from 'react';
import { adminService, type EstudianteResponse, type CrearEstudianteRequest, type DocenteResponse } from '../../api/adminService';

export default function EstudiantesTab() {
  const [estudiantes, setEstudiantes] = useState<EstudianteResponse[]>([]);
  const [docentes, setDocentes] = useState<DocenteResponse[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [form, setForm] = useState<CrearEstudianteRequest>({
    nombre: '', apellido: '', correo: '', cedula: '', semestre: 1, telefono: '', idDocente: null,
  });

  const resetForm = () => {
    setForm({ nombre: '', apellido: '', correo: '', cedula: '', semestre: 1, telefono: '', idDocente: null });
    setShowForm(false);
    setEditandoId(null);
  };

  const cargar = async () => {
    try {
      const [estRes, docRes] = await Promise.all([
        adminService.listarEstudiantes(),
        adminService.listarDocentes(),
      ]);
      setEstudiantes(estRes.data.data);
      setDocentes(docRes.data.data.filter(d => d.activo));
    } catch {
      setError('Error al cargar estudiantes');
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleEditar = (e: EstudianteResponse) => {
    setForm({ nombre: e.nombre, apellido: e.apellido, correo: e.correo, cedula: e.cedula, semestre: e.semestre, telefono: e.telefono || '', idDocente: e.idDocente });
    setEditandoId(e.idEstudiante);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (editandoId) {
        await adminService.editarEstudiante(editandoId, form);
        setSuccess('Estudiante actualizado');
      } else {
        await adminService.crearEstudiante(form);
        setSuccess('Estudiante creado exitosamente');
      }
      resetForm();
      await cargar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar estudiante');
    } finally {
      setLoading(false);
    }
  };

  const handleDesactivar = async (id: number) => {
    try { await adminService.desactivarEstudiante(id); await cargar(); }
    catch { setError('Error al desactivar estudiante'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-700">Estudiantes</h3>
        <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          {showForm ? 'Cancelar' : '+ Agregar estudiante'}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError('')} className="ml-2 font-bold">&times;</button></div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 mb-6 space-y-4">
          <h4 className="font-semibold text-slate-700">{editandoId ? 'Editar estudiante' : 'Crear estudiante'}</h4>
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
              disabled={!!editandoId} placeholder="estudiante@unbosque.edu.co"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:bg-slate-100" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cedula</label>
              <input type="text" value={form.cedula}
                onChange={e => { if (/^\d{0,15}$/.test(e.target.value)) setForm({...form, cedula: e.target.value}); }}
                required placeholder="1234567890"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Semestre</label>
              <input type="number" min={1} max={12} value={form.semestre} onChange={e => setForm({...form, semestre: parseInt(e.target.value)})} required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefono</label>
              <input type="tel" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Docente asignado</label>
            <select value={form.idDocente ?? ''} onChange={e => setForm({...form, idDocente: e.target.value ? parseInt(e.target.value) : null})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
              <option value="">Sin asignar</option>
              {docentes.map(d => (
                <option key={d.idDocente} value={d.idDocente}>{d.nombre} {d.apellido}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition disabled:opacity-50">
              {loading ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear estudiante'}
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
              <th className="text-left px-4 py-3 font-medium text-slate-600">Semestre</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Docente</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const filtrados = estudiantes.filter(e => {
                if (!busqueda) return true;
                const q = busqueda.toLowerCase();
                return `${e.nombre} ${e.apellido}`.toLowerCase().includes(q) || e.cedula.toLowerCase().includes(q);
              });
              return filtrados.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-400">No hay estudiantes registrados</td></tr>
            ) : filtrados.map(e => (
              <tr key={e.idEstudiante} className="border-b border-slate-100">
                <td className="px-4 py-3">{e.nombre} {e.apellido}</td>
                <td className="px-4 py-3 text-slate-500">{e.correo}</td>
                <td className="px-4 py-3 text-slate-500">{e.cedula}</td>
                <td className="px-4 py-3 text-slate-500">{e.semestre}</td>
                <td className="px-4 py-3 text-slate-500">{e.nombreDocente || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${e.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {e.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEditar(e)}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium">Editar</button>
                    {e.activo ? (
                      <button onClick={() => handleDesactivar(e.idEstudiante)}
                        className="text-red-600 hover:text-red-700 text-xs font-medium">Desactivar</button>
                    ) : (
                      <button onClick={async () => { await adminService.reactivarEstudiante(e.idEstudiante); await cargar(); }}
                        className="text-emerald-600 hover:text-emerald-700 text-xs font-medium">Reactivar</button>
                    )}
                    <button onClick={async () => { if (confirm('¿Eliminar permanentemente este estudiante? Esta accion no se puede deshacer.')) { try { await adminService.eliminarEstudiante(e.idEstudiante); await cargar(); } catch (err: any) { setError(err.response?.data?.message || 'Error al eliminar'); } } }}
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
