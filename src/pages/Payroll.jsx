import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "../api/base44Client";
import { 
  DollarSign, TrendingUp, Users, Building2, AlertCircle, Wallet, PieChart, X, User
} from "lucide-react";
import { ProtectedPage } from "../components/shared/AccessControl";

export default function Payroll() {
  // Estado para controlar qual loja foi clicada
  const [selectedUnit, setSelectedUnit] = useState(null);

  // Busca dados do banco
  const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: () => base44.entities.Unit.list() });
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });

  // --- CONFIGURAÇÕES DE CÁLCULO ---
  const ENCARGOS_ESTIMADOS = 0.70; // 70%

  // Funções Auxiliares
  const parseCurrency = (value) => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    const clean = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // --- CÁLCULOS GERAIS ---
  const payrollData = units.map(unit => {
    const unitEmployees = employees.filter(e => String(e.unit?.id) === String(unit.id));
    
    const totalSalary = unitEmployees.reduce((acc, emp) => acc + parseCurrency(emp.salary), 0);
    const totalBenefits = totalSalary * ENCARGOS_ESTIMADOS;
    const totalCost = totalSalary + totalBenefits;

    return {
      ...unit,
      employeeCount: unitEmployees.length,
      totalSalary,
      totalBenefits,
      totalCost
    };
  }).sort((a, b) => b.totalCost - a.totalCost);

  const grandTotalCost = payrollData.reduce((acc, u) => acc + u.totalCost, 0);
  const grandTotalEmployees = payrollData.reduce((acc, u) => acc + u.employeeCount, 0);

  // --- FILTRO PARA O MODAL (DETALHES DA LOJA) ---
  const selectedUnitEmployees = selectedUnit 
    ? employees.filter(e => String(e.unit?.id) === String(selectedUnit.id))
    : [];

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Folha & Custos</h1>
            <p className="text-slate-500">Controle financeiro detalhado por unidade de negócio.</p>
          </div>
          
          <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 border border-blue-100">
            <AlertCircle className="w-4 h-4" />
            <span>Encargos estimados em <strong>{ENCARGOS_ESTIMADOS * 100}%</strong> sobre a folha.</span>
          </div>
        </div>

        {/* CARDS KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign className="w-24 h-24" /></div>
                <div className="relative z-10">
                    <p className="text-slate-400 text-sm font-medium uppercase mb-1">Custo Total Mensal (Est.)</p>
                    <h2 className="text-3xl font-bold mb-2">{formatCurrency(grandTotalCost)}</h2>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Users className="w-3 h-3" /> {grandTotalEmployees} colaboradores ativos
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
                    <span className="text-slate-500 text-sm font-bold uppercase">Custo Médio / Loja</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">{formatCurrency(grandTotalCost / (units.length || 1))}</h2>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Building2 className="w-5 h-5" /></div>
                    <span className="text-slate-500 text-sm font-bold uppercase">Unidade de Maior Custo</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800 truncate" title={payrollData[0]?.name}>{payrollData[0]?.name || "Nenhuma"}</h2>
                <p className="text-sm text-slate-400 mt-1">Representa {((payrollData[0]?.totalCost / grandTotalCost) * 100 || 0).toFixed(1)}% do total</p>
            </div>
        </div>

        {/* TABELA PRINCIPAL */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-slate-400" /> Detalhamento por Unidade
                </h3>
                <p className="text-xs text-slate-400 mt-1">Clique em uma loja para ver o custo individual dos funcionários.</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                        <tr>
                            <th className="p-4 font-semibold">Unidade / Loja</th>
                            <th className="p-4 font-semibold text-center">Equipe</th>
                            <th className="p-4 font-semibold">Salário Base</th>
                            <th className="p-4 font-semibold text-slate-400">Encargos (+70%)</th>
                            <th className="p-4 font-semibold text-right">Custo Total</th>
                            <th className="p-4 font-semibold w-24">Impacto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {payrollData.map((data) => {
                            const percent = (data.totalCost / grandTotalCost) * 100 || 0;
                            return (
                                <tr 
                                    key={data.id} 
                                    onClick={() => setSelectedUnit(data)}
                                    className="hover:bg-blue-50 transition-colors cursor-pointer group"
                                    title="Clique para ver detalhes"
                                >
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 group-hover:text-blue-700">{data.name}</div>
                                        <div className="text-xs text-slate-400">{data.city}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold group-hover:bg-blue-100 group-hover:text-blue-700">
                                            {data.employeeCount}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600">{formatCurrency(data.totalSalary)}</td>
                                    <td className="p-4 text-slate-400 italic">{formatCurrency(data.totalBenefits)}</td>
                                    <td className="p-4 text-right font-bold text-slate-800">{formatCurrency(data.totalCost)}</td>
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-16">
                                                <div className={`h-full rounded-full ${percent > 15 ? 'bg-red-500' : percent > 5 ? 'bg-blue-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }}></div>
                                            </div>
                                            <span className="text-xs text-slate-400 w-8">{percent.toFixed(0)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        {/* --- MODAL DE DETALHES DA LOJA --- */}
        {selectedUnit && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
                
                {/* Cabeçalho do Modal */}
                <div className="p-6 bg-slate-50 border-b flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{selectedUnit.name}</h2>
                            <p className="text-sm text-slate-500">Detalhamento de Custos por Colaborador</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedUnit(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>

                {/* Conteúdo do Modal */}
                <div className="flex-1 overflow-y-auto p-6">
                    {selectedUnitEmployees.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 text-slate-600 font-semibold">
                                    <tr>
                                        <th className="p-3">Colaborador</th>
                                        <th className="p-3 text-right">Salário Base</th>
                                        <th className="p-3 text-right text-slate-400">Encargos (+70%)</th>
                                        <th className="p-3 text-right text-emerald-700">Custo Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedUnitEmployees.map(emp => {
                                        const salary = parseCurrency(emp.salary);
                                        const benefits = salary * ENCARGOS_ESTIMADOS;
                                        const total = salary + benefits;

                                        return (
                                            <tr key={emp.id} className="hover:bg-slate-50">
                                                <td className="p-3 font-medium text-slate-800 flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 uppercase">
                                                        {emp.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="leading-tight">{emp.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-normal">{emp.role}</div>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right text-slate-600">{formatCurrency(salary)}</td>
                                                <td className="p-3 text-right text-slate-400 italic">{formatCurrency(benefits)}</td>
                                                <td className="p-3 text-right font-bold text-slate-800">{formatCurrency(total)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot className="bg-slate-50 font-bold text-slate-800">
                                    <tr>
                                        <td className="p-3 text-right">TOTAIS:</td>
                                        <td className="p-3 text-right">{formatCurrency(selectedUnit.totalSalary)}</td>
                                        <td className="p-3 text-right text-slate-500">{formatCurrency(selectedUnit.totalBenefits)}</td>
                                        <td className="p-3 text-right text-emerald-700">{formatCurrency(selectedUnit.totalCost)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50">
                            <User className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-500 font-medium">Nenhum custo registrado.</p>
                            <p className="text-xs text-slate-400">Adicione salários aos funcionários desta unidade.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-slate-50 flex justify-end shrink-0">
                    <button onClick={() => setSelectedUnit(null)} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors">
                        Fechar
                    </button>
                </div>
             </div>
          </div>
        )}

      </div>
    </ProtectedPage>
  );
}