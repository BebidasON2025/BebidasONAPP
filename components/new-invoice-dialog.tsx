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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAppStore } from "@/lib/store"

export default function NewInvoiceDialog({ children }: { children: ReactNode }) {
  const store = useAppStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ number: "", clientId: "", total: 0, status: "emitida", dueDate: "", notes: "" })

  function submit() {
    if (!form.number || !form.clientId) return
    store.addInvoice({
      number: form.number,
      clientId: form.clientId,
      total: Number(form.total || 0),
      status: form.status as any,
      dueDate: form.dueDate || null,
      notes: form.notes || null,
    })
    setOpen(false)
    setForm({ number: "", clientId: "", total: 0, status: "emitida", dueDate: "", notes: "" })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl hc-panel">
        <DialogHeader>
          <DialogTitle>Nova Nota Fiscal</DialogTitle>
          <DialogDescription>Crie uma nota fiscal simples.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="grid gap-1 md:col-span-1">
              <Label>Número</Label>
              <Input
                className="hc-field"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
              />
            </div>
            <div className="grid gap-1 md:col-span-2">
              <Label>Cliente</Label>
              <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                <SelectTrigger className="hc-field">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {store.customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label>Total</Label>
              <Input
                className="hc-field"
                type="number"
                step="0.01"
                value={form.total}
                onChange={(e) => setForm({ ...form, total: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="hc-field">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emitida">Emitida</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="paga">Paga</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Vencimento</Label>
              <Input
                className="hc-field"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
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

          <div className="flex justify-end gap-2 pt-2">
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
