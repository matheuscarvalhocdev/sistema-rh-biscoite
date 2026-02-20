import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "../api/base44Client";
import { 
  Plus, Search, UserPlus, FileText, MapPin, CreditCard, DollarSign, Utensils, Bus, ShoppingBag, UserCheck, UserMinus, Calendar, Download, Building2
} from "lucide-react";
import { ProtectedPage } from "../components/shared/AccessControl";

export default function Employees() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUnit, setFilterUnit] = useState(""); // 👈 NOVO: Estado do filtro de loja
  const [activeTab, setActiveTab] = useState("ativos");
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({ 
    name: "", cpf: "", pis: "", email: "", address: "", role: "", unitId: "", salary: "", va: "", vr: "", vt: "", admissionDate: "", status: "Ativo", dismissalDate: "" 
  });

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });
  const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: () => base44.entities.Unit.list() });

  // 👇 ATUALIZADO: Filtra também pela loja selecionada
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.role.toLowerCase().includes(searchTerm.toLowerCase());
    const isDesligado = emp.status === 'Desligado';
    const matchesUnit = filterUnit === "" || String(emp.unit?.id) === filterUnit;

    if (activeTab === 'ativos') {
        return matchesSearch && !isDesligado && matchesUnit; 
    } else {
        return matchesSearch && isDesligado && matchesUnit; 
    }
  });

  // 👇 ATUALIZADO: Exportação agora respeita o filtro de loja!
  const handleExport = (tipo) => {
    const dadosParaExportar = employees.filter(emp => {
        const matchesTipo = tipo === 'ativos' ? emp.status !== 'Desligado' : emp.status === 'Desligado';
        const matchesUnit = filterUnit === "" || String(emp.unit?.id) === filterUnit;
        return matchesTipo && matchesUnit;
    });

    if (dadosParaExportar.length === 0) {
        return alert(`Nenhum funcionário encontrado na lista de ${tipo} com o filtro atual para exportar.`);
    }

    const cabecalho = ["Nome", "CPF", "PIS", "Email", "Cargo", "Unidade", "Salario Base", "VA", "VR", "VT", "Admissao", "Desligamento", "Status"];
    
    const linhas = dadosParaExportar.map(emp => {
        return [
            emp.name || "",
            emp.cpf || "",
            emp.pis || "",
            emp.email || "",
            emp.role || "",
            emp.unit?.name || "",
            emp.salary || "",
            emp.va || "",
            emp.vr || "",
            emp.vt || "",
            emp.admissionDate ? new Date(emp.admissionDate).toLocaleDateString('pt-BR') : "",
            emp.dismissalDate ? new Date(emp.dismissalDate).toLocaleDateString('pt-BR') : "",
            emp.status || "Ativo"
        ].map(valor => `"${valor}"`).join(";");
    });

    const conteudoCSV = "\uFEFF" + [cabecalho.join(";"), ...linhas].join("\n");
    const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    let nomeArquivo = `Biscoite_Funcionarios_${tipo}`;
    if (filterUnit) {
        const nomeLoja = units.find(u => String(u.id) === filterUnit)?.name || "Loja";
        nomeArquivo += `_${nomeLoja.replace(/[^a-z0-9]/gi, '_')}`;
    }

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${nomeArquivo}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: "", cpf: "", pis: "", email: "", address: "", role: "", unitId: "", salary: "", va: "", vr: "", vt: "", admissionDate: "", status: "Ativo", dismissalDate: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingId(emp.id);
    setFormData({
      name: emp.name, cpf: emp.cpf, pis: emp.pis || "", email: emp.email, address: emp.address || "",  
      role: emp.role, unitId: emp.unit?.id || "", salary: emp.salary, va: emp.va || "", vr: emp.vr || "", vt: emp.vt || "", 
      admissionDate: emp.admissionDate, status: emp.status || "Ativo", dismissalDate: emp.dismissalDate || ""
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.role) return alert("Preencha os campos obrigatórios");

    const selectedUnit = units.find(u => String(u.id) === String(formData.unitId));
    const payload = { ...formData, unit: selectedUnit ? { id: selectedUnit.id, name: selectedUnit.name } : null };

    if (editingId) {
        await base44.entities.Employee.update(editingId, payload);
        alert("✅ Funcionário atualizado!");
    } else {
        await base44.entities.Employee.create(payload);
        alert("✅ Funcionário contratado!");
    }

    queryClient.invalidateQueries(['employees']);
    setIsModalOpen(false);
  };

  const handleToggleStatus = async (emp, novoStatus) => {
      const acao = novoStatus === 'Desligado' ? 'desligar' : 'reativar';
      if(window.confirm(`Tem certeza que deseja ${acao} ${emp.name}?`)) {
          const payload = { ...emp, status: novoStatus };
          if (novoStatus === 'Desligado') {
              payload.dismissalDate = new Date().toISOString().split('T')[0];
          } else {
              payload.dismissalDate = "";
          }
          await base44.entities.Employee.update(emp.id, payload);
          queryClient.invalidateQueries(['employees']);
      }
  };

  const handleDelete = async (id) => {
    if(window.confirm("⚠️ ATENÇÃO: Isso apagará o funcionário do sistema para sempre. Confirmar?")) {
        await base44.entities.Employee.delete(id);
        queryClient.invalidateQueries(['employees']);
    }
  };

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Quadro de Funcionários</h1>
            <p className="text-slate-500">Gerencie contratações, cargos e histórico da equipe.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => handleExport('ativos')} className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-2 rounded-lg text-sm font-bold transition-colors">
                <Download className="w-4 h-4" /> Exportar Ativos
            </button>
            <button onClick={() => handleExport('desligados')} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-2 rounded-lg text-sm font-bold transition-colors">
                <Download className="w-4 h-4" /> Exportar Desligados
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm ml-2">
              <UserPlus className="w-4 h-4" /> Novo
            </button>
          </div>
        </div>

        {/* 👇 NOVO: Barra de ferramentas reestruturada com Filtro de Lojas */}
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
          
          <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto shrink-0">
             <button onClick={() => setActiveTab('ativos')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md font-bold text-sm transition-all ${activeTab === 'ativos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <UserCheck className="w-4 h-4" /> Ativos
             </button>
             <button onClick={() => setActiveTab('desligados')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md font-bold text-sm transition-all ${activeTab === 'desligados' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <UserMinus className="w-4 h-4" /> Desligados
             </button>
          </div>

          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto flex-1 justify-end">
            {/* Filtro de Lojas */}
            <div className="relative w-full md:w-56">
                <select 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg pl-3 pr-8 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                    value={filterUnit}
                    onChange={(e) => setFilterUnit(e.target.value)}
                >
                    <option value="">Todas as Lojas</option>
                    {units.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
                <Building2 className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Campo de Busca Livre */}
            <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Buscar por nome ou cargo..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </div>
          </div>
        </div>

        {/* TABELA DE FUNCIONÁRIOS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-4 font-semibold">Colaborador</th>
                <th className="p-4 font-semibold">Cargo / Unidade</th>
                <th className="p-4 font-semibold">Contato</th>
                <th className="p-4 font-semibold">Remuneração & Benefícios</th>
                <th className="p-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className={`hover:bg-slate-50 transition-colors group ${emp.status === 'Desligado' ? 'bg-slate-50/50' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${emp.status === 'Desligado' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'}`}>
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div className={`font-bold ${emp.status === 'Desligado' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{emp.name}</div>
                        <div className="text-xs text-slate-400">CPF: {emp.cpf || "---"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-700">{emp.role}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mb-1">{emp.unit?.name || "Sem Unidade"}</div>
                    
                    {activeTab === 'desligados' && emp.dismissalDate && (
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                            <Calendar className="w-3 h-3" /> Desligado em: {new Date(emp.dismissalDate).toLocaleDateString('pt-BR')}
                        </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-slate-600">{emp.email}</div>
                    <div className="text-xs text-slate-400 truncate max-w-[200px]" title={emp.address}>{emp.address ? `📍 ${emp.address}` : ""}</div>
                  </td>
                  <td className="p-4">
                     <div className="font-medium text-slate-700">{emp.salary ? `R$ ${emp.salary}` : "-"}</div>
                     <div className="text-[10px] text-slate-500 flex flex-wrap gap-2 mt-1">
                        {emp.va && <span className="bg-orange-50 text-orange-700 px-1 rounded border border-orange-100">VA: {emp.va}</span>}
                        {emp.vr && <span className="bg-blue-50 text-blue-700 px-1 rounded border border-blue-100">VR: {emp.vr}</span>}
                        {emp.vt && <span className="bg-slate-100 text-slate-600 px-1 rounded border border-slate-200">VT: {emp.vt}</span>}
                     </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {activeTab === 'ativos' ? (
                            <>
                                <button onClick={() => handleOpenEdit(emp)} className="p-2 hover:bg-slate-200 rounded text-slate-600 font-medium">Editar</button>
                                <button onClick={() => handleToggleStatus(emp, 'Desligado')} className="p-2 hover:bg-red-50 text-red-600 rounded font-medium">Desligar</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => handleOpenEdit(emp)} className="p-2 hover:bg-slate-200 rounded text-slate-600 font-medium">Ver/Editar</button>
                                <button onClick={() => handleToggleStatus(emp, 'Ativo')} className="p-2 hover:bg-emerald-50 text-emerald-600 rounded font-medium">Reativar</button>
                                <button onClick={() => handleDelete(emp.id)} className="p-2 hover:bg-red-50 text-red-600 rounded font-medium">Excluir</button>
                            </>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                 <tr><td colSpan="5" className="p-8 text-center text-slate-400">Nenhum funcionário encontrado nesta categoria com os filtros atuais.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL MANTIDO (IGUAL AO ANTERIOR, NÃO CORTEI NADA) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0">
                <h3 className="font-bold text-lg text-slate-800">{editingId ? "Editar Cadastro" : "Admitir Funcionário"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div><label className="block text-sm font-medium mb-1">Nome Completo</label><input required className="w-full px-4 py-2 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1 flex items-center gap-1"><FileText className="w-3 h-3"/> CPF</label><input className="w-full px-4 py-2 border rounded-lg" placeholder="000.000.000-00" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} /></div>
                    <div><label className="block text-sm font-medium mb-1 flex items-center gap-1 text-blue-700"><CreditCard className="w-3 h-3"/> Nº PIS</label><input className="w-full px-4 py-2 border rounded-lg border-blue-200 bg-blue-50" placeholder="000.00000.00-0" value={formData.pis} onChange={e => setFormData({...formData, pis: e.target.value})} /></div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Localização & Contato</p>
                    <div className="grid gap-4">
                        <div><label className="block text-sm font-medium mb-1">Email Corporativo</label><input type="email" className="w-full px-4 py-2 border rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                        <div><label className="block text-sm font-medium mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Endereço Completo</label><input className="w-full px-4 py-2 border rounded-lg" placeholder="Rua, Número, Bairro, CEP - Cidade/UF" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
                    </div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Contrato & Benefícios</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium mb-1">Cargo</label><input required className="w-full px-4 py-2 border rounded-lg" placeholder="Ex: Vendedor" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} /></div>
                        <div><label className="block text-sm font-medium mb-1">Data de Admissão</label><input type="date" className="w-full px-4 py-2 border rounded-lg" value={formData.admissionDate} onChange={e => setFormData({...formData, admissionDate: e.target.value})} /></div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium mb-1">Unidade / Loja</label>
                        <select className="w-full px-4 py-2 border rounded-lg bg-white" value={formData.unitId} onChange={e => setFormData({...formData, unitId: e.target.value})}>
                            <option value="">Selecione...</option>
                            {units.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div><label className="block text-sm font-medium mb-1 flex items-center gap-1 truncate"><DollarSign className="w-3 h-3"/> Salário</label><input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="R$ 0,00" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} /></div>
                        <div><label className="block text-sm font-medium mb-1 flex items-center gap-1 truncate text-orange-700"><ShoppingBag className="w-3 h-3"/> VA Mensal</label><input className="w-full px-3 py-2 border rounded-lg text-sm border-orange-200 bg-orange-50" placeholder="0,00" value={formData.va} onChange={e => setFormData({...formData, va: e.target.value})} /></div>
                        <div><label className="block text-sm font-medium mb-1 flex items-center gap-1 truncate"><Utensils className="w-3 h-3"/> VR Diário</label><input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="0,00" value={formData.vr} onChange={e => setFormData({...formData, vr: e.target.value})} /></div>
                        <div><label className="block text-sm font-medium mb-1 flex items-center gap-1 truncate"><Bus className="w-3 h-3"/> VT Diário</label><input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="0,00" value={formData.vt} onChange={e => setFormData({...formData, vt: e.target.value})} /></div>
                    </div>
                    {editingId && (
                        <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                            <div>
                                <label className="block text-sm font-medium mb-1">Status Atual</label>
                                <select className="w-full px-3 py-2 border rounded-lg bg-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                    <option value="Ativo">🟢 Ativo</option>
                                    <option value="Desligado">🔴 Desligado</option>
                                </select>
                            </div>
                            {formData.status === 'Desligado' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-red-600">Data de Desligamento</label>
                                    <input type="date" className="w-full px-3 py-2 border rounded-lg border-red-300 bg-red-50 text-red-900 focus:ring-red-500" value={formData.dismissalDate} onChange={e => setFormData({...formData, dismissalDate: e.target.value})} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold">Cancelar</button>
                    <button type="submit" className="flex-1 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold">Salvar Cadastro</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </ProtectedPage>
  );
}