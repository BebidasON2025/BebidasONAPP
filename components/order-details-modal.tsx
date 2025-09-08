"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Package, User, Calendar, CreditCard, MapPin, Phone, Bug } from "lucide-react"

interface OrderItem {
  id: string
  produto_id: string
  produto_nome: string
  qtd: number
  preco: number
  subtotal: number
}

interface OrderDetails {
  id: string
  numero_pedido: string
  cliente_nome_texto: string
  metodo: string
  status: string
  total: number
  data: string
  endereco?: string
  telefone?: string
  observacoes?: string
  itens: OrderItem[]
}

interface OrderDetailsModalProps {
  orderId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrderDetailsModal({ orderId, open, onOpenChange }: OrderDetailsModalProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    if (open && orderId) {
      loadOrderDetails()
    }
  }, [open, orderId])

  const loadOrderDetails = async () => {
    if (!orderId) return

    try {
      setLoading(true)
      setError(null)

      console.log("[v0] Loading order details for:", orderId)

      const orderRes = await fetch(`/api/pedidos/${orderId}`)
      if (!orderRes.ok) throw new Error("Erro ao carregar pedido")
      const orderData = await orderRes.json()

      setDebugInfo(orderData)

      console.log("[v0] Order data received:", orderData)
      console.log("[v0] Raw items from API:", {
        itens: orderData.data?.itens,
        type: typeof orderData.data?.itens,
        isArray: Array.isArray(orderData.data?.itens),
        length: orderData.data?.itens?.length,
      })

      const orderItems = Array.isArray(orderData.data?.itens) ? orderData.data.itens : []
      console.log("[v0] Processed order items:", orderItems)

      if (orderItems.length === 0) {
        console.warn("[v0] WARNING: No items found in order", orderId)
        console.warn("[v0] Raw itens field:", orderData.data?.itens)
        console.warn("[v0] Full order data:", JSON.stringify(orderData.data, null, 2))
      }

      const orderDetails = {
        id: orderData.data?.id || orderData.id,
        numero_pedido: orderData.data?.numero_pedido || orderData.numero_pedido,
        cliente_nome_texto: orderData.data?.cliente_nome_texto || orderData.cliente_nome_texto || "Cliente",
        metodo: orderData.data?.metodo || orderData.metodo,
        status: orderData.data?.status || orderData.status,
        total: Number(orderData.data?.total || orderData.total || 0),
        data: orderData.data?.data || orderData.data || orderData.criado_em,
        endereco: orderData.data?.endereco || orderData.endereco,
        telefone: orderData.data?.telefone || orderData.telefone,
        observacoes: orderData.data?.observacoes || orderData.observacoes,
        itens: orderItems.map((item: any, index: number) => ({
          id: item.id || `item-${index}`,
          produto_id: item.produto_id,
          produto_nome: item.nome || "Produto",
          qtd: Number(item.qtd || 1),
          preco: Number(item.preco || 0),
          subtotal: Number(item.subtotal || item.qtd * item.preco || 0),
        })),
      }

      console.log("[v0] Final order details:", {
        id: orderDetails.id,
        numero_pedido: orderDetails.numero_pedido,
        itemsCount: orderDetails.itens.length,
        items: orderDetails.itens,
      })
      setOrderDetails(orderDetails)
    } catch (err: any) {
      console.error("[v0] Error loading order details:", err)
      setError(err.message || "Erro ao carregar detalhes do pedido")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "pendente":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "cancelado":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  const formatBRL = (value: number) => {
    if (isNaN(value) || value === null || value === undefined) {
      return "R$ 0,00"
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDateTime = (value: string) => {
    return new Date(value).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-400" />
            Detalhes do Pedido
            <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)} className="ml-auto text-xs">
              <Bug className="h-4 w-4" />
              Debug
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
              <span>Carregando detalhes...</span>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : orderDetails ? (
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6">
              {showDebug && debugInfo && (
                <div className="p-4 rounded-lg bg-slate-800/50 border border-yellow-500/30">
                  <h3 className="font-semibold text-yellow-400 mb-2">Debug Info</h3>
                  <pre className="text-xs text-slate-300 overflow-auto max-h-40">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div>
                  <p className="text-sm text-slate-400">Número do Pedido</p>
                  <p className="font-semibold text-amber-400">{orderDetails.numero_pedido}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <Badge className={`${getStatusColor(orderDetails.status)} capitalize`}>{orderDetails.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Data do Pedido</p>
                  <p className="text-white flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDateTime(orderDetails.data)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Método de Pagamento</p>
                  <p className="text-white flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    {orderDetails.metodo}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-400" />
                  Informações do Cliente
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <p className="text-sm text-slate-400">Nome</p>
                    <p className="text-white">{orderDetails.cliente_nome_texto || "Cliente"}</p>
                  </div>
                  {orderDetails.telefone && (
                    <div>
                      <p className="text-sm text-slate-400">Telefone</p>
                      <p className="text-white flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {orderDetails.telefone}
                      </p>
                    </div>
                  )}
                  {orderDetails.endereco && (
                    <div>
                      <p className="text-sm text-slate-400">Endereço</p>
                      <p className="text-white flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {orderDetails.endereco}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-400" />
                  Itens do Pedido ({orderDetails.itens.length})
                </h3>

                {orderDetails.itens.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-slate-400 mb-2">Nenhum item encontrado para este pedido</p>
                    <p className="text-xs text-red-400">⚠️ Verifique o console do navegador para logs de debug</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orderDetails.itens.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-600"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-white">{item.produto_nome}</p>
                          <p className="text-sm text-slate-400">
                            {item.qtd}x {formatBRL(item.preco)} cada
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-400">{formatBRL(item.subtotal)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Total do Pedido</h3>
                  <p className="text-2xl font-bold text-green-400">{formatBRL(orderDetails.total)}</p>
                </div>
              </div>

              {orderDetails.observacoes && (
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <h3 className="font-semibold text-white mb-2">Observações</h3>
                  <p className="text-slate-300">{orderDetails.observacoes}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : null}

        <div className="flex justify-end pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
