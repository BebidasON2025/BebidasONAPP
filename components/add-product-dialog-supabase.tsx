"use client"

import { type ReactNode, useState, useMemo, useEffect } from "react"
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
import ImageUpload from "./image-upload"

export default function AddProductDialogSupabase({
  children,
  onSaved,
}: {
  children: ReactNode
  onSaved?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    category: "",
    unit: "UN",
    price: 0,
    purchasePrice: 0, // Added purchase price field
    stock: 0,
    image: "",
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  const loadCategories = async () => {
    try {
      setLoadingCategories(true)
      const res = await fetch("/api/categorias")
      const data = await res.json()

      if (res.ok && data.ok && Array.isArray(data.data)) {
        setCategories(data.data.map((cat: any) => cat.nome))
      } else {
        // Fallback to default categories if API fails
        setCategories([
          "Cervejas",
          "Refrigerantes",
          "Energéticos",
          "Sucos",
          "Águas",
          "Gelos",
          "Diversos",
          "Destilados",
          "Vinhos",
          "Salgadinhos",
          "Doces",
          "Cigarros",
        ])
      }
    } catch (error) {
      // Fallback to default categories on error
      setCategories([
        "Cervejas",
        "Refrigerantes",
        "Energéticos",
        "Sucos",
        "Águas",
        "Gelos",
        "Diversos",
        "Destilados",
        "Vinhos",
        "Salgadinhos",
        "Doces",
        "Cigarros",
      ])
    } finally {
      setLoadingCategories(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadCategories()
    }
  }, [open])

  const profit = useMemo(() => {
    if (!form.price || !form.purchasePrice) return 0
    return form.price - form.purchasePrice
  }, [form.price, form.purchasePrice])

  const profitMargin = useMemo(() => {
    if (!form.price || !form.purchasePrice) return 0
    return Math.round(((form.price - form.purchasePrice) / form.price) * 100)
  }, [form.price, form.purchasePrice])

  function reset() {
    setForm({
      name: "",
      category: "",
      unit: "UN",
      price: 0,
      purchasePrice: 0, // Reset purchase price
      stock: 0,
      image: "",
    })
    setErr(null)
  }

  async function submit() {
    if (!form.name) return
    try {
      setSaving(true)
      setErr(null)
      const res = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category || null,
          price: Number(form.price || 0),
          purchasePrice: Number(form.purchasePrice || 0), // Include purchase price in API call
          stock: Number(form.stock || 0),
          lowStockThreshold: 10,
          image: form.image || null,
        }),
      })
      const text = await res.text()
      const json = (() => {
        try {
          return JSON.parse(text)
        } catch {
          return null
        }
      })()
      if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status} - ${text}`)
      setOpen(false)
      reset()
      onSaved?.()
    } catch (e: any) {
      setErr(String(e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (setOpen(v), v || reset())}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl bg-slate-900/95 backdrop-blur-sm border-slate-700/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Novo Produto</DialogTitle>
          <DialogDescription className="text-slate-400">Cadastre um novo produto no sistema.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {err ? (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {err}
            </div>
          ) : null}

          <div className="grid gap-3">
            <div className="text-sm font-medium text-slate-300">Foto do Produto</div>
            <ImageUpload
              value={form.image}
              onChange={(value) => setForm({ ...form, image: value })}
              placeholder="Clique para selecionar uma foto do produto"
            />
          </div>

          <div className="grid gap-4">
            <div className="text-sm font-medium text-slate-300">Informações Básicas</div>

            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label className="text-slate-300">Nome do Produto</Label>
                <Input
                  className="bg-slate-800/50 border-slate-600/50 text-slate-100 focus:border-amber-500/50"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Coca-Cola 2L"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-slate-300">Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-slate-100 focus:border-amber-500/50">
                    <SelectValue
                      placeholder={loadingCategories ? "Carregando categorias..." : "Selecione uma categoria"}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-slate-100 focus:bg-slate-700">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-slate-300">Unidade</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-slate-100 focus:border-amber-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="UN" className="text-slate-100">
                      UN
                    </SelectItem>
                    <SelectItem value="CX" className="text-slate-100">
                      CX
                    </SelectItem>
                    <SelectItem value="L" className="text-slate-100">
                      L
                    </SelectItem>
                    <SelectItem value="ML" className="text-slate-100">
                      mL
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3">
                <div className="text-sm font-medium text-slate-300">Preços</div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label className="text-slate-300">Preço de Compra (R$)</Label>
                    <Input
                      className="bg-slate-800/50 border-slate-600/50 text-slate-100 focus:border-amber-500/50"
                      type="number"
                      step="0.01"
                      value={form.purchasePrice}
                      onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })}
                      placeholder="0,00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-slate-300">Preço de Venda (R$)</Label>
                    <Input
                      className="bg-slate-800/50 border-slate-600/50 text-slate-100 focus:border-amber-500/50"
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      placeholder="0,00"
                    />
                  </div>
                </div>

                {(form.price > 0 || form.purchasePrice > 0) && (
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-300">Lucro por unidade:</span>
                      <span className="text-lg font-semibold text-green-400">R$ {profit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-slate-400">Margem de lucro:</span>
                      <span className="text-sm font-medium text-green-300">{profitMargin}%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label className="text-slate-300">Estoque</Label>
                <Input
                  className="bg-slate-800/50 border-slate-600/50 text-slate-100 focus:border-amber-500/50"
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="text-xs text-slate-400 bg-slate-800/30 p-3 rounded-lg border border-slate-600/30">
              💡 O alerta de estoque baixo será ativado automaticamente quando o produto atingir 10 unidades ou menos.
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-slate-300 hover:text-slate-100 hover:bg-slate-700/50"
            >
              Cancelar
            </Button>
            <Button
              onClick={submit}
              disabled={saving || !form.name}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-medium shadow-lg"
            >
              {saving ? "Salvando..." : "Salvar Produto"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
