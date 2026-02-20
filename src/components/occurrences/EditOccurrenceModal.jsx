import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

export default function EditOccurrenceModal({ open, onOpenChange, initialData, onSave, employees = [] }) {
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'WARNING',
    date: '',
    title: '',
    description: ''
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        employeeId: String(initialData.employeeId || ''),
        type: initialData.type || 'WARNING',
        date: initialData.date || '',
        title: initialData.title || '',
        description: initialData.description || ''
      })
    }
  }, [initialData])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...initialData, ...formData })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Ocorrência</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Funcionário</Label>
            <Select 
              value={formData.employeeId} 
              onValueChange={(val) => setFormData({...formData, employeeId: val})}
              disabled
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={String(emp.id)}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select 
                value={formData.type} 
                onValueChange={(val) => setFormData({...formData, type: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WARNING">Advertência</SelectItem>
                  <SelectItem value="SUSPENSION">Suspensão</SelectItem>
                  <SelectItem value="ERROR">Erro Operacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input 
                type="date" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Título</Label>
            <Input 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows={4}
            />
          </div>

          <Button type="submit" className="w-full">Salvar Alterações</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}