import { useState, useEffect } from "react";
import { ProtectedPage } from "../components/shared/AccessControl";
import { 
  History as HistoryIcon, UserPlus, Trash2, Edit, FileText, CheckCircle2, Clock, ShieldAlert, Ban, Zap
} from "lucide-react";

export default function History() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("TODOS");

  // Função para carregar logs
  const loadLogs = () => {
    const savedLogs = localStorage.getItem("rh_system_logs");
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Erro ao ler logs", e);
      }
    }
  };

  // Carrega ao iniciar
  useEffect(() => {
    loadLogs();
  }, []);

  // --- FUNÇÃO DE TESTE (Para destravar a tela) ---
  const createTestLog = () => {
    const newLog = {
      id: Date.now(),
      user: "Você (Teste)",
      action: "UPDATE",
      entity: "TESTE",
      detail: "Verificação manual do sistema de histórico",
      time: new Date().toISOString()
    };
    
    // Salva no banco e atualiza a tela
    const currentLogs = JSON.parse(localStorage.getItem("rh_system_logs") || "[]");
    const updatedLogs = [newLog, ...currentLogs];
    localStorage.setItem("rh_system_logs", JSON.stringify(updatedLogs));
    setLogs(updatedLogs);
  };

  const getLogConfig = (action) => {
    switch (action) {
      case 'CREATE': return { icon: UserPlus, color: "text-blue-600 bg-blue-100", label: "Criação" };
      case 'UPDATE': return { icon: Edit, color: "text-amber-600 bg-amber-100", label: "Edição" };
      case 'DELETE': return { icon: Trash2, color: "text-red-600 bg-red-100", label: "Remoção" };
      case 'SECURITY': return { icon: ShieldAlert, color: "text-purple-600 bg-purple-100", label: "Segurança" };
      default: return { icon: FileText, color: "text-slate-600 bg-slate-100", label: "Registro" };
    }
  };

  const filteredLogs = filter === "TODOS" 
    ? logs 
    : logs.filter(log => log.action === filter);

  const formatLogDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
  };

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <HistoryIcon className="w-8 h-8 text-slate-700" />
              Auditoria do Sistema
            </h1>
            <p className="text-slate-500">Rastreabilidade completa de ações.</p>
          </div>
          
          <div className="flex gap-2">
            {/* BOTÃO DE TESTE AQUI 👇 */}
            <button 
                onClick={createTestLog}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-medium transition-colors"
            >
                <Zap className="w-4 h-4" /> Testar
            </button>

            <select 
              className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg p-2.5 outline-none cursor-pointer"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="TODOS">Todos</option>
              <option value="CREATE">Criações</option>
              <option value="UPDATE">Edições</option>
              <option value="DELETE">Remoções</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative min-h-[400px]">
          
          {logs.length > 0 && (
             <div className="absolute left-9 top-10 bottom-10 w-0.5 bg-slate-100 z-0"></div>
          )}

          <div className="space-y-8 relative z-10">
            {filteredLogs.map((log) => {
              const config = getLogConfig(log.action);
              const Icon = config.icon;
              
              return (
                <div key={log.id} className="flex items-start gap-4 group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm z-10 ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-slate-800 text-sm">
                        {log.user} <span className="font-normal text-slate-500">realizou {config.label.toLowerCase()}:</span>
                      </h3>
                      <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatLogDate(log.time)}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium text-base">{log.detail}</p>
                    <div className="mt-2"><span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">{log.entity}</span></div>
                  </div>
                </div>
              );
            })}

            {filteredLogs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <div className="bg-slate-50 p-4 rounded-full mb-3">
                        <Ban className="w-8 h-8 opacity-50" />
                    </div>
                    <p>Histórico vazio.</p>
                    <p className="text-xs mt-1">Clique em "Testar" lá em cima para verificar.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}