import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "../api/base44Client";
import { 
  Plus, Edit2, Trash2, X, Store, MapPin, Hash, FileText, Search, Users, 
  CheckCircle2, AlertCircle, XCircle, UploadCloud, Loader2
} from "lucide-react";
import { ProtectedPage } from "../components/shared/AccessControl";
import * as XLSX from 'xlsx'; // 👈 NOSSO NOVO LEITOR DE EXCEL!

export default function Units() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("Próprias");
  const [searchTerm, setSearchTerm] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const [formData, setFormData] = useState({ 
      name: "", status: "Ativa (Loja Própria)", accountingId: "", companyName: "", cnpj: "",
      email: "", address: "", city: "", state: "", manager: ""
  });

  const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: () => base44.entities.Unit.list() });
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ 
      name: "", status: "Ativa (Loja Própria)", accountingId: "", companyName: "", cnpj: "",
      email: "", address: "", city: "", state: "", manager: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (unit) => {
    setEditingId(unit.id);
    setFormData({ 
        name: unit.name || "", 
        status: unit.status === "Ativa" ? "Ativa (Loja Própria)" : (unit.status === "Inativa" ? "Inativa (Fechada)" : (unit.status || "Ativa (Loja Própria)")),
        accountingId: unit.accountingId || "",
        companyName: unit.companyName || "",
        cnpj: unit.cnpj || "",
        email: unit.email || "",
        address: unit.address || "",
        city: unit.city || "",
        state: unit.state || "",
        manager: unit.manager || ""
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingId) {
        await base44.entities.Unit.update(editingId, formData);
    } else {
        await base44.entities.Unit.create(formData);
    }
    queryClient.invalidateQueries(['units']);
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
      if(window.confirm("Apagar esta unidade permanentemente?")) {
          await base44.entities.Unit.delete(id);
          queryClient.invalidateQueries(['units']);
      }
  };

  // 👇 LÓGICA DE LEITURA DIRETO DO .XLSX DO EXCEL
  const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setIsImporting(true);
      const reader = new FileReader();

      reader.onload = async (event) => {
          try {
              // 1. Lê o arquivo como Binário (ArrayBuffer) para o XLSX entender
              const data = new Uint8Array(event.target.result);
              const workbook = XLSX.read(data, { type: 'array' });
              
              // 2. Pega a primeira aba da planilha
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              
              // 3. Converte as células em um Array de Arrays (fácil de ler)
              const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
              
              if (rows.length < 2) {
                  alert("A planilha parece estar vazia.");
                  setIsImporting(false);
                  return;
              }

              let headerIdx = -1;
              let headers = [];
              
              // 4. O Radar: Lê as 10 primeiras linhas procurando os títulos (Ignorando se tiver linhas em branco no topo)
              for (let i = 0; i < Math.min(10, rows.length); i++) {
                  const row = rows[i];
                  if (!row || row.length === 0) continue;
                  
                  // Limpa acentos e caracteres estranhos para analisar
                  const rowStr = row.join(' ').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  
                  if (rowStr.includes('nome') || rowStr.includes('cnpj') || rowStr.includes('razao')) {
                      headerIdx = i;
                      // Salva os cabeçalhos limpinhos
                      headers = row.map(cell => String(cell).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim());
                      break;
                  }
              }

              if (headerIdx === -1) {
                  alert("⚠️ Não consegui encontrar as colunas. Verifique se a planilha tem uma coluna chamada 'Nome', 'CNPJ' ou 'Razão Social'.");
                  setIsImporting(false);
                  return;
              }

              // 5. Descobre em qual índice/posição está cada coluna
              const nameIdx = headers.findIndex(h => h.includes('nome') || h.includes('fantasia') || h.includes('loja') || h.includes('unidade'));
              const cnpjIdx = headers.findIndex(h => h.includes('cnpj'));
              const companyNameIdx = headers.findIndex(h => h.includes('razao') || h.includes('empresa'));
              const idIdx = headers.findIndex(h => h.includes('cod') || h.includes('id') || h.includes('planilha'));

              let importedCount = 0;

              // 6. Varre as lojas linha por linha
              for (let i = headerIdx + 1; i < rows.length; i++) {
                  const row = rows[i];
                  if (!row || row.length === 0) continue;

                  const rawName = nameIdx !== -1 ? String(row[nameIdx]).trim() : "";
                  const rawCnpj = cnpjIdx !== -1 ? String(row[cnpjIdx]).trim() : "";
                  const rawCompanyName = companyNameIdx !== -1 ? String(row[companyNameIdx]).trim() : "";
                  const rawId = idIdx !== -1 ? String(row[idIdx]).trim() : "";

                  if (rawName || rawCompanyName || rawCnpj) {
                      const newUnit = {
                          name: rawName || rawCompanyName || "Loja Nova Importada",
                          accountingId: rawId,
                          companyName: rawCompanyName,
                          cnpj: rawCnpj,
                          status: "Ativa (Loja Própria)",
                          type: "Loja",
                          email: "",
                          address: "",
                          city: "",
                          state: "",
                          manager: ""
                      };
                      await base44.entities.Unit.create(newUnit);
                      importedCount++;
                  }
              }

              if (importedCount > 0) {
                  alert(`✅ SUCESSO ABSOLUTO! ${importedCount} Lojas foram importadas direto do seu Excel.\n\nElas estão prontas para o RH editar.`);
              } else {
                  alert("⚠️ Nenhuma loja importada. Verifique se as linhas abaixo do cabeçalho estão preenchidas.");
              }
              
              queryClient.invalidateQueries(['units']);
          } catch (error) {
              console.error(error);
              alert("Erro ao ler o arquivo Excel. Verifique se ele não está corrompido.");
          } finally {
              setIsImporting(false);
              if(fileInputRef.current) fileInputRef.current.value = ""; 
          }
      };

      // 🛑 O SEGREDO ESTÁ AQUI: Lê como arquivo binário, não como texto!
      reader.readAsArrayBuffer(file); 
  };

  const filteredUnits = units
    .filter(u => {
        const status = u.status || "";
        if (activeTab === 'Próprias') return status.includes('Ativa'); 
        if (activeTab === 'Franquias') return status.includes('Franquia') || status.includes('Repassada');
        if (activeTab === 'Inativas') return status.includes('Inativa'); 
        return true; 
    })
    .filter(u => {
        const searchName = u.name?.toLowerCase() || "";
        const searchId = u.accountingId?.toLowerCase() || "";
        const term = searchTerm.toLowerCase();
        return searchName.includes(term) || searchId.includes(term);
    });

  const getStatusConfig = (status) => {
      if (!status) return { color: 'bg-slate-100 text-slate-700', icon: <Store className="w-4 h-4" />, dot: 'bg-slate-500' };
      if (status.includes('Ativa')) return { color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-4 h-4" />, dot: 'bg-emerald-500' };
      if (status.includes('Franquia') || status.includes('Repassada')) return { color: 'bg-orange-100 text-orange-700', icon: <AlertCircle className="w-4 h-4" />, dot: 'bg-orange-500' };
      if (status.includes('Inativa')) return { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-4 h-4" />, dot: 'bg-red-500' };
      return { color: 'bg-slate-100 text-slate-700', icon: <Store className="w-4 h-4" />, dot: 'bg-slate-500' };
  };

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Unidades & Filiais</h1>
            <p className="text-slate-500">Gerencie Lojas Próprias, Franquias e Inativas.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
              {/* 👇 Agora o accept permite .xlsx e .csv! */}
              <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
              />
              <button 
                  onClick={() => fileInputRef.current.click()} 
                  disabled={isImporting}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg font-bold shadow-sm transition-all disabled:opacity-50"
              >
                  {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  {isImporting ? "Lendo..." : "Importar Planilha Excel"}
              </button>

              <button onClick={handleOpenCreate} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#059669] hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-all">
                  <Plus className="w-4 h-4" /> Nova Unidade
              </button>
          </div>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col xl:flex-row justify-between items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg w-full xl:w-auto overflow-x-auto">
                <button onClick={() => setActiveTab('Próprias')} className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'Próprias' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <CheckCircle2 className="w-4 h-4"/> Próprias
                </button>
                <button onClick={() => setActiveTab('Franquias')} className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'Franquias' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <AlertCircle className="w-4 h-4"/> Franquias
                </button>
                <button onClick={() => setActiveTab('Inativas')} className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'Inativas' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <XCircle className="w-4 h-4"/> Inativas
                </button>
                <button onClick={() => setActiveTab('Todas')} className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'Todas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    Todas
                </button>
            </div>

            <div className="flex items-center gap-4 w-full xl:w-auto">
                <div className="hidden md:flex items-center gap-4 px-4 border-r border-slate-200">
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Lojas</p>
                        <p className="font-black text-slate-700 leading-none">{filteredUnits.length}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Colab.</p>
                        <p className="font-black text-slate-700 leading-none">
                            {employees.filter(e => filteredUnits.some(u => String(u.id) === String(e.unit?.id)) && e.status !== 'Desligado').length}
                        </p>
                    </div>
                </div>
                <div className="relative w-full xl:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input type="text" placeholder="Buscar unidade..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>
        </div>

        {/* LISTA DE LOJAS */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredUnits.map((unit) => {
            const statusConfig = getStatusConfig(unit.status);
            const unitEmployees = employees.filter(e => String(e.unit?.id) === String(unit.id) && e.status !== 'Desligado');

            return (
            <div key={unit.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-300 transition-all flex flex-col group overflow-hidden">
              <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-3">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${statusConfig.color}`}>
                          {statusConfig.icon} {unit.status?.split('(')[0].trim() || 'Ativa'}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenEdit(unit)} className="p-1.5 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded"><Edit2 className="w-4 h-4"/></button>
                          <button onClick={() => handleDelete(unit.id)} className="p-1.5 bg-slate-50 text-slate-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4"/></button>
                      </div>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{unit.name}</h3>
                  {unit.accountingId && <p className="text-xs font-bold text-emerald-600 mb-3 flex items-center gap-1"><Hash className="w-3.5 h-3.5"/> ID: {unit.accountingId}</p>}

                  <div className="space-y-1.5 mt-4">
                      {unit.cnpj ? (
                           <p className="text-xs text-slate-600 flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-slate-400"/> {unit.cnpj}</p>
                      ) : (
                           <p className="text-xs text-slate-400 italic">Sem CNPJ cadastrado</p>
                      )}
                      {unit.city ? (
                          <p className="text-xs text-slate-600 flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400"/> {unit.city} {unit.state && `- ${unit.state}`}</p>
                      ) : (
                          <p className="text-xs text-orange-400 flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5"/> Endereço pendente (RH)</p>
                      )}
                  </div>
              </div>
              
              <div className="bg-slate-50 p-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-500 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-400"/> {unitEmployees.length} colaboradores
                  </span>
                  {unit.manager ? (
                      <span className="text-slate-500 truncate max-w-[130px]" title={unit.manager}>Ger: {unit.manager}</span>
                  ) : (
                      <span className="text-slate-400 italic">Sem gerente</span>
                  )}
              </div>
            </div>
          )})}
          
          {filteredUnits.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Store className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-medium">Nenhuma unidade encontrada neste status.</p>
              </div>
          )}
        </div>

        {/* MODAL DE EDIÇÃO / CRIAÇÃO MANUAL */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center bg-white shrink-0">
                <h3 className="font-bold text-xl text-[#1e293b]">{editingId ? "Editar Loja" : "Nova Unidade"}</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1"><X className="w-5 h-5"/></button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto">
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Status da Loja</label>
                    <div className="relative">
                        <div className={`absolute left-3 top-3 w-3 h-3 rounded-full ${getStatusConfig(formData.status).dot}`}></div>
                        <select className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700 appearance-none bg-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                            <option value="Ativa (Loja Própria)">Ativa (Loja Própria)</option>
                            <option value="Repassada (Franquia)">Repassada (Franquia)</option>
                            <option value="Inativa (Fechada)">Inativa (Fechada)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-[#1e293b] mb-1">Nome Fantasia (Loja)</label>
                    <input required className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-emerald-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>

                <div>
                    <label className="block text-sm font-bold text-[#1e293b] mb-1 flex items-center gap-1"><Hash className="w-4 h-4 text-blue-500"/> Código / ID Contábil</label>
                    <input placeholder="Ex: 001 ou 105" className="w-full px-3 py-2 border border-blue-200 bg-blue-50/50 rounded-md outline-none focus:ring-2 focus:ring-blue-500" value={formData.accountingId} onChange={e => setFormData({...formData, accountingId: e.target.value})} />
                </div>

                <div className="pt-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Dados Fiscais</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-[#1e293b] mb-1 flex items-center gap-1"><FileText className="w-4 h-4 text-slate-400"/> Razão Social</label>
                            <input placeholder="Ex: Biscoite Comercio Ltda" className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-emerald-500" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#1e293b] mb-1 flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-slate-400"/> CNPJ</label>
                            <input placeholder="00.000.000/0000-00" className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 mt-4">Localização & Contato</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-[#1e293b] mb-1">E-mail</label>
                            <input type="email" className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-emerald-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#1e293b] mb-1">Endereço</label>
                            <input className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-emerald-500" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-[#1e293b] mb-1">Cidade</label>
                                <input className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-emerald-500" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#1e293b] mb-1">UF</label>
                                <input maxLength="2" placeholder="SP" className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-emerald-500 uppercase text-center" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#1e293b] mb-1">Gerente</label>
                            <input className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-emerald-500" value={formData.manager} onChange={e => setFormData({...formData, manager: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="pt-6 shrink-0">
                    <button type="submit" className="w-full py-3.5 bg-[#059669] hover:bg-emerald-700 text-white font-bold rounded-md shadow-sm transition-colors text-lg">
                        {editingId ? "Salvar Alterações" : "Cadastrar"}
                    </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}