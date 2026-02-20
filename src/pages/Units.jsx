import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "../api/base44Client";
import { 
  Building2, MapPin, Plus, Trash2, Search, Store, User, Edit2, Users, Mail, X, Hash, FileText, BadgeCheck, CheckCircle2, AlertCircle, XCircle
} from "lucide-react";
import { ProtectedPage } from "../components/shared/AccessControl";

export default function Units() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null); 
  
  // 👇 NOVO: Abas de Status de Lojas
  const [filterStatus, setFilterStatus] = useState("Ativa"); // Ativa | Repassada | Inativa | Todas
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  
  // 👇 NOVO: Adicionado campo "status"
  const [formData, setFormData] = useState({ 
    name: "", corporateName: "", cnpj: "", code: "", email: "", address: "", city: "", state: "", manager: "", status: "Ativa" 
  });

  const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: () => base44.entities.Unit.list() });
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });

  // 👇 LÓGICA DE FILTRAGEM
  const filteredUnits = units.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase());
      const uStatus = u.status || "Ativa"; // Lojas antigas sem status viram 'Ativa' por padrão
      const matchStatus = filterStatus === "Todas" || uStatus === filterStatus;
      return matchSearch && matchStatus;
  });

  const totalEmployeesInFilteredUnits = employees.filter(e => filteredUnits.some(u => String(u.id) === String(e.unit?.id))).length;

  const handleUnitClick = (unit) => { setSelectedUnit(unit); };

  const handleOpenCreate = () => { 
      setEditingId(null); 
      setFormData({ name: "", corporateName: "", cnpj: "", code: "", email: "", address: "", city: "", state: "", manager: "", status: "Ativa" }); 
      setIsModalOpen(true); 
  };
  
  const handleOpenEdit = (unit, e) => { 
    e.stopPropagation(); 
    setEditingId(unit.id); 
    setFormData({ 
        name: unit.name, corporateName: unit.corporateName || "", cnpj: unit.cnpj || "", code: unit.code || "", 
        email: unit.email || "", address: unit.address, city: unit.city, state: unit.state || "", manager: unit.manager, 
        status: unit.status || "Ativa"
    }); 
    setIsModalOpen(true); 
  };
  
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert("Nome obrigatório");
    if (editingId) { await base44.entities.Unit.update(editingId, formData); alert("✅ Atualizado!"); } 
    else { await base44.entities.Unit.create(formData); alert("✅ Criado!"); }
    queryClient.invalidateQueries(['units']); setIsModalOpen(false);
  };
  
  const handleDelete = async (id, e) => { 
    e.stopPropagation();
    if (window.confirm("Tem certeza que deseja excluir esta unidade?")) { 
        await base44.entities.Unit.delete(id); 
        queryClient.invalidateQueries(['units']); 
    } 
  };

  const countEmployees = (unitId) => employees.filter(e => String(e.unit?.id) === String(unitId)).length;

  // 👇 Função para pegar as cores do cartão dependendo do status da loja
  const getStatusColors = (status) => {
    if(status === 'Inativa') return { border: 'hover:border-red-300', gradient: 'from-red-400 to-red-600', iconBg: 'bg-red-50 text-red-600', badge: 'bg-red-100 text-red-700 border-red-200' };
    if(status === 'Repassada') return { border: 'hover:border-amber-300', gradient: 'from-amber-400 to-amber-600', iconBg: 'bg-amber-50 text-amber-600', badge: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { border: 'hover:border-emerald-300', gradient: 'from-emerald-400 to-emerald-600', iconBg: 'bg-emerald-50 text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  };

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
              <h1 className="text-3xl font-bold text-slate-900">Unidades & Filiais</h1>
              <p className="text-slate-500">Gerencie Lojas Próprias, Franquias e Inativas.</p>
          </div>
          <button onClick={handleOpenCreate} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm active:scale-95 transition-all">
              <Plus className="w-4 h-4" /> Nova Unidade
          </button>
        </div>

        {/* BARRA DE FILTROS E BUSCA */}
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Abas de Status */}
            <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg w-full md:w-auto shrink-0 gap-1">
                <button onClick={() => setFilterStatus('Ativa')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${filterStatus === 'Ativa' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <CheckCircle2 className="w-4 h-4" /> Próprias
                </button>
                <button onClick={() => setFilterStatus('Repassada')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${filterStatus === 'Repassada' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <AlertCircle className="w-4 h-4" /> Franquias
                </button>
                <button onClick={() => setFilterStatus('Inativa')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${filterStatus === 'Inativa' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <XCircle className="w-4 h-4" /> Inativas
                </button>
                <div className="w-px bg-slate-300 my-1 mx-1 hidden md:block"></div>
                <button onClick={() => setFilterStatus('Todas')} className={`flex-1 md:flex-none px-4 py-2 rounded-md font-bold text-sm transition-all ${filterStatus === 'Todas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    Todas
                </button>
            </div>

            {/* Busca e KPIs rápidos */}
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="hidden lg:flex items-center gap-4 text-sm font-medium text-slate-500 mr-2">
                    <span><strong className="text-slate-800">{filteredUnits.length}</strong> Lojas</span>
                    <span><strong className="text-slate-800">{totalEmployeesInFilteredUnits}</strong> Colab.</span>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input type="text" placeholder="Buscar unidade..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
        </div>

        {/* LISTA DE LOJAS */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredUnits.map((unit) => {
            const colors = getStatusColors(unit.status || 'Ativa');
            
            return (
            <div key={unit.id} onClick={() => handleUnitClick(unit)} className={`group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg ${colors.border} transition-all overflow-hidden relative flex flex-col h-full cursor-pointer active:scale-[0.99] ${unit.status === 'Inativa' ? 'opacity-80 grayscale-[0.2]' : ''}`}>
              <div className={`h-2 bg-gradient-to-r ${colors.gradient} shrink-0`}></div>
              <div className="p-6 flex flex-col flex-1">
                
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-lg ${colors.iconBg} flex items-center justify-center shrink-0`}><Store className="w-6 h-6" /></div>
                  <div className="flex gap-1">
                      <button onClick={(e) => handleOpenEdit(unit, e)} className="text-slate-300 hover:text-blue-600 p-2 z-10 hover:bg-blue-50 rounded-full transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={(e) => handleDelete(unit.id, e)} className="text-slate-300 hover:text-red-600 p-2 z-10 hover:bg-red-50 rounded-full transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-800 leading-tight pr-2">{unit.name}</h3>
                    {unit.code && <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200 shrink-0">ID: {unit.code}</span>}
                </div>

                {/* Badge Visual de Status */}
                {unit.status && unit.status !== 'Ativa' && (
                    <div className="mb-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${colors.badge}`}>
                            {unit.status === 'Repassada' ? 'Repassada (Franquia)' : 'Loja Inativa'}
                        </span>
                    </div>
                )}

                <div className="flex flex-col gap-2 mb-6 flex-1">
                  {unit.corporateName && (<div className="text-xs text-slate-400 truncate font-medium">{unit.corporateName}</div>)}
                  {unit.email && (<div className="flex items-center gap-2 text-xs text-slate-500"><Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span className="truncate">{unit.email}</span></div>)}
                  <div className="flex items-start gap-2 text-xs text-slate-500"><MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" /> <div className="flex flex-col"><span className="break-words line-clamp-2">{unit.address || "Endereço não informado"}</span><span className="text-slate-400">{unit.city}{unit.state ? ` - ${unit.state}` : ""}</span></div></div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        {unit.cnpj ? <span className="font-mono text-[10px] bg-slate-50 px-1 rounded border">CNPJ: {unit.cnpj}</span> : <span className="truncate max-w-[100px]">{unit.manager || "-"}</span>}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600 shrink-0">{countEmployees(unit.id)} colab.</div>
                </div>

              </div>
            </div>
          )})}
          {filteredUnits.length === 0 && (<div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50"><Store className="w-12 h-12 mb-3 opacity-20" /><p className="font-medium">Nenhuma unidade encontrada neste status.</p></div>)}
        </div>

        {/* MODAL DETALHES DA LOJA */}
        {selectedUnit && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
                <div className="p-6 bg-slate-50 border-b flex justify-between items-start shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ${getStatusColors(selectedUnit.status || 'Ativa').iconBg}`}><Store className="w-7 h-7" /></div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold text-slate-800">{selectedUnit.name}</h2>
                                {selectedUnit.status && selectedUnit.status !== 'Ativa' && <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getStatusColors(selectedUnit.status).badge}`}>{selectedUnit.status}</span>}
                            </div>
                            <div className="flex flex-wrap gap-4 mt-1 text-sm text-slate-500">{selectedUnit.code && <span className="flex items-center gap-1 font-mono bg-white px-1.5 rounded border">ID: {selectedUnit.code}</span>} {selectedUnit.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {selectedUnit.city} - {selectedUnit.state}</span>}</div>
                        </div>
                    </div>
                    <button onClick={() => setSelectedUnit(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid md:grid-cols-2 gap-4 mb-8">
                         <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                             <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-3 text-sm"><FileText className="w-4 h-4 text-blue-500"/> Dados Fiscais</h4>
                             <div className="space-y-2">
                                <div><p className="text-[10px] text-slate-400 uppercase font-bold">Razão Social</p><p className="text-sm text-slate-800 font-medium">{selectedUnit.corporateName || "-"}</p></div>
                                <div><p className="text-[10px] text-slate-400 uppercase font-bold">CNPJ</p><p className="text-sm text-slate-800 font-mono">{selectedUnit.cnpj || "-"}</p></div>
                             </div>
                         </div>
                         <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                             <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-3 text-sm"><MapPin className="w-4 h-4 text-emerald-500"/> Localização</h4>
                             <div className="space-y-2">
                                <div><p className="text-[10px] text-slate-400 uppercase font-bold">Endereço</p><p className="text-sm text-slate-800">{selectedUnit.address || "Não informado"}</p></div>
                                <div><p className="text-[10px] text-slate-400 uppercase font-bold">E-mail</p><p className="text-sm text-blue-600">{selectedUnit.email || "Não informado"}</p></div>
                             </div>
                         </div>
                    </div>

                    <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600" /> Equipe Alocada</h3><span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">{unitEmployees.length} colaboradores</span></div>
                    {unitEmployees.length > 0 ? (<div className="border rounded-lg overflow-hidden"><table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3 text-slate-600 font-medium">Nome</th><th className="p-3 text-slate-600 font-medium">Cargo</th><th className="p-3 text-slate-600 font-medium">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{unitEmployees.map(emp => (<tr key={emp.id} className="hover:bg-slate-50"><td className="p-3 font-medium text-slate-800 flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">{emp.name.charAt(0)}</div>{emp.name}</td><td className="p-3 text-slate-600">{emp.role}</td><td className="p-3">{emp.status === 'Desligado' ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Desligado</span> : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Ativo</span>}</td></tr>))}</tbody></table></div>) : (<div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50"><User className="w-12 h-12 text-slate-300 mx-auto mb-2" /><p className="text-slate-500 font-medium">Nenhum funcionário vinculado.</p></div>)}
                </div>
                <div className="p-4 border-t bg-slate-50 flex justify-end shrink-0"><button onClick={() => setSelectedUnit(null)} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors">Fechar</button></div>
             </div>
          </div>
        )}

        {/* MODAL DE CADASTRO / EDIÇÃO */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50"><h3 className="font-bold text-lg text-slate-800">{editingId ? "Editar Unidade" : "Nova Unidade"}</h3><button onClick={() => setIsModalOpen(false)}><XCircle className="w-6 h-6 text-slate-400 hover:text-red-500"/></button></div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                
                {/* 👇 NOVO: Select de Status da Loja */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status da Loja</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="Ativa">🟢 Ativa (Loja Própria)</option>
                        <option value="Repassada">🟠 Repassada (Franquia)</option>
                        <option value="Inativa">🔴 Inativa (Fechada)</option>
                    </select>
                </div>

                <div><label className="block text-sm font-medium mb-1">Nome Fantasia (Loja)</label><input required className="w-full px-4 py-2 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1 flex items-center gap-1"><Hash className="w-3 h-3 text-blue-500"/> Código / ID Contábil</label><input className="w-full px-4 py-2 border rounded-lg bg-blue-50 border-blue-200" placeholder="Ex: 001 ou 105" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} /></div>
                
                <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Dados Fiscais</p>
                    <div className="space-y-3">
                        <div><label className="block text-sm font-medium mb-1 flex items-center gap-1"><Building2 className="w-3 h-3 text-slate-500"/> Razão Social</label><input className="w-full px-4 py-2 border rounded-lg" placeholder="Ex: Biscoite Comercio Ltda" value={formData.corporateName} onChange={e => setFormData({...formData, corporateName: e.target.value})} /></div>
                        <div><label className="block text-sm font-medium mb-1 flex items-center gap-1"><BadgeCheck className="w-3 h-3 text-slate-500"/> CNPJ</label><input className="w-full px-4 py-2 border rounded-lg font-mono" placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} /></div>
                    </div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Localização & Contato</p>
                    <div><label className="block text-sm font-medium mb-1">E-mail</label><input type="email" className="w-full px-4 py-2 border rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                    <div className="mt-3"><label className="block text-sm font-medium mb-1">Endereço</label><input className="w-full px-4 py-2 border rounded-lg" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-4 mt-3"><div><label className="block text-sm font-medium mb-1">Cidade</label><input className="w-full px-4 py-2 border rounded-lg" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div><div><label className="block text-sm font-medium mb-1">UF</label><input className="w-full px-4 py-2 border rounded-lg" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} /></div></div>
                </div>
                <div><label className="block text-sm font-medium mb-1">Gerente</label><input className="w-full px-4 py-2 border rounded-lg" value={formData.manager} onChange={e => setFormData({...formData, manager: e.target.value})} /></div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg mt-4 flex justify-center gap-2">{editingId ? "Salvar" : "Cadastrar"}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}


