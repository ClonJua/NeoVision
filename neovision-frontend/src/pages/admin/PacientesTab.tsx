import { useState, useEffect } from 'react';
import { adminService, type PacienteResponse, type CrearPacienteRequest } from '../../api/adminService';

export default function PacientesTab() {
  const [pacientes, setPacientes] = useState<PacienteResponse[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [form, setForm] = useState<CrearPacienteRequest>({
    nombre: '', apellido: '', correo: '', contrasena: '',
    tipoDocumento: 'CC', numeroDocumento: '', fechaNacimiento: '', telefono: '',
  });

  const resetForm = () => {
    setForm({ nombre: '', apellido: '', correo: '', contrasena: '', tipoDocumento: 'CC', numeroDocumento: '', fechaNacimiento: '', telefono: '' });
    setShowForm(false);
    setEditandoId(null);
  };

  const cargar = async () => {
    try {
      const res = await adminService.listarPacientes();
      setPacientes(res.data.data);
    } catch {
      setError('Error al cargar pacientes');
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleEditar = (p: PacienteResponse) => {
    setForm({ nombre: p.nombre, apellido: p.apellido, correo: p.correo, contrasena: '', tipoDocumento: p.tipoDocumento, numeroDocumento: p.numeroDocumento, fechaNacimiento: p.fechaNacimiento, telefono: p.telefono });
    setEditandoId(p.idPaciente);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (editandoId) {
        await adminService.editarPaciente(editandoId, form);
        setSuccess('Paciente actualizado');
      } else {
        await adminService.crearPaciente(form);
        setSuccess('Paciente creado exitosamente');
      }
      resetForm();
      await cargar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleDesactivar = async (id: number) => {
    try { await adminService.desactivarPaciente(id); await cargar(); }
    catch { setError('Error al desactivar paciente'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-700">Pacientes</h3>
        <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          {showForm ? 'Cancelar' : '+ Agregar paciente'}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}<button onClick={() => setError('')} className="ml-2 font-bold">&times;</button></div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 mb-6 space-y-4">
          <h4 className="font-semibold text-slate-700">{editandoId ? 'Editar paciente' : 'Crear paciente'}</h4>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo</label>
              <input type="email" value={form.correo} onChange={e => setForm({...form, correo: e.target.value})} required
                disabled={!!editandoId} placeholder="paciente@correo.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:bg-slate-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contrasena {editandoId ? '(dejar vacio para no cambiar)' : ''}</label>
              <input type="password" value={form.contrasena} onChange={e => setForm({...form, contrasena: e.target.value})}
                {...(!editandoId ? { required: true } : {})}
                minLength={8} placeholder="Minimo 8 caracteres"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo documento</label>
              <select value={form.tipoDocumento} onChange={e => setForm({...form, tipoDocumento: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                <option value="CC">CC</option>
                <option value="TI">TI</option>
                <option value="RC">RC</option>
                <option value="CE">CE</option>
                <option value="PA">PA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Numero documento</label>
              <input type="text" value={form.numeroDocumento}
                onChange={e => { if (/^\d{0,15}$/.test(e.target.value)) setForm({...form, numeroDocumento: e.target.value}); }}
                required placeholder="1234567890"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Celular</label>
              <input type="tel" value={form.telefono}
                onChange={e => { if (/^\d{0,10}$/.test(e.target.value)) setForm({...form, telefono: e.target.value}); }}
                required pattern="3\d{9}" maxLength={10} placeholder="3001234567"
                title="Celular colombiano: 10 digitos, inicia con 3"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de nacimiento</label>
            <input type="date" value={form.fechaNacimiento} onChange={e => setForm({...form, fechaNacimiento: e.target.value})} required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition disabled:opacity-50">
              {loading ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear paciente'}
            </button>
            {editandoId && <button type="button" onClick={resetForm} className="text-sm text-slate-500 hover:text-slate-700">Cancelar</button>}
          </div>
        </form>
      )}

      <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre o documento..."
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-400 mb-4" />

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Correo</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Documento</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Telefono</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const filtrados = pacientes.filter(p => {
                if (!busqueda) return true;
                const q = busqueda.toLowerCase();
                return `${p.nombre} ${p.apellido}`.toLowerCase().includes(q) || p.numeroDocumento.includes(q);
              });
              return filtrados.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400">No hay pacientes registrados</td></tr>
            ) : filtrados.map(p => (
              <tr key={p.idPaciente} className="border-b border-slate-100">
                <td className="px-4 py-3">{p.nombre} {p.apellido}</td>
                <td className="px-4 py-3 text-slate-500">{p.correo}</td>
                <td className="px-4 py-3 text-slate-500">{p.tipoDocumento} {p.numeroDocumento}</td>
                <td className="px-4 py-3 text-slate-500">{p.telefono}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEditar(p)}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium">Editar</button>
                    {p.activo ? (
                      <button onClick={() => handleDesactivar(p.idPaciente)}
                        className="text-red-600 hover:text-red-700 text-xs font-medium">Desactivar</button>
                    ) : (
                      <button onClick={async () => { await adminService.reactivarPaciente(p.idPaciente); await cargar(); }}
                        className="text-emerald-600 hover:text-emerald-700 text-xs font-medium">Reactivar</button>
                    )}
                    <button onClick={async () => { if (confirm('¿Eliminar permanentemente este paciente? Esta accion no se puede deshacer.')) { try { await adminService.eliminarPaciente(p.idPaciente); await cargar(); } catch (err: any) { setError(err.response?.data?.message || 'Error al eliminar'); } } }}
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
