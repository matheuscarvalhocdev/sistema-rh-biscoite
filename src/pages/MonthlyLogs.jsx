import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "../api/base44Client";
import { 
  FileText, Calendar, Clock, AlertCircle, CheckCircle, Search, Filter, Loader2, Download
} from "lucide-react";
import { ProtectedPage } from "../components/shared/AccessControl";

export default function MonthlyLogs() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // Ex: "2024-12"
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Busca Funcionários
  const { data: employees = [], isLoading: isLoadingEmps } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  // 2. GERAÇÃO DOS DADOS DE PONTO (OTIMIZADA)
  // O useMemo guarda o resultado e só recalcula se o mês ou a lista de funcionários mudar
  const logsData = useMemo(() => {
    if (!employees.length) return [];

    console.log("Calculando registros de ponto..."); // Para você ver no console quando ele trabalha
    const [year, month] = selectedMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Gera dados simulados para cada funcionário
    return employees.map(emp => {
      let totalExtras = 0;
      let totalDelays = 0;
      let presentDays = 0;

      // Simula os dias do mês
      const days = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        // Simulação simples: Finais de semana folga, dias de semana trabalha
        const dateObj = new Date(year, month - 1, day);
        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
        
        if (isWeekend) return null; // Ignora fds no calculo rapido

        // Aleatoriedade controlada para parecer real
        const rand = (emp.id + day) % 10; 
        let status = "Presente";
        
        if (rand === 0) { status = "Atraso"; totalDelays += 15; } // 15 min atraso
        else if (rand === 1) { status = "Falta"; }
        else if (rand === 2) { status = "Hora Extra"; totalExtras += 45; } // 45 min extra
        else { presentDays++; }

        return { day, status };
      }).filter(Boolean); // Remove os nulos

      return {
        ...emp,
        stats: {
          presentDays,
          totalExtras, // em minutos
          totalDelays, // em minutos
          workingDays: days.length
        }
      };
    });
  }, [employees, selectedMonth]); // <--- Dependências do Cache

  // Filtro de Busca (Visual)
  const filteredLogs = logsData.filter(log => 
    log.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formata minutos em 00h00
  const formatTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m < 10 ? '0'+m : m}m`;
  };

  if (isLoadingEmps) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Registros de Ponto</h1>
            <p className="text-slate-500">Espelho de ponto mensal e banco de horas.</p>
          </div>
          
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 px-3 shadow-sm">
               <Calendar className="w-4 h-4 text-slate-500" />
               <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="outline-none text-slate-700 bg-transparent cursor-pointer font-medium"
               />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium">
               <Download className="w-4 h-4" /> Exportar
            </button>
          </div>
        </div>

        {/* BUSCA */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Filtrar funcionário..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* LISTA DE CARDS (Mais rápido de renderizar que tabelas complexas) */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredLogs.map((log) => (
            <div key={log.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
               
               {/* Cabeçalho do Card */}
               <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                        {log.name.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">{log.name}</h3>
                        <p className="text-xs text-slate-500">{log.role}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold border border-blue-100">
                    {log.unit?.name || "Matriz"}
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3"/> Banco de Horas
                    </p>
                    <p className={`text-lg font-bold ${log.stats.totalExtras >= log.stats.totalDelays ? 'text-emerald-600' : 'text-red-600'}`}>
                        {log.stats.totalExtras >= log.stats.totalDelays ? '+' : '-'}
                        {formatTime(Math.abs(log.stats.totalExtras - log.stats.totalDelays))}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                     <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3"/> Presença
                     </p>
                     <p className="text-lg font-bold text-slate-700">
                        {log.stats.presentDays}/{log.stats.workingDays} <span className="text-xs font-normal text-slate-400">dias</span>
                     </p>
                  </div>
               </div>

               {/* Barra de Progresso Visual */}
               <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                     <span>Assiduidade</span>
                     <span>{Math.round((log.stats.presentDays / log.stats.workingDays) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                     <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(log.stats.presentDays / log.stats.workingDays) * 100}%` }}
                     ></div>
                  </div>
               </div>

            </div>
          ))}
        </div>

      </div>
    </ProtectedPage>
  );
}