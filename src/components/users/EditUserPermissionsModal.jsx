import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

export default function EditUserPermissionsModal({ open, onOpenChange, user, onSave }) {
  const [role, setRole] = useState('')

  useEffect(() => {
    if (user) {
      setRole(user.role || 'USER')
    }
  }, [user])

  const handleSubmit = (e) => {
    e.preventDefault()
    // Salva mantendo os dados antigos e atualizando o cargo
    onSave({ ...user, role })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Permissões</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nível de Acesso</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Usuário Padrão</SelectItem>
                <SelectItem value="MANAGER">Gerente</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit">Salvar Permissões</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}