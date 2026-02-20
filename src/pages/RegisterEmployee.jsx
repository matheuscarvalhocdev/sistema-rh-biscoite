
import { useState, useEffect } from "react";
import { base44 } from "../api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { ProtectedPage } from "../components/shared/AccessControl";

const formatCPF = (value) => {
  if (!value) return value;
  const cpf = value.replace(/[^\d]/g, '');
  if (cpf.length <= 3) return cpf;
  if (cpf.length <= 6) return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
  if (cpf.length <= 9) return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
};

const availableRoles = [
  "Gerente",
  "Supervisor",
  "Coordenador",
  "Analista",
  "Assistente",
  "Auxiliar",
  "Operador de Produção",
  "Vendedor",
  "Atendente",
  "Caixa",
  "Estoquista",
  "Motorista",
  "Técnico",
  "Encarregado",
  "Líder de Equipe",
  "Administrativo",
  "Recepcionista",
  "Zelador",
  "Segurança",
  "Outro"
];

function RegisterEmployeeContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    unitId: '',
    cpf: '',
    email: '',
    gender: 'Feminino',
    admissionDate: '',
    dismissalDate: '',
    vrValue: '',
    vtValue: '',
    vaValue: '',
    salary: '',
    status: 'Ativo',
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list(),
  });

  const { data: allEmployees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  useEffect(() => {
    if (units.length > 0 && !formData.unitId) {
      setFormData(prev => ({ ...prev, unitId: units[0].id }));
    }
  }, [units]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const employee = await base44.entities.Employee.create(data);
      await base44.entities.PositionHistory.create({
        employeeId: employee.id,
        role: data.role,
        salary: data.salary,
        startDate: data.admissionDate,
        endDate: null,
      });
      return employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setSuccess(true);
      setTimeout(() => {
        navigate(createPageUrl("Employees"));
      }, 1500);
    },
    onError: () => {
      setError('Erro ao cadastrar funcionário. Tente novamente.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.role || !formData.unitId || !formData.cpf || 
        !formData.email || !formData.admissionDate || !formData.vrValue || 
        !formData.vtValue || !formData.vaValue || !formData.salary) {
      setError('Todos os campos são obrigatórios (exceto Data de Demissão).');
      return;
    }

    const cpfExists = allEmployees.some(emp => emp.cpf === formData.cpf);
    if (cpfExists) {
      setError('❌ Este CPF já está cadastrado no sistema!');
      return;
    }

    if (formData.status === 'Inativo' && !formData.dismissalDate) {
      setError('Data de demissão é obrigatória para funcionários inativos.');
      return;
    }

    const selectedUnit = units.find(u => u.id === formData.unitId);
    if (!selectedUnit) {
      setError('Unidade inválida.');
      return;
    }

    const data = {
      ...formData,
      department: selectedUnit.type,
      vrValue: parseFloat(formData.vrValue),
      vtValue: parseFloat(formData.vtValue),
      vaValue: parseFloat(formData.vaValue),
      salary: parseFloat(formData.salary),
      dismissalDate: formData.status === 'Inativo' ? formData.dismissalDate : undefined,
    };

    createMutation.mutate(data);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (success) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Funcionário cadastrado com sucesso!</h2>
          <p className="text-slate-600">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Cadastro de Funcionário</h1>
        <p className="text-slate-600">Preencha os dados para adicionar um novo colaborador</p>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b bg-slate-50">
          <CardTitle>Informações do Funcionário</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => handleChange('name', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="role">Cargo</Label>
                <Select value={formData.role} onValueChange={v => handleChange('role', v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input 
                  id="cpf" 
                  value={formData.cpf} 
                  onChange={e => handleChange('cpf', formatCPF(e.target.value))}
                  maxLength={14}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gender">Gênero</Label>
                <Select value={formData.gender} onValueChange={v => handleChange('gender', v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email"
                value={formData.email} 
                onChange={e => handleChange('email', e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="unit">Unidade</Label>
                <Select value={formData.unitId} onValueChange={v => handleChange('unitId', v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="admissionDate">Data de Admissão</Label>
                <Input 
                  id="admissionDate" 
                  type="date"
                  value={formData.admissionDate} 
                  onChange={e => handleChange('admissionDate', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="salary">Salário Bruto (R$)</Label>
              <Input 
                id="salary" 
                type="number"
                step="0.01"
                value={formData.salary} 
                onChange={e => handleChange('salary', e.target.value)}
                placeholder="Ex: 3500.00"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="vrValue">Valor Diário VR (R$)</Label>
                <Input 
                  id="vrValue" 
                  type="number"
                  step="0.01"
                  value={formData.vrValue} 
                  onChange={e => handleChange('vrValue', e.target.value)}
                  placeholder="Ex: 34.65"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="vtValue">Valor Diário VT (R$)</Label>
                <Input 
                  id="vtValue" 
                  type="number"
                  step="0.01"
                  value={formData.vtValue} 
                  onChange={e => handleChange('vtValue', e.target.value)}
                  placeholder="Ex: 17.80"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="vaValue">Valor Diário VA (R$)</Label>
                <Input 
                  id="vaValue" 
                  type="number"
                  step="0.01"
                  value={formData.vaValue} 
                  onChange={e => handleChange('vaValue', e.target.value)}
                  placeholder="Ex: 25.00"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={v => handleChange('status', v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.status === 'Inativo' && (
              <div>
                <Label htmlFor="dismissalDate">Data de Demissão</Label>
                <Input 
                  id="dismissalDate" 
                  type="date"
                  value={formData.dismissalDate} 
                  onChange={e => handleChange('dismissalDate', e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(createPageUrl("Employees"))}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  'Cadastrar Funcionário'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterEmployee() {
  return (
    <ProtectedPage pageName="RegisterEmployee">
      <RegisterEmployeeContent />
    </ProtectedPage>
  );
}
