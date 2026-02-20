import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "../api/base44Client";
import { Target, Plus, Search, MapPin, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { ProtectedPage } from "../components/shared/AccessControl";

export default function Vagas() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({ title: "", unitId: "", date: new Date().toISOString().split('T')[0], status: "Aberta", description: "" });

  // Busca dados
  const { data: jobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: () => base44.entities.Job.list() });
  const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: () => base44.entities.Unit.list() });

  const filteredJobs = jobs.filter(j => j.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ title: "", unitId: "", date: new Date().toISOString().split('T')[0], status: "Aberta", description: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (job) => {
    setEditingId(job.id);
    setFormData({ title: job.title, unitId: job.unitId, date: job.date, status: job.status, description: job.description || "" });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.unitId) return alert("Preencha Cargo e Unidade.");
    
    if (editingId) {
        await base44.entities.Job.update(editingId, formData);
    } else {
        await base44.entities.Job.create(formData);
    }
    queryClient.invalidateQueries(['jobs']);
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
      if(window.confirm("Excluir esta vaga?")) {
          await base44.entities.Job.delete(id);
          queryClient.invalidateQueries(['jobs']);
      }
  };

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Vagas</h1>
            <p className="text-slate-500">Administre as vagas em aberto para recrutamento.</p>
          </div>
          <button onClick={handleOpenCreate} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm">
            <Plus className="w-4 h-4" /> Nova Vaga
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Buscar vaga por cargo..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => {
            const unit = units.find(u => String(u.id) === String(job.unitId));
            return (
              <div key={job.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group">
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${job.status === 'Aberta' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {job.status === 'Aberta' ? <CheckCircle2 className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>} {job.status}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{new Date(job.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <h3 className="font-bold text-slate-800 text-lg leading-tight">{job.title}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5"/> {unit?.name || "Unidade Desconhecida"}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(job)} className="text-sm font-medium text-blue-600 hover:underline">Editar Vaga</button>
                    <button onClick={() => handleDelete(job.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            )
          })}
          {filteredJobs.length === 0 && <div className="col-span-full py-10 text-center text-slate-400">Nenhuma vaga cadastrada.</div>}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <h3 className="font-bold text-lg mb-4">{editingId ? "Editar Vaga" : "Abrir Nova Vaga"}</h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Cargo / Título</label><input required className="w-full px-3 py-2 border rounded-lg" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1">Unidade</label><select required className="w-full px-3 py-2 border rounded-lg bg-white" value={formData.unitId} onChange={e => setFormData({...formData, unitId: e.target.value})}><option value="">Selecione...</option>{units.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}</select></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Data de Abertura</label><input type="date" required className="w-full px-3 py-2 border rounded-lg" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                    <div><label className="block text-sm font-medium mb-1">Status</label><select className="w-full px-3 py-2 border rounded-lg bg-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="Aberta">Aberta</option><option value="Fechada">Fechada</option><option value="Cancelada">Cancelada</option></select></div>
                </div>
                <div className="flex gap-2 pt-2"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded-lg font-bold text-slate-600">Cancelar</button><button type="submit" className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-bold">Salvar</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}