import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "../api/base44Client";
import { ProtectedPage } from "../components/shared/AccessControl";
import { 
  AlertTriangle, FileText, Star, Plus, Search, Calendar, User, Trash2, CheckCircle2, XCircle 
} from "lucide-react";
import { useToast } from "../components/ui/use-toast";

export default function Occurrences() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estado local para as ocorrências (Simulando banco de dados)
  const [occurrences, setOccurrences] = useState(() => {
    const saved = localStorage.getItem("rh_occurrences");
    return saved ? JSON.parse(saved) : [];
  });

  // Salvar no LocalStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem("rh_occurrences", JSON.stringify(occurrences));
  }, [occurrences]);

  // Busca Funcionários para o Select
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  // Formulário
  const [formData, setFormData] = useState({
    employeeId: "",
    type: "ADVERTENCIA", // ADVERTENCIA, ATESTADO, FEEDBACK, SUSPENSAO
    date: new Date().toISOString().split('T')[0],
    description: "",
    severity: "MEDIUM" // LOW, MEDIUM, HIGH
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.employeeId) return toast({ title: "Selecione um funcionário", variant: "destructive" });

    const employee = employees.find(e => String(e.id) === String(formData.employeeId));
    
    const newOccurrence = {
      id: Date.now(),
      ...formData,
      employeeName: employee?.name || "Desconhecido",
      employeeRole: employee?.role || "Cargo não informado"
    };

    setOccurrences([newOccurrence, ...occurrences]);
    setIsModalOpen(false);
    toast({ title: "Ocorrência registrada com sucesso!" });
    
    // Reset form parcial
    setFormData({ ...formData, description: "", severity: "MEDIUM" });
  };

  const handleDelete = (id) => {
    if (window.confirm("Remover este registro?")) {
      setOccurrences(occurrences.filter(o => o.id !== id));
      toast({ title: "Registro removido." });
    }
  };

  // Filtros
  const filteredList = occurrences.filter(item => 
    item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Auxiliares de UI
  const getTypeConfig = (type) => {
    switch (type) {
      case 'ADVERTENCIA': return { icon: AlertTriangle, color: "text-amber-600 bg-amber-50 border-amber-200", label: "Advertência" };
      case 'SUSPENSAO': return { icon: XCircle, color: "text-red-600 bg-red-50 border-red-200", label: "Suspensão" };
      case 'ATESTADO': return { icon: FileText, color: "text-blue-600 bg-blue-50 border-blue-200", label: "Atestado Médico" };
      case 'FEEDBACK': return { icon: Star, color: "text-purple-600 bg-purple-50 border-purple-200", label: "Feedback Positivo" };
      default: return { icon: FileText, color: "text-slate-600 bg-slate-50", label: type };
    }
  };

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Ocorrências</h1>
            <p className="text-slate-500">Registre advertências, atestados e feedbacks.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all active:scale-95 font-medium"
          >
            <Plus className="w-4 h-4" /> Nova Ocorrência
          </button>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por funcionário ou tipo..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Lista de Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredList.map((item) => {
            const config = getTypeConfig(item.type);
            const Icon = config.icon;
            
            return (
              <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative group">
                
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-2 py-1 rounded-md text-xs font-bold border flex items-center gap-1.5 ${config.color}`}>
                    <Icon className="w-3 h-3" /> {config.label}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                    {item.employeeName.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{item.employeeName}</h3>
                    <p className="text-xs text-slate-500">{item.employeeRole}</p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg italic border border-slate-100">
                  "{item.description}"
                </p>

                {/* Botão de Excluir (Aparece ao passar o mouse) */}
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
          
          {filteredList.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>Nenhuma ocorrência encontrada.</p>
            </div>
          )}
        </div>

        {/* MODAL DE CADASTRO */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                <h3 className="font-bold text-lg text-slate-800">Registrar Evento</h3>
                <button onClick={() => setIsModalOpen(false)}><XCircle className="w-6 h-6 text-slate-400 hover:text-red-500"/></button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Funcionário</label>
                  <select 
                    required 
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.employeeId} 
                    onChange={e => setFormData({...formData, employeeId: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Evento</label>
                    <select 
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.type} 
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="ADVERTENCIA">⚠️ Advertência</option>
                      <option value="SUSPENSAO">🚫 Suspensão</option>
                      <option value="ATESTADO">📄 Atestado Médico</option>
                      <option value="FEEDBACK">⭐ Feedback Positivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                    <input 
                      type="date" 
                      required 
                      className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.date} 
                      onChange={e => setFormData({...formData, date: e.target.value})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrição / Motivo</label>
                  <textarea 
                    required 
                    rows="3"
                    placeholder="Descreva o motivo da ocorrência..."
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-md transition-all active:scale-95 flex justify-center items-center gap-2 mt-2"
                >
                  <FileText className="w-4 h-4" /> Salvar Registro
                </button>

              </form>
            </div>
          </div>
        )}

      </div>
    </ProtectedPage>
  );
}