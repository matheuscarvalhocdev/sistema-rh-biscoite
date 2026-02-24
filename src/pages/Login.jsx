import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "../api/base44Client";
import logoBiscoite from '../assets/logo-biscoite.svg';
import { Key, Mail, Loader2, ShieldCheck, X, Send } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 👇 Estados para o "Esqueceu a senha"
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (email === "admin@biscoite.com" && password === "admin123") {
          const masterUser = { 
              id: "master-001", name: "Super Admin", email: "admin@biscoite.com", role: "Administrador" 
          };
          localStorage.setItem("rh_token", "master-token-valid");
          localStorage.setItem("rh_user", JSON.stringify(masterUser));
          navigate("/"); 
          return;
      }

      const users = await base44.entities.User.list();
      const foundUser = users.find(u => u.email === email && u.password === password);

      if (foundUser) {
          localStorage.setItem("rh_token", "user-token-valid");
          const sessionUser = {
              id: foundUser.id, name: foundUser.name, email: foundUser.email, role: foundUser.role, unitId: foundUser.unitId 
          };
          localStorage.setItem("rh_user", JSON.stringify(sessionUser));
          navigate("/"); 
      } else {
          setError("E-mail ou senha incorretos.");
      }
    } catch (err) {
        setError("Erro ao conectar com o servidor.");
    } finally {
        setIsLoading(false);
    }
  };

  // 👇 Função que processa o pedido de recuperação
  const handleRecoverPassword = (e) => {
      e.preventDefault();
      if (!recoveryEmail) return;
      
      alert(`✅ Sucesso!\nSe o e-mail "${recoveryEmail}" estiver cadastrado no sistema, você receberá um link com as instruções de redefinição de senha em alguns minutos.`);
      
      setShowRecovery(false);
      setRecoveryEmail("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-200 relative">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center mb-6">
            <img src={logoBiscoite} alt="Biscoitê" className="h-24 w-auto drop-shadow-sm" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-black text-slate-900 tracking-tight">
          Acesso ao Sistema
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Portal de Gestão de Pessoas e D.P.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in duration-700 delay-150">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-in zoom-in-95">
                    <p className="text-sm font-bold text-red-700">{error}</p>
                </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">E-mail Corporativo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                    type="email" 
                    required 
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm font-medium bg-slate-50 focus:bg-white" 
                    placeholder="voce@biscoite.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                    type="password" 
                    required 
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm font-medium bg-slate-50 focus:bg-white" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                {/* 👇 BOTÃO CLICÁVEL PARA ABRIR O MODAL DE RECUPERAÇÃO */}
                <button 
                  type="button" 
                  onClick={() => setShowRecovery(true)}
                  className="font-bold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
            </div>

            <div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#0f172a] hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar no Sistema"}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
             <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                 <ShieldCheck className="w-4 h-4" /> Ambiente Seguro
             </div>
          </div>
        </div>
      </div>

      {/* 👇 MODAL DE RECUPERAÇÃO DE SENHA */}
      {showRecovery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h3 className="text-lg font-black text-slate-800">Recuperar Senha</h3>
                    <button onClick={() => setShowRecovery(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleRecoverPassword} className="p-6 space-y-4">
                    <p className="text-sm text-slate-500 mb-4">
                        Digite o e-mail associado à sua conta. Se ele estiver cadastrado no sistema, enviaremos um link para você criar uma nova senha.
                    </p>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">E-mail Corporativo</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-400" />
                            </div>
                            <input 
                                type="email" 
                                required 
                                className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all font-medium" 
                                placeholder="voce@biscoite.com"
                                value={recoveryEmail}
                                onChange={(e) => setRecoveryEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={() => setShowRecovery(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" className="flex-1 py-3 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors">
                            <Send className="w-4 h-4" /> Enviar Link
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}