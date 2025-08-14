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
import { Textarea } from "@/components/ui/textarea"
import { useAppStore } from "@/lib/store"
import { formatBRL } from "@/lib/format"
import MicButton from "./mic-button"
import { Minus, Plus, Trash2 } from "lucide-react"

type Line = { productId: string; qty: number }

export default function AddFiadoDialog({ children }: { children: ReactNode }) {
  const add = useAppStore((s) => s.addFiadoReceipt)
  const customers = useAppStore((s) => s.customers)
  const products = useAppStore((s) => s.products)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    clientId: "",
    clientName: "",
    phone: "",
    email: "",
    clientAddress: "",
    dueDate: "",
    notes: "",
  })
  // Barra de itens
  const [query, setQuery] = useState("")
  const [lines, setLines] = useState<Line[]>([])

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products.slice(0, 8)
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category?.toLowerCase() ?? "").includes(q) ||
          (p.barcode?.toLowerCase() ?? "").includes(q),
      )
      .slice(0, 12)
  }, [products, query])

  const subtotal = useMemo(() => {
    return lines.reduce((s, l) => {
      const p = products.find((x) => x.id === l.productId)
      return s + (p ? p.price * l.qty : 0)
    }, 0)
  }, [lines, products])

  function reset() {
    setForm({
      clientId: "",
      clientName: "",
      phone: "",
      email: "",
      clientAddress: "",
      dueDate: "",
      notes: "",
    })
    setQuery("")
    setLines([])
  }

  function addLine(productId: string) {
    setLines((prev) => {
      const ix = prev.findIndex((l) => l.productId === productId)
      if (ix >= 0) {
        const next = prev.slice()
        next[ix] = { ...next[ix], qty: next[ix].qty + 1 }
        return next
      }
      return [...prev, { productId, qty: 1 }]
    })
  }
  function inc(productId: string) {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, qty: l.qty + 1 } : l)))
  }
  function dec(productId: string) {
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, qty: Math.max(1, l.qty - 1) } : l)).filter((l) => l.qty > 0),
    )
  }
  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.productId !== productId))
  }

  function submit() {
    const name = customers.find((c) => c.id === form.clientId)?.name || form.clientName.trim()
    if (!name) return
    if (lines.length === 0) return
    const items = lines
      .map((l) => {
        const p = products.find((x) => x.id === l.productId)
        if (!p) return null
        return { description: p.name, qty: l.qty, price: p.price }
      })
      .filter(Boolean) as { description: string; qty: number; price: number }[]
    const total = items.reduce((s, i) => s + i.price * i.qty, 0)

    add({
      clientName: name,
      phone: form.phone || customers.find((c) => c.id === form.clientId)?.phone || undefined,
      email: form.email || customers.find((c) => c.id === form.clientId)?.email || undefined,
      clientAddress: form.clientAddress || undefined,
      items,
      total,
      dueDate: form.dueDate || undefined,
      method: "Fiado",
    })
    setOpen(false)
    reset()
  }

  const hasProducts = products.length > 0

  return (
    <Dialog open={open} onOpenChange={(v) => (setOpen(v), v || reset())}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl hc-panel">
        <DialogHeader>
          <DialogTitle>Novo Comprovante Fiado</DialogTitle>
          <DialogDescription>
            Adicione itens (com voz para busca) e gere o comprovante com status pendente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          {/* Dados do cliente */}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Cliente (existente)</Label>
              <div className="flex gap-2">
                <select
                  className="hc-field w-full rounded-md px-3 py-2 text-sm"
                  value={form.clientId}
                  onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value, clientName: "" }))}
                >
                  <option value="">{"— Selecionar —"}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-1">
              <Label>Ou digite o nome</Label>
              <div className="flex items-center gap-2">
                <Input
                  className="hc-field"
                  placeholder="Nome completo"
                  value={form.clientName}
                  onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value, clientId: "" }))}
                />
                <MicButton
                  onResult={(t) => setForm((f) => ({ ...f, clientName: t, clientId: "" }))}
                  title="Ditado do nome"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label>Telefone</Label>
              <div className="flex items-center gap-2">
                <Input
                  className="hc-field"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
                <MicButton onResult={(t) => setForm((f) => ({ ...f, phone: t }))} title="Ditado telefone" />
              </div>
            </div>
            <div className="grid gap-1">
              <Label>Email</Label>
              <div className="flex items-center gap-2">
                <Input
                  className="hc-field"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
                <MicButton onResult={(t) => setForm((f) => ({ ...f, email: t }))} title="Ditado email" />
              </div>
            </div>
            <div className="grid gap-1">
              <Label>Vencimento</Label>
              <Input
                className="hc-field"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-1">
            <Label>Endereço</Label>
            <div className="flex items-center gap-2">
              <Input
                className="hc-field"
                value={form.clientAddress}
                onChange={(e) => setForm((f) => ({ ...f, clientAddress: e.target.value }))}
                placeholder="Rua, número, bairro, cidade"
              />
              <MicButton onResult={(t) => setForm((f) => ({ ...f, clientAddress: t }))} title="Ditado endereço" />
            </div>
          </div>

          {/* Barra de itens com voz */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-300">Itens</div>
              {!hasProducts ? (
                <div className="text-xs text-red-300">
                  Nenhum produto carregado. Vá em Estoque e carregue do banco/seed.
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  className="hc-field pr-10"
                  placeholder="Buscar produto por nome, categoria ou código de barras..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <div className="absolute right-1 top-1">
                  <MicButton onResult={(t) => setQuery(t)} title="Falar para buscar produto" />
                </div>
              </div>
            </div>
            {/* Sugestões */}
            {query || filteredProducts.length ? (
              <div className="rounded-md border hc-divider bg-[#1f242c] max-h-40 overflow-auto">
                {filteredProducts.length === 0 ? (
                  <div className="px-3 py-2 text-sm hc-muted">Nenhum produto encontrado.</div>
                ) : (
                  filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addLine(p.id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-black/20 flex items-center justify-between"
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="opacity-80">{formatBRL(p.price)}</span>
                    </button>
                  ))
                )}
              </div>
            ) : null}

            {/* Linhas adicionadas */}
            <div className="rounded-md border hc-divider">
              {lines.length === 0 ? (
                <div className="px-3 py-2 text-sm hc-muted">Nenhum item adicionado.</div>
              ) : (
                <div className="divide-y hc-divider">
                  {lines.map((l) => {
                    const p = products.find((x) => x.id === l.productId)
                    if (!p) return null
                    const lineTotal = p.price * l.qty
                    return (
                      <div key={l.productId} className="flex items-center gap-3 px-3 py-2">
                        <div className="flex-1">
                          <div className="font-medium text-slate-100">{p.name}</div>
                          <div className="text-xs hc-muted">{p.category ?? "—"}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="ghost" onClick={() => dec(l.productId)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            className="hc-field w-16 text-center"
                            type="number"
                            min={1}
                            value={l.qty}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((x) =>
                                  x.productId === l.productId
                                    ? { ...x, qty: Math.max(1, Number(e.target.value) || 1) }
                                    : x,
                                ),
                              )
                            }
                          />
                          <Button size="icon" variant="ghost" onClick={() => inc(l.productId)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="w-28 text-right font-medium">{formatBRL(lineTotal)}</div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-400 hover:text-red-500"
                          onClick={() => removeLine(l.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-1">
            <Label>Observações</Label>
            <div className="flex items-center gap-2">
              <Textarea
                className="hc-field"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
              <MicButton onResult={(t) => setForm((f) => ({ ...f, notes: t }))} title="Ditado observações" />
            </div>
          </div>

          {/* Resumo */}
          <div className="flex items-center justify-between border-t hc-divider pt-3">
            <div className="text-sm text-slate-300">Total</div>
            <div className="text-xl font-semibold text-yellow-300">{formatBRL(subtotal)}</div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={submit}
              disabled={lines.length === 0}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              Gerar Comprovante
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
