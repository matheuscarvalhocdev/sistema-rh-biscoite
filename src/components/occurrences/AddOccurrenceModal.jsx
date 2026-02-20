import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { AlertTriangle } from 'lucide-react'

export default function AddOccurrenceModal({ onSave, employees = [] }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'WARNING',
    date: new Date().toISOString().split('T')[0],
    title: '',
    description: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
    setOpen(false)
    setFormData({
      employeeId: '',
      type: 'WARNING',
      date: new Date().toISOString().split('T')[0],
      title: '',
      description: ''
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Nova Ocorrência
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Ocorrência</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Funcionário</Label>
            <Select 
              value={formData.employeeId} 
              onValueChange={(val) => setFormData({...formData, employeeId: val})}
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
              placeholder="Ex: Atraso injustificado"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição Detalhada</Label>
            <Textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows={4}
            />
          </div>

          <Button type="submit" variant="destructive" className="w-full">Registrar</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}