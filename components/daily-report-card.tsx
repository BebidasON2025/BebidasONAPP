"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Banknote,
  ShoppingCart,
} from "lucide-react"
import { formatBRL } from "@/lib/format"

interface DailyReport {
  date: string
  cashRegister: {
    opened: boolean
    closed: boolean
    openTime?: string
    closeTime?: string
    initialAmount: number
    finalAmount: number
    isAutomatic?: boolean
  }
  sales: {
    totalRevenue: number
    totalOrders: number
    paidOrders: number
    averageTicket: number
    topProduct?: string
  }
  summary: {
    status: "excellent" | "good" | "warning" | "poor"
    message: string
  }
}

export function DailyReportCard({ date }: { date: string }) {
  const [report, setReport] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDailyReport()
  }, [date])

  const loadDailyReport = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/relatorio-diario?date=${date}`)
      if (res.ok) {
        const data = await res.json()
        setReport(data.data)
      }
    } catch (error) {
      console.error("Error loading daily report:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "good":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "warning":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "poor":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <CheckCircle className="h-4 w-4" />
      case "good":
        return <TrendingUp className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "poor":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-3 text-slate-400">
              <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
              <span>Carregando relatório...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!report) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 shadow-xl">
        <CardContent className="p-6">
          <div className="text-center text-slate-400">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum relatório disponível para esta data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700 shadow-2xl">
      <CardHeader className="border-b border-slate-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
              <Calendar className="h-5 w-5 text-amber-400" />
            </div>
            Relatório Diário
          </CardTitle>
          <Badge className={`${getStatusColor(report.summary.status)} flex items-center gap-1`}>
            {getStatusIcon(report.summary.status)}
            {report.summary.status === "excellent" && "Excelente"}
            {report.summary.status === "good" && "Bom"}
            {report.summary.status === "warning" && "Atenção"}
            {report.summary.status === "poor" && "Ruim"}
          </Badge>
        </div>
        <p className="text-sm text-slate-400 capitalize">{formatDate(report.date)}</p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Summary Message */}
        <div
          className={`p-4 rounded-lg border ${getStatusColor(report.summary.status).replace("text-", "bg-").replace("/20", "/10").replace("/30", "/20")}`}
        >
          <p className="text-sm text-slate-200">{report.summary.message}</p>
        </div>

        {/* Cash Register Status */}
        <div className="space-y-3">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <Banknote className="h-4 w-4 text-amber-400" />
            Status do Caixa
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Abertura</span>
                <Badge
                  className={
                    report.cashRegister.opened ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }
                >
                  {report.cashRegister.opened ? "Aberto" : "Não aberto"}
                </Badge>
              </div>
              {report.cashRegister.opened && report.cashRegister.openTime && (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Horário:</span>
                    <span className="text-white">{formatTime(report.cashRegister.openTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Valor inicial:</span>
                    <span className="text-green-400">{formatBRL(report.cashRegister.initialAmount)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Fechamento</span>
                <Badge
                  className={
                    report.cashRegister.closed ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"
                  }
                >
                  {report.cashRegister.closed ? "Fechado" : "Em aberto"}
                </Badge>
              </div>
              {report.cashRegister.closed && report.cashRegister.closeTime && (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Horário:</span>
                    <span className="text-white">{formatTime(report.cashRegister.closeTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Valor final:</span>
                    <span className="text-blue-400">{formatBRL(report.cashRegister.finalAmount)}</span>
                  </div>
                  {report.cashRegister.isAutomatic && (
                    <div className="flex items-center gap-1 text-xs text-amber-400">
                      <Clock className="h-3 w-3" />
                      Fechamento automático
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Sales Summary */}
        <div className="space-y-4">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            Resumo de Vendas
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
              <DollarSign className="h-6 w-6 text-green-400 mx-auto mb-1" />
              <p className="text-xs text-green-400">Receita</p>
              <p className="text-lg font-bold text-white">{formatBRL(report.sales.totalRevenue)}</p>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
              <ShoppingCart className="h-6 w-6 text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-blue-400">Pedidos</p>
              <p className="text-lg font-bold text-white">{report.sales.totalOrders}</p>
            </div>

            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
              <CheckCircle className="h-6 w-6 text-purple-400 mx-auto mb-1" />
              <p className="text-xs text-purple-400">Pagos</p>
              <p className="text-lg font-bold text-white">{report.sales.paidOrders}</p>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
              <Package className="h-6 w-6 text-amber-400 mx-auto mb-1" />
              <p className="text-xs text-amber-400">Ticket Médio</p>
              <p className="text-lg font-bold text-white">{formatBRL(report.sales.averageTicket)}</p>
            </div>
          </div>

          {report.sales.topProduct && (
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-amber-400" />
                <span className="text-sm text-slate-400">Produto mais vendido:</span>
                <span className="text-white font-medium">{report.sales.topProduct}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
