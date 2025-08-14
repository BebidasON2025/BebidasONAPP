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
import { formatBRL } from "@/lib/format"
import MicButton from "./mic-button"
import { useAppStore } from "@/lib/store"

type Item = { productId?: string; description?: string; qty: number }

export default function AddFiadoDialogSupabase({
  children,
  onSaved,
}: {
  children: ReactNode
  onSaved?: () => void
}) {
  const store = useAppStore()
  const [open, setOpen] = useState(false)
  const [clientName, setClientName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [dueDate, setDueDate] = useState<string>("")
  const [items, setItems] = useState<Item[]>([])
  const [query, setQuery] = useState("")
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return store.products.slice(0, 10)
    return store.products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category?.toLowerCase() ?? "").includes(q) ||
          (p.barcode?.toLowerCase() ?? "").includes(q) ||
          (p.sku?.toLowerCase() ?? "").includes(q),
      )
      .slice(0, 20)
  }, [query, store.products])

  const uiItems = useMemo(() => {
    return items.map((it) => {
      if (it.productId) {
        const p = store.products.find((x) => x.id === it.productId)
        return { description: p?.name || "", price: p?.price || 0, qty: it.qty }
      }
      return { description: it.description || "", price: 0, qty: it.qty }
    })
  }, [items, store.products])

  const total = uiItems.reduce((s, i) => s + i.price * i.qty, 0)

  function addByProduct(id: string) {
    setItems((prev) => {
      const ix = prev.findIndex((l) => l.productId === id && !l.description)
      if (ix >= 0) {
        const next = prev.slice()
        next[ix] = { ...next[ix], qty: next[ix].qty + 1 }
        return next
      }
      return [...prev, { productId: id, qty: 1 }]
    })
    setQuery("")
  }
  function addCustom() {
    setItems((prev) => [...prev, { description: "", qty: 1 }])
  }
  function updateQty(idx: number, qty: number) {
    setItems((prev) => prev.map((l, i) => (i === idx ? { ...l, qty: Math.max(1, qty || 1) } : l)))
  }
  function updateDesc(idx: number, desc: string) {
    setItems((prev) => prev.map((l, i) => (i === idx ? { ...l, description: desc, productId: undefined } : l)))
  }
  function remove(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  async function submit() {
    try {
      setSaving(true)
      setErr(null)
      if (!clientName.trim()) throw new Error("Informe o nome do cliente")
      if (uiItems.length === 0) throw new Error("Adicione pelo menos 1 item")

      const payload = {
        clientName: clientName.trim(),
        phone: phone || null,
        clientAddress: address || null,
        dueDate: dueDate || null,
        items: uiItems.map((it) => ({
          description: it.description,
          qty: it.qty,
          price: it.price,
        })),
        method: "Fiado",
        paid: false,
      }

      const res = await fetch("/api/fiado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const j = await res.json().catch(() => null)
      if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`)

      setOpen(false)
      setClientName("")
      setPhone("")
      setAddress("")
      setDueDate("")
      setItems([])
      setQuery("")
      onSaved?.()
    } catch (e: any) {
      setErr(String(e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl hc-panel">
        <DialogHeader>
          <DialogTitle>Novo Comprovante Fiado</DialogTitle>
          <DialogDescription>Cria e grava o comprovante e os itens no Supabase.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {err ? (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {err}
            </div>
          ) : null}

          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Cliente</Label>
              <Input className="hc-field" value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Telefone</Label>
              <Input className="hc-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Endereço</Label>
              <Input className="hc-field" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Vencimento</Label>
              <Input className="hc-field" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Itens</Label>
              <div className="text-xs text-slate-400">{store.products.length} produtos</div>
            </div>
            <div className="relative">
              <Input
                className="hc-field pr-12 h-12 text-base"
                placeholder="Buscar produto por nome, categoria, código de barras ou SKU..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="absolute right-1 top-1">
                <MicButton onResult={(t) => setQuery(t)} title="Falar para buscar produto" />
              </div>
            </div>
            {(query || (store.products.length > 0 && suggestions.length > 0)) && (
              <div className="max-h-52 overflow-auto rounded-md border hc-divider bg-[#1f242c]">
                {suggestions.length === 0 ? (
                  <div className="px-3 py-2 text-sm hc-muted">Nenhum produto encontrado.</div>
                ) : (
                  suggestions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addByProduct(p.id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-black/20 flex items-center justify-between"
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="opacity-90">{formatBRL(p.price)}</span>
                    </button>
                  ))
                )}
              </div>
            )}
            <div>
              <Button type="button" variant="secondary" className="bg-[#1d2430]" onClick={addCustom}>
                Adicionar item manual
              </Button>
            </div>
          </div>

          <div className="rounded-md border hc-divider">
            {items.length === 0 ? (
              <div className="px-3 py-2 text-sm hc-muted">Nenhum item adicionado.</div>
            ) : (
              <div className="divide-y hc-divider">
                {items.map((it, idx) => {
                  const p = it.productId ? store.products.find((x) => x.id === it.productId) : null
                  const desc = p?.name ?? it.description ?? ""
                  const price = p?.price ?? 0
                  return (
                    <div key={idx} className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                      <div className="col-span-7">
                        {p ? (
                          <div className="font-medium">{desc}</div>
                        ) : (
                          <Input
                            className="hc-field"
                            placeholder="Descrição do item"
                            value={desc}
                            onChange={(e) => updateDesc(idx, e.target.value)}
                          />
                        )}
                      </div>
                      <div className="col-span-2 text-right">{formatBRL(price)}</div>
                      <div className="col-span-2">
                        <Input
                          className="hc-field text-center"
                          type="number"
                          min={1}
                          value={it.qty}
                          onChange={(e) => updateQty(idx, Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-1">
                        <Button variant="ghost" className="text-red-400" onClick={() => remove(idx)}>
                          Remover
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t hc-divider pt-3">
            <div className="text-sm text-slate-300">Total</div>
            <div className="text-xl font-semibold text-yellow-300">{formatBRL(total)}</div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-black">
              {saving ? "Salvando..." : "Gerar Comprovante"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
