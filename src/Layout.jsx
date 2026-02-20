import logoBiscoite from './assets/logo-biscoite.svg';
import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  Upload, 
  Building2, 
  FileText, 
  AlertTriangle, 
  History, 
  Settings, 
  UserCog, 
  LogOut, 
  Menu,
  X,
  DollarSign, // 👈 1. Importamos o ícone de dinheiro
  Target 
} from 'lucide-react'

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 👇 LISTA DE LINKS DO MENU
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employees', label: 'Funcionários', icon: Users },
    { path: '/import-employees', label: 'Importar', icon: Upload },
    { path: '/units', label: 'Unidades', icon: Building2 },

    { path: '/vagas', label: 'Vagas Abertas', icon: Target },
    
    // 👇 2. ADICIONADO O NOVO LINK AQUI:
    { path: '/payroll', label: 'Folha & Custos', icon: DollarSign }, 

    { path: '/monthly-logs', label: 'Registros', icon: FileText },
    { path: '/occurrences', label: 'Ocorrências', icon: AlertTriangle },
    { path: '/history', label: 'Histórico', icon: History },
    { path: '/users', label: 'Usuários', icon: UserCog },
    { path: '/settings', label: 'Configurações', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem("rh_token");
    localStorage.removeItem("rh_user");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50">
      
      {/* Menu Mobile (Botão Hambúrguer) */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white rounded-md shadow-md text-slate-700"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar / Menu Lateral */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          
          {/* Logo */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-center">
                  <img src={logoBiscoite} alt="Biscoitê" className="h-16 w-auto" />
          </div>

          {/* Links do Menu */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)} // Fecha menu mobile ao clicar
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm
                    ${isActive 
                      ? 'bg-amber-50 text-amber-700 border border-amber-100 shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Botão Sair */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
             <button 
               onClick={handleLogout} 
               className="flex items-center gap-3 px-3 py-2 w-full text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors font-medium text-sm"
             >
                <LogOut className="h-5 w-5" />
                <span>Sair do Sistema</span>
             </button>
          </div>

        </div>
      </aside>

      {/* Área Principal (Conteúdo) */}
      <main className="flex-1 overflow-y-auto h-full w-full">
        <div className="p-8 max-w-7xl mx-auto">
           <Outlet />
        </div>
      </main>

    </div>
  )
}