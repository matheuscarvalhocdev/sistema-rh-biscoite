import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom"; // 👈 IMPORTAMOS O NAVEGADOR AQUI
import { base44 } from "../api/base44Client";
import { 
  Users, Building2, AlertTriangle, DollarSign, Calendar, Filter, Briefcase, UserMinus
} from "lucide-react";
import { ProtectedPage } from "../components/shared/AccessControl";

export default function Dashboard() {
  const [selectedUnit, setSelectedUnit] = useState("");
  const [activeChart, setActiveChart] = useState("contratacoes");
  const navigate = useNavigate(); // 👈 INICIAMOS O NAVEGADOR AQUI

  // Buscando todos os dados em tempo real
  const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: () => base44.entities.Unit.list() });
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });
  const { data: occurrences = [] } = useQuery({ 
      queryKey: ['occurrences'], 
      queryFn: async () => base44.entities.Occurrence ? await base44.entities.Occurrence.list() : [] 
  });

  // Filtros e Regras de Negócio
  const activeUnits = units.filter(u => !u.status?.includes('Inativa'));
  
  const filteredEmployees = employees.filter(emp => {
      if (emp.status === 'Desligado') return false;
      if (selectedUnit && String(emp.unit?.id) !== String(selectedUnit)) return false;
      return true;
  });

  // Cálculos dos Cards
  const totalEmployees = filteredEmployees.length;
  const displayUnits = selectedUnit ? 1 : activeUnits.length;
  const totalOccurrences = occurrences.length; 
  const totalSalary = filteredEmployees.reduce((acc, emp) => acc + (parseFloat(emp.salary) || 0), 0);

  const formatMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const todayFormatted = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  // Puxa as admissões recentes
  const recentHires = [...filteredEmployees].reverse().slice(0, 4);

  // Dados simulados para o gráfico
  const chartData = {
      contratacoes: [40, 60, 45, 80, 50, 90, 100, 65, 85, 40, 70, 95],
      desligamentos: [15, 25, 10, 30, 20, 15, 40, 10, 25, 15, 20, 35],
      vagas: [5, 10, 8, 15, 12, 20, 18, 10, 14, 8, 12, 16]
  };

  // Configurações visuais do gráfico
  const currentChart = chartData[activeChart];
  const chartColor = activeChart === 'contratacoes' ? 'bg-blue-500' : activeChart === 'desligamentos' ? 'bg-red-500' : 'bg-orange-500';
  const chartHover = activeChart === 'contratacoes' ? 'group-hover:bg-blue-600' : activeChart === 'desligamentos' ? 'group-hover:bg-red-600' : 'group-hover:bg-orange-600';
  const chartLabel = activeChart === 'contratacoes' ? 'Admissões' : activeChart === 'desligamentos' ? 'Desligamentos' : 'Vagas';

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* CABEÇALHO COM DATA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingIcon className="w-8 h-8 text-orange-500" /> Visão Geral
            </h1>
            <p className="text-slate-500 mt-1">Resumo estratégico da Biscoitê em Tempo Real.</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg shadow-sm">
             <Calendar className="w-4 h-4" />
             <span className="text-sm font-medium capitalize">{todayFormatted}</span>
          </div>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 text-slate-500 font-bold text-sm md:border-r border-slate-200 md:pr-4">
                <Filter className="w-4 h-4" /> Filtrar Painel:
            </div>
            
            <select className="w-full md:w-64 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 text-sm">
                <option value="">Todas as Regiões</option>
                <option value="SP">São Paulo (SP)</option>
            </select>

            <select 
                className="w-full md:flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 text-sm"
                value={selectedUnit} 
                onChange={e => setSelectedUnit(e.target.value)}
            >
                <option value="">Todas as Unidades / CNPJs</option>
                {activeUnits.map(u => (
                    <option key={u.id} value={u.id}>{u.name} {u.cnpj ? `(${u.cnpj})` : ''}</option>
                ))}
            </select>
        </div>

        {/* 4 CARDS PRINCIPAIS */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                    <Users className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-black text-slate-800">{totalEmployees}</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Colaboradores Ativos</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4 text-emerald-600">
                    <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-black text-slate-800">{displayUnits}</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Lojas/Unidades Filtradas</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-4 text-orange-600">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-black text-slate-800">{totalOccurrences}</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Ocorrências Globais (Mês)</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4 text-emerald-600">
                    <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">{formatMoney(totalSalary)}</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Folha Salarial (Líquida)</p>
            </div>
        </div>

        {/* ÁREA INFERIOR: GRÁFICO E ADMISSÕES */}
        <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Bloco Esquerdo: Histórico Operacional */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-slate-400" /> Histórico Operacional ({new Date().getFullYear()})
                    </h3>
                    
                    <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                        <button 
                            onClick={() => setActiveChart('contratacoes')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeChart === 'contratacoes' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Users className="w-3.5 h-3.5" /> Contratações
                        </button>
                        <button 
                            onClick={() => setActiveChart('desligamentos')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeChart === 'desligamentos' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <UserMinus className="w-3.5 h-3.5" /> Desligamentos
                        </button>
                        <button 
                            onClick={() => setActiveChart('vagas')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeChart === 'vagas' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Briefcase className="w-3.5 h-3.5" /> Vagas Abertas
                        </button>
                    </div>
                </div>

                <div className="h-64 flex items-end gap-2 md:gap-4 pt-4 border-b border-slate-100">
                    {currentChart.map((height, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center group h-full">
                            <div className="w-full relative flex items-end justify-center h-full rounded-t-sm hover:bg-slate-50 transition-colors">
                                <div 
                                    className={`w-full md:w-3/4 ${chartColor} ${chartHover} rounded-t-sm transition-all duration-500`} 
                                    style={{ height: `${height}%` }}
                                ></div>
                                <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                                    {height} {chartLabel}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase">
                    <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span>
                    <span>Jul</span><span>Ago</span><span>Set</span><span>Out</span><span>Nov</span><span>Dez</span>
                </div>
            </div>

            {/* Bloco Direito: Últimas Admissões */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Últimas Admissões</h3>
                    {/* 👇 BOTÃO "VER TODOS" COM NAVEGAÇÃO */}
                    <button 
                        onClick={() => navigate('/employees')} 
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        Ver todos
                    </button>
                </div>

                <div className="space-y-1 flex-1 overflow-y-auto">
                    {recentHires.map((emp, idx) => (
                        // 👇 FUNCIONÁRIO COM NAVEGAÇÃO E EFEITO HOVER (Mãozinha + Cor de fundo)
                        <div 
                            key={idx} 
                            onClick={() => navigate('/employees')}
                            className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-all"
                            title={`Ir para o perfil de ${emp.name}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">
                                {emp.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{emp.name}</p>
                                <p className="text-xs text-slate-500 uppercase flex items-center gap-1 mt-0.5">
                                    {emp.role} {emp.unit?.name ? `• ${emp.unit.name.substring(0, 10)}...` : ''}
                                </p>
                            </div>
                            <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 shrink-0">
                                Novo
                            </div>
                        </div>
                    ))}
                    
                    {recentHires.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 py-10">
                            <Users className="w-8 h-8 mb-2" />
                            <p className="text-sm font-medium">Nenhuma admissão recente</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
      </div>
    </ProtectedPage>
  );
}

function TrendingIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
      <polyline points="16 7 22 7 22 13"></polyline>
    </svg>
  );
}