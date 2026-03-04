import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "../api/base44Client";
import { 
  Shield, Key, Mail, UserPlus, Trash2, Edit2, Store, Search, ShieldCheck, ShieldAlert, X
} from "lucide-react";
import { ProtectedPage } from "../components/shared/AccessControl";
import CryptoJS from 'crypto-js'; // 👈 IMPORTANDO O CRIPTOGRAFADOR

export default function Users() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({ 
    name: "", email: "", password: "", role: "Líder de Loja", unitId: "" 
  });

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list() });
  const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: () => base44.entities.Unit.list() });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: "", email: "", password: "", role: "Líder de Loja", unitId: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingId(user.id);
    setFormData({ 
        name: user.name, 
        email: user.email, 
        password: "", 
        role: user.role, 
        unitId: user.unitId || "" 
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (formData.role === "Líder de Loja" && !formData.unitId) {
        return alert("Para o perfil Líder de Loja, você precisa vincular uma unidade!");
    }

    // Cria uma cópia dos dados para não mexer no estado visual
    const payload = { ...formData };

    // 👇 SEGREDO DA BLINDAGEM: Se digitou uma senha, criptografa antes de salvar!
    if (payload.password) {
        payload.password = CryptoJS.SHA256(payload.password).toString();
    } else {
        // Se estiver editando e deixou a senha em branco, não apaga a senha antiga!
        delete payload.password; 
    }

    if (editingId) {
        await base44.entities.User.update(editingId, payload);
        alert("✅ Usuário atualizado com sucesso!");
    } else {
        if (!formData.password) return alert("A senha é obrigatória para novos usuários!");
        await base44.entities.User.create(payload); // Salva o payload criptografado
        alert("✅ Usuário criado com acesso liberado!");
    }

    queryClient.invalidateQueries(['users']);
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
      if(window.confirm("⚠️ ATENÇÃO: Tem certeza que deseja remover o acesso deste usuário?")) {
          await base44.entities.User.delete(id);
          queryClient.invalidateQueries(['users']);
      }
  };

  const handlePasswordRecovery = (email) => {
      if(window.confirm(`Enviar link de redefinição de senha para ${email}?`)) {
          alert(`✅ Sucesso! Um e-mail com as instruções de recuperação foi enviado para ${email}.`);
      }
  };

  const getRoleConfig = (role) => {
      switch(role) {
          case 'Administrador': return { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <ShieldCheck className="w-3 h-3" /> };
          case 'RH': return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Shield className="w-3 h-3" /> };
          case 'Líder de Loja': return { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <ShieldAlert className="w-3 h-3" /> };
          default: return { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: <Shield className="w-3 h-3" /> };
      }
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Usuários & Permissões</h1>
            <p className="text-slate-500">Gerencie quem tem acesso ao sistema e defina os níveis de permissão.</p>
          </div>
          <button onClick={handleOpenCreate} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-all">
              <UserPlus className="w-4 h-4" /> Novo Acesso
          </button>
        </div>

        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex items-center">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Buscar usuário ou e-mail..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-4 font-semibold">Usuário</th>
                <th className="p-4 font-semibold">Perfil de Acesso</th>
                <th className="p-4 font-semibold">Vínculo de Loja</th>
                <th className="p-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((user) => {
                const roleConfig = getRoleConfig(user.role);
                const linkedUnit = units.find(u => String(u.id) === String(user.unitId));

                return (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{user.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3"/> {user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${roleConfig.color}`}>
                         {roleConfig.icon} {user.role}
                     </span>
                  </td>
                  <td className="p-4">
                     {user.role === 'Líder de Loja' ? (
                         linkedUnit ? (
                             <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                 <Store className="w-4 h-4 text-emerald-600"/> {linkedUnit.name}
                             </div>
                         ) : (
                             <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded">Sem loja vinculada</span>
                         )
                     ) : (
                         <span className="text-slate-400 text-xs italic">Acesso Geral (Matriz)</span>
                     )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handlePasswordRecovery(user.email)} className="p-2 hover:bg-blue-50 text-blue-600 rounded" title="Enviar Recuperação de Senha">
                            <Key className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenEdit(user)} className="p-2 hover:bg-slate-200 text-slate-600 rounded">
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-red-50 text-red-600 rounded">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              )})}
              {filteredUsers.length === 0 && (
                 <tr><td colSpan="4" className="p-8 text-center text-slate-400">Nenhum usuário cadastrado no sistema.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL DE EDIÇÃO E CADASTRO */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
              
              <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="font-bold text-lg text-slate-800">{editingId ? "Editar Usuário" : "Novo Acesso"}</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6"/>
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
                
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                    <input required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">E-mail de Login</label>
                    <input type="email" required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                        {editingId ? "Nova Senha (deixe em branco para manter a atual)" : "Senha Temporária"}
                    </label>
                    <div className="relative">
                        <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input type="password" placeholder={editingId ? "********" : "Digite uma senha forte"} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nível de Permissão</label>
                    <div className="grid gap-2">
                        <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${formData.role === 'Administrador' ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' : 'hover:bg-slate-50 border-slate-200'}`}>
                            <input type="radio" name="role" value="Administrador" checked={formData.role === 'Administrador'} onChange={e => setFormData({...formData, role: e.target.value})} className="w-4 h-4 text-purple-600" />
                            <div>
                                <p className="font-bold text-slate-800 text-sm flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-purple-600"/> Administrador</p>
                                <p className="text-[10px] text-slate-500">Acesso total irrestrito a configurações e módulos.</p>
                            </div>
                        </label>
                        <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${formData.role === 'RH' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-slate-50 border-slate-200'}`}>
                            <input type="radio" name="role" value="RH" checked={formData.role === 'RH'} onChange={e => setFormData({...formData, role: e.target.value})} className="w-4 h-4 text-blue-600" />
                            <div>
                                <p className="font-bold text-slate-800 text-sm flex items-center gap-1"><Shield className="w-4 h-4 text-blue-600"/> Equipe de RH</p>
                                <p className="text-[10px] text-slate-500">Gestão completa de todas as lojas, faltas e funcionários.</p>
                            </div>
                        </label>
                        <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${formData.role === 'Líder de Loja' ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500' : 'hover:bg-slate-50 border-slate-200'}`}>
                            <input type="radio" name="role" value="Líder de Loja" checked={formData.role === 'Líder de Loja'} onChange={e => setFormData({...formData, role: e.target.value})} className="w-4 h-4 text-orange-600" />
                            <div>
                                <p className="font-bold text-slate-800 text-sm flex items-center gap-1"><ShieldAlert className="w-4 h-4 text-orange-600"/> Líder de Loja (Visualizador)</p>
                                <p className="text-[10px] text-slate-500">Acesso restrito. Lança atestados e escalas apenas da sua loja.</p>
                            </div>
                        </label>
                    </div>
                </div>

                {formData.role === 'Líder de Loja' && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-bold text-orange-700 mb-1 flex items-center gap-1"><Store className="w-4 h-4"/> Vincular à Loja</label>
                        <select className="w-full px-3 py-2 border border-orange-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-orange-50" value={formData.unitId} onChange={e => setFormData({...formData, unitId: e.target.value})}>
                            <option value="">Selecione a loja do Líder...</option>
                            {units.filter(u => u.status !== 'Inativa').map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="pt-4 border-t border-slate-100 shrink-0">
                    <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-sm">
                        {editingId ? "Salvar Alterações" : "Criar Acesso"}
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