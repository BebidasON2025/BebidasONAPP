"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import StopClickPropagation from "./dialog-stop-propagation"
import ImageUpload from "./image-upload"

type Product = {
  id?: string
  nome?: string
  preco?: number
  preco_compra?: number
  estoque?: number
  imagem?: string
  categoria?: string
}

type Props = {
  product?: Product
  onSaved?: (row: any) => void
  asIconButton?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

const categories = [
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
]

export default function EditProductDialogSupabase({
  product,
  onSaved,
  asIconButton = false,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  children,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = isControlled ? externalOnOpenChange! : setInternalOpen

  const [form, setForm] = useState<Product>({
    id: product?.id,
    nome: product?.nome || "",
    preco: Number(product?.preco ?? 0),
    preco_compra: Number(product?.preco_compra ?? 0),
    estoque: Number(product?.estoque ?? 0),
    imagem: product?.imagem || "",
    categoria: product?.categoria || "",
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const profit = useMemo(() => {
    if (!form.preco || !form.preco_compra) return 0
    return form.preco - form.preco_compra
  }, [form.preco, form.preco_compra])

  const profitMargin = useMemo(() => {
    if (!form.preco || !form.preco_compra) return 0
    return Math.round(((form.preco - form.preco_compra) / form.preco) * 100)
  }, [form.preco, form.preco_compra])

  useEffect(() => {
    if (product) {
      setForm({
        id: product.id,
        nome: product.nome || "",
        preco: Number(product.preco ?? 0),
        preco_compra: Number(product.preco_compra ?? 0),
        estoque: Number(product.estoque ?? 0),
        imagem: product.imagem || "",
        categoria: product.categoria || "",
      })
    }
  }, [product])

  async function save() {
    try {
      setSaving(true)
      setErr(null)

      const method = product?.id ? "PATCH" : "POST"
      const body = product?.id
        ? {
            id: product.id,
            patch: {
              nome: form.nome,
              preco: form.preco,
              preco_compra: Number(form.preco_compra || 0),
              estoque: form.estoque,
              categoria: form.categoria,
              imagem: form.imagem,
            },
          }
        : {
            nome: form.nome,
            preco: form.preco,
            preco_compra: Number(form.preco_compra || 0),
            estoque: form.estoque,
            categoria: form.categoria,
            imagem: form.imagem,
          }

      console.log("[v0] Saving product with data:", body)
      console.log("[v0] Form preco_compra value:", form.preco_compra)

      const res = await fetch("/api/produtos", {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      console.log("[v0] API response:", data)

      if (!res.ok || !data.ok) throw new Error(data.error || "Falha ao salvar")

      onSaved?.(data.data)
      setOpen(false)
    } catch (e: any) {
      console.log("[v0] Save error:", e)
      setErr(String(e.message || e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <StopClickPropagation>
            <Button variant="secondary" size="sm">
              {asIconButton ? "✏️" : "Editar"}
            </Button>
          </StopClickPropagation>
        </DialogTrigger>
      )}
      {children}
      <DialogContent
        onClick={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => {
          e.preventDefault()
        }}
        className="max-w-md max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700 text-white"
      >
        <DialogHeader className="border-b border-gray-700 pb-4">
          <DialogTitle className="text-xl font-semibold text-white">
            {product?.id ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        {err ? (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
            <div className="text-sm text-red-400">{err}</div>
          </div>
        ) : null}

        <div className="grid gap-4 py-4">
          <ImageUpload
            value={form.imagem || ""}
            onChange={(value) => setForm((f) => ({ ...f, imagem: value }))}
            label="Foto do Produto"
            placeholder="Selecione uma foto"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Nome do Produto</label>
            <Input
              placeholder="Digite o nome do produto"
              value={form.nome || ""}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Categoria</label>
            <Select
              value={form.categoria || ""}
              onValueChange={(value) => setForm((f) => ({ ...f, categoria: value }))}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="text-white hover:bg-gray-700">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Preços</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-gray-400">Preço de Compra (R$)</label>
                <Input
                  placeholder="0,00"
                  type="number"
                  step="0.01"
                  value={String(form.preco_compra ?? 0)}
                  onChange={(e) => setForm((f) => ({ ...f, preco_compra: Number(e.target.value || 0) }))}
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400">Preço de Venda (R$)</label>
                <Input
                  placeholder="0,00"
                  type="number"
                  step="0.01"
                  value={String(form.preco ?? 0)}
                  onChange={(e) => setForm((f) => ({ ...f, preco: Number(e.target.value || 0) }))}
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            {(form.preco > 0 || form.preco_compra > 0) && (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Lucro por unidade:</span>
                  <span className="text-lg font-semibold text-green-400">R$ {profit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-400">Margem de lucro:</span>
                  <span className="text-sm font-medium text-green-300">{profitMargin}%</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Estoque</label>
            <Input
              placeholder="0"
              type="number"
              value={String(form.estoque ?? 0)}
              onChange={(e) => setForm((f) => ({ ...f, estoque: Number(e.target.value || 0) }))}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-gray-700 pt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6"
          >
            {saving ? "Salvando..." : "Salvar Produto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
