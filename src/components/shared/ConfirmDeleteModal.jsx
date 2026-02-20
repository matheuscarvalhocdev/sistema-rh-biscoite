import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "../ui/dialog"
import { Button } from "../ui/button"

export default function ConfirmDeleteModal({ open, onOpenChange, onConfirm, title, description }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title || "Tem certeza?"}</DialogTitle>
          <DialogDescription>
            {description || "Essa ação não pode ser desfeita. Isso excluirá permanentemente o item."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => {
            onConfirm()
            onOpenChange(false)
          }}>
            Confirmar Exclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}