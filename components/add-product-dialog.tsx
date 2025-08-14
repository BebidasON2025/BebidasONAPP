"use client"

import { type ReactNode, useMemo, useState } from "react"
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

export default function AddProductDialog({ children }: { children: ReactNode }) {
  const addProduct = useAppStore((s) => s.addProduct)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    category: "",
    brand: "",
    unit: "UN",
    price: 0,
    costPrice: 0,
    stock: 0,
    lowStockThreshold: 2,
    barcode: "",
    sku: "",
    expiresAt: "",
    notes: "",
  })

  const margin = useMemo(() => {
    if (!form.price) return 0
    const diff = form.price - (form.costPrice || 0)
    return Math.max(0, Math.round((diff / form.price) * 100))
  }, [form.price, form.costPrice])

  function reset() {
    setForm({
      name: "",
      category: "",
      brand: "",
      unit: "UN",
      price: 0,
      costPrice: 0,
      stock: 0,
      lowStockThreshold: 2,
      barcode: "",
      sku: "",
      expiresAt: "",
      notes: "",
    })
  }

  function submit() {
    if (!form.name) return
    addProduct({
      name: form.name,
      category: form.category || undefined,
      brand: form.brand || null,
      unit: form.unit || null,
      price: Number(form.price || 0),
      costPrice: form.costPrice || null,
      stock: Number(form.stock || 0),
      lowStockThreshold: Number(form.lowStockThreshold || 0),
      barcode: form.barcode || undefined,
      sku: form.sku || null,
      expiresAt: form.expiresAt || null,
      notes: form.notes || null,
    })
    setOpen(false)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl hc-panel">
        <DialogHeader>
          <DialogTitle>Novo Produto</DialogTitle>
          <DialogDescription>Cadastre um novo produto no estoque.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-3">
            <div className="text-sm font-medium text-slate-300">Informações básicas</div>
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
                <Label>Categoria</Label>
                <Input
                  className="hc-field"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div className="grid gap-1">
                <Label>Marca</Label>
                <Input
                  className="hc-field"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </div>
              <div className="grid gap-1">
                <Label>Unidade</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger className="hc-field">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UN">UN</SelectItem>
                    <SelectItem value="CX">CX</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="ML">mL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="text-sm font-medium text-slate-300">Preços e estoque</div>
            <div className="grid md:grid-cols-4 gap-3">
              <div className="grid gap-1">
                <Label>Preço venda</Label>
                <Input
                  className="hc-field"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-1">
                <Label>Preço custo</Label>
                <Input
                  className="hc-field"
                  type="number"
                  step="0.01"
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-1">
                <Label>Estoque</Label>
                <Input
                  className="hc-field"
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-1">
                <Label>Alerta</Label>
                <Input
                  className="hc-field"
                  type="number"
                  value={form.lowStockThreshold}
                  onChange={(e) => setForm({ ...form, lowStockThreshold: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="text-xs hc-muted">Margem estimada: {margin}%</div>
          </div>

          <div className="grid gap-3">
            <div className="text-sm font-medium text-slate-300">Identificadores</div>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="grid gap-1">
                <Label>Código de Barras</Label>
                <Input
                  className="hc-field"
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                />
              </div>
              <div className="grid gap-1">
                <Label>SKU</Label>
                <Input
                  className="hc-field"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
              <div className="grid gap-1">
                <Label>Validade</Label>
                <Input
                  className="hc-field"
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-1">
            <Label>Observações</Label>
            <Textarea
              className="hc-field"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Informações adicionais visíveis apenas no sistema."
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
