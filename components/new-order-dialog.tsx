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

export default function NewOrderDialog({ children }: { children: ReactNode }) {
  const store = useAppStore()
  const [open, setOpen] = useState(false)
  const [clientId, setClientId] = useState<string>("")
  const [method, setMethod] = useState("Dinheiro")
  const [status, setStatus] = useState("novo")
  const [discount, setDiscount] = useState(0)
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [lines, setLines] = useState<{ productId: string; qty: number }[]>([{ productId: "", qty: 1 }])

  const subtotal = useMemo(() => {
    return lines.reduce((s, l) => {
      const p = store.products.find((x) => x.id === l.productId)
      return s + (p ? p.preco * l.qty : 0)
    }, 0)
  }, [lines, store.products])

  const total = useMemo(
    () => Math.max(0, subtotal - (discount || 0) + (deliveryFee || 0)),
    [subtotal, discount, deliveryFee],
  )

  function addLine() {
    setLines((prev) => [...prev, { productId: "", qty: 1 }])
  }
  function submit() {
    if (!clientId || lines.filter((l) => l.productId).length === 0) return
    store.addOrder({
      clientId,
      items: lines
        .filter((l) => l.productId)
        .map((l) => {
          const p = store.products.find((x) => x.id === l.productId)!
          return { productId: p.id, qty: l.qty, price: p.preco }
        }),
      method,
      status,
      discount,
      deliveryFee,
      notes: notes || null,
      deliveryAddress: deliveryAddress || null,
    })
    setOpen(false)
    setClientId("")
    setMethod("Dinheiro")
    setStatus("novo")
    setLines([{ productId: "", qty: 1 }])
    setDiscount(0)
    setDeliveryFee(0)
    setDeliveryAddress("")
    setNotes("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl hc-panel">
        <DialogHeader>
          <DialogTitle>Novo Pedido</DialogTitle>
          <DialogDescription>Crie um novo pedido para um cliente.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label>Cliente</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="hc-field">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {store.customers.length === 0 ? <SelectItem value="none">{"Nenhum cliente"}</SelectItem> : null}
                  {store.customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Método</Label>
              <Select value={method} onValueChange={setMethod}>
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
            <div className="grid gap-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="hc-field">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">Itens</div>
              <Button size="sm" variant="secondary" className="bg-[#1d2430] border border-[#3f4b60]" onClick={addLine}>
                Adicionar Item
              </Button>
            </div>

            {lines.length === 0 ? <p className="text-sm text-slate-400">Nenhum item adicionado.</p> : null}
            {lines.map((l, idx) => (
              <div key={idx} className="grid grid-cols-6 gap-3">
                <div className="col-span-4">
                  <Label className="sr-only">Produto</Label>
                  <Select
                    value={l.productId}
                    onValueChange={(v) =>
                      setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, productId: v } : x)))
                    }
                  >
                    <SelectTrigger className="hc-field">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {store.products.length === 0 ? <SelectItem value="none">{"Nenhum produto"}</SelectItem> : null}
                      {store.products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="sr-only">Qtd</Label>
                  <Input
                    className="hc-field"
                    type="number"
                    min={1}
                    value={l.qty}
                    onChange={(e) =>
                      setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, qty: Number(e.target.value) } : x)))
                    }
                  />
                </div>
                <div className="flex items-center">
                  <Button variant="ghost" onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}>
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label>Desconto</Label>
              <Input
                className="hc-field"
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              />
            </div>
            <div className="grid gap-1">
              <Label>Taxa Entrega</Label>
              <Input
                className="hc-field"
                type="number"
                step="0.01"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
              />
            </div>
            <div className="grid gap-1">
              <Label>Subtotal</Label>
              <Input className="hc-field" value={formatBRL(subtotal)} readOnly />
            </div>
          </div>

          <div className="grid gap-1">
            <Label>Endereço de Entrega</Label>
            <Input
              className="hc-field"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Rua, número, bairro, cidade"
            />
          </div>

          <div className="grid gap-1">
            <Label>Observações</Label>
            <Textarea className="hc-field" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex items-center justify-between border-t hc-divider pt-3">
            <div className="text-sm text-slate-300">Total</div>
            <div className="text-xl font-semibold text-yellow-300">{formatBRL(total)}</div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} className="bg-amber-500 hover:bg-amber-600 text-black">
              Criar Pedido
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
