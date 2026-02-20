import logoBiscoite from '../assets/logo-biscoite.svg'; // <--- ADICIONE ISSO
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "../api/base44Client";
import { Loader2, Lock, Mail, ChevronRight } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simula um pequeno tempo de processamento para parecer real
      await new Promise(resolve => setTimeout(resolve, 800));

      // 1. Busca os usuários no banco
      const users = await base44.entities.User.list();
      
      // 2. Procura se o e-mail digitado existe
      const user = users.find(u => 
        u.email.toLowerCase() === formData.email.toLowerCase()
      );

      // 3. Verifica se achou e se o status é Ativo
      // (Futuramente, aqui você verificaria a senha criptografada também)
      if (user && user.status === 'Ativo') {
        
        // SUCESSO: Salva os dados da sessão
        localStorage.setItem("rh_token", "sessao-valida-token-xyz");
        localStorage.setItem("rh_user", JSON.stringify(user));
        
        // Redireciona para o Dashboard
        navigate("/"); 
      } else {
        alert("Acesso Negado: E-mail não encontrado ou usuário inativo.");
      }

    } catch (error) {
      console.error(error);
      alert("Erro ao tentar conectar ao sistema.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-100">
        
        {/* Cabeçalho */}
        <div className="flex flex-col items-center mb-8">
                <img src={logoBiscoite} alt="Biscoitê" className="h-20 w-auto mb-4" />
                <p className="text-slate-500 text-sm">Portal do Colaborador</p>
        </div>

        {/* Formulário Seguro */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Corporativo</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input 
                type="email" 
                required
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-700"
                placeholder="nome@biscoite.com.br"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Senha</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input 
                type="password" 
                required
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-700"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all active:scale-95 flex justify-center items-center gap-2 mt-6"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                <>Entrar <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t pt-4">
            <p className="text-xs text-slate-400">
              Esqueceu a senha? Contate o Admin do Sistema.
            </p>
        </div>
      </div>
    </div>
  );
}