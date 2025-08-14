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
import { formatBRL } from "@/lib/format"
import MicButton from "@/components/mic-button"

type Line = { productId: string; qty: number }

export default function NewOrderDialogSupabase({
  children,
  onSaved,
}: {
  children: ReactNode
  onSaved?: () => void
}) {
  const store = useAppStore()
  const [open, setOpen] = useState(false)
  const [clientId, setClientId] = useState<string>("")
  const [clientName, setClientName] = useState<string>("") // campo texto livre
  const [method, setMethod] = useState("Dinheiro")
  const [discount, setDiscount] = useState(0)
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [lines, setLines] = useState<Line[]>([])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  // Status derivado: Fiado => pendente, outros => pago
  const derivedStatus = useMemo(() => (method.toLowerCase() === "fiado" ? "pendente" : "pago"), [method])

  const loadCustomers = async () => {
    if (store.customers && store.customers.length > 0) return // Already loaded

    try {
      setLoadingCustomers(true)
      const response = await fetch("/api/clientes")
      const data = await response.json()

      if (response.ok && data.ok) {
        // Update store with customers
        store.customers = data.data || []
      }
    } catch (error) {
      console.error("Error loading customers:", error)
    } finally {
      setLoadingCustomers(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      loadCustomers()
    } else {
      reset()
    }
  }

  const [query, setQuery] = useState("")
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    const products = Array.isArray(store.products) ? store.products : []
    if (!q) return products.slice(0, 10)
    return products
      .filter(
        (p) =>
          (p.nome?.toLowerCase() ?? "").includes(q) ||
          (p.categoria?.toLowerCase() ?? "").includes(q) ||
          (p.codigo_barras?.toLowerCase() ?? "").includes(q) ||
          (p.sku?.toLowerCase() ?? "").includes(q),
      )
      .slice(0, 20)
  }, [query, store.products])

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
    setQuery("")
  }
  function inc(productId: string) {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, qty: l.qty + 1 } : l)))
  }
  function dec(productId: string) {
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, qty: Math.max(0, l.qty - 1) } : l)).filter((l) => l.qty > 0),
    )
  }
  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.productId !== productId))
  }

  const subtotal = useMemo(() => {
    const products = Array.isArray(store.products) ? store.products : []
    return lines.reduce((s, l) => {
      const p = products.find((x) => x.id === l.productId)
      return s + (p ? p.preco * l.qty : 0)
    }, 0)
  }, [lines, store.products])
  const total = useMemo(
    () => Math.max(0, subtotal - (discount || 0) + (deliveryFee || 0)),
    [subtotal, discount, deliveryFee],
  )

  function reset() {
    setClientId("")
    setClientName("")
    setMethod("Dinheiro")
    setLines([])
    setDiscount(0)
    setDeliveryFee(0)
    setDeliveryAddress("")
    setNotes("")
    setErr(null)
    setQuery("")
  }

  async function submit() {
    try {
      setSaving(true)
      setErr(null)
      if (lines.filter((l) => l.productId).length === 0) throw new Error("Adicione pelo menos 1 item")

      // Normaliza itens com chaves esperadas pela API
      const payloadItems = lines.map((l) => {
        const products = Array.isArray(store.products) ? store.products : []
        const p = products.find((x) => x.id === l.productId)!
        return { produto_id: p.id, qtd: l.qty, preco: p.preco }
      })

      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: clientId || null, // Use registered client ID if selected
          cliente_nome_texto: clientName || null, // Use free text client name if provided
          metodo: method,
          status: derivedStatus,
          items: payloadItems,
          desconto: discount,
          taxa_entrega: deliveryFee,
          observacoes: notes || null,
          endereco: deliveryAddress || null,
        }),
      })
      const j = await res.json().catch(() => null)
      if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`)

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="w-[95vw] max-w-4xl max-h-[80vh] bg-[#151a23] text-slate-100 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Novo Pedido</DialogTitle>
          <DialogDescription className="text-slate-400">
            Cria o pedido diretamente no Supabase (somente tabela pedidos).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {err ? (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {err}
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Cliente Cadastrado</Label>
              <Select
                value={clientId}
                onValueChange={(value) => {
                  setClientId(value)
                  if (value) setClientName("") // Clear free text when selecting registered client
                }}
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder={loadingCustomers ? "Carregando clientes..." : "Selecione um cliente"} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                  {loadingCustomers ? (
                    <SelectItem value="loading" disabled className="text-slate-400">
                      Carregando clientes...
                    </SelectItem>
                  ) : !Array.isArray(store.customers) || store.customers.length === 0 ? (
                    <SelectItem value="none" disabled className="text-slate-400">
                      Nenhum cliente cadastrado
                    </SelectItem>
                  ) : (
                    store.customers.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-white hover:bg-slate-700">
                        <div>
                          <div className="font-medium">{c.nome || c.name}</div>
                          {(c.telefone || c.phone) && (
                            <div className="text-xs text-slate-400">{c.telefone || c.phone}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Nome do Cliente (texto)</Label>
              <Input
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500"
                placeholder="Cliente não cadastrado"
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value)
                  if (e.target.value) setClientId("") // Clear registered client when typing free text
                }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Método de Pagamento</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white focus:border-green-500 focus:ring-green-500">
                  <SelectValue placeholder="Selecione método" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="Dinheiro" className="text-white hover:bg-slate-700">
                    💵 Dinheiro
                  </SelectItem>
                  <SelectItem value="PIX" className="text-white hover:bg-slate-700">
                    📱 PIX
                  </SelectItem>
                  <SelectItem value="Cartão" className="text-white hover:bg-slate-700">
                    💳 Cartão
                  </SelectItem>
                  <SelectItem value="Fiado" className="text-white hover:bg-slate-700">
                    📝 Fiado
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Status</Label>
              <div
                className={`px-3 py-2 rounded-md text-sm font-medium border ${
                  derivedStatus === "pago"
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                }`}
              >
                {derivedStatus === "pago" ? "✅ PAGO" : "⏳ PENDENTE"}
              </div>
            </div>
          </div>

          {/* Busca com voz e preço */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold text-white">Produtos</Label>
              <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-400">
                {Array.isArray(store.products) ? store.products.length : 0} produtos disponíveis
              </div>
            </div>

            <div className="relative">
              <Input
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 pr-12 h-12 text-base"
                placeholder="🔍 Buscar produto por nome, categoria, código de barras ou SKU..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="absolute right-2 top-2">
                <MicButton onResult={(t) => setQuery(t)} title="🎤 Falar para buscar produto" />
              </div>
            </div>

            {(query || suggestions.length > 0) && (
              <div className="max-h-64 overflow-auto rounded-lg border border-slate-700 bg-slate-800/30 backdrop-blur-sm">
                {suggestions.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-400 text-center">
                    🔍 Nenhum produto encontrado para "{query}"
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700">
                    {suggestions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addLine(p.id)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-700/50 transition-colors duration-200 flex items-center justify-between group"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                            {p.nome}
                          </div>
                          <div className="text-xs text-slate-400">{p.categoria || "Sem categoria"}</div>
                        </div>
                        <div className="text-sm sm:text-lg font-bold text-green-400 shrink-0">{formatBRL(p.preco)}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-md border border-slate-700 bg-slate-800/20">
            {lines.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-400">
                <div className="text-2xl mb-2">🛒</div>
                <div>Nenhum item adicionado</div>
                <div className="text-xs mt-1">Busque e adicione produtos acima</div>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {lines.map((l) => {
                  const products = Array.isArray(store.products) ? store.products : []
                  const p = products.find((x) => x.id === l.productId)
                  if (!p) return null
                  const lineTotal = p.preco * l.qty
                  return (
                    <div key={l.productId} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-100 mb-1">{p.nome}</div>
                          <div className="text-xs text-slate-400 mb-2">{p.categoria ?? "—"}</div>
                          <div className="text-sm text-slate-300">{formatBRL(p.preco)} cada</div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLine(l.productId)}
                            className="text-red-400 px-2 h-6"
                          >
                            ×
                          </Button>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="px-2 h-8 w-8"
                              onClick={() => dec(l.productId)}
                            >
                              −
                            </Button>
                            <div className="w-12 text-center text-sm font-medium text-white">{l.qty}</div>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="px-2 h-8 w-8"
                              onClick={() => inc(l.productId)}
                            >
                              +
                            </Button>
                          </div>

                          <div className="text-sm font-bold text-green-400">{formatBRL(lineTotal)}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label className="text-slate-300">Desconto</Label>
              <Input
                className="bg-slate-800/50 border-slate-700 text-white"
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-slate-300">Taxa Entrega</Label>
              <Input
                className="bg-slate-800/50 border-slate-700 text-white"
                type="number"
                step="0.01"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-slate-300">Subtotal</Label>
              <Input className="bg-slate-800/50 border-slate-700 text-white" value={formatBRL(subtotal)} readOnly />
            </div>
          </div>

          <div className="grid gap-1">
            <Label className="text-slate-300">Endereço de Entrega</Label>
            <Input
              className="bg-slate-800/50 border-slate-700 text-white"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Rua, número, bairro, cidade"
            />
          </div>

          <div className="grid gap-1">
            <Label className="text-slate-300">Observações</Label>
            <Textarea
              className="bg-slate-800/50 border-slate-700 text-white"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-slate-300">Total</div>
            <div className="text-xl font-semibold text-yellow-300">{formatBRL(total)}</div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} className="order-2 sm:order-1">
              Cancelar
            </Button>
            <Button
              onClick={submit}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-black order-1 sm:order-2"
            >
              {saving ? "Salvando..." : "Criar Pedido"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
