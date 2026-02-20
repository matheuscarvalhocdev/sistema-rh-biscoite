import { useState, useEffect } from "react";
import { base44 } from "../api/base44Client";
import { useToast } from "../components/ui/use-toast";
import { ProtectedPage } from "../components/shared/AccessControl";
import { 
  User, Mail, Shield, Calendar, Bell, Moon, Lock, Save, Loader2 
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Estados do formulário de senha
  const [passData, setPassData] = useState({ current: "", new: "", confirm: "" });

  // Carrega os dados reais do usuário logado
  useEffect(() => {
    const storedUser = localStorage.getItem("rh_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Tradutor de Cargos
  const getRoleLabel = (role) => {
    const roles = {
      ADMIN_SISTEMA: "Administrador do Sistema",
      ADMIN_RH: "Gestor de RH",
      LIDER_UNIDADE: "Líder de Unidade",
      CONSULTA: "Visualizador"
    };
    return roles[role] || role;
  };

  // Função para Trocar Senha (Pessoal)
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) {
      return toast({ title: "Erro", description: "As novas senhas não coincidem.", variant: "destructive" });
    }
    if (passData.new.length < 4) {
      return toast({ title: "Erro", description: "Senha muito curta.", variant: "destructive" });
    }

    setIsLoading(true);
    try {
      // Simula a troca
      await new Promise(r => setTimeout(r, 800));
      await base44.entities.User.update(user.id, { password: passData.new });
      
      toast({ title: "Sucesso!", description: "Sua senha foi atualizada." });
      setPassData({ current: "", new: "", confirm: "" });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível alterar a senha.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <ProtectedPage>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Meu Perfil e Configurações</h1>
          <p className="text-slate-500">Gerencie seus dados pessoais e preferências do sistema.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          
          {/* COLUNA ESQUERDA: CARTÃO DE PERFIL */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
              <div className="w-24 h-24 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-3xl font-bold text-slate-400 mb-4 border-4 border-white shadow-lg">
                {user.name?.substring(0, 2).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
              <p className="text-sm text-slate-500 mb-4">{user.email}</p>
              
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                {getRoleLabel(user.role)}
              </span>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" /> Detalhes
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">ID Usuário:</span>
                  <span className="font-mono text-slate-700">#{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    ● {user.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Membro desde:</span>
                  <span className="text-slate-700">
                    {/* Usa a data de hoje simulada se não tiver data real */}
                    {new Date().toLocaleDateString()} 
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: FORMULÁRIOS */}
          <div className="md:col-span-2 space-y-6">
            
            {/* SEGURANÇA */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6 border-b pb-4">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Segurança da Conta</h3>
                  <p className="text-xs text-slate-500">Atualize sua senha de acesso</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nova Senha</label>
                    <input 
                      type="password" 
                      className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-amber-500"
                      value={passData.new}
                      onChange={e => setPassData({...passData, new: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmar Nova Senha</label>
                    <input 
                      type="password" 
                      className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-amber-500"
                      value={passData.confirm}
                      onChange={e => setPassData({...passData, confirm: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button 
                    type="submit" 
                    disabled={isLoading || !passData.new}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                    Atualizar Senha
                  </button>
                </div>
              </form>
            </div>

            {/* PREFERÊNCIAS (VISUAL) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 opacity-75">
              <div className="flex items-center gap-2 mb-6 border-b pb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Preferências do Sistema</h3>
                  <p className="text-xs text-slate-500">Personalize sua experiência (Em breve)</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">Receber alertas por e-mail</span>
                  </div>
                  <div className="w-10 h-5 bg-green-500 rounded-full relative cursor-pointer">
                    <div className="w-3 h-3 bg-white rounded-full absolute right-1 top-1"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Moon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">Modo Escuro</span>
                  </div>
                  <div className="w-10 h-5 bg-slate-200 rounded-full relative cursor-pointer">
                    <div className="w-3 h-3 bg-white rounded-full absolute left-1 top-1"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}