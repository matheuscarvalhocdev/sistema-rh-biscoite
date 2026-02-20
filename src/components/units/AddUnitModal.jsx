import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

export default function AddUnitModal({ open, onOpenChange, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    manager: '',
    activeEmployees: 0 // Começa com 0 funcionários
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
    
    // Limpa o formulário
    setFormData({
      name: '',
      address: '',
      city: '',
      manager: '',
      activeEmployees: 0
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Unidade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome da Unidade</Label>
            <Input 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: Filial - Centro"
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label>Endereço</Label>
            <Input 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              placeholder="Rua, Número, Bairro"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label>Cidade/Estado</Label>
            <Input 
              value={formData.city}
              onChange={e => setFormData({...formData, city: e.target.value})}
              placeholder="Ex: São Paulo - SP"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label>Gerente Responsável</Label>
            <Input 
              value={formData.manager}
              onChange={e => setFormData({...formData, manager: e.target.value})}
              placeholder="Nome do Gerente"
              required 
            />
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full">Cadastrar Unidade</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}