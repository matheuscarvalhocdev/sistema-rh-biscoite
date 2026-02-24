import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "../api/base44Client";
import { 
  DollarSign, Building2, Search, FileText, AlertCircle, PieChart, Store, Users
} from "lucide-react";
import { ProtectedPage } from "../components/shared/AccessControl";

export default function Payroll() {
  const [selectedUnit, setSelectedUnit] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Buscas no Banco de Dados
  const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: () => base44.entities.Unit.list() });
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });

  // 1. Filtrar apenas funcionários ativos
  const activeEmployees = employees.filter(emp => emp.status !== 'Desligado');

  // 2. Fazer os cálculos reais da folha
  const payrollData = activeEmployees.map(emp => {
      // O salário que vem da contabilidade já é o líquido
      const netSalary = parseFloat(emp.salary) || 0;
      const vrDaily = parseFloat(emp.vr) || 0;
      const vtDaily = parseFloat(emp.vt) || 0;
      
      // Projeção mensal de benefícios (Considerando média de 22 dias úteis)
      const monthlyBenefits = (vrDaily + vtDaily) * 22;
      
      // Custo total final (Salário + Vales)
      const totalCost = netSalary + monthlyBenefits;

      return {
          ...emp,
          netSalary,
          monthlyBenefits,
          totalCost,
          unitName: emp.unit?.name || 'Sem Loja Vinculada'
      };
  });

  // 3. Aplicar Filtros de Busca e Loja na tabela
  const filteredData = payrollData
    .filter(emp => selectedUnit === "" || String(emp.unit?.id) === String(selectedUnit))
    .filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.role.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.totalCost - a.totalCost); 

  // 4. Somatórios Gerais para os Cards do Topo
  const totalSalaries = filteredData.reduce((acc, emp) => acc + emp.netSalary, 0);
  const totalBenefits = filteredData.reduce((acc, emp) => acc + emp.monthlyBenefits, 0);
  const grandTotal = totalSalaries + totalBenefits;

  // Formatador de Moeda (R$)
  const formatMoney = (value) => {
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Folha & Custos</h1>
            <p className="text-slate-500">Projeção financeira baseada no salário líquido da contabilidade + Vales.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg border border-slate-200">
             <Users className="w-4 h-4" />
             <span className="text-sm font-bold">{filteredData.length} colaboradores na visão</span>
          </div>
        </div>

        {/* CARDS DE RESUMO FINANCEIRO (Agora são 3, direto ao ponto) */}
        <div className="grid gap-4 md:grid-cols-3">
            
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Custo Total (Mês)</p>
                    <div className="p-2 bg-emerald-100 rounded-lg"><DollarSign className="w-4 h-4 text-emerald-600"/></div>
                </div>
                <h3 className="text-2xl font-black text-slate-800">{formatMoney(grandTotal)}</h3>
                <p className="text-xs text-slate-400 mt-1">Soma de Salários + Benefícios</p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Salários (Líquido)</p>
                    <div className="p-2 bg-blue-100 rounded-lg"><FileText className="w-4 h-4 text-blue-600"/></div>
                </div>
                <h3 className="text-2xl font-black text-slate-800">{formatMoney(totalSalaries)}</h3>
                <p className="text-xs text-slate-400 mt-1">Conforme espelho da contabilidade</p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Benefícios Projetados</p>
                    <div className="p-2 bg-purple-100 rounded-lg"><PieChart className="w-4 h-4 text-purple-600"/></div>
                </div>
                <h3 className="text-2xl font-black text-slate-800">{formatMoney(totalBenefits)}</h3>
                <p className="text-xs text-slate-400 mt-1">VR + VT (Projeção de 22 dias)</p>
            </div>

        </div>

        {/* BARRA DE FILTROS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
            <div className="w-full md:w-80 relative">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Store className="w-3 h-3"/> Filtrar por Loja</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700" value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
                    <option value="">-- Todas as Lojas --</option>
                    {units.filter(u => u.status !== 'Inativa').map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
            </div>
            
            <div className="flex-1 w-full relative">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Search className="w-3 h-3"/> Buscar Colaborador</label>
                <input type="text" placeholder="Nome ou cargo..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
        </div>

        {/* TABELA DE DETALHAMENTO LÍQUIDA */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                        <tr>
                            <th className="p-4 font-semibold">Colaborador</th>
                            <th className="p-4 font-semibold">Salário (Líquido)</th>
                            <th className="p-4 font-semibold">Benefícios (22d)</th>
                            <th className="p-4 font-semibold text-right text-emerald-700">Custo Total / Mês</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredData.map((emp) => (
                            <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-slate-800">{emp.name}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                        {emp.role} • <Building2 className="w-3 h-3 ml-1"/> {emp.unitName}
                                    </div>
                                </td>
                                <td className="p-4 font-medium text-slate-700">
                                    {formatMoney(emp.netSalary)}
                                </td>
                                <td className="p-4">
                                    <span className="text-slate-600 font-medium">{formatMoney(emp.monthlyBenefits)}</span>
                                    <span className="block text-[10px] text-slate-400 mt-0.5">VR: R$ {emp.vr || 0} | VT: R$ {emp.vt || 0} /dia</span>
                                </td>
                                <td className="p-4 text-right">
                                    <span className="font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                        {formatMoney(emp.totalCost)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-12 text-center text-slate-400">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                    Nenhum funcionário encontrado nesta loja.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </ProtectedPage>
  );
}