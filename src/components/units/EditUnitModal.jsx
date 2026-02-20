import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

export default function EditUnitModal({ open, onOpenChange, initialData, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    manager: ''
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        address: initialData.address || '',
        city: initialData.city || '',
        manager: initialData.manager || ''
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
          <DialogTitle>Editar Unidade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome da Unidade</Label>
            <Input 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Endereço</Label>
            <Input 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Cidade/Estado</Label>
            <Input 
              value={formData.city}
              onChange={e => setFormData({...formData, city: e.target.value})}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Gerente Responsável</Label>
            <Input 
              value={formData.manager}
              onChange={e => setFormData({...formData, manager: e.target.value})}
            />
          </div>
          <Button type="submit" className="w-full">Salvar Alterações</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}