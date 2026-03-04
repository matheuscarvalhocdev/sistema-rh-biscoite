import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "../api/base44Client";
import logoBiscoite from '../assets/logo-biscoite.svg';
import { Key, Mail, Loader2, ShieldCheck, X, Send } from "lucide-react";
import CryptoJS from 'crypto-js';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Estados para o "Esqueceu a senha"
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [isRecovering, setIsRecovering] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // A conta Master continua chumbada e imune
      if (email === "admin@biscoite.com" && password === "admin123") {
          const masterUser = { 
              id: "master-001", name: "Super Admin", email: "admin@biscoite.com", role: "Administrador" 
          };
          sessionStorage.setItem("rh_token", "master-token-valid");
          sessionStorage.setItem("rh_user", JSON.stringify(masterUser));
          navigate("/"); 
          return;
      }

      // 👇 1. CRIPTOGRAFA A SENHA DIGITADA NA HORA DO LOGIN
      const hashedPassword = CryptoJS.SHA256(password).toString();

      const users = await base44.entities.User.list();
      
      // 👇 2. COMPARA A SENHA CRIPTOGRAFADA COM A DO BANCO
      const foundUser = users.find(u => u.email === email && u.password === hashedPassword);

      if (foundUser) {
          sessionStorage.setItem("rh_token", "user-token-valid");
          const sessionUser = {
              id: foundUser.id, name: foundUser.name, email: foundUser.email, role: foundUser.role, unitId: foundUser.unitId 
          };
          sessionStorage.setItem("rh_user", JSON.stringify(sessionUser));
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

  const handleRecoverPassword = async (e) => {
      e.preventDefault();
      if (!recoveryEmail) return;
      
      setIsRecovering(true);

      try {
          if (recoveryEmail === "admin@biscoite.com") {
              alert("A senha do Super Admin é fixa no código (admin123) e não pode ser alterada por aqui.");
              setIsRecovering(false);
              return;
          }

          const users = await base44.entities.User.list();
          const foundUser = users.find(u => u.email === recoveryEmail);

          if (foundUser) {
              // 1. Gera uma senha provisória legível para o usuário ver
              const temporaryPassword = "biscoite" + Math.floor(100 + Math.random() * 900);
              
              // 👇 2. CRIPTOGRAFA A SENHA PROVISÓRIA ANTES DE SALVAR NO BANCO
              const hashedTempPassword = CryptoJS.SHA256(temporaryPassword).toString();
              
              // 3. Atualiza a senha no banco de dados (escondida)
              await base44.entities.User.update(foundUser.id, { 
                  ...foundUser, 
                  password: hashedTempPassword 
              });

              alert(`🚨 SIMULAÇÃO DE SISTEMA 🚨\n\nNa vida real, um e-mail com um link seria enviado agora para ${recoveryEmail}.\n\nPara fins de homologação/teste, a senha deste usuário foi resetada para:\n\n👉 ${temporaryPassword}`);
          } else {
              alert(`✅ Sucesso!\nSe o e-mail "${recoveryEmail}" estiver cadastrado no sistema, você receberá um link com as instruções.`);
          }

          setShowRecovery(false);
          setRecoveryEmail("");
      } catch (err) {
          alert("Erro ao tentar recuperar a senha.");
      } finally {
          setIsRecovering(false);
      }
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

      {/* MODAL DE RECUPERAÇÃO DE SENHA */}
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
                        <button type="submit" disabled={isRecovering} className="flex-1 py-3 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors disabled:opacity-70">
                            {isRecovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Enviar Link</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}