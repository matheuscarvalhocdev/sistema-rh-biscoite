import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

export default function AddEmployeeModal({ open, onOpenChange, onSave, units = [] }) {
  // Estado com todos os campos novos
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    cpf: '',
    gender: '',
    email: '',
    unitId: '',
    admissionDate: '',
    salary: '',
    vr: '',
    vt: '',
    va: '',
    status: 'Ativo'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Converte os valores numéricos antes de salvar
    const dataToSave = {
      ...formData,
      salary: parseFloat(formData.salary) || 0,
      vr: parseFloat(formData.vr) || 0,
      vt: parseFloat(formData.vt) || 0,
      va: parseFloat(formData.va) || 0,
    }

    onSave(dataToSave)
    
    // Limpa o formulário
    setFormData({
      name: '',
      role: '',
      cpf: '',
      gender: '',
      email: '',
      unitId: '',
      admissionDate: '',
      salary: '',
      vr: '',
      vt: '',
      va: '',
      status: 'Ativo'
    })
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* max-w-2xl deixa o modal mais largo para caber tudo */}
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">Cadastro de Funcionário</DialogTitle>
          <p className="text-sm text-slate-500">Preencha os dados para adicionar um novo colaborador.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="py-4 space-y-6">
          
          {/* SEÇÃO 1: INFORMAÇÕES PESSOAIS */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900 border-b pb-2">Informações Pessoais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input 
                  placeholder="Ex: Ana Souza" 
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label>Cargo</Label>
                {/* Simulando um Select de cargos comuns ou permitindo digitação */}
                <Input 
                  placeholder="Ex: Analista de RH" 
                  value={formData.role}
                  onChange={e => handleChange('role', e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input 
                  placeholder="000.000.000-00" 
                  value={formData.cpf}
                  onChange={e => handleChange('cpf', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Gênero</Label>
                <Select value={formData.gender} onValueChange={val => handleChange('gender', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                    <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>E-mail Corporativo</Label>
              <Input 
                type="email" 
                placeholder="nome@empresa.com" 
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                required 
              />
            </div>
          </div>

          {/* SEÇÃO 2: CONTRATUAL */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900 border-b pb-2">Dados Contratuais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unidade de Lotação</Label>
                <Select value={formData.unitId} onValueChange={val => handleChange('unitId', val)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade..." />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(u => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de Admissão</Label>
                <Input 
                  type="date" 
                  value={formData.admissionDate}
                  onChange={e => handleChange('admissionDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: FINANCEIRO E BENEFÍCIOS */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900 border-b pb-2">Financeiro & Benefícios</h3>
            
            <div className="space-y-2">
              <Label>Salário Bruto (R$)</Label>
              <Input 
                type="number" 
                placeholder="Ex: 3500.00" 
                value={formData.salary}
                onChange={e => handleChange('salary', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>VR Diário (R$)</Label>
                <Input 
                  type="number" 
                  placeholder="Ex: 35.00" 
                  value={formData.vr}
                  onChange={e => handleChange('vr', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>VT Diário (R$)</Label>
                <Input 
                  type="number" 
                  placeholder="Ex: 18.00" 
                  value={formData.vt}
                  onChange={e => handleChange('vt', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>VA Mensal (R$)</Label>
                <Input 
                  type="number" 
                  placeholder="Ex: 500.00" 
                  value={formData.va}
                  onChange={e => handleChange('va', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status Inicial</Label>
              <Select value={formData.status} onValueChange={val => handleChange('status', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Férias">Férias</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800">Cadastrar Funcionário</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}