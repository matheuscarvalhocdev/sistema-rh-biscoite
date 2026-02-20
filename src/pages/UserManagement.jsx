import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "../api/base44Client";
import { 
  Users, Plus, Search, Trash2, Shield, Mail, Lock, ShieldCheck, Eye, XCircle, CheckCircle2 
} from "lucide-react";
import { ProtectedPage } from "../components/shared/AccessControl";

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Para saber quem está logado e evitar auto-exclusão

  // Formulário
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "CONSULTA" // Valor padrão seguro
  });

  // Busca Usuários
  const { data: users = [], refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const list = await base44.entities.User.list();
      // Pega o usuário logado para evitar que ele se exclua
      const logged = JSON.parse(localStorage.getItem("rh_user"));
      if (logged) setCurrentUser(logged);
      return list;
    },
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (formData.password.length < 4) {
        alert("A senha precisa ter pelo menos 4 caracteres.");
        return;
      }

      await base44.entities.User.create(formData);
      alert(`✅ Usuário ${formData.email} criado com sucesso!`);
      
      setIsModalOpen(false);
      setFormData({ name: "", email: "", password: "", role: "CONSULTA" }); // Limpa
      refetch(); // Atualiza lista
    } catch (error) {
      alert("Erro ao criar usuário: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (currentUser && currentUser.id === id) {
      alert("🚫 Você não pode excluir seu próprio usuário!");
      return;
    }

    if (window.confirm("Tem certeza? Esse usuário perderá o acesso imediatamente.")) {
      await base44.entities.User.delete(id);
      refetch();
    }
  };

  // Badge de Cargo Bonita
  const RoleBadge = ({ role }) => {
    const configs = {
      ADMIN_SISTEMA: { color: "bg-purple-100 text-purple-700 border-purple-200", icon: ShieldCheck, label: "Super Admin" },
      ADMIN_RH: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Users, label: "Gestor RH" },
      LIDER_UNIDADE: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Shield, label: "Líder Unidade" },
      CONSULTA: { color: "bg-slate-100 text-slate-600 border-slate-200", icon: Eye, label: "Visualizador" },
    };
    const config = configs[role] || configs.CONSULTA;
    const Icon = config.icon;

    return (
      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${config.color}`}>
        <Icon className="w-3 h-3" /> {config.label}
      </span>
    );
  };

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Controle de Acesso</h1>
            <p className="text-slate-500">Gerencie quem pode acessar o sistema e suas permissões.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Novo Usuário
          </button>
        </div>

        {/* LISTA DE USUÁRIOS */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <div key={user.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-slate-300 transition-all group relative">
              
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-500">
                  {user.name.substring(0,2).toUpperCase()}
                </div>
                <RoleBadge role={user.role} />
              </div>

              <h3 className="font-bold text-slate-800 text-lg">{user.name}</h3>
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                <Mail className="w-3 h-3" /> {user.email}
              </div>

              <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                 <span className="text-xs font-mono text-slate-400">ID: {user.id}</span>
                 
                 <div className="flex gap-2">
                    <span className="text-xs flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">
                        <CheckCircle2 className="w-3 h-3" /> Ativo
                    </span>
                    {/* Botão Excluir (Só aparece se não for o próprio usuário) */}
                    {currentUser?.id !== user.id && (
                        <button 
                            onClick={() => handleDelete(user.id)}
                            className="text-slate-300 hover:text-red-600 transition-colors p-1"
                            title="Remover acesso"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                 </div>
              </div>

            </div>
          ))}
        </div>

        {/* MODAL DE CRIAÇÃO */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800">Criar Acesso</h3>
                <button onClick={() => setIsModalOpen(false)}><XCircle className="w-6 h-6 text-slate-400 hover:text-red-500 transition-colors"/></button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Usuário</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input 
                      required 
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-500" 
                      placeholder="Ex: Ana Silva"
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-mail de Login</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input 
                      type="email" required 
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-500" 
                      placeholder="ana@rh.com"
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Senha Inicial</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input 
                      type="password" required 
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-500" 
                      placeholder="••••••"
                      value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nível de Permissão</label>
                  <select 
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-500 bg-white"
                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="CONSULTA">👀 Visualizador (Apenas vê dados)</option>
                    <option value="ADMIN_RH">💼 Gestor de RH (Edita funcionários)</option>
                    <option value="ADMIN_SISTEMA">👑 Super Admin (Acesso total)</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-all mt-4"
                >
                  Criar Acesso
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </ProtectedPage>
  );
}