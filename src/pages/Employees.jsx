import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "../api/base44Client";
import { 
  Search, Plus, Edit2, Trash2, X, Building2, UserCircle, 
  Briefcase, DollarSign, CheckCircle2, AlertCircle, Calendar
} from "lucide-react";
import { ProtectedPage } from "../components/shared/AccessControl";

export default function Employees() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // 👇 Adicionamos admissionDate no estado inicial
  const [formData, setFormData] = useState({
    name: "", cpf: "", pis: "", role: "", status: "Ativo", 
    salary: "", va: "", vr: "", vt: "", unitId: "", admissionDate: ""
  });

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });
  const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: () => base44.entities.Unit.list() });

  // MÁSCARA INTELIGENTE DE CPF
  const handleCpfChange = (e) => {
      let value = e.target.value.replace(/\D/g, ""); 
      if (value.length > 11) value = value.slice(0, 11); 
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      setFormData({ ...formData, cpf: value });
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ 
        name: "", cpf: "", pis: "", role: "", status: "Ativo", 
        salary: "", va: "", vr: "", vt: "", unitId: "", admissionDate: "" 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingId(emp.id);
    setFormData({
      name: emp.name || "",
      cpf: emp.cpf || "", 
      pis: emp.pis || "",
      role: emp.role || "",
      status: emp.status || "Ativo",
      salary: emp.salary || "",
      va: emp.va || "",
      vr: emp.vr || "",
      vt: emp.vt || "",
      unitId: emp.unit?.id || "",
      admissionDate: emp.admissionDate || "" // 👇 Puxa a data se existir
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    const unitObj = units.find(u => String(u.id) === String(formData.unitId));
    
    const payload = {
        ...formData,
        salary: parseFloat(formData.salary) || 0,
        va: parseFloat(formData.va) || 0,
        vr: parseFloat(formData.vr) || 0,
        vt: parseFloat(formData.vt) || 0,
        unit: unitObj ? { id: unitObj.id, name: unitObj.name } : null
    };
    
    delete payload.unitId; 

    if (editingId) {
        await base44.entities.Employee.update(editingId, payload);
    } else {
        await base44.entities.Employee.create(payload);
    }
    
    queryClient.invalidateQueries(['employees']);
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja apagar este colaborador?")) {
      await base44.entities.Employee.delete(id);
      queryClient.invalidateQueries(['employees']);
    }
  };

  // FILTRO BLINDADO CONTRA DADOS EM BRANCO
  const filteredEmployees = employees.filter(emp => {
      const safeName = emp.name || "";
      const safeCpf = emp.cpf || "";
      
      const matchName = safeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCpf = safeCpf.includes(searchTerm);
      const matchUnit = selectedUnit === "" || String(emp.unit?.id) === String(selectedUnit);
      
      return (matchName || matchCpf) && matchUnit;
  });

  // 👇 Função para formatar a data na tabela (de YYYY-MM-DD para DD/MM/YYYY)
  const formatTableDate = (dateString) => {
      if (!dateString) return "--/--/----";
      const [year, month, day] = dateString.split("-");
      return `${day}/${month}/${year}`;
  };

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Quadro de Colaboradores</h1>
            <p className="text-slate-500">Gerencie a base de funcionários e os dados contratuais.</p>
          </div>
          <button onClick={handleOpenCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-all">
            <Plus className="w-5 h-5" /> Novo Colaborador
          </button>
        </div>

        {/* FILTROS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Buscar por nome ou CPF..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                />
            </div>
            <div className="w-full md:w-80">
                <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium" 
                    value={selectedUnit} 
                    onChange={e => setSelectedUnit(e.target.value)}
                >
                    <option value="">Todas as Unidades</option>
                    {units.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* TABELA DE FUNCIONÁRIOS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                        <tr>
                            <th className="p-4 font-bold">Colaborador & Cargo</th>
                            <th className="p-4 font-bold">Documentos (CPF/NIS)</th>
                            <th className="p-4 font-bold">Admissão</th> {/* Nova Coluna */}
                            <th className="p-4 font-bold">Unidade Vinculada</th>
                            <th className="p-4 font-bold">Status</th>
                            <th className="p-4 font-bold text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredEmployees.map((emp) => (
                            <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 shrink-0">
                                            {(emp.name || "??").substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-base">{emp.name || 'Sem Nome'}</div>
                                            <div className="text-xs font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wide">
                                                <Briefcase className="w-3 h-3" /> {emp.role || 'Sem cargo'}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="font-medium text-slate-700">{emp.cpf || 'Sem CPF'}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">NIS: {emp.pis || 'Pendente'}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        {formatTableDate(emp.admissionDate)}
                                    </div>
                                </td>
                                <td className="p-4">
                                    {emp.unit?.name ? (
                                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                                            <Building2 className="w-4 h-4 text-emerald-600" /> {emp.unit.name}
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 italic text-xs">Sem loja vinculada</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {emp.status === 'Ativo' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                                            <AlertCircle className="w-3.5 h-3.5" /> Desligado
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenEdit(emp)} className="p-2 bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(emp.id)} className="p-2 bg-slate-100 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredEmployees.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-12 text-center text-slate-400">
                                    <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="font-medium">Nenhum colaborador encontrado.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* MODAL DE EDIÇÃO E CADASTRO */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                    <UserCircle className="w-6 h-6 text-blue-600" />
                    {editingId ? "Ficha do Colaborador" : "Novo Colaborador"}
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition-colors">
                    <X className="w-5 h-5"/>
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
                
                {/* DADOS PESSOAIS */}
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Dados Pessoais</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                            <input required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">CPF</label>
                            <input 
                                required 
                                placeholder="000.000.000-00" 
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" 
                                value={formData.cpf} 
                                onChange={handleCpfChange} 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">PIS / NIS</label>
                            <input placeholder="Apenas números" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" value={formData.pis} onChange={e => setFormData({...formData, pis: e.target.value.replace(/\D/g, "")})} />
                        </div>
                    </div>
                </div>

                {/* DADOS CONTRATUAIS */}
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Contrato & Lotação</h4>
                    {/* 👇 Mudamos para 3 colunas para acomodar a data */}
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Cargo Atual</label>
                            <input required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Admissão</label>
                            <input type="date" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700" value={formData.admissionDate} onChange={e => setFormData({...formData, admissionDate: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                            <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                <option value="Ativo">🟢 Ativo</option>
                                <option value="Desligado">🔴 Desligado</option>
                            </select>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                                <Building2 className="w-4 h-4 text-emerald-600" /> Unidade / Loja
                            </label>
                            <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700" value={formData.unitId} onChange={e => setFormData({...formData, unitId: e.target.value})}>
                                <option value="">-- Selecione a Loja (Matriz ou Filial) --</option>
                                {units.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} (ID: {u.accountingId || 'S/N'})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* REMUNERAÇÃO E BENEFÍCIOS */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Remuneração & Benefícios
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Salário (Líquido)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">R$</span>
                                <input type="number" step="0.01" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Vale Alimentação (Mês)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">R$</span>
                                <input type="number" step="0.01" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" value={formData.va} onChange={e => setFormData({...formData, va: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Vale Refeição (Diário)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">R$</span>
                                <input type="number" step="0.01" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" value={formData.vr} onChange={e => setFormData({...formData, vr: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Vale Transporte (Diário)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">R$</span>
                                <input type="number" step="0.01" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" value={formData.vt} onChange={e => setFormData({...formData, vt: e.target.value})} />
                            </div>
                        </div>
                    </div>
                </div>

              </form>
              
              <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                  <button onClick={handleSave} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors text-lg flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      {editingId ? "Salvar Ficha" : "Cadastrar Colaborador"}
                  </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </ProtectedPage>
  );
}