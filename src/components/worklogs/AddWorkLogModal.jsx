import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Textarea } from "../ui/textarea"
import { Plus } from 'lucide-react'

export default function AddWorkLogModal({ onSave, employees = [], units = [] }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: '',
    unitId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    type: 'REGULAR', // REGULAR, OVERTIME, ABSENCE
    description: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
    setOpen(false)
    setFormData({
      employeeId: '',
      unitId: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      type: 'REGULAR',
      description: ''
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Registrar Ponto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Registro</DialogTitle>
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

          <div className="space-y-2">
            <Label>Unidade</Label>
            <Select 
              value={formData.unitId} 
              onValueChange={(val) => setFormData({...formData, unitId: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {units.map(u => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input 
                type="date" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                required 
              />
            </div>
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
                  <SelectItem value="REGULAR">Normal</SelectItem>
                  <SelectItem value="OVERTIME">Extra</SelectItem>
                  <SelectItem value="ABSENCE">Falta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entrada</Label>
              <Input 
                type="time" 
                value={formData.startTime}
                onChange={e => setFormData({...formData, startTime: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Saída</Label>
              <Input 
                type="time" 
                value={formData.endTime}
                onChange={e => setFormData({...formData, endTime: e.target.value})}
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observação</Label>
            <Textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <Button type="submit" className="w-full">Salvar Registro</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}