"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBRL } from "@/lib/format"
import ReceiptDialog from "@/components/receipt-dialog"
import { Button } from "@/components/ui/button"
import { RefreshCw, CreditCard, Clock, CheckCircle, AlertTriangle } from "lucide-react"

type FiadoRow = {
  id: string
  clientName: string
  phone?: string | null
  total: number
  date: string
  paid?: boolean
}

type PagoRow = {
  id: string
  total: number
  status?: string
  data?: string
  criado_em?: string | null
}

export default function ComprovantesFiadoPage() {
  const [pendentes, setPendentes] = useState<FiadoRow[]>([])
  const [pagos, setPagos] = useState<PagoRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dialog de comprovante
  const [open, setOpen] = useState(false)
  const [base, setBase] = useState<{
    id: string
    clientName: string
    date: string
    total: number
    paid?: boolean
    phone?: string | null
  } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pendResult, pagoResult] = await Promise.allSettled([
        fetch("/api/fiado", { cache: "no-store" }),
        fetch("/api/pedidos?status=pago", { cache: "no-store" }),
      ])

      let pendentesData: FiadoRow[] = []
      let pagosData: PagoRow[] = []

      if (pendResult.status === "fulfilled") {
        const jPend = await pendResult.value.json()
        if (jPend?.ok) {
          pendentesData = (jPend.data || []) as FiadoRow[]
        } else {
          console.warn("Erro ao carregar pendentes:", jPend?.error)
        }
      }

      if (pagoResult.status === "fulfilled") {
        const jPago = await pagoResult.value.json()
        if (jPago?.ok) {
          pagosData = (jPago.data || []) as PagoRow[]
        } else {
          console.warn("Erro ao carregar pagos:", jPago?.error)
        }
      }

      setPendentes(pendentesData)
      setPagos(pagosData)
    } catch (e: any) {
      setError(String(e?.message || e))
      setPendentes([])
      setPagos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const kpis = useMemo(() => {
    const qtdPend = pendentes.length
    const qtdPago = pagos.length
    const totalPend = pendentes.reduce((a, r) => a + Number(r.total ?? 0), 0)
    const totalPago = pagos.reduce((a, r) => a + Number(r.total ?? 0), 0)
    return { qtdPend, qtdPago, totalPend, totalPago }
  }, [pendentes, pagos])

  function openReceipt(row: FiadoRow) {
    setBase({
      id: row.id,
      clientName: row.clientName || "—",
      date: row.date,
      total: Number(row.total ?? 0),
      paid: false,
      phone: row.phone ?? null,
    })
    setOpen(true)
  }

  return (
    <main className="p-6 space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Comprovantes Fiado</h1>
          <p className="text-slate-400 mt-1">Gerencie pagamentos a prazo com controle total</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 transition-all duration-200 flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 hover:border-amber-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-400">Pendentes</p>
                <p className="text-2xl font-bold text-white">{kpis.qtdPend}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:border-green-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-400">Pagos</p>
                <p className="text-2xl font-bold text-white">{kpis.qtdPago}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20 hover:border-red-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-400">Total Pendentes</p>
                <p className="text-2xl font-bold text-white">{formatBRL(kpis.totalPend)}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-400">Total Pagos</p>
                <p className="text-2xl font-bold text-white">{formatBRL(kpis.totalPago)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/50 border-slate-800 shadow-2xl">
        <CardHeader className="pb-4 border-b border-slate-800">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            Pendentes
            <span className="ml-auto text-sm font-normal text-slate-400">{pendentes.length} comprovantes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="m-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-400"></div>
                {error}
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6 text-slate-300 font-medium">Cliente</th>
                  <th className="py-4 px-6 text-slate-300 font-medium">Telefone</th>
                  <th className="py-4 px-6 text-slate-300 font-medium">Total</th>
                  <th className="py-4 px-6 text-slate-300 font-medium">Vencimento</th>
                  <th className="py-4 px-6 text-slate-300 font-medium">Data</th>
                  <th className="py-4 px-6 text-slate-300 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex items-center justify-center gap-3 text-slate-400">
                        <RefreshCw className="h-5 w-5 animate-spin text-amber-400" />
                        <span>Carregando...</span>
                      </div>
                    </td>
                  </tr>
                ) : pendentes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Nenhum comprovante pendente.
                    </td>
                  </tr>
                ) : (
                  pendentes.map((r, index) => (
                    <tr
                      key={r.id}
                      className="border-b border-slate-800 hover:bg-slate-800/20 transition-colors duration-200 cursor-pointer"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => openReceipt(r)}
                    >
                      <td className="py-4 px-6">
                        <span className="font-medium text-white hover:text-amber-400 transition-colors duration-200">
                          {r.clientName || "—"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-300">{r.phone || "—"}</td>
                      <td className="py-4 px-6 font-semibold text-amber-400">{formatBRL(Number(r.total ?? 0))}</td>
                      <td className="py-4 px-6 text-slate-400">—</td>
                      <td className="py-4 px-6 text-slate-400">{r.date ? new Date(r.date).toLocaleString() : "—"}</td>
                      <td className="py-4 px-6 text-slate-400">—</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal do comprovante com itens do pedido */}
      <ReceiptDialog open={open} onOpenChange={setOpen} base={base} />
    </main>
  )
}
