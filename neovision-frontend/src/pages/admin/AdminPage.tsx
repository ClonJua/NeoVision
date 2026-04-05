import { useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import DocentesTab from './DocentesTab';
import EstudiantesTab from './EstudiantesTab';
import PacientesTab from './PacientesTab';
import EspaciosTab from './EspaciosTab';
import SesionesTab from './SesionesTab';
import CitasTab from './CitasTab';

type Tab = 'docentes' | 'estudiantes' | 'pacientes' | 'espacios' | 'sesiones' | 'citas';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('espacios');
  const { correo, logout } = useAuth();
  const { instance } = useMsal();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(instance);
    navigate('/login');
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'espacios', label: 'Espacios / Salones' },
    { key: 'sesiones', label: 'Sesiones' },
    { key: 'citas', label: 'Citas' },
    { key: 'docentes', label: 'Docentes' },
    { key: 'estudiantes', label: 'Estudiantes' },
    { key: 'pacientes', label: 'Pacientes' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">NeoVision</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{correo}</span>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
              ADMIN
            </span>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700 font-medium">
              Cerrar sesion
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="text-2xl font-semibold text-slate-800 mb-6">Panel de Administracion</h2>

        <div className="flex border-b border-slate-200 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'espacios' && <EspaciosTab />}
        {tab === 'sesiones' && <SesionesTab />}
        {tab === 'citas' && <CitasTab />}
        {tab === 'docentes' && <DocentesTab />}
        {tab === 'estudiantes' && <EstudiantesTab />}
        {tab === 'pacientes' && <PacientesTab />}
      </main>
    </div>
  );
}
