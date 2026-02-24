import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "../api/base44Client";
import { 
  AlertTriangle, Search, Plus, FileText, Paperclip, Download, Trash2, X, FileCheck, AlertCircle, FileWarning
} from "lucide-react";
import { ProtectedPage } from "../components/shared/AccessControl";

export default function Occurrences() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");

  const [formData, setFormData] = useState({ 
    employeeId: "", type: "Atestado Médico", date: new Date().toISOString().split('T')[0], description: "", attachmentName: "" 
  });

  // Buscas
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });
  const { data: occurrences = [] } = useQuery({ queryKey: ['occurrences'], queryFn: () => base44.entities.Occurrence.list() });

  // Lida com o Upload de Arquivo (Simulado para o protótipo)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        // Num sistema real, aqui você enviaria o 'file' para um servidor (AWS S3) e pegaria a URL de volta.
        // Aqui, nós apenas salvamos o nome do arquivo para mostrar na tela.
        setFormData({ ...formData, attachmentName: file.name });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.employeeId) return alert("Selecione um funcionário!");

    const emp = employees.find(e => String(e.id) === String(formData.employeeId));
    
    await base44.entities.Occurrence.create({
        ...formData,
        employeeName: emp?.name || "Desconhecido",
        unitName: emp?.unit?.name || "Matriz"
    });

    queryClient.invalidateQueries(['occurrences']);
    setIsModalOpen(false);
    setFormData({ employeeId: "", type: "Atestado Médico", date: new Date().toISOString().split('T')[0], description: "", attachmentName: "" });
    alert("✅ Ocorrência salva e anexada com sucesso!");
  };

  const handleDelete = async (id) => {
      if(window.confirm("Apagar este registro permanentemente?")) {
          await base44.entities.Occurrence.delete(id);
          queryClient.invalidateQueries(['occurrences']);
      }
  };

  // Ícones e cores dinâmicas
  const getTypeConfig = (type) => {
      switch(type) {
          case 'Atestado Médico': return { color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <FileCheck className="w-5 h-5"/> };
          case 'Advertência': return { color: 'text-amber-600 bg-amber-50 border-amber-200', icon: <AlertCircle className="w-5 h-5"/> };
          case 'Suspensão': return { color: 'text-red-600 bg-red-50 border-red-200', icon: <FileWarning className="w-5 h-5"/> };
          default: return { color: 'text-slate-600 bg-slate-50 border-slate-200', icon: <FileText className="w-5 h-5"/> };
      }
  };

  const filteredOccurrences = occurrences
    .filter(o => o.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || o.description.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(o => filterType === "" || o.type === filterType)
    .sort((a,b) => new Date(b.date) - new Date(a.date));

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Ocorrências & Arquivos</h1>
            <p className="text-slate-500">Registre atestados, advertências e guarde os documentos.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-all">
              <Plus className="w-4 h-4" /> Novo Registro
          </button>
        </div>

        {/* FILTROS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Buscar por funcionário ou descrição..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="w-full md:w-64">
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium text-slate-700" value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="">Todos os Tipos</option>
                    <option value="Atestado Médico">Atestados Médicos</option>
                    <option value="Advertência">Advertências</option>
                    <option value="Suspensão">Suspensões</option>
                    <option value="Feedback">Feedbacks / Outros</option>
                </select>
            </div>
        </div>

        {/* LISTA DE OCORRÊNCIAS */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOccurrences.map(occ => {
                const config = getTypeConfig(occ.type);
                return (
                    <div key={occ.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                        <div className="p-5 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${config.color}`}>
                                    {config.icon}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${config.color}`}>{occ.type}</span>
                                </div>
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{occ.employeeName}</h3>
                            <p className="text-xs text-slate-500 mb-4">{occ.unitName} • {new Date(occ.date).toLocaleDateString('pt-BR')}</p>
                            
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700 mb-4">
                                {occ.description}
                            </div>

                            {/* EXIBIÇÃO DO ANEXO */}
                            {occ.attachmentName && (
                                <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Paperclip className="w-4 h-4 text-blue-600 shrink-0"/>
                                        <span className="text-xs font-medium text-blue-800 truncate">{occ.attachmentName}</span>
                                    </div>
                                    <button onClick={() => alert(`Em produção, isso faria o download do arquivo: ${occ.attachmentName}`)} className="text-blue-600 hover:text-blue-800 p-1 bg-white rounded-md border border-blue-200 shadow-sm shrink-0">
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="bg-slate-50 p-3 border-t border-slate-100 flex justify-end">
                            <button onClick={() => handleDelete(occ.id)} className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )
            })}
            {filteredOccurrences.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <AlertTriangle className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-medium">Nenhum registro encontrado.</p>
                </div>
            )}
        </div>

        {/* MODAL DE NOVO REGISTRO */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800">Nova Ocorrência</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4">
                
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Colaborador</label>
                    <select required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}>
                        <option value="">Selecione...</option>
                        {employees.filter(e => e.status !== 'Desligado').map(e => (
                            <option key={e.id} value={e.id}>{e.name} ({e.unit?.name || 'Sem loja'})</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Registro</label>
                        <select className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                            <option value="Atestado Médico">Atestado Médico</option>
                            <option value="Advertência">Advertência</option>
                            <option value="Suspensão">Suspensão</option>
                            <option value="Feedback">Feedback / Outros</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Data</label>
                        <input type="date" required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Motivo / Descrição</label>
                    <textarea required placeholder="Descreva o motivo da advertência, dias de atestado, etc..." className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                </div>

                {/* 👇 CAMPO DE UPLOAD DE ARQUIVO */}
                <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors relative cursor-pointer group">
                    <input type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.jpg,.jpeg,.png" />
                    <div className="flex flex-col items-center justify-center text-center pointer-events-none">
                        <Paperclip className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors mb-2" />
                        <p className="text-sm font-bold text-slate-700">Anexar Documento</p>
                        <p className="text-xs text-slate-500">PDF, JPG ou PNG (Clique ou arraste)</p>
                        
                        {formData.attachmentName && (
                            <div className="mt-3 inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
                                <FileCheck className="w-3 h-3" /> {formData.attachmentName}
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-sm">Salvar Registro</button>
                </div>

              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}