import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "../api/base44Client";
import { 
  FileText, Calendar as CalendarIcon, Clock, Search, Loader2, Store, Calculator, Save, CheckCircle2, History, Plus, Minus, Trash2, X
} from "lucide-react";
import { ProtectedPage } from "../components/shared/AccessControl";

export default function MonthlyLogs() {
  const queryClient = useQueryClient();
  
  // Controle de Abas Principais
  const [activeScreenTab, setActiveScreenTab] = useState("banco_horas"); // banco_horas | escala

  // Estados Compartilhados
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Busca de Dados GERAIS
  const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: () => base44.entities.Unit.list() });
  const { data: employees = [], isLoading: isLoadingEmps } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });
  
  // =======================================================================
  // LÓGICA: BANCO DE HORAS REAL
  // =======================================================================
  const { data: timebankRecords = [] } = useQuery({ queryKey: ['timebank'], queryFn: () => base44.entities.TimeBank.list() });
  const [selectedEmpForTB, setSelectedEmpForTB] = useState(null);
  const [tbFormData, setTbFormData] = useState({ date: today.toISOString().split('T')[0], time: "", type: "add", reason: "" });

  // Calcula o saldo em minutos para cada funcionário
  const employeesWithTimeBank = employees
    .filter(emp => String(emp.unit?.id) === String(selectedUnit) && emp.status !== 'Desligado')
    .map(emp => {
      const records = timebankRecords.filter(r => r.employeeId === emp.id);
      const balanceMinutes = records.reduce((acc, curr) => curr.type === 'add' ? acc + curr.minutes : acc - curr.minutes, 0);
      return { ...emp, balanceMinutes, records };
    })
    .filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // 👇 A MÁGICA ACONTECE AQUI: O activeEmpTB sempre pega o dado atualizado ao vivo!
  const activeEmpTB = selectedEmpForTB ? employeesWithTimeBank.find(e => e.id === selectedEmpForTB.id) : null;

  const formatBalance = (totalMins) => {
    const sign = totalMins < 0 ? "-" : "+";
    const absMins = Math.abs(totalMins);
    const h = Math.floor(absMins / 60);
    const m = absMins % 60;
    return `${sign} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}h`;
  };

  const handleSaveTimeBank = async (e) => {
    e.preventDefault();
    if(!tbFormData.time || !tbFormData.reason) return alert("Preencha tempo e motivo.");
    
    // Converte HH:MM do input para minutos totais
    const [h, m] = tbFormData.time.split(':').map(Number);
    const totalMins = (h * 60) + m;

    await base44.entities.TimeBank.create({
        employeeId: activeEmpTB.id, // Usa o ID do funcionário ativo
        date: tbFormData.date,
        type: tbFormData.type,
        minutes: totalMins,
        reason: tbFormData.reason
    });
    
    setTbFormData({ date: today.toISOString().split('T')[0], time: "", type: "add", reason: "" });
    queryClient.invalidateQueries(['timebank']); // Atualiza o banco na hora
  };

  const handleDeleteTBRecord = async (id) => {
      if(window.confirm("Apagar este registro?")) {
          await base44.entities.TimeBank.delete(id);
          queryClient.invalidateQueries(['timebank']);
      }
  };

  // =======================================================================
  // LÓGICA: ESCALA E FREQUÊNCIA
  // =======================================================================
  const [activeScaleTab, setActiveScaleTab] = useState("escala_grid"); 
  const [gridData, setGridData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const attendanceId = `${selectedUnit}_${selectedMonth}`;

  useEffect(() => {
    if (selectedUnit && selectedMonth && activeScreenTab === 'escala') {
      base44.entities.Attendance.get(attendanceId).then(savedData => {
        if (savedData && savedData.records) setGridData(savedData.records);
        else setGridData({});
      });
    }
  }, [selectedUnit, selectedMonth, attendanceId, activeScreenTab]);

  const unitEmployeesScale = employees.filter(emp => String(emp.unit?.id) === String(selectedUnit) && emp.status !== 'Desligado');
  const [yearScale, monthScale] = selectedMonth.split('-');
  const daysInMonthScale = new Date(yearScale, monthScale, 0).getDate();
  const daysArrayScale = Array.from({ length: daysInMonthScale }, (_, i) => i + 1);

  const handleCellChange = (empId, day, value) => setGridData(prev => ({ ...prev, [`${empId}_${day}`]: value }));

  const handleSaveScale = async () => {
    setIsSaving(true);
    await base44.entities.Attendance.save({ id: attendanceId, unitId: selectedUnit, month: selectedMonth, records: gridData });
    setIsSaving(false);
    alert("✅ Escala salva com sucesso!");
  };

  const fillEmptyWithWork = () => {
    const newData = { ...gridData };
    unitEmployeesScale.forEach(emp => {
      daysArrayScale.forEach(day => {
        const key = `${emp.id}_${day}`;
        if (!newData[key]) newData[key] = "T";
      });
    });
    setGridData(newData);
  };

  const statusColors = {
    "T": "bg-blue-100 text-blue-700 border-blue-200", 
    "F": "bg-slate-200 text-slate-700 border-slate-300", 
    "FT": "bg-red-100 text-red-700 border-red-300",     
    "AT": "bg-amber-100 text-amber-700 border-amber-300", 
    "FE": "bg-purple-100 text-purple-700 border-purple-300" 
  };


  if (isLoadingEmps) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* CABEÇALHO GERAL */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Ponto Eletrônico</h1>
            <p className="text-slate-500">Gerencie banco de horas, escalas e frequência da equipe.</p>
          </div>
        </div>

        {/* NAVEGAÇÃO PRINCIPAL (ABAS GLOBAIS) */}
        <div className="flex bg-slate-200/50 p-1 rounded-xl w-full md:w-fit">
             <button onClick={() => setActiveScreenTab('banco_horas')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeScreenTab === 'banco_horas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Clock className="w-4 h-4" /> Banco de Horas
             </button>
             <button onClick={() => setActiveScreenTab('escala')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeScreenTab === 'escala' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <FileText className="w-4 h-4" /> Gestão de Escalas
             </button>
        </div>

        {/* FILTROS GLOBAIS (Loja) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Store className="w-3 h-3"/> Selecione a Loja</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
                    <option value="">-- Escolha uma Unidade --</option>
                    {units.filter(u => u.status !== 'Inativa').map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
                </select>
            </div>
            {activeScreenTab === 'escala' && (
                <div className="w-full md:w-64 relative">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><CalendarIcon className="w-3 h-3"/> Mês da Escala</label>
                    <input type="month" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
                </div>
            )}
            {activeScreenTab === 'banco_horas' && (
                <div className="w-full md:w-64 relative">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Search className="w-3 h-3"/> Buscar Colaborador</label>
                    <input type="text" placeholder="Nome..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            )}
        </div>

        {!selectedUnit ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center justify-center">
                <Store className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-bold text-slate-700">Nenhuma loja selecionada</h3>
                <p className="text-slate-500">Selecione uma loja no filtro acima para carregar as informações.</p>
            </div>
        ) : (
            <>
            {/* ========================================================= */}
            {/* TELA 1: BANCO DE HORAS */}
            {/* ========================================================= */}
            {activeScreenTab === 'banco_horas' && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 animate-in fade-in">
                {employeesWithTimeBank.map((emp) => (
                  <div key={emp.id} onClick={() => setSelectedEmpForTB(emp)} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
                     <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">{emp.name.substring(0,2).toUpperCase()}</div>
                          <div><h3 className="font-bold text-slate-800">{emp.name}</h3><p className="text-xs text-slate-500">{emp.role}</p></div>
                        </div>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center group-hover:bg-blue-50/50 transition-colors">
                        <div>
                            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1 font-bold uppercase tracking-wide"><Clock className="w-3 h-3"/> Saldo Atual</p>
                            <p className={`text-2xl font-bold ${emp.balanceMinutes > 0 ? 'text-emerald-600' : emp.balanceMinutes < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                                {formatBalance(emp.balanceMinutes)}
                            </p>
                        </div>
                        <button className="text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            Ver Extrato
                        </button>
                     </div>
                  </div>
                ))}
                {employeesWithTimeBank.length === 0 && <div className="col-span-full py-8 text-center text-slate-400">Nenhum funcionário encontrado nesta loja.</div>}
              </div>
            )}

            {/* MODAL DE EXTRATO DE HORAS */}
            {activeEmpTB && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-6 bg-slate-900 border-b flex justify-between items-start shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-lg">{activeEmpTB.name.substring(0,2).toUpperCase()}</div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{activeEmpTB.name}</h2>
                                    <p className="text-slate-400 text-sm">Extrato do Banco de Horas</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedEmpForTB(null)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex flex-col md:flex-row gap-6">
                            {/* Formulário de Lançamento */}
                            <div className="w-full md:w-1/2">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><History className="w-4 h-4"/> Novo Lançamento</h3>
                                <form onSubmit={handleSaveTimeBank} className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                        <button type="button" onClick={() => setTbFormData({...tbFormData, type: 'add'})} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md font-bold text-sm ${tbFormData.type === 'add' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Plus className="w-3.5 h-3.5"/> Crédito</button>
                                        <button type="button" onClick={() => setTbFormData({...tbFormData, type: 'sub'})} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md font-bold text-sm ${tbFormData.type === 'sub' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Minus className="w-3.5 h-3.5"/> Débito (Folga)</button>
                                    </div>
                                    <div><label className="block text-xs font-bold text-slate-500 mb-1">Data da Ocorrência</label><input type="date" required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={tbFormData.date} onChange={e => setTbFormData({...tbFormData, date: e.target.value})} /></div>
                                    <div><label className="block text-xs font-bold text-slate-500 mb-1">Quantidade de Horas (HH:MM)</label><input type="time" required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={tbFormData.time} onChange={e => setTbFormData({...tbFormData, time: e.target.value})} /></div>
                                    <div><label className="block text-xs font-bold text-slate-500 mb-1">Motivo / Justificativa</label><input type="text" placeholder="Ex: Cobertura de turno..." required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={tbFormData.reason} onChange={e => setTbFormData({...tbFormData, reason: e.target.value})} /></div>
                                    <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg mt-2">Registrar Horas</button>
                                </form>
                            </div>

                            {/* Histórico do Funcionário */}
                            <div className="w-full md:w-1/2 flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-800">Histórico</h3>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-bold text-slate-500">Saldo Final</p>
                                        <p className={`font-black text-xl ${activeEmpTB.balanceMinutes > 0 ? 'text-emerald-600' : activeEmpTB.balanceMinutes < 0 ? 'text-red-600' : 'text-slate-700'}`}>{formatBalance(activeEmpTB.balanceMinutes)}</p>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                    <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[350px]">
                                        {activeEmpTB.records.sort((a,b) => new Date(b.date) - new Date(a.date)).map(rec => (
                                            <div key={rec.id} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between hover:bg-slate-50">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400">{new Date(rec.date).toLocaleDateString('pt-BR')}</p>
                                                    <p className="text-sm font-medium text-slate-700">{rec.reason}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-bold text-sm px-2 py-0.5 rounded ${rec.type === 'add' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                                        {rec.type === 'add' ? '+' : '-'}{formatBalance(rec.minutes).replace('+','').replace('-','').trim()}
                                                    </span>
                                                    <button onClick={() => handleDeleteTBRecord(rec.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            </div>
                                        ))}
                                        {activeEmpTB.records.length === 0 && <p className="text-center text-slate-400 text-sm py-10">Nenhum registro encontrado.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* TELA 2: GESTÃO DE ESCALAS */}
            {/* ========================================================= */}
            {activeScreenTab === 'escala' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-in fade-in">
                    
                    <div className="flex bg-slate-50 border-b border-slate-200 p-2 gap-2 shrink-0 overflow-x-auto">
                        <button onClick={() => setActiveScaleTab('escala_grid')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeScaleTab === 'escala_grid' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}>
                            <FileText className="w-4 h-4" /> Preencher Escala Diária
                        </button>
                        <button onClick={() => setActiveScaleTab('descontos')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeScaleTab === 'descontos' ? 'bg-white text-red-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}>
                            <Calculator className="w-4 h-4" /> Resumo de Descontos (RH)
                        </button>
                    </div>

                    {activeScaleTab === 'escala_grid' && (
                        <div className="p-0">
                            <div className="p-4 bg-white border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                                <div className="flex flex-wrap gap-2 text-xs font-bold">
                                    <span className="px-2 py-1 rounded border bg-blue-50 text-blue-700 border-blue-200">T - Trabalho</span>
                                    <span className="px-2 py-1 rounded border bg-slate-200 text-slate-700 border-slate-300">F - Folga</span>
                                    <span className="px-2 py-1 rounded border bg-red-50 text-red-700 border-red-200">FT - Falta</span>
                                    <span className="px-2 py-1 rounded border bg-amber-50 text-amber-700 border-amber-200">AT - Atestado</span>
                                    <span className="px-2 py-1 rounded border bg-purple-50 text-purple-700 border-purple-200">FE - Férias</span>
                                </div>
                                <div className="flex gap-2 w-full xl:w-auto">
                                    <button onClick={fillEmptyWithWork} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold flex-1 xl:flex-none transition-colors border border-slate-200">
                                        Preencher vazios com "T"
                                    </button>
                                    <button onClick={handleSaveScale} disabled={isSaving} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 flex-1 xl:flex-none shadow-sm transition-colors">
                                        <Save className="w-4 h-4" /> {isSaving ? 'Salvando...' : 'Salvar Escala'}
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto pb-4">
                                <table className="w-full text-left text-sm border-collapse min-w-[1200px]">
                                    <thead>
                                        <tr className="bg-slate-800 text-white">
                                            <th className="p-3 font-semibold min-w-[200px] sticky left-0 z-10 bg-slate-900 border-r border-slate-700">Colaborador</th>
                                            {daysArrayScale.map(day => (
                                                <th key={day} className="p-2 text-center font-medium border-r border-slate-700 w-12">{day}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {unitEmployeesScale.map((emp, index) => (
                                            <tr key={emp.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                                <td className="p-3 border-r border-slate-200 sticky left-0 z-10 font-medium text-slate-800 text-xs truncate max-w-[200px]" style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                                    {emp.name} <span className="block text-[10px] text-slate-400 font-normal">{emp.role}</span>
                                                </td>
                                                {daysArrayScale.map(day => {
                                                    const cellKey = `${emp.id}_${day}`;
                                                    const cellValue = gridData[cellKey] || "";
                                                    const selectColorClass = statusColors[cellValue] || "bg-transparent text-slate-800";

                                                    return (
                                                        <td key={day} className="border-r border-slate-200 border-b p-0 align-middle">
                                                            <select 
                                                                className={`w-full h-10 text-center text-xs font-bold appearance-none cursor-pointer outline-none hover:brightness-95 transition-all ${selectColorClass}`}
                                                                value={cellValue}
                                                                onChange={(e) => handleCellChange(emp.id, day, e.target.value)}
                                                                title={`Dia ${day}`}
                                                            >
                                                                <option value=""></option>
                                                                <option value="T">T</option>
                                                                <option value="F">F</option>
                                                                <option value="FT">FT</option>
                                                                <option value="AT">AT</option>
                                                                <option value="FE">FE</option>
                                                            </select>
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                        {unitEmployeesScale.length === 0 && (
                                            <tr><td colSpan={daysInMonthScale + 1} className="p-8 text-center text-slate-400">Nenhum funcionário ativo nesta loja.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeScaleTab === 'descontos' && (
                        <div className="p-6">
                            <div className="mb-6 flex justify-between items-end">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Cálculo Automático de Descontos</h3>
                                    <p className="text-sm text-slate-500">Baseado nas "Faltas" (FT) registradas na aba de Preenchimento.</p>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-100 text-slate-600">
                                        <tr>
                                            <th className="p-3 font-semibold">Colaborador</th>
                                            <th className="p-3 font-semibold text-center">Faltas no Mês</th>
                                            <th className="p-3 font-semibold text-right">VR / dia</th>
                                            <th className="p-3 font-semibold text-right">VT / dia</th>
                                            <th className="p-3 font-semibold text-right bg-red-50 text-red-700">Total a Descontar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {unitEmployeesScale.map(emp => {
                                            let faltas = 0;
                                            daysArrayScale.forEach(d => { if (gridData[`${emp.id}_${d}`] === 'FT') faltas++; });
                                            
                                            if (faltas === 0) return null; 

                                            const vtDiario = parseFloat(emp.vt) || 0;
                                            const vrDiario = parseFloat(emp.vr) || 0;
                                            const totalDesconto = faltas * (vtDiario + vrDiario);

                                            return (
                                                <tr key={emp.id} className="hover:bg-slate-50">
                                                    <td className="p-3 font-medium text-slate-800">{emp.name}</td>
                                                    <td className="p-3 text-center font-bold text-red-600">{faltas} dias</td>
                                                    <td className="p-3 text-right text-slate-600">R$ {vrDiario.toFixed(2)}</td>
                                                    <td className="p-3 text-right text-slate-600">R$ {vtDiario.toFixed(2)}</td>
                                                    <td className="p-3 text-right font-bold text-red-700 bg-red-50/30">
                                                        - R$ {totalDesconto.toFixed(2)}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        
                                        {unitEmployeesScale.every(emp => {
                                            let f = 0;
                                            daysArrayScale.forEach(d => { if (gridData[`${emp.id}_${d}`] === 'FT') f++; });
                                            return f === 0;
                                        }) && (
                                            <tr><td colSpan="5" className="p-8 text-center text-slate-400 flex flex-col items-center"><CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2"/> Nenhuma falta registrada nesta loja para este mês. Equipe 100%!</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
            </>
        )}
      </div>
    </ProtectedPage>
  );
}