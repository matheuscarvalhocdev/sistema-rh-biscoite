import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "../api/base44Client";
import { 
  Upload, Check, XCircle, ArrowRight, Loader2, Info, MapPin, RefreshCw, Plus
} from "lucide-react";
import { ProtectedPage } from "../components/shared/AccessControl";

export default function ImportEmployees() {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Busca UNIDADES (para o ID) e FUNCIONÁRIOS (para não duplicar)
  const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: () => base44.entities.Unit.list() });
  const { data: existingEmployees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });

  // --- LÓGICA DE PROCESSAMENTO (14 COLUNAS) ---
  const handleTextChange = (inputText) => {
    setText(inputText);
    const lines = inputText.split("\n");
    const parsedData = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      const cols = line.replace(/"/g, "").split("\t"); 
      
      // Ignora cabeçalho
      if (cols[0]?.toLowerCase().includes("id") || cols[1]?.toLowerCase().includes("nome")) continue;

      if (cols.length > 1) {
         const storeCode = cols[0]?.trim(); 
         const foundUnit = units.find(u => String(u.code) === String(storeCode));

         // --- MAPEAMENTO DAS 14 COLUNAS ---
         // 0: ID Loja
         // 1: Nome
         // 2: CPF
         // 3: CEP
         // 4: Rua
         // 5: Numero
         // 6: Compl
         // 7: Bairro
         // 8: PIS
         // 9: Salario
         // 10: Cargo
         // 11: VA
         // 12: VR
         // 13: VT

         const nome = cols[1]?.trim() || "Sem Nome";
         const cpf = cols[2]?.trim() || "";
         
         // Montagem de Endereço
         const cep = cols[3]?.trim() || "";
         const rua = cols[4]?.trim() || "";
         const num = cols[5]?.trim() || "";
         const compl = cols[6]?.trim() || "";
         const bairro = cols[7]?.trim() || "";

         let fullAddress = rua;
         if (num) fullAddress += `, ${num}`;
         if (compl) fullAddress += ` - ${compl}`;
         if (bairro) fullAddress += ` - ${bairro}`;
         if (cep) fullAddress += ` - CEP: ${cep}`;

         // Limpeza de dinheiro (Se vier vazio, vira "0")
         const cleanMoney = (val) => val ? val.replace("R$", "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".").trim() : "0";

         // --- VERIFICAÇÃO DE DUPLICIDADE (pelo Nome ou CPF) ---
         const existingEmp = existingEmployees.find(e => 
            e.name.toLowerCase() === nome.toLowerCase() || 
            (cpf && e.cpf === cpf)
         );

         parsedData.push({
           operation: existingEmp ? "update" : "create",
           existingId: existingEmp ? existingEmp.id : null,

           storeId: storeCode,
           unitName: foundUnit ? foundUnit.name : "NÃO ENCONTRADA",
           unitObj: foundUnit,
           
           name: nome,
           cpf: cpf,
           address: fullAddress,          
           pis: cols[8]?.trim() || "",    
           salary: cleanMoney(cols[9]),
           role: cols[10]?.trim() || "Funcionario",
           
           // Benefícios (Colunas 12, 13, 14 do Excel -> Índices 11, 12, 13)
           va: cleanMoney(cols[11]),
           vr: cleanMoney(cols[12]),
           vt: cleanMoney(cols[13]),
           
           status: foundUnit ? "ready" : "error"
         });
      }
    }
    setPreview(parsedData);
  };

  const handleImport = async () => {
    const validItems = preview.filter(i => i.status === "ready");
    if (validItems.length === 0) return alert("Nada para importar.");

    setIsSaving(true);
    try {
        let createdCount = 0;
        let updatedCount = 0;

        for (const item of validItems) {
            const payload = {
                name: item.name,
                role: item.role,
                cpf: item.cpf,
                pis: item.pis,
                address: item.address,
                salary: item.salary,
                va: item.va,
                vr: item.vr,
                vt: item.vt,
                unit: { id: item.unitObj.id, name: item.unitObj.name },
                email: "", 
                admissionDate: new Date().toISOString().split('T')[0]
            };

            if (item.operation === "update" && item.existingId) {
                // ATUALIZA O EXISTENTE
                await base44.entities.Employee.update(item.existingId, payload);
                updatedCount++;
            } else {
                // CRIA UM NOVO
                await base44.entities.Employee.create(payload);
                createdCount++;
            }
        }
        
        await queryClient.invalidateQueries(['employees']);
        alert(`Processo concluído!\n✅ ${createdCount} Novos Criados\n🔄 ${updatedCount} Atualizados`);
        setText("");
        setPreview([]);
    } catch (error) {
        alert("Erro na importação.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Importação Completa (14 Colunas)</h1>
                <p className="text-slate-500">Atualiza cadastro existente (CPF/Nome) e adiciona benefícios.</p>
            </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 h-[75vh]">
            
            {/* LADO ESQUERDO */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                    <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4"/> ORDEM DAS 14 COLUNAS
                    </h4>
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold text-slate-600">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded">1. ID LOJA</span>
                        <span className="bg-white px-2 py-1 rounded border">2. NOME</span>
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-200">3. CPF</span>
                        <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200">4. CEP</span>
                        <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200">5. RUA</span>
                        <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200">6. Nº</span>
                        <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200">7. COMPL</span>
                        <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200">8. BAIRRO</span>
                        <span className="bg-white px-2 py-1 rounded border">9. PIS</span>
                        <span className="bg-white px-2 py-1 rounded border">10. SALÁRIO</span>
                        <span className="bg-white px-2 py-1 rounded border">11. CARGO</span>
                        
                        <div className="w-full h-px bg-blue-200 my-1"></div>
                        
                        <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-200">12. VA</span>
                        <span className="bg-cyan-50 text-cyan-700 px-2 py-1 rounded border border-cyan-200">13. VR</span>
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-200">14. VT</span>
                    </div>
                </div>

                <textarea 
                    className="flex-1 w-full p-4 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none whitespace-pre"
                    placeholder="Cole aqui..."
                    value={text}
                    onChange={(e) => handleTextChange(e.target.value)}
                ></textarea>
            </div>

            {/* LADO DIREITO */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <ArrowRight className="w-5 h-5 text-slate-400"/> Conferência
                    </h3>
                    {preview.length > 0 && <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{preview.length} linhas</span>}
                </div>

                <div className="flex-1 overflow-auto border rounded-lg bg-slate-50 relative">
                    {preview.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                            <Upload className="w-10 h-10 mb-2 opacity-20"/>
                            <p>Cole os dados para visualizar...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead className="bg-slate-100 sticky top-0 font-bold text-slate-600">
                                <tr>
                                    <th className="p-2">Ação</th>
                                    <th className="p-2">Loja</th>
                                    <th className="p-2">Funcionário</th>
                                    <th className="p-2">Salário</th>
                                    <th className="p-2 text-center">Benefícios</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {preview.map((item, idx) => (
                                    <tr key={idx} className={item.status === 'error' ? 'bg-red-50' : ''}>
                                        <td className="p-2">
                                            {item.operation === 'update' ? (
                                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                                    <RefreshCw className="w-3 h-3"/> ATUALIZAR
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                                    <Plus className="w-3 h-3"/> NOVO
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-2">
                                            {item.status === 'error' ? 
                                                <span className="text-[10px] text-red-600 font-bold">ERRO ID: {item.storeId}</span> : 
                                                <span className="text-[10px] text-emerald-600 font-bold truncate block max-w-[100px]">{item.unitName}</span>
                                            }
                                        </td>
                                        <td className="p-2">
                                            <div className="font-bold">{item.name}</div>
                                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{item.address}</div>
                                        </td>
                                        <td className="p-2 font-medium">{item.salary}</td>
                                        <td className="p-2 text-center text-[10px] text-slate-500">
                                            <div>VA: {item.va}</div>
                                            <div>VR: {item.vr} | VT: {item.vt}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t flex justify-end">
                    <button 
                        onClick={handleImport}
                        disabled={isSaving || preview.filter(i => i.status === 'ready').length === 0}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>}
                        Confirmar
                    </button>
                </div>
            </div>

        </div>
      </div>
    </ProtectedPage>
  );
}