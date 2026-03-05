import { useState } from "react";
import { 
  Building2, Bell, ShieldCheck, Calculator, Save, 
  CheckCircle2, Mail, Phone, MapPin, AlertTriangle, Lock, Users
} from "lucide-react";
import { ProtectedPage } from "../components/shared/AccessControl";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("empresa");
  const [isSaving, setIsSaving] = useState(false);

  // Estados simulados para as configurações (O Paulo vai plugar isso no Banco depois)
  const [formData, setFormData] = useState({
    razaoSocial: "Biscoitê - A Biscoiteria LTDA",
    cnpj: "12.345.678/0001-90",
    emailRh: "rh@biscoite.com.br",
    telefone: "(11) 4002-8922",
    endereco: "Av. Paulista, 1000 - Bela Vista, São Paulo/SP",
    
    diaFechamentoPonto: "20",
    diaPagamento: "5",
    
    alertaOcorrenciaGrave: true,
    alertaVencimentoFerias: true,
    alertaFaltaInjustificada: false,
    
    tempoSessao: "15" 
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("✅ Configurações salvas visualmente!\n\n(Aviso para o Paulo: Lógica de DB pendente para conectar estes parâmetros).");
    }, 1000);
  };

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Configurações do Sistema</h1>
            <p className="text-slate-500">Gerencie as regras de negócio, dados da matriz e permissões globais.</p>
          </div>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all disabled:opacity-70"
          >
            {isSaving ? <span className="animate-spin text-xl">⏳</span> : <Save className="w-5 h-5" />}
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>

        {/* LAYOUT PRINCIPAL: MENU LATERAL + CONTEÚDO */}
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* MENU LATERAL DE ABAS */}
          <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab("empresa")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === "empresa" ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}
            >
              <Building2 className="w-5 h-5" /> Dados da Matriz
            </button>
            <button 
              onClick={() => setActiveTab("folha")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === "folha" ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}
            >
              <Calculator className="w-5 h-5" /> Parâmetros de Folha
            </button>
            <button 
              onClick={() => setActiveTab("notificacoes")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === "notificacoes" ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}
            >
              <Bell className="w-5 h-5" /> Avisos & Alertas
            </button>
            <button 
              onClick={() => setActiveTab("seguranca")} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === "seguranca" ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}
            >
              <ShieldCheck className="w-5 h-5" /> Segurança global
            </button>
          </div>

          {/* ÁREA DE CONTEÚDO DINÂMICO */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* ABA 1: DADOS DA EMPRESA */}
            {activeTab === "empresa" && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-600"/> Identificação Corporativa</h2>
                  <p className="text-sm text-slate-500">Informações que sairão nos cabeçalhos de relatórios e exportações.</p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Razão Social / Nome Fantasia</label>
                      <input name="razaoSocial" value={formData.razaoSocial} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">CNPJ da Matriz</label>
                      <input name="cnpj" value={formData.cnpj} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1"><Mail className="w-4 h-4 text-slate-400"/> E-mail Central (Contato)</label>
                      <input name="emailRh" type="email" value={formData.emailRh} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1"><Phone className="w-4 h-4 text-slate-400"/> Telefone Administrativo</label>
                      <input name="telefone" value={formData.telefone} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1"><MapPin className="w-4 h-4 text-slate-400"/> Endereço Sede</label>
                      <input name="endereco" value={formData.endereco} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: FOLHA DE PAGAMENTO */}
            {activeTab === "folha" && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Calculator className="w-5 h-5 text-blue-600"/> Padrões de Pagamento</h2>
                  <p className="text-sm text-slate-500">Defina os dias de corte e pagamento para o calendário do RH.</p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 p-5 rounded-xl">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Dia de Fechamento do Ponto</label>
                      <select name="diaFechamentoPonto" value={formData.diaFechamentoPonto} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium">
                        <option value="15">Dia 15 do mês</option>
                        <option value="20">Dia 20 do mês</option>
                        <option value="25">Dia 25 do mês</option>
                        <option value="ultimo">Último dia do mês</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-2">Até este dia, os líderes devem aprovar as faltas e ocorrências.</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-5 rounded-xl">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Dia Padrão de Pagamento</label>
                      <select name="diaPagamento" value={formData.diaPagamento} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium">
                        <option value="5">5º dia útil</option>
                        <option value="10">Dia 10 do mês</option>
                        <option value="15">Dia 15 do mês</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-2">Data base para relatórios de projeção de folha.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 3: NOTIFICAÇÕES (COM A NOVA REGRA DO RH) */}
            {activeTab === "notificacoes" && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Bell className="w-5 h-5 text-blue-600"/> Centro de Alertas Automáticos</h2>
                  <p className="text-sm text-slate-500">Escolha quais eventos do sistema disparam e-mails para a equipe.</p>
                </div>
                <div className="p-6 space-y-4">

                  {/* 👇 BANNER EXPLICANDO A REGRA DE ROTEAMENTO */}
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3 mb-6">
                     <Users className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                     <div>
                       <h4 className="font-bold text-blue-900 text-sm">Destinatários dos Alertas</h4>
                       <p className="text-sm text-blue-800 mt-1">
                         Os alertas selecionados abaixo serão enviados automaticamente para o e-mail corporativo de <strong>todos os usuários</strong> que possuam o nível de permissão <span className="font-bold bg-blue-200 px-1.5 py-0.5 rounded text-xs">RH</span> no cadastro do sistema.
                       </p>
                     </div>
                  </div>
                  
                  <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" name="alertaOcorrenciaGrave" checked={formData.alertaOcorrenciaGrave} onChange={handleChange} className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                    <div>
                      <p className="font-bold text-slate-800 flex items-center gap-2">Ocorrências Graves Registradas <AlertTriangle className="w-4 h-4 text-orange-500"/></p>
                      <p className="text-sm text-slate-500 mt-1">Dispara um e-mail imediato quando um Líder de Loja registrar uma suspensão ou advertência severa.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" name="alertaVencimentoFerias" checked={formData.alertaVencimentoFerias} onChange={handleChange} className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                    <div>
                      <p className="font-bold text-slate-800">Alerta de Vencimento de Férias</p>
                      <p className="text-sm text-slate-500 mt-1">Envia um relatório semanal com os colaboradores que estão a 60 dias de completarem período concessivo duplo.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" name="alertaFaltaInjustificada" checked={formData.alertaFaltaInjustificada} onChange={handleChange} className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                    <div>
                      <p className="font-bold text-slate-800">Aviso de Faltas Injustificadas</p>
                      <p className="text-sm text-slate-500 mt-1">Gera um e-mail de alerta diário consolidando todas as faltas não abonadas lançadas no dia anterior.</p>
                    </div>
                  </label>

                </div>
              </div>
            )}

            {/* ABA 4: SEGURANÇA */}
            {activeTab === "seguranca" && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Lock className="w-5 h-5 text-blue-600"/> Política de Acesso e Segurança</h2>
                  <p className="text-sm text-slate-500">Configurações globais de sessão para todos os usuários do sistema.</p>
                </div>
                <div className="p-6 space-y-6">
                  
                  <div className="bg-white border border-slate-200 p-5 rounded-xl max-w-md">
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                       Tempo Máximo de Inatividade
                       <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Ativo no Código</span>
                    </label>
                    <select disabled name="tempoSessao" value={formData.tempoSessao} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-300 rounded-lg outline-none text-slate-600 font-bold cursor-not-allowed">
                      <option value="15">15 minutos (Padrão Corporativo)</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-3 flex items-start gap-1">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      O sistema já está programado para deslogar automaticamente e destruir os tokens caso o usuário abandone o computador aberto.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                     <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                     <div>
                       <h4 className="font-bold text-blue-900 text-sm">Criptografia SHA-256 Ativada</h4>
                       <p className="text-sm text-blue-800 mt-1">
                         As senhas de todos os colaboradores, RH e líderes de loja estão sendo mascaradas no banco de dados utilizando criptografia forte. Nenhuma senha pode ser lida em texto claro.
                       </p>
                     </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </ProtectedPage>
  );
}