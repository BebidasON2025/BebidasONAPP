"use client"

import { type ReactNode, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAppStore } from "@/lib/store"

export default function AddSupplierDialog({ children }: { children: ReactNode }) {
  const add = useAppStore((s) => s.addSupplier)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "", cnpj: "", address: "", contact: "", notes: "" })

  function submit() {
    if (!form.name) return
    add({
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      cnpj: form.cnpj || undefined,
      address: form.address || null,
      contact: form.contact || null,
      notes: form.notes || null,
    })
    setOpen(false)
    setForm({ name: "", email: "", phone: "", cnpj: "", address: "", contact: "", notes: "" })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl hc-panel">
        <DialogHeader>
          <DialogTitle>Novo Fornecedor</DialogTitle>
          <DialogDescription>Cadastre um novo fornecedor.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Nome</Label>
              <Input
                className="hc-field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-1">
              <Label>CNPJ</Label>
              <Input
                className="hc-field"
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Email</Label>
              <Input
                className="hc-field"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="grid gap-1">
              <Label>Telefone</Label>
              <Input
                className="hc-field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Endereço</Label>
              <Input
                className="hc-field"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="grid gap-1">
              <Label>Contato</Label>
              <Input
                className="hc-field"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-1">
            <Label>Observações</Label>
            <Textarea
              className="hc-field"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} className="bg-amber-500 hover:bg-amber-600 text-black">
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
