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

export default function AddFinanceEntryDialog({ children }: { children: ReactNode }) {
  const addEntry = useAppStore((s) => s.addFinanceEntry)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    type: "entrada",
    description: "",
    category: "Vendas",
    amount: 0,
    method: "Dinheiro",
    reference: "",
    notes: "",
  })

  function submit() {
    if (!form.description) return
    addEntry({
      type: form.type as "entrada" | "saida",
      description: form.description,
      category: form.category,
      amount: Number(form.amount || 0),
      method: form.method,
      reference: form.reference || null,
      notes: form.notes || null,
    })
    setOpen(false)
    setForm({
      type: "entrada",
      description: "",
      category: "Vendas",
      amount: 0,
      method: "Dinheiro",
      reference: "",
      notes: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl hc-panel">
        <DialogHeader>
          <DialogTitle>Novo Lançamento</DialogTitle>
          <DialogDescription>Adicione uma entrada ou saída financeira.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="hc-field">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Método</Label>
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                <SelectTrigger className="hc-field">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Cartão">Cartão</SelectItem>
                  <SelectItem value="Fiado">Fiado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1">
            <Label>Descrição</Label>
            <Input
              className="hc-field"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label>Categoria</Label>
              <Input
                className="hc-field"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div className="grid gap-1">
              <Label>Valor</Label>
              <Input
                className="hc-field"
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-1">
              <Label>Referência</Label>
              <Input
                className="hc-field"
                placeholder="Ex: Pedido ord_xxx, NF-0001"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
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

          <div className="flex justify-end gap-2 pt-1">
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
