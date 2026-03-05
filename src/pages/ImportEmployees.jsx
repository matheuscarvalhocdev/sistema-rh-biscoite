import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "../api/base44Client";
import { 
  UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Users, Building2
} from "lucide-react";
import { ProtectedPage } from "../components/shared/AccessControl";
import * as XLSX from 'xlsx';

export default function ImportEmployees() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: () => base44.entities.Unit.list() });
  // 👇 AGORA ELE PUXA OS FUNCIONÁRIOS PARA NÃO DUPLICAR!
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });

  const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setIsImporting(true);
      setImportResults(null);
      
      const reader = new FileReader();

      reader.onload = async (event) => {
          try {
              const data = new Uint8Array(event.target.result);
              const workbook = XLSX.read(data, { type: 'array' });
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              
              const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", raw: false });
              
              if (rows.length < 2) {
                  alert("A planilha parece estar vazia.");
                  setIsImporting(false);
                  return;
              }

              let headerIdx = -1;
              let headers = [];
              
              for (let i = 0; i < Math.min(10, rows.length); i++) {
                  const row = rows[i];
                  if (!row || row.length === 0) continue;
                  
                  const rowStr = row.join(' ').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  
                  if (rowStr.includes('nome') || rowStr.includes('cpf') || rowStr.includes('cargo')) {
                      headerIdx = i;
                      headers = row.map(cell => String(cell).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim());
                      break;
                  }
              }

              if (headerIdx === -1) {
                  alert("⚠️ Não encontrei os cabeçalhos. A planilha precisa ter colunas como 'Nome', 'CPF' ou 'Cargo'.");
                  setIsImporting(false);
                  return;
              }

              const nameIdx = headers.findIndex(h => h.includes('nome') || h.includes('funcionario') || h.includes('colaborador'));
              const cpfIdx = headers.findIndex(h => h.includes('cpf'));
              const pisIdx = headers.findIndex(h => h.includes('nis') || h.includes('pis')); 
              const roleIdx = headers.findIndex(h => h.includes('cargo') || h.includes('funcao'));
              const salaryIdx = headers.findIndex(h => h.includes('salario') || h.includes('remuneracao') || h.includes('liquido'));
              const vaIdx = headers.findIndex(h => h === 'va' || h.includes('alimentacao') || h.includes('va ')); 
              const vrIdx = headers.findIndex(h => h === 'vr' || h.includes('refeicao') || h.includes('vr ')); 
              const vtIdx = headers.findIndex(h => h === 'vt' || h.includes('transporte') || h.includes('vt ')); 
              const unitIdx = headers.findIndex(h => h.includes('loja') || h.includes('unidade') || h.includes('centro') || h.includes('cod') || h.includes('id'));
              const statusIdx = headers.findIndex(h => h.includes('situacao') || h.includes('status') || h.includes('estado'));

              let createdCount = 0;
              let updatedCount = 0;
              let errorCount = 0;

              const parseMoney = (val) => {
                  if (val === null || val === undefined || val === '') return 0;
                  if (typeof val === 'number') return parseFloat(val) || 0;
                  let str = String(val).trim();
                  str = str.replace(/R\$/gi, '').replace(/\s/g, '');
                  if (str.includes(',') && str.includes('.')) {
                      if (str.indexOf('.') < str.indexOf(',')) {
                          str = str.replace(/\./g, ''); 
                          str = str.replace(',', '.'); 
                      } else {
                          str = str.replace(/,/g, ''); 
                      }
                  } else if (str.includes(',')) {
                      str = str.replace(',', '.'); 
                  }
                  return parseFloat(str) || 0;
              };

              const formatCPF = (val) => {
                  if (!val) return "";
                  let str = String(val).replace(/\D/g, ''); 
                  if (str.length === 0) return "";
                  str = str.padStart(11, '0'); 
                  return str.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"); 
              };

              for (let i = headerIdx + 1; i < rows.length; i++) {
                  const row = rows[i];
                  if (!row || row.length === 0) continue;

                  const rawName = nameIdx !== -1 ? String(row[nameIdx]).trim() : "";
                  const rawCpf = cpfIdx !== -1 ? formatCPF(row[cpfIdx]) : "";
                  
                  if (rawName) {
                      const rawPis = pisIdx !== -1 ? String(row[pisIdx]).replace(/\D/g, '') : ""; 
                      const rawVa = vaIdx !== -1 ? parseMoney(row[vaIdx]) : 0;
                      const rawVr = vrIdx !== -1 ? parseMoney(row[vrIdx]) : 0;
                      const rawVt = vtIdx !== -1 ? parseMoney(row[vtIdx]) : 0;
                      const rawSalary = salaryIdx !== -1 ? parseMoney(row[salaryIdx]) : 0;
                      
                      const rawRole = roleIdx !== -1 ? String(row[roleIdx]).trim() : "Não Informado";
                      const rawUnit = unitIdx !== -1 ? String(row[unitIdx]).trim() : "";
                      const rawStatus = statusIdx !== -1 ? String(row[statusIdx]).toLowerCase() : "ativo";

                      let assignedUnit = null;
                      if (rawUnit) {
                          assignedUnit = units.find(u => String(u.accountingId).trim() === rawUnit);
                          if (!assignedUnit) {
                              assignedUnit = units.find(u => u.name.toLowerCase().includes(rawUnit.toLowerCase()));
                          }
                      }

                      let finalStatus = 'Ativo';
                      if (rawStatus.includes('desligado') || rawStatus.includes('inativo')) finalStatus = 'Desligado';
                      if (rawStatus.includes('afastamento') || rawStatus.includes('afastado')) finalStatus = 'Afastamento';
                      if (rawStatus.includes('abandono')) finalStatus = 'Abandono';

                      const payload = {
                          name: rawName,
                          cpf: rawCpf,
                          pis: rawPis,
                          role: rawRole,
                          salary: rawSalary,
                          va: rawVa,
                          vr: rawVr,
                          vt: rawVt,
                          status: finalStatus,
                          unit: assignedUnit ? { id: assignedUnit.id, name: assignedUnit.name } : null
                      };

                      // 👇 LÓGICA ANTI-DUPLICAÇÃO (Verifica se o CPF já existe no banco)
                      const existingEmployee = employees.find(e => e.cpf === rawCpf && rawCpf !== "");

                      if (existingEmployee) {
                          // Se já existe, atualiza os dados da pessoa!
                          await base44.entities.Employee.update(existingEmployee.id, payload);
                          updatedCount++;
                      } else {
                          // Se não existe, cria um novo!
                          await base44.entities.Employee.create(payload);
                          createdCount++;
                      }
                  } else {
                      errorCount++;
                  }
              }

              setImportResults({ created: createdCount, updated: updatedCount, error: errorCount });
              queryClient.invalidateQueries(['employees']);
              
          } catch (error) {
              console.error(error);
              alert("Erro ao ler o arquivo. Certifique-se de que é um Excel (.xlsx) ou CSV válido.");
          } finally {
              setIsImporting(false);
              if(fileInputRef.current) fileInputRef.current.value = ""; 
          }
      };

      reader.readAsArrayBuffer(file); 
  };

  return (
    <ProtectedPage>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
        
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Importar Colaboradores</h1>
          <p className="text-slate-500">Suba planilhas do Excel (.xlsx) ou CSV para atualizar a base de funcionários em massa.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 text-center">
            
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <UploadCloud className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2">Selecione ou arraste sua planilha</h3>
            <p className="text-slate-500 text-sm mb-8 max-w-lg mx-auto leading-relaxed">
                O sistema atualizará salários e informações automaticamente usando o <strong>CPF</strong> para não duplicar registros.
            </p>

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
                className="inline-flex items-center justify-center gap-2 bg-[#059669] hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-sm transition-all disabled:opacity-70 text-lg"
            >
                {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                {isImporting ? "Processando Planilha..." : "Escolher Arquivo"}
            </button>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Formato .XLSX</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Formato .CSV</span>
            </div>
        </div>

        {importResults && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in slide-in-from-bottom-4">
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" /> Relatório de Importação
                </h4>
                
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-4">
                        <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><CheckCircle2 className="w-6 h-6"/></div>
                        <div>
                            <p className="text-sm font-bold text-emerald-800">Novos Criados</p>
                            <p className="text-2xl font-black text-emerald-600">{importResults.created}</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><UploadCloud className="w-6 h-6"/></div>
                        <div>
                            <p className="text-sm font-bold text-blue-800">Atualizados</p>
                            <p className="text-2xl font-black text-blue-600">{importResults.updated}</p>
                        </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center gap-4">
                        <div className="bg-orange-100 text-orange-600 p-2 rounded-lg"><AlertCircle className="w-6 h-6"/></div>
                        <div>
                            <p className="text-sm font-bold text-orange-800">Ignorados</p>
                            <p className="text-2xl font-black text-orange-600">{importResults.error}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 p-4 bg-slate-50 rounded-lg text-sm text-slate-600 flex items-start gap-2">
                    <Building2 className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                    <p>
                        Os salários foram formatados perfeitamente. Verifique a aba de Funcionários e a aba de Custos para conferir os resultados!
                    </p>
                </div>
            </div>
        )}

      </div>
    </ProtectedPage>
  );
}