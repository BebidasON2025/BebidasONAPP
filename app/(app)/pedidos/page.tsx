"use client"

import PageHeader from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import SearchInput from "@/components/search-input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useMemo, useState, useCallback } from "react"
import { OrderStatusBadge } from "@/components/status-badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EllipsisVertical, RefreshCw, Loader2, ShoppingCart, TrendingUp, Clock, CheckCircle } from "lucide-react"
import ConfirmationDialog from "@/components/confirmation-dialog"
import NewOrderDialog from "@/components/two-step-order-dialog"
import { OrderDetailsModal } from "@/components/order-details-modal"

type ApiPedido = {
  id: string
  numero_pedido?: string | null // Added friendly order number field
  cliente_id?: string | null
  cliente_nome_texto?: string | null // Added free text client name field
  metodo?: string | null
  status?: string | null
  total?: number | string | null
  data?: string | null
  criado_em?: string | null
  updated_at?: string | null
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [q, setQ] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; orderId: string }>({ open: false, orderId: "" })
  const [orderDetailsModal, setOrderDetailsModal] = useState<{ open: boolean; orderId: string | null }>({
    open: false,
    orderId: null,
  })

  const mapRow = useCallback((r: ApiPedido) => {
    const date = r.data || r.criado_em || r.updated_at || new Date().toISOString()
    return {
      id: String(r.id),
      numero: r.numero_pedido || r.id, // Use friendly number or fallback to ID
      clientId: r.cliente_id || "",
      clienteNomeTexto: r.cliente_nome_texto || "", // Added free text client name mapping
      method: (r.metodo || "—") as string,
      status: (r.status || "novo") as "pago" | "pendente" | "cancelado" | "novo",
      total: Number(r.total || 0),
      date: date as string,
    }
  }, [])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setErr(null)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const [ordersRes, customersRes] = await Promise.allSettled([
        fetch("/api/pedidos", { cache: "no-store", signal: controller.signal }),
        fetch("/api/clientes", { cache: "no-store", signal: controller.signal }),
      ])

      clearTimeout(timeoutId)

      if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
        const ordersData = await ordersRes.value.json()
        if (ordersData?.ok && Array.isArray(ordersData.data)) {
          const mappedOrders = ordersData.data.map(mapRow)
          setOrders(mappedOrders)
        } else {
          setOrders([])
        }
      } else {
        console.warn("Orders API failed, using empty array")
        setOrders([])
      }

      if (customersRes.status === "fulfilled" && customersRes.value.ok) {
        const customersData = await customersRes.value.json()
        if (customersData?.ok && Array.isArray(customersData.data)) {
          setCustomers(customersData.data)
        } else {
          setCustomers([])
        }
      } else {
        console.warn("Customers API failed, using empty array")
        setCustomers([])
      }
    } catch (e: any) {
      console.warn("Load failed:", e)
      setOrders([])
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [mapRow])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const ordersArray = Array.isArray(orders) ? orders : []
    if (!q.trim()) return ordersArray
    const query = q.toLowerCase().trim()
    return ordersArray.filter(
      (o) =>
        o.id.toLowerCase().includes(query) ||
        (o.numero || "").toLowerCase().includes(query) || // Added search by friendly number
        o.status.toLowerCase().includes(query) ||
        o.method.toLowerCase().includes(query) ||
        (customers.find((c) => c.id === o.clientId)?.name?.toLowerCase() ?? "").includes(query) ||
        (o.clienteNomeTexto?.toLowerCase() ?? "").includes(query), // Added search by free text client name
    )
  }, [orders, customers, q])

  const analytics = useMemo(() => {
    const ordersArray = Array.isArray(orders) ? orders : []
    const totalOrders = ordersArray.length
    const totalRevenue = ordersArray.reduce((sum, order) => sum + order.total, 0)
    const pendingOrders = ordersArray.filter((o) => o.status === "pendente").length
    const completedOrders = ordersArray.filter((o) => o.status === "pago").length

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
    }
  }, [orders])

  const updateStatus = useCallback(
    async (id: string, status: "pago" | "pendente" | "cancelado") => {
      try {
        setBusy(id + status)
        setErr(null)
        const res = await fetch("/api/pedidos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        })
        const j = await res.json()
        if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`)
        await load()
      } catch (e: any) {
        setErr(String(e?.message || e))
      } finally {
        setBusy(null)
      }
    },
    [load],
  )

  const removeOrder = useCallback(
    async (id: string) => {
      try {
        setBusy(id + "del")
        setErr(null)
        const res = await fetch("/api/pedidos", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        })
        const j = await res.json()
        if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`)
        await load()
        setConfirmDelete({ open: false, orderId: "" })
      } catch (e: any) {
        setErr(String(e?.message || e))
      } finally {
        setBusy(null)
      }
    },
    [load],
  )

  const handleDeleteClick = (id: string) => {
    setConfirmDelete({ open: true, orderId: id })
  }

  const handleOrderClick = (orderId: string) => {
    setOrderDetailsModal({ open: true, orderId })
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <PageHeader
        title="Histórico de Pedidos"
        description="Gerencie todos os pedidos com controle avançado de status"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={load}
              disabled={loading}
              className="bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-all duration-200 flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <NewOrderDialog onSaved={load}>
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Novo Pedido
              </Button>
            </NewOrderDialog>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-400">Total de Pedidos</p>
                <p className="text-2xl font-bold text-white">{analytics.totalOrders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:border-green-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-400">Receita Total</p>
                <p className="text-2xl font-bold text-white">{formatBRL(analytics.totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 hover:border-amber-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-400">Pendentes</p>
                <p className="text-2xl font-bold text-white">{analytics.pendingOrders}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-400">Concluídos</p>
                <p className="text-2xl font-bold text-white">{analytics.completedOrders}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/50 border-slate-800 shadow-2xl">
        <CardHeader className="pb-4 border-b border-slate-800">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-amber-400" />
            Lista de Pedidos
            <span className="ml-auto text-sm font-normal text-slate-400">{filtered.length} pedidos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Buscar por número, cliente, status ou método..."
              className="bg-slate-800/50 border-slate-700 focus:border-amber-500"
            />
          </div>

          {err ? (
            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-400"></div>
                {err}
              </div>
            </div>
          ) : null}

          <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-900/30">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-slate-800/30">
                  <TableHead className="text-slate-300 font-medium">Número</TableHead>
                  <TableHead className="text-slate-300 font-medium">Cliente</TableHead>
                  <TableHead className="text-slate-300 font-medium">Status</TableHead>
                  <TableHead className="text-slate-300 font-medium">Método</TableHead>
                  <TableHead className="text-right text-slate-300 font-medium">Total</TableHead>
                  <TableHead className="text-slate-300 font-medium">Data</TableHead>
                  <TableHead className="w-10 text-slate-300 font-medium">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex items-center justify-center gap-3 text-slate-400">
                        <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                        <span>Carregando pedidos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                      {q.trim() ? "Nenhum pedido encontrado para a busca." : "Nenhum pedido encontrado."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((o, index) => {
                    const client = customers.find((c) => c.id === o.clientId)
                    const isActionBusy = busy?.startsWith(o.id)
                    const clientName = client?.name || o.clienteNomeTexto || "—"
                    return (
                      <TableRow
                        key={o.id}
                        className={`border-slate-800 hover:bg-slate-800/20 transition-colors duration-200 cursor-pointer ${isActionBusy ? "opacity-50" : ""}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => handleOrderClick(o.id)}
                      >
                        <TableCell className="font-semibold text-amber-400 text-sm">
                          {o.numero || o.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-white font-medium">{clientName}</TableCell>
                        <TableCell>
                          <OrderStatusBadge status={o.status} />
                        </TableCell>
                        <TableCell className="text-slate-300">{o.method}</TableCell>
                        <TableCell className="text-right font-semibold text-green-400">{formatBRL(o.total)}</TableCell>
                        <TableCell className="text-slate-400 text-sm">{formatDateTime(o.date)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={busy !== null}
                                className="hover:bg-slate-700/50 transition-colors duration-200"
                              >
                                {isActionBusy ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                                ) : (
                                  <EllipsisVertical className="h-4 w-4 text-slate-400" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-700">
                              <DropdownMenuItem
                                onClick={() => updateStatus(o.id, "pago")}
                                disabled={busy !== null}
                                className="text-green-400 hover:bg-green-500/10"
                              >
                                Marcar como Pago
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateStatus(o.id, "pendente")}
                                disabled={busy !== null}
                                className="text-amber-400 hover:bg-amber-500/10"
                              >
                                Marcar como Pendente
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateStatus(o.id, "cancelado")}
                                disabled={busy !== null}
                                className="text-orange-400 hover:bg-orange-500/10"
                              >
                                Cancelar Pedido
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-400 hover:bg-red-500/10"
                                onClick={() => handleDeleteClick(o.id)}
                                disabled={busy !== null}
                              >
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete({ open, orderId: "" })}
        title="Excluir Pedido"
        description="Tem certeza que deseja excluir este pedido definitivamente? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={() => removeOrder(confirmDelete.orderId)}
        loading={busy === confirmDelete.orderId + "del"}
      />

      <OrderDetailsModal
        orderId={orderDetailsModal.orderId}
        open={orderDetailsModal.open}
        onOpenChange={(open) => setOrderDetailsModal({ open, orderId: null })}
      />
    </div>
  )
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}
