import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "../api/base44Client";
import { 
  Building, Bell, Save, Loader2
} from "lucide-react";
import { ProtectedPage } from "../components/shared/AccessControl";

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("empresa"); 
  const [isSaving, setIsSaving] = useState(false);

  const { data: settings, isLoading } = useQuery({ 
      queryKey: ['settings'], 
      queryFn: () => base44.entities.Settings.get() 
  });

  const [formData, setFormData] = useState({
      companyName: "", cnpj: "", emailAlerts: true
  });

  useEffect(() => {
      if (settings) {
          setFormData({
              companyName: settings.companyName || "",
              cnpj: settings.cnpj || "",
              emailAlerts: settings.emailAlerts ?? true
          });
      }
  }, [settings]);

  const handleSave = async (e) => {
      e.preventDefault();
      setIsSaving(true);
      await base44.entities.Settings.save(formData);
      queryClient.invalidateQueries(['settings']);
      setIsSaving(false);
      alert("✅ Configurações salvas com sucesso!");
  };

  if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Configurações do Sistema</h1>
            <p className="text-slate-500">Gerencie os dados da matriz e notificações.</p>
          </div>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-sm transition-all disabled:opacity-50">
              <Save className="w-4 h-4" /> {isSaving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-64 shrink-0">
                <nav className="flex flex-row lg:flex-col gap-1 bg-white p-2 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                    <button onClick={() => setActiveTab('empresa')} className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all whitespace-nowrap text-left ${activeTab === 'empresa' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>
                        <Building className="w-4 h-4" /> Dados da Matriz
                    </button>
                    <button onClick={() => setActiveTab('notificacoes')} className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all whitespace-nowrap text-left ${activeTab === 'notificacoes' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>
                        <Bell className="w-4 h-4" /> Alertas do Sistema
                    </button>
                </nav>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <form onSubmit={handleSave} className="p-6 md:p-8">
                    
                    {activeTab === 'empresa' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1"><Building className="w-5 h-5 text-blue-600"/> Identificação</h3>
                                <p className="text-sm text-slate-500 mb-6">Informações da empresa principal usadas na contabilidade.</p>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Razão Social / Nome Fantasia</label>
                                    <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">CNPJ Matriz</label>
                                    <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} placeholder="00.000.000/0001-00" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notificacoes' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1"><Bell className="w-5 h-5 text-amber-500"/> Alertas e Comunicação</h3>
                                <p className="text-sm text-slate-500 mb-6">Gerencie quais notificações o sistema deve enviar automaticamente.</p>
                            </div>
                            
                            <div className="space-y-4">
                                <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <div className="pt-1">
                                        <input type="checkbox" className="w-5 h-5 accent-blue-600" checked={formData.emailAlerts} onChange={e => setFormData({...formData, emailAlerts: e.target.checked})} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">Alertas Diários por E-mail</p>
                                        <p className="text-sm text-slate-500">Enviar um resumo para o RH sobre faltas, atestados e fechamento de ponto pendente das lojas.</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
      </div>
    </ProtectedPage>
  );
}