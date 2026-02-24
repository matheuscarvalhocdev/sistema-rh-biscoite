import logoBiscoite from './assets/logo-biscoite.svg';
import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom' // 👈 Adicionamos o Navigate aqui
import { 
  LayoutDashboard, Users, Upload, Building2, FileText, AlertTriangle, 
  History, Settings as SettingsIcon, UserCog, LogOut, Menu, X, 
  DollarSign, Target, ShieldCheck, Shield, ShieldAlert 
} from 'lucide-react'

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 👇 1. VERIFICA SE ESTÁ LOGADO DE VERDADE
  const storedUserStr = localStorage.getItem("rh_user");
  
  // Se não tem ninguém logado, chuta pra tela de login na mesma hora!
  if (!storedUserStr) {
      return <Navigate to="/login" replace />;
  }

  const currentUser = JSON.parse(storedUserStr);

  // 2. LISTA COMPLETA DE MENUS
  const allMenuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employees', label: 'Funcionários', icon: Users },
    { path: '/import-employees', label: 'Importar', icon: Upload },
    { path: '/units', label: 'Unidades', icon: Building2 },
    { path: '/vagas', label: 'Vagas Abertas', icon: Target },
    { path: '/payroll', label: 'Folha & Custos', icon: DollarSign }, 
    { path: '/monthly-logs', label: 'Ponto Eletrônico', icon: FileText },
    { path: '/occurrences', label: 'Ocorrências', icon: AlertTriangle },
    { path: '/history', label: 'Histórico', icon: History },
    { path: '/users', label: 'Usuários', icon: UserCog },
    { path: '/settings', label: 'Configurações', icon: SettingsIcon },
  ];

  // 3. FILTRA O MENU BASEADO NO CARGO
  const menuItems = allMenuItems.filter(item => {
      if (currentUser.role === 'Líder de Loja') {
          return ['/', '/monthly-logs', '/occurrences'].includes(item.path);
      }
      return true; 
  });

  const handleLogout = () => {
    localStorage.removeItem("rh_token");
    localStorage.removeItem("rh_user");
    navigate("/login");
  };

  const roleColors = {
      'Administrador': 'text-purple-600 bg-purple-100',
      'RH': 'text-blue-600 bg-blue-100',
      'Líder de Loja': 'text-orange-600 bg-orange-100'
  };
  const roleIcon = {
      'Administrador': <ShieldCheck className="w-3.5 h-3.5" />,
      'RH': <Shield className="w-3.5 h-3.5" />,
      'Líder de Loja': <ShieldAlert className="w-3.5 h-3.5" />
  };

  return (
    <div className="flex h-screen bg-slate-50">
      
      {/* Menu Mobile */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-white rounded-md shadow-md text-slate-700">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar / Menu Lateral */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
          
          <div className="p-6 border-b border-slate-100 flex items-center justify-center shrink-0">
              <img src={logoBiscoite} alt="Biscoitê" className="h-16 w-auto" />
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm
                    ${isActive ? 'bg-amber-50 text-amber-700 border border-amber-100 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* CRACHÁ DO USUÁRIO LOGADO */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
             <div className="flex items-center gap-3 mb-4 px-2">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${roleColors[currentUser.role] || 'bg-slate-200 text-slate-700'}`}>
                     {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                 </div>
                 <div className="overflow-hidden">
                     <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
                     <p className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 truncate ${roleColors[currentUser.role] ? roleColors[currentUser.role].split(' ')[0] : 'text-slate-500'}`}>
                         {roleIcon[currentUser.role]} {currentUser.role}
                     </p>
                 </div>
             </div>

             <button 
               onClick={handleLogout} 
               className="flex items-center justify-center gap-2 px-3 py-2 w-full text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-colors font-bold text-sm"
             >
                <LogOut className="h-4 w-4" /> Sair do Sistema
             </button>
          </div>

      </aside>

      {/* Área Principal */}
      <main className="flex-1 overflow-y-auto h-full w-full">
        <div className="p-8 max-w-7xl mx-auto">
           <Outlet />
        </div>
      </main>

    </div>
  )
}