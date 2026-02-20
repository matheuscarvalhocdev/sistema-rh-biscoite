import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

export default function EditEmployeeModal({ open, onOpenChange, employee, units = [], onSave }) {
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

  // Carrega os dados do funcionário quando o modal abre
  useEffect(() => {
    if (employee) {
      setFormData({
        id: employee.id, // Importante manter o ID
        name: employee.name || '',
        role: employee.role || '',
        cpf: employee.cpf || '',
        gender: employee.gender || '',
        email: employee.email || '',
        unitId: employee.unitId ? String(employee.unitId) : '',
        admissionDate: employee.admissionDate || '',
        salary: employee.salary || '',
        vr: employee.vr || '',
        vt: employee.vt || '',
        va: employee.va || '',
        status: employee.status || 'Ativo'
      })
    }
  }, [employee])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Prepara os dados numéricos
    const dataToSave = {
      ...formData,
      salary: parseFloat(formData.salary) || 0,
      vr: parseFloat(formData.vr) || 0,
      vt: parseFloat(formData.vt) || 0,
      va: parseFloat(formData.va) || 0,
    }

    onSave(dataToSave)
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Funcionário</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="py-4 space-y-6">
          
          {/* SEÇÃO 1: PESSOAL */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900 border-b pb-2">Informações Pessoais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input 
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input 
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
                  value={formData.cpf}
                  onChange={e => handleChange('cpf', e.target.value)}
                  placeholder="000.000.000-00"
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
              <Label>E-mail</Label>
              <Input 
                type="email"
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
                <Label>Unidade</Label>
                <Select value={formData.unitId} onValueChange={val => handleChange('unitId', val)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
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

          {/* SEÇÃO 3: FINANCEIRO */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900 border-b pb-2">Financeiro & Benefícios</h3>
            
            <div className="space-y-2">
              <Label>Salário Bruto (R$)</Label>
              <Input 
                type="number"
                value={formData.salary}
                onChange={e => handleChange('salary', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>VR (R$)</Label>
                <Input 
                  type="number"
                  value={formData.vr}
                  onChange={e => handleChange('vr', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>VT (R$)</Label>
                <Input 
                  type="number"
                  value={formData.vt}
                  onChange={e => handleChange('vt', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>VA (R$)</Label>
                <Input 
                  type="number"
                  value={formData.va}
                  onChange={e => handleChange('va', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Salvar Alterações</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}