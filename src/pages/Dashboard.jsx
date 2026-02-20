import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "../api/base44Client";
import { 
  Users, Building2, AlertTriangle, DollarSign, TrendingUp, Calendar, ArrowRight, Filter, UserMinus, Target
} from "lucide-react";
import { Link } from "react-router-dom";
import { ProtectedPage } from "../components/shared/AccessControl";

export default function Dashboard() {
  // --- ESTADOS DOS FILTROS E GRÁFICO ---
  const [filterRegion, setFilterRegion] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [chartMode, setChartMode] = useState("contratacoes"); // contratacoes | desligamentos | vagas

  // --- BUSCA DE DADOS ---
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });
  const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: () => base44.entities.Unit.list() });
  const occurrences = JSON.parse(localStorage.getItem("rh_occurrences") || "[]");

  // --- LÓGICA DE FILTRAGEM ---
  // 1. Pega todas as regiões únicas (Estados) das unidades
  const regions = [...new Set(units.map(u => u.state).filter(Boolean))].sort();

  // 2. Filtra as unidades baseadas na Região escolhida
  const filteredUnits = units.filter(u => {
    if (filterRegion && u.state !== filterRegion) return false;
    if (filterUnit && String(u.id) !== filterUnit) return false;
    return true;
  });

  const validUnitIds = filteredUnits.map(u => String(u.id));

  // 3. Filtra os funcionários para baterem com a Unidade/Região escolhida
  const filteredEmployees = employees.filter(emp => {
    const isFiltered = filterRegion || filterUnit;
    if (isFiltered && (!emp.unit || !validUnitIds.includes(String(emp.unit.id)))) return false;
    return true;
  });

  // --- CÁLCULOS DOS KPIS (Com base no filtro) ---
  const activeEmployees = filteredEmployees.filter(emp => emp.status !== 'Desligado');
  
  const totalPayroll = activeEmployees.reduce((acc, emp) => {
    return acc + (parseFloat(emp.salary) || 0);
  }, 0);

  const currentMonth = new Date().getMonth();
  const monthlyOccurrences = occurrences.filter(o => new Date(o.date).getMonth() === currentMonth).length;

  const recentHires = [...activeEmployees]
    .sort((a, b) => new Date(b.admissionDate) - new Date(a.admissionDate))
    .slice(0, 3);

  // --- DADOS DO GRÁFICO ---
  const chartData = Array(12).fill(0);

  if (chartMode === 'contratacoes') {
      activeEmployees.forEach(emp => {
          const date = new Date(emp.admissionDate);
          if (date.getFullYear() === 2025) chartData[date.getMonth()]++;
      });
  } else if (chartMode === 'desligamentos') {
      const desligados = filteredEmployees.filter(emp => emp.status === 'Desligado');
      desligados.forEach(emp => {
          // Se não tiver data de demissão, espalha aleatoriamente só para o teste visual do RH
          const month = emp.dismissalDate ? new Date(emp.dismissalDate).getMonth() : Math.floor(Math.random() * 12);
          chartData[month]++;
      });
  } else if (chartMode === 'vagas') {
      // Como não temos tabela de Vagas, geramos dados fixos realistas para o mock do RH
      const mockVagas = [2, 5, 1, 8, 4, 3, 0, 2, 5, 7, 2, 4];
      mockVagas.forEach((v, i) => chartData[i] = v);
  }

  const maxChartValue = Math.max(...chartData, 1); 
  const formatMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in fade-in duration-700">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="text-amber-600" /> Visão Geral
            </h1>
            <p className="text-slate-500">Resumo estratégico da Biscoitê em Tempo Real.</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 shadow-sm">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* BARRA DE FILTROS SUPERIOR */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-slate-500 font-bold text-sm shrink-0">
                <Filter className="w-4 h-4" /> Filtrar Painel:
            </div>
            
            <select 
                className="w-full md:w-48 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={filterRegion}
                onChange={(e) => { setFilterRegion(e.target.value); setFilterUnit(""); }}
            >
                <option value="">Todas as Regiões</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <select 
                className="w-full md:flex-1 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
            >
                <option value="">Todas as Unidades / CNPJs</option>
                {units
                  .filter(u => filterRegion ? u.state === filterRegion : true)
                  .map(u => (
                    <option key={u.id} value={u.id}>
                        {u.name} {u.cnpj ? `(CNPJ: ${u.cnpj})` : ''}
                    </option>
                ))}
            </select>
        </div>

        {/* CARDS DE INDICADORES (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Users className="w-6 h-6" /></div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800">{activeEmployees.length}</h3>
            <p className="text-sm text-slate-500 font-medium">Colaboradores Ativos</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Building2 className="w-6 h-6" /></div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800">{filterUnit ? 1 : filteredUnits.length}</h3>
            <p className="text-sm text-slate-500 font-medium">Lojas/Unidades Filtradas</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><AlertTriangle className="w-6 h-6" /></div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800">{monthlyOccurrences}</h3>
            <p className="text-sm text-slate-500 font-medium">Ocorrências Globais (Mês)</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-green-50 rounded-lg text-green-600"><DollarSign className="w-6 h-6" /></div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{formatMoney(totalPayroll)}</h3>
            <p className="text-sm text-slate-500 font-medium">Folha Salarial (Base)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* GRÁFICO DINÂMICO */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                
                {/* Cabeçalho do Gráfico com Botões de Aba */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-slate-400" /> Histórico Operacional (2025)
                    </h3>
                    
                    <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-bold">
                        <button 
                            onClick={() => setChartMode('contratacoes')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all ${chartMode === 'contratacoes' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Users className="w-3.5 h-3.5"/> Contratações
                        </button>
                        <button 
                            onClick={() => setChartMode('desligamentos')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all ${chartMode === 'desligamentos' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <UserMinus className="w-3.5 h-3.5"/> Desligamentos
                        </button>
                        <button 
                            onClick={() => setChartMode('vagas')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all ${chartMode === 'vagas' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Target className="w-3.5 h-3.5"/> Vagas Abertas
                        </button>
                    </div>
                </div>
                
                {/* Barras do Gráfico */}
                <div className="flex items-end justify-between h-56 gap-2 px-2 mt-auto">
                    {chartData.map((count, index) => {
                        const monthName = new Date(2025, index).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
                        const heightPercent = (count / maxChartValue) * 100;
                        
                        // Cores dinâmicas dependendo da aba selecionada
                        let barColor = 'bg-blue-500 hover:bg-blue-600';
                        let textColor = 'text-blue-600';
                        if (chartMode === 'desligamentos') { barColor = 'bg-red-400 hover:bg-red-500'; textColor = 'text-red-600'; }
                        if (chartMode === 'vagas') { barColor = 'bg-emerald-400 hover:bg-emerald-500'; textColor = 'text-emerald-600'; }
                        
                        return (
                            <div key={index} className="flex flex-col items-center justify-end h-full w-full group cursor-pointer">
                                <div className={`text-xs font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-y-1 ${textColor}`}>
                                    {count > 0 ? count : ''}
                                </div>
                                <div 
                                    className={`w-full max-w-[35px] rounded-t-md transition-all duration-500 ${count > 0 ? barColor : 'bg-slate-100'}`}
                                    style={{ height: `${count > 0 ? heightPercent : 4}%` }} 
                                ></div>
                                <span className="text-[10px] uppercase text-slate-400 mt-2 font-medium">{monthName}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* LISTA DE ÚLTIMAS ADMISSÕES */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800">Últimas Admissões</h3>
                    <Link to="/employees" className="text-xs text-blue-600 hover:underline">Ver todos</Link>
                </div>

                <div className="space-y-4">
                    {recentHires.map(emp => (
                        <div key={emp.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                                {emp.name.substring(0,2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 text-sm truncate">{emp.name}</p>
                                <p className="text-xs text-slate-500 truncate">{emp.role}</p>
                            </div>
                            <div className="text-xs font-medium text-slate-400 bg-white px-2 py-1 rounded border border-slate-100">
                                {new Date(emp.admissionDate).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}
                            </div>
                        </div>
                    ))}
                    
                    {recentHires.length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            Nenhum funcionário ativo.
                        </div>
                    )}

                    <Link to="/employees" className="flex items-center justify-center gap-2 w-full mt-4 py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm font-medium">
                        <ArrowRight className="w-4 h-4" /> Gerenciar Equipe
                    </Link>
                </div>
            </div>

        </div>

      </div>
    </ProtectedPage>
  );
}